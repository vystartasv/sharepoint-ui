import { base } from "./shared.js";

const ITEM_TAGS = ["spui-color-swatch", "spui-image-swatch", "spui-empty-swatch"];

function pickerFor(item: HTMLElement): HTMLElement | null { return item.closest("spui-swatch-picker"); }

export function defineColorSwatch(): void {
  if (customElements.get("spui-color-swatch")) return;
  class SpuiColorSwatch extends HTMLElement {
    static observedAttributes = ["color", "value", "disabled", "size", "shape", "border-color", "aria-label", "selected"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); else this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    focus(options?: FocusOptions): void { this.shadowRoot?.querySelector("button")?.focus(options); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex;flex:none}button{box-sizing:border-box;position:relative;display:grid;place-items:center;width:var(--spui-swatch-size,28px);height:var(--spui-swatch-size,28px);padding:3px;border:1px solid var(--swatch-border,var(--spui-ui-stroke,var(--colorNeutralStroke1,#d1d1d1)));border-radius:var(--spui-swatch-radius,4px);background:transparent;color:var(--spui-ui-text,CanvasText);cursor:pointer}button::before{content:"";display:block;width:100%;height:100%;border-radius:inherit;background:var(--swatch-color,transparent)}.indicator{position:absolute;inset:3px;z-index:1;display:grid;place-items:center;pointer-events:none;color:var(--spui-ui-text,CanvasText)}.indicator[hidden],:host(:not([disabled])) .disabled-indicator{display:none}:host([selected]) button{border-color:transparent;box-shadow:inset 0 0 0 2px var(--spui-ui-accent,var(--spui-focus-ring,#0078d4)),inset 0 0 0 5px var(--spui-ui-surface,#fff)}button[aria-selected=true]{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}button:disabled{opacity:.5;cursor:not-allowed}:host([shape=circular]) button,:host([shape=circular]) button::before{border-radius:50%}:host([shape=rounded]) button,:host([shape=rounded]) button::before{border-radius:var(--spui-control-radius,6px)}@media(forced-colors:active){button{border-color:ButtonText}button[aria-selected=true],button:focus-visible{outline-color:Highlight}:host([selected]) button{box-shadow:inset 0 0 0 2px Highlight,inset 0 0 0 5px Canvas}}`;
      const button = document.createElement("button"); button.type = "button";
      button.addEventListener("click", event => {
        if (button.disabled) return;
        const detail = { value: this.getAttribute("value") ?? this.getAttribute("color") ?? "", color: this.getAttribute("color") ?? "" };
        this.dispatchEvent(new CustomEvent("spui-swatch-select", { bubbles: true, composed: true, detail: { ...detail, originalEvent: event } }));
      });
      const icon = document.createElement("span"); icon.className = "indicator icon"; icon.append(Object.assign(document.createElement("slot"), { name: "icon" }));
      const disabledIcon = document.createElement("span"); disabledIcon.className = "indicator disabled-indicator";
      const disabledSlot = document.createElement("slot"); disabledSlot.name = "disabled-icon";
      const fallback = document.createElementNS("http://www.w3.org/2000/svg", "svg"); fallback.setAttribute("viewBox", "0 0 16 16"); fallback.setAttribute("aria-hidden", "true"); fallback.innerHTML = '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 12 12 4" fill="none" stroke="currentColor" stroke-width="1.5"/>';
      disabledSlot.append(fallback); disabledIcon.append(disabledSlot);
      button.append(icon, disabledIcon);
      shadow.append(style, button); this.sync();
    }
    private sync(): void {
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button"); if (!button) return;
      const picker = pickerFor(this); const grid = picker?.getAttribute("layout") !== "row";
      const size = this.getAttribute("size") || picker?.getAttribute("size") || "medium";
      const shape = this.getAttribute("shape") || picker?.getAttribute("shape") || "square";
      const sizeMap: Record<string, string> = { "extra-small": "20px", small: "24px", medium: "28px", large: "32px" };
      button.style.setProperty("--spui-swatch-size", sizeMap[size] || sizeMap.medium);
      button.style.setProperty("--spui-swatch-radius", shape === "circular" ? "50%" : "var(--spui-control-radius,6px)");
      button.style.setProperty("--swatch-color", this.getAttribute("color") || "transparent");
      button.style.setProperty("--swatch-border", this.getAttribute("border-color") || "var(--spui-ui-stroke,var(--colorNeutralStroke1,#d1d1d1))");
      button.disabled = this.hasAttribute("disabled");
      if (grid) { this.setAttribute("role", "gridcell"); this.setAttribute("aria-selected", String(this.hasAttribute("selected"))); button.removeAttribute("role"); button.removeAttribute("aria-selected"); }
      else { this.removeAttribute("role"); this.removeAttribute("aria-selected"); button.setAttribute("role", "radio"); button.removeAttribute("aria-selected"); }
      button.setAttribute("aria-label", this.getAttribute("aria-label") || this.getAttribute("value") || this.getAttribute("color") || "Color swatch");
      button.tabIndex = picker?.getAttribute("focus-mode") === "tab" ? 0 : this.hasAttribute("tab-stop") ? 0 : -1;
    }
  }
  customElements.define("spui-color-swatch", SpuiColorSwatch);
}

export function defineImageSwatch(): void {
  if (customElements.get("spui-image-swatch")) return;
  class SpuiImageSwatch extends HTMLElement {
    static observedAttributes = ["src", "value", "disabled", "size", "shape", "aria-label", "selected"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); else this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    focus(options?: FocusOptions): void { this.shadowRoot?.querySelector("button")?.focus(options); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex;flex:none}button{box-sizing:border-box;width:var(--spui-swatch-size,28px);height:var(--spui-swatch-size,28px);padding:3px;border:1px solid var(--spui-ui-stroke,var(--colorNeutralStroke1,#d1d1d1));border-radius:var(--spui-swatch-radius,4px);background:transparent;cursor:pointer}img{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit}:host([selected]) button{border-color:transparent;box-shadow:inset 0 0 0 2px var(--spui-ui-accent,var(--spui-focus-ring,#0078d4)),inset 0 0 0 5px var(--spui-ui-surface,#fff)}button[aria-selected=true],button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}button:disabled{opacity:.5;cursor:not-allowed}@media(forced-colors:active){button{border-color:ButtonText}button:focus-visible{outline-color:Highlight}:host([selected]) button{box-shadow:inset 0 0 0 2px Highlight,inset 0 0 0 5px Canvas}}`;
      const button = document.createElement("button"); button.type = "button"; const image = document.createElement("img"); image.alt = ""; button.append(image);
      button.addEventListener("click", event => { if (!button.disabled) this.dispatchEvent(new CustomEvent("spui-swatch-select", { bubbles: true, composed: true, detail: { value: this.getAttribute("value") ?? "", color: "", originalEvent: event } })); });
      shadow.append(style, button); this.sync();
    }
    private sync(): void {
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button"), image = this.shadowRoot?.querySelector<HTMLImageElement>("img"); if (!button || !image) return;
      const picker = pickerFor(this), grid = picker?.getAttribute("layout") !== "row";
      const sizeMap: Record<string, string> = { "extra-small": "20px", small: "24px", medium: "28px", large: "32px" };
      button.style.setProperty("--spui-swatch-size", sizeMap[this.getAttribute("size") || picker?.getAttribute("size") || "medium"] || sizeMap.medium);
      button.style.setProperty("--spui-swatch-radius", (this.getAttribute("shape") || picker?.getAttribute("shape")) === "circular" ? "50%" : "var(--spui-control-radius,6px)");
      button.disabled = this.hasAttribute("disabled");
      if (grid) { this.setAttribute("role", "gridcell"); this.setAttribute("aria-selected", String(this.hasAttribute("selected"))); button.removeAttribute("role"); button.removeAttribute("aria-selected"); }
      else { this.removeAttribute("role"); this.removeAttribute("aria-selected"); button.setAttribute("role", "radio"); button.removeAttribute("aria-selected"); }
      button.setAttribute("aria-label", this.getAttribute("aria-label") || this.getAttribute("value") || "Image swatch"); image.src = this.getAttribute("src") || "";
      button.tabIndex = picker?.getAttribute("focus-mode") === "tab" ? 0 : this.hasAttribute("tab-stop") ? 0 : -1;
    }
  }
  customElements.define("spui-image-swatch", SpuiImageSwatch);
}

export function defineEmptySwatch(): void {
  if (customElements.get("spui-empty-swatch")) return;
  class SpuiEmptySwatch extends HTMLElement {
    static observedAttributes = ["disabled", "size", "shape", "aria-label"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); else this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    focus(options?: FocusOptions): void { this.shadowRoot?.querySelector("button")?.focus(options); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex}button{width:var(--spui-swatch-size,28px);height:var(--spui-swatch-size,28px);border:1px dashed var(--spui-ui-stroke,var(--colorNeutralStroke1,#d1d1d1));border-radius:var(--spui-swatch-radius,4px);background:transparent;color:var(--spui-ui-text,CanvasText);font:inherit;font-size:20px;cursor:pointer}button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}button:disabled{opacity:.5;cursor:not-allowed}@media(forced-colors:active){button{border-color:ButtonText}button:focus-visible{outline-color:Highlight}}`;
      const button = document.createElement("button"); button.type = "button"; button.textContent = "+";
      button.addEventListener("click", () => { if (!button.disabled) this.dispatchEvent(new CustomEvent("spui-empty-swatch-activate", { bubbles: true, composed: true })); });
      shadow.append(style, button); this.sync();
    }
    private sync(): void {
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button"); if (!button) return;
      const picker = pickerFor(this), sizeMap: Record<string, string> = { "extra-small": "20px", small: "24px", medium: "28px", large: "32px" };
      button.style.setProperty("--spui-swatch-size", sizeMap[this.getAttribute("size") || picker?.getAttribute("size") || "medium"] || sizeMap.medium);
      button.style.setProperty("--spui-swatch-radius", (this.getAttribute("shape") || picker?.getAttribute("shape")) === "circular" ? "50%" : "var(--spui-control-radius,6px)");
      button.disabled = this.hasAttribute("disabled");
      const label = this.getAttribute("aria-label")?.trim() || "Add color";
      button.setAttribute("aria-label", label);
      if (picker?.getAttribute("layout") !== "row") { this.setAttribute("role", "gridcell"); if (this.getAttribute("aria-label") !== label) this.setAttribute("aria-label", label); button.removeAttribute("role"); }
      else { this.removeAttribute("role"); button.setAttribute("role", picker?.getAttribute("selection-mode") === "multiple" ? "checkbox" : "radio"); }
      button.tabIndex = picker?.getAttribute("focus-mode") === "tab" ? 0 : this.hasAttribute("tab-stop") ? 0 : -1;
    }
  }
  customElements.define("spui-empty-swatch", SpuiEmptySwatch);
}

export function defineSwatchPickerRow(): void {
  if (customElements.get("spui-swatch-picker-row")) return;
  class SpuiSwatchPickerRow extends HTMLElement {
    connectedCallback(): void { if (!this.shadowRoot) { this.setAttribute("role", "row"); const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style"); style.textContent = `${base}:host{display:flex;flex-wrap:nowrap;gap:var(--spui-swatch-gap,4px);align-items:center;min-width:0}slot{display:contents}`; const slot = document.createElement("slot"); shadow.append(style, slot); } }
  }
  customElements.define("spui-swatch-picker-row", SpuiSwatchPickerRow);
}

export function defineSwatchPicker(): void {
  if (customElements.get("spui-swatch-picker")) return;
  defineColorSwatch(); defineImageSwatch(); defineEmptySwatch(); defineSwatchPickerRow();
  class SpuiSwatchPicker extends HTMLElement {
    static observedAttributes = ["aria-label", "layout", "size", "shape", "spacing", "focus-mode", "selection-mode", "selected-value", "default-selected-value", "selected-values", "default-selected-values", "columns"];
    private itemSlot!: HTMLSlotElement; private events?: AbortController; private selected = new Set<string>(); private controlled = false; private activeValue = "";
    get selectionMode(): "single" | "multiple" { return this.multiple() ? "multiple" : "single"; }
    set selectionMode(value: "single" | "multiple") { if (value === "multiple") this.setAttribute("selection-mode", value); else this.removeAttribute("selection-mode"); }
    get selectedValue(): string { return this.selected.values().next().value ?? ""; }
    set selectedValue(value: string) { this.setAttribute("selected-value", value); }
    get selectedValues(): string[] { return [...this.selected]; }
    set selectedValues(values: string[]) { this.setAttribute("selected-values", JSON.stringify(Array.isArray(values) ? values : [])); }
    connectedCallback(): void {
      if (!this.shadowRoot) this.render(); this.events?.abort(); this.events = new AbortController();
      this.itemSlot.addEventListener("slotchange", this.refresh, { signal: this.events.signal });
      this.addEventListener("spui-swatch-select", this.onSelect as EventListener, { signal: this.events.signal });
      this.addEventListener("keydown", this.onKeyDown, { signal: this.events.signal });
      this.controlled = this.hasAttribute("selected-value") || this.hasAttribute("selected-values");
      this.selected = this.readValues(this.controlled ? "selected" : "default"); this.refresh();
    }
    disconnectedCallback(): void { this.events?.abort(); this.events = undefined; }
    attributeChangedCallback(name: string): void {
      if (!this.isConnected || !this.shadowRoot) return;
      if (["selected-value", "selected-values"].includes(name)) {
        this.controlled = this.hasAttribute("selected-value") || this.hasAttribute("selected-values");
        this.selected = this.readValues(this.controlled ? "selected" : "default");
      } else if (["default-selected-value", "default-selected-values"].includes(name) && !this.controlled) this.selected = this.readValues("default");
      this.refresh();
    }
    private multiple(): boolean { return this.getAttribute("selection-mode") === "multiple"; }
    private readValues(kind: "selected" | "default"): Set<string> {
      const plural = this.getAttribute(kind === "selected" ? "selected-values" : "default-selected-values");
      if (plural !== null) { try { const parsed: unknown = JSON.parse(plural); return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []); } catch { return new Set(); } }
      const singular = this.getAttribute(kind === "selected" ? "selected-value" : "default-selected-value");
      return new Set(singular ? [singular] : []);
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-block;max-width:100%;--spui-swatch-gap:var(--spui-swatch-picker-gap,4px)}.items{display:grid;grid-template-columns:repeat(var(--spui-swatch-columns,6),max-content);gap:var(--spui-swatch-gap);align-items:center;justify-content:start;max-width:100%}:host([layout=row]) .items{display:flex;flex-wrap:wrap}:host([spacing=small]){--spui-swatch-gap:2px}:host([spacing=medium]){--spui-swatch-gap:4px}:host([aria-disabled=true]){opacity:.55}`;
      style.textContent += ".items>slot{display:contents}";
      this.itemSlot = document.createElement("slot"); const items = document.createElement("div"); items.className = "items"; items.setAttribute("part", "control"); items.append(this.itemSlot); shadow.append(style, items);
    }
    private swatches(): HTMLElement[] { return this.itemSlot.assignedElements({ flatten: true }).flatMap(element => element.localName === "spui-swatch-picker-row" ? [...element.querySelectorAll<HTMLElement>(ITEM_TAGS.join(","))] : ITEM_TAGS.includes(element.localName) ? [element as HTMLElement] : []); }
    private refresh = (): void => {
      const grid = this.getAttribute("layout") !== "row", multiple = this.multiple(); const items = this.swatches();
      this.setAttribute("role", grid ? "grid" : multiple ? "group" : "radiogroup");
      if (grid && multiple) this.setAttribute("aria-multiselectable", "true"); else this.removeAttribute("aria-multiselectable");
      const label = this.getAttribute("aria-label"); if (!label) this.setAttribute("aria-label", "Choose a color");
      const columns = Math.max(1, Number(this.getAttribute("columns")) || 6); this.style.setProperty("--spui-swatch-columns", String(columns));
      const enabled = items.filter(item => !item.hasAttribute("disabled"));
      if (!enabled.some(item => (item.getAttribute("value") || item.getAttribute("color")) === this.activeValue)) {
        const active = enabled.find(item => this.selected.has(item.getAttribute("value") || item.getAttribute("color") || "")) ?? enabled[0];
        this.activeValue = active?.getAttribute("value") || active?.getAttribute("color") || "";
      }
      items.forEach(item => {
        const value = item.getAttribute("value") || item.getAttribute("color") || "";
        item.toggleAttribute("selected", this.selected.has(value));
        item.toggleAttribute("tab-stop", this.getAttribute("focus-mode") === "tab" || value === this.activeValue);
        const root = item.shadowRoot?.querySelector<HTMLElement>("button"); if (root) {
          if (grid) { item.setAttribute("role", "gridcell"); item.setAttribute("aria-selected", String(this.selected.has(value))); root.removeAttribute("role"); root.removeAttribute("aria-selected"); root.removeAttribute("aria-checked"); }
          else { item.removeAttribute("role"); item.removeAttribute("aria-selected"); root.setAttribute("role", multiple ? "checkbox" : "radio"); root.removeAttribute("aria-selected"); root.setAttribute("aria-checked", String(this.selected.has(value))); }
          root.tabIndex = this.getAttribute("focus-mode") === "tab" ? 0 : item.hasAttribute("tab-stop") ? 0 : -1;
        }
      });
    };
    private onSelect = (event: CustomEvent<{ value: string; color: string; originalEvent?: Event }>): void => {
      const { value, color } = event.detail, next = new Set(this.selected);
      this.activeValue = value;
      if (this.multiple()) { if (next.has(value)) next.delete(value); else next.add(value); }
      else { next.clear(); next.add(value); }
      if (!this.controlled) this.selected = next;
      this.refresh();
      const selectedSwatch = this.swatches().find(item => (item.getAttribute("value") || item.getAttribute("color")) === value);
      this.dispatchEvent(new CustomEvent("spui-selection-change", { bubbles: true, composed: true, detail: { event: event.detail?.originalEvent ?? event, type: "click", selectedValue: value, selectedSwatch: selectedSwatch?.getAttribute("color") ?? selectedSwatch?.getAttribute("src") ?? color, selectedColor: color, selectedValues: [...next], selectedColors: [...next].map(selected => this.swatches().find(item => (item.getAttribute("value") || item.getAttribute("color")) === selected)?.getAttribute("color") || ""), selectionMode: this.multiple() ? "multiple" : "single" } }));
    };
    private onKeyDown = (event: KeyboardEvent): void => {
      if (this.getAttribute("focus-mode") === "tab") return;
      const items = this.swatches().filter(item => !item.hasAttribute("disabled"));
      const current = items.findIndex(item => item.shadowRoot?.activeElement === item.shadowRoot?.querySelector("button")); if (current < 0) return;
      const columns = Math.max(1, Number(this.getAttribute("columns")) || 6); let next = current;
      const rtl = getComputedStyle(this).direction === "rtl";
      if (event.key === "ArrowRight") next += rtl ? -1 : 1;
      else if (event.key === "ArrowLeft") next += rtl ? 1 : -1;
      else if (event.key === "ArrowDown") next += columns;
      else if (event.key === "ArrowUp") next -= columns;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      else return;
      event.preventDefault(); next = (next + items.length) % items.length; this.activeValue = items[next].getAttribute("value") || items[next].getAttribute("color") || ""; this.refresh(); items[next]?.focus();
    };
  }
  customElements.define("spui-swatch-picker", SpuiSwatchPicker);
}
