import { base } from "./shared.js";

export type AccordionItemValue = string | number;
export type AccordionNavigation = "linear" | "circular";
export type AccordionToggleData<TValue extends AccordionItemValue = AccordionItemValue> = { value: TValue; openItems: TValue[] };

const normalizeItems = (value: unknown): string[] => (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]).map(String);
const directItems = (accordion: HTMLElement): HTMLElement[] => [...accordion.children].filter((child): child is HTMLElement => child instanceof HTMLElement && child.localName === "spui-accordion-item");

export function defineAccordionHeader(): void {
  if (customElements.get("spui-accordion-header")) return;
  class SpuiAccordionHeader extends HTMLElement {
    static observedAttributes = ["expand-icon-position", "inline", "size"];
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = base + ':host{display:contents}.header{display:flex;align-items:center;gap:8px}.content{min-width:0}.icon,.expand{display:inline-flex;align-items:center;justify-content:center;flex:none}.icon[hidden],.expand[hidden]{display:none}:host([expand-icon-position=start]) .expand{order:-1}:host([open]) .expand{transform:rotate(90deg)}:host(:dir(rtl)) .expand{transform:rotate(180deg)}:host([open]:dir(rtl)) .expand{transform:rotate(90deg)}@media(prefers-reduced-motion:reduce){.expand{transition:none}}';
      const header = document.createElement("div"); header.className = "header";
      const icon = document.createElement("span"); icon.className = "icon"; icon.setAttribute("aria-hidden", "true");
      const iconSlot = document.createElement("slot"); iconSlot.name = "icon"; icon.append(iconSlot);
      const content = document.createElement("span"); content.className = "content"; const defaultSlot = document.createElement("slot"); content.append(defaultSlot);
      const expand = document.createElement("span"); expand.className = "expand"; expand.setAttribute("aria-hidden", "true");
      const expandSlot = document.createElement("slot"); expandSlot.name = "expand-icon"; expand.append(expandSlot);
      header.append(icon, content, expand); shadow.append(style, header);
      const syncExpand = (): void => {
        const hasExpand = expandSlot.assignedNodes({ flatten: true }).length > 0;
        this.toggleAttribute("has-expand-icon", hasExpand);
        this.dispatchEvent(new CustomEvent("spui-header-slots-change", { bubbles: true, composed: true }));
      };
      expandSlot.addEventListener("slotchange", syncExpand); syncExpand();
    }
  }
  customElements.define("spui-accordion-header", SpuiAccordionHeader);
}

