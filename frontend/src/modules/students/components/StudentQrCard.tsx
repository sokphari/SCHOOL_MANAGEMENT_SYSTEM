import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy, faGraduationCap, faPrint, faQrcode, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Student } from "@/modules/students/types/student";

interface StudentQrCardProps {
  student?: Student;
  registrationUrl?: string;
  expiresAt?: string;
  onClose: () => void;
}

export default function StudentQrCard({ student, registrationUrl, expiresAt, onClose }: StudentQrCardProps) {
  const [copied, setCopied] = useState(false);
  const qrValue = registrationUrl || (student ? `${window.location.origin}/request-scan?code=${encodeURIComponent(student.student_code)}` : "");
  const isRegistration = Boolean(registrationUrl);

  const copyUrl = async () => {
    if (!qrValue) return;
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // The QR itself remains scannable if clipboard access is unavailable.
    }
  };

  return (
    <section className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-border bg-surface text-primary shadow-2xl">
      <header className="flex items-start justify-between border-b border-border bg-brand-soft/50 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand text-white shadow-sm"><FontAwesomeIcon icon={isRegistration ? faQrcode : faGraduationCap} /></span>
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-brand">{isRegistration ? "Student enrollment" : "Student services"}</p>
            <h2 className="m-0 mt-0.5 text-lg font-bold">{isRegistration ? "Registration QR" : "Student QR card"}</h2>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close QR code" className="grid size-9 place-items-center rounded-lg border border-border bg-surface text-secondary transition hover:bg-brand-soft hover:text-primary"><FontAwesomeIcon icon={faXmark} /></button>
      </header>

      <div className="p-5 sm:p-6">
        <p className="mb-4 mt-0 text-center text-sm text-secondary">{isRegistration ? "Scan to open the student registration form. This QR can be used once." : "Scan to open student services and send a request."}</p>
        <div className="mx-auto grid w-fit place-items-center rounded-2xl border border-border bg-white p-4 shadow-sm">
          <QRCodeCanvas value={qrValue} size={220} includeMargin level="M" />
        </div>

        {student && <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-border bg-canvas p-4">
          <div className="col-span-2"><p className="m-0 text-[11px] font-medium text-muted">Student name</p><p className="mb-0 mt-1 text-sm font-semibold">{student.first_name} {student.last_name}</p></div>
          <div><p className="m-0 text-[11px] font-medium text-muted">Student code</p><p className="mb-0 mt-1 text-sm font-semibold text-brand">{student.student_code}</p></div>
          <div><p className="m-0 text-[11px] font-medium text-muted">Status</p><p className="mb-0 mt-1 text-sm font-semibold capitalize">{student.status}</p></div>
        </div>}

        {isRegistration && expiresAt && <p className="mb-0 mt-4 text-center text-xs text-secondary">Expires {new Date(expiresAt).toLocaleString()}</p>}
        <p className="mx-auto mb-0 mt-4 max-w-full break-all rounded-lg bg-canvas px-3 py-2 text-center text-[11px] text-muted">{qrValue}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-canvas">Close</button>
          <button type="button" onClick={() => void copyUrl()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-brand-soft"><FontAwesomeIcon icon={copied ? faCheck : faCopy} />{copied ? "Copied" : "Copy link"}</button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"><FontAwesomeIcon icon={faPrint} />Print QR</button>
        </div>
      </div>
    </section>
  );
}
