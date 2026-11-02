import { base } from "./shared.js";

export type SkeletonAnimation = "wave" | "pulse" | "none";
export type SkeletonAppearance = "opaque" | "translucent";
export type SkeletonShape = "text" | "rectangle" | "rounded" | "circle" | "square";

export function defineSkeleton(): void {
  if (customElements.get("spui-skeleton")) return;
  defineSkeletonItem();
  class SpuiSkeleton extends HTMLElement {
    static observedAttributes = ["shape", "width", "height", "animated", "animation", "appearance", "size"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      const shape = this.getAttribute("shape") ?? "text";
      this.dataset.shape = ["text", "rectangle", "circle", "rounded", "square"].includes(shape) ? shape : "text";
      const width = this.getAttribute("width"); const height = this.getAttribute("height");
      if (width) this.style.setProperty("--spui-skeleton-width", width); else this.style.removeProperty("--spui-skeleton-width");
      if (height) this.style.setProperty("--spui-skeleton-height", height); else this.style.removeProperty("--spui-skeleton-height");
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot");
      const hasItems = Boolean(slot?.assignedElements().length);
      this.toggleAttribute("data-has-items", hasItems);
      const animation = this.getAttribute("animated") === "false" ? "none" : this.getAttribute("animation") ?? "wave";
      this.dataset.animation = ["wave", "pulse", "none"].includes(animation) ? animation : "wave";
      this.dataset.appearance = this.getAttribute("appearance") === "translucent" ? "translucent" : "opaque";
      if (hasItems) {
        this.removeAttribute("aria-hidden");
        if (!this.hasAttribute("role")) this.setAttribute("role", "progressbar");
        if (!this.hasAttribute("aria-busy")) this.setAttribute("aria-busy", "true");
        for (const item of this.querySelectorAll<HTMLElement>("spui-skeleton-item")) (item as HTMLElement & { refresh?: () => void }).refresh?.();
      } else {
        this.removeAttribute("data-has-items");
        this.setAttribute("aria-hidden", "true");
      }
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const block = document.createElement("span"); block.part.add("shape");
      const children = document.createElement("slot"); children.addEventListener("slotchange", () => this.sync());
      const style = document.createElement("style"); style.textContent = `${base}:host{display:inline-block;vertical-align:middle;width:var(--spui-skeleton-width,100%);height:var(--spui-skeleton-height,1em);max-width:100%;overflow:hidden;border-radius:3px;background:var(--spui-skeleton-background,var(--spui-ui-stroke,#e5e5e5));color:transparent}:host([data-appearance=translucent]){background:var(--spui-skeleton-translucent,color-mix(in srgb,var(--spui-skeleton-background,var(--spui-ui-stroke,#e5e5e5)) 28%,transparent))}:host([data-shape=text]){height:var(--spui-skeleton-height,1em);width:var(--spui-skeleton-width,100%);border-radius:3px}:host([data-shape=rectangle]){height:var(--spui-skeleton-height,120px);border-radius:var(--spui-card-radius,8px)}:host([data-shape=rounded]){height:var(--spui-skeleton-height,40px);border-radius:999px}:host([data-shape=circle]){width:var(--spui-skeleton-width,40px);height:var(--spui-skeleton-height,40px);border-radius:50%}:host([data-shape=square]){width:var(--spui-skeleton-width,40px);height:var(--spui-skeleton-height,40px);border-radius:3px}:host([data-has-items]){display:block;width:auto;height:auto;overflow:visible;background:none}span{display:block;width:100%;height:100%;background:linear-gradient(100deg,transparent 20%,color-mix(in srgb,var(--spui-ui-surface,#fff) 55%,transparent) 50%,transparent 80%);background-size:200% 100%;animation:shimmer 1.5s ease-in-out infinite}:host([data-animation=pulse]) span{animation:spui-skeleton-pulse 1s ease-in-out infinite;background:none}slot{display:none}:host([data-has-items]) span{display:none}:host([data-has-items]) slot{display:block}:host([data-has-items]) slot::slotted(spui-skeleton-item){margin-inline-end:8px}@keyframes shimmer{to{background-position-x:-200%}}@keyframes spui-skeleton-pulse{50%{opacity:.4}}:host([animated=false]) span,:host([data-animation=none]) span{animation:none;background:none}@media(prefers-reduced-motion:reduce){span{animation:none;background:none}}@media(forced-colors:active){:host{forced-color-adjust:none;background:CanvasText;opacity:.25}span{display:none}}`;
      shadow.append(style, block, children);
    }
  }
  customElements.define("spui-skeleton", SpuiSkeleton);
}

