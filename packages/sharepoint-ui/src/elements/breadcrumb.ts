import { base } from "./shared.js";
import { buttonControlCss } from "./button.js";

export function defineBreadcrumb(): void {
  if (customElements.get("spui-breadcrumb")) return;
  class SpuiBreadcrumb extends HTMLElement {
    static observedAttributes = ["label", "focus-mode", "size", "separator", "aria-label"];
    private observer?: MutationObserver;
    private events?: AbortController;

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.observer = new MutationObserver(() => this.syncItems());
      this.observer.observe(this, { childList: true, subtree: true });
      this.events?.abort();
      this.events = new AbortController();
      this.addEventListener("keydown", event => this.onKeyDown(event), { signal: this.events.signal });
      this.addEventListener("focusin", event => this.onFocusIn(event), { signal: this.events.signal });
      queueMicrotask(() => this.syncItems());
    }

    disconnectedCallback(): void { this.observer?.disconnect(); this.events?.abort(); }

    attributeChangedCallback(name: string): void {
      if (!this.isConnected) return;
      if (name === "label" || name === "aria-label") {
        const nav = this.shadowRoot?.querySelector("nav");
        const label = this.getAttribute("aria-label") ?? this.getAttribute("label") ?? "Breadcrumb";
        nav?.setAttribute("aria-label", label);
      }
      if (name === "separator") this.style.setProperty("--spui-breadcrumb-separator", JSON.stringify(this.getAttribute("separator") ?? "›"));
      if (name === "focus-mode") this.syncItems();
    }

    private listRoot(): HTMLElement { return this.querySelector<HTMLElement>(":scope > [slot=list]") ?? this; }
    private items(): HTMLElement[] { return [...this.listRoot().children].filter((child): child is HTMLElement => child.localName === "spui-breadcrumb-item"); }
    private linkFor(item: HTMLElement): HTMLElement | null {
      const child = [...item.children].find(element => element.localName === "spui-link" || element.localName === "spui-breadcrumb-button" || element.matches("a,button,[tabindex]")) as HTMLElement | undefined;
      if (!child) return null;
      return child.localName === "spui-link" || child.localName === "spui-breadcrumb-button" ? child.shadowRoot?.querySelector<HTMLElement>("a,button") ?? null : child;
    }
    private syncItems(): void {
      const items = this.items();
      const explicitDivider = [...this.listRoot().children].some(child => child.localName === "spui-breadcrumb-divider");
      items.forEach(item => explicitDivider ? item.setAttribute("data-explicit-divider", "") : item.removeAttribute("data-explicit-divider"));
      const links = items.map(item => this.linkFor(item));
      const active = links.findIndex(link => link?.matches(":focus"));
      if (active >= 0) this.dataset.rovingIndex = String(active);
      const selected = Math.max(0, Math.min(Number(this.dataset.rovingIndex ?? 0), Math.max(0, links.length - 1)));
      links.forEach((link, index) => {
        if (!link) return;
        if (!link.hasAttribute("data-spui-breadcrumb-tabindex")) link.setAttribute("data-spui-breadcrumb-tabindex", link.getAttribute("tabindex") ?? "__unset");
        if (this.getAttribute("focus-mode") === "arrow") link.tabIndex = index === selected ? 0 : -1;
        else {
          const original = link.getAttribute("data-spui-breadcrumb-tabindex");
          if (original === "__unset") link.removeAttribute("tabindex"); else if (original !== null) link.setAttribute("tabindex", original);
        }
      });
    }
    private onFocusIn(event: Event): void {
      const path = event.composedPath();
      const index = this.items().findIndex(item => path.includes(item));
      if (index >= 0 && this.getAttribute("focus-mode") === "arrow") { this.dataset.rovingIndex = String(index); this.syncItems(); }
    }
    private onKeyDown(event: KeyboardEvent): void {
      if (this.getAttribute("focus-mode") !== "arrow") return;
      const items = this.items();
      const links = items.map(item => this.linkFor(item));
      const actionable = links.flatMap((link, index) => link ? [index] : []);
      if (!actionable.length) return;
      const path = event.composedPath();
      const current = items.findIndex(item => path.includes(item));
      if (current < 0) return;
      const currentAction = actionable.indexOf(current);
      if (currentAction < 0) return;
      const rtl = getComputedStyle(this).direction === "rtl";
      let nextAction = -1;
      if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) nextAction = (currentAction + 1) % actionable.length;
      else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) nextAction = (currentAction - 1 + actionable.length) % actionable.length;
      else if (event.key === "Home") nextAction = 0;
      else if (event.key === "End") nextAction = actionable.length - 1;
      if (nextAction < 0) return;
      const next = actionable[nextAction];
      const link = links[next];
      if (!link) return;
      event.preventDefault();
      this.dataset.rovingIndex = String(next);
      this.syncItems();
      link.focus();
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const nav = document.createElement("nav");
      nav.setAttribute("aria-label", this.getAttribute("aria-label") ?? this.getAttribute("label") ?? "Breadcrumb");
      nav.part.add("navigation");
      const list = document.createElement("ol"); list.part.add("list"); list.setAttribute("role", "list"); list.append(document.createElement("slot"));
      const listSlot = document.createElement("slot"); listSlot.name = "list";
      listSlot.addEventListener("slotchange", () => {
        const assignedList = listSlot.assignedElements()[0];
        if (assignedList instanceof HTMLElement && !assignedList.hasAttribute("role")) assignedList.setAttribute("role", "list");
        this.syncItems();
      });
      listSlot.append(list);
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0;--spui-breadcrumb-separator:${JSON.stringify(this.getAttribute("separator") ?? "›")}}nav{min-width:0;color:var(--spui-ui-muted,var(--spui-semantic-body-text,#616161));font-family:var(--spui-font-family,inherit);font-size:var(--spui-breadcrumb-font-size,14px)}ol,::slotted([slot=list]){display:flex;flex-wrap:wrap;align-items:center;gap:0;min-width:0;margin:0;padding:0;list-style:none}:host([size=small]) nav{--spui-breadcrumb-font-size:12px}:host([size=large]) nav{--spui-breadcrumb-font-size:16px}:host([size=medium]),:host(:not([size])){--spui-breadcrumb-item-gap:10px}::slotted(spui-breadcrumb-item){--spui-breadcrumb-separator-gap:var(--spui-breadcrumb-item-gap,10px)}@media(forced-colors:active){nav{color:CanvasText}}`;
      nav.append(listSlot); shadow.append(style, nav);
    }
  }
  customElements.define("spui-breadcrumb", SpuiBreadcrumb);
}

