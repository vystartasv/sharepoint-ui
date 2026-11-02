import { base } from "./shared.js";

export type ToastIntent = "info" | "success" | "warning" | "error";
export type ToastPoliteness = "polite" | "assertive";
export type ToastAppearance = "brand" | "inverted";
export type ToastContent = string | Node;
export type ToastOptions = {
  id?: string;
  /** Lower values are promoted first when a limited Toaster has room. Equal priorities keep dispatch order. */
  priority?: number;
  title?: ToastContent;
  body?: ToastContent;
  actionLabel?: string;
  onAction?: (id: string) => void;
  intent?: ToastIntent;
  appearance?: ToastAppearance;
  politeness?: ToastPoliteness;
  /** Milliseconds before automatic dismissal. Use 0 or -1 to keep the toast until dismissed. */
  timeout?: number;
  dismissLabel?: string;
  pauseOnHover?: boolean;
  pauseOnWindowBlur?: boolean;
};

function toastIntentIcon(document: Document, intent: ToastIntent): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 20 20"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  const paths: Record<ToastIntent, string> = {
    info: "M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM9 8h2v6H9zm0-3h2v2H9z",
    success: "M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm-1 12.2-3.2-3.2 1.4-1.4L9 10.9l4.8-4.8 1.4 1.4Z",
    warning: "M10 1.5 19 18H1L10 1.5Zm-1 6v5h2v-5zm0 7v2h2v-2z",
    error: "M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm3.5 11.6-1.4 1.4L10 11.4l-2.1 2.1-1.4-1.4L8.6 10 6.5 7.9l1.4-1.4L10 8.6l2.1-2.1 1.4 1.4L11.4 10z",
  };
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", paths[intent]); svg.append(path); return svg;
}

function defineToastSimplePart(tag: string, markup: string, css: string): void {
  if (customElements.get(tag)) return;
  class SpuiToastPart extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const root = document.createElement("div"); root.part.add("root"); root.innerHTML = markup;
      const style = document.createElement("style"); style.textContent = `${base}:host{display:block;min-width:0;color:inherit;font:inherit}${css}`;
      shadow.append(style, root);
    }
  }
  customElements.define(tag, SpuiToastPart);
}

export function defineToastBody(): void {
  defineToastSimplePart("spui-toast-body", '<slot></slot><slot name="subtitle"></slot>', ":host{grid-column:2;line-height:1.45;overflow-wrap:anywhere}slot[name=subtitle]{display:block;margin-block-start:4px;color:var(--spui-ui-muted,var(--spui-semantic-body-text,#616161));font-size:.9em}");
}

export function defineToastFooter(): void {
  defineToastSimplePart("spui-toast-footer", "<slot></slot>", ":host{grid-column:2;display:flex;align-items:center;flex-wrap:wrap;gap:var(--spui-control-gap,8px);padding-block-start:8px}");
}

export function defineToastTitle(): void {
  if (customElements.get("spui-toast-title")) return;
  class SpuiToastTitle extends HTMLElement {
    static observedAttributes = ["intent"];
    private mediaSlot?: HTMLSlotElement;
    private fallback?: HTMLElement;
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" });
        const media = document.createElement("span"); media.className = "media"; media.part.add("media");
        this.fallback = document.createElement("span"); this.fallback.className = "fallback"; this.fallback.setAttribute("aria-hidden", "true"); media.append(this.fallback);
        this.mediaSlot = document.createElement("slot"); this.mediaSlot.name = "media"; this.mediaSlot.addEventListener("slotchange", () => this.syncMedia()); media.append(this.mediaSlot);
        const text = document.createElement("span"); text.className = "text"; text.part.add("text"); text.append(document.createElement("slot"));
        const action = document.createElement("slot"); action.name = "action"; action.part.add("action");
        const style = document.createElement("style"); style.textContent = `${base}:host{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;min-width:0;color:inherit;font:inherit;font-weight:var(--fontWeightSemibold,600)}.media{display:grid;place-items:center;inline-size:20px;block-size:20px;color:var(--spui-toast-intent-color,var(--spui-ui-accent,#0078d4))}.media:empty{display:none}.media svg{inline-size:20px;block-size:20px;fill:currentColor}.fallback[hidden]{display:none}.text{min-width:0;overflow-wrap:anywhere}slot[name=action]{display:block;margin-inline-start:auto}`;
        shadow.append(style, media, text, action);
      }
      this.syncMedia();
    }
    attributeChangedCallback(): void { if (this.isConnected) this.syncMedia(); }
    refresh(): void { this.syncMedia(); }
    private syncMedia(): void {
      if (!this.fallback || !this.mediaSlot) return;
      const assigned = this.mediaSlot.assignedNodes({ flatten: true }).length > 0;
      this.fallback.replaceChildren();
      const intent = (this.getAttribute("intent") ?? this.closest<HTMLElement>("spui-toast")?.getAttribute("intent") ?? "info") as ToastIntent;
      if (!assigned) this.fallback.append(toastIntentIcon(this.ownerDocument, ["info", "success", "warning", "error"].includes(intent) ? intent : "info"));
      this.fallback.hidden = assigned;
    }
  }
  customElements.define("spui-toast-title", SpuiToastTitle);
}

