import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faCalendarCheck,
  faChalkboardUser,
  faPerson,
  faPersonDress,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { getDashboard } from "@/modules/dashboard/api/dashboardApi";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import GenderChart from "@/modules/dashboard/components/charts/GenderChart";
import RequestChart from "@/modules/dashboard/components/charts/RequestChart";
import type { ApiErrorResponse, DashboardData } from "@/modules/dashboard/types/dashboard";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface Metric {
  label: string;
  value: number;
  caption: string;
  icon: IconDefinition;
  tone: "purple" | "blue" | "rose" | "amber" | "teal";
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
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const response = await getDashboard();
      setData(response.data);
    } catch (requestError: unknown) {
      console.error(requestError);
      const message = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data?.message
        : undefined;
      setError(message || t("dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        { label: t("dashboard.students"), value: data.total_students, caption: t("dashboard.enrolledLearners"), icon: faUsers, tone: "purple" },
        { label: t("dashboard.teachers"), value: data.total_teachers, caption: t("dashboard.teachingStaff"), icon: faChalkboardUser, tone: "blue" },
        { label: t("dashboard.classes"), value: data.total_classes, caption: t("dashboard.activeGroups"), icon: faBookOpen, tone: "teal" },
        { label: t("dashboard.attendanceToday"), value: data.today_attendance, caption: t("dashboard.recordsToday"), icon: faCalendarCheck, tone: "rose" },
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
        <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
          <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-card max-[600px]:p-3.5">
            <PanelHeading eyebrow={t("dashboard.genderProfile")} title={t("dashboard.genderDistribution")} badge={t("dashboard.students")} />
            <GenderChart male={data.male_students} female={data.female_students} />
          </section>
          <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-card max-[600px]:p-3.5">
            <PanelHeading eyebrow={t("dashboard.inboxOverview")} title={t("dashboard.studentRequests")} badge={t("dashboard.byStatus")} />
            <RequestChart stats={data.request_stats} />
          </section>
        </div>
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
  const { t } = useI18n();
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-surface p-3.5 shadow-card max-[600px]:rounded-[14px] max-[600px]:p-3">
      <div className="flex items-center justify-between">
        <span className={`grid size-[34px] place-items-center rounded-xl text-sm max-[600px]:size-8 ${metricToneClasses[metric.tone]}`}>
          <FontAwesomeIcon icon={metric.icon} />
        </span>
        <span className={`grid size-[23px] place-items-center rounded-full text-[13px] ${metricToneClasses[metric.tone]}`} aria-label={t("dashboard.currentTotal")}>↗</span>
      </div>
      <p className="mb-1 mt-3 text-xs font-semibold text-secondary max-[600px]:mt-2.5">{metric.label}</p>
      <strong className="block text-[26px] font-bold leading-[1.15] tracking-tight text-primary max-[600px]:text-[23px]">
        {metric.value.toLocaleString()}
      </strong>
      <p className="mb-0 mt-1 text-[11px] text-muted max-[600px]:min-h-6 max-[600px]:text-[10px]">{metric.caption}</p>
    </article>
  );
}
