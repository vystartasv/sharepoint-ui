import { base } from "./shared.js";

export type DividerAppearance = "brand" | "default" | "strong" | "subtle";

export function defineDivider(): void {
  if (customElements.get("spui-divider")) return;
  class SpuiDivider extends HTMLElement {
    static observedAttributes = ["orientation", "vertical", "align", "align-content", "appearance", "inset"];
    private generatedAriaLabel?: string;
    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.sync();
    }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      const orientation = this.hasAttribute("vertical") || this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
      this.dataset.orientation = orientation;
      const wrapper = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=wrapper]");
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot:not([name])");
      const hasLabel = Boolean(wrapper?.assignedNodes().length
        ? wrapper.assignedNodes().some(node => node.nodeType === Node.ELEMENT_NODE || Boolean(node.textContent?.trim()))
        : slot?.assignedNodes().some(node => node.nodeType === Node.ELEMENT_NODE || Boolean(node.textContent?.trim())));
      this.dataset.hasLabel = String(hasLabel);
      this.dataset.alignContent = this.getAttribute("align-content") ?? this.getAttribute("align") ?? "center";
      this.dataset.dividerAppearance = this.getAttribute("appearance") ?? "default";
      this.setAttribute("role", "separator");
      this.setAttribute("aria-orientation", orientation);
      if (hasLabel && !this.hasAttribute("aria-labelledby")) {
        const label = this.textContent?.trim();
        if (label && (this.getAttribute("aria-label") === null || this.getAttribute("aria-label") === this.generatedAriaLabel)) {
          this.generatedAriaLabel = label;
          if (this.getAttribute("aria-label") !== label) this.setAttribute("aria-label", label);
        }
      } else if (this.generatedAriaLabel !== undefined && this.getAttribute("aria-label") === this.generatedAriaLabel) {
        this.removeAttribute("aria-label");
        this.generatedAriaLabel = undefined;
      }
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const before = document.createElement("span"); before.className = "line"; before.part.add("line"); before.setAttribute("aria-hidden", "true");
      const after = document.createElement("span"); after.className = "line"; after.part.add("line"); after.setAttribute("aria-hidden", "true");
      const wrapper = document.createElement("div"); wrapper.className = "wrapper";
      const wrapperSlot = document.createElement("slot"); wrapperSlot.name = "wrapper"; wrapperSlot.addEventListener("slotchange", () => this.sync());
      const slot = document.createElement("slot"); slot.addEventListener("slotchange", () => this.sync());
      wrapperSlot.append(slot); wrapper.append(wrapperSlot);
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:flex;align-items:center;gap:var(--spui-divider-gap,12px);min-width:0;margin-block:var(--spui-divider-margin-block,12px);color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));font:inherit}:host([data-orientation=vertical]){display:inline-flex;flex-direction:column;align-self:stretch;min-height:1em;width:1px;margin-inline:var(--spui-divider-margin-inline,12px);margin-block:0}:host([data-has-label=false]) .wrapper{display:none}:host([data-has-label=false]) .line:last-of-type{display:none}:host([data-has-label=true]) .wrapper{font-size:.875em;line-height:1.25;text-align:center}.wrapper{min-width:0}.line{flex:1;min-height:1px;background:var(--spui-divider-color,var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1)))}:host([data-orientation=vertical]) .line{min-height:0;width:1px;height:auto;min-width:1px;background:var(--spui-divider-color,var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1)))}:host([data-divider-appearance=brand]) .line{background:var(--spui-divider-color,var(--spui-base-accent,var(--spui-ui-accent,#0078d4)))}:host([data-divider-appearance=strong]) .line{background:var(--spui-divider-color,color-mix(in srgb,var(--spui-ui-text,#242424) 44%,var(--spui-ui-stroke,#d1d1d1)))}:host([data-divider-appearance=subtle]) .line{background:var(--spui-divider-color,color-mix(in srgb,var(--spui-ui-stroke,#d1d1d1) 56%,transparent))}:host([data-align-content=start]) .line:first-of-type{flex:0}:host([data-align-content=end]) .line:last-of-type{flex:0}:host([data-align-content=center]) .line{flex:1}:host([inset]){margin-inline-start:var(--spui-divider-inset,16px)}@media(forced-colors:active){.line{background:CanvasText}}`;
      shadow.append(style, before, wrapper, after);
    }
  }
  customElements.define("spui-divider", SpuiDivider);
}
