import { base } from "./shared.js";

type AvatarInstance = HTMLElement & { refreshThemeColor(): void };
type AvatarThemeWatch = { instances: Set<AvatarInstance>; observer: MutationObserver };
const themeWatches = new WeakMap<HTMLElement, AvatarThemeWatch>();

export type AvatarNamedColor = "dark-red" | "cranberry" | "red" | "pumpkin" | "peach" | "marigold" | "gold" | "brass" | "brown" | "forest" | "seafoam" | "dark-green" | "light-teal" | "teal" | "steel" | "blue" | "royal-blue" | "cornflower" | "navy" | "lavender" | "purple" | "grape" | "lilac" | "pink" | "magenta" | "plum" | "beige" | "mink" | "platinum" | "anchor";
export type AvatarColor = "neutral" | "brand" | "colorful" | AvatarNamedColor;

const namedColorTokens: Record<AvatarNamedColor, { token: string; fallback: string }> = {
  "dark-red": { token: "DarkRed", fallback: "#d69ca5" }, cranberry: { token: "Cranberry", fallback: "#eeacb2" }, red: { token: "Red", fallback: "#f1bbbc" },
  pumpkin: { token: "Pumpkin", fallback: "#efc4ad" }, peach: { token: "Peach", fallback: "#ffddb3" }, marigold: { token: "Marigold", fallback: "#f9e2ae" },
  gold: { token: "Gold", fallback: "#ecdfa5" }, brass: { token: "Brass", fallback: "#e0cea2" }, brown: { token: "Brown", fallback: "#ddc3b0" },
  forest: { token: "Forest", fallback: "#bdd99b" }, seafoam: { token: "Seafoam", fallback: "#a8f0cd" }, "dark-green": { token: "DarkGreen", fallback: "#9ad29a" },
  "light-teal": { token: "LightTeal", fallback: "#a6e9ed" }, teal: { token: "Teal", fallback: "#9bd9db" }, steel: { token: "Steel", fallback: "#94c8d4" },
  blue: { token: "Blue", fallback: "#a9d3f2" }, "royal-blue": { token: "RoyalBlue", fallback: "#9abfdc" }, cornflower: { token: "Cornflower", fallback: "#c8d1fa" },
  navy: { token: "Navy", fallback: "#a3b2e8" }, lavender: { token: "Lavender", fallback: "#d2ccf8" }, purple: { token: "Purple", fallback: "#c6b1de" },
  grape: { token: "Grape", fallback: "#d9a7e0" }, lilac: { token: "Lilac", fallback: "#e6bfed" }, pink: { token: "Pink", fallback: "#f7c0e3" },
  magenta: { token: "Magenta", fallback: "#eca5d1" }, plum: { token: "Plum", fallback: "#d696c0" }, beige: { token: "Beige", fallback: "#d7d4d4" },
  mink: { token: "Mink", fallback: "#cecccb" }, platinum: { token: "Platinum", fallback: "#cdd6d8" }, anchor: { token: "Anchor", fallback: "#bcc3c7" }
};

