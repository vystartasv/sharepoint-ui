import { base } from "./shared.js";

function ratingValue(element: HTMLElement): { value: number; max: number } {
  const parent = element.closest<HTMLElement>("spui-rating-display");
  const maxRaw = Number(parent?.getAttribute("max") ?? element.getAttribute("max") ?? 5);
  const max = Number.isInteger(maxRaw) && maxRaw > 1 ? Math.min(20, maxRaw) : 5;
  const valueRaw = Number(parent?.getAttribute("value") ?? element.getAttribute("rating") ?? 0);
  return { value: Number.isFinite(valueRaw) ? Math.max(0, Math.min(max, valueRaw)) : 0, max };
}

export function defineRatingItem(): void {
  if (customElements.get("spui-rating-item")) return;
  class SpuiRatingItem extends HTMLElement {
    static observedAttributes = ["value", "rating", "max", "size", "color"];
    connectedCallback(): void { this.render(); }
    attributeChangedCallback(): void { if (this.isConnected) this.render(); }
    private render(): void {
      const { value: rating } = ratingValue(this);
      const raw = Number(this.getAttribute("value") ?? 1);
      const itemValue = Number.isInteger(raw) && raw > 0 ? raw : 1;
      const amount = Math.max(0, Math.min(1, rating - itemValue + 1));
      this.setAttribute("aria-hidden", "true");
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{position:relative;display:inline-block;flex:none;width:var(--spui-rating-size,24px);height:var(--spui-rating-size,24px);font-size:var(--spui-rating-size,24px);line-height:1;color:var(--spui-rating-empty,color-mix(in srgb,var(--spui-ui-text,var(--spui-semantic-body-text,#242424)) 65%,var(--spui-ui-surface,var(--spui-semantic-body-background,#ffffff)) 35%));user-select:none}.outline,.filled{position:absolute;inset:0;display:block;overflow:hidden;white-space:nowrap}.outline slot::slotted(*),.filled slot::slotted(*){font:inherit}.outline slot::slotted(*){color:var(--spui-rating-empty,color-mix(in srgb,var(--spui-ui-text,var(--spui-semantic-body-text,#242424)) 65%,var(--spui-ui-surface,var(--spui-semantic-body-background,#ffffff)) 35%))}.filled{inset-inline-start:0;width:${amount * 100}%;color:var(--spui-rating-color,var(--spui-ui-accent,#0078d4))}.filled slot::slotted(*){color:var(--spui-rating-color,var(--spui-ui-accent,#0078d4))}:host(:not([color])),:host([color=neutral]){--spui-rating-color:var(--spui-ui-text,var(--spui-semantic-body-text,currentColor))}:host([color=brand]){--spui-rating-color:color-mix(in srgb,var(--spui-ui-accent,#0078d4) 65%,var(--spui-ui-text,var(--spui-semantic-body-text,#242424)) 35%)}:host([color=marigold]){--spui-rating-color:color-mix(in srgb,var(--spui-rating-marigold,#c58b00) 65%,var(--spui-ui-text,var(--spui-semantic-body-text,#242424)) 35%)}:host([size=small]){--spui-rating-size:18px}:host([size=medium]){--spui-rating-size:24px}:host([size=large]){--spui-rating-size:30px}:host([size=extra-large]){--spui-rating-size:36px}@media(forced-colors:active){:host{color:CanvasText}.filled{color:Highlight}}`;
      const outline = document.createElement("span"); outline.className = "outline"; outline.part.add("unselected-icon");
      const outlineSlot = document.createElement("slot"); outlineSlot.name = "unselected-icon"; outlineSlot.textContent = "☆"; outline.append(outlineSlot);
      const filled = document.createElement("span"); filled.className = "filled"; filled.part.add("selected-icon");
      const filledSlot = document.createElement("slot"); filledSlot.name = "selected-icon"; filledSlot.textContent = "★"; filled.append(filledSlot);
      shadow.replaceChildren(style, outline, filled);
    }
  }
  customElements.define("spui-rating-item", SpuiRatingItem);
}

export function defineRatingDisplay(): void {
  defineRatingItem();
  if (customElements.get("spui-rating-display")) return;
  class SpuiRatingDisplay extends HTMLElement {
    static observedAttributes = ["value", "max", "count", "compact", "size", "color", "aria-label", "lang"];
    connectedCallback(): void { this.render(); }
    attributeChangedCallback(): void { if (this.isConnected) this.render(); }
    private render(): void {
      const maxRaw = Number(this.getAttribute("max") ?? 5);
      const max = Number.isInteger(maxRaw) && maxRaw > 1 ? Math.min(20, maxRaw) : 5;
      const hasValue = this.hasAttribute("value");
      const valueRaw = Number(this.getAttribute("value") ?? 0);
      const value = Number.isFinite(valueRaw) ? Math.max(0, Math.min(max, valueRaw)) : 0;
      const countRaw = this.getAttribute("count");
      const explicitLabel = this.getAttribute("aria-label");
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex;align-items:center;gap:6px;min-width:0;color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font-family:var(--spui-font-family,inherit)}.root{display:inline-flex;align-items:center;gap:6px}.items{display:inline-flex;align-items:center;gap:2px}.value-text,.count-text{color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));font-size:var(--spui-rating-label-size,14px);font-variant-numeric:tabular-nums}.count-text:before{content:"("}.count-text:after{content:")"}:host([compact]) .items{gap:0}@media(forced-colors:active){:host{color:CanvasText}}`;
      const root = document.createElement("span"); root.className = "root"; root.setAttribute("role", "img"); root.setAttribute("aria-label", explicitLabel || `${value} of ${max}${countRaw === null ? "" : `, ${Number(countRaw).toLocaleString(this.lang || undefined)} ratings`}`);
      const items = document.createElement("span"); items.className = "items"; items.part.add("items");
      const slot = document.createElement("slot");
      const hasItems = [...this.children].some(child => child.localName === "spui-rating-item");
      if (!hasItems) {
        const itemCount = this.hasAttribute("compact") ? 1 : max;
        for (let index = 1; index <= itemCount; index++) {
          const item = document.createElement("spui-rating-item");
          item.setAttribute("value", String(index)); item.setAttribute("rating", String(value)); item.setAttribute("max", String(max));
          if (this.hasAttribute("size")) item.setAttribute("size", this.getAttribute("size")!);
          if (this.hasAttribute("color")) item.setAttribute("color", this.getAttribute("color")!);
          items.append(item);
        }
      } else {
        slot.addEventListener("slotchange", () => this.syncItems(slot, value, max));
        items.append(slot);
      }
      const valueText = document.createElement("span"); valueText.className = "value-text"; valueText.part.add("value-text");
      const valueSlot = document.createElement("slot"); valueSlot.name = "value-text"; valueSlot.textContent = String(value); valueText.append(valueSlot);
      const countText = document.createElement("span"); countText.className = "count-text"; countText.part.add("count-text");
      const countSlot = document.createElement("slot"); countSlot.name = "count-text"; countSlot.textContent = countRaw === null ? "" : Number(countRaw).toLocaleString(this.lang || undefined); countText.append(countSlot);
      if (!hasValue) valueText.hidden = true;
      if (countRaw === null) countText.hidden = true;
      root.append(items, valueText, countText);
      shadow.replaceChildren(style, root);
      if (hasItems) this.syncItems(slot, value, max);
    }
    private syncItems(slot: HTMLSlotElement, value: number, max: number): void {
      for (const item of slot.assignedElements().filter((node): node is HTMLElement => node.localName === "spui-rating-item")) {
        item.setAttribute("rating", String(value)); item.setAttribute("max", String(max));
        for (const name of ["size", "color"]) this.hasAttribute(name) ? item.setAttribute(name, this.getAttribute(name)!) : item.removeAttribute(name);
      }
    }
  }
  customElements.define("spui-rating-display", SpuiRatingDisplay);
}
