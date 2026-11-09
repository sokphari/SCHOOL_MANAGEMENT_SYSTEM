import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLocationDot, faPhone, faSchool } from "@fortawesome/free-solid-svg-icons";
import { getPublicSettings } from "@/modules/public/api/publicSettingApi.ts";
import type { PublicSchoolSettings } from "@/modules/public/api/publicSettingApi.ts";

const defaults: PublicSchoolSettings = {
  school_name: "Campusly School",
  school_phone: "",
  school_email: "",
  school_address: "",
  logo_url: "",
  banner_url: "",
  carousel_images: [],
};

const PublicSettingsContext = createContext<PublicSchoolSettings>(defaults);

export function usePublicSettings() {
  return useContext(PublicSettingsContext);
}

export default function PublicSiteLayout() {
  const [settings, setSettings] = useState(defaults);

  useEffect(() => {
    let active = true;
    getPublicSettings()
      .then(({ data }) => { if (active) setSettings({ ...defaults, ...data }); })
      .catch((error: unknown) => console.error("Could not load public school settings", error));
    return () => { active = false; };
  }, []);

  return (
    <PublicSettingsContext.Provider value={settings}>
      <div className="min-h-screen bg-app-bg text-primary">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex min-h-[72px] w-full max-w-[1380px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
            <Link to="/" aria-label={`${settings.school_name} home`} className="flex min-w-0 items-center gap-3 text-primary no-underline">
              {settings.logo_url ? <img src={settings.logo_url} alt="" className="size-11 shrink-0 rounded-xl border border-border bg-surface p-1 object-contain" /> : <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white"><FontAwesomeIcon icon={faSchool} /></span>}
              <span className="min-w-0"><span className="block truncate text-base font-bold tracking-tight">{settings.school_name}</span><span className="block text-[11px] text-muted">School community</span></span>
            </Link>
            <nav aria-label="Public navigation" className="flex items-center gap-1 sm:gap-2">
              <a href="/#about" className="rounded-lg px-3 py-2 text-sm font-semibold text-secondary no-underline transition hover:bg-brand-soft hover:text-brand-strong">About</a>
              <a href="/#contact" className="rounded-lg px-3 py-2 text-sm font-semibold text-secondary no-underline transition hover:bg-brand-soft hover:text-brand-strong">Contact</a>
            </nav>
          </div>
        </header>

        <Outlet />

        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-4 px-4 py-7 sm:px-7 md:flex-row md:items-center md:justify-between lg:px-10">
            <div><p className="m-0 text-sm font-semibold text-primary">{settings.school_name}</p><p className="mb-0 mt-1 text-xs text-muted">Learning together. Growing together.</p></div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-secondary">
              {settings.school_phone && <a className="inline-flex items-center gap-2 text-secondary no-underline hover:text-brand" href={`tel:${settings.school_phone}`}><FontAwesomeIcon icon={faPhone} />{settings.school_phone}</a>}
              {settings.school_email && <a className="inline-flex items-center gap-2 text-secondary no-underline hover:text-brand" href={`mailto:${settings.school_email}`}><FontAwesomeIcon icon={faEnvelope} />{settings.school_email}</a>}
              {settings.school_address && <span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faLocationDot} />{settings.school_address}</span>}
            </div>
            <p className="m-0 text-xs text-muted">© {new Date().getFullYear()} {settings.school_name}</p>
          </div>
        </footer>
      </div>
    </PublicSettingsContext.Provider>
  );
}

export function PublicPage({ children }: { children: ReactNode }) {
  return <main className="mx-auto min-h-[calc(100vh-150px)] w-full max-w-[1380px] px-4 py-8 sm:px-7 sm:py-10 lg:px-10">{children}</main>;
}
