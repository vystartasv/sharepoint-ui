import { createElement, useState, type HTMLAttributes, type ReactElement, type ReactNode, type UIEvent } from "react";

export type VirtualListProps<Item> = Omit<HTMLAttributes<HTMLDivElement>, "children" | "aria-label"> & {
  label: string;
  items: readonly Item[];
  itemHeight: number;
  height: number;
  getItemKey: (item: Item, index: number) => string;
  renderItem: (item: Item, index: number) => ReactNode;
  overscan?: number;
};

export function VirtualList<Item>({
  label, items, itemHeight, height, getItemKey, renderItem, overscan = 3, className = "", style, ...props
}: VirtualListProps<Item>): ReactElement {
  const [scrollTop, setScrollTop] = useState(0);
  const rowHeight = Math.max(1, itemHeight);
  const viewportHeight = Math.max(1, height);
  const extra = Math.max(0, Math.floor(overscan));
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - extra);
  const end = Math.min(items.length, start + Math.ceil(viewportHeight / rowHeight) + extra * 2);
  const onScroll = (event: UIEvent<HTMLDivElement>) => setScrollTop(event.currentTarget.scrollTop);
  return createElement("div", {
    ...props,
    role: "list",
    "aria-label": label,
    tabIndex: 0,
    className: `spui-virtual-list ${className}`.trim(),
    style: { ...style, height: viewportHeight, overflowY: "auto" },
    onScroll,
  },
  createElement("div", { role: "presentation", "aria-hidden": true, style: { height: start * rowHeight } }),
  items.slice(start, end).map((item, offset) => {
    const index = start + offset;
    return createElement("div", {
      key: getItemKey(item, index), role: "listitem", "aria-posinset": index + 1, "aria-setsize": items.length,
      className: "spui-virtual-list-item", style: { height: rowHeight },
    }, renderItem(item, index));
  }),
  createElement("div", { role: "presentation", "aria-hidden": true, style: { height: (items.length - end) * rowHeight } }),
  );
}
