import { base } from "./shared.js";

export type CardAppearance = "filled" | "filled-alternative" | "outline" | "subtle";
export type CardOrientation = "horizontal" | "vertical";
export type CardSize = "small" | "medium" | "large";
export type CardFocusMode = "off" | "no-tab" | "tab-exit" | "tab-only";

const focusableSelector = 'a[href],area[href],button,input:not([type="hidden"]),select,textarea,iframe,object,embed,audio[controls],video[controls],summary,[contenteditable]:not([contenteditable="false"]),[tabindex]';
function findCardFocusables(card: HTMLElement): HTMLElement[] {
  const found: HTMLElement[] = [];
  const visit = (element: Element): void => {
    if (element instanceof HTMLElement && element.matches(focusableSelector) && element.tabIndex >= 0 && !element.matches(":disabled,[hidden],[aria-hidden=true]") && element.getClientRects().length > 0) found.push(element);
    if (element instanceof HTMLSlotElement) {
      const assigned = element.assignedElements({ flatten: true });
      for (const child of assigned.length ? assigned : [...element.children]) visit(child);
      return;
    }
    const children = element.shadowRoot ? [...element.shadowRoot.children] : [...element.children];
    for (const child of children) visit(child);
  };
  for (const child of card.children) visit(child);
  return found;
}

function deepestActiveElement(document: Document): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

