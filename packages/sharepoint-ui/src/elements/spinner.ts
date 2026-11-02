import { base } from "./shared.js";

export type SpinnerSize = "extra-tiny" | "tiny" | "extra-small" | "small" | "medium" | "large" | "extra-large" | "huge";
export type SpinnerAppearance = "primary" | "inverted";
export type SpinnerLabelPosition = "above" | "below" | "before" | "after";

const sizes: SpinnerSize[] = ["extra-tiny", "tiny", "extra-small", "small", "medium", "large", "extra-large", "huge"];
const positions: SpinnerLabelPosition[] = ["above", "below", "before", "after"];

export function defineSpinner(): void {
  if (customElements.get("spui-spinner")) return;
  class SpuiSpinner extends HTMLElement {
    static observedAttributes = ["label", "size", "appearance", "label-position", "delay"];
    private delayTimer?: ReturnType<typeof setTimeout>;

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.sync();
      this.syncDelay();
    }
    disconnectedCallback(): void { clearTimeout(this.delayTimer); this.delayTimer = undefined; }
    attributeChangedCallback(name: string): void {
      if (!this.isConnected) return;
      if (name === "delay") this.syncDelay();
      this.sync();
    }

    private sync(): void {
      const ring = this.shadowRoot?.querySelector<HTMLElement>(".ring");
      const label = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=label]");
      if (!ring || !label) return;
      const size = this.getAttribute("size") as SpinnerSize;
      this.dataset.size = sizes.includes(size) ? size : "medium";
      const appearance = this.getAttribute("appearance");
      this.dataset.appearance = appearance === "inverted" ? "inverted" : "primary";
      const position = this.getAttribute("label-position") as SpinnerLabelPosition;
      this.dataset.labelPosition = positions.includes(position) ? position : "after";
      const text = this.getAttribute("label") ?? "Loading";
      label.textContent = text;
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", text);
      this.setAttribute("role", "progressbar");
      this.setAttribute("aria-busy", "true");
      ring.setAttribute("aria-hidden", "true");
    }

    private syncDelay(): void {
      clearTimeout(this.delayTimer);
      this.delayTimer = undefined;
      const delay = Number(this.getAttribute("delay") ?? 0);
      if (!Number.isFinite(delay) || delay <= 0) { this.removeAttribute("data-delay-pending"); return; }
      this.setAttribute("data-delay-pending", "");
      this.delayTimer = setTimeout(() => { this.delayTimer = undefined; this.removeAttribute("data-delay-pending"); }, Math.min(delay, 60_000));
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const ring = document.createElement("span"); ring.className = "ring"; ring.part.add("indicator"); ring.setAttribute("aria-hidden", "true");
      const spinnerSlot = document.createElement("slot"); spinnerSlot.name = "spinner"; spinnerSlot.append(ring);
      const spinnerTail = document.createElement("slot"); spinnerTail.name = "spinner-tail"; spinnerTail.setAttribute("aria-hidden", "true");
      const defaultTail = document.createElement("span"); defaultTail.className = "tail"; defaultTail.setAttribute("aria-hidden", "true"); spinnerTail.append(defaultTail);
      const spinner = document.createElement("span"); spinner.className = "spinner"; spinner.part.add("spinner"); spinner.append(spinnerSlot, spinnerTail);
      const label = document.createElement("span"); label.className = "label"; label.part.add("label"); label.setAttribute("aria-hidden", "true");
      const slot = document.createElement("slot"); slot.name = "label"; label.append(slot);
      const style = document.createElement("style");
      style.textContent = `${base}
        :host{box-sizing:border-box;position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;line-height:1;min-width:min-content;color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424))}
        :host([data-delay-pending]){display:none}
        :host([data-label-position=above]),:host([data-label-position=below]){flex-direction:column}
        .spinner{position:relative;display:block;flex:none;width:var(--spui-spinner-size,32px);height:var(--spui-spinner-size,32px);background:var(--spui-spinner-track,var(--colorBrandStroke2Contrast,var(--spui-ui-stroke,#edebe9)));color:var(--spui-spinner-active,var(--colorBrandStroke1,var(--spui-ui-accent,#005a9e)));mask-image:radial-gradient(closest-side,transparent calc(100% - var(--spui-spinner-stroke,2px) - 1px),white calc(100% - var(--spui-spinner-stroke,2px)),transparent 100%);-webkit-mask-image:radial-gradient(closest-side,transparent calc(100% - var(--spui-spinner-stroke,2px) - 1px),white calc(100% - var(--spui-spinner-stroke,2px)),transparent 100%);animation:spui-spinner-rotate 1.5s linear infinite}
        .ring,.tail{position:absolute;inset:0;display:block;width:100%;height:100%}
        .ring{background:transparent;color:inherit}
        .tail{mask-image:conic-gradient(transparent 105deg,white 105deg);-webkit-mask-image:conic-gradient(transparent 105deg,white 105deg);animation:spui-spinner-tail 1.5s var(--spui-motion-easing-standard,cubic-bezier(.33,0,.67,1)) infinite}
        .tail::before,.tail::after{content:"";position:absolute;inset:0;display:block;width:100%;height:100%;background-image:conic-gradient(currentColor 135deg,transparent 135deg);animation:inherit}
        .tail::before{animation-name:spui-spinner-tail-start}
        .tail::after{animation-name:spui-spinner-tail-end}
        slot[name=spinner],slot[name=spinner-tail]{position:absolute;inset:0;display:block;width:100%;height:100%}
        slot[name=spinner]::slotted(*),slot[name=spinner-tail]::slotted(*){display:block;width:100%;height:100%}
        :host([data-size=extra-tiny]){--spui-spinner-size:16px;--spui-spinner-stroke:2px}
        :host([data-size=tiny]){--spui-spinner-size:20px;--spui-spinner-stroke:2px}
        :host([data-size=extra-small]){--spui-spinner-size:24px;--spui-spinner-stroke:2px}
        :host([data-size=small]){--spui-spinner-size:28px;--spui-spinner-stroke:2px}
        :host([data-size=medium]){--spui-spinner-size:32px;--spui-spinner-stroke:2.5px}
        :host([data-size=large]){--spui-spinner-size:36px;--spui-spinner-stroke:2.5px}
        :host([data-size=extra-large]){--spui-spinner-size:40px;--spui-spinner-stroke:2.5px}
        :host([data-size=huge]){--spui-spinner-size:44px;--spui-spinner-stroke:3px}
        :host([data-label-position=before]) .label,:host([data-label-position=above]) .label{order:0}
        :host([data-label-position=before]) .spinner,:host([data-label-position=above]) .spinner{order:1}
        :host([data-label-position=after]) .spinner,:host([data-label-position=below]) .spinner{order:0}
        :host([data-label-position=after]) .label,:host([data-label-position=below]) .label{order:1}
        .label{display:block;max-width:100%;font:var(--spui-spinner-label-font,400 14px/1.4 var(--spui-font-family,inherit));color:var(--spui-spinner-label,var(--spui-ui-text,var(--spui-semantic-body-text,inherit)))}
        :host([data-size=extra-tiny]) .label,:host([data-size=tiny]) .label,:host([data-size=extra-small]) .label,:host([data-size=small]) .label{font-size:12px}
        :host([data-size=huge]) .label{font-size:16px}
        :host([appearance=inverted]),:host([data-appearance=inverted]){--spui-spinner-track:var(--spui-spinner-track-inverted,color-mix(in srgb,var(--spui-ui-accent-text,#fff) 38%,transparent));--spui-spinner-active:var(--spui-spinner-active-inverted,var(--spui-ui-accent-text,#fff));--spui-spinner-label:var(--spui-spinner-label-inverted,var(--spui-ui-accent-text,#fff))}
        :host([dir=rtl]) .tail{mask-image:conic-gradient(white 255deg,transparent 255deg);-webkit-mask-image:conic-gradient(white 255deg,transparent 255deg)}
        :host([dir=rtl]) .tail::before,:host([dir=rtl]) .tail::after{background-image:conic-gradient(transparent 225deg,currentColor 225deg)}
        @keyframes spui-spinner-rotate{to{transform:rotate(360deg)}}
        @keyframes spui-spinner-tail{0%{transform:rotate(-135deg)}50%{transform:rotate(0deg)}100%{transform:rotate(225deg)}}
        @keyframes spui-spinner-tail-start{0%,100%{transform:rotate(0deg)}50%{transform:rotate(105deg)}}
        @keyframes spui-spinner-tail-end{0%,100%{transform:rotate(0deg)}50%{transform:rotate(225deg)}}
        @media(prefers-reduced-motion:reduce){.spinner,.tail,.tail::before,.tail::after{animation:none}.tail{background-image:conic-gradient(transparent 120deg,currentColor 360deg)}.tail::before,.tail::after{display:none}}
        @media(forced-colors:active){.spinner{forced-color-adjust:none;color:Highlight}.ring{background:HighlightText;color:Highlight}.label{color:CanvasText}}
      `;
      shadow.append(style, spinner, label);
    }
  }
  customElements.define("spui-spinner", SpuiSpinner);
}
