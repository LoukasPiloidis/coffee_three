import type { ReactNode } from "react";

type Props = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: ReactNode;
};

export function FormField({ label, hint, error, className, children }: Props) {
  return (
    <div className={`field${className ? ` ${className}` : ""}`}>
      <label>{label}</label>
      {children}
      {hint && <div className="field__hint">{hint}</div>}
      {error && <div className="field__error">{error}</div>}
    </div>
  );
}
