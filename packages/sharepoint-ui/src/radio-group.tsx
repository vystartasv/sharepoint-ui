import { createElement, type FieldsetHTMLAttributes, type ReactElement, type ReactNode } from "react";

export type RadioGroupProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children"> & {
  label: ReactNode;
  children?: ReactNode;
};

export function RadioGroup({ label, className = "", children, ...props }: RadioGroupProps): ReactElement {
  return createElement("fieldset", { ...props, className: `spui-radio-group ${className}`.trim() },
    createElement("legend", null, label), children,
  );
}
