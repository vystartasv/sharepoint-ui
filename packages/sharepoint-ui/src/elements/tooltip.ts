import { getFloatingPosition, type FloatingAlign, type FloatingPlacement } from "./floating-position.js";

const nextId = (() => { let value = 0; return () => `spui-tooltip-${++value}`; })();
let activeTooltip: { element: HTMLElement; close: () => void } | undefined;

export type TooltipRelationship = "label" | "description" | "inaccessible";
export type TooltipAppearance = "normal" | "inverted";
export type TooltipVisibleChangeData = { visible: boolean; documentKeyboardEvent?: KeyboardEvent };
export type TooltipPosition = FloatingPlacement | "above" | "below" | "before" | "after";
export type TooltipPositioningShorthand = "above" | "above-start" | "above-end" | "below" | "below-start" | "below-end" | "before" | "before-top" | "before-bottom" | "after" | "after-top" | "after-bottom";
export type TooltipPositioningRect = { x: number; y: number; width: number; height: number };
export type TooltipPositioningTargetRect = TooltipPositioningRect & Pick<DOMRectReadOnly, "top" | "left" | "bottom" | "right">;
export type TooltipPositioningTarget = HTMLElement | { getBoundingClientRect: () => TooltipPositioningTargetRect; contextElement?: Element };
export type TooltipPositioningBoundary = TooltipPositioningRect | HTMLElement | HTMLElement[] | "clippingParents" | "scrollParent" | "window" | null;
export type TooltipPositioningOffsetParams = { positionedRect: TooltipPositioningRect; targetRect: TooltipPositioningRect; position: "above" | "below" | "before" | "after"; alignment?: FloatingAlign };
export type TooltipPositioningOffset = number | { mainAxis: number; crossAxis?: number } | ((params: TooltipPositioningOffsetParams) => number | { mainAxis: number; crossAxis?: number });
export type TooltipPositioningPlacement = "top" | "top-start" | "top-end" | "right" | "right-start" | "right-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end";
export type TooltipPositioningEndData = { placement: TooltipPositioningPlacement; escaped: boolean; referenceHidden: boolean };
export type TooltipPositioningImperativeRef = { updatePosition: () => void; setTarget: (target: TooltipPositioningTarget | null) => void };
export type TooltipPositioningRef = { readonly current: TooltipPositioningImperativeRef | null } | ((value: TooltipPositioningImperativeRef | null) => void) | null;
export type TooltipPositioningOptions = {
  align?: FloatingAlign;
  arrowPadding?: number;
  autoSize?: boolean | "always" | "width" | "width-always" | "height" | "height-always";
  coverTarget?: boolean;
  fallbackPositions?: TooltipPositioningShorthand[];
  flipBoundary?: TooltipPositioningBoundary;
  matchTargetSize?: "width";
  offset?: TooltipPositioningOffset;
  onPositioningEnd?: (event: CustomEvent<TooltipPositioningEndData>) => void;
  overflowBoundary?: TooltipPositioningBoundary;
  overflowBoundaryPadding?: number | Partial<{ top: number; end: number; bottom: number; start: number }>;
  pinned?: boolean;
  position?: TooltipPosition;
  positionFixed?: boolean;
  positioningRef?: TooltipPositioningRef;
  shiftToCoverTarget?: boolean;
  strategy?: "absolute" | "fixed";
  target?: TooltipPositioningTarget | null;
  useTransform?: boolean;
  disableUpdateOnResize?: boolean;
};
export type TooltipPositioning = TooltipPosition | TooltipPositioningShorthand | TooltipPositioningOptions;

type BoundaryEdges = Pick<DOMRectReadOnly, "left" | "top" | "right" | "bottom">;
type TooltipWindow = Window & typeof globalThis;

function rectEdges(rect: TooltipPositioningRect | DOMRectReadOnly): BoundaryEdges {
  const left = "left" in rect ? rect.left : rect.x;
  const top = "top" in rect ? rect.top : rect.y;
  return { left, top, right: left + rect.width, bottom: top + rect.height };
}

