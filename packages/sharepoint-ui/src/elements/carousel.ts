import { base } from "./shared.js";
import { buttonControlCss } from "./button.js";

let carouselId = 0;
export type CarouselAlign = "start" | "center" | "end";
export type CarouselAppearance = "flat" | "elevated";
export type CarouselMotion = "slide" | "fade" | { kind: "slide"; duration?: number };
export type CarouselAnnouncerFunction = (index: number, totalSlides: number, slideGroupList: number[][]) => string;
export type CarouselIndexChangeData =
  | { event: MouseEvent; type: "click"; index: number }
  | { event: FocusEvent; type: "focus"; index: number }
  | { event: PointerEvent | MouseEvent; type: "drag"; index: number }
  | { event: Event; type: "autoplay" | "scroll" | "programmatic"; index: number }
  | { event: KeyboardEvent; type: "keydown"; index: number };
export type CarouselIndexChangeSource = CarouselIndexChangeData extends infer T ? T extends { index: number } ? Omit<T, "index"> : never : never;

export interface SharePointCarouselElement extends HTMLElement {
  align: CarouselAlign;
  appearance: CarouselAppearance;
  motion: CarouselMotion;
  motionDuration: number;
  slideWidth: string;
  groupSize: number | "auto";
  draggable: boolean;
  whitespace: boolean;
  selectedIndex: number;
  defaultSelectedIndex: number;
  activeIndex: number;
  defaultActiveIndex: number;
  circular: boolean;
  goTo(index: number): void;
  nextSlide(): void;
  previousSlide(): void;
  announcement?: CarouselAnnouncerFunction;
}

export interface SharePointCarouselNavButtonElement extends HTMLElement {
  index: number;
  selected: boolean;
  disabled: boolean;
}

export interface SharePointCarouselCardElement extends HTMLElement {
  autoSize: boolean;
}

export interface SharePointCarouselButtonElement extends HTMLElement {
  navType: "prev" | "next";
  disabled: boolean;
}

export interface SharePointCarouselAutoplayButtonElement extends HTMLElement {
  selected: boolean;
}

export interface SharePointCarouselSliderElement extends HTMLElement {
  cardFocus: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "spui-carousel": SharePointCarouselElement;
    "spui-carousel-card": SharePointCarouselCardElement;
    "spui-carousel-nav": HTMLElement;
    "spui-carousel-nav-button": SharePointCarouselNavButtonElement;
    "spui-carousel-nav-image-button": SharePointCarouselNavButtonElement;
    "spui-carousel-button": SharePointCarouselButtonElement;
    "spui-carousel-autoplay-button": SharePointCarouselAutoplayButtonElement;
    "spui-carousel-slider": SharePointCarouselSliderElement;
    "spui-carousel-viewport": HTMLElement;
    "spui-carousel-nav-container": HTMLElement;
  }
}

export function defineCarouselCard(): void {
  if (customElements.get("spui-carousel-card")) return;
  class SpuiCarouselCard extends HTMLElement {
    static observedAttributes = ["auto-size"];
    get autoSize(): boolean { return this.hasAttribute("auto-size"); }
    set autoSize(value: boolean) { this.toggleAttribute("auto-size", Boolean(value)); }
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `${base}:host{box-sizing:border-box;display:block;flex:0 0 var(--spui-carousel-slide-width,var(--spui-carousel-slide-size,100%));min-width:0;scroll-snap-align:var(--spui-carousel-align,start);scroll-snap-stop:always}:host([auto-size]){flex-basis:auto}:host([data-spui-carousel-space-start]){margin-inline-start:var(--spui-carousel-auto-space-start,0px)}:host([data-spui-carousel-space-end]){margin-inline-end:var(--spui-carousel-auto-space-end,0px)}:host([data-spui-carousel-motion]){grid-area:1/1;width:100%;flex:none;opacity:0;visibility:hidden;pointer-events:none;transition:opacity var(--spui-carousel-motion-duration,240ms) var(--spui-motion-easing-standard,ease),visibility 0s linear var(--spui-carousel-motion-duration,240ms)}:host([data-spui-carousel-motion][data-spui-carousel-active]){opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}@media(prefers-reduced-motion:reduce){:host([data-spui-carousel-motion]){transition:none}}slot{display:block}`;
        root.append(style, document.createElement("slot"));
      }
      this.setAttribute("role", this.getAttribute("role") || "group");
      this.setAttribute("aria-roledescription", this.getAttribute("aria-roledescription") || "slide");
    }
  }
  customElements.define("spui-carousel-card", SpuiCarouselCard);
}

export function defineCarouselNav(): void {
  if (customElements.get("spui-carousel-nav")) return;
  class SpuiCarouselNav extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:flex;align-items:center;justify-content:center;gap:4px;min-width:0}:host([appearance=brand]){--spui-carousel-indicator:var(--spui-ui-accent,#0078d4)}slot{display:contents}`;
      const group = document.createElement("div"); group.setAttribute("role", "group"); group.setAttribute("aria-label", this.getAttribute("aria-label") || "Slide navigation");
      const slot = document.createElement("slot"); group.append(slot); root.append(style, group);
    }
  }
  customElements.define("spui-carousel-nav", SpuiCarouselNav);
}

function defineCarouselNavControl(tag: "spui-carousel-nav-button" | "spui-carousel-nav-image-button", image: boolean): void {
  if (customElements.get(tag)) return;
  class SpuiCarouselNavControl extends HTMLElement implements SharePointCarouselNavButtonElement {
    static observedAttributes = ["index", "selected", "disabled", "label", "src", "alt"];
    private button!: HTMLButtonElement;
    private picture?: HTMLImageElement;
    get index(): number { const value = Number(this.getAttribute("index")); return Number.isInteger(value) && value >= 0 ? value : 0; }
    set index(value: number) { this.setAttribute("index", String(Math.max(0, Math.floor(value)))); }
    get selected(): boolean { return this.hasAttribute("selected"); }
    set selected(value: boolean) { this.toggleAttribute("selected", Boolean(value)); }
    get disabled(): boolean { return this.hasAttribute("disabled"); }
    set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `${base}:host{display:inline-flex;min-width:0}button{box-sizing:border-box;display:grid;place-items:center;min-width:44px;min-height:44px;padding:4px;border:1px solid var(--spui-ui-stroke,#d1d1d1);border-radius:var(--spui-control-radius,6px);background:var(--spui-ui-surface,#fff);color:var(--spui-ui-text,inherit);font:inherit;cursor:pointer}button[aria-current=step]{border-color:var(--spui-ui-accent,#0078d4);box-shadow:inset 0 0 0 1px var(--spui-ui-accent,#0078d4)}button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}img{display:block;width:56px;height:40px;object-fit:cover;border-radius:calc(var(--spui-control-radius,6px) - 2px)}slot{display:contents}@media(forced-colors:active){button{border-color:ButtonText}button[aria-current=step]{outline:2px solid Highlight}}`;
        this.button = document.createElement("button"); this.button.type = "button";
        if (image) { this.picture = document.createElement("img"); const imageSlot = document.createElement("slot"); imageSlot.name = "image"; imageSlot.append(this.picture); this.button.append(imageSlot); }
        const content = document.createElement("slot"); this.button.append(content);
        this.button.addEventListener("click", event => this.dispatchEvent(new CustomEvent("spui-carousel-nav-select", { bubbles: true, composed: true, detail: { index: this.index, event } })));
        this.button.addEventListener("keydown", event => {
          const nav = this.closest("spui-carousel-nav");
          if (!nav) return;
          const buttons = [...nav.querySelectorAll<HTMLElement>("spui-carousel-nav-button,spui-carousel-nav-image-button")];
          const current = buttons.indexOf(this);
          const rtl = getComputedStyle(nav).direction === "rtl";
          const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : event.key === (rtl ? "ArrowLeft" : "ArrowRight") ? Math.min(buttons.length - 1, current + 1) : event.key === (rtl ? "ArrowRight" : "ArrowLeft") ? Math.max(0, current - 1) : -1;
          if (next < 0) return;
          event.preventDefault(); buttons[next].shadowRoot?.querySelector("button")?.focus();
        });
        root.append(style, this.button);
      }
      this.sync();
    }
    attributeChangedCallback(): void { this.sync(); }
    private sync(): void {
      if (!this.button) return;
      this.button.disabled = this.hasAttribute("disabled");
      if (this.selected) this.button.setAttribute("aria-current", "step"); else this.button.removeAttribute("aria-current");
      this.button.tabIndex = this.selected ? 0 : -1;
      const label = this.getAttribute("label") || this.getAttribute("alt") || this.textContent?.trim() || `Slide ${this.index + 1}`;
      this.button.setAttribute("aria-label", label);
      if (this.picture) { this.picture.src = this.getAttribute("src") || ""; this.picture.alt = this.getAttribute("alt") || ""; }
    }
  }
  customElements.define(tag, SpuiCarouselNavControl);
}

