import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleInfo, faCircleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "@/shared/i18n/I18nProvider";
import type { AppNotice } from "@/shared/feedback/notify";

const noticeStyles = {
  success: {
    icon: faCircleCheck,
    frame: "border-emerald-200 bg-white text-emerald-950 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-100",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    icon: faCircleExclamation,
    frame: "border-rose-200 bg-white text-rose-950 dark:border-rose-900 dark:bg-slate-950 dark:text-rose-100",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  info: {
    icon: faCircleInfo,
    frame: "border-violet-200 bg-white text-slate-900 dark:border-violet-900 dark:bg-slate-950 dark:text-slate-100",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
};

export default function NoticeViewport() {
  const [notices, setNotices] = useState<AppNotice[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    const handleNotice = (event: Event) => {
      const notice = (event as CustomEvent<AppNotice>).detail;
      setNotices((current) => [...current, notice].slice(-4));
    };

    window.addEventListener("school:notice", handleNotice);
    return () => window.removeEventListener("school:notice", handleNotice);
  }, []);

  useEffect(() => {
    if (!notices.length) return undefined;
    const timers = notices.map((notice) => window.setTimeout(() => {
      setNotices((current) => current.filter((item) => item.id !== notice.id));
    }, notice.tone === "error" ? 7000 : 4500));
    return () => timers.forEach(window.clearTimeout);
  }, [notices]);

  const dismiss = (id: number) => setNotices((current) => current.filter((notice) => notice.id !== id));

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2.5 max-[560px]:right-3 max-[560px]:top-[82px] max-[560px]:w-[calc(100vw-1.5rem)]" aria-live="polite" aria-relevant="additions">
      {notices.map((notice) => {
        const style = noticeStyles[notice.tone];
        return (
          <div key={notice.id} role={notice.tone === "error" ? "alert" : "status"} className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl shadow-black/10 ${style.frame}`}>
            <FontAwesomeIcon icon={style.icon} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
            <p className="m-0 min-w-0 flex-1 text-sm font-medium leading-5">{notice.message}</p>
            <button type="button" onClick={() => dismiss(notice.id)} aria-label={t("notice.dismiss")} className="grid size-6 shrink-0 place-items-center rounded-md text-current/60 transition hover:bg-black/5 hover:text-current dark:hover:bg-white/10">
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
