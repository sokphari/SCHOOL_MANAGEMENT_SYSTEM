import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import AppPagination from "@/shared/components/AppPagination.tsx";
import AppTable from "@/shared/components/AppTable.tsx";
import type { AppTableColumn } from "@/shared/components/AppTable.tsx";
import { getAuditLogs } from "@/modules/audit-logs/api/auditLogsApi";
import type { AuditLogFilters, AuditLogRecord, AuditLogPage } from "@/modules/audit-logs/api/auditLogsApi";

const modules = ["auth", "security", "attendance", "classes", "courses", "facilities", "grades", "requests", "settings", "students", "teachers", "timetable"];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AuditLogsPage() {
  const [records, setRecords] = useState<AuditLogRecord[]>([]);
  const [pagination, setPagination] = useState<AuditLogPage | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({ search: "", module: "", date_from: "", date_to: "", page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getAuditLogs({ ...filters, search: filters.search || undefined, module: filters.module || undefined, date_from: filters.date_from || undefined, date_to: filters.date_to || undefined })
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
  }, [filters]);

  const updateFilter = (key: "search" | "module" | "date_from" | "date_to", value: string) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const columns: AppTableColumn<AuditLogRecord>[] = [
    { key: "created_at", title: "Time", render: (row) => <span className="whitespace-nowrap">{formatDate(row.created_at)}</span> },
    { key: "actor", title: "User", render: (row) => <span className="font-medium text-primary">{row.actor?.name || "System / deleted user"}<span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-brand">{row.actor?.role || "system"}</span></span> },
    { key: "action", title: "Action", render: (row) => <span className="font-medium text-primary">{row.action.replaceAll(".", " · ").replaceAll("_", " ")}</span> },
    { key: "module", title: "Module", render: (row) => <span className="capitalize">{row.module}</span> },
    { key: "route", title: "Request", render: (row) => <span className="flex items-center gap-2"><span className="rounded bg-brand-soft px-2 py-1 text-[10px] font-bold text-brand">{row.method}</span><span className="max-w-[300px] truncate font-mono text-xs">{row.route}</span></span> },
    { key: "status_code", title: "Result", render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status_code < 300 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>{row.status_code}</span> },
    { key: "ip_address", title: "IP address", render: (row) => row.ip_address || "—" },
  ];

  return (
    <main className="w-full min-w-0 space-y-5 p-0">
      <header>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[1.4px] text-brand">Security &amp; accountability</p>
        <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Audit log</h1>
        <p className="mb-0 mt-1 text-sm text-muted">Review administrator activity and changes made through the API.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative min-w-0 xl:col-span-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" />
            <input aria-label="Search audit logs" value={filters.search || ""} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Search user, action, route, IP…" className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 pl-9 text-sm text-primary outline-none placeholder:text-muted focus:border-brand" />
          </label>
          <select aria-label="Filter by module" value={filters.module || ""} onChange={(event) => updateFilter("module", event.target.value)} className="min-h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand"><option value="">All modules</option>{modules.map((module) => <option key={module} value={module}>{module[0].toUpperCase() + module.slice(1)}</option>)}</select>
          <input aria-label="From date" type="date" value={filters.date_from || ""} onChange={(event) => updateFilter("date_from", event.target.value)} className="min-h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand" />
          <input aria-label="To date" type="date" min={filters.date_from || undefined} value={filters.date_to || ""} onChange={(event) => updateFilter("date_to", event.target.value)} className="min-h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand" />
        </div>
        {error && <p role="alert" className="m-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}
        {loading ? <div className="px-5 py-12 text-center text-sm text-muted">Loading audit log…</div> : <AppTable columns={columns} data={records} />}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
          <span className="flex items-center gap-2 text-xs text-muted"><FontAwesomeIcon icon={faClockRotateLeft} />{pagination ? `Showing ${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total} events` : "Activity history"}</span>
          {pagination && <AppPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} showSinglePage />}
        </footer>
      </section>
      <p className="m-0 text-xs text-muted">Audit records contain request metadata only. Passwords, tokens, and submitted form contents are not displayed.</p>
    </main>
  );
}
