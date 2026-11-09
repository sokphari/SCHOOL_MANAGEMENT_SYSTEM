import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AttendanceTrendPoint } from "@/modules/dashboard/types/dashboard";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface AttendanceTrendChartProps {
  data: AttendanceTrendPoint[];
}

export default function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  const { language, t } = useI18n();
  const formattedData = data.map((point) => ({
    ...point,
    label: new Date(`${point.date}T12:00:00`).toLocaleDateString(language === "km" ? "km-KH" : "en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="mt-3 h-[270px] w-full max-[600px]:h-[230px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={20} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={34} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <Tooltip
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? new Date(`${payload[0].payload.date}T12:00:00`).toLocaleDateString(language === "km" ? "km-KH" : "en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
            contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border-color)", borderRadius: 12, color: "var(--text-primary)" }}
            itemStyle={{ color: "var(--text-primary)" }}
          />
          <Line type="monotone" dataKey="present" name={t("dashboard.present")} stroke="#0f9f6e" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="absent" name={t("dashboard.absent")} stroke="#e11d48" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="late" name={t("dashboard.late")} stroke="#d97706" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="permission" name={t("dashboard.permission")} stroke="#7041c7" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
