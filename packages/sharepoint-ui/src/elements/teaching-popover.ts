import { buttonControlCss, defineButton } from "./button.js";
import { definePopoverVariant } from "./popover.js";
import { base } from "./shared.js";

export type TeachingPopoverAnnouncementFunction = (newValue: string) => string;
export type TeachingPopoverCarouselValueChangeType = "click" | "keydown" | "programmatic";
export type TeachingPopoverCarouselValueChangeDetail = { value?: string; event?: Event; type: TeachingPopoverCarouselValueChangeType; currentPage?: number; totalPages?: number };
export type TeachingPopoverFinishDetail = { value?: string; event?: Event; type: "click" };
export type TeachingPopoverAnnouncementDetail = { value: string; message: string; currentPage: number; totalPages: number };
export interface SharePointTeachingPopoverCarouselElement extends HTMLElement {
  value: string;
  defaultValue: string;
  announcement?: TeachingPopoverAnnouncementFunction;
}
declare global { interface HTMLElementTagNameMap { "spui-teaching-popover-carousel": SharePointTeachingPopoverCarouselElement; } }

const pageCountTag = "spui-teaching-popover-carousel-page-count";
const cardTag = "spui-teaching-popover-carousel-card";
const navButtonTag = "spui-teaching-popover-carousel-nav-button";
const footerButtonTag = "spui-teaching-popover-carousel-footer-button";
const carouselTag = "spui-teaching-popover-carousel";
const partTag = (name: string): string => `spui-teaching-popover-${name}`;

function languageOf(element: HTMLElement): string {
  return element.closest<HTMLElement>("[lang]")?.lang || document.documentElement.lang || "en";
}

function localize(template: string, current: number, total: number): string {
  return template.replaceAll("{current}", String(current)).replaceAll("{totalPages}", String(total)).replaceAll("{total}", String(total));
}

