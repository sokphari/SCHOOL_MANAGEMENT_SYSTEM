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

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p>{error}</p>;
  if (!data) return <p>No dashboard data</p>;

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ marginBottom: "6px" }}>Dashboard</h2>
        <p style={{ margin: 0, color: "#6b7280" }}>
          Welcome back, {user?.name}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <NotificationBell />
        </div>
      </div>

      {/* Admin Dashboard */}
      {user?.role === "admin" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <StatCard title="Total Students" value={data.total_students || 0} />
            <StatCard title="Male Students" value={data.male_students || 0} />
            <StatCard
              title="Female Students"
              value={data.female_students || 0}
            />
            <StatCard title="Total Teachers" value={data.total_teachers || 0} />
            <StatCard title="Total Classes" value={data.total_classes || 0} />
            <StatCard
              title="Today Attendance"
              value={data.today_attendance || 0}
            />
            <GenderChart
              male={data.male_students || 0}
              female={data.female_students || 0}
            />

            <RequestChart stats={data.request_stats || {}} />
          </div>
        </>
      )}

      {/* Teacher Dashboard */}
      {user?.role === "teacher" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <StatCard title="My Classes" value={data.my_classes?.length || 0} />
            <StatCard title="Total Students" value={data.total_students || 0} />
            <StatCard title="Male Students" value={data.male_students || 0} />
            <StatCard
              title="Female Students"
              value={data.female_students || 0}
            />
            <StatCard
              title="Today Attendance"
              value={data.today_attendance || 0}
            />
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>My Classes</h3>

            {data.my_classes && data.my_classes.length > 0 ? (
              <ul style={{ paddingLeft: "20px", marginBottom: 0 }}>
                {data.my_classes.map((item) => (
                  <li key={item.id} style={{ marginBottom: "10px" }}>
                    {item.name} {item.section ? `(${item.section})` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ marginBottom: 0, color: "#6b7280" }}>
                No classes assigned yet.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
