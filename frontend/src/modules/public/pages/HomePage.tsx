import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faEnvelope,
  faLocationDot,
  faPhone,
  faSchool,
  faShieldHalved,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { getPublicSettings } from "@/modules/public/api/publicSettingApi.ts";
import type { PublicSchoolSettings } from "@/modules/public/api/publicSettingApi.ts";

const defaultSettings: PublicSchoolSettings = {
  school_name: "Campusly School",
  school_phone: "",
  school_email: "",
  school_address: "",
  logo_url: "",
  banner_url: "",
  carousel_images: [],
};

export default function HomePage() {
  const [settings, setSettings] =
    useState<PublicSchoolSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let active = true;
    getPublicSettings()
      .then((response) => {
        if (active) setSettings({ ...defaultSettings, ...response.data });
      })
      .catch((error: unknown) =>
        console.error("Could not load public school settings", error),
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const carouselImages = settings.carousel_images?.length
    ? settings.carousel_images
    : settings.banner_url
      ? [settings.banner_url]
      : [];

  useEffect(() => {
    if (carouselImages.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % carouselImages.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [carouselImages.length]);

  const schoolInitial =
    settings.school_name.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-app-bg text-primary">
      <main>
        <section className="mx-auto grid w-full max-w-[1440px] items-center gap-8 px-4 py-10 sm:px-7 sm:py-14 lg:grid-cols-[1fr_0.95fr] lg:gap-14 lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong">
              <FontAwesomeIcon icon={faSchool} />
              Welcome to {settings.school_name}
            </span>
            <h1 className="mb-0 mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-primary sm:text-5xl lg:text-[60px]">
              A place to learn,{" "}
              <span className="text-brand">grow, and thrive.</span>
            </h1>
            <p className="mb-0 mt-5 max-w-xl text-base leading-7 text-secondary sm:text-lg">
              A supportive school community focused on learning, personal
              growth, and helping every student move forward.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/request-scan"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-brand-strong"
              >
                Submit a student request
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
              <a
                href="#about"
                className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-secondary no-underline transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong"
              >
                Learn about us
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-5 text-xs text-muted">
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faBookOpen} className="text-brand" />
                Learning focused
              </span>
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-brand" />
                Student community
              </span>
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="text-brand" />
                Supportive environment
              </span>
            </div>
          </div>

          <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-card sm:rounded-3xl">
            {/* Image slider */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-soft sm:aspect-[16/10] lg:aspect-[5/4]">
              {carouselImages.length > 0 ? (
                <>
                  {carouselImages.map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`${settings.school_name} campus photo ${index + 1}`}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
                        index === activeImage
                          ? "z-10 opacity-100"
                          : "z-0 opacity-0"
                      }`}
                      aria-hidden={index !== activeImage}
                    />
                  ))}

                  {/* Gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                  {/* Caption */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-5 sm:p-7">
                    <span className="mb-2 inline-block rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                      Welcome to our campus
                    </span>

                    <h2 className="m-0 text-xl font-bold tracking-tight text-white sm:text-3xl">
                      {settings.school_name}
                    </h2>

                    <p className="mb-0 mt-2 max-w-md text-sm leading-6 text-white/85">
                      A welcoming place to learn, grow, and build a brighter
                      future.
                    </p>
                  </div>

                  {/* Previous and next controls */}
                  {carouselImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImage(
                            (current) =>
                              (current - 1 + carouselImages.length) %
                              carouselImages.length,
                          )
                        }
                        aria-label="Previous school photo"
                        className="absolute left-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <span aria-hidden="true" className="text-xl">
                          ‹
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveImage(
                            (current) => (current + 1) % carouselImages.length,
                          )
                        }
                        aria-label="Next school photo"
                        className="absolute right-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <span aria-hidden="true" className="text-xl">
                          ›
                        </span>
                      </button>
                    </>
                  )}

                  {/* Image indicators */}
                  {carouselImages.length > 1 && (
                    <div className="absolute right-5 top-5 z-20 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-2 backdrop-blur-md">
                      {carouselImages.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActiveImage(index)}
                          aria-label={`Show photo ${index + 1}`}
                          aria-current={
                            index === activeImage ? "true" : undefined
                          }
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            index === activeImage
                              ? "w-6 bg-white"
                              : "w-2 bg-white/50 hover:bg-white/80"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Empty image state */
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-soft via-surface to-app-bg px-6 text-center">
                  <div className="grid size-16 place-items-center rounded-2xl border border-border bg-surface text-brand shadow-sm">
                    <FontAwesomeIcon icon={faSchool} className="text-3xl" />
                  </div>

                  <h2 className="m-0 text-xl font-bold text-primary">
                    {settings.school_name}
                  </h2>

                  <p className="m-0 max-w-sm text-sm text-secondary">
                    A welcoming place to learn and grow.
                  </p>
                </div>
              )}
            </div>

           
          </div>
        </section>

        <section id="about" className="border-y border-border bg-surface">
          <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-10 sm:px-7 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10 lg:py-16">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">
                About us
              </p>
              <h2 className="m-0 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Learning with purpose.
              </h2>
            </div>
            <div>
              <p className="m-0 text-base leading-7 text-secondary">
                {settings.school_name} supports students through a focused
                learning environment and a connected school community. We value
                curiosity, responsibility, and steady progress inside and
                outside the classroom.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: faBookOpen,
                    title: "Strong foundations",
                    text: "Build knowledge and confidence through learning.",
                  },
                  {
                    icon: faUsers,
                    title: "A caring community",
                    text: "Encourage respect, connection, and teamwork.",
                  },
                  {
                    icon: faShieldHalved,
                    title: "Room to grow",
                    text: "Support students as they develop their strengths.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-xl border border-border bg-app-bg/60 p-4"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand">
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    <h3 className="mb-1 mt-3 text-sm font-semibold text-primary">
                      {item.title}
                    </h3>
                    <p className="m-0 text-xs leading-5 text-muted">
                      {item.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-7 sm:py-14 lg:px-10 lg:py-16"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">
                Get in touch
              </p>
              <h2 className="m-0 text-3xl font-bold tracking-tight text-primary">
                Contact our school
              </h2>
            </div>
            <Link
              to="/request-scan"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-strong no-underline hover:underline"
            >
              Send a request
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ContactCard
              icon={faSchool}
              label="School"
              value={settings.school_name}
            />
            <ContactCard
              icon={faPhone}
              label="Phone"
              value={settings.school_phone}
              href={
                settings.school_phone
                  ? `tel:${settings.school_phone}`
                  : undefined
              }
            />
            <ContactCard
              icon={faEnvelope}
              label="Email"
              value={settings.school_email}
              href={
                settings.school_email
                  ? `mailto:${settings.school_email}`
                  : undefined
              }
            />
            <ContactCard
              icon={faLocationDot}
              label="Address"
              value={settings.school_address}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-10">
          <p className="m-0">
            © {new Date().getFullYear()} {settings.school_name}. All rights
            reserved.
          </p>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-4"
          >
            <a
              href="#about"
              className="text-secondary no-underline hover:text-brand-strong"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-secondary no-underline hover:text-brand-strong"
            >
              Contact
            </a>
            <Link
              to="/request-scan"
              className="text-secondary no-underline hover:text-brand-strong"
            >
              Student request
            </Link>
            <Link
              to="/admin/login"
              className="text-secondary no-underline hover:text-brand-strong"
            >
              Staff login
            </Link>
          </nav>
        </div>
      </footer>
      {loading && (
        <span className="sr-only" role="status">
          Loading school information
        </span>
      )}
    </div>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
}: {
  icon: typeof faSchool;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <FontAwesomeIcon icon={icon} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted">{label}</span>
        <span className="mt-1 block truncate text-sm font-semibold text-primary">
          {value || "Not provided"}
        </span>
      </span>
    </>
  );
  return href ? (
    <a
      href={href}
      className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-4 text-primary no-underline shadow-card transition hover:border-brand/30 hover:bg-brand-soft/30"
    >
      {content}
    </a>
  ) : (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card">
      {content}
    </div>
  );
}
