import { base } from "./shared.js";

export type NavItemSelectData = { value: string; href: string | null; label: string; categoryValue?: string; event: MouseEvent; type: "click" };
export type NavCategoryToggleData = { value: string; categoryValue?: string; open: boolean; openCategories: string[]; event: MouseEvent; type: "click" };

let nextNavId = 0;

export function defineNav(): void {
  defineNavItem(); defineAppItem(); defineAppItemStatic(); defineSplitNavItem(); defineHamburger(); defineNavDrawer(); defineNavDrawerHeader(); defineNavDrawerBody(); defineNavDrawerFooter(); defineNavCategory(); defineNavCategoryItem(); defineNavSubItemGroup(); defineNavSubItem(); defineNavDivider(); defineNavSectionHeader();
  if (customElements.get("spui-nav")) return;
  class SpuiNav extends HTMLElement {
    static observedAttributes = ["label", "aria-label", "density", "multiple", "tabbable", "open", "open-label", "close-label", "collapsible", "collapsed", "expand-label", "collapse-label"];
    private observer?: MutationObserver;
    private events?: AbortController;
    private breakpoint?: MediaQueryList;
    private current: string | null = null;
    private currentCategory: string | null = null;
    private currentControlled = false;
    private currentCategoryControlled = false;
    private categoriesOpen = new Set<string>();
    private categoriesOpenControlled = false;
    private drawerOpenControlled = false;
    private drawerOpen = false;
    private reflectingOpen = false;
    private collapsedControlled = false;
    private reflectingCollapsed = false;
    private nextGroupId = 0;
    get open(): boolean { return this.drawerOpen; }
    set open(value: boolean) { this.drawerOpenControlled = true; this.setDrawerOpen(Boolean(value)); }
    get defaultOpen(): boolean { return this.drawerOpen; }
    set defaultOpen(value: boolean) { if (!this.drawerOpenControlled) this.setDrawerOpen(Boolean(value)); }
    get collapsed(): boolean { return this.hasAttribute("collapsed"); }
    set collapsed(value: boolean) { this.collapsedControlled = true; this.setCollapsed(Boolean(value)); }
    get defaultCollapsed(): boolean { return this.collapsed; }
    set defaultCollapsed(value: boolean) { if (!this.collapsedControlled) this.setCollapsed(Boolean(value)); }
    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.observer = new MutationObserver(() => this.sync());
      this.observer.observe(this, { childList: true, subtree: true });
      this.events?.abort(); this.events = new AbortController();
      this.breakpoint?.removeEventListener("change", this.onBreakpointChange);
      this.breakpoint = window.matchMedia("(max-width: 640px)");
      this.breakpoint.addEventListener("change", this.onBreakpointChange);
      window.addEventListener("resize", this.onBreakpointChange);
      this.addEventListener("click", event => this.onClick(event), { signal: this.events.signal });
      this.addEventListener("keydown", event => {
        if (this.handleRovingKeydown(event as KeyboardEvent)) return;
        if (event.key !== "Escape" || !this.drawerOpen) return;
        if (this.getAttribute("data-drawer-type") === "inline") this.requestOpen(false);
        requestAnimationFrame(() => this.shadowRoot?.querySelector<HTMLButtonElement>(".mobile-toggle")?.focus());
      }, { signal: this.events.signal });
      this.addEventListener("focusin", event => this.syncTabStops(event.composedPath().find(node => node instanceof HTMLElement && this.navControl(node)) as HTMLElement | undefined), { signal: this.events.signal });
      const nav = this.shadowRoot?.querySelector<HTMLElement>("nav");
      nav?.addEventListener("toggle", () => this.onPopoverToggle(), { signal: this.events.signal });
      this.sync();
      this.syncResponsive();
    }
    disconnectedCallback(): void { this.observer?.disconnect(); this.events?.abort(); this.breakpoint?.removeEventListener("change", this.onBreakpointChange); window.removeEventListener("resize", this.onBreakpointChange); }
    attributeChangedCallback(name: string): void {
      if (name === "open" && !this.reflectingOpen) { this.drawerOpenControlled = true; this.drawerOpen = this.hasAttribute("open"); }
      if (name === "collapsed" && !this.reflectingCollapsed) this.syncResponsive();
      if (!this.isConnected) return;
      if (name === "label" || name === "aria-label") this.shadowRoot?.querySelector("nav")?.setAttribute("aria-label", this.getAttribute("aria-label") ?? this.getAttribute("label") ?? "Navigation");
      this.sync();
    }
    get selectedValue(): string | null { return this.current; }
    set selectedValue(value: string | null) { this.currentControlled = true; this.current = value; this.sync(); }
    get defaultSelectedValue(): string | null { return this.current; }
    set defaultSelectedValue(value: string | null) { if (!this.currentControlled) { this.current = value; this.sync(); } }
    get selectedCategoryValue(): string | null { return this.currentCategory; }
    set selectedCategoryValue(value: string | null) { this.currentCategoryControlled = true; this.currentCategory = value; this.sync(); }
    get defaultSelectedCategoryValue(): string | null { return this.currentCategory; }
    set defaultSelectedCategoryValue(value: string | null) { if (!this.currentCategoryControlled) { this.currentCategory = value; this.sync(); } }
    get openCategories(): string[] { return [...this.categoriesOpen]; }
    set openCategories(values: readonly string[]) { this.categoriesOpenControlled = true; this.categoriesOpen = new Set(values); this.sync(); }
    get defaultOpenCategories(): string[] { return [...this.categoriesOpen]; }
    set defaultOpenCategories(values: readonly string[]) { if (!this.categoriesOpenControlled) { this.categoriesOpen = new Set(this.allowsMultipleCategories() ? values : values.slice(0, 1)); this.sync(); } }
    private allowsMultipleCategories(): boolean { return this.getAttribute("multiple") !== "false"; }
    private readonly onBreakpointChange = (): void => {
      if (!this.breakpoint?.matches && this.drawerOpen) this.requestOpen(false);
      this.syncResponsive();
    };
    private navControls(): HTMLElement[] {
      return [...this.querySelectorAll<HTMLElement>("spui-nav-item, spui-app-item, spui-nav-sub-item, spui-nav-category-item")].filter(host => {
        if (host.hasAttribute("disabled") || (host.closest("spui-nav-sub-item-group") as HTMLElement | null)?.hidden) return false;
        return Boolean(this.navControl(host));
      });
    }
    private navControl(host: HTMLElement): HTMLElement | null { return host.shadowRoot?.querySelector<HTMLElement>("a,button") ?? null; }
    private syncTabStops(preferred?: HTMLElement): void {
      const items = this.navControls();
      const roving = this.getAttribute("tabbable") === "false";
      const active = preferred ?? items.find(item => item.shadowRoot?.activeElement) ?? items.find(item => item.hasAttribute("selected")) ?? items[0];
      for (const item of items) this.navControl(item)?.setAttribute("tabindex", String(!roving || item === active ? 0 : -1));
    }
    private handleRovingKeydown(event: KeyboardEvent): boolean {
      if (this.getAttribute("tabbable") !== "false") return false;
      const host = event.composedPath().find(node => node instanceof HTMLElement && this.navControl(node)) as HTMLElement | undefined;
      if (!host) return false;
      const items = this.navControls();
      const current = items.indexOf(host);
      if (current < 0) return false;
      let next = current;
      if (event.key === "ArrowDown") next = Math.min(items.length - 1, current + 1);
      else if (event.key === "ArrowUp") next = Math.max(0, current - 1);
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      else return false;
      event.preventDefault();
      this.syncTabStops(items[next]);
      this.navControl(items[next])?.focus();
      return true;
    }
    private setDrawerOpen(value: boolean, notify = false): void {
      if (value === this.drawerOpen) { this.syncResponsive(); return; }
      this.drawerOpen = value;
      this.reflectingOpen = true; this.toggleAttribute("open", value); this.reflectingOpen = false;
      this.syncResponsive();
      if (notify) this.dispatchEvent(new CustomEvent("spui-nav-open-change", { bubbles: true, composed: true, detail: { open: value } }));
    }
    private requestOpen(value: boolean): void {
      if (this.drawerOpenControlled) {
        if (value !== this.drawerOpen) this.dispatchEvent(new CustomEvent("spui-nav-open-change", { bubbles: true, composed: true, detail: { open: value } }));
      } else this.setDrawerOpen(value, true);
    }
    private onPopoverToggle(): void {
      const nav = this.shadowRoot?.querySelector<HTMLElement>("nav");
      const value = nav?.matches(":popover-open") ?? false;
      if (value === this.drawerOpen) return;
      if (this.drawerOpenControlled) this.dispatchEvent(new CustomEvent("spui-nav-open-change", { bubbles: true, composed: true, detail: { open: value } }));
      else this.setDrawerOpen(value, true);
    }
    private syncResponsive(): void {
      const nav = this.shadowRoot?.querySelector<HTMLElement>("nav");
      const toggle = this.shadowRoot?.querySelector<HTMLButtonElement>(".mobile-toggle");
      const close = this.shadowRoot?.querySelector<HTMLButtonElement>(".mobile-close");
      const railToggle = this.shadowRoot?.querySelector<HTMLButtonElement>(".rail-toggle");
      if (!nav || !toggle || !close || !railToggle) return;
      const mobile = this.breakpoint?.matches ?? window.matchMedia("(max-width: 640px)").matches;
      const inlineDrawer = this.getAttribute("data-drawer-type") === "inline";
      this.toggleAttribute("data-mobile", mobile);
      this.toggleAttribute("data-collapsed", !mobile && this.collapsed);
      this.dataset.direction = getComputedStyle(this).direction;
      toggle.hidden = !mobile;
      toggle.setAttribute("aria-expanded", String(mobile && this.drawerOpen));
      toggle.setAttribute("aria-label", this.drawerOpen ? this.getAttribute("close-label") ?? "Close navigation" : this.getAttribute("open-label") ?? "Open navigation");
      close.setAttribute("aria-label", this.getAttribute("close-label") ?? "Close navigation");
      close.hidden = !mobile;
      railToggle.hidden = mobile || !this.hasAttribute("collapsible");
      railToggle.setAttribute("aria-expanded", String(!this.collapsed));
      railToggle.setAttribute("aria-label", this.getAttribute(this.collapsed ? "expand-label" : "collapse-label") ?? (this.collapsed ? "Expand navigation" : "Collapse navigation"));
      railToggle.title = this.getAttribute(this.collapsed ? "expand-label" : "collapse-label") ?? (this.collapsed ? "Expand navigation" : "Collapse navigation");
      for (const item of this.querySelectorAll<HTMLElement>("spui-nav-item, spui-app-item, spui-nav-sub-item, spui-nav-category-item, spui-nav-sub-item-group, spui-nav-divider, spui-nav-section-header")) item.toggleAttribute("compact", !mobile && this.collapsed);
      if (!mobile) {
        if (nav.matches(":popover-open")) nav.hidePopover();
        nav.removeAttribute("popover");
        nav.hidden = false;
      } else if (inlineDrawer) {
        if (nav.matches(":popover-open")) nav.hidePopover();
        nav.removeAttribute("popover");
        nav.hidden = !this.drawerOpen;
      } else if (typeof nav.showPopover === "function") {
        nav.hidden = false;
        if (!nav.hasAttribute("popover")) nav.setAttribute("popover", "auto");
        if (this.drawerOpen && !nav.matches(":popover-open")) nav.showPopover();
        else if (!this.drawerOpen && nav.matches(":popover-open")) nav.hidePopover();
      } else {
        this.toggleAttribute("data-popover-fallback", true);
        nav.hidden = !this.drawerOpen;
      }
    }
    private onClick(event: MouseEvent): void {
      const path = event.composedPath();
      const mobile = this.breakpoint?.matches ?? false;
      if (mobile && this.getAttribute("data-drawer-type") === "inline" && path.some(node => node instanceof HTMLElement && node.classList.contains("mobile-toggle"))) { event.preventDefault(); this.requestOpen(!this.drawerOpen); return; }
      if (mobile && this.getAttribute("data-drawer-type") === "inline" && path.some(node => node instanceof HTMLElement && node.classList.contains("mobile-close"))) { event.preventDefault(); this.requestOpen(false); this.shadowRoot?.querySelector<HTMLButtonElement>(".mobile-toggle")?.focus(); return; }
      if (path.some(node => node instanceof HTMLElement && node.classList.contains("rail-toggle"))) {
        const collapsed = !this.collapsed;
        if (this.collapsedControlled) this.dispatchEvent(new CustomEvent("spui-nav-collapsed-change", { bubbles: true, composed: true, detail: { collapsed } }));
        else this.setCollapsed(collapsed, true);
        return;
      }
      const categoryItem = path.find(node => node instanceof HTMLElement && node.localName === "spui-nav-category-item") as HTMLElement | undefined;
      if (categoryItem) {
        const category = categoryItem.parentElement?.closest("spui-nav-category") as HTMLElement | null;
        const value = category?.getAttribute("value") ?? "";
        if (!value || category?.hasAttribute("disabled")) return;
        if (!this.currentCategoryControlled) this.currentCategory = value;
        const next = new Set(this.categoriesOpen);
        if (next.has(value)) next.delete(value);
        else { if (!this.allowsMultipleCategories()) next.clear(); next.add(value); }
        if (!this.categoriesOpenControlled) this.categoriesOpen = next;
        this.sync();
        const categoryIndex = path.indexOf(category!);
        const parentCategory = categoryIndex >= 0 ? path.slice(categoryIndex + 1).find((node): node is HTMLElement => node instanceof HTMLElement && node.localName === "spui-nav-category") ?? null : null;
        this.dispatchEvent(new CustomEvent<NavCategoryToggleData>("spui-nav-category-toggle", { bubbles: true, composed: true, detail: { value, categoryValue: parentCategory?.getAttribute("value") ?? undefined, open: next.has(value), openCategories: [...next], event, type: "click" } }));
        return;
      }
      const item = path.find(node => node instanceof HTMLElement && (node.localName === "spui-nav-item" || node.localName === "spui-app-item" || node.localName === "spui-nav-sub-item")) as HTMLElement | undefined;
      if (!item) return;
      if (item.hasAttribute("disabled")) { event.preventDefault(); return; }
      const value = item.getAttribute("value") ?? "";
      if (!value) return;
        if (!this.currentControlled) this.current = value;
      this.sync();
      const category = path.find((node): node is HTMLElement => node instanceof HTMLElement && node.localName === "spui-nav-category") ?? null;
      this.dispatchEvent(new CustomEvent<NavItemSelectData>("spui-nav-item-select", { bubbles: true, composed: true, detail: { value, href: item.getAttribute("href"), label: item.textContent?.trim() ?? "", categoryValue: category?.getAttribute("value") ?? undefined, event, type: "click" } }));
        if (this.breakpoint?.matches && this.drawerOpen) this.requestOpen(false);
    }
    private setCollapsed(value: boolean, notify = false): void {
      if (value === this.collapsed) return;
      this.reflectingCollapsed = true; this.toggleAttribute("collapsed", value); this.reflectingCollapsed = false;
      this.sync();
      if (notify) this.dispatchEvent(new CustomEvent("spui-nav-collapsed-change", { bubbles: true, composed: true, detail: { collapsed: value } }));
    }
    private sync(): void {
      const nav = this.shadowRoot?.querySelector("nav");
      if (!nav) return;
      nav.setAttribute("aria-label", this.getAttribute("aria-label") ?? this.getAttribute("label") ?? "Navigation");
      let categories = 0;
      for (const category of this.querySelectorAll<HTMLElement>("spui-nav-category")) {
        const value = category.getAttribute("value") ?? "";
        const categoryItem = category.querySelector<HTMLElement>("spui-nav-category-item");
        const group = category.querySelector<HTMLElement>("spui-nav-sub-item-group");
        if (!category.dataset.spuiGroupId) category.dataset.spuiGroupId = `spui-nav-group-${++this.nextGroupId}`;
        const isOpen = this.categoriesOpen.has(value);
        if (categoryItem) { categoryItem.toggleAttribute("expanded", isOpen); categoryItem.toggleAttribute("disabled", category.hasAttribute("disabled")); categoryItem.setAttribute("controls", category.dataset.spuiGroupId); }
        if (group) { group.id = category.dataset.spuiGroupId; const navGroup = group as HTMLElement & { setExpanded?: (open: boolean) => void }; if (navGroup.setExpanded) navGroup.setExpanded(isOpen); else group.hidden = !isOpen; }
        categories++;
      }
      for (const item of this.querySelectorAll<HTMLElement>("spui-nav-item, spui-app-item, spui-nav-sub-item")) {
        const selected = item.getAttribute("value") === this.current;
        item.toggleAttribute("selected", selected);
      }
      for (const category of this.querySelectorAll<HTMLElement>("spui-nav-category")) {
        const selected = category.getAttribute("value") === this.currentCategory;
        category.toggleAttribute("selected", selected);
        category.querySelector("spui-nav-category-item")?.toggleAttribute("selected", selected);
      }
      this.dataset.density = this.getAttribute("density") ?? "medium";
      this.toggleAttribute("data-has-categories", categories > 0);
      this.syncTabStops();
      this.syncResponsive();
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const nav = document.createElement("nav"); nav.setAttribute("aria-label", this.getAttribute("aria-label") ?? this.getAttribute("label") ?? "Navigation"); nav.part.add("navigation");
      nav.id = this.id ? `${this.id}-panel` : `spui-nav-panel-${++nextNavId}`;
      const mobileHeader = document.createElement("div"); mobileHeader.className = "mobile-header"; mobileHeader.part.add("mobile-header");
      const mobileTitle = document.createElement("span"); mobileTitle.textContent = this.getAttribute("label") ?? "Navigation";
      const closeButton = document.createElement("button"); closeButton.type = "button"; closeButton.className = "mobile-close"; closeButton.part.add("mobile-close"); closeButton.setAttribute("popovertarget", nav.id); closeButton.setAttribute("popovertargetaction", "hide"); closeButton.setAttribute("aria-label", this.getAttribute("close-label") ?? "Close navigation");
      const closeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); closeIcon.setAttribute("viewBox", "0 0 24 24"); closeIcon.setAttribute("width", "20"); closeIcon.setAttribute("height", "20"); closeIcon.setAttribute("aria-hidden", "true");
      const closePath = document.createElementNS("http://www.w3.org/2000/svg", "path"); closePath.setAttribute("d", "M5 5l14 14M19 5 5 19"); closePath.setAttribute("fill", "none"); closePath.setAttribute("stroke", "currentColor"); closePath.setAttribute("stroke-width", "1.8"); closePath.setAttribute("stroke-linecap", "round"); closeIcon.append(closePath); closeButton.append(closeIcon); mobileHeader.append(mobileTitle, closeButton);
      const slot = document.createElement("slot"); nav.append(slot);
      nav.prepend(mobileHeader);
      const railToggle = document.createElement("button"); railToggle.type = "button"; railToggle.className = "rail-toggle"; railToggle.part.add("rail-toggle"); railToggle.setAttribute("aria-controls", nav.id); railToggle.setAttribute("aria-expanded", String(!this.collapsed)); railToggle.setAttribute("aria-label", this.getAttribute("collapse-label") ?? "Collapse navigation");
      const railIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); railIcon.setAttribute("viewBox", "0 0 24 24"); railIcon.setAttribute("width", "18"); railIcon.setAttribute("height", "18"); railIcon.setAttribute("aria-hidden", "true"); const railPath = document.createElementNS("http://www.w3.org/2000/svg", "path"); railPath.setAttribute("d", "M14 5 7 12l7 7"); railPath.setAttribute("fill", "none"); railPath.setAttribute("stroke", "currentColor"); railPath.setAttribute("stroke-width", "2"); railPath.setAttribute("stroke-linecap", "round"); railPath.setAttribute("stroke-linejoin", "round"); railIcon.append(railPath); railToggle.append(railIcon);
      const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "mobile-toggle"; toggle.part.add("mobile-toggle"); toggle.setAttribute("popovertarget", nav.id); toggle.setAttribute("popovertargetaction", "toggle"); toggle.setAttribute("aria-controls", nav.id); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", this.getAttribute("open-label") ?? "Open navigation");
      const menuIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); menuIcon.setAttribute("viewBox", "0 0 24 24"); menuIcon.setAttribute("width", "22"); menuIcon.setAttribute("height", "22"); menuIcon.setAttribute("aria-hidden", "true");
      const menuPath = document.createElementNS("http://www.w3.org/2000/svg", "path"); menuPath.setAttribute("d", "M4 6h16M4 12h16M4 18h16"); menuPath.setAttribute("fill", "none"); menuPath.setAttribute("stroke", "currentColor"); menuPath.setAttribute("stroke-width", "1.8"); menuPath.setAttribute("stroke-linecap", "round"); menuIcon.append(menuPath); toggle.append(menuIcon);
      const style = document.createElement("style");
      style.textContent = `${base}
        :host{display:block;width:var(--spui-nav-width,260px);max-width:100%;min-width:0;color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font:inherit}:host([data-collapsed]){width:var(--spui-nav-collapsed-width,64px)}
        nav{display:grid;grid-template-columns:minmax(0,1fr);gap:2px;width:100%;min-width:0;font-family:var(--spui-font-family,inherit);font-size:var(--spui-nav-font-size,14px);color:inherit}nav[hidden]{display:none}nav slot{min-width:0}
        :host([density=small]) nav{--spui-nav-item-block:5px;--spui-nav-font-size:13px}
        :host([density=large]) nav{--spui-nav-item-block:10px;--spui-nav-font-size:15px}
        .mobile-toggle,.mobile-header{display:none}.rail-toggle{box-sizing:border-box;display:flex;align-items:center;justify-content:flex-start;width:100%;min-height:36px;padding:6px 12px;border:0;border-radius:var(--spui-control-radius,6px);background:transparent;color:inherit;cursor:pointer}.rail-toggle:hover{background:var(--spui-ui-surface-hover,var(--spui-semantic-subtle-background,#f5f5f5))}.rail-toggle:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#005a9e));outline-offset:2px}.rail-toggle[hidden]{display:none}.rail-toggle svg{transition:transform var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}:host([data-collapsed]) .rail-toggle{justify-content:center;padding-inline:4px}:host([data-collapsed][data-direction=ltr]) .rail-toggle svg,:host([data-direction=rtl]) .rail-toggle svg{transform:rotate(180deg)}:host([data-collapsed][data-direction=rtl]) .rail-toggle svg{transform:none}
        .mobile-toggle[hidden],.mobile-close[hidden]{display:none}
        .mobile-toggle,.mobile-close{box-sizing:border-box;place-items:center;width:44px;height:44px;border:0;border-radius:var(--spui-control-radius,6px);background:transparent;color:inherit;cursor:pointer}
        .mobile-toggle:hover,.mobile-close:hover{background:var(--spui-ui-surface-hover,var(--spui-semantic-subtle-background,#f5f5f5))}
        .mobile-toggle:focus-visible,.mobile-close:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#005a9e));outline-offset:2px}
        .mobile-header{align-items:center;justify-content:space-between;gap:12px;min-height:44px;margin:0 0 8px;padding-block-end:8px;border-block-end:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));font-weight:600}
        .mobile-header[part]{min-width:0}
        .mobile-header span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        ::slotted(spui-nav-item),::slotted(spui-nav-category),::slotted(spui-nav-divider),::slotted(spui-nav-section-header){min-width:0}
        @media(max-width:640px){
          :host{width:auto;max-width:none}
          .mobile-toggle{display:grid}
          :host([data-drawer-type=inline]) nav{box-sizing:border-box;width:100%;padding:8px 12px;border:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));border-radius:var(--spui-surface-radius,var(--spui-card-radius,8px));background:var(--spui-ui-surface,var(--spui-semantic-card-background,#fff))}
          :host([data-drawer-type=inline]) .mobile-header{display:flex}
          nav[popover]:popover-open{position:fixed;inset-block:0;inset-inline:0 auto;box-sizing:border-box;display:grid;align-content:start;gap:2px;width:min(var(--spui-nav-width,260px),calc(100vw - 32px));height:100dvh;max-height:none;margin:0;padding:8px 12px;overflow:auto;border:0;border-inline-end:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));background:var(--spui-card-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));box-shadow:0 12px 36px color-mix(in srgb,var(--spui-ui-text,#242424) 20%,transparent)}
          nav[popover]:popover-open .mobile-header{display:flex}
          nav[popover]::backdrop{background:color-mix(in srgb,var(--spui-ui-text,#242424) 36%,transparent);backdrop-filter:blur(1px)}
          :host([data-direction=rtl]) nav[popover]:popover-open{border-inline-end:0;border-inline-start:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}
        }
        @media(prefers-reduced-motion:reduce){.rail-toggle svg{transition:none}}
        @media(forced-colors:active){nav{color:CanvasText}nav[popover]:popover-open{border:1px solid CanvasText;background:Canvas;color:CanvasText;box-shadow:none}nav[popover]::backdrop{background:Canvas}}
      `;
      shadow.append(style, toggle, railToggle, nav);
    }
  }
  customElements.define("spui-nav", SpuiNav);
}

