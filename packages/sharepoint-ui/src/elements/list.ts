import { base } from "./shared.js";

export type ListItemValue = string | number;
export type ListSelectionMode = "single" | "multiselect";
export type ListNavigationMode = "items" | "composite";
export type ListSelectionChangeData = { event: Event; type: "change"; selectedItems: ListItemValue[] };
export type ListItemActionEvent = CustomEvent<{ originalEvent: Event; value: ListItemValue }>;
export type ListItemActionData = { event: ListItemActionEvent; type: "ListItemAction"; value: ListItemValue };

const parseValues = (value: string | null): ListItemValue[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is ListItemValue => typeof item === "string" || (typeof item === "number" && Number.isFinite(item))) : [];
  } catch { return []; }
};

export function defineListItem(): void {
  if (customElements.get("spui-list-item")) return;
  class SpuiListItem extends HTMLElement {
    static observedAttributes = ["value", "disabled-selection", "has-action", "role"];
    private generatedValue = `spui-list-item-${crypto.randomUUID()}`;
    private itemValue?: ListItemValue;
    connectedCallback(): void { this.render(); this.closest<HTMLElement>("spui-list")?.dispatchEvent(new Event("spui-list-items-change")); }
    disconnectedCallback(): void { this.closest<HTMLElement>("spui-list")?.dispatchEvent(new Event("spui-list-items-change")); }
    attributeChangedCallback(name: string): void { if (this.isConnected) { if (name === "role") this.syncCompositeCell(); this.closest<HTMLElement>("spui-list")?.dispatchEvent(new Event("spui-list-items-change")); } }
    get value(): ListItemValue { const attr = this.getAttribute("value"); return this.itemValue ?? attr ?? (this.id || this.generatedValue); }
    set value(value: ListItemValue) { this.itemValue = value; this.setAttribute("value", String(value)); }
    get disabledSelection(): boolean { return this.hasAttribute("disabled-selection"); }
    set disabledSelection(value: boolean) { this.toggleAttribute("disabled-selection", value); }
    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{box-sizing:border-box;position:relative;display:flex;align-items:center;gap:8px;min-width:0;min-height:36px;padding:6px 10px;border-radius:var(--spui-list-item-radius,var(--spui-control-radius,4px));outline:none;color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424));cursor:default}:host(:focus-visible){outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}:host(:hover){background:var(--spui-list-row-hover,var(--spui-ui-surface-hover,#f5f5f5))}:host([aria-selected=true]){background:var(--spui-list-selected-background,color-mix(in srgb,var(--spui-ui-accent,#0078d4) 12%,var(--spui-ui-surface,#fff)))}:host([aria-selected=true]) .checkmark{opacity:1}:host([aria-disabled=true]){opacity:.55}.content{display:flex;align-items:center;gap:inherit;min-width:0;flex:1}.checkmark{display:inline-flex;align-items:center;justify-content:center;flex:none;width:16px;height:16px;opacity:0;color:var(--spui-ui-accent,#0078d4);font-size:14px}.checkmark::before{content:"✓"}@media(forced-colors:active){:host([aria-selected=true]){outline:1px solid Highlight;background:Canvas;color:CanvasText}.checkmark{color:Highlight}}`;
      const checkmark = document.createElement("span"); checkmark.className = "checkmark"; checkmark.part.add("checkmark"); checkmark.setAttribute("aria-hidden", "true"); checkmark.append(document.createElement("slot"));
      const customCheckmark = checkmark.querySelector("slot")!; customCheckmark.name = "checkmark"; customCheckmark.textContent = "✓";
      const content = document.createElement("span"); content.className = "content"; content.part.add("content");
      const contentSlot = document.createElement("slot"); contentSlot.addEventListener("slotchange", () => this.syncCompositeCell()); content.append(contentSlot);
      shadow.replaceChildren(style, checkmark, content);
      this.syncCompositeCell();
    }
    private syncCompositeCell(): void {
      const content = this.shadowRoot?.querySelector<HTMLElement>(".content");
      if (!content) return;
      const inGrid = this.getAttribute("role") === "row" && this.closest("spui-list")?.getAttribute("role") === "grid";
      const hasExplicitCell = this.querySelector('[role="gridcell"],[role="rowheader"],[role="columnheader"]') !== null;
      if (inGrid && !hasExplicitCell) content.setAttribute("role", "gridcell");
      else content.removeAttribute("role");
    }
  }
  customElements.define("spui-list-item", SpuiListItem);
}

