import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  QrCode,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Sparkles,
  User,
  CreditCard,
  Check,
  X,
  Phone,
  GraduationCap,
  Calendar,
  AlertOctagon,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { StudentRegistration, QRVerificationResult } from '../types';
import { StudentService } from '../services/studentService';

interface QRVerificationSystemProps {
  initialCode?: string;
  onStudentUpdated?: () => void;
}

export const QRVerificationSystem: React.FC<QRVerificationSystemProps> = ({
  initialCode,
  onStudentUpdated,
}) => {
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState(initialCode || '');
  const [autoVerify, setAutoVerify] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  // Popup Modal Result state
  const [showPopup, setShowPopup] = useState(false);
  const [verificationResult, setVerificationResult] = useState<QRVerificationResult | null>(null);
  const [scannedStudent, setScannedStudent] = useState<StudentRegistration | null>(null);
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Recent scans log
  const [recentScans, setRecentScans] = useState<
    { id: string; name: string; time: string; feeStatus: string; status: 'verified' | 'duplicate' | 'rejected' }[]
  >([]);

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (scanMode === 'camera' && !showPopup) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMode, cameraFacing, showPopup]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestScanFrame();
      }
    } catch {
      setCameraError('Camera access unavailable. Please try Upload Image or Manual ID.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const flipCamera = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const requestScanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          try {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          } catch {}
          handleVerify(code.data);
          stopCamera();
          return;
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(requestScanFrame);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleVerify(code.data);
          } else {
            setVerificationResult({
              success: false,
              message: 'No QR code detected. Please ensure the pass QR is clear.',
            });
            setScannedStudent(null);
            setShowPopup(true);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async (rawCode: string) => {
    if (!rawCode.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    let target = rawCode.trim();
    try {
      if (target.startsWith('{') && target.endsWith('}')) {
        const parsed = JSON.parse(target);
        target = parsed.id || parsed.enrollment || target;
      }
    } catch {}

    try {
      const student = await StudentService.getStudent(target);

      if (!student) {
        setVerificationResult({
          success: false,
          message: `Invalid Pass: No student registration found for "${target}".`,
        });
        setScannedStudent(null);
        setShowPopup(true);
        setIsVerifying(false);
        return;
      }

      setScannedStudent(student);

      if (student.status === 'rejected') {
        setVerificationResult({
          success: false,
          message: 'ENTRY DENIED: Registration was rejected by administration.',
          student,
        });
        addRecentScan(student.id, student.fullName, student.feeStatus || 'pending', 'rejected');
        setShowPopup(true);
        setIsVerifying(false);
        return;
      }

      if (student.isEntryVerified) {
        setVerificationResult({
          success: false,
          alreadyVerified: true,
          verifiedAt: student.verifiedAt || undefined,
          message: `ALREADY SCANNED: Pass was already used at ${new Date(student.verifiedAt || '').toLocaleTimeString()}! Duplicate entry forbidden.`,
          student,
        });
        addRecentScan(student.id, student.fullName, student.feeStatus || 'pending', 'duplicate');
        setShowPopup(true);
        setIsVerifying(false);
        return;
      }

      // If fees are paid and autoVerify is on, verify entry immediately
      if (student.feeStatus === 'paid') {
        if (autoVerify) {
          const result = await StudentService.verifyEntry(student.id, 'Gate Scanner');
          setVerificationResult(result);
          if (result.student) setScannedStudent(result.student);
          addRecentScan(student.id, student.fullName, 'paid', 'verified');
          if (onStudentUpdated) onStudentUpdated();
        } else {
          setVerificationResult({
            success: true,
            alreadyVerified: false,
            message: 'Fees Paid. Pass is valid and eligible for entry.',
            student,
          });
        }
      } else {
        // Fees pending: Show warning popup with 1-click collect & admit button
        setVerificationResult({
          success: false,
          alreadyVerified: false,
          message: 'Party fee ₹500 is pending. Please collect fee before entry.',
          student,
        });
      }
      setShowPopup(true);
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: err.message || 'Verification error.',
      });
      setScannedStudent(null);
      setShowPopup(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const confirmManualEntry = async () => {
    if (!scannedStudent) return;
    setIsVerifying(true);
    try {
      const res = await StudentService.verifyEntry(scannedStudent.id, 'Gate Volunteer');
      setVerificationResult(res);
      if (res.student) setScannedStudent(res.student);
      addRecentScan(scannedStudent.id, scannedStudent.fullName, scannedStudent.feeStatus || 'pending', 'verified');
      if (onStudentUpdated) onStudentUpdated();
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: err.message || 'Verification error.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickMarkFeesPaid = async () => {
    if (!scannedStudent) return;
    setIsUpdatingFee(true);
    try {
      const now = new Date().toISOString();
      const updated = await StudentService.updateStudent(scannedStudent.id, {
        feeStatus: 'paid',
        status: 'approved',
        isEntryVerified: true,
        verifiedAt: now,
        verifiedBy: 'Gate Scanner (Fee Paid)',
      });
      setScannedStudent(updated);
      setVerificationResult({
        success: true,
        alreadyVerified: false,
        message: 'Fee collected (₹500 PAID) & Gate Entry Approved! Welcome! 🎉',
        student: updated,
        verifiedAt: now,
      });
      addRecentScan(updated.id, updated.fullName, 'paid', 'verified');
      if (onStudentUpdated) onStudentUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingFee(false);
    }
  };

  const handleResetEntry = async (studentId: string) => {
    try {
      const updated = await StudentService.resetEntry(studentId);
      setScannedStudent(updated);
      setVerificationResult({
        success: true,
        alreadyVerified: false,
        message: 'Pass entry has been reset.',
        student: updated,
      });
      if (onStudentUpdated) onStudentUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const closePopupAndScanNext = () => {
    setShowPopup(false);
    setVerificationResult(null);
    setScannedStudent(null);
    setManualInput('');
    if (scanMode === 'camera') {
      setTimeout(() => {
        startCamera();
      }, 150);
    }
  };

  const addRecentScan = (
    id: string,
    name: string,
    feeStatus: string,
    status: 'verified' | 'duplicate' | 'rejected'
  ) => {
    setRecentScans((prev) => [
      {
        id,
        name,
        feeStatus,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status,
      },
      ...prev.slice(0, 4),
    ]);
  };

  // Determine popup theme
  const isDuplicate = verificationResult?.alreadyVerified;
  const isDenied = verificationResult && !verificationResult.success && !isDuplicate;
  const isFeesPending = scannedStudent ? (scannedStudent.feeStatus || 'pending') !== 'paid' : false;
  const isApproved = verificationResult?.success && !isDuplicate && !isDenied;

  return (
    <div className="mx-auto max-w-md px-3 sm:px-4 space-y-4">
      {/* Mobile Top Bar Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <QrCode className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Gate Scanner</h3>
            <p className="text-[10px] text-slate-500">Live QR scanning & instant check-in</p>
          </div>
        </div>

        {/* Auto check-in toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
          <span className="text-[11px] text-slate-600 font-medium">Auto Check-in:</span>
          <button
            type="button"
            onClick={() => setAutoVerify(!autoVerify)}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors cursor-pointer ${
              autoVerify ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                autoVerify ? 'translate-x-3.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/80 p-1 text-xs">
        <button
          type="button"
          onClick={() => setScanMode('camera')}
          className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
            scanMode === 'camera' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          Live Camera
        </button>
        <button
          type="button"
          onClick={() => setScanMode('upload')}
          className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
            scanMode === 'upload' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          Photo Upload
        </button>
        <button
          type="button"
          onClick={() => setScanMode('manual')}
          className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
            scanMode === 'manual' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          Manual ID
        </button>
      </div>

      {/* Camera Viewfinder */}
      {scanMode === 'camera' && (
        <div className="relative overflow-hidden rounded-2xl bg-black border-2 border-slate-900 shadow-md aspect-square w-full flex items-center justify-center">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning Reticle */}
          {cameraActive && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-60 w-60 rounded-3xl border-2 border-indigo-400/90 shadow-[0_0_25px_rgba(99,102,241,0.35)]">
                {/* Corner markers */}
                <div className="absolute -top-1.5 -left-1.5 h-6 w-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
                <div className="absolute -top-1.5 -right-1.5 h-6 w-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
                <div className="absolute -bottom-1.5 -left-1.5 h-6 w-6 border-b-4 border-l-4 border-white rounded-bl-xl" />
                <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 border-b-4 border-r-4 border-white rounded-br-xl" />

                {/* Animated scan beam */}
                <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              </div>
            </div>
          )}

          {/* Flip Camera button */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={flipCamera}
              className="rounded-full bg-black/60 p-2.5 text-white backdrop-blur-xs hover:bg-black/80 transition-colors cursor-pointer"
              title="Flip Camera"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-4 text-center text-white">
              <Camera className="h-10 w-10 text-indigo-400 mb-2" />
              <p className="text-xs text-slate-300 mb-3">Camera is paused</p>
              <button
                type="button"
                onClick={startCamera}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Start Scanner
              </button>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-xs text-red-400">
              {cameraError}
            </div>
          )}
        </div>
      )}

      {/* Upload Mode */}
      {scanMode === 'upload' && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
          <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-600 mb-3">Upload screenshot of student QR Pass</p>
          <label className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white cursor-pointer shadow-xs">
            <span>Select Image</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* Manual ID Mode */}
      {scanMode === 'manual' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Enter Enrollment Number or Pass ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. 26CE042 or FP-2k26-4812"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono uppercase focus:border-indigo-600 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerify(manualInput);
              }}
            />
            <button
              type="button"
              onClick={() => handleVerify(manualInput)}
              disabled={isVerifying || !manualInput.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
            >
              Verify
            </button>
          </div>
        </div>
      )}

      {/* Recent Scans Strip */}
      {recentScans.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span>Recent Gate Scans</span>
            <span className="text-slate-400 font-normal">Last {recentScans.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {recentScans.map((scan, i) => (
              <div key={i} className="py-1.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800 text-[11px]">{scan.name}</p>
                  <p className="font-mono text-[10px] text-slate-400">{scan.id} • {scan.time}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      scan.feeStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {scan.feeStatus === 'paid' ? 'PAID' : 'PENDING'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      scan.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : scan.status === 'duplicate'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {scan.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL FOR SCAN RESULTS (DYNAMIC THEME: PAID vs PENDING vs DUPLICATE) */}
      {/* ========================================================================= */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border-2 transition-all transform animate-in zoom-in-95 duration-200 ${
              isDuplicate
                ? 'bg-slate-900 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                : isDenied
                ? 'bg-slate-900 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.35)]'
                : isFeesPending
                ? 'bg-gradient-to-b from-amber-950 via-slate-900 to-slate-900 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.45)]'
                : 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.45)]'
            }`}
          >
            {/* Top Close Button (X) */}
            <button
              type="button"
              onClick={closePopupAndScanNext}
              className="absolute top-3.5 right-3.5 z-20 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors cursor-pointer"
              title="Close & Scan Next"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header Strip */}
            <div
              className={`p-5 text-center text-white relative overflow-hidden ${
                isDuplicate
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700'
                  : isDenied
                  ? 'bg-gradient-to-r from-slate-800 via-rose-900 to-red-900'
                  : isFeesPending
                  ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
              }`}
            >
              {/* Decorative background glow */}
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/20 blur-xl pointer-events-none" />

              {/* Status Icon */}
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                {isDuplicate ? (
                  <AlertOctagon className="h-8 w-8 text-white animate-bounce" />
                ) : isDenied ? (
                  <XCircle className="h-8 w-8 text-white" />
                ) : isFeesPending ? (
                  <AlertTriangle className="h-8 w-8 text-amber-200 animate-pulse" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-white" />
                )}
              </div>

              {/* Status Title */}
              <h2 className="text-lg font-black tracking-wide uppercase">
                {isDuplicate
                  ? 'ALREADY ENTERED!'
                  : isDenied
                  ? 'ENTRY DENIED'
                  : isFeesPending
                  ? '⚠️ FEES PENDING (₹500)'
                  : '✅ ENTRY APPROVED'}
              </h2>

              {/* Sub-label description */}
              <p className="mt-1 text-xs text-white/90 font-medium">
                {isDuplicate
                  ? `Pass already scanned at ${new Date(verificationResult?.verifiedAt || '').toLocaleTimeString()}`
                  : isDenied
                  ? verificationResult?.message
                  : isFeesPending
                  ? 'Collect ₹500 party fee before admitting student'
                  : 'Student pass verified & fees confirmed paid'}
              </p>
            </div>

            {/* Modal Body: Student Details */}
            <div className="p-4 sm:p-5 space-y-4">
              {scannedStudent ? (
                <>
                  {/* Student Identity Card */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div>
                        <h3 className="font-extrabold text-white text-base leading-tight">
                          {scannedStudent.fullName}
                        </h3>
                        <p className="font-mono text-xs font-bold text-indigo-400 mt-0.5">
                          {scannedStudent.enrollmentNumber}
                        </p>
                      </div>

                      {/* Fee Badge in Card */}
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                            scannedStudent.feeStatus === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse'
                          }`}
                        >
                          {scannedStudent.feeStatus === 'paid' ? (
                            <>
                              <Check className="h-3 w-3" />
                              PAID (₹500)
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3" />
                              UNPAID (₹500)
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-black/20 p-2 border border-white/5">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Department
                        </span>
                        <span className="font-semibold text-slate-200">
                          {scannedStudent.department}
                        </span>
                      </div>

                      <div className="rounded-xl bg-black/20 p-2 border border-white/5">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Semester
                        </span>
                        <span className="font-semibold text-slate-200">
                          {scannedStudent.semester}
                        </span>
                      </div>

                      <div className="rounded-xl bg-black/20 p-2 border border-white/5">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Pass ID
                        </span>
                        <span className="font-mono font-bold text-indigo-300">
                          {scannedStudent.id}
                        </span>
                      </div>

                      <div className="rounded-xl bg-black/20 p-2 border border-white/5">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Mobile
                        </span>
                        <span className="font-mono text-slate-300">
                          {scannedStudent.mobileNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SPECIAL ACTION IF FEES PENDING: 1-Tap Mark Paid */}
                  {isFeesPending && (
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                        <DollarSign className="h-4 w-4" />
                        <span>Cash / UPI Payment Pending</span>
                      </div>
                      <p className="text-[11px] text-amber-200/80">
                        Did student pay ₹500 at the gate? Tap below to record payment immediately:
                      </p>
                      <button
                        type="button"
                        onClick={handleQuickMarkFeesPaid}
                        disabled={isUpdatingFee}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 py-2.5 px-4 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-60"
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                        <span>{isUpdatingFee ? 'Updating Database...' : 'Collect ₹500 & Mark Paid ✓'}</span>
                      </button>
                    </div>
                  )}

                  {/* Manual entry confirmation button if autoVerify is off */}
                  {!scannedStudent.isEntryVerified && !autoVerify && !isDuplicate && (
                    <button
                      type="button"
                      onClick={confirmManualEntry}
                      disabled={isVerifying}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold shadow-md cursor-pointer transition-colors"
                    >
                      {isVerifying ? 'Checking In...' : 'Confirm Entry to Party'}
                    </button>
                  )}

                  {/* Reset entry option */}
                  {scannedStudent.isEntryVerified && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Entry recorded in database
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResetEntry(scannedStudent.id)}
                        className="text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Reset Pass
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* No student found message */
                <div className="py-4 text-center space-y-2">
                  <p className="text-xs text-slate-300">
                    {verificationResult?.message || 'No valid pass details found.'}
                  </p>
                </div>
              )}

              {/* Bottom "Scan Next Pass" Action Button */}
              <button
                type="button"
                onClick={closePopupAndScanNext}
                className={`w-full rounded-xl py-3 px-4 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isFeesPending
                    ? 'bg-slate-800 hover:bg-slate-700 border border-slate-600'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                <span>Scan Next Student QR</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
