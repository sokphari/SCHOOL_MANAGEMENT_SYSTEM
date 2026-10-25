import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck, faClipboardList, faFloppyDisk, faSpinner, faUser } from "@fortawesome/free-solid-svg-icons";
import { getStudentRequest, updateStudentRequestStatus } from "@/modules/student-requests/api/studentRequestsApi.ts";
import type { StudentRequest, StudentRequestStatus } from "@/modules/student-requests/types/studentRequest";

const statusStyles: Record<StudentRequestStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  in_progress: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  resolved: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  rejected: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(date);
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    const validationMessage = error.response?.data?.errors ? Object.values(error.response.data.errors).flat()[0] : undefined;
    return validationMessage || error.response?.data?.message || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function StudentRequestDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<StudentRequest | null>(null);
  const [status, setStatus] = useState<StudentRequestStatus>("pending");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    const loadRequest = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getStudentRequest(id);
        if (!active) return;
        setRequest(response.data);
        setStatus(response.data.status);
        setAdminNote(response.data.admin_note ?? "");
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadRequest();
    return () => { active = false; };
  }, [id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await updateStudentRequestStatus(id, { status, admin_note: adminNote });
      setRequest(response.data.data);
      setSuccess("Request updated successfully.");
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="grid min-h-64 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading request…</span></div>;
  if (!request) return <div className="rounded-2xl border border-border bg-surface p-6 shadow-card"><p role="alert" className="m-0 text-sm text-rose-600">{error || "Request not found."}</p><button type="button" onClick={() => navigate("/admin/student-requests")} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-strong"><FontAwesomeIcon icon={faArrowLeft} />Back to requests</button></div>;

  const studentName = request.student ? `${request.student.first_name} ${request.student.last_name}` : "Student record unavailable";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4">
      <button type="button" onClick={() => navigate("/admin/student-requests")} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm font-semibold text-secondary shadow-sm transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faArrowLeft} />Back to requests</button>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-brand-soft/30 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faClipboardList} /></span>
            <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Request #{request.id}</p><h1 className="m-0 text-xl font-bold tracking-tight text-primary sm:text-2xl">{request.subject}</h1><p className="mb-0 mt-1 text-sm text-secondary">Received {formatDate(request.created_at)}</p></div>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles[request.status]}`}>{formatLabel(request.status)}</span>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)] lg:p-6">
          <div className="space-y-5">
            <section>
              <h2 className="mb-2 text-sm font-semibold text-primary">Request details</h2>
              <div className="rounded-xl border border-border bg-app-bg/50 p-4">
                <div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong">{formatLabel(request.category)}</span><span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">{formatLabel(request.priority)} priority</span></div>
                <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-secondary">{request.description}</p>
              </div>
            </section>
            <section>
              <h2 className="mb-2 text-sm font-semibold text-primary">Student</h2>
              <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faUser} /></span>
                <div><p className="m-0 text-sm font-semibold text-primary">{studentName}</p><p className="mb-0 mt-0.5 text-xs text-muted">Student code · {request.student_code_snapshot}</p></div>
              </div>
            </section>
          </div>

          <form onSubmit={handleSubmit} className="h-fit rounded-xl border border-border p-4 sm:p-5">
            <div className="mb-4"><h2 className="m-0 text-sm font-semibold text-primary">Follow up</h2><p className="mb-0 mt-1 text-xs text-muted">Update the request status and leave a note for the student record.</p></div>
            <label htmlFor="request-status" className="mb-1.5 block text-[13px] font-semibold text-secondary">Status</label>
            <select id="request-status" value={status} onChange={(event) => setStatus(event.currentTarget.value as StudentRequestStatus)} className="mb-4 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15">
              <option value="pending">Pending</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="rejected">Rejected</option>
            </select>
            <label htmlFor="admin-note" className="mb-1.5 block text-[13px] font-semibold text-secondary">Admin note</label>
            <textarea id="admin-note" value={adminNote} onChange={(event) => setAdminNote(event.currentTarget.value)} rows={5} placeholder="Add an internal follow-up note…" className="mb-4 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" />
            {error && <p role="alert" className="mb-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
            {success && <p role="status" className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><FontAwesomeIcon icon={faCheck} className="mr-2" />{success}</p>}
            <button type="submit" disabled={saving} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={saving ? faSpinner : faFloppyDisk} className={saving ? "animate-spin" : ""} />{saving ? "Updating…" : "Update request"}</button>
          </form>
        </div>
      </section>
    </div>
  );
}
