import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCalendarDays, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createTimetableSession,
  getTimetableClasses,
  getTimetable,
  updateTimetableSession,
} from "@/modules/timetable/api/timetableApi";
import type {
  TimetableClass,
  TimetablePayload,
  TimetableSession,
} from "@/modules/timetable/types/timetable";

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const fieldClass =
  "min-h-11 w-full rounded-lg border border-border bg-app-bg/40 px-3 text-sm text-primary outline-none focus:border-brand";

export default function TimetableFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [classes, setClasses] = useState<TimetableClass[]>([]);
  const [sessions, setSessions] = useState<TimetableSession[]>([]);
  const [form, setForm] = useState({
    school_class_id: "",
    day_of_week: "1",
    starts_at: "08:00",
    ends_at: "09:00",
  });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadForm = async () => {
      try {
        const [{ data: availableClasses }, { data: existingSessions }] = await Promise.all([
          getTimetableClasses(),
          getTimetable(),
        ]);
        setClasses(availableClasses);
        setSessions(existingSessions);

        if (editing && id) {
          const session = existingSessions.find((item) => item.id === Number(id));
          if (!session) throw new Error("This timetable session was not found.");

          setForm({
            school_class_id: String(session.school_class_id),
            day_of_week: String(session.day_of_week),
            starts_at: session.starts_at.slice(0, 5),
            ends_at: session.ends_at.slice(0, 5),
          });
        } else if (availableClasses.length > 0) {
          const firstAvailable = availableClasses.find((schoolClass) =>
            !hasScheduleConflict(schoolClass, existingSessions, 1, "08:00", "09:00"),
          );
          setForm((current) => ({
            ...current,
            school_class_id: firstAvailable ? String(firstAvailable.id) : "",
          }));
        }
      } catch (requestError) {
        setError(
          axios.isAxiosError(requestError)
            ? requestError.response?.data?.message || "Could not load the form data."
            : requestError instanceof Error
              ? requestError.message
              : "Could not load the form data.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadForm();
  }, [editing, id]);

  const availableClasses = useMemo(
    () =>
      classes.filter(
        (schoolClass) =>
          !hasScheduleConflict(
            schoolClass,
            sessions,
            Number(form.day_of_week),
            form.starts_at,
            form.ends_at,
            Number(id) || undefined,
          ),
      ),
    [classes, form.day_of_week, form.ends_at, form.starts_at, id, sessions],
  );

  useEffect(() => {
    if (
      !loading &&
      form.school_class_id &&
      !availableClasses.some((schoolClass) => String(schoolClass.id) === form.school_class_id)
    ) {
      setForm((current) => ({ ...current, school_class_id: "" }));
    }
  }, [availableClasses, form.school_class_id, loading]);

  const selectedClass = classes.find((item) => String(item.id) === form.school_class_id);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload: TimetablePayload = {
      school_class_id: Number(form.school_class_id),
      day_of_week: Number(form.day_of_week),
      starts_at: form.starts_at,
      ends_at: form.ends_at,
    };

    try {
      if (editing && id) {
        await updateTimetableSession(Number(id), payload);
      } else {
        await createTimetableSession(payload);
      }
      navigate("/admin/timetable");
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const response = requestError.response?.data;
        setError(
          response?.errors
            ? Object.values(response.errors).flat().join(" ")
            : response?.message || "Could not save this timetable session.",
        );
      } else {
        setError("Could not save this timetable session.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-4">
      <Link
        to="/admin/timetable"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-secondary no-underline hover:border-brand/50 hover:text-brand"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to timetable
      </Link>

      <form
        onSubmit={(event) => void submit(event)}
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card"
      >
        <header className="flex items-center gap-4 border-b border-border bg-brand-soft/30 px-5 py-5 sm:px-7">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-lg text-white">
            <FontAwesomeIcon icon={faCalendarDays} />
          </span>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand">
              Weekly schedule
            </p>
            <h1 className="m-0 text-xl font-bold text-primary">
              {editing ? "Edit timetable session" : "Add timetable session"}
            </h1>
            <p className="mb-0 mt-1 text-sm text-secondary">
              Choose the day and time first, then select an available class.
            </p>
          </div>
        </header>

        {loading ? (
          <p className="p-6 text-sm text-secondary">Loading form…</p>
        ) : (
          <>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
              <Field label="Day">
                <select
                  value={form.day_of_week}
                  onChange={(event) => setForm({ ...form, day_of_week: event.target.value })}
                  className={fieldClass}
                >
                  {weekdays.map((day, index) => (
                    <option key={day} value={index + 1}>
                      {day}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Start time">
                <input
                  required
                  type="time"
                  value={form.starts_at}
                  onChange={(event) => setForm({ ...form, starts_at: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label="End time">
                <input
                  required
                  type="time"
                  min={form.starts_at}
                  value={form.ends_at}
                  onChange={(event) => setForm({ ...form, ends_at: event.target.value })}
                  className={fieldClass}
                />
              </Field>
              <Field label="Class / Grade and section">
                <select
                  required
                  value={form.school_class_id}
                  onChange={(event) =>
                    setForm({ ...form, school_class_id: event.target.value })
                  }
                  className={fieldClass}
                >
                  <option value="">
                    {availableClasses.length > 0
                      ? "Select an available class"
                      : "No classes available at this time"}
                  </option>
                  {availableClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.section ? ` · Section ${item.section}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedClass && <ClassDetails schoolClass={selectedClass} />}
              <p className="m-0 text-xs text-muted sm:col-span-2">
                Classes are filtered by the selected day and time. Busy teachers and rooms are
                excluded. The teacher assigned to each class appears below.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="mx-5 mb-0 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 sm:mx-7"
              >
                {error}
              </p>
            )}

            <footer className="flex justify-end border-t border-border px-5 py-4 sm:px-7">
              <button
                type="submit"
                disabled={saving || availableClasses.length === 0 || !form.school_class_id}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                {saving ? "Saving…" : editing ? "Save changes" : "Add session"}
              </button>
            </footer>
          </>
        )}
      </form>
    </main>
  );
}

function ClassDetails({ schoolClass }: { schoolClass: TimetableClass }) {
  const teacher = schoolClass.teacher
    ? `${schoolClass.teacher.first_name} ${schoolClass.teacher.last_name}`
    : "Not assigned";

  return (
    <div className="rounded-xl border border-border bg-app-bg/30 p-4 sm:col-span-2">
      <p className="m-0 text-xs font-semibold text-primary">Session details from this class</p>
      <div className="mt-3 grid gap-2 text-xs text-secondary sm:grid-cols-3">
        <span>Course: {schoolClass.course_record?.name || schoolClass.course || "Not set"}</span>
        <span>Lesson: {schoolClass.lesson_record?.name || schoolClass.lesson || "Not set"}</span>
        <span>Teacher: {teacher}</span>
        <span>
          Room: {schoolClass.room_location?.name || schoolClass.roomLocation?.name || schoolClass.room || "Not assigned"}
        </span>
        <span>
          Building: {schoolClass.building_location?.name || schoolClass.buildingLocation?.name || schoolClass.building || "Not set"}
        </span>
      </div>
    </div>
  );
}

function hasScheduleConflict(
  schoolClass: TimetableClass,
  sessions: TimetableSession[],
  dayOfWeek: number,
  startsAt: string,
  endsAt: string,
  ignoreSessionId?: number,
): boolean {
  return sessions.some((session) => {
    if (session.id === ignoreSessionId || session.day_of_week !== dayOfWeek) return false;

    const overlaps =
      session.starts_at.slice(0, 5) < endsAt && session.ends_at.slice(0, 5) > startsAt;
    if (!overlaps) return false;

    const scheduledClass = session.school_class;
    const sameClass = scheduledClass.id === schoolClass.id;
    const sameTeacher = Boolean(
      schoolClass.teacher_id && scheduledClass.teacher_id === schoolClass.teacher_id,
    );
    const sameRoom = roomsMatch(schoolClass, scheduledClass);

    return sameClass || sameTeacher || sameRoom;
  });
}

function roomsMatch(first: TimetableClass, second: TimetableClass): boolean {
  if (first.room_id && second.room_id) return first.room_id === second.room_id;

  const firstRoom = first.room_location?.name || first.room;
  const secondRoom = second.room_location?.name || second.room;
  if (!firstRoom || !secondRoom) return false;

  const firstBuilding = first.building_location?.name || first.building || "";
  const secondBuilding = second.building_location?.name || second.building || "";

  return (
    firstRoom.trim().toLowerCase() === secondRoom.trim().toLowerCase() &&
    firstBuilding.trim().toLowerCase() === secondBuilding.trim().toLowerCase()
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-secondary">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
