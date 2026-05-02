import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { getPendingRequestCount } from "../../api/studentRequestsApi";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  const fetchCount = async () => {
    try {
      const res = await getPendingRequestCount();
      setCount(res.data.pending_count || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCount();

    // auto refresh every 10s
    const interval = setInterval(fetchCount, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onClick={() => navigate("/admin/student-requests")}
      style={{
        position: "relative",
        cursor: "pointer",
        fontSize: "20px",
      }}
    >
      <FontAwesomeIcon icon={faBell} style={{ color: "#6b7280" }} />

      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-5px",
            right: "-10px",
            background: "red",
            color: "white",
            borderRadius: "50%",
            padding: "2px 6px",
            fontSize: "12px",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}