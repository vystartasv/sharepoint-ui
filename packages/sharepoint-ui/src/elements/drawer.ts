import { base } from "./shared.js";

export function defineDrawer(): void {
  if (customElements.get("spui-drawer")) return;
  class SpuiDrawer extends HTMLElement {
    static observedAttributes = ["open", "motion", "motion-visible", "motion-exit-complete", "data-has-custom-backdrop", "title", "position", "size", "type", "modal", "modal-type", "inert-trap-focus", "dismissible", "close-label", "aria-label", "expandable", "expanded", "expand-label", "restore-label"];
    private outsidePointer?: (event: PointerEvent) => void;
    get open(): boolean { return this.hasAttribute("open"); }
    set open(value: boolean) { this.toggleAttribute("open", Boolean(value)); }

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.syncOpen();
    }

    disconnectedCallback(): void { this.removeOutsidePointer(); }

    attributeChangedCallback(): void { if (this.isConnected) this.syncOpen(); }

    private syncOpen(): void {
      const dialog = this.shadowRoot?.querySelector<HTMLDialogElement>("dialog");
      if (!dialog) return;
      const motionExiting = this.hasAttribute("motion") && this.getAttribute("motion-visible") === "false" && !this.hasAttribute("motion-exit-complete");
      const shouldOpen = this.open || motionExiting;
      if (shouldOpen && !dialog.open) {
        if (this.getAttribute("modal") === "false" && this.getAttribute("modal-type") !== "alert") dialog.show();
        else dialog.showModal();
      } else if (!shouldOpen && dialog.open) dialog.close();
      dialog.inert = motionExiting;
      if (motionExiting) dialog.setAttribute("aria-hidden", "true"); else dialog.removeAttribute("aria-hidden");
      if (this.open && this.getAttribute("modal") === "false" && this.getAttribute("dismissible") !== "false") {
        if (!this.outsidePointer) {
          this.outsidePointer = event => {
            if (!this.open || this.getAttribute("motion-visible") === "false" || this.getAttribute("modal") !== "false" || this.getAttribute("dismissible") === "false" || event.composedPath().includes(dialog)) return;
            this.dismiss(event, "backdropClick");
          };
          document.addEventListener("pointerdown", this.outsidePointer, true);
        }
      } else this.removeOutsidePointer();
      const fallbackTitle = this.shadowRoot?.querySelector<HTMLElement>(".fallback-title");
      if (fallbackTitle) fallbackTitle.textContent = this.getAttribute("title") ?? "Details";
      const titleSlot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=title]");
      if (fallbackTitle && titleSlot) fallbackTitle.hidden = titleSlot.assignedNodes().length > 0;
      const navigationSlot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=header-navigation]");
      const navigation = this.shadowRoot?.querySelector<HTMLElement>(".header-navigation");
      if (navigation && navigationSlot) navigation.hidden = navigationSlot.assignedNodes().length === 0;
      const close = this.shadowRoot?.querySelector<HTMLButtonElement>(".close");
      if (close) {
        close.setAttribute("aria-label", this.getAttribute("close-label") ?? "Close");
        close.hidden = this.getAttribute("dismissible") === "false" || this.getAttribute("modal-type") === "alert";
      }
      const expand = this.shadowRoot?.querySelector<HTMLButtonElement>(".expand");
      if (expand) {
        const expanded = this.hasAttribute("expanded");
        expand.hidden = !this.hasAttribute("expandable") || this.getAttribute("expandable") === "false";
        expand.setAttribute("aria-label", expanded ? this.getAttribute("restore-label") ?? "Restore drawer size" : this.getAttribute("expand-label") ?? "Expand drawer to full screen");
        expand.setAttribute("aria-pressed", String(expanded));
      }
      const label = this.getAttribute("aria-label");
      if (label) dialog.setAttribute("aria-label", label);
      else dialog.removeAttribute("aria-label");
      if (this.getAttribute("modal-type") === "alert") dialog.setAttribute("role", "alertdialog");
      else dialog.removeAttribute("role");
    }

    private removeOutsidePointer(): void {
      if (!this.outsidePointer) return;
      document.removeEventListener("pointerdown", this.outsidePointer, true);
      this.outsidePointer = undefined;
    }

    private dismiss(sourceEvent: Event, type: "escapeKeyDown" | "backdropClick" | "triggerClick"): void {
      if (!this.open || this.getAttribute("dismissible") === "false" || this.getAttribute("modal-type") === "alert") return;
      if (this.hasAttribute("motion")) {
        if (this.getAttribute("motion-visible") === "false") return;
        this.dispatchEvent(new CustomEvent("spui-open-change", { bubbles: true, composed: true, detail: { open: false, type, event: sourceEvent } }));
        this.dispatchEvent(new CustomEvent("spui-dismiss", { bubbles: true, composed: true }));
        return;
      }
      this.removeAttribute("open");
      const dialog = this.shadowRoot?.querySelector<HTMLDialogElement>("dialog");
      if (dialog?.open) dialog.close();
      this.dispatchEvent(new CustomEvent("spui-open-change", { bubbles: true, composed: true, detail: { open: false, type, event: sourceEvent } }));
      this.dispatchEvent(new CustomEvent("spui-dismiss", { bubbles: true, composed: true }));
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const dialog = document.createElement("dialog");
      dialog.part.add("surface");
      dialog.setAttribute("aria-labelledby", "title");
      const header = document.createElement("header");
      const headerMain = document.createElement("div"); headerMain.className = "header-main";
      const navigation = document.createElement("div"); navigation.className = "header-navigation"; const navigationSlot = document.createElement("slot"); navigationSlot.name = "header-navigation"; navigationSlot.addEventListener("slotchange", () => this.syncOpen()); navigation.append(navigationSlot);
      const heading = document.createElement("h2"); heading.id = "title";
      const fallbackTitle = document.createElement("span"); fallbackTitle.className = "fallback-title"; fallbackTitle.textContent = this.getAttribute("title") ?? "Details";
      const titleSlot = document.createElement("slot"); titleSlot.name = "title";
      titleSlot.addEventListener("slotchange", () => { fallbackTitle.hidden = titleSlot.assignedNodes().length > 0; });
      heading.append(fallbackTitle, titleSlot); headerMain.append(navigation, heading);
      const controls = document.createElement("div"); controls.className = "controls";
      const headerAction = document.createElement("slot"); headerAction.name = "header-action";
      const expand = document.createElement("button"); expand.type = "button"; expand.className = "expand"; expand.part.add("expand-button");
      expand.setAttribute("aria-label", this.getAttribute("expand-label") ?? "Expand drawer to full screen"); expand.setAttribute("aria-pressed", "false");
      const expandIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); expandIcon.setAttribute("viewBox", "0 0 20 20"); expandIcon.setAttribute("width", "20"); expandIcon.setAttribute("height", "20"); expandIcon.setAttribute("aria-hidden", "true");
      const expandPath = document.createElementNS("http://www.w3.org/2000/svg", "path"); expandPath.setAttribute("d", "M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4M3 7l5-4m9 4-5-4M3 13l5 4m9-4-5 4"); expandPath.setAttribute("fill", "none"); expandPath.setAttribute("stroke", "currentColor"); expandPath.setAttribute("stroke-width", "1.4"); expandPath.setAttribute("stroke-linecap", "round"); expandPath.setAttribute("stroke-linejoin", "round");
      expandIcon.append(expandPath); expand.append(expandIcon);
      expand.addEventListener("click", () => {
        const expanded = !this.hasAttribute("expanded");
        this.toggleAttribute("expanded", expanded);
        this.dispatchEvent(new CustomEvent("spui-expanded-change", { bubbles: true, composed: true, detail: { expanded } }));
      });
      const close = document.createElement("button"); close.type = "button"; close.className = "close"; close.part.add("close-button");
      close.setAttribute("aria-label", this.getAttribute("close-label") ?? "Close");
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 20 20"); icon.setAttribute("width", "20"); icon.setAttribute("height", "20"); icon.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "m5 5 10 10M15 5 5 15"); path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor"); path.setAttribute("stroke-width", "1.7"); path.setAttribute("stroke-linecap", "round");
      icon.append(path); close.append(icon); close.addEventListener("click", event => this.dismiss(event, "triggerClick"));
      controls.append(headerAction, expand, close); header.append(headerMain, controls);
      const body = document.createElement("div"); body.className = "body"; body.part.add("body"); body.append(document.createElement("slot"));
      const footer = document.createElement("footer"); footer.part.add("actions"); footer.hidden = true;
      const actions = document.createElement("slot"); actions.name = "actions"; actions.addEventListener("slotchange", () => { footer.hidden = actions.assignedElements().length === 0; }); footer.append(actions);
      const backdropSlot = document.createElement("slot"); backdropSlot.name = "backdrop"; backdropSlot.addEventListener("click", event => { if (this.getAttribute("modal-type") !== "alert") this.dismiss(event, "backdropClick"); });
      dialog.append(backdropSlot, header, body, footer);
      dialog.addEventListener("cancel", event => { event.preventDefault(); });
      dialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); if (this.getAttribute("modal-type") !== "alert") this.dismiss(event, "escapeKeyDown"); } });
      dialog.addEventListener("click", event => {
        if (event.target !== dialog || this.getAttribute("dismissible") === "false" || this.getAttribute("modal-type") === "alert") return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.dismiss(event, "backdropClick");
      });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:contents}dialog{isolation:isolate;position:fixed;inset-block:0;inset-inline-start:auto;inset-inline-end:0;box-sizing:border-box;display:flex;flex-direction:column;width:min(var(--spui-drawer-width,480px),calc(100vw - 24px));height:100dvh;max-height:100dvh;margin:0;padding:0;overflow:auto;border:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));border-start-start-radius:var(--spui-card-radius,12px);border-end-start-radius:var(--spui-card-radius,12px);background:var(--spui-card-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));box-shadow:var(--spui-card-shadow,0 16px 48px #0004)}dialog:not([open]){display:none}:host([position=start]) dialog{inset-inline-start:0;inset-inline-end:auto;border-start-start-radius:0;border-end-start-radius:0;border-start-end-radius:var(--spui-card-radius,12px);border-end-end-radius:var(--spui-card-radius,12px)}:host([position=top]) dialog{inset-block-start:0;inset-block-end:auto;width:100vw;height:min(var(--spui-drawer-height,360px),calc(100dvh - 24px));max-height:calc(100dvh - 24px);border-start-start-radius:0;border-start-end-radius:0;border-end-start-radius:var(--spui-card-radius,12px);border-end-end-radius:var(--spui-card-radius,12px)}:host([position=bottom]) dialog{inset-block-start:auto;inset-block-end:0;width:100vw;height:min(var(--spui-drawer-height,360px),calc(100dvh - 24px));max-height:calc(100dvh - 24px);border-start-start-radius:var(--spui-card-radius,12px);border-start-end-radius:var(--spui-card-radius,12px);border-end-start-radius:0;border-end-end-radius:0}:host([size=small]) dialog{--spui-drawer-width:320px;--spui-drawer-height:256px}:host([size=medium]) dialog{--spui-drawer-width:480px;--spui-drawer-height:360px}:host([size=large]) dialog{--spui-drawer-width:640px;--spui-drawer-height:480px}:host([size=full]) dialog{width:100vw;max-width:100vw;--spui-drawer-width:100vw;--spui-drawer-height:100dvh;border-radius:0}:host([position=top][size=full]) dialog,:host([position=bottom][size=full]) dialog{height:100dvh;max-height:100dvh}dialog::backdrop{background:color-mix(in srgb,var(--spui-ui-text,#242424) 42%,transparent);backdrop-filter:blur(2px)}:host([data-has-custom-backdrop]) dialog::backdrop{background:transparent;backdrop-filter:none}:host([data-has-custom-backdrop]) dialog{background:transparent}::slotted([slot=backdrop]){position:fixed;inset:0;z-index:-1;display:block;background:color-mix(in srgb,var(--spui-ui-text,#242424) 42%,transparent)}:host([data-has-custom-backdrop]) header,:host([data-has-custom-backdrop]) .body,:host([data-has-custom-backdrop]) footer{position:relative;z-index:0;background:var(--spui-card-background,var(--spui-ui-surface,#fff))}header{display:flex;align-items:start;justify-content:space-between;gap:16px;flex:none;padding:20px 20px 0}.header-main{display:flex;align-items:center;gap:12px;flex:1;min-width:0}:host([size=small]) header{flex-wrap:wrap}:host([size=small]) .header-main{flex-basis:100%}.header-navigation{display:flex;align-items:center;flex:none}.header-navigation[hidden]{display:none}.header-navigation slot[name=header-navigation]{display:contents}h2{min-width:0;overflow-wrap:anywhere;margin:0;font-size:20px;line-height:1.3;font-weight:650}.controls{display:flex;align-items:center;gap:4px;flex:none;margin-inline-start:auto}.controls slot[name=header-action]{display:contents}.close{display:inline-grid;place-items:center;flex:none;width:var(--spui-control-height,36px);height:var(--spui-control-height,36px);margin:-5px -6px 0 0;border:0;border-radius:var(--spui-control-radius,6px);background:transparent;color:inherit;cursor:pointer}.close:hover{background:var(--spui-ui-surface-hover,#f5f5f5)}.close:focus-visible{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px}.body{flex:1;min-height:0;overflow:auto;padding:16px 20px 20px;line-height:1.5}footer{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;flex:none;padding:12px 20px 20px;border-top:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}footer[hidden],.close[hidden]{display:none}@media(forced-colors:active){dialog{border-color:CanvasText;box-shadow:none}dialog::backdrop{background:Canvas}.close:focus-visible{outline-color:Highlight}}`;
      const expansionStyle = document.createElement("style");
      expansionStyle.textContent = `${base}dialog{transition:border-radius var(--spui-motion-duration-normal,150ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}:host([expanded]) dialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;--spui-drawer-width:100vw;--spui-drawer-height:100dvh;border-radius:0}:host([expanded]) dialog::backdrop{backdrop-filter:none}header{align-items:center}.controls{display:flex;align-items:center;gap:4px}.expand,.close{display:inline-grid;place-items:center;flex:none;width:var(--spui-control-height,36px);height:var(--spui-control-height,36px);margin:0;border:0;border-radius:var(--spui-control-radius,6px);background:transparent;color:inherit;cursor:pointer}.expand:hover,.close:hover{background:var(--spui-ui-surface-hover,#f5f5f5)}.expand:focus-visible,.close:focus-visible{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px}.expand[hidden],.close[hidden]{display:none}@media(prefers-reduced-motion:reduce){dialog{transition:none}}@media(forced-colors:active){.expand:focus-visible,.close:focus-visible{outline-color:Highlight}}`;
      shadow.append(style, expansionStyle, dialog);
    }
  }
  customElements.define("spui-drawer", SpuiDrawer);
}

