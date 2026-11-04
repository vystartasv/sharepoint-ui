import { createElement, type ReactElement, type ReactNode, type TableHTMLAttributes } from "react";

export type TableProps = Omit<TableHTMLAttributes<HTMLTableElement>, "children"> & {
  caption: string;
  children?: ReactNode;
};

export function Table({ caption, children, className = "", ...props }: TableProps): ReactElement {
  return createElement("table", { ...props, className: `spui-table ${className}`.trim() },
    createElement("caption", null, caption), children,
  );
}