export function defineList(): void {
  defineListItem();
  if (customElements.get("spui-list")) return;
  class SpuiList extends HTMLElement {
    static observedAttributes = ["selection-mode", "navigation-mode", "selected-items", "default-selected-items", "role"];
    private selected: ListItemValue[] = [];
    private controlled?: ListItemValue[];
    private generatedRole?: string;
    private generatedItemRoles = new WeakMap<HTMLElement, string>();
    private activeIndex = 0;
    private onKeyDownBound = (event: KeyboardEvent) => this.onKeyDown(event);
    private onClickBound = (event: MouseEvent) => this.onClick(event);
    private onFocusBound = (event: FocusEvent) => this.onFocus(event);
    private onCheckmarkChangeBound = (event: Event) => this.onCheckmarkChange(event);
    private syncBound = () => this.syncItems();
    constructor() { super(); }
    connectedCallback(): void {
      this.setAttribute("data-spui-list", "");
      this.addEventListener("keydown", this.onKeyDownBound);
      this.addEventListener("click", this.onClickBound);
      this.addEventListener("focusin", this.onFocusBound);
      this.addEventListener("change", this.onCheckmarkChangeBound);
      this.addEventListener("spui-change", this.onCheckmarkChangeBound);
      this.addEventListener("spui-list-items-change", this.syncBound);
      if (this.hasAttribute("selected-items")) this.controlled = parseValues(this.getAttribute("selected-items"));
      else this.selected = parseValues(this.getAttribute("default-selected-items"));
      this.render(); this.syncItems();
    }
    disconnectedCallback(): void {
      this.removeEventListener("keydown", this.onKeyDownBound);
      this.removeEventListener("click", this.onClickBound);
      this.removeEventListener("focusin", this.onFocusBound);
      this.removeEventListener("change", this.onCheckmarkChangeBound);
      this.removeEventListener("spui-change", this.onCheckmarkChangeBound);
      this.removeEventListener("spui-list-items-change", this.syncBound);
    }
    attributeChangedCallback(name: string): void {
      if (!this.isConnected) return;
      if (name === "selected-items") this.controlled = this.hasAttribute("selected-items") ? parseValues(this.getAttribute("selected-items")) : undefined;
      if (name === "default-selected-items" && this.controlled === undefined) this.selected = parseValues(this.getAttribute("default-selected-items"));
      this.render(); this.syncItems();
    }
    get selectionMode(): ListSelectionMode | undefined { const mode = this.getAttribute("selection-mode"); return mode === "single" || mode === "multiselect" ? mode : undefined; }
    set selectionMode(value: ListSelectionMode | undefined) { value ? this.setAttribute("selection-mode", value) : this.removeAttribute("selection-mode"); }
    get navigationMode(): ListNavigationMode | undefined { const mode = this.getAttribute("navigation-mode"); return mode === "items" || mode === "composite" ? mode : undefined; }
    set navigationMode(value: ListNavigationMode | undefined) { value ? this.setAttribute("navigation-mode", value) : this.removeAttribute("navigation-mode"); }
    get selectedItems(): ListItemValue[] { return [...(this.controlled ?? this.selected)]; }
    set selectedItems(value: Iterable<ListItemValue> | undefined) { this.controlled = value === undefined ? undefined : [...value]; this.syncItems(); }
    get defaultSelectedItems(): ListItemValue[] { return parseValues(this.getAttribute("default-selected-items")); }
    set defaultSelectedItems(value: Iterable<ListItemValue>) { this.setAttribute("default-selected-items", JSON.stringify([...value])); }
    private items(): HTMLElement[] { return [...this.children].filter((element): element is HTMLElement => element.localName === "spui-list-item"); }
    private render(): void {
      const mode = this.navigationMode;
      const selection = this.selectionMode;
      const currentRole = this.getAttribute("role");
      const role = currentRole && currentRole !== this.generatedRole ? currentRole : (mode === "composite" ? "grid" : selection ? "listbox" : "list");
      this.generatedRole = role;
      if (this.getAttribute("role") !== role) this.setAttribute("role", role);
      if (selection === "multiselect") this.setAttribute("aria-multiselectable", "true"); else this.removeAttribute("aria-multiselectable");
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const style = document.createElement("style"); style.textContent = `${base}:host{box-sizing:border-box;display:flex;flex-direction:column;gap:var(--spui-list-gap,2px);min-width:0;margin:0;padding:var(--spui-list-padding,0);color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424));font-family:var(--spui-font-family,inherit)}:host(:focus-visible){outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4))}@media(forced-colors:active){:host{border-color:CanvasText}}`;
      const slot = document.createElement("slot"); slot.addEventListener("slotchange", this.syncBound);
      shadow.replaceChildren(style, slot);
    }
    private syncItems(): void {
      const items = this.items();
      const role = this.getAttribute("role") || "list";
      const selection = this.selectionMode;
      const focused = items.indexOf(this.shadowRoot?.activeElement as HTMLElement);
      if (focused >= 0) this.activeIndex = focused;
      if (this.activeIndex >= items.length) this.activeIndex = Math.max(0, items.length - 1);
      items.forEach((item, index) => {
        const selectable = selection !== undefined;
        const itemRole = role === "grid" ? "row" : role === "listbox" ? "option" : "listitem";
        const currentRole = item.getAttribute("role");
        const effectiveRole = currentRole && currentRole !== this.generatedItemRoles.get(item) ? currentRole : itemRole;
        this.generatedItemRoles.set(item, effectiveRole);
        if (currentRole !== effectiveRole) item.setAttribute("role", effectiveRole);
        if (selectable) {
          const selected = this.selectedItems.includes((item as HTMLElement & { value?: ListItemValue }).value ?? item.getAttribute("value") ?? "");
          item.setAttribute("aria-selected", String(selected));
          if (item.hasAttribute("disabled-selection") && !item.hasAttribute("has-action")) item.setAttribute("aria-disabled", "true"); else item.removeAttribute("aria-disabled");
          const checkmarkSlot = item.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="checkmark"]');
          const assigned = checkmarkSlot?.assignedElements({ flatten: true }) ?? [];
          const controls = assigned.flatMap(element => [
            ...(element.matches('input[type="checkbox"],spui-checkbox') ? [element] : []),
            ...element.querySelectorAll('input[type="checkbox"],spui-checkbox')
          ]);
          for (const control of controls) {
            const checkbox = control as HTMLElement & { checked?: boolean | "mixed"; disabled?: boolean };
            checkbox.checked = selected;
            checkbox.disabled = item.hasAttribute("disabled-selection");
            checkbox.tabIndex = -1;
          }
        } else { item.removeAttribute("aria-selected"); item.removeAttribute("aria-disabled"); }
        const managedTabOrder = this.navigationMode !== undefined || selectable;
        item.tabIndex = managedTabOrder ? (index === this.activeIndex ? 0 : -1) : item.hasAttribute("has-action") ? 0 : -1;
      });
    }
    private onFocus(event: FocusEvent): void {
      const item = (event.target as Element).closest<HTMLElement>("spui-list-item");
      const index = item ? this.items().indexOf(item) : -1;
      if (index >= 0) { this.activeIndex = index; this.syncItems(); }
    }
    private onKeyDown(event: KeyboardEvent): void {
      const current = (event.target as Element).closest<HTMLElement>("spui-list-item");
      if (!current) return;
      const origin = event.composedPath()[0] as HTMLElement;
      const nestedTarget = origin !== current;
      const items = this.items();
      const index = items.indexOf(current);
      if (this.navigationMode === "composite" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        const rtl = getComputedStyle(this).direction === "rtl";
        const step = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
        const focusable = [...current.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(node => !node.hasAttribute("disabled") && !node.hasAttribute("hidden"));
        if (!nestedTarget) {
          if (step > 0 && focusable[0]) { event.preventDefault(); focusable[0].focus(); }
          else if (step < 0 && focusable.length) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
        } else {
          const currentTarget = origin;
          const focusIndex = focusable.findIndex(node => node === currentTarget || node.contains(currentTarget));
          const next = focusable[focusIndex + step];
          if (next) { event.preventDefault(); next.focus(); }
          else if (step < 0 && focusIndex === 0) { event.preventDefault(); current.focus(); }
        }
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
        if (this.navigationMode === undefined && this.selectionMode === undefined) return;
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" || event.key === "End" ? -1 : 1;
        let next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : Math.max(0, Math.min(items.length - 1, index + direction));
        while (items[next]?.getAttribute("aria-disabled") === "true" && next >= 0 && next < items.length) next += direction || 1;
        if (items[next]) { this.activeIndex = next; this.syncItems(); items[next].focus(); }
        return;
      }
      if (nestedTarget || (event.key !== "Enter" && event.key !== " ")) return;
      const value = (current as HTMLElement & { value?: ListItemValue }).value ?? current.getAttribute("value") ?? "";
      if (event.key === " " && this.selectionMode) {
        event.preventDefault();
        if (!current.hasAttribute("disabled-selection")) this.toggleSelection(value, event);
        return;
      }
      this.activate(current, event, value);
    }
    private onClick(event: MouseEvent): void {
      const current = (event.target as Element).closest<HTMLElement>("spui-list-item");
      if (!current) return;
      const path = event.composedPath();
      const itemIndex = path.indexOf(current);
      if (path.slice(0, itemIndex < 0 ? path.length : itemIndex).some(node => node instanceof Element && node.matches("a,button,input,select,textarea,[contenteditable=true]"))) return;
      const value = (current as HTMLElement & { value?: ListItemValue }).value ?? current.getAttribute("value") ?? "";
      this.activate(current, event, value);
    }
    private onCheckmarkChange(event: Event): void {
      const path = event.composedPath();
      const item = path.find((node): node is HTMLElement => node instanceof HTMLElement && node.localName === "spui-list-item");
      if (!item || !path.some(node => node instanceof Element && node.getAttribute("slot") === "checkmark")) return;
      if (event.type === "change" && path.some(node => node instanceof Element && node.localName === "spui-checkbox")) return;
      if (!this.selectionMode || item.hasAttribute("disabled-selection")) { this.syncItems(); return; }
      const detail = (event as CustomEvent<{ checked?: boolean | "mixed" }>).detail;
      const target = event.target as HTMLElement & { checked?: boolean | "mixed" };
      const checked = detail?.checked ?? target.checked;
      if (checked === undefined) return;
      const value = (item as HTMLElement & { value?: ListItemValue }).value ?? item.getAttribute("value") ?? "";
      this.setItemSelected(value, checked === true, event);
    }
    private activate(item: HTMLElement, originalEvent: Event, value: ListItemValue): void {
      const action = new CustomEvent("spui-list-item-action", { bubbles: true, composed: true, cancelable: true, detail: { originalEvent, value } });
      item.dispatchEvent(action);
      if (action.defaultPrevented) return;
      if (this.selectionMode && !item.hasAttribute("disabled-selection")) this.toggleSelection(value, originalEvent);
    }
    private toggleSelection(value: ListItemValue, originalEvent: Event): void {
      const selected = this.selectedItems;
      this.setItemSelected(value, !selected.includes(value), originalEvent);
    }
    private setItemSelected(value: ListItemValue, selected: boolean, originalEvent: Event): void {
      const current = this.selectedItems;
      const next = this.selectionMode === "single"
        ? (selected ? [value] : current.filter(item => item !== value))
        : (selected ? current.includes(value) ? current : [...current, value] : current.filter(item => item !== value));
      if (this.controlled === undefined) this.selected = next;
      this.syncItems();
      this.dispatchEvent(new CustomEvent("spui-selection-change", { bubbles: true, composed: true, detail: { event: originalEvent, type: "change", selectedItems: next } }));
    }
  }
  customElements.define("spui-list", SpuiList);
}
