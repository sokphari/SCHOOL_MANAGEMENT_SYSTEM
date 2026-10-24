import { useEffect, useState } from "react";
import { getDashboard } from "../../api/dashboardApi";
import { useAuth } from "../../context/AuthContext";
import StatCard from "../../components/common/StatCard";
import NotificationBell from "../../components/common/NotificationBell";
import GenderChart from "../../components/charts/GenderChart";
import RequestChart from "../../components/charts/RequestChart";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getDashboard();
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "#6b7280", fontSize: "16px" }}>
          Loading dashboard...
        </p>
      </div>
    );
  if (error)
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "#dc2626", fontSize: "16px" }}>{error}</p>
      </div>
    );
  if (!data)
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "#6b7280", fontSize: "16px" }}>No dashboard data</p>
      </div>
    );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Header */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div>
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
            GOOD {new Date().getHours() >= 12 ? "AFTERNOON" : "MORNING"}
          </p>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 600, color: "#000" }}>
            Dashboard Overview
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <span
            style={{
              background: "#d1fae5",
              color: "#047857",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Live
          </span>
          <NotificationBell />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px",
          background: "#f9fafb",
        }}
      >
        {/* Admin Dashboard */}
        {user?.role === "admin" && (
          <>
            {/* Stat Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
              <StatCardCustom
                title="Total Students"
                value={data.total_students || 0}
                borderColor="#16a34a"
                iconClass="fas fa-users"
              />
              <StatCardCustom
                title="Male Students"
                value={data.male_students || 0}
                borderColor="#2563eb"
                iconClass="fas fa-person"
              />
              <StatCardCustom
                title="Female Students"
                value={data.female_students || 0}
                borderColor="#9333ea"
                iconClass="fas fa-person-dress"
              />
              <StatCardCustom
                title="Total Teachers"
                value={data.total_teachers || 0}
                borderColor="#ea580c"
                iconClass="fas fa-chalkboard-user"
              />
              <StatCardCustom
                title="Total Classes"
                value={data.total_classes || 0}
                borderColor="#06b6d4"
                iconClass="fas fa-book"
              />
              <StatCardCustom
                title="Today Attendance"
                value={data.today_attendance || 0}
                borderColor="#ec4899"
                iconClass="fas fa-check-circle"
              />
            </div>

            {/* Charts Section */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                gap: "20px",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  Gender Distribution
                </h3>
                <GenderChart
                  male={data.male_students || 0}
                  female={data.female_students || 0}
                />
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  Request Statistics
                </h3>
                <RequestChart stats={data.request_stats || {}} />
              </div>
            </div>
          </>
        )}

        {/* Teacher Dashboard */}
        {user?.role === "teacher" && (
          <>
            {/* Stat Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
              <StatCardCustom
                title="My Classes"
                value={data.my_classes?.length || 0}
                borderColor="#16a34a"
                iconClass="fas fa-book-open"
              />
              <StatCardCustom
                title="Total Students"
                value={data.total_students || 0}
                borderColor="#2563eb"
                iconClass="fas fa-users"
              />
              <StatCardCustom
                title="Male Students"
                value={data.male_students || 0}
                borderColor="#0891b2"
                iconClass="fas fa-person"
              />
              <StatCardCustom
                title="Female Students"
                value={data.female_students || 0}
                borderColor="#ec4899"
                iconClass="fas fa-person-dress"
              />
              <StatCardCustom
                title="Today Attendance"
                value={data.today_attendance || 0}
                borderColor="#ea580c"
                iconClass="fas fa-check-circle"
              />
            </div>

            {/* My Classes Section */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "20px",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
                <i
                  className="fas fa-book"
                  style={{ marginRight: "10px", color: "#0d5c42" }}
                />
                My Classes
              </h3>

              {data.my_classes && data.my_classes.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                  {data.my_classes.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "16px",
                        background: "#f3f4f6",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#0d5c42";
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.borderColor = "#0d5c42";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f3f4f6";
                        e.currentTarget.style.color = "#000";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {item.name}
                      </p>
                      {item.section && (
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "12px",
                            opacity: 0.7,
                          }}
                        >
                          Section: {item.section}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ marginBottom: 0, color: "#6b7280" }}>
                  No classes assigned yet.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Custom StatCard Component with Font Awesome Icons
function StatCardCustom({ title, value, borderColor, iconClass }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 4px 12px rgba(0,0,0,0.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow =
          "0 1px 3px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top Border */}
      <div
        style={{
          height: "4px",
          background: borderColor,
          width: "100%",
        }}
      />

      {/* Content */}
      <div style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#6b7280",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {title}
          </h4>
          <i
            className={iconClass}
            style={{
              fontSize: "24px",
              color: borderColor,
            }}
          />
        </div>

        <div
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#1f2937",
            marginBottom: "8px",
          }}
        >
          {value}
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#d1d5db",
          }}
        >
          Updated now
        </div>
      </div>
    </div>
  );
}