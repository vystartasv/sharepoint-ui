import { base, findFocusable } from "./shared.js";

export type MenuOpenChangeType = "menuTriggerContextMenu" | "menuTriggerClick" | "menuTriggerMouseEnter" | "menuSafeZoneMouseEnter" | "menuSafeZoneTimeout" | "menuTriggerMouseLeave" | "menuTriggerMouseMove" | "menuTriggerKeyDown" | "menuItemClick" | "menuPopoverMouseEnter" | "menuPopoverKeyDown" | "clickOutside" | "scrollOutside" | "menuMouseEnter" | "programmatic";
type MenuOpenChangeSourceData =
  | { type: "menuTriggerContextMenu" | "menuTriggerClick" | "menuTriggerMouseEnter" | "menuSafeZoneMouseEnter" | "menuTriggerMouseLeave" | "menuTriggerMouseMove" | "menuItemClick" | "menuPopoverMouseEnter"; event: MouseEvent }
  | { type: "menuTriggerKeyDown" | "menuPopoverKeyDown"; event: KeyboardEvent; keyboard?: boolean }
  | { type: "menuSafeZoneTimeout" | "programmatic"; event: Event }
  | { type: "clickOutside" | "scrollOutside" | "menuMouseEnter"; event: MouseEvent | TouchEvent };
export type MenuOpenChangeData = { bubble?: boolean; keyboard?: boolean; open: boolean } & MenuOpenChangeSourceData;
type MenuOpenChangeSource = MenuOpenChangeSourceData & { keyboard?: boolean };

const nextId = (() => { let value = 0; return () => `spui-menu-${++value}`; })();

