import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward, faCalendarDays, faPlus, faUsers } from "@fortawesome/free-solid-svg-icons";
import { getClasses } from "@/modules/classes/api/classApi";
import { getClassTerms } from "@/modules/grades/api/gradeApi";
import type { GradingTerm } from "@/modules/grades/types/grade";
import type { SchoolClass } from "@/modules/classes/types/class";

export default function GradesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [terms, setTerms] = useState<GradingTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getClasses({ page: 1, per_page: 100 })
      .then(({ data }) => {
        const availableClasses = data.data || [];
        setClasses(availableClasses);
        if (availableClasses.length) setSelectedClass(String(availableClasses[0].id));
      })
      .catch(() => setError("Could not load classes."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setTerms([]);
      return;
    }
    setLoading(true);
    setError("");
    getClassTerms(Number(selectedClass))
      .then(({ data }) => setTerms(data))
      .catch(() => setError("Could not load grading terms."))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const className = classes.find((item) => String(item.id) === selectedClass)?.name || "Selected class";

  return (
    <main className="space-y-5 p-5 sm:p-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[1.4px] text-brand">Academic records</p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Grades &amp; Scores</h1>
          <p className="mb-0 mt-1 text-sm text-muted">Manage each term’s attendance, activity, and exam scores.</p>
        </div>
        {selectedClass && <Link to={`/admin/grades/classes/${selectedClass}/terms/create`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white no-underline hover:bg-brand-strong"><FontAwesomeIcon icon={faPlus} />Create term</Link>}
      </header>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <label htmlFor="grade-class" className="mb-2 block text-xs font-semibold text-secondary">Class</label>
        <select id="grade-class" value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand sm:max-w-xl">
          <option value="">Select a class</option>
          {classes.map((item) => <option key={item.id} value={item.id}>{item.name}{item.section ? ` · Section ${item.section}` : ""}</option>)}
        </select>
      </section>

      {error && <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</p>}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faAward} /></span>
          <div><h2 className="m-0 text-sm font-bold text-primary">Terms for {className}</h2><p className="m-0 mt-1 text-xs text-muted">Attendance /40 · Activity /30 · Exam /40 · Total /110</p></div>
        </div>
        {loading ? <p className="px-5 py-8 text-sm text-muted">Loading terms…</p> : terms.length === 0 ? <div className="px-5 py-10 text-center"><FontAwesomeIcon icon={faCalendarDays} className="mb-3 text-2xl text-brand" /><p className="m-0 font-semibold text-primary">No grading terms yet</p><p className="mb-0 mt-1 text-sm text-muted">Create a term and set its start and end dates.</p></div> : <div className="divide-y divide-border">{terms.map((term) => <Link key={term.id} to={`/admin/grades/terms/${term.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-primary no-underline transition hover:bg-brand-soft/30 sm:px-5"><span><span className="block text-sm font-semibold">{term.name}</span><span className="mt-1 block text-xs text-muted">{term.start_date} – {term.end_date}</span></span><span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand"><FontAwesomeIcon icon={faUsers} />{term.scores_count || 0} scored</span></Link>)}</div>}
      </section>
    </main>
  );
}
