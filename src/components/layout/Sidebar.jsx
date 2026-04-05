import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import menuItems from "../../config/menu";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: "8px" }}>School System</h2>
      <p style={{ color: "#9ca3af", marginTop: 0 }}>
        {user?.name} ({user?.role})
      </p>

      <div style={{ marginTop: "24px" }}>
        {filteredMenu.map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "block",
                padding: "10px 12px",
                marginBottom: "8px",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#fff",
                background: active ? "#374151" : "transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <button
        onClick={logout}
        style={{
          marginTop: "24px",
          width: "100%",
          padding: "10px 12px",
          border: "none",
          borderRadius: "8px",
          background: "#dc2626",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}