import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFloppyDisk, faUserShield } from "@fortawesome/free-solid-svg-icons";
import { getSystemUser, updateSystemUser } from "@/modules/audit-logs/api/auditLogsApi";
import type { SystemUserAccount } from "@/modules/audit-logs/api/auditLogsApi";

export default function SystemUserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<SystemUserAccount | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let active = true;
    if (!id) {
      setError("Account ID is missing.");
      setLoading(false);
      return () => { active = false; };
    }

    getSystemUser(id)
      .then(({ data }) => {
        if (!active) return;
        setUser(data);
        setName(data.name);
        setEmail(data.email);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError, "Could not load this account."));
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name: field, value } = event.currentTarget;
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      await updateSystemUser(id, { name: name.trim(), email: email.trim() });
      navigate("/admin/audit-logs/users");
    } catch (requestError: unknown) {
      if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(requestError) && requestError.response?.status === 422) {
        setFieldErrors(requestError.response.data.errors || {});
        setError(requestError.response.data.message || "Please correct the fields and try again.");
      } else {
        setError(getErrorMessage(requestError, "Could not update this account."));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="grid min-h-56 place-items-center text-sm text-secondary">Loading account…</div>;
  if (!user) return <section className="rounded-2xl border border-border bg-surface p-8 text-center"><p className="m-0 font-semibold text-primary">Account unavailable</p><p className="mb-4 mt-1 text-sm text-secondary">{error || "This account could not be loaded."}</p><button type="button" onClick={() => navigate("/admin/audit-logs/users")} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-brand-soft">Back to users</button></section>;

  return (
    <main className="w-full min-w-0 space-y-3 p-0">
      <button type="button" onClick={() => navigate("/admin/audit-logs/users")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-brand/25 bg-brand-soft px-3.5 text-sm font-semibold text-brand-strong transition hover:border-brand/40"><FontAwesomeIcon icon={faArrowLeft} />Back to users</button>
      <form onSubmit={handleSubmit} className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <header className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand-soft/70 via-brand-soft/30 to-transparent px-5 py-4 sm:px-6">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-lg text-white"><FontAwesomeIcon icon={faUserShield} /></div>
          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">User &amp; account</p><h1 className="m-0 text-xl font-bold text-primary">Edit account</h1><p className="mb-0 mt-1 text-sm text-secondary">Update the account name or email. Role and access status are managed separately.</p></div>
        </header>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <label className="space-y-1.5 text-sm font-medium text-secondary">Name<input name="name" required maxLength={255} value={name} onChange={handleChange} className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none placeholder:text-muted focus:border-brand" />{fieldErrors.name?.[0] && <span className="block text-xs text-rose-500">{fieldErrors.name[0]}</span>}</label>
          <label className="space-y-1.5 text-sm font-medium text-secondary">Email<input name="email" type="email" required maxLength={255} value={email} onChange={handleChange} className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none placeholder:text-muted focus:border-brand" />{fieldErrors.email?.[0] && <span className="block text-xs text-rose-500">{fieldErrors.email[0]}</span>}</label>
          <div className="space-y-1.5 text-sm font-medium text-secondary">Role<div className="flex min-h-11 items-center"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-violet-500/10 text-violet-500" : "bg-sky-500/10 text-sky-500"}`}>{user.role === "admin" ? "Admin" : "Teacher"}</span></div><p className="m-0 text-xs font-normal text-muted">Use Roles &amp; Permission to control what teachers can access.</p></div>
          <div className="space-y-1.5 text-sm font-medium text-secondary">Account status<div className="flex min-h-11 items-center"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>{user.is_active ? "Active" : "Blocked"}</span></div><p className="m-0 text-xs font-normal text-muted">Use Block or Unblock in the user list to change access.</p></div>
        </div>
        {error && <p role="alert" className="mx-5 mb-0 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500 sm:mx-6">{error}</p>}
        <footer className="flex justify-end gap-2 border-t border-border p-4 sm:px-6">
          <button type="button" onClick={() => navigate("/admin/audit-logs/users")} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-wait disabled:opacity-60"><FontAwesomeIcon icon={faFloppyDisk} />{saving ? "Saving…" : "Save changes"}</button>
        </footer>
      </form>
    </main>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) ? error.response?.data?.message || fallback : fallback;
}