export type SkeletonItemSize = 8 | 12 | 14 | 16 | 20 | 22 | 24 | 28 | 32 | 36 | 40 | 48 | 52 | 56 | 64 | 72 | 92 | 96 | 120 | 128;
const skeletonItemSizes = new Set<number>([8, 12, 14, 16, 20, 22, 24, 28, 32, 36, 40, 48, 52, 56, 64, 72, 92, 96, 120, 128]);

export function defineSkeletonItem(): void {
  if (customElements.get("spui-skeleton-item")) return;
  class SpuiSkeletonItem extends HTMLElement {
    static observedAttributes = ["animation", "appearance", "size", "shape"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    refresh(): void { this.sync(); }
    private sync(): void {
      const parent = this.closest<HTMLElement>("spui-skeleton");
      const animation = this.getAttribute("animation") ?? (parent?.getAttribute("animated") === "false" ? "none" : parent?.getAttribute("animation") ?? "wave");
      const appearance = this.getAttribute("appearance") ?? parent?.getAttribute("appearance") ?? "opaque";
      const requestedSize = Number(this.getAttribute("size") ?? parent?.getAttribute("size") ?? 16);
      const size = skeletonItemSizes.has(requestedSize) ? requestedSize : 16;
      const shape = this.getAttribute("shape") ?? parent?.getAttribute("shape") ?? "rectangle";
      this.dataset.animation = ["wave", "pulse", "none"].includes(animation) ? animation : "wave";
      this.dataset.appearance = appearance === "translucent" ? "translucent" : "opaque";
      this.dataset.size = String(size);
      this.dataset.shape = ["circle", "square", "rectangle"].includes(shape) ? shape : "rectangle";
      this.setAttribute("aria-hidden", "true");
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const sizeRules = [...skeletonItemSizes].map(size => `:host([data-size="${size}"]){--spui-skeleton-size:${size}px}`).join("");
      const style = document.createElement("style"); style.textContent = `${base}:host{position:relative;display:inline-block;vertical-align:middle;box-sizing:border-box;overflow:hidden;min-width:0;background:var(--spui-skeleton-background,var(--spui-ui-stroke,#e1e1e1));border-radius:4px}${sizeRules}:host([data-shape=rectangle]){display:block;width:100%;height:var(--spui-skeleton-size,16px)}:host([data-shape=square]){width:var(--spui-skeleton-size,16px);height:var(--spui-skeleton-size,16px)}:host([data-shape=circle]){width:var(--spui-skeleton-size,16px);height:var(--spui-skeleton-size,16px);border-radius:50%}:host([data-appearance=translucent]){background:var(--spui-skeleton-translucent,color-mix(in srgb,var(--spui-skeleton-background,var(--spui-ui-stroke,#e1e1e1)) 28%,transparent))}:host::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 0%,var(--spui-skeleton-highlight,color-mix(in srgb,var(--spui-ui-surface,#fff) 60%,transparent)) 50%,transparent 100%);transform:translateX(-100%);animation:spui-skeleton-wave 1.5s ease-in-out infinite}:host([data-animation=pulse]){animation:spui-skeleton-pulse 1s ease-in-out infinite}:host([data-animation=pulse])::after{display:none}:host([data-animation=none]){animation:none}:host([data-animation=none])::after{display:none}@keyframes spui-skeleton-wave{to{transform:translateX(100%)}}@keyframes spui-skeleton-pulse{50%{opacity:.4}}@media(prefers-reduced-motion:reduce){:host,:host::after{animation:none}}@media(forced-colors:active){:host{forced-color-adjust:none;background:CanvasText;opacity:.25}:host::after{display:none}}`;
      shadow.append(style);
    }
  }
  customElements.define("spui-skeleton-item", SpuiSkeletonItem);
}