export function defineAccordionPanel(): void {
  if (customElements.get("spui-accordion-panel")) return;
  class SpuiAccordionPanel extends HTMLElement {
    connectedCallback(): void { if (!this.shadowRoot) { const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0}`; shadow.append(style, document.createElement("slot")); } }
  }
  customElements.define("spui-accordion-panel", SpuiAccordionPanel);
}

export function defineAccordion(): void {
  if (customElements.get("spui-accordion")) return;
  defineAccordionHeader(); defineAccordionPanel();
  if (!customElements.get("spui-accordion-item")) {
    class SpuiAccordionItem extends HTMLElement {
      static observedAttributes = ["heading", "value", "open", "disabled", "disabled-focusable"];
      private panelId = `spui-accordion-panel-${crypto.randomUUID()}`;
      private triggerId = `spui-accordion-trigger-${crypto.randomUUID()}`;
      private wasOpen = false;
      private panelExitPending = false;
      private panelExitGeneration = 0;
      private buttonSlotAttributes = new Set<string>();
      connectedCallback(): void { if (!this.hasAttribute("value")) this.setAttribute("value", this.id || crypto.randomUUID()); if (!this.shadowRoot) this.render(); this.sync(); }
      attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
      get open(): boolean { return this.hasAttribute("open"); }
      set open(value: boolean) { this.toggleAttribute("open", Boolean(value)); }
      private sync(): void {
        const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button");
        const panel = this.shadowRoot?.querySelector<HTMLElement>(".panel");
        if (!button || !panel) return;
        const isOpen = this.open;
        button.setAttribute("aria-expanded", String(isOpen));
        button.disabled = this.hasAttribute("disabled");
        if (button.disabled || this.hasAttribute("disabled-focusable")) button.setAttribute("aria-disabled", "true");
        else button.removeAttribute("aria-disabled");
        const motionPanel = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=panel]")?.assignedElements({ flatten: true }).some(element => element.localName === "spui-accordion-panel" && element.hasAttribute("motion")) ?? false;
        if (isOpen) {
          this.panelExitGeneration++;
          this.panelExitPending = false;
          panel.hidden = false;
          panel.inert = false;
          panel.removeAttribute("aria-hidden");
        } else if (motionPanel && this.wasOpen) {
          this.panelExitPending = true;
          panel.hidden = false;
          panel.inert = true;
          panel.setAttribute("aria-hidden", "true");
          this.finishPanelExit(panel);
        } else if (!this.panelExitPending) {
          panel.hidden = true;
          panel.inert = false;
          panel.removeAttribute("aria-hidden");
        }
        this.wasOpen = isOpen;
        const heading = button.querySelector<HTMLSlotElement>("slot[name=heading]");
        const header = heading?.assignedElements({ flatten: true }).find(element => element.localName === "spui-accordion-header") as HTMLElement | undefined;
        const icon = button.querySelector<HTMLElement>(".icon");
        const buttonSlot = (header as (HTMLElement & { button?: Record<string, unknown> }) | undefined)?.button;
        button.className = "trigger";
        button.style.cssText = "";
        for (const attribute of this.buttonSlotAttributes) button.removeAttribute(attribute);
        this.buttonSlotAttributes.clear();
        if (buttonSlot) {
          if (typeof buttonSlot.className === "string") button.classList.add(...buttonSlot.className.split(/\s+/).filter(Boolean));
          if (buttonSlot.style && typeof buttonSlot.style === "object") Object.assign(button.style, buttonSlot.style);
          for (const [name, value] of Object.entries(buttonSlot)) {
            if (name === "className" || name === "style" || name === "children" || name === "disabled" || name === "type" || name === "tabIndex" || name === "onClick" || value == null || typeof value === "function") continue;
            const attribute = name.startsWith("aria-") || name.startsWith("data-") ? name : ({ title: "title", name: "name", value: "value", form: "form", accessKey: "accesskey", id: "id" } as Record<string, string>)[name];
            if (attribute) { button.setAttribute(attribute, String(value)); this.buttonSlotAttributes.add(attribute); }
          }
        }
        if (icon && heading) {
          const iconAtStart = header?.getAttribute("expand-icon-position") === "start";
          button.insertBefore(icon, iconAtStart ? heading : null);
          icon.hidden = header?.hasAttribute("has-expand-icon") ?? false;
        }
        header?.toggleAttribute("open", isOpen);
        const fallback = heading?.firstChild;
        if (fallback?.nodeType === Node.TEXT_NODE) fallback.textContent = this.getAttribute("heading") || "Section";
      }
      private finishPanelExit(panel: HTMLElement): void {
        if (!this.panelExitPending) return;
        const generation = ++this.panelExitGeneration;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const animations = new Set<Animation>();
          const visit = (element: Element): void => {
            for (const animation of element.getAnimations()) if (animation.playState === "running") animations.add(animation);
            if (element.shadowRoot) for (const child of element.shadowRoot.children) visit(child);
            if (element instanceof HTMLSlotElement) for (const child of element.assignedElements({ flatten: true })) visit(child);
            for (const child of element.children) visit(child);
          };
          for (const assigned of this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=panel]")?.assignedElements({ flatten: true }) ?? []) visit(assigned);
          const finish = (): void => {
            if (generation !== this.panelExitGeneration || this.open || !this.panelExitPending) return;
            this.panelExitPending = false;
            panel.hidden = true;
          };
          if (animations.size) void Promise.allSettled([...animations].map(animation => animation.finished)).then(finish);
          else finish();
        }));
      }
      private render(): void {
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `${base}:host{display:block;border-block-end:1px solid var(--spui-accordion-divider,var(--spui-ui-stroke,#d1d1d1))}.trigger{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:44px;padding:var(--spui-accordion-padding,12px 16px);border:0;background:transparent;color:var(--spui-ui-text,#242424);font:inherit;font-weight:600;text-align:start;cursor:pointer}.trigger:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#78716c));outline-offset:-2px}.trigger:disabled{color:var(--spui-ui-muted,#616161);cursor:not-allowed}.icon{display:grid;place-items:center;flex:0 0 24px;width:24px;height:24px;transition:transform var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}.icon:before{content:"";width:7px;height:7px;border-block-start:2px solid currentColor;border-inline-end:2px solid currentColor;transform:rotate(45deg)}.trigger[aria-expanded=true] .icon{transform:rotate(90deg)}:host(:dir(rtl)) .icon{transform:rotate(180deg)}:host(:dir(rtl)) .trigger[aria-expanded=true] .icon{transform:rotate(90deg)}.panel{padding:0 var(--spui-accordion-padding-inline,16px) 16px;color:var(--spui-ui-text,#242424)}.panel[hidden]{display:none}@media(prefers-reduced-motion:reduce){.icon{transition:none}}@media(forced-colors:active){.trigger:focus-visible{outline-color:Highlight}}`;
        const button = document.createElement("button"); button.type = "button"; button.id = this.triggerId; button.className = "trigger"; button.part.add("trigger"); button.setAttribute("aria-controls", this.panelId);
        const heading = document.createElement("slot"); heading.name = "heading"; heading.append(document.createTextNode(this.getAttribute("heading") || "Section"));
        const icon = document.createElement("span"); icon.className = "icon"; icon.part.add("icon"); icon.setAttribute("aria-hidden", "true");
        button.append(heading, icon);
        const panel = document.createElement("div"); panel.className = "panel"; panel.part.add("panel"); panel.id = this.panelId; panel.setAttribute("role", "region"); panel.setAttribute("aria-labelledby", this.triggerId);
        const panelSlot = document.createElement("slot"); panelSlot.name = "panel"; panelSlot.append(document.createElement("slot")); panel.append(panelSlot);
        button.addEventListener("click", event => {
          const header = button.querySelector<HTMLSlotElement>("slot[name=heading]")?.assignedElements({ flatten: true }).find(element => element.localName === "spui-accordion-header") as (HTMLElement & { button?: { onClickCapture?: (event: MouseEvent) => void } }) | undefined;
          header?.button?.onClickCapture?.(event);
        }, true);
        button.addEventListener("click", event => {
          const heading = button.querySelector<HTMLSlotElement>("slot[name=heading]");
          const header = heading?.assignedElements({ flatten: true }).find(element => element.localName === "spui-accordion-header") as (HTMLElement & { button?: { onClick?: (event: MouseEvent) => void } }) | undefined;
          header?.button?.onClick?.(event);
          if (event.defaultPrevented) return;
          this.open = !this.open;
          this.dispatchEvent(new CustomEvent("spui-item-toggle", { bubbles: true, composed: true, detail: { value: this.getAttribute("value") ?? "", open: this.open, sourceEvent: event } }));
        });
        heading.addEventListener("slotchange", () => this.sync());
        button.addEventListener("spui-header-slots-change", () => this.sync());
        shadow.append(style, button, panel);
      }
    }
    customElements.define("spui-accordion-item", SpuiAccordionItem);
  }
  class SpuiAccordion extends HTMLElement {
    static observedAttributes = ["mode", "multiple", "collapsible", "navigation"];
    private controlledItems?: string[];
    private uncontrolledItems: string[] = [];
    private hasInitialState = false;
    private hasDefaultItems = false;
    private syncing = false;
    private events?: AbortController;
    get openItems(): string[] | undefined { return this.controlledItems; }
    set openItems(value: readonly AccordionItemValue[] | AccordionItemValue | undefined) { this.controlledItems = value === undefined ? undefined : normalizeItems(value); this.syncItems(); }
    set defaultOpenItems(value: readonly AccordionItemValue[] | AccordionItemValue | undefined) { if (!this.controlledItems && !this.hasDefaultItems && value !== undefined) { this.uncontrolledItems = normalizeItems(value); this.hasInitialState = true; this.hasDefaultItems = true; this.syncItems(); } }
    get defaultOpenItems(): string[] { return this.uncontrolledItems; }
    private get multiple(): boolean { return this.hasAttribute("mode") ? this.getAttribute("mode") !== "single" : this.hasAttribute("multiple"); }
    private get collapsible(): boolean { return this.hasAttribute("collapsible"); }
    connectedCallback(): void {
      this.events?.abort(); this.events = new AbortController();
      this.addEventListener("spui-item-toggle", this.onToggle as EventListener, { signal: this.events.signal });
      this.addEventListener("keydown", this.onKeyDown, { signal: this.events.signal });
      if (!this.hasInitialState && !this.controlledItems) { this.uncontrolledItems = directItems(this).filter(item => item.hasAttribute("open")).map(item => item.getAttribute("value") ?? ""); this.hasInitialState = true; }
      this.sync();
    }
    disconnectedCallback(): void { this.events?.abort(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private get selectedItems(): string[] { return this.controlledItems ?? this.uncontrolledItems; }
    private syncItems(): void {
      if (!this.isConnected) return;
      const values = this.multiple ? this.selectedItems : this.selectedItems.slice(0, 1);
      this.syncing = true;
      const disabledFocusableValue = !this.multiple && !this.collapsible && values.length === 1 ? values[0] : undefined;
      for (const item of directItems(this)) {
        const value = item.getAttribute("value") ?? "";
        item.toggleAttribute("open", values.includes(value));
        item.toggleAttribute("disabled-focusable", value === disabledFocusableValue && item.hasAttribute("open"));
      }
      this.syncing = false;
      this.updateTabStops();
    }
    private sync(): void {
      this.dataset.mode = this.multiple ? "multiple" : "single";
      this.syncItems();
    }
    private onToggle = (event: CustomEvent<{ value: string; open: boolean; sourceEvent: Event }>): void => {
      if ((event.target as HTMLElement).closest("spui-accordion") !== this || this.syncing) return;
      const { value, open, sourceEvent } = event.detail;
      const clickedItem = event.target as HTMLElement;
      const current = this.controlledItems ?? directItems(this).filter(item => item.hasAttribute("open") && !(item === clickedItem && open) || item === clickedItem && !open).map(item => item.getAttribute("value") ?? "");
      let next = open ? (this.multiple ? [...current.filter(item => item !== value), value] : [value]) : current.filter(item => item !== value);
      if (!this.multiple && !this.collapsible && current.includes(value) && next.length === 0) {
        (event.target as HTMLElement).setAttribute("open", "");
        return;
      }
      if (this.controlledItems) this.syncItems();
      else { this.uncontrolledItems = next; this.syncItems(); }
      const detail = { value, openItems: next };
      this.dispatchEvent(new CustomEvent("spui-toggle", { bubbles: true, composed: true, detail: { ...detail, sourceEvent } }));
    };
    private enabledTriggers(): HTMLButtonElement[] { return directItems(this).filter(item => !item.hasAttribute("disabled")).map(item => item.shadowRoot?.querySelector<HTMLButtonElement>("button")).filter((button): button is HTMLButtonElement => Boolean(button)); }
    private updateTabStops(): void {
      const triggers = this.enabledTriggers();
      if (!triggers.length) return;
      if (!this.hasAttribute("navigation")) { triggers.forEach(button => { button.tabIndex = 0; }); return; }
      const active = triggers.includes(this.ownerDocument.activeElement as HTMLButtonElement) ? this.ownerDocument.activeElement : triggers.find(button => button.tabIndex === 0) ?? triggers[0];
      triggers.forEach(button => { button.tabIndex = button === active ? 0 : -1; });
    }
    private onKeyDown = (event: KeyboardEvent): void => {
      const navigation = this.getAttribute("navigation");
      if (navigation !== "linear" && navigation !== "circular") return;
      const triggers = this.enabledTriggers();
      const target = event.composedPath().find(node => node instanceof HTMLButtonElement && triggers.includes(node)) as HTMLButtonElement | undefined;
      if (!target) return;
      const index = triggers.indexOf(target);
      let next: HTMLButtonElement | undefined;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = triggers[index + 1] ?? (navigation === "circular" ? triggers[0] : undefined);
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = triggers[index - 1] ?? (navigation === "circular" ? triggers.at(-1) : undefined);
      else if (event.key === "Home") next = triggers[0];
      else if (event.key === "End") next = triggers.at(-1);
      if (!next) return;
      event.preventDefault();
      triggers.forEach(button => { button.tabIndex = button === next ? 0 : -1; });
      next.focus();
    };
  }
  customElements.define("spui-accordion", SpuiAccordion);
}
