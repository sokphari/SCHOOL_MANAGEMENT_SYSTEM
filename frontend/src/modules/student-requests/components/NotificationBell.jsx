import { useCallback, useEffect, useRef, useState } from "react";
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
  faTrashCan,
  faUserPlus,
  faVolumeHigh,
  faVolumeXmark,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { getAuditLogs } from "@/modules/audit-logs/api/auditLogsApi";
import { getStudentRequests } from "@/modules/student-requests/api/studentRequestsApi.ts";
import { getStudentRegistrations } from "@/modules/students/api/studentRegistrationApi";
import { getPendingStaffRegistrations } from "@/modules/audit-logs/api/staffRegistrationsApi";
import { useAuth } from "@/modules/auth/hooks/useAuth";

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
  const { user } = useAuth();
  const dismissedStorageKey = `admin-notification-history-${user?.id ?? "current"}`;
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [pendingStaffRegistrations, setPendingStaffRegistrations] = useState([]);
  const [activityEvents, setActivityEvents] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("admin-registration-alert-sound") === "enabled");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(dismissedStorageKey) || "[]"));
    } catch {
      return new Set();
    }
  });
  const panelRef = useRef(null);
  const seenNotificationIds = useRef(new Set());
  const initializedNotificationKinds = useRef(new Set());
  const soundEnabledRef = useRef(soundEnabled);
  const audioContextRef = useRef(null);
  const navigate = useNavigate();

  const unlockAudio = useCallback(async () => {
    if (!soundEnabledRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current && AudioContextClass) audioContextRef.current = new AudioContextClass();
      if (audioContextRef.current?.state === "suspended") await audioContextRef.current.resume();
    } catch {
      // Browser audio can be unavailable or blocked; visual notifications still work.
    }
  }, []);

  const playNotificationChime = useCallback(async () => {
    try {
      await unlockAudio();
      const context = audioContextRef.current;
      if (!context) return;
      if (context.state !== "running") return;
      const now = context.currentTime;
      [784, 988].forEach((frequency, index) => {
        const start = now + index * 0.14;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.14, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.21);
      });
    } catch {
      // Browser audio can be unavailable or blocked; visual notifications still work.
    }
  }, [unlockAudio]);

  useEffect(() => {
    const unlockOnInteraction = () => void unlockAudio();
    window.addEventListener("pointerdown", unlockOnInteraction, { once: true });
    window.addEventListener("keydown", unlockOnInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockOnInteraction);
      window.removeEventListener("keydown", unlockOnInteraction);
    };
  }, [unlockAudio]);

  const toggleSound = async () => {
    const next = !soundEnabledRef.current;
    soundEnabledRef.current = next;
    setSoundEnabled(next);
    localStorage.setItem("admin-registration-alert-sound", next ? "enabled" : "disabled");
    if (!next) return;
    // This button click is a user gesture, so use it to unlock audio and preview
    // the sound. It also makes the sound setting verifiable without waiting for
    // another registration to arrive.
    await playNotificationChime();
  };

  const fetchNotifications = useCallback(async () => {
    const today = todayDate();
    const [requestsResult, registrationsResult, staffRegistrationsResult, authResult, securityResult] = await Promise.allSettled([
      getStudentRequests({ status: "pending", page: 1 }, { notificationPoll: true }),
      getStudentRegistrations({ status: "pending", page: 1 }, { notificationPoll: true }),
      user?.role === "admin" ? getPendingStaffRegistrations(true) : Promise.resolve(null),
      getAuditLogs({ module: "auth", date_from: today, date_to: today, page: 1 }),
      getAuditLogs({ module: "security", date_from: today, date_to: today, page: 1 }),
    ]);

    let hasNewNotifications = false;
    const recordNewNotifications = (kind, items, prefix) => {
      const ids = items.map((item) => `${prefix}-${item.id}`);
      if (initializedNotificationKinds.current.has(kind) && ids.some((id) => !seenNotificationIds.current.has(id))) {
        hasNewNotifications = true;
      }
      ids.forEach((id) => seenNotificationIds.current.add(id));
      initializedNotificationKinds.current.add(kind);
    };

    if (requestsResult.status === "fulfilled") {
      const requests = requestsResult.value.data.data ?? [];
      recordNewNotifications("requests", requests, "request");
      setPendingRequests(requests);
    }
    if (registrationsResult.status === "fulfilled") {
      const registrations = registrationsResult.value.data.data ?? [];
      recordNewNotifications("registrations", registrations, "registration");
      setPendingRegistrations(registrations);
    }
    if (staffRegistrationsResult.status === "fulfilled" && staffRegistrationsResult.value) {
      const registrations = staffRegistrationsResult.value.data.data ?? [];
      recordNewNotifications("staff-registrations", registrations, "staff-registration");
      setPendingStaffRegistrations(registrations);
    }

    const authEvents = authResult.status === "fulfilled" ? authResult.value.data.data ?? [] : [];
    const securityEvents = securityResult.status === "fulfilled" ? securityResult.value.data.data ?? [] : [];
    if (authResult.status === "fulfilled" && securityResult.status === "fulfilled") {
      recordNewNotifications("activity", [...authEvents, ...securityEvents], "activity");
    }
    if (hasNewNotifications && soundEnabledRef.current) void playNotificationChime();
    setActivityEvents(
      [...authEvents, ...securityEvents].sort(
        (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      ),
    );
    setLoading(false);
  }, [playNotificationChime, user?.role]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => void fetchNotifications(), 0);
    // Poll while the admin shell is open so new applications appear without a page refresh.
    const interval = window.setInterval(() => void fetchNotifications(), 10000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void fetchNotifications();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchNotifications]);

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
    ...pendingRegistrations.map((registration) => ({ type: "registration", id: `registration-${registration.id}`, created_at: registration.created_at, registration })),
    ...pendingStaffRegistrations.map((registration) => ({ type: "staff_registration", id: `staff-registration-${registration.id}`, created_at: registration.created_at, registration })),
    ...pendingRequests.map((request) => ({ type: "request", id: `request-${request.id}`, created_at: request.created_at, request })),
    ...activityEvents.map((event) => ({ type: "activity", id: `activity-${event.id}`, created_at: event.created_at, event })),
  ]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 20);
  const visibleNotifications = notifications.filter((notification) => !dismissedIds.has(notification.id));
  const count = visibleNotifications.length;

  const clearHistory = () => {
    const nextDismissed = new Set([...dismissedIds, ...notifications.map((notification) => notification.id)]);
    const storedIds = [...nextDismissed].slice(-500);
    setDismissedIds(new Set(storedIds));
    localStorage.setItem(dismissedStorageKey, JSON.stringify(storedIds));
  };

  const navigateToRequests = () => {
    setOpen(false);
    navigate("/admin/student-requests");
  };
  const navigateToAudit = () => {
    setOpen(false);
    navigate("/admin/audit-logs");
  };
  const navigateToRegistrations = () => {
    setOpen(false);
    navigate("/admin/students/registrations");
  };
  const navigateToStaffRegistrations = () => {
    setOpen(false);
    navigate("/admin/audit-logs/users?tab=pending");
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
              <p className="mb-0 mt-0.5 text-xs text-muted">New registrations, requests, and account/security activity</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label={soundEnabled ? "Turn notification sound off" : "Turn notification sound on"} aria-pressed={soundEnabled} title={soundEnabled ? "Turn sound off" : "Turn sound on and test chime"} onClick={() => void toggleSound()} className={`grid size-8 place-items-center rounded-lg transition hover:bg-brand-soft hover:text-primary ${soundEnabled ? "text-brand" : "text-muted"}`}><FontAwesomeIcon icon={soundEnabled ? faVolumeHigh : faVolumeXmark} /></button>
              <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-brand-soft hover:text-primary"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
          </header>

          <div className="max-h-[min(480px,65vh)] overflow-y-auto">
            {loading ? (
              <p className="m-0 px-4 py-8 text-center text-sm text-muted">Loading notifications…</p>
            ) : count === 0 ? (
              <div className="px-4 py-9 text-center"><FontAwesomeIcon icon={faInbox} className="mb-2 text-xl text-muted" /><p className="m-0 text-sm font-semibold">You’re all caught up</p><p className="mb-0 mt-1 text-xs text-muted">No student registrations, requests, or account/security events today.</p></div>
            ) : (
              <div className="divide-y divide-border">
                {visibleNotifications.map((notification) => {
                  if (notification.type === "registration") {
                    const { registration } = notification;
                    return (
                      <article key={notification.id} className="flex items-start gap-3 px-4 py-3.5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500"><FontAwesomeIcon icon={faUserPlus} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate text-sm font-semibold">New student registration</p>
                          <p className="mb-0 mt-0.5 truncate text-xs text-muted">{registration.first_name} {registration.last_name} · {registration.phone || registration.email || "Contact not provided"}</p>
                          <p className="mb-0 mt-1 text-[11px] text-muted">{formatTime(registration.created_at)}</p>
                          <button type="button" onClick={navigateToRegistrations} className="mt-2 rounded-md bg-brand-soft px-2.5 py-1.5 text-xs font-semibold text-brand-strong transition hover:bg-brand/15">View</button>
                        </div>
                      </article>
                    );
                  }

                  if (notification.type === "staff_registration") {
                    const { registration } = notification;
                    return (
                      <article key={notification.id} className="flex items-start gap-3 px-4 py-3.5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-500"><FontAwesomeIcon icon={faUserPlus} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate text-sm font-semibold">Teacher account request</p>
                          <p className="mb-0 mt-0.5 truncate text-xs text-muted">{registration.name} · {registration.email}</p>
                          <p className="mb-0 mt-1 text-[11px] text-muted">Expires {formatTime(registration.expires_at)}</p>
                          <button type="button" onClick={navigateToStaffRegistrations} className="mt-2 rounded-md bg-brand-soft px-2.5 py-1.5 text-xs font-semibold text-brand-strong transition hover:bg-brand/15">View</button>
                        </div>
                      </article>
                    );
                  }

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

          {notifications.length > 0 && (
            <footer className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2.5">
              {visibleNotifications.some((notification) => notification.type === "registration") && <button type="button" onClick={navigateToRegistrations} className="flex-1 rounded-lg px-2 py-2 text-xs font-semibold text-brand-strong transition hover:bg-brand-soft">View registrations</button>}
              {visibleNotifications.some((notification) => notification.type === "staff_registration") && <button type="button" onClick={navigateToStaffRegistrations} className="flex-1 rounded-lg px-2 py-2 text-xs font-semibold text-brand-strong transition hover:bg-brand-soft">Review accounts</button>}
              {visibleNotifications.some((notification) => notification.type === "request") && <button type="button" onClick={navigateToRequests} className="flex-1 rounded-lg px-2 py-2 text-xs font-semibold text-brand-strong transition hover:bg-brand-soft">View all requests</button>}
              {visibleNotifications.some((notification) => notification.type === "activity") && <button type="button" onClick={navigateToAudit} className="flex-1 rounded-lg px-2 py-2 text-xs font-semibold text-brand-strong transition hover:bg-brand-soft">View audit log</button>}
              {visibleNotifications.length > 0 && <button type="button" onClick={clearHistory} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-secondary transition hover:bg-rose-500/10 hover:text-rose-600"><FontAwesomeIcon icon={faTrashCan} /> Clear history</button>}
            </footer>
          )}
        </section>
      )}
    </div>
  );
}