export function defineCarouselNavButton(): void { defineCarouselNavControl("spui-carousel-nav-button", false); }
export function defineCarouselNavImageButton(): void { defineCarouselNavControl("spui-carousel-nav-image-button", true); }

export function defineCarouselButton(): void {
  if (customElements.get("spui-carousel-button")) return;
  class SpuiCarouselButton extends HTMLElement implements SharePointCarouselButtonElement {
    static observedAttributes = ["nav-type", "disabled", "label"];
    private button?: HTMLButtonElement;
    get navType(): "prev" | "next" { return this.getAttribute("nav-type") === "prev" ? "prev" : "next"; }
    set navType(value: "prev" | "next") { this.setAttribute("nav-type", value); }
    get disabled(): boolean { return this.hasAttribute("disabled"); }
    set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
        style.textContent = `${base}:host{display:inline-flex}button{box-sizing:border-box;min-width:44px;min-height:44px;padding:6px 10px;border:1px solid var(--spui-ui-stroke,#d1d1d1);border-radius:var(--spui-control-radius,6px);background:var(--spui-ui-surface,#fff);color:var(--spui-ui-text,inherit);font:inherit;cursor:pointer}button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}button:disabled{color:var(--spui-ui-muted,#777);opacity:.55;cursor:not-allowed}@media(forced-colors:active){button{border-color:ButtonText}button:focus-visible{outline-color:Highlight}}`;
        this.button = document.createElement("button"); this.button.type = "button"; const icon = document.createElement("slot"); icon.name = "icon"; this.button.append(icon, document.createElement("slot"));
        this.button.addEventListener("click", event => this.dispatchEvent(new CustomEvent("spui-carousel-button-activate", { bubbles: true, composed: true, detail: { navType: this.navType, event } })));
        root.append(style, this.button);
      }
      this.sync();
    }
    attributeChangedCallback(): void { this.sync(); }
    private sync(): void { if (!this.button) return; this.button.disabled = this.disabled; this.button.setAttribute("aria-label", this.getAttribute("label") || this.textContent?.trim() || (this.navType === "prev" ? "Previous slide" : "Next slide")); }
  }
  customElements.define("spui-carousel-button", SpuiCarouselButton);
}

export function defineCarouselAutoplayButton(): void {
  if (customElements.get("spui-carousel-autoplay-button")) return;
  class SpuiCarouselAutoplayButton extends HTMLElement implements SharePointCarouselAutoplayButtonElement {
    static observedAttributes = ["selected", "checked", "default-checked", "controlled", "is-accessible", "appearance", "size", "shape", "disabled", "disabled-focusable", "icon-position", "play-label", "pause-label", "aria-label", "aria-describedby", "title", "tabindex"];
    private button?: HTMLButtonElement;
    get selected(): boolean { return this.hasAttribute("selected"); }
    set selected(value: boolean) { this.toggleAttribute("selected", Boolean(value)); }
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
        style.textContent = `${buttonControlCss}:host{display:inline-block;vertical-align:middle}:host([selected]) button{border-color:var(--spui-toggle-pressed-border,var(--spui-ui-accent,var(--colorBrandBackground,#0078d4)));background:var(--spui-toggle-pressed-background,color-mix(in srgb,var(--spui-ui-accent,var(--colorBrandBackground,#0078d4)) 12%,var(--spui-ui-surface,var(--colorNeutralBackground1,#fff))))}:host([selected]) button:hover:not(:disabled){background:var(--spui-toggle-pressed-hover,color-mix(in srgb,var(--spui-ui-accent,var(--colorBrandBackground,#0078d4)) 18%,var(--spui-ui-surface,var(--colorNeutralBackground1,#fff))))}:host([is-accessible][selected]) button{border-color:var(--spui-ui-accent,var(--colorBrandBackground,#0078d4));background:var(--spui-ui-accent,var(--colorBrandBackground,#0078d4));color:var(--spui-ui-accent-text,#fff)}:host([is-accessible][selected]) button:hover:not(:disabled){background:var(--spui-ui-accent-hover,var(--colorBrandBackgroundHover,#106ebe))}:host([disabled-focusable]) button:disabled{opacity:1}@media(forced-colors:active){:host([selected]) button{outline:1px solid Highlight}}`;
        this.button = document.createElement("button"); this.button.type = "button"; this.button.part.add("control");
        const iconWrap = document.createElement("span"); iconWrap.className = "icon"; iconWrap.hidden = true; iconWrap.setAttribute("aria-hidden", "true");
        const icon = document.createElement("slot"); icon.name = "icon"; icon.addEventListener("slotchange", () => { iconWrap.hidden = !icon.assignedNodes({ flatten: true }).length; }); iconWrap.append(icon);
        const content = document.createElement("span"); content.className = "content"; const label = document.createElement("span"); label.part.add("label"); content.append(label);
        this.button.append(iconWrap, content);
        this.button.addEventListener("click", event => {
          if (this.hasAttribute("disabled")) { event.preventDefault(); event.stopImmediatePropagation(); return; }
          const checked = !this.selected;
          if (!this.hasAttribute("controlled")) this.selected = checked;
          this.dispatchEvent(new CustomEvent("spui-carousel-autoplay-toggle", { bubbles: true, composed: true, detail: { checked, event, type: "click" } }));
        });
        root.append(style, this.button);
      }
      if (!this.selected && !this.hasAttribute("controlled")) this.selected = this.hasAttribute("default-checked") || this.hasAttribute("checked");
      this.sync();
    }
    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (name === "checked" && this.isConnected && !this.hasAttribute("controlled")) this.selected = value !== null;
      if (this.isConnected) this.sync();
    }
    private sync(): void {
      if (!this.button) return;
      const label = this.button.querySelector<HTMLElement>("[part=label]"); if (!label) return;
      const appearance = this.getAttribute("appearance") ?? "secondary";
      this.button.className = appearance === "primary" ? "primary" : appearance === "outline" || appearance === "subtle" || appearance === "transparent" ? appearance : "secondary";
      label.textContent = this.selected ? (this.getAttribute("pause-label") || "Pause") : (this.getAttribute("play-label") || "Play");
      this.button.disabled = this.hasAttribute("disabled") && !this.hasAttribute("disabled-focusable");
      if (this.hasAttribute("disabled-focusable") && this.hasAttribute("disabled")) this.button.setAttribute("aria-disabled", "true"); else this.button.removeAttribute("aria-disabled");
      for (const name of ["aria-label", "aria-describedby", "title"]) { const value = this.getAttribute(name); if (name === "aria-label" && value === null) this.button.setAttribute(name, label.textContent); else if (value === null) this.button.removeAttribute(name); else this.button.setAttribute(name, value); }
      if (this.hasAttribute("tabindex")) this.button.setAttribute("tabindex", this.getAttribute("tabindex")!); else if (!this.hasAttribute("disabled-focusable")) this.button.removeAttribute("tabindex");
      this.button.setAttribute("aria-pressed", String(this.selected));
    }
  }
  customElements.define("spui-carousel-autoplay-button", SpuiCarouselAutoplayButton);
}

