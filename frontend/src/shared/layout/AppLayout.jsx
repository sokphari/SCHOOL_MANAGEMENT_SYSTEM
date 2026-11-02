import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket, faBars, faChevronDown, faMoon, faSun, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import NotificationBell from "@/modules/student-requests/components/NotificationBell";
import Sidebar from "@/shared/layout/Sidebar";
import { useI18n } from "@/shared/i18n/I18nProvider";
import LanguageSwitcher from "@/shared/i18n/LanguageSwitcher";

const THEME_STORAGE_KEY = "school-management-theme";

function getInitialTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { language, t } = useI18n();
  const [theme, setTheme] = useState(getInitialTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const initials = user?.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === "light" ? "dark" : "light");
  };

  return (
    <div className="admin-shell min-h-screen bg-app-bg text-primary transition-colors duration-200" data-theme={theme}>
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 border-0 bg-black/55 backdrop-blur-sm lg:hidden"
          type="button"
          aria-label={t("app.closeNavigation")}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen min-w-0 flex-col lg:ml-[288px]">
        <header className="sticky top-0 z-20 flex min-h-[82px] items-center justify-between gap-5 border-b border-border bg-surface px-[clamp(18px,2.3vw,32px)] py-3 max-[560px]:min-h-[72px] max-[560px]:gap-2 max-[560px]:px-3.5 max-[560px]:py-2.5">
          <div className="flex items-center gap-3">
            <button
              className="grid size-[38px] shrink-0 place-items-center rounded-xl border border-border bg-surface text-secondary transition hover:border-transparent hover:bg-brand-soft hover:text-brand-strong lg:hidden max-[560px]:size-[35px]"
              type="button"
              aria-label={sidebarOpen ? t("app.closeNavigation") : t("app.openNavigation")}
              onClick={() => setSidebarOpen((isOpen) => !isOpen)}
            >
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div>
              <p className="mb-1 text-[9px] font-bold tracking-[1.35px] text-brand max-[560px]:hidden">{t("app.schoolManagement")}</p>
              <h1 className="m-0 text-base font-bold tracking-tight text-primary max-[560px]:text-sm">{t("app.schoolDashboard")}</h1>
              <p className="mt-[3px] text-[11px] text-muted max-[560px]:hidden">
                {new Date().toLocaleDateString(language === "km" ? "km-KH" : "en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-[13px] max-[560px]:gap-[7px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-[11px] py-2 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300 max-[560px]:hidden">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(85,214,160,0.12)]" />
              {t("app.live")}
            </span>
            {user?.role === "admin" && <NotificationBell />}
            <LanguageSwitcher />
            <button
              className="grid size-[38px] shrink-0 place-items-center rounded-xl border border-border bg-surface text-secondary transition hover:border-transparent hover:bg-brand-soft hover:text-brand-strong max-[560px]:size-[35px]"
              type="button"
              aria-label={t(theme === "light" ? "app.switchToDark" : "app.switchToLight")}
              title={t(theme === "light" ? "app.switchToDark" : "app.switchToLight")}
              onClick={toggleTheme}
            >
              <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
            </button>
            <div className="relative ml-1 border-l border-border pl-3 max-[640px]:border-0 max-[640px]:pl-0" ref={profileMenuRef}>
              <button
                ref={profileButtonRef}
                type="button"
                aria-label={t("app.profileMenu")}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-2.5 rounded-xl border border-transparent bg-transparent px-1.5 py-1 text-left transition hover:border-border hover:bg-app-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand max-[560px]:size-[35px]">{initials}</span>
                <span className="max-[640px]:hidden">
                  <span className="block max-w-[150px] truncate text-xs font-semibold text-primary">{user?.name || "School user"}</span>
                  <span className="mt-1 block text-[9px] uppercase tracking-[0.8px] text-muted">{user?.role || "Member"}</span>
                </span>
                <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] text-muted transition-transform max-[640px]:hidden ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div role="menu" aria-label="Profile options" className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-xl shadow-black/20">
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="m-0 truncate text-sm font-semibold text-primary">{user?.name || "School user"}</p>
                    <p className="mb-0 mt-1 text-[10px] uppercase tracking-wide text-muted">{user?.role || t("app.member")} {t("app.account")}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logout}
                    className="mt-1 flex min-h-10 w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-300"
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} />
                    <span>{t("app.signOut")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="w-full flex-1 px-[clamp(18px,2.3vw,32px)] py-[clamp(18px,2vw,28px)] pb-8 max-[560px]:px-3.5 max-[560px]:py-[18px] max-[560px]:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
