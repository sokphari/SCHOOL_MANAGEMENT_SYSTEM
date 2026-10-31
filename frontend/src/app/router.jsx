import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "@/modules/auth/pages/LoginPage.tsx";
import DashboardPage from "@/modules/dashboard/pages/DashboardPage";
import AppLayout from "@/shared/layout/AppLayout";
import ProtectedRoute from "@/shared/guards/ProtectedRoute";
import RoleRoute from "@/shared/guards/RoleRoute";
import StudentsPage from "@/modules/students/pages/StudentsPage.tsx";
import StudentCreatePage from "@/modules/students/pages/StudentsCreatePage.tsx";
import StudentEditPage from "@/modules/students/pages/StudentsEditPage.tsx";
import StudentDetailsPage from "@/modules/students/pages/StudentDetailsPage.tsx";
import TeachersPage from "@/modules/teachers/pages/TeachersPage.tsx";
import TeacherCreatePage from "@/modules/teachers/pages/TeachersCreatePage.tsx";
import TeacherEditPage from "@/modules/teachers/pages/TeachersEditPage.tsx";
import ClassesPage from "@/modules/classes/pages/ClassesPage.tsx";
import ClassCreatePage from "@/modules/classes/pages/ClassesCreatePage.tsx";
import ClassEditPage from "@/modules/classes/pages/ClassesEditPage.tsx";
import ClassDetailPage from "@/modules/classes/pages/ClassesDetailsPage.tsx";
import AttendancePage from "@/modules/attendance/pages/AttendancePage.tsx";
import StudentRequestScanPage from "@/modules/public/pages/StudentRequestScanPage";
import StudentRequestsPage from "@/modules/student-requests/pages/StudentRequestsPage.tsx";
import StudentRequestDetailPage from "@/modules/student-requests/pages/StudentRequestsDetailPage.tsx";
import SettingsPage from "@/modules/settings/pages/SettingsPage.tsx";
import HomePage from "@/modules/public/pages/HomePage.tsx";
import FacilitiesPage from "@/modules/facilities/pages/FacilitiesPage.tsx";
import FacilitiesFormPage from "@/modules/facilities/pages/FacilitiesFormPage.tsx";
import FacilitiesRoomDetailsPage from "@/modules/facilities/pages/FacilitiesRoomDetailsPage.tsx";
import CoursesPage from "@/modules/courses/pages/CoursesPage.tsx";
import CourseDetailsPage from "@/modules/courses/pages/CourseDetailsPage.tsx";
import CourseFormPage from "@/modules/courses/pages/CourseFormPage.tsx";
import LessonFormPage from "@/modules/courses/pages/LessonFormPage.tsx";
import GradesPage from "@/modules/grades/pages/GradesPage.tsx";
import GradeTermCreatePage from "@/modules/grades/pages/GradeTermCreatePage.tsx";
import GradeTermPage from "@/modules/grades/pages/GradeTermPage.tsx";
import TimetablePage from "@/modules/timetable/pages/TimetablePage.tsx";
import TimetableFormPage from "@/modules/timetable/pages/TimetableFormPage.tsx";
import AuditLogsPage from "@/modules/audit-logs/pages/AuditLogsPage.tsx";
import SystemUsersPage from "@/modules/audit-logs/pages/SystemUsersPage.tsx";
import SystemUserEditPage from "@/modules/audit-logs/pages/SystemUserEditPage.tsx";
import RolePermissionsPage from "@/modules/audit-logs/pages/RolePermissionsPage.tsx";
import StudentRegistrationPage from "@/modules/public/pages/StudentRegistrationPage.tsx";
import StudentRegistrationsPage from "@/modules/students/pages/StudentRegistrationsPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },

  {
    path: "/request-scan",
    element: <StudentRequestScanPage />,
  },
  {
    path: "/student-registration",
    element: <StudentRegistrationPage />,
  },
  {
    path: "/admin/login",
    element: <LoginPage />,
  },
  {
    path: "/admin/reset-password",
    element: <LoginPage />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="dashboard.view">
            <DashboardPage />
          </RoleRoute>
        ),
      },

      {
        path: "teachers",
        element: (
          <RoleRoute roles={["admin"]}>
            <TeachersPage />
          </RoleRoute>
        ),
      },
      {
        path: "teachers/create",
        element: (
          <RoleRoute roles={["admin"]}>
            <TeacherCreatePage />
          </RoleRoute>
        ),
      },
      {
        path: "teachers/:id/edit",
        element: (
          <RoleRoute roles={["admin"]}>
            <TeacherEditPage />
          </RoleRoute>
        ),
      },

      {
        path: "students",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="students.view_list">
            <StudentsPage />
          </RoleRoute>
        ),
      },
      {
        path: "students/create",
        element: (
          <RoleRoute roles={["admin"]}>
            <StudentCreatePage />
          </RoleRoute>
        ),
      },
      {
        path: "students/registrations",
        element: (
          <RoleRoute roles={["admin"]}>
            <StudentRegistrationsPage />
          </RoleRoute>
        ),
      },
      {
        path: "students/:id/edit",
        element: (
          <RoleRoute roles={["admin"]}>
            <StudentEditPage />
          </RoleRoute>
        ),
      },
      {
        path: "students/:id",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="students.view_details">
            <StudentDetailsPage />
          </RoleRoute>
        ),
      },

      {
        path: "classes",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="classes.view_list">
            <ClassesPage />
          </RoleRoute>
        ),
      },
      { path: "facilities", element: <RoleRoute roles={["admin"]}><FacilitiesPage /></RoleRoute> },
      { path: "facilities/buildings/create", element: <RoleRoute roles={["admin"]}><FacilitiesFormPage kind="building" /></RoleRoute> },
      { path: "facilities/buildings/:id/edit", element: <RoleRoute roles={["admin"]}><FacilitiesFormPage kind="building" /></RoleRoute> },
      { path: "facilities/floors/create", element: <RoleRoute roles={["admin"]}><FacilitiesFormPage kind="floor" /></RoleRoute> },
      { path: "facilities/floors/:id/edit", element: <RoleRoute roles={["admin"]}><FacilitiesFormPage kind="floor" /></RoleRoute> },
      { path: "facilities/rooms/create", element: <RoleRoute roles={["admin"]}><FacilitiesFormPage kind="room" /></RoleRoute> },
      { path: "facilities/rooms/:id/edit", element: <RoleRoute roles={["admin"]}><FacilitiesFormPage kind="room" /></RoleRoute> },
      { path: "facilities/rooms/:id", element: <RoleRoute roles={["admin"]}><FacilitiesRoomDetailsPage /></RoleRoute> },
      { path: "courses", element: <RoleRoute roles={["admin"]}><CoursesPage /></RoleRoute> },
      { path: "courses/create", element: <RoleRoute roles={["admin"]}><CourseFormPage /></RoleRoute> },
      { path: "courses/:id/edit", element: <RoleRoute roles={["admin"]}><CourseFormPage /></RoleRoute> },
      { path: "courses/:courseId/lessons/create", element: <RoleRoute roles={["admin"]}><LessonFormPage /></RoleRoute> },
      { path: "courses/:courseId/lessons/:lessonId/edit", element: <RoleRoute roles={["admin"]}><LessonFormPage /></RoleRoute> },
      { path: "courses/:id", element: <RoleRoute roles={["admin"]}><CourseDetailsPage /></RoleRoute> },
      { path: "locations", element: <Navigate to="/admin/facilities" replace /> },
      { path: "buildings/*", element: <Navigate to="/admin/facilities" replace /> },
      { path: "floors/*", element: <Navigate to="/admin/facilities" replace /> },
      { path: "rooms/*", element: <Navigate to="/admin/facilities" replace /> },
      {
        path: "classes/create",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="classes.create">
            <ClassCreatePage />
          </RoleRoute>
        ),
      },
      {
        path: "classes/:id/edit",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="classes.edit">
            <ClassEditPage />
          </RoleRoute>
        ),
      },
      {
        path: "classes/:id",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="classes.view_details">
            <ClassDetailPage />
          </RoleRoute>
        ),
      },

      {
        path: "attendance",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="attendance.view">
            <AttendancePage />
          </RoleRoute>
        ),
      },

      {
        path: "grades",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="grades.view_terms">
            <GradesPage />
          </RoleRoute>
        ),
      },
      {
        path: "grades/classes/:classId/terms/create",
        element: (
          <RoleRoute roles={["admin"]}>
            <GradeTermCreatePage />
          </RoleRoute>
        ),
      },
      {
        path: "grades/terms/:termId",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="grades.view_terms">
            <GradeTermPage />
          </RoleRoute>
        ),
      },
      {
        path: "timetable",
        element: (
          <RoleRoute roles={["admin", "teacher"]} feature="timetable.view">
            <TimetablePage />
          </RoleRoute>
        ),
      },
      {
        path: "timetable/create",
        element: (
          <RoleRoute roles={["admin"]}>
            <TimetableFormPage />
          </RoleRoute>
        ),
      },
      {
        path: "timetable/:id/edit",
        element: (
          <RoleRoute roles={["admin"]}>
            <TimetableFormPage />
          </RoleRoute>
        ),
      },

      {
        path: "student-requests",
        element: (
          <RoleRoute roles={["admin"]}>
            <StudentRequestsPage />
          </RoleRoute>
        ),
      },
      {
        path: "student-requests/:id",
        element: (
          <RoleRoute roles={["admin"]}>
            <StudentRequestDetailPage />
          </RoleRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <RoleRoute roles={["admin"]}>
            <SettingsPage />
          </RoleRoute>
        ),
      },
      {
        path: "audit-logs",
        element: (
          <RoleRoute roles={["admin"]}>
            <AuditLogsPage />
          </RoleRoute>
        ),
      },
      {
        path: "audit-logs/users",
        element: (
          <RoleRoute roles={["admin"]}>
            <SystemUsersPage />
          </RoleRoute>
        ),
      },
      {
        path: "audit-logs/users/:id/edit",
        element: (
          <RoleRoute roles={["admin"]}>
            <SystemUserEditPage />
          </RoleRoute>
        ),
      },
      {
        path: "audit-logs/roles",
        element: (
          <RoleRoute roles={["admin"]}>
            <RolePermissionsPage />
          </RoleRoute>
        ),
      },
    ],
  },
]);

export default router;
