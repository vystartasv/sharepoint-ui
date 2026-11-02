import { base } from "./shared.js";
import { defineAvatar } from "./avatar.js";

/** A compact, accessible stack of Avatar elements with an expandable overflow. */
// ponytail: expand in place so the leaf needs no overlay manager; add a popover when hidden members need per-person actions.
export function defineAvatarGroup(): void {
  if (customElements.get("spui-avatar-group")) return;
  defineAvatar();

  class SpuiAvatarGroup extends HTMLElement {
    static observedAttributes = ["max-visible", "label", "expanded", "show-more-label", "show-less-label", "layout", "size"];
    private readonly slotElement = document.createElement("slot");
    private readonly button = document.createElement("button");
    private readonly group = document.createElement("div");
    private readonly avatars = document.createElement("div");
    private internalExpanded = false;

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.sync();
    }

    attributeChangedCallback(): void {
      this.sync();
    }

    get expanded(): boolean { return this.hasAttribute("expanded") || this.internalExpanded; }
    set expanded(value: boolean) {
      this.internalExpanded = value;
      this.toggleAttribute("expanded", value);
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      this.group.className = "group";
      this.group.part.add("group");
      this.avatars.className = "avatars";
      this.avatars.part.add("avatars");
      this.slotElement.addEventListener("slotchange", () => this.sync());
      this.button.type = "button";
      this.button.className = "overflow";
      this.button.part.add("overflow");
      this.button.addEventListener("click", () => {
        const next = !this.expanded;
        this.expanded = next;
        this.dispatchEvent(new CustomEvent("spui-avatar-group-expanded-change", { bubbles: true, composed: true, detail: { expanded: next } }));
      });
      this.avatars.append(this.slotElement);
      this.group.append(this.avatars, this.button);
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-block;max-width:100%;font-family:var(--spui-font-family,inherit)}.group{display:inline-flex;align-items:center;max-width:100%;direction:inherit}.avatars{display:inline-flex;align-items:center;max-width:100%}.avatars slot{display:contents}slot::slotted(spui-avatar),slot::slotted(spui-avatar-group-item){position:relative;margin-inline-start:var(--spui-avatar-group-overlap,-10px);border:2px solid var(--spui-avatar-group-border,var(--spui-ui-surface,#fff));border-radius:50%;box-sizing:content-box}slot::slotted(spui-avatar:first-child),slot::slotted(spui-avatar-group-item:first-child){margin-inline-start:0}slot::slotted(spui-avatar-group-popover){position:relative;margin-inline-start:var(--spui-avatar-group-overlap,-10px)}slot::slotted([data-spui-avatar-group-hidden]){display:none!important}.overflow{position:relative;display:inline-grid;place-items:center;flex:none;min-width:32px;height:32px;margin-inline-start:var(--spui-avatar-group-overlap,-10px);padding:0 6px;border:2px solid var(--spui-avatar-group-border,var(--spui-ui-surface,#fff));border-radius:999px;background:var(--spui-avatar-group-background,var(--spui-ui-surface-hover,#f5f5f5));color:var(--spui-avatar-group-foreground,var(--spui-ui-text,var(--spui-semantic-body-text,#323130)));font:600 12px/1 var(--spui-font-family,inherit);cursor:pointer}.overflow[hidden]{display:none}.overflow:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#005a9e));outline-offset:2px}.group[data-layout=spread] slot::slotted(spui-avatar),.group[data-layout=spread] slot::slotted(spui-avatar-group-item),.group[data-layout=spread] slot::slotted(spui-avatar-group-popover),.group[data-layout=spread] .overflow{margin-inline-start:var(--spui-avatar-group-gap,4px)}.group[data-layout=spread] slot::slotted(spui-avatar:first-child),.group[data-layout=spread] slot::slotted(spui-avatar-group-item:first-child){margin-inline-start:0}.group[data-layout=pie] .avatars{position:relative;display:inline-block;flex:none;width:var(--spui-avatar-group-size,32px);height:var(--spui-avatar-group-size,32px);overflow:hidden;border-radius:50%;background:var(--spui-avatar-group-border,var(--spui-ui-surface,#fff))}.group[data-layout=pie] slot::slotted(spui-avatar),.group[data-layout=pie] slot::slotted(spui-avatar-group-item){position:absolute;inset:0;width:100%;height:100%;margin:0;border:0;border-radius:0;box-sizing:border-box}.group[data-layout=pie] slot::slotted([data-pie-total="2"][data-pie-index="0"]){clip-path:inset(0 calc(25% + var(--spui-avatar-group-divider-width,1px)) 0 25%);inset-inline-start:-25%}.group[data-layout=pie] slot::slotted([data-pie-total="2"][data-pie-index="1"]){clip-path:inset(0 25% 0 calc(25% + var(--spui-avatar-group-divider-width,1px)));inset-inline-start:25%}.group[data-layout=pie] slot::slotted([data-pie-total="3"][data-pie-index="0"]){clip-path:inset(0 calc(25% + var(--spui-avatar-group-divider-width,1px)) 0 25%);inset-inline-start:-25%}.group[data-layout=pie] slot::slotted([data-pie-total="3"][data-pie-index="1"]){clip-path:inset(0 0 var(--spui-avatar-group-divider-width,1px) var(--spui-avatar-group-divider-width,1px));inset-inline-start:50%;transform:scale(.5);transform-origin:0 0}.group[data-layout=pie] slot::slotted([data-pie-total="3"][data-pie-index="2"]){clip-path:inset(var(--spui-avatar-group-divider-width,1px) 0 0 var(--spui-avatar-group-divider-width,1px));inset-inline-start:50%;inset-block-start:50%;transform:scale(.5);transform-origin:0 0}:host-context([dir=rtl]) .group[data-layout=pie] slot::slotted([data-pie-total="2"][data-pie-index="0"]),:host-context([dir=rtl]) .group[data-layout=pie] slot::slotted([data-pie-total="3"][data-pie-index="0"]){clip-path:inset(0 25% 0 calc(25% + var(--spui-avatar-group-divider-width,1px)))}:host-context([dir=rtl]) .group[data-layout=pie] slot::slotted([data-pie-total="2"][data-pie-index="1"]){clip-path:inset(0 calc(25% + var(--spui-avatar-group-divider-width,1px)) 0 25%)}:host-context([dir=rtl]) .group[data-layout=pie] slot::slotted([data-pie-total="3"][data-pie-index="1"]){clip-path:inset(0 var(--spui-avatar-group-divider-width,1px) var(--spui-avatar-group-divider-width,1px) 0)}:host-context([dir=rtl]) .group[data-layout=pie] slot::slotted([data-pie-total="3"][data-pie-index="2"]){clip-path:inset(var(--spui-avatar-group-divider-width,1px) var(--spui-avatar-group-divider-width,1px) 0 0)}:host-context([dir=rtl]) .group[data-layout=pie] slot::slotted([data-pie-index="1"]),:host-context([dir=rtl]) .group[data-layout=pie] slot::slotted([data-pie-index="2"]){transform-origin:100% 0}.group[data-layout=pie][data-expanded=true] .avatars{display:inline-flex;width:auto;height:auto;overflow:visible;background:transparent;border-radius:0}.group[data-layout=pie][data-expanded=true] slot::slotted(spui-avatar),.group[data-layout=pie][data-expanded=true] slot::slotted(spui-avatar-group-item){position:relative;inset:auto;width:auto;height:auto;margin-inline-start:var(--spui-avatar-group-overlap,-10px);border:2px solid var(--spui-avatar-group-border,var(--spui-ui-surface,#fff));border-radius:50%;transform:none;clip-path:none}.group[data-layout=pie][data-expanded=true] slot::slotted(spui-avatar:first-child),.group[data-layout=pie][data-expanded=true] slot::slotted(spui-avatar-group-item:first-child){margin-inline-start:0}@media(prefers-reduced-motion:reduce){.overflow{scroll-behavior:auto}}@media(forced-colors:active){.overflow{border-color:ButtonText;background:Canvas;color:CanvasText}.group[data-layout=pie] .avatars{background:CanvasText}}`;
      shadow.append(style, this.group);
      this.setAttribute("role", "group");
    }

    private sync(): void {
      if (!this.shadowRoot) return;
      const label = this.getAttribute("label")?.trim();
      if (label && (!this.hasAttribute("aria-label") || this.dataset.autoLabel !== undefined)) {
        this.setAttribute("aria-label", label);
        this.dataset.autoLabel = "";
      } else if (!label && this.dataset.autoLabel !== undefined) {
        this.removeAttribute("aria-label");
        delete this.dataset.autoLabel;
      }
      const max = Math.max(0, Number.parseInt(this.getAttribute("max-visible") || "5", 10) || 0);
      const members = this.slotElement.assignedElements({ flatten: true }).filter((element): element is HTMLElement => element.localName === "spui-avatar" || element.localName === "spui-avatar-group-item");
      const size = this.getAttribute("size");
      members.forEach(member => {
        if (member.dataset.groupSize !== undefined) {
          if (size) { if (member.getAttribute("size") !== size) member.setAttribute("size", size); }
          else { member.removeAttribute("size"); delete member.dataset.groupSize; }
        } else if (size && !member.hasAttribute("size")) { member.setAttribute("size", size); member.dataset.groupSize = ""; }
      });
      const layout = this.getAttribute("layout") === "spread" || this.getAttribute("layout") === "pie" ? this.getAttribute("layout")! : "stack";
      const visibleLimit = layout === "pie" ? Math.min(3, max) : max;
      const hiddenCount = Math.max(0, members.length - visibleLimit);
      members.forEach((member, index) => {
        member.toggleAttribute("data-spui-avatar-group-hidden", !this.expanded && index >= visibleLimit);
        if (layout === "pie" && index < visibleLimit) {
          member.dataset.pieIndex = String(index);
          member.dataset.pieTotal = String(Math.min(visibleLimit, members.length));
        } else {
          delete member.dataset.pieIndex;
          delete member.dataset.pieTotal;
        }
      });
      this.group.dataset.layout = layout;
      this.group.dataset.expanded = String(this.expanded);
      const groupSize = Number.parseFloat(this.getAttribute("size") || "32");
      this.group.style.setProperty("--spui-avatar-group-size", `${Number.isFinite(groupSize) && groupSize > 0 ? groupSize : 32}px`);
      this.button.hidden = hiddenCount === 0;
      this.button.textContent = `+${hiddenCount}`;
      this.button.setAttribute("aria-expanded", String(this.expanded));
      const more = this.getAttribute("show-more-label") || "Show {count} more people";
      const less = this.getAttribute("show-less-label") || "Show fewer people";
      // Include the visible count so the accessible name contains the button's visible text.
      this.button.setAttribute("aria-label", `+${hiddenCount} ${this.expanded ? less : more.replace("{count}", String(hiddenCount))}`);
    }
  }

  customElements.define("spui-avatar-group", SpuiAvatarGroup);
}
