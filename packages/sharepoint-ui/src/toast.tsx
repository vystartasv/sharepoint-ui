import { createElement, useEffect, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type ToastProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  open: boolean;
  message: ReactNode;
  durationMs?: number;
  dismissLabel?: string;
  onDismiss: () => void;
};

export function Toast({ open, message, durationMs = 5000, dismissLabel = "Dismiss", onDismiss, className = "", ...props }: ToastProps): ReactElement | null {
  useEffect(() => {
    if (!open || durationMs <= 0) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [open, durationMs, onDismiss]);
  if (!open) return null;
  return createElement("div", { ...props, role: "status", "aria-live": "polite", className: `spui-toast ${className}`.trim() },
    createElement("span", null, message),
    createElement("button", { type: "button", "aria-label": dismissLabel, onClick: onDismiss }, dismissLabel),
  );
}
