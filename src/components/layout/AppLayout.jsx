import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import NotificationBell from "../common/NotificationBell";

export default function AppLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      <div
        style={{
          width: "240px",
          background: "#111827",
          color: "#fff",
          padding: "20px",
        }}
      >
        <Sidebar />
      </div>

      <div
        style={{
          flex: 1,
          padding: "24px",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}