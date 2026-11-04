import { createElement, type HTMLAttributes, type ReactElement } from "react";
import { Avatar } from "./avatar.js";

export type AvatarGroupPerson = { id: string; name: string; src?: string };
export type AvatarGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "aria-label"> & {
  label: string;
  people: readonly AvatarGroupPerson[];
  maxVisible?: number;
};

export function AvatarGroup({ label, people, maxVisible = 4, className = "", ...props }: AvatarGroupProps): ReactElement {
  const visible = people.slice(0, Math.max(0, maxVisible));
  const remaining = people.length - visible.length;
  return createElement("div", { ...props, role: "group", "aria-label": label, className: `spui-avatar-group ${className}`.trim() },
    visible.map(person => createElement(Avatar, { key: person.id, name: person.name, src: person.src })),
    remaining > 0 && createElement("span", { className: "spui-avatar-overflow", "aria-label": `${remaining} more people` }, `+${remaining}`),
  );
}
