import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faAward,
  faCalendarCheck,
  faCalendarDays,
  faChalkboard,
  faFloppyDisk,
  faGaugeHigh,
  faLock,
  faMagnifyingGlass,
  faShieldHalved,
  faUserGraduate,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { getTeacherModulePermissions, updateTeacherModulePermissions } from "@/modules/audit-logs/api/auditLogsApi";
import type { TeacherFeaturePermission, TeacherModulePermission } from "@/modules/audit-logs/api/auditLogsApi";

type RoleKey = "admin" | "teacher";

const adminModules: TeacherModulePermission[] = [
  { key: "dashboard", label: "Dashboard", allowed: true, features: [{ key: "view", label: "View dashboard", allowed: true }] },
  { key: "attendance", label: "Attendance", allowed: true, features: [{ key: "view", label: "View attendance records", allowed: true }, { key: "record", label: "Record attendance", allowed: true }] },
  { key: "students", label: "Students", allowed: true, features: [{ key: "view_list", label: "View student list", allowed: true }, { key: "view_details", label: "View student details", allowed: true }, { key: "view_attendance", label: "View student attendance history", allowed: true }] },
  { key: "classes", label: "Classes", allowed: true, features: [{ key: "view_list", label: "View class list", allowed: true }, { key: "view_details", label: "View class details and roster", allowed: true }, { key: "create", label: "Create a class assigned to yourself", allowed: true }, { key: "add_students", label: "Add students to your classes", allowed: true }, { key: "switch_teacher", label: "Switch the teacher assigned to your class", allowed: true }, { key: "edit", label: "Edit your class information", allowed: true }, { key: "schedule_end", label: "Schedule an end date for your class", allowed: true }, { key: "pre_end", label: "Pre-End your class and stop attendance tracking", allowed: true }, { key: "resume", label: "Resume your class", allowed: true }] },
  { key: "timetable", label: "Timetable", allowed: true, features: [{ key: "view", label: "View weekly timetable", allowed: true }] },
  { key: "grades", label: "Grades", allowed: true, features: [{ key: "view_terms", label: "View grading terms and scores", allowed: true }, { key: "enter_scores", label: "Enter and update student scores", allowed: true }] },
];

const moduleDescriptions: Record<string, string> = {
  dashboard: "View school dashboard and summary information.",
  attendance: "View class attendance and record student attendance.",
  students: "View student records and attendance history.",
  classes: "View assigned classes and manage permitted class actions.",
  timetable: "View the weekly class timetable.",
  grades: "View grading terms and manage student scores.",
};

const moduleIcons: Record<string, IconDefinition> = {
  dashboard: faGaugeHigh,
  attendance: faCalendarCheck,
  students: faUserGraduate,
  classes: faChalkboard,
  timetable: faCalendarDays,
  grades: faAward,
};

const prerequisites: Record<string, string[]> = {
  "attendance.record": ["view"],
  "classes.create": ["view_list"],
  "classes.add_students": ["view_list"],
  "classes.switch_teacher": ["view_list"],
  "classes.edit": ["view_list", "view_details"],
  "classes.schedule_end": ["view_list"],
  "classes.pre_end": ["view_list"],
  "classes.resume": ["view_list"],
  "grades.enter_scores": ["view_terms"],
};

const dependentFeatures: Record<string, string[]> = {
  "attendance.view": ["record"],
  "classes.view_list": ["create", "add_students", "switch_teacher", "edit", "schedule_end", "pre_end", "resume"],
  "classes.view_details": ["edit"],
  "grades.view_terms": ["enter_scores"],
};

const moduleDescriptionsFallback = "Control which module features this role can access.";

const conciseFeatureLabels: Record<string, string> = {
  "dashboard.view": "View dashboard",
  "attendance.view": "View attendance",
  "attendance.record": "Record attendance",
  "students.view_list": "View student list",
  "students.view_details": "View student details",
  "students.view_attendance": "View attendance history",
  "classes.view_list": "View class list",
  "classes.view_details": "View class details",
  "classes.create": "Create class",
  "classes.add_students": "Add students",
  "classes.switch_teacher": "Switch teacher",
  "classes.edit": "Edit class",
  "classes.schedule_end": "Schedule class end",
  "classes.pre_end": "Pre-End class",
  "classes.resume": "Resume class",
  "timetable.view": "View timetable",
  "grades.view_terms": "View grades",
  "grades.enter_scores": "Enter and edit grades",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;
  const response = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
  return response?.message || Object.values(response?.errors ?? {})[0]?.[0] || fallback;
}

function setModulePermission(
  current: TeacherModulePermission[],
  moduleKey: string,
  allowed: boolean,
): TeacherModulePermission[] {
  return current.map((module) => module.key === moduleKey
    ? { ...module, allowed, features: module.features.map((feature) => ({ ...feature, allowed })) }
    : module);
}