/** Small, theme-aware people and entity marker. Images are optional; name/initials are the fast fallback. */
export function defineAvatar(): void {
  if (customElements.get("spui-avatar")) return;
  class SpuiAvatar extends HTMLElement {
    static observedAttributes = ["name", "image", "initials", "size", "shape", "color", "id-for-color", "decorative"];
    private imageSource = "";
    private themeRoot?: HTMLElement;
    private readonly image = document.createElement("img");
    private readonly initials = document.createElement("span");
    private readonly fallback = document.createElement("span");
    private readonly surface = document.createElement("span");

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.sync();
      this.watchTheme();
    }

    disconnectedCallback(): void {
      this.unwatchTheme();
    }

    attributeChangedCallback(): void {
      this.sync();
      if (this.isConnected) {
        this.unwatchTheme();
        this.watchTheme();
      }
    }

    refreshThemeColor(): void {
      const color = this.getAttribute("color");
      const named = namedColorTokens[color as AvatarNamedColor];
      if (named) {
        this.dataset.namedColor = "";
        this.style.setProperty("--spui-avatar-colorful-background", `var(--colorPalette${named.token}Background2, color-mix(in srgb, ${named.fallback} 18%, var(--spui-ui-surface, #fff)))`);
        this.style.setProperty("--spui-avatar-colorful-foreground", `var(--colorPalette${named.token}Foreground2, var(--spui-ui-text, var(--spui-semantic-body-text, #242424)))`);
        this.style.setProperty("--spui-avatar-active-color", `var(--colorPalette${named.token}BorderActive, var(--spui-ui-accent, #78716c))`);
        return;
      }
      delete this.dataset.namedColor;
      this.style.removeProperty("--spui-avatar-active-color");
      if (color !== "colorful") return;
      const key = this.getAttribute("name") || this.getAttribute("id-for-color") || "sharepoint-ui";
      const hash = hashString(key);
      const rawColor = getComputedStyle(this).getPropertyValue("--spui-palette-theme-primary").trim()
        || getComputedStyle(this).getPropertyValue("--spui-ui-accent").trim()
        || "#78716c";
      const rgb = parseColor(rawColor);
      const shade = 0.18 + (hash % 5) * 0.1;
      const derived = rgb?.map(channel => Math.round(channel * (1 - shade))) as [number, number, number] | undefined;
      const derivedColor = derived ? `#${derived.map(channel => channel.toString(16).padStart(2, "0")).join("")}` : rawColor;
      this.style.setProperty("--spui-avatar-colorful-background", derivedColor);
      this.style.setProperty("--spui-avatar-colorful-foreground", derived ? (relativeLuminance(derived) > 0.179 ? "#000000" : "#ffffff") : "var(--spui-semantic-primary-button-text, #ffffff)");
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      this.surface.className = "surface";
      this.surface.part.add("surface");
      this.image.className = "image";
      this.image.part.add("image");
      this.image.alt = "";
      this.image.loading = "lazy";
      this.image.decoding = "async";
      this.image.addEventListener("load", () => { this.dataset.imageState = "loaded"; });
      this.image.addEventListener("error", () => { this.dataset.imageState = "error"; });
      this.initials.className = "initials";
      this.initials.part.add("initials");
      this.fallback.className = "fallback";
      this.fallback.part.add("fallback");
      this.fallback.setAttribute("aria-hidden", "true");
      this.fallback.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5Z"/></svg>';
      this.surface.append(this.image, this.initials, this.fallback);
      const style = document.createElement("style");
      style.textContent = `${base}:host{--spui-avatar-size:32px;display:inline-grid;flex:none;width:var(--spui-avatar-size);height:var(--spui-avatar-size);vertical-align:middle;line-height:1}:host([size]){width:var(--spui-avatar-size);height:var(--spui-avatar-size)}.surface{position:relative;box-sizing:border-box;display:grid;place-items:center;width:100%;height:100%;overflow:hidden;border:1px solid var(--spui-avatar-border,var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1)));border-radius:var(--spui-avatar-radius,50%);background:var(--spui-avatar-background,var(--spui-semantic-body-subtext,var(--colorNeutralBackground3,#f0f0f0)));color:var(--spui-avatar-foreground,var(--spui-semantic-body-text,var(--colorNeutralForeground1,#323130)));font:600 calc(var(--spui-avatar-size) * .36)/1 var(--spui-font-family,inherit);user-select:none}.image{position:absolute;inset:0;z-index:1;width:100%;height:100%;object-fit:cover}.initials{z-index:0;max-width:100%;overflow:hidden;padding:0 2px;text-overflow:clip;white-space:nowrap}.fallback{z-index:0;display:grid;place-items:center;width:62%;height:62%;color:currentColor}.initials:not(:empty)~.fallback{display:none}.fallback svg{display:block;width:100%;height:100%;fill:currentColor}:host([data-image-state=loading]) .image,:host([data-image-state=error]) .image{visibility:hidden}:host([data-image-state=loaded]) .initials,:host([data-image-state=loaded]) .fallback{visibility:hidden}:host([shape=square]) .surface{border-radius:var(--spui-avatar-radius,var(--spui-control-radius,6px))}:host([color=brand]) .surface{background:var(--spui-avatar-brand-background,var(--spui-semantic-primary-button-background,var(--colorBrandBackground,var(--spui-avatar-active-color,var(--spui-ui-accent,#78716c)))));color:var(--spui-avatar-brand-foreground,var(--spui-semantic-primary-button-text,var(--colorNeutralForegroundOnBrand,#fff)))}:host([color=colorful]) .surface,:host([data-named-color]) .surface{background:var(--spui-avatar-colorful-background,var(--spui-semantic-primary-button-background,var(--colorBrandBackground,var(--spui-avatar-active-color,var(--spui-ui-accent,#78716c)))));color:var(--spui-avatar-colorful-foreground,var(--spui-semantic-primary-button-text,#fff))}:host([active=active]:not([active-appearance])) .surface,:host([active=active][active-appearance=ring]) .surface{box-shadow:0 0 0 2px var(--spui-ui-surface,#fff),0 0 0 4px var(--spui-avatar-active-color,var(--spui-ui-accent,#78716c))}:host([active=active][active-appearance=shadow]) .surface{box-shadow:var(--spui-avatar-active-shadow,var(--spui-card-shadow,0 2px 8px rgb(0 0 0 / 24%)))}:host([active=active][active-appearance=ring-shadow]) .surface{box-shadow:0 0 0 2px var(--spui-ui-surface,#fff),0 0 0 4px var(--spui-avatar-active-color,var(--spui-ui-accent,#78716c)),var(--spui-avatar-active-shadow,var(--spui-card-shadow,0 2px 8px rgb(0 0 0 / 24%)))}:host([active=inactive]){opacity:.56}:host([data-custom-icon=true]) .initials,:host([data-custom-icon=true]) .fallback{display:none}:host([data-custom-icon=true]) .icon{z-index:0;display:grid;place-items:center;width:70%;height:70%;color:inherit}:host([data-custom-badge=true]) .badge{position:absolute;z-index:2;inset-block-end:0;inset-inline-end:0;display:grid;place-items:center;min-width:var(--spui-avatar-badge-size,10px);min-height:var(--spui-avatar-badge-size,10px);border:2px solid var(--spui-avatar-badge-border,var(--spui-ui-surface,#fff));border-radius:50%;background:var(--spui-avatar-badge-background,var(--spui-semantic-success-background,#13a10e));color:var(--spui-avatar-badge-foreground,#fff);font:600 9px/1 var(--spui-font-family,inherit)}:host(:not([data-custom-badge=true])) .badge{display:none}@media(forced-colors:active){.surface{border-color:CanvasText;background:Canvas;color:CanvasText;forced-color-adjust:none}:host([data-named-color]) .surface{border-color:CanvasText;background:Canvas;color:CanvasText}.image{forced-color-adjust:auto}:host([active=active]) .surface{outline:2px solid Highlight;outline-offset:2px;box-shadow:none}}`;
      style.textContent += `.surface{background:var(--spui-avatar-background,var(--spui-palette-neutral-light,var(--colorNeutralBackground3,#f0f0f0)));font-size:clamp(10px,calc(var(--spui-avatar-size) * .36),48px)}`;
      style.textContent += `@media(forced-colors:active){.surface{border-color:CanvasText;background:Canvas;color:CanvasText}}`;
      const icon = document.createElement("span"); icon.className = "icon"; icon.part.add("icon"); icon.append(document.createElement("slot")); icon.firstElementChild!.setAttribute("name", "icon");
      const badge = document.createElement("span"); badge.className = "badge"; badge.part.add("badge"); badge.append(document.createElement("slot")); badge.firstElementChild!.setAttribute("name", "badge");
      const iconSlot = icon.firstElementChild as HTMLSlotElement;
      const badgeSlot = badge.firstElementChild as HTMLSlotElement;
      iconSlot.addEventListener("slotchange", () => this.toggleAttribute("data-custom-icon", iconSlot.assignedNodes({ flatten: true }).length > 0));
      badgeSlot.addEventListener("slotchange", () => this.toggleAttribute("data-custom-badge", badgeSlot.assignedNodes({ flatten: true }).length > 0));
      this.surface.append(icon, badge);
      shadow.append(style, this.surface);
    }

    private sync(): void {
      if (!this.shadowRoot) return;
      const size = this.getAttribute("size")?.trim() || "32px";
      const normalizedSize = /^\d+(?:\.\d+)?$/.test(size) ? `${size}px` : size;
      this.style.setProperty("--spui-avatar-size", CSS.supports("width", normalizedSize) ? normalizedSize : "32px");
      const shape = this.getAttribute("shape") === "square" ? "square" : "circular";
      this.dataset.shape = shape;
      if (this.getAttribute("shape") !== shape) this.setAttribute("shape", shape);
      const color = this.getAttribute("color");
      if (!color || (!(["neutral", "brand", "colorful"] as string[]).includes(color) && !Object.hasOwn(namedColorTokens, color))) this.setAttribute("color", "neutral");

      const name = this.getAttribute("name")?.trim() ?? "";
      const locale = this.closest("[lang]")?.getAttribute("lang") || this.ownerDocument.documentElement.lang || undefined;
      const initials = this.getAttribute("initials")?.trim() || getInitials(name, Number.parseFloat(this.style.getPropertyValue("--spui-avatar-size")), locale, getComputedStyle(this).direction === "rtl");
      this.initials.textContent = initials;
      const source = this.getAttribute("image")?.trim() ?? "";
      if (source !== this.imageSource) {
        this.imageSource = source;
        if (source) {
          this.setAttribute("data-image-state", "loading");
          this.image.src = source;
        } else {
          this.image.removeAttribute("src");
          this.setAttribute("data-image-state", "none");
        }
      } else if (source && !this.dataset.imageState) this.setAttribute("data-image-state", "loading");

      const decorative = this.hasAttribute("decorative");
      const hasExplicitName = (this.hasAttribute("aria-label") && this.dataset.autoLabel === undefined) || this.hasAttribute("aria-labelledby");
      const accessibleName = name || initials;
      if (decorative || (!hasExplicitName && !accessibleName)) {
        if (this.dataset.autoLabel !== undefined) { this.removeAttribute("aria-label"); delete this.dataset.autoLabel; }
        if (!this.hasAttribute("aria-hidden")) { this.setAttribute("aria-hidden", "true"); this.dataset.autoHidden = ""; }
        if (!this.hasAttribute("role")) { this.setAttribute("role", "presentation"); this.dataset.autoRole = ""; }
      } else {
        if (this.dataset.autoHidden !== undefined) { this.removeAttribute("aria-hidden"); delete this.dataset.autoHidden; }
        if (this.dataset.autoRole !== undefined) { this.removeAttribute("role"); delete this.dataset.autoRole; }
        if (!this.hasAttribute("role")) { this.setAttribute("role", "img"); this.dataset.autoRole = ""; }
        if (!this.hasAttribute("aria-labelledby") && (!this.hasAttribute("aria-label") || this.dataset.autoLabel !== undefined)) {
          this.setAttribute("aria-label", accessibleName);
          this.dataset.autoLabel = "";
        }
      }
      this.refreshThemeColor();
    }

    private watchTheme(): void {
      if (this.getAttribute("color") !== "colorful" || !this.isConnected) return;
      const root = this.closest<HTMLElement>("[data-spui-appearance]");
      if (!root) return;
      this.unwatchTheme();
      this.themeRoot = root;
      let watch = themeWatches.get(root);
      if (!watch) {
        const instances = new Set<AvatarInstance>();
        const observer = new MutationObserver(() => instances.forEach(avatar => avatar.refreshThemeColor()));
        observer.observe(root, { attributes: true, attributeFilter: ["style"] });
        watch = { instances, observer };
        themeWatches.set(root, watch);
      }
      watch.instances.add(this);
    }

    private unwatchTheme(): void {
      if (!this.themeRoot) return;
      const watch = themeWatches.get(this.themeRoot);
      watch?.instances.delete(this);
      if (watch && watch.instances.size === 0) { watch.observer.disconnect(); themeWatches.delete(this.themeRoot); }
      this.themeRoot = undefined;
    }
  }

  customElements.define("spui-avatar", SpuiAvatar);
}

