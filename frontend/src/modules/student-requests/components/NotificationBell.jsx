import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { getPendingRequestCount } from "@/modules/student-requests/api/studentRequestsApi";

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
    <button
      className="relative inline-grid size-[38px] shrink-0 place-items-center rounded-xl border border-violet-200 bg-violet-50 text-[15px] text-violet-700 shadow-sm transition hover:bg-violet-100 hover:text-violet-800 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200 dark:hover:bg-violet-400/20 max-[560px]:size-[35px]"
      type="button"
      aria-label={count > 0 ? `${count} pending student requests` : "Student requests"}
      onClick={() => navigate("/admin/student-requests")}
    >
      <FontAwesomeIcon icon={faBell} />

      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-surface bg-rose-600 px-1 text-[9px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
