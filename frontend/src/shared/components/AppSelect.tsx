import type { ChangeEvent } from "react";

export interface SelectOption {
  label: string;
  value: string;
}

interface AppSelectProps {
  label?: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
  error?: string;
  containerClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function AppSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  error = "",
  containerClassName = "mb-4",
  placeholder = "Select",
  disabled = false,
  required = false,
}: AppSelectProps) {
  return (
    <div className={`${containerClassName} min-w-0`}>
      {label && <label htmlFor={name} className="mb-1.5 block text-[13px] font-semibold text-secondary">{label}</label>}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60 ${error ? "border-rose-500" : "border-border dark:border-[#4a4359]"}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error && <p id={`${name}-error`} className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
