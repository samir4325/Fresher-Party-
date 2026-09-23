export type SemesterOption =
  | 'Semester 1'
  | 'Semester 3'
  | 'Semester 5'
  | 'Semester 7';

export const SEMESTER_OPTIONS: SemesterOption[] = [
  'Semester 1',
  'Semester 3',
  'Semester 5',
  'Semester 7',
];

export const BRANCH_OPTIONS = [
  'Computer Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
] as const;

export const DEPARTMENT_OPTIONS = BRANCH_OPTIONS;
export type BranchOption = (typeof BRANCH_OPTIONS)[number];
export type DepartmentOption = BranchOption;

export type GenderOption = 'Male' | 'Female' | 'Other';

export type BloodGroupOption =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'O+'
  | 'O-'
  | 'AB+'
  | 'AB-';

export const BLOOD_GROUP_OPTIONS: BloodGroupOption[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'O+',
  'O-',
  'AB+',
  'AB-',
];

export type RegistrationStatus = 'approved' | 'pending' | 'rejected';

export type FeeStatus = 'paid' | 'pending';

export interface StudentRegistration {
  id: string; // e.g. FP-2k26-XXXX
  fullName: string;
  enrollmentNumber: string;
  mobileNumber: string;
  department: string;
  semester: SemesterOption;
  gender: GenderOption;
  feeStatus?: FeeStatus; // 'paid' | 'pending'
  studentPhoto?: string; // base64 or valid URL (optional)
  bloodGroup?: BloodGroupOption | '';
  status: RegistrationStatus;
  registeredAt: string; // ISO string
  isEntryVerified: boolean;
  verifiedAt: string | null; // ISO string when entry scanned
  verifiedBy?: string | null;
  notes?: string;
}

export interface DashboardStats {
  totalRegistrations: number;
  approvedRegistrations: number;
  pendingRegistrations: number;
  rejectedRegistrations: number;
  feesPaidCount: number;
  feesPendingCount: number;
  totalFeesCollected: number;
  verifiedEntries: number;
  unverifiedEntries: number;
  departmentCounts: Record<string, number>;
  semesterCounts: Record<string, number>;
}

export interface QRVerificationResult {
  success: boolean;
  message: string;
  student?: StudentRegistration;
  alreadyVerified?: boolean;
  verifiedAt?: string;
}
