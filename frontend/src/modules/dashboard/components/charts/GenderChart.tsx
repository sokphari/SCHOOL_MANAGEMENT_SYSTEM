import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface GenderChartProps {
  male: number;
  female: number;
}

export default function GenderChart({ male, female }: GenderChartProps) {
  const data = [
    { name: "Male", value: male },
    { name: "Female", value: female },
  ];

  return (
    <div>
      <div className="mt-2 h-[205px] w-full max-[600px]:h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="47%"
              innerRadius={48}
              outerRadius={73}
              paddingAngle={4}
              stroke="none"
            >
              <Cell fill="#7950d8" />
              <Cell fill="#c4b5fd" />
            </Pie>
            <Tooltip
              contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border-color)", borderRadius: 12, color: "var(--text-primary)" }}
              itemStyle={{ color: "var(--text-primary)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-5 text-[11px] text-secondary">
        <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-violet-700" />Male</span>
        <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-violet-300" />Female</span>
      </div>
    </div>
  );
}
