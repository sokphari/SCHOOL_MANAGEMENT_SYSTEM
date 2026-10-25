import { QRCodeCanvas } from "qrcode.react";
import AppButton from "@/shared/components/AppButton.tsx";
import type { Student } from "@/modules/students/types/student";

interface StudentQrCardProps {
  student: Student;
  onClose: () => void;
}

export default function StudentQrCard({ student, onClose }: StudentQrCardProps) {
  const qrValue = `${window.location.origin}/request-scan?code=${encodeURIComponent(student.student_code)}`;

  return (
    <div className="max-w-[420px] rounded-xl border border-border bg-surface p-6 text-primary shadow-2xl">
      <h3 className="mt-0">Student QR Card</h3>
      <div className="mb-4 text-center"><QRCodeCanvas value={qrValue} size={220} /></div>
      <p><strong>Name:</strong> {student.first_name} {student.last_name}</p>
      <p><strong>Code:</strong> {student.student_code}</p>
      <p className="break-all text-xs text-secondary">{qrValue}</p>
      <div className="mt-4 flex gap-2">
        <AppButton onClick={() => window.print()}>Print</AppButton>
        <AppButton onClick={onClose}>Close</AppButton>
      </div>
    </div>
  );
}
