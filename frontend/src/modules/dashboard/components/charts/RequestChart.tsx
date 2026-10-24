import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import type { RequestStats } from "@/modules/dashboard/types/dashboard";

interface RequestChartProps {
  stats: RequestStats;
}

export default function RequestChart({ stats }: RequestChartProps) {
  const data = [
    { name: "Pending", value: stats.pending },
    { name: "In Progress", value: stats.in_progress },
    { name: "Resolved", value: stats.resolved },
    { name: "Rejected", value: stats.rejected },
  ];

  return (
    <div className="mt-2 h-[215px] w-full max-[600px]:h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "var(--chart-hover)" }}
            contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border-color)", borderRadius: 12, color: "var(--text-primary)" }}
            itemStyle={{ color: "var(--text-primary)" }}
          />
          <Bar dataKey="value" name="Requests" fill="#7950d8" radius={[7, 7, 0, 0]} maxBarSize={46} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
