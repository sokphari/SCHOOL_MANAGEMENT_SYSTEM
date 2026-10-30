import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faUsers } from "@fortawesome/free-solid-svg-icons";
import AppPagination from "@/shared/components/AppPagination.tsx";
import AppTable from "@/shared/components/AppTable.tsx";
import type { AppTableColumn } from "@/shared/components/AppTable.tsx";
import { getSystemUsers } from "@/modules/audit-logs/api/auditLogsApi";
import type { PaginatedSystemUsers, SystemUser } from "@/modules/audit-logs/api/auditLogsApi";

function formatLastActivity(value: string | null) {
  if (!value) return "No recorded activity";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No recorded activity" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function SystemUsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [pagination, setPagination] = useState<PaginatedSystemUsers | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getSystemUsers({ search: search || undefined, role: role || undefined, page })
      .then(({ data }) => {
        if (!active) return;
        setUsers(data.data);
        setPagination(data);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(axios.isAxiosError(requestError) ? requestError.response?.data?.message || "Could not load system users." : "Could not load system users.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, role, page]);

  const columns: AppTableColumn<SystemUser>[] = [
    { key: "number", title: "No.", render: (_user, index) => <span className="text-muted">{((pagination?.current_page || 1) - 1) * (pagination?.per_page || 15) + index + 1}</span> },
    { key: "name", title: "User", render: (user) => <span className="font-semibold text-primary">{user.name}</span> },
    { key: "email", title: "Email", render: (user) => <span>{user.email}</span> },
    { key: "role", title: "Role", render: (user) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-violet-500/10 text-violet-500" : "bg-sky-500/10 text-sky-500"}`}>{user.role === "admin" ? "Admin" : "Teacher"}</span> },
    { key: "last_activity_at", title: "Last activity", render: (user) => <span className="whitespace-nowrap">{formatLastActivity(user.last_activity_at)}</span> },
  ];

  return (
    <main className="w-full min-w-0 space-y-5 p-0">
      <header>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[1.4px] text-brand">Account directory</p>
        <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Users</h1>
        <p className="mb-0 mt-1 text-sm text-muted">Admin and teacher accounts with their latest recorded system activity.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-[minmax(240px,1fr)_200px]">
          <label className="relative min-w-0">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" />
            <input aria-label="Search users" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name or email…" className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 pl-9 text-sm text-primary outline-none placeholder:text-muted focus:border-brand" />
          </label>
          <select aria-label="Filter users by role" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand"><option value="">All roles</option><option value="admin">Admin</option><option value="teacher">Teacher</option></select>
        </div>
        {error && <p role="alert" className="m-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}
        {loading ? <div className="px-5 py-12 text-center text-sm text-muted">Loading users…</div> : <AppTable columns={columns} data={users} />}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
          <span className="flex items-center gap-2 text-xs text-muted"><FontAwesomeIcon icon={faUsers} />{pagination ? `Showing ${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total} users` : "System accounts"}</span>
          {pagination && <AppPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={setPage} showSinglePage />}
        </footer>
      </section>
    </main>
  );
}
