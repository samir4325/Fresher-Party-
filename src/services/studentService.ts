import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { StudentRegistration, DashboardStats, QRVerificationResult, FeeStatus } from '../types';
import { INITIAL_STUDENTS } from '../data/seedData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LOCAL_STORAGE_KEY = 'fresher_party_students_v1';
const STUDENTS_COLLECTION = 'students';

function getLocalStudents(): StudentRegistration[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read from localStorage', e);
  }
  return INITIAL_STUDENTS;
}

function saveLocalStudents(students: StudentRegistration[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
}

// Seed initial students into Firestore if empty
let isSeeded = false;
async function ensureFirestoreSeed() {
  if (isSeeded || !db || !isFirebaseConfigured) return;
  try {
    const snap = await getDocs(collection(db, STUDENTS_COLLECTION));
    if (snap.empty) {
      for (const s of INITIAL_STUDENTS) {
        await setDoc(doc(db, STUDENTS_COLLECTION, s.id), s);
      }
    }
    isSeeded = true;
  } catch (err) {
    console.warn('Could not check/seed Firestore', err);
  }
}

export const StudentService = {
  // Fetch all students (with optional query filter)
  async getStudents(filters?: {
    department?: string;
    semester?: string;
    status?: string;
    search?: string;
    verified?: string;
    feeStatus?: string;
  }): Promise<StudentRegistration[]> {
    let list: StudentRegistration[] = [];

    if (db && isFirebaseConfigured) {
      try {
        await ensureFirestoreSeed();
        const snap = await getDocs(collection(db, STUDENTS_COLLECTION));
        if (!snap.empty) {
          list = snap.docs.map((d) => d.data() as StudentRegistration);
          saveLocalStudents(list);
        } else {
          list = getLocalStudents();
        }
      } catch {
        list = getLocalStudents();
      }
    } else {
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

  // Get a single student by ID or Enrollment Number
  async getStudent(identifier: string): Promise<StudentRegistration | null> {
    const clean = identifier.trim();
    if (!clean) return null;

    if (db && isFirebaseConfigured) {
      try {
        // 1. Try directly by document ID (e.g. FP-2k26-4812)
        const docRef = doc(db, STUDENTS_COLLECTION, clean.toUpperCase());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as StudentRegistration;
        }

        // 2. Query by enrollmentNumber
        const q = query(
          collection(db, STUDENTS_COLLECTION),
          where('enrollmentNumber', '==', clean.toUpperCase())
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          return querySnap.docs[0].data() as StudentRegistration;
        }
      } catch {
        // fallback to local
      }
    }

    const local = getLocalStudents();
    const qLower = clean.toLowerCase();
    const found = local.find(
      (s) =>
        s.id.toLowerCase() === qLower ||
        s.enrollmentNumber.toLowerCase() === qLower
    );
    return found || null;
  },

  // Register a new student
  async registerStudent(
    data: Omit<StudentRegistration, 'id' | 'status' | 'registeredAt' | 'isEntryVerified' | 'verifiedAt'>
  ): Promise<StudentRegistration> {
    const cleanEnrollment = data.enrollmentNumber.trim().toUpperCase();

    // Check duplicate enrollment
    if (db && isFirebaseConfigured) {
      try {
        const q = query(
          collection(db, STUDENTS_COLLECTION),
          where('enrollmentNumber', '==', cleanEnrollment)
        );
        const existingSnap = await getDocs(q);
        if (!existingSnap.empty) {
          const exist = existingSnap.docs[0].data() as StudentRegistration;
          throw new Error(
            `Enrollment number "${cleanEnrollment}" is already registered (Pass: ${exist.id})`
          );
        }
      } catch (err: any) {
        if (err.message && err.message.includes('already registered')) {
          throw err;
        }
      }
    } else {
      const local = getLocalStudents();
      const existing = local.find((s) => s.enrollmentNumber.toUpperCase() === cleanEnrollment);
      if (existing) {
        throw new Error(
          `Enrollment number "${cleanEnrollment}" is already registered (Pass: ${existing.id})`
        );
      }
    }

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

    if (db && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, STUDENTS_COLLECTION, newId), newStudent);
      } catch (err) {
        console.warn('Failed to write to Firestore, saving locally', err);
      }
    }

    const current = getLocalStudents();
    saveLocalStudents([newStudent, ...current.filter((s) => s.id !== newId)]);
    return newStudent;
  },

  // Update a student registration
  async updateStudent(id: string, updates: Partial<StudentRegistration>): Promise<StudentRegistration> {
    if (db && isFirebaseConfigured) {
      try {
        const docRef = doc(db, STUDENTS_COLLECTION, id);
        await updateDoc(docRef, updates);
      } catch (err) {
        console.warn('Failed to update Firestore, updating locally', err);
      }
    }

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
    return updated;
  },

  // Delete student registration
  async deleteStudent(id: string): Promise<boolean> {
    if (db && isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, STUDENTS_COLLECTION, id));
      } catch (err) {
        console.warn('Failed to delete from Firestore', err);
      }
    }

    const local = getLocalStudents().filter((s) => s.id !== id);
    saveLocalStudents(local);
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
    const totalFeesCollected = feesPaidCount * 500;

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
