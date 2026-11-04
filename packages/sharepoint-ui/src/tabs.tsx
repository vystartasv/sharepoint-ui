import { createElement, useId, useState, type HTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode } from "react";

export type TabItem = { id: string; label: ReactNode; content: ReactNode };
export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  label: string;
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export function Tabs({ label, items, value, defaultValue, onValueChange, className = "", ...props }: TabsProps): ReactElement {
  const baseId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.id ?? "");
  const selected = value ?? internalValue;
  const select = (next: string) => {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  };
  const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !items.length) return;
    event.preventDefault();
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const current = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")].indexOf(event.target as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : (current + (event.key === "ArrowRight" !== rtl ? 1 : -1) + items.length) % items.length;
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
    select(items[next]!.id);
  };
  const activeIndex = Math.max(0, items.findIndex(item => item.id === selected));
  return createElement("div", { ...props, className: `spui-tabs ${className}`.trim() },
    createElement("div", { role: "tablist", "aria-label": label, onKeyDown: moveFocus },
      items.map((item, index) => createElement("button", {
        key: item.id, id: `${baseId}-tab-${index}`, type: "button", role: "tab",
        "aria-selected": index === activeIndex, "aria-controls": `${baseId}-panel-${index}`,
        tabIndex: index === activeIndex ? 0 : -1, onClick: () => select(item.id),
      }, item.label)),
    ),
    items.map((item, index) => index === activeIndex && createElement("div", {
      key: item.id, id: `${baseId}-panel-${index}`, role: "tabpanel", tabIndex: 0, "aria-labelledby": `${baseId}-tab-${index}`,
    }, item.content)),
  );
}
