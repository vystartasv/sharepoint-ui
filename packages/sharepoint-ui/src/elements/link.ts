import { base } from "./shared.js";

const forwarded = ["href", "target", "rel", "download", "hreflang", "referrerpolicy", "title", "type", "media", "ping", "role", "aria-label", "aria-describedby", "aria-current", "tabindex"] as const;
const unsafeSchemes = /^(?:javascript|data|vbscript):/i;

export function defineLink(): void {
  if (customElements.get("spui-link")) return;
  class SpuiLink extends HTMLElement {
    static observedAttributes = [...forwarded, "disabled", "disabled-focusable", "appearance", "underline", "inline", "as"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      const root = this.shadowRoot?.querySelector<HTMLElement>("a,button,span");
      if (!root) return;
      const href = this.getAttribute("href")?.trim() ?? "";
      const as = this.getAttribute("as") || (href ? "a" : "button");
      if (root.localName !== as) { this.renderRoot(as); return; }
      for (const name of forwarded) {
        const value = this.getAttribute(name);
        if (value === null) root.removeAttribute(name); else root.setAttribute(name, value);
      }
      if (as !== "a") root.removeAttribute("href");
      const disabled = this.hasAttribute("disabled") || (as === "a" && (!href || unsafeSchemes.test(href)));
      if (root instanceof HTMLAnchorElement && (disabled || as !== "a")) root.removeAttribute("href");
      if (as === "span") root.setAttribute("role", this.getAttribute("role") || "button");
      if (as === "a" && (disabled || this.hasAttribute("disabled-focusable"))) root.setAttribute("role", this.getAttribute("role") || "link");
      const disabledFocusable = this.hasAttribute("disabled") && this.hasAttribute("disabled-focusable") && (as !== "a" || (!!href && !unsafeSchemes.test(href)));
      if (as === "span" || as === "a") root.tabIndex = this.hasAttribute("tabindex") ? Number(this.getAttribute("tabindex")) : disabled && !disabledFocusable ? -1 : 0;
      else if (this.hasAttribute("tabindex")) root.tabIndex = Number(this.getAttribute("tabindex"));
      if (disabled || this.hasAttribute("disabled-focusable")) root.setAttribute("aria-disabled", "true");
      else root.removeAttribute("aria-disabled");
      if (root instanceof HTMLButtonElement) root.disabled = disabled && !disabledFocusable;
      if (root instanceof HTMLButtonElement && !root.hasAttribute("type")) root.type = "button";
      if (disabled) root.removeAttribute("target");
      if (!disabled && this.getAttribute("target")?.toLowerCase() === "_blank") {
        const rel = new Set((this.getAttribute("rel") ?? "").split(/\s+/).filter(Boolean));
        rel.add("noopener"); rel.add("noreferrer"); root.setAttribute("rel", [...rel].join(" "));
      }
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline;color:var(--spui-link-color,var(--spui-semantic-link,var(--colorBrandForeground1,#115ea3)))}a,button,span{box-sizing:border-box;background:transparent;border:0;color:inherit;font:inherit;text-align:inherit;text-decoration:none;cursor:pointer;padding:0;margin:0}a,span{display:inline}button{display:inline}a:visited{color:var(--spui-link-visited,var(--spui-semantic-link-visited,var(--colorBrandForeground2,#4f52b2)))}a:hover,button:hover,span:hover{text-decoration:underline}a:focus-visible,button:focus-visible,span:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#005a9e));outline-offset:2px} [aria-disabled=true]{color:var(--spui-ui-foreground-disabled,var(--spui-ui-muted,#777));cursor:not-allowed;text-decoration:none}[aria-disabled=true]:hover,[aria-disabled=true]:active{text-decoration:none}@media(forced-colors:active){[aria-disabled=true]{color:GrayText}}:host([underline=always]) a,:host([underline=always]) button,:host([underline=always]) span{text-decoration:underline;text-decoration-thickness:from-font;text-underline-offset:2px}:host([underline=hover]) a,:host([underline=hover]) button,:host([underline=hover]) span{text-decoration:none}:host([underline=hover]) a:hover,:host([underline=hover]) button:hover,:host([underline=hover]) span:hover,:host([underline=hover]) a:focus-visible,:host([underline=hover]) button:focus-visible,:host([underline=hover]) span:focus-visible,:host([inline]) a,:host([inline]) button,:host([inline]) span{text-decoration:underline}:host([appearance=subtle]){color:var(--spui-ui-text,var(--spui-semantic-body-text,#323130))}:host([appearance=subtle]) a:visited{color:inherit}`;
      shadow.append(style);
      this.renderRoot(this.getAttribute("as") || (this.getAttribute("href") ? "a" : "button"));
      this.addEventListener("click", event => { if (this.isDisabled()) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
      this.addEventListener("keydown", event => { if (this.isDisabled() && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); event.stopImmediatePropagation(); } else if (this.shadowRoot?.querySelector("span") && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); this.shadowRoot.querySelector("span")?.click(); } }, true);
    }
    private isDisabled(): boolean { const href = this.getAttribute("href")?.trim() ?? ""; return this.hasAttribute("disabled") || this.hasAttribute("disabled-focusable") || (this.getAttribute("as") === "a" || (!this.hasAttribute("as") && !!href)) && (!href || unsafeSchemes.test(href)); }
    private renderRoot(as: string): void {
      if (!this.shadowRoot) return;
      const root = document.createElement(["a", "button", "span"].includes(as) ? as : "span");
      root.part.add("link"); root.append(document.createElement("slot"));
      this.shadowRoot.querySelector("a,button,span")?.replaceWith(root) ?? this.shadowRoot.append(root);
      this.sync();
    }
  }
  customElements.define("spui-link", SpuiLink);
}
