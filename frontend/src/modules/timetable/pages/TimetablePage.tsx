import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClock,
  faPenToSquare,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { deleteTimetableSession, getTimetable } from "@/modules/timetable/api/timetableApi";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import type { TimetableSession } from "@/modules/timetable/types/timetable";

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function TimetablePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TimetableSession[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getTimetable();
      setSessions(data);
      setError("");
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError)
          ? requestError.response?.data?.message || "Could not load the timetable."
          : "Could not load the timetable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      sessions.filter((session) => {
        const schoolClass = session.school_class;
        const searchable = [
          schoolClass.name,
          schoolClass.section,
          schoolClass.course_record?.name || schoolClass.course,
          schoolClass.lesson_record?.name || schoolClass.lesson,
          schoolClass.teacher
            ? `${schoolClass.teacher.first_name} ${schoolClass.teacher.last_name}`
            : "",
          schoolClass.room_location?.name || schoolClass.room,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(search.trim().toLowerCase());
      }),
    [sessions, search],
  );
  const teacherRows = useMemo(() => {
    const groups = new Map<string, { key: string; name: string; sessions: TimetableSession[] }>();
    sessions.forEach((session) => {
      const teacherId = session.school_class.teacher_id;
      const key = teacherId === null ? "unassigned" : String(teacherId);
      const teacher = session.school_class.teacher;
      const name = teacher ? `${teacher.first_name} ${teacher.last_name}`.trim() : "Teacher not assigned";
      const group = groups.get(key) || { key, name, sessions: [] };
      group.sessions.push(session);
      groups.set(key, group);
    });

    const term = search.trim().toLowerCase();
    const rows = [...groups.values()].flatMap((group) => {
      const teacherMatches = group.name.toLowerCase().includes(term);
      const matchingSessions = term && !teacherMatches
        ? group.sessions.filter((session) => visible.some((item) => item.id === session.id))
        : group.sessions;

      return term && !teacherMatches && matchingSessions.length === 0
        ? []
        : [{ ...group, visibleSessions: matchingSessions }];
    });

    if (user?.role === "teacher" && rows.length === 0) {
      const ownSchedule = groups.values().next().value;
      if (ownSchedule) {
        rows.push({ ...ownSchedule, visibleSessions: [] });
      } else {
        const teacher = sessions[0]?.school_class.teacher;
        rows.push({
          key: teacher ? String(teacher.id) : `user-${user.id}`,
          name: teacher ? `${teacher.first_name} ${teacher.last_name}`.trim() : user.name,
          sessions: [],
          visibleSessions: [],
        });
      }
    }

    return rows.sort((first, second) => first.name.localeCompare(second.name));
  }, [sessions, visible, search, user]);
  const scheduledDayCount = useMemo(
    () => weekdays.filter((_, index) => sessions.some((session) => session.day_of_week === index + 1)).length,
    [sessions],
  );
  const availableDayCount = weekdays.length - scheduledDayCount;

  const remove = async (session: TimetableSession) => {
    const classLabel = `${session.school_class.name}${
      session.school_class.section ? ` · Section ${session.school_class.section}` : ""
    }`;
    const day = weekdays[session.day_of_week - 1];
    if (!window.confirm(`Remove the ${day} session for ${classLabel}?`)) return;

    try {
      await deleteTimetableSession(session.id);
      setSuccess("Timetable session deleted.");
      setError("");
      await load();
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError)
          ? requestError.response?.data?.message || "Could not delete this session."
          : "Could not delete this session.",
      );
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand">
            Academic schedule
          </p>
          <h1 className="m-0 text-2xl font-bold text-primary sm:text-[28px]">
            Class Timetable
          </h1>
          <p className="mb-0 mt-1 text-sm text-secondary">
            {user?.role === "teacher"
              ? "Your timetable is grouped into one row, with each class under its weekday."
              : "Each teacher has one row showing all of their weekly class sessions."}
          </p>
        </div>
        {user?.role === "admin" && (
          <Link
            to="/admin/timetable/create"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white no-underline hover:bg-brand-strong"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add session
          </Link>
        )}
      </header>

      {success && <Notice tone="success">{success}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {user?.role === "teacher" && !loading && (
        <section aria-label="Your timetable availability" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AvailabilitySummary label="Your sessions" value={sessions.length} tone="brand" />
          <AvailabilitySummary label="Scheduled weekdays" value={scheduledDayCount} tone="amber" />
          <AvailabilitySummary label="Available weekdays" value={availableDayCount} tone="emerald" />
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3.5 sm:p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <FontAwesomeIcon icon={faCalendarDays} className="text-brand" />
            Weekly schedule
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search teacher, class, course, room"
            className="min-h-9 w-full rounded-lg border border-border bg-app-bg/40 px-3 text-sm text-primary outline-none placeholder:text-muted focus:border-brand sm:max-w-sm"
          />
        </div>

        {loading ? (
          <div className="grid min-h-48 place-items-center text-sm text-secondary">
            Loading timetable…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1500px]">
              <div className="grid grid-cols-[190px_repeat(7,minmax(185px,1fr))] border-b border-border bg-brand-soft/35">
                <div className="sticky left-0 z-10 border-r border-border bg-brand-soft/60 px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-secondary">Teacher</div>
                {weekdays.map((day, index) => {
                  const count = visible.filter((session) => session.day_of_week === index + 1).length;
                  return <div key={day} className="border-r border-border px-3 py-3 last:border-r-0">
                    <h2 className="m-0 text-xs font-bold text-primary">{day}</h2>
                    <p className="m-0 mt-0.5 text-[10px] text-muted">{count} {count === 1 ? "session" : "sessions"}</p>
                  </div>;
                })}
              </div>
              {teacherRows.length === 0 ? (
                <div className="grid min-h-52 place-items-center px-4 text-center text-sm text-secondary">{search.trim() ? "No timetable sessions match your search." : "No timetable sessions are scheduled yet."}</div>
              ) : teacherRows.map((teacherRow) => (
                <div key={teacherRow.key} className="grid grid-cols-[190px_repeat(7,minmax(185px,1fr))] border-b border-border last:border-b-0">
                  <div className="sticky left-0 z-[1] border-r border-border bg-surface p-3">
                    <p className="m-0 text-xs font-bold text-primary">{teacherRow.name}</p>
                    <p className="mb-0 mt-1 text-[10px] text-muted">{teacherRow.sessions.length} {teacherRow.sessions.length === 1 ? "session" : "sessions"} · {new Set(teacherRow.sessions.map((session) => session.day_of_week)).size} weekdays</p>
                  </div>
                  {weekdays.map((day, index) => {
                    const daySessions = teacherRow.visibleSessions.filter((session) => session.day_of_week === index + 1);
                    const scheduled = teacherRow.sessions.some((session) => session.day_of_week === index + 1);
                    return <div key={`${teacherRow.key}-${day}`} className="min-h-40 space-y-2 border-r border-border p-2 last:border-r-0">
                      {daySessions.length > 0 ? daySessions.map((session) => <SessionCard key={session.id} session={session} canManage={user?.role === "admin"} onDelete={() => void remove(session)} />) : <div className={`grid min-h-20 place-items-center rounded-lg border px-2 py-3 text-center text-[10px] ${scheduled ? "border-border text-muted" : "border-emerald-500/20 bg-emerald-500/5 font-semibold text-emerald-700 dark:text-emerald-300"}`}>
                        {scheduled ? "No matching sessions" : "Available · No sessions"}
                      </div>}
                    </div>;
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <p className="m-0 text-xs text-muted">
        {user?.role === "teacher"
          ? "Availability is based on saved timetable sessions. Each row shows one teacher’s complete weekly schedule; days marked Available have no assigned sessions."
          : "Times use the school’s local time. Overlapping sessions for a teacher or room are blocked when saving."}
      </p>
    </main>
  );
}

function AvailabilitySummary({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "amber" | "emerald";
}) {
  const styles = {
    brand: "border-brand/20 bg-brand-soft/25 text-brand-strong",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  }[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 ${styles}`}>
      <p className="m-0 text-xs font-medium opacity-80">{label}</p>
      <p className="mb-0 mt-1 text-2xl font-bold leading-none">{value}</p>
    </div>
  );
}

function SessionCard({
  session,
  canManage,
  onDelete,
}: {
  session: TimetableSession;
  canManage: boolean;
  onDelete: () => void;
}) {
  const schoolClass = session.school_class;
  const course = schoolClass.course_record?.name || schoolClass.course || "Course not set";
  const lesson = schoolClass.lesson_record?.name || schoolClass.lesson;
  const teacher = schoolClass.teacher
    ? `${schoolClass.teacher.first_name} ${schoolClass.teacher.last_name}`
    : "Teacher not assigned";
  const room = schoolClass.room_location?.name || schoolClass.room || "Room not assigned";

  return (
    <article className="rounded-lg border border-brand/20 bg-brand-soft/20 p-2.5">
      <div className="flex items-start justify-between gap-1">
        <h3 className="m-0 text-[11px] font-bold leading-4 text-primary">
          {schoolClass.name}
          {schoolClass.section ? ` · ${schoolClass.section}` : ""}
        </h3>
        {canManage && (
          <div className="flex shrink-0 gap-1">
            <Link
              to={`/admin/timetable/${session.id}/edit`}
              aria-label="Edit session"
              className="grid size-6 place-items-center rounded border border-border text-muted hover:text-brand"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="text-[10px]" />
            </Link>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete session"
              className="grid size-6 place-items-center rounded border border-border text-muted hover:border-rose-400 hover:text-rose-600"
            >
              <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
            </button>
          </div>
        )}
      </div>
      <span title="The teacher is unavailable during this session." className="mt-1 inline-flex rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9px] font-semibold text-rose-600 dark:text-rose-300">Unavailable</span>
      <p className="mb-0 mt-1 text-[11px] font-medium text-brand-strong">{course}</p>
      {lesson && <p className="mb-0 mt-0.5 text-[10px] text-secondary">{lesson}</p>}
      <p className="mb-0 mt-2 flex items-center gap-1.5 text-[10px] text-secondary">
        <FontAwesomeIcon icon={faClock} />
        {session.starts_at.slice(0, 5)}–{session.ends_at.slice(0, 5)}
      </p>
      <p className="mb-0 mt-1 truncate text-[10px] text-muted" title={teacher}>
        {teacher}
      </p>
      <p className="mb-0 mt-0.5 truncate text-[10px] text-muted" title={room}>
        {room}
      </p>
    </article>
  );
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "error";
}) {
  const colors =
    tone === "error"
      ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
      : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`m-0 rounded-lg border px-4 py-2.5 text-sm ${colors}`}
    >
      {children}
    </p>
  );
}