function parentElement(element: Element): Element | null {
  if (element.parentElement) return element.parentElement;
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

function intersectRects(rects: BoundaryEdges[]): BoundaryEdges | undefined {
  if (!rects.length) return undefined;
  const left = Math.max(...rects.map(rect => rect.left));
  const top = Math.max(...rects.map(rect => rect.top));
  return { left, top, right: Math.max(left, Math.min(...rects.map(rect => rect.right))), bottom: Math.max(top, Math.min(...rects.map(rect => rect.bottom))) };
}

function getPositioningBoundary(boundary: TooltipPositioningBoundary | undefined, context?: Element): BoundaryEdges | undefined {
  if (!boundary || boundary === "window") return undefined;
  if (Array.isArray(boundary)) return intersectRects(boundary.map(element => rectEdges(element.getBoundingClientRect())));
  if (typeof boundary === "object" && "getBoundingClientRect" in boundary) return rectEdges(boundary.getBoundingClientRect());
  if (typeof boundary === "object" && "width" in boundary) return rectEdges(boundary);
  if ((boundary === "clippingParents" || boundary === "scrollParent") && context) {
    const win = context.ownerDocument.defaultView as TooltipWindow | null;
    if (!win) return undefined;
    const viewport = { left: 0, top: 0, right: win.innerWidth, bottom: win.innerHeight };
    const rects: BoundaryEdges[] = boundary === "clippingParents" ? [viewport] : [];
    let current = parentElement(context);
    while (current) {
      const style = win.getComputedStyle(current);
      const clipsX = /^(auto|scroll|hidden|clip|overlay)$/.test(style.overflowX);
      const clipsY = /^(auto|scroll|hidden|clip|overlay)$/.test(style.overflowY);
      const isScrollParent = /^(auto|scroll|hidden|overlay)$/.test(style.overflowX) || /^(auto|scroll|hidden|overlay)$/.test(style.overflowY);
      if (boundary === "clippingParents" ? clipsX || clipsY : isScrollParent) {
        const bounds = current.getBoundingClientRect();
        const left = bounds.left + current.clientLeft;
        const top = bounds.top + current.clientTop;
        const rect = { left: clipsX ? left : 0, right: clipsX ? left + current.clientWidth : win.innerWidth, top: clipsY ? top : 0, bottom: clipsY ? top + current.clientHeight : win.innerHeight };
        if (boundary === "scrollParent") return rect;
        rects.push(rect);
      }
      current = parentElement(current);
    }
    return boundary === "clippingParents" ? intersectRects(rects) : undefined;
  }
  return undefined;
}

function normalizePosition(position: TooltipPosition, direction: "ltr" | "rtl"): FloatingPlacement {
  if (position === "above") return "top";
  if (position === "below") return "bottom";
  if (position === "before") return direction === "rtl" ? "right" : "left";
  if (position === "after") return direction === "rtl" ? "left" : "right";
  return position;
}

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
    private inTopLayer = false;
    private positioningValue?: TooltipPositioning;
    private positioningRef?: TooltipPositioningRef;
    private tooltipElementValue?: HTMLElement;
    private readonly positioningHandle: TooltipPositioningImperativeRef = { updatePosition: () => this.position(), setTarget: target => this.setPositioningTarget(target) };

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
      const positioningOptions = typeof this.positioningValue === "object" && this.positioningValue !== null ? this.positioningValue : undefined;
      this.setPositioningRef(positioningOptions?.positioningRef);
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
      this.setPositioningRef(undefined);
    }

    get positioning(): TooltipPositioning | undefined { return this.positioningValue; }
    set positioning(value: TooltipPositioning | undefined) {
      this.positioningValue = value;
      const options = typeof value === "object" && value !== null ? value : undefined;
      this.setPositioningRef(options?.positioningRef);
      this.observeSize();
      this.position();
    }

    get tooltipElement(): HTMLElement | undefined { return this.tooltipElementValue; }
    set tooltipElement(value: HTMLElement | null | undefined) {
      const next = value ?? undefined;
      if (this.tooltipElementValue === next) return;
      this.tooltipElementValue = next;
      if (this.isConnected) this.sync();
    }

    private setPositioningRef(ref?: TooltipPositioningRef): void {
      if (this.positioningRef === ref) return;
      if (typeof this.positioningRef === "function") this.positioningRef(null);
      else if (this.positioningRef) (this.positioningRef as { current: TooltipPositioningImperativeRef | null }).current = null;
      this.positioningRef = ref;
      if (typeof ref === "function") ref(this.positioningHandle);
      else if (ref) (ref as { current: TooltipPositioningImperativeRef | null }).current = this.positioningHandle;
    }

    private setPositioningTarget(target: TooltipPositioningTarget | null): void {
      const current = typeof this.positioningValue === "object" && this.positioningValue !== null ? this.positioningValue : {};
      this.positioningValue = { ...current, target };
      this.observeSize();
      this.position();
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
      const content = this.tooltipElementValue ?? [...this.querySelectorAll<HTMLElement>("[slot=tooltip]")].find(element => element.dataset.spuiTooltipGenerated === undefined);
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
        try { surface.showPopover?.(); this.inTopLayer = typeof surface.showPopover === "function"; } catch { this.inTopLayer = false; }
        requestAnimationFrame(this.position);
      } else {
        this.inTopLayer = false;
        surface.hidePopover?.();
        surface.hidden = true;
      }
    }

    private position = (): void => {
      const trigger = this.trigger;
      const tooltip = this.tooltip;
      const options = this.positioningOptions;
      const target = options?.target;
      if (!this.isOpen || !tooltip || tooltip.hidden || (!trigger && !target)) return;
      const targetContext = target && "contextElement" in target ? target.contextElement : target && "nodeType" in target ? target : undefined;
      const targetRect = target?.getBoundingClientRect();
      const anchor = targetRect ?? trigger!.getBoundingClientRect();
      const direction = (targetContext && getComputedStyle(targetContext).direction) || (trigger && getComputedStyle(trigger).direction) || getComputedStyle(this).direction;
      const rtl = direction === "rtl";
      const [requested, align, rawPosition] = this.getRequestedPosition(rtl ? "rtl" : "ltr");
      const configuredOffset = options?.offset;
      const functionOffset = typeof configuredOffset === "function" ? configuredOffset({
        positionedRect: { x: 0, y: 0, width: tooltip.offsetWidth, height: tooltip.offsetHeight },
        targetRect: { x: anchor.x, y: anchor.y, width: anchor.width, height: anchor.height },
        position: (rawPosition === "above" || rawPosition === "below" || rawPosition === "before" || rawPosition === "after" ? rawPosition : "above"),
        alignment: align,
      }) : configuredOffset;
      const offset = typeof functionOffset === "number" ? functionOffset : functionOffset?.mainAxis ?? 0;
      const crossAxisOffset = typeof functionOffset === "object" ? functionOffset.crossAxis ?? 0 : 0;
      const gap = configuredOffset === undefined ? this.hasAttribute("offset") ? Math.max(0, Number(this.getAttribute("offset")) || 0) : this.hasAttribute("with-arrow") ? 12 : 8 : Math.max(0, offset);
      const boundaryContext = targetContext ?? trigger ?? this;
      const flipBoundary = getPositioningBoundary(options?.flipBoundary, boundaryContext);
      const overflowBoundary = getPositioningBoundary(options?.overflowBoundary, boundaryContext);
      const rawPadding = options?.overflowBoundaryPadding;
      const padding = typeof rawPadding === "number" ? { top: rawPadding, right: rawPadding, bottom: rawPadding, left: rawPadding } : {
        top: rawPadding?.top ?? 0,
        bottom: rawPadding?.bottom ?? 0,
        left: rtl ? rawPadding?.end ?? 0 : rawPadding?.start ?? 0,
        right: rtl ? rawPadding?.start ?? 0 : rawPadding?.end ?? 0,
      };
      const strategy = options?.strategy ?? (options?.positionFixed === true ? "fixed" : options?.positionFixed === false ? "absolute" : this.inTopLayer ? "absolute" : "fixed");
      tooltip.style.position = strategy;
      tooltip.style.transform = "";
      tooltip.style.maxWidth = "min(320px, calc(100vw - 16px))";
      tooltip.style.maxHeight = "calc(100vh - 16px)";
      tooltip.style.width = options?.matchTargetSize === "width" ? `${anchor.width}px` : "";
      tooltip.style.height = "";
      tooltip.style.overflowX = "";
      tooltip.style.overflowY = "auto";
      const surface = { width: tooltip.offsetWidth, height: tooltip.offsetHeight };
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const fallback = (options?.fallbackPositions ?? []).map(value => {
        const [side, fallbackAlign] = this.parsePosition(value, rtl ? "rtl" : "ltr");
        return { placement: side, align: fallbackAlign };
      });
      const pinned = options?.pinned === true;
      const coverTarget = options?.coverTarget === true;
      const modifiers = { crossAxisOffset, coverTarget, overflowBoundaryPadding: padding };
      let position = getFloatingPosition(anchor, surface, requested, rtl ? "rtl" : "ltr", gap, viewport, align, fallback, pinned, flipBoundary, overflowBoundary, modifiers);
      const flipBounds = flipBoundary ?? { left: 0, top: 0, right: viewport.width, bottom: viewport.height };
      const overflows = position.left < flipBounds.left || position.top < flipBounds.top || position.left + surface.width > flipBounds.right || position.top + surface.height > flipBounds.bottom;
      if (options?.shiftToCoverTarget && overflows && !coverTarget) position = getFloatingPosition(anchor, surface, requested, rtl ? "rtl" : "ltr", gap, viewport, align, fallback, pinned, flipBoundary, overflowBoundary, { ...modifiers, coverTarget: true });
      const autoSize = options?.autoSize;
      const applyMaxWidth = autoSize === true || autoSize === "always" || autoSize === "width" || autoSize === "width-always";
      const applyMaxHeight = autoSize === true || autoSize === "always" || autoSize === "height" || autoSize === "height-always";
      const bounds = overflowBoundary ?? { left: 0, top: 0, right: viewport.width, bottom: viewport.height };
      const availableWidth = Math.max(0, (position.placement === "left" ? anchor.left - bounds.left - padding.left - gap : position.placement === "right" ? bounds.right - padding.right - anchor.right - gap : bounds.right - padding.right - bounds.left - padding.left - gap * 2));
      const availableHeight = Math.max(0, (position.placement === "top" ? anchor.top - bounds.top - padding.top - gap : position.placement === "bottom" ? bounds.bottom - padding.bottom - anchor.bottom - gap : bounds.bottom - padding.bottom - bounds.top - padding.top - gap * 2));
      if (applyMaxWidth) tooltip.style.maxWidth = `${availableWidth}px`;
      if (applyMaxHeight) tooltip.style.maxHeight = `${availableHeight}px`;
      const pageOffset = strategy === "absolute" ? { x: window.scrollX, y: window.scrollY } : { x: 0, y: 0 };
      const useTransform = options?.useTransform !== false;
      tooltip.style.left = useTransform ? "0px" : `${position.left + pageOffset.x}px`;
      tooltip.style.top = useTransform ? "0px" : `${position.top + pageOffset.y}px`;
      if (useTransform) tooltip.style.transform = `translate3d(${position.left + pageOffset.x}px, ${position.top + pageOffset.y}px, 0)`;
      tooltip.dataset.placement = position.placement;
      const arrow = tooltip.querySelector<HTMLElement>("[data-spui-tooltip-arrow]");
      if (arrow) {
        Object.assign(arrow.style, { insetInlineStart: "", insetInlineEnd: "", top: "", right: "", bottom: "", left: "" });
        const surfaceRect = tooltip.getBoundingClientRect();
        const anchorCenterX = anchor.left + anchor.width / 2 - surfaceRect.left - 4;
        const anchorCenterY = anchor.top + anchor.height / 2 - surfaceRect.top - 4;
        const arrowPadding = Math.max(0, options?.arrowPadding ?? 4);
        const arrowLeft = `${Math.max(arrowPadding, Math.min(anchorCenterX, surfaceRect.width - arrowPadding - 8))}px`;
        const arrowTop = `${Math.max(arrowPadding, Math.min(anchorCenterY, surfaceRect.height - arrowPadding - 8))}px`;
        if (position.placement === "top") Object.assign(arrow.style, { bottom: "-4px", left: arrowLeft, borderTop: "0", borderLeft: "0" });
        else if (position.placement === "bottom") Object.assign(arrow.style, { top: "-4px", left: arrowLeft, borderRight: "0", borderBottom: "0" });
        else if (position.placement === "left") Object.assign(arrow.style, { right: "-4px", top: arrowTop, borderLeft: "0", borderBottom: "0" });
        else Object.assign(arrow.style, { left: "-4px", top: arrowTop, borderTop: "0", borderRight: "0" });
      }
      const inlinePlacement = position.placement === "top" || position.placement === "bottom" ? position.align === "start" || position.align === "end" ? `-${position.align}` : "" : position.align === "top" ? "-start" : position.align === "bottom" ? "-end" : "";
      const detail: TooltipPositioningEndData = {
        placement: `${position.placement}${inlinePlacement}` as TooltipPositioningPlacement,
        escaped: position.left < bounds.left || position.top < bounds.top || position.left + tooltip.offsetWidth > bounds.right || position.top + tooltip.offsetHeight > bounds.bottom,
        referenceHidden: anchor.bottom <= 0 || anchor.top >= window.innerHeight || anchor.right <= 0 || anchor.left >= window.innerWidth,
      };
      options?.onPositioningEnd?.(new CustomEvent("fui-positioningend", { detail }));
      tooltip.dispatchEvent(new CustomEvent("fui-positioningend", { bubbles: true, detail }));
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
      if (this.positioningOptions?.disableUpdateOnResize) return;
      if (this.trigger) this.sizeObserver.observe(this.trigger);
      if (this.tooltip) this.sizeObserver.observe(this.tooltip);
      const target = this.positioningOptions?.target;
      const targetContext = target && "contextElement" in target ? target.contextElement : target && "nodeType" in target ? target : undefined;
      if (targetContext) this.sizeObserver.observe(targetContext);
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
    private get positioningOptions(): TooltipPositioningOptions | undefined { return typeof this.positioningValue === "object" && this.positioningValue !== null ? this.positioningValue : undefined; }
    private parsePosition(raw: string, direction: "ltr" | "rtl"): [FloatingPlacement, FloatingAlign] {
      const parts = raw.split("-");
      const placement = normalizePosition(parts[0] as TooltipPosition, direction);
      const suffix = parts[1] as FloatingAlign | undefined;
      const requestedAlign = suffix === "start" || suffix === "end" || suffix === "top" || suffix === "bottom" ? suffix : "center";
      const vertical = placement === "top" || placement === "bottom";
      const align = vertical ? requestedAlign === "start" || requestedAlign === "end" ? requestedAlign : "center" : requestedAlign === "top" || requestedAlign === "bottom" ? requestedAlign : "center";
      return [placement, align];
    }
    private getRequestedPosition(direction: "ltr" | "rtl"): [FloatingPlacement, FloatingAlign, TooltipPosition] {
      const configured = this.positioningValue;
      const raw = typeof configured === "string" ? configured : configured?.position ?? this.getAttribute("positioning") ?? this.getAttribute("placement") ?? "above";
      const [placement, suffixAlign] = this.parsePosition(raw, direction);
      const configuredAlign = typeof configured === "object" && configured !== null ? configured.align : undefined;
      const attributeAlign = this.getAttribute("align") as FloatingAlign | null;
      const requestedAlign = configuredAlign ?? attributeAlign ?? suffixAlign;
      const vertical = placement === "top" || placement === "bottom";
      const align = vertical ? requestedAlign === "start" || requestedAlign === "end" ? requestedAlign : "center" : requestedAlign === "top" || requestedAlign === "bottom" ? requestedAlign : "center";
      return [placement, align, raw as TooltipPosition];
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
