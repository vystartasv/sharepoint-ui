import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { Avatar } from "./avatar.js";

export type PersonaProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  name: string;
  description?: ReactNode;
  src?: string;
};

export function Persona({ name, description, src, className = "", ...props }: PersonaProps): ReactElement {
  return createElement("div", { ...props, className: `spui-persona ${className}`.trim() },
    createElement(Avatar, { name, src }),
    createElement("span", { className: "spui-persona-copy" },
      createElement("strong", null, name),
      description && createElement("span", null, description),
    ),
  );
}
