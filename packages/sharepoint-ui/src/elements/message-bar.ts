import { base } from "./shared.js";

export type MessageBarIntent = "info" | "success" | "warning" | "error";
export type MessageBarPoliteness = "assertive" | "polite";
export type MessageBarShape = "square" | "rounded";
export type MessageBarLayout = "auto" | "singleline" | "multiline";
export type MessageBarGroupAnimation = "exit-only" | "both";
let messageBarTitleSequence = 0;

function definePart(tag: string, content: string, css: string, observed: string[] = []): void {
  if (customElements.get(tag)) return;
  class SpuiMessageBarPart extends HTMLElement {
    static observedAttributes = observed;
    private resizeObserver?: ResizeObserver;
    private childObserver?: MutationObserver;
    private readonly childRects = new WeakMap<HTMLElement, DOMRectReadOnly>();
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" });
        const root = document.createElement("div"); root.part.add("root");
        const fragment = document.createRange().createContextualFragment(content);
        const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0;font:inherit;color:inherit;line-height:inherit}${css}`;
        shadow.append(style, root); root.append(fragment);
      }
      this.sync();
      if (tag.endsWith("-group")) this.observeMessageBars();
    }
    disconnectedCallback(): void { this.resizeObserver?.disconnect(); this.childObserver?.disconnect(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      if (tag.endsWith("-group")) {
        this.setAttribute("role", "group");
        this.dataset.animate = this.getAttribute("animate") === "both" ? "both" : "exit-only";
      }
      if (tag.endsWith("-actions")) {
        const parent = this.closest<HTMLElement>("spui-message-bar");
        const layout = parent?.dataset.layout ?? parent?.getAttribute("layout");
        if (layout) this.dataset.layout = layout; else delete this.dataset.layout;
      }
    }
    private observeMessageBars(): void {
      const view = this.ownerDocument.defaultView;
      if (!view) return;
      const ResizeObserverConstructor = view.ResizeObserver;
      if (ResizeObserverConstructor && !this.resizeObserver) {
        this.resizeObserver = new ResizeObserverConstructor(entries => {
          for (const entry of entries) if (entry.target instanceof HTMLElement && entry.target.isConnected) this.childRects.set(entry.target, entry.target.getBoundingClientRect());
        });
      }
      const MutationObserverConstructor = view.MutationObserver;
      if (MutationObserverConstructor) {
        this.childObserver ??= new MutationObserverConstructor(records => {
          for (const record of records) {
            for (const node of record.addedNodes) if (node instanceof HTMLElement && node.localName === "spui-message-bar" && !node.hasAttribute("data-spui-exiting")) {
              if (node.isConnected) {
                const rect = node.getBoundingClientRect();
                if (rect.width && rect.height) this.childRects.set(node, rect);
                this.resizeObserver?.observe(node);
              }
            }
            for (const node of record.removedNodes) if (node instanceof HTMLElement && node.localName === "spui-message-bar" && !node.hasAttribute("data-spui-exiting")) {
              this.resizeObserver?.unobserve(node);
              this.animateExit(node);
            }
          }
        });
        this.childObserver.observe(this, { childList: true });
      }
      for (const bar of this.querySelectorAll<HTMLElement>(":scope > spui-message-bar")) this.resizeObserver?.observe(bar);
    }
    private animateExit(bar: HTMLElement): void {
      const view = this.ownerDocument.defaultView;
      const rect = this.childRects.get(bar);
      if (!view || !rect || this.getAttribute("animate") === "none" || view.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const groupRect = this.getBoundingClientRect();
      for (const sibling of this.querySelectorAll<HTMLElement>(":scope > spui-message-bar:not([data-spui-exiting])")) {
        const previous = this.childRects.get(sibling);
        const current = sibling.getBoundingClientRect();
        this.childRects.set(sibling, current);
        const offset = previous ? previous.top - current.top : 0;
        if (Math.abs(offset) < 1) continue;
        sibling.style.setProperty("--spui-message-shift", `${offset}px`);
        sibling.setAttribute("data-spui-shifting", "");
        const clearShift = (): void => {
          sibling.removeAttribute("data-spui-shifting");
          sibling.style.removeProperty("--spui-message-shift");
          sibling.removeEventListener("animationend", clearShift);
          sibling.removeEventListener("animationcancel", clearShift);
        };
        sibling.addEventListener("animationend", clearShift);
        sibling.addEventListener("animationcancel", clearShift);
      }
      const clone = bar.cloneNode(true) as HTMLElement;
      clone.setAttribute("data-spui-exiting", "");
      clone.setAttribute("aria-hidden", "true");
      clone.removeAttribute("data-spui-shifting");
      clone.style.removeProperty("--spui-message-shift");
      clone.inert = true;
      clone.removeAttribute("id");
      clone.querySelectorAll("[id], [data-testid]").forEach(node => { node.removeAttribute("id"); node.removeAttribute("data-testid"); });
      Object.assign(clone.style, {
        position: "absolute",
        insetInlineStart: `${rect.left - groupRect.left - this.clientLeft + this.scrollLeft}px`,
        top: `${rect.top - groupRect.top - this.clientTop + this.scrollTop}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: "0",
        pointerEvents: "none",
        zIndex: "1",
      });
      const removeClone = (): void => {
        clone.removeEventListener("animationend", removeClone);
        clone.removeEventListener("animationcancel", removeClone);
        clone.remove();
      };
      clone.addEventListener("animationend", removeClone);
      clone.addEventListener("animationcancel", removeClone);
      this.append(clone);
      view.setTimeout(removeClone, 300);
    }
  }
  customElements.define(tag, SpuiMessageBarPart);
}

