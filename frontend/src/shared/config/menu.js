const menuItems = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    roles: ["admin", "teacher"],
  },
  {
    label: "Students",
    path: "/admin/students",
    roles: ["admin", "teacher"],
  },
  {
    label: "Teachers",
    path: "/admin/teachers",
    roles: ["admin"],
  },
  {
    label: "Classes",
    path: "/admin/classes",
    roles: ["admin", "teacher"],
  },
  {
    label: "Courses",
    path: "/admin/courses",
    roles: ["admin"],
  },
  { label: "Facilities", path: "/admin/facilities", roles: ["admin"] },
  {
    label: "Attendance",
    path: "/admin/attendance",
    roles: ["admin", "teacher"],
  },
  {
    label: "Grades",
    path: "/admin/grades",
    roles: ["admin", "teacher"],
  },
  {
    label: "Timetable",
    path: "/admin/timetable",
    roles: ["admin", "teacher"],
  },
  {
    label: "Requests",
    path: "/admin/student-requests",
    roles: ["admin"],
  },
  {
    label: "Settings",
    path: "/admin/settings",
    roles: ["admin"],
  },
];

export default menuItems;
