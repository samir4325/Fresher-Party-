import { RTDB_URL } from '../firebase';
import { StudentRegistration, DashboardStats, QRVerificationResult } from '../types';
import { INITIAL_STUDENTS } from '../data/seedData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LOCAL_STORAGE_KEY = 'fresher_party_students_v3';
const DEMO_IDS = new Set(['FP-2k26-4812', 'FP-2k26-5931', 'FP-2k26-6124', 'FP-2k26-7289', 'FP-2k26-8390']);

// Auto-cleanup legacy local storage data on client load
try {
  ['fresher_party_students_v1', 'fresher_party_students_v2', 'fresher_party_students', 'fresher_party_my_pass', 'fresher_party_last_pass'].forEach((key) => {
    localStorage.removeItem(key);
  });
} catch {}

function getLocalStudents(): StudentRegistration[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((s) => !DEMO_IDS.has(s.id));
      }
    }
  } catch (e) {
    console.warn('Could not read from localStorage', e);
  }
  return [];
}

function saveLocalStudents(students: StudentRegistration[]) {
  try {
    const cleanList = students.filter((s) => !DEMO_IDS.has(s.id));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanList));
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
}

// Background sync to Firebase Realtime Database
async function syncToFirebase(studentId: string, data: Partial<StudentRegistration>, method: 'PUT' | 'PATCH' | 'DELETE' = 'PUT') {
  try {
    const url = `${RTDB_URL}/students/${studentId}.json`;
    if (method === 'DELETE') {
      await fetch(url, { method: 'DELETE' });
    } else {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
  } catch (err) {
    console.warn('Firebase RTDB background sync warning:', err);
  }
}

export const StudentService = {
  // Fetch all students from Firebase Realtime Database
  async getStudents(filters?: {
    department?: string;
    semester?: string;
    status?: string;
    search?: string;
    verified?: string;
    feeStatus?: string;
  }): Promise<StudentRegistration[]> {
    let list: StudentRegistration[] = [];

    try {
      const res = await fetch(`${RTDB_URL}/students.json`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          list = (Object.values(data) as StudentRegistration[]).filter(
            (s) => s && s.id && !DEMO_IDS.has(s.id)
          );
          saveLocalStudents(list);
        } else {
          // Database is empty (all cleared or empty)
          list = [];
          saveLocalStudents([]);
        }
      } else {
        list = getLocalStudents();
      }
    } catch {
      list = getLocalStudents();
    }

    if (filters?.department && filters.department !== 'All') {
      list = list.filter((s) => s.department === filters.department);
    }
    if (filters?.semester && filters.semester !== 'All') {
      list = list.filter((s) => s.semester === filters.semester);
    }
    if (filters?.status && filters.status !== 'All') {
      list = list.filter((s) => s.status === filters.status);
    }
    if (filters?.feeStatus && filters.feeStatus !== 'All') {
      list = list.filter((s) => (s.feeStatus || 'pending') === filters.feeStatus);
    }
    if (filters?.verified && filters.verified !== 'All') {
      const isV = filters.verified === 'true';
      list = list.filter((s) => s.isEntryVerified === isV);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.enrollmentNumber.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.mobileNumber.includes(q)
      );
    }

    return list;
  },

  // Get a single student by ID or Enrollment Number (Live Cloud Master with Cache Cleanup)
  async getStudent(identifier: string): Promise<StudentRegistration | null> {
    const clean = identifier.trim();
    if (!clean) return null;
    const qLower = clean.toLowerCase();

    // 1. Check directly with Firebase Realtime Database first for real-time truth
    try {
      const allRes = await fetch(`${RTDB_URL}/students.json`, { cache: 'no-store' });
      if (allRes.ok) {
        const allData = await allRes.json();
        if (allData && typeof allData === 'object') {
          const allList = (Object.values(allData) as StudentRegistration[]).filter(
            (s) => s && s.id && !DEMO_IDS.has(s.id)
          );
          saveLocalStudents(allList);
          const found = allList.find(
            (s) =>
              s.id.toLowerCase() === qLower ||
              s.enrollmentNumber.toLowerCase() === qLower
          );
          if (found) return found;
          // If not in Firebase live list, it was deleted on another device!
          return null;
        } else {
          // Database is completely empty, clear local storage
          saveLocalStudents([]);
          return null;
        }
      }
    } catch (err) {
      console.warn('Firebase live lookup offline fallback:', err);
    }

    // 2. Offline fallback to local cache only if network failed
    const local = getLocalStudents();
    const localFound = local.find(
      (s) =>
        s.id.toLowerCase() === qLower ||
        s.enrollmentNumber.toLowerCase() === qLower
    );
    return localFound || null;
  },

  // Register a new student (Real-time cloud write + local cache)
  async registerStudent(
    data: Omit<StudentRegistration, 'id' | 'status' | 'registeredAt' | 'isEntryVerified' | 'verifiedAt'>
  ): Promise<StudentRegistration> {
    const cleanEnrollment = data.enrollmentNumber.trim().toUpperCase();

    // 1. Check for duplicates in live Firebase DB
    try {
      const res = await fetch(`${RTDB_URL}/students.json`, { cache: 'no-store' });
      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData && typeof cloudData === 'object') {
          const liveList = Object.values(cloudData) as StudentRegistration[];
          const existing = liveList.find(
            (s) => s && s.enrollmentNumber && s.enrollmentNumber.toUpperCase() === cleanEnrollment
          );
          if (existing) {
            throw new Error(
              `Enrollment number "${cleanEnrollment}" is already registered (Pass ID: ${existing.id})`
            );
          }
        }
      }
    } catch (e: any) {
      if (e?.message?.includes('already registered')) throw e;
    }

    // 2. Generate unique pass ID
    const newId = `FP-2k26-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent: StudentRegistration = {
      ...data,
      id: newId,
      enrollmentNumber: cleanEnrollment,
      status: 'approved',
      feeStatus: data.feeStatus || 'pending',
      registeredAt: new Date().toISOString(),
      isEntryVerified: false,
      verifiedAt: null,
      notes: '',
    };

    // 3. Write directly to Firebase Realtime Database
    try {
      await fetch(`${RTDB_URL}/students/${newId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
    } catch (err) {
      console.warn('Direct Firebase save warning:', err);
    }

    // 4. Update local cache
    const local = getLocalStudents();
    saveLocalStudents([newStudent, ...local.filter((s) => s.id !== newId)]);

    return newStudent;
  },

  // Update a student registration (fee toggle, name edit, etc.)
  async updateStudent(id: string, updates: Partial<StudentRegistration>): Promise<StudentRegistration> {
    const local = getLocalStudents();
    const index = local.findIndex((s) => s.id === id);
    const updated: StudentRegistration = {
      ...(index !== -1 ? local[index] : ({} as StudentRegistration)),
      ...updates,
      id,
    };
    if (index !== -1) local[index] = updated;
    else local.push(updated);
    saveLocalStudents(local);

    // Sync changes to Firebase Realtime Database directly
    try {
      await fetch(`${RTDB_URL}/students/${id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn('Firebase RTDB update error:', err);
    }

    return updated;
  },

  // Delete student registration across all devices
  async deleteStudent(id: string): Promise<boolean> {
    // 1. Remove from Firebase Realtime Database directly
    try {
      await fetch(`${RTDB_URL}/students/${id}.json`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Firebase RTDB delete error:', err);
    }

    // 2. Remove from local storage
    const local = getLocalStudents().filter((s) => s.id !== id);
    saveLocalStudents(local);

    return true;
  },

  // Clear all students / reset across all devices
  async clearAllStudents(): Promise<boolean> {
    // 1. Wipe Firebase Realtime Database
    try {
      await fetch(`${RTDB_URL}/students.json`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Firebase RTDB clear error:', err);
    }

    // 2. Wipe local storage
    saveLocalStudents([]);
    return true;
  },

  // Verify entry pass at gate
  async verifyEntry(codeOrId: string, verifiedBy = 'Gate Scanner'): Promise<QRVerificationResult> {
    let searchKey = String(codeOrId).trim();
    try {
      if (searchKey.startsWith('{') && searchKey.endsWith('}')) {
        const parsed = JSON.parse(searchKey);
        if (parsed.id) searchKey = parsed.id;
        else if (parsed.enrollment) searchKey = parsed.enrollment;
      }
    } catch {}

    const student = await this.getStudent(searchKey);

    if (!student) {
      return {
        success: false,
        message: 'Invalid Pass: No student registration found for this QR code.',
      };
    }

    if (student.status === 'rejected') {
      return {
        success: false,
        message: 'Entry Denied: Registration was rejected by administration.',
        student,
      };
    }

    if (student.status === 'pending') {
      return {
        success: false,
        message: 'Entry Pending: Registration is awaiting approval.',
        student,
      };
    }

    if (student.isEntryVerified) {
      return {
        success: false,
        alreadyVerified: true,
        verifiedAt: student.verifiedAt || undefined,
        message: `Pass ALREADY USED! Scanned on ${new Date(student.verifiedAt || '').toLocaleTimeString()}. Duplicate entry prohibited.`,
        student,
      };
    }

    const now = new Date().toISOString();
    const updated = await this.updateStudent(student.id, {
      isEntryVerified: true,
      verifiedAt: now,
      verifiedBy,
    });

    return {
      success: true,
      alreadyVerified: false,
      message: 'Entry verified successfully! Welcome to Fresher Party 2k26!',
      student: updated,
      verifiedAt: now,
    };
  },

  // Reset entry verification
  async resetEntry(id: string): Promise<StudentRegistration> {
    return await this.updateStudent(id, {
      isEntryVerified: false,
      verifiedAt: null,
      verifiedBy: null,
    });
  },

  // Get statistics
  async getStats(): Promise<DashboardStats> {
    const students = await this.getStudents();
    const total = students.length;
    const approved = students.filter((s) => s.status === 'approved').length;
    const pending = students.filter((s) => s.status === 'pending').length;
    const rejected = students.filter((s) => s.status === 'rejected').length;
    const verified = students.filter((s) => s.isEntryVerified).length;
    const unverified = total - verified;

    const feesPaidCount = students.filter((s) => s.feeStatus === 'paid').length;
    const feesPendingCount = students.filter((s) => s.feeStatus !== 'paid').length;
    const totalFeesCollected = feesPaidCount * 300;

    const departmentCounts: Record<string, number> = {};
    const semesterCounts: Record<string, number> = {};

    students.forEach((s) => {
      departmentCounts[s.department] = (departmentCounts[s.department] || 0) + 1;
      semesterCounts[s.semester] = (semesterCounts[s.semester] || 0) + 1;
    });

    return {
      totalRegistrations: total,
      approvedRegistrations: approved,
      pendingRegistrations: pending,
      rejectedRegistrations: rejected,
      feesPaidCount,
      feesPendingCount,
      totalFeesCollected,
      verifiedEntries: verified,
      unverifiedEntries: unverified,
      departmentCounts,
      semesterCounts,
    };
  },

  // Export CSV
  exportCSV(studentsList: StudentRegistration[]) {
    const headers = [
      'Registration ID',
      'Full Name',
      'Enrollment Number',
      'Mobile Number',
      'Branch',
      'Semester',
      'Gender',
      'Fee Status',
      'Approval Status',
      'Registered At',
      'Entry Verified',
      'Verified At',
      'Verified By',
    ];

    const rows = studentsList.map((s) => [
      `"${s.id}"`,
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${s.enrollmentNumber}"`,
      `"${s.mobileNumber}"`,
      `"${s.department}"`,
      `"${s.semester}"`,
      `"${s.gender}"`,
      `"${s.feeStatus || 'pending'}"`,
      `"${s.status}"`,
      `"${s.registeredAt}"`,
      s.isEntryVerified ? '"Yes"' : '"No"',
      `"${s.verifiedAt || ''}"`,
      `"${s.verifiedBy || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Fresher_Party_2k26_Students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Export PDF Report with jsPDF
  exportPDF(studentsList: StudentRegistration[], stats?: DashboardStats | null) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    // Title & Header
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('Fresher Party 2k26 - Student Registration & Fee Report', 40, 40);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const dateStr = new Date().toLocaleString();
    doc.text(`Generated on: ${dateStr}`, 40, 56);

    // Summary Box
    if (stats) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(40, 68, 762, 42, 4, 4, 'F');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      const summaryText = [
        `Total Registered: ${stats.totalRegistrations}`,
        `Approved: ${stats.approvedRegistrations}`,
        `Fees Paid: ${stats.feesPaidCount}`,
        `Fees Pending: ${stats.feesPendingCount}`,
        `Gate Verified: ${stats.verifiedEntries}`,
      ].join('    |    ');

      doc.text(summaryText, 52, 92);
    }

    const tableStartY = stats ? 122 : 75;

    const tableHeaders = [
      ['#', 'Pass ID', 'Full Name', 'Enrollment', 'Mobile', 'Branch', 'Sem', 'Fees', 'Status', 'Entry'],
    ];

    const tableData = studentsList.map((s, index) => [
      index + 1,
      s.id,
      s.fullName,
      s.enrollmentNumber,
      s.mobileNumber,
      s.department,
      s.semester,
      (s.feeStatus || 'pending').toUpperCase(),
      s.status.toUpperCase(),
      s.isEntryVerified ? 'VERIFIED' : 'NO',
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: tableStartY,
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) {
          if (data.cell.raw === 'PAID') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        if (data.section === 'body' && data.column.index === 9) {
          if (data.cell.raw === 'VERIFIED') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    doc.save(`Fresher_Party_2k26_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  },
};
