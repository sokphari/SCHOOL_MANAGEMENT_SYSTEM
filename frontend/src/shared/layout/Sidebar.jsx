import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAward,
  faBook,
  faBuilding,
  faCalendarCheck,
  faCalendarDays,
  faChalkboard,
  faChalkboardUser,
  faChevronDown,
  faClockRotateLeft,
  faGear,
  faGraduationCap,
  faInbox,
  faUserGraduate,
  faCircleUser,
  faGaugeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import menuItems from "@/shared/config/menu";
import { useI18n } from "@/shared/i18n/I18nProvider";

const menuIcons = {
  Dashboard: faGaugeHigh,
  Students: faUserGraduate,
  Teachers: faChalkboardUser,
  Classes: faChalkboard,
  Courses: faBook,
  Facilities: faBuilding,
  Attendance: faCalendarCheck,
  Timetable: faCalendarDays,
  Grades: faAward,
  Requests: faInbox,
  "Audit log": faClockRotateLeft,
  Settings: faGear,
  Profile: faCircleUser,
};

const expandableItems = new Set(["Students", "Teachers", "Classes", "Timetable", "Audit log"]);

export default function Sidebar({ isOpen, isCollapsed = false, onNavigate }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const landingFeature = {
    Dashboard: "dashboard.view",
    Attendance: "attendance.view",
    Students: "students.view_list",
    Classes: "classes.view_list",
    Timetable: "timetable.view",
    Grades: "grades.view_terms",
  };
  const filteredMenu = menuItems.filter((item) => item.roles.includes(user?.role)
    && (user?.role !== "teacher" || !item.module || user.module_permissions?.includes(item.module))
    && (user?.role !== "teacher" || !landingFeature[item.label] || user.feature_permissions?.includes(landingFeature[item.label])));
  const sections = [...new Set(filteredMenu.map((item) => item.section))];
  const activeGroups = {
    students: location.pathname.startsWith("/admin/students"),
    teachers: location.pathname.startsWith("/admin/teachers"),
    classes: location.pathname.startsWith("/admin/classes"),
    timetable: location.pathname.startsWith("/admin/timetable"),
    audit: location.pathname.startsWith("/admin/audit-logs"),
  };
  const [expandedGroups, setExpandedGroups] = useState({ students: false, teachers: false, classes: false, audit: false });
  const [collapsedActiveGroup, setCollapsedActiveGroup] = useState(null);

  const isGroupExpanded = (group) => activeGroups[group]
    ? collapsedActiveGroup !== group
    : expandedGroups[group];

  const toggleGroup = (group, expanded) => {
    if (activeGroups[group]) {
      setCollapsedActiveGroup(expanded ? group : null);
      return;
    }
    setExpandedGroups((current) => ({ ...current, [group]: !current[group] }));
  };

  const renderSubmenu = (item, group) => {
    const isAudit = item.label === "Audit log";
    const isTimetable = item.label === "Timetable";
    const createKey = { Students: "nav.createStudent", Teachers: "nav.createTeacher", Classes: "nav.createClass" }[item.label];
    const canCreateClass = item.label === "Classes" && user?.feature_permissions?.includes("classes.create");
    const hasCreateLink = item.label === "Teachers" || user?.role === "admin" || canCreateClass;
    const submenuId = `${item.label.toLowerCase().replaceAll(" ", "-")}-submenu`;
    const expanded = isGroupExpanded(group);

    return (
        <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="min-h-0 overflow-hidden">
            <div id={submenuId} className="ml-[19px] flex flex-col gap-1 border-l border-white/10 py-1 pl-3">
              {isTimetable ? (
                <>
                  <NavLink to={item.path} onClick={onNavigate} className={({ isActive }) => `rounded-lg px-3 py-2.5 text-[13px] no-underline transition-colors ${isActive && location.pathname === item.path ? "bg-white/10 font-semibold text-white" : "text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-ink"}`}>{t("nav.viewTimetable")}</NavLink>
                  {user?.role === "admin" && <NavLink to={`${item.path}/templates`} onClick={onNavigate} className={({ isActive }) => `rounded-lg px-3 py-2.5 text-[13px] no-underline transition-colors ${isActive ? "bg-white/10 font-semibold text-white" : "text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-ink"}`}>{t("nav.scheduleTemplates")}</NavLink>}
                </>
              ) : isAudit ? (
                <>
                  <NavLink to={`${item.path}/users`} onClick={onNavigate} className={({ isActive }) => `rounded-lg px-3 py-2.5 text-[13px] no-underline transition-colors ${isActive ? "bg-white/10 font-semibold text-white" : "text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-ink"}`}>{t("nav.usersAccount")}</NavLink>
                  <NavLink to={`${item.path}/roles`} onClick={onNavigate} className={({ isActive }) => `rounded-lg px-3 py-2.5 text-[13px] no-underline transition-colors ${isActive ? "bg-white/10 font-semibold text-white" : "text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-ink"}`}>{t("nav.rolesPermissions")}</NavLink>
                </>
              ) : hasCreateLink ? (
                <NavLink to={`${item.path}/create`} onClick={onNavigate} className={({ isActive }) => `rounded-lg px-3 py-2.5 text-[13px] no-underline transition-colors ${isActive ? "bg-white/10 font-semibold text-white" : "text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-ink"}`}>
                  {t(createKey)}
                </NavLink>
              ) : null}
            </div>
          </div>
        </div>
    );
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[288px] -translate-x-full flex-col border-r border-white/10 bg-sidebar-bg px-4 pb-4 pt-5 text-sidebar-ink shadow-2xl transition-[width,transform,padding] duration-200 lg:translate-x-0 ${isCollapsed ? "lg:w-[76px] lg:px-2" : ""} ${isOpen ? "translate-x-0" : ""}`}>
      <div className={`mb-4 flex items-center gap-3 border-b border-white/10 px-2 pb-5 ${isCollapsed ? "lg:justify-center lg:px-0" : ""}`}>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-300 to-violet-700 text-base text-white shadow-md shadow-violet-950/30">
          <FontAwesomeIcon icon={faGraduationCap} />
        </div>
        <div className={`min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
          <p className="m-0 truncate text-[15px] font-bold tracking-tight">{t("app.schoolManagement")}</p>
          <p className="mt-0.5 text-[11px] text-sidebar-muted">{t(user?.role === "teacher" ? "app.teacherWorkspace" : "app.adminWorkspace")}</p>
        </div>
      </div>

      <nav className={`sidebar-scrollbar flex-1 space-y-5 overflow-y-auto pb-3 ${isCollapsed ? "lg:space-y-3" : ""}`} aria-label="Main navigation">
        {sections.map((section) => (
          <section key={section} aria-label={section}>
            <p className={`mb-2 ml-2 px-1 text-[10px] font-bold uppercase tracking-[0.09em] text-sidebar-muted ${isCollapsed ? "lg:hidden" : ""}`}>{t(`nav.section.${section}`)}</p>
            <div className="space-y-0.5">
              {filteredMenu.filter((item) => item.section === section).map((item) => {
                const isExpandable = expandableItems.has(item.label);
                const group = item.label === "Audit log" ? "audit" : item.label.toLowerCase();
                const isActiveGroup = location.pathname.startsWith(item.path);

                if (isExpandable) {
                  const expanded = isGroupExpanded(group);
                  const submenuId = `${item.label.toLowerCase().replaceAll(" ", "-")}-submenu`;
                  return (
                    <div key={item.path}>
                      <div title={isCollapsed ? t(`nav.${item.label}`) : undefined} className={`group relative flex min-h-10 items-center rounded-lg border px-1 py-0.5 text-sm font-medium transition ${isCollapsed ? "lg:justify-center lg:px-0" : ""} ${isActiveGroup ? "border-violet-200/20 bg-sidebar-active text-white" : "border-transparent text-sidebar-muted hover:bg-white/[0.065] hover:text-sidebar-ink"}`}>
                        {isActiveGroup && <span className="absolute bottom-2 left-[-17px] top-2 w-[3px] rounded-r bg-violet-300" />}
                        <NavLink to={item.path} onClick={onNavigate} className={`flex min-h-9 min-w-0 flex-1 items-center gap-3 rounded-md px-2.5 text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${isCollapsed ? "lg:justify-center lg:px-0" : ""}`}>
                          <span className="grid w-5 shrink-0 place-items-center text-sm text-violet-200/80"><FontAwesomeIcon icon={menuIcons[item.label] || faGraduationCap} /></span>
                          <span className={`truncate ${isCollapsed ? "lg:hidden" : ""}`}>{t(`nav.${item.label}`)}</span>
                        </NavLink>
                        <button type="button" aria-label={t(expanded ? "nav.collapse" : "nav.expand", { item: t(`nav.${item.label}`) })} aria-expanded={expanded} aria-controls={submenuId} onClick={() => toggleGroup(group, expanded)} className={`grid size-8 shrink-0 place-items-center rounded-md border-0 bg-transparent text-sidebar-muted transition hover:bg-white/10 hover:text-sidebar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${isCollapsed ? "lg:hidden" : ""}`}>
                          <FontAwesomeIcon className={`text-[9px] transition-transform ${expanded ? "rotate-180" : ""}`} icon={faChevronDown} />
                        </button>
                      </div>
                      <div className={isCollapsed ? "lg:hidden" : ""}>{renderSubmenu(item, group)}</div>
                    </div>
                  );
                }

                return (
                  <NavLink key={item.path} title={isCollapsed ? t(`nav.${item.label}`) : undefined} to={item.path} onClick={onNavigate} className={({ isActive }) => `group relative flex min-h-10 items-center gap-3 rounded-lg border px-3.5 text-sm font-medium no-underline transition ${isCollapsed ? "lg:justify-center lg:px-0" : ""} ${isActive ? "border-violet-200/20 bg-sidebar-active text-white" : "border-transparent text-sidebar-muted hover:bg-white/[0.065] hover:text-sidebar-ink"}`}>
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute bottom-2 left-[-17px] top-2 w-[3px] rounded-r bg-violet-300" />}
                        <span className={`grid w-5 place-items-center text-sm ${isActive ? "text-violet-200" : "text-violet-200/70"}`}><FontAwesomeIcon icon={menuIcons[item.label] || faGraduationCap} /></span>
                        <span className={isCollapsed ? "lg:hidden" : ""}>{t(`nav.${item.label}`)}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

    </aside>
  );
}
