import { base, stopHostAccessibleNameSync, syncHostAccessibleName } from "./shared.js";

export type ButtonAppearance = "primary" | "secondary" | "outline" | "subtle" | "transparent";
export type ButtonSize = "small" | "medium" | "large";
export type ButtonShape = "rounded" | "circular" | "square";

const buttonCss = `${base}button{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:var(--spui-control-height,32px);padding-inline:var(--spui-control-padding-inline,14px);border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-button-border,var(--colorNeutralStroke1,#8a8886))));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-button-background,var(--colorNeutralBackground1,#fff))));box-shadow:var(--spui-control-shadow,none);color:var(--spui-ui-text,var(--spui-semantic-button-text,var(--colorNeutralForeground1,#323130)));font:inherit;line-height:1.25;text-align:center;text-decoration:none;cursor:pointer;transition:background-color var(--spui-motion-duration-normal,.15s) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1)),border-color var(--spui-motion-duration-normal,.15s) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1)),transform var(--spui-motion-duration-normal,.15s) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}button:hover:not(:disabled):not([aria-disabled=true]){background:var(--spui-button-secondary-hover,color-mix(in srgb,var(--spui-control-background,var(--spui-ui-surface,#fff)) 90%,var(--spui-ui-text,#242424) 10%))}button:active:not(:disabled):not([aria-disabled=true]){transform:scale(.98)}button.primary{border-color:var(--spui-primary-background,var(--spui-ui-accent,var(--spui-semantic-primary-button-background,var(--colorBrandBackground,#0078d4))));background:var(--spui-primary-background,var(--spui-ui-accent,var(--spui-semantic-primary-button-background,var(--colorBrandBackground,#0078d4))));color:var(--spui-ui-accent-text,var(--spui-semantic-primary-button-text,var(--colorNeutralForegroundOnBrand,#fff)))}button.primary:hover:not(:disabled):not([aria-disabled=true]){background:var(--spui-primary-hover,var(--spui-ui-accent-hover,var(--colorBrandBackgroundHover,#106ebe)))}button.primary:active:not(:disabled):not([aria-disabled=true]){background:var(--spui-ui-accent-pressed,var(--colorBrandBackgroundPressed,var(--spui-ui-accent-hover,#106ebe)))}button.outline{background:transparent}button.subtle,button.transparent{border-color:transparent;box-shadow:none}button.subtle{background:var(--spui-button-subtle-background,transparent)}button.transparent{background:transparent}:host([data-spui-appearance=glass]) button:not(.primary),:host-context([data-spui-appearance=glass]) button:not(.primary){backdrop-filter:var(--spui-card-backdrop,blur(16px) saturate(150%))}button:disabled,button[aria-disabled=true]{opacity:.55;cursor:not-allowed}:host([size=small]) button{min-height:24px;padding-inline:8px;font-size:12px}:host([size=large]) button{min-height:40px;padding-inline:16px;font-size:16px}:host([shape=circular]) button{border-radius:999px}:host([shape=square]) button{border-radius:0}:host([data-spui-split-primary]) button{border-start-end-radius:0;border-end-end-radius:0}:host([data-spui-split-trigger]) button{border-start-start-radius:0;border-end-start-radius:0}:host([icon-only]) button{min-width:var(--spui-control-height,32px);padding-inline:0}:host([size=small][icon-only]) button{min-width:24px}:host([size=large][icon-only]) button{min-width:40px}:host([vertical]) button{flex-direction:column}.icon{display:inline-flex;align-items:center;justify-content:center;line-height:0}:host([vertical]) .icon{font-size:24px}.content{display:inline-flex;align-items:center;justify-content:center}:host([icon-position=after]) .icon{order:2}:host([icon-position=after]) .content{order:1}@media(prefers-reduced-motion:reduce){button{transition:none}}@media(forced-colors:active){button{border-color:ButtonText}button.primary{border-color:Highlight;background:Highlight;color:HighlightText}}`;
export const buttonControlCss = buttonCss.replace(/\bbutton(?=[.#:[\s,{])/g, ":is(button,a)");

const buttonSheets = new WeakMap<Document, CSSStyleSheet>();
const buttonSheetUnsupported = new WeakSet<Document>();

function buttonStyleNode(document: Document): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = buttonControlCss;
  return style;
}

function applyButtonStyle(shadow: ShadowRoot, button: HTMLElement): void {
  const document = shadow.ownerDocument;
  let sheet = buttonSheets.get(document);
  if (!sheet && !buttonSheetUnsupported.has(document)) {
    try {
      if (typeof shadow.adoptedStyleSheets === "undefined" || !document.defaultView?.CSSStyleSheet) throw new Error("Constructable stylesheets are unavailable");
      sheet = new document.defaultView.CSSStyleSheet();
      sheet.replaceSync(buttonControlCss);
      buttonSheets.set(document, sheet);
    } catch {
      buttonSheetUnsupported.add(document);
    }
  }
  if (sheet) {
    if (!shadow.adoptedStyleSheets.includes(sheet)) shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];
    shadow.replaceChildren(button);
  } else shadow.replaceChildren(buttonStyleNode(document), button);
}

const unsafeHref = (href: string): boolean => /^(?:javascript|data|vbscript):/i.test(href.trim());

export function defineButton(): void {
  if (customElements.get("spui-button")) return;
  class SpuiButton extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["as", "href", "target", "rel", "download", "hreflang", "referrerpolicy", "form", "formaction", "formenctype", "formnovalidate", "formtarget", "name", "value", "variant", "appearance", "size", "shape", "icon-only", "icon-position", "vertical", "disabled", "disabled-focusable", "type", "tabindex", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-pressed", "aria-expanded", "aria-haspopup", "aria-controls", "aria-current", "aria-disabled", "title"];
    private internals = this.attachInternals();
    private formSubmitter?: HTMLButtonElement;
    private formDisabled = false;
    get form(): HTMLFormElement | null { return this.internals.form; }
    connectedCallback() { this.render(); }
    formDisabledCallback(disabled: boolean) { this.formDisabled = disabled; this.render(); }
    disconnectedCallback() { stopHostAccessibleNameSync(this); this.formSubmitter?.remove(); this.formSubmitter = undefined; }
    attributeChangedCallback(name: string) {
      if (!this.isConnected) return;
      if (name === "aria-label" || name === "aria-labelledby") {
        const button = this.shadowRoot?.querySelector<HTMLElement>("button,a");
        if (button) syncHostAccessibleName(this, button);
        return;
      }
      if (["aria-description", "aria-describedby", "aria-pressed", "aria-expanded", "aria-haspopup", "aria-controls", "title"].includes(name)) {
        const button = this.shadowRoot?.querySelector<HTMLElement>("button,a"); const value = this.getAttribute(name);
        if (button && (name === "aria-description" || name === "aria-describedby")) syncHostAccessibleName(this, button);
        else if (button) value === null ? button.removeAttribute(name) : button.setAttribute(name, value);
        return;
      }
      if (name === "tabindex") {
        const button = this.shadowRoot?.querySelector("button,a"); const value = this.getAttribute(name);
        if (button) value === null ? button.removeAttribute("tabindex") : button.setAttribute("tabindex", value);
        return;
      }
      this.render();
    }
    render() {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open", delegatesFocus: true });
      const previous = shadow.querySelector<HTMLElement>("button,a");
      const restoreFocus = previous !== null && previous === shadow.activeElement;
      const as = this.getAttribute("as") === "a" ? "a" : "button";
      const button = document.createElement(as);
      const type = this.getAttribute("type");
      if (button instanceof HTMLButtonElement) button.type = type === "submit" || type === "reset" ? type : "button";
      const href = this.getAttribute("href")?.trim() ?? "";
      const disabled = this.formDisabled || this.hasAttribute("disabled") || this.getAttribute("aria-disabled") === "true";
      const disabledFocusable = this.hasAttribute("disabled-focusable");
      const inactive = disabled || disabledFocusable;
      const hasHref = as === "a" && !!href && !unsafeHref(href);
      if (button instanceof HTMLAnchorElement) {
        if (!inactive && hasHref) button.href = href;
        for (const name of ["target", "rel", "download", "hreflang", "referrerpolicy"] as const) {
          const value = this.getAttribute(name);
          if (value !== null) button.setAttribute(name, value);
        }
        if (!disabled && button.target.toLowerCase() === "_blank") {
          const rel = new Set((button.getAttribute("rel") ?? "").split(/\s+/).filter(Boolean)); rel.add("noopener"); rel.add("noreferrer"); button.rel = [...rel].join(" ");
        }
        if (inactive) button.setAttribute("aria-disabled", "true");
        if (disabledFocusable) button.tabIndex = this.hasAttribute("tabindex") ? Number(this.getAttribute("tabindex")) : 0;
        else if (!hasHref && !disabled) button.tabIndex = this.hasAttribute("tabindex") ? Number(this.getAttribute("tabindex")) : 0;
        if (hasHref) button.setAttribute("role", "link");
        else button.setAttribute("role", "button");
        button.addEventListener("click", event => { if (disabled || !hasHref) { event.preventDefault(); if (disabled) event.stopPropagation(); } });
        button.addEventListener("keydown", event => {
          if (disabled) {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); }
          } else if (event.key === "Enter") { event.preventDefault(); button.click(); }
          else if (event.key === " ") event.preventDefault();
        });
        button.addEventListener("keyup", event => {
          if (disabled) {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); }
          } else if (event.key === " " && !hasHref) { event.preventDefault(); button.click(); }
        });
      } else {
        button.disabled = disabled && !disabledFocusable;
        if (disabled && disabledFocusable) {
          button.setAttribute("aria-disabled", "true");
          button.addEventListener("click", event => { event.preventDefault(); event.stopImmediatePropagation(); event.stopPropagation(); });
        }
        for (const name of ["formaction", "formenctype", "formmethod", "formnovalidate", "formtarget"]) {
          const value = this.getAttribute(name);
          if (value === null) button.removeAttribute(name); else button.setAttribute(name, value);
        }
      }
      this.syncFormSubmitter(as, type, disabled);
      if (button instanceof HTMLButtonElement && (type === "submit" || type === "reset")) button.addEventListener("click", event => {
        this.syncFormSubmitter(as, type, disabled);
        document.addEventListener("click", () => { if (!event.defaultPrevented && !disabled && this.formSubmitter?.isConnected) this.formSubmitter.click(); }, { once: true });
      });
      if (this.hasAttribute("tabindex")) button.setAttribute("tabindex", this.getAttribute("tabindex")!);
      for (const name of ["aria-description", "aria-describedby", "aria-pressed", "aria-expanded", "aria-haspopup", "aria-controls", "aria-current", "title"]) { const value = this.getAttribute(name); if (value !== null) button.setAttribute(name, value); }
      const appearance = this.getAttribute("appearance") ?? (this.getAttribute("variant") === "primary" ? "primary" : "secondary");
      button.className = appearance === "primary" ? "primary" : appearance === "outline" || appearance === "subtle" || appearance === "transparent" ? appearance : "secondary";
      button.part.add("control");
      const icon = document.createElement("span"); icon.className = "icon"; icon.setAttribute("aria-hidden", "true");
      const iconSlot = document.createElement("slot"); iconSlot.name = "icon"; icon.append(iconSlot);
      iconSlot.addEventListener("slotchange", () => { icon.hidden = !iconSlot.assignedNodes({ flatten: true }).length; });
      icon.hidden = !iconSlot.assignedNodes({ flatten: true }).length;
      const content = document.createElement("span"); content.className = "content"; content.append(document.createElement("slot"));
      button.append(icon, content); applyButtonStyle(shadow, button); syncHostAccessibleName(this, button);
      if (restoreFocus) button.focus();
    }
    private syncFormSubmitter(as: string, type: string | null, disabled: boolean): void {
      if (type !== "submit" && type !== "reset") {
        this.formSubmitter?.remove();
        this.formSubmitter = undefined;
        return;
      }
      const form = as === "button" ? this.internals.form ?? this.closest("form") : null;
      if (!form) {
        this.formSubmitter?.remove();
        this.formSubmitter = undefined;
        return;
      }
      const submitter = this.formSubmitter ?? document.createElement("button");
      submitter.hidden = true;
      submitter.tabIndex = -1;
      submitter.setAttribute("aria-hidden", "true");
      submitter.type = type;
      submitter.disabled = disabled;
      submitter.name = this.getAttribute("name") ?? "";
      submitter.value = this.getAttribute("value") ?? "";
      for (const name of ["formaction", "formenctype", "formmethod", "formnovalidate", "formtarget"]) {
        const value = this.getAttribute(name);
        if (value === null) submitter.removeAttribute(name); else submitter.setAttribute(name, value);
      }
      const formId = this.getAttribute("form");
      if (formId) submitter.setAttribute("form", formId);
      else submitter.removeAttribute("form");
      if (!this.formSubmitter) submitter.addEventListener("click", event => event.stopPropagation());
      if (!this.formSubmitter || submitter.form !== form) form.append(submitter);
      this.formSubmitter = submitter;
    }
  }
  customElements.define("spui-button", SpuiButton);
}
