import type { ChangeEvent } from "react";

interface AppInputProps {
  label?: string;
  name: string;
  value: string | number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
}

export default function AppInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  error = "",
  required = false,
  containerClassName = "mb-4",
}: AppInputProps) {
  return (
    <div className={`${containerClassName} min-w-0`}>
      {label && <label htmlFor={name} className="mb-1.5 block text-[13px] font-semibold text-secondary">{label}</label>}
      <input
        id={name}
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 ${error ? "border-rose-500" : "border-border dark:border-[#4a4359]"}`}
      />
      {error && <p id={`${name}-error`} className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
