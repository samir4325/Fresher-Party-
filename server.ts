import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'students.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface Student {
  id: string;
  fullName: string;
  enrollmentNumber: string;
  mobileNumber: string;
  department: string;
  semester: string;
  gender: string;
  studentPhoto?: string;
  bloodGroup?: string;
  feeStatus?: 'paid' | 'pending';
  status: 'approved' | 'pending' | 'rejected';
  registeredAt: string;
  isEntryVerified: boolean;
  verifiedAt: string | null;
  verifiedBy?: string | null;
  notes?: string;
}

// In-memory cache + persistent disk backing
let students: Student[] = [];

function loadStudents(): Student[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      students = JSON.parse(raw);
      return students;
    }
  } catch (err) {
    console.error('Error loading data/students.json:', err);
  }
  students = [];
  return students;
}

function saveStudents(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data/students.json:', err);
  }
}

// Initial load
loadStudents();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware for JSON bodies with generous limit for photo uploads
  app.use(express.json({ limit: '15mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString(), totalStudents: students.length });
  });

  // Get all students with optional search & filter
  app.get('/api/students', (req: Request, res: Response) => {
    const { department, semester, status, search, verified } = req.query;
    let result = [...students];

    if (department && department !== 'All') {
      result = result.filter((s) => s.department === department);
    }

    if (semester && semester !== 'All') {
      result = result.filter((s) => s.semester === semester);
    }

    if (status && status !== 'All') {
      result = result.filter((s) => s.status === status);
    }

    if (verified !== undefined && verified !== 'All') {
      const isV = verified === 'true';
      result = result.filter((s) => s.isEntryVerified === isV);
    }

    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.enrollmentNumber.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.mobileNumber.includes(q)
      );
    }

    res.json(result);
  });

  // Get student by ID or Enrollment Number
  app.get('/api/students/:query', (req: Request, res: Response) => {
    const query = req.params.query.trim().toLowerCase();
    const student = students.find(
      (s) => s.id.toLowerCase() === query || s.enrollmentNumber.toLowerCase() === query
    );
    if (!student) {
      return res.status(404).json({ error: 'Student registration not found' });
    }
    return res.json(student);
  });

  // Register a new student
  app.post('/api/students', (req: Request, res: Response) => {
    const {
      fullName,
      enrollmentNumber,
      mobileNumber,
      department,
      semester,
      gender,
      studentPhoto,
      bloodGroup,
    } = req.body;

    if (!fullName || !enrollmentNumber || !mobileNumber || !department || !semester || !gender) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const cleanEnrollment = String(enrollmentNumber).trim().toUpperCase();

    // Check for existing enrollment number
    const existing = students.find((s) => s.enrollmentNumber.toUpperCase() === cleanEnrollment);
    if (existing) {
      return res.status(409).json({
        error: `Enrollment number "${cleanEnrollment}" is already registered with Pass ID ${existing.id}`,
        existingId: existing.id,
      });
    }

    // Generate unique Registration ID e.g. FP-2k26-XXXX
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newId = `FP-2k26-${randomDigits}`;

    const newStudent: Student = {
      id: newId,
      fullName: String(fullName).trim(),
      enrollmentNumber: cleanEnrollment,
      mobileNumber: String(mobileNumber).trim(),
      department: String(department).trim(),
      semester: String(semester).trim(),
      gender: gender,
      studentPhoto: studentPhoto || '',
      bloodGroup: bloodGroup || '',
      feeStatus: (req.body.feeStatus as 'paid' | 'pending') || 'pending',
      status: 'approved', // Auto-approved for fast access; admin can change
      registeredAt: new Date().toISOString(),
      isEntryVerified: false,
      verifiedAt: null,
      notes: '',
    };

    students.unshift(newStudent);
    saveStudents();

    return res.status(201).json(newStudent);
  });

  // Update student registration details
  app.put('/api/students/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = students.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Student registration not found' });
    }

    const current = students[index];
    const updated: Student = {
      ...current,
      ...req.body,
      id: current.id, // Immutable ID
    };

    students[index] = updated;
    saveStudents();
    return res.json(updated);
  });

  // Delete student registration
  app.delete('/api/students/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = students.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Student registration not found' });
    }

    const removed = students.splice(index, 1)[0];
    saveStudents();
    return res.json({ success: true, removedId: removed.id });
  });

  // QR Entry Verification endpoint
  app.post('/api/verify-entry', (req: Request, res: Response) => {
    const { code, verifiedBy } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'No QR code or ID provided' });
    }

    let searchKey = String(code).trim();

    // Check if code is JSON payload from QR
    try {
      if (searchKey.startsWith('{') && searchKey.endsWith('}')) {
        const parsed = JSON.parse(searchKey);
        if (parsed.id) searchKey = parsed.id;
        else if (parsed.enrollment) searchKey = parsed.enrollment;
      }
    } catch {
      // not JSON, keep searchKey
    }

    const student = students.find(
      (s) =>
        s.id.toLowerCase() === searchKey.toLowerCase() ||
        s.enrollmentNumber.toLowerCase() === searchKey.toLowerCase()
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Pass: No student registration found for this QR code.',
      });
    }

    if (student.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Entry Denied: This student registration was rejected by administration.',
        student,
      });
    }

    if (student.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Entry Pending: This registration is awaiting admin approval before entry.',
        student,
      });
    }

    // CHECK IF ALREADY VERIFIED (Duplicate Entry Prevention)
    if (student.isEntryVerified) {
      return res.status(200).json({
        success: false,
        alreadyVerified: true,
        verifiedAt: student.verifiedAt,
        verifiedBy: student.verifiedBy,
        message: `Pass ALREADY USED for entry on ${new Date(student.verifiedAt || '').toLocaleTimeString()}! Duplicate entry forbidden.`,
        student,
      });
    }

    // Mark as verified
    const entryTime = new Date().toISOString();
    student.isEntryVerified = true;
    student.verifiedAt = entryTime;
    student.verifiedBy = verifiedBy || 'Security Gate Organizer';

    saveStudents();

    return res.json({
      success: true,
      alreadyVerified: false,
      message: 'Entry verified successfully! Welcome to Fresher Party 2025!',
      student,
      verifiedAt: entryTime,
    });
  });

  // Reset entry verification (for test/re-entry by admin)
  app.post('/api/reset-entry/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const student = students.find((s) => s.id === id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    student.isEntryVerified = false;
    student.verifiedAt = null;
    student.verifiedBy = null;
    saveStudents();
    return res.json({ success: true, student });
  });

  // Dashboard Stats
  app.get('/api/stats', (_req: Request, res: Response) => {
    const total = students.length;
    const approved = students.filter((s) => s.status === 'approved').length;
    const pending = students.filter((s) => s.status === 'pending').length;
    const rejected = students.filter((s) => s.status === 'rejected').length;
    const verified = students.filter((s) => s.isEntryVerified).length;
    const unverified = total - verified;

    const feesPaidCount = students.filter((s) => s.feeStatus === 'paid').length;
    const feesPendingCount = students.filter((s) => s.feeStatus !== 'paid').length;
    const totalFeesCollected = feesPaidCount * 500; // ₹500 standard pass fee

    const departmentCounts: Record<string, number> = {};
    const semesterCounts: Record<string, number> = {};

    students.forEach((s) => {
      departmentCounts[s.department] = (departmentCounts[s.department] || 0) + 1;
      semesterCounts[s.semester] = (semesterCounts[s.semester] || 0) + 1;
    });

    res.json({
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
    });
  });

  // CSV Export endpoint
  app.get('/api/export/csv', (_req: Request, res: Response) => {
    const headers = [
      'Registration ID',
      'Full Name',
      'Enrollment Number',
      'Mobile Number',
      'Department',
      'Semester',
      'Gender',
      'Fee Status',
      'Approval Status',
      'Registered At',
      'Entry Verified',
      'Verified At',
      'Verified By',
    ];

    const rows = students.map((s) => [
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
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fresher_party_registrations.csv');
    res.send(csvContent);
  });

  // --- VITE MIDDLEWARE (Development) or STATIC ASSETS (Production) ---
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fresher Party Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