export function defineMenuItem(): void {
  if (customElements.get("spui-menu-item")) return;
  class SpuiMenuItem extends HTMLElement {
    static observedAttributes = ["disabled", "kind", "checked", "value", "name", "aria-haspopup", "aria-controls", "aria-expanded", "persist-on-click", "has-submenu"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); else this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    get checked(): boolean { return this.hasAttribute("checked"); }
    set checked(value: boolean) { this.toggleAttribute("checked", Boolean(value)); }
    focus(options?: FocusOptions): void { this.shadowRoot?.querySelector<HTMLButtonElement>("button")?.focus(options); }
    refreshMenuListState(): void { this.sync(); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0}button{box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;min-height:36px;padding:6px 10px;border:0;border-radius:var(--spui-menu-item-radius,4px);background:transparent;color:inherit;text-align:start;font:inherit;line-height:1.35;cursor:pointer}button:hover:not([aria-disabled=true]),button:focus-visible{background:var(--spui-menu-item-hover,var(--spui-ui-surface-hover,#f5f5f5))}button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}button[aria-disabled=true]{opacity:.5;cursor:not-allowed}.check,.icon{display:inline-grid;place-items:center;flex:none;width:16px;height:16px;color:var(--spui-ui-accent,var(--spui-semantic-accent,#0078d4));font-size:14px}.label{display:grid;min-width:0;flex:1}.content{min-width:0}.subtext,.secondary{color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#605e5c));font-size:.85em}.secondary{margin-inline-start:auto;white-space:nowrap}.submenu-indicator{display:inline-grid;place-items:center;flex:none;margin-inline-start:auto;font-size:1.25em;line-height:1}.submenu-indicator[hidden]{display:none!important}slot[name=checkmark],slot[name=content],slot[name=submenuIndicator]{display:contents}:host([kind=switch]) .check{position:relative;width:30px;height:18px;border-radius:999px;background:var(--spui-ui-stroke,#8a8886);color:transparent}:host([kind=switch][checked]) .check{background:var(--spui-ui-accent,#0078d4)}:host([kind=switch]) .check::after{content:"";position:absolute;inset-block-start:2px;inset-inline-start:2px;width:14px;height:14px;border-radius:50%;background:var(--spui-ui-surface,#fff);transition:inset-inline-start var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,ease)}:host([kind=switch][checked]) .check::after{inset-inline-start:14px}[hidden]{display:none!important}@media(prefers-reduced-motion:reduce){.check::after{transition:none}}@media(forced-colors:active){button:focus-visible{outline-color:Highlight}:host([kind=switch]) .check{border:1px solid ButtonText}}`;
      style.textContent += ":host([kind=switch][has-switch-indicator]) .check::after{display:none}:host([kind=switch]) slot[name=switch-indicator]{display:contents}";
      const button = document.createElement("button");
      button.type = "button";
      const marker = document.createElement("span"); marker.className = "check"; marker.setAttribute("aria-hidden", "true");
      const markerText = document.createElement("span"); markerText.className = "checkmark";
      const checkmarkSlot = document.createElement("slot"); checkmarkSlot.name = "checkmark"; checkmarkSlot.append(markerText); checkmarkSlot.addEventListener("slotchange", () => this.sync());
      const switchIndicator = document.createElement("slot"); switchIndicator.name = "switch-indicator";
      switchIndicator.addEventListener("slotchange", () => this.toggleAttribute("has-switch-indicator", switchIndicator.assignedNodes({ flatten: true }).length > 0));
      marker.append(checkmarkSlot, switchIndicator);
      const icon = document.createElement("span"); icon.className = "icon"; icon.setAttribute("aria-hidden", "true"); const iconSlot = document.createElement("slot"); iconSlot.name = "icon"; icon.append(iconSlot);
      const label = document.createElement("span"); label.className = "label"; const content = document.createElement("span"); content.className = "content"; const contentSlot = document.createElement("slot"); contentSlot.name = "content"; contentSlot.append(document.createElement("slot")); contentSlot.addEventListener("slotchange", () => this.sync()); content.append(contentSlot); const subtext = document.createElement("span"); subtext.className = "subtext"; const subtextSlot = document.createElement("slot"); subtextSlot.name = "subtext"; subtext.append(subtextSlot); label.append(content, subtext);
      const secondary = document.createElement("span"); secondary.className = "secondary"; const secondarySlot = document.createElement("slot"); secondarySlot.name = "secondary-content"; secondary.append(secondarySlot);
      const submenuIndicator = document.createElement("span"); submenuIndicator.className = "submenu-indicator"; submenuIndicator.hidden = true; submenuIndicator.setAttribute("aria-hidden", "true"); const submenuSlot = document.createElement("slot"); submenuSlot.name = "submenuIndicator"; const defaultSubmenuIndicator = document.createElement("span"); defaultSubmenuIndicator.textContent = "›"; submenuSlot.append(defaultSubmenuIndicator); submenuIndicator.append(submenuSlot);
      for (const slot of [iconSlot, subtextSlot, secondarySlot, submenuSlot]) slot.addEventListener("slotchange", () => this.sync());
      button.append(marker, icon, label, secondary, submenuIndicator);
      button.addEventListener("click", (event) => {
        if (this.hasAttribute("disabled")) return;
        if (this.getAttribute("aria-haspopup") === "menu") return;
        const kind = this.getAttribute("kind");
        if (kind === "checkbox" || kind === "switch") this.checked = !this.checked;
        else if (kind === "radio") this.checked = true;
        this.dispatchEvent(new CustomEvent("spui-select", { bubbles: true, composed: true, detail: { value: this.getAttribute("value") ?? "", name: this.getAttribute("name") ?? "", label: this.textContent?.trim() ?? "", checked: this.checked, kind, persistOnClick: this.hasAttribute("persist-on-click"), event } }));
      });
      shadow.append(style, button);
      this.sync();
    }
    private sync(): void {
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button");
      if (!button) return;
      const kind = this.getAttribute("kind");
      button.disabled = false;
      button.setAttribute("aria-disabled", String(this.hasAttribute("disabled")));
      button.setAttribute("role", kind === "checkbox" || kind === "switch" ? "menuitemcheckbox" : kind === "radio" ? "menuitemradio" : "menuitem");
      button.tabIndex = -1;
      if (kind === "checkbox" || kind === "radio" || kind === "switch") button.setAttribute("aria-checked", String(this.checked));
      else button.removeAttribute("aria-checked");
      if (this.hasAttribute("has-submenu")) { button.setAttribute("aria-haspopup", "menu"); button.setAttribute("aria-expanded", this.getAttribute("aria-expanded") ?? "false"); }
      const submenuIndicator = this.shadowRoot?.querySelector<HTMLElement>(".submenu-indicator");
      if (submenuIndicator) submenuIndicator.hidden = !this.hasAttribute("has-submenu");
      for (const name of ["aria-haspopup", "aria-controls", "aria-expanded"]) {
        const value = this.getAttribute(name);
        if (value === null) { if (!(name === "aria-haspopup" && this.hasAttribute("has-submenu")) && !(name === "aria-expanded" && this.hasAttribute("has-submenu"))) button.removeAttribute(name); }
        else button.setAttribute(name, value);
      }
      const marker = this.shadowRoot?.querySelector<HTMLElement>(".check");
      if (marker) marker.hidden = !(kind === "switch" || this.checked && (kind === "checkbox" || kind === "radio"));
      const markerText = this.shadowRoot?.querySelector<HTMLElement>(".checkmark");
      if (markerText) markerText.textContent = kind === "radio" ? "●" : kind === "switch" ? "" : "✓";
      const list = this.closest("[has-checkmarks], spui-menu-list[has-checkmarks]");
      if (marker && list?.hasAttribute("has-checkmarks") && kind !== "switch") marker.hidden = false;
      const icon = this.shadowRoot?.querySelector<HTMLElement>(".icon");
      const iconSlot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=icon]");
      if (icon && iconSlot) icon.hidden = !this.closest("[has-icons], spui-menu-list[has-icons]")?.hasAttribute("has-icons") && iconSlot.assignedNodes().length === 0;
      for (const slotName of ["subtext", "secondary-content"]) {
        const slot = this.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name=${slotName}]`);
        const host = slot?.parentElement; if (host && slot) host.hidden = slot.assignedNodes().length === 0;
      }
    }
  }
  customElements.define("spui-menu-item", SpuiMenuItem);
}

export function defineMenuDivider(): void {
  if (customElements.get("spui-menu-divider")) return;
  class SpuiMenuDivider extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      if (!this.hasAttribute("role")) this.setAttribute("role", "presentation");
      if (!this.hasAttribute("aria-hidden")) this.setAttribute("aria-hidden", "true");
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;height:1px;margin-block:5px;background:var(--spui-menu-divider,var(--spui-ui-stroke,var(--spui-semantic-body-divider,#e1dfdd)))}`;
      const divider = document.createElement("div"); divider.setAttribute("aria-hidden", "true");
      shadow.append(style, divider);
    }
  }
  customElements.define("spui-menu-divider", SpuiMenuDivider);
}

export function defineMenuGroup(): void {
  if (customElements.get("spui-menu-group")) return;
  class SpuiMenuGroup extends HTMLElement {
    private observer?: MutationObserver;
    private managedHeaderId?: string;

    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `${base}:host{display:block;min-width:0}:host([label]){padding-block:4px}:host([label])::before{content:attr(label);display:block;padding:4px 10px;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#605e5c));font-size:12px;font-weight:600}`;
        shadow.append(style, document.createElement("slot"));
      }
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      this.updateAccessibleName();
      this.observer = new MutationObserver(() => this.updateAccessibleName());
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["id"] });
    }

    disconnectedCallback(): void {
      this.observer?.disconnect();
      this.observer = undefined;
    }

    private updateAccessibleName(): void {
      const header = this.querySelector<HTMLElement>("spui-menu-group-header");
      if (header) {
        if (!header.id) header.id = `spui-menu-group-header-${crypto.randomUUID()}`;
        if (!this.hasAttribute("aria-labelledby") || this.getAttribute("aria-labelledby") === this.managedHeaderId) {
          this.setAttribute("aria-labelledby", header.id);
          this.managedHeaderId = header.id;
        }
        return;
      }
      if (this.managedHeaderId && this.getAttribute("aria-labelledby") === this.managedHeaderId) {
        this.removeAttribute("aria-labelledby");
        this.managedHeaderId = undefined;
      }
      if (!this.hasAttribute("aria-labelledby") && !this.hasAttribute("aria-label") && this.hasAttribute("label")) {
        this.setAttribute("aria-label", this.getAttribute("label") ?? "");
      }
    }
  }
  customElements.define("spui-menu-group", SpuiMenuGroup);
}

export function defineMenuGroupHeader(): void {
  if (customElements.get("spui-menu-group-header")) return;
  class SpuiMenuGroupHeader extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;padding:5px 10px;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#605e5c));font-size:12px;font-weight:600}`;
      const slot = document.createElement("slot");
      shadow.append(style, slot);
    }
  }
  customElements.define("spui-menu-group-header", SpuiMenuGroupHeader);
}

