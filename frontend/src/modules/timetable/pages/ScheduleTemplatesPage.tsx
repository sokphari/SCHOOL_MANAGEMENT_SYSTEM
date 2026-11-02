import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faPencil, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { deleteClassScheduleTemplate, getClassScheduleTemplates } from "@/modules/classes/api/classApi";
import type { ClassScheduleTemplate } from "@/modules/classes/types/class";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const formatDays = (days: number[]) => days.map((day) => dayNames[day - 1]?.slice(0, 3)).filter(Boolean).join(", ");
const formatTime = (value: string) => new Date(`1970-01-01T${value}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ScheduleTemplatesPage() {
  const [templates, setTemplates] = useState<ClassScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getClassScheduleTemplates()
      .then(({ data }) => setTemplates(data))
      .catch(() => setError("Could not load schedule templates."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (template: ClassScheduleTemplate) => {
    if (!window.confirm(`Delete the “${template.name}” schedule template?`)) return;
    try {
      await deleteClassScheduleTemplate(template.id);
      setTemplates((current) => current.filter((item) => item.id !== template.id));
    } catch {
      setError("Could not delete this schedule template.");
    }
  };

  return (
    <main className="w-full min-w-0 space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">Timetable setup</p><h1 className="m-0 text-2xl font-bold text-primary">Schedule templates</h1><p className="mb-0 mt-1 text-sm text-secondary">Manage reusable class days and time ranges. Templates are loaded from the database.</p></div>
        <Link to="/admin/timetable/templates/create" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white no-underline hover:bg-brand-strong"><FontAwesomeIcon icon={faPlus} />Create schedule</Link>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3"><span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faClock} /></span><div><h2 className="m-0 text-sm font-semibold text-primary">Saved schedules</h2><p className="mb-0 mt-0.5 text-xs text-secondary">{templates.length} templates available for class forms</p></div></div>
        {loading ? <div className="p-8 text-center text-sm text-secondary">Loading schedule templates…</div> : templates.length === 0 ? <div className="grid min-h-44 place-items-center p-6 text-center"><div><p className="m-0 font-semibold text-primary">No schedules saved yet</p><p className="mb-3 mt-1 text-sm text-secondary">Create a days and time pattern to use it when creating classes.</p><Link to="/admin/timetable/templates/create" className="text-sm font-semibold text-brand-strong">Create your first schedule</Link></div></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-brand-soft/40 text-[11px] uppercase tracking-wide text-secondary"><tr><th className="px-4 py-3">Schedule name</th><th className="px-4 py-3">Days</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">{templates.map((template) => <tr key={template.id} className="text-primary"><td className="px-4 py-3 font-semibold">{template.name}</td><td className="px-4 py-3 text-secondary">{formatDays(template.days)}</td><td className="px-4 py-3 text-secondary">{formatTime(template.starts_at.slice(0, 5))} – {formatTime(template.ends_at.slice(0, 5))}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${template.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400"}`}>{template.status}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Link aria-label={`Edit ${template.name}`} title="Edit schedule" to={`/admin/timetable/templates/${template.id}/edit`} className="grid size-9 place-items-center rounded-lg border border-border text-secondary hover:border-brand/50 hover:text-brand"><FontAwesomeIcon icon={faPencil} /></Link><button type="button" aria-label={`Delete ${template.name}`} title="Delete schedule" onClick={() => void remove(template)} className="grid size-9 place-items-center rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10"><FontAwesomeIcon icon={faTrash} /></button></div></td></tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  );
}
