import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList, faEye, faInbox, faMagnifyingGlass, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { getStudentRequests } from "@/modules/student-requests/api/studentRequestsApi.ts";
import type { StudentRequest, StudentRequestCategory, StudentRequestFilters, StudentRequestStatus } from "@/modules/student-requests/types/studentRequest";
import AppPagination from "@/shared/components/AppPagination.tsx";
import AppTable from "@/shared/components/AppTable.tsx";
import type { AppTableColumn } from "@/shared/components/AppTable.tsx";

const statusOptions: { label: string; value: StudentRequestStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "In progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Rejected", value: "rejected" },
];

const categoryOptions: { label: string; value: StudentRequestCategory | "" }[] = [
  { label: "All categories", value: "" },
  { label: "Teacher feedback", value: "teacher_feedback" },
  { label: "Room issue", value: "room_issue" },
  { label: "Facility issue", value: "facility_issue" },
  { label: "Class request", value: "class_request" },
  { label: "General request", value: "general_request" },
];

const statusStyles: Record<StudentRequestStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  in_progress: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  resolved: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  rejected: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
};

const priorityStyles: Record<StudentRequest["priority"], string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return "Could not load student requests. Please try again.";
}

export default function StudentRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [filters, setFilters] = useState<StudentRequestFilters>({ search: "", status: "", category: "", page: 1 });
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getStudentRequests(filters);
        if (id !== requestId.current) return;
        setRequests(response.data.data ?? []);
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          total: response.data.total,
        });
      } catch (requestError) {
        if (id !== requestId.current) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, filters.search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [filters]);

  const updateFilter = (key: "search" | "status" | "category", value: string) => {
    if (key === "search") setFilters((current) => ({ ...current, search: value, page: 1 }));
    else if (key === "status") setFilters((current) => ({ ...current, status: value as StudentRequestStatus | "", page: 1 }));
    else setFilters((current) => ({ ...current, category: value as StudentRequestCategory | "", page: 1 }));
  };

  const columns: AppTableColumn<StudentRequest>[] = [
    {
      key: "row",
      title: "No.",
      render: (_request: StudentRequest, index: number) => <span className="font-medium text-muted">{(pagination.current_page - 1) * 10 + index + 1}</span>,
    },
    {
      key: "student",
      title: "Student",
      render: (request: StudentRequest) => <div><p className="m-0 font-semibold text-primary">{request.student ? `${request.student.first_name} ${request.student.last_name}` : "Student record unavailable"}</p><p className="mb-0 mt-0.5 text-xs text-muted">{request.student_code_snapshot}</p></div>,
    },
    {
      key: "request",
      title: "Request",
      render: (request: StudentRequest) => <div className="max-w-sm"><p className="m-0 truncate font-semibold text-primary" title={request.subject}>{request.subject}</p><span className="mt-1 inline-flex rounded-full border border-brand/20 bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-strong">{formatLabel(request.category)}</span></div>,
    },
    {
      key: "priority",
      title: "Priority",
      render: (request: StudentRequest) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[request.priority]}`}>{formatLabel(request.priority)}</span>,
    },
    {
      key: "status",
      title: "Status",
      render: (request: StudentRequest) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>{formatLabel(request.status)}</span>,
    },
    { key: "created_at", title: "Received", render: (request: StudentRequest) => <span className="whitespace-nowrap text-sm text-secondary">{formatDate(request.created_at)}</span> },
    {
      key: "actions",
      title: "",
      render: (request: StudentRequest) => <button type="button" aria-label={`View request from ${request.student_code_snapshot}`} title="View request" onClick={() => navigate(`/admin/student-requests/${request.id}`)} className="grid size-9 place-items-center rounded-lg border border-border text-secondary transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faEye} /></button>,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Student support</p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Student requests</h1>
          <p className="mb-0 mt-1 text-sm text-secondary">Review inquiries and follow up with students.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong"><FontAwesomeIcon icon={faClipboardList} />{pagination.total} total</span>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="grid grid-cols-1 gap-3 border-b border-border p-3 sm:grid-cols-[minmax(240px,1fr)_190px_220px] sm:p-4">
          <label className="relative block min-w-0">
            <span className="sr-only">Search requests</span>
            <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" />
            <input type="search" value={filters.search ?? ""} onChange={(event) => updateFilter("search", event.currentTarget.value)} placeholder="Search student, subject, or code…" className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </label>
          <label><span className="sr-only">Filter by status</span><select value={filters.status ?? ""} onChange={(event) => updateFilter("status", event.currentTarget.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15">{statusOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}</select></label>
          <label><span className="sr-only">Filter by category</span><select value={filters.category ?? ""} onChange={(event) => updateFilter("category", event.currentTarget.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15">{categoryOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}</select></label>
        </div>

        {error && <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><span>{error}</span><button type="button" onClick={() => setFilters((current) => ({ ...current }))} className="inline-flex items-center gap-2 font-semibold"><FontAwesomeIcon icon={faRotateRight} />Retry</button></div>}

        {loading ? <div className="grid min-h-56 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading requests…</span></div>
          : requests.length ? <>
            <div className="px-1"><AppTable columns={columns} data={requests} /></div>
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="m-0 text-xs text-secondary">Showing <span className="font-semibold text-primary">{Math.min((pagination.current_page - 1) * 10 + 1, pagination.total)}–{Math.min(pagination.current_page * 10, pagination.total)}</span> of <span className="font-semibold text-primary">{pagination.total}</span> requests</p>
              <AppPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
            </div>
          </> : !error && <div className="grid min-h-56 place-items-center px-5 text-center"><div><span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faInbox} /></span><p className="m-0 text-sm font-semibold text-primary">No requests found</p><p className="mb-0 mt-1 text-xs text-muted">Try changing your search or filters.</p></div></div>}
      </section>
    </div>
  );
}
