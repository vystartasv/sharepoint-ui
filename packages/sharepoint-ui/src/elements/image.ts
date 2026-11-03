export type ImageFit = "none" | "center" | "contain" | "cover" | "default";
export type ImageShape = "square" | "rounded" | "circular";

export type ImageOptions = {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  title?: string;
  className?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
  fetchPriority?: "high" | "low" | "auto";
  fit?: ImageFit;
  shape?: ImageShape;
  block?: boolean;
  bordered?: boolean;
  shadow?: boolean;
};

type ImageStyleOptions = Pick<ImageOptions, "fit" | "shape" | "block" | "bordered" | "shadow"> & { width?: number | string; height?: number | string };

export function getImageStyle({ fit = "default", shape = "square", block, bordered, shadow, width, height }: ImageStyleOptions): Record<string, string> {
  const fitFill = fit !== "default" && width == null && height == null;
  return {
    display: block ? "block" : "inline-block",
    maxWidth: "100%",
    ...(block ? { width: "100%" } : {}),
    ...(fitFill ? { width: "100%", height: "100%" } : {}),
    ...(fit === "default" ? {} : { objectFit: fit === "center" ? "none" : fit }),
    ...(fit === "default" ? {} : { objectPosition: fit === "none" ? "left top" : "center" }),
    borderRadius: shape === "circular" ? "50%" : shape === "rounded" ? "var(--spui-image-radius,var(--spui-control-radius,4px))" : "0",
    ...(bordered ? { border: "1px solid var(--spui-image-border,var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1)))" } : {}),
    ...(shadow ? { boxShadow: "var(--spui-image-shadow,var(--spui-card-shadow,0 1px 3px #0002))" } : {}),
  };
}

/** Create a native image with browser-native responsive loading and meaningful alt text. */
export function createImage(options: ImageOptions): HTMLImageElement {
  const image = document.createElement("img");
  image.alt = options.alt;
  if (options.srcSet) image.srcset = options.srcSet;
  if (options.sizes) image.sizes = options.sizes;
  if (options.width !== undefined) image.width = options.width;
  if (options.height !== undefined) image.height = options.height;
  if (options.title) image.title = options.title;
  if (options.className) image.className = options.className;
  image.loading = options.loading ?? "lazy";
  image.decoding = options.decoding ?? "async";
  image.fetchPriority = options.fetchPriority ?? "auto";
  Object.assign(image.style, getImageStyle(options));
  // Configure the candidate set and intrinsic layout before starting any image request.
  image.src = options.src;
  return image;
}
