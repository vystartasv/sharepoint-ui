import { base } from "./shared.js";

export type TagAppearance = "filled" | "outline" | "brand";
export type TagShape = "rounded" | "circular";
export type TagSize = "extra-small" | "small" | "medium";

export type InteractionTagSelectData = { value: string; selected: boolean };
export type TagGroupSelectData = { event: Event; type: "click"; value: string; selectedValues: string[] };
export interface SharePointTagGroupElement extends HTMLElement { selectedValues: string[] }

export function defineTag(): void {
  if (customElements.get("spui-tag")) return;
  class SpuiTag extends HTMLElement {
    static observedAttributes = ["dismissible", "dismiss-label", "label", "disabled", "selected"];

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.updateDismissButton();
    }

    attributeChangedCallback(): void { if (this.isConnected) this.updateDismissButton(); }

    private updateDismissButton(): void {
      const root = this.shadowRoot;
      if (!root) return;
      let button = root.querySelector<HTMLButtonElement>("button");
      if (!this.hasAttribute("dismissible")) { button?.remove(); return; }
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "dismiss";
        button.addEventListener("click", event => this.dispatchEvent(new CustomEvent("spui-dismiss", { detail: { value: this.getAttribute("value") ?? "", label: this.getAttribute("label") ?? this.textContent?.trim() ?? "", originalEvent: event }, bubbles: true, composed: true })));
        const icon = document.createElement("slot");
        icon.name = "dismiss-icon";
        const fallback = document.createElement("span"); fallback.setAttribute("aria-hidden", "true"); fallback.textContent = "×"; icon.append(fallback);
        button.append(icon);
        root.append(button);
      }
      button.disabled = this.hasAttribute("disabled");
      const primary = root.querySelector<HTMLSlotElement>(".primary-text");
      const primaryText = primary?.assignedNodes({ flatten: true }).map(node => node.textContent ?? "").join("").trim();
      button.setAttribute("aria-label", `${this.getAttribute("dismiss-label") || "Remove"} ${this.getAttribute("label") || primaryText || this.textContent?.trim() || "tag"}`);
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{box-sizing:border-box;display:inline-flex;align-items:center;gap:6px;max-width:100%;border:1px solid var(--spui-tag-border,var(--spui-base-stroke,var(--spui-ui-stroke,var(--spui-semantic-control-border,#8a8886))));border-radius:var(--spui-control-radius,4px);background:var(--spui-tag-background,color-mix(in srgb,var(--spui-base-accent,var(--spui-ui-accent,#0078d4)) 30%,var(--spui-base-surface,var(--spui-ui-surface,#fff))));color:var(--spui-tag-color,var(--spui-ui-text,var(--spui-semantic-body-text,#323130)));font-size:var(--spui-tag-font-size,13px);font-weight:500;line-height:1.25;white-space:nowrap}:host([size=extra-small]){min-height:18px;padding-block:1px;padding-inline:6px;font-size:10px}:host([size=small]){min-height:22px;padding-block:2px;padding-inline:7px;font-size:11px}:host(:not([size]),[size=medium]){min-height:28px;padding-block:4px;padding-inline:9px}:host([size=large]){min-height:34px;padding-block:6px;padding-inline:12px;font-size:14px}:host([shape=circular]){border-radius:999px}:host([appearance=outline]){background:var(--spui-base-surface,var(--spui-ui-surface,#fff))}:host([appearance=brand]){border-color:color-mix(in srgb,var(--spui-ui-accent,var(--spui-semantic-accent,#0078d4)) 64%,var(--spui-base-surface,var(--spui-ui-surface,#fff)));background:color-mix(in srgb,var(--spui-ui-accent,var(--spui-semantic-accent,#0078d4)) 42%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}:host([selected]){border-color:var(--spui-ui-accent,var(--spui-semantic-accent,#0078d4));background:color-mix(in srgb,var(--spui-ui-accent,var(--spui-semantic-accent,#0078d4)) 16%,var(--spui-ui-surface,#fff))}:host([disabled]){opacity:.55}.media,.icon{display:inline-flex;align-items:center;justify-content:center;flex:none}.text{display:grid;gap:2px;min-width:0}.label{min-width:0;overflow:hidden;text-overflow:ellipsis}.secondary{overflow:hidden;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));font-size:.9em;text-overflow:ellipsis}.dismiss{display:inline-grid;place-items:center;flex:none;width:20px;height:20px;margin-inline-end:-5px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;font-size:17px;line-height:1;cursor:pointer}.dismiss:hover{background:color-mix(in srgb,currentColor 12%,transparent)}.dismiss:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:1px}.dismiss:disabled{cursor:not-allowed}.media[hidden],.icon[hidden],.secondary[hidden]{display:none}@media(forced-colors:active){:host{border-color:CanvasText}:host([selected]){outline:1px solid Highlight}.dismiss:focus-visible{outline-color:Highlight}}`;
      style.textContent += `:host([color=success]){--spui-tag-tone:var(--spui-ui-success,#107c10)}:host([color=warning]){--spui-tag-tone:var(--spui-ui-warning,#835b00)}:host([color=danger]){--spui-tag-tone:var(--spui-ui-danger,#b10e1c)}:host([color=informative]){--spui-tag-tone:var(--spui-ui-info,var(--spui-ui-accent,#0078d4))}:host([color=success]),:host([color=warning]),:host([color=danger]),:host([color=informative]){--spui-tag-foreground:color-mix(in srgb,var(--spui-tag-tone) 40%,var(--spui-ui-text,#242424) 60%);color:var(--spui-tag-foreground);border-color:var(--spui-tag-foreground)}:host([color=success]:not([appearance=outline]):not([selected])),:host([color=warning]:not([appearance=outline]):not([selected])),:host([color=danger]:not([appearance=outline]):not([selected])),:host([color=informative]:not([appearance=outline]):not([selected])){background:color-mix(in srgb,var(--spui-tag-tone) 12%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}:host([color=success][appearance=brand]:not([selected])),:host([color=warning][appearance=brand]:not([selected])),:host([color=danger][appearance=brand]:not([selected])),:host([color=informative][appearance=brand]:not([selected])){background:color-mix(in srgb,var(--spui-tag-tone) 24%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}`;
      style.textContent += `:host([selected][color=success]),:host([selected][color=warning]),:host([selected][color=danger]),:host([selected][color=informative]){color:var(--spui-selection-foreground,var(--spui-ui-text,#242424));border-color:var(--spui-selection-foreground,var(--spui-ui-text,#242424))}@media(forced-colors:active){:host([color=success]),:host([color=warning]),:host([color=danger]),:host([color=informative]){color:CanvasText;border-color:CanvasText;background:Canvas}:host([selected][color=success]),:host([selected][color=warning]),:host([selected][color=danger]),:host([selected][color=informative]){outline:1px solid Highlight}}`;
      const media = document.createElement("span"); media.className = "media"; media.hidden = true;
      const mediaSlot = document.createElement("slot"); mediaSlot.name = "media"; media.append(mediaSlot);
      const icon = document.createElement("span"); icon.className = "icon"; icon.hidden = true;
      const iconSlot = document.createElement("slot"); iconSlot.name = "icon"; icon.append(iconSlot);
      const text = document.createElement("span"); text.className = "text";
      const label = document.createElement("span"); label.className = "label"; label.part.add("label");
      const primarySlot = document.createElement("slot"); primarySlot.name = "primary-text";
      const defaultSlot = document.createElement("slot"); label.append(primarySlot); primarySlot.append(defaultSlot);
      const secondary = document.createElement("span"); secondary.className = "secondary"; secondary.hidden = true; secondary.part.add("secondary-text");
      const secondarySlot = document.createElement("slot"); secondarySlot.name = "secondary-text"; secondary.append(secondarySlot);
      text.append(label, secondary);
      for (const [slot, container] of [[mediaSlot, media], [iconSlot, icon], [secondarySlot, secondary]] as const) {
        slot.addEventListener("slotchange", () => { container.hidden = !slot.assignedNodes({ flatten: true }).length; this.updateDismissButton(); });
      }
      primarySlot.addEventListener("slotchange", () => this.updateDismissButton());
      defaultSlot.addEventListener("slotchange", () => this.updateDismissButton());
      shadow.append(style, media, icon, text);
    }
  }
  customElements.define("spui-tag", SpuiTag);
}

export function defineTagGroup(): void {
  if (customElements.get("spui-tag-group")) return;
  class SpuiTagGroup extends HTMLElement {
    static observedAttributes = ["orientation", "label", "selected-values", "default-selected-values", "disabled", "dismissible", "appearance", "size", "role"];
    private observer?: MutationObserver;
    private values: string[] = [];
    private controlled = false;
    private initialized = false;
    private syncing = false;
    private childBase = new WeakMap<HTMLElement, Record<string, string | null>>();
    private childApplied = new WeakMap<HTMLElement, Record<string, string | null>>();

    get selectedValues(): string[] { return [...this.values]; }
    set selectedValues(value: string[]) {
      this.controlled = true;
      this.values = Array.isArray(value) ? value.map(String) : [];
      this.initialized = true;
      this.sync();
    }

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      if (!this.hasAttribute("role")) this.setAttribute("role", "toolbar");
      if (!this.hasAttribute("aria-label") && this.hasAttribute("label")) this.setAttribute("aria-label", this.getAttribute("label")!);
      if (!this.initialized) {
        const defaults = this.readValues(this.getAttribute("default-selected-values"));
        this.values = this.readValues(this.getAttribute("selected-values") ?? JSON.stringify(defaults));
        this.controlled = this.hasAttribute("selected-values");
        this.initialized = true;
      }
      this.addEventListener("spui-tag-select", this.onTagSelect as EventListener);
      this.addEventListener("spui-dismiss", this.onTagDismiss as EventListener);
      this.addEventListener("keydown", this.onKeyDown);
      this.observer?.disconnect();
      this.observer = new MutationObserver(() => this.sync());
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "dismissible", "appearance", "size", "selected", "value"] });
      this.sync();
    }
    disconnectedCallback(): void {
      this.observer?.disconnect();
      this.removeEventListener("spui-tag-select", this.onTagSelect as EventListener);
      this.removeEventListener("spui-dismiss", this.onTagDismiss as EventListener);
      this.removeEventListener("keydown", this.onKeyDown);
    }
    attributeChangedCallback(name: string): void {
      if (!this.isConnected) return;
      if (name === "selected-values") {
        this.controlled = this.hasAttribute("selected-values");
        if (this.controlled) this.values = this.readValues(this.getAttribute("selected-values"));
      }
      this.sync();
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:flex;flex-wrap:wrap;align-items:center;gap:var(--spui-tag-group-gap,8px);min-width:0}:host([orientation=vertical]){flex-direction:column;align-items:stretch}:host(:focus-visible){outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}@media(forced-colors:active){:host(:focus-visible){outline-color:Highlight}}`;
      const slot = document.createElement("slot");
      shadow.append(style, slot);
    }

    private readValues(raw: string | null): string[] {
      if (!raw) return [];
      try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value.map(String) : []; } catch { return raw.split(",").map(value => value.trim()).filter(Boolean); }
    }

    private sync(): void {
      if (!this.isConnected || this.syncing) return;
      this.syncing = true;
      try {
        if (this.hasAttribute("label") && !this.hasAttribute("aria-label")) this.setAttribute("aria-label", this.getAttribute("label")!);
        this.setAttribute("aria-disabled", String(this.hasAttribute("disabled")));
        const children = [...this.querySelectorAll<HTMLElement>("spui-tag,spui-interaction-tag")].filter(child => child.closest("spui-tag-group") === this);
        const groupDefaults = ["disabled", "dismissible", "appearance", "size"] as const;
        for (const [index, child] of children.entries()) {
          if (!child.hasAttribute("value")) child.setAttribute("value", `spui-tag-group-${index + 1}`);
          let baseState = this.childBase.get(child);
          let applied = this.childApplied.get(child);
          if (!baseState) {
            baseState = Object.fromEntries([...groupDefaults, "selected"].map(name => [name, child.getAttribute(name)]));
            this.childBase.set(child, baseState);
            applied = {};
          } else {
            for (const name of [...groupDefaults, "selected"]) if (child.getAttribute(name) !== applied?.[name]) baseState[name] = child.getAttribute(name);
          }
          const next: Record<string, string | null> = {};
          for (const name of groupDefaults) {
            let value = baseState[name] ?? null;
            if (name === "disabled" && this.hasAttribute("disabled")) value = "";
            else if (name === "dismissible" && value === null && this.hasAttribute("dismissible")) value = "";
            else if (name === "appearance" && value === null) value = this.getAttribute("appearance");
            else if (name === "size" && value === null) value = this.getAttribute("size");
            next[name] = value;
          }
          const selected = (baseState.selected === "" || this.values.includes(child.getAttribute("value")!)) ? "" : null;
          next.selected = selected;
          for (const name of [...groupDefaults, "selected"]) {
            const value = next[name];
            if (value === null) { if (child.hasAttribute(name)) child.removeAttribute(name); }
            else if (child.getAttribute(name) !== value) child.setAttribute(name, value);
          }
          this.childApplied.set(child, next);
        }
      } finally { this.syncing = false; }
    }

    private onTagSelect = (event: CustomEvent<{ value?: string; originalEvent?: Event }>): void => {
      if (this.hasAttribute("disabled") || event.defaultPrevented) { event.preventDefault(); return; }
      const value = String(event.detail?.value ?? "");
      const next = this.values.includes(value) ? this.values.filter(item => item !== value) : [...this.values, value];
      if (!this.controlled) this.values = next;
      this.sync();
      this.dispatchEvent(new CustomEvent("spui-selection-change", { bubbles: true, composed: true, detail: { event: event.detail?.originalEvent ?? event, type: "click", value, selectedValues: next } }));
    };

    private onTagDismiss = (event: CustomEvent<{ value?: string; originalEvent?: Event }>): void => {
      if (this.hasAttribute("disabled")) { event.preventDefault(); return; }
      this.dispatchEvent(new CustomEvent("spui-tag-dismiss", { bubbles: true, composed: true, detail: { value: String(event.detail?.value ?? ""), sourceEvent: event.detail?.originalEvent ?? event } }));
    };

    private focusableItems(): HTMLElement[] {
      const result: HTMLElement[] = [];
      const visit = (root: ParentNode): void => {
        for (const node of root.querySelectorAll<HTMLElement>("button,a[href],[tabindex]")) {
          if (!node.hasAttribute("disabled") && node.tabIndex >= 0 && node.getClientRects().length) result.push(node);
        }
        for (const node of root.querySelectorAll<HTMLElement>("*")) {
          if (node.shadowRoot) visit(node.shadowRoot);
          if (node instanceof HTMLSlotElement) for (const assigned of node.assignedElements({ flatten: true })) visit(assigned);
        }
      };
      for (const child of this.querySelectorAll<HTMLElement>("spui-tag,spui-interaction-tag")) if (child.closest("spui-tag-group") === this) visit(child.shadowRoot ?? child);
      return [...new Set(result)];
    }

    private onKeyDown = (event: KeyboardEvent): void => {
      const items = this.focusableItems();
      if (!items.length) return;
      const active = event.composedPath().find((node): node is HTMLElement => node instanceof HTMLElement && items.includes(node));
      const from = active ? items.indexOf(active) : -1;
      let next = -1;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      else if (event.key === "ArrowDown" || event.key === (getComputedStyle(this).direction === "rtl" ? "ArrowLeft" : "ArrowRight")) next = (from + 1 + items.length) % items.length;
      else if (event.key === "ArrowUp" || event.key === (getComputedStyle(this).direction === "rtl" ? "ArrowRight" : "ArrowLeft")) next = (from - 1 + items.length) % items.length;
      if (next >= 0) { event.preventDefault(); items[next].focus(); }
    };
  }
  customElements.define("spui-tag-group", SpuiTagGroup);
}

export function defineInteractionTagPrimary(): void {
  if (customElements.get("spui-interaction-tag-primary")) return;
  class SpuiInteractionTagPrimary extends HTMLElement {
    static observedAttributes = ["disabled", "selected", "has-secondary-action", "size"];
    private button?: HTMLButtonElement;
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { this.sync(); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex;min-width:0}button{box-sizing:border-box;display:inline-flex;align-items:center;gap:6px;min-width:0;min-height:28px;padding:4px 10px;border:0;border-radius:inherit;background:transparent;color:inherit;font:inherit;text-align:start;cursor:pointer}button:hover{background:color-mix(in srgb,currentColor 8%,transparent)}button:focus-visible{position:relative;z-index:1;outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,var(--spui-semantic-focus-border,var(--colorStrokeFocus2,#0078d4))));outline-offset:1px}:host([disabled]) button{cursor:not-allowed}:host([has-secondary-action]) button{padding-inline-end:4px}:host([size=small]) button{min-height:22px;padding-block:2px}:host([size=extra-small]) button{min-height:18px;padding-block:1px;font-size:12px}.media:empty,.icon:empty,.secondary:empty{display:none}.media,.icon,.secondary{display:inline-flex;align-items:center;flex:none}.text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}button[aria-pressed=true]{font-weight:600}@media(forced-colors:active){button:focus-visible{outline-color:Highlight}}`;
      const button = document.createElement("button"); button.type = "button"; button.part.add("button");
      const media = document.createElement("span"); media.className = "media"; media.append(Object.assign(document.createElement("slot"), { name: "media" }));
      const icon = document.createElement("span"); icon.className = "icon"; icon.append(Object.assign(document.createElement("slot"), { name: "icon" }));
      const text = document.createElement("span"); text.className = "text";
      const primaryText = document.createElement("slot"); primaryText.name = "primary-text";
      primaryText.append(document.createElement("slot")); text.append(primaryText);
      const secondary = document.createElement("span"); secondary.className = "secondary"; secondary.append(Object.assign(document.createElement("slot"), { name: "secondary-text" }));
      button.append(media, icon, text, secondary);
      button.addEventListener("click", event => {
        const owner = this.closest("spui-interaction-tag");
        if (owner) owner.dispatchEvent(new CustomEvent("spui-tag-select", { bubbles: true, composed: true, cancelable: true, detail: { value: owner.getAttribute("value") ?? "", selected: owner.hasAttribute("selected"), originalEvent: event } }));
      });
      this.button = button; shadow.append(style, button);
    }
    private sync(): void {
      if (!this.button) return;
      this.button.disabled = this.hasAttribute("disabled");
      if (this.hasAttribute("selected")) this.button.setAttribute("aria-pressed", String(this.getAttribute("selected") !== "false")); else this.button.removeAttribute("aria-pressed");
    }
  }
  customElements.define("spui-interaction-tag-primary", SpuiInteractionTagPrimary);
}