/** Non-modal, in-flow companion surface for navigation and supporting work. */
export function defineInlineDrawer(): void {
  if (customElements.get("spui-inline-drawer")) return;
  class SpuiInlineDrawer extends HTMLElement {
    static observedAttributes = ["open", "motion", "position", "size", "separator", "title", "aria-label"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); else this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const aside = document.createElement("aside"); aside.part.add("surface");
      const header = document.createElement("header"); header.hidden = true;
      const navigation = document.createElement("nav"); navigation.className = "header-navigation"; const navigationSlot = document.createElement("slot"); navigationSlot.name = "header-navigation"; navigationSlot.addEventListener("slotchange", () => this.sync()); navigation.append(navigationSlot);
      const heading = document.createElement("h2"); const title = document.createElement("span"); title.className = "fallback-title"; const titleSlot = document.createElement("slot"); titleSlot.name = "title"; titleSlot.addEventListener("slotchange", () => this.sync()); heading.append(title, titleSlot);
      const controls = document.createElement("div"); controls.className = "controls"; const headerAction = document.createElement("slot"); headerAction.name = "header-action"; headerAction.addEventListener("slotchange", () => this.sync()); controls.append(headerAction); header.append(navigation, heading, controls);
      const body = document.createElement("div"); body.className = "body"; body.append(document.createElement("slot"));
      const footer = document.createElement("footer"); footer.hidden = true; const actions = document.createElement("slot"); actions.name = "actions"; actions.addEventListener("slotchange", () => this.sync()); footer.append(actions);
      aside.append(header, body, footer);
      const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0;max-width:100%}:host(:not([open]):not([motion])){display:none}aside{box-sizing:border-box;display:flex;flex-direction:column;flex:none;inline-size:min(var(--spui-inline-drawer-width,320px),100%);min-inline-size:0;block-size:100%;min-block-size:0;overflow:auto;background:var(--spui-card-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424))}:host([position=end]) aside{margin-inline-start:auto}:host([position=bottom]) aside,:host([position=top]) aside{inline-size:100%;block-size:auto}:host([size=small]) aside{--spui-inline-drawer-width:240px}:host([size=medium]) aside{--spui-inline-drawer-width:320px}:host([size=large]) aside{--spui-inline-drawer-width:420px}:host([size=full]) aside{--spui-inline-drawer-width:100%}:host([separator]) aside{border-inline-end:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}:host([position=end][separator]) aside{border-inline-end:0;border-inline-start:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}:host([position=bottom][separator]) aside{border-inline:0;border-block-start:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}:host([position=top][separator]) aside{border-inline:0;border-block-end:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}header{display:flex;align-items:center;gap:12px;flex:none;padding:16px 16px 8px}header[hidden],footer[hidden]{display:none}.header-navigation{display:flex;align-items:center;flex:none}.header-navigation[hidden]{display:none}.controls{display:flex;align-items:center;gap:8px;margin-inline-start:auto}.controls slot{display:contents}h2{margin:0;font-size:18px;line-height:1.35;font-weight:600}.body{flex:1;min-height:0;overflow:auto;padding:12px 16px 16px;line-height:1.5}footer{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;flex:none;padding:12px 16px;border-block-start:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}@media(forced-colors:active){aside{border-color:CanvasText}}`;
      shadow.append(style, aside); this.sync();
    }
    private sync(): void {
      const aside = this.shadowRoot?.querySelector<HTMLElement>("aside"); const heading = this.shadowRoot?.querySelector<HTMLElement>(".fallback-title");
      const titleSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="title"]'); const titleNodes = titleSlot?.assignedNodes({ flatten: true }) ?? [];
      const actionsSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="actions"]'); const actions = this.shadowRoot?.querySelector<HTMLElement>("footer");
      if (aside) { const open = this.hasAttribute("open"); aside.inert = !open; aside.setAttribute("aria-hidden", String(!open)); const titleText = titleNodes.map(node => node.textContent ?? "").join(" ").trim(); const label = this.getAttribute("aria-label") ?? this.getAttribute("title") ?? titleText; if (label) aside.setAttribute("aria-label", label); else aside.removeAttribute("aria-label"); }
      if (heading) { heading.textContent = this.getAttribute("title") ?? ""; heading.hidden = titleNodes.length > 0; }
      const header = this.shadowRoot?.querySelector<HTMLElement>("header");
      const navSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="header-navigation"]'); const nav = this.shadowRoot?.querySelector<HTMLElement>(".header-navigation"); const hasNavigation = Boolean(navSlot?.assignedElements().length); if (nav) nav.hidden = !hasNavigation;
      const headerActionSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="header-action"]'); const hasHeaderAction = Boolean(headerActionSlot?.assignedElements().length);
      if (header) header.hidden = !this.getAttribute("title") && !titleNodes.length && !hasNavigation && !hasHeaderAction;
      if (titleSlot) titleSlot.hidden = titleNodes.length === 0;
      if (actions && actionsSlot) actions.hidden = actionsSlot.assignedElements().length === 0;
    }
  }
  customElements.define("spui-inline-drawer", SpuiInlineDrawer);
}
