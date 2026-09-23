import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  QrCode,
  Download,
  Search,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  CreditCard,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import {
  StudentRegistration,
  DashboardStats,
  BRANCH_OPTIONS,
  SEMESTER_OPTIONS,
  SemesterOption,
  RegistrationStatus,
  FeeStatus,
} from '../types';
import { StudentService } from '../services/studentService';

interface AdminDashboardProps {
  onViewPass: (student: StudentRegistration) => void;
  onOpenScannerWithPass?: (passId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onViewPass,
  onOpenScannerWithPass,
}) => {
  const [students, setStudents] = useState<StudentRegistration[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [feeFilter, setFeeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [entryFilter, setEntryFilter] = useState('All');

  // Modals
  const [editingStudent, setEditingStudent] = useState<StudentRegistration | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, dashboardStats] = await Promise.all([
        StudentService.getStudents({
          department: deptFilter,
          semester: semesterFilter,
          status: statusFilter,
          feeStatus: feeFilter,
          verified: entryFilter,
          search: searchQuery,
        }),
        StudentService.getStats(),
      ]);
      setStudents(list);
      setStats(dashboardStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deptFilter, semesterFilter, feeFilter, statusFilter, entryFilter, searchQuery]);

  const handleExportCSV = () => {
    StudentService.exportCSV(students);
    showNotice(`Exported ${students.length} students to CSV.`);
  };

  const handleExportPDF = () => {
    StudentService.exportPDF(students, stats);
    showNotice(`Generated and downloaded PDF report for ${students.length} students.`);
  };

  const handleToggleFeeStatus = async (student: StudentRegistration) => {
    const isCurrentlyPaid = student.feeStatus === 'paid';
    const nextFee: FeeStatus = isCurrentlyPaid ? 'pending' : 'paid';
    const nextApproval: RegistrationStatus = isCurrentlyPaid ? 'pending' : 'approved';
    try {
      await StudentService.updateStudent(student.id, {
        feeStatus: nextFee,
        status: nextApproval,
      });
      showNotice(
        nextFee === 'paid'
          ? `${student.fullName}: Fees PAID & Pass APPROVED ✓`
          : `${student.fullName}: Fees set to PENDING`
      );
      loadData();
    } catch {
      showNotice('Failed to update fee status');
    }
  };

  const handleToggleEntry = async (student: StudentRegistration) => {
    try {
      if (student.isEntryVerified) {
        await StudentService.resetEntry(student.id);
        showNotice(`Reset gate entry for ${student.fullName}.`);
      } else {
        await StudentService.verifyEntry(student.id, 'Admin Portal');
        showNotice(`Verified gate entry for ${student.fullName}.`);
      }
      loadData();
    } catch {
      showNotice('Failed to update entry state.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await StudentService.deleteStudent(id);
      setShowDeleteConfirm(null);
      showNotice('Student record permanently deleted.');
      await loadData();
    } catch {
      showNotice('Failed to delete student.');
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete all students? This will remove all demo/test records and cannot be undone.'
    );
    if (!confirmed) return;
    try {
      await StudentService.clearAllStudents();
      showNotice('All records have been permanently cleared.');
      await loadData();
    } catch {
      showNotice('Failed to clear records.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await StudentService.updateStudent(editingStudent.id, editingStudent);
      setEditingStudent(null);
      showNotice('Student details updated.');
      loadData();
    } catch {
      showNotice('Failed to update student.');
    }
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 space-y-5">
      
      {/* Header with Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Student Registrations & Fee Management
          </h2>
          <p className="text-xs text-slate-500">
            Track total registrations, pending/paid fees, approvals, and gate entries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Download Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer shadow-xs transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </button>

          {/* CSV Download Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Clear / Reset All Data */}
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 cursor-pointer shadow-xs transition-colors"
            title="Delete all demo/test registrations"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600" />
            <span>Clear All Data</span>
          </button>

          <button
            type="button"
            onClick={() => loadData()}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-2.5 text-xs text-indigo-800 flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-indigo-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* --- DETAILED STATS CARDS --- */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        
        {/* Total Registered */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Students
          </span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {stats?.totalRegistrations || 0}
          </p>
          <span className="text-[10px] text-slate-400">Registrations</span>
        </div>

        {/* Fees Paid */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Fees Paid
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {stats?.feesPaidCount || 0}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Cleared</span>
        </div>

        {/* Fees Pending */}
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 shadow-xs">
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
            Fees Pending
          </span>
          <p className="text-2xl font-bold font-mono text-red-800 mt-1">
            {stats?.feesPendingCount || 0}
          </p>
          <span className="text-[10px] text-red-600 font-medium">Payment Due</span>
        </div>

        {/* Total Collection */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 shadow-xs">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
            Total Collection
          </span>
          <p className="text-2xl font-bold font-mono text-indigo-800 mt-1">
            ₹{stats?.totalFeesCollected?.toLocaleString() || 0}
          </p>
          <span className="text-[10px] text-indigo-600 font-medium">Live Collection</span>
        </div>

        {/* Gate Verified */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
            Gate Verified
          </span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {stats?.verifiedEntries || 0}
          </p>
          <span className="text-[10px] text-slate-400">Checked In</span>
        </div>

      </div>

      {/* --- SEARCH & FILTERS BAR --- */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs flex flex-wrap gap-2 text-xs">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, enrollment, ID..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-indigo-600 focus:outline-none"
          />
        </div>

        {/* Fee filter */}
        <select
          value={feeFilter}
          onChange={(e) => setFeeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-700 font-semibold focus:border-indigo-600 focus:outline-none"
        >
          <option value="All">All Fees Status</option>
          <option value="paid">Fees Paid (Approved)</option>
          <option value="pending">Fees Pending Only</option>
        </select>

        {/* Branch Filter */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none"
        >
          <option value="All">All Branches</option>
          {BRANCH_OPTIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Semester Filter */}
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none"
        >
          <option value="All">All Semesters</option>
          {SEMESTER_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Entry Status Filter */}
        <select
          value={entryFilter}
          onChange={(e) => setEntryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none"
        >
          <option value="All">All Entry</option>
          <option value="true">Gate Verified</option>
          <option value="false">Not Verified</option>
        </select>
      </div>

      {/* --- STUDENTS TABLE --- */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Enrollment</th>
                <th className="py-2.5 px-3">Branch & Sem</th>
                <th className="py-2.5 px-3">Mobile</th>
                <th className="py-2.5 px-3">Fees & Pass Approval</th>
                <th className="py-2.5 px-3">Gate Entry</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No registrations found matching the filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Student Name & Pass ID */}
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {student.fullName}
                      <span className="block text-[10px] font-mono text-indigo-600 font-normal">
                        {student.id}
                      </span>
                    </td>

                    {/* Enrollment */}
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      {student.enrollmentNumber}
                    </td>

                    {/* Branch & Sem */}
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="block font-medium text-slate-800">{student.department}</span>
                      <span className="text-[11px] text-slate-500">{student.semester}</span>
                    </td>

                    {/* Mobile */}
                    <td className="py-2.5 px-3 font-mono">
                      {student.mobileNumber}
                    </td>

                    {/* Fees & Pass Approval (Unified 1-Click Toggle) */}
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleFeeStatus(student)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                          student.feeStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                        title="Click to toggle: Fees Paid automatically Approves pass"
                      >
                        {student.feeStatus === 'paid' ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>PAID & APPROVED ✓</span>
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>FEES PENDING</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Gate Entry Status */}
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleEntry(student)}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                          student.isEntryVerified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                        title="Click to toggle Gate check-in"
                      >
                        {student.isEntryVerified ? 'Verified ✓' : 'Not Entered'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewPass(student)}
                          className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                          title="View Digital Pass"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStudent(student)}
                          className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(student.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 px-2 py-1 text-[11px] font-bold cursor-pointer transition-colors"
                          title="Delete Student Record"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Del</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Edit Student Registration</h3>
              <button type="button" onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.fullName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Enrollment</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.enrollmentNumber}
                    onChange={(e) => setEditingStudent({ ...editingStudent, enrollmentNumber: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editingStudent.mobileNumber}
                    onChange={(e) => setEditingStudent({ ...editingStudent, mobileNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch</label>
                <select
                  value={editingStudent.department}
                  onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2"
                >
                  {BRANCH_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={editingStudent.semester}
                    onChange={(e) => setEditingStudent({ ...editingStudent, semester: e.target.value as SemesterOption })}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    {SEMESTER_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fee Status</label>
                  <select
                    value={editingStudent.feeStatus || 'pending'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, feeStatus: e.target.value as FeeStatus })}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    <option value="pending">Fees Pending</option>
                    <option value="paid">Fees Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approval Status</label>
                <select
                  value={editingStudent.status}
                  onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value as RegistrationStatus })}
                  className="w-full rounded-lg border border-slate-300 p-2"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg border border-slate-200 text-center space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Delete Student Record?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete pass <strong className="font-mono text-red-600">{showDeleteConfirm}</strong>?
            </p>
            <p className="text-[11px] text-slate-400">
              This will permanently delete this record from the database.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm)}
                className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-1.5 text-xs font-bold text-white cursor-pointer shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
