import { createElement, type CSSProperties, type HTMLAttributes, type ReactElement } from "react";

export type SkeletonProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
};

export function Skeleton({ width = "100%", height = "1em", className = "", style, ...props }: SkeletonProps): ReactElement {
  return createElement("span", {
    ...props,
    "aria-hidden": true,
    className: `spui-skeleton ${className}`.trim(),
    style: { ...style, width, height },
  });
}
