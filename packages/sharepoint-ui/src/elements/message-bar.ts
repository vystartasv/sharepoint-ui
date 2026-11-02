import { base } from "./shared.js";

export type MessageBarIntent = "info" | "success" | "warning" | "error";
export type MessageBarPoliteness = "assertive" | "polite";
export type MessageBarShape = "square" | "rounded";
export type MessageBarLayout = "auto" | "singleline" | "multiline";
export type MessageBarGroupAnimation = "exit-only" | "both";

function definePart(tag: string, content: string, css: string, observed: string[] = []): void {
  if (customElements.get(tag)) return;
  class SpuiMessageBarPart extends HTMLElement {
    static observedAttributes = observed;
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" });
        const root = document.createElement("div"); root.part.add("root");
        const fragment = document.createRange().createContextualFragment(content);
        const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0;font:inherit;color:inherit;line-height:inherit}${css}`;
        shadow.append(style, root); root.append(fragment);
      }
      this.sync();
    }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      if (tag.endsWith("-group")) {
        this.setAttribute("role", "group");
        this.dataset.animate = this.getAttribute("animate") === "both" ? "both" : "exit-only";
      }
      if (tag.endsWith("-actions")) {
        const layout = this.closest("spui-message-bar")?.getAttribute("layout");
        if (layout) this.dataset.layout = layout; else delete this.dataset.layout;
      }
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
  definePart("spui-message-bar-group", "<slot></slot>", ":host{display:grid;gap:8px}:host([data-animate=both]) ::slotted(spui-message-bar){animation:spui-message-enter 160ms cubic-bezier(.2,0,0,1) both}@keyframes spui-message-enter{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){:host([data-animate=both]) ::slotted(spui-message-bar){animation:none}}", ["animate"]);
}

export function defineMessageBar(): void {
  if (customElements.get("spui-message-bar")) return;
  defineMessageBarActions(); defineMessageBarBody(); defineMessageBarTitle(); defineMessageBarGroup();
  class SpuiMessageBar extends HTMLElement {
    static observedAttributes = ["intent", "politeness", "shape", "layout"];
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" }); const content = document.createElement("div"); content.className = "content"; content.part.add("content");
        const iconSlot = document.createElement("slot"); iconSlot.name = "icon";
        const fallbackIcon = document.createElement("span"); fallbackIcon.className = "icon"; fallbackIcon.part.add("intent-icon"); fallbackIcon.setAttribute("aria-hidden", "true");
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 20 20"); svg.setAttribute("width", "20"); svg.setAttribute("height", "20"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "1.7"); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round"); svg.setAttribute("focusable", "false");
        fallbackIcon.append(svg); iconSlot.append(fallbackIcon); iconSlot.addEventListener("slotchange", () => this.syncIcon());
        content.append(iconSlot, document.createElement("slot"));
        const spacerSlot = document.createElement("slot"); spacerSlot.name = "bottom-reflow-spacer";
        const spacer = document.createElement("div"); spacer.className = "reflow-spacer"; spacer.part.add("bottom-reflow-spacer"); spacer.setAttribute("aria-hidden", "true");
        spacerSlot.append(spacer); content.append(spacerSlot);
        const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-body-divider,var(--colorNeutralStroke2,#edebe9))));border-radius:var(--spui-control-radius,4px);padding:12px 14px;background:var(--spui-ui-canvas,var(--colorNeutralBackground2,#f5f5f5))}:host([shape=rounded]){border-radius:var(--spui-card-radius,8px)}:host([shape=square]){border-radius:0}:host([intent=success]){background:var(--spui-success-surface,var(--spui-ui-success-surface,var(--spui-semantic-success-background,var(--colorPaletteGreenBackground1,#dff6dd))))}:host([intent=warning]){background:var(--spui-warning-surface,var(--spui-ui-warning-surface,var(--spui-semantic-warning-background,var(--colorPaletteYellowBackground1,#fff4ce))))}:host([intent=error]){background:var(--spui-danger-surface,var(--spui-ui-danger-surface,var(--spui-semantic-error-background,var(--colorPaletteRedBackground1,#fde7e9))))}.content{line-height:1.45;min-width:0}.icon,::slotted([slot=icon]){display:inline-flex;align-items:center;justify-content:center;flex:none;vertical-align:middle;margin-inline-end:8px;color:var(--spui-message-icon-color,var(--spui-ui-accent,#0f6cbd))}:host([intent=success]) .icon{color:var(--spui-ui-success,#107c10)}:host([intent=warning]) .icon{color:var(--spui-ui-warning,#835b00)}:host([intent=error]) .icon{color:var(--spui-ui-danger,#b10e1c)}:host([layout=singleline]) .content{display:flex;align-items:center;gap:12px}:host([layout=singleline]) .icon,:host([layout=multiline]) .icon{margin-inline-end:0}:host([layout=multiline]) .content{display:grid;gap:8px}.reflow-spacer,::slotted([slot=bottom-reflow-spacer]){display:none}:host([layout=multiline]) .reflow-spacer,:host([layout=multiline]) ::slotted([slot=bottom-reflow-spacer]){display:block;min-height:8px;margin-block-end:8px}:host([data-spui-appearance=glass]),:host-context([data-spui-appearance=glass]){backdrop-filter:var(--spui-card-backdrop,none);border-color:var(--spui-card-border,#ffffff80)}@media(forced-colors:active){:host{border-color:CanvasText;color:CanvasText;background:Canvas}.icon,::slotted([slot=icon]){color:CanvasText}}`;
        shadow.append(style, content);
      }
      this.updateIntent();
    }
    attributeChangedCallback(): void { if (this.isConnected) this.updateIntent(); }
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
      this.setAttribute("role", politeness === "assertive" || (!politeness && (intent === "error" || intent === "warning")) ? "alert" : "status");
      this.syncIcon();
      for (const actions of this.querySelectorAll<HTMLElement>("spui-message-bar-actions")) {
        const layout = this.getAttribute("layout");
        if (layout) actions.dataset.layout = layout; else delete actions.dataset.layout;
      }
    }
  }
  customElements.define("spui-message-bar", SpuiMessageBar);
}