export function defineMenuItemLink(): void {
  if (customElements.get("spui-menu-item-link")) return;
  class SpuiMenuItemLink extends HTMLElement {
    static observedAttributes = ["href", "target", "rel", "download", "disabled", "aria-label"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); else this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    focus(options?: FocusOptions): void { this.shadowRoot?.querySelector<HTMLAnchorElement>("a")?.focus(options); }
    refreshMenuListState(): void { this.sync(); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0}a{box-sizing:border-box;display:flex;align-items:center;gap:10px;min-height:36px;padding:6px 10px;border-radius:var(--spui-menu-item-radius,4px);color:inherit;text-decoration:none;line-height:1.35}a:hover:not([aria-disabled=true]),a:focus-visible{background:var(--spui-menu-item-hover,var(--spui-ui-surface-hover,#f5f5f5))}a:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}a[aria-disabled=true]{opacity:.5;cursor:not-allowed}.checkmark,.icon{display:inline-grid;place-items:center;flex:none;width:16px;height:16px}.checkmark{color:var(--spui-ui-accent,var(--spui-semantic-accent,#0078d4))}.icon{color:inherit}.content{min-width:0;flex:1}.secondary{margin-inline-start:auto;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#605e5c));font-size:.85em;white-space:nowrap}slot[name=checkmark],slot[name=content]{display:contents}[hidden]{display:none!important}@media(forced-colors:active){a:focus-visible{outline-color:Highlight}}`;
      const anchor = document.createElement("a"); anchor.setAttribute("role", "menuitem");
      const checkmark = document.createElement("span"); checkmark.className = "checkmark"; checkmark.setAttribute("aria-hidden", "true"); const checkmarkSlot = document.createElement("slot"); checkmarkSlot.name = "checkmark"; checkmark.append(checkmarkSlot);
      const icon = document.createElement("span"); icon.className = "icon"; icon.setAttribute("aria-hidden", "true"); const iconSlot = document.createElement("slot"); iconSlot.name = "icon"; icon.append(iconSlot);
      const content = document.createElement("span"); content.className = "content"; const contentSlot = document.createElement("slot"); contentSlot.name = "content"; contentSlot.append(document.createElement("slot")); content.append(contentSlot);
      const secondary = document.createElement("span"); secondary.className = "secondary"; const secondarySlot = document.createElement("slot"); secondarySlot.name = "secondary-content"; secondary.append(secondarySlot);
      anchor.append(checkmark, icon, content, secondary);
      checkmarkSlot.addEventListener("slotchange", () => this.sync());
      contentSlot.addEventListener("slotchange", () => this.sync());
      for (const [slot, wrapper] of [[iconSlot, icon], [secondarySlot, secondary]] as const) slot.addEventListener("slotchange", () => { wrapper.hidden = slot.assignedNodes().length === 0 && !(slot.name === "icon" && this.closest("[has-icons], spui-menu-list[has-icons]")?.hasAttribute("has-icons")); });
      anchor.addEventListener("click", event => {
        if (this.hasAttribute("disabled")) { event.preventDefault(); event.stopPropagation(); return; }
        this.dispatchEvent(new CustomEvent("spui-select", { bubbles: true, composed: true, detail: { value: this.getAttribute("href") ?? "", label: this.textContent?.trim() ?? "", checked: false, kind: "link", event } }));
      });
      shadow.append(style, anchor); this.sync();
    }
    private sync(): void {
      const anchor = this.shadowRoot?.querySelector<HTMLAnchorElement>("a"); if (!anchor) return;
      for (const name of ["href", "target", "rel", "download", "aria-label"]) {
        const value = this.getAttribute(name); if (value === null) anchor.removeAttribute(name); else anchor.setAttribute(name, value);
      }
      const icon = this.shadowRoot?.querySelector<HTMLElement>(".icon"); const iconSlot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=icon]");
      if (icon && iconSlot) icon.hidden = iconSlot.assignedNodes().length === 0 && !this.closest("[has-icons], spui-menu-list[has-icons]")?.hasAttribute("has-icons");
      const checkmark = this.shadowRoot?.querySelector<HTMLElement>(".checkmark"); const checkmarkSlot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=checkmark]");
      if (checkmark && checkmarkSlot) checkmark.hidden = checkmarkSlot.assignedNodes({ flatten: true }).length === 0 && !this.closest("[has-checkmarks], spui-menu-list[has-checkmarks]")?.hasAttribute("has-checkmarks");
      const secondary = this.shadowRoot?.querySelector<HTMLElement>(".secondary"); const secondarySlot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=secondary-content]");
      if (secondary && secondarySlot) secondary.hidden = secondarySlot.assignedNodes().length === 0;
      if (this.hasAttribute("disabled")) { anchor.removeAttribute("href"); anchor.setAttribute("aria-disabled", "true"); anchor.tabIndex = -1; }
      else { anchor.removeAttribute("aria-disabled"); anchor.tabIndex = -1; if (this.hasAttribute("href")) anchor.setAttribute("href", this.getAttribute("href")!); }
    }
  }
  customElements.define("spui-menu-item-link", SpuiMenuItemLink);
}

export function defineMenuList(): void {
  if (customElements.get("spui-menu-list")) return;
  class SpuiMenuList extends HTMLElement {
    static observedAttributes = ["has-icons", "has-checkmarks"];
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0}:host([has-icons]) spui-menu-item, :host([has-checkmarks]) spui-menu-item{--spui-menu-reserve-leading:24px}`;
      const slot = document.createElement("slot"); slot.addEventListener("slotchange", this.syncItems); shadow.append(style, slot);
      this.setAttribute("role", "group");
      this.syncItems();
    }
    attributeChangedCallback(): void { this.syncItems(); }
    private syncItems = (): void => { for (const item of this.querySelectorAll<HTMLElement>("spui-menu-item,spui-menu-item-link")) (item as HTMLElement & { refreshMenuListState?: () => void }).refreshMenuListState?.(); };
  }
  customElements.define("spui-menu-list", SpuiMenuList);
}

export function defineMenuPopover(): void {
  if (customElements.get("spui-menu-popover")) return;
  class SpuiMenuPopover extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0}`;
      const slot = document.createElement("slot"); shadow.append(style, slot);
    }
  }
  customElements.define("spui-menu-popover", SpuiMenuPopover);
}

