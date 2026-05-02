import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import menuItems from "../../config/menu";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  // Menu icon mapping
  const iconMap = {
    overview: "🏠",
    dashboard: "📊",
    students: "👥",
    teachers: "🎓",
    classes: "📚",
    attendance: "✓",
    schedule: "📅",
    reports: "📈",
    settings: "⚙️",
    messages: "💬",
    connection: "🔗",
    automation: "⚡",
    requests: "📝",
  };

  const getIcon = (label) => {
    const key = label.toLowerCase().replace(/\s+/g, "");
    return iconMap[key] || "→";
  };

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "260px",
        background: "#0d5c42",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 12px rgba(0,0,0,0.12)",
        zIndex: 1000,
      }}
    >
      {/* Logo & Header */}
      <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "#25d366",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            🎓
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
              School System
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "11px",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Management
            </p>
          </div>
        </div>

        {/* User Info */}
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "12px",
            marginTop: "12px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {user?.name}
          </p>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "11px",
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {user?.role}
          </p>
        </div>
      </div>

      {/* Main Menu - Scrollable */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 8px",
          /* Custom scrollbar styling */
        }}
        className="sidebar-menu"
      >
        {/* Menu Section Label */}
        <p
          style={{
            margin: "0 12px 12px 12px",
            fontSize: "10px",
            color: "rgba(255,255,255,0.5)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Main Menu
        </p>

        {filteredMenu.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                marginBottom: "6px",
                borderRadius: "8px",
                textDecoration: "none",
                color: active ? "#fff" : "rgba(255,255,255,0.8)",
                background: active
                  ? "rgba(255,255,255,0.2)"
                  : "transparent",
                transition: "all 0.2s ease",
                fontSize: "14px",
                fontWeight: active ? 600 : 500,
                border: active ? "1px solid rgba(255,255,255,0.3)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background =
                    "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color =
                    "rgba(255,255,255,0.8)";
                }
              }}
            >
              <span style={{ fontSize: "18px" }}>
                {getIcon(item.label)}
              </span>
              <span>{item.label}</span>
              {active && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: "4px",
                    height: "4px",
                    background: "#25d366",
                    borderRadius: "50%",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Configuration Section */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "16px 8px",
        }}
      >
        <p
          style={{
            margin: "0 12px 12px 12px",
            fontSize: "10px",
            color: "rgba(255,255,255,0.5)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Configuration
        </p>

        <Link
          to="/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 14px",
            marginBottom: "6px",
            borderRadius: "8px",
            textDecoration: "none",
            color: location.pathname === "/settings"
              ? "#fff"
              : "rgba(255,255,255,0.8)",
            background: location.pathname === "/settings"
              ? "rgba(255,255,255,0.2)"
              : "transparent",
            transition: "all 0.2s ease",
            fontSize: "14px",
            fontWeight:
              location.pathname === "/settings" ? 600 : 500,
            border:
              location.pathname === "/settings"
                ? "1px solid rgba(255,255,255,0.3)"
                : "none",
          }}
          onMouseEnter={(e) => {
            if (location.pathname !== "/settings") {
              e.currentTarget.style.background =
                "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "#fff";
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== "/settings") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color =
                "rgba(255,255,255,0.8)";
            }
          }}
        >
          <span style={{ fontSize: "18px" }}>⚙️</span>
          <span>Settings</span>
          {location.pathname === "/settings" && (
            <span
              style={{
                marginLeft: "auto",
                width: "4px",
                height: "4px",
                background: "#25d366",
                borderRadius: "50%",
              }}
            />
          )}
        </Link>
      </div>

      {/* Logout Button */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "16px",
        }}
      >
        <button
          onClick={logout}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "none",
            borderRadius: "8px",
            background: "rgba(220, 38, 38, 0.9)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(220, 38, 38, 1)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(220, 38, 38, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "rgba(220, 38, 38, 0.9)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <span>🚪</span>
          Logout
        </button>
      </div>

      {/* Custom scrollbar styling via style tag */}
      <style>{`
        .sidebar-menu::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-menu::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-menu::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .sidebar-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}