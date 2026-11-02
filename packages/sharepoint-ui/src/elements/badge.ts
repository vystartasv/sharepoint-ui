import { base } from "./shared.js";

export type BadgeAppearance = "filled" | "ghost" | "outline" | "tint";
export type BadgeColor = "brand" | "danger" | "important" | "informative" | "severe" | "subtle" | "success" | "warning";
export type BadgeShape = "circular" | "rounded" | "square";
export type BadgeSize = "tiny" | "extra-small" | "small" | "medium" | "large" | "extra-large";
export type PresenceBadgeStatus = "busy" | "out-of-office" | "away" | "available" | "offline" | "do-not-disturb" | "unknown" | "blocked";

const badgeStyle = `${base}
:host{--badge-size:20px;--badge-pad:6px;--badge-status:var(--spui-ui-accent,var(--colorBrandBackground,#0078d4));--badge-filled-background:var(--spui-ui-accent,var(--colorBrandBackground,#0078d4));--badge-filled-foreground:var(--spui-ui-accent-text,#fff);--badge-filled-border:var(--colorTransparentStroke,transparent);--badge-tint-background:color-mix(in srgb,var(--badge-status) 12%,var(--spui-ui-surface,#fff));--badge-tint-foreground:var(--badge-status);--badge-tint-border:var(--badge-outline-border);--badge-outline-border:var(--badge-status);display:inline-flex;align-items:center;justify-content:center;gap:4px;box-sizing:border-box;min-width:var(--badge-size);min-height:var(--badge-size);padding-inline:var(--badge-pad);border:1px solid var(--badge-outline-border);border-radius:999px;background:var(--badge-filled-background);color:var(--badge-filled-foreground);font:600 12px/1 var(--spui-font-family,inherit);white-space:nowrap;vertical-align:middle}
:host([color=success]){--badge-status:var(--spui-ui-success,#107c10);--badge-color:var(--spui-ui-success-surface,#dff6dd);--badge-foreground:var(--badge-status);--badge-tint:var(--spui-ui-success-surface,#dff6dd)}
:host([color=warning]),:host([color=important]){--badge-status:var(--spui-ui-warning,#835b00);--badge-color:var(--spui-ui-warning-surface,#fff4ce);--badge-foreground:var(--badge-status);--badge-tint:var(--spui-ui-warning-surface,#fff4ce)}
:host([color=danger]),:host([color=severe]){--badge-status:var(--spui-ui-danger,#b10e1c);--badge-color:var(--spui-ui-danger-surface,#fde7e9);--badge-foreground:var(--badge-status);--badge-tint:var(--spui-ui-danger-surface,#fde7e9)}
:host([color=informative]){--badge-status:var(--spui-ui-accent,#0078d4);--badge-color:var(--spui-ui-accent,var(--colorBrandBackground,#0078d4));--badge-tint:color-mix(in srgb,var(--badge-status) 12%,var(--spui-ui-surface,#fff))}
:host([color=subtle]){--badge-status:var(--spui-ui-muted,#616161);--badge-color:color-mix(in srgb,var(--spui-ui-stroke,#d1d1d1) 25%,var(--spui-ui-surface,#fff));--badge-foreground:var(--spui-ui-text,#242424);--badge-tint:var(--badge-color)}
:host([color=brand]){--badge-filled-background:var(--colorBrandBackground,var(--spui-ui-accent,#0078d4));--badge-filled-foreground:var(--colorNeutralForegroundOnBrand,var(--spui-ui-accent-text,#fff));--badge-status:var(--colorBrandForeground1,var(--spui-ui-accent,#0078d4));--badge-tint-background:var(--colorBrandBackground2,color-mix(in srgb,var(--badge-status) 12%,var(--spui-ui-surface,#fff)));--badge-tint-foreground:var(--colorBrandForeground2,var(--badge-status));--badge-tint-border:var(--colorBrandStroke2,var(--badge-status));--badge-outline-border:var(--badge-status)}
:host([color=danger]){--badge-filled-background:var(--colorPaletteRedBackground3,color-mix(in srgb,var(--spui-ui-danger,#b10e1c) 85%,black));--badge-filled-foreground:var(--colorNeutralForegroundOnBrand,#fff);--badge-status:var(--colorPaletteRedForeground3,var(--spui-ui-danger,#b10e1c));--badge-tint-background:var(--colorPaletteRedBackground1,var(--spui-ui-danger-surface,#fde7e9));--badge-tint-foreground:var(--colorPaletteRedForeground1,var(--spui-ui-danger,#b10e1c));--badge-tint-border:var(--colorPaletteRedBorder1,var(--badge-status));--badge-outline-border:var(--colorPaletteRedBorder2,var(--badge-status))}
:host([color=severe]){--badge-filled-background:var(--colorPaletteDarkOrangeBackground3,color-mix(in srgb,var(--spui-ui-warning,#835b00) 88%,black));--badge-filled-foreground:var(--colorNeutralForegroundOnBrand,#fff);--badge-status:var(--colorPaletteDarkOrangeForeground3,var(--spui-ui-warning,#835b00));--badge-tint-background:var(--colorPaletteDarkOrangeBackground1,var(--spui-ui-warning-surface,#fff4ce));--badge-tint-foreground:var(--colorPaletteDarkOrangeForeground1,var(--spui-ui-warning,#835b00));--badge-tint-border:var(--colorPaletteDarkOrangeBorder1,var(--badge-status));--badge-outline-border:var(--badge-status)}
:host([color=success]){--badge-filled-background:var(--colorPaletteGreenBackground3,color-mix(in srgb,var(--spui-ui-success,#107c10) 85%,black));--badge-filled-foreground:var(--colorNeutralForegroundOnBrand,#fff);--badge-status:var(--colorPaletteGreenForeground3,var(--spui-ui-success,#107c10));--badge-tint-background:var(--colorPaletteGreenBackground1,var(--spui-ui-success-surface,#dff6dd));--badge-tint-foreground:var(--colorPaletteGreenForeground1,var(--spui-ui-success,#107c10));--badge-tint-border:var(--colorPaletteGreenBorder1,var(--badge-status));--badge-outline-border:var(--colorPaletteGreenBorder2,var(--badge-status))}
:host([color=warning]){--badge-filled-background:var(--colorPaletteYellowBackground3,color-mix(in srgb,var(--spui-ui-warning,#835b00) 82%,black));--badge-filled-foreground:var(--colorNeutralForeground1Static,#242424);--badge-status:var(--colorPaletteYellowForeground2,var(--spui-ui-warning,#835b00));--badge-tint-background:var(--colorPaletteYellowBackground1,var(--spui-ui-warning-surface,#fff4ce));--badge-tint-foreground:var(--colorPaletteYellowForeground1,var(--spui-ui-warning,#835b00));--badge-tint-border:var(--colorPaletteYellowBorder1,var(--badge-status));--badge-outline-border:var(--badge-status)}
:host([color=important]){--badge-filled-background:var(--colorNeutralForeground1,#242424);--badge-filled-foreground:var(--colorNeutralBackground1,#fff);--badge-status:var(--colorNeutralForeground1,#242424);--badge-tint-background:var(--colorNeutralForeground3,#616161);--badge-tint-foreground:var(--colorNeutralBackground1,#fff);--badge-tint-border:var(--colorTransparentStroke,transparent);--badge-outline-border:var(--colorNeutralStrokeAccessible,#616161)}
:host([color=informative]){--badge-filled-background:var(--colorNeutralBackground5,#e0e0e0);--badge-filled-foreground:var(--colorNeutralForeground3,#616161);--badge-status:var(--colorNeutralForeground3,#616161);--badge-tint-background:var(--colorNeutralBackground4,#f0f0f0);--badge-tint-foreground:var(--colorNeutralForeground3,#616161);--badge-tint-border:var(--colorNeutralStroke2,#d1d1d1);--badge-outline-border:var(--colorNeutralStroke2,#d1d1d1)}
:host([color=subtle]){--badge-filled-background:var(--colorNeutralBackground1,var(--spui-ui-surface,#fff));--badge-filled-foreground:var(--colorNeutralForeground1,var(--spui-ui-text,#242424));--badge-status:var(--colorNeutralForegroundStaticInverted,#fff);--badge-tint-background:var(--colorNeutralBackground1,var(--spui-ui-surface,#fff));--badge-tint-foreground:var(--colorNeutralForeground3,var(--spui-ui-muted,#616161));--badge-tint-border:var(--colorNeutralStroke2,var(--spui-ui-stroke,#d1d1d1));--badge-outline-border:var(--badge-status)}
:host([color=brand]){--badge-outline-foreground:var(--colorBrandForeground1,var(--spui-ui-accent,#0078d4))}:host([color=danger]){--badge-outline-foreground:var(--colorPaletteRedForeground3,var(--spui-ui-danger,#b10e1c))}:host([color=important]){--badge-outline-foreground:var(--colorNeutralForeground3,#616161)}:host([color=informative]){--badge-outline-foreground:var(--colorNeutralForeground3,#616161)}:host([color=severe]){--badge-outline-foreground:var(--colorPaletteDarkOrangeForeground3,var(--spui-ui-warning,#835b00))}:host([color=subtle]){--badge-outline-foreground:var(--colorNeutralForegroundStaticInverted,#fff)}:host([color=success]){--badge-outline-foreground:var(--colorPaletteGreenForeground3,var(--spui-ui-success,#107c10))}:host([color=warning]){--badge-outline-foreground:var(--colorPaletteYellowForeground2,var(--spui-ui-warning,#835b00))}
:host([appearance=ghost]){border-color:transparent;background:transparent;color:var(--badge-status)}
:host([appearance=outline]){background:transparent;color:var(--badge-outline-foreground,var(--badge-status))}
:host([appearance=filled]){border-color:var(--badge-filled-border)}:host([appearance=ghost]){border-color:transparent}:host([appearance=outline]){border-color:var(--badge-outline-border)}:host([appearance=tint]){border-color:var(--badge-tint-border);background:var(--badge-tint-background);color:var(--badge-tint-foreground)}
:host([shape=rounded]){border-radius:6px}:host([shape=square]){border-radius:2px}:host([shape=circular]){border-radius:999px}
:host([size=tiny]){--badge-size:6px;--badge-pad:0;width:6px;min-width:0;min-height:0;height:6px;padding:0;font-size:4px}:host([size=extra-small]){--badge-size:10px;--badge-pad:0;width:10px;min-width:0;min-height:0;height:10px;padding:0;font-size:6px}:host([size=small]){--badge-size:16px;--badge-pad:4px;font-size:10px}:host([size=large]){--badge-size:24px;--badge-pad:7px;font-size:14px}:host([size=extra-large]){--badge-size:32px;--badge-pad:9px;font-size:16px}
.content{display:inline-flex;align-items:center;justify-content:center;order:1}.icon{display:inline-flex;align-items:center;justify-content:center;order:0;line-height:0}slot[name=icon]{display:contents}
:host([icon-position=after]) .icon{order:2}:host([icon-position=after]) .content{order:1}
:host([dot]){width:var(--badge-size);min-width:var(--badge-size);padding:0}:host([dot]) .content,:host([dot]) .icon{display:none}:host([hidden]){display:none}
:host([kind=presence]){position:relative;width:var(--badge-size);min-width:var(--badge-size);padding:0;border-width:1px;background:var(--badge-color)}
:host([kind=presence]){background:var(--colorNeutralBackground1,var(--spui-ui-surface,#fff));border-color:var(--colorTransparentStroke,transparent);color:var(--badge-status)}:host([kind=presence][status=available]){--badge-status:var(--colorPaletteLightGreenForeground3,var(--spui-ui-success,#13a10e))}:host([kind=presence][status=away]){--badge-status:var(--colorPaletteMarigoldBackground3,var(--spui-ui-warning,#835b00))}:host([kind=presence][status=busy]),:host([kind=presence][status=do-not-disturb]),:host([kind=presence][status=blocked]){--badge-status:var(--colorPaletteRedBackground3,var(--spui-ui-danger,#c50f1f))}:host([kind=presence][status=out-of-office]){--badge-status:var(--colorPaletteBerryForeground3,var(--spui-ui-danger,#c50f1f))}:host([kind=presence][status=offline]),:host([kind=presence][status=unknown]){--badge-status:var(--colorNeutralForeground3,var(--spui-ui-muted,#616161))}
:host([kind=presence][status=available]){--badge-color:var(--spui-ui-success-surface,#dff6dd);--badge-foreground:var(--spui-ui-success,#107c10)}
:host([kind=presence][status=away]){--badge-color:var(--spui-ui-warning-surface,#fff4ce);--badge-foreground:var(--spui-ui-warning,#835b00)}
:host([kind=presence][status=busy]),:host([kind=presence][status=do-not-disturb]),:host([kind=presence][status=blocked]),:host([kind=presence][status=out-of-office]){--badge-color:var(--spui-ui-danger-surface,#fde7e9);--badge-foreground:var(--spui-ui-danger,#b10e1c)}
:host([kind=presence][status=offline]),:host([kind=presence][status=unknown]){--badge-color:color-mix(in srgb,var(--spui-ui-stroke,#d1d1d1) 25%,var(--spui-ui-surface,#fff));--badge-foreground:var(--spui-ui-muted,#616161)}
.icon svg{display:block;width:100%;height:100%}:host([kind=presence]) .icon{width:68%;height:68%}
@media(forced-colors:active){:host{border-color:CanvasText}:host([appearance=ghost]),:host([appearance=tint]){color:CanvasText}:host([kind=presence]){background:Canvas;color:CanvasText;border-color:CanvasText}}
@media(prefers-reduced-motion:reduce){:host{transition:none}}`;

function presenceIcon(status: string, outOfOffice: boolean): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 16 16"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  const shape = (name: string, attributes: Record<string, string>) => {
    const element = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    svg.append(element);
  };
  const stroke = { fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" };
  if (status === "available") shape("path", { ...stroke, d: "M3.4 8.2 6.5 11.3 12.8 4.9" });
  else if (status === "away") { shape("circle", { ...stroke, cx: "8", cy: "8", r: "5.4" }); shape("path", { ...stroke, d: "M8 4.8V8l2.3 1.5" }); }
  else if (status === "busy") shape("circle", { cx: "8", cy: "8", r: "4.7", fill: "currentColor" });
  else if (status === "do-not-disturb") { shape("circle", { ...stroke, cx: "8", cy: "8", r: "5.4" }); shape("path", { ...stroke, d: "M5.2 8h5.6" }); }
  else if (status === "offline") shape("circle", { ...stroke, cx: "8", cy: "8", r: "5.1" });
  else if (status === "blocked") { shape("circle", { ...stroke, cx: "8", cy: "8", r: "5.2" }); shape("path", { ...stroke, d: "m4.3 11.7 7.4-7.4" }); }
  else if (status === "out-of-office") { shape("path", { ...stroke, d: "M3.5 13.2V4.5l4.5-2 4.5 2v8.7M2.5 13.2h11M6 6.2h.1M9.9 6.2h.1M7.2 13.1V9.8h1.6v3.3" }); }
  else { shape("path", { ...stroke, d: "M5.8 5.7a2.3 2.3 0 1 1 3.8 1.7c-1 .8-1.6 1.1-1.6 2.3" }); shape("circle", { cx: "8", cy: "12.3", r: ".5", fill: "currentColor" }); }
  if (outOfOffice && status !== "out-of-office") {
    shape("circle", { cx: "12.1", cy: "12.1", r: "3.25", fill: "var(--spui-ui-surface,#fff)", stroke: "var(--spui-ui-danger,#b10e1c)", "stroke-width": ".75" });
    shape("path", { d: "M10.7 13.4v-2.7h2.8v2.7m-1.9-2.7v.9m1-.9v.9", fill: "none", stroke: "var(--spui-ui-danger,#b10e1c)", "stroke-width": ".55", "stroke-linecap": "round", "stroke-linejoin": "round" });
  }
  return svg;
}

function renderBadge(host: HTMLElement, shadow: ShadowRoot, options: { content?: string; icon?: Node; presence?: boolean }): void {
  const style = document.createElement("style"); style.textContent = badgeStyle;
  const content = document.createElement("span"); content.className = "content"; content.part.add("content");
  const defaultSlot = document.createElement("slot");
  if (options.content !== undefined) content.textContent = options.content;
  else content.append(defaultSlot);
  const icon = document.createElement("span"); icon.className = "icon"; icon.part.add("icon");
  const iconSlot = document.createElement("slot"); iconSlot.name = "icon";
  if (options.icon && !host.querySelector('[slot="icon"]')) icon.append(options.icon);
  else icon.append(iconSlot);
  shadow.replaceChildren(style, icon, content);
  if (options.presence) {
    const status = host.getAttribute("status") ?? "available";
    if (host.getAttribute("role") !== "img") host.setAttribute("role", "img");
  }
}

export function defineBadge(): void {
  if (customElements.get("spui-badge")) return;
  class SpuiBadge extends HTMLElement {
    static observedAttributes = ["appearance", "color", "icon-position", "shape", "size"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); }
    attributeChangedCallback(): void { if (this.isConnected) this.render(); }
    private render(): void { renderBadge(this, this.shadowRoot ?? this.attachShadow({ mode: "open" }), {}); }
  }
  customElements.define("spui-badge", SpuiBadge);
}