export function defineMenuSplitGroup(): void {
  if (customElements.get("spui-menu-split-group")) return;
  class SpuiMenuSplitGroup extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style"); style.textContent = `${base}:host{display:flex;align-items:stretch;gap:4px}:host([orientation=vertical]){flex-direction:column}`;
      const slot = document.createElement("slot"); shadow.append(style, slot); this.setAttribute("role", "group");
      this.addEventListener("keydown", this.onKeyDown);
    }
    disconnectedCallback(): void { this.removeEventListener("keydown", this.onKeyDown); }
    private onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const items = [...this.querySelectorAll<HTMLElement>("spui-menu-item,spui-menu-item-link")];
      const active = items.findIndex(item => item === event.composedPath()[0] || item.shadowRoot?.activeElement === this.ownerDocument.activeElement || item.shadowRoot?.activeElement === event.composedPath()[0]);
      if (active < 0 || !items.length) return;
      const rtl = getComputedStyle(this).direction === "rtl";
      const delta = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
      event.preventDefault(); event.stopPropagation(); items[(active + delta + items.length) % items.length].focus();
    };
  }
  customElements.define("spui-menu-split-group", SpuiMenuSplitGroup);
}

export function defineMenuTrigger(): void {
  if (customElements.get("spui-menu-trigger")) return;
  class SpuiMenuTrigger extends HTMLElement {
    static observedAttributes = ["aria-haspopup", "aria-controls", "aria-expanded", "disabled"];
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
        style.textContent = `${base}:host{display:inline-flex;cursor:pointer}:host([disabled]){opacity:.55;cursor:not-allowed}:host(:focus-visible){outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}slot{display:contents}`;
        const slot = document.createElement("slot"); shadow.append(style, slot); this.setAttribute("role", "button"); this.tabIndex = this.hasAttribute("disabled") ? -1 : this.tabIndex < 0 ? 0 : this.tabIndex;
      }
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("click", this.onClick);
      this.sync();
    }
    disconnectedCallback(): void { this.removeEventListener("keydown", this.onKeyDown); this.removeEventListener("click", this.onClick); }
    focus(options?: FocusOptions): void { HTMLElement.prototype.focus.call(this, options); }
    private sync(): void { for (const name of ["aria-haspopup", "aria-controls", "aria-expanded"]) { const value = this.getAttribute(name); if (value === null) this.removeAttribute(name); } this.setAttribute("aria-haspopup", "menu"); if (this.hasAttribute("disabled")) this.setAttribute("aria-disabled", "true"); else this.removeAttribute("aria-disabled"); }
    private onKeyDown = (event: KeyboardEvent): void => { if (this.hasAttribute("disabled") || event.repeat || (event.key !== "Enter" && event.key !== " ")) return; event.preventDefault(); this.click(); };
    private onClick = (event: MouseEvent): void => { if (!this.hasAttribute("disabled")) return; event.preventDefault(); event.stopPropagation(); };
  }
  customElements.define("spui-menu-trigger", SpuiMenuTrigger);
}