function setFeaturePermission(
  current: TeacherModulePermission[],
  moduleKey: string,
  featureKey: string,
  allowed: boolean,
): TeacherModulePermission[] {
  return current.map((module) => {
    if (module.key !== moduleKey) return module;
    const required = prerequisites[`${moduleKey}.${featureKey}`] || [];
    const dependents = dependentFeatures[`${moduleKey}.${featureKey}`] || [];
    const features = module.features.map((feature) => {
      if (feature.key === featureKey) return { ...feature, allowed };
      if (allowed && required.includes(feature.key)) return { ...feature, allowed: true };
      if (!allowed && dependents.includes(feature.key)) return { ...feature, allowed: false };
      return feature;
    });
    return { ...module, allowed: features.some((feature) => feature.allowed), features };
  });
}

export default function RolePermissionsPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<RoleKey>("teacher");
  const [modules, setModules] = useState<TeacherModulePermission[]>([]);
  const [savedModules, setSavedModules] = useState<TeacherModulePermission[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    getTeacherModulePermissions()
      .then(({ data }) => {
        if (!active) return;
        setModules(data.modules);
        setSavedModules(data.modules);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError, "Could not load role permissions."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleModules = selectedRole === "admin" ? adminModules : modules;
  const filteredModules = visibleModules.filter((module) => (
    `${module.label} ${module.features.map((feature) => feature.label).join(" ")}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  ));
  const hasChanges = useMemo(() => modules.some((module, index) => {
    const savedModule = savedModules[index];
    return module.allowed !== savedModule?.allowed || module.features.some((feature, featureIndex) => (
      feature.allowed !== savedModule?.features[featureIndex]?.allowed
    ));
  }), [modules, savedModules]);

  const saveChanges = async () => {
    if (selectedRole !== "teacher" || !hasChanges) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const modulePayload = Object.fromEntries(modules.map((module) => [module.key, module.allowed]));
      const featurePayload = Object.fromEntries(modules.map((module) => [
        module.key,
        Object.fromEntries(module.features.map((feature) => [feature.key, feature.allowed])),
      ]));
      await updateTeacherModulePermissions(modulePayload, featurePayload);
      const { data } = await getTeacherModulePermissions();
      setModules(data.modules);
      setSavedModules(data.modules);
      setSuccess("Teacher permissions saved successfully.");
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Could not save role permissions. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1800px] space-y-4 p-0">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Administration</span><span aria-hidden="true">›</span><span>Roles &amp; permissions</span><span aria-hidden="true">›</span><span className="font-semibold capitalize text-primary">{selectedRole}</span>
      </div>

      <section className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-lg text-brand"><FontAwesomeIcon icon={faUsers} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-lg font-bold tracking-tight text-primary sm:text-xl">{selectedRole === "admin" ? "Admin Role" : "Teacher Role"}</h1>
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold text-brand">System role</span>
          </div>
          <p className="mb-0 mt-1 text-xs leading-5 text-muted">
            {selectedRole === "admin"
              ? "Administrators have full access to every school module."
              : "Choose which modules and actions teachers can use for their assigned classes."}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:justify-self-end">
          <button type="button" onClick={() => navigate("/admin/audit-logs")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3.5 text-sm font-medium text-secondary transition hover:bg-app-bg">
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
        </div>
      </section>

      {error && <p role="alert" className="m-0 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}
      {success && <p role="status" className="m-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">{success}</p>}

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-3 sm:px-5">
          {(["admin", "teacher"] as const).map((role) => (
            <button key={role} type="button" aria-pressed={selectedRole === role} onClick={() => { setSelectedRole(role); setError(""); setSuccess(""); }} className={`min-h-9 rounded-lg border px-4 text-sm font-semibold capitalize transition ${selectedRole === role ? "border-brand bg-brand-soft text-brand" : "border-border bg-transparent text-secondary hover:bg-app-bg"}`}>
              {role}
            </button>
          ))}
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted sm:inline-flex">
            <FontAwesomeIcon icon={selectedRole === "admin" ? faLock : faShieldHalved} />{selectedRole === "admin" ? "Full access · locked" : "Changes enforced by the backend"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-[220px] flex-1">
            <h2 className="m-0 text-sm font-bold text-primary">Module permissions</h2>
            <p className="mb-0 mt-1 text-xs text-muted">Select which modules teachers can access and what they can do in each module.</p>
          </div>
          <label className="relative w-full sm:w-52">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" />
            <input aria-label="Search modules and permissions" value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Search modules…" className="min-h-9 w-full rounded-lg border border-border bg-app-bg px-3 pl-8 text-xs text-primary outline-none placeholder:text-muted focus:border-brand" />
          </label>
        </div>

        {loading ? <p className="m-0 px-5 py-10 text-sm text-muted">Loading permissions…</p> : filteredModules.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">No modules or permissions match “{search}”.</div>
        ) : (
          <div className="space-y-2.5 p-3 sm:p-4">
            {filteredModules.map((module) => <PermissionModuleCard
              key={module.key}
              module={module}
              locked={selectedRole === "admin"}
              onToggleModule={(allowed) => {
                if (selectedRole === "teacher") {
                  setSuccess("");
                  setModules((current) => setModulePermission(current, module.key, allowed));
                }
              }}
              onToggleFeature={(feature, allowed) => {
                if (selectedRole === "teacher") {
                  setSuccess("");
                  setModules((current) => setFeaturePermission(current, module.key, feature, allowed));
                }
              }}
            />)}
          </div>
        )}

        <footer className="flex flex-col gap-3 border-t border-border bg-app-bg/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="text-xs text-muted">
            {selectedRole === "admin" ? "Admin permissions are system-managed and cannot be changed." : "Saved permission changes apply to the teacher’s next API request. They may need to refresh their page."}
          </span>
          {selectedRole === "teacher" && <button type="button" onClick={saveChanges} disabled={!hasChanges || saving || loading} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-end rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto">
            <FontAwesomeIcon icon={faFloppyDisk} />{saving ? "Saving…" : "Save changes"}
          </button>}
        </footer>
      </section>
    </main>
  );
}

function PermissionModuleCard({
  module,
  locked,
  onToggleModule,
  onToggleFeature,
}: {
  module: TeacherModulePermission;
  locked: boolean;
  onToggleModule: (allowed: boolean) => void;
  onToggleFeature: (feature: string, allowed: boolean) => void;
}) {
  const enabledFeatureCount = module.features.filter((feature) => feature.allowed).length;
  const icon = moduleIcons[module.key] || faShieldHalved;
  const description = moduleDescriptions[module.key] || moduleDescriptionsFallback;
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface-raised transition-colors hover:border-brand/25">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 p-3 sm:p-3.5 md:grid-cols-[minmax(230px,0.85fr)_56px_minmax(0,2.8fr)] md:gap-x-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${module.allowed ? "bg-brand-soft text-brand" : "bg-app-bg text-muted"}`}>
            <FontAwesomeIcon icon={icon} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="m-0 text-sm font-semibold text-primary">{module.label}</h3>
            <p className="mb-0 mt-0.5 text-xs leading-4 text-muted">{description}</p>
            <span className="mt-1 block text-[10px] font-medium text-muted">{enabledFeatureCount} of {module.features.length} permissions enabled</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 md:justify-center">
          <label className={`relative inline-flex h-6 w-11 shrink-0 items-center ${locked ? "cursor-not-allowed" : "cursor-pointer"}`} title={locked ? "Admin access is always enabled" : `${module.allowed ? "Disable" : "Enable"} ${module.label}`}>
            <input type="checkbox" role="switch" aria-label={`${module.label} module access`} checked={locked || module.allowed} disabled={locked} onChange={(event) => onToggleModule(event.currentTarget.checked)} className="peer sr-only" />
            <span className={`absolute inset-0 rounded-full transition-colors ${locked || module.allowed ? "bg-brand" : "bg-slate-300 dark:bg-slate-700"}`} />
            <span className={`absolute left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${locked || module.allowed ? "translate-x-5" : "translate-x-0"}`} />
          </label>
          {locked && <FontAwesomeIcon icon={faLock} className="text-[10px] text-muted" aria-hidden="true" />}
        </div>

        <div className="col-span-2 grid min-w-0 grid-cols-1 gap-x-2 gap-y-0.5 border-t border-border pt-2 md:col-span-1 md:grid-cols-2 md:border-0 md:pt-0 xl:grid-cols-3 2xl:grid-cols-4">
          {module.features.map((feature) => <PermissionFeature
            key={feature.key}
            feature={feature}
            label={conciseFeatureLabels[`${module.key}.${feature.key}`] || feature.label}
            moduleAllowed={module.allowed || locked}
            locked={locked}
            onChange={(allowed) => onToggleFeature(feature.key, allowed)}
          />)}
        </div>
      </div>
    </article>
  );
}

function PermissionFeature({ feature, label, moduleAllowed, locked, onChange }: {
  feature: TeacherFeaturePermission;
  label: string;
  moduleAllowed: boolean;
  locked: boolean;
  onChange: (allowed: boolean) => void;
}) {
  return (
    <label className={`flex min-h-8 min-w-0 items-center gap-2 rounded-md px-1.5 py-1 ${locked ? "cursor-not-allowed" : moduleAllowed ? "cursor-pointer hover:bg-brand-soft/30" : "cursor-not-allowed opacity-55"}`}>
      <input type="checkbox" checked={locked || feature.allowed} disabled={locked || !moduleAllowed} onChange={(event) => onChange(event.currentTarget.checked)} className="size-4 shrink-0 accent-violet-600 disabled:cursor-not-allowed" />
      <span className="text-[11px] leading-4 text-secondary">{label}</span>
    </label>
  );
}
