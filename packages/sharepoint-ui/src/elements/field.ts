import { base } from "./shared.js";

export function defineField(): void {
  if (customElements.get("spui-field")) return;
  class SpuiField extends HTMLElement {
    static observedAttributes = ["label", "value", "type", "disabled", "required", "read-only", "placeholder", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"];
    connectedCallback() { this.render(); }
    attributeChangedCallback(name: string) {
      if (!this.isConnected) return;
      const input = this.shadowRoot?.querySelector("input"); if (!input) return;
      if (name === "value") { const value = this.getAttribute(name) ?? ""; if (input.value !== value) input.value = value; return; }
      if (name === "label") { const label = this.shadowRoot?.querySelector("label"); if (label) label.textContent = this.getAttribute(name) ?? ""; return; }
      if (name === "disabled") input.disabled = this.hasAttribute(name);
      if (name === "required") input.required = this.hasAttribute(name);
      if (name === "read-only") input.readOnly = this.hasAttribute(name);
      if (name === "placeholder") input.placeholder = this.getAttribute(name) ?? "";
      if (name === "aria-label" || name === "aria-labelledby" || name === "aria-description" || name === "aria-describedby" || name === "aria-invalid") { const value = this.getAttribute(name); value === null ? input.removeAttribute(name) : input.setAttribute(name, value); }
    }
    render() {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const id = `field-${Math.random().toString(36).slice(2)}`;
      const label = document.createElement("label"); label.htmlFor = id; label.textContent = this.getAttribute("label") ?? "";
      label.part.add("label");
      const input = document.createElement("input"); input.id = id; input.type = this.getAttribute("type") ?? "text"; input.value = this.getAttribute("value") ?? ""; input.disabled = this.hasAttribute("disabled"); input.required = this.hasAttribute("required"); input.readOnly = this.hasAttribute("read-only"); input.placeholder = this.getAttribute("placeholder") ?? "";
      input.part.add("control");
      for (const name of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) { const value = this.getAttribute(name); if (value !== null) input.setAttribute(name, value); }
      input.addEventListener("input", () => this.dispatchEvent(new CustomEvent("spui-input", { bubbles: true, composed: true, detail: { value: input.value } })));
      const style = document.createElement("style"); style.textContent = `${base}:host{display:grid;gap:var(--spui-control-gap,6px)}label:empty{display:none}label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}input{min-height:var(--spui-control-height,36px);padding-inline:var(--spui-control-padding-inline,12px);border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,var(--colorNeutralStroke1,#8a8886))));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,var(--colorNeutralBackground1,#fff))));box-shadow:var(--spui-control-shadow,none);color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit))}input:disabled{opacity:.55}@media(forced-colors:active){input{border-color:FieldText}}`;
      shadow.replaceChildren(style, label, input);
    }
  }
  customElements.define("spui-field", SpuiField);
}