function defineNavItemElement(tag: "spui-nav-item" | "spui-nav-sub-item" | "spui-app-item"): void {
  if (customElements.get(tag)) return;
  class SpuiNavItem extends HTMLElement {
    static observedAttributes = ["href", "disabled", "selected", "value", "compact", "aria-label"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      const action = this.shadowRoot?.querySelector<HTMLElement>("a,button"); if (!action) return;
      const href = this.getAttribute("href");
      if (href && action.localName === "a") action.setAttribute("href", href); else if (href && action.localName === "button") { const anchor = document.createElement("a"); anchor.setAttribute("href", href); anchor.part.add("action"); anchor.innerHTML = "<slot name=avatar></slot><slot name=icon></slot><span part=label><slot></slot></span><span part=compact-fallback aria-hidden=true></span>"; action.replaceWith(anchor); }
      else if (!href && action.localName === "a") { const button = document.createElement("button"); button.type = "button"; button.part.add("action"); button.innerHTML = "<slot name=avatar></slot><slot name=icon></slot><span part=label><slot></slot></span><span part=compact-fallback aria-hidden=true></span>"; action.replaceWith(button); }
      const control = this.shadowRoot?.querySelector<HTMLElement>("a,button"); if (!control) return;
      if (control.localName === "button") (control as HTMLButtonElement).disabled = this.hasAttribute("disabled");
      else { if (this.hasAttribute("disabled")) { control.setAttribute("aria-disabled", "true"); control.setAttribute("tabindex", "-1"); } else { control.removeAttribute("aria-disabled"); control.removeAttribute("tabindex"); } }
      if (this.hasAttribute("selected")) control.setAttribute("aria-current", "page"); else control.removeAttribute("aria-current");
      const label = this.getAttribute("aria-label") ?? this.textContent?.trim() ?? "";
      control.setAttribute("aria-label", label);
      control.title = this.hasAttribute("compact") ? label : "";
      const fallback = control.querySelector<HTMLElement>("[part=compact-fallback]");
      if (fallback) { fallback.textContent = Array.from(label)[0] ?? ""; fallback.hidden = Boolean(this.querySelector('[slot="icon"],[slot="avatar"]')); }
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const control = this.hasAttribute("href") ? document.createElement("a") : document.createElement("button");
      if (control.localName === "button") (control as HTMLButtonElement).type = "button";
      control.part.add("action"); control.innerHTML = "<slot name=avatar></slot><slot name=icon></slot><span part=label><slot></slot></span><span part=compact-fallback aria-hidden=true></span>";
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0}a,button{box-sizing:border-box;display:flex;align-items:center;gap:12px;width:100%;min-height:36px;padding:var(--spui-nav-item-block,7px) 12px;border:0;border-radius:var(--spui-nav-item-radius,5px);background:transparent;color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font:inherit;text-align:start;text-decoration:none;cursor:pointer}a:hover,button:hover{background:var(--spui-ui-surface-hover,var(--spui-semantic-subtle-background,#f5f5f5))}:host([selected]) a,:host([selected]) button{background:color-mix(in srgb,var(--spui-ui-accent,#78716c) 12%,var(--spui-ui-surface,#fff));font-weight:600}:host([disabled]) a,:host([disabled]) button{opacity:.55;cursor:not-allowed}a:focus-visible,button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#005a9e));outline-offset:2px}::slotted([slot=icon]){inline-size:20px;block-size:20px;flex:none}::slotted([slot=avatar]){inline-size:28px;block-size:28px;flex:none}[part=compact-fallback]{display:none}:host([compact]) a,:host([compact]) button{justify-content:center;gap:0;padding-inline:4px}:host([compact]) [part=label]{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}:host([compact]) [part=compact-fallback]:not([hidden]){display:grid;place-items:center;inline-size:28px;block-size:28px;border-radius:50%;background:var(--spui-ui-surface-hover,var(--spui-semantic-subtle-background,#f5f5f5));font-size:12px;font-weight:600}:host(spui-nav-sub-item){padding-inline-start:14px}:host(spui-app-item) a,:host(spui-app-item) button{font-weight:600}:host(spui-app-item) [part=label]{font-size:var(--spui-nav-app-item-font-size,15px)}@media(forced-colors:active){a,button{color:LinkText}:host([selected]) a,:host([selected]) button{outline:1px solid Highlight}}`;
      shadow.append(style, control);
    }
  }
  customElements.define(tag, SpuiNavItem);
}

export function defineNavItem(): void { defineNavItemElement("spui-nav-item"); }
export function defineNavSubItem(): void { defineNavItemElement("spui-nav-sub-item"); }
export function defineAppItem(): void { defineNavItemElement("spui-app-item"); }

function defineNavPart(tag: string, styleText: string, role?: string): void {
  if (customElements.get(tag)) return;
  class SpuiNavPart extends HTMLElement {
    connectedCallback(): void {
      if (role) this.setAttribute("role", role);
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}${styleText}`;
      shadow.append(style, document.createElement("slot"));
    }
  }
  customElements.define(tag, SpuiNavPart);
}

export function defineAppItemStatic(): void {
  defineNavPart("spui-app-item-static", ":host{box-sizing:border-box;display:flex;align-items:center;gap:12px;min-height:40px;padding:8px 12px;color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font:600 15px/1.3 var(--spui-font-family,inherit)}::slotted([slot=icon]){inline-size:20px;block-size:20px;flex:none}");
}
export function defineSplitNavItem(): void {
  if (customElements.get("spui-split-nav-item")) return;
  class SpuiSplitNavItem extends HTMLElement {
    connectedCallback(): void { if (this.shadowRoot) return; const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style"); style.textContent = `${base}:host{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;align-items:center;min-width:0}slot[name=action],slot[name=menu-button],slot[name=toggle-button]{display:grid;place-items:center}::slotted(spui-nav-item),::slotted(spui-nav-sub-item){min-width:0}::slotted([slot=action]),::slotted([slot=menu-button]),::slotted([slot=toggle-button]){min-width:36px;min-height:36px}`; shadow.append(style, document.createElement("slot"), Object.assign(document.createElement("slot"), { name: "action" }), Object.assign(document.createElement("slot"), { name: "menu-button" }), Object.assign(document.createElement("slot"), { name: "toggle-button" })); }
  }
  customElements.define("spui-split-nav-item", SpuiSplitNavItem);
}
export function defineHamburger(): void {
  if (customElements.get("spui-hamburger")) return;
  class SpuiHamburger extends HTMLElement {
    static observedAttributes = ["disabled", "aria-label"];
    connectedCallback(): void { this.setAttribute("role", "button"); this.setAttribute("tabindex", this.hasAttribute("disabled") ? "-1" : "0"); if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Toggle navigation"); if (!this.shadowRoot) { const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style"); style.textContent = `${base}:host{box-sizing:border-box;display:inline-grid;place-items:center;min-width:44px;min-height:44px;padding:8px;border-radius:var(--spui-control-radius,6px);color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));cursor:pointer}:host(:hover){background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}:host(:focus-visible){outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#78716c));outline-offset:2px}:host([disabled]){opacity:.55;cursor:not-allowed}::slotted(svg){width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}@media(forced-colors:active){:host(:focus-visible){outline-color:Highlight}}`; const icon = document.createElement("slot"); icon.name = "icon"; shadow.append(style, icon, document.createElement("slot")); } }
    attributeChangedCallback(): void { if (this.isConnected) this.setAttribute("tabindex", this.hasAttribute("disabled") ? "-1" : "0"); }
    constructor() { super(); this.addEventListener("keydown", event => { if (this.hasAttribute("disabled")) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.click(); } }); this.addEventListener("click", event => { if (this.hasAttribute("disabled")) event.preventDefault(); }); }
  }
  customElements.define("spui-hamburger", SpuiHamburger);
}
export function defineNavDrawer(): void { defineNavPart("spui-nav-drawer", ":host{display:block;min-width:0}"); }
export function defineNavDrawerHeader(): void { defineNavPart("spui-nav-drawer-header", ":host{display:flex;align-items:center;gap:12px;min-height:44px;padding:8px 12px;border-block-end:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));font-weight:600}"); }
export function defineNavDrawerBody(): void { defineNavPart("spui-nav-drawer-body", ":host{display:grid;align-content:start;gap:2px;min-width:0}"); }
export function defineNavDrawerFooter(): void { defineNavPart("spui-nav-drawer-footer", ":host{display:grid;gap:4px;margin-block-start:auto;padding:8px 0;border-block-start:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}"); }

