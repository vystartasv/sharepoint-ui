import { createElement, useId, type ProgressHTMLAttributes, type ReactElement } from "react";

export type ProgressBarProps = Omit<ProgressHTMLAttributes<HTMLProgressElement>, "children" | "aria-label"> & {
  label: string;
};

export function ProgressBar({ label, className = "", ...props }: ProgressBarProps): ReactElement {
  const id = useId();
  return createElement("div", { className: "spui-progress" },
    createElement("label", { htmlFor: id }, label),
    createElement("progress", { ...props, id, className: `spui-progress-bar ${className}`.trim() }),
  );
}
