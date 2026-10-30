import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faAward, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { getClass } from "@/modules/classes/api/classApi";
import { createGradeTerm } from "@/modules/grades/api/gradeApi";
import type { ClassDetails } from "@/modules/classes/api/classApi";

export default function GradeTermCreatePage() {
  const { classId = "" } = useParams();
  const navigate = useNavigate();
  const [schoolClass, setSchoolClass] = useState<ClassDetails | null>(null);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClass(classId).then(({ data }) => setSchoolClass(data)).catch(() => setError("Could not load this class."));
  }, [classId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await createGradeTerm(Number(classId), form);
      navigate(`/admin/grades/terms/${response.data.data.id}`);
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      setError(message?.errors ? Object.values(message.errors).flat()[0] : message?.message || "Could not create this term.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-4 p-5 sm:p-7">
      <Link to="/admin/grades" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-secondary no-underline hover:border-brand/50 hover:text-brand"><FontAwesomeIcon icon={faArrowLeft} />Back to grades</Link>
      <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-4 border-b border-border bg-brand-soft/40 px-5 py-5 sm:px-7">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand text-lg text-white"><FontAwesomeIcon icon={faAward} /></span>
          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">{schoolClass?.name || "Class"}{schoolClass?.section ? ` · Section ${schoolClass.section}` : ""}</p><h1 className="m-0 text-xl font-bold text-primary">Create grading term</h1><p className="mb-0 mt-1 text-sm text-muted">Set the date range used to calculate attendance points.</p></div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-7">
          <Field label="Term name"><input required maxLength={80} placeholder="e.g. Term 1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></Field>
          <Field label="Start date"><input required type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className={inputClass} /></Field>
          <Field label="End date"><input required type="date" min={form.start_date || undefined} value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className={inputClass} /></Field>
          <div className="sm:col-span-3 rounded-xl border border-border bg-page/50 px-4 py-3 text-sm text-secondary">Scoring: Attendance /40 (Absent −1, Permission −0.5, Late no deduction), Activity /30, Exam /40. Total /110.</div>
        </div>
        {error && <p role="alert" className="mx-5 mb-0 rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-600 sm:mx-7">{error}</p>}
        <div className="flex justify-end border-t border-border px-5 py-4 sm:px-7"><button type="submit" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"><FontAwesomeIcon icon={faFloppyDisk} />{saving ? "Creating…" : "Create term"}</button></div>
      </form>
    </main>
  );
}

const inputClass = "min-h-11 w-full rounded-lg border border-border bg-page px-3 text-sm text-primary outline-none focus:border-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-secondary">{label}<span className="mt-2 block">{children}</span></label>;
}
