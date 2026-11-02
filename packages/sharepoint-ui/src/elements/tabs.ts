import { base } from "./shared.js";

const valueOf = (element: Element): string => element.getAttribute("value") ?? "";

export function defineTabs(): void {
  if (customElements.get("spui-tab")) return;

  class SpuiTab extends HTMLElement {
    static observedAttributes = ["disabled", "data-list-disabled", "selected", "tabindex", "aria-controls", "appearance", "size", "vertical", "reserve-selected-tab-space"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    get value(): string { return valueOf(this); }
    get disabled(): boolean { return this.hasAttribute("disabled") || this.hasAttribute("data-list-disabled"); }
    getContentText(): string {
      const named = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="content"]')?.assignedNodes({ flatten: true });
      const fallback = this.shadowRoot?.querySelector<HTMLSlotElement>("slot:not([name])")?.assignedNodes({ flatten: true });
      const assigned = named?.length ? named : fallback;
      return (assigned?.length ? assigned : [...this.childNodes].filter(node => !(node instanceof Element && node.slot)))
        .map(node => node.textContent ?? "").join("").replace(/\s+/g, " ").trim();
    }
    private sync(): void {
      this.setAttribute("role", "tab");
      this.setAttribute("aria-selected", String(this.getAttribute("selected") === "true"));
      if (this.disabled) this.setAttribute("aria-disabled", "true"); else this.removeAttribute("aria-disabled");
      const reserved = this.shadowRoot?.querySelector<HTMLSpanElement>(".reserved");
      if (reserved) reserved.textContent = this.hasAttribute("reserve-selected-tab-space") ? this.getContentText() : "";
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{box-sizing:border-box;position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:44px;min-height:40px;padding:8px 12px;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:var(--spui-ui-muted,var(--spui-semantic-body-text,#616161));font:inherit;line-height:1.25;text-align:center;white-space:nowrap;cursor:pointer;user-select:none}slot[name=icon]{display:inline-flex;align-items:center;justify-content:center;flex:none}.content{display:grid;min-width:0}.content slot,.reserved{grid-area:1/1}.reserved{display:none;visibility:hidden;white-space:pre;font-weight:600}:host([reserve-selected-tab-space][aria-selected=false]) .reserved{display:block}:host([size=small]){min-height:32px;padding:6px 10px;font-size:12px}:host([size=large]){min-height:48px;padding:10px 16px;font-size:16px}:host([aria-selected=true]){color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font-weight:600}:host::after{position:absolute;inset-inline:10px;inset-block-end:0;height:2px;border-radius:2px;background:var(--spui-ui-accent,var(--spui-semantic-accent,#78716c));content:"";opacity:0;transform:scaleX(.65);transition:opacity var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1)),transform var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}:host([aria-selected=true])::after{opacity:1;transform:scaleX(1)}:host(:focus-visible){z-index:1;outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#78716c));outline-offset:-2px}:host([disabled]),:host([data-list-disabled]){color:var(--spui-ui-muted,#777);cursor:not-allowed;opacity:.6}:host([appearance=subtle-circular]),:host([appearance=filled-circular]){border-radius:999px}:host([appearance=subtle-circular]){border:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}:host([appearance=subtle-circular][aria-selected=true]){background:color-mix(in srgb,var(--spui-ui-accent,#78716c) 12%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}:host([appearance=filled-circular][aria-selected=true]){background:color-mix(in srgb,var(--spui-ui-accent,#78716c) 18%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}:host([vertical]){justify-content:flex-start;width:100%;text-align:start}:host([vertical])::after{inset-block:8px;inset-inline-start:0;inset-inline-end:auto;width:2px;height:auto}:host([appearance=filled-circular])::after{display:none}@media(prefers-reduced-motion:reduce){:host::after{transition:none}}@media(forced-colors:active){:host::after{background:Highlight}:host(:focus-visible){outline-color:Highlight}:host([aria-selected=true]){color:CanvasText}}`;
      style.textContent += `:host([appearance=transparent]:hover:not([disabled])),:host([appearance=transparent]:active:not([disabled])){background:var(--colorTransparentBackgroundHover,var(--spui-ui-surface-hover,#f5f5f5))}:host([appearance=transparent]:active:not([disabled])){background:var(--colorTransparentBackgroundPressed,var(--spui-ui-surface-hover,#e0e0e0))}:host([appearance=subtle]){background:var(--colorSubtleBackground,transparent)}:host([appearance=subtle]:hover:not([disabled])){background:var(--colorSubtleBackgroundHover,var(--spui-ui-surface-hover,#f5f5f5))}:host([appearance=subtle]:active:not([disabled])){background:var(--colorSubtleBackgroundPressed,var(--spui-ui-surface-hover,#e0e0e0))}:host([appearance=subtle-circular]){border-color:var(--colorTransparentStroke,transparent);background:var(--colorSubtleBackground,transparent)}:host([appearance=subtle-circular]:hover:not([disabled])){border-color:var(--colorNeutralStroke1Hover,var(--spui-ui-stroke,#d1d1d1));background:var(--colorSubtleBackgroundHover,var(--spui-ui-surface-hover,#f5f5f5))}:host([appearance=subtle-circular][aria-selected=true]){border-color:var(--colorCompoundBrandStroke,color-mix(in srgb,var(--spui-ui-accent,#78716c) 52%,var(--spui-base-surface,var(--spui-ui-surface,#fff))));background:var(--colorBrandBackground2,color-mix(in srgb,var(--spui-ui-accent,#78716c) 18%,var(--spui-base-surface,var(--spui-ui-surface,#fff))));color:var(--colorBrandForeground2,var(--spui-ui-accent,#78716c))}:host([appearance=filled-circular]){border-color:transparent;background:var(--colorNeutralBackground3,var(--spui-ui-surface-hover,#f0f0f0))}:host([appearance=filled-circular][aria-selected=true]){border-color:transparent;background:var(--colorBrandBackground,var(--spui-ui-accent,#78716c));color:var(--colorNeutralForegroundOnBrand,#fff)}:host([appearance=subtle-circular])::after,:host([appearance=filled-circular])::after{display:none}@media(forced-colors:active){:host([appearance=subtle-circular][aria-selected=true]){border-color:Highlight}:host([appearance=filled-circular][aria-selected=true]){border-color:ButtonText;background:ButtonText;color:ButtonFace}}`;
      const content = document.createElement("span"); content.className = "content";
      const textSlot = document.createElement("slot"); textSlot.name = "content";
      const fallbackSlot = document.createElement("slot"); textSlot.append(fallbackSlot);
      textSlot.addEventListener("slotchange", () => this.sync()); fallbackSlot.addEventListener("slotchange", () => this.sync());
      content.append(textSlot);
      const reserved = document.createElement("span"); reserved.className = "reserved"; reserved.setAttribute("aria-hidden", "true");
      content.append(reserved);
      const iconSlot = document.createElement("slot"); iconSlot.name = "icon";
      shadow.append(style, iconSlot, content);
    }
  }
  customElements.define("spui-tab", SpuiTab);

  class SpuiTabList extends HTMLElement {
    static observedAttributes = ["selected-value", "default-selected-value", "select-on-focus", "reserve-selected-tab-space", "vertical", "disabled", "appearance", "size", "aria-label"];
    private events?: AbortController;
    private observer?: MutationObserver;
    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.observer = new MutationObserver(() => this.sync());
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "value"] });
      this.events?.abort(); this.events = new AbortController();
      this.addEventListener("click", this.onClick, { signal: this.events.signal });
      this.addEventListener("keydown", this.onKeyDown, { signal: this.events.signal });
      this.addEventListener("focusin", this.onFocusIn, { signal: this.events.signal });
      queueMicrotask(() => this.sync());
    }
    disconnectedCallback(): void { this.events?.abort(); this.observer?.disconnect(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    get selectedValue(): string | null {
      return this.getAttribute("selected-value") ?? this.dataset.selectedValue ?? this.getAttribute("default-selected-value") ?? this.tabs().find(tab => !tab.disabled)?.value ?? null;
    }
    private tabs(): SpuiTab[] { return [...this.children].filter((child): child is SpuiTab => child.localName === "spui-tab") as SpuiTab[]; }
    private sync(): void {
      const tabs = this.tabs();
      const selected = this.selectedValue;
      const focusValue = this.dataset.focusValue;
      const focusTab = tabs.find(tab => tab.value === focusValue && !tab.disabled) ?? tabs.find(tab => tab.value === selected && !tab.disabled) ?? tabs.find(tab => !tab.disabled);
      this.dataset.orientation = this.hasAttribute("vertical") ? "vertical" : "horizontal";
      const role = this.shadowRoot?.querySelector("[role=tablist]");
      role?.setAttribute("aria-orientation", this.hasAttribute("vertical") ? "vertical" : "horizontal");
      const label = this.getAttribute("aria-label");
      if (label) role?.setAttribute("aria-label", label); else role?.removeAttribute("aria-label");
      tabs.forEach(tab => {
        if (this.hasAttribute("disabled")) tab.setAttribute("data-list-disabled", ""); else tab.removeAttribute("data-list-disabled");
        if (this.hasAttribute("vertical")) tab.setAttribute("vertical", ""); else tab.removeAttribute("vertical");
        tab.setAttribute("selected", String(tab.value === selected));
        tab.setAttribute("tabindex", String(tab === focusTab ? 0 : -1));
        if (this.hasAttribute("appearance")) tab.setAttribute("appearance", this.getAttribute("appearance")!); else tab.removeAttribute("appearance");
        if (this.hasAttribute("size")) tab.setAttribute("size", this.getAttribute("size")!); else tab.removeAttribute("size");
        const reserveSpace = this.getAttribute("reserve-selected-tab-space") !== "false";
        if (reserveSpace) tab.setAttribute("reserve-selected-tab-space", ""); else tab.removeAttribute("reserve-selected-tab-space");
        const reserved = tab.shadowRoot?.querySelector<HTMLSpanElement>(".reserved");
        if (reserved) reserved.textContent = reserveSpace ? tab.getContentText() : "";
      });
      if (selected !== null && this.dataset.lastEmittedValue !== selected) {
        this.dataset.lastEmittedValue = selected;
        this.dispatchEvent(new CustomEvent("spui-tab-selection-change", { bubbles: true, composed: true, detail: { value: selected } }));
      }
    }
    private onFocusIn = (event: FocusEvent): void => {
      const tab = event.composedPath().find(target => target instanceof SpuiTab) as SpuiTab | undefined;
      if (!tab || tab.disabled) return;
      this.dataset.focusValue = tab.value;
      this.sync();
      if (this.hasAttribute("select-on-focus")) this.select(tab, event);
    };
    private onClick = (event: MouseEvent): void => {
      const tab = event.composedPath().find(target => target instanceof SpuiTab) as SpuiTab | undefined;
      if (tab) this.select(tab, event);
    };
    private onKeyDown = (event: KeyboardEvent): void => {
      const tabs = this.tabs().filter(tab => !tab.disabled);
      const current = event.composedPath().find(target => target instanceof SpuiTab) as SpuiTab | undefined;
      if (!current || !tabs.length) return;
      const index = tabs.indexOf(current);
      const vertical = this.hasAttribute("vertical");
      const rtl = getComputedStyle(this).direction === "rtl";
      const nextKey = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
      const previousKey = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
      let next: SpuiTab | undefined;
      if (event.key === nextKey) next = tabs[(index + 1) % tabs.length];
      else if (event.key === previousKey) next = tabs[(index - 1 + tabs.length) % tabs.length];
      else if (event.key === "Home") next = tabs[0];
      else if (event.key === "End") next = tabs.at(-1);
      else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.select(current, event); return; }
      if (!next) return;
      event.preventDefault();
      this.dataset.focusValue = next.value;
      this.sync();
      next.focus();
    };
    private select(tab: SpuiTab, sourceEvent: Event): void {
      if (tab.disabled || this.hasAttribute("disabled")) return;
      if (!this.hasAttribute("selected-value")) this.dataset.selectedValue = tab.value;
      this.dataset.focusValue = tab.value;
      this.sync();
      this.dispatchEvent(new CustomEvent("spui-tab-select", { bubbles: true, composed: true, detail: { value: tab.value, valueType: tab.getAttribute("data-spui-tab-value-type") ?? undefined, sourceEvent, currentTarget: tab } }));
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0;--spui-tab-gap:4px}.list{display:flex;align-items:center;gap:var(--spui-tab-gap);min-width:0;overflow:auto;scrollbar-width:thin;border-block-end:1px solid var(--spui-tabs-divider,var(--spui-ui-stroke,#d1d1d1))}:host([vertical]) .list{flex-direction:column;align-items:stretch;border-block-end:0;border-inline-end:1px solid var(--spui-tabs-divider,var(--spui-ui-stroke,#d1d1d1))}::slotted(spui-tab){flex:none}@media(forced-colors:active){.list{border-color:CanvasText}}`;
      const list = document.createElement("div"); list.className = "list"; list.setAttribute("role", "tablist"); list.append(document.createElement("slot"));
      shadow.append(style, list);
    }
  }
  customElements.define("spui-tab-list", SpuiTabList);

  class SpuiTabPanel extends HTMLElement {
    static observedAttributes = ["selected", "labelledby"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    get value(): string { return valueOf(this); }
    private sync(): void {
      const selected = this.getAttribute("selected") === "true";
      this.setAttribute("role", "tabpanel");
      this.hidden = !selected;
      this.setAttribute("tabindex", "0");
      const labelledBy = this.getAttribute("labelledby");
      if (labelledBy) this.setAttribute("aria-labelledby", labelledBy); else this.removeAttribute("aria-labelledby");
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0;padding-block:16px;color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424))}:host([hidden]){display:none}:host(:focus-visible){outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#78716c));outline-offset:2px}@media(forced-colors:active){:host(:focus-visible){outline-color:Highlight}}`;
      shadow.append(style, document.createElement("slot"));
    }
  }
  customElements.define("spui-tab-panel", SpuiTabPanel);

  class SpuiTabs extends HTMLElement {
    static observedAttributes = ["selected-value", "default-selected-value", "disabled"];
    private observer?: MutationObserver;
    private events?: AbortController;
    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.observer = new MutationObserver(() => this.sync());
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["value", "selected-value", "default-selected-value", "disabled"] });
      this.events?.abort(); this.events = new AbortController();
      this.addEventListener("spui-tab-selection-change", this.sync as EventListener, { signal: this.events.signal });
      queueMicrotask(() => this.sync());
    }
    disconnectedCallback(): void { this.observer?.disconnect(); this.events?.abort(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync = (): void => {
      const list = [...this.querySelectorAll("spui-tab-list")].find(item => item.closest("spui-tabs") === this) as SpuiTabList | undefined;
      if (!list) return;
      if (this.hasAttribute("disabled")) { if (!list.hasAttribute("disabled")) list.setAttribute("disabled", ""); }
      else if (list.hasAttribute("disabled")) list.removeAttribute("disabled");
      if (this.hasAttribute("selected-value")) {
        const selected = this.getAttribute("selected-value")!;
        list.dataset.rootSelectedValue = selected;
        if (list.getAttribute("selected-value") !== selected) list.setAttribute("selected-value", selected);
      } else if (list.hasAttribute("data-root-selected-value")) {
        delete list.dataset.rootSelectedValue;
        list.removeAttribute("selected-value");
      }
      else if (this.hasAttribute("default-selected-value") && !list.hasAttribute("default-selected-value")) list.setAttribute("default-selected-value", this.getAttribute("default-selected-value")!);
      const selected = this.getAttribute("selected-value") ?? list.selectedValue ?? this.getAttribute("default-selected-value");
      const tabs = [...this.querySelectorAll("spui-tab")].filter(tab => tab.closest("spui-tab-list") === list) as SpuiTab[];
      const panels = [...this.querySelectorAll("spui-tab-panel")].filter(panel => panel.closest("spui-tabs") === this) as SpuiTabPanel[];
      for (const tab of tabs) {
        const panel = panels.find(candidate => candidate.value === tab.value);
        if (!tab.id) tab.id = `spui-tab-${crypto.randomUUID()}`;
        if (panel) { if (!panel.id) panel.id = `spui-tabpanel-${crypto.randomUUID()}`; tab.setAttribute("aria-controls", panel.id); panel.setAttribute("labelledby", tab.id); }
      }
      for (const panel of panels) panel.setAttribute("selected", String(panel.value === selected));
    };
    private render(): void { const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0;color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424))}`; shadow.append(style, document.createElement("slot")); }
  }
  customElements.define("spui-tabs", SpuiTabs);
}