export function defineMessageBarActions(): void {
  definePart("spui-message-bar-actions", '<slot></slot><slot name="container-action"></slot>', ":host{display:flex;align-items:center;flex-wrap:wrap;gap:8px}:host([data-layout=multiline]){align-items:flex-start}slot[name=container-action]{margin-inline-start:auto}");
}

export function defineMessageBarBody(): void {
  definePart("spui-message-bar-body", "<slot></slot>", ":host{line-height:1.45;min-width:0}");
}

export function defineMessageBarTitle(): void {
  definePart("spui-message-bar-title", "<slot></slot>", ":host{display:inline;font-weight:600}");
}

export function defineMessageBarGroup(): void {
  definePart("spui-message-bar-group", "<slot></slot>", ":host{position:relative;display:grid;gap:8px}:host([data-animate=both]) ::slotted(spui-message-bar:not([data-spui-exiting])){animation:spui-message-enter 160ms cubic-bezier(.2,0,0,1) both}::slotted(spui-message-bar[data-spui-exiting]){animation:spui-message-exit 250ms ease-in both}:host([data-animate]) ::slotted(spui-message-bar[data-spui-shifting]){animation:spui-message-shift 180ms cubic-bezier(.2,0,0,1) both}@keyframes spui-message-enter{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes spui-message-exit{to{opacity:0}}@keyframes spui-message-shift{from{transform:translateY(var(--spui-message-shift,0px))}to{transform:translateY(0)}}@media(prefers-reduced-motion:reduce){:host([data-animate=both]) ::slotted(spui-message-bar:not([data-spui-exiting])),::slotted(spui-message-bar[data-spui-exiting]),:host([data-animate]) ::slotted(spui-message-bar[data-spui-shifting]){animation:none}}", ["animate"]);
}