export function defineCard(): void {
  if (customElements.get("spui-card")) return;
  class SpuiCard extends HTMLElement {
    static observedAttributes = ["aria-label", "selectable", "selected", "default-selected", "disabled", "selection-label", "focus-mode"];
    private defaultSelectedValue?: boolean;
    private focusGroupActive = false;
    private managedTabIndex = false;
    private managedRole = false;
    private selectionInput(): HTMLInputElement | undefined {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=checkbox]");
      return slot?.assignedElements({ flatten: true }).find((element): element is HTMLInputElement => element instanceof HTMLInputElement)
        ?? this.shadowRoot?.querySelector<HTMLInputElement>(".selection") ?? undefined;
    }
    get selected(): boolean { return this.hasAttribute("selected"); }
    set selected(value: boolean) { this.toggleAttribute("selected", Boolean(value)); }
    get defaultSelected(): boolean { return this.defaultSelectedValue ?? this.hasAttribute("default-selected"); }
    set defaultSelected(value: boolean) { this.defaultSelectedValue = Boolean(value); this.setAttribute("selectable", ""); if (!this.hasAttribute("selected")) this.toggleAttribute("selected", this.defaultSelectedValue); }
    get focusMode(): CardFocusMode { const value = this.getAttribute("focus-mode"); return value === "no-tab" || value === "tab-exit" || value === "tab-only" ? value : "off"; }
    set focusMode(value: CardFocusMode) { if (value === "off") this.removeAttribute("focus-mode"); else this.setAttribute("focus-mode", value); }

    connectedCallback() {
      if (this.hasAttribute("default-selected")) {
        this.defaultSelectedValue = this.hasAttribute("default-selected");
        this.setAttribute("selectable", "");
        if (this.hasAttribute("default-selected") && !this.hasAttribute("selected")) this.toggleAttribute("selected", this.defaultSelectedValue ?? true);
        this.removeAttribute("default-selected");
      }
      if (this.hasAttribute("aria-label")) this.setAttribute("role", "region");
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
        style.textContent = `${base}:host{display:block;position:relative;min-width:0;border:1px solid var(--spui-card-border,var(--spui-ui-stroke,var(--spui-semantic-card-border,var(--colorNeutralStroke2,#edebe9))));border-radius:var(--spui-card-radius,8px);background:var(--spui-card-background,var(--spui-ui-surface,var(--spui-semantic-card-background,var(--colorNeutralBackground1,#fff))));box-shadow:var(--spui-card-shadow,0 1px 3px #0001)}.content{min-width:0;padding:var(--spui-card-padding,16px)}:host([selectable]){cursor:pointer}:host([selectable]) .content{padding-inline-start:44px}:host([selected]){border-color:var(--spui-selection-border,var(--spui-semantic-focus-border,var(--colorCompoundBrandStroke,#0f6cbd)));background:var(--spui-selection-background,color-mix(in srgb,var(--spui-base-accent,var(--spui-ui-accent,#0f6cbd)) 7%,var(--spui-card-background,var(--spui-ui-surface,#fff)) 93%))}.selection{position:absolute;inset-block-start:12px;inset-inline-start:12px;width:18px;height:18px;margin:0;accent-color:var(--spui-base-accent,var(--spui-ui-accent,#0f6cbd));cursor:pointer}:host(:focus-within){outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,var(--colorStrokeFocus2,#005a9e)));outline-offset:2px}:host([disabled]),:host([disabled]) .selection{cursor:default}:host([appearance=filled-alternative]){background:color-mix(in srgb,var(--spui-base-surface,var(--spui-ui-surface,#fff)) 90%,var(--spui-base-text,var(--spui-ui-text,#242424)) 10%)}:host([appearance=outline]){background:transparent;box-shadow:none}:host([appearance=subtle]){border-color:transparent;background:var(--spui-ui-canvas,var(--spui-semantic-body-background,#f5f5f5));box-shadow:none}:host([size=small]){--spui-card-padding:12px;--spui-control-gap:8px}:host([size=large]){--spui-card-padding:20px;--spui-control-gap:12px}:host([orientation=horizontal]) .content>slot{display:flex;flex-wrap:wrap;align-items:center;gap:var(--spui-control-gap,8px)}:host([data-spui-appearance=glass]),:host-context([data-spui-appearance=glass]){backdrop-filter:var(--spui-card-backdrop,none)}:host([selected]){border-color:var(--spui-selection-border,var(--spui-semantic-focus-border,var(--colorCompoundBrandStroke,#0f6cbd)));background:var(--spui-selection-background,color-mix(in srgb,var(--spui-base-accent,var(--spui-ui-accent,#0f6cbd)) 7%,var(--spui-card-background,var(--spui-ui-surface,#fff)) 93%))}@media(forced-colors:active){:host{border-color:CanvasText;box-shadow:none}:host([appearance=subtle]),:host([appearance=outline]){background:Canvas}:host([selected]){outline:2px solid Highlight}.selection{accent-color:Highlight}}`;
        style.textContent += ":host([has-floating-action]) .content{padding-block-start:48px}.floating-action{position:absolute;z-index:1;inset-block-start:8px;inset-inline-end:8px;display:flex;align-items:center;justify-content:center}.floating-action:empty{display:none}";
        const content = document.createElement("div"); content.className = "content"; content.part.add("content"); content.append(document.createElement("slot"));
        const floatingAction = document.createElement("div"); floatingAction.className = "floating-action"; const floatingSlot = document.createElement("slot"); floatingSlot.name = "floating-action"; floatingSlot.addEventListener("slotchange", () => this.toggleAttribute("has-floating-action", floatingSlot.assignedNodes({ flatten: true }).length > 0)); floatingAction.append(floatingSlot);
        const checkbox = document.createElement("input"); checkbox.className = "selection"; checkbox.type = "checkbox"; checkbox.part.add("selection"); checkbox.addEventListener("change", event => this.setSelected(checkbox.checked, event));
        const checkboxSlot = document.createElement("slot"); checkboxSlot.name = "checkbox"; checkboxSlot.append(checkbox); checkboxSlot.addEventListener("slotchange", () => this.syncSelection());
        shadow.append(style, checkboxSlot, floatingAction, content);
        this.addEventListener("change", event => {
          const input = event.target;
          if (input instanceof HTMLInputElement && input.slot === "checkbox") this.setSelected(input.checked, event);
        });
        this.addEventListener("click", event => {
          if (!this.isSelectable() || this.hasAttribute("disabled") || event.composedPath().some(target => target instanceof Element && target !== this && target.matches("a,button,input,select,textarea,[contenteditable=true],[role=button],[role=link],[role=checkbox]"))) return;
          this.setSelected(!this.selected, event);
        });
        this.addEventListener("keydown", event => this.handleCardKeydown(event));
        this.addEventListener("focusout", () => setTimeout(() => {
          const active = deepestActiveElement(this.ownerDocument);
          if (active !== this && !this.contains(active)) this.focusGroupActive = false;
        }, 0));
      }
      this.syncSelection();
      this.syncFocusMode();
    }

    attributeChangedCallback(name: string) {
      if (name === "aria-label" && this.hasAttribute("aria-label") && !this.hasAttribute("role")) this.setAttribute("role", "region");
      if (this.shadowRoot) { this.syncSelection(); this.syncFocusMode(); }
    }

    private isSelectable(): boolean { return this.hasAttribute("selectable") || this.hasAttribute("selected") || Boolean(this.defaultSelectedValue); }
    private syncSelection(): void {
      const checkbox = this.selectionInput();
      if (!checkbox) return;
      const selectable = this.isSelectable();
      if (!checkbox.hasAttribute("type")) checkbox.type = "checkbox";
      checkbox.hidden = !selectable;
      checkbox.disabled = this.hasAttribute("disabled");
      checkbox.checked = this.selected;
      checkbox.setAttribute("aria-label", this.getAttribute("selection-label") || `Select ${this.getAttribute("aria-label") || "card"}`);
    }

    private syncFocusMode(): void {
      const enabled = this.focusMode !== "off" && !this.isSelectable() && !this.hasAttribute("disabled");
      if (enabled && !this.hasAttribute("tabindex")) { this.tabIndex = 0; this.managedTabIndex = true; }
      else if (!enabled && this.managedTabIndex) { this.removeAttribute("tabindex"); this.managedTabIndex = false; }
      if (enabled && !this.hasAttribute("role")) { this.setAttribute("role", "group"); this.managedRole = true; }
      else if (!enabled && this.managedRole) { this.removeAttribute("role"); this.managedRole = false; }
      if (!enabled) this.focusGroupActive = false;
    }

    private handleFocusKeydown(event: KeyboardEvent): void {
      const mode = this.focusMode;
      if (mode === "off" || this.hasAttribute("disabled") || this.isSelectable()) return;
      const focusables = findCardFocusables(this);
      const focused = event.composedPath().find(target => target instanceof HTMLElement && focusables.includes(target)) ?? deepestActiveElement(this.ownerDocument);
      if ((mode === "no-tab" || mode === "tab-exit") && event.key === "Enter" && focused === this && focusables.length) {
        event.preventDefault();
        this.focusGroupActive = true;
        focusables[0].focus();
        return;
      }
      if (!this.focusGroupActive) return;
      if (event.key === "Escape") {
        event.preventDefault();
        this.focusGroupActive = false;
        this.focus();
        return;
      }
      if (event.key !== "Tab" || !focusables.length) return;
      const index = focusables.indexOf(focused as HTMLElement);
      if (mode === "no-tab") {
        if (event.shiftKey && index <= 0) { event.preventDefault(); focusables.at(-1)?.focus(); }
        else if (!event.shiftKey && index === focusables.length - 1) { event.preventDefault(); focusables[0].focus(); }
      } else if (mode === "tab-exit" && ((event.shiftKey && index === 0) || (!event.shiftKey && index === focusables.length - 1))) {
        this.focusGroupActive = false;
      }
    }

    private handleCardKeydown(event: KeyboardEvent): void {
      if (event.key === "Enter" && !this.hasAttribute("disabled") && this.isSelectable()) {
        const target = event.composedPath()[0];
        if (target === this || target === this.selectionInput()) {
          event.preventDefault();
          this.setSelected(!this.selected, event);
          return;
        }
      }
      this.handleFocusKeydown(event);
    }

    private setSelected(selected: boolean, sourceEvent: Event): void {
      if (this.hasAttribute("disabled") || !this.isSelectable() || this.selected === selected) { this.syncSelection(); return; }
      this.toggleAttribute("selected", selected);
      this.dispatchEvent(new CustomEvent("spui-selection-change", { bubbles: true, composed: true, detail: { selected, event: sourceEvent } }));
    }
  }
  customElements.define("spui-card", SpuiCard);
}