export function defineBreadcrumbItem(): void {
  if (customElements.get("spui-breadcrumb-item")) return;
  class SpuiBreadcrumbItem extends HTMLElement {
    static observedAttributes = ["current", "size"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      this.setAttribute("role", "listitem");
      if (this.hasAttribute("current")) this.setAttribute("aria-current", "page");
      else if (this.getAttribute("aria-current") === "page") this.removeAttribute("aria-current");
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const slot = document.createElement("slot");
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex;flex:none;align-items:center;min-width:0;color:var(--spui-ui-muted,var(--spui-semantic-body-text,#616161));font:inherit}:host([current]){color:var(--spui-ui-text,var(--spui-semantic-body-text,#323130));font-weight:600}:host([size=small]){font-size:12px}:host([size=large]){font-size:16px}:host(:not(:last-child):not([data-explicit-divider]))::after{content:var(--spui-breadcrumb-separator,"›");display:inline-block;margin-inline-start:var(--spui-breadcrumb-separator-gap,10px);color:var(--spui-ui-stroke,var(--spui-semantic-body-divider,#a19f9d))}:host-context([dir=rtl]):not(:last-child):not([data-explicit-divider])::after{transform:scaleX(-1)}@media(forced-colors:active){:host{color:CanvasText}:host(:not(:last-child):not([data-explicit-divider]))::after{color:CanvasText}}`;
      shadow.append(style, slot);
    }
  }
  customElements.define("spui-breadcrumb-item", SpuiBreadcrumbItem);
}

export function defineBreadcrumbDivider(): void {
  if (customElements.get("spui-breadcrumb-divider")) return;
  class SpuiBreadcrumbDivider extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      this.setAttribute("role", "presentation");
      this.setAttribute("aria-hidden", "true");
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex;flex:none;align-items:center;justify-content:center;padding-inline:var(--spui-breadcrumb-item-gap,10px);color:var(--spui-ui-stroke,var(--spui-semantic-body-divider,#a19f9d));font:inherit}:host-context([dir=rtl]){transform:scaleX(-1)}@media(forced-colors:active){:host{color:CanvasText}}`;
      const slot = document.createElement("slot");
      if (!this.childNodes.length) this.textContent = "›";
      shadow.append(style, slot);
    }
  }
  customElements.define("spui-breadcrumb-divider", SpuiBreadcrumbDivider);
}

export function defineBreadcrumbButton(): void {
  if (customElements.get("spui-breadcrumb-button")) return;
  class SpuiBreadcrumbButton extends HTMLElement {
    static observedAttributes = ["href", "target", "rel", "type", "disabled", "disabled-focusable", "current", "size", "aria-label", "aria-current", "tabindex", "title"];
    connectedCallback(): void { this.render(); }
    attributeChangedCallback(): void { if (this.isConnected) this.render(); }
    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open", delegatesFocus: true });
      const href = this.getAttribute("href");
      const control = document.createElement(href !== null ? "a" : "button");
      if (href !== null) {
        control.setAttribute("href", href);
        for (const name of ["target", "rel"]) { const value = this.getAttribute(name); if (value !== null) control.setAttribute(name, value); }
      } else (control as HTMLButtonElement).type = this.getAttribute("type") === "submit" ? "submit" : "button";
      const disabled = this.hasAttribute("disabled");
      const disabledFocusable = this.hasAttribute("disabled-focusable");
      if (disabled && href === null && !disabledFocusable) (control as HTMLButtonElement).disabled = true;
      if (disabled && disabledFocusable || this.hasAttribute("current")) control.setAttribute("aria-disabled", "true");
      const current = this.getAttribute("aria-current") ?? (this.hasAttribute("current") ? "page" : null);
      if (current) control.setAttribute("aria-current", current);
      for (const name of ["aria-label", "tabindex", "title"]) { const value = this.getAttribute(name); if (value !== null) control.setAttribute(name, value); }
      if (disabled && (href !== null || disabledFocusable)) control.addEventListener("click", event => { event.preventDefault(); event.stopImmediatePropagation(); });
      control.className = "subtle";
      control.part.add("control");
      const style = document.createElement("style");
      style.textContent = `${buttonControlCss}:host{display:inline-flex;font:inherit}:host([size=small]) button,:host([size=small]) a{min-height:24px;padding-inline:8px;font-size:12px}:host([size=large]) button,:host([size=large]) a{min-height:40px;padding-inline:16px;font-size:16px}a{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-height:var(--spui-control-height,32px);padding-inline:14px;border:1px solid transparent;border-radius:var(--spui-control-radius,4px);color:inherit;text-decoration:none;cursor:pointer;font:inherit}a:hover{background:var(--spui-button-secondary-hover,color-mix(in srgb,var(--spui-ui-surface,#fff) 90%,var(--spui-ui-text,#242424) 10%))}:is(button,a):focus-visible{outline:2px solid var(--spui-ui-focus,var(--spui-semantic-focus-border,#005a9e));outline-offset:2px}:is(button,a)[aria-disabled=true]{opacity:.55;cursor:not-allowed}`;
      const icon = document.createElement("slot"); icon.name = "icon";
      control.append(icon, document.createElement("slot"));
      shadow.replaceChildren(style, control);
    }
  }
  customElements.define("spui-breadcrumb-button", SpuiBreadcrumbButton);
}