function definePart(tag: string, elementName: string, css: string, namedSlots: string[] = [], fallbacks: Record<string, (host: HTMLElement) => Node> = {}, closeSlots = namedSlots): void {
  if (customElements.get(tag)) return;
  class SpuiTeachingPart extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{box-sizing:border-box;display:block}${css}`;
      const element = document.createElement(elementName);
      element.part.add("root");
      for (const name of namedSlots) { const slot = document.createElement("slot"); slot.name = name; if (name === "icon") slot.setAttribute("aria-hidden", "true"); const fallback = fallbacks[name]?.(this); if (fallback) slot.append(fallback); element.append(slot); }
      element.append(document.createElement("slot"));
      if (closeSlots.length) this.addEventListener("click", event => {
        const path = event.composedPath();
        if (event.defaultPrevented || path.some(node => node instanceof HTMLElement && node.hasAttribute("data-spui-react-action")) || !path.some(node => node instanceof HTMLElement && closeSlots.includes(node.slot))) return;
        this.dispatchEvent(new CustomEvent("spui-popover-request-close", { bubbles: true, composed: true, detail: { sourceEvent: event } }));
      });
      shadow.append(style, element);
    }
  }
  customElements.define(tag, SpuiTeachingPart);
}

function defineTeachingButton(tag: string, kind: "nav" | "footer"): void {
  if (customElements.get(tag)) return;
  class SpuiTeachingButton extends HTMLElement {
    static observedAttributes = ["nav-type", "value", "alt-text", "aria-label", "aria-current", "tabindex", "disabled", "size", "appearance", "shape", "icon-only", "data-edge"];
    private button?: HTMLButtonElement;
    private fallback?: HTMLSpanElement;
    private alternate?: HTMLSpanElement;

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.style.display ||= "inline-flex";
      this.sync();
    }

    attributeChangedCallback(): void { this.sync(); }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
      const style = document.createElement("style");
      style.textContent = buttonControlCss;
      const button = document.createElement("button");
      button.type = "button";
      button.part.add("control");
      const fallback = document.createElement("span");
      fallback.className = "fallback";
      fallback.append(document.createElement("slot"));
      button.append(fallback);
      this.button = button;
      this.fallback = fallback;
      if (kind === "footer") {
        const alternate = document.createElement("span");
        alternate.className = "alternate";
        alternate.hidden = true;
        button.append(alternate);
        this.alternate = alternate;
        style.textContent += `.fallback[hidden],.alternate[hidden]{display:none}.alternate{white-space:nowrap}`;
      }
      shadow.append(style, button);
    }

    private sync(): void {
      const button = this.button;
      if (!button) return;
      const navType = this.getAttribute("nav-type") ?? (kind === "nav" ? "step" : "next");
      const appearance = this.getAttribute("appearance") ?? (kind === "nav" ? "subtle" : navType === "next" ? "primary" : navType === "dismiss" ? "subtle" : "secondary");
      const size = this.getAttribute("size") ?? (kind === "nav" ? "small" : "medium");
      const shape = this.getAttribute("shape") ?? (kind === "nav" ? "circular" : "rounded");
      const setIfChanged = (name: string, value: string): void => { if (this.getAttribute(name) !== value) this.setAttribute(name, value); };
      button.className = appearance === "primary" ? "primary" : ["outline", "subtle", "transparent"].includes(appearance) ? appearance : "secondary";
      this.toggleAttribute("data-spui-popover-close", kind === "footer" && navType === "dismiss");
      if (kind === "nav" && !this.hasAttribute("icon-only")) this.setAttribute("icon-only", "");
      button.disabled = this.hasAttribute("disabled");
      button.setAttribute("part", "control");
      button.setAttribute("aria-label", this.getAttribute("aria-label") || this.textContent?.trim() || (kind === "nav" ? "Tour step" : navType));
      if (this.hasAttribute("aria-current")) button.setAttribute("aria-current", this.getAttribute("aria-current")!); else button.removeAttribute("aria-current");
      button.tabIndex = this.hasAttribute("tabindex") ? Number(this.getAttribute("tabindex")) : kind === "nav" ? -1 : 0;
      setIfChanged("appearance", appearance);
      setIfChanged("size", size);
      setIfChanged("shape", shape);
      if (kind === "footer") {
        const edge = this.getAttribute("data-edge");
        const isEdge = (navType === "previous" || navType === "prev") ? edge === "first" : navType === "next" && edge === "last";
        const altText = this.getAttribute("alt-text");
        const alternate = this.alternate;
        if (this.fallback) this.fallback.hidden = Boolean(isEdge && altText);
        if (alternate) { alternate.hidden = !(isEdge && altText); alternate.textContent = isEdge ? altText ?? "" : ""; }
        const label = isEdge && altText ? altText : this.getAttribute("aria-label") || this.textContent?.trim() || (navType === "dismiss" ? "Finish tour" : navType === "previous" || navType === "prev" ? "Previous step" : "Next step");
        button.setAttribute("aria-label", label);
        setIfChanged("aria-label", label);
      }
    }
  }
  customElements.define(tag, SpuiTeachingButton);
}

function defineCarousel(): void {
  if (customElements.get(carouselTag)) return;
  class SpuiTeachingPopoverCarousel extends HTMLElement implements SharePointTeachingPopoverCarouselElement {
    static observedAttributes = ["value", "default-value", "aria-label", "page-count-template", "page-label-template"];
    private currentValue = "";
    private events?: AbortController;
    private observer?: MutationObserver;
    private slotNode?: HTMLSlotElement;
    private liveRegion?: HTMLSpanElement;
    announcement?: TeachingPopoverAnnouncementFunction;

    get value(): string { return this.getAttribute("value") ?? this.currentValue; }
    set value(value: string) { this.setAttribute("value", value); }
    get defaultValue(): string { return this.getAttribute("default-value") ?? ""; }
    set defaultValue(value: string) { this.setAttribute("default-value", value); }

    connectedCallback(): void {
      this.style.display ||= "grid";
      if (!this.shadowRoot) this.render();
      this.events?.abort();
      this.events = new AbortController();
      this.addEventListener("click", this.onClick, { signal: this.events.signal });
      this.addEventListener("keydown", this.onKeyDown, { signal: this.events.signal });
      this.slotNode?.addEventListener("slotchange", this.sync, { signal: this.events.signal });
      this.observer?.disconnect();
      this.observer = new MutationObserver(this.sync);
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["value", "nav-type", "alt-text"] });
      this.setAttribute("role", "region");
      this.setAttribute("aria-roledescription", "carousel");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", languageOf(this).startsWith("ar") ? "خطوات الجولة" : "Tour steps");
      this.currentValue = this.defaultValue || this.cards()[0]?.getAttribute("value") || "";
      this.sync();
    }

    disconnectedCallback(): void { this.events?.abort(); this.observer?.disconnect(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:grid;gap:8px;min-width:0}slot{display:contents}`;
      this.slotNode = document.createElement("slot");
      this.liveRegion = document.createElement("span");
      this.liveRegion.setAttribute("aria-live", "polite");
      this.liveRegion.setAttribute("aria-atomic", "true");
      this.liveRegion.setAttribute("part", "announcement");
      style.textContent += `span[part=announcement]{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}`;
      shadow.append(style, this.slotNode, this.liveRegion);
    }

    private cards(): HTMLElement[] { return [...this.querySelectorAll<HTMLElement>(cardTag)]; }

    private sync = (): void => {
      const cards = this.cards();
      if (!cards.length) return;
      const current = this.getAttribute("value") ?? this.currentValue ?? cards[0].getAttribute("value") ?? "";
      const selectedIndex = Math.max(0, cards.findIndex(card => card.getAttribute("value") === current));
      const selected = cards[selectedIndex];
      if (!this.hasAttribute("value")) this.currentValue = selected.getAttribute("value") ?? "";
      const language = languageOf(this);
      const pageTemplate = this.getAttribute("page-label-template") ?? (language.startsWith("ar") ? "الخطوة {current} من {total}" : "Step {current} of {total}");
      cards.forEach((card, index) => {
        const active = index === selectedIndex;
        card.hidden = !active;
        card.setAttribute("role", "group");
        card.setAttribute("aria-roledescription", language.startsWith("ar") ? "شريحة" : "slide");
        if (!card.hasAttribute("aria-label")) card.setAttribute("aria-label", localize(pageTemplate, index + 1, cards.length));
        card.toggleAttribute("data-active", active);
      });
      this.querySelectorAll<HTMLElement>(navButtonTag).forEach(button => {
        const active = button.getAttribute("value") === selected.getAttribute("value");
        if (active) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
        button.setAttribute("tabindex", active ? "0" : "-1");
      });
      const edge = selectedIndex === 0 ? "first" : selectedIndex === cards.length - 1 ? "last" : "";
      this.querySelectorAll<HTMLElement>(footerButtonTag).forEach(button => edge ? button.setAttribute("data-edge", edge) : button.removeAttribute("data-edge"));
      const countTemplate = this.getAttribute("page-count-template") ?? (language.startsWith("ar") ? "{current} من {total}" : "{current} of {total}");
      const count = localize(countTemplate, selectedIndex + 1, cards.length);
      this.querySelectorAll<HTMLElement>(pageCountTag).forEach(pageCount => {
        const value = pageCount.shadowRoot?.querySelector<HTMLElement>("[aria-live]");
        if (value) value.textContent = count;
      });
      this.setAttribute("data-value", selected.getAttribute("value") ?? "");
      this.setAttribute("data-current-page", String(selectedIndex + 1));
      this.setAttribute("data-total-pages", String(cards.length));
    };

    private changeTo(index: number, event?: Event): void {
      const cards = this.cards();
      const next = cards[Math.max(0, Math.min(cards.length - 1, index))]?.getAttribute("value");
      if (!next || next === this.value) return;
      const type = (event?.type ?? "programmatic") as TeachingPopoverCarouselValueChangeType;
      if (this.hasAttribute("value")) {
        this.dispatchEvent(new CustomEvent<TeachingPopoverCarouselValueChangeDetail>("spui-value-change", { bubbles: true, composed: true, detail: { value: next, event, type } }));
        this.announceAfterUpdate(next, cards.length);
        return;
      }
      this.currentValue = next;
      this.sync();
      const currentPage = cards.findIndex(card => card.getAttribute("value") === next) + 1;
      const detail: TeachingPopoverCarouselValueChangeDetail = { value: next, currentPage, totalPages: cards.length, event, type };
      this.dispatchEvent(new CustomEvent("spui-value-change", { bubbles: true, composed: true, detail }));
      this.dispatchEvent(new CustomEvent("spui-carousel-change", { bubbles: true, composed: true, detail }));
      this.announceAfterUpdate(next, cards.length);
    }

    private announceAfterUpdate(value: string, totalPages: number): void {
      if (!this.announcement) return;
      requestAnimationFrame(() => {
        if (this.value !== value) return;
        const message = this.announcement?.(value) ?? "";
        if (this.liveRegion) this.liveRegion.textContent = message;
        if (!message) return;
        const currentPage = this.cards().findIndex(card => card.getAttribute("value") === value) + 1;
        this.dispatchEvent(new CustomEvent("spui-announcement", { bubbles: true, composed: true, detail: { value, message, currentPage, totalPages } }));
      });
    }

    private onClick = (event: Event): void => {
      if (event.defaultPrevented) return;
      const path = event.composedPath().filter((node): node is HTMLElement => node instanceof HTMLElement);
      const nav = path.find(node => node.localName === navButtonTag);
      if (nav) { const index = this.cards().findIndex(card => card.getAttribute("value") === nav.getAttribute("value")); if (index >= 0) this.changeTo(index, event); return; }
      const button = path.find(node => node.localName === footerButtonTag);
      if (!button) return;
      const type = button.getAttribute("nav-type");
      const index = this.cards().findIndex(card => card.getAttribute("value") === this.value);
      if (type === "prev" || type === "previous") this.changeTo(index - 1, event);
      else if (type === "next" && index === this.cards().length - 1) this.dispatchEvent(new CustomEvent<TeachingPopoverFinishDetail>("spui-finish", { bubbles: true, composed: true, detail: { value: this.value, event, type: "click" } }));
      else if (type === "next") this.changeTo(index + 1, event);
    };

    private onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const cards = this.cards();
      const index = cards.findIndex(card => card.getAttribute("value") === this.value);
      const rtl = getComputedStyle(this).direction === "rtl";
      const delta = event.key === "ArrowRight" ? (rtl ? -1 : 1) : event.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0;
      const next = event.key === "Home" ? 0 : event.key === "End" ? cards.length - 1 : delta ? Math.max(0, Math.min(cards.length - 1, index + delta)) : -1;
      if (next < 0 || next === index) return;
      event.preventDefault();
      this.changeTo(next, event);
      const value = cards[next]?.getAttribute("value");
      requestAnimationFrame(() => {
        const control = [...this.querySelectorAll<HTMLElement>(navButtonTag)].find(item => item.getAttribute("value") === value);
        (control?.shadowRoot?.querySelector<HTMLButtonElement>("button") ?? control)?.focus();
      });
    };
  }
  customElements.define(carouselTag, SpuiTeachingPopoverCarousel);
}

