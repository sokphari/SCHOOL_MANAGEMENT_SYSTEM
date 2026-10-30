import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFloppyDisk, faUsers } from "@fortawesome/free-solid-svg-icons";
import { getGradeTerm, saveStudentTermScore } from "@/modules/grades/api/gradeApi";
import type { GradeTermDetails, StudentTermScore } from "@/modules/grades/types/grade";
import { useAuth } from "@/modules/auth/hooks/useAuth";

type ManualScore = { activity_score: string; exam_score: string };

export default function GradeTermPage() {
  const { termId = "" } = useParams();
  const { user } = useAuth();
  const canEnterScores = user?.role === "admin" || Boolean(user?.feature_permissions?.includes("grades.enter_scores"));
  const [details, setDetails] = useState<GradeTermDetails | null>(null);
  const [drafts, setDrafts] = useState<Record<number, ManualScore>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getGradeTerm(Number(termId));
      setDetails(data);
      setDrafts(Object.fromEntries(data.students.map((student) => [student.id, {
        activity_score: student.activity_score === null ? "" : String(student.activity_score),
        exam_score: student.exam_score === null ? "" : String(student.exam_score),
      }])));
      setError("");
    } catch {
      setError("Could not load this grading term.");
    } finally {
      setLoading(false);
    }
  }, [termId]);

  useEffect(() => { void load(); }, [load]);

  const save = async (student: StudentTermScore) => {
    const values = drafts[student.id];
    const activity = values?.activity_score.trim() ?? "";
    const exam = values?.exam_score.trim() ?? "";
    if ((activity && (Number(activity) < 0 || Number(activity) > 30)) || (exam && (Number(exam) < 0 || Number(exam) > 40))) {
      setError("Activity must be from 0 to 30 and Exam must be from 0 to 40.");
      return;
    }
    setSavingId(student.id);
    setError("");
    setMessage("");
    try {
      await saveStudentTermScore(Number(termId), student.id, {
        activity_score: activity === "" ? null : Number(activity),
        exam_score: exam === "" ? null : Number(exam),
      });
      setMessage(`Scores saved for ${student.name}.`);
      await load();
    } catch (requestError: unknown) {
      const response = (requestError as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      setError(response?.errors ? Object.values(response.errors).flat()[0] : response?.message || "Could not save this student's scores.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="w-full min-w-0 space-y-4 p-0">
      <Link to="/admin/grades" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-secondary no-underline hover:border-brand/50 hover:text-brand"><FontAwesomeIcon icon={faArrowLeft} />Back to grades</Link>
      {loading ? <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">Loading grade records…</p> : !details ? <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-600">{error || "This grading term could not be found."}</p> : <>
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">{details.class.name}{details.class.section ? ` · Section ${details.class.section}` : ""}</p>
          <h1 className="m-0 text-2xl font-bold text-primary">{details.term.name}</h1>
          <p className="mb-4 mt-1 text-sm text-muted">{details.term.start_date} – {details.term.end_date}</p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold"><ScoreLegend label="Attendance" maximum={40} /><ScoreLegend label="Activity" maximum={30} /><ScoreLegend label="Exam" maximum={40} /><ScoreLegend label="Total" maximum={110} /></div>
        </section>
        {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">{message}</p>}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5"><span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faUsers} /></span><div><h2 className="m-0 text-sm font-bold text-primary">Student scores</h2><p className="m-0 mt-1 text-xs text-muted">{details.students.length} students · Attendance calculated from saved records in this term</p></div></div>
          {details.students.length === 0 ? <p className="p-6 text-sm text-muted">No students are assigned to this class.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] border-collapse text-left"><thead className="bg-brand-soft/35 text-[10px] uppercase tracking-wide text-secondary"><tr>{["No.", "Student", "Attendance /40", "Activity /30", "Exam /40", "Total /110", ...(canEnterScores ? [""] : [])].map((title, index) => <th key={`${title}-${index}`} className="px-3 py-3 font-bold first:pl-5">{title}</th>)}</tr></thead><tbody className="divide-y divide-border">{details.students.map((student, index) => {
            const draft = drafts[student.id] || { activity_score: "", exam_score: "" };
            const total = student.attendance_score + (Number(draft.activity_score) || 0) + (Number(draft.exam_score) || 0);
            return <tr key={student.id} className="align-middle text-sm text-primary"><td className="px-3 py-3 pl-5 text-muted">{index + 1}</td><td className="px-3 py-3"><span className="block font-semibold">{student.name}</span><span className="mt-0.5 block text-xs text-muted">{student.student_code}</span></td><td className="px-3 py-3"><span className="font-semibold">{student.attendance_score}</span><span className="mt-1 block text-[10px] text-muted">{student.absent_count} absent · {student.permission_count} permission · {student.late_count} late</span></td><td className="px-3 py-3"><ScoreInput ariaLabel={`${student.name} activity score`} value={draft.activity_score} max={30} disabled={!canEnterScores} onChange={(value) => setDrafts((current) => ({ ...current, [student.id]: { ...draft, activity_score: value } }))} /></td><td className="px-3 py-3"><ScoreInput ariaLabel={`${student.name} exam score`} value={draft.exam_score} max={40} disabled={!canEnterScores} onChange={(value) => setDrafts((current) => ({ ...current, [student.id]: { ...draft, exam_score: value } }))} /></td><td className="px-3 py-3 font-bold">{total.toFixed(1)}<span className="font-normal text-muted"> / 110</span></td>{canEnterScores && <td className="px-3 py-3 pr-5"><button type="button" onClick={() => void save(student)} disabled={savingId === student.id} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-strong disabled:opacity-50"><FontAwesomeIcon icon={faFloppyDisk} />{savingId === student.id ? "Saving…" : "Save"}</button></td>}</tr>;
          })}</tbody></table></div>}
        </section>
      </>}
    </main>
  );
}

function ScoreInput({ ariaLabel, value, max, disabled, onChange }: { ariaLabel: string; value: string; max: number; disabled: boolean; onChange: (value: string) => void }) {
  return <input aria-label={ariaLabel} type="number" min="0" max={max} step="0.5" value={value} onChange={(event) => onChange(event.target.value)} placeholder="—" disabled={disabled} className="min-h-10 w-24 rounded-lg border border-border bg-page px-2.5 text-sm text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-60" />;
}

function ScoreLegend({ label, maximum }: { label: string; maximum: number }) {
  return <span className="rounded-full border border-border bg-page px-3 py-1.5 text-secondary">{label} <strong className="text-primary">/{maximum}</strong></span>;
}
