import { base } from "./shared.js";

export type ProgressBarColor = "brand" | "success" | "warning" | "error";
export type ProgressBarShape = "rounded" | "square";
export type ProgressBarThickness = "medium" | "large";

export function defineProgressBar(): void {
  if (customElements.get("spui-progress-bar")) return;
  class SpuiProgressBar extends HTMLElement {
    static observedAttributes = ["value", "max", "label", "aria-label", "aria-labelledby", "aria-describedby", "aria-valuetext", "color", "shape", "thickness"];
    private generatedLabel?: string;
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" });
        const progress = document.createElement("div"); progress.className = "track"; progress.setAttribute("aria-hidden", "true"); progress.part.add("track");
        const bar = document.createElement("slot"); bar.name = "bar"; bar.append(Object.assign(document.createElement("span"), { className: "indicator" })); progress.append(bar);
        const motion = document.createElement("slot"); motion.name = "indeterminateMotion"; motion.setAttribute("aria-hidden", "true"); progress.append(motion);
        const style = document.createElement("style");
        style.textContent = `${base}:host{display:block;min-width:0}.track{position:relative;display:block;width:100%;height:2px;overflow:hidden;border-radius:var(--spui-progress-radius,999px);background:var(--spui-progress-track,color-mix(in srgb,currentColor 10%,transparent))}.indicator{position:absolute;inset-block:0;inset-inline-start:0;width:100%;border-radius:inherit;background:var(--spui-progress-color,var(--spui-ui-accent,var(--spui-semantic-focus-border,#0f6cbd)));transform-origin:left center}:host([dir=rtl]) .indicator{transform-origin:right center}:host([data-determinate-transition]) .indicator,:host([data-determinate-transition]) slot[name=bar]::slotted([slot=bar]){transition:transform 300ms ease,width 300ms ease}:host([thickness=large]) .track{height:4px}:host([shape=square]){--spui-progress-radius:0px}:host([color=success]){--spui-progress-color:var(--spui-ui-success,#107c10)}:host([color=warning]){--spui-progress-color:var(--spui-ui-warning,#835b00)}:host([color=error]){--spui-progress-color:var(--spui-ui-danger,#b10e1c)}:host([data-indeterminate]) .indicator{width:33%;animation:spui-progress-indeterminate 3s linear infinite}:host([dir=rtl][data-indeterminate]) .indicator{animation-name:spui-progress-indeterminate-rtl}:host([data-indeterminate][data-custom-motion]) .indicator{display:none}slot[name=bar]::slotted([slot=bar]){width:var(--spui-progress-value,100%);height:100%;border-radius:inherit;background:var(--spui-progress-color,var(--spui-ui-accent,var(--spui-semantic-focus-border,#0f6cbd)))}:host([data-indeterminate]) slot[name=bar]::slotted([slot=bar]){width:33%;animation:spui-progress-indeterminate 3s linear infinite}:host([dir=rtl][data-indeterminate]) slot[name=bar]::slotted([slot=bar]){animation-name:spui-progress-indeterminate-rtl}slot[name=indeterminateMotion]::slotted(*){position:absolute;inset-block:0;inset-inline-start:0;width:33%;height:100%}:host([dir=rtl]) slot[name=indeterminateMotion]::slotted(*){inset-inline-start:auto;inset-inline-end:0}@keyframes spui-progress-indeterminate{from{transform:translateX(-100%)}to{transform:translateX(300%)}}@keyframes spui-progress-indeterminate-rtl{from{transform:translateX(100%)}to{transform:translateX(-300%)}}@media(prefers-reduced-motion:reduce){.indicator{transition:none}:host([data-indeterminate]) .indicator,:host([dir=rtl][data-indeterminate]) .indicator{width:100%;animation:spui-progress-pulse 3s linear infinite}:host([data-indeterminate]) slot[name=bar]::slotted([slot=bar]),:host([dir=rtl][data-indeterminate]) slot[name=bar]::slotted([slot=bar]){width:100%;animation:spui-progress-pulse 3s linear infinite}}@keyframes spui-progress-pulse{0%,100%{opacity:.2}50%{opacity:1}}@media(forced-colors:active){.track{forced-color-adjust:none;background:Canvas;border:1px solid CanvasText}.indicator,slot[name=bar]::slotted([slot=bar]){background:Highlight}}`;
        style.textContent += `:host(:not([color])),:host([color=brand]){--spui-progress-color:color-mix(in srgb,var(--spui-ui-accent,#0f6cbd) 45%,currentColor 55%)}:host([color=success]){--spui-progress-color:color-mix(in srgb,var(--spui-ui-success,#107c10) 45%,currentColor 55%)}:host([color=warning]){--spui-progress-color:color-mix(in srgb,var(--spui-ui-warning,#835b00) 45%,currentColor 55%)}:host([color=error]){--spui-progress-color:color-mix(in srgb,var(--spui-ui-danger,#b10e1c) 45%,currentColor 55%)}`;
        shadow.append(style, progress);
        progress.querySelectorAll("slot").forEach(slot => slot.addEventListener("slotchange", () => this.sync()));
      }
      this.sync();
    }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      const progress = this.shadowRoot?.querySelector<HTMLElement>(".track");
      if (!progress) return;
      this.toggleAttribute("data-custom-motion", (this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="indeterminateMotion"]')?.assignedElements().length ?? 0) > 0);
      this.setAttribute("role", "progressbar");
      const max = Number(this.getAttribute("max"));
      const normalizedMax = Number.isFinite(max) && max > 0 ? max : 1;
      const raw = this.getAttribute("value");
      const value = raw === null ? null : Number(raw);
      this.setAttribute("aria-valuemin", "0");
      this.setAttribute("aria-valuemax", String(normalizedMax));
      if (value === null || !Number.isFinite(value)) {
        this.setAttribute("data-indeterminate", "");
        this.removeAttribute("data-determinate-transition");
        this.removeAttribute("aria-valuenow");
        const indicator = this.shadowRoot?.querySelector<HTMLElement>(".indicator");
        if (indicator) indicator.style.removeProperty("transform");
        const slottedBar = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=bar]")?.assignedElements()[0] as HTMLElement | undefined;
        slottedBar?.style.removeProperty("--spui-progress-value");
      } else {
        this.removeAttribute("data-indeterminate");
        const bounded = Math.min(normalizedMax, Math.max(0, value));
        this.toggleAttribute("data-determinate-transition", bounded / normalizedMax > 0.01);
        this.setAttribute("aria-valuenow", String(bounded));
        const indicator = this.shadowRoot?.querySelector<HTMLElement>(".indicator");
        if (indicator) indicator.style.transform = `scaleX(${bounded / normalizedMax})`;
        const slottedBar = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=bar]")?.assignedElements()[0] as HTMLElement | undefined;
        slottedBar?.style.setProperty("--spui-progress-value", `${bounded / normalizedMax * 100}%`);
      }
      if (this.hasAttribute("aria-labelledby")) {
        if (this.generatedLabel !== undefined && this.getAttribute("aria-label") === this.generatedLabel) this.removeAttribute("aria-label");
        this.generatedLabel = undefined;
      } else if (this.getAttribute("aria-label") === null || this.getAttribute("aria-label") === this.generatedLabel) {
        const label = this.getAttribute("label") ?? "Loading";
        this.generatedLabel = label;
        if (this.getAttribute("aria-label") !== label) this.setAttribute("aria-label", label);
      } else this.generatedLabel = undefined;
    }
  }
  customElements.define("spui-progress-bar", SpuiProgressBar);
}
