import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, "children" | "aria-label"> & {
  name: string;
  src?: string;
};

export function Avatar({ name, src, className = "", ...props }: AvatarProps): ReactElement {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toLocaleUpperCase()).join("");
  return createElement("span", { ...props, role: "img", "aria-label": name, className: `spui-avatar ${className}`.trim() },
    src ? createElement("img", { src, alt: "" }) : initials,
  );
}
