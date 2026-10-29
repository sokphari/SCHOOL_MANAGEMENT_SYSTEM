import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faLayerGroup,
  faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCourse, saveLesson } from "@/modules/courses/api/courseApi.ts";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import type {
  Course,
  CourseLesson,
  LessonPayload,
} from "@/modules/courses/types/course";

type Draft = LessonPayload;
const initial: Draft = {
  name: "",
  lesson_number: null,
  description: "",
  status: "active",
};
export default function LessonFormPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<Draft>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  useEffect(() => {
    let active = true;
    getCourse(courseId || "")
      .then(({ data }) => {
        if (!active) return;
        setCourse(data);
        if (lessonId) {
          const lesson: CourseLesson | undefined = data.lessons?.find(
            (item) => item.id === Number(lessonId),
          );
          if (!lesson) setError("Lesson not found in this course.");
          else
            setForm({
              name: lesson.name,
              lesson_number: lesson.lesson_number,
              description: lesson.description || "",
              status: lesson.status,
            });
        }
      })
      .catch((requestError) => {
        console.error(requestError);
        if (active) setError("Could not load course information.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId, lessonId]);
  const change = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.currentTarget;
    setForm((current) => ({
      ...current,
      [name]: name === "lesson_number" ? (value ? Number(value) : null) : value,
    }));
    setErrors((current) => ({ ...current, [name]: [] }));
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!course) return;
    setSaving(true);
    setError("");
    setErrors({});
    try {
      await saveLesson(course.id, form, lessonId);
      navigate(
        `/admin/courses/${course.id}?notice=${encodeURIComponent(lessonId ? "Lesson updated." : "Lesson created.")}`,
      );
    } catch (requestError) {
      console.error(requestError);
      if (axios.isAxiosError(requestError)) {
        setError(
          requestError.response?.data?.message || "Could not save this lesson.",
        );
        setErrors(requestError.response?.data?.errors || {});
      } else setError("Could not save this lesson.");
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <div className="grid min-h-48 place-items-center text-sm text-secondary">
        Loading lesson form…
      </div>
    );
  if (!course)
    return (
      <div
        role="alert"
        className="rounded-xl border border-border bg-surface p-5 text-sm text-rose-600"
      >
        {error || "Course not found."}
      </div>
    );
  return (
    <main className="w-full space-y-4">
      <Link
        to={`/admin/courses/${course.id}`}
        className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-secondary hover:bg-brand-soft hover:text-brand-strong"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to {course.name}
      </Link>
      <form
        onSubmit={submit}
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card"
      >
        <header className="flex items-center gap-3 border-b border-border bg-brand-soft/20 px-5 py-4 sm:px-7">
          <span className="grid size-11 place-items-center rounded-xl bg-brand text-white">
            <FontAwesomeIcon icon={faLayerGroup} />
          </span>
          <div>
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
              {course.name}
            </p>
            <h1 className="m-0 text-xl font-bold text-primary">
              {lessonId ? "Edit lesson" : "Create lesson"}
            </h1>
            <p className="mb-0 mt-0.5 text-sm text-secondary">
              Add or update a lesson within this course.
            </p>
          </div>
        </header>
        <div className="space-y-4 p-5 sm:p-7">
          <section>
            <div className="border-b border-border pb-3">
              <h2 className="m-0 text-base font-semibold text-primary">
                Lesson information
              </h2>
              <p className="mb-0 mt-1 text-sm text-secondary">
                Lesson order is optional; use it to control the display
                sequence.
              </p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AppInput
                label="Lesson name"
                name="name"
                required
                value={form.name}
                onChange={change}
                placeholder="e.g. Algebra Basics"
                error={errors.name?.[0]}
              />
              <AppInput
                label="Lesson number (optional)"
                name="lesson_number"
                type="number"
                value={form.lesson_number ?? ""}
                onChange={change}
                placeholder="e.g. 1"
                error={errors.lesson_number?.[0]}
              />
              <AppSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={change}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
                error={errors.status?.[0]}
              />
              <div className="md:col-span-2">
                <label
                  htmlFor="lesson-description"
                  className="mb-1.5 block text-[13px] font-semibold text-secondary"
                >
                  Description (optional)
                </label>
                <textarea
                  id="lesson-description"
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={change}
                  placeholder="Describe the lesson content"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>
            </div>
          </section>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
            >
              {error}
            </p>
          )}
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-border bg-app-bg/25 px-5 py-3 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={() => navigate(`/admin/courses/${course.id}`)}
            className="min-h-10 rounded-lg border border-border px-4 text-sm font-semibold text-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faFloppyDisk} />
            {saving ? "Saving…" : lessonId ? "Save lesson" : "Create lesson"}
          </button>
        </footer>
      </form>
    </main>
  );
}
