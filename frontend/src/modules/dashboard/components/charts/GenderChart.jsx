import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function GenderChart({ male, female }) {
  const data = [
    { name: "Male", value: male },
    { name: "Female", value: female },
  ];

  return (
    <div style={{ background: "#fff", padding: "16px", borderRadius: "12px" }}>
      <h4>Student Gender</h4>

      <PieChart width={300} height={250}>
        <Pie
          data={data}
          dataKey="value"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          <Cell />
          <Cell />
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}