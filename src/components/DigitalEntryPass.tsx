import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Printer,
  CheckCircle2,
  QrCode,
  ChevronLeft,
  Loader2,
  Share2,
} from 'lucide-react';
import { StudentRegistration } from '../types';

interface DigitalEntryPassProps {
  student: StudentRegistration;
  onBack?: () => void;
}

// Draw a crystal clear high-res VIP ticket on HTML5 Canvas (100% reliable across all phones & browsers)
function generatePassDataUrl(student: StudentRegistration, qrDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 750;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(qrDataUrl);
      return;
    }

    // 1. Background (Dark Obsidian Theme)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1200);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(0.5, '#090d16');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;

    // Rounded Card Shape
    ctx.beginPath();
    ctx.roundRect(15, 15, 720, 1170, 36);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d946ef';
    ctx.stroke();

    // 2. Top Header Banner
    const headerGradient = ctx.createLinearGradient(15, 15, 735, 190);
    headerGradient.addColorStop(0, '#7c3aed');
    headerGradient.addColorStop(0.5, '#c026d3');
    headerGradient.addColorStop(1, '#ec4899');
    ctx.fillStyle = headerGradient;
    ctx.beginPath();
    ctx.roundRect(15, 15, 720, 190, [36, 36, 0, 0]);
    ctx.fill();

    // Top Header Text
    ctx.fillStyle = '#fae8ff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ OFFICIAL VIP PASS ★', 375, 65);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 40px sans-serif';
    ctx.fillText('FRESHER PARTY 2K26', 375, 120);

    ctx.fillStyle = '#fbcfe8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('GRAND WELCOME BASH', 375, 160);

    // Perforation line
    ctx.strokeStyle = '#475569';
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(35, 230);
    ctx.lineTo(715, 230);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pass ID
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`PASS ID: ${student.id}`, 375, 275);

    // Student Full Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(student.fullName, 375, 325);

    // Roll / Enrollment No
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`Roll / Enroll: ${student.enrollmentNumber}`, 375, 370);

    // Department & Semester
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 20px sans-serif';
    ctx.fillText(`${student.department} · ${student.semester}`, 375, 410);

    // QR Code Container Box
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(165, 450, 420, 450, 24);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d946ef';
    ctx.stroke();

    // Draw QR Code inside box
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 195, 470, 360, 360);

      // Label below QR
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('⚡ Gate Entry QR Code', 375, 870);

      // Verification Badge Box
      ctx.fillStyle = student.isEntryVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(217, 70, 239, 0.2)';
      ctx.beginPath();
      ctx.roundRect(165, 930, 420, 60, 16);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = student.isEntryVerified ? '#10b981' : '#d946ef';
      ctx.stroke();

      ctx.fillStyle = student.isEntryVerified ? '#34d399' : '#f472b6';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(student.isEntryVerified ? '✓ ENTRY VERIFIED' : '★ VALID VIP PARTY PASS ★', 375, 968);

      // Event Details Box (Date set to 27/09/2026, no time)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(75, 1015, 600, 130, 20);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('📅 Date: 27/09/2026', 375, 1060);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('📍 Venue: Grand Campus Arena', 375, 1105);

      resolve(canvas.toDataURL('image/png', 1.0));
    };

    qrImg.onerror = () => {
      resolve(canvas.toDataURL('image/png', 1.0));
    };

    qrImg.src = qrDataUrl;
  });
}

export const DigitalEntryPass: React.FC<DigitalEntryPassProps> = ({
  student,
  onBack,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const passCardRef = useRef<HTMLDivElement>(null);

  // Generate QR Code data URL
  useEffect(() => {
    async function makeQR() {
      try {
        const payload = JSON.stringify({
          id: student.id,
          enrollment: student.enrollmentNumber,
          name: student.fullName,
          branch: student.department,
          sem: student.semester,
        });

        const url = await QRCode.toDataURL(payload, {
          width: 300,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    }
    makeQR();
  }, [student]);

  // Handle Download Pass as Image (Dual fallback: Pure Canvas + Direct Blob Download)
  const handleDownloadAsImage = async () => {
    if (isDownloading || !qrDataUrl) return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      // 1. Generate crisp high-resolution ticket PNG using Canvas
      const dataUrl = await generatePassDataUrl(student, qrDataUrl);
      const filename = `Fresher_Party_Pass_${student.enrollmentNumber}.png`;

      // 2. Convert DataURL to Blob for reliable mobile file handling
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      // 3. Try Web Share API with File (for Android / iOS native Save to Photos)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [new File([blob], filename, { type: 'image/png' })] })
      ) {
        try {
          const file = new File([blob], filename, { type: 'image/png' });
          await navigator.share({
            title: `Fresher Party Pass - ${student.fullName}`,
            text: `My VIP Entry Pass for Fresher Party 2K26 (Roll: ${student.enrollmentNumber})`,
            files: [file],
          });
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 4000);
          setIsDownloading(false);
          return;
        } catch (shareErr) {
          console.warn('Native share cancelled or not allowed, falling back to download:', shareErr);
        }
      }

      // 4. Standard Direct Download Anchor Trigger
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to download pass as image:', err);
      // Fallback: download QR code directly if canvas fails
      if (qrDataUrl) {
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `Fresher_Pass_QR_${student.enrollmentNumber}.png`;
        link.click();
        setDownloadSuccess(true);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      
      {/* Top action bar */}
      <div className="no-print mb-4 flex items-center justify-between">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-fuchsia-300 hover:text-white bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>New Registration</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer ml-auto"
        >
          <Printer className="h-3.5 w-3.5 text-slate-400" />
          <span>Print</span>
        </button>
      </div>

      {/* Download Alert */}
      {downloadSuccess && (
        <div className="no-print mb-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-3 text-xs text-emerald-300 flex items-center gap-2 shadow-lg shadow-emerald-500/10 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Pass saved to gallery successfully! 🎉</span>
        </div>
      )}

      {/* --- VIP PARTY ENTRY PASS CARD --- */}
      <div
        ref={passCardRef}
        className="relative rounded-3xl border-2 border-fuchsia-500/50 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-[0_0_40px_rgba(217,70,239,0.25)] overflow-hidden text-white"
      >
        {/* Top Hologram Neon Banner */}
        <div className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-5 py-4 text-white text-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] opacity-40" />
          <div className="relative">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-fuchsia-100 block drop-shadow-xs">
              ★ OFFICIAL VIP PASS ★
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5 drop-shadow-md">
              FRESHER PARTY 2K26
            </h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-violet-200 mt-0.5">
              Grand Welcome Bash
            </p>
          </div>
        </div>

        {/* Ticket Perforation Notches */}
        <div className="relative flex items-center justify-between px-3 py-1">
          <div className="w-4 h-4 rounded-full bg-slate-950 -ml-5 border-r border-fuchsia-500/40" />
          <div className="flex-1 border-b-2 border-dashed border-slate-700/80 mx-2" />
          <div className="w-4 h-4 rounded-full bg-slate-950 -mr-5 border-l border-fuchsia-500/40" />
        </div>

        {/* Pass Body */}
        <div className="p-5 space-y-4 text-center">
          {/* Student Info */}
          <div className="space-y-1 border-b border-slate-800 pb-3">
            <span className="text-[10px] font-mono text-fuchsia-400 font-bold uppercase tracking-wider block">
              PASS ID: {student.id}
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {student.fullName}
            </h3>
            <p className="text-xs font-mono font-bold text-violet-300">
              Roll / Enroll: {student.enrollmentNumber}
            </p>
            <p className="text-xs font-semibold text-slate-300 pt-0.5">
              {student.department} · {student.semester}
            </p>
          </div>

          {/* QR Code Card */}
          <div className="relative mx-auto max-w-[240px] p-3 rounded-2xl bg-white shadow-lg border-2 border-fuchsia-500/40">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Party Entry QR Code"
                className="h-48 w-48 mx-auto object-contain rounded-xl"
              />
            ) : (
              <div className="h-48 w-48 mx-auto flex items-center justify-center">
                <QrCode className="h-10 w-10 text-slate-400 animate-pulse" />
              </div>
            )}
            <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Gate Entry QR Code</span>
            </div>
          </div>

          {/* Verification Status */}
          <div
            className={`rounded-xl py-2 px-3 text-xs font-black uppercase tracking-wider border ${
              student.isEntryVerified
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40'
            }`}
          >
            {student.isEntryVerified ? '✓ Entry Verified' : '★ Valid Party Pass ★'}
          </div>

          {/* Event Details - Date set to 27/09/2026, time removed */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
              <span>📅 Date: 27/09/2026</span>
            </div>
            <p className="text-[11px] text-slate-400">
              📍 Venue: Grand Campus Arena
            </p>
          </div>
        </div>

        {/* Download Buttons Section */}
        <div className="no-print no-download p-4 bg-slate-900/90 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={handleDownloadAsImage}
            disabled={isDownloading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:brightness-110 active:scale-[0.99] py-3.5 px-4 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-lg shadow-fuchsia-500/25 disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating & Saving Pass...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Save Pass to Gallery / Share 🎉</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
