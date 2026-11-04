import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type ListProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  ordered?: boolean;
  children?: ReactElement | ReactElement[];
};

export function List({ ordered, className = "", children, ...props }: ListProps): ReactElement {
  const tag = ordered ? "ol" : "ul";
  return createElement(tag, { ...props, className: `spui-list ${className}`.trim() }, children);
}