export function defineMessageBar(): void {
  if (customElements.get("spui-message-bar")) return;
  defineMessageBarActions(); defineMessageBarBody(); defineMessageBarTitle(); defineMessageBarGroup();
  class SpuiMessageBar extends HTMLElement {
    static observedAttributes = ["intent", "politeness", "shape", "layout"];
    private resizeObserver?: ResizeObserver;
    private contentObserver?: MutationObserver;
    private reflowing = false;
    private singleLineWidth = Number.POSITIVE_INFINITY;
    private generatedTitleLabel?: string;
    private lastAnnouncement?: string;
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" }); const content = document.createElement("div"); content.className = "content"; content.part.add("content");
        const iconSlot = document.createElement("slot"); iconSlot.name = "icon";
        const fallbackIcon = document.createElement("span"); fallbackIcon.className = "icon"; fallbackIcon.part.add("intent-icon"); fallbackIcon.setAttribute("aria-hidden", "true");
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 20 20"); svg.setAttribute("width", "20"); svg.setAttribute("height", "20"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "1.7"); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round"); svg.setAttribute("focusable", "false");
        fallbackIcon.append(svg); iconSlot.append(fallbackIcon); iconSlot.addEventListener("slotchange", () => this.syncIcon());
        const childrenSlot = document.createElement("slot");
        childrenSlot.addEventListener("slotchange", () => { this.updateLayout(); this.updateAnnouncement(); this.updateLabel(); });
        content.append(iconSlot, childrenSlot);
        const spacerSlot = document.createElement("slot"); spacerSlot.name = "bottom-reflow-spacer";
        const spacer = document.createElement("div"); spacer.className = "reflow-spacer"; spacer.part.add("bottom-reflow-spacer"); spacer.setAttribute("aria-hidden", "true");
        spacerSlot.append(spacer); content.append(spacerSlot);
        const liveRegion = document.createElement("span"); liveRegion.className = "announcement"; liveRegion.setAttribute("aria-live", "polite"); liveRegion.setAttribute("aria-atomic", "true");
        const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-body-divider,var(--colorNeutralStroke2,#edebe9))));border-radius:var(--spui-control-radius,4px);padding:12px 14px;background:var(--spui-ui-canvas,var(--colorNeutralBackground2,#f5f5f5));box-sizing:border-box;white-space:nowrap}:host([shape=rounded]){border-radius:var(--spui-card-radius,8px)}:host([shape=square]){border-radius:0}:host([intent=success]){background:var(--spui-success-surface,var(--spui-ui-success-surface,var(--spui-semantic-success-background,var(--colorPaletteGreenBackground1,#dff6dd))))}:host([intent=warning]){background:var(--spui-warning-surface,var(--spui-ui-warning-surface,var(--spui-semantic-warning-background,var(--colorPaletteYellowBackground1,#fff4ce))))}:host([intent=error]){background:var(--spui-danger-surface,var(--spui-ui-danger-surface,var(--spui-semantic-error-background,var(--colorPaletteRedBackground1,#fde7e9))))}.content{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:auto;grid-template-areas:'icon body actions';align-items:center;min-width:0;gap:0 12px;line-height:1.45}.content>slot:not([name]){display:contents}.content>slot[name=icon]{grid-area:icon;display:flex;align-items:center}.content>slot[name=bottom-reflow-spacer]{grid-area:spacer}.content ::slotted(spui-message-bar-title){grid-area:body}.content ::slotted(spui-message-bar-body){grid-area:body;min-width:0;white-space:inherit}.content ::slotted(spui-message-bar-actions){grid-area:actions;min-width:0}.icon,::slotted([slot=icon]){display:inline-flex;align-items:center;justify-content:center;flex:none;vertical-align:middle;margin-inline-end:8px;color:var(--spui-message-icon-color,var(--spui-ui-accent,#0f6cbd))}:host([intent=success]) .icon{color:var(--spui-ui-success,#107c10)}:host([intent=warning]) .icon{color:var(--spui-ui-warning,#835b00)}:host([intent=error]) .icon{color:var(--spui-ui-danger,#b10e1c)}:host([data-layout=multiline]){white-space:normal}:host([data-layout=multiline]) .content{grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:auto auto;grid-template-areas:'icon body actions' 'spacer spacer spacer';align-items:start;row-gap:8px}:host([data-layout=multiline]) .icon{margin-inline-end:0}.reflow-spacer,::slotted([slot=bottom-reflow-spacer]){display:none}:host([data-layout=multiline]) .reflow-spacer,:host([data-layout=multiline]) ::slotted([slot=bottom-reflow-spacer]){display:block;min-height:8px;margin-block-end:8px}:host([data-spui-appearance=glass]),:host-context([data-spui-appearance=glass]){backdrop-filter:var(--spui-card-backdrop,none);border-color:var(--spui-card-border,#ffffff80)}.announcement{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(forced-colors:active){:host{border-color:CanvasText;color:CanvasText;background:Canvas}.icon,::slotted([slot=icon]){color:CanvasText}}`;
        shadow.append(style, content, liveRegion);
      }
      this.updateIntent();
      this.updateLayout();
      this.updateLabel();
      this.updateAnnouncement();
      this.observeLayout();
      const MutationObserverConstructor = this.ownerDocument.defaultView?.MutationObserver;
      if (MutationObserverConstructor) {
        this.contentObserver ??= new MutationObserverConstructor(() => { this.updateLayout(); this.updateLabel(); this.updateAnnouncement(); });
        this.contentObserver.observe(this, { childList: true, characterData: true, subtree: true });
      }
    }
    disconnectedCallback(): void { this.resizeObserver?.disconnect(); this.contentObserver?.disconnect(); }
    attributeChangedCallback(): void { if (this.isConnected) { this.updateIntent(); this.updateLayout(); this.updateLabel(); this.observeLayout(); } }
    private observeLayout(): void {
      this.resizeObserver?.disconnect();
      const ResizeObserverConstructor = this.ownerDocument.defaultView?.ResizeObserver;
      if ((this.getAttribute("layout") ?? "auto") !== "auto" || !ResizeObserverConstructor) return;
      this.resizeObserver = new ResizeObserverConstructor(() => this.updateLayout());
      this.resizeObserver.observe(this);
    }
    private updateLayout(): void {
      const layout = this.getAttribute("layout") ?? "auto";
      if (layout !== "auto") this.reflowing = layout === "multiline";
      else {
        const width = this.getBoundingClientRect().width;
        const scrollWidth = Math.max(this.scrollWidth, this.shadowRoot?.querySelector(".content")?.scrollWidth ?? 0);
        if (this.reflowing) {
          if (width >= this.singleLineWidth) this.reflowing = false;
        } else if (width < scrollWidth) {
          this.reflowing = true;
          this.singleLineWidth = scrollWidth;
        }
      }
      const resolved = layout === "auto" ? this.reflowing ? "multiline" : "singleline" : layout;
      if (this.dataset.layout !== resolved) this.dataset.layout = resolved;
      for (const actions of this.querySelectorAll<HTMLElement>("spui-message-bar-actions")) actions.dataset.layout = resolved;
    }
    private updateLabel(): void {
      if (this.generatedTitleLabel && this.getAttribute("aria-labelledby") === this.generatedTitleLabel) this.removeAttribute("aria-labelledby");
      this.generatedTitleLabel = undefined;
      if (this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby")) return;
      const title = this.querySelector<HTMLElement>("spui-message-bar-title");
      if (!title) return;
      if (!title.id) title.id = `spui-message-bar-title-${++messageBarTitleSequence}`;
      this.generatedTitleLabel = title.id;
      this.setAttribute("aria-labelledby", title.id);
    }
    private updateAnnouncement(): void {
      const liveRegion = this.shadowRoot?.querySelector<HTMLElement>(".announcement");
      if (!liveRegion || this.hasAttribute("data-spui-exiting")) return;
      const body = this.querySelector("spui-message-bar-body")?.textContent ?? Array.from(this.childNodes).filter(node => !(node instanceof HTMLElement && ["spui-message-bar-title", "spui-message-bar-actions"].includes(node.localName))).map(node => node.textContent ?? "").join("");
      const actions = this.querySelector("spui-message-bar-actions")?.textContent ?? "";
      const message = [body?.trim(), actions.trim()].filter(Boolean).join(",");
      if (message === this.lastAnnouncement) return;
      this.lastAnnouncement = message;
      liveRegion.textContent = "";
      queueMicrotask(() => { if (this.isConnected && liveRegion.isConnected) liveRegion.textContent = message; });
    }
    private syncIcon(): void {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="icon"]');
      const fallback = this.shadowRoot?.querySelector<HTMLElement>(".icon");
      if (fallback) {
        const intent = this.getAttribute("intent") ?? "info";
        fallback.dataset.intent = intent;
        const svg = fallback.querySelector("svg");
        const paths: Record<string, string[]> = {
          info: ["M10 2.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15", "M10 9v4", "M10 6.4v.1"],
          success: ["M10 2.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15", "m6.2 10.2 2.5 2.5 5.2-5.2"],
          warning: ["m10 2.5 8 14H2l8-14Z", "M10 7.5v4", "M10 14.4v.1"],
          error: ["M6 2.5h8l3.5 7.5-3.5 7.5H6L2.5 10 6 2.5Z", "m7.5 7.5 5 5", "m12.5 7.5-5 5"]
        };
        if (svg) {
          svg.replaceChildren();
          for (const d of paths[intent] ?? paths.info) { const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", d); svg.append(path); }
        }
      }
      if (slot && fallback) fallback.hidden = slot.assignedElements().length > 0;
    }
    private updateIntent(): void {
      const politeness = this.getAttribute("politeness");
      const intent = this.getAttribute("intent") ?? "info";
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      const liveRegion = this.shadowRoot?.querySelector<HTMLElement>(".announcement");
      liveRegion?.setAttribute("aria-live", politeness ?? (intent === "info" ? "polite" : "assertive"));
      this.syncIcon();
      for (const actions of this.querySelectorAll<HTMLElement>("spui-message-bar-actions")) {
        const layout = this.getAttribute("layout");
        if (layout) actions.dataset.layout = layout; else delete actions.dataset.layout;
      }
      this.updateLabel();
      this.updateAnnouncement();
    }
  }
  customElements.define("spui-message-bar", SpuiMessageBar);
}
