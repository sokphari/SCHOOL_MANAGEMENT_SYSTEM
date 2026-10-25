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
        path: "students/:id",
        element: (
          <RoleRoute roles={["admin", "teacher"]}>
            <StudentDetailsPage />
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
