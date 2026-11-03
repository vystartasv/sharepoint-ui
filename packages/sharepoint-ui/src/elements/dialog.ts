import { base } from "./shared.js";

let dialogId = 0;

export type DialogOpenChangeData =
  | { type: "escapeKeyDown"; open: boolean; event: KeyboardEvent; trigger?: HTMLElement }
  | { type: "backdropClick"; open: boolean; event: MouseEvent; trigger?: HTMLElement }
  | { type: "triggerClick"; open: boolean; event: MouseEvent; trigger?: HTMLElement };

const dialogParts = [
  ["spui-dialog-surface", "surface"],
  ["spui-dialog-title", "title"],
  ["spui-dialog-content", "content"],
  ["spui-dialog-body", "body"],
  ["spui-dialog-actions", "actions"],
  ["spui-dialog-trigger", "trigger"],
] as const;

type DocumentScrollLock = { count: number; htmlOverflowY: string; bodyOverflowY: string; scrollbarGutter: string };
const documentScrollLocks = new WeakMap<Document, DocumentScrollLock>();

function acquireDocumentScrollLock(doc: Document): boolean {
  const active = documentScrollLocks.get(doc);
  if (active) { active.count++; return true; }
  const body = doc.body;
  const view = doc.defaultView;
  if (!body || !view || Math.floor(body.getBoundingClientRect().height) <= view.innerHeight) return false;
  const lock = { count: 1, htmlOverflowY: doc.documentElement.style.overflowY, bodyOverflowY: body.style.overflowY, scrollbarGutter: doc.documentElement.style.scrollbarGutter };
  documentScrollLocks.set(doc, lock);
  doc.documentElement.style.overflowY = "clip";
  doc.documentElement.style.scrollbarGutter = "stable";
  body.style.overflowY = "hidden";
  return true;
}

function releaseDocumentScrollLock(doc: Document): void {
  const lock = documentScrollLocks.get(doc);
  if (!lock || --lock.count > 0) return;
  if (doc.documentElement.style.overflowY === "clip") doc.documentElement.style.overflowY = lock.htmlOverflowY;
  if (doc.documentElement.style.scrollbarGutter === "stable") doc.documentElement.style.scrollbarGutter = lock.scrollbarGutter;
  if (doc.body?.style.overflowY === "hidden") doc.body.style.overflowY = lock.bodyOverflowY;
  documentScrollLocks.delete(doc);
}