function defineCard(): void {
  if (customElements.get(cardTag)) return;
  class SpuiTeachingPopoverCarouselCard extends HTMLElement {
    static observedAttributes = ["value", "aria-label", "hidden"];
    connectedCallback(): void {
      this.style.display ||= "grid";
      this.style.minWidth ||= "0";
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `${base}:host([hidden]){display:none!important}slot{display:contents}`;
        const slide = document.createElement("div");
        slide.part.add("slide");
        slide.append(document.createElement("slot"));
        shadow.append(style, slide);
      }
    }
  }
  customElements.define(cardTag, SpuiTeachingPopoverCarouselCard);
}

function definePageCount(): void {
  if (customElements.get(pageCountTag)) return;
  class SpuiTeachingPopoverPageCount extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex;align-items:center;color:var(--spui-ui-text-muted,var(--colorNeutralForeground3,#616161));font-size:var(--spui-font-size-200,12px);white-space:nowrap}[aria-live]{display:inline}`;
      const value = document.createElement("span");
      value.setAttribute("aria-live", "polite");
      value.setAttribute("part", "count");
      shadow.append(style, value);
    }
  }
  customElements.define(pageCountTag, SpuiTeachingPopoverPageCount);
}

function defineCarouselFooter(): void {
  const tag = partTag("carousel-footer");
  if (customElements.get(tag)) return;
  class SpuiTeachingPopoverCarouselFooter extends HTMLElement {
    static observedAttributes = ["layout", "initial-step-text", "final-step-text"];
    private slotNode?: HTMLSlotElement;
    private footer?: HTMLElement;

    connectedCallback(): void {
      if (this.shadowRoot) return;
      this.style.display ||= "block";
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{box-sizing:border-box}footer{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px}slot{display:contents}`;
      this.footer = document.createElement("footer");
      this.footer.part.add("root");
      const previous = document.createElement("slot");
      previous.name = "previous";
      const next = document.createElement("slot");
      next.name = "next";
      this.slotNode = document.createElement("slot");
      this.slotNode.addEventListener("slotchange", this.sync);
      this.footer.append(previous, this.slotNode, next);
      shadow.append(style, this.footer);
      this.sync();
    }

    attributeChangedCallback(): void { this.sync(); }

    private sync = (): void => {
      if (this.footer) this.footer.style.justifyContent = this.getAttribute("layout") === "offset" ? "space-between" : "center";
      for (const [type, attr] of [["previous", "initial-step-text"], ["prev", "initial-step-text"], ["next", "final-step-text"]]) {
        const text = this.getAttribute(attr);
        for (const button of this.querySelectorAll<HTMLElement>(`${footerButtonTag}[nav-type="${type}"]`)) {
          const previousGenerated = button.getAttribute("data-spui-footer-alt-text");
          const existingAlt = button.getAttribute("alt-text");
          if ((previousGenerated && existingAlt !== previousGenerated) || (!previousGenerated && existingAlt)) continue;
          if (text) {
            button.setAttribute("alt-text", text);
            button.setAttribute("data-spui-footer-alt-text", text);
          } else if (previousGenerated) {
            button.removeAttribute("alt-text");
            button.removeAttribute("data-spui-footer-alt-text");
          }
        }
      }
    };
  }
  customElements.define(tag, SpuiTeachingPopoverCarouselFooter);
}

/** Register the framework-neutral TeachingPopover and its composable guided-tour parts. */
export function defineTeachingPopover(): void {
  defineButton();
  definePopoverVariant("spui-teaching-popover", { label: "Guided tour", trapFocus: true, arrow: true });
  definePart(partTag("trigger"), "span", ":host{display:contents!important}");
  definePart(partTag("surface"), "div", ":host{display:grid;gap:12px;min-width:min(320px,calc(100vw - 64px));max-width:100%;box-sizing:border-box}");
  const iconFallback = (): SVGSVGElement => { const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 16 16"); svg.setAttribute("width", "16"); svg.setAttribute("height", "16"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "1.25"); const path = document.createElementNS(svg.namespaceURI, "path"); path.setAttribute("d", "M5.1 10.6c-.3-.8-.7-1.3-1.2-2A4.3 4.3 0 1 1 12.1 8c-.5.7-.9 1.2-1.2 2.6H5.2l-.1 0Zm.4 1.3h5m-4.5 1.4h4m-3.4 1.2h2.8"); svg.append(path); return svg; };
  const dismissFallback = (host: HTMLElement): HTMLButtonElement => { const button = document.createElement("button"); button.type = "button"; button.setAttribute("aria-label", languageOf(host).startsWith("ar") ? "إغلاق" : "Dismiss"); button.setAttribute("data-spui-popover-close", ""); button.textContent = "×"; return button; };
  definePart(partTag("header"), "header", "header{display:flex;align-items:center;gap:8px;padding-block-end:4px;color:var(--spui-ui-text-muted,var(--colorNeutralForeground3,#616161));font-size:var(--spui-font-size-200,12px);font-weight:600}slot[name=icon]{display:inline-flex;align-items:center;flex:none;color:var(--spui-ui-accent,var(--colorBrandForeground1,#0f6cbd))}slot[name=dismiss-button]{margin-inline-start:auto}slot[name=dismiss-button] button,slot[name=dismiss-button]::slotted(button){box-sizing:border-box;display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:inherit;font:inherit;cursor:pointer}slot[name=dismiss-button] button:hover,slot[name=dismiss-button]::slotted(button):hover{background:var(--spui-ui-surface-hover,var(--colorNeutralBackground1Hover,#f5f5f5))}slot[name=dismiss-button] button:focus-visible,slot[name=dismiss-button]::slotted(button):focus-visible{outline:2px solid var(--spui-ui-border-focus,var(--spui-ui-accent,#0f6cbd));outline-offset:1px}", ["icon", "dismiss-button"], { icon: iconFallback, "dismiss-button": dismissFallback }, ["dismiss-button"]);
  definePart(partTag("title"), "h2", "h2{display:flex;align-items:center;gap:8px;margin:0;color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424));font:600 20px/1.3 var(--spui-font-family,inherit)}slot[name=dismiss-button]{margin-inline-start:auto}", ["dismiss-button"]);
  definePart(partTag("body"), "div", "div{display:grid;gap:8px;padding-block-end:8px;color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424));font:var(--spui-font-family,inherit);line-height:1.5}");
  definePart(partTag("footer"), "footer", "footer{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px}slot[name=primary],slot[name=secondary]{display:inline-flex}slot:not([name]){display:contents}", ["primary", "secondary"]);
  defineCarouselFooter();
  definePart(partTag("carousel-nav"), "nav", "nav{display:flex;align-items:center;gap:4px}");
  defineCard();
  definePageCount();
  defineCarousel();
  defineTeachingButton(navButtonTag, "nav");
  defineTeachingButton(footerButtonTag, "footer");
}