export function defineNavCategory(): void {
  if (customElements.get("spui-nav-category")) return;
  class SpuiNavCategory extends HTMLElement {
    connectedCallback(): void { if (!this.shadowRoot) { const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0}`; shadow.append(style, document.createElement("slot")); } }
  }
  customElements.define("spui-nav-category", SpuiNavCategory);
}

export function defineNavCategoryItem(): void {
  if (customElements.get("spui-nav-category-item")) return;
  class SpuiNavCategoryItem extends HTMLElement {
    static observedAttributes = ["expanded", "controls", "disabled", "compact", "selected", "aria-label"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void { const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button"); if (!button) return; button.setAttribute("aria-expanded", String(this.hasAttribute("expanded"))); if (this.hasAttribute("selected")) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); const controls = this.getAttribute("controls"); if (controls) button.setAttribute("aria-controls", controls); button.disabled = this.hasAttribute("disabled"); const defaultSlot = button.querySelector<HTMLSlotElement>("slot:not([name])"); const label = this.getAttribute("aria-label") ?? defaultSlot?.assignedNodes({ flatten: true }).map(node => node.textContent ?? "").join("").trim() ?? ""; button.setAttribute("aria-label", label); button.title = this.hasAttribute("compact") ? label : ""; const fallback = button.querySelector<HTMLElement>("[part=compact-fallback]"); if (fallback) { fallback.textContent = Array.from(label)[0] ?? ""; fallback.hidden = Boolean(this.querySelector('[slot="icon"],[slot="avatar"]')); } }
    private render(): void { const shadow = this.attachShadow({ mode: "open" }); const button = document.createElement("button"); button.type = "button"; button.part.add("action"); button.innerHTML = "<slot name=avatar></slot><slot name=icon></slot><span part=label><slot></slot></span><span part=compact-fallback aria-hidden=true></span><span aria-hidden=true part=chevron><slot name=expand-icon></slot></span>"; const chevron = button.querySelector<HTMLElement>("[part=chevron]")!; const expandIconSlot = button.querySelector<HTMLSlotElement>('slot[name="expand-icon"]')!; expandIconSlot.addEventListener("slotchange", () => chevron.classList.toggle("custom", expandIconSlot.assignedNodes({ flatten: true }).length > 0)); button.querySelector<HTMLSlotElement>("slot:not([name])")?.addEventListener("slotchange", () => this.sync()); const style = document.createElement("style"); style.textContent = `${base}:host{display:block}button{box-sizing:border-box;display:flex;align-items:center;gap:12px;width:100%;min-height:36px;padding:var(--spui-nav-item-block,7px) 12px;border:0;border-radius:var(--spui-nav-item-radius,5px);background:transparent;color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font:inherit;text-align:start;cursor:pointer}button:hover{background:var(--spui-ui-hover,var(--spui-semantic-subtle-background,#f5f5f5))}button[aria-current=page]{background:color-mix(in srgb,var(--spui-ui-accent,#78716c) 12%,var(--spui-ui-surface,#fff));font-weight:600}button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#005a9e));outline-offset:2px}::slotted([slot=avatar]){inline-size:28px;block-size:28px;flex:none}[part=compact-fallback]{display:none}:host([compact]) button{justify-content:center;gap:0;padding-inline:4px}:host([compact]) [part=label]{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}:host([compact]) [part=compact-fallback]:not([hidden]){display:grid;place-items:center;inline-size:28px;block-size:28px;border-radius:50%;background:var(--spui-ui-surface-hover,var(--spui-semantic-subtle-background,#f5f5f5));font-size:12px;font-weight:600}:host([compact]) [part=chevron]{display:none}span[part=chevron]:not(.custom){box-sizing:border-box;width:7px;height:7px;margin-inline-start:auto;border:solid currentColor;border-width:0 1.5px 1.5px 0;transform:translateY(-2px) rotate(45deg);transition:transform var(--spui-motion-duration-fast,.12s) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}:host([expanded]) span[part=chevron]:not(.custom){transform:translateY(2px) rotate(225deg)}span[part=chevron].custom{display:inline-flex;align-items:center;justify-content:center;flex:none;margin-inline-start:auto}:host([disabled]) button{opacity:.55;cursor:not-allowed}@media(prefers-reduced-motion:reduce){span[part=chevron]:not(.custom){transition:none}}@media(forced-colors:active){button{color:ButtonText}}`; shadow.append(style, button); }
  }
  customElements.define("spui-nav-category-item", SpuiNavCategoryItem);
}

export function defineNavSubItemGroup(): void {
  if (customElements.get("spui-nav-sub-item-group")) return;
  class SpuiNavSubItemGroup extends HTMLElement {
    private expanded = false;
    private exitPending = false;
    private exitGeneration = 0;
    private hasSynced = false;
    connectedCallback(): void {
      if (!this.shadowRoot) { const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style"); style.textContent = `${base}:host{display:grid;gap:2px;padding-inline-start:16px}:host([compact]){padding-inline-start:0}:host([hidden]){display:none}`; shadow.append(style, document.createElement("slot")); }
    }
    setExpanded(open: boolean): void {
      if (!this.hasSynced) {
        this.hasSynced = true;
        this.expanded = open;
        this.hidden = !open;
        this.inert = !open;
        if (open) this.removeAttribute("aria-hidden"); else this.setAttribute("aria-hidden", "true");
        this.toggleAttribute("motion-visible", open);
        return;
      }
      this.expanded = open;
      this.toggleAttribute("motion-visible", open);
      if (open) {
        this.exitGeneration++;
        this.exitPending = false;
        this.hidden = false;
        this.inert = false;
        this.removeAttribute("aria-hidden");
        return;
      }
      if (!this.hasAttribute("motion") || this.hidden) { this.exitPending = false; this.hidden = true; return; }
      this.exitPending = true;
      this.hidden = false;
      this.inert = true;
      this.setAttribute("aria-hidden", "true");
      const generation = ++this.exitGeneration;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const animations = new Set<Animation>();
        const visit = (element: Element): void => {
          for (const animation of element.getAnimations()) if (animation.playState === "running") animations.add(animation);
          if (element.shadowRoot) for (const child of element.shadowRoot.children) visit(child);
          if (element instanceof HTMLSlotElement) for (const child of element.assignedElements({ flatten: true })) visit(child);
          for (const child of element.children) visit(child);
        };
        visit(this);
        const finish = (): void => {
          if (generation !== this.exitGeneration || this.expanded || !this.exitPending) return;
          this.exitPending = false;
          this.hidden = true;
        };
        if (animations.size) void Promise.allSettled([...animations].map(animation => animation.finished)).then(finish);
        else finish();
      }));
    }
  }
  customElements.define("spui-nav-sub-item-group", SpuiNavSubItemGroup);
}

export function defineNavDivider(): void {
  if (customElements.get("spui-nav-divider")) return;
  class SpuiNavDivider extends HTMLElement { connectedCallback(): void { this.setAttribute("role", "separator"); if (!this.shadowRoot) { const shadow = this.attachShadow({ mode: "open" }); const slot = document.createElement("slot"); slot.name = "wrapper"; const line = document.createElement("div"); line.part.add("divider"); slot.append(line); const style = document.createElement("style"); style.textContent = `${base}:host{display:block;height:1px;margin:6px 12px}:host([compact]){margin-inline:8px}[part=divider]{height:1px;background:var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}@media(forced-colors:active){[part=divider]{background:CanvasText}}`; shadow.append(style, slot); } } }
  customElements.define("spui-nav-divider", SpuiNavDivider);
}

export function defineNavSectionHeader(): void {
  if (customElements.get("spui-nav-section-header")) return;
  class SpuiNavSectionHeader extends HTMLElement { connectedCallback(): void { if (!this.hasAttribute("role")) this.setAttribute("role", "heading"); if (!this.hasAttribute("aria-level")) this.setAttribute("aria-level", "3"); if (!this.shadowRoot) { const shadow = this.attachShadow({ mode: "open" }); const label = document.createElement("slot"); const style = document.createElement("style"); style.textContent = `${base}:host{display:block;padding:12px 12px 4px;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));font:600 12px/1.3 var(--spui-font-family,inherit);letter-spacing:.02em;text-transform:uppercase}:host([compact]){display:none}`; shadow.append(style, label); } } }
  customElements.define("spui-nav-section-header", SpuiNavSectionHeader);
}