function defineDialogPart(tag: typeof dialogParts[number][0], styles: string, namedSlots: string[] = []): void {
  if (customElements.get(tag)) return;
  class SpuiDialogPart extends HTMLElement {
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{${styles}}${tag === "spui-dialog-actions" ? ":host([position=start]){justify-content:flex-start}:host([fluid])::slotted(*){flex:1}" : tag === "spui-dialog-title" ? "slot:not([name]){flex:1;min-width:0}slot[name=action]{margin-inline-start:auto}" : ""}`;
      if (tag === "spui-dialog-title") { this.setAttribute("role", "heading"); this.setAttribute("aria-level", "2"); }
      const slot = document.createElement("slot");
      shadow.append(style, slot, ...namedSlots.map(name => { const named = document.createElement("slot"); named.name = name; return named; }));
    }
  }
  customElements.define(tag, SpuiDialogPart);
}

export function defineDialogSurface(): void { defineDialogPart("spui-dialog-surface", "display:block;min-width:0;color:inherit;background:inherit"); }
export function defineDialogTitle(): void { defineDialogPart("spui-dialog-title", "display:flex;align-items:center;gap:12px;margin:0;padding:20px 20px 0;font-size:20px;line-height:1.3;font-weight:650", ["action"]); }
export function defineDialogContent(): void { defineDialogPart("spui-dialog-content", "display:block"); }
export function defineDialogBody(): void { defineDialogPart("spui-dialog-body", "display:block;padding:16px 20px 20px;line-height:1.5"); }
export function defineDialogActions(): void {
  defineDialogPart("spui-dialog-actions", "display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;padding:12px 20px 20px;border-top:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))");
}
export function defineDialogTrigger(): void {
  const tag = "spui-dialog-trigger";
  if (customElements.get(tag)) return;
  class SpuiDialogTrigger extends HTMLElement {
    constructor() {
      super();
      this.addEventListener("click", event => this.dispatchEvent(new CustomEvent("spui-dialog-trigger", { bubbles: true, composed: true, detail: { action: this.getAttribute("action") ?? (this.closest('[slot="surface"],spui-dialog-surface') ? "close" : "open"), trigger: event.composedPath().find(node => node instanceof HTMLElement && node.matches("button,a[href],[role=button]")), originalEvent: event } })));
    }
    connectedCallback(): void {
      if (!this.hasAttribute("slot") && !this.closest('[slot="surface"],spui-dialog-surface')) this.slot = "trigger";
      if (!this.shadowRoot) { const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style"); style.textContent = `${base}:host{display:contents}`; const slot = document.createElement("slot"); shadow.append(style, slot); }
    }
  }
  customElements.define(tag, SpuiDialogTrigger);
}

export function defineDialog(): void {
  defineDialogSurface(); defineDialogTitle(); defineDialogContent(); defineDialogBody(); defineDialogActions(); defineDialogTrigger();
  if (customElements.get("spui-dialog")) return;
  class SpuiDialog extends HTMLElement {
    static observedAttributes = ["open", "default-open", "motion", "motion-visible", "motion-exit-complete", "title", "dialog-label", "modal", "modal-type", "inert-trap-focus", "dismissible", "close-label", "aria-label"];
    private titleObserver?: MutationObserver;
    private previousFocus?: HTMLElement;
    private fallbackTrapActive = false;
    private refocusing = false;
    private bodyScrollLockHeld = false;
    private focusGuard?: (event: FocusEvent) => void;
    get open(): boolean { return this.hasAttribute("open"); }
    set open(value: boolean) { this.toggleAttribute("open", Boolean(value)); }

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      if (!this.hasAttribute("open") && this.hasAttribute("default-open")) this.open = true;
      this.observeTitle();
      this.syncOpen();
    }

    disconnectedCallback(): void { this.titleObserver?.disconnect(); this.releaseBodyScrollLock(); }

    attributeChangedCallback(): void { if (this.isConnected) this.syncOpen(); }

    private syncOpen(): void {
      const dialog = this.shadowRoot?.querySelector("dialog");
      if (!dialog) return;
      const motionExiting = this.hasAttribute("motion") && this.getAttribute("motion-visible") === "false" && !this.hasAttribute("motion-exit-complete");
      const shouldOpen = this.open || motionExiting;
      this.syncBodyScrollLock(shouldOpen);
      if (shouldOpen && !dialog.open) {
        this.previousFocus ??= document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
        const modalType = this.getAttribute("modal-type");
        const nonModal = modalType === "non-modal" || (modalType == null && this.hasAttribute("modal") && this.getAttribute("modal") === "false");
        if (nonModal || this.getAttribute("inert-trap-focus") === "false" || this.hasAttribute("data-has-custom-backdrop")) {
          dialog.show();
          this.fallbackTrapActive = !nonModal;
          const backdrop = this.shadowRoot?.querySelector<HTMLElement>(".modal-backdrop");
          if (backdrop) backdrop.hidden = !this.fallbackTrapActive;
          if (this.fallbackTrapActive) {
            dialog.setAttribute("aria-modal", "true");
            queueMicrotask(() => (this.focusableElements()[0] ?? dialog).focus());
            this.focusGuard = event => {
              if (this.refocusing || event.composedPath().includes(dialog)) return;
              this.refocusing = true;
              (this.focusableElements()[0] ?? dialog).focus();
              queueMicrotask(() => { this.refocusing = false; });
            };
            document.addEventListener("focus", this.focusGuard, true);
          }
        } else dialog.showModal();
      } else if (!shouldOpen) {
        if (dialog.open) dialog.close();
        const restoreFocus = this.fallbackTrapActive ? this.previousFocus : undefined;
        this.fallbackTrapActive = false;
        const backdrop = this.shadowRoot?.querySelector<HTMLElement>(".modal-backdrop");
        if (backdrop) backdrop.hidden = true;
        if (this.focusGuard) document.removeEventListener("focus", this.focusGuard, true);
        this.focusGuard = undefined;
        this.previousFocus = undefined;
        if (restoreFocus) window.setTimeout(() => { if (restoreFocus.isConnected) restoreFocus.focus(); }, 0);
      }
      dialog.inert = motionExiting;
      if (motionExiting) dialog.setAttribute("aria-hidden", "true"); else dialog.removeAttribute("aria-hidden");
      if (this.getAttribute("modal-type") === "alert") dialog.setAttribute("role", "alertdialog");
      else dialog.removeAttribute("role");
      const title = this.getAttribute("title");
      const fallbackTitle = this.shadowRoot?.querySelector<HTMLElement>(".fallback-title");
      if (fallbackTitle) fallbackTitle.textContent = title ?? this.getAttribute("dialog-label") ?? "Dialog";
      const titleSlot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name=title]");
      if (fallbackTitle && titleSlot) fallbackTitle.hidden = titleSlot.assignedNodes().length > 0;
      const close = this.shadowRoot?.querySelector<HTMLButtonElement>(".close");
      if (close) { close.setAttribute("aria-label", this.getAttribute("close-label") ?? "Close"); close.hidden = this.getAttribute("modal-type") === "alert" || (this.hasAttribute("dismissible") && this.getAttribute("dismissible") === "false"); }
      if (dialog) this.syncAccessibleName(dialog);
    }

    private syncAccessibleName(dialog: HTMLDialogElement): void {
      const explicitLabel = this.getAttribute("aria-label");
      const composedTitle = this.querySelector("[data-spui-dialog-title],spui-dialog-title");
      if (explicitLabel) {
        dialog.setAttribute("aria-label", explicitLabel);
        dialog.removeAttribute("aria-labelledby");
      } else if (composedTitle) {
        const titleText = composedTitle.matches("[data-spui-dialog-title]")
          ? [...composedTitle.childNodes].filter(node => !(node instanceof Element && node.hasAttribute("data-spui-dialog-title-action"))).map(node => node.textContent ?? "").join("").trim()
          : composedTitle.shadowRoot?.querySelector<HTMLSlotElement>("slot:not([name])")?.assignedNodes({ flatten: true }).map(node => node.textContent ?? "").join("").trim();
        dialog.setAttribute("aria-label", titleText || this.getAttribute("title") || "Dialog");
        dialog.removeAttribute("aria-labelledby");
      } else {
        dialog.removeAttribute("aria-label");
        dialog.setAttribute("aria-labelledby", "title");
      }
    }

    private emitOpenChange(data: DialogOpenChangeData): void {
      this.dispatchEvent(new CustomEvent("spui-open-change", { bubbles: true, composed: true, detail: data }));
    }

    private focusableElements(): HTMLElement[] {
      const selector = 'button,a[href],input,select,textarea,[tabindex]';
      const controls: HTMLElement[] = [];
      const seen = new Set<HTMLElement>();
      const visit = (root: ParentNode): void => {
        for (const element of root.querySelectorAll<HTMLElement>("*")) {
          if (element.closest('[slot="trigger"]')) continue;
          if (element.matches(selector) && !element.matches(":disabled") && element.tabIndex >= 0 && element.getClientRects().length > 0 && !seen.has(element)) {
            controls.push(element);
            seen.add(element);
          }
          if (element.shadowRoot) visit(element.shadowRoot);
          if (element instanceof HTMLSlotElement) for (const assigned of element.assignedElements({ flatten: true })) visit(assigned);
        }
      };
      visit(this);
      return controls;
    }

    private closeDialog(type: DialogOpenChangeData["type"], event: DialogOpenChangeData["event"], trigger?: HTMLElement): void {
      if (!this.open) return;
      if (this.hasAttribute("motion")) {
        if (this.getAttribute("motion-visible") === "false") return;
        this.emitOpenChange({ open: false, type, event, trigger } as DialogOpenChangeData);
        return;
      }
      this.removeAttribute("open");
      const dialog = this.shadowRoot?.querySelector("dialog");
      if (dialog?.open) dialog.close();
      this.emitOpenChange({ open: false, type, event, trigger } as DialogOpenChangeData);
    }

    private isDismissible(): boolean { return !(this.hasAttribute("dismissible") && this.getAttribute("dismissible") === "false"); }
    private isModal(): boolean {
      const modalType = this.getAttribute("modal-type");
      return modalType === "modal" || (modalType == null && this.getAttribute("modal") !== "false");
    }
    private syncBodyScrollLock(shouldOpen: boolean): void {
      const modalType = this.getAttribute("modal-type");
      const shouldLock = shouldOpen && modalType !== "non-modal" && (modalType != null || this.getAttribute("modal") !== "false");
      if (shouldLock && !this.bodyScrollLockHeld) this.bodyScrollLockHeld = acquireDocumentScrollLock(this.ownerDocument);
      else if (!shouldLock) this.releaseBodyScrollLock();
    }
    private releaseBodyScrollLock(): void {
      if (!this.bodyScrollLockHeld) return;
      this.bodyScrollLockHeld = false;
      releaseDocumentScrollLock(this.ownerDocument);
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const dialog = document.createElement("dialog");
      dialog.id = `spui-dialog-${++dialogId}`;
      dialog.part.add("surface");
      dialog.setAttribute("aria-labelledby", "title");
      const header = document.createElement("header");
      const heading = document.createElement("h2"); heading.id = "title";
      const fallbackTitle = document.createElement("span"); fallbackTitle.className = "fallback-title"; fallbackTitle.textContent = this.getAttribute("title") ?? this.getAttribute("dialog-label") ?? "Dialog";
      const titleSlot = document.createElement("slot"); titleSlot.name = "title"; titleSlot.addEventListener("slotchange", () => { fallbackTitle.hidden = titleSlot.assignedNodes().length > 0; });
      heading.append(fallbackTitle, titleSlot);
      const close = document.createElement("button"); close.type = "button"; close.className = "close"; close.part.add("close-button"); const closeMark = document.createElement("span"); closeMark.setAttribute("aria-hidden", "true"); closeMark.textContent = "×"; close.append(closeMark); close.addEventListener("click", event => this.closeDialog("triggerClick", event));
      header.append(heading, close);
      const body = document.createElement("div"); body.className = "body"; body.part.add("body"); body.append(document.createElement("slot"));
      const footer = document.createElement("footer"); footer.part.add("actions"); footer.hidden = true;
      const actions = document.createElement("slot"); actions.name = "actions"; actions.addEventListener("slotchange", () => { footer.hidden = actions.assignedElements().length === 0; }); footer.append(actions);
      dialog.append(header, body, footer);
      const surface = document.createElement("slot"); surface.name = "surface";
      surface.addEventListener("slotchange", () => {
        const composed = surface.assignedElements().length > 0;
        header.hidden = false;
        heading.hidden = composed;
        body.hidden = composed;
        footer.hidden = composed;
        this.syncAccessibleName(dialog);
        if (this.fallbackTrapActive) requestAnimationFrame(() => (this.focusableElements()[0] ?? dialog).focus());
      });
      this.titleObserver = new MutationObserver(() => this.syncAccessibleName(dialog));
      dialog.insertBefore(surface, body);
      dialog.addEventListener("cancel", event => event.preventDefault());
      dialog.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          if (event.defaultPrevented) return;
          window.setTimeout(() => {
            if (event.defaultPrevented || !this.open) return;
            event.preventDefault();
            if (this.isDismissible()) this.closeDialog("escapeKeyDown", event);
          }, 0);
          return;
        }
        if (!this.fallbackTrapActive) return;
        if (event.key !== "Tab") return;
        const controls = this.focusableElements();
        if (!controls.length) { event.preventDefault(); dialog.focus(); return; }
        const target = event.composedPath()[0];
        const index = controls.indexOf(target instanceof HTMLElement ? target : document.activeElement as HTMLElement);
        if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
        else if (!event.shiftKey && index === controls.length - 1) { event.preventDefault(); controls[0]?.focus(); }
      });
      dialog.addEventListener("click", event => {
        if (event.target !== dialog || !this.isModal() || !this.isDismissible()) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.closeDialog("backdropClick", event);
      });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:contents}dialog{position:relative;z-index:2147483647;box-sizing:border-box;width:min(520px,calc(100vw - 32px));max-width:calc(100vw - 32px);max-height:calc(100dvh - 32px);overflow:auto;padding:0;border:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));border-radius:var(--spui-card-radius,12px);background:var(--spui-card-background,var(--spui-ui-surface,#fff));box-shadow:var(--spui-card-shadow,0 16px 48px #0004);color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424))}dialog::backdrop{background:color-mix(in srgb,var(--spui-ui-text,#242424) 42%,transparent);backdrop-filter:blur(2px)}:host([backdrop-appearance=transparent]) dialog::backdrop{background:transparent;backdrop-filter:none}header{display:flex;align-items:start;justify-content:space-between;gap:16px;padding:20px 20px 0}h2{margin:0;font-size:20px;line-height:1.3;font-weight:650}.close{display:inline-grid;place-items:center;flex:none;width:var(--spui-control-height,32px);height:var(--spui-control-height,32px);margin:-5px -6px 0 0;margin-left:auto;border:0;border-radius:var(--spui-control-radius,6px);background:transparent;color:inherit;font-size:24px;line-height:1;cursor:pointer}.close:hover{background:var(--spui-ui-surface-hover,#f5f5f5)}.close:focus-visible{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px}.body{padding:16px 20px 20px;line-height:1.5}footer{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;padding:12px 20px 20px;border-top:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))}footer[hidden]{display:none}@media(forced-colors:active){dialog{border-color:CanvasText;box-shadow:none}dialog::backdrop{background:Canvas} .close:focus-visible{outline-color:Highlight}}`;
      const overlayStyle = document.createElement("style");
      overlayStyle.textContent = ".modal-backdrop{position:fixed;inset:0;z-index:2147483000;background:color-mix(in srgb,var(--spui-ui-text,#242424) 42%,transparent);backdrop-filter:blur(2px)}.modal-backdrop[hidden]{display:none}.modal-backdrop slot{position:absolute;inset:0}:host([data-has-custom-backdrop]) .modal-backdrop{background:transparent;backdrop-filter:none}:host([backdrop-appearance=transparent]) .modal-backdrop{background:transparent;backdrop-filter:none}::slotted([slot=backdrop]){position:absolute;inset:0;display:block;background:color-mix(in srgb,var(--spui-ui-text,#242424) 42%,transparent)}::slotted([slot=backdrop][data-appearance=transparent]){background:transparent}";
      const backdrop = document.createElement("div"); backdrop.className = "modal-backdrop"; backdrop.part.add("backdrop"); backdrop.hidden = true; backdrop.setAttribute("aria-hidden", "true");
      const backdropSlot = document.createElement("slot"); backdropSlot.name = "backdrop"; backdrop.append(backdropSlot);
      backdrop.addEventListener("click", event => { if (this.isModal() && this.isDismissible()) this.closeDialog("backdropClick", event); });
      const triggerSlot = document.createElement("slot"); triggerSlot.name = "trigger";
      triggerSlot.addEventListener("slotchange", () => {
        for (const trigger of triggerSlot.assignedElements()) {
          const innerSlot = trigger.shadowRoot?.querySelector("slot");
          for (const target of innerSlot?.assignedElements({ flatten: true }) ?? []) {
            if (!trigger.hasAttribute("disable-button-enhancement") && !target.hasAttribute("aria-haspopup")) target.setAttribute("aria-haspopup", "dialog");
          }
        }
      });
      shadow.append(style, overlayStyle, triggerSlot, backdrop, dialog);
      this.addEventListener("spui-dialog-trigger", event => {
        const detail = (event as CustomEvent<{ action?: string; trigger?: HTMLElement; originalEvent: MouseEvent }>).detail;
        if (detail?.action === "close") this.closeDialog("triggerClick", detail.originalEvent, detail.trigger);
        else if (!this.open) { this.previousFocus = detail?.trigger ?? this.querySelector<HTMLElement>('spui-dialog-trigger[slot="trigger"] button,spui-dialog-trigger[slot="trigger"] a[href],[slot="trigger"] [role="button"]') ?? undefined; this.open = true; if (detail?.originalEvent) this.emitOpenChange({ open: true, type: "triggerClick", event: detail.originalEvent, trigger: detail.trigger }); }
      });
    }

    private observeTitle(): void {
      this.titleObserver?.observe(this, { subtree: true, childList: true, characterData: true });
    }
  }
  customElements.define("spui-dialog", SpuiDialog);
}
