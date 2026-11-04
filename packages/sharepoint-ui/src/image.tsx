import { createElement, type ImgHTMLAttributes, type ReactElement } from "react";

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt"> & { alt: string };

export function Image({ className = "", ...props }: ImageProps): ReactElement {
  return createElement("img", { ...props, className: `spui-image ${className}`.trim() });
}
