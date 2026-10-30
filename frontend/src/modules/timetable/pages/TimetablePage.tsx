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
            View weekly class sessions, teachers, and rooms.
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
            placeholder="Search class, course, teacher, room"
            className="min-h-9 w-full rounded-lg border border-border bg-app-bg/40 px-3 text-sm text-primary outline-none placeholder:text-muted focus:border-brand sm:max-w-sm"
          />
        </div>

        {loading ? (
          <div className="grid min-h-48 place-items-center text-sm text-secondary">
            Loading timetable…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[1120px] grid-cols-7 divide-x divide-border">
              {weekdays.map((day, index) => {
                const daySessions = visible.filter(
                  (session) => session.day_of_week === index + 1,
                );

                return (
                  <section key={day} className="min-h-64 bg-surface">
                    <header className="sticky top-0 border-b border-border bg-brand-soft/35 px-3 py-3">
                      <h2 className="m-0 text-xs font-bold text-primary">{day}</h2>
                      <p className="m-0 mt-0.5 text-[10px] text-muted">
                        {daySessions.length} {daySessions.length === 1 ? "session" : "sessions"}
                      </p>
                    </header>
                    <div className="space-y-2 p-2">
                      {daySessions.length === 0 ? (
                        <p className="px-1 py-3 text-center text-[11px] text-muted">
                          No classes
                        </p>
                      ) : (
                        daySessions.map((session) => (
                          <SessionCard
                            key={session.id}
                            session={session}
                            canManage={user?.role === "admin"}
                            onDelete={() => void remove(session)}
                          />
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <p className="m-0 text-xs text-muted">
        Times use the school’s local time. Overlapping sessions for a teacher or room are blocked
        when saving.
      </p>
    </main>
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
