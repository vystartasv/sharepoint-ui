import { definePopover } from "./popover.js";
import { createLabel, getLabelStyle, type LabelOptions } from "./label.js";

export type InfoPlacement = "top" | "bottom" | "start" | "end";
export type InfoLabelOptions = LabelOptions & { infoButtonLabel?: string; placement?: InfoPlacement };

export function defineInfoButton(): void {
  if (customElements.get("spui-info-button")) return;
  class SpuiInfoButton extends HTMLElement {
    static observedAttributes = ["label", "info", "placement", "open", "disabled", "size", "inline", "popover-placement", "popover-label", "popover-arrow", "popover-trap-focus"];
    private popoverElement?: HTMLElement & { open: boolean; inline: boolean };
    private trigger?: HTMLButtonElement;
    private contentSlot?: HTMLSlotElement;

    get open(): boolean { return this.popoverElement?.open ?? this.hasAttribute("open"); }
    set open(value: boolean) { if (this.popoverElement) this.popoverElement.open = Boolean(value); else this.toggleAttribute("open", Boolean(value)); }
    get inline(): boolean { return this.getAttribute("inline") !== "false"; }
    set inline(value: boolean) { if (value) this.removeAttribute("inline"); else this.setAttribute("inline", "false"); }

    connectedCallback(): void {
      definePopover();
      if (!this.shadowRoot) this.render();
      this.sync();
    }

    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `:host{display:inline-flex;vertical-align:middle;line-height:1}:host([hidden]){display:none}button{display:inline-grid;place-items:center;box-sizing:border-box;width:var(--spui-info-button-size,20px);height:var(--spui-info-button-size,20px);padding:2px;border:1px solid transparent;border-radius:50%;background:transparent;color:var(--spui-info-button-color,var(--spui-ui-muted,var(--spui-semantic-body-text,#484644)));cursor:pointer;font:inherit}button:hover:not(:disabled){background:var(--spui-info-button-hover,var(--spui-ui-surface-hover,#f3f2f1));color:var(--spui-ui-accent,var(--spui-semantic-link,#0f6cbd))}button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#005a9e));outline-offset:2px}button:disabled{opacity:.55;cursor:not-allowed}svg{width:calc(var(--spui-info-button-size,20px) * .8);height:calc(var(--spui-info-button-size,20px) * .8);fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}:host([size=small]){--spui-info-button-size:16px}:host([size=large]){--spui-info-button-size:24px}:host([data-spui-appearance=glass]) button{backdrop-filter:blur(8px)}@media(forced-colors:active){button{border-color:ButtonText;color:ButtonText}button:focus-visible{outline-color:Highlight}}`;
      const popover = document.createElement("spui-popover") as HTMLElement & { open: boolean; inline: boolean };
      this.popoverElement = popover;
      const trigger = document.createElement("button");
      this.trigger = trigger;
      trigger.type = "button";
      trigger.slot = "trigger";
      trigger.part.add("control");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 20 20");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-9v5m0-8h.01");
      svg.append(path);
      trigger.append(svg);
      const content = document.createElement("div");
      content.slot = "content";
      content.part.add("content");
      const slot = document.createElement("slot");
      this.contentSlot = slot;
      slot.addEventListener("slotchange", () => this.syncContent());
      content.append(slot);
      popover.append(trigger, content);
      popover.addEventListener("spui-open-change", event => {
        if ((event as CustomEvent<{ open: boolean }>).detail.open) requestAnimationFrame(() => {
          const surface = popover.shadowRoot?.querySelector<HTMLElement>(".surface");
          surface?.setAttribute("tabindex", "-1");
          surface?.focus();
        });
      });
      shadow.append(style, popover);
    }

    private sync(): void {
      if (!this.popoverElement || !this.trigger) return;
      const label = this.getAttribute("label") || "More information";
      this.trigger.setAttribute("aria-label", label);
      this.trigger.disabled = this.hasAttribute("disabled");
      this.popoverElement.setAttribute("placement", this.getAttribute("popover-placement") || this.getAttribute("placement") || "top");
      this.popoverElement.setAttribute("label", this.getAttribute("popover-label") || label);
      this.popoverElement.inline = this.inline;
      this.popoverElement.toggleAttribute("arrow", this.hasAttribute("popover-arrow"));
      this.popoverElement.toggleAttribute("trap-focus", this.hasAttribute("popover-trap-focus"));
      if (this.popoverElement.open !== this.hasAttribute("open")) this.popoverElement.open = this.hasAttribute("open");
      this.syncContent();
    }

    private syncContent(): void {
      if (!this.contentSlot) return;
      this.contentSlot.textContent = !this.childNodes.length && this.hasAttribute("info") ? this.getAttribute("info") ?? "" : "";
    }
  }
  customElements.define("spui-info-button", SpuiInfoButton);
}

/** Build a native form label with an adjacent, separately focusable information button. */
export function createInfoLabel(labelContent: string | Node, info: string | Node, options: InfoLabelOptions = {}): HTMLSpanElement {
  defineInfoButton();
  const wrapper = document.createElement("span");
  Object.assign(wrapper.style, { display: "inline-flex", alignItems: "baseline", gap: "0.25em" });
  const label = createLabel(labelContent, options);
  wrapper.append(label);
  const button = document.createElement("spui-info-button");
  button.setAttribute("label", options.infoButtonLabel ?? "More information");
  if (options.placement) button.setAttribute("placement", options.placement);
  button.append(typeof info === "string" ? document.createTextNode(info) : info);
  wrapper.append(button);
  return wrapper;
}
