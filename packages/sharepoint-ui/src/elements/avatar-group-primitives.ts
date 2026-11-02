import { base } from "./shared.js";
import { defineAvatar } from "./avatar.js";
import { definePopover } from "./popover.js";

/** Fluent-compatible identity item and overflow popover for AvatarGroup. */
export function defineAvatarGroupItem(): void {
  if (customElements.get("spui-avatar-group-item")) return;
  defineAvatar();

  class SpuiAvatarGroupItem extends HTMLElement {
    static observedAttributes = ["name", "image", "initials", "size", "shape", "color", "active", "id-for-color"];
    private avatar?: HTMLElement;
    private name?: HTMLSpanElement;
    private overflowLabelFallback?: HTMLSpanElement;

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.sync();
      queueMicrotask(() => this.syncContext());
    }

    attributeChangedCallback(): void { this.sync(); }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const avatar = document.createElement("spui-avatar");
      avatar.setAttribute("decorative", "");
      const icon = document.createElement("slot"); icon.name = "icon"; icon.slot = "icon";
      const badge = document.createElement("slot"); badge.name = "badge"; badge.slot = "badge";
      avatar.append(icon, badge);
      const name = document.createElement("span"); name.className = "name"; name.part.add("name");
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-grid;place-items:center;box-sizing:content-box;width:var(--spui-avatar-group-item-size,32px);height:var(--spui-avatar-group-item-size,32px);vertical-align:middle;line-height:1}:host([data-overflow-item]){display:flex;align-items:center;justify-content:flex-start;gap:10px;box-sizing:border-box;width:100%;height:auto;min-height:40px;padding:6px 8px;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font:var(--spui-font-family,inherit);text-align:start}:host([data-overflow-item]:hover){background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.name{display:none;min-width:0;overflow-wrap:anywhere}:host([data-overflow-item]) .name{display:block}.name:empty{display:none}:host([data-overflow-item]) spui-avatar{flex:none;width:24px;height:24px}@media(forced-colors:active){:host([data-overflow-item]:hover){outline:1px solid Highlight}}`;
      const avatarSlot = document.createElement("slot"); avatarSlot.name = "avatar"; avatarSlot.append(avatar); avatarSlot.addEventListener("slotchange", () => this.sync());
      const overflowLabel = document.createElement("slot"); overflowLabel.name = "overflowLabel";
      const fallbackLabel = document.createElement("span"); fallbackLabel.textContent = this.getAttribute("name") ?? ""; overflowLabel.append(fallbackLabel);
      name.append(overflowLabel);
      shadow.append(style, avatarSlot, name);
      this.avatar = avatar;
      this.name = name;
      this.overflowLabelFallback = fallbackLabel;
    }

    private sync(): void {
      if (!this.avatar) return;
      for (const name of SpuiAvatarGroupItem.observedAttributes) {
        const value = this.getAttribute(name);
        if (value === null) this.avatar.removeAttribute(name); else this.avatar.setAttribute(name, value);
      }
      const personName = this.getAttribute("name") || "";
      if (this.overflowLabelFallback) this.overflowLabelFallback.textContent = personName;
      this.avatar.setAttribute("decorative", "");
      if (this.hasAttribute("data-overflow-item")) {
        this.setAttribute("role", "listitem");
        this.removeAttribute("aria-label");
      } else {
        this.setAttribute("role", "img");
        if (personName && this.dataset.autoLabel === undefined) {
          this.setAttribute("aria-label", personName);
          this.dataset.autoLabel = "";
        } else if (!personName && this.dataset.autoLabel !== undefined) {
          this.removeAttribute("aria-label");
          delete this.dataset.autoLabel;
        }
      }
      const px = Number.parseFloat(this.getAttribute("size") || "32");
      this.style.setProperty("--spui-avatar-group-item-size", `${Number.isFinite(px) && px > 0 ? px : 32}px`);
    }

    private syncContext(): void {
      const overflow = this.closest("spui-avatar-group-popover") !== null;
      this.toggleAttribute("data-overflow-item", overflow);
      this.sync();
    }
  }

  customElements.define("spui-avatar-group-item", SpuiAvatarGroupItem);
}

export function defineAvatarGroupPopover(): void {
  if (customElements.get("spui-avatar-group-popover")) return;
  definePopover();

  class SpuiAvatarGroupPopover extends HTMLElement {
    static observedAttributes = ["count", "indicator", "label", "trigger-label", "open", "placement"];
    private readonly popoverElement = document.createElement("spui-popover");
    private readonly button = document.createElement("button");
    private readonly list = document.createElement("ul");
    private readonly slotElement = document.createElement("slot");
    private observer?: MutationObserver;
    private isOpen = false;

    get open(): boolean { return this.isOpen; }
    set open(value: boolean) { this.setOpen(Boolean(value)); }

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.observer?.disconnect();
      this.observer = new MutationObserver(() => this.sync());
      this.observer.observe(this, { childList: true, subtree: true });
      this.isOpen = this.hasAttribute("open");
      this.sync();
    }

    disconnectedCallback(): void { this.observer?.disconnect(); }

    attributeChangedCallback(name: string): void {
      if (name === "open" && this.isConnected) this.setOpen(this.hasAttribute("open"), false);
      else this.sync();
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      this.popoverElement.setAttribute("placement", "bottom");
      this.button.type = "button";
      this.button.slot = "trigger";
      this.button.className = "trigger";
      this.button.part.add("trigger");
      this.list.slot = "content";
      this.list.className = "list";
      this.list.setAttribute("role", "list");
      this.slotElement.addEventListener("slotchange", () => this.sync());
      this.list.append(this.slotElement);
      this.popoverElement.append(this.button, this.list);
      this.popoverElement.addEventListener("spui-open-change", event => {
        const open = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
        if (open === this.isOpen) return;
        this.isOpen = open;
        if (this.hasAttribute("open") !== open) this.toggleAttribute("open", open);
      });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-flex;align-items:center;vertical-align:middle}.trigger{box-sizing:border-box;display:inline-grid;place-items:center;min-width:32px;height:32px;padding:0 6px;border:2px solid var(--spui-avatar-group-border,var(--spui-ui-surface,#fff));border-radius:999px;background:var(--spui-avatar-group-background,var(--spui-ui-surface-hover,#f5f5f5));color:var(--spui-avatar-group-foreground,var(--spui-ui-text,var(--spui-semantic-body-text,#323130)));font:600 12px/1 var(--spui-font-family,inherit);cursor:pointer}.trigger:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#005a9e));outline-offset:2px}.list{box-sizing:border-box;display:grid;gap:2px;min-width:180px;max-width:min(320px,calc(100vw - 32px));max-height:min(60vh,480px);overflow:auto;margin:0;padding:4px;list-style:none}.list:empty{display:none}slot::slotted(li){box-sizing:border-box;display:flex;align-items:center;gap:10px;min-height:40px;padding:6px 8px;border-radius:var(--spui-control-radius,4px);color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font:var(--spui-font-family,inherit);text-align:start}slot::slotted(li:hover){background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}:host([data-indicator=icon]) .trigger{min-width:32px}.trigger[hidden]{display:none}@media(prefers-reduced-motion:reduce){.trigger{scroll-behavior:auto}}@media(forced-colors:active){.trigger{border-color:ButtonText;background:Canvas;color:CanvasText}}`;
      shadow.append(style, this.popoverElement);
    }

    private sync(): void {
      if (!this.shadowRoot) return;
      const members = this.slotElement.assignedElements({ flatten: true });
      members.forEach(member => member.toggleAttribute("data-overflow-item", true));
      const count = Math.max(0, Number.parseInt(this.getAttribute("count") || String(members.length), 10) || 0);
      const icon = this.getAttribute("indicator") === "icon";
      this.dataset.indicator = icon ? "icon" : "count";
      this.button.hidden = count === 0;
      if (icon) {
        this.button.replaceChildren();
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 16 16"); svg.setAttribute("width", "16"); svg.setAttribute("height", "16"); svg.setAttribute("aria-hidden", "true");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("fill", "currentColor"); path.setAttribute("d", "M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5-.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM1 12.2c0-2.2 2.2-3.7 5-3.7s5 1.5 5 3.7v1H1v-1Zm10.5-3.5c2 0 3.5 1.2 3.5 3v1h-2v-.5a4.5 4.5 0 0 0-1.5-3.5Z"); svg.append(path); this.button.append(svg);
      } else this.button.textContent = `+${count}`;
      this.button.setAttribute("aria-label", (this.getAttribute("trigger-label") || "View more people").replace("{count}", String(count)));
      this.popoverElement.setAttribute("label", this.getAttribute("label") || "More people");
      this.popoverElement.setAttribute("placement", this.getAttribute("placement") || "bottom");
      this.popoverElement.toggleAttribute("open", this.isOpen);
    }

    private setOpen(value: boolean, emit = true): void {
      const next = Boolean(value);
      if (next === this.isOpen) return;
      this.isOpen = next;
      if (this.hasAttribute("open") !== next) this.toggleAttribute("open", next);
      this.popoverElement.toggleAttribute("open", next);
      if (emit) this.dispatchEvent(new CustomEvent("spui-open-change", { bubbles: true, composed: true, detail: { open: next } }));
    }
  }

  customElements.define("spui-avatar-group-popover", SpuiAvatarGroupPopover);
}
