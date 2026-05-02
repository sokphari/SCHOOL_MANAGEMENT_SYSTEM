import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationBell from "../common/NotificationBell";

export default function AppLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div
        style={{
          marginLeft: "260px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "#f9fafb",
        }}
      >
        {/* Top Header */}
        <header
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            padding: "16px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              School Management System
            </h1>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Live Indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                background: "#d1fae5",
                borderRadius: "20px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#10b981",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#047857",
                }}
              >
                Live
              </span>
            </div>

            {/* Notification Bell */}
            <div style={{ cursor: "pointer" }}>
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Main Content Area - Scrollable */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "32px",
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Custom scrollbar styling */
        main::-webkit-scrollbar {
          width: 8px;
        }

        main::-webkit-scrollbar-track {
          background: transparent;
        }

        main::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        main::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}