import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faBookOpen, faEnvelope, faLocationDot, faPhone, faSchool, faShieldHalved, faUsers } from "@fortawesome/free-solid-svg-icons";
import { getPublicSettings } from "@/modules/public/api/publicSettingApi.ts";
import type { PublicSchoolSettings } from "@/modules/public/api/publicSettingApi.ts";

const defaultSettings: PublicSchoolSettings = {
  school_name: "Campusly School",
  school_phone: "",
  school_email: "",
  school_address: "",
  logo_url: "",
  banner_url: "",
};

export default function HomePage() {
  const [settings, setSettings] = useState<PublicSchoolSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPublicSettings()
      .then((response) => {
        if (active) setSettings({ ...defaultSettings, ...response.data });
      })
      .catch((error: unknown) => console.error("Could not load public school settings", error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const schoolInitial = settings.school_name.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-app-bg text-primary">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <Link to="/" aria-label={`${settings.school_name} home`} className="flex min-w-0 items-center gap-3 text-primary no-underline">
            {settings.logo_url ? <img src={settings.logo_url} alt={`${settings.school_name} logo`} className="size-11 shrink-0 rounded-xl border border-border bg-surface object-contain p-1" /> : <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-lg font-bold text-white shadow-sm">{schoolInitial}</span>}
            <span className="min-w-0"><span className="block truncate text-base font-bold tracking-tight sm:text-lg">{settings.school_name}</span><span className="block text-[11px] text-muted">School management</span></span>
          </Link>
          <nav aria-label="Main navigation" className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a href="#about" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-secondary no-underline transition hover:bg-brand-soft hover:text-brand-strong sm:inline-flex">About</a>
            <a href="#contact" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-secondary no-underline transition hover:bg-brand-soft hover:text-brand-strong md:inline-flex">Contact</a>
            <Link to="/admin/login" className="hidden rounded-lg border border-border px-3.5 py-2.5 text-sm font-semibold text-secondary no-underline transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong sm:inline-flex">Staff login</Link>
            <Link to="/request-scan" className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2.5 text-xs font-semibold text-white no-underline transition hover:bg-brand-strong sm:text-sm">Student request<FontAwesomeIcon icon={faArrowRight} className="text-[11px]" /></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-[1440px] items-center gap-8 px-4 py-10 sm:px-7 sm:py-14 lg:grid-cols-[1fr_0.95fr] lg:gap-14 lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong"><FontAwesomeIcon icon={faSchool} />Welcome to {settings.school_name}</span>
            <h1 className="mb-0 mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-primary sm:text-5xl lg:text-[60px]">A place to learn, <span className="text-brand">grow, and thrive.</span></h1>
            <p className="mb-0 mt-5 max-w-xl text-base leading-7 text-secondary sm:text-lg">A supportive school community focused on learning, personal growth, and helping every student move forward.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/request-scan" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-brand-strong">Submit a student request<FontAwesomeIcon icon={faArrowRight} className="text-xs" /></Link>
              <a href="#about" className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-secondary no-underline transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong">Learn about us</a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-5 text-xs text-muted">
              <span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faBookOpen} className="text-brand" />Learning focused</span>
              <span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faUsers} className="text-brand" />Student community</span>
              <span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faShieldHalved} className="text-brand" />Supportive environment</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-[28px] bg-brand-soft/70 blur-xl" />
            <div className="relative min-h-[300px] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-violet-100 via-white to-indigo-100 shadow-card sm:min-h-[390px] lg:min-h-[460px]">
              {settings.banner_url ? <img src={settings.banner_url} alt={`${settings.school_name} campus`} className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(180,154,238,0.45),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(112,65,199,0.22),transparent_35%)]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1c1530]/75 via-[#1c1530]/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[1.3px] text-violet-200">Our school</p>
                <h2 className="m-0 text-2xl font-bold tracking-tight sm:text-3xl">{settings.school_name}</h2>
                <p className="mb-0 mt-2 max-w-md text-sm leading-6 text-white/80">A community where students are encouraged to discover their strengths and build their future.</p>
              </div>
              {!settings.banner_url && <div className="absolute right-5 top-5 grid size-14 place-items-center rounded-2xl border border-white/60 bg-white/70 text-2xl text-brand shadow-lg backdrop-blur sm:right-7 sm:top-7"><FontAwesomeIcon icon={faSchool} /></div>}
            </div>
            {settings.logo_url && <div className="absolute -left-2 top-5 grid size-[68px] place-items-center rounded-2xl border border-border bg-surface p-2 shadow-card sm:-left-5 sm:top-8"><img src={settings.logo_url} alt="" className="size-full object-contain" /></div>}
          </div>
        </section>

        <section id="about" className="border-y border-border bg-surface">
          <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-10 sm:px-7 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10 lg:py-16">
            <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">About us</p><h2 className="m-0 text-3xl font-bold tracking-tight text-primary sm:text-4xl">Learning with purpose.</h2></div>
            <div><p className="m-0 text-base leading-7 text-secondary">{settings.school_name} supports students through a focused learning environment and a connected school community. We value curiosity, responsibility, and steady progress inside and outside the classroom.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[{ icon: faBookOpen, title: "Strong foundations", text: "Build knowledge and confidence through learning." }, { icon: faUsers, title: "A caring community", text: "Encourage respect, connection, and teamwork." }, { icon: faShieldHalved, title: "Room to grow", text: "Support students as they develop their strengths." }].map((item) => <article key={item.title} className="rounded-xl border border-border bg-app-bg/60 p-4"><span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><FontAwesomeIcon icon={item.icon} /></span><h3 className="mb-1 mt-3 text-sm font-semibold text-primary">{item.title}</h3><p className="m-0 text-xs leading-5 text-muted">{item.text}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-7 sm:py-14 lg:px-10 lg:py-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Get in touch</p><h2 className="m-0 text-3xl font-bold tracking-tight text-primary">Contact our school</h2></div>
            <Link to="/request-scan" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-strong no-underline hover:underline">Send a request<FontAwesomeIcon icon={faArrowRight} className="text-xs" /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ContactCard icon={faSchool} label="School" value={settings.school_name} />
            <ContactCard icon={faPhone} label="Phone" value={settings.school_phone} href={settings.school_phone ? `tel:${settings.school_phone}` : undefined} />
            <ContactCard icon={faEnvelope} label="Email" value={settings.school_email} href={settings.school_email ? `mailto:${settings.school_email}` : undefined} />
            <ContactCard icon={faLocationDot} label="Address" value={settings.school_address} />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-10">
          <p className="m-0">© {new Date().getFullYear()} {settings.school_name}. All rights reserved.</p>
          <div className="flex items-center gap-4"><Link to="/request-scan" className="text-secondary no-underline hover:text-brand-strong">Student request</Link><Link to="/admin/login" className="text-secondary no-underline hover:text-brand-strong">Staff login</Link></div>
        </div>
      </footer>
      {loading && <span className="sr-only" role="status">Loading school information</span>}
    </div>
  );
}

function ContactCard({ icon, label, value, href }: { icon: typeof faSchool; label: string; value: string; href?: string }) {
  const content = <><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={icon} /></span><span className="min-w-0"><span className="block text-xs text-muted">{label}</span><span className="mt-1 block truncate text-sm font-semibold text-primary">{value || "Not provided"}</span></span></>;
  return href ? <a href={href} className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-4 text-primary no-underline shadow-card transition hover:border-brand/30 hover:bg-brand-soft/30">{content}</a> : <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card">{content}</div>;
}
