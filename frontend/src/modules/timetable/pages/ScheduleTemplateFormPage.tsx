import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCalendarDays, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { createClassScheduleTemplate, getClassScheduleTemplates, updateClassScheduleTemplate } from "@/modules/classes/api/classApi";
import type { ClassScheduleTemplate } from "@/modules/classes/types/class";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
type FormState = Omit<ClassScheduleTemplate, "id">;

export default function ScheduleTemplateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState<FormState>({ name: "", days: [], starts_at: "", ends_at: "", status: "active" });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    getClassScheduleTemplates()
      .then(({ data }) => {
        const template = data.find((item) => item.id === Number(id));
        if (!template) throw new Error("Schedule template not found");
        if (active) setForm({ name: template.name, days: template.days, starts_at: template.starts_at.slice(0, 5), ends_at: template.ends_at.slice(0, 5), status: template.status });
      })
      .catch(() => { if (active) setError("Could not load this schedule template."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing && id) await updateClassScheduleTemplate(Number(id), form);
      else await createClassScheduleTemplate(form);
      navigate("/admin/timetable/templates");
    } catch (requestError) {
      const response = (requestError as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      setError(response?.errors ? Object.values(response.errors).flat()[0] : response?.message || "Could not save this schedule.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => setForm((current) => ({
    ...current,
    days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day].sort((a, b) => a - b),
  }));

  if (loading) return <div className="p-8 text-center text-sm text-secondary">Loading schedule…</div>;

  return (
    <main className="w-full min-w-0 space-y-3">
      <Link to="/admin/timetable/templates" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-secondary no-underline hover:border-brand/50 hover:text-brand"><FontAwesomeIcon icon={faArrowLeft} />Back to schedules</Link>
      <form onSubmit={submit} className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <header className="flex items-center gap-3 border-b border-border bg-brand-soft/40 px-5 py-4"><span className="grid size-11 place-items-center rounded-xl bg-brand text-white"><FontAwesomeIcon icon={faCalendarDays} /></span><div><p className="mb-0.5 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Timetable setup</p><h1 className="m-0 text-xl font-bold text-primary">{editing ? "Edit schedule" : "Create schedule"}</h1><p className="mb-0 mt-1 text-sm text-secondary">Save a reusable schedule pattern for class forms.</p></div></header>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <label className="block text-sm font-semibold text-secondary lg:col-span-2">Schedule name<input required maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="For example: Mon–Tue morning" className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-page px-3 text-sm font-normal text-primary outline-none focus:border-brand" /></label>
          <fieldset className="lg:col-span-2"><legend className="text-sm font-semibold text-secondary">Days</legend><p className="mb-3 mt-1 text-xs text-muted">Choose one or more weekdays for this schedule.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{weekdays.map((label, index) => { const day = index + 1; const selected = form.days.includes(day); return <label key={day} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition ${selected ? "border-brand/50 bg-brand-soft/60 text-brand-strong" : "border-border bg-page/50 text-secondary hover:border-brand/30"}`}><input type="checkbox" checked={selected} onChange={() => toggleDay(day)} className="accent-violet-600" />{label}</label>; })}</div></fieldset>
          <label className="block text-sm font-semibold text-secondary">Start time<input required type="time" value={form.starts_at} onChange={(event) => setForm((current) => ({ ...current, starts_at: event.target.value }))} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-page px-3 text-sm font-normal text-primary outline-none focus:border-brand" /></label>
          <label className="block text-sm font-semibold text-secondary">End time<input required type="time" min={form.starts_at || undefined} value={form.ends_at} onChange={(event) => setForm((current) => ({ ...current, ends_at: event.target.value }))} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-page px-3 text-sm font-normal text-primary outline-none focus:border-brand" /></label>
          <label className="block text-sm font-semibold text-secondary">Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as FormState["status"] }))} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-page px-3 text-sm font-normal text-primary outline-none focus:border-brand"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        </div>
        {error && <p role="alert" className="mx-5 mb-0 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</p>}
        <footer className="flex justify-end gap-2 border-t border-border bg-page/30 px-5 py-4"><Link to="/admin/timetable/templates" className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-secondary no-underline hover:bg-brand-soft">Cancel</Link><button type="submit" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"><FontAwesomeIcon icon={faFloppyDisk} />{saving ? "Saving…" : editing ? "Save schedule" : "Create schedule"}</button></footer>
      </form>
    </main>
  );
}
