import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faMoon, faSun, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import NotificationBell from "@/modules/student-requests/components/NotificationBell";
import Sidebar from "@/shared/layout/Sidebar";

const THEME_STORAGE_KEY = "school-management-theme";

function getInitialTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export default function AppLayout() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(getInitialTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen min-w-0 flex-col lg:ml-[288px]">
        <header className="sticky top-0 z-20 flex min-h-[82px] items-center justify-between gap-5 border-b border-border bg-surface px-[clamp(18px,2.3vw,32px)] py-3 max-[560px]:min-h-[72px] max-[560px]:gap-2 max-[560px]:px-3.5 max-[560px]:py-2.5">
          <div className="flex items-center gap-3">
            <button
              className="grid size-[38px] shrink-0 place-items-center rounded-xl border border-border bg-surface text-secondary transition hover:border-transparent hover:bg-brand-soft hover:text-brand-strong lg:hidden max-[560px]:size-[35px]"
              type="button"
              aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setSidebarOpen((isOpen) => !isOpen)}
            >
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
            </button>
            <div>
              <p className="mb-1 text-[9px] font-bold tracking-[1.35px] text-brand max-[560px]:hidden">SCHOOL MANAGEMENT</p>
              <h1 className="m-0 text-base font-bold tracking-tight text-primary max-[560px]:text-sm">School dashboard</h1>
              <p className="mt-[3px] text-[11px] text-muted max-[560px]:hidden">
                {new Date().toLocaleDateString("en-US", {
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
              Live
            </span>
            {user?.role === "admin" && <NotificationBell />}
            <button
              className="grid size-[38px] shrink-0 place-items-center rounded-xl border border-border bg-surface text-secondary transition hover:border-transparent hover:bg-brand-soft hover:text-brand-strong max-[560px]:size-[35px]"
              type="button"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={toggleTheme}
            >
              <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
            </button>
            <div className="ml-1 flex items-center gap-2.5 border-l border-border pl-3 max-[640px]:border-0 max-[640px]:pl-0" aria-label="Signed in user">
              <div className="grid size-[38px] shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand max-[560px]:size-[35px]">
                {initials}
              </div>
              <div className="max-[640px]:hidden">
                <p className="max-w-[150px] truncate text-xs font-semibold text-primary">{user?.name || "School user"}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.8px] text-muted">{user?.role || "Member"}</p>
              </div>
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
