import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBookOpen,
  faCalendarCheck,
  faChalkboardUser,
  faChevronDown,
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
  const location = useLocation();
  const filteredMenu = menuItems.filter((item) => item.roles.includes(user?.role));
  const [studentsExpanded, setStudentsExpanded] = useState(
    location.pathname.startsWith("/admin/students")
  );
  const [teachersExpanded, setTeachersExpanded] = useState(
    location.pathname.startsWith("/admin/teachers")
  );
  const [classesExpanded, setClassesExpanded] = useState(
    location.pathname.startsWith("/admin/classes")
  );

  useEffect(() => {
    if (location.pathname.startsWith("/admin/students")) {
      setStudentsExpanded(true);
    }
    if (location.pathname.startsWith("/admin/teachers")) {
      setTeachersExpanded(true);
    }
    if (location.pathname.startsWith("/admin/classes")) {
      setClassesExpanded(true);
    }
  }, [location.pathname]);

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
        {filteredMenu.map((item) => {
          const isStudents = item.label === "Students";
          const isTeachers = item.label === "Teachers";
          const isClasses = item.label === "Classes";
          if (isStudents || isTeachers || isClasses) {
            const expanded = isStudents ? studentsExpanded : isTeachers ? teachersExpanded : classesExpanded;
            const setExpanded = isStudents ? setStudentsExpanded : isTeachers ? setTeachersExpanded : setClassesExpanded;
            const isActiveGroup = location.pathname.startsWith(item.path);
            const submenuId = `${item.label.toLowerCase()}-submenu`;
            const createLabel = isTeachers ? "Teacher" : isClasses ? "Class" : "Student";

            return (
            <div key={item.path}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={submenuId}
                onClick={() => setExpanded((isExpanded) => !isExpanded)}
                className={`group relative my-[3px] flex min-h-[46px] w-full items-center gap-3 rounded-xl border px-3 text-left text-[13px] font-medium transition ${isActiveGroup ? "border-violet-200/20 bg-sidebar-active text-white" : "border-transparent text-sidebar-muted hover:bg-white/[0.065] hover:text-sidebar-ink"}`}
              >
                {isActiveGroup && <span className="absolute bottom-2.5 left-[-19px] top-2.5 w-[3px] rounded-r bg-violet-300" />}
                <span className="grid w-5 place-items-center text-sm text-violet-200/80">
                  <FontAwesomeIcon icon={menuIcons[item.label] || faGraduationCap} />
                </span>
                <span>{item.label}</span>
                <FontAwesomeIcon
                  className={`ml-auto text-[10px] text-sidebar-muted transition-transform duration-300 ease-in-out ${expanded ? "rotate-180" : ""}`}
                  icon={faChevronDown}
                />
              </button>

              <div
                id={submenuId}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="ml-6 flex flex-col gap-1 border-l border-white/10 py-1 pl-3">
                    <NavLink
                      to={item.path}
                      onClick={onNavigate}
                      end
                      className={({ isActive }) => `rounded-lg px-3 py-2.5 text-xs no-underline transition-colors duration-200 ${isActive ? "bg-white/10 font-semibold text-white" : "text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-ink"}`}
                    >
                      View {item.label}
                    </NavLink>
                    {(isTeachers || user?.role === "admin") && (
                      <NavLink
                        to={`${item.path}/create`}
                        onClick={onNavigate}
                        className={({ isActive }) => `rounded-lg px-3 py-2.5 text-xs no-underline transition-colors duration-200 ${isActive ? "bg-white/10 font-semibold text-white" : "text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-ink"}`}
                      >
                        Create {createLabel}
                      </NavLink>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          }

          return (
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
                </>
              )}
            </NavLink>
          );
        })}
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
