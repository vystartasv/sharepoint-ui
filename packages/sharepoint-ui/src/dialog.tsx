import { createElement, useEffect, useId, useRef, type DialogHTMLAttributes, type ReactElement, type ReactNode } from "react";

export type DialogProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, "children" | "open" | "onClose"> & {
  open: boolean;
  title: ReactNode;
  children?: ReactNode;
  closeLabel?: string;
  onOpenChange?: (open: boolean) => void;
};

export function Dialog({ open, title, children, closeLabel = "Close", onOpenChange, className = "", ...props }: DialogProps): ReactElement {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return createElement("dialog", {
    ...props,
    ref,
    "aria-labelledby": titleId,
    className: `spui-dialog ${className}`.trim(),
    onClose: () => onOpenChange?.(false),
  },
  createElement("header", null,
    createElement("h2", { id: titleId }, title),
    createElement("button", { type: "button", onClick: () => ref.current?.close(), "aria-label": closeLabel }, closeLabel),
  ), children);
}
