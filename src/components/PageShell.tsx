import type { ReactNode } from "react";

interface PageShellProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Extra classes on the container div, e.g. "stack-md", "stack-lg" */
  containerClassName?: string;
  maxWidth?: string;
  children: ReactNode;
}

export function PageShell({
  title,
  subtitle,
  containerClassName,
  maxWidth,
  children,
}: PageShellProps) {
  const containerClass = containerClassName
    ? `container ${containerClassName}`
    : "container";

  return (
    <main className="page">
      <div
        className={containerClass}
        style={maxWidth ? { maxWidth } : undefined}
      >
        {title && <h1 className="page__title">{title}</h1>}
        {subtitle && <p className="page__subtitle">{subtitle}</p>}
        {children}
      </div>
    </main>
  );
}
