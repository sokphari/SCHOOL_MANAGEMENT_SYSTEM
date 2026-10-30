import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightToBracket,
  faBell,
  faCircleCheck,
  faClock,
  faInbox,
  faRightFromBracket,
  faShieldHalved,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { getAuditLogs } from "@/modules/audit-logs/api/auditLogsApi";
import { getStudentRequests } from "@/modules/student-requests/api/studentRequestsApi.ts";

function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function presentActivity(event) {
  switch (event.action) {
    case "auth.login.succeeded":
      return { title: "User signed in", detail: event.actor?.name || "A user signed in", icon: faCircleCheck, color: "bg-emerald-500/10 text-emerald-500" };
    case "auth.login.failed":
      return { title: "Failed login attempt", detail: `Sign-in was rejected${event.ip_address ? ` · ${event.ip_address}` : ""}.`, icon: faArrowRightToBracket, color: "bg-rose-500/10 text-rose-500" };
    case "auth.logout.succeeded":
      return { title: "User signed out", detail: event.actor?.name || "A user signed out", icon: faRightFromBracket, color: "bg-slate-500/10 text-slate-500" };
    case "security.rate_limited":
      return { title: "Rate-limited request", detail: `Too many requests${event.ip_address ? ` · ${event.ip_address}` : ""}.`, icon: faShieldHalved, color: "bg-amber-500/10 text-amber-500" };
    default:
      return { title: "Blocked access attempt", detail: `An API request was denied${event.ip_address ? ` · ${event.ip_address}` : ""}.`, icon: faShieldHalved, color: "bg-rose-500/10 text-rose-500" };
  }
}

export default function NotificationBell() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activityEvents, setActivityEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    const today = todayDate();
    const [requestsResult, authResult, securityResult] = await Promise.allSettled([
      getStudentRequests({ status: "pending", page: 1 }),
      getAuditLogs({ module: "auth", date_from: today, date_to: today, page: 1 }),
      getAuditLogs({ module: "security", date_from: today, date_to: today, page: 1 }),
    ]);

    if (requestsResult.status === "fulfilled") {
      setPendingRequests(requestsResult.value.data.data ?? []);
    }

    const authEvents = authResult.status === "fulfilled" ? authResult.value.data.data ?? [] : [];
    const securityEvents = securityResult.status === "fulfilled" ? securityResult.value.data.data ?? [] : [];
    setActivityEvents(
      [...authEvents, ...securityEvents].sort(
        (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      ),
    );
    setLoading(false);
  };

  useEffect(() => {
    const initialFetch = window.setTimeout(() => void fetchNotifications(), 0);
    const interval = window.setInterval(() => void fetchNotifications(), 30000);

    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!panelRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const notifications = [
    ...pendingRequests.map((request) => ({ type: "request", id: `request-${request.id}`, created_at: request.created_at, request })),
    ...activityEvents.map((event) => ({ type: "activity", id: `activity-${event.id}`, created_at: event.created_at, event })),
  ]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 20);
  const count = notifications.length;

  const navigateToRequests = () => {
    setOpen(false);
    navigate("/admin/student-requests");
  };
  const navigateToAudit = () => {
    setOpen(false);
    navigate("/admin/audit-logs");
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        className="relative inline-grid size-[38px] shrink-0 place-items-center rounded-xl border border-violet-200 bg-violet-50 text-[15px] text-violet-700 shadow-sm transition hover:bg-violet-100 hover:text-violet-800 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200 dark:hover:bg-violet-400/20 max-[560px]:size-[35px]"
        type="button"
        aria-label={count > 0 ? `${count} notifications` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <FontAwesomeIcon icon={faBell} />
        {count > 0 && <span className="absolute -right-1 -top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-surface bg-rose-600 px-1 text-[9px] font-bold text-white">{count > 99 ? "99+" : count}</span>}
      </button>

      {open && (
        <section role="dialog" aria-label="Notifications" className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(400px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-border bg-surface text-primary shadow-2xl">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="m-0 text-sm font-bold">Notifications</h2>
              <p className="mb-0 mt-0.5 text-xs text-muted">Requests and account/security activity today</p>
            </div>
            <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-brand-soft hover:text-primary"><FontAwesomeIcon icon={faXmark} /></button>
          </header>

          <div className="max-h-[min(480px,65vh)] overflow-y-auto">
            {loading ? (
              <p className="m-0 px-4 py-8 text-center text-sm text-muted">Loading notifications…</p>
            ) : count === 0 ? (
              <div className="px-4 py-9 text-center"><FontAwesomeIcon icon={faInbox} className="mb-2 text-xl text-muted" /><p className="m-0 text-sm font-semibold">You’re all caught up</p><p className="mb-0 mt-1 text-xs text-muted">No student requests or account/security events today.</p></div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  if (notification.type === "request") {
                    const { request } = notification;
                    const studentName = request.student
                      ? `${request.student.first_name} ${request.student.last_name}`
                      : request.student_code_snapshot;

                    return (
                      <article key={notification.id} className="flex items-start gap-3 px-4 py-3.5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><FontAwesomeIcon icon={faInbox} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate text-sm font-semibold">Student permission/request</p>
                          <p className="mb-0 mt-0.5 truncate text-xs text-muted">{studentName} · {request.subject}</p>
                          <p className="mb-0 mt-1 text-[11px] text-muted">{formatTime(request.created_at)}</p>
                          <button type="button" onClick={() => { setOpen(false); navigate(`/admin/student-requests/${request.id}`); }} className="mt-2 rounded-md bg-brand-soft px-2.5 py-1.5 text-xs font-semibold text-brand-strong transition hover:bg-brand/15">View</button>
                        </div>
                      </article>
                    );
                  }

                  const { event } = notification;
                  const presentation = presentActivity(event);
                  return (
                    <article key={notification.id} className="flex items-start gap-3 px-4 py-3.5">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${presentation.color}`}><FontAwesomeIcon icon={presentation.icon} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-sm font-semibold">{presentation.title}</p>
                        <p className="mb-0 mt-0.5 truncate text-xs text-muted">{presentation.detail}</p>
                        <p className="mb-0 mt-1 text-[11px] text-muted"><FontAwesomeIcon icon={faClock} className="mr-1" />{formatTime(event.created_at)}</p>
                        <button type="button" onClick={navigateToAudit} className="mt-2 rounded-md bg-brand-soft px-2.5 py-1.5 text-xs font-semibold text-brand-strong transition hover:bg-brand/15">View</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {(pendingRequests.length > 0 || activityEvents.length > 0) && (
            <footer className="flex gap-2 border-t border-border px-3 py-2.5">
              {pendingRequests.length > 0 && <button type="button" onClick={navigateToRequests} className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-brand-strong transition hover:bg-brand-soft">View all requests</button>}
              {activityEvents.length > 0 && <button type="button" onClick={navigateToAudit} className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-brand-strong transition hover:bg-brand-soft">View audit log</button>}
            </footer>
          )}
        </section>
      )}
    </div>
  );
}
