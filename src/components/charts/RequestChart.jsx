import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function RequestChart({ stats }) {
  const data = [
    { name: "Pending", value: stats.pending },
    { name: "In Progress", value: stats.in_progress },
    { name: "Resolved", value: stats.resolved },
    { name: "Rejected", value: stats.rejected },
  ];

  return (
    <div style={{ background: "#fff", padding: "16px", borderRadius: "12px" }}>
      <h4>Request Status</h4>

      <BarChart width={400} height={250} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" />
      </BarChart>
    </div>
  );
}