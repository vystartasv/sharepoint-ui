export type LabelSize = "small" | "medium" | "large";
export type LabelWeight = "regular" | "semibold";
export type LabelOptions = { htmlFor?: string; size?: LabelSize; weight?: LabelWeight; required?: boolean | string | Node; disabled?: boolean; id?: string; title?: string };

const styledDocuments = new WeakSet<Document>();

export function ensureLabelStyles(document: Document): void {
  if (styledDocuments.has(document)) return;
  if (document.querySelector("style[data-spui-label-styles]")) { styledDocuments.add(document); return; }
  const style = document.createElement("style");
  style.dataset.spuiLabelStyles = "";
  style.textContent = "@media(forced-colors:active){.spui-label[data-disabled=true],.spui-label[data-disabled=true] .spui-label-required{color:GrayText!important}}";
  (document.head ?? document.documentElement).append(style);
  styledDocuments.add(document);
}

const sizes: Record<LabelSize, [string, string, string]> = {
  small: ["200", "12px", "16px"], medium: ["300", "14px", "20px"], large: ["400", "16px", "22px"],
};

export function getLabelStyle(size: LabelSize = "medium", disabled = false, weight: LabelWeight = "regular"): Record<string, string | number> {
  const [token, fallback, line] = sizes[size];
  return {
    display: "inline-flex", alignItems: "baseline", gap: "0.25em",
    fontFamily: "var(--spui-font-family,var(--fontFamilyBase,inherit))", fontSize: `var(--fontSizeBase${token},${fallback})`,
    fontWeight: weight === "semibold" || size === "large" ? "var(--fontWeightSemibold,600)" : "var(--fontWeightRegular,400)", lineHeight: `var(--lineHeightBase${token},${line})`, cursor: disabled ? "default" : "pointer",
    color: disabled ? "var(--spui-ui-foreground-disabled,var(--spui-semantic-disabled-text,var(--colorNeutralForegroundDisabled,#bdbdbd)))" : "var(--spui-ui-text,var(--spui-semantic-body-text,inherit))",
  };
}

/** Create a real native label so `for` association and click-to-focus work across frameworks. */
export function createLabel(content: string | Node, options: LabelOptions = {}): HTMLLabelElement {
  const label = document.createElement("label");
  ensureLabelStyles(label.ownerDocument);
  label.className = "spui-label";
  if (options.htmlFor) label.htmlFor = options.htmlFor;
  if (options.id) label.id = options.id;
  if (options.title) label.title = options.title;
  label.dataset.size = options.size ?? "medium";
  label.dataset.disabled = String(Boolean(options.disabled));
  Object.assign(label.style, getLabelStyle(options.size, options.disabled, options.weight));
  label.append(typeof content === "string" ? document.createTextNode(content) : content);
  if (options.required) {
    const marker = document.createElement("span");
    marker.className = "spui-label-required";
    marker.setAttribute("aria-hidden", "true");
    if (options.required === true) marker.textContent = "*";
    else if (typeof options.required === "string") marker.textContent = options.required;
    else marker.append(options.required);
    Object.assign(marker.style, { color: options.disabled ? "var(--spui-ui-foreground-disabled,var(--spui-semantic-disabled-text,var(--colorNeutralForegroundDisabled,#bdbdbd)))" : "var(--spui-label-required-color,var(--colorPaletteRedForeground3,var(--spui-semantic-error-text,#c50f1f)))", paddingInlineStart: "var(--spui-label-required-gap,var(--spacingHorizontalXS,4px))" });
    label.append(marker);
  }
  return label;
}
