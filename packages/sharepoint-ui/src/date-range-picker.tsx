import { createElement, type FieldsetHTMLAttributes, type InputHTMLAttributes, type ReactElement } from "react";

export type DateRangePickerProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "id" | "children"> & {
  id: string;
  label: string;
  startLabel?: string;
  endLabel?: string;
  startName?: string;
  endName?: string;
  startProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "type">;
  endProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "type">;
};

export function DateRangePicker({
  id, label, startLabel = "Start date", endLabel = "End date", startName = "start", endName = "end", startProps, endProps, className = "", ...props
}: DateRangePickerProps): ReactElement {
  return createElement("fieldset", { ...props, className: `spui-date-range ${className}`.trim() },
    createElement("legend", null, label),
    createElement("label", { htmlFor: `${id}-start` }, startLabel,
      createElement("input", { ...startProps, id: `${id}-start`, name: startName, type: "date", className: `spui-input ${startProps?.className ?? ""}`.trim() }),
    ),
    createElement("label", { htmlFor: `${id}-end` }, endLabel,
      createElement("input", { ...endProps, id: `${id}-end`, name: endName, type: "date", className: `spui-input ${endProps?.className ?? ""}`.trim() }),
    ),
  );
}
