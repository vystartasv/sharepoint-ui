import { getFloatingPosition, type FloatingAlign, type FloatingPlacement } from "./floating-position.js";

const nextId = (() => { let value = 0; return () => `spui-tooltip-${++value}`; })();
let activeTooltip: { element: HTMLElement; close: () => void } | undefined;

export type TooltipRelationship = "label" | "description" | "inaccessible";
export type TooltipAppearance = "normal" | "inverted";
export type TooltipVisibleChangeData = { visible: boolean; documentKeyboardEvent?: KeyboardEvent };
export type TooltipPosition = FloatingPlacement | "above" | "below" | "before" | "after";
export type TooltipPositioning = TooltipPosition | { position?: TooltipPosition; align?: FloatingAlign; offset?: number };

export function defineTooltip(): void {
  if (customElements.get("spui-tooltip")) return;
  class SpuiTooltip extends HTMLElement {
    static observedAttributes = ["content", "placement", "positioning", "align", "offset", "disabled", "open", "delay", "show-delay", "hide-delay", "relationship", "appearance", "with-arrow"];
    private observer?: MutationObserver;
    private sizeObserver?: ResizeObserver;
    private events?: AbortController;
    private timer?: ReturnType<typeof setTimeout>;
    private trigger?: HTMLElement;
    private ariaBefore?: Map<string, string | null>;
    private tooltip?: HTMLElement;
    private isOpen = false;

    connectedCallback(): void {
      this.style.display ||= "contents";
      this.events?.abort();
      this.events = new AbortController();
      const options = { signal: this.events.signal };
      this.addEventListener("pointerenter", this.onPointerEnter, options);
      this.addEventListener("pointerleave", this.onPointerLeave, options);
      this.addEventListener("focusin", this.onFocusIn, options);
      this.addEventListener("focusout", this.onFocusOut, options);
      this.ownerDocument.addEventListener("keydown", this.onDocumentKeyDown, { ...options, capture: true });
      this.ownerDocument.addEventListener("visibilitychange", this.onVisibilityChange, options);
      window.addEventListener("resize", this.position, options);
      window.addEventListener("scroll", this.position, { ...options, capture: true });
      this.observer = new MutationObserver(() => this.sync());
      this.observer.observe(this, { childList: true });
      this.isOpen = this.hasAttribute("open");
      this.sync();
      this.observeSize();
    }

    disconnectedCallback(): void {
      this.observer?.disconnect();
      this.sizeObserver?.disconnect();
      this.events?.abort();
      this.clearTimer();
      if (activeTooltip?.element === this) activeTooltip = undefined;
      (this.tooltip as (HTMLElement & { hidePopover?: () => void }) | undefined)?.hidePopover?.();
      this.restoreAria();
    }

    attributeChangedCallback(name: string): void {
      if (name === "open") {
        const next = this.hasAttribute("open");
        if (next !== this.isOpen) {
          if (next) this.claimActiveTooltip();
          else if (activeTooltip?.element === this) activeTooltip = undefined;
          this.isOpen = next; this.syncVisibility(); this.emitOpenChange();
        }
      } else if (this.isConnected) {
        if (name === "disabled" && this.hasAttribute("disabled")) this.setOpen(false);
        else this.sync();
      }
    }

    get open(): boolean { return this.isOpen; }
    set open(value: boolean) { this.setOpen(Boolean(value)); }

    private sync(): void {
      const content = [...this.querySelectorAll<HTMLElement>("[slot=tooltip]")].find(element => element.dataset.spuiTooltipGenerated === undefined);
      const generated = this.querySelector<HTMLElement>("[data-spui-tooltip-generated]");
      if (content) { generated?.remove(); this.tooltip = content; }
      else if (this.hasAttribute("content")) {
        this.tooltip = generated ?? document.createElement("span");
        this.tooltip.setAttribute("slot", "tooltip");
        this.tooltip.dataset.spuiTooltipGenerated = "";
        this.tooltip.textContent = this.getAttribute("content") ?? "";
        if (!generated) this.append(this.tooltip);
      } else { generated?.remove(); this.tooltip = undefined; }
      if (this.tooltip) {
        if (!this.tooltip.id) this.tooltip.id = nextId();
        this.tooltip.setAttribute("role", "tooltip");
        this.styleTooltip();
      }
      const trigger = [...this.children].find((child): child is HTMLElement => child instanceof HTMLElement && child !== this.tooltip && child.getAttribute("slot") !== "tooltip");
      if (trigger !== this.trigger) {
        this.restoreAria();
        this.trigger = trigger;
        this.ariaBefore = trigger ? new Map(["aria-label", "aria-labelledby", "aria-describedby", "aria-description"].map(name => [name, trigger.getAttribute(name)])) : undefined;
      }
      this.applyRelationship();
      this.observeSize();
      this.syncVisibility();
    }

    private styleTooltip(): void {
      if (!this.tooltip) return;
      this.tooltip.setAttribute("popover", "manual");
      Object.assign(this.tooltip.style, {
        position: "fixed",
        zIndex: "10000",
        boxSizing: "border-box",
        maxWidth: "min(320px, calc(100vw - 16px))",
        maxHeight: "calc(100vh - 16px)",
        padding: "6px 10px",
        border: "1px solid var(--spui-tooltip-border, var(--colorNeutralStroke1, #666))",
        borderRadius: "var(--spui-tooltip-radius, var(--spui-control-radius, 4px))",
        background: this.appearance === "inverted" ? "var(--spui-tooltip-background, var(--colorNeutralBackgroundInverted, #292929))" : "var(--spui-tooltip-background, var(--colorNeutralBackground1, #fff))",
        color: this.appearance === "inverted" ? "var(--spui-tooltip-color, var(--colorNeutralForegroundInverted, #fff))" : "var(--spui-tooltip-color, var(--colorNeutralForeground1, #242424))",
        boxShadow: "0 2px 8px rgb(0 0 0 / 18%)",
        font: "500 12px/1.4 var(--spui-font-family, inherit)",
        overflowWrap: "anywhere",
        overflowY: "auto",
        pointerEvents: "none",
        margin: "0"
      });
      this.tooltip.dataset.appearance = this.appearance;
      let arrow = this.tooltip.querySelector<HTMLElement>(":scope > [data-spui-tooltip-arrow]");
      if (this.hasAttribute("with-arrow")) {
        if (!arrow) {
          arrow = document.createElement("span");
          arrow.dataset.spuiTooltipArrow = "";
          arrow.setAttribute("aria-hidden", "true");
          Object.assign(arrow.style, { position: "absolute", width: "8px", height: "8px", transform: "rotate(45deg)", background: "inherit", border: "inherit", pointerEvents: "none" });
          this.tooltip.append(arrow);
        }
      } else arrow?.remove();
    }

    private syncVisibility(): void {
      if (!this.tooltip) return;
      const visible = this.isOpen && !this.hasAttribute("disabled");
      const surface = this.tooltip as HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
      if (visible) {
        surface.hidden = false;
        try { surface.showPopover?.(); } catch { /* Fixed-position fallback remains usable without the Popover API. */ }
        requestAnimationFrame(this.position);
      } else {
        surface.hidePopover?.();
        surface.hidden = true;
      }
    }

    private position = (): void => {
      const trigger = this.trigger;
      const tooltip = this.tooltip;
      if (!this.isOpen || !trigger || !tooltip || tooltip.hidden) return;
      const rect = trigger.getBoundingClientRect();
      const direction = getComputedStyle(trigger).direction;
      const rtl = direction === "rtl";
      const [requested, align] = this.getRequestedPosition(rtl ? "rtl" : "ltr");
      const offset = Number(this.getAttribute("offset"));
      const gap = this.hasAttribute("offset") && Number.isFinite(offset) && offset >= 0 ? offset : this.hasAttribute("with-arrow") ? 12 : 8;
      const position = getFloatingPosition(rect, tooltip.getBoundingClientRect(), requested, rtl ? "rtl" : "ltr", gap, undefined, align);
      tooltip.style.left = `${position.left}px`;
      tooltip.style.top = `${position.top}px`;
      tooltip.dataset.placement = position.placement;
      const arrow = tooltip.querySelector<HTMLElement>("[data-spui-tooltip-arrow]");
      if (arrow) {
        Object.assign(arrow.style, { insetInlineStart: "", insetInlineEnd: "", top: "", right: "", bottom: "", left: "" });
        const surfaceRect = tooltip.getBoundingClientRect();
        const anchorCenterX = rect.left + rect.width / 2 - surfaceRect.left - 4;
        const anchorCenterY = rect.top + rect.height / 2 - surfaceRect.top - 4;
        const arrowLeft = `${Math.max(4, Math.min(anchorCenterX, surfaceRect.width - 12))}px`;
        const arrowTop = `${Math.max(4, Math.min(anchorCenterY, surfaceRect.height - 12))}px`;
        if (position.placement === "top") Object.assign(arrow.style, { bottom: "-4px", left: arrowLeft, borderTop: "0", borderLeft: "0" });
        else if (position.placement === "bottom") Object.assign(arrow.style, { top: "-4px", left: arrowLeft, borderRight: "0", borderBottom: "0" });
        else if (position.placement === "left") Object.assign(arrow.style, { right: "-4px", top: arrowTop, borderLeft: "0", borderBottom: "0" });
        else Object.assign(arrow.style, { left: "-4px", top: arrowTop, borderTop: "0", borderRight: "0" });
      }
    };

    private onPointerEnter = (event: PointerEvent): void => {
      if (event.pointerType === "touch") return;
      if (this.hasAttribute("disabled")) return;
      this.clearTimer();
      this.timer = setTimeout(() => this.setOpen(true, event), this.showDelay);
    };
    private onPointerLeave = (event: PointerEvent): void => {
      if (event.pointerType === "touch") return;
      if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) return;
      this.clearTimer();
      this.timer = setTimeout(() => this.setOpen(false, event), this.hideDelay);
    };
    private onFocusIn = (event: FocusEvent): void => { if (!this.hasAttribute("disabled")) { this.clearTimer(); this.timer = setTimeout(() => this.setOpen(true, event), this.showDelay); } };
    private onFocusOut = (event: FocusEvent): void => {
      if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) return;
      this.clearTimer();
      this.timer = setTimeout(() => this.setOpen(false, event), this.hideDelay);
    };
    private onDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && this.isOpen && !event.defaultPrevented) {
        event.preventDefault();
        event.stopPropagation();
        this.setOpen(false, event);
      }
    };
    private onVisibilityChange = (): void => { if (this.ownerDocument.visibilityState === "hidden") this.setOpen(false); };

    private observeSize(): void {
      if (!this.isConnected || typeof ResizeObserver === "undefined") return;
      this.sizeObserver ??= new ResizeObserver(this.position);
      this.sizeObserver.disconnect();
      if (this.trigger) this.sizeObserver.observe(this.trigger);
      if (this.tooltip) this.sizeObserver.observe(this.tooltip);
    }

    private claimActiveTooltip(): void {
      if (activeTooltip && activeTooltip.element !== this) activeTooltip.close();
      activeTooltip = { element: this, close: () => this.setOpen(false) };
    }

    private setOpen(value: boolean, sourceEvent?: Event): void {
      const next = Boolean(value) && !this.hasAttribute("disabled");
      if (next === this.isOpen) return;
      if (next) this.claimActiveTooltip();
      else if (activeTooltip?.element === this) activeTooltip = undefined;
      this.isOpen = next;
      if (this.hasAttribute("open") !== next) this.toggleAttribute("open", next);
      this.syncVisibility();
      this.emitOpenChange(sourceEvent);
    }
    private emitOpenChange(sourceEvent?: Event): void {
      const documentKeyboardEvent = sourceEvent instanceof KeyboardEvent ? sourceEvent : undefined;
      const event = documentKeyboardEvent ? undefined : sourceEvent as PointerEvent | FocusEvent | undefined;
      this.dispatchEvent(new CustomEvent("spui-open-change", { bubbles: true, composed: true, detail: { open: this.isOpen, visible: this.isOpen, event, documentKeyboardEvent } }));
    }
    private clearTimer(): void { if (this.timer !== undefined) clearTimeout(this.timer); this.timer = undefined; }
    private get appearance(): TooltipAppearance { return this.getAttribute("appearance") === "inverted" ? "inverted" : "normal"; }
    private getRequestedPosition(direction: "ltr" | "rtl"): [FloatingPlacement, FloatingAlign] {
      const raw = this.getAttribute("positioning") ?? this.getAttribute("placement") ?? "top";
      const parts = raw.split("-");
      const position = parts[0];
      let placement: FloatingPlacement = position === "above" ? "top" : position === "below" ? "bottom" : position === "before" ? (direction === "rtl" ? "right" : "left") : position === "after" ? (direction === "rtl" ? "left" : "right") : (position as FloatingPlacement);
      if (!["top", "bottom", "left", "right", "start", "end"].includes(placement)) placement = "top";
      const explicitAlign = this.getAttribute("align");
      const align = explicitAlign === "start" || explicitAlign === "end" ? explicitAlign : explicitAlign === "center" ? "center" : parts[1] === "start" || parts[1] === "end" ? parts[1] : "center";
      return [placement, align];
    }
    private get relationship(): TooltipRelationship {
      const value = this.getAttribute("relationship");
      return value === "label" || value === "inaccessible" ? value : "description";
    }
    private get showDelay(): number { return this.parseDelay(this.getAttribute("show-delay") ?? this.getAttribute("delay"), 250); }
    private get hideDelay(): number { return this.parseDelay(this.getAttribute("hide-delay"), 250); }
    private parseDelay(value: string | null, fallback: number): number { if (value === null || value.trim() === "") return fallback; const delay = Number(value); return Number.isFinite(delay) && delay >= 0 ? delay : fallback; }
    private applyRelationship(): void {
      const trigger = this.trigger;
      if (!trigger || !this.ariaBefore) return;
      this.restoreAriaValues();
      if (!this.tooltip || this.relationship === "inaccessible") return;
      if ((trigger.shadowRoot || trigger.localName.includes("-")) && this.tooltip.getRootNode() !== trigger.shadowRoot && this.relationship === "description") {
        const values = [this.ariaBefore.get("aria-description"), this.tooltip.textContent?.trim()].filter(Boolean);
        if (values.length) trigger.setAttribute("aria-description", values.join(" "));
        return;
      }
      const attribute = this.relationship === "label" ? "aria-labelledby" : "aria-describedby";
      const values = new Set((this.ariaBefore.get(attribute) ?? "").split(/\s+/).filter(Boolean));
      values.add(this.tooltip.id);
      trigger.setAttribute(attribute, [...values].join(" "));
    }
    private restoreAriaValues(): void {
      if (!this.trigger || !this.ariaBefore) return;
      for (const [name, value] of this.ariaBefore) value === null ? this.trigger.removeAttribute(name) : this.trigger.setAttribute(name, value);
    }
    private restoreAria(): void {
      if (!this.trigger) return;
      this.restoreAriaValues();
      this.trigger = undefined;
      this.ariaBefore = undefined;
    }
  }
  customElements.define("spui-tooltip", SpuiTooltip);
}