export function defineInteractionTagSecondary(): void {
  if (customElements.get("spui-interaction-tag-secondary")) return;
  class SpuiInteractionTagSecondary extends HTMLElement {
    static observedAttributes = ["disabled", "label", "remove-label"];
    private button?: HTMLButtonElement;
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { this.sync(); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex;flex:none}button{display:grid;place-items:center;width:26px;min-height:28px;padding:0;border:0;border-radius:inherit;background:transparent;color:inherit;font:inherit;cursor:pointer}button:hover{background:color-mix(in srgb,currentColor 10%,transparent)}button:focus-visible{position:relative;z-index:1;outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,var(--spui-semantic-focus-border,var(--colorStrokeFocus2,#0078d4))));outline-offset:1px}:host([disabled]) button{cursor:not-allowed}.mark{font-size:17px;line-height:1}@media(forced-colors:active){button:focus-visible{outline-color:Highlight}}`;
      const button = document.createElement("button"); button.type = "button"; button.part.add("button"); button.innerHTML = '<span class="mark" aria-hidden="true">×</span><slot></slot>';
      button.addEventListener("click", event => {
        const owner = this.closest("spui-interaction-tag");
        if (owner) owner.dispatchEvent(new CustomEvent("spui-dismiss", { bubbles: true, composed: true, cancelable: true, detail: { value: owner.getAttribute("value") ?? "", originalEvent: event } }));
      });
      this.button = button; shadow.append(style, button);
    }
    private sync(): void {
      if (!this.button) return;
      this.button.disabled = this.hasAttribute("disabled");
      const owner = this.closest("spui-interaction-tag");
      const label = this.getAttribute("label") ?? `${this.getAttribute("remove-label") ?? "Remove"} ${owner?.getAttribute("label") ?? owner?.getAttribute("value") ?? "tag"}`;
      this.button.setAttribute("aria-label", label);
    }
  }
  customElements.define("spui-interaction-tag-secondary", SpuiInteractionTagSecondary);
}

export function defineInteractionTag(): void {
  defineInteractionTagPrimary(); defineInteractionTagSecondary();
  if (customElements.get("spui-interaction-tag")) return;
  class SpuiInteractionTag extends HTMLElement {
    static observedAttributes = ["appearance", "disabled", "selected", "shape", "size", "value"];
    private observer?: MutationObserver;
    connectedCallback(): void {
      this.style.display ||= "inline-flex";
      this.style.alignItems ||= "center";
      this.style.maxWidth ||= "100%";
      this.observer?.disconnect();
      this.observer = new MutationObserver(() => this.sync());
      this.observer.observe(this, { childList: true });
      this.sync();
    }
    disconnectedCallback(): void { this.observer?.disconnect(); }
    attributeChangedCallback(): void { this.sync(); }
    private sync(): void {
      this.style.border ||= "1px solid var(--spui-tag-border,var(--spui-ui-stroke,var(--spui-semantic-body-divider,var(--colorNeutralStroke2,#8a8886))))";
      this.style.borderRadius = this.getAttribute("shape") === "circular" ? "999px" : "var(--spui-control-radius,8px)";
      this.style.background = this.getAttribute("appearance") === "outline" ? "var(--spui-ui-surface,var(--spui-semantic-card-background,var(--colorNeutralBackground1,#fff)))" : this.getAttribute("appearance") === "brand" ? "color-mix(in srgb,var(--spui-ui-accent,var(--spui-semantic-primary-button-background,var(--colorBrandBackground,#78716c))) 22%,var(--spui-ui-surface,var(--spui-semantic-card-background,var(--colorNeutralBackground1,#fff))))" : "color-mix(in srgb,var(--spui-ui-accent,var(--spui-semantic-primary-button-background,var(--colorBrandBackground,#78716c))) 12%,var(--spui-ui-surface,var(--spui-semantic-card-background,var(--colorNeutralBackground1,#fff))))";
      this.style.color = "var(--spui-ui-text,var(--spui-semantic-body-text,var(--colorNeutralForeground1,inherit)))";
      this.style.fontFamily = "var(--spui-font-family,inherit)";
      this.toggleAttribute("data-selected", this.hasAttribute("selected"));
      const primary = this.querySelector<HTMLElement>("spui-interaction-tag-primary");
      const secondary = this.querySelector<HTMLElement>("spui-interaction-tag-secondary");
      if (primary) for (const name of ["disabled", "selected", "appearance", "shape", "size"]) {
        if (this.hasAttribute(name)) primary.setAttribute(name, this.getAttribute(name)!); else primary.removeAttribute(name);
      }
      if (primary) {
        const explicit = primary.hasAttribute("data-spui-explicit-has-secondary-action") || (primary.hasAttribute("has-secondary-action") && !primary.hasAttribute("data-spui-generated-has-secondary-action"));
        if (secondary || explicit) primary.setAttribute("has-secondary-action", ""); else primary.removeAttribute("has-secondary-action");
        primary.toggleAttribute("data-spui-generated-has-secondary-action", Boolean(secondary) && !explicit);
      }
      if (secondary) for (const name of ["disabled", "appearance", "shape", "size"]) {
        if (this.hasAttribute(name)) secondary.setAttribute(name, this.getAttribute(name)!); else secondary.removeAttribute(name);
      }
    }
  }
  customElements.define("spui-interaction-tag", SpuiInteractionTag);
}
