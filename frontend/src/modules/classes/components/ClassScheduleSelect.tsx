import type { ChangeEvent } from "react";
import AppSelect from "@/shared/components/AppSelect";
import type { ClassScheduleTemplate, ClassValidationErrors } from "@/modules/classes/types/class";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface ClassScheduleSelectProps {
  templates: ClassScheduleTemplate[];
  days: number[];
  startsAt: string;
  endsAt: string;
  onDaysChange: (days: number[]) => void;
  onTimeChange: (startsAt: string, endsAt: string) => void;
  errors: ClassValidationErrors;
  disabled?: boolean;
}

const formatDays = (days: number[]) => {
  const sorted = [...days].sort((a, b) => a - b);
  const isContinuous = sorted.length > 1 && sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1);
  if (isContinuous) return `${weekdays[sorted[0] - 1]}-${weekdays[sorted[sorted.length - 1] - 1]}`;
  return sorted.map((day) => weekdays[day - 1]).filter(Boolean).join(", ");
};

const formatTime = (value: string) => {
  const [hourText, minute] = value.slice(0, 5).split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
};

export default function ClassScheduleSelect({ templates, days, startsAt, endsAt, onDaysChange, onTimeChange, errors, disabled = false }: ClassScheduleSelectProps) {
  const activeTemplates = templates.filter((template) => template.status === "active");
  const termOptions = new Map<string, string>();
  const timeOptions = new Map<string, string>();

  activeTemplates.forEach((template) => {
    const termValue = [...template.days].sort((a, b) => a - b).join(",");
    termOptions.set(termValue, formatDays(template.days));
    const start = template.starts_at.slice(0, 5);
    const end = template.ends_at.slice(0, 5);
    const timeValue = `${start}|${end}`;
    timeOptions.set(timeValue, `${formatTime(start)} - ${formatTime(end)}`);
  });

  const currentTermValue = [...days].sort((a, b) => a - b).join(",");
  if (currentTermValue) termOptions.set(currentTermValue, formatDays(days));
  const currentTimeValue = startsAt && endsAt ? `${startsAt.slice(0, 5)}|${endsAt.slice(0, 5)}` : "";
  if (currentTimeValue) timeOptions.set(currentTimeValue, `${formatTime(startsAt)} - ${formatTime(endsAt)}`);

  const handleTermChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onDaysChange(event.currentTarget.value ? event.currentTarget.value.split(",").map(Number) : []);
  };

  const handleTimeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const [start = "", end = ""] = event.currentTarget.value.split("|");
    onTimeChange(start, end);
  };

  const termsDisabled = disabled || (activeTemplates.length === 0 && !currentTermValue);
  const timesDisabled = disabled || (activeTemplates.length === 0 && !currentTimeValue);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <AppSelect
        containerClassName="mb-0"
        label="Term"
        name="schedule_term"
        required
        disabled={termsDisabled}
        value={currentTermValue}
        onChange={handleTermChange}
        placeholder={disabled ? "Loading class schedules…" : termsDisabled ? "No active schedules available" : "Select class days"}
        options={[...termOptions].map(([value, label]) => ({ value, label }))}
        error={errors.schedule_days?.[0]}
      />
      <AppSelect
        containerClassName="mb-0"
        label="Time"
        name="schedule_time"
        required
        disabled={timesDisabled}
        value={currentTimeValue}
        onChange={handleTimeChange}
        placeholder={disabled ? "Loading class schedules…" : timesDisabled ? "No active schedules available" : "Select class time"}
        options={[...timeOptions].map(([value, label]) => ({ value, label }))}
        error={errors.starts_at?.[0] || errors.ends_at?.[0]}
      />
      {activeTemplates.length === 0 && <p className="mb-0 text-xs text-muted sm:col-span-2">No active schedule templates are available. Ask an admin to add one to choose a different schedule.</p>}
    </div>
  );
}
