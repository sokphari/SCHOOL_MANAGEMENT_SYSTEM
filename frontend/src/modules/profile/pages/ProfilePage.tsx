import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faEnvelope, faShieldHalved, faUser } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useI18n } from "@/shared/i18n/I18nProvider";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const name: string = user?.name || t("app.member");
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
  const isActive = user?.is_active !== false;

  const details = [
    { label: t("profile.name"), value: name, icon: faUser },
    { label: t("profile.email"), value: user?.email || "—", icon: faEnvelope },
    { label: t("profile.role"), value: t(`profile.role.${user?.role || "member"}`), icon: faShieldHalved },
    { label: t("profile.status"), value: t(isActive ? "profile.active" : "profile.inactive"), icon: faCircleCheck },
  ];

  return (
    <div className="space-y-5">
      <header>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">{t("profile.eyebrow")}</p>
        <h2 className="m-0 text-2xl font-bold tracking-tight text-primary">{t("profile.title")}</h2>
        <p className="mb-0 mt-1 text-sm text-secondary">{t("profile.description")}</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center gap-4 border-b border-border bg-brand-soft/30 px-5 py-5 sm:px-6">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-lg font-bold text-white shadow-sm">
            {initials || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="m-0 truncate text-lg font-bold text-primary">{name}</h3>
            <p className="mb-0 mt-1 truncate text-sm text-secondary">{user?.email || "—"}</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${isActive ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300"}`}>
            <span className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
            {t(isActive ? "profile.active" : "profile.inactive")}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <h4 className="mb-4 mt-0 text-sm font-semibold text-primary">{t("profile.accountDetails")}</h4>
          <dl className="m-0 grid gap-3 sm:grid-cols-2">
            {details.map((detail) => (
              <div key={detail.label} className="flex min-h-[76px] items-center gap-3 rounded-xl border border-border bg-app-bg/50 px-4 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <FontAwesomeIcon icon={detail.icon} className="text-sm" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">{detail.label}</dt>
                  <dd className="mb-0 mt-1 truncate text-sm font-semibold capitalize text-primary">{detail.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <aside className="flex gap-3 rounded-xl border border-brand/15 bg-brand-soft/30 p-4">
        <FontAwesomeIcon icon={faShieldHalved} className="mt-0.5 text-brand" />
        <div>
          <h4 className="m-0 text-sm font-semibold text-primary">{t("profile.accessTitle")}</h4>
          <p className="mb-0 mt-1 text-sm leading-6 text-secondary">{t("profile.accessDescription")}</p>
        </div>
      </aside>
    </div>
  );
}
