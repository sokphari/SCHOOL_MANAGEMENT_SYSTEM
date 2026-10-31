import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEye, faEyeSlash, faLock, faMoon, faSchool, faShieldHalved, faSpinner, faSun, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { csrfCookieApi, registerStaffAccount, requestPasswordReset, resetPassword } from "@/modules/auth/api/authApi.jsx";

interface LoginCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

type LoginView = "login" | "register" | "forgot" | "reset";

type Theme = "light" | "dark";
const THEME_STORAGE_KEY = "school-management-theme";

function getInitialTheme(): Theme {
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

function getLoginError(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (error.response?.status === 429) return "Too many login attempts. Please wait a moment and try again.";
    return error.response?.data?.message || "We could not sign you in. Check your details and try again.";
  }
  return "We could not sign you in. Please try again.";
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const [view, setView] = useState<LoginView>(location.pathname.endsWith("reset-password") ? "reset" : "login");
  const [form, setForm] = useState<LoginCredentials>({ name: "", email: query.get("email") || "", password: "", password_confirmation: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (view === "login") {
        await login({ email: form.email, password: form.password });
        navigate("/admin/dashboard", { replace: true });
      } else if (view === "register") {
        await csrfCookieApi();
        const { data } = await registerStaffAccount(form);
        setSuccess(data.message || "Your request was sent for administrator approval.");
        setForm((current) => ({ ...current, password: "", password_confirmation: "" }));
        setView("login");
      } else if (view === "forgot") {
        await csrfCookieApi();
        const { data } = await requestPasswordReset({ email: form.email });
        setSuccess(data.message || "If an active account exists, reset instructions have been sent.");
        setView("login");
      } else {
        await csrfCookieApi();
        const { data } = await resetPassword({
          token: query.get("token") || "",
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
        });
        setSuccess(data.message || "Password reset. You can sign in now.");
        setForm((current) => ({ ...current, password: "", password_confirmation: "" }));
        setView("login");
        navigate("/admin/login", { replace: true });
      }
    } catch (loginError) {
      setError(getLoginError(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof LoginCredentials) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  };

  const changeView = (next: LoginView) => {
    setView(next);
    setError("");
    setSuccess("");
    if (next === "reset") navigate("/admin/reset-password", { replace: true });
    else if (view === "reset") navigate("/admin/login", { replace: true });
  };

  const title = view === "register" ? "Request a teacher account" : view === "forgot" ? "Forgot your password?" : view === "reset" ? "Choose a new password" : "Welcome back";
  const subtitle = view === "register"
    ? "Create a request. An administrator must approve it before you can sign in."
    : view === "forgot"
      ? "Enter your account email and we’ll send reset instructions if it is registered."
      : view === "reset"
        ? "Use the new password for your school account."
        : "Enter your account details to access your workspace.";

  return (
    <main data-theme={theme} className="login-shell grid min-h-screen bg-app-bg text-primary transition-colors duration-200 lg:grid-cols-[minmax(0,1.05fr)_minmax(520px,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-[#211832] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-14">
        <div className="pointer-events-none absolute -right-24 -top-28 size-[420px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-12 size-[290px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-36 -left-28 size-[420px] rounded-full bg-violet-400/10 blur-3xl" />
        <Link to="/" className="relative z-10 flex w-fit items-center gap-3 text-white no-underline">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-300 to-violet-600 text-xl shadow-lg shadow-violet-950/30"><FontAwesomeIcon icon={faSchool} /></span>
          <span><span className="block text-lg font-bold tracking-tight">Campusly</span><span className="mt-0.5 block text-xs text-violet-200/70">School management</span></span>
        </Link>

        <div className="relative z-10 max-w-xl py-12">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-semibold text-violet-100"><FontAwesomeIcon icon={faShieldHalved} />Secure school workspace</span>
          <h1 className="m-0 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">A clearer view of your school, all in one place.</h1>
          <p className="mb-0 mt-5 max-w-lg text-base leading-7 text-violet-100/70">Sign in to manage students, teachers, classes, attendance, and school requests from your admin workspace.</p>
        </div>

        <p className="relative z-10 m-0 text-xs text-violet-100/50">Campusly · School Management System</p>
      </section>

      <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:items-center lg:justify-center lg:px-12">
        <button type="button" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`} onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} className="absolute right-5 top-5 grid size-10 place-items-center rounded-xl border border-border bg-surface text-secondary shadow-sm transition hover:bg-brand-soft hover:text-brand-strong sm:right-8 sm:top-7"><FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} /></button>
        <Link to="/" className="mb-8 inline-flex w-fit items-center gap-2 pr-12 text-sm font-semibold text-secondary no-underline transition hover:text-brand-strong lg:hidden"><FontAwesomeIcon icon={faArrowLeft} />Back to home</Link>
        <div className="mx-auto w-full max-w-[560px]">
          <Link to="/" className="mb-8 hidden w-fit items-center gap-2 text-sm font-semibold text-secondary no-underline transition hover:text-brand-strong lg:inline-flex"><FontAwesomeIcon icon={faArrowLeft} />Back to home</Link>
          <div className="mb-7">
            <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-brand-soft text-lg text-brand lg:hidden"><FontAwesomeIcon icon={faSchool} /></span>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">School account</p>
            <h2 className="m-0 text-3xl font-bold tracking-tight text-primary">{title}</h2>
            <p className="mb-0 mt-2 text-sm text-secondary">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col justify-center rounded-2xl border border-border bg-surface p-7 shadow-card sm:p-10">
            {error && <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
            {success && <div role="status" className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-700 dark:text-emerald-300">{success}</div>}

            {view === "register" && <div className="mb-5">
              <label htmlFor="register-name" className="mb-1.5 block text-[13px] font-semibold text-secondary">Full name</label>
              <input id="register-name" name="name" autoComplete="name" required value={form.name} onChange={handleFieldChange("name")} placeholder="Your full name" className="w-full rounded-lg border border-border bg-surface px-4 py-3.5 text-[15px] text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" />
            </div>}

            <div className="mb-5">
              <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-semibold text-secondary">Email address</label>
              <input id="login-email" name="email" type="email" autoComplete="username" autoFocus={view === "login" || view === "forgot"} required value={form.email} onChange={handleFieldChange("email")} placeholder="you@school.com" className="w-full rounded-lg border border-border bg-surface px-4 py-3.5 text-[15px] text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" />
            </div>

            {view !== "forgot" && <div className="mb-5">
              <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-semibold text-secondary">{view === "login" ? "Password" : "New password"}</label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted" />
                <input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete={view === "login" ? "current-password" : "new-password"} minLength={8} required value={form.password} onChange={handleFieldChange("password")} placeholder={view === "login" ? "Enter your password" : "At least 8 characters"} className="w-full rounded-lg border border-border bg-surface py-3.5 pl-10 pr-12 text-[15px] text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button>
              </div>
            </div>}

            {(view === "register" || view === "reset") && <div className="mb-7">
              <label htmlFor="password-confirmation" className="mb-1.5 block text-[13px] font-semibold text-secondary">Confirm password</label>
              <input id="password-confirmation" name="password_confirmation" type="password" autoComplete="new-password" minLength={8} required value={form.password_confirmation} onChange={handleFieldChange("password_confirmation")} placeholder="Enter the password again" className="w-full rounded-lg border border-border bg-surface px-4 py-3.5 text-[15px] text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" />
            </div>}

            {view === "login" && <div className="-mt-2 mb-5 text-right"><button type="button" onClick={() => changeView("forgot")} className="text-xs font-semibold text-brand-strong hover:underline">Forgot password?</button></div>}
            <button type="submit" disabled={submitting || !form.email || (view !== "forgot" && !form.password) || (view === "register" && !form.name) || ((view === "register" || view === "reset") && !form.password_confirmation)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{submitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}{submitting ? "Please wait…" : view === "login" ? "Sign in" : view === "register" ? "Send registration request" : view === "forgot" ? "Send reset link" : "Reset password"}</button>
            {view === "login" ? <p className="mb-0 mt-5 text-center text-sm text-secondary">Need an account? <button type="button" onClick={() => changeView("register")} className="font-semibold text-brand-strong hover:underline">Request teacher access</button></p> : <p className="mb-0 mt-5 text-center text-sm"><button type="button" onClick={() => changeView("login")} className="font-semibold text-brand-strong hover:underline">Back to sign in</button></p>}
            {view === "login" && <p className="mb-0 mt-3 text-center text-xs text-muted">New teacher accounts require administrator approval.</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
