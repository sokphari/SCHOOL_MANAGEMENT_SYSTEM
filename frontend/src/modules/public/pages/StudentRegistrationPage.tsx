import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import { checkStudentRegistrationQr, submitStudentRegistration } from "@/modules/students/api/studentRegistrationApi";
import type { StudentRegistrationForm } from "@/modules/students/types/studentRegistration";

const initialForm: StudentRegistrationForm = {
  registration_token: "",
  first_name: "",
  last_name: "",
  gender: "",
  date_of_birth: "",
  phone: "",
  email: "",
  address: "",
  guardian_name: "",
  guardian_phone: "",
};

function messageFromError(error: unknown): string {
  const response = (error as { response?: { data?: { message?: string } } })
    ?.response;
  return (
    response?.data?.message ||
    "We couldn't submit your registration. Please check the details and try again."
  );
}

export default function StudentRegistrationPage() {
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
  const [form, setForm] = useState(() => ({ ...initialForm, registration_token: token }));
  const [saving, setSaving] = useState(false);
  const [checkingQr, setCheckingQr] = useState(Boolean(token));
  const [qrValid, setQrValid] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    checkStudentRegistrationQr(token)
      .then(({ data }) => { if (active) setQrValid(data.valid); })
      .catch(() => { if (active) setQrValid(false); })
      .finally(() => { if (active) setCheckingQr(false); });
    return () => { active = false; };
  }, [token]);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.currentTarget;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Please scan a single-use registration QR issued by the school admin.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await submitStudentRegistration({ ...form, registration_token: token, gender: form.gender || "" });
      setComplete(true);
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas px-4 py-10 text-primary sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <Link to="/" className="text-sm font-medium text-brand hover:underline">
          ← Back to home
        </Link>
        <header className="mb-6 mt-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">
            Student enrollment
          </p>
          <h1 className="m-0 text-3xl font-bold tracking-tight">
            Student registration
          </h1>
          <p className="mb-0 mt-2 text-sm text-secondary">
            Submit your information for the school administration to review.
          </p>
        </header>

        {!token ? (
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-3 grid size-11 place-items-center rounded-full bg-brand-soft text-xl text-brand">▦</div>
            <h2 className="m-0 text-xl font-semibold">Admin QR required</h2>
            <p className="mb-0 mt-2 text-sm text-secondary">Student registration is available only through a single-use QR code issued by a school admin. Please ask the admin to display a fresh QR code.</p>
          </section>
        ) : checkingQr ? (
          <section className="rounded-2xl border border-border bg-surface p-6 text-sm text-secondary shadow-card">Checking registration QR…</section>
        ) : !qrValid ? (
          <section className="rounded-2xl border border-amber-200 bg-surface p-6 shadow-card dark:border-amber-900">
            <h2 className="m-0 text-xl font-semibold">QR unavailable</h2>
            <p className="mb-0 mt-2 text-sm text-secondary">This registration QR has expired or has already been used. Please ask the school admin to issue a fresh QR code.</p>
          </section>
        ) : complete ? (
          <section className="rounded-2xl border border-emerald-200 bg-surface p-6 shadow-card dark:border-emerald-900">
            <div className="mb-3 grid size-11 place-items-center rounded-full bg-emerald-100 text-xl text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              ✓
            </div>
            <h2 className="m-0 text-xl font-semibold">Registration received</h2>
            <p className="mb-4 mt-2 text-sm text-secondary">
              Your application is pending review. The school will contact you
              using the details provided.
            </p>
            <p className="mb-0 text-sm font-medium text-secondary">This QR code has been used and cannot submit another registration.</p>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card"
          >
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <h2 className="m-0 text-base font-semibold">
                Student information
              </h2>
              <p className="mb-0 mt-1 text-sm text-secondary">
                Fields marked with * are required.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-x-4 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
              <AppInput
                label="First name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                placeholder="Enter first name"
              />
              <AppInput
                label="Last name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                placeholder="Enter last name"
              />
              <AppSelect
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
                placeholder="Select gender"
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                ]}
              />
              <AppInput
                label="Date of birth"
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
              />
              <AppInput
                label="Phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
              <AppInput
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
              />
              <AppInput
                label="Guardian name"
                name="guardian_name"
                value={form.guardian_name}
                onChange={handleChange}
                placeholder="Enter guardian name"
              />
              <AppInput
                label="Guardian phone"
                name="guardian_phone"
                type="tel"
                value={form.guardian_phone}
                onChange={handleChange}
                placeholder="Enter guardian phone"
              />
              <div className="mb-4 min-w-0 sm:col-span-2 lg:col-span-3">
                <label
                  htmlFor="address"
                  className="mb-1.5 block text-[13px] font-semibold text-secondary"
                >
                  Home address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  maxLength={2000}
                  className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 dark:border-[#4a4359]"
                  placeholder="Enter home address"
                />
              </div>
            </div>
            {error && (
              <div
                role="alert"
                className="mx-5 mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:mx-6 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
              >
                {error}
              </div>
            )}
            <footer className="flex justify-end border-t border-border px-5 py-4 sm:px-6">
              <button
                disabled={saving}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? "Submitting…" : "Submit registration"}
              </button>
            </footer>
          </form>
        )}
        {token && qrValid && <p className="mt-4 text-center text-xs text-muted">This QR can be used once. Admin approval is required to enroll the student.</p>}
      </div>
    </main>
  );
}
