import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faCheck, faComments, faEnvelope, faFloppyDisk, faImage, faLocationDot, faPhone, faRotateLeft, faSchool, faSpinner, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { getSettings, updateSettings, type SchoolSettings, type SchoolSettingsErrors } from "@/modules/settings/api/settingApi.ts";

const emptySettings: SchoolSettings = {
  school_name: "",
  school_phone: "",
  school_email: "",
  school_address: "",
  telegram_chat_id: "",
  logo_url: "",
  banner_url: "",
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data?.message || "Something went wrong. Please try again.";
  return "Something went wrong. Please try again.";
}

function SettingsField({ name, label, icon, value, onChange, error, type = "text", placeholder }: {
  name: keyof SchoolSettings;
  label: string;
  icon: typeof faSchool;
  value: string;
  onChange: (name: keyof SchoolSettings, value: string) => void;
  error?: string;
  type?: string;
  placeholder: string;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 block text-[13px] font-semibold text-secondary"><FontAwesomeIcon icon={icon} className="mr-2 text-brand" />{label}</label>
      <input id={name} name={name} type={type} value={value} onChange={(event) => onChange(name, event.currentTarget.value)} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted focus:ring-2 focus:ring-brand/15 ${error ? "border-rose-500 focus:border-rose-500" : "border-border focus:border-brand"}`} />
      {error && <p id={`${name}-error`} className="mb-0 mt-1.5 text-xs text-rose-600 dark:text-rose-300">{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<SchoolSettings>(emptySettings);
  const [savedForm, setSavedForm] = useState<SchoolSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<SchoolSettingsErrors>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const successTimer = useRef<number | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await getSettings();
      const settings = { ...emptySettings, ...response.data };
      setForm(settings);
      setSavedForm(settings);
      setErrors({});
      setLoaded(true);
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    return () => {
      if (successTimer.current !== null) window.clearTimeout(successTimer.current);
    };
  }, [loadSettings]);

  const handleChange = (name: keyof SchoolSettings, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      await updateSettings(form);
      setSavedForm(form);
      setMessage({ type: "success", text: "School settings saved successfully." });
      if (successTimer.current !== null) window.clearTimeout(successTimer.current);
      successTimer.current = window.setTimeout(() => setMessage(null), 3500);
    } catch (error) {
      if (axios.isAxiosError<{ errors?: SchoolSettingsErrors; message?: string }>(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors ?? {});
        setMessage({ type: "error", text: "Please review the fields marked below." });
      } else {
        setMessage({ type: "error", text: getErrorMessage(error) });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm(savedForm);
    setErrors({});
    setMessage(null);
  };

  if (loading) return <div className="grid min-h-64 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading school settings…</span></div>;
  if (!loaded) return <div className="rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><p className="m-0 flex items-center gap-2"><FontAwesomeIcon icon={faTriangleExclamation} />{message?.text || "Could not load school settings."}</p><button type="button" onClick={() => void loadSettings()} className="mt-3 rounded-lg border border-rose-300 px-3 py-2 font-semibold transition hover:bg-rose-100 dark:border-rose-800 dark:hover:bg-rose-950">Try again</button></div>;

  const hasChanges = Object.keys(form).some((key) => form[key as keyof SchoolSettings] !== savedForm[key as keyof SchoolSettings]);

  return (
    <div className="w-full space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Administration</p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">School settings</h1>
          <p className="mb-0 mt-1 text-sm text-secondary">Manage school contact details, notifications, and branding.</p>
        </div>
        {hasChanges && <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Unsaved changes</span>}
      </header>

      {message && <div role={message.type === "error" ? "alert" : "status"} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"}`}><FontAwesomeIcon icon={message.type === "success" ? faCheck : faTriangleExclamation} />{message.text}</div>}

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <section className="border-b border-border p-4 sm:p-5 lg:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faBuilding} /></span>
            <div><h2 className="m-0 text-sm font-semibold text-primary">School information</h2><p className="mb-0 mt-1 text-xs text-muted">These details identify your school across the system.</p></div>
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
            <SettingsField name="school_name" label="School name" icon={faSchool} value={form.school_name} onChange={handleChange} error={errors.school_name?.[0]} placeholder="Enter school name" />
            <SettingsField name="school_phone" label="Phone number" icon={faPhone} type="tel" value={form.school_phone} onChange={handleChange} error={errors.school_phone?.[0]} placeholder="Enter school phone" />
            <SettingsField name="school_email" label="Email address" icon={faEnvelope} type="email" value={form.school_email} onChange={handleChange} error={errors.school_email?.[0]} placeholder="Enter school email" />
            <SettingsField name="school_address" label="School address" icon={faLocationDot} value={form.school_address} onChange={handleChange} error={errors.school_address?.[0]} placeholder="Enter school address" />
          </div>
        </section>

        <section className="border-b border-border p-4 sm:p-5 lg:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><FontAwesomeIcon icon={faComments} /></span>
            <div><h2 className="m-0 text-sm font-semibold text-primary">Notifications</h2><p className="mb-0 mt-1 text-xs text-muted">Connect Telegram to receive new student request notifications.</p></div>
          </div>
          <div className="max-w-xl"><SettingsField name="telegram_chat_id" label="Telegram chat ID" icon={faComments} value={form.telegram_chat_id} onChange={handleChange} error={errors.telegram_chat_id?.[0]} placeholder="Enter Telegram chat ID" /></div>
        </section>

        <section className="p-4 sm:p-5 lg:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300"><FontAwesomeIcon icon={faImage} /></span>
            <div><h2 className="m-0 text-sm font-semibold text-primary">Branding</h2><p className="mb-0 mt-1 text-xs text-muted">Set public image URLs for your school logo and banner.</p></div>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-border bg-app-bg/40 p-3 sm:p-4">
              <SettingsField name="logo_url" label="Logo image URL" icon={faImage} type="url" value={form.logo_url} onChange={handleChange} error={errors.logo_url?.[0]} placeholder="https://example.com/logo.png" />
              {form.logo_url && <div className="flex min-h-20 items-center gap-3 rounded-lg border border-border bg-surface p-3"><img key={form.logo_url} src={form.logo_url} alt="School logo preview" className="size-14 rounded-lg border border-border object-contain p-1" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /><span className="text-xs text-muted">Logo preview</span></div>}
            </div>
            <div className="space-y-3 rounded-xl border border-border bg-app-bg/40 p-3 sm:p-4">
              <SettingsField name="banner_url" label="Banner image URL" icon={faImage} type="url" value={form.banner_url} onChange={handleChange} error={errors.banner_url?.[0]} placeholder="https://example.com/banner.jpg" />
              {form.banner_url && <div className="overflow-hidden rounded-lg border border-border bg-surface"><img key={form.banner_url} src={form.banner_url} alt="School banner preview" className="h-24 w-full object-cover" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /></div>}
            </div>
          </div>
        </section>

        <footer className="flex flex-col-reverse gap-2 border-t border-border bg-app-bg/40 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={handleDiscard} disabled={!hasChanges || saving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faRotateLeft} />Discard changes</button>
          <button type="submit" disabled={saving || !hasChanges} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={saving ? faSpinner : faFloppyDisk} className={saving ? "animate-spin" : ""} />{saving ? "Saving settings…" : "Save settings"}</button>
        </footer>
      </form>
    </div>
  );
}
