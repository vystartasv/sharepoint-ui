import { base } from "./shared.js";

export function defineCardHeader(): void {
  if (customElements.get("spui-card-header")) return;
  class SpuiCardHeader extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0}.layout{display:grid;grid-template-columns:max-content minmax(0,1fr) max-content;align-items:center;column-gap:var(--spui-control-gap,12px);row-gap:3px}.main{display:grid;grid-template-columns:minmax(0,1fr);row-gap:3px;min-width:0}slot[name=image]{grid-column:1;grid-row:1 / span 2}slot[name=action]{grid-column:3;grid-row:1 / span 2;justify-self:end}slot[name=header]{font-size:var(--spui-card-header-size,14px);font-weight:600;line-height:1.35}slot[name=description]{color:var(--spui-ui-muted,var(--spui-semantic-body-text,#616161));font-size:12px;line-height:1.4}::slotted([slot=image]){display:inline-flex;max-width:48px;max-height:48px;align-items:center;justify-content:center}::slotted([slot=action]){display:inline-flex;align-items:center;justify-content:flex-end}@media(forced-colors:active){slot[name=description]{color:CanvasText}}`;
      const layout = document.createElement("div"); layout.className = "layout"; layout.part.add("root");
      const image = document.createElement("slot"); image.name = "image"; image.part.add("image");
      const main = document.createElement("div"); main.className = "main"; main.part.add("content");
      const header = document.createElement("slot"); header.name = "header"; header.part.add("header");
      const defaultHeader = document.createElement("slot");
      const description = document.createElement("slot"); description.name = "description"; description.part.add("description");
      main.append(header); header.append(defaultHeader); main.append(description);
      const action = document.createElement("slot"); action.name = "action"; action.part.add("action");
      layout.append(image, main, action); shadow.append(style, layout);
    }
  }
  customElements.define("spui-card-header", SpuiCardHeader);
}

export function defineCardFooter(): void {
  if (customElements.get("spui-card-footer")) return;
  class SpuiCardFooter extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:flex;flex-wrap:wrap;align-items:center;gap:var(--spui-control-gap,12px);min-width:0}slot[name=action]{margin-inline-start:auto}::slotted([slot=action]){display:inline-flex;align-items:center;justify-content:flex-end}@media(forced-colors:active){:host{color:CanvasText}}`;
      const content = document.createElement("slot"); content.part.add("content");
      const action = document.createElement("slot"); action.name = "action"; action.part.add("action");
      shadow.append(style, content, action);
    }
  }
  customElements.define("spui-card-footer", SpuiCardFooter);
}

export function defineCardPreview(): void {
  if (customElements.get("spui-card-preview")) return;
  class SpuiCardPreview extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{position:relative;display:block;min-width:0;overflow:hidden;margin-inline:calc(-1 * var(--spui-card-padding,16px));border-radius:inherit}:host(:first-child){margin-block-start:calc(-1 * var(--spui-card-padding,16px))}.preview{position:relative;min-width:0;overflow:hidden}slot:not([name=logo]){display:block}::slotted(img),::slotted(video),::slotted(picture){display:block;width:100%;max-width:100%;height:auto;max-height:360px;object-fit:cover}slot[name=logo]{position:absolute;inset-block-end:10px;inset-inline-start:10px;display:flex;align-items:center;justify-content:center;max-width:calc(100% - 20px);padding:4px;border:1px solid var(--spui-ui-stroke,#d1d1d1);border-radius:var(--spui-control-radius,6px);background:var(--spui-ui-surface,#fff);box-shadow:var(--spui-card-shadow,0 1px 3px #0002)}::slotted([slot=logo]){max-width:100%;max-height:40px}@media(forced-colors:active){:host{border:1px solid CanvasText}slot[name=logo]{border-color:CanvasText;background:Canvas;box-shadow:none}}`;
      const preview = document.createElement("div"); preview.className = "preview"; preview.part.add("root");
      const content = document.createElement("slot"); content.part.add("content");
      const logo = document.createElement("slot"); logo.name = "logo"; logo.part.add("logo");
      preview.append(content, logo); shadow.append(style, preview);
    }
  }
  customElements.define("spui-card-preview", SpuiCardPreview);
}
