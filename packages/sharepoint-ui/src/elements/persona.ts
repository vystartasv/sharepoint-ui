import { base } from "./shared.js";
import { defineAvatar } from "./avatar.js";

export type PersonaSize = "extra-small" | "small" | "medium" | "large" | "extra-large" | "huge";
export type PersonaPresence = "available" | "busy" | "do-not-disturb" | "away" | "offline" | "unknown";

const avatarSizes: Record<PersonaSize, number> = { "extra-small": 20, small: 28, medium: 32, large: 36, "extra-large": 40, huge: 56 };
const presenceNames: Record<PersonaPresence, string> = {
  available: "Available", busy: "Busy", "do-not-disturb": "Do not disturb", away: "Away", offline: "Offline", unknown: "Presence unknown"
};

export function definePersona(): void {
  if (customElements.get("spui-persona")) return;
  defineAvatar();
  class SpuiPersona extends HTMLElement {
    static observedAttributes = ["name", "image", "initials", "color", "size", "text-position", "text-alignment", "presence-only", "secondary-text", "tertiary-text", "presence", "presence-label"];

    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }

    private sync(): void {
      const name = this.getAttribute("name") ?? "";
      const avatar = this.shadowRoot?.querySelector<HTMLElement>("spui-avatar");
      if (avatar) {
        avatar.setAttribute("name", name);
        avatar.setAttribute("size", String(avatarSizes[this.getAttribute("size") as PersonaSize] ?? avatarSizes.medium));
        avatar.setAttribute("color", this.getAttribute("color") || "neutral");
        avatar.setAttribute("decorative", "");
        for (const attribute of ["image", "initials"]) {
          const value = this.getAttribute(attribute);
          if (value) avatar.setAttribute(attribute, value); else avatar.removeAttribute(attribute);
        }
      }
      if (avatar) avatar.hidden = this.hasAttribute("presence-only");
      const primary = this.shadowRoot?.querySelector<HTMLElement>(".primary");
      if (primary) primary.textContent = name;
      const secondary = this.shadowRoot?.querySelector<HTMLElement>(".secondary");
      if (secondary) { secondary.textContent = this.getAttribute("secondary-text") ?? ""; secondary.hidden = !secondary.textContent; }
      const tertiary = this.shadowRoot?.querySelector<HTMLElement>(".tertiary");
      if (tertiary) { tertiary.textContent = this.getAttribute("tertiary-text") ?? ""; tertiary.hidden = !tertiary.textContent; }
      const quaternary = this.shadowRoot?.querySelector<HTMLElement>(".quaternary");
      if (quaternary) quaternary.hidden = !quaternary.textContent;
      const presence = this.getAttribute("presence") as PersonaPresence | null;
      const marker = this.shadowRoot?.querySelector<HTMLElement>(".presence");
      const validPresence = presence && Object.hasOwn(presenceNames, presence) ? presence : undefined;
      if (marker) {
        marker.hidden = !validPresence;
        if (validPresence) {
          marker.dataset.presence = validPresence;
          marker.setAttribute("aria-label", this.getAttribute("presence-label") || presenceNames[validPresence]);
          marker.title = this.getAttribute("presence-label") || presenceNames[validPresence];
        } else {
          marker.removeAttribute("aria-label");
          marker.removeAttribute("title");
        }
      }
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{--spui-persona-avatar-size:32px;--spui-persona-gap:10px;display:inline-flex;max-width:100%;min-width:0;color:var(--spui-ui-text,var(--spui-semantic-body-text,var(--colorNeutralForeground1,#242424)));font:inherit;vertical-align:middle}.layout{display:flex;align-items:center;gap:var(--spui-persona-gap);min-width:0;max-width:100%}.avatar-wrap{position:relative;display:grid;place-items:center;flex:none;width:var(--spui-persona-avatar-size);height:var(--spui-persona-avatar-size)}.avatar-fallback{display:grid;width:100%;height:100%}.presence{position:absolute;inset-inline-end:-1px;bottom:-1px;box-sizing:border-box;width:12px;height:12px;border:2px solid var(--spui-base-surface,var(--spui-ui-surface,var(--colorNeutralBackground1,#fff)));border-radius:50%;background:var(--spui-persona-presence-color,#808080)}.presence[data-presence=available]{--spui-persona-presence-color:var(--spui-persona-presence-available,var(--spui-presence-available,var(--spui-semantic-success-text,var(--colorPaletteGreenForeground1,var(--spui-ui-success,#13a10e)))))}.presence[data-presence=busy],.presence[data-presence=do-not-disturb]{--spui-persona-presence-color:var(--spui-persona-presence-busy,var(--spui-presence-busy,var(--spui-semantic-error-text,var(--colorPaletteRedForeground1,var(--spui-ui-danger,#c50f1f)))))}.presence[data-presence=away]{--spui-persona-presence-color:var(--spui-persona-presence-away,var(--spui-presence-away,var(--spui-semantic-warning-text,var(--colorPaletteMarigoldForeground1,var(--spui-ui-warning,#835b00)))))}.presence[data-presence=offline],.presence[data-presence=unknown]{--spui-persona-presence-color:var(--spui-persona-presence-offline,var(--spui-presence-offline,var(--spui-semantic-body-subtext,var(--colorNeutralForeground3,var(--spui-ui-muted,#8a8886)))))}.presence[data-presence=do-not-disturb]{box-shadow:inset 0 0 0 2px var(--spui-base-surface,var(--spui-ui-surface,#fff))}.details{display:flex;flex-direction:column;justify-content:flex-start;min-width:0;max-width:100%;line-height:1.3}.primary,.secondary,.tertiary{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.primary{font-size:14px;font-weight:600;color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424))}.secondary,.tertiary{font-size:12px;color:var(--spui-ui-muted,var(--colorNeutralForeground2,#616161))}.tertiary{font-size:11px}:host([size=extra-small]){--spui-persona-avatar-size:20px;--spui-persona-gap:6px}:host([size=small]){--spui-persona-avatar-size:28px;--spui-persona-gap:8px}:host([size=large]){--spui-persona-avatar-size:36px}:host([size=extra-large]){--spui-persona-avatar-size:40px;--spui-persona-gap:12px}:host([size=huge]){--spui-persona-avatar-size:56px;--spui-persona-gap:14px}:host([size=huge]) .primary{font-size:var(--spui-persona-huge-primary-size,20px)}:host([size=huge]) .secondary{font-size:var(--spui-persona-huge-secondary-size,16px)}:host([text-position=before]) .layout{flex-direction:row-reverse}:host([text-position=below]) .layout{flex-direction:column;align-items:center;text-align:center}:host([text-position=below]) .details{align-items:center}:host([text-position=below]){max-width:12rem}:host([text-alignment=center]) .details{justify-content:center}:host([presence-only]) .avatar-wrap{width:auto;height:auto}:host([presence-only]) .avatar-fallback, :host([presence-only]) slot[name=avatar]{display:none}:host([presence-only]) .presence{position:static;inset:auto;width:16px;height:16px;border-width:0}::slotted([slot=avatar]){display:block;max-width:100%;max-height:100%}::slotted([slot=details]){min-width:0}@media(forced-colors:active){.presence{border-color:Canvas;background:Highlight}.presence[data-presence=offline],.presence[data-presence=unknown]{background:GrayText}}`;
      style.textContent += `::slotted([slot=primary-text]),::slotted([slot=secondary-text]),::slotted([slot=tertiary-text]),::slotted([slot=quaternary-text]){display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}::slotted([slot=primary-text]){font-size:14px;font-weight:600;color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424))}::slotted([slot=secondary-text]),::slotted([slot=quaternary-text]){font-size:12px;color:var(--spui-ui-muted,var(--colorNeutralForeground2,#616161))}::slotted([slot=tertiary-text]){font-size:11px;color:var(--spui-ui-muted,var(--colorNeutralForeground2,#616161))}:host([size=huge])::slotted([slot=primary-text]){font-size:var(--spui-persona-huge-primary-size,20px)}`;
      const layout = document.createElement("span"); layout.className = "layout";
      const avatarWrap = document.createElement("span"); avatarWrap.className = "avatar-wrap"; avatarWrap.part.add("avatar-wrap");
      const avatarSlot = document.createElement("slot"); avatarSlot.name = "avatar";
      const fallback = document.createElement("spui-avatar"); fallback.className = "avatar-fallback"; fallback.part.add("avatar");
      avatarSlot.append(fallback);
      const presence = document.createElement("span"); presence.className = "presence"; presence.part.add("presence"); presence.setAttribute("role", "img");
      avatarWrap.append(avatarSlot, presence);
      const details = document.createElement("span"); details.className = "details"; details.part.add("details");
      const primary = document.createElement("span"); primary.className = "primary"; primary.part.add("primary");
      const secondary = document.createElement("span"); secondary.className = "secondary"; secondary.part.add("secondary");
      const tertiary = document.createElement("span"); tertiary.className = "tertiary"; tertiary.part.add("tertiary");
      const primarySlot = document.createElement("slot"); primarySlot.name = "primary-text"; primarySlot.append(primary);
      const secondarySlot = document.createElement("slot"); secondarySlot.name = "secondary-text"; secondarySlot.append(secondary);
      const tertiarySlot = document.createElement("slot"); tertiarySlot.name = "tertiary-text"; tertiarySlot.append(tertiary);
      const quaternary = document.createElement("span"); quaternary.className = "quaternary"; quaternary.part.add("quaternary"); quaternary.hidden = true;
      const quaternarySlot = document.createElement("slot"); quaternarySlot.name = "quaternary-text"; quaternarySlot.append(quaternary);
      const detailsSlot = document.createElement("slot"); detailsSlot.name = "details";
      details.append(primarySlot, secondarySlot, tertiarySlot, quaternarySlot, detailsSlot);
      layout.append(avatarWrap, details);
      shadow.append(style, layout);
    }
  }
  customElements.define("spui-persona", SpuiPersona);
}
