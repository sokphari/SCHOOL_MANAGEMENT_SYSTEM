import { useCallback, useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy, faQrcode, faRotate, faXmark } from "@fortawesome/free-solid-svg-icons";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import AppPagination from "@/shared/components/AppPagination.tsx";
import { approveStudentRegistration, getStudentRegistrations, issueStudentRegistrationQr, rejectStudentRegistration } from "@/modules/students/api/studentRegistrationApi";
import type { StudentRegistration, StudentRegistrationPage } from "@/modules/students/types/studentRegistration";

const PAGE_SIZE = 10;
function errorMessage(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "The request could not be completed.";
}

export default function StudentRegistrationsPage() {
  const [pageData, setPageData] = useState<StudentRegistrationPage>({ current_page: 1, data: [], last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState("");
  const [issuingQr, setIssuingQr] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getStudentRegistrations({ page, search, status });
      setPageData(response.data);
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  const approve = async (registration: StudentRegistration) => {
    if (!window.confirm(`Approve ${registration.first_name} ${registration.last_name} and create a student record?`)) return;
    setBusyId(registration.id); setError(""); setNotice("");
    try {
      const result = await approveStudentRegistration(registration.id);
      setNotice(`${result.data.message} Student code: ${result.data.data.student_code}`);
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusyId(null); }
  };

  const reject = async (registration: StudentRegistration) => {
    if (!window.confirm(`Reject the registration for ${registration.first_name} ${registration.last_name}?`)) return;
    setBusyId(registration.id); setError(""); setNotice("");
    try {
      const result = await rejectStudentRegistration(registration.id);
      setNotice(result.data.message);
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusyId(null); }
  };

  const copyLink = async () => {
    if (!registrationUrl) return;
    try { await navigator.clipboard.writeText(registrationUrl); setNotice("Registration link copied."); }
    catch { setNotice(registrationUrl); }
  };

  const issueQr = async () => {
    setIssuingQr(true); setError(""); setNotice("");
    try {
      const response = await issueStudentRegistrationQr();
      const url = new URL("/student-registration", window.location.origin);
      url.hash = `token=${encodeURIComponent(response.data.data.token)}`;
      setRegistrationUrl(url.toString());
      setQrExpiresAt(response.data.data.expires_at);
      setNotice("Single-use QR created. It expires in 24 hours.");
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setIssuingQr(false); }
  };

  const firstItem = pageData.total ? (pageData.current_page - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(pageData.current_page * PAGE_SIZE, pageData.total);

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Student enrollment</p><h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">QR registrations</h1><p className="mb-0 mt-1 text-sm text-secondary">Share the QR code and review applications before enrollment.</p></div>
        <button onClick={() => navigate("/admin/students")} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-primary hover:bg-brand-soft">Back to students</button>
      </header>

      {(notice || error) && <div role={error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"}`}>{error || notice}</div>}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="m-0 text-base font-semibold text-primary">Applications</h2><p className="mb-0 mt-1 text-xs text-secondary">Approve to create the student's school record.</p></div><button onClick={() => void load()} className="grid size-9 place-items-center rounded-lg border border-border text-secondary hover:bg-brand-soft hover:text-brand" title="Refresh applications"><FontAwesomeIcon icon={faRotate} /></button></div>
          <div className="grid gap-3 border-b border-border px-4 py-3 sm:grid-cols-[minmax(220px,1fr)_200px]"><AppInput containerClassName="mb-0" name="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, phone, or email" /><AppSelect containerClassName="mb-0" name="status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} options={[{ label: "Pending", value: "pending" }, { label: "Approved", value: "approved" }, { label: "Rejected", value: "rejected" }, { label: "All applications", value: "" }]} /></div>
          {loading ? <div className="grid min-h-48 place-items-center text-sm text-secondary">Loading registrations…</div> : pageData.data.length ? <>
            <div className="divide-y divide-border">
              {pageData.data.map((item) => <article key={item.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 text-sm font-semibold text-primary">{item.first_name} {item.last_name}</h3><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${item.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" : item.status === "approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"}`}>{item.status}</span></div><p className="mb-0 mt-1 text-xs text-secondary">{item.gender} · {item.phone || "No phone"} · {item.email || "No email"}</p><p className="mb-0 mt-1 text-xs text-muted">Submitted {new Date(item.created_at).toLocaleString()} {item.student?.student_code ? `· Student code ${item.student.student_code}` : ""}</p>{item.review_note && <p className="mb-0 mt-1 text-xs text-secondary">Review note: {item.review_note}</p>}</div>
                {item.status === "pending" && <div className="flex shrink-0 gap-2"><button disabled={busyId === item.id} onClick={() => void approve(item)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><FontAwesomeIcon icon={faCheck} /> Approve</button><button disabled={busyId === item.id} onClick={() => void reject(item)} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"><FontAwesomeIcon icon={faXmark} /> Reject</button></div>}
              </article>)}
            </div>
            <footer className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"><p className="m-0 text-xs text-secondary">Showing {firstItem}–{lastItem} of {pageData.total} applications</p><AppPagination currentPage={pageData.current_page} lastPage={pageData.last_page} onPageChange={setPage} showSinglePage /></footer>
          </> : <div className="grid min-h-48 place-items-center px-4 text-center"><div><p className="m-0 font-semibold text-primary">No registrations found</p><p className="mb-0 mt-1 text-sm text-secondary">New QR submissions will appear here for review.</p></div></div>}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-5 text-center shadow-card"><div className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faQrcode} /></div><h2 className="m-0 text-base font-semibold text-primary">One-time registration QR</h2><p className="mb-4 mt-1 text-xs text-secondary">Issue a fresh QR when a student is ready. Each code accepts one application and expires after 24 hours.</p>{registrationUrl ? <><div className="mx-auto grid w-fit place-items-center rounded-xl border border-border bg-white p-3"><QRCodeCanvas value={registrationUrl} size={180} includeMargin /></div><p className="my-3 break-all text-[11px] text-muted">Expires {qrExpiresAt ? new Date(qrExpiresAt).toLocaleString() : "in 24 hours"}</p><button onClick={() => void copyLink()} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-brand-soft"><FontAwesomeIcon icon={faCopy} /> Copy one-time link</button></> : <div className="mx-auto grid size-48 place-items-center rounded-xl border border-dashed border-border bg-canvas text-xs text-muted">Generate a QR for the next student</div>}<button disabled={issuingQr} onClick={() => void issueQr()} className="mt-3 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60">{issuingQr ? "Generating…" : registrationUrl ? "Issue another QR" : "Generate registration QR"}</button><p className="mb-0 mt-3 text-[11px] text-muted">Applications stay pending until an admin approves them. Used codes cannot be reused.</p></aside>
      </section>
    </div>
  );
}
