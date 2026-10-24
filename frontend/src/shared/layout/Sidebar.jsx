import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBookOpen,
  faCalendarCheck,
  faChalkboardUser,
  faChartPie,
  faClipboardList,
  faGear,
  faGraduationCap,
  faSchool,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/modules/auth/context/AuthContext";
import menuItems from "@/shared/config/menu";

const menuIcons = {
  Dashboard: faChartPie,
  Students: faUsers,
  Teachers: faChalkboardUser,
  Classes: faBookOpen,
  Attendance: faCalendarCheck,
  Requests: faClipboardList,
  Settings: faGear,
};

export default function Sidebar({ isOpen, onNavigate }) {
  const { user, logout } = useAuth();
  const filteredMenu = menuItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] -translate-x-full flex-col border-r border-white/10 bg-sidebar-bg px-[18px] pb-[18px] pt-[26px] text-sidebar-ink shadow-2xl transition-transform duration-200 lg:translate-x-0 ${isOpen ? "translate-x-0" : ""}`}>
      <div className="flex items-center gap-3 px-2 pb-6">
        <div className="grid size-[42px] shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-violet-300 to-violet-700 text-white shadow-lg shadow-violet-950/30">
          <FontAwesomeIcon icon={faSchool} />
        </div>
        <div>
          <p className="m-0 text-base font-bold tracking-tight">Campusly</p>
          <p className="mt-[3px] text-[11px] text-sidebar-muted">School management</p>
        </div>
      </div>

      <nav className="mt-5 flex-1 overflow-auto" aria-label="Main navigation">
        <p className="mb-[11px] ml-2.5 text-[10px] font-bold uppercase tracking-[1.15px] text-sidebar-muted">Workspace</p>
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) => `group relative my-[3px] flex min-h-[46px] items-center gap-3 rounded-xl border px-3 text-[13px] font-medium no-underline transition ${isActive ? "border-violet-200/20 bg-sidebar-active text-white" : "border-transparent text-sidebar-muted hover:bg-white/[0.065] hover:text-sidebar-ink"}`}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute bottom-2.5 left-[-19px] top-2.5 w-[3px] rounded-r bg-violet-300" />}
                <span className={`grid w-5 place-items-center text-sm ${isActive ? "text-violet-200" : "text-violet-200/70"}`}>
                  <FontAwesomeIcon icon={menuIcons[item.label] || faGraduationCap} />
                </span>
                <span>{item.label}</span>
                {item.label === "Classes" && <span className="ml-auto text-xl leading-none text-sidebar-muted">›</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 pt-4">
        <button
          className="flex min-h-[42px] w-full items-center gap-3 rounded-xl border border-transparent px-3 text-left text-xs font-medium text-violet-100/80 transition hover:bg-rose-400/10 hover:text-white"
          type="button"
          onClick={logout}
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
