import { base, findFocusable } from "./shared.js";
import { getFloatingPosition, type FloatingAlign, type FloatingPlacement } from "./floating-position.js";

export type PopoverPosition = FloatingPlacement | "above" | "below" | "before" | "after";
export type PopoverOpenChangeData = { open: boolean };
export type PopoverAlignment = FloatingAlign;
export type PopoverAutoSize = boolean | "always" | "width" | "width-always" | "height" | "height-always";
export type PopoverBoundaryRect = { x: number; y: number; width: number; height: number };
export type PopoverBoundary = Element | DOMRectReadOnly | PopoverBoundaryRect | readonly Element[] | "clippingParents" | "scrollParent" | "window" | null;
export type PopoverOffset = number | { mainAxis?: number; crossAxis?: number };
export type PopoverBoundaryPadding = number | Partial<Record<"top" | "end" | "bottom" | "start", number>>;
export type PopoverTarget = Element | { getBoundingClientRect: () => DOMRectReadOnly; contextElement?: Element } | null;
export type PopoverPositioning = PopoverPosition | `${"above" | "below" | "before" | "after"}-${"start" | "end" | "top" | "bottom"}` | { position?: PopoverPosition; align?: PopoverAlignment; offset?: PopoverOffset; fallbackPositions?: Array<PopoverPosition | `${"above" | "below" | "before" | "after"}-${"start" | "end" | "top" | "bottom"}`>; autoSize?: PopoverAutoSize; matchTargetSize?: boolean; pinned?: boolean; flipBoundary?: PopoverBoundary; overflowBoundary?: PopoverBoundary; overflowBoundaryPadding?: PopoverBoundaryPadding; positionFixed?: boolean; strategy?: "absolute" | "fixed"; target?: PopoverTarget; coverTarget?: boolean; arrowPadding?: number };

type BoundaryEdges = Pick<DOMRectReadOnly, "left" | "top" | "right" | "bottom">;

function intersectBoundaryRects(rects: BoundaryEdges[]): BoundaryEdges | undefined {
  if (!rects.length) return undefined;
  const left = Math.max(...rects.map(rect => rect.left));
  const top = Math.max(...rects.map(rect => rect.top));
  const right = Math.max(left, Math.min(...rects.map(rect => rect.right)));
  const bottom = Math.max(top, Math.min(...rects.map(rect => rect.bottom)));
  return { left, top, right, bottom };
}

function viewportBoundaryRect(): BoundaryEdges { return { left: 0, top: 0, right: innerWidth, bottom: innerHeight }; }

