import { QRCodeCanvas } from "qrcode.react";
import AppButton from "./AppButton";

export default function StudentQrCard({ student, onClose }) {
  const appUrl = window.location.origin;
  const qrValue = `${appUrl}/request-scan?code=${student.student_code}`;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "24px",
        maxWidth: "420px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Student QR Card</h3>

      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <QRCodeCanvas value={qrValue} size={220} />
      </div>

      <p><strong>Name:</strong> {student.first_name} {student.last_name}</p>
      <p><strong>Code:</strong> {student.student_code}</p>
      <p
        style={{
          wordBreak: "break-all",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        {qrValue}
      </p>

      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
        <AppButton onClick={() => window.print()}>Print</AppButton>
        <AppButton onClick={onClose}>Close</AppButton>
      </div>
    </div>
  );
}