import { base } from "./shared.js";

/** A SharePoint-ready record card with stable semantic parts and freely composed slots. */
export function defineViewCard(): void {
  if (customElements.get("spui-view-card")) return;
  class SpuiViewCard extends HTMLElement {
    static observedAttributes = ["kind", "title", "subtitle", "description"];
    connectedCallback() {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const article = document.createElement("article"); article.part.add("surface");
      const header = document.createElement("header"); header.part.add("header");
      const leading = document.createElement("div"); leading.className = "leading"; leading.part.add("leading"); leading.append(slot("leading"));
      const heading = document.createElement("div"); heading.className = "heading";
      const eyebrow = document.createElement("div"); eyebrow.className = "eyebrow"; eyebrow.part.add("eyebrow"); eyebrow.append(slot("eyebrow"));
      const title = document.createElement("h3"); title.part.add("title"); title.append(slot("title", "title"));
      const subtitle = document.createElement("p"); subtitle.className = "subtitle"; subtitle.part.add("subtitle"); subtitle.append(slot("subtitle", "subtitle"));
      heading.append(eyebrow, title, subtitle);
      const status = document.createElement("div"); status.className = "status"; status.part.add("status"); status.append(slot("status"));
      header.append(leading, heading, status);
      const description = document.createElement("p"); description.className = "description"; description.part.add("description"); description.append(slot("description", "description"));
      const body = document.createElement("div"); body.className = "body"; body.part.add("body"); body.append(slot());
      const footer = document.createElement("footer"); footer.part.add("actions"); footer.append(slot("actions"));
      article.append(header, description, body, footer);
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0}article{box-sizing:border-box;display:flex;flex-direction:column;gap:var(--spui-control-gap,12px);min-height:100%;padding:var(--spui-card-padding,16px);border:1px solid var(--spui-card-border,var(--spui-ui-stroke,var(--spui-semantic-card-border,#d1d1d1)));border-radius:var(--spui-card-radius,8px);background:var(--spui-card-background,var(--spui-ui-surface,var(--spui-semantic-card-background,#fff)));box-shadow:var(--spui-card-shadow,0 1px 3px #0001);color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit))}header{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;gap:var(--spui-control-gap,12px)}.leading:empty,.eyebrow:empty,.subtitle:empty,.description:empty,.status:empty,footer:empty,.body:empty{display:none}.leading{display:grid;place-items:center;min-width:36px;min-height:36px}.heading{min-width:0}.eyebrow{margin:0 0 3px;color:var(--spui-ui-muted,var(--spui-semantic-body-text,#616161));font-size:12px;font-weight:600;letter-spacing:.02em}h3{margin:0;font-size:16px;line-height:1.35;font-weight:650;overflow-wrap:anywhere}.subtitle,.description{margin:3px 0 0;color:var(--spui-ui-muted,var(--spui-semantic-body-text,#616161));font-size:13px;line-height:1.45}.description{margin:0;font-size:14px;color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit))}.status{justify-self:end;align-self:start;font-size:12px}.body{padding-top:10px;border-top:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));font-size:13px}footer{display:flex;align-items:center;gap:var(--spui-control-gap,8px);margin-top:auto;padding-top:4px}::slotted([slot=leading]){max-width:48px;max-height:48px}::slotted([slot=status]){display:inline-flex;align-items:center;padding:4px 9px;border:1px solid var(--spui-base-stroke,var(--spui-ui-stroke,#d1d1d1));border-radius:999px;background:color-mix(in srgb,var(--spui-base-accent,var(--spui-ui-accent,#0078d4)) 12%,var(--spui-base-surface,var(--spui-ui-surface,#fff)));color:var(--spui-ui-text,inherit);font-size:12px;font-weight:600}::slotted([slot=actions]){font:inherit}:host([kind=person]) .leading{border-radius:50%;overflow:hidden}:host([kind=person]) .leading:empty{border-radius:50%;background:var(--spui-ui-canvas,#f5f5f5)}:host([data-spui-appearance=glass]),:host-context([data-spui-appearance=glass]) article{backdrop-filter:var(--spui-card-backdrop,none)}@media(prefers-reduced-motion:reduce){article{scroll-behavior:auto}}@media(forced-colors:active){article{border-color:CanvasText;box-shadow:none}}`;
      shadow.append(style, article);
      for (const name of SpuiViewCard.observedAttributes) this.updateFallback(name);
    }
    attributeChangedCallback(name: string) {
      this.updateFallback(name);
    }
    private updateFallback(name: string) { const fallback = this.shadowRoot?.querySelector<HTMLElement>(`[data-fallback="${name}"]`); if (fallback) fallback.textContent = this.getAttribute(name) ?? ""; }
  }
  customElements.define("spui-view-card", SpuiViewCard);
}

function slot(name?: string, attribute?: string): HTMLSlotElement {
  const element = document.createElement("slot");
  if (name) element.name = name;
  if (attribute) { const fallback = document.createElement("span"); fallback.dataset.fallback = attribute; element.append(fallback); }
  else element.addEventListener("slotchange", () => { if (element.parentElement) element.parentElement.hidden = element.assignedElements().length === 0; });
  return element;
}
