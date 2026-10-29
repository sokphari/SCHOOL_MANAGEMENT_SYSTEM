import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookOpen,
  faGraduationCap,
  faLayerGroup,
  faPenToSquare,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  deleteCourse,
  deleteLesson,
  getCourse,
} from "@/modules/courses/api/courseApi.ts";
import type { Course } from "@/modules/courses/types/course";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(params.get("notice") || "");
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getCourse(id || "");
      setCourse(data);
      setError("");
    } catch (requestError) {
      console.error(requestError);
      setError("Could not load this course.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [id]);
  useEffect(() => {
    const notice = params.get("notice");
    if (!notice) return;
    setSuccess(notice);
    const next = new URLSearchParams(params);
    next.delete("notice");
    setParams(next, { replace: true });
  }, [params, setParams]);
  const removeCourse = async () => {
    if (!course || !window.confirm(`Delete ${course.name}?`)) return;
    try {
      await deleteCourse(course.id);
      navigate("/admin/courses", { replace: true });
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError)
          ? requestError.response?.data?.message ||
              "Could not delete this course."
          : "Could not delete this course.",
      );
    }
  };
  const removeLesson = async (lessonId: number, lessonName: string) => {
    if (!window.confirm(`Delete lesson ${lessonName}?`)) return;
    try {
      await deleteLesson(lessonId);
      setSuccess("Lesson deleted.");
      await load();
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError)
          ? requestError.response?.data?.message ||
              "Could not delete this lesson."
          : "Could not delete this lesson.",
      );
    }
  };
  if (loading)
    return (
      <div className="grid min-h-48 place-items-center text-sm text-secondary">
        Loading course…
      </div>
    );
  if (!course)
    return (
      <main className="rounded-xl border border-border bg-surface p-5">
        <p role="alert" className="text-sm text-rose-600">
          {error || "Course not found."}
        </p>
        <Link to="/admin/courses" className="font-semibold text-brand-strong">
          Back to courses
        </Link>
      </main>
    );
  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/courses"
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-secondary hover:bg-brand-soft hover:text-brand-strong"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to courses
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-secondary hover:bg-brand-soft hover:text-brand-strong"
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            Edit course
          </button>
          <button
            type="button"
            onClick={() => void removeCourse()}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-secondary hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:border-rose-900 dark:hover:bg-rose-950/40"
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </button>
        </div>
      </div>
      {success && (
        <p
          role="status"
          className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {success}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
        >
          {error}
        </p>
      )}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <header className="flex flex-wrap items-center gap-4 border-b border-border bg-brand-soft/20 px-5 py-5 sm:px-7">
          <span className="grid size-12 place-items-center rounded-xl bg-brand text-white">
            <FontAwesomeIcon icon={faBookOpen} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand">
              Course
            </p>
            <h1 className="m-0 text-xl font-bold text-primary sm:text-2xl">
              {course.name}
            </h1>
            <p className="mb-0 mt-1 text-sm text-secondary">
              {course.code || "No course code"}
              {course.description ? ` · ${course.description}` : ""}
            </p>
          </div>
          <Status status={course.status} />
        </header>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <Metric
            icon={faLayerGroup}
            label="Lessons"
            value={course.lessons_count ?? course.lessons?.length ?? 0}
          />
          <Metric
            icon={faGraduationCap}
            label="Classes using course"
            value={course.school_classes_count ?? 0}
          />
          <Metric icon={faBookOpen} label="Status" value={course.status} />
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="m-0 text-base font-semibold text-primary">
              Lessons
            </h2>
            <p className="mb-0 mt-0.5 text-xs text-muted">
              Manage lessons available for this course.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(`/admin/courses/${course.id}/lessons/create`)
            }
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-semibold text-white"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add lesson
          </button>
        </header>
        {course.lessons?.length ? (
          <div className="divide-y divide-border">
            {course.lessons.map((lesson) => (
              <article
                key={lesson.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-sm font-bold text-brand-strong">
                  {lesson.lesson_number ?? "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="m-0 text-sm font-semibold text-primary">
                      {lesson.name}
                    </h3>
                    <Status status={lesson.status} />
                  </div>
                  {lesson.description && (
                    <p className="mb-0 mt-0.5 text-xs text-secondary">
                      {lesson.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/courses/${course.id}/lessons/${lesson.id}/edit`,
                      )
                    }
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-secondary hover:bg-brand-soft hover:text-brand-strong"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeLesson(lesson.id, lesson.name)}
                    aria-label={`Delete ${lesson.name}`}
                    className="grid size-8 place-items-center rounded-lg border border-border text-secondary hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:border-rose-900 dark:hover:bg-rose-950/40"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-32 place-items-center px-5 text-center">
            <div>
              <p className="m-0 text-sm font-semibold text-primary">
                No lessons in this course yet
              </p>
              <p className="mb-3 mt-1 text-xs text-secondary">
                Add lessons so staff can select them when assigning a class.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate(`/admin/courses/${course.id}/lessons/create`)
                }
                className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                Add lesson
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
function Status({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
    >
      {status}
    </span>
  );
}
function Metric({
  icon,
  label,
  value,
}: {
  icon: typeof faBookOpen;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-app-bg/25 p-3">
      <FontAwesomeIcon icon={icon} className="mb-1.5 text-xs text-brand" />
      <p className="m-0 text-lg font-bold capitalize text-primary">{value}</p>
      <p className="mb-0 mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