function parentElement(element: Element): Element | null {
  if (element.parentElement) return element.parentElement;
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

function scrollBoundary(element: Element, clippingOnly: boolean): BoundaryEdges | undefined {
  const rects: BoundaryEdges[] = clippingOnly ? [viewportBoundaryRect()] : [];
  let current = parentElement(element);
  while (current) {
    const view = current.ownerDocument.defaultView ?? window;
    const style = view.getComputedStyle(current);
    const clipX = /^(auto|scroll|hidden|clip|overlay)$/.test(style.overflowX);
    const clipY = /^(auto|scroll|hidden|clip|overlay)$/.test(style.overflowY);
    const isScrollParent = /^(auto|scroll|hidden|overlay)$/.test(style.overflowX) || /^(auto|scroll|hidden|overlay)$/.test(style.overflowY);
    if (clippingOnly ? clipX || clipY : isScrollParent) {
      const bounds = current.getBoundingClientRect();
      const left = bounds.left + current.clientLeft;
      const top = bounds.top + current.clientTop;
      if (!clippingOnly) return { left, top, right: left + current.clientWidth, bottom: top + current.clientHeight };
      rects.push({
        left: clipX ? left : 0,
        right: clipX ? left + current.clientWidth : innerWidth,
        top: clipY ? top : 0,
        bottom: clipY ? top + current.clientHeight : innerHeight
      });
    }
    current = parentElement(current);
  }
  return clippingOnly ? intersectBoundaryRects(rects) : undefined;
}

function getBoundaryRect(boundary: PopoverBoundary | undefined, contextElement?: Element): BoundaryEdges | undefined {
  if (!boundary || boundary === "window") return undefined;
  if (boundary === "clippingParents" || boundary === "scrollParent") return contextElement ? scrollBoundary(contextElement, boundary === "clippingParents") : undefined;
  if (Array.isArray(boundary)) return intersectBoundaryRects(boundary.map(element => element.getBoundingClientRect()));
  const element = boundary as unknown as Pick<Element, "getBoundingClientRect">;
  if (typeof element.getBoundingClientRect === "function") return element.getBoundingClientRect();
  const rect = boundary as PopoverBoundaryRect;
  return { left: rect.x, top: rect.y, right: rect.x + rect.width, bottom: rect.y + rect.height };
}

const nextId = (() => { let value = 0; return () => `spui-popover-${++value}`; })();

type InertFocusState = { overlays: Map<HTMLElement, HTMLElement[]>; baseline: Map<HTMLElement, boolean>; applied: Set<HTMLElement> };
const inertFocusStates = new WeakMap<Document, InertFocusState>();

function syncInertFocusState(document: Document, host: HTMLElement, triggers: HTMLElement[], active: boolean): void {
  let state = inertFocusStates.get(document);
  if (active) {
    if (!state) {
      state = { overlays: new Map(), baseline: new Map(), applied: new Set() };
      inertFocusStates.set(document, state);
    }
    state.overlays.set(host, triggers);
  } else if (state) state.overlays.delete(host);
  if (!state) return;

  for (const element of state.applied) element.inert = state.baseline.get(element) ?? false;
  state.applied.clear();
  const hosts = new Set(state.overlays.keys());
  const inert = (element: HTMLElement): void => {
    if (!state!.baseline.has(element)) state!.baseline.set(element, element.inert);
    state!.applied.add(element);
    element.inert = true;
  };
  const visit = (element: HTMLElement): void => {
    if (hosts.has(element)) return;
    if ([...hosts].some(hostElement => element.contains(hostElement))) {
      for (const child of [...element.children]) if (child instanceof HTMLElement) visit(child);
      return;
    }
    inert(element);
  };
  for (const child of [...document.body.children]) if (child instanceof HTMLElement) visit(child);
  for (const triggersForHost of state.overlays.values()) for (const trigger of triggersForHost) inert(trigger);
  if (!state.overlays.size) {
    for (const [element, previous] of state.baseline) element.inert = previous;
    state.baseline.clear();
    inertFocusStates.delete(document);
  }
}

function definePopoverPart(tag: "spui-popover-trigger" | "spui-popover-surface", styles: string): void {
  if (customElements.get(tag)) return;
  class SpuiPopoverPart extends HTMLElement {
    connectedCallback(): void {
      if (!this.hasAttribute("slot") && tag === "spui-popover-trigger") this.slot = "trigger";
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{${styles}}`;
      shadow.append(style, document.createElement("slot"));
    }
  }
  customElements.define(tag, SpuiPopoverPart);
}

export function definePopoverTrigger(): void { definePopoverPart("spui-popover-trigger", "display:contents"); }
export function definePopoverSurface(): void { definePopoverPart("spui-popover-surface", "display:block;min-width:0;color:inherit"); }

export function definePopover(): void {
  definePopoverTrigger();
  definePopoverSurface();
  if (customElements.get("spui-popover")) return;
  class SpuiPopover extends HTMLElement {
    static observedAttributes = ["open", "default-open", "motion", "placement", "positioning", "align", "offset", "label", "inline", "trap-focus", "inert-trap-focus", "legacy-trap-focus", "unstable-disable-auto-focus", "arrow", "appearance", "size", "close-on-scroll", "close-on-iframe-focus", "open-on-context", "open-on-hover", "mouse-leave-delay"];
    private events?: AbortController;
    private observer?: MutationObserver;
    private resizeObserver?: ResizeObserver;
    private panel?: HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
    private trigger?: HTMLElement;
    private triggerState?: { haspopup: string | null; controls: string | null; expanded: string | null };
    private isOpen = false;
    private focusEdge: "first" | "last" = "first";
    private positioningValue?: PopoverPositioning;
    private positioningTarget?: Element;
    private contextPoint?: { x: number; y: number };
    private hoverTimer?: ReturnType<typeof setTimeout>;
    private iframeBlurTimer?: ReturnType<typeof setTimeout>;
    private exitGeneration = 0;

    private get trapFocusEnabled(): boolean { return this.hasAttribute("trap-focus"); }
    private get inertTrapFocusEnabled(): boolean {
      const inert = this.getAttribute("inert-trap-focus");
      if (inert !== null) return inert !== "false";
      const legacy = this.getAttribute("legacy-trap-focus");
      return legacy === "false";
    }

    get positioning(): PopoverPositioning { return this.positioningValue ?? this.getAttribute("positioning") as PopoverPositioning ?? this.getAttribute("placement") as PopoverPosition ?? (this.hasAttribute("open-on-context") ? "above" : "bottom"); }
    set positioning(value: PopoverPositioning) { this.positioningValue = value; this.position(); }

    get open(): boolean { return this.isOpen; }
    set open(value: boolean) { this.setOpen(Boolean(value)); }
    get inline(): boolean { return this.hasAttribute("inline"); }
    set inline(value: boolean) { this.toggleAttribute("inline", Boolean(value)); }
    syncOpen(value: boolean): void { this.setOpen(Boolean(value), true, false); }
    show(): void { this.setOpen(true); }
    hide(): void { this.setOpen(false); }

    connectedCallback(): void {
      this.style.display ||= "contents";
      if (!this.shadowRoot) this.render();
      this.events?.abort();
      this.events = new AbortController();
      const options = { signal: this.events.signal };
      this.addEventListener("click", this.onClick, options);
      this.addEventListener("spui-popover-request-close", this.onRequestClose, options);
      this.addEventListener("contextmenu", this.onContextMenu, options);
      this.addEventListener("keydown", this.onKeyDown, options);
      this.addEventListener("focusout", this.onFocusOut, options);
      document.addEventListener("pointerdown", this.onOutsidePointerDown, { ...options, capture: true });
      window.addEventListener("blur", this.onWindowBlur, options);
      window.addEventListener("resize", this.position, options);
      window.addEventListener("scroll", this.onScroll, { ...options, capture: true });
      this.shadowRoot?.querySelector("slot[name=trigger]")?.addEventListener("slotchange", this.syncTrigger, options);
      this.shadowRoot?.querySelector("slot[name=title]")?.addEventListener("slotchange", this.syncLabel, options);
      this.observer = new MutationObserver(() => { this.syncTrigger(); this.syncLabel(); });
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["disable-button-enhancement"] });
      this.panel = this.shadowRoot?.querySelector<HTMLElement>(".surface") as (HTMLElement & { showPopover?: () => void; hidePopover?: () => void }) | undefined;
      this.panel?.addEventListener("pointerenter", this.onHoverEnter, options);
      this.panel?.addEventListener("pointerleave", this.onHoverLeave, options);
      this.resizeObserver = new ResizeObserver(this.position);
      if (this.panel) this.resizeObserver.observe(this.panel);
      this.isOpen = this.hasAttribute("open") || this.hasAttribute("default-open");
      this.syncTrigger();
      this.syncLabel();
      this.syncVisibility();
    }

    disconnectedCallback(): void {
      this.observer?.disconnect();
      this.resizeObserver?.disconnect();
      this.events?.abort();
      if (this.hoverTimer !== undefined) clearTimeout(this.hoverTimer);
      if (this.iframeBlurTimer !== undefined) clearTimeout(this.iframeBlurTimer);
      this.restoreTrigger();
      if (this.panel?.hasAttribute("popover")) this.panel.hidePopover?.();
      syncInertFocusState(this.ownerDocument, this, [], false);
    }

    attributeChangedCallback(name: string): void {
      if (!this.isConnected) return;
      if (name === "open") {
        const next = this.hasAttribute("open");
        if (next !== this.isOpen) {
          this.isOpen = next;
          this.syncVisibility();
          this.emitOpenChange();
        }
      } else if (name === "default-open") {
        if (this.hasAttribute(name) && !this.hasAttribute("open")) this.syncOpen(true);
      } else if (name === "trap-focus" || name === "inert-trap-focus" || name === "legacy-trap-focus") {
        this.syncInertFocus();
        this.syncModalSemantics();
        if (this.isOpen && this.trapFocusEnabled && this.inertTrapFocusEnabled) requestAnimationFrame(this.focusFirst);
      } else if (name === "unstable-disable-auto-focus") {
        if (this.isOpen && !this.hasAttribute(name)) requestAnimationFrame(this.focusFirst);
      } else if (name === "label") this.syncLabel();
      else if (name === "inline") { this.syncVisibility(); this.position(); }
      else this.position();
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:contents}.trigger{display:contents}.surface{position:fixed;inset:auto;margin:0;z-index:var(--spui-layer-popover,10000);box-sizing:border-box;width:max-content;max-width:var(--spui-popover-max-width,min(360px,calc(100vw - 16px)));max-height:var(--spui-popover-max-height,min(70vh,calc(100dvh - 24px)));overflow:auto;padding:16px;border:1px solid var(--spui-popover-border,var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1)));border-radius:var(--spui-popover-radius,var(--spui-card-radius,8px));background:var(--spui-popover-background,var(--spui-ui-surface,var(--colorNeutralBackground1,#fff)));color:var(--spui-popover-color,var(--spui-ui-text,var(--colorNeutralForeground1,#242424)));box-shadow:var(--spui-popover-shadow,0 8px 24px rgb(0 0 0 / 18%));font-family:var(--spui-font-family,inherit);font-size:14px;line-height:1.45;opacity:1;transform:scale(1);transform-origin:center;transition:opacity var(--spui-motion-duration-normal,140ms) cubic-bezier(.16,1,.3,1),transform var(--spui-motion-duration-normal,140ms) cubic-bezier(.16,1,.3,1)}@starting-style{.surface:popover-open{opacity:0;transform:scale(.97)}}.surface:not(:popover-open){display:none}.surface[hidden]{display:none}h2{margin:0 0 8px;font:600 16px/1.35 var(--spui-font-family,inherit)}h2:empty{display:none}slot[name=trigger]{display:contents}slot[name=title]:not(:defined){display:none}:host([data-spui-appearance=glass]) .surface{backdrop-filter:blur(18px) saturate(1.35)}:host([appearance=brand]){--spui-popover-background:var(--spui-ui-accent,var(--colorBrandBackground,#0078d4));--spui-popover-color:var(--spui-ui-accent-text,var(--spui-semantic-primary-button-text,#fff));--spui-popover-border:var(--spui-ui-accent,var(--colorBrandBackground,#0078d4))}:host([appearance=inverted]){--spui-popover-background:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));--spui-popover-color:var(--spui-ui-surface,var(--spui-semantic-body-background,#fff));--spui-popover-border:var(--spui-ui-text,var(--spui-semantic-body-text,#242424))}:host([size=small]) .surface{padding:8px;font-size:12px}:host([size=large]) .surface{padding:20px;font-size:16px}@media(prefers-reduced-motion:reduce){.surface{transition:none}}@media(forced-colors:active){.surface{border-color:CanvasText;box-shadow:none}.surface:popover-open{outline:1px solid CanvasText}}`;
      style.textContent += `:host([arrow]) .surface:before{content:"";position:absolute;z-index:1;width:8px;height:8px;border:1px solid var(--spui-popover-border,var(--spui-ui-stroke,#d1d1d1));background:var(--spui-popover-background,var(--spui-ui-surface,#fff));transform:rotate(45deg)}:host([arrow]) .surface[data-placement=bottom]:before{inset-block-start:-5px;inset-inline-start:var(--spui-popover-arrow-inline-offset,calc(50% - 5px));border-inline-end:0;border-block-end:0}:host([arrow]) .surface[data-placement=top]:before{inset-block-end:-5px;inset-inline-start:var(--spui-popover-arrow-inline-offset,calc(50% - 5px));border-inline-start:0;border-block-start:0}:host([arrow]) .surface[data-placement=left]:before{inset-inline-end:-5px;inset-block-start:var(--spui-popover-arrow-block-offset,calc(50% - 5px));border-inline-start:0;border-block-end:0}:host([arrow]) .surface[data-placement=right]:before{inset-inline-start:-5px;inset-block-start:var(--spui-popover-arrow-block-offset,calc(50% - 5px));border-inline-end:0;border-block-start:0}`;
      const panel = document.createElement("div") as HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
      panel.className = "surface";
      panel.part.add("surface");
      panel.setAttribute("popover", "manual");
      panel.setAttribute("role", "dialog");
      panel.tabIndex = -1;
      panel.id = nextId();
      const heading = document.createElement("h2");
      heading.id = `${panel.id}-title`;
      const titleSlot = document.createElement("slot");
      titleSlot.name = "title";
      heading.append(titleSlot);
      const contentSlot = document.createElement("slot");
      contentSlot.name = "content";
      panel.append(heading, contentSlot);
      const triggerSlot = document.createElement("slot");
      triggerSlot.name = "trigger";
      shadow.append(style, triggerSlot, panel);
      this.panel = panel;
    }

    private assigned(slotName: string): HTMLElement[] {
      return this.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name=${slotName}]`)?.assignedElements({ flatten: true }).filter((node): node is HTMLElement => node instanceof HTMLElement) ?? [];
    }

    private syncTrigger = (): void => {
      const slotted = this.assigned("trigger")[0];
      const next = slotted ? findFocusable(slotted.shadowRoot ?? slotted) ?? slotted : undefined;
      const disableButtonEnhancement = Boolean(slotted?.hasAttribute("disable-button-enhancement") || next?.hasAttribute("disable-button-enhancement"));
      if (next !== this.trigger) {
        this.trigger?.removeEventListener("pointerenter", this.onHoverEnter);
        this.trigger?.removeEventListener("pointerleave", this.onHoverLeave);
        if (this.trigger) this.resizeObserver?.unobserve(this.trigger);
        this.restoreTrigger();
        this.trigger = next;
        if (next) {
          next.addEventListener("pointerenter", this.onHoverEnter, { signal: this.events?.signal });
          next.addEventListener("pointerleave", this.onHoverLeave, { signal: this.events?.signal });
        }
        if (next) this.resizeObserver?.observe(next);
        this.triggerState = next ? { haspopup: next.getAttribute("aria-haspopup"), controls: next.getAttribute("aria-controls"), expanded: next.getAttribute("aria-expanded") } : undefined;
      }
      if (this.trigger && this.panel) {
        if (disableButtonEnhancement) this.restoreTriggerAttributes();
        else {
          if (this.trigger.getRootNode() === this.panel.getRootNode()) this.trigger.setAttribute("aria-controls", this.panel.id);
          else this.trigger.removeAttribute("aria-controls");
          this.trigger.setAttribute("aria-haspopup", "dialog");
          this.trigger.setAttribute("aria-expanded", String(this.isOpen));
        }
      }
      this.syncInertFocus();
    };

    private syncLabel = (): void => {
      if (!this.panel) return;
      const title = this.assigned("title");
      const heading = this.panel.querySelector("h2");
      if (heading) heading.hidden = title.length === 0;
      if (title.length) {
        this.panel.setAttribute("aria-labelledby", `${this.panel.id}-title`);
        this.panel.removeAttribute("aria-label");
      } else {
        this.panel.removeAttribute("aria-labelledby");
        const label = this.getAttribute("label") || "More details";
        this.panel.setAttribute("aria-label", label);
      }
    };

    private restoreTrigger(): void {
      if (!this.trigger || !this.triggerState) return;
      this.restoreTriggerAttributes();
      this.trigger = undefined;
      this.triggerState = undefined;
    }

    private restoreTriggerAttributes(): void {
      if (!this.trigger || !this.triggerState) return;
      for (const [name, value] of [["aria-haspopup", this.triggerState.haspopup], ["aria-expanded", this.triggerState.expanded]] as const) {
        if (value === null) this.trigger.removeAttribute(name); else this.trigger.setAttribute(name, value);
      }
      if (this.triggerState.controls === null) this.trigger.removeAttribute("aria-controls");
      else this.trigger.setAttribute("aria-controls", this.triggerState.controls);
    }

    private syncVisibility(): void {
      if (!this.panel) return;
      this.syncModalSemantics();
      this.syncInertFocus();
      this.panel.style.zIndex = this.inline ? "1" : "10000";
      if (this.isOpen) {
        this.exitGeneration++;
        this.focusEdge = "first";
        this.panel.hidden = false;
        this.panel.inert = false;
        this.panel.removeAttribute("aria-hidden");
        try { this.panel.showPopover?.(); } catch { this.panel.hidden = false; }
        this.position();
        requestAnimationFrame(this.position);
        if (!this.hasAttribute("unstable-disable-auto-focus")) requestAnimationFrame(() => {
          if (this.isOpen && !this.hasAttribute("unstable-disable-auto-focus")) this.focusFirst();
        });
      } else {
        if (this.hasAttribute("motion")) {
          this.panel.inert = true;
          this.panel.setAttribute("aria-hidden", "true");
          if (!this.panel.matches(":popover-open")) {
            try { this.panel.showPopover?.(); } catch { /* Keep the closed state if the browser cannot restore the top layer. */ }
          }
          const generation = ++this.exitGeneration;
          requestAnimationFrame(() => requestAnimationFrame(() => {
            const animations = new Set<Animation>();
            const visit = (element: Element): void => {
              for (const animation of element.getAnimations()) if (animation.playState === "running") animations.add(animation);
              if (element.shadowRoot) for (const child of element.shadowRoot.children) visit(child);
              for (const child of element.children) visit(child);
            };
            visit(this);
            const finish = (): void => {
              if (generation !== this.exitGeneration || this.isOpen || !this.panel) return;
              if (this.panel.hasAttribute("popover")) this.panel.hidePopover?.();
              this.panel.hidden = true;
            };
            if (animations.size) void Promise.allSettled([...animations].map(animation => animation.finished)).then(finish);
            else finish();
          }));
        } else {
          if (this.panel.hasAttribute("popover")) this.panel.hidePopover?.();
          this.panel.hidden = true;
        }
      }
      this.syncTrigger();
    }

    private syncModalSemantics(): void {
      if (!this.panel) return;
      if (this.trapFocusEnabled) {
        this.panel.setAttribute("role", "dialog");
        this.panel.setAttribute("aria-modal", "true");
      } else {
        this.panel.setAttribute("role", "group");
        this.panel.removeAttribute("aria-modal");
      }
    }

    private syncInertFocus(): void {
      syncInertFocusState(this.ownerDocument, this, this.assigned("trigger"), this.isOpen && this.trapFocusEnabled && this.inertTrapFocusEnabled);
    }

    private position = (): void => {
      const trigger = this.trigger;
      const panel = this.panel;
      if (panel) panel.style.zIndex = this.inline ? "1" : "10000";
      const point = this.contextPoint;
      const configured = this.positioning;
      const target = typeof configured === "object" ? configured.target : undefined;
      const targetElement = target && "nodeType" in target && target.nodeType === 1 ? target as Element : undefined;
      const targetContext = targetElement ?? (target && "contextElement" in target ? target.contextElement : undefined);
      if (targetContext !== this.positioningTarget) {
        if (this.positioningTarget) this.resizeObserver?.unobserve(this.positioningTarget);
        this.positioningTarget = targetContext;
        if (targetContext && targetContext !== trigger) this.resizeObserver?.observe(targetContext);
      }
      if (!this.isOpen || !panel || panel.hidden || (!trigger && !point && !target)) return;
      const targetRect = target && "getBoundingClientRect" in target ? target.getBoundingClientRect() : undefined;
      const anchor = targetRect ?? (point ? new DOMRect(point.x, point.y, 0, 0) : trigger!.getBoundingClientRect());
      const direction = this.getAttribute("dir") || (targetContext && getComputedStyle(targetContext).direction) || (trigger && getComputedStyle(trigger).direction) || getComputedStyle(this).direction || "ltr";
      const shorthand = typeof configured === "string" ? configured : configured.position ?? "bottom";
      const [rawPosition, shorthandAlign] = shorthand.split(/-(?=(?:start|end|top|bottom)$)/) as [PopoverPosition, FloatingAlign?];
      const aliases: Record<"above" | "below" | "before" | "after", FloatingPlacement> = { above: "top", below: "bottom", before: "start", after: "end" };
      const placement = aliases[rawPosition as keyof typeof aliases] ?? rawPosition as FloatingPlacement;
      const align = (typeof configured === "object" ? configured.align : undefined) ?? shorthandAlign ?? this.getAttribute("align") as FloatingAlign | null ?? "center";
      const rawOffset = typeof configured === "object" ? configured.offset : undefined;
      const offset = typeof rawOffset === "number" ? rawOffset : rawOffset?.mainAxis ?? Number(this.getAttribute("offset") ?? 8);
      const crossAxisOffset = typeof rawOffset === "object" ? rawOffset.crossAxis ?? 0 : 0;
      const fallbackPlacements = typeof configured === "object" ? (configured.fallbackPositions ?? []).map(fallback => {
        const [fallbackSide, fallbackAlign] = fallback.split(/-(?=(?:start|end|top|bottom)$)/) as [PopoverPosition, FloatingAlign?];
        return { placement: aliases[fallbackSide as keyof typeof aliases] ?? fallbackSide as FloatingPlacement, align: fallbackAlign ?? align };
      }) : [];
      const autoSize = typeof configured === "object" ? configured.autoSize : false;
      const matchTargetSize = typeof configured === "object" && configured.matchTargetSize === true;
      const pinned = typeof configured === "object" && configured.pinned === true;
      const coverTarget = typeof configured === "object" && configured.coverTarget === true;
      const arrowPadding = Math.max(0, typeof configured === "object" ? configured.arrowPadding ?? 8 : 8);
      const boundaryContext = targetContext ?? trigger ?? this;
      const flipBoundary = typeof configured === "object" ? getBoundaryRect(configured.flipBoundary, boundaryContext) : undefined;
      const overflowBoundary = typeof configured === "object" ? getBoundaryRect(configured.overflowBoundary, boundaryContext) : undefined;
      const rawBoundaryPadding = typeof configured === "object" ? configured.overflowBoundaryPadding : undefined;
      const boundaryPadding = typeof rawBoundaryPadding === "number"
        ? { top: rawBoundaryPadding, right: rawBoundaryPadding, bottom: rawBoundaryPadding, left: rawBoundaryPadding }
        : { top: rawBoundaryPadding?.top ?? 0, bottom: rawBoundaryPadding?.bottom ?? 0, left: direction === "rtl" ? rawBoundaryPadding?.end ?? 0 : rawBoundaryPadding?.start ?? 0, right: direction === "rtl" ? rawBoundaryPadding?.start ?? 0 : rawBoundaryPadding?.end ?? 0 };
      panel.style.position = typeof configured === "object" ? configured.strategy ?? (configured.positionFixed === true ? "fixed" : "absolute") : "absolute";
      panel.style.maxWidth = "";
      panel.style.maxHeight = "";
      panel.style.height = "";
      panel.style.overflowX = "";
      panel.style.overflowY = "";
      panel.style.width = matchTargetSize ? `${anchor.width}px` : "";
      const result = getFloatingPosition(anchor, { width: panel.offsetWidth, height: panel.offsetHeight }, placement, direction === "rtl" ? "rtl" : "ltr", offset, undefined, align, fallbackPlacements, pinned, flipBoundary, overflowBoundary, { crossAxisOffset, coverTarget, overflowBoundaryPadding: boundaryPadding });
      const clampArrow = (value: number, size: number): number => Math.max(arrowPadding, Math.min(value, Math.max(arrowPadding, size - arrowPadding - 8)));
      const arrowInline = direction === "rtl" ? result.left + panel.offsetWidth - anchor.left - anchor.width / 2 - 4 : anchor.left + anchor.width / 2 - result.left - 4;
      const arrowBlock = anchor.top + anchor.height / 2 - result.top - 4;
      panel.style.setProperty("--spui-popover-arrow-inline-offset", `${clampArrow(arrowInline, panel.offsetWidth)}px`);
      panel.style.setProperty("--spui-popover-arrow-block-offset", `${clampArrow(arrowBlock, panel.offsetHeight)}px`);
      const applyMaxWidth = autoSize === true || autoSize === "always" || autoSize === "width" || autoSize === "width-always";
      const applyMaxHeight = autoSize === true || autoSize === "always" || autoSize === "height" || autoSize === "height-always";
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const availableWidth = Math.max(0, result.placement === "left" ? anchor.left - (overflowBoundary?.left ?? 0) - boundaryPadding.left - offset : result.placement === "right" ? (overflowBoundary?.right ?? viewportWidth) - boundaryPadding.right - anchor.right - offset : (overflowBoundary?.right ?? viewportWidth) - boundaryPadding.right - (overflowBoundary?.left ?? 0) - boundaryPadding.left - offset * 2);
      const availableHeight = Math.max(0, result.placement === "top" ? anchor.top - (overflowBoundary?.top ?? 0) - boundaryPadding.top - offset : result.placement === "bottom" ? (overflowBoundary?.bottom ?? viewportHeight) - boundaryPadding.bottom - anchor.bottom - offset : (overflowBoundary?.bottom ?? viewportHeight) - boundaryPadding.bottom - (overflowBoundary?.top ?? 0) - boundaryPadding.top - offset * 2);
      if (applyMaxWidth) {
        panel.style.maxWidth = `${availableWidth}px`;
        if (panel.offsetWidth > availableWidth) { panel.style.width = `${availableWidth}px`; panel.style.overflowX = "auto"; }
      }
      if (applyMaxHeight) {
        panel.style.maxHeight = `${availableHeight}px`;
        if (panel.offsetHeight > availableHeight) { panel.style.height = `${availableHeight}px`; panel.style.overflowY = "auto"; }
      }
      panel.dataset.placement = result.placement;
      panel.style.left = `${result.left}px`;
      panel.style.top = `${result.top}px`;
    };

    private onScroll = (event: Event): void => {
      if (!this.hasAttribute("close-on-scroll") && !this.hasAttribute("open-on-context")) { this.position(); return; }
      const target = event.target;
      if (!(target instanceof Node) || !this.contains(target)) this.setOpen(false, false, true, event);
    };

    private onClick = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const path = event.composedPath();
      if (this.trigger && (this.trigger === target || this.trigger.contains(target) || path.includes(this.trigger))) {
        if (!this.hasAttribute("open-on-context")) this.setOpen(!this.isOpen, false, true, event);
        return;
      }
      if (!event.defaultPrevented && this.assigned("content").some(content => content === target || content.contains(target)) && path.some(node => node instanceof Element && node.matches("[data-spui-popover-close]"))) { this.setOpen(false, false, true, event); this.focusTrigger(); }
    };

    private onRequestClose = (event: Event): void => {
      if (event.defaultPrevented) return;
      this.setOpen(false, false, true, event);
      this.focusTrigger();
    };

    private onContextMenu = (event: MouseEvent): void => {
      if (!this.hasAttribute("open-on-context")) return;
      const target = event.target;
      if (this.trigger && target instanceof Node && !this.trigger.contains(target) && !event.composedPath().includes(this.trigger)) return;
      event.preventDefault();
      this.contextPoint = { x: event.clientX, y: event.clientY };
      this.setOpen(true, false, true, event);
      this.position();
    };

    private onHoverEnter = (event: PointerEvent): void => {
      if (!this.hasAttribute("open-on-hover") || this.hasAttribute("open-on-context")) return;
      if (this.hoverTimer !== undefined) clearTimeout(this.hoverTimer);
      this.hoverTimer = undefined;
      this.setOpen(true, false, true, event);
    };

    private onHoverLeave = (event: PointerEvent): void => {
      if (!this.hasAttribute("open-on-hover") || this.hasAttribute("open-on-context")) return;
      if (this.hoverTimer !== undefined) clearTimeout(this.hoverTimer);
      const delay = Number(this.getAttribute("mouse-leave-delay") ?? 500);
      this.hoverTimer = setTimeout(() => { this.hoverTimer = undefined; this.setOpen(false, false, true, event); }, Number.isFinite(delay) ? Math.max(0, delay) : 500);
    };

    private onWindowBlur = (event: FocusEvent): void => {
      if (!this.isOpen || this.getAttribute("close-on-iframe-focus") === "false") return;
      if (this.iframeBlurTimer !== undefined) clearTimeout(this.iframeBlurTimer);
      this.iframeBlurTimer = setTimeout(() => {
        this.iframeBlurTimer = undefined;
        const active = this.ownerDocument.activeElement;
        if (this.isConnected && this.isOpen && active instanceof HTMLIFrameElement && !this.contains(active)) this.setOpen(false, false, true, event);
      }, 0);
    };

    private onKeyDown = (event: KeyboardEvent): void => {
      if (!this.isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this.setOpen(false, false, true, event);
        this.focusTrigger();
      } else if (event.key === "Tab" && this.trapFocusEnabled) {
        this.focusEdge = event.shiftKey ? "last" : "first";
        this.cycleFocus(event);
      }
    };

    private focusTrigger(): void {
      const find = (root: ParentNode): HTMLElement | undefined => {
        const selector = "button,a[href],input:not([type=hidden]),select,textarea,[tabindex],slot";
        const candidates = [...(root instanceof HTMLElement && root.matches(selector) ? [root] : []), ...root.querySelectorAll<HTMLElement>(selector)];
        for (const node of candidates) {
          if (!node.hasAttribute("disabled") && node.tabIndex >= 0 && node.getClientRects().length) return node;
          if (node.shadowRoot) { const nested = find(node.shadowRoot); if (nested) return nested; }
          if (node instanceof HTMLSlotElement) for (const assigned of node.assignedElements({ flatten: true })) { const nested = find(assigned); if (nested) return nested; }
        }
        return undefined;
      };
      const trigger = this.trigger;
      const target = trigger && find(trigger.shadowRoot ?? trigger);
      if (target) target.focus(); else trigger?.focus();
    }

    private onFocusOut = (event: FocusEvent): void => {
      if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) return;
      if (this.trapFocusEnabled && this.inertTrapFocusEnabled) return;
      queueMicrotask(() => {
        if (!this.isOpen || this.focusIsInside()) return;
        if (!this.trapFocusEnabled) this.setOpen(false, false, true, event);
        else if (!this.inertTrapFocusEnabled) this.focusEdge === "last" ? this.focusLast() : this.focusFirst();
      });
    };

    private focusables(): HTMLElement[] {
      const result: HTMLElement[] = [];
      const visit = (root: ParentNode): void => {
        for (const node of root.querySelectorAll<HTMLElement>("button,a[href],input:not([type=hidden]),select,textarea,[tabindex]")) {
          if (!node.hasAttribute("disabled") && node.tabIndex >= 0 && node.getClientRects().length) result.push(node);
          if (node.shadowRoot) visit(node.shadowRoot);
          if (node instanceof HTMLSlotElement) for (const assigned of node.assignedElements({ flatten: true })) visit(assigned);
        }
      };
      for (const content of this.assigned("content")) visit(content);
      return [...new Set(result)];
    }

    private focusFirst = (): void => { (this.focusables()[0] ?? this.panel)?.focus(); };
    private focusLast = (): void => { const items = this.focusables(); items[items.length - 1]?.focus(); };

    private cycleFocus(event: KeyboardEvent): void {
      const items = this.focusables();
      if (!items.length) { event.preventDefault(); this.panel?.focus(); return; }
      let active = document.activeElement as HTMLElement | null;
      while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement as HTMLElement;
      const target = event.composedPath().find((node): node is HTMLElement => node instanceof HTMLElement && items.includes(node));
      const activeIndex = target ? items.indexOf(target) : items.findIndex(item => item === active || Boolean(active && item.contains(active)));
      if (event.shiftKey && activeIndex === 0) { event.preventDefault(); items[items.length - 1].focus(); }
      else if (!event.shiftKey && activeIndex === items.length - 1) { event.preventDefault(); items[0].focus(); }
    }

    private focusIsInside(): boolean {
      let active: Element | null = document.activeElement;
      while (active) {
        if (active === this || this.contains(active)) return true;
        active = active.shadowRoot?.activeElement ?? null;
      }
      return false;
    }

    private onOutsidePointerDown = (event: PointerEvent): void => {
      if (this.isOpen && event.target instanceof Node && !this.contains(event.target) && !event.composedPath().includes(this)) this.setOpen(false, false, true, event);
    };

    private setOpen(value: boolean, force = false, notify = true, sourceEvent?: Event): void {
      const next = Boolean(value);
      if (next === this.isOpen) return;
      if (!force && this.hasAttribute("data-spui-controlled-open")) { this.emitOpenChange(next, sourceEvent); return; }
      this.isOpen = next;
      if (!next) this.contextPoint = undefined;
      if (this.hasAttribute("open") !== next) this.toggleAttribute("open", next);
      this.syncVisibility();
      if (notify) this.emitOpenChange(this.isOpen, sourceEvent);
    }

    private emitOpenChange(open = this.isOpen, event?: Event): void {
      this.dispatchEvent(new CustomEvent<PopoverOpenChangeData & { event?: Event }>("spui-open-change", { bubbles: true, composed: true, detail: { open, event } }));
    }
  }
  customElements.define("spui-popover", SpuiPopover);
}

type PopoverElementBase = CustomElementConstructor & {
  new(): HTMLElement & { connectedCallback(): void; open: boolean; show(): void; hide(): void };
  observedAttributes: string[];
};

export function definePopoverVariant(tagName: string, defaults: { label?: string; trapFocus?: boolean; arrow?: boolean } = {}): void {
  definePopover();
  if (customElements.get(tagName)) return;
  const BasePopover = customElements.get("spui-popover") as PopoverElementBase;
  class SpuiPopoverVariant extends BasePopover {
    static observedAttributes = BasePopover.observedAttributes;

    connectedCallback(): void {
      if (defaults.label && !this.hasAttribute("label")) this.setAttribute("label", defaults.label);
      if (defaults.trapFocus && !this.hasAttribute("trap-focus")) this.setAttribute("trap-focus", "");
      if (defaults.arrow && !this.hasAttribute("arrow")) this.setAttribute("arrow", "");
      super.connectedCallback();
    }
  }
  customElements.define(tagName, SpuiPopoverVariant);
}
