import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  QrCode,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  RotateCcw,
  Sparkles,
  User,
  CreditCard,
  Check,
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

  // Result state
  const [verificationResult, setVerificationResult] = useState<QRVerificationResult | null>(null);
  const [scannedStudent, setScannedStudent] = useState<StudentRegistration | null>(null);

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
    { id: string; name: string; time: string; status: 'verified' | 'duplicate' | 'rejected' }[]
  >([]);

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMode, cameraFacing]);

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
            if (navigator.vibrate) navigator.vibrate(120);
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
        addRecentScan(student.id, student.fullName, 'rejected');
        setIsVerifying(false);
        return;
      }

      if (student.status === 'pending') {
        setVerificationResult({
          success: false,
          message: 'ENTRY PENDING: Registration has not been approved yet.',
          student,
        });
        addRecentScan(student.id, student.fullName, 'rejected');
        setIsVerifying(false);
        return;
      }

      if (student.isEntryVerified) {
        setVerificationResult({
          success: false,
          alreadyVerified: true,
          verifiedAt: student.verifiedAt || undefined,
          message: `ALREADY ENTERED: Pass was already scanned at ${new Date(student.verifiedAt || '').toLocaleTimeString()}! Duplicate entry forbidden.`,
          student,
        });
        addRecentScan(student.id, student.fullName, 'duplicate');
        setIsVerifying(false);
        return;
      }

      if (autoVerify) {
        const result = await StudentService.verifyEntry(student.id, 'Mobile Gate Scanner');
        setVerificationResult(result);
        if (result.student) setScannedStudent(result.student);
        addRecentScan(student.id, student.fullName, 'verified');
        if (onStudentUpdated) onStudentUpdated();
      } else {
        setVerificationResult({
          success: true,
          alreadyVerified: false,
          message: 'Pass is valid and eligible for entry.',
          student,
        });
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: err.message || 'Verification error.',
      });
      setScannedStudent(null);
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
      addRecentScan(scannedStudent.id, scannedStudent.fullName, 'verified');
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

  const addRecentScan = (id: string, name: string, status: 'verified' | 'duplicate' | 'rejected') => {
    setRecentScans((prev) => [
      {
        id,
        name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status,
      },
      ...prev.slice(0, 4),
    ]);
  };

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
            <p className="text-[10px] text-slate-500">Scan passes at entrance</p>
          </div>
        </div>

        {/* Auto check-in toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
          <span className="text-[11px] text-slate-600 font-medium">Auto:</span>
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

      {/* Camera Viewfinder (Mobile-First) */}
      {scanMode === 'camera' && (
        <div className="relative overflow-hidden rounded-2xl bg-black border-2 border-slate-900 shadow-md aspect-square w-full flex items-center justify-center">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning Box Reticle */}
          {cameraActive && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-56 w-56 rounded-2xl border-2 border-indigo-400/90 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-white rounded-br-lg" />

                {/* Animated scan beam */}
                <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse" />
              </div>
            </div>
          )}

          {/* Camera controls overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={flipCamera}
              className="rounded-full bg-black/60 p-2 text-white backdrop-blur-xs hover:bg-black/80 transition-colors cursor-pointer"
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

      {/* Verification Result Card */}
      {verificationResult && (
        <div className={`rounded-2xl p-4 border text-left space-y-3 shadow-sm ${
          verificationResult.alreadyVerified
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : verificationResult.success
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-red-50 border-red-300 text-red-900'
        }`}>
          <div className="flex items-start gap-2.5">
            {verificationResult.alreadyVerified ? (
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            ) : verificationResult.success ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-extrabold text-sm sm:text-base">
                {verificationResult.alreadyVerified
                  ? 'DUPLICATE ENTRY DETECTED'
                  : verificationResult.success
                  ? 'ENTRY VERIFIED & CHECKED IN'
                  : 'ENTRY REJECTED'}
              </h4>
              <p className="text-xs mt-0.5">{verificationResult.message}</p>
            </div>
          </div>

          {/* Student Profile Card */}
          {scannedStudent && (
            <div className="rounded-xl border border-black/10 bg-white/80 p-3 space-y-2 text-xs text-slate-800">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{scannedStudent.fullName}</p>
                  <p className="font-mono text-indigo-700 font-semibold">{scannedStudent.enrollmentNumber}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    scannedStudent.feeStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {scannedStudent.feeStatus === 'paid' ? 'FEES PAID ✓' : 'FEES PENDING ✕'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="font-semibold block text-slate-400 text-[10px]">BRANCH</span>
                  <span>{scannedStudent.department}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-400 text-[10px]">SEMESTER</span>
                  <span>{scannedStudent.semester}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-400 text-[10px]">PASS ID</span>
                  <span className="font-mono">{scannedStudent.id}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-400 text-[10px]">MOBILE</span>
                  <span className="font-mono">{scannedStudent.mobileNumber}</span>
                </div>
              </div>

              {!scannedStudent.isEntryVerified && !autoVerify && (
                <button
                  type="button"
                  onClick={confirmManualEntry}
                  className="w-full mt-2 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Confirm Entry
                </button>
              )}

              {scannedStudent.isEntryVerified && (
                <div className="pt-2 border-t border-black/10 flex justify-between items-center text-[11px]">
                  <span className="text-emerald-700 font-semibold">Checked in successfully</span>
                  <button
                    type="button"
                    onClick={() => handleResetEntry(scannedStudent.id)}
                    className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Reset Entry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Scan Next Pass Button */}
          <button
            type="button"
            onClick={() => {
              setVerificationResult(null);
              setScannedStudent(null);
              if (scanMode === 'camera') startCamera();
            }}
            className="w-full rounded-lg bg-slate-900 text-white py-2 text-xs font-bold transition-colors cursor-pointer"
          >
            Scan Next Pass
          </button>
        </div>
      )}

    </div>
  );
};
