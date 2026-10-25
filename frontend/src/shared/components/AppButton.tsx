import type { ButtonHTMLAttributes, ReactNode } from "react";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function AppButton({ children, className = "", type = "button", ...props }: AppButtonProps) {
  return <button type={type} className={`rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-secondary transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong ${className}`} {...props}>{children}</button>;
}
