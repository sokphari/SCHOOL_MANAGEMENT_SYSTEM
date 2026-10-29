import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookOpen,
  faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCourse, saveCourse } from "@/modules/courses/api/courseApi.ts";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import type { CoursePayload } from "@/modules/courses/types/course";

type Draft = CoursePayload;
const empty: Draft = { name: "", code: "", description: "", status: "active" };

export default function CourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Draft>(empty);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (!id) return;
    let active = true;
    getCourse(id)
      .then(({ data }) => {
        if (active)
          setForm({
            name: data.name,
            code: data.code || "",
            description: data.description || "",
            status: data.status,
          });
      })
      .catch((requestError) => {
        console.error(requestError);
        if (active) setError("Could not load this course.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  const change = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.currentTarget;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: [] }));
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setErrors({});
    try {
      const { data } = await saveCourse(form, id);
      const courseId = data?.data?.id || id;
      navigate(
        `/admin/courses/${courseId}?notice=${encodeURIComponent(id ? "Course updated." : "Course created.")}`,
      );
    } catch (requestError) {
      console.error(requestError);
      if (axios.isAxiosError(requestError)) {
        setError(
          requestError.response?.data?.message || "Could not save this course.",
        );
        setErrors(requestError.response?.data?.errors || {});
      } else setError("Could not save this course.");
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <div className="grid min-h-48 place-items-center text-sm text-secondary">
        Loading course…
      </div>
    );
  return (
    <main className="w-full space-y-4">
      <Link
        to={id ? `/admin/courses/${id}` : "/admin/courses"}
        className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-secondary hover:bg-brand-soft hover:text-brand-strong"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to {id ? "course" : "courses"}
      </Link>
      <form
        onSubmit={submit}
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card"
      >
        <header className="flex items-center gap-3 border-b border-border bg-brand-soft/20 px-5 py-4 sm:px-7">
          <span className="grid size-11 place-items-center rounded-xl bg-brand text-white">
            <FontAwesomeIcon icon={faBookOpen} />
          </span>
          <div>
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
              Academic catalog
            </p>
            <h1 className="m-0 text-xl font-bold capitalize text-primary">
              {id ? "Edit course" : "Create course"}
            </h1>
            <p className="mb-0 mt-0.5 text-sm text-secondary">
              Manage course identity, code, and availability.
            </p>
          </div>
        </header>
        <div className="space-y-4 p-5 sm:p-7">
          <section>
            <SectionTitle
              title="Course information"
              description="Use a clear name so staff can select this course when creating classes."
            />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AppInput
                label="Course name"
                name="name"
                required
                value={form.name}
                onChange={change}
                placeholder="e.g. Web Development"
                error={errors.name?.[0]}
              />
              <AppInput
                label="Course code (optional)"
                name="code"
                value={form.code}
                onChange={change}
                placeholder="e.g. WEB-01"
                error={errors.code?.[0]}
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
                  htmlFor="course-description"
                  className="mb-1.5 block text-[13px] font-semibold text-secondary"
                >
                  Description (optional)
                </label>
                <textarea
                  id="course-description"
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={change}
                  placeholder="Describe what this course covers"
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
            onClick={() =>
              navigate(id ? `/admin/courses/${id}` : "/admin/courses")
            }
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
            {saving ? "Saving…" : id ? "Save course" : "Create course"}
          </button>
        </footer>
      </form>
    </main>
  );
}
function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-border pb-3">
      <h2 className="m-0 text-base font-semibold text-primary">{title}</h2>
      <p className="mb-0 mt-1 text-sm text-secondary">{description}</p>
    </div>
  );
}
