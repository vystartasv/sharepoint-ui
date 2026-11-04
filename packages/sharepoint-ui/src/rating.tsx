import { createElement, useId, type InputHTMLAttributes, type ReactElement } from "react";

export type RatingProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "min" | "max" | "step"> & {
  label: string;
  min?: number;
  max?: number;
  step?: number;
};

export function Rating({ label, min = 0, max = 5, step = 1, className = "", ...props }: RatingProps): ReactElement {
  const id = useId();
  return createElement("div", { className: "spui-field" },
    createElement("label", { htmlFor: id }, label),
    createElement("input", { ...props, id, type: "number", min, max, step, className: `spui-input ${className}`.trim() }),
  );
}
