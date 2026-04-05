import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/guards/ProtectedRoute";
import RoleRoute from "../components/guards/RoleRoute";
import StudentsPage from "../pages/students/StudentsPage";
import StudentCreatePage from "../pages/students/StudentsCreatePage";
import StudentEditPage from "../pages/students/StudentsEditPage";
import TeachersPage from "../pages/teachers/TeachersPage";
import TeacherCreatePage from "../pages/teachers/TeachersCreatePage";
import TeacherEditPage from "../pages/teachers/TeachersEditPage";
import ClassesPage from "../pages/classes/ClassesPage";
import ClassCreatePage from "../pages/classes/ClassesCreatePage";
import ClassEditPage from "../pages/classes/ClassesEditPage";
import ClassDetailPage from "../pages/classes/ClassesDetailsPage";
import AttendancePage from "../pages/attendance/AttendancePage";
import StudentRequestScanPage from "../pages/public/StudentRequestScanPage";
import StudentRequestsPage from "../pages/requests/StudentRequestsPage";
import StudentRequestDetailPage from "../pages/requests/StudentRequestsDetailPage";
import SettingsPage from "../pages/settings/SettingsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <StudentRequestScanPage />,
  },
  {
    path: "/request-scan",
    element: <StudentRequestScanPage />,
  },
  {
    path: "/admin/login",
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
        element: <DashboardPage />,
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
          <RoleRoute roles={["admin", "teacher"]}>
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
        path: "students/:id/edit",
        element: (
          <RoleRoute roles={["admin"]}>
            <StudentEditPage />
          </RoleRoute>
        ),
      },

      {
        path: "classes",
        element: (
          <RoleRoute roles={["admin", "teacher"]}>
            <ClassesPage />
          </RoleRoute>
        ),
      },
      {
        path: "classes/create",
        element: (
          <RoleRoute roles={["admin"]}>
            <ClassCreatePage />
          </RoleRoute>
        ),
      },
      {
        path: "classes/:id/edit",
        element: (
          <RoleRoute roles={["admin"]}>
            <ClassEditPage />
          </RoleRoute>
        ),
      },
      {
        path: "classes/:id",
        element: (
          <RoleRoute roles={["admin", "teacher"]}>
            <ClassDetailPage />
          </RoleRoute>
        ),
      },

      {
        path: "attendance",
        element: (
          <RoleRoute roles={["admin", "teacher"]}>
            <AttendancePage />
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
    ],
  },
]);

export default router;
