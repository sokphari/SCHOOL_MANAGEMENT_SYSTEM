import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faCalendarCheck,
  faChalkboardUser,
  faChevronRight,
  faClipboardCheck,
  faPlus,
  faTableList,
  faPerson,
  faPersonDress,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { getDashboard } from "@/modules/dashboard/api/dashboardApi";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { Link } from "react-router-dom";
import AttendanceTrendChart from "@/modules/dashboard/components/charts/AttendanceTrendChart";
import type { ApiErrorResponse, DashboardData } from "@/modules/dashboard/types/dashboard";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface Metric {
  label: string;
  value: number;
  caption: string;
  icon: IconDefinition;
  tone: "purple" | "blue" | "rose" | "amber" | "teal";
}

function toLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfCurrentWeek(): string {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toLocalDateInput(date);
}

const metricToneClasses: Record<Metric["tone"], string> = {
  purple: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { language, t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(startOfCurrentWeek);
  const [toDate, setToDate] = useState(() => toLocalDateInput(new Date()));
  const hasLoaded = useRef(false);

  const fetchDashboard = useCallback(async (): Promise<void> => {
    try {
      if (!hasLoaded.current) setLoading(true);
      else setRefreshing(true);
      setError("");
      const response = await getDashboard({ from_date: fromDate, to_date: toDate });
      setData(response.data);
      hasLoaded.current = true;
    } catch (requestError: unknown) {
      console.error(requestError);
      const message = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data?.message
        : undefined;
      setError(message || t("dashboard.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fromDate, toDate, t]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <section className="grid min-h-[260px] content-center justify-items-center gap-3 text-secondary" aria-live="polite">
        <div className="size-[31px] animate-spin rounded-full border-[3px] border-border border-t-brand" />
        <p className="text-xs">{t("dashboard.loading")}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="grid min-h-[260px] content-center justify-items-center gap-3 text-center" role="alert">
        <div className="grid size-9 place-items-center rounded-full bg-rose-50 font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">!</div>
        <h2 className="m-0 text-lg font-semibold text-primary">{t("dashboard.unavailable")}</h2>
        <p className="text-xs text-secondary">{error}</p>
        <button className="mt-1 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-strong" type="button" onClick={() => void fetchDashboard()}>
          {t("dashboard.tryAgain")}
        </button>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="grid min-h-[260px] content-center justify-items-center gap-3 text-secondary">
        <h2 className="m-0 text-lg font-semibold text-primary">{t("dashboard.noData")}</h2>
        <p className="text-xs">{t("dashboard.noSummary")}</p>
      </section>
    );
  }

  const metrics: Metric[] = data.role === "admin"
    ? [
        { label: t("dashboard.students"), value: data.total_students, caption: "", icon: faUsers, tone: "purple" },
        { label: t("dashboard.teachers"), value: data.total_teachers, caption: "", icon: faChalkboardUser, tone: "blue" },
        { label: t("dashboard.classes"), value: data.total_classes, caption: "", icon: faBookOpen, tone: "teal" },
        { label: t("dashboard.presentToday"), value: data.today_present, caption: "", icon: faCalendarCheck, tone: "rose" },
      ]
    : [
        { label: t("dashboard.myClasses"), value: data.my_classes.length, caption: t("dashboard.assignedClasses"), icon: faBookOpen, tone: "purple" },
        { label: t("dashboard.myStudents"), value: data.total_students, caption: t("dashboard.acrossClasses"), icon: faUsers, tone: "blue" },
        { label: t("dashboard.attendanceToday"), value: data.today_attendance, caption: t("dashboard.recordsToday"), icon: faCalendarCheck, tone: "teal" },
        { label: t("dashboard.maleStudents"), value: data.male_students, caption: t("dashboard.inYourClasses"), icon: faPerson, tone: "amber" },
        { label: t("dashboard.femaleStudents"), value: data.female_students, caption: t("dashboard.inYourClasses"), icon: faPersonDress, tone: "rose" },
      ];

  const currentHour = new Date().getHours();
  const greeting = t(currentHour < 12 ? "dashboard.goodMorning" : currentHour < 18 ? "dashboard.goodAfternoon" : "dashboard.goodEvening");

  return (
    <section className="grid gap-5 text-primary max-[600px]:gap-4">
      <div className="flex items-end justify-between gap-5 max-[600px]:items-start">
        <div>
          <p className="mb-1.5 text-[10px] font-bold tracking-[1.1px] text-brand">{t("dashboard.overview")}</p>
          <h2 className="m-0 text-[clamp(25px,2.6vw,30px)] font-bold leading-tight tracking-[-1px] text-primary">
            {greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="mt-1.5 text-sm text-secondary max-[370px]:max-w-[180px]">{t("dashboard.intro")}</p>
        </div>
        <div className="flex min-w-[150px] items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-card max-[600px]:min-w-0 max-[600px]:p-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-xs text-brand max-[600px]:size-[30px]">
            <FontAwesomeIcon icon={faCalendarCheck} />
          </span>
          <span>
            <small className="mb-[3px] block text-[9px] font-bold tracking-[1px] text-muted max-[600px]:hidden">{t("dashboard.today")}</small>
            <strong className="block text-xs font-semibold text-primary max-[600px]:text-[10px]">
              {new Date().toLocaleDateString(language === "km" ? "km-KH" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
            </strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3 max-[600px]:grid-cols-2 max-[600px]:gap-2" aria-label={t("app.schoolDashboard")}>
        {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </div>

      {data.role === "admin" ? (
        <>
        <div className="grid grid-cols-2 items-stretch gap-3 max-[900px]:grid-cols-1">
          <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-card max-[600px]:p-3.5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <PanelHeading eyebrow={t("dashboard.dailyOverview")} title={t("dashboard.attendanceOverview")} badge={refreshing ? t("dashboard.updating") : t("dashboard.thisWeek")} />
              <div className="flex flex-wrap items-end gap-2">
                <label className="grid gap-1 text-[10px] font-semibold text-secondary">
                  {t("dashboard.from")}
                  <input aria-label={t("dashboard.from")} type="date" max={toDate} value={fromDate} onChange={(event) => setFromDate(event.currentTarget.value)} className="rounded-lg border border-border bg-app-bg px-2.5 py-2 text-xs text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
                </label>
                <label className="grid gap-1 text-[10px] font-semibold text-secondary">
                  {t("dashboard.to")}
                  <input aria-label={t("dashboard.to")} type="date" min={fromDate} max={toLocalDateInput(new Date())} value={toDate} onChange={(event) => setToDate(event.currentTarget.value)} className="rounded-lg border border-border bg-app-bg px-2.5 py-2 text-xs text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
                </label>
              </div>
            </div>
            {data.attendance_trend.length ? <AttendanceTrendChart data={data.attendance_trend} /> : <div className="mt-3 grid h-[230px] place-items-center rounded-xl border border-dashed border-border text-sm text-muted">{t("dashboard.noAttendanceTrend")}</div>}
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-secondary">
              <TrendLegend color="bg-emerald-600" label={t("dashboard.present")} />
              <TrendLegend color="bg-rose-600" label={t("dashboard.absent")} />
              <TrendLegend color="bg-amber-600" label={t("dashboard.late")} />
              <TrendLegend color="bg-violet-700" label={t("dashboard.permission")} />
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-4 shadow-card max-[600px]:p-3.5">
            <h3 className="mb-3 mt-0 text-base font-semibold tracking-tight text-primary">{t("dashboard.quickActions")}</h3>
            <div className="divide-y divide-border">
              <QuickAction to="/admin/students/create" label={t("dashboard.registerStudent")} icon={faPlus} />
              <QuickAction to="/admin/teachers/create" label={t("dashboard.addTeacher")} icon={faPlus} />
              <QuickAction to="/admin/classes/create" label={t("dashboard.createClass")} icon={faPlus} />
              <QuickAction to="/admin/timetable" label={t("dashboard.manageTimetable")} icon={faTableList} />
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-4 shadow-card max-[600px]:p-3.5">
          <div className="mb-1 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faClipboardCheck} /></span>
            <h3 className="m-0 text-base font-semibold tracking-tight text-primary">{t("dashboard.recentActivity")}</h3>
          </div>
          <p className="mb-0 mt-2 text-sm text-secondary">{t("dashboard.recentActivityEmpty")}</p>
        </section>
        </>
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-card max-[600px]:p-3.5">
          <PanelHeading eyebrow={t("dashboard.yourTeaching")} title={t("dashboard.myClasses")} badge={t("dashboard.assigned", { count: data.my_classes.length })} />
          {data.my_classes.length > 0 ? (
            <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2.5">
              {data.my_classes.map((schoolClass) => (
                <article className="flex min-w-0 items-center gap-[11px] rounded-[13px] border border-border bg-app-bg p-[13px] transition hover:-translate-y-px hover:border-brand" key={schoolClass.id}>
                  <span className="grid size-[35px] shrink-0 place-items-center rounded-[11px] bg-brand-soft text-[13px] text-brand">
                    <FontAwesomeIcon icon={faBookOpen} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-[11px] font-semibold text-primary">{schoolClass.name}</strong>
                    <small className="mt-1 block truncate text-[9px] text-muted">
                      {schoolClass.section ? t("dashboard.section", { section: schoolClass.section }) : t("dashboard.classGroup")}
                    </small>
                  </span>
                  <span className="text-[19px] text-muted">›</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-[13px] border border-dashed border-border bg-app-bg px-4 py-5 text-center text-sm text-secondary">
              {t("dashboard.noClasses")}
            </div>
          )}
        </section>
      )}
    </section>
  );
}

function TrendLegend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-2"><span className={`size-2.5 rounded-full ${color}`} />{label}</span>;
}

function QuickAction({ to, label, icon }: { to: string; label: string; icon: IconDefinition }) {
  return (
    <Link to={to} className="flex min-h-10 items-center justify-between gap-3 py-2.5 text-sm text-primary no-underline transition hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
      <span className="flex items-center gap-2.5"><FontAwesomeIcon icon={icon} className="w-4 text-brand" />{label}</span>
      <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted" />
    </Link>
  );
}

function PanelHeading({ eyebrow, title, badge }: { eyebrow: string; title: string; badge: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="mb-1 text-[9px] font-bold tracking-[1.1px] text-brand">{eyebrow}</p>
        <h3 className="m-0 text-base font-semibold tracking-tight text-primary">{title}</h3>
      </div>
      <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1.5 text-[10px] font-semibold text-brand max-[370px]:hidden">{badge}</span>
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-surface p-3.5 shadow-card max-[600px]:rounded-[14px] max-[600px]:p-3">
      <div>
        <span className={`grid size-[34px] place-items-center rounded-xl text-sm max-[600px]:size-8 ${metricToneClasses[metric.tone]}`}>
          <FontAwesomeIcon icon={metric.icon} />
        </span>
      </div>
      <strong className="mb-1 mt-3 block text-[26px] font-bold leading-[1.15] tracking-tight text-primary max-[600px]:text-[23px]">
        {metric.value.toLocaleString()}
      </strong>
      <p className="mb-0 text-[11px] text-secondary max-[600px]:text-[10px]">{metric.label}</p>
      {metric.caption && <p className="mb-0 mt-1 text-[10px] text-muted">{metric.caption}</p>}
    </article>
  );
}
