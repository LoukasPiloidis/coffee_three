import type { ReactNode } from "react";

type Props = {
  type: "error" | "success" | "info";
  className?: string;
  children: ReactNode;
};

export function Notice({ type, className, children }: Props) {
  return (
    <div
      className={`notice notice--${type}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}
