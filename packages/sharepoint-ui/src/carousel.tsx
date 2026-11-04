import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type CarouselItem = { id: string; label: string; content: ReactNode };
export type CarouselProps = Omit<HTMLAttributes<HTMLElement>, "children" | "aria-label"> & {
  label: string;
  items: readonly CarouselItem[];
};

export function Carousel({ label, items, className = "", ...props }: CarouselProps): ReactElement {
  return createElement("section", { ...props, role: "region", "aria-label": label, "aria-roledescription": "carousel", tabIndex: 0, className: `spui-carousel ${className}`.trim() },
    createElement("ul", null, items.map((item, index) => createElement("li", {
      key: item.id, "aria-roledescription": "slide", "aria-label": `${item.label}, ${index + 1} of ${items.length}`,
    }, item.content))),
  );
}
