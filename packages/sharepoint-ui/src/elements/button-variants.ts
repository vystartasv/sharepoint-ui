import { buttonControlCss } from "./button.js";
import { base, stopHostAccessibleNameSync, syncHostAccessibleName } from "./shared.js";
export type { ButtonAppearance, ButtonShape, ButtonSize } from "./button.js";

const forward = ["aria-label", "aria-labelledby", "aria-describedby", "aria-description", "title"];

export function defineCompoundButton(): void {
  if (customElements.get("spui-compound-button")) return;
  class SpuiCompoundButton extends HTMLElement {
    static observedAttributes = ["appearance", "size", "shape", "disabled", "disabled-focusable", "icon-position", ...forward];
    private observer?: MutationObserver;
    connectedCallback(): void {
      if (!this.shadowRoot) this.render(); else this.sync();
      this.observer?.disconnect();
      this.observer = new MutationObserver(() => this.sync());
      this.observer.observe(this, { childList: true, subtree: true, characterData: true });
    }
    disconnectedCallback(): void { this.observer?.disconnect(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const button = document.createElement("button"); button.type = "button"; button.part.add("control");
      const icon = document.createElement("span"); icon.className = "icon"; icon.hidden = true; icon.setAttribute("aria-hidden", "true"); const iconSlot = document.createElement("slot"); iconSlot.name = "icon"; icon.append(iconSlot);
      const content = document.createElement("span"); content.className = "content";
      const title = document.createElement("span"); title.className = "title"; const titleSlot = document.createElement("slot"); titleSlot.addEventListener("slotchange", () => this.sync()); title.append(titleSlot);
      const description = document.createElement("span"); description.className = "description"; description.id = "description"; description.hidden = true; const descriptionSlot = document.createElement("slot"); descriptionSlot.name = "secondary-content"; descriptionSlot.addEventListener("slotchange", () => this.sync()); description.append(descriptionSlot);
      const contentSlot = document.createElement("slot"); contentSlot.name = "content-container"; contentSlot.addEventListener("slotchange", () => this.sync()); contentSlot.append(content);
      iconSlot.addEventListener("slotchange", () => this.sync());
      content.append(title, description); button.append(icon, contentSlot);
      const style = document.createElement("style"); style.textContent = `${buttonControlCss}:host{display:inline-block;max-width:100%;vertical-align:middle}button{justify-content:flex-start;min-height:64px;padding:10px 14px;text-align:start}.icon:empty{display:none}.content,::slotted([slot=content-container]){display:grid;flex:1;min-width:0;gap:3px}.title{font-weight:600}.description{color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#605e5c));font-size:12px;line-height:1.35}:host([size=small]) button{min-height:52px}:host([size=large]) button{min-height:76px}:host([disabled-focusable]) button:disabled{opacity:1}.description:empty{display:none}@media(forced-colors:active){.description{color:CanvasText}}`;
      button.addEventListener("click", event => { if (this.hasAttribute("disabled") && this.hasAttribute("disabled-focusable")) { event.preventDefault(); event.stopImmediatePropagation(); event.stopPropagation(); } });
      shadow.append(style, button); this.sync();
    }
    private sync(): void {
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button"); if (!button) return;
      const appearance = this.getAttribute("appearance") ?? "secondary";
      button.className = appearance === "primary" ? "primary" : appearance === "outline" || appearance === "subtle" || appearance === "transparent" ? appearance : "secondary";
      const disabled = this.hasAttribute("disabled"); const disabledFocusable = disabled && this.hasAttribute("disabled-focusable");
      button.disabled = disabled && !disabledFocusable;
      disabledFocusable ? button.setAttribute("aria-disabled", "true") : button.removeAttribute("aria-disabled");
      for (const name of forward) { const value = this.getAttribute(name); value === null ? button.removeAttribute(name) : button.setAttribute(name, value); }
      const titleSlot = this.shadowRoot?.querySelector<HTMLSlotElement>(".title slot");
      const customContent = this.querySelector<HTMLElement>(":scope > [slot=content-container]");
      const markedTitle = customContent?.querySelector<HTMLElement>("[data-content-title]");
      const titleText = titleSlot?.assignedNodes({ flatten: true }).map(node => node.textContent ?? "").join("").trim() || markedTitle?.textContent?.trim() || customContent?.textContent?.trim() || "";
      if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby") && titleText) button.setAttribute("aria-label", titleText);
      const descriptionSlot = this.shadowRoot?.querySelector<HTMLSlotElement>(".description slot");
      const customDescription = customContent?.querySelector<HTMLElement>("[data-content-description], #description");
      const hasDescription = customDescription ? Boolean(customDescription.textContent?.trim()) : Boolean(descriptionSlot?.assignedNodes({ flatten: true }).some(node => (node.textContent ?? "").trim() || node instanceof Element));
      const description = this.shadowRoot?.querySelector<HTMLElement>(".description"); if (description) description.hidden = !hasDescription || Boolean(customContent);
      const ariaDescription = [this.getAttribute("aria-description"), customContent ? customDescription?.textContent?.trim() : ""].filter(Boolean).join(" ");
      if (ariaDescription) button.setAttribute("aria-description", ariaDescription); else button.removeAttribute("aria-description");
      const describedBy = [this.getAttribute("aria-describedby"), hasDescription && !customContent ? "description" : ""].filter(Boolean).join(" ");
      if (describedBy) button.setAttribute("aria-describedby", describedBy); else button.removeAttribute("aria-describedby");
      const iconSlot = this.shadowRoot?.querySelector<HTMLSlotElement>(".icon slot"); const icon = this.shadowRoot?.querySelector<HTMLElement>(".icon");
      if (icon) icon.hidden = !iconSlot?.assignedNodes({ flatten: true }).length;
    }
  }
  customElements.define("spui-compound-button", SpuiCompoundButton);
}

/** A button trigger for Menu. The containing spui-menu owns popup state and focus management. */
export function defineMenuButton(): void {
  if (customElements.get("spui-menu-button")) return;
  class SpuiMenuButton extends HTMLElement {
    static observedAttributes = ["appearance", "size", "shape", "disabled", "disabled-focusable", "type", "tabindex", "aria-label", "aria-labelledby", "aria-describedby", "aria-haspopup", "aria-controls", "aria-expanded", "title"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); else this.sync(); }
    disconnectedCallback(): void { stopHostAccessibleNameSync(this); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
      const button = document.createElement("button"); button.part.add("control");
      const icon = document.createElement("span"); icon.className = "icon"; icon.setAttribute("aria-hidden", "true"); const iconSlot = document.createElement("slot"); iconSlot.name = "icon"; icon.append(iconSlot);
      const content = document.createElement("span"); content.className = "content"; content.append(document.createElement("slot"));
      const menuIcon = document.createElement("span"); menuIcon.className = "menu-icon"; menuIcon.setAttribute("aria-hidden", "true"); const menuIconSlot = document.createElement("slot"); menuIconSlot.name = "menu-icon"; menuIcon.append(menuIconSlot);
      if (!this.querySelector('[slot="menu-icon"]')) { const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 16 16"); svg.setAttribute("width", "16"); svg.setAttribute("height", "16"); svg.setAttribute("focusable", "false"); const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", "m4 6 4 4 4-4"); path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor"); path.setAttribute("stroke-width", "1.5"); path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round"); svg.append(path); menuIconSlot.append(svg); }
      iconSlot.addEventListener("slotchange", this.syncSlots); menuIconSlot.addEventListener("slotchange", this.syncSlots);
      button.append(icon, content, menuIcon);
      const style = document.createElement("style"); style.textContent = `${buttonControlCss}:host{display:inline-block;vertical-align:middle;max-width:100%}.menu-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;line-height:0}.menu-icon:empty{display:none}:host([disabled-focusable]) button:disabled{opacity:1}@media(forced-colors:active){.menu-icon{color:ButtonText}}`;
      button.addEventListener("click", event => { if (this.hasAttribute("disabled") && this.hasAttribute("disabled-focusable")) { event.preventDefault(); event.stopImmediatePropagation(); event.stopPropagation(); } });
      shadow.append(style, button); this.sync(); this.syncSlots();
    }
    private syncSlots = (): void => {
      for (const [slotName, className] of [["icon", ".icon"], ["menu-icon", ".menu-icon"]]) {
        const slot = this.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name="${slotName}"]`); const host = this.shadowRoot?.querySelector<HTMLElement>(className);
        if (host && slot) host.hidden = slotName === "icon" ? !slot.assignedNodes({ flatten: true }).length : !slot.assignedNodes({ flatten: true }).length && !slot.childNodes.length;
      }
    };
    private sync(): void {
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button"); if (!button) return;
      const appearance = this.getAttribute("appearance") ?? "secondary";
      button.className = appearance === "primary" ? "primary" : appearance === "outline" || appearance === "subtle" || appearance === "transparent" ? appearance : "secondary";
      button.type = this.getAttribute("type") === "submit" || this.getAttribute("type") === "reset" ? this.getAttribute("type") as "submit" | "reset" : "button";
      const disabled = this.hasAttribute("disabled"); const disabledFocusable = disabled && this.hasAttribute("disabled-focusable");
      button.disabled = disabled && !disabledFocusable; disabledFocusable ? button.setAttribute("aria-disabled", "true") : button.removeAttribute("aria-disabled");
      if (this.hasAttribute("tabindex")) button.setAttribute("tabindex", this.getAttribute("tabindex")!); else button.removeAttribute("tabindex");
      for (const name of ["aria-label", "aria-describedby", "aria-haspopup", "aria-controls", "aria-expanded", "title"]) { const value = this.getAttribute(name); value === null ? button.removeAttribute(name) : button.setAttribute(name, value); }
      syncHostAccessibleName(this, button);
      if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) { const text = this.textContent?.trim(); if (text) button.setAttribute("aria-label", text); }
    }
  }
  customElements.define("spui-menu-button", SpuiMenuButton);
}

export function defineToggleButton(): void {
  if (customElements.get("spui-toggle-button")) return;
  class SpuiToggleButton extends HTMLElement {
    static observedAttributes = ["pressed", "checked", "default-pressed", "default-checked", "controlled", "is-accessible", "appearance", "size", "shape", "disabled", "disabled-focusable", "icon-position", "tabindex", "aria-label", "aria-describedby", "title"];
    get pressed(): boolean { return this.hasAttribute("checked") || this.hasAttribute("pressed"); }
    set pressed(value: boolean) { this.checked = value; }
    get checked(): boolean { return this.pressed; }
    set checked(value: boolean) { this.toggleAttribute("checked", Boolean(value)); this.toggleAttribute("pressed", Boolean(value)); }
    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      if (!this.hasAttribute("pressed") && !this.hasAttribute("checked")) this.checked = this.hasAttribute("default-checked") || this.hasAttribute("default-pressed");
      this.sync();
    }
    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
      if (name === "checked" && this.hasAttribute("pressed") !== (newValue !== null)) this.toggleAttribute("pressed", newValue !== null);
      if (name === "pressed" && this.hasAttribute("checked") !== (newValue !== null)) this.toggleAttribute("checked", newValue !== null);
      if (this.isConnected) this.sync();
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" }); const button = document.createElement("button"); button.type = "button"; button.part.add("control");
      const icon = document.createElement("span"); icon.className = "icon"; icon.hidden = true; icon.setAttribute("aria-hidden", "true"); const iconSlot = document.createElement("slot"); iconSlot.name = "icon"; iconSlot.addEventListener("slotchange", () => { icon.hidden = !iconSlot.assignedNodes({ flatten: true }).length; }); icon.append(iconSlot);
      const content = document.createElement("span"); content.className = "content"; content.append(document.createElement("slot")); button.append(icon, content);
      button.addEventListener("click", event => {
        if (this.hasAttribute("disabled")) { event.preventDefault(); event.stopImmediatePropagation(); event.stopPropagation(); return; }
        const checked = !this.checked;
        if (!this.hasAttribute("controlled")) this.checked = checked;
        this.dispatchEvent(new CustomEvent("spui-checked-change", { bubbles: true, composed: true, detail: { checked, sourceEvent: event, currentTarget: event.currentTarget } }));
        this.dispatchEvent(new CustomEvent("spui-pressed-change", { bubbles: true, composed: true, detail: { pressed: checked } }));
      });
      const style = document.createElement("style"); style.textContent = `${buttonControlCss}:host{display:inline-block;vertical-align:middle}:host([pressed]) button,:host([checked]) button{border-color:var(--spui-toggle-pressed-border,var(--spui-ui-accent,var(--colorBrandBackground,#0078d4)));background:var(--spui-toggle-pressed-background,color-mix(in srgb,var(--spui-ui-accent,var(--colorBrandBackground,#0078d4)) 12%,var(--spui-ui-surface,var(--colorNeutralBackground1,#fff))))}:host([pressed]) button:hover:not(:disabled),:host([checked]) button:hover:not(:disabled){background:var(--spui-toggle-pressed-hover,color-mix(in srgb,var(--spui-ui-accent,var(--colorBrandBackground,#0078d4)) 18%,var(--spui-ui-surface,var(--colorNeutralBackground1,#fff))))}:host([is-accessible][checked]) button,:host([is-accessible][pressed]) button{border-color:var(--spui-ui-accent,var(--colorBrandBackground,#0078d4));background:var(--spui-ui-accent,var(--colorBrandBackground,#0078d4));color:var(--spui-ui-accent-text,#fff)}:host([is-accessible][checked]) button:hover:not(:disabled),:host([is-accessible][pressed]) button:hover:not(:disabled){background:var(--spui-ui-accent-hover,var(--colorBrandBackgroundHover,#106ebe))}:host([disabled-focusable]) button:disabled{opacity:1}@media(forced-colors:active){:host([pressed]) button,:host([checked]) button{outline:1px solid Highlight}}`;
      shadow.append(style, button); this.sync();
    }
    private sync(): void {
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button"); if (!button) return;
      const appearance = this.getAttribute("appearance") ?? "secondary";
      button.className = appearance === "primary" ? "primary" : appearance === "outline" || appearance === "subtle" || appearance === "transparent" ? appearance : "secondary";
      const disabled = this.hasAttribute("disabled"); const disabledFocusable = disabled && this.hasAttribute("disabled-focusable");
      button.disabled = disabled && !disabledFocusable;
      if (disabledFocusable) button.setAttribute("aria-disabled", "true"); else button.removeAttribute("aria-disabled");
      if (this.hasAttribute("tabindex")) button.setAttribute("tabindex", this.getAttribute("tabindex")!); else button.removeAttribute("tabindex");
      button.setAttribute("aria-pressed", String(this.checked));
      for (const name of ["aria-label", "aria-describedby", "title"]) { const value = this.getAttribute(name); value === null ? button.removeAttribute(name) : button.setAttribute(name, value); }
    }
  }
  customElements.define("spui-toggle-button", SpuiToggleButton);
}

export function defineSplitButton(): void {
  if (customElements.get("spui-split-button")) return;
  class SpuiSplitButton extends HTMLElement {
    static observedAttributes = ["aria-label"];
    private primarySegment?: HTMLElement;
    private triggerSegment?: HTMLElement;
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
        style.textContent = `${base}:host{display:inline-flex;align-items:center;gap:0;max-width:100%;vertical-align:middle}::slotted([slot=primary]){position:relative;z-index:1;margin-inline-end:-1px}::slotted([slot=menu]){display:contents}@media(forced-colors:active){:host{outline-color:Highlight}}`;
        const primary = document.createElement("slot"); primary.name = "primary"; const menu = document.createElement("slot"); menu.name = "menu"; shadow.append(style, primary, menu);
        primary.addEventListener("slotchange", this.syncSegments); menu.addEventListener("slotchange", this.syncSegments);
      }
      this.syncSegments();
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Actions");
    }
    disconnectedCallback(): void { this.primarySegment?.removeAttribute("data-spui-split-primary"); this.triggerSegment?.removeAttribute("data-spui-split-trigger"); }
    private syncSegments = (): void => {
      const slots = this.shadowRoot?.querySelectorAll<HTMLSlotElement>("slot"); if (!slots) return;
      const primary = slots[0]?.assignedElements().find(element => element instanceof HTMLElement) as HTMLElement | undefined;
      const menu = slots[1]?.assignedElements().find(element => element instanceof HTMLElement) as HTMLElement | undefined;
      const trigger = menu?.querySelector<HTMLElement>("[slot=trigger]") ?? undefined;
      if (this.primarySegment !== primary) this.primarySegment?.removeAttribute("data-spui-split-primary");
      if (this.triggerSegment !== trigger) this.triggerSegment?.removeAttribute("data-spui-split-trigger");
      this.primarySegment = primary; this.triggerSegment = trigger;
      this.primarySegment?.setAttribute("data-spui-split-primary", ""); this.triggerSegment?.setAttribute("data-spui-split-trigger", "");
    };
  }
  customElements.define("spui-split-button", SpuiSplitButton);
}

