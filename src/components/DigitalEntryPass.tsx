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
          errorCorrectionLevel: 'H',
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

      {/* --- CLEAN DIGITAL PASS CARD --- */}
      <div
        ref={passCardRef}
        className="rounded-2xl border-2 border-indigo-600 bg-white shadow-md overflow-hidden text-slate-900"
      >
        {/* Pass Header */}
        <div className="bg-indigo-600 px-5 py-4 text-white text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
            Annual Fresher Party 2k26
          </span>
          <h2 className="text-xl font-bold tracking-tight mt-0.5">
            Student Entry Pass
          </h2>
        </div>

        {/* Pass Body */}
        <div className="p-5 space-y-4 text-center">
          
          {/* Student Info */}
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase block">
              Pass ID: {student.id}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {student.fullName}
            </h3>
            <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
              Enrollment: {student.enrollmentNumber}
            </p>
            <p className="text-xs font-medium text-indigo-700 mt-1">
              {student.department} · {student.semester}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Entry QR Code"
                crossOrigin="anonymous"
                className="h-48 w-48 object-contain rounded-lg"
              />
            ) : (
              <div className="h-48 w-48 flex items-center justify-center">
                <QrCode className="h-10 w-10 text-slate-400 animate-pulse" />
              </div>
            )}
            <p className="mt-2 text-xs font-semibold text-slate-700">
              Scan at Entrance Gate
            </p>
          </div>

          {/* Status badge */}
          <div className={`rounded-lg py-1.5 px-3 text-xs font-semibold ${
            student.isEntryVerified
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}>
            {student.isEntryVerified ? '✓ Entry Verified' : '● Valid for Entry'}
          </div>

          {/* Event Details */}
          <div className="text-[11px] text-slate-500 pt-1">
            <p className="font-semibold text-slate-700">Oct 10, 2026 · 5:00 PM</p>
            <p>Grand Campus Arena</p>
          </div>

        </div>

        {/* Download Button */}
        <div className="no-print no-download p-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDownloadAsImage}
            disabled={isDownloading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2.5 px-4 text-sm font-semibold text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Downloading Image...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Pass as Image</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
