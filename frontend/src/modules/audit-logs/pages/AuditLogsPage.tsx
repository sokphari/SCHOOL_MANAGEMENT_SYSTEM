import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faEye, faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import AppPagination from "@/shared/components/AppPagination.tsx";
import AppModal from "@/shared/components/AppModal.tsx";
import AppTable from "@/shared/components/AppTable.tsx";
import type { AppTableColumn } from "@/shared/components/AppTable.tsx";
import { getAuditLogs } from "@/modules/audit-logs/api/auditLogsApi";
import type { AuditLogFilters, AuditLogRecord, AuditLogPage } from "@/modules/audit-logs/api/auditLogsApi";

const modules = ["auth", "security", "dashboard", "attendance", "students", "teachers", "classes", "courses", "facilities", "grades", "requests", "settings", "timetable", "roles", "users", "system"];

function dateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getToday(): string {
  return dateInputValue(new Date());
}

function getDateRange(preset: string, customFrom?: string, customTo?: string) {
  if (preset === "custom") return { from: customFrom || "", to: customTo || "" };
  if (preset === "all") return { from: "", to: "" };

  const today = new Date();
  if (preset === "yesterday") today.setDate(today.getDate() - 1);
  if (preset === "week") {
    const current = new Date();
    today.setDate(today.getDate() - ((current.getDay() + 6) % 7));
    return { from: dateInputValue(today), to: getToday() };
  }

  const date = dateInputValue(today);
  return { from: date, to: date };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AuditLogsPage() {
  const [records, setRecords] = useState<AuditLogRecord[]>([]);
  const [pagination, setPagination] = useState<AuditLogPage | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({ search: "", module: "", role: "", date_from: "", date_to: "", page: 1 });
  const [datePreset, setDatePreset] = useState("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AuditLogRecord | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const dateRange = getDateRange(datePreset, filters.date_from, filters.date_to);
    getAuditLogs({ ...filters, search: filters.search || undefined, module: filters.module || undefined, date_from: dateRange.from || undefined, date_to: dateRange.to || undefined })
      .then(({ data }) => {
        if (!active) return;
        setRecords(data.data);
        setPagination(data);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(axios.isAxiosError(requestError) ? requestError.response?.data?.message || "Could not load audit logs." : "Could not load audit logs.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, datePreset]);

  const updateFilter = (key: "search" | "module" | "role" | "date_from" | "date_to", value: string) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const updateDateFilter = (key: "date_from" | "date_to", value: string) => {
    setDatePreset("custom");
    updateFilter(key, value);
  };
  const updateDatePreset = (preset: string) => {
    setDatePreset(preset);
    setFilters((current) => ({
      ...current,
      date_from: preset === "custom" ? current.date_from || "" : "",
      date_to: preset === "custom" ? current.date_to || "" : "",
      page: 1,
    }));
  };
  const columns: AppTableColumn<AuditLogRecord>[] = [
    { key: "created_at", title: "Time", render: (row) => <span className="whitespace-nowrap">{formatDate(row.created_at)}</span> },
    { key: "actor", title: "User", render: (row) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getRoleBadgeClass(row.actor?.role)}`}>{row.actor?.role || "system"}</span> },
    { key: "action", title: "Action", render: (row) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getActionBadgeClass(displayAuditAction(row))}`}>{displayAuditAction(row).replaceAll(".", " · ").replaceAll("_", " ")}</span> },
    { key: "module", title: "Module", render: (row) => <span className="capitalize">{row.module}</span> },
    { key: "route", title: "Request", render: (row) => <span className="flex items-center gap-2"><span className="rounded bg-brand-soft px-2 py-1 text-[10px] font-bold text-brand">{row.method}</span><span className="max-w-[300px] truncate font-mono text-xs">{row.route}</span></span> },
    { key: "status_code", title: "Result", render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status_code < 300 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>{row.status_code}</span> },
    { key: "ip_address", title: "IP address", render: (row) => row.ip_address || "—" },
    { key: "details", title: "Details", render: (row) => <button type="button" aria-label={`View details for ${row.action}`} title="View details" onClick={() => setSelectedRecord(row)} className="grid size-9 place-items-center rounded-lg border border-border text-secondary transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faEye} /></button> },
  ];

  return (
    <main className="w-full min-w-0 space-y-5 p-0">
      <header>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[1.4px] text-brand">Security &amp; accountability</p>
        <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Audit log</h1>
        <p className="mb-0 mt-1 text-sm text-muted">Review admin and teacher changes, failed actions, and security activity.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
          <label className="relative min-w-0 2xl:col-span-2">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" />
            <input aria-label="Search audit logs" value={filters.search || ""} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Search user, action, route, IP…" className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 pl-9 text-sm text-primary outline-none placeholder:text-muted focus:border-brand" />
          </label>
          <select aria-label="Filter by module" value={filters.module || ""} onChange={(event) => updateFilter("module", event.target.value)} className="min-h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand"><option value="">All modules</option>{modules.map((module) => <option key={module} value={module}>{module[0].toUpperCase() + module.slice(1)}</option>)}</select>
          <select aria-label="Filter by role" value={filters.role || ""} onChange={(event) => updateFilter("role", event.target.value)} className="min-h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand"><option value="">All roles</option><option value="admin">Admin</option><option value="teacher">Teacher</option></select>
          <select aria-label="Choose date range" value={datePreset} onChange={(event) => updateDatePreset(event.target.value)} className="min-h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand"><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">This week</option><option value="custom">Custom range</option><option value="all">All time</option></select>
          <input aria-label="From date" type="date" value={filters.date_from || ""} onChange={(event) => updateDateFilter("date_from", event.target.value)} className="min-h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand" />
          <input aria-label="To date" type="date" min={filters.date_from || undefined} value={filters.date_to || ""} onChange={(event) => updateDateFilter("date_to", event.target.value)} className="min-h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand" />
        </div>
        {error && <p role="alert" className="m-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}
        {loading ? <div className="px-5 py-12 text-center text-sm text-muted">Loading audit log…</div> : <AppTable columns={columns} data={records} />}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
          <span className="flex items-center gap-2 text-xs text-muted"><FontAwesomeIcon icon={faClockRotateLeft} />{pagination ? `Showing ${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total} events` : "Activity history"}</span>
          {pagination && <AppPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} showSinglePage />}
        </footer>
      </section>
      <p className="m-0 text-xs text-muted">Create, update, delete, failed state-changing actions, and security events are logged. Normal page and data views are not recorded. Before/after details include only approved changed fields; passwords, tokens, and raw request bodies are never recorded. Older page-view entries remain in history.</p>

      <AppModal open={selectedRecord !== null} onClose={() => setSelectedRecord(null)}>
        {selectedRecord && <section role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" className="w-[min(760px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2"><Badge className="border-brand/20 bg-brand-soft text-brand-strong">{selectedRecord.module}</Badge><Badge className={getActionBadgeClass(displayAuditAction(selectedRecord))}>{displayAuditAction(selectedRecord).split(".").at(-1)?.replaceAll("_", " ")}</Badge></div>
              <h2 id="audit-detail-title" className="m-0 text-lg font-bold text-primary">{displayAuditAction(selectedRecord).replaceAll(".", " · ").replaceAll("_", " ")}</h2>
              <p className="mb-0 mt-1 text-sm text-muted">{formatDate(selectedRecord.created_at)}</p>
            </div>
            <button type="button" aria-label="Close audit details" onClick={() => setSelectedRecord(null)} className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-secondary transition hover:bg-brand-soft hover:text-primary"><FontAwesomeIcon icon={faXmark} /></button>
          </header>
          <div className="grid grid-cols-1 gap-3 border-b border-border p-5 sm:grid-cols-2 sm:px-6">
            <DetailValue label="User" value={<span className="flex flex-wrap items-center gap-2">{selectedRecord.actor?.name || "System / deleted user"}<Badge className={getRoleBadgeClass(selectedRecord.actor?.role)}>{selectedRecord.actor?.role || "system"}</Badge></span>} />
            <DetailValue label="Result" value={<Badge className={selectedRecord.status_code < 300 ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-rose-500/20 bg-rose-500/10 text-rose-500"}>{selectedRecord.status_code} · {selectedRecord.status_code < 300 ? "Success" : "Failed"}</Badge>} />
            <DetailValue label="Request" value={<span className="flex flex-wrap items-center gap-2"><Badge className={getMethodBadgeClass(selectedRecord.method)}>{selectedRecord.method}</Badge><span className="break-all font-mono text-xs">{selectedRecord.route}</span></span>} />
            <DetailValue label="IP address" value={selectedRecord.ip_address || "—"} />
            <DetailValue label="Record" value={selectedRecord.subject_type ? <span className="flex flex-wrap items-center gap-2"><Badge className="border-sky-500/20 bg-sky-500/10 text-sky-500">{selectedRecord.subject_type}</Badge>{selectedRecord.subject_id && <span className="text-xs text-muted">ID {selectedRecord.subject_id}</span>}</span> : "—"} />
          </div>
          <div className="p-5 sm:p-6">
            <h3 className="mb-3 mt-0 flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">Before and after{Object.keys(selectedRecord.metadata?.changes || {}).length > 0 && <Badge className="border-border bg-app-bg text-secondary">{Object.keys(selectedRecord.metadata?.changes || {}).length} changed</Badge>}</h3>
            {Object.keys(selectedRecord.metadata?.changes || {}).length > 0 ? <div className="space-y-3">
              {Object.entries(selectedRecord.metadata?.changes || {}).map(([field, change]) => <article key={field} className="rounded-xl border border-border bg-app-bg p-3.5">
                <h4 className="mb-3 mt-0 text-xs font-semibold capitalize tracking-wide text-secondary">{field.replaceAll("_", " ")}</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="min-w-0 rounded-lg border border-border bg-surface px-3.5 py-3">
                    <div className="mb-2"><Badge className="border-border bg-app-bg text-secondary">Before</Badge></div>
                    <p className="m-0 break-words text-sm text-secondary">{formatAuditValue(change.before)}</p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-brand/25 bg-brand-soft/40 px-3.5 py-3">
                    <div className="mb-2"><Badge className="border-brand/20 bg-brand-soft text-brand-strong">After</Badge></div>
                    <p className="m-0 break-words text-sm font-medium text-primary">{formatAuditValue(change.after)}</p>
                  </div>
                </div>
              </article>)}
            </div> : <p className="m-0 rounded-lg border border-border bg-app-bg px-4 py-3 text-sm text-muted">No before/after field changes were captured for this event. This can happen for page views, sign-ins, or older audit records.</p>}
          </div>
        </section>}
      </AppModal>
    </main>
  );
}

function DetailValue({ label, value }: { label: string; value: ReactNode }) {
  return <div className="min-w-0 rounded-lg border border-border bg-app-bg px-3 py-2.5"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p><div className="break-words text-sm text-primary">{value}</div></div>;
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold leading-none ${className}`}>{children}</span>;
}

function getActionBadgeClass(action: string): string {
  if (/(failed|denied|rejected|deleted|removed)/i.test(action)) return "border-rose-500/20 bg-rose-500/10 text-rose-500";
  if (/(created|approved|granted|success)/i.test(action)) return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  if (/(updated|changed|transferred|switched|marked)/i.test(action)) return "border-amber-500/20 bg-amber-500/10 text-amber-500";
  return "border-sky-500/20 bg-sky-500/10 text-sky-500";
}

function displayAuditAction(record: AuditLogRecord): string {
  if (!record.action.endsWith(".action_failed")) return record.action;

  const verb = record.method === "DELETE"
    ? "delete"
    : record.method === "PUT" || record.method === "PATCH"
      ? "update"
      : record.method === "POST"
        ? "create"
        : "change";

  return `${record.module}.${verb}_failed`;
}

function getMethodBadgeClass(method: string): string {
  if (method === "GET") return "border-sky-500/20 bg-sky-500/10 text-sky-500";
  if (method === "POST") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  if (method === "DELETE") return "border-rose-500/20 bg-rose-500/10 text-rose-500";
  return "border-amber-500/20 bg-amber-500/10 text-amber-500";
}

function getRoleBadgeClass(role?: string | null): string {
  switch (role?.toLowerCase()) {
    case "admin":
      return "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-200";
    case "teacher":
      return "border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-200";
    default:
      return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-400/30 dark:bg-slate-500/20 dark:text-slate-200";
  }
}

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
