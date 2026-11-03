import { base } from "./shared.js";

export type TextSize = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000 | 1100 | 1200;
export type TextWeight = "regular" | "medium" | "semibold" | "bold";
export type TextFont = "base" | "monospace" | "numeric";
export type TextTag = "span" | "p" | "div" | "strong" | "b" | "em" | "i" | "small" | "code" | "pre" | "blockquote" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const sizes: Record<string, [string, string]> = {
  "100": ["10px", "14px"], "200": ["12px", "16px"], "300": ["14px", "20px"], "400": ["16px", "22px"],
  "500": ["20px", "28px"], "600": ["24px", "32px"], "700": ["28px", "36px"], "800": ["32px", "40px"],
  "900": ["40px", "52px"], "1000": ["68px", "92px"], "1100": ["80px", "104px"], "1200": ["96px", "128px"],
};
const fluentSizeTokens: Record<string, [string, string]> = {
  "100": ["fontSizeBase100", "lineHeightBase100"], "200": ["fontSizeBase200", "lineHeightBase200"], "300": ["fontSizeBase300", "lineHeightBase300"],
  "400": ["fontSizeBase400", "lineHeightBase400"], "500": ["fontSizeBase500", "lineHeightBase500"], "600": ["fontSizeBase600", "lineHeightBase600"],
  "700": ["fontSizeHero700", "lineHeightHero700"], "800": ["fontSizeHero800", "lineHeightHero800"], "900": ["fontSizeHero900", "lineHeightHero900"], "1000": ["fontSizeHero1000", "lineHeightHero1000"],
};
const extendedSizeTokens: Record<string, [string, string]> = {
  "1100": ["--spui-text-font-size-1100", "--spui-text-line-height-1100"],
  "1200": ["--spui-text-font-size-1200", "--spui-text-line-height-1200"],
};
const tags = new Set<TextTag>(["span", "p", "div", "strong", "b", "em", "i", "small", "code", "pre", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"]);

export function getTextSizeStyles(size: TextSize | string): { fontSize: string; lineHeight: string } {
  const [fallbackSize, fallbackLine] = sizes[size] ?? sizes["300"];
  const fluentTokens = fluentSizeTokens[size];
  const [fontToken, lineToken] = extendedSizeTokens[size] ?? (fluentTokens ? [`--${fluentTokens[0]}`, `--${fluentTokens[1]}`] : [`--${fluentSizeTokens["300"][0]}`, `--${fluentSizeTokens["300"][1]}`]);
  return {
    fontSize: `var(--spui-text-font-size,var(${fontToken},${fallbackSize}))`,
    lineHeight: `var(--spui-text-line-height,var(${lineToken},${fallbackLine}))`,
  };
}

export function defineText(): void {
  if (customElements.get("spui-text")) return;
  class SpuiText extends HTMLElement {
    static observedAttributes = ["as", "size", "weight", "font", "align", "italic", "underline", "strikethrough", "truncate", "wrap", "block"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); else { this.syncTag(); this.syncSize(); } }
    attributeChangedCallback(name: string): void {
      if (!this.isConnected) return;
      if (name === "as") this.syncTag();
      if (name === "size") this.syncSize();
    }
    private tag(): TextTag { const tag = this.getAttribute("as") ?? "span"; return tags.has(tag as TextTag) ? tag as TextTag : "span"; }
    private content(): HTMLElement {
      const content = document.createElement(this.tag());
      content.className = "text";
      content.part.add("content");
      content.append(document.createElement("slot"));
      return content;
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline;vertical-align:baseline}:host([block]),:host([as=p]),:host([as=div]),:host([as=pre]),:host([as=blockquote]),:host([as=h1]),:host([as=h2]),:host([as=h3]),:host([as=h4]),:host([as=h5]),:host([as=h6]){display:block}.text{box-sizing:border-box;margin:0;color:inherit;font-family:var(--spui-font-family,var(--fontFamilyBase,inherit));font-size:var(--spui-text-font-size,var(--fontSizeBase300,14px));font-weight:var(--spui-text-font-weight,var(--fontWeightRegular,400));line-height:var(--spui-text-line-height,var(--lineHeightBase300,20px));text-align:var(--spui-text-align,start);font-style:normal;text-decoration:none;white-space:normal;overflow-wrap:anywhere}:host([as=strong]) .text,:host([as=b]) .text{font-weight:var(--fontWeightBold,700)}:host([as=em]) .text,:host([as=i]) .text{font-style:italic}:host([weight=regular]) .text{font-weight:var(--fontWeightRegular,400)}:host([weight=medium]) .text{font-weight:var(--fontWeightMedium,500)}:host([weight=semibold]) .text{font-weight:var(--fontWeightSemibold,600)}:host([weight=bold]) .text{font-weight:var(--fontWeightBold,700)}:host([font=monospace]) .text{font-family:var(--spui-font-family-mono,var(--fontFamilyMonospace,ui-monospace,monospace))}:host([font=numeric]) .text{font-family:var(--fontFamilyNumeric,var(--fontFamilyBase,inherit));font-variant-numeric:tabular-nums}:host([align=center]) .text{text-align:center}:host([align=end]) .text{text-align:end}:host([align=justify]) .text{text-align:justify}:host([italic]) .text{font-style:italic}:host([underline]) .text{text-decoration:underline;text-underline-offset:.15em}:host([strikethrough]) .text{text-decoration:line-through}:host([underline][strikethrough]) .text{text-decoration-line:underline line-through}:host([truncate]){display:inline-block;max-width:100%;vertical-align:bottom}:host([truncate]) .text{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;overflow-wrap:normal}:host([wrap=false]) .text{white-space:nowrap;overflow-wrap:normal}:host([as=code]) .text,:host([as=pre]) .text{font-family:var(--spui-font-family-mono,var(--fontFamilyMonospace,ui-monospace,monospace))}:host([as=pre]) .text{white-space:pre-wrap;overflow-wrap:anywhere}@media(forced-colors:active){.text{color:CanvasText}}`;
      shadow.replaceChildren(style, this.content());
      this.syncSize();
    }
    private syncTag(): void {
      const content = this.shadowRoot?.querySelector(".text");
      if (content && content.localName !== this.tag()) content.replaceWith(this.content());
    }
    private syncSize(): void {
      const content = this.shadowRoot?.querySelector<HTMLElement>(".text");
      if (!content) return;
      const sizeStyles = getTextSizeStyles(this.getAttribute("size") ?? "300");
      content.style.fontSize = sizeStyles.fontSize;
      content.style.lineHeight = sizeStyles.lineHeight;
    }
  }
  customElements.define("spui-text", SpuiText);
}