export function defineCarouselNavContainer(): void {
  if (customElements.get("spui-carousel-nav-container")) return;
  class SpuiCarouselNavContainer extends HTMLElement {
    static observedAttributes = ["layout"];
    connectedCallback(): void {
      if (this.shadowRoot) { this.sync(); return; }
      const root = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0}.container{display:flex;align-items:center;justify-content:center;gap:var(--spui-carousel-gap,8px);min-width:0}.container[data-layout=inline-wide]{justify-content:space-between}.container[data-layout=overlay],.container[data-layout=overlay-wide]{padding:4px;border-radius:var(--spui-control-radius,8px);background:var(--spui-carousel-control-background,var(--spui-ui-surface,#fff));box-shadow:var(--spui-card-shadow,0 2px 8px #0002)}.container[data-layout=overlay-wide]{justify-content:space-between}.container[data-layout=overlay-expanded]{justify-content:space-between;background:transparent}.middle{display:flex;align-items:center;justify-content:center;gap:var(--spui-carousel-gap,8px);min-width:0}slot[name=nav]{display:contents}`;
      const container = document.createElement("div"); container.className = "container"; container.setAttribute("role", "group");
      const previous = document.createElement("slot"); previous.name = "previous";
      const middle = document.createElement("div"); middle.className = "middle";
      const navigation = document.createElement("slot"); navigation.name = "navigation";
      const autoplay = document.createElement("slot"); autoplay.name = "autoplay";
      middle.append(navigation, autoplay);
      const next = document.createElement("slot"); next.name = "next";
      const rest = document.createElement("slot");
      container.append(previous, middle, next, rest); root.append(style, container); this.sync();
    }
    attributeChangedCallback(): void { this.sync(); }
    private sync(): void { const container = this.shadowRoot?.querySelector<HTMLElement>(".container"); if (container) container.dataset.layout = this.getAttribute("layout") || "inline"; }
  }
  customElements.define("spui-carousel-nav-container", SpuiCarouselNavContainer);
}

export function defineCarouselSlider(): void {
  if (customElements.get("spui-carousel-slider")) return;
  class SpuiCarouselSlider extends HTMLElement implements SharePointCarouselSliderElement {
    static observedAttributes = ["card-focus"];
    get cardFocus(): boolean { return this.hasAttribute("card-focus"); }
    set cardFocus(value: boolean) { this.toggleAttribute("card-focus", Boolean(value)); }
    private focusedIndex = 0;
    private observer?: MutationObserver;
    private readonly originalTabIndex = new WeakMap<HTMLElement, string | null>();
    private keydown = (event: KeyboardEvent): void => {
      if (!this.cardFocus || !(event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End")) return;
      const cards = [...this.querySelectorAll<HTMLElement>("spui-carousel-card")];
      if (!cards.length) return;
      const currentCard = (event.target as HTMLElement).closest("spui-carousel-card");
      const current = cards.indexOf(currentCard as HTMLElement);
      const rtl = getComputedStyle(this).direction === "rtl";
      if (event.key === "Home") this.focusedIndex = 0;
      else if (event.key === "End") this.focusedIndex = cards.length - 1;
      else this.focusedIndex = (Math.max(0, current >= 0 ? current : this.focusedIndex) + (event.key === "ArrowRight" ? (rtl ? -1 : 1) : (rtl ? 1 : -1)) + cards.length) % cards.length;
      event.preventDefault();
      event.stopPropagation();
      this.dispatchEvent(new CustomEvent("spui-carousel-card-focus", { bubbles: true, composed: true, detail: { index: this.focusedIndex, event } }));
      cards.forEach((card, index) => { if (this.cardFocus) card.tabIndex = index === this.focusedIndex ? 0 : -1; });
      cards[this.focusedIndex].focus();
    };
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `${base}:host{box-sizing:border-box;display:flex;flex:0 0 100%;gap:var(--spui-carousel-gap,0px);min-width:0;width:100%;overflow-anchor:none}:host([data-spui-carousel-motion]){display:contents}slot{display:contents}`;
        root.append(style, document.createElement("slot"));
      }
      this.setAttribute("role", this.getAttribute("role") || "group");
      this.addEventListener("keydown", this.keydown);
      this.observer?.disconnect(); this.observer = new MutationObserver(() => this.syncCardFocus());
      this.observer.observe(this, { childList: true, subtree: true }); this.syncCardFocus();
    }
    disconnectedCallback(): void { this.removeEventListener("keydown", this.keydown); this.observer?.disconnect(); this.observer = undefined; this.syncCardFocus(true); }
    attributeChangedCallback(): void { this.toggleAttribute("data-card-focus", this.cardFocus); this.syncCardFocus(); }
    private syncCardFocus(restore = false): void {
      const cards = [...this.querySelectorAll<HTMLElement>("spui-carousel-card")];
      cards.forEach((card, index) => {
        if (restore || !this.cardFocus) {
          if (this.originalTabIndex.has(card)) { const original = this.originalTabIndex.get(card); if (original === null) card.removeAttribute("tabindex"); else card.setAttribute("tabindex", original!); this.originalTabIndex.delete(card); }
          return;
        }
        if (!this.originalTabIndex.has(card)) this.originalTabIndex.set(card, card.getAttribute("tabindex"));
        card.tabIndex = index === this.focusedIndex ? 0 : -1;
      });
    }
  }
  customElements.define("spui-carousel-slider", SpuiCarouselSlider);
}

export function defineCarouselViewport(): void {
  if (customElements.get("spui-carousel-viewport")) return;
  class SpuiCarouselViewport extends HTMLElement {
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `${base}:host{display:contents;max-width:100%;width:auto}slot{display:contents}`;
        root.append(style, document.createElement("slot"));
      }
      this.setAttribute("role", this.getAttribute("role") || "presentation");
      this.draggable = true;
    }
  }
  customElements.define("spui-carousel-viewport", SpuiCarouselViewport);
}

