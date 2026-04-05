export default function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        minHeight: "110px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          color: "#6b7280",
        }}
      >
        {title}
      </p>

      <h3
        style={{
          marginTop: "12px",
          marginBottom: 0,
          fontSize: "28px",
          fontWeight: "700",
          color: "#111827",
        }}
      >
        {value}
      </h3>
    </div>
  );
}