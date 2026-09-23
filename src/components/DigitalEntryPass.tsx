import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import {
  Download,
  Printer,
  CheckCircle2,
  QrCode,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { StudentRegistration } from '../types';

interface DigitalEntryPassProps {
  student: StudentRegistration;
  onBack?: () => void;
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
            dark: '#1e293b',
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

  // Handle Download Pass as Image via html2canvas
  const handleDownloadAsImage = async () => {
    if (!passCardRef.current || isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      await new Promise((res) => setTimeout(res, 80));

      const element = passCardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        ignoreElements: (el) => el.classList.contains('no-download'),
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Fresher_Pass_${student.enrollmentNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to download pass as image:', err);
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
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>New Registration</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer ml-auto"
        >
          <Printer className="h-3.5 w-3.5 text-slate-500" />
          <span>Print</span>
        </button>
      </div>

      {/* Download Alert */}
      {downloadSuccess && (
        <div className="no-print mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Pass downloaded to gallery successfully!</span>
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
                crossOrigin="anonymous"
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

        {/* Download Button */}
        <div className="no-print no-download p-4 bg-slate-900/90 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDownloadAsImage}
            disabled={isDownloading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:brightness-110 active:scale-[0.99] py-3 px-4 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-lg shadow-fuchsia-500/25 disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Downloading Pass...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Save Pass to Gallery</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