function getInitials(name: string, size: number, locale?: string, rtl = false): string {
  const words = name.replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const selectedWords = size <= 20 ? [words[0]] : words.length === 2 ? words : words.length === 3 ? [words[0], words[2]] : [words[0]];
  let initials = selectedWords.map(word => firstGrapheme(word, locale)).join("");
  try { initials = initials.toLocaleUpperCase(locale); } catch { initials = initials.toUpperCase(); }
  const characters = Array.from(initials);
  return rtl && characters.length > 1 ? characters.reverse().join("") : initials;
}

function firstGrapheme(value: string, locale?: string): string {
  const Segmenter = (Intl as typeof Intl & { Segmenter?: new (locales?: string | string[], options?: { granularity: "grapheme" }) => { segment(input: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Segmenter) {
    try { return [...new Segmenter(locale, { granularity: "grapheme" }).segment(value)][0]?.segment ?? ""; }
    catch { /* Fall through for unsupported locale tags or older engines. */ }
  }
  return Array.from(value.normalize("NFC"))[0] ?? "";
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  return hash >>> 0;
}

function parseColor(value: string): [number, number, number] | null {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
  if (hex) {
    const expanded = hex[1].length === 3 ? [...hex[1]].map(character => character + character).join("") : hex[1];
    return [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16)) as [number, number, number];
  }
  const rgb = /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i.exec(value);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

function relativeLuminance([red, green, blue]: [number, number, number]): number {
  const linear = (channel: number) => { const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; };
  return linear(red) * 0.2126 + linear(green) * 0.7152 + linear(blue) * 0.0722;
}
