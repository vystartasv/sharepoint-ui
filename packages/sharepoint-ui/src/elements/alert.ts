import { base } from "./shared.js";

export type AlertAppearance = "primary" | "inverted";

const alertIconPaths: Record<string, string> = {
  info: "M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM10 9v5m0-7h.01",
  success: "M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM6.5 10l2.3 2.3 4.7-5.1",
  warning: "m10 2.5 8 14H2l8-14ZM10 7v4m0 3.5h.01",
  error: "M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM7 7l6 6m0-6-6 6",
};

export function defineAlert(): void {
  if (customElements.get("spui-alert")) return;
  class SpuiAlert extends HTMLElement {
    static observedAttributes = ["intent", "appearance", "assertive", "dismissible", "dismiss-label"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.syncSemantics(); }
    attributeChangedCallback(): void { if (this.isConnected) this.syncSemantics(); }
    private syncSemantics(): void {
      const intent = this.getAttribute("intent");
      const assertive = this.hasAttribute("assertive") ? this.getAttribute("assertive") !== "false" : intent === "error" || intent === "warning";
      this.setAttribute("role", assertive ? "alert" : "status");
      this.setAttribute("aria-live", assertive ? "assertive" : "polite");
      this.setAttribute("aria-atomic", "true");
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button");
      if (button) { button.hidden = !this.hasAttribute("dismissible"); button.setAttribute("aria-label", this.getAttribute("dismiss-label") ?? "Dismiss"); }
      const icon = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="icon"]');
      const avatar = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="avatar"]');
      if (icon && avatar) icon.hidden = avatar.assignedElements().length > 0;
      const iconPath = icon?.querySelector(".icon path");
      if (iconPath) iconPath.setAttribute("d", alertIconPaths[intent ?? "info"] ?? alertIconPaths.info);
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const avatar = document.createElement("slot"); avatar.name = "avatar"; avatar.part.add("avatar");
      avatar.addEventListener("slotchange", () => this.syncSemantics());
      const icon = document.createElement("slot"); icon.name = "icon"; icon.part.add("icon");
      const defaultIcon = document.createElement("span"); defaultIcon.className = "icon"; defaultIcon.setAttribute("aria-hidden", "true"); icon.append(defaultIcon);
      const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); iconSvg.setAttribute("viewBox", "0 0 20 20"); iconSvg.setAttribute("focusable", "false");
      const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path"); iconPath.setAttribute("d", alertIconPaths.info); iconSvg.append(iconPath); defaultIcon.append(iconSvg);
      const content = document.createElement("div"); content.className = "content"; content.part.add("content"); content.append(document.createElement("slot"));
      const action = document.createElement("slot"); action.name = "action"; action.part.add("action");
      const actions = document.createElement("slot"); actions.name = "actions"; actions.part.add("actions");
      const button = document.createElement("button"); button.type = "button"; button.hidden = !this.hasAttribute("dismissible"); button.part.add("dismiss");
      const closeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); closeSvg.classList.add("dismiss-icon"); closeSvg.setAttribute("viewBox", "0 0 20 20"); closeSvg.setAttribute("aria-hidden", "true"); closeSvg.setAttribute("focusable", "false");
      const closePath = document.createElementNS("http://www.w3.org/2000/svg", "path"); closePath.setAttribute("d", "m5 5 10 10M15 5 5 15"); closeSvg.append(closePath); button.append(closeSvg);
      button.addEventListener("click", () => { this.hidden = true; this.dispatchEvent(new CustomEvent("spui-dismiss", { bubbles: true, composed: true })); });
      const style = document.createElement("style"); style.textContent = `${base}:host{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#d1d1d1));border-inline-start:2px solid var(--spui-ui-accent,#0f6cbd);border-radius:var(--spui-control-radius,6px);background:var(--spui-ui-canvas,#f5f5f5);line-height:1.45}:host([hidden]){display:none}.content{flex:1;min-width:0}.icon{display:inline-flex;flex:none;align-items:center;justify-content:center;color:var(--spui-ui-accent,#0f6cbd)}.icon svg,.dismiss-icon{display:block;width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.icon svg{width:18px;height:18px}slot[name=actions]::slotted(*){display:flex;align-items:center;gap:8px}slot[name=action]::slotted(button){border:0;border-radius:4px;background:transparent;color:inherit;font:inherit;cursor:pointer}slot[name=action]::slotted(button:focus-visible){outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px}:host([intent=success]){border-inline-start-color:var(--spui-ui-success,#107c10);background:var(--spui-success-surface,var(--spui-ui-success-surface,#dff6dd))}:host([intent=success]) .icon{color:var(--spui-ui-success,#107c10)}:host([intent=warning]){border-inline-start-color:var(--spui-ui-warning,#835b00);background:var(--spui-warning-surface,var(--spui-ui-warning-surface,#fff4ce))}:host([intent=warning]) .icon{color:var(--spui-ui-warning,#835b00)}:host([intent=error]){border-inline-start-color:var(--spui-ui-danger,#b10e1c);background:var(--spui-danger-surface,var(--spui-ui-danger-surface,#fde7e9))}:host([intent=error]) .icon{color:var(--spui-ui-danger,#b10e1c)}:host([appearance=inverted]){color:var(--colorNeutralForegroundInverted2,var(--spui-ui-surface,#fff));background:var(--colorNeutralBackgroundInverted,var(--spui-ui-text,#242424));border-color:var(--spui-alert-inverted-border,transparent)}:host([appearance=inverted]) .icon{color:currentColor}button{border:0;border-radius:4px;background:transparent;color:inherit;font:inherit;line-height:1;padding:2px 6px;cursor:pointer}button:hover{background:var(--spui-ui-surface-hover,#0001)}button:focus-visible{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px}button[hidden]{display:none}:host([data-spui-appearance=glass]),:host-context([data-spui-appearance=glass]){backdrop-filter:var(--spui-card-backdrop,none);border-color:var(--spui-card-border,#ffffff80)}@media(forced-colors:active){:host{border-color:CanvasText;color:CanvasText;background:Canvas}.icon{color:CanvasText}}`;
      shadow.append(style, avatar, icon, content, action, actions, button);
    }
  }
  customElements.define("spui-alert", SpuiAlert);
}