export function defineCarousel(): void {
  if (customElements.get("spui-carousel")) return;
  defineCarouselCard(); defineCarouselNav(); defineCarouselNavButton(); defineCarouselNavImageButton(); defineCarouselButton(); defineCarouselAutoplayButton(); defineCarouselNavContainer(); defineCarouselSlider(); defineCarouselViewport();
  class SpuiCarousel extends HTMLElement {
    static observedAttributes = ["aria-label", "aria-roledescription", "previous-label", "next-label", "slide-label", "slide-group-label", "navigation-label", "play-label", "pause-label", "slide-width", "group-size", "draggable", "whitespace", "align", "appearance", "motion", "motion-duration", "motion-physics-duration", "autoplay", "autoplay-interval", "wrap", "circular", "controlled", "selected-index", "default-selected-index", "active-index", "default-active-index"];
    private viewport!: HTMLDivElement;
    private slideSlot!: HTMLSlotElement;
    private previous!: HTMLButtonElement;
    private next!: HTMLButtonElement;
    private controls!: HTMLDivElement;
    private indicators!: HTMLDivElement;
    private slides: HTMLElement[] = [];
    private current = 0;
    private pageSize = 1;
    private pageGroups: number[][] = [];
    private slidePages: number[] = [];
    private requestedTarget: number | null = null;
    private requestedSource?: CarouselIndexChangeSource;
    private pendingScrollSource?: CarouselIndexChangeSource;
    private interacted = false;
    private raf = 0;
    private scrollEndTimer = 0;
    private events?: AbortController;
    private autoplayTimer = 0;
    private slideAnimationFrame = 0;
    private cancelSlideAnimation?: () => void;
    private autoplayButton!: HTMLButtonElement;
    private liveRegion!: HTMLDivElement;
    private autoplayRunning = false;
    private autoplayExplicitlyStarted = false;
    private lastScrollEvent?: Event;
    private contentObserver?: MutationObserver;
    private resizeObserver?: ResizeObserver;
    announcement?: CarouselAnnouncerFunction;
    private drag?: { pointerId: number; startX: number; startY: number; startScrollLeft: number; moved: boolean };
    private readonly originalSlideState = new WeakMap<HTMLElement, { inert: boolean; ariaHidden: string | null }>();
    private readonly originalSlideLayout = new WeakMap<HTMLElement, { startAttr: string | null; endAttr: string | null; startValue: string; endValue: string }>();
    private readonly originalSlideColumn = new WeakMap<HTMLElement, { value: string; gridArea: string }>();

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.events?.abort(); this.events = new AbortController();
      this.slideSlot.addEventListener("slotchange", this.onSlotChange, { signal: this.events.signal });
      this.contentObserver?.disconnect();
      this.contentObserver = new MutationObserver(this.onSlotChange);
      this.contentObserver.observe(this, { childList: true, subtree: true });
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver?.disconnect();
        this.resizeObserver = new ResizeObserver(() => { if (this.updatePageSize()) this.syncSlides(false); else this.syncWhitespace(); });
        this.resizeObserver.observe(this.viewport);
      }
      this.viewport.addEventListener("scroll", this.onScroll, { passive: true, signal: this.events.signal });
      this.viewport.addEventListener("scrollend", this.onScrollEnd, { signal: this.events.signal });
      this.viewport.addEventListener("keydown", this.onViewportKeyDown, { signal: this.events.signal });
      this.viewport.addEventListener("pointerdown", this.onPointerDown, { signal: this.events.signal });
      this.viewport.addEventListener("pointermove", this.onPointerMove, { signal: this.events.signal });
      this.viewport.addEventListener("pointerup", this.onPointerUp, { signal: this.events.signal });
      this.viewport.addEventListener("pointercancel", this.onPointerUp, { signal: this.events.signal });
      this.indicators.addEventListener("keydown", this.onIndicatorKeyDown, { signal: this.events.signal });
      this.addEventListener("spui-carousel-nav-select", this.onNavSelect, { signal: this.events.signal });
      this.addEventListener("spui-carousel-button-activate", this.onButtonActivate, { signal: this.events.signal });
      this.addEventListener("spui-carousel-autoplay-toggle", this.toggleAutoplay, { signal: this.events.signal });
      this.addEventListener("spui-carousel-card-focus", this.onCardFocus, { signal: this.events.signal });
      this.addEventListener("pointerenter", this.pauseAutoplay, { signal: this.events.signal });
      this.addEventListener("pointerleave", this.resumeAutoplay, { signal: this.events.signal });
      this.addEventListener("focusin", this.pauseForFocus, { signal: this.events.signal });
      this.addEventListener("focusout", this.onFocusOut, { signal: this.events.signal });
      document.addEventListener("visibilitychange", this.onVisibilityChange, { signal: this.events.signal });
      matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", this.onMotionPreference, { signal: this.events.signal });
      this.autoplayButton.addEventListener("click", this.toggleAutoplay, { signal: this.events.signal });
      this.autoplayRunning = this.hasAttribute("autoplay") && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.syncSlideWidth();
      this.syncPresentation();
      this.syncLabels(); this.syncSlides();
      this.scheduleAutoplay();
    }

    disconnectedCallback(): void {
      this.events?.abort(); this.events = undefined;
      this.contentObserver?.disconnect(); this.contentObserver = undefined;
      this.resizeObserver?.disconnect(); this.resizeObserver = undefined;
      this.stopSlideAnimation();
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      clearTimeout(this.scrollEndTimer); this.scrollEndTimer = 0;
      this.requestedTarget = null;
      clearTimeout(this.autoplayTimer); this.autoplayTimer = 0;
      this.slides.forEach(slide => { this.restoreSlideState(slide); this.restoreSlideLayout(slide); });
    }

    attributeChangedCallback(name: string): void {
      if (!this.isConnected || !this.controls) return;
      if ((name === "selected-index" || name === "active-index") && this.hasAttribute("controlled")) this.setIndex(Number(this.getAttribute(name)), false);
      else if ((name === "default-selected-index" || name === "default-active-index") && !this.interacted) this.setIndex(Number(this.getAttribute(name) ?? this.getAttribute("default-selected-index")), false);
      this.syncLabels(); this.syncSlides();
      if (name === "slide-width") this.syncSlideWidth();
      if (name === "motion") { this.stopSlideAnimation(); this.requestedTarget = null; this.requestedSource = undefined; }
      if (["align", "appearance", "motion", "motion-duration"].includes(name)) this.syncPresentation();
      if (name === "autoplay") this.autoplayRunning = this.hasAttribute("autoplay") && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.syncAutoplay();
    }
    get selectedIndex(): number { return this.current; }
    set selectedIndex(value: number) { this.interacted = true; this.setIndex(value, false); }
    get defaultSelectedIndex(): number { return this.current; }
    set defaultSelectedIndex(value: number) { if (!this.interacted) this.setIndex(value, false); }
    get activeIndex(): number { return this.current; }
    set activeIndex(value: number) { this.interacted = true; this.setIndex(value, false); }
    get defaultActiveIndex(): number { return this.current; }
    set defaultActiveIndex(value: number) { if (!this.interacted) this.setIndex(value, false); }
    get circular(): boolean { return this.hasAttribute("circular") || this.hasAttribute("wrap"); }
    set circular(value: boolean) { this.toggleAttribute("circular", Boolean(value)); }
    goTo(index: number): void { this.requestIndex(index); }
    nextSlide(): void { this.requestIndex(this.current + 1); }
    previousSlide(): void { this.requestIndex(this.current - 1); }
    get slideWidth(): string { return this.getAttribute("slide-width") || "100%"; }
    set slideWidth(value: string) { this.setAttribute("slide-width", value); }
    get groupSize(): number | "auto" { const value = this.getAttribute("group-size") || "auto"; return value === "auto" ? value : Math.max(1, Math.floor(Number(value) || 1)); }
    set groupSize(value: number | "auto") { this.setAttribute("group-size", String(value)); }
    get draggable(): boolean { return this.hasAttribute("draggable"); }
    set draggable(value: boolean) { this.toggleAttribute("draggable", Boolean(value)); }
    get whitespace(): boolean { return this.hasAttribute("whitespace"); }
    set whitespace(value: boolean) { this.toggleAttribute("whitespace", Boolean(value)); }
    get align(): CarouselAlign { return this.getAttribute("align") === "start" || this.getAttribute("align") === "end" ? this.getAttribute("align") as CarouselAlign : "center"; }
    set align(value: CarouselAlign) { this.setAttribute("align", value); }
    get appearance(): CarouselAppearance { return this.getAttribute("appearance") === "elevated" ? "elevated" : "flat"; }
    set appearance(value: CarouselAppearance) { this.setAttribute("appearance", value); }
    get motion(): CarouselMotion {
      if (this.getAttribute("motion") === "fade") return "fade";
      return this.hasAttribute("motion-physics-duration") ? { kind: "slide", duration: this.slideMotionDuration } : "slide";
    }
    set motion(value: CarouselMotion) {
      if (typeof value === "string") { this.setAttribute("motion", value); this.removeAttribute("motion-physics-duration"); }
      else { this.setAttribute("motion", value.kind); if (value.duration === undefined) this.removeAttribute("motion-physics-duration"); else this.setAttribute("motion-physics-duration", String(value.duration)); }
    }
    get motionDuration(): number { const raw = this.getAttribute("motion-duration"); const value = raw === null ? 240 : Number(raw); return Number.isFinite(value) ? Math.max(0, Math.min(2000, value)) : 240; }
    set motionDuration(value: number) { this.setAttribute("motion-duration", String(value)); }
    get slideMotionDuration(): number { const raw = this.getAttribute("motion-physics-duration"); const value = raw === null ? 25 : Number(raw); return Number.isFinite(value) ? Math.max(0, value) : 25; }
    set slideMotionDuration(value: number) { this.setAttribute("motion-physics-duration", String(value)); }

    private syncSlideWidth(): void {
      const value = this.getAttribute("slide-width")?.trim() || "100%";
      this.style.setProperty("--spui-carousel-slide-size", CSS.supports("flex-basis", value) ? value : "100%");
    }
    private updatePageSize(): boolean {
      const previousGroups = this.pageGroups;
      const activeSlide = previousGroups[this.current]?.[0] ?? 0;
      const raw = this.getAttribute("group-size") || "auto";
      const groups: number[][] = [];
      if (raw !== "auto") {
        const requested = Number(raw);
        const size = Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;
        for (let index = 0; index < this.slides.length; index += size) groups.push(Array.from({ length: Math.min(size, this.slides.length - index) }, (_, offset) => index + offset));
      } else if (this.viewport && this.slides.length) {
        const available = this.viewport.clientWidth;
        const gap = Number.parseFloat(getComputedStyle(this.viewport).columnGap) || 0;
        if (available > 0) {
          let group: number[] = [];
          let used = 0;
          this.slides.forEach((slide, index) => {
            const measured = slide.getBoundingClientRect().width;
            const width = measured > 0 ? measured : available;
            const nextUsed = used + (group.length ? gap : 0) + width;
            if (group.length && nextUsed > available + 0.5) {
              groups.push(group);
              group = [];
              used = 0;
            }
            used += (group.length ? gap : 0) + width;
            group.push(index);
          });
          if (group.length) groups.push(group);
        } else {
          for (let index = 0; index < this.slides.length; index++) groups.push([index]);
        }
      } else {
        for (let index = 0; index < this.slides.length; index++) groups.push([index]);
      }
      const changed = groups.length !== previousGroups.length || groups.some((group, page) => group.length !== previousGroups[page]?.length || group.some((index, offset) => index !== previousGroups[page]?.[offset]));
      if (changed) {
        this.requestedTarget = null;
        this.requestedSource = undefined;
        this.pendingScrollSource = undefined;
        this.stopSlideAnimation();
      }
      this.pageGroups = groups;
      this.slidePages = Array(this.slides.length).fill(0);
      groups.forEach((group, page) => group.forEach(index => { this.slidePages[index] = page; }));
      this.pageSize = groups.reduce((largest, group) => Math.max(largest, group.length), 1);
      this.current = Math.min(this.slidePages[activeSlide] ?? 0, Math.max(0, this.pageCount - 1));
      this.style.setProperty("--spui-carousel-page-size", String(this.pageSize));
      return changed;
    }
    private get pageCount(): number { return this.pageGroups.length; }
    private pageForSlide(index: number): number { return this.slidePages[index] ?? 0; }
    private firstSlideForPage(page: number): HTMLElement | undefined { return this.slides[this.pageGroups[page]?.[0] ?? 0]; }
    private columnForSlide(index: number): number { return (this.pageGroups[this.pageForSlide(index)]?.indexOf(index) ?? 0) + 1; }
    private syncPresentation(): void {
      this.style.setProperty("--spui-carousel-align", this.align);
      this.style.setProperty("--spui-carousel-motion-duration", `${this.motionDuration}ms`);
      this.querySelectorAll<HTMLElement>("spui-carousel-slider, spui-carousel-viewport").forEach(wrapper => wrapper.toggleAttribute("data-spui-carousel-motion", this.motion === "fade"));
      this.syncWhitespace();
      this.slides.forEach((slide, index) => this.applySlideState(slide, this.pageForSlide(index) === this.current, index));
    }
    private syncWhitespace(): void {
      const viewportWidth = this.viewport?.clientWidth || 0;
      this.slides.forEach((slide, index) => {
        const first = index === 0, last = index === this.slides.length - 1;
        if (!this.whitespace || (!first && !last)) { this.restoreSlideLayout(slide); return; }
        if (!this.originalSlideLayout.has(slide)) this.originalSlideLayout.set(slide, { startAttr: slide.getAttribute("data-spui-carousel-space-start"), endAttr: slide.getAttribute("data-spui-carousel-space-end"), startValue: slide.style.getPropertyValue("--spui-carousel-auto-space-start"), endValue: slide.style.getPropertyValue("--spui-carousel-auto-space-end") });
        const remaining = Math.max(0, viewportWidth - slide.getBoundingClientRect().width);
        const start = first && (this.align === "center" || this.align === "end") ? (this.align === "center" ? remaining / 2 : remaining) : 0;
        const end = last && (this.align === "center" || this.align === "start") ? (this.align === "center" ? remaining / 2 : remaining) : 0;
        slide.toggleAttribute("data-spui-carousel-space-start", start > 0);
        slide.toggleAttribute("data-spui-carousel-space-end", end > 0);
        if (start > 0) slide.style.setProperty("--spui-carousel-auto-space-start", `${start}px`); else slide.style.removeProperty("--spui-carousel-auto-space-start");
        if (end > 0) slide.style.setProperty("--spui-carousel-auto-space-end", `${end}px`); else slide.style.removeProperty("--spui-carousel-auto-space-end");
      });
    }
    private restoreSlideLayout(slide: HTMLElement): void {
      const original = this.originalSlideLayout.get(slide);
      if (!original) return;
      if (original.startAttr === null) slide.removeAttribute("data-spui-carousel-space-start"); else slide.setAttribute("data-spui-carousel-space-start", original.startAttr);
      if (original.endAttr === null) slide.removeAttribute("data-spui-carousel-space-end"); else slide.setAttribute("data-spui-carousel-space-end", original.endAttr);
      if (original.startValue) slide.style.setProperty("--spui-carousel-auto-space-start", original.startValue); else slide.style.removeProperty("--spui-carousel-auto-space-start");
      if (original.endValue) slide.style.setProperty("--spui-carousel-auto-space-end", original.endValue); else slide.style.removeProperty("--spui-carousel-auto-space-end");
      this.originalSlideLayout.delete(slide);
    }
    private applySlideState(slide: HTMLElement, active: boolean, index: number): void {
      if (!this.originalSlideState.has(slide)) this.originalSlideState.set(slide, { inert: slide.inert, ariaHidden: slide.getAttribute("aria-hidden") });
      const original = this.originalSlideState.get(slide)!;
      slide.toggleAttribute("data-spui-carousel-motion", this.motion === "fade");
      if (this.motion !== "fade") { this.restoreSlideState(slide); return; }
      if (!this.originalSlideColumn.has(slide)) this.originalSlideColumn.set(slide, { value: slide.style.getPropertyValue("--spui-carousel-slide-column"), gridArea: slide.style.gridArea });
      slide.style.setProperty("--spui-carousel-slide-column", String(this.columnForSlide(index)));
      slide.style.gridArea = "1 / var(--spui-carousel-slide-column) / 2 / span 1";
      slide.toggleAttribute("data-spui-carousel-active", active);
      if (!active && (slide.contains(document.activeElement) || slide.shadowRoot?.activeElement)) this.viewport?.focus({ preventScroll: true });
      slide.inert = original.inert || !active;
      if (active && original.ariaHidden === null) slide.removeAttribute("aria-hidden");
      else slide.setAttribute("aria-hidden", active ? original.ariaHidden! : "true");
    }
    private restoreSlideState(slide: HTMLElement): void {
      const original = this.originalSlideState.get(slide);
      if (!original) return;
      slide.removeAttribute("data-spui-carousel-active"); slide.removeAttribute("data-spui-carousel-motion"); slide.inert = original.inert;
      const originalColumn = this.originalSlideColumn.get(slide);
      if (originalColumn !== undefined) {
        if (originalColumn.value) slide.style.setProperty("--spui-carousel-slide-column", originalColumn.value); else slide.style.removeProperty("--spui-carousel-slide-column");
        slide.style.gridArea = originalColumn.gridArea;
        this.originalSlideColumn.delete(slide);
      }
      if (original.ariaHidden === null) slide.removeAttribute("aria-hidden"); else slide.setAttribute("aria-hidden", original.ariaHidden);
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{position:relative;display:block;min-width:0}:host([appearance=elevated]){box-sizing:border-box;padding:var(--spui-carousel-padding,12px);border:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));border-radius:var(--spui-card-radius,var(--spui-control-radius,8px));background:var(--spui-ui-surface,var(--spui-base-surface,#fff));color:var(--spui-ui-text,inherit);box-shadow:var(--spui-card-shadow,0 2px 8px #0002)}:host([data-empty=true]){display:none}::slotted(spui-carousel-nav-container[layout=overlay]),::slotted(spui-carousel-nav-container[layout=overlay-wide]){position:absolute;z-index:2;inset-inline:12px;inset-block-end:12px}::slotted(spui-carousel-nav-container[layout=overlay-expanded]){position:absolute;z-index:2;inset-inline:12px;inset-block-start:50%;transform:translateY(-50%)}::slotted(spui-carousel-slider){flex:0 0 100%;width:100%}:host([data-dragging]) .viewport{cursor:grabbing;user-select:none;scroll-snap-type:none}:host([data-dragging]) ::slotted(*){pointer-events:none}.viewport{display:flex;gap:var(--spui-carousel-gap,0px);min-width:0;overflow-x:auto;overflow-y:hidden;overscroll-behavior-inline:contain;scroll-snap-type:x mandatory;scrollbar-width:thin;scrollbar-color:var(--spui-carousel-scrollbar,var(--spui-ui-stroke,#c8c8c8)) transparent;scroll-behavior:smooth}:host([motion=fade]) .viewport{display:grid;overflow:hidden;scroll-snap-type:none}:host([motion=fade]) .viewport slot{display:contents}.viewport:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}::slotted(*){box-sizing:border-box;flex:0 0 var(--spui-carousel-slide-width,var(--spui-carousel-slide-size,100%));min-width:0;scroll-snap-align:var(--spui-carousel-align,start);scroll-snap-stop:always}::slotted(spui-carousel-card[auto-size]){flex-basis:auto}::slotted([data-spui-carousel-space-start]){margin-inline-start:var(--spui-carousel-auto-space-start,0px)}::slotted([data-spui-carousel-space-end]){margin-inline-end:var(--spui-carousel-auto-space-end,0px)}:host([motion=fade]) ::slotted(*){grid-area:1/1;width:100%;flex:none;opacity:0;visibility:hidden;pointer-events:none;transition:opacity var(--spui-carousel-motion-duration,240ms) var(--spui-motion-easing-standard,ease),visibility 0s linear var(--spui-carousel-motion-duration,240ms)}:host([motion=fade]) ::slotted([data-spui-carousel-active]){opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}.controls{display:flex;align-items:center;justify-content:center;gap:4px;min-height:48px;margin-block-start:4px}.controls[hidden]{display:none}.arrow,.indicator,.autoplay{box-sizing:border-box;display:grid;place-items:center;flex:none;min-width:44px;min-height:44px;padding:0 10px;border:1px solid var(--spui-carousel-control-border,var(--spui-ui-stroke,#d1d1d1));border-radius:var(--spui-control-radius,6px);background:var(--spui-carousel-control-background,var(--spui-ui-surface,#fff));color:var(--spui-carousel-control-foreground,var(--spui-ui-text,inherit));font:inherit;cursor:pointer}.arrow:hover:not(:disabled),.indicator:hover,.autoplay:hover{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.arrow:focus-visible,.indicator:focus-visible,.autoplay:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}.arrow:disabled{color:var(--spui-ui-muted,#777);opacity:.55;cursor:not-allowed}.arrow svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.indicators{display:flex;align-items:center;justify-content:center;gap:2px}.indicator{position:relative;border:0;background:transparent}.indicator:before{width:22px;height:8px;border-radius:999px;background:var(--spui-carousel-indicator,var(--spui-ui-stroke,#a0a0a0));content:"";transform:scaleX(.36);transition:transform var(--spui-motion-duration-normal,150ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1)),background-color var(--spui-motion-duration-normal,150ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}.indicator[aria-current=step]:before{transform:scaleX(1);background:var(--spui-ui-accent,#0078d4)}@media(prefers-reduced-motion:reduce){.viewport{scroll-behavior:auto}.indicator:before{transition:none}:host([motion=fade]) ::slotted(*){transition:none}}@media(forced-colors:active){:host([appearance=elevated]){border-color:CanvasText;background:Canvas;color:CanvasText;box-shadow:none}.viewport:focus-visible,.arrow:focus-visible,.indicator:focus-visible,.autoplay:focus-visible{outline-color:Highlight}.arrow,.autoplay{border-color:ButtonText}.indicator:before{background:ButtonText}.indicator[aria-current=step]:before{background:Highlight}}:host(:dir(rtl)) .arrow.previous svg,:host(:dir(rtl)) .arrow.next svg{transform:rotate(180deg)}`;
      style.textContent += ":host([motion=fade]) .viewport{grid-template-columns:repeat(var(--spui-carousel-page-size,1),minmax(0,1fr));grid-template-rows:minmax(0,1fr)}";
      this.viewport = document.createElement("div"); this.viewport.className = "viewport"; this.viewport.setAttribute("role", "group"); this.viewport.setAttribute("tabindex", "0"); this.viewport.setAttribute("aria-label", "Carousel slides"); this.viewport.id = `spui-carousel-${++carouselId}`;
      this.slideSlot = document.createElement("slot"); this.viewport.append(this.slideSlot);
      this.controls = document.createElement("div"); this.controls.className = "controls"; this.controls.part.add("controls");
      this.previous = this.createArrow("previous", "M14 5 7 12l7 7");
      this.indicators = document.createElement("div"); this.indicators.className = "indicators"; this.indicators.setAttribute("role", "group"); this.indicators.setAttribute("aria-label", "Slide navigation");
      this.next = this.createArrow("next", "m10 5 7 7-7 7");
      this.autoplayButton = document.createElement("button"); this.autoplayButton.type = "button"; this.autoplayButton.className = "autoplay"; this.autoplayButton.part.add("autoplay");
      const navigation = document.createElement("slot"); navigation.name = "navigation"; navigation.part.add("navigation");
      this.controls.append(this.previous, this.indicators, this.next, this.autoplayButton, navigation);
      this.liveRegion = document.createElement("div"); this.liveRegion.className = "announcement"; this.liveRegion.setAttribute("aria-live", "polite"); this.liveRegion.setAttribute("aria-atomic", "true");
      const visuallyHidden = document.createElement("style"); visuallyHidden.textContent = ".announcement{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}";
      shadow.append(style, this.viewport, this.controls, visuallyHidden, this.liveRegion);
    }

    private createArrow(name: "previous" | "next", path: string): HTMLButtonElement {
      const button = document.createElement("button"); button.type = "button"; button.className = `arrow ${name}`; button.part.add(`button-${name}`); button.setAttribute("aria-controls", this.viewport.id);
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true");
      const line = document.createElementNS("http://www.w3.org/2000/svg", "path"); line.setAttribute("d", path); svg.append(line); button.append(svg);
      button.addEventListener("click", event => this.requestIndex(this.current + (name === "next" ? 1 : -1), { event, type: "click" }));
      return button;
    }

    private syncLabels(): void {
      this.setAttribute("role", this.getAttribute("role") || "region");
      if (!this.getAttribute("aria-roledescription")) this.setAttribute("aria-roledescription", "carousel");
      if (!this.getAttribute("aria-label")) this.setAttribute("aria-label", "Carousel");
      this.previous?.setAttribute("aria-label", this.getAttribute("previous-label") || "Previous slide");
      this.next?.setAttribute("aria-label", this.getAttribute("next-label") || "Next slide");
      this.viewport?.setAttribute("aria-label", this.getAttribute("slide-group-label") || "Carousel slides");
      this.indicators?.setAttribute("aria-label", this.getAttribute("navigation-label") || "Slide navigation");
      this.syncAutoplay();
    }

    private syncAutoplay(): void {
      if (!this.autoplayButton) return;
      this.autoplayButton.hidden = this.pageCount < 2;
      this.autoplayButton.textContent = this.autoplayRunning ? (this.getAttribute("pause-label") || "Pause") : (this.getAttribute("play-label") || "Play");
      this.autoplayButton.setAttribute("aria-label", this.autoplayButton.textContent);
      this.autoplayButton.setAttribute("aria-pressed", String(this.autoplayRunning));
      this.querySelectorAll<HTMLElement>("spui-carousel-autoplay-button").forEach(button => button.toggleAttribute("selected", this.autoplayRunning));
      this.scheduleAutoplay();
    }
    private scheduleAutoplay(): void {
      clearTimeout(this.autoplayTimer); this.autoplayTimer = 0;
      if (!this.isConnected || !this.autoplayRunning || this.pageCount < 2 || ((this.matches(":hover") || this.contains(document.activeElement)) && !this.autoplayExplicitlyStarted) || document.hidden) return;
      const interval = Number(this.getAttribute("autoplay-interval") || 4000);
      this.autoplayTimer = window.setTimeout(() => { this.requestIndex((this.current + 1) % this.pageCount, { event: new Event("autoplay"), type: "autoplay" }); this.scheduleAutoplay(); }, Number.isFinite(interval) ? Math.max(1000, interval) : 4000);
    }
    private pauseAutoplay = (): void => { clearTimeout(this.autoplayTimer); this.autoplayTimer = 0; };
    private pauseForFocus = (): void => { this.autoplayExplicitlyStarted = false; this.pauseAutoplay(); };
    private resumeAutoplay = (): void => this.scheduleAutoplay();
    private onFocusOut = (event: FocusEvent): void => { if (!this.contains(event.relatedTarget as Node | null)) this.scheduleAutoplay(); };
    private onVisibilityChange = (): void => this.scheduleAutoplay();
    private onMotionPreference = (event: MediaQueryListEvent): void => { if (event.matches) { this.autoplayRunning = false; this.autoplayExplicitlyStarted = false; this.syncAutoplay(); } };
    private toggleAutoplay = (): void => { this.autoplayRunning = !this.autoplayRunning; this.autoplayExplicitlyStarted = this.autoplayRunning; this.syncAutoplay(); };

    private syncSlides(recalculateGroups = true): void {
      if (!this.slideSlot) return;
      const collectSlides = (element: HTMLElement): HTMLElement[] => {
        if (element.localName === "spui-carousel-slider" || element.localName === "spui-carousel-viewport") return [...element.children].filter((child): child is HTMLElement => child instanceof HTMLElement).flatMap(collectSlides);
        return [element];
      };
      const nextSlides = this.slideSlot.assignedElements({ flatten: true }).filter((element): element is HTMLElement => element instanceof HTMLElement).flatMap(collectSlides);
      this.slides.filter(slide => !nextSlides.includes(slide)).forEach(slide => { this.resizeObserver?.unobserve(slide); this.restoreSlideState(slide); this.restoreSlideLayout(slide); });
      this.slides = nextSlides;
      if (recalculateGroups) this.updatePageSize();
      this.slides.forEach(slide => this.resizeObserver?.observe(slide));
      this.syncWhitespace();
      this.slides.forEach((slide, index) => {
        slide.setAttribute("role", slide.getAttribute("role") || "group");
        slide.setAttribute("aria-roledescription", slide.getAttribute("aria-roledescription") || "slide");
        if (!slide.hasAttribute("aria-label")) { slide.dataset.spuiCarouselGeneratedLabel = ""; slide.setAttribute("aria-label", this.formatSlideLabel(index)); }
        else if (slide.dataset.spuiCarouselGeneratedLabel !== undefined) delete slide.dataset.spuiCarouselGeneratedLabel;
      });
      this.setAttribute("data-empty", String(this.slides.length === 0));
      this.indicators.replaceChildren(...Array.from({ length: this.pageCount }, (_, index) => {
        const button = document.createElement("button"); button.type = "button"; button.className = "indicator"; button.setAttribute("aria-label", this.formatPageLabel(index));
        button.addEventListener("click", event => this.requestIndex(index, { event, type: "click" }));
        return button;
      }));
      this.current = Math.min(Math.max(this.current, 0), Math.max(0, this.pageCount - 1));
      if (!this.interacted && this.pageCount && this.current === 0 && this.hasAttribute("default-selected-index")) this.current = Math.min(Math.max(Number(this.getAttribute("default-selected-index")) || 0, 0), this.pageCount - 1);
      this.syncState();
      this.syncAutoplay();
      if (this.slides[this.current] && this.motion !== "fade") this.scrollToIndex(this.current, "instant");
    }

    private formatSlideLabel(index: number): string {
      return (this.getAttribute("slide-label") || "Slide {index} of {count}").replaceAll("{index}", String(index + 1)).replaceAll("{count}", String(this.slides.length || this.slideSlot?.assignedElements({ flatten: true }).length || 0));
    }
    private formatPageLabel(index: number): string {
      return (this.getAttribute("slide-label") || "Slide {index} of {count}").replaceAll("{index}", String(index + 1)).replaceAll("{count}", String(this.pageCount));
    }

    private requestIndex(index: number, source?: CarouselIndexChangeSource): void {
      if (!this.pageCount) return;
      const changeSource = source ?? { event: new Event("programmatic"), type: "programmatic" as const };
      let next = index;
      if (this.circular) next = (next + this.pageCount) % this.pageCount;
      else next = Math.min(Math.max(next, 0), this.pageCount - 1);
      if (next === this.current && !this.circular) return;
      if (!this.hasAttribute("controlled")) { this.interacted = true; this.setIndex(next, true, changeSource); }
      else this.dispatch(next, changeSource);
    }

    private setIndex(index: number, emit: boolean, source?: CarouselIndexChangeSource): void {
      const next = Math.min(Math.max(Number.isFinite(index) ? Math.trunc(index) : 0, 0), Math.max(0, this.pageCount - 1));
      const changed = next !== this.current;
      this.current = next; this.syncState();
      if (changed && this.motion !== "fade") { this.requestedTarget = next; this.requestedSource = source; this.scrollToIndex(next, "smooth"); }
      else if (this.motion === "fade") { this.requestedTarget = null; this.requestedSource = undefined; }
      if (changed && emit) this.dispatch(next, source);
    }

    private dispatch(index: number, source?: CarouselIndexChangeSource): void {
      const groups = this.pageGroups.map(group => [...group]);
      this.liveRegion.textContent = this.announcement?.(index, this.pageCount, groups) || this.formatPageLabel(index);
      const changeSource = source ?? { event: new Event("programmatic"), type: "programmatic" as const };
      this.dispatchEvent(new CustomEvent("spui-carousel-change", { bubbles: true, composed: true, detail: { value: index, index, type: "select", event: changeSource.event, eventType: changeSource.type } }));
    }

    private scrollToIndex(index: number, behavior: ScrollBehavior): void {
      const slide = this.firstSlideForPage(index);
      if (!slide) return;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (behavior === "smooth" && !reduced && this.motion !== "fade" && this.slideMotionDuration > 0) {
        this.animateSlideScroll(slide, this.slideMotionDuration);
        return;
      }
      this.stopSlideAnimation();
      slide.scrollIntoView({ behavior: "instant", block: "nearest", inline: this.align });
    }

    private stopSlideAnimation(): void {
      this.cancelSlideAnimation?.();
      this.cancelSlideAnimation = undefined;
      this.slideAnimationFrame = 0;
      clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = 0;
    }

    private animateSlideScroll(slide: HTMLElement, duration: number): void {
      this.stopSlideAnimation();
      const viewport = this.viewport;
      const originalSnap = viewport.style.scrollSnapType;
      const originalBehavior = viewport.style.scrollBehavior;
      const start = viewport.scrollLeft;
      viewport.style.scrollSnapType = "none";
      viewport.style.scrollBehavior = "auto";
      slide.scrollIntoView({ behavior: "instant", block: "nearest", inline: this.align });
      const target = viewport.scrollLeft;
      viewport.scrollLeft = start;
      let location = start;
      let velocity = 0;
      let active = true;
      const restore = (): void => { viewport.style.scrollSnapType = originalSnap; viewport.style.scrollBehavior = originalBehavior; };
      const cancel = (): void => {
        if (!active) return;
        active = false;
        if (this.slideAnimationFrame) cancelAnimationFrame(this.slideAnimationFrame);
        restore();
      };
      const finish = (): void => {
        if (!active) return;
        active = false;
        viewport.scrollLeft = target;
        restore();
        this.cancelSlideAnimation = undefined;
        this.slideAnimationFrame = 0;
        if (this.requestedTarget !== null) this.onScrollEnd(this.lastScrollEvent);
      };
      this.cancelSlideAnimation = cancel;
      const friction = 0.68;
      const tick = (): void => {
        if (!active) return;
        const displacement = target - location;
        velocity = (velocity + displacement / duration) * friction;
        location += velocity;
        viewport.scrollLeft = location;
        if (Math.abs(target - location) < 0.4 && Math.abs(velocity) < 0.4) finish();
        else this.slideAnimationFrame = requestAnimationFrame(tick);
      };
      if (Math.abs(target - start) < 0.4) finish();
      else this.slideAnimationFrame = requestAnimationFrame(tick);
    }

    private syncState(): void {
      const count = this.pageCount;
      this.controls.hidden = count < 2;
      this.previous.disabled = !this.circular && this.current <= 0;
      this.next.disabled = !this.circular && this.current >= count - 1;
      this.indicators.querySelectorAll<HTMLButtonElement>(".indicator").forEach((button, index) => {
        if (index === this.current) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
        button.tabIndex = index === this.current ? 0 : -1;
      });
      this.slides.forEach((slide, index) => { if (slide.dataset.spuiCarouselGeneratedLabel !== undefined) slide.setAttribute("aria-label", this.formatPageLabel(this.pageForSlide(index))); });
      this.slides.forEach((slide, index) => this.applySlideState(slide, this.pageForSlide(index) === this.current, index));
      this.querySelectorAll<HTMLElement>("spui-carousel-nav-button,spui-carousel-nav-image-button").forEach(button => {
        const buttonIndex = Number(button.getAttribute("index"));
        button.toggleAttribute("selected", buttonIndex === this.current);
        button.toggleAttribute("disabled", buttonIndex >= count);
      });
      this.querySelectorAll<SharePointCarouselButtonElement>("spui-carousel-button").forEach(button => button.disabled = !this.circular && (button.navType === "prev" ? this.current <= 0 : this.current >= count - 1));
      this.dataset.selectedIndex = String(this.current);
      this.syncAutoplay();
    }

    private onSlotChange = (): void => this.syncSlides();
    private onNavSelect = (event: Event): void => { const detail = (event as CustomEvent<{ index: number; event?: MouseEvent }>).detail; this.requestIndex(Number(detail?.index), { event: detail?.event ?? new MouseEvent("click"), type: "click" }); };
    private onCardFocus = (event: Event): void => { const detail = (event as CustomEvent<{ index: number; event?: KeyboardEvent }>).detail; this.requestIndex(this.pageForSlide(Number(detail?.index)), { event: detail?.event ?? new KeyboardEvent("keydown"), type: "keydown" }); };
    private onButtonActivate = (event: Event): void => { const detail = (event as CustomEvent<{ navType: "prev" | "next"; event?: MouseEvent }>).detail; this.requestIndex(this.current + (detail?.navType === "prev" ? -1 : 1), { event: detail?.event ?? new MouseEvent("click"), type: "click" }); };

    private onScroll = (event: Event): void => {
      this.lastScrollEvent = event;
      if (this.motion === "fade") return;
      if (this.drag?.moved) return;
      if (this.requestedTarget !== null) {
        clearTimeout(this.scrollEndTimer);
        this.scrollEndTimer = window.setTimeout(() => this.onScrollEnd(event), 150);
        return;
      }
      if (this.raf) return;
      this.raf = requestAnimationFrame(() => {
        this.raf = 0;
        if (this.requestedTarget !== null) return;
        const nearest = this.nearestSlideIndex();
        if (nearest !== this.current) {
          const source = this.pendingScrollSource ?? { event, type: "scroll" as const };
          this.pendingScrollSource = undefined;
          this.current = nearest; this.syncState(); this.dispatch(nearest, source);
        }
      });
    };

    private onPointerDown = (event: PointerEvent): void => {
      if (!this.draggable || event.pointerType !== "mouse" || event.button !== 0 || (event.target instanceof HTMLElement && event.target.closest("button,a,input,textarea,select,[contenteditable=true]"))) return;
      if (this.cancelSlideAnimation) { this.stopSlideAnimation(); this.requestedTarget = null; this.requestedSource = undefined; }
      this.drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startScrollLeft: this.viewport.scrollLeft, moved: false };
      this.viewport.setPointerCapture(event.pointerId);
    };
    private onPointerMove = (event: PointerEvent): void => {
      const drag = this.drag;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
      if (!drag.moved && Math.abs(dx) < 5) return;
      if (Math.abs(dy) > Math.abs(dx)) return;
      drag.moved = true;
      this.setAttribute("data-dragging", "");
      this.viewport.scrollLeft = drag.startScrollLeft - (getComputedStyle(this).direction === "rtl" ? -dx : dx);
      event.preventDefault();
    };
    private onPointerUp = (event: PointerEvent): void => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;
      if (this.viewport.hasPointerCapture(event.pointerId)) this.viewport.releasePointerCapture(event.pointerId);
      const moved = this.drag.moved;
      this.drag = undefined;
      this.removeAttribute("data-dragging");
      if (moved && this.motion !== "fade") {
        const next = this.nearestSlideIndex();
        const source: CarouselIndexChangeSource = { event, type: "drag" };
        if (next === this.current) this.pendingScrollSource = source;
        this.requestIndex(next, source);
      }
    };

    private nearestSlideIndex(): number {
      const viewportBox = this.viewport.getBoundingClientRect();
      const rtl = getComputedStyle(this.viewport).direction === "rtl";
      const target = this.align === "center" ? viewportBox.left + viewportBox.width / 2 : this.align === "start" ? (rtl ? viewportBox.right : viewportBox.left) : (rtl ? viewportBox.left : viewportBox.right);
      const nearest = this.slides.reduce((best, slide, index) => {
        const rect = slide.getBoundingClientRect();
        const point = this.align === "center" ? rect.left + rect.width / 2 : this.align === "start" ? (rtl ? rect.right : rect.left) : (rtl ? rect.left : rect.right);
        const distance = Math.abs(point - target);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
      return this.pageForSlide(nearest);
    }

    private onScrollEnd = (event?: Event): void => {
      // The native scrollend event may belong to an interrupted smooth scroll.
      // The attraction animation commits its own target from finish().
      if (this.cancelSlideAnimation) return;
      if (this.motion === "fade") { this.requestedTarget = null; this.requestedSource = undefined; clearTimeout(this.scrollEndTimer); this.scrollEndTimer = 0; return; }
      if (this.requestedTarget === null) { this.pendingScrollSource = undefined; return; }
      clearTimeout(this.scrollEndTimer); this.scrollEndTimer = 0;
      const target = this.requestedTarget;
      this.requestedTarget = null;
      const nearest = target ?? this.nearestSlideIndex();
      const source = this.requestedSource ?? { event: event ?? this.lastScrollEvent ?? new Event("scroll"), type: "scroll" as const };
      this.requestedSource = undefined;
      if (nearest !== this.current) { this.current = nearest; this.syncState(); this.dispatch(nearest, source); }
    };

    private onViewportKeyDown = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLElement && event.target.closest("input,textarea,select,button,a,[contenteditable=true],[role=slider],[role=textbox]")) return;
      const rtl = getComputedStyle(this).direction === "rtl";
      const previous = rtl ? "ArrowRight" : "ArrowLeft";
      const next = rtl ? "ArrowLeft" : "ArrowRight";
      if (event.key !== previous && event.key !== next) return;
      event.preventDefault(); this.requestIndex(this.current + (event.key === next ? 1 : -1), { event, type: "keydown" });
    };

    private onIndicatorKeyDown = (event: KeyboardEvent): void => {
      const rtl = getComputedStyle(this).direction === "rtl";
      const previous = rtl ? "ArrowRight" : "ArrowLeft";
      const next = rtl ? "ArrowLeft" : "ArrowRight";
      const index = event.key === "Home" ? 0 : event.key === "End" ? this.pageCount - 1 : event.key === previous ? this.current - 1 : event.key === next ? this.current + 1 : -1;
      if (index < 0) return;
      event.preventDefault(); this.requestIndex(index, { event, type: "keydown" });
      this.indicators.querySelectorAll<HTMLButtonElement>(".indicator")[this.current]?.focus();
    };
  }
  customElements.define("spui-carousel", SpuiCarousel);
}