export function defineMenu(): void {
  if (customElements.get("spui-menu")) return;
  defineMenuItem(); defineMenuItemLink(); defineMenuDivider(); defineMenuGroup(); defineMenuGroupHeader(); defineMenuList(); defineMenuPopover(); defineMenuSplitGroup(); defineMenuTrigger();
  class SpuiMenu extends HTMLElement {
    static observedAttributes = ["open", "default-open", "motion", "label", "placement", "positioning", "position-offset", "context-menu", "open-on-context", "open-on-hover", "hover-delay", "close-on-scroll", "persist-on-item-click", "inline"];
    private events?: AbortController;
    private panel?: HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
    private trigger?: HTMLElement;
    private triggerState?: { haspopup: string | null; controls: string | null; expanded: string | null };
    private isOpen = false;
    private typeahead = "";
    private typeaheadTimer?: ReturnType<typeof setTimeout>;
    private contextPoint?: { x: number; y: number };
    private hoverTimer?: ReturnType<typeof setTimeout>;
    private motionExitPending = false;
    private exitGeneration = 0;
    get open(): boolean { return this.isOpen; }
    set open(value: boolean) { this.setOpen(Boolean(value)); }
    get menuTrigger(): HTMLElement | undefined { return this.trigger; }

    connectedCallback(): void {
      this.style.display ||= "contents";
      if (!this.shadowRoot) this.render();
      this.events?.abort();
      this.events = new AbortController();
      const options = { signal: this.events.signal };
      this.addEventListener("click", this.onClick, options);
      this.addEventListener("keydown", this.onKeyDown, options);
      this.addEventListener("spui-select", this.onItemSelect as EventListener, options);
      this.addEventListener("contextmenu", this.onContextMenu, options);
      this.addEventListener("keydown", this.onContextMenuKeyDown, options);
      this.addEventListener("pointerover", this.onPointerOver, options);
      this.addEventListener("pointerout", this.onPointerOut, options);
      this.addEventListener("mouseover", this.onPanelMouseOver, options);
      this.ownerDocument.addEventListener("pointerdown", this.onOutsidePointerDown, { ...options, capture: true });
      this.ownerDocument.addEventListener("spui-menu-enter", this.onMenuEnter, options);
      this.ownerDocument.addEventListener("wheel", this.onScrollOutside, { ...options, capture: true });
      this.ownerDocument.addEventListener("touchmove", this.onScrollOutside, { ...options, capture: true });
      window.addEventListener("resize", this.position, options);
      window.addEventListener("scroll", this.position, { ...options, capture: true });
      this.shadowRoot?.querySelector("slot[name=trigger]")?.addEventListener("slotchange", this.syncTrigger, options);
      this.panel = this.shadowRoot?.querySelector<HTMLElement>(".surface") as (HTMLElement & { showPopover?: () => void; hidePopover?: () => void }) | undefined;
      if (!this.hasAttribute("placement")) this.setAttribute("placement", this.parentMenu() ? "end" : "bottom");
      this.isOpen = this.hasAttribute("open") || this.hasAttribute("default-open");
      if (this.isOpen) this.toggleAttribute("open", true);
      this.syncTrigger();
      this.syncLabel();
      this.syncVisibility();
    }

    disconnectedCallback(): void {
      this.events?.abort();
      this.clearTypeahead();
      this.clearHoverTimer();
      this.restoreTrigger();
      this.panel?.hidePopover?.();
    }

    attributeChangedCallback(name: string): void {
      if (!this.isConnected) return;
      if (name === "open") {
        const next = this.hasAttribute("open");
        if (next !== this.isOpen) { this.isOpen = next; this.syncVisibility(); this.emitOpenChange(); }
      } else if (name === "label") this.syncLabel();
      else if (name === "inline") { this.syncPopoverMode(); this.syncVisibility(); }
      else this.position();
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:contents}.surface{position:fixed;inset:auto;margin:0;z-index:var(--spui-layer-popover,10000);box-sizing:border-box;width:max-content;min-width:180px;max-width:min(320px,calc(100vw - 16px));max-height:min(70vh,calc(100dvh - 24px));overflow:auto;padding:4px;border:1px solid var(--spui-menu-border,var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1)));border-radius:var(--spui-menu-radius,var(--spui-card-radius,8px));background:var(--spui-menu-background,var(--spui-ui-surface,var(--colorNeutralBackground1,#fff)));color:var(--spui-menu-color,var(--spui-ui-text,var(--colorNeutralForeground1,#242424)));box-shadow:var(--spui-menu-shadow,0 8px 24px rgb(0 0 0 / 18%));font:var(--spui-font-family,inherit);line-height:1.45}.surface:not(:popover-open){display:none}:host([inline]) .surface:not([hidden]){display:block!important}.surface[hidden]{display:none!important}slot[name=trigger]{display:contents}@media(forced-colors:active){.surface{border-color:CanvasText;box-shadow:none}}`;
      const triggerSlot = document.createElement("slot"); triggerSlot.name = "trigger";
      const panel = document.createElement("div") as HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
      panel.className = "surface"; panel.part.add("surface"); panel.setAttribute("popover", "manual"); panel.setAttribute("role", "menu"); panel.setAttribute("aria-orientation", "vertical"); panel.id = nextId();
      const items = document.createElement("slot"); items.name = "menu";
      panel.append(items);
      panel.addEventListener("toggle", this.onNativeToggle as EventListener);
      shadow.append(style, triggerSlot, panel);
      this.panel = panel;
    }

    private assignedTriggers(): HTMLElement[] { return this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=trigger]")?.assignedElements({ flatten: true }).filter((node): node is HTMLElement => node instanceof HTMLElement) ?? []; }
    private syncTrigger = (): void => {
      const slotted = this.assignedTriggers()[0];
      const next = slotted ? findFocusable(slotted.shadowRoot ?? slotted) ?? slotted : undefined;
      if (next !== this.trigger) {
        this.restoreTrigger(); this.trigger = next;
        this.triggerState = next ? { haspopup: next.getAttribute("aria-haspopup"), controls: next.getAttribute("aria-controls"), expanded: next.getAttribute("aria-expanded") } : undefined;
      }
      if (this.trigger && this.panel) {
        this.trigger.setAttribute("aria-haspopup", "menu");
        if (this.trigger.getRootNode() === this.panel.getRootNode()) this.trigger.setAttribute("aria-controls", this.panel.id);
        else this.trigger.removeAttribute("aria-controls");
        this.trigger.setAttribute("aria-expanded", String(this.isOpen));
      }
      this.dispatchEvent(new CustomEvent("spui-menu-trigger-change", { bubbles: true, composed: true }));
    };
    private restoreTrigger(): void {
      if (!this.trigger || !this.triggerState) return;
      for (const [name, value] of [["aria-haspopup", this.triggerState.haspopup], ["aria-expanded", this.triggerState.expanded]] as const) {
        if (value === null) this.trigger.removeAttribute(name); else this.trigger.setAttribute(name, value);
      }
      if (this.triggerState.controls === null) this.trigger.removeAttribute("aria-controls");
      else this.trigger.setAttribute("aria-controls", this.triggerState.controls);
      this.trigger = undefined; this.triggerState = undefined;
    }
    private syncLabel(): void { if (this.panel) this.panel.setAttribute("aria-label", this.getAttribute("label") || "Menu"); }
    private syncPopoverMode(): void {
      if (!this.panel) return;
      if (this.hasAttribute("inline")) { this.panel.removeAttribute("popover"); this.panel.hidden = !this.isOpen && !this.motionExitPending; }
      else { this.panel.setAttribute("popover", "manual"); this.panel.hidden = false; }
    }
    private syncVisibility(): void {
      if (!this.panel) return;
      if (this.isOpen) {
        this.exitGeneration++;
        this.motionExitPending = false;
        this.panel.inert = false;
        this.panel.removeAttribute("aria-hidden");
      } else if (this.hasAttribute("motion")) {
        this.motionExitPending = true;
        this.panel.inert = true;
        this.panel.setAttribute("aria-hidden", "true");
      }
      this.syncPopoverMode();
      if (this.hasAttribute("inline")) this.panel.hidden = !this.isOpen && !this.motionExitPending;
      else if (this.isOpen) { try { this.panel.showPopover?.(); } catch { /* The open attribute remains the fallback state. */ } }
      else if (!this.motionExitPending) this.panel.hidePopover?.();
      if (this.motionExitPending) {
        if (!this.hasAttribute("inline") && !this.panel.matches(":popover-open")) {
          try { this.panel.showPopover?.(); } catch { /* Keep the closed state if the browser cannot restore the top layer. */ }
        }
        const generation = ++this.exitGeneration;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const animations = new Set<Animation>();
          const visit = (element: Element): void => {
            for (const animation of element.getAnimations()) if (animation.playState === "running") animations.add(animation);
            if (element.shadowRoot) for (const child of element.shadowRoot.children) visit(child);
            for (const child of element.children) visit(child);
          };
          visit(this);
          const finish = (): void => {
            if (generation !== this.exitGeneration || this.isOpen || !this.panel) return;
            this.motionExitPending = false;
            if (!this.hasAttribute("inline")) this.panel.hidePopover?.();
            this.panel.hidden = true;
          };
          if (animations.size) void Promise.allSettled([...animations].map(animation => animation.finished)).then(finish);
          else finish();
        }));
      }
      if (this.isOpen) requestAnimationFrame(this.position);
      this.syncTrigger();
    }
    private position = (): void => {
      if (!this.isOpen || !this.trigger || !this.panel) return;
      const anchor = this.trigger.getBoundingClientRect(); const panel = this.panel.getBoundingClientRect(); const offsetValue = this.getAttribute("position-offset"); const offset = Number(offsetValue); const gap = offsetValue === null ? 4 : Number.isFinite(offset) ? Math.max(0, Math.min(64, offset)) : 4;
      const direction = this.getAttribute("dir") || getComputedStyle(this).direction;
      if (this.hasAttribute("context-menu")) {
        const point = this.contextPoint ?? { x: direction === "rtl" ? anchor.right : anchor.left, y: anchor.bottom };
        const left = Math.max(gap, Math.min(point.x, innerWidth - panel.width - gap));
        const top = Math.max(gap, Math.min(point.y, innerHeight - panel.height - gap));
        this.panel.style.left = `${left}px`; this.panel.style.top = `${top}px`;
        return;
      }
      const value = this.getAttribute("positioning") || this.getAttribute("placement") || "bottom";
      const side = value.startsWith("above") ? "top" : value.startsWith("below") ? "bottom" : value === "before" ? "start" : value === "after" ? "end" : value.split("-")[0];
      const alignment = value.endsWith("-end") ? "end" : "start";
      let top = side === "top" ? anchor.top - panel.height - gap : side === "bottom" ? anchor.bottom + gap : alignment === "end" ? anchor.bottom - panel.height : anchor.top;
      let left = side === "start" ? (direction === "rtl" ? anchor.right + gap : anchor.left - panel.width - gap) : side === "end" ? (direction === "rtl" ? anchor.left - panel.width - gap : anchor.right + gap) : alignment === "end" ? (direction === "rtl" ? anchor.left : anchor.right - panel.width) : (direction === "rtl" ? anchor.right - panel.width : anchor.left);
      if (side === "bottom" && top + panel.height > innerHeight - gap) top = anchor.top - panel.height - gap;
      if (side === "top" && top < gap) top = anchor.bottom + gap;
      left = Math.max(gap, Math.min(left, innerWidth - panel.width - gap)); top = Math.max(gap, Math.min(top, innerHeight - panel.height - gap));
      this.panel.style.left = `${left}px`; this.panel.style.top = `${top}px`;
    };
    private contextEnabled(): boolean { return this.hasAttribute("context-menu") || this.hasAttribute("open-on-context"); }
    private onContextMenu = (event: MouseEvent): void => {
      if (!this.contextEnabled() || !this.trigger || !event.composedPath().includes(this.trigger)) return;
      event.preventDefault();
      this.contextPoint = { x: event.clientX, y: event.clientY };
      this.setOpen(true, { event, type: "menuTriggerContextMenu" });
      requestAnimationFrame(() => this.focusItem(0));
    };
    private onContextMenuKeyDown = (event: KeyboardEvent): void => {
      if (!this.contextEnabled() || !this.trigger || !event.composedPath().includes(this.trigger)) return;
      if (event.key !== "ContextMenu" && !(event.key === "F10" && event.shiftKey)) return;
      event.preventDefault();
      const rect = this.trigger.getBoundingClientRect();
      this.contextPoint = { x: getComputedStyle(this).direction === "rtl" ? rect.right : rect.left, y: rect.bottom };
      this.setOpen(true, { event, type: "menuTriggerKeyDown", keyboard: true });
      requestAnimationFrame(() => this.focusItem(0));
    };
    private items(): HTMLElement[] { return [...this.querySelectorAll<HTMLElement>("spui-menu-item,spui-menu-item-link")]; }
    private menuItems(): HTMLElement[] { return this.items().filter(item => {
      const owner = item.closest("spui-menu");
      if (owner === this) return item.getAttribute("slot") !== "trigger";
      return item.getAttribute("slot") === "trigger" && owner?.parentElement?.closest("spui-menu") === this;
    }); }
    private focusItem(index: number): void { const items = this.menuItems(); if (!items.length) return; items[(index + items.length) % items.length].focus(); }
    private focusItemAfterOpen(index: number): void { requestAnimationFrame(() => requestAnimationFrame(() => { if (this.isOpen) this.focusItem(index); })); }
    private activeIndex(): number { const active = this.shadowRoot?.activeElement ?? document.activeElement; return this.menuItems().findIndex(item => item === active || item.shadowRoot?.activeElement === active); }
    private onClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const path = event.composedPath();
      if (this.trigger && (target === this.trigger || this.trigger.contains(target) || path.includes(this.trigger))) {
        if (path.some(node => node instanceof HTMLElement && (node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true"))) return;
        if (this.contextEnabled() && !this.hasAttribute("open-on-hover")) return;
        this.setOpen(!this.isOpen, { event, type: "menuTriggerClick" });
        if (this.isOpen) requestAnimationFrame(() => this.focusItem(0));
      }
    };
    private onOutsidePointerDown = (event: PointerEvent): void => {
      if (!this.isOpen || event.composedPath().some(target => target === this || target instanceof Node && (this.contains(target) || this.shadowRoot?.contains(target)))) return;
      this.setOpen(false, { event, type: "clickOutside" });
    };
    private hoverDelay(): number { const raw = this.getAttribute("hover-delay"); if (raw === null) return 300; const value = Number(raw); return Number.isFinite(value) ? Math.max(0, Math.min(2000, value)) : 300; }
    private onPointerOver = (event: PointerEvent): void => {
      if (!this.hasAttribute("open-on-hover") || !this.trigger || !event.composedPath().includes(this.trigger)) return;
      this.clearHoverTimer();
      this.hoverTimer = setTimeout(() => this.setOpen(true, { event, type: "menuTriggerMouseEnter" }), this.hoverDelay());
    };
    private onPointerOut = (event: PointerEvent): void => {
      if (!this.hasAttribute("open-on-hover") || !this.isOpen || !this.trigger || !event.composedPath().includes(this.trigger)) return;
      const target = event.relatedTarget;
      if (target instanceof Node && (this.contains(target) || this.shadowRoot?.contains(target))) return;
      this.clearHoverTimer();
      this.hoverTimer = setTimeout(() => this.setOpen(false, { event, type: "menuTriggerMouseLeave" }), this.hoverDelay());
    };
    private onPanelMouseOver = (event: MouseEvent): void => {
      if (!this.panel || !event.composedPath().includes(this.panel)) return;
      this.dispatchEvent(new CustomEvent("spui-menu-enter", { bubbles: true, composed: true, detail: { nativeEvent: event } }));
    };
    private onMenuEnter = (event: Event): void => {
      const target = event.target;
      if (!this.isOpen || target === this || target instanceof Node && (this.contains(target) || this.shadowRoot?.contains(target))) return;
      const nativeEvent = (event as CustomEvent<{ nativeEvent?: Event }>).detail?.nativeEvent;
      if (nativeEvent instanceof MouseEvent) this.setOpen(false, { event: nativeEvent, type: "menuMouseEnter" });
    };
    private onScrollOutside = (event: WheelEvent | TouchEvent): void => {
      if (!(this.hasAttribute("close-on-scroll") || this.contextEnabled()) || !this.isOpen) return;
      if (!event.composedPath().some(target => target === this || target instanceof Node && (this.contains(target) || this.shadowRoot?.contains(target)))) {
        this.setOpen(false, { event, type: "scrollOutside" });
      }
    };
    private onKeyDown = (event: KeyboardEvent): void => {
      const direction = getComputedStyle(this).direction;
      const forwardKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      const backwardKey = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      if (event.key === backwardKey && this.isOpen && this.parentMenu()) {
        event.preventDefault(); event.stopPropagation(); this.setOpen(false, { event, type: "menuPopoverKeyDown", keyboard: true }); this.focusTrigger(); return;
      }
      if (event.key === forwardKey && this.isOpen) {
        const active = this.menuItems()[this.activeIndex()];
        const submenu = active?.parentElement?.localName === "spui-menu" ? active.parentElement as SpuiMenu : undefined;
        if (submenu && submenu !== this) {
          event.preventDefault(); event.stopPropagation(); submenu.setOpen(true, { event, type: "menuTriggerKeyDown", keyboard: true });
          requestAnimationFrame(() => submenu.focusFirstItem()); return;
        }
      }
      if (event.key === "Escape" && this.isOpen) { event.preventDefault(); event.stopPropagation(); this.setOpen(false, { event, type: "menuPopoverKeyDown", keyboard: true }); this.focusTrigger(); return; }
      if (event.key === "Tab" && this.isOpen) { this.setOpen(false, { event, type: "menuPopoverKeyDown", keyboard: true }); return; }
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const items = this.menuItems();
        if (!items.length) return;
        if (!this.isOpen) { const inTrigger = event.composedPath().includes(this.trigger!); this.setOpen(true, { event, type: inTrigger ? "menuTriggerKeyDown" : "menuPopoverKeyDown", keyboard: true }); this.focusItemAfterOpen(event.key === "ArrowUp" || event.key === "End" ? items.length - 1 : 0); return; }
        const index = this.activeIndex();
        this.focusItem(event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : index + (event.key === "ArrowDown" ? 1 : -1)); return;
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const character = event.key.toLocaleLowerCase(this.lang || undefined);
        this.typeahead = this.typeahead === character ? character : this.typeahead + character;
        this.clearTypeahead();
        this.typeaheadTimer = setTimeout(() => { this.typeahead = ""; }, 500);
        const items = this.menuItems();
        const start = (this.activeIndex() + 1 + items.length) % items.length;
        for (let offset = 0; offset < items.length; offset++) {
          const index = (start + offset) % items.length;
          const content = items[index].shadowRoot?.querySelector<HTMLSlotElement>('slot[name="content"]');
          const visibleText = content?.assignedNodes({ flatten: true }).map(node => node.textContent ?? "").join("") || items[index].textContent || "";
          const label = visibleText.trim().toLocaleLowerCase(this.lang || undefined);
          if (label.startsWith(this.typeahead)) { event.preventDefault(); this.focusItem(index); return; }
        }
      }
    };
    focusFirstItem(): void { this.focusItem(0); }
    private parentMenu(): SpuiMenu | undefined { return this.parentElement?.closest("spui-menu") as SpuiMenu | undefined; }
    private onItemSelect = (event: CustomEvent<{ kind?: string; name?: string; checked?: boolean; persistOnClick?: boolean; event?: MouseEvent }>): void => {
      const item = event.target as HTMLElement | null;
      if (item?.getAttribute("kind") === "radio") {
        const name = item.getAttribute("name");
        if (name) for (const option of this.querySelectorAll<HTMLElement>(`spui-menu-item[kind=radio][name="${CSS.escape(name)}"]`)) option.toggleAttribute("checked", option === item);
      }
      if (event.detail?.persistOnClick || item?.hasAttribute("persist-on-click") || this.hasAttribute("persist-on-item-click")) return;
      this.setOpen(false, { event: event.detail?.event ?? new MouseEvent("click"), type: "menuItemClick" }); this.focusTrigger();
    };
    private onNativeToggle = (event: ToggleEvent): void => {
      const next = event.newState === "open";
      if (next === this.isOpen) return;
      this.isOpen = next; this.toggleAttribute("open", next); this.syncTrigger(); this.emitOpenChange({ event, type: "programmatic" });
    };
    private focusTrigger(): void { const inner = this.trigger?.shadowRoot?.querySelector<HTMLElement>("button,[tabindex]"); if (inner) inner.focus(); else this.trigger?.focus(); }
    private setOpen(value: boolean, source: MenuOpenChangeSource = { event: new Event("programmatic"), type: "programmatic" }): void {
      const next = Boolean(value);
      if (next === this.isOpen) return;
      this.isOpen = next;
      if (!next) for (const child of this.querySelectorAll<SpuiMenu>("spui-menu")) if (child.isOpen) child.setOpen(false, source);
      if (this.hasAttribute("open") !== next) this.toggleAttribute("open", next);
      this.syncVisibility(); this.emitOpenChange(source);
    }
    private emitOpenChange(source: MenuOpenChangeSource = { event: new Event("programmatic"), type: "programmatic" }): void { const detail = { open: this.isOpen, ...source, keyboard: source.keyboard ?? false, bubble: false } as MenuOpenChangeData; this.dispatchEvent(new CustomEvent<MenuOpenChangeData>("spui-open-change", { bubbles: true, composed: true, detail })); }
    private clearTypeahead(): void { if (this.typeaheadTimer !== undefined) clearTimeout(this.typeaheadTimer); this.typeaheadTimer = undefined; }
    private clearHoverTimer(): void { if (this.hoverTimer !== undefined) clearTimeout(this.hoverTimer); this.hoverTimer = undefined; }
  }
  customElements.define("spui-menu", SpuiMenu);
}

