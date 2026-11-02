import { base } from "./shared.js";

export function defineButtonGroup(): void {
  if (customElements.get("spui-button-group")) return;
  class SpuiButtonGroup extends HTMLElement {
    static observedAttributes = ["orientation"];
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `${base}:host{display:inline-flex;align-items:center;gap:var(--spui-button-group-gap,8px);min-width:0;vertical-align:middle}:host([orientation=vertical]){flex-direction:column;align-items:stretch}:host([hidden]){display:none}`;
        shadow.append(style, document.createElement("slot"));
      }
      this.setAttribute("role", "group");
    }
    attributeChangedCallback(): void { if (this.isConnected) this.setAttribute("role", "group"); }
  }
  customElements.define("spui-button-group", SpuiButtonGroup);
}