export function defineCounterBadge(): void {
  if (customElements.get("spui-counter-badge")) return;
  class SpuiCounterBadge extends HTMLElement {
    static observedAttributes = ["appearance", "aria-label", "color", "count", "dot", "overflow-count", "shape", "show-zero", "size"];
    private generatedLabel?: string;
    private customLabel = false;
    connectedCallback(): void { this.render(); }
    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
      if (name === "aria-label") this.customLabel = newValue !== null && newValue !== this.generatedLabel;
      if (this.isConnected) this.render();
    }
    private render(): void {
      const parsedCount = Number(this.getAttribute("count") ?? 0);
      const parsedMax = Number(this.getAttribute("overflow-count") ?? 99);
      const count = Number.isFinite(parsedCount) ? Math.max(0, parsedCount) : 0;
      const max = Number.isFinite(parsedMax) ? Math.max(0, parsedMax) : 99;
      const dot = this.hasAttribute("dot");
      const visible = dot || count > 0 || this.hasAttribute("show-zero");
      this.toggleAttribute("hidden", !visible);
      if (!dot && !this.customLabel) {
        const label = `${count > max ? `${max}+` : count}`;
        this.generatedLabel = label;
        if (this.getAttribute("aria-label") !== label) this.setAttribute("aria-label", label);
      }
      this.setAttribute("kind", "counter");
      const content = dot ? undefined : String(count > max ? `${max}+` : count);
      renderBadge(this, this.shadowRoot ?? this.attachShadow({ mode: "open" }), { content });
    }
  }
  customElements.define("spui-counter-badge", SpuiCounterBadge);
}

export function definePresenceBadge(): void {
  if (customElements.get("spui-presence-badge")) return;
  class SpuiPresenceBadge extends HTMLElement {
    static observedAttributes = ["out-of-office", "size", "status", "aria-label"];
    private generatedLabel?: string;
    private customLabel = false;
    connectedCallback(): void { this.render(); }
    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
      if (name === "aria-label") this.customLabel = newValue !== null && newValue !== this.generatedLabel;
      if (this.isConnected) this.render();
    }
    private render(): void {
      this.setAttribute("kind", "presence");
      const status = this.getAttribute("status") ?? "available";
      if (!this.customLabel) {
        const status = this.getAttribute("status") ?? "available";
        const label = `${status.replaceAll("-", " ")}${this.hasAttribute("out-of-office") && status !== "out-of-office" ? ", out of office" : ""}`;
        this.generatedLabel = label;
        if (this.getAttribute("aria-label") !== label) this.setAttribute("aria-label", label);
      }
      renderBadge(this, this.shadowRoot ?? this.attachShadow({ mode: "open" }), { icon: presenceIcon(status, this.hasAttribute("out-of-office")), presence: true });
    }
  }
  customElements.define("spui-presence-badge", SpuiPresenceBadge);
}