type MenuBarMenu = HTMLElement & { open: boolean; menuTrigger?: HTMLElement };

export function defineMenuBarItem(): void {
  if (customElements.get("spui-menu-bar-item")) return;
  class SpuiMenuBarItem extends HTMLElement {
    static observedAttributes = ["disabled", "aria-label", "aria-haspopup", "aria-controls", "aria-expanded"];
    private button!: HTMLButtonElement;
    connectedCallback(): void { if (!this.shadowRoot) this.render(); else this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    get tabStop(): boolean { return this.button?.tabIndex === 0; }
    set tabStop(value: boolean) { if (this.button) this.button.tabIndex = value ? 0 : -1; }
    focus(options?: FocusOptions): void { this.button?.focus(options); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex;min-width:0}button{box-sizing:border-box;display:flex;align-items:center;gap:8px;min-height:36px;padding:7px 12px;border:1px solid transparent;border-radius:var(--spui-menu-bar-item-radius,var(--spui-control-radius,6px));background:transparent;color:inherit;font:inherit;text-align:start;cursor:pointer}button:hover:not(:disabled),button:focus-visible{background:var(--spui-menu-bar-item-hover,var(--spui-ui-surface-hover,#f5f5f5))}button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:1px}button[aria-expanded=true]{background:var(--spui-menu-bar-item-open,var(--spui-ui-surface-secondary,#f0f0f0));border-color:var(--spui-menu-bar-item-border,var(--spui-ui-stroke,#d1d1d1))}button:disabled{opacity:.5;cursor:not-allowed}button[aria-haspopup=menu]::after{content:"▾";margin-inline-start:4px;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#605e5c));font-size:.8em}[hidden]{display:none!important}@media(forced-colors:active){button:focus-visible{outline-color:Highlight}button[aria-expanded=true]{border-color:Highlight}}`;
      this.button = document.createElement("button");
      this.button.type = "button";
      this.button.tabIndex = -1;
      const slot = document.createElement("slot");
      this.button.append(slot);
      shadow.append(style, this.button);
      this.sync();
    }
    private sync(): void {
      if (!this.button) return;
      this.button.disabled = this.hasAttribute("disabled");
      this.button.setAttribute("role", "menuitem");
      this.button.tabIndex = this.button.tabIndex < 0 ? -1 : this.button.tabIndex;
      for (const name of ["aria-label", "aria-haspopup", "aria-controls", "aria-expanded"]) {
        const value = this.getAttribute(name);
        if (value === null) this.button.removeAttribute(name); else this.button.setAttribute(name, value);
      }
      if (this.hasAttribute("disabled")) this.button.setAttribute("aria-disabled", "true"); else this.button.removeAttribute("aria-disabled");
    }
  }
  customElements.define("spui-menu-bar-item", SpuiMenuBarItem);
}

export function defineMenuBar(): void {
  if (customElements.get("spui-menu-bar")) return;
  defineMenu();
  defineMenuBarItem();
  class SpuiMenuBar extends HTMLElement {
    private slotElement!: HTMLSlotElement;
    private activeIndex = 0;
    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.setAttribute("role", "menubar");
      this.setAttribute("aria-orientation", "horizontal");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Menu bar");
      this.slotElement.addEventListener("slotchange", this.syncItems);
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("focusin", this.onFocusIn);
      this.addEventListener("spui-open-change", this.onOpenChange as EventListener);
      this.addEventListener("spui-menu-trigger-change", this.syncItems);
      this.syncItems();
    }
    disconnectedCallback(): void {
      this.slotElement?.removeEventListener("slotchange", this.syncItems);
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("focusin", this.onFocusIn);
      this.removeEventListener("spui-open-change", this.onOpenChange as EventListener);
      this.removeEventListener("spui-menu-trigger-change", this.syncItems);
    }
    private menus(): MenuBarMenu[] {
      return [...this.querySelectorAll<MenuBarMenu>("spui-menu")].filter(menu => !menu.parentElement?.closest("spui-menu") && menu.parentElement?.closest("spui-menu-bar") === this);
    }
    private items(): HTMLElement[] { return this.menus().map(menu => menu.menuTrigger).filter((item): item is HTMLElement => Boolean(item)); }
    private syncItems = (): void => {
      const items = this.items();
      const focused = items.findIndex(item => item === this.ownerDocument.activeElement || item.contains(this.ownerDocument.activeElement));
      if (focused >= 0) this.activeIndex = focused;
      else this.activeIndex = Math.min(this.activeIndex, Math.max(0, items.length - 1));
      items.forEach((item, index) => this.setTabStop(item, index === this.activeIndex));
    };
    private setTabStop(item: HTMLElement, value: boolean): void {
      if ("tabStop" in item) (item as HTMLElement & { tabStop: boolean }).tabStop = value;
      else {
        const focusTarget = item.shadowRoot?.querySelector<HTMLElement>("button,[tabindex]");
        if (focusTarget) focusTarget.tabIndex = value ? 0 : -1;
        else item.tabIndex = value ? 0 : -1;
      }
    }
    private setActive(index: number, focus: boolean): void {
      const items = this.items();
      if (!items.length) return;
      this.activeIndex = (index + items.length) % items.length;
      items.forEach((item, itemIndex) => this.setTabStop(item, itemIndex === this.activeIndex));
      if (focus) items[this.activeIndex].focus();
    }
    private focusedIndex(event?: KeyboardEvent): number { const active = this.ownerDocument.activeElement; const path = event?.composedPath() ?? []; return this.items().findIndex(item => path.includes(item) || item === active || item.contains(active)); }
    private onFocusIn = (event: FocusEvent): void => {
      const path = event.composedPath();
      const index = this.items().findIndex(item => path.includes(item));
      if (index >= 0) this.setActive(index, false);
    };
    private onKeyDown = (event: KeyboardEvent): void => {
      const index = this.focusedIndex(event);
      if (index < 0) return;
      const direction = getComputedStyle(this).direction;
      const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      const backward = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        this.setActive(event.key === "Home" ? 0 : this.items().length - 1, true);
        return;
      }
      if (event.key !== forward && event.key !== backward) return;
      event.preventDefault();
      const currentMenu = this.menus()[index];
      if (currentMenu?.open) currentMenu.open = false;
      this.setActive(index + (event.key === forward ? 1 : -1), true);
    };
    private onOpenChange = (event: CustomEvent<{ open?: boolean }>): void => {
      if (!event.detail?.open) return;
      const opened = event.target;
      if (!this.menus().includes(opened as MenuBarMenu)) return;
      for (const menu of this.menus()) if (menu !== opened && menu.open) menu.open = false;
    };
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:flex;align-items:center;gap:var(--spui-menu-bar-gap,4px);min-width:0;padding:var(--spui-menu-bar-padding,4px);border:1px solid var(--spui-menu-bar-border,var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1)));border-radius:var(--spui-menu-bar-radius,var(--spui-control-radius,8px));background:var(--spui-menu-bar-background,var(--spui-ui-surface,#fff));color:var(--spui-menu-bar-color,var(--spui-ui-text,#242424));font:inherit}slot{display:contents}@media(forced-colors:active){:host{border-color:CanvasText;color:CanvasText}}`;
      this.slotElement = document.createElement("slot");
      shadow.append(style, this.slotElement);
    }
  }
  customElements.define("spui-menu-bar", SpuiMenuBar);
}
