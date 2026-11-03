import { directionByLanguage } from "./shared.js";
import { defineToast, type ToastOptions } from "./toast.js";

export type ToastPosition = "top-start" | "top-end" | "bottom-start" | "bottom-end";
export type ToastAnnounceOptions = { politeness: "polite" | "assertive" };
export type ToastAnnounce = (message: string, options: ToastAnnounceOptions) => void;
type ToastNode = HTMLElement & { toastId: string; configure(options: ToastOptions): string; dismiss(reason?: string): void; pause(reason?: string): void; play(reason?: string): void };
type ToastAnnouncement = { id: string; message: string; politeness: "polite" | "assertive" };

export function defineToaster(): void {
  if (customElements.get("spui-toaster")) return;
  defineToast();

  class SpuiToaster extends HTMLElement {
    static observedAttributes = ["position", "aria-label", "limit"];
    announce?: ToastAnnounce;
    private lastFocused: HTMLElement | null = null;
    private previousToastCount = 0;
    private restorePending = false;
    private toastSlot!: HTMLSlotElement;
    private politeRegion!: HTMLDivElement;
    private assertiveRegion!: HTMLDivElement;
    private announcementQueue: ToastAnnouncement[] = [];
    private activeAnnouncement?: ToastAnnouncement;
    private announcementTimer?: number;
    private announceEnabled = true;
    private queuedToasts = new Set<ToastNode>();
    private activeToasts = new Set<ToastNode>();
    private toastById = new Map<string, ToastNode>();

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.setAttribute("role", "region");
      if (!this.hasAttribute("position")) this.setAttribute("position", "top-end");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Notifications");
      this.toastSlot.addEventListener("slotchange", this.onSlotChange);
      this.addEventListener("spui-dismiss", this.onDismiss);
      this.addEventListener("spui-toast-announce", this.onAnnounce);
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("focusin", this.onFocusIn);
      this.addEventListener("focusout", this.onFocusOut);
    }
    disconnectedCallback(): void {
      this.removeEventListener("spui-dismiss", this.onDismiss);
      this.removeEventListener("spui-toast-announce", this.onAnnounce);
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("focusin", this.onFocusIn);
      this.removeEventListener("focusout", this.onFocusOut);
      this.toastSlot.removeEventListener("slotchange", this.onSlotChange);
      if (this.announcementTimer !== undefined) this.ownerDocument.defaultView?.clearTimeout(this.announcementTimer);
      this.announcementTimer = undefined;
      this.announcementQueue = [];
      this.activeAnnouncement = undefined;
    }
    attributeChangedCallback(name: string): void {
      if (name === "position" && !["top-start", "top-end", "bottom-start", "bottom-end"].includes(this.getAttribute(name) ?? "")) this.setAttribute(name, "top-end");
      if (name === "limit") this.syncQueue();
    }

    show(options: ToastOptions): string {
      const existing = options.id ? this.toastById.get(options.id) : undefined;
      if (existing) { const id = existing.configure(options); this.syncQueue(); return id; }
      this.captureFocus();
      const toast = this.ownerDocument.createElement("spui-toast") as ToastNode;
      toast.slot = "toast";
      toast.tabIndex = -1;
      const id = toast.configure(options);
      this.append(toast);
      return id;
    }
    registerToast(toast: HTMLElement): void {
      if (toast.localName !== "spui-toast") return;
      const node = toast as ToastNode;
      if (!node.toastId || (node.hidden && !this.queuedToasts.has(node))) return;
      this.toastById.set(node.toastId, node);
      if (this.queuedToasts.has(node)) { node.hidden = true; node.pause("queue"); return; }
      if (this.activeToasts.has(node)) return;
      if (this.activeToasts.size >= this.limit) this.queueToast(node);
      else this.activeToasts.add(node);
    }
    refreshQueue(): void { this.syncQueue(); }
    captureFocus(): void {
      const active = this.ownerDocument.activeElement;
      if (!this.activeToasts.size && !this.queuedToasts.size && active && active !== this.ownerDocument.body && active.nodeType === 1 && !this.contains(active)) this.lastFocused = active as HTMLElement;
    }
    update(id: string, options: ToastOptions): boolean {
      const toast = this.toastById.get(id);
      if (!toast) return false;
      toast.configure({ ...options, priority: options.priority ?? (Number(toast.getAttribute("priority")) || 0), id });
      this.syncQueue();
      return true;
    }
    dismiss(id: string, reason = "dismiss"): boolean {
      const toast = this.toastById.get(id);
      if (!toast) return false;
      if (this.queuedToasts.has(toast)) { this.queuedToasts.delete(toast); toast.hidden = false; toast.play("queue"); }
      toast.dismiss(reason);
      return true;
    }
    dismissAll(reason = "dismiss-all"): number {
      const toasts = [...this.toasts];
      toasts.forEach(toast => this.dismiss(toast.toastId, reason));
      return toasts.length;
    }
    pause(id: string): boolean {
      const toast = this.toastById.get(id);
      if (!toast) return false;
      toast.pause();
      return true;
    }
    play(id: string): boolean {
      const toast = this.toastById.get(id);
      if (!toast) return false;
      toast.play();
      return true;
    }
    focusNewest(): boolean {
      const toast = [...this.toasts].reverse().find(item => !item.hidden);
      if (!toast) return false;
      toast.focus();
      return true;
    }

    private get toasts(): ToastNode[] {
      return Array.from(this.children).filter(element => element.localName === "spui-toast") as ToastNode[];
    }
    private get limit(): number {
      if (!this.hasAttribute("limit")) return Number.POSITIVE_INFINITY;
      const value = Number(this.getAttribute("limit"));
      return Number.isFinite(value) && value >= 0 ? Math.floor(value) : Number.POSITIVE_INFINITY;
    }
    private get visibleToasts(): ToastNode[] { return [...this.activeToasts].filter(toast => toast.isConnected && !toast.hidden); }
    private queueToast(toast: ToastNode): void {
      this.activeToasts.delete(toast);
      this.queuedToasts.add(toast);
      toast.hidden = true;
      toast.pause("queue");
    }
    private syncQueue(): void {
      if (!this.isConnected) return;
      const toasts = this.toasts;
      const children = new Set(toasts);
      for (const [id, toast] of this.toastById) if (!children.has(toast)) this.toastById.delete(id);
      for (const toast of this.activeToasts) if (!children.has(toast)) this.activeToasts.delete(toast);
      for (const toast of this.queuedToasts) if (!children.has(toast)) this.queuedToasts.delete(toast);
      for (const toast of toasts) this.registerToast(toast);
      const limit = this.limit;
      const visible = toasts.filter(toast => this.activeToasts.has(toast));
      for (const toast of visible.slice(limit)) this.queueToast(toast);
      const order = new Map(toasts.map((toast, index) => [toast, index]));
      const queued = [...this.queuedToasts].filter(toast => children.has(toast)).sort((a, b) => {
        const priorityA = Number(a.getAttribute("priority")) || 0;
        const priorityB = Number(b.getAttribute("priority")) || 0;
        return priorityA - priorityB || order.get(a)! - order.get(b)!;
      });
      for (const toast of queued.slice(0, Math.max(0, limit - visible.length))) {
        this.queuedToasts.delete(toast);
        this.activeToasts.add(toast);
        toast.hidden = false;
        toast.play("queue");
      }
    }
    private onSlotChange = (): void => {
      this.syncQueue();
      const count = this.visibleToasts.length;
      if (!this.previousToastCount && count && !this.lastFocused) {
        const active = this.ownerDocument.activeElement;
        if (active && active !== this.ownerDocument.body && active.nodeType === 1 && !this.contains(active)) this.lastFocused = active as HTMLElement;
      }
      if (!count && this.previousToastCount && !this.restorePending) this.lastFocused = null;
      this.previousToastCount = count;
    };
    private onDismiss = (event: Event): void => {
      const toast = event.target;
      if (!(toast instanceof HTMLElement) || toast.localName !== "spui-toast") return;
      const detail = (event as CustomEvent<{ hadFocus?: boolean }>).detail;
      const hadFocus = Boolean(detail?.hadFocus) || (this.contains(this.ownerDocument.activeElement) && (this.ownerDocument.activeElement === toast || toast.contains(this.ownerDocument.activeElement)));
      if (hadFocus) {
        this.restorePending = true;
        this.ownerDocument.defaultView?.setTimeout(() => { this.restorePending = false; this.restoreFocus(toast); }, 0);
      }
      this.activeToasts.delete(toast as ToastNode);
      this.queuedToasts.delete(toast as ToastNode);
      const toastId = (toast as ToastNode).toastId;
      if (this.toastById.get(toastId) === toast) this.toastById.delete(toastId);
      this.syncQueue();
      if (!this.hasAttribute("managed")) this.ownerDocument.defaultView?.setTimeout(() => toast.remove(), 0);
    };
    private onAnnounce = (event: Event): void => {
      const detail = (event as CustomEvent<ToastAnnouncement>).detail;
      if (!this.announceEnabled || !detail?.message?.trim() || (this.activeAnnouncement?.message === detail.message)) return;
      if (this.announcementQueue.some(item => item.id === detail.id && item.message === detail.message)) return;
      const item: ToastAnnouncement = { ...detail, politeness: detail.politeness === "assertive" ? "assertive" : "polite" };
      if (this.announce) { this.announce(item.message, { politeness: item.politeness }); return; }
      const index = item.politeness === "assertive" ? this.announcementQueue.findIndex(queued => queued.politeness === "polite") : -1;
      if (index < 0) this.announcementQueue.push(item);
      else this.announcementQueue.splice(index, 0, item);
      this.presentNextAnnouncement();
    };
    private presentNextAnnouncement(): void {
      if (this.activeAnnouncement || !this.announcementQueue.length) return;
      const announcement = this.announcementQueue.shift()!;
      this.activeAnnouncement = announcement;
      this.politeRegion.textContent = "";
      this.assertiveRegion.textContent = "";
      this.announcementTimer = this.ownerDocument.defaultView!.setTimeout(() => {
        const region = announcement.politeness === "assertive" ? this.assertiveRegion : this.politeRegion;
        region.textContent = announcement.message;
        this.announcementTimer = this.ownerDocument.defaultView!.setTimeout(() => {
          this.politeRegion.textContent = "";
          this.assertiveRegion.textContent = "";
          this.activeAnnouncement = undefined;
          this.announcementTimer = undefined;
          this.presentNextAnnouncement();
        }, 500);
      }, 50);
    }
    private getVisibleFocusables(): HTMLElement[] {
      const focusables: HTMLElement[] = [];
      const visit = (node: Node): void => {
        if (node instanceof HTMLElement) {
          if (node.matches('a[href],button,input:not([type="hidden"]),select,textarea,[tabindex]') && node.tabIndex >= 0 && !node.hasAttribute("disabled") && !node.hidden && node.getAttribute("aria-hidden") !== "true" && node.getClientRects().length) focusables.push(node);
          if (node.shadowRoot) { for (const child of node.shadowRoot.childNodes) visit(child); return; }
        }
        if (node instanceof HTMLSlotElement) {
          const assigned = node.assignedNodes();
          for (const child of assigned.length ? assigned : node.childNodes) visit(child);
          return;
        }
        for (const child of node.childNodes) visit(child);
      };
      for (const toast of this.visibleToasts) visit(toast);
      return focusables;
    }
    private onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Tab") {
        const focusables = this.getVisibleFocusables();
        const target = event.composedPath()[0];
        const current = focusables.findIndex(element => element === target || (target instanceof Node && element.contains(target)));
        const edge = event.shiftKey ? 0 : focusables.length - 1;
        if (focusables.length > 1 && current === edge) {
          event.preventDefault();
          focusables[event.shiftKey ? focusables.length - 1 : 0].focus();
        }
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        const visible = this.toasts.filter(toast => !toast.hidden);
        if (!visible.length) return;
        const active = this.ownerDocument.activeElement;
        const current = visible.findIndex(toast => toast === active || toast.contains(active));
        const delta = event.key === "ArrowUp" ? -1 : 1;
        const next = current < 0 ? visible.length - 1 : (current + delta + visible.length) % visible.length;
        event.preventDefault();
        visible[next].focus();
        return;
      }
      if (event.key !== "Escape" && event.key !== "Delete") return;
      const active = this.ownerDocument.activeElement;
      const focused = this.toasts.find(toast => toast === active || toast.contains(active));
      const target = event.key === "Delete" ? focused : focused ?? [...this.toasts].reverse().find(toast => !toast.hidden);
      if (!target) return;
      event.preventDefault();
      target.dismiss("keyboard");
    };
    private onFocusIn = (): void => { this.announceEnabled = false; for (const toast of this.toasts) toast.pause("toaster-focus"); };
    private onFocusOut = (event: FocusEvent): void => {
      if (this.contains(event.relatedTarget as Node | null)) return;
      this.announceEnabled = true;
      for (const toast of this.toasts) toast.play("toaster-focus");
    };
    private restoreFocus(dismissed: HTMLElement): void {
      const next = [...this.toasts].reverse().find(item => item !== dismissed && !item.hidden);
      if (next) next.focus();
      else {
        if (this.lastFocused?.isConnected) this.lastFocused.focus();
        this.lastFocused = null;
      }
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      this.toastSlot = this.ownerDocument.createElement("slot");
      this.toastSlot.name = "toast";
      const announcer = this.ownerDocument.createElement("div");
      announcer.className = "announcer";
      this.assertiveRegion = this.ownerDocument.createElement("div");
      this.assertiveRegion.setAttribute("aria-live", "assertive");
      this.assertiveRegion.setAttribute("aria-atomic", "true");
      this.politeRegion = this.ownerDocument.createElement("div");
      this.politeRegion.setAttribute("aria-live", "polite");
      this.politeRegion.setAttribute("aria-atomic", "true");
      announcer.append(this.assertiveRegion, this.politeRegion);
      const style = this.ownerDocument.createElement("style");
      style.textContent = `${directionByLanguage}:host{position:fixed;z-index:var(--spui-toaster-z-index,var(--spui-layer-toast,10000));display:flex;flex-direction:column;gap:var(--spui-toaster-gap,10px);box-sizing:border-box;inline-size:min(100vw,460px);max-block-size:calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));overflow:auto;overscroll-behavior:contain;padding:calc(16px + env(safe-area-inset-top,0px)) calc(16px + env(safe-area-inset-right,0px)) calc(16px + env(safe-area-inset-bottom,0px)) calc(16px + env(safe-area-inset-left,0px));pointer-events:none}:host([position=top-start]){inset-block-start:0;inset-inline-start:0;align-items:flex-start}:host([position=top-end]){inset-block-start:0;inset-inline-end:0;align-items:flex-end}:host([position=bottom-start]){inset-block-end:0;inset-inline-start:0;align-items:flex-start;flex-direction:column-reverse}:host([position=bottom-end]){inset-block-end:0;inset-inline-end:0;align-items:flex-end;flex-direction:column-reverse}slot{display:contents}::slotted(spui-toast){max-inline-size:100%}.announcer{position:absolute;inline-size:1px;block-size:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;clip-path:inset(50%);border:0}:host([inline]){position:relative;inset:auto;inline-size:100%;max-block-size:none;overflow:visible;padding:0}:host([inline][position^=bottom]){flex-direction:column}`;
      shadow.replaceChildren(style, this.toastSlot, announcer);
    }
  }
  customElements.define("spui-toaster", SpuiToaster);
}
