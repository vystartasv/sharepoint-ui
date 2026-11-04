import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type ViewCardProps = Omit<HTMLAttributes<HTMLElement>, "children" | "title"> & {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
};

export function ViewCard({ title, subtitle, description, className = "", children, ...props }: ViewCardProps): ReactElement {
  return createElement("article", { ...props, className: `spui-view-card ${className}`.trim() },
    createElement("h2", null, title),
    subtitle && createElement("p", { className: "spui-view-subtitle" }, subtitle),
    description && createElement("p", null, description),
    children,
  );
}
