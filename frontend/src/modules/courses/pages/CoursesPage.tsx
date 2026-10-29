import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faChevronRight,
  faGraduationCap,
  faLayerGroup,
  faMagnifyingGlass,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { deleteCourse, getCourses } from "@/modules/courses/api/courseApi.ts";
import type { Course } from "@/modules/courses/types/course";

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getCourses();
      setCourses(data || []);
      setError("");
    } catch (requestError) {
      console.error(requestError);
      setError("Could not load courses.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(
    () =>
      courses.filter((course) =>
        `${course.name} ${course.code || ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [courses, search],
  );
  const remove = async (course: Course) => {
    if (!window.confirm(`Delete ${course.name}?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteCourse(course.id);
      setSuccess("Course deleted successfully.");
      await load();
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError)
          ? requestError.response?.data?.message ||
              "Could not delete this course."
          : "Could not delete this course.",
      );
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand">
            Academic catalog
          </p>
          <h1 className="m-0 text-2xl font-bold text-primary sm:text-[28px]">
            Courses &amp; Lessons
          </h1>
          <p className="mb-0 mt-1 text-sm text-secondary">
            Organize courses and the lessons taught in each one.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/courses/create")}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add course
        </button>
      </header>
      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {success}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3.5 sm:p-4">
          <div>
            <h2 className="m-0 text-sm font-semibold text-primary">
              Course catalog
            </h2>
            <p className="mb-0 mt-0.5 text-xs text-muted">
              {courses.length} {courses.length === 1 ? "course" : "courses"}
            </p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Search course name or code"
              className="min-h-9 w-full rounded-lg border border-border bg-app-bg/40 py-2 pl-9 pr-3 text-sm text-primary outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>
        </div>
        {loading ? (
          <div className="grid min-h-40 place-items-center text-sm text-secondary">
            Loading courses…
          </div>
        ) : visible.length ? (
          <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((course) => (
              <article
                key={course.id}
                className="rounded-xl border border-border bg-surface-raised p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                    <FontAwesomeIcon icon={faBookOpen} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="m-0 truncate text-sm font-semibold text-primary">
                        {course.name}
                      </h3>
                      <Status status={course.status} />
                    </div>
                    <p className="mb-0 mt-1 text-xs text-muted">
                      {course.code || "No course code"}
                    </p>
                  </div>
                </div>
                <p className="mb-0 mt-3 line-clamp-2 min-h-9 text-xs text-secondary">
                  {course.description || "No course description provided."}
                </p>
                <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon
                      icon={faLayerGroup}
                      className="text-brand"
                    />
                    {course.lessons_count ?? course.lessons?.length ?? 0}{" "}
                    lessons
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon
                      icon={faGraduationCap}
                      className="text-brand"
                    />
                    {course.school_classes_count ?? 0} classes
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Link
                    to={`/admin/courses/${course.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong hover:underline"
                  >
                    View lessons{" "}
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-[10px]"
                    />
                  </Link>
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/courses/${course.id}/edit`}
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-brand-soft hover:text-brand-strong"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void remove(course)}
                      aria-label={`Delete ${course.name}`}
                      className="grid size-8 place-items-center rounded-md border border-border text-secondary hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:border-rose-900 dark:hover:bg-rose-950/40"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-40 place-items-center p-6 text-center">
            <div>
              <h3 className="m-0 text-sm font-semibold text-primary">
                {search ? "No matching courses" : "No courses yet"}
              </h3>
              <p className="mb-0 mt-1 text-xs text-secondary">
                {search
                  ? "Try another course name or code."
                  : "Add a course to build your academic catalog."}
              </p>
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
