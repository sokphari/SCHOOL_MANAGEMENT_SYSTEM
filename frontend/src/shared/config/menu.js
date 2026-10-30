const menuItems = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    module: "dashboard",
    section: "Overview",
    roles: ["admin", "teacher"],
  },
  {
    label: "Students",
    path: "/admin/students",
    module: "students",
    section: "Academic management",
    roles: ["admin", "teacher"],
  },
  {
    label: "Courses",
    path: "/admin/courses",
    section: "Academic management",
    roles: ["admin"],
  },
  {
    label: "Classes",
    path: "/admin/classes",
    module: "classes",
    section: "Academic management",
    roles: ["admin", "teacher"],
  },
  {
    label: "Timetable",
    path: "/admin/timetable",
    module: "timetable",
    section: "Academic management",
    roles: ["admin", "teacher"],
  },
  {
    label: "Attendance",
    path: "/admin/attendance",
    module: "attendance",
    section: "Academic management",
    roles: ["admin", "teacher"],
  },
  {
    label: "Grades",
    path: "/admin/grades",
    module: "grades",
    section: "Academic management",
    roles: ["admin", "teacher"],
  },
  {
    label: "Teachers",
    path: "/admin/teachers",
    section: "Staff management",
    roles: ["admin"],
  },
  {
    label: "Requests",
    path: "/admin/student-requests",
    section: "Operations",
    roles: ["admin"],
  },
  { label: "Facilities", path: "/admin/facilities", section: "Operations", roles: ["admin"] },
  {
    label: "Audit log",
    path: "/admin/audit-logs",
    section: "Administration",
    roles: ["admin"],
  },
  {
    label: "Settings",
    path: "/admin/settings",
    section: "Administration",
    roles: ["admin"],
  },
];

export default menuItems;
