import { createElement, useId, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type EmptyStateProps = Omit<HTMLAttributes<HTMLElement>, "children" | "title"> & {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
};

export function EmptyState({ title, description, className = "", children, ...props }: EmptyStateProps): ReactElement {
  const headingId = useId();
  return createElement("section", { ...props, "aria-labelledby": headingId, className: `spui-empty-state ${className}`.trim() },
    createElement("h2", { id: headingId }, title),
    description && createElement("p", null, description),
    children,
  );
}
