import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCheck, faMagnifyingGlass, faPenToSquare, faTrash, faUnlock, faUsers, faUserClock, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import AppPagination from "@/shared/components/AppPagination.tsx";
import AppTable from "@/shared/components/AppTable.tsx";
import type { AppTableColumn } from "@/shared/components/AppTable.tsx";
import { deleteSystemUser, getSystemUsers, setSystemUserActive } from "@/modules/audit-logs/api/auditLogsApi";
import type { PaginatedSystemUsers, SystemUser } from "@/modules/audit-logs/api/auditLogsApi";
import { approveStaffRegistration, blockRegistrationIp, getPendingStaffRegistrations, rejectStaffRegistration, unblockRegistrationIp } from "@/modules/audit-logs/api/staffRegistrationsApi";
import type { StaffAccountRegistration } from "@/modules/audit-logs/api/staffRegistrationsApi";

function formatLastActivity(value: string | null) {
  if (!value) return "No recorded activity";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No recorded activity" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function SystemUsersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [pagination, setPagination] = useState<PaginatedSystemUsers | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [staffRegistrations, setStaffRegistrations] = useState<StaffAccountRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "pending">(() => new URLSearchParams(location.search).get("tab") === "pending" ? "pending" : "users");
  const [busyRegistrationId, setBusyRegistrationId] = useState<number | null>(null);

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
  }, [search, role, page, reloadKey]);

  useEffect(() => {
    let active = true;
    setRegistrationsLoading(true);
    getPendingStaffRegistrations()
      .then(({ data }) => { if (active) setStaffRegistrations(data.data); })
      .catch((requestError: unknown) => { if (active) setError(getRequestMessage(requestError, "Could not load pending account requests.")); })
      .finally(() => { if (active) setRegistrationsLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const toggleAccountAccess = async (user: SystemUser) => {
    const nextActive = !user.is_active;
    const action = nextActive ? "unblock" : "block";
    if (!window.confirm(`${action === "block" ? "Block" : "Unblock"} ${user.name}'s account?`)) return;

    setBusyUserId(user.id);
    setError("");
    setNotice("");
    try {
      const { data } = await setSystemUserActive(user.id, nextActive);
      setNotice(data.message);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(getRequestMessage(requestError, `Could not ${action} this account.`));
    } finally {
      setBusyUserId(null);
    }
  };

  const removeAccount = async (user: SystemUser) => {
    if (!window.confirm(`Delete ${user.name}'s account? This cannot be undone.`)) return;

    setBusyUserId(user.id);
    setError("");
    setNotice("");
    try {
      const { data } = await deleteSystemUser(user.id);
      setNotice(data.message);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(getRequestMessage(requestError, "Could not delete this account."));
    } finally {
      setBusyUserId(null);
    }
  };

  const reviewRegistration = async (registration: StaffAccountRegistration, action: "approve" | "reject") => {
    if (action === "reject" && !window.confirm(`Reject the teacher account request from ${registration.name}?`)) return;
    if (action === "approve" && !window.confirm(`Approve ${registration.name} as a teacher account?`)) return;
    setBusyRegistrationId(registration.id);
    setError("");
    setNotice("");
    try {
      const { data } = action === "approve"
        ? await approveStaffRegistration(registration.id)
        : await rejectStaffRegistration(registration.id);
      setNotice(data.message);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(getRequestMessage(requestError, `Could not ${action} this registration.`));
    } finally {
      setBusyRegistrationId(null);
    }
  };

  const toggleRegistrationIp = async (registration: StaffAccountRegistration) => {
    if (!registration.ip_address) return;
    const isBlocked = Boolean(registration.ip_blocked);
    const action = isBlocked ? "unblock" : "block";
    if (!window.confirm(`${action === "block" ? "Block" : "Unblock"} IP ${registration.ip_address} for login and new account registration?`)) return;
    setBusyRegistrationId(registration.id);
    setError("");
    setNotice("");
    try {
      const { data } = isBlocked
        ? await unblockRegistrationIp(registration.ip_address)
        : await blockRegistrationIp(registration.id);
      setNotice(data.message);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(getRequestMessage(requestError, `Could not ${action} this IP address.`));
    } finally {
      setBusyRegistrationId(null);
    }
  };

  const columns: AppTableColumn<SystemUser>[] = [
    { key: "number", title: "No.", render: (_user, index) => <span className="text-muted">{((pagination?.current_page || 1) - 1) * (pagination?.per_page || 15) + index + 1}</span> },
    { key: "name", title: "User", render: (user) => <span className="font-semibold text-primary">{user.name}</span> },
    { key: "email", title: "Email", render: (user) => <span>{user.email}</span> },
    { key: "role", title: "Role", render: (user) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-violet-500/10 text-violet-500" : "bg-sky-500/10 text-sky-500"}`}>{user.role === "admin" ? "Admin" : "Teacher"}</span> },
    { key: "status", title: "Account", render: (user) => <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${user.is_active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-rose-500/20 bg-rose-500/10 text-rose-500"}`}><span className={`size-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />{user.is_active ? "Active" : "Blocked"}</span> },
    { key: "last_activity_at", title: "Last activity", render: (user) => <span className="whitespace-nowrap">{formatLastActivity(user.last_activity_at)}</span> },
    { key: "actions", title: "Actions", render: (user) => <div className="flex items-center gap-2">
      <button type="button" aria-label={`Edit ${user.name}`} title="Edit account" onClick={() => navigate(`/admin/audit-logs/users/${user.id}/edit`)} className="grid size-9 place-items-center rounded-lg border border-border text-secondary transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faPenToSquare} /></button>
      <button type="button" aria-label={`${user.is_active ? "Block" : "Unblock"} ${user.name}`} title={user.id === currentUser?.id ? "You cannot block your own account" : user.is_active ? "Block account" : "Unblock account"} disabled={busyUserId === user.id || user.id === currentUser?.id} onClick={() => void toggleAccountAccess(user)} className={`grid size-9 place-items-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${user.is_active ? "border-amber-500/25 text-amber-500 hover:bg-amber-500/10" : "border-emerald-500/25 text-emerald-500 hover:bg-emerald-500/10"}`}><FontAwesomeIcon icon={user.is_active ? faBan : faUnlock} /></button>
      <button type="button" aria-label={`Delete ${user.name}`} title={user.id === currentUser?.id ? "You cannot delete your own account" : "Delete account"} disabled={busyUserId === user.id || user.id === currentUser?.id} onClick={() => void removeAccount(user)} className="grid size-9 place-items-center rounded-lg border border-rose-500/25 text-rose-500 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"><FontAwesomeIcon icon={faTrash} /></button>
    </div> },
  ];

  return (
    <main className="w-full min-w-0 space-y-5 p-0">
      <header>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[1.4px] text-brand">Account directory</p>
        <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Users</h1>
        <p className="mb-0 mt-1 text-sm text-muted">Admin and teacher accounts with their latest recorded system activity.</p>
      </header>

      <div className="flex gap-2 border-b border-border">
        <button type="button" onClick={() => setActiveTab("users")} className={`border-b-2 px-3 py-2.5 text-sm font-semibold transition ${activeTab === "users" ? "border-brand text-brand-strong" : "border-transparent text-secondary hover:text-primary"}`}>Accounts</button>
        <button type="button" onClick={() => setActiveTab("pending")} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${activeTab === "pending" ? "border-brand text-brand-strong" : "border-transparent text-secondary hover:text-primary"}`}>
          Pending requests
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-300">{staffRegistrations.length}</span>
        </button>
      </div>

      {activeTab === "pending" ? <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="m-0 text-base font-semibold text-primary">Teacher account requests</h2>
          <p className="mb-0 mt-1 text-xs text-muted">Approve a request to create the teacher login and profile. Requests leave this list after 24 hours.</p>
        </div>
        {error && <p role="alert" className="m-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}
        {notice && <p role="status" className="m-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>}
        {registrationsLoading ? <div className="px-5 py-12 text-center text-sm text-muted">Loading registration requests…</div> : staffRegistrations.length === 0 ? <div className="px-5 py-12 text-center"><FontAwesomeIcon icon={faUserClock} className="mb-2 text-xl text-muted" /><p className="m-0 text-sm font-semibold text-primary">No pending requests</p><p className="mb-0 mt-1 text-xs text-muted">New teacher account requests will appear here for 24 hours.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[880px] border-collapse text-left text-sm"><thead className="bg-brand-soft/60 text-[11px] uppercase tracking-wide text-secondary"><tr>{["Applicant", "Email", "IP address", "Expires", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">{staffRegistrations.map((registration) => <tr key={registration.id} className="text-secondary"><td className="px-4 py-3.5 font-semibold text-primary">{registration.name}</td><td className="px-4 py-3.5">{registration.email}</td><td className="px-4 py-3.5 font-mono text-xs">{registration.ip_address || "—"}</td><td className="px-4 py-3.5 text-xs">{formatLastActivity(registration.expires_at)}</td><td className="px-4 py-3.5"><div className="flex items-center gap-2">
          <button type="button" disabled={busyRegistrationId === registration.id} onClick={() => void reviewRegistration(registration, "approve")} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"><FontAwesomeIcon icon={faCheck} />Approve</button>
          <button type="button" disabled={busyRegistrationId === registration.id} onClick={() => void reviewRegistration(registration, "reject")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 text-xs font-semibold text-rose-500 transition hover:bg-rose-500/10 disabled:opacity-50"><FontAwesomeIcon icon={faXmark} />Reject</button>
          <button type="button" disabled={busyRegistrationId === registration.id || !registration.ip_address} onClick={() => void toggleRegistrationIp(registration)} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50 ${registration.ip_blocked ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10" : "border-border text-secondary hover:bg-brand-soft"}`}><FontAwesomeIcon icon={registration.ip_blocked ? faUnlock : faBan} />{registration.ip_blocked ? "Unblock IP" : "Block IP"}</button>
        </div></td></tr>)}</tbody></table></div>}
      </section> : <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-[minmax(240px,1fr)_200px]">
          <label className="relative min-w-0">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" />
            <input aria-label="Search users" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name or email…" className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 pl-9 text-sm text-primary outline-none placeholder:text-muted focus:border-brand" />
          </label>
          <select aria-label="Filter users by role" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand"><option value="">All roles</option><option value="admin">Admin</option><option value="teacher">Teacher</option></select>
        </div>
        {error && <p role="alert" className="m-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}
        {notice && <p role="status" className="m-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>}
        {loading ? <div className="px-5 py-12 text-center text-sm text-muted">Loading users…</div> : <AppTable columns={columns} data={users} />}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
          <span className="flex items-center gap-2 text-xs text-muted"><FontAwesomeIcon icon={faUsers} />{pagination ? `Showing ${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total} users` : "System accounts"}</span>
          {pagination && <AppPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={setPage} showSinglePage />}
        </footer>
      </section>}
    </main>
  );
}

function getRequestMessage(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) ? error.response?.data?.message || fallback : fallback;
}
