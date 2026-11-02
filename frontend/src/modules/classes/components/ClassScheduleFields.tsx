import type { Dispatch, SetStateAction } from "react";
import type { ClassScheduleTemplate, ClassValidationErrors } from "@/modules/classes/types/class";

const weekdays = [
  { id: 1, short: "Mon", label: "Monday" },
  { id: 2, short: "Tue", label: "Tuesday" },
  { id: 3, short: "Wed", label: "Wednesday" },
  { id: 4, short: "Thu", label: "Thursday" },
  { id: 5, short: "Fri", label: "Friday" },
  { id: 6, short: "Sat", label: "Saturday" },
  { id: 7, short: "Sun", label: "Sunday" },
];

interface ClassScheduleFieldsProps {
  days: number[];
  startsAt: string;
  endsAt: string;
  templates: ClassScheduleTemplate[];
  setDays: Dispatch<SetStateAction<number[]>>;
  setStartsAt: (value: string) => void;
  setEndsAt: (value: string) => void;
  applyTemplate: (template: ClassScheduleTemplate) => void;
  errors: ClassValidationErrors;
  clearError: (field: "schedule_days" | "starts_at" | "ends_at") => void;
}

export default function ClassScheduleFields({ days, startsAt, endsAt, templates, setDays, setStartsAt, setEndsAt, applyTemplate, errors, clearError }: ClassScheduleFieldsProps) {
  const selectedDays = [...days].sort((a, b) => a - b);
  const toggleDay = (day: number) => setDays((current) => current.includes(day)
    ? current.filter((item) => item !== day)
    : [...current, day].sort((a, b) => a - b));

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="block text-[13px] font-semibold text-secondary">Class days <span className="text-rose-500">*</span></label>
            <p className="mb-0 mt-0.5 text-xs text-muted">Choose a saved schedule or select weekdays and times.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {templates.filter((template) => template.status === "active").map((template) => {
              const active = selectedDays.length === template.days.length && selectedDays.every((day, index) => day === template.days[index]) && startsAt.slice(0, 5) === template.starts_at.slice(0, 5) && endsAt.slice(0, 5) === template.ends_at.slice(0, 5);
              return <button key={template.id} type="button" onClick={() => { applyTemplate(template); clearError("schedule_days"); clearError("starts_at"); clearError("ends_at"); }} aria-pressed={active} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${active ? "border-brand bg-brand-soft text-brand-strong" : "border-border bg-surface text-secondary hover:border-brand/40 hover:text-primary"}`} title={`${template.days.map((id) => weekdays.find((day) => day.id === id)?.short).join(", ")} · ${template.starts_at.slice(0, 5)}–${template.ends_at.slice(0, 5)}`}>{template.name}</button>;
            })}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {weekdays.map((day) => {
            const checked = days.includes(day.id);
            return <label key={day.id} className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition ${checked ? "border-brand/50 bg-brand-soft/70 text-brand-strong" : "border-border bg-app-bg/40 text-secondary hover:border-brand/30"}`}>
              <input type="checkbox" checked={checked} onChange={() => { toggleDay(day.id); clearError("schedule_days"); }} className="accent-violet-600" />
              <span>{day.short}</span>
              <span className="sr-only">{day.label}</span>
            </label>;
          })}
        </div>
        {errors.schedule_days?.[0] && <p className="mb-0 mt-1 text-xs text-rose-600">{errors.schedule_days[0]}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="mb-1.5 block text-[13px] font-semibold text-secondary">Start time <span className="text-rose-500">*</span></label>
          <input id="starts_at" name="starts_at" type="time" required value={startsAt} onChange={(event) => { setStartsAt(event.target.value); clearError("starts_at"); }} aria-invalid={Boolean(errors.starts_at?.[0])} className={`min-h-11 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 ${errors.starts_at?.[0] ? "border-rose-500" : "border-border dark:border-[#4a4359]"}`} />
          {errors.starts_at?.[0] && <p className="mb-0 mt-1 text-xs text-rose-600">{errors.starts_at[0]}</p>}
        </div>
        <div>
          <label htmlFor="ends_at" className="mb-1.5 block text-[13px] font-semibold text-secondary">End time <span className="text-rose-500">*</span></label>
          <input id="ends_at" name="ends_at" type="time" required value={endsAt} onChange={(event) => { setEndsAt(event.target.value); clearError("ends_at"); }} aria-invalid={Boolean(errors.ends_at?.[0])} className={`min-h-11 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 ${errors.ends_at?.[0] ? "border-rose-500" : "border-border dark:border-[#4a4359]"}`} />
          {errors.ends_at?.[0] && <p className="mb-0 mt-1 text-xs text-rose-600">{errors.ends_at[0]}</p>}
        </div>
      </div>
    </div>
  );
}