let generatedId = 0;
const makeId = (): string => globalThis.crypto?.randomUUID?.() ?? `spui-toast-${Date.now()}-${++generatedId}`;

export function defineToast(): void {
  if (customElements.get("spui-toast")) return;
  defineToastTitle(); defineToastBody(); defineToastFooter();
  class SpuiToast extends HTMLElement {
    static observedAttributes = ["toast-id", "intent", "appearance", "politeness", "timeout", "dismiss-label", "priority"];
    private timer: number | undefined;
    private startedAt = 0;
    private remaining = 3000;
    private pauseReasons = new Set<string>();
    private announcementScheduled = false;
    private closeButton!: HTMLButtonElement;
    private titleSlot!: HTMLSlotElement;
    private contentObserver?: MutationObserver;
    private onWindowBlur = (): void => { if (this.hasAttribute("pause-on-window-blur") && this.getAttribute("pause-on-window-blur") !== "false") this.pauseFor("window"); };
    private onWindowFocus = (): void => this.resumeFor("window");
    private onVisibility = (): void => {
      if (document.hidden && this.hasAttribute("pause-on-window-blur") && this.getAttribute("pause-on-window-blur") !== "false") this.pauseFor("visibility");
      else this.resumeFor("visibility");
    };

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      const toaster = this.parentElement as (HTMLElement & { registerToast?: (toast: HTMLElement) => void }) | null;
      if (toaster?.localName === "spui-toaster") toaster.registerToast?.(this);
      this.syncSemantics();
      this.resetTimer();
      this.ownerDocument.defaultView?.addEventListener("blur", this.onWindowBlur);
      this.ownerDocument.defaultView?.addEventListener("focus", this.onWindowFocus);
      this.ownerDocument.addEventListener("visibilitychange", this.onVisibility);
      this.addEventListener("mouseenter", this.onMouseEnter);
      this.addEventListener("mouseleave", this.onMouseLeave);
      this.addEventListener("focusin", this.onFocusIn);
      this.addEventListener("focusout", this.onFocusOut);
      this.addEventListener("slotchange", this.onSlotChange, true);
      this.syncTitle();
      this.scheduleAnnouncement();
      const Observer = this.ownerDocument.defaultView?.MutationObserver;
      if (Observer) {
        this.contentObserver = new Observer(this.scheduleAnnouncement);
        this.contentObserver.observe(this, { childList: true, characterData: true, subtree: true });
      }
    }
    disconnectedCallback(): void {
      this.clearTimer();
      this.pauseReasons.clear();
      this.contentObserver?.disconnect();
      this.contentObserver = undefined;
      this.ownerDocument.defaultView?.removeEventListener("blur", this.onWindowBlur);
      this.ownerDocument.defaultView?.removeEventListener("focus", this.onWindowFocus);
      this.ownerDocument.removeEventListener("visibilitychange", this.onVisibility);
      this.removeEventListener("mouseenter", this.onMouseEnter);
      this.removeEventListener("mouseleave", this.onMouseLeave);
      this.removeEventListener("focusin", this.onFocusIn);
      this.removeEventListener("focusout", this.onFocusOut);
      this.removeEventListener("slotchange", this.onSlotChange, true);
    }
    attributeChangedCallback(name: string): void {
      if (!this.isConnected) return;
      if (name === "timeout") this.resetTimer();
      if (name === "priority") {
        const toaster = this.parentElement as (HTMLElement & { refreshQueue?: () => void }) | null;
        if (toaster?.localName === "spui-toaster") toaster.refreshQueue?.();
      }
      if (name === "intent" || name === "politeness" || name === "dismiss-label") this.syncSemantics();
      if (name === "intent" || name === "politeness") this.scheduleAnnouncement();
    }

    get toastId(): string { return this.getAttribute("toast-id") ?? ""; }

    configure(options: ToastOptions): string {
      const id = options.id || this.toastId || makeId();
      this.hidden = false;
      this.setAttribute("toast-id", id);
      if (Number.isFinite(options.priority)) this.setAttribute("priority", String(options.priority)); else this.removeAttribute("priority");
      if (options.intent) this.setAttribute("intent", options.intent); else this.removeAttribute("intent");
      if (options.appearance) this.setAttribute("appearance", options.appearance); else this.removeAttribute("appearance");
      if (options.politeness) this.setAttribute("politeness", options.politeness); else this.removeAttribute("politeness");
      this.setAttribute("timeout", String(options.timeout ?? 3000));
      this.setAttribute("dismiss-label", options.dismissLabel ?? "Dismiss");
      this.setAttribute("pause-on-hover", options.pauseOnHover ? "" : "false");
      this.setAttribute("pause-on-window-blur", options.pauseOnWindowBlur ? "" : "false");
      this.setPart("title", options.title);
      this.setPart("body", options.body);
      this.querySelector("[data-spui-toast-generated-action]")?.remove();
      if (options.actionLabel) {
        const button = this.ownerDocument.createElement("button");
        button.slot = "action";
        button.type = "button";
        button.dataset.spuiToastGeneratedAction = "";
        button.textContent = options.actionLabel;
        button.addEventListener("click", () => { options.onAction?.(id); this.dismiss("action"); });
        this.append(button);
      }
      this.syncSemantics();
      this.resetTimer();
      this.syncTitle();
      this.scheduleAnnouncement();
      return id;
    }

    dismiss(reason = "dismiss"): void {
      if (this.hidden) return;
      this.clearTimer();
      const active = this.ownerDocument.activeElement;
      const hadFocus = active === this || this.contains(active) || Boolean(this.shadowRoot?.activeElement);
      this.hidden = true;
      this.dispatchEvent(new CustomEvent("spui-dismiss", { detail: { id: this.toastId, reason, hadFocus }, bubbles: true, composed: true }));
    }
    pause(reason = "imperative"): void { this.pauseFor(reason); }
    play(reason = "imperative"): void { this.resumeFor(reason); if (reason === "queue") this.scheduleAnnouncement(); }

    private setPart(slot: "title" | "body", value: ToastContent | undefined): void {
      this.querySelector(`[data-spui-toast-part="${slot}"]`)?.remove();
      if (value === undefined) return;
      const wrapper = this.ownerDocument.createElement(slot === "body" ? "spui-toast-body" : "spui-toast-title");
      wrapper.dataset.spuiToastPart = slot;
      if (slot === "title") wrapper.slot = "title";
      if (typeof value === "string") wrapper.textContent = value;
      else wrapper.append(value);
      this.append(wrapper);
    }
    private onMouseEnter = (): void => { if (this.hasAttribute("pause-on-hover") && this.getAttribute("pause-on-hover") !== "false") this.pauseFor("hover"); };
    private onMouseLeave = (): void => this.resumeFor("hover");
    private onFocusIn = (): void => this.pauseFor("focus");
    private onFocusOut = (event: FocusEvent): void => { if (!this.contains(event.relatedTarget as Node | null)) this.resumeFor("focus"); };
    private onSlotChange = (): void => { this.syncTitle(); this.scheduleAnnouncement(); };
    private syncTitle(): void {
      if (!this.titleSlot) return;
      const hasTitle = this.titleSlot.assignedNodes({ flatten: true }).some(node => node.nodeType === Node.ELEMENT_NODE || Boolean(node.textContent?.trim()));
      this.toggleAttribute("data-has-title", hasTitle);
    }
    private syncSemantics(): void {
      const intent = this.getAttribute("intent") ?? "info";
      const politeness = this.getAttribute("politeness") ?? (intent === "info" ? "polite" : "assertive");
      this.setAttribute("role", "group");
      this.removeAttribute("aria-live");
      this.removeAttribute("aria-atomic");
      if (this.closeButton) this.closeButton.setAttribute("aria-label", this.getAttribute("dismiss-label") ?? "Dismiss");
      for (const title of this.querySelectorAll<HTMLElement>("spui-toast-title")) (title as HTMLElement & { refresh?: () => void }).refresh?.();
    }
    private scheduleAnnouncement(): void {
      if (this.announcementScheduled) return;
      this.announcementScheduled = true;
      queueMicrotask(() => {
        this.announcementScheduled = false;
        if (!this.isConnected || this.hidden) return;
        const message = this.textContent?.replace(/\s+/g, " ").trim();
        if (!message) return;
        const intent = this.getAttribute("intent") ?? "info";
        const requested = this.getAttribute("politeness");
        const politeness = requested === "polite" || requested === "assertive" ? requested : intent === "info" ? "polite" : "assertive";
        this.dispatchEvent(new CustomEvent("spui-toast-announce", { detail: { id: this.toastId, message, politeness }, bubbles: true, composed: true }));
      });
    }
    private clearTimer(): void { if (this.timer !== undefined) this.ownerDocument.defaultView?.clearTimeout(this.timer); this.timer = undefined; }
    private resetTimer(): void {
      this.clearTimer();
      const timeout = Number(this.getAttribute("timeout") ?? 3000);
      this.remaining = timeout === 0 || timeout === -1 ? 0 : Number.isFinite(timeout) && timeout > 0 ? timeout : 3000;
      this.startTimer();
    }
    private pauseFor(reason: string): void {
      this.pauseReasons.add(reason);
      if (this.timer === undefined) return;
      this.remaining = Math.max(0, this.remaining - (performance.now() - this.startedAt));
      this.clearTimer();
    }
    private resumeFor(reason: string): void {
      this.pauseReasons.delete(reason);
      this.startTimer();
    }
    private startTimer(): void {
      if (!this.isConnected || this.hidden || this.timer !== undefined || this.remaining === 0 || this.pauseReasons.size) return;
      this.startedAt = performance.now();
      this.timer = this.ownerDocument.defaultView!.setTimeout(() => this.dismiss("timeout"), this.remaining);
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const header = this.ownerDocument.createElement("div"); header.className = "header";
      this.titleSlot = this.ownerDocument.createElement("slot"); this.titleSlot.name = "title"; this.titleSlot.part.add("title"); header.append(this.titleSlot);
      this.closeButton = this.ownerDocument.createElement("button"); this.closeButton.type = "button"; this.closeButton.className = "close"; this.closeButton.setAttribute("aria-label", this.getAttribute("dismiss-label") ?? "Dismiss"); this.closeButton.part.add("dismiss");
      const mark = this.ownerDocument.createElement("span"); mark.className = "close-mark"; mark.setAttribute("aria-hidden", "true"); this.closeButton.append(mark);
      this.closeButton.addEventListener("click", () => this.dismiss("close"));
      header.append(this.closeButton);
      const body = this.ownerDocument.createElement("slot"); body.part.add("body");
      const action = this.ownerDocument.createElement("slot"); action.name = "action"; action.part.add("action");
      const style = this.ownerDocument.createElement("style");
      style.textContent = `${base}:host{display:block;box-sizing:border-box;inline-size:min(100%,420px);padding:12px 14px;border:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));border-radius:var(--spui-toast-radius,var(--spui-control-radius,8px));background:var(--spui-toast-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));box-shadow:var(--spui-toast-shadow,0 8px 24px #0002);font:inherit;line-height:1.45;pointer-events:auto;animation:spui-toast-enter 180ms ease-out both}:host([hidden]){display:none}:host([intent=success]){--spui-toast-background:var(--spui-ui-success-surface,var(--spui-semantic-success-background,#dff6dd))}:host([intent=warning]){--spui-toast-background:var(--spui-ui-warning-surface,var(--spui-semantic-warning-background,#fff4ce))}:host([intent=error]){--spui-toast-background:var(--spui-ui-danger-surface,var(--spui-semantic-error-background,#fde7e9))}:host([appearance=brand]){background:var(--spui-toast-brand-background,var(--spui-ui-accent,#78716c));color:var(--spui-toast-brand-color,var(--spui-ui-accent-text,#fff))}:host([appearance=inverted]){background:var(--spui-toast-inverted-background,color-mix(in srgb,var(--spui-ui-text,#242424) 92%,var(--spui-ui-canvas,#f5f5f5) 8%));color:var(--spui-toast-inverted-color,color-mix(in srgb,var(--spui-ui-surface,#fff) 92%,var(--spui-ui-text,#242424) 8%))}.header{display:flex;align-items:start;justify-content:space-between;gap:8px;font-weight:var(--fontWeightSemibold,600)}slot[name=title]{display:none}:host([data-has-title]) slot[name=title]{display:block}slot:not([name]){display:block;margin-block-start:4px}slot[name=action]{display:block;margin-block-start:10px}::slotted(button[slot=action]){font:inherit}button.close{flex:none;display:grid;place-items:center;inline-size:32px;block-size:32px;margin-block-start:-6px;margin-inline-end:-8px;margin-block-end:-4px;margin-inline-start:0;padding:0;border:0;border-radius:var(--spui-control-radius,6px);background:transparent;color:inherit;cursor:pointer}button.close:hover{background:var(--spui-ui-surface-hover,#0001)}button.close:focus-visible,::slotted(button:focus-visible){outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px}.close-mark{position:relative;inline-size:14px;block-size:14px}.close-mark:before,.close-mark:after{content:"";position:absolute;inset-block-start:6px;inset-inline-start:0;inline-size:14px;block-size:2px;border-radius:2px;background:currentColor;transform:rotate(45deg)}.close-mark:after{transform:rotate(-45deg)}@keyframes spui-toast-enter{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){:host{animation:none}}@media(forced-colors:active){:host{border-color:CanvasText;color:CanvasText;background:Canvas;box-shadow:none}.close-mark:before,.close-mark:after{background:ButtonText}}`;
      shadow.replaceChildren(style, header, body, action);
    }
  }
  customElements.define("spui-toast", SpuiToast);
}
