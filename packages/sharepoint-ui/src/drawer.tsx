import { createElement, type ReactElement } from "react";
import { Dialog, type DialogProps } from "./dialog.js";

export type DrawerProps = DialogProps & { placement?: "start" | "end" };

export function Drawer({ placement = "end", className = "", ...props }: DrawerProps): ReactElement {
  return createElement(Dialog, { ...props, className: `spui-drawer spui-drawer-${placement} ${className}`.trim() });
}
