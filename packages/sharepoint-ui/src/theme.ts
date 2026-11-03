import { getSharePointUIStyleTokens, type SharePointUIAppearance, type SharePointUIBaseAppearance, type SharePointUIDensity, type SharePointUIStyleTokens } from "./appearance.js";

/** SPFx theme data is copied through without a lossy, hand-maintained token allowlist. */
export type SharePointTheme = {
  palette?: Record<string, string | undefined>;
  semanticColors?: Record<string, string | undefined>;
  /** Raw Fluent v8 theme tokens exposed as `--spui-effects-*`, `--spui-spacing-*`, and `--spui-fonts-*-*` variables. */
  effects?: Record<string, string | undefined>;
  spacing?: Record<string, string | undefined>;
  fonts?: Record<string, Record<string, string | number | undefined> | undefined>;
  defaultFontStyle?: Record<string, string | number | undefined>;
  isInverted?: boolean;
};

export type FluentThemeTokens = Record<string, string | number | undefined>;

/** Semantic theme values are translated to the library's shared design tokens. */
export type SharePointUIDesignTheme = {
  /** Raw named SharePoint palette values, exposed as `--spui-palette-*` CSS variables. `themePrimary` also seeds the accent when no explicit accent is set. */
  palette?: Record<string, string>;
  /** Any Fluent v9 theme values, exposed under their native CSS variable names and composable with the other design-pack groups. */
  fluentTokens?: FluentThemeTokens;
  /** Brand input for an automatically tinted accent scale. Hex values also get an AA-aware on-accent foreground; other CSS colors can set colors.accentForeground explicitly. */
  brandColor?: string;
  /** App- or component-specific CSS custom properties, merged after semantic roles and before direct provider tokens. */
  customProperties?: Record<`--${string}`, string | number>;
  colors?: {
    accent?: string; accentHover?: string; accentPressed?: string; accentSubtle?: string; accentSubtleHover?: string; accentSubtlePressed?: string; accentForeground?: string; secondaryHover?: string;
    foreground?: string; foregroundMuted?: string; foregroundTertiary?: string; foregroundSubtle?: string; foregroundDisabled?: string;
    canvas?: string; surface?: string; surfaceHover?: string; surfaceAlt?: string; surfaceSecondary?: string; surfaceSubtle?: string; surfaceRaised?: string; surfaceSunken?: string;
    border?: string; borderSubtle?: string; borderStrong?: string; borderFocus?: string; borderDisabled?: string; selectedBackground?: string; selectedBackgroundHover?: string; selectedForeground?: string; selectedBorder?: string; link?: string; linkVisited?: string; overlay?: string;
    info?: string; infoSurface?: string; success?: string; successSurface?: string; warning?: string; warningSurface?: string; danger?: string; dangerSurface?: string;
    focus?: string; focusRing?: string;
  };
  typography?: {
    fontFamily?: string; fontFamilyMono?: string;
    fontSize?: string; fontSizeSmall?: string; fontSizeLarge?: string; fontSizeHeading?: string;
    fontWeight?: string | number; fontWeightStrong?: string | number; lineHeight?: string; lineHeightHeading?: string;
    /** Fluent-compatible type ramp; values flow to the same CSS variables used by the component styles. */
    fontSize100?: string; fontSize200?: string; fontSize300?: string; fontSize400?: string; fontSize500?: string; fontSize600?: string; fontSize700?: string; fontSize800?: string; fontSize900?: string; fontSize1000?: string; fontSize1100?: string; fontSize1200?: string;
    lineHeight100?: string; lineHeight200?: string; lineHeight300?: string; lineHeight400?: string; lineHeight500?: string; lineHeight600?: string; lineHeight700?: string; lineHeight800?: string; lineHeight900?: string; lineHeight1000?: string; lineHeight1100?: string; lineHeight1200?: string;
    fontWeightRegular?: string | number; fontWeightMedium?: string | number; fontWeightSemibold?: string | number; fontWeightBold?: string | number;
    letterSpacing?: string;
  };
  spacing?: {
    controlHeight?: string; controlGap?: string; controlPaddingInline?: string; controlPaddingBlock?: string;
    cardPadding?: string; fieldGap?: string; sectionGap?: string; listGap?: string; touchTargetMin?: string;
  };
  shape?: { controlRadius?: string; inputRadius?: string; cardRadius?: string; surfaceRadius?: string; pillRadius?: string; focusRingWidth?: string };
  elevation?: { cardShadow?: string; controlShadow?: string; popoverShadow?: string; overlayShadow?: string; focusShadow?: string };
  /** Material controls tune theme-derived translucent surfaces without replacing their brand or neutral colors. */
  materials?: { glassBlur?: string; glassSaturation?: string; glassSurfaceOpacity?: string; glassCanvasOpacity?: string; glassBorderOpacity?: string };
  motion?: { durationFast?: string; durationNormal?: string; durationSlow?: string; easingStandard?: string; easingEmphasized?: string };
  /** Shared stacking order for menus, floating pickers, and notifications. Browser top-layer surfaces remain above these layers. */
  layers?: { dropdown?: string | number; popover?: string | number; toast?: string | number };
};

export type SharePointThemeColorPreset = { name: string; value: string; color: string; label: string };

/** Build named swatches from the current SharePoint palette; custom tenant keys are preserved. */
export function getSharePointThemeColorPresets(palette?: Readonly<Record<string, string | undefined>>, labelForKey?: (key: string) => string): SharePointThemeColorPreset[] {
  return Object.entries(palette ?? {}).flatMap(([name, color]) => {
    if (typeof color !== "string" || !color.trim()) return [];
    const readableName = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Za-z])(\d+)/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^theme\s+/i, "").replace(/\s+/g, " ").trim();
    const label = labelForKey?.(name) ?? readableName.replace(/\b[a-z]/g, character => character.toUpperCase());
    return [{ name, value: name, color, label }];
  });
}

/** Compose reusable theme packs left-to-right; later packs override earlier values within each group. */
export function composeSharePointUIDesignThemes(...themes: Array<SharePointUIDesignTheme | undefined>): SharePointUIDesignTheme {
  return themes.reduce<SharePointUIDesignTheme>((merged, theme) => ({
    ...merged,
    ...theme,
    palette: { ...merged.palette, ...theme?.palette },
    fluentTokens: { ...merged.fluentTokens, ...theme?.fluentTokens },
    colors: { ...merged.colors, ...theme?.colors },
    typography: { ...merged.typography, ...theme?.typography },
    spacing: { ...merged.spacing, ...theme?.spacing },
    shape: { ...merged.shape, ...theme?.shape },
    elevation: { ...merged.elevation, ...theme?.elevation },
    materials: { ...merged.materials, ...theme?.materials },
    motion: { ...merged.motion, ...theme?.motion },
    layers: { ...merged.layers, ...theme?.layers },
    customProperties: { ...merged.customProperties, ...theme?.customProperties }
  }), {});
}

const designTokenMap = {
  "colors.accent": "--spui-ui-accent", "colors.accentHover": "--spui-ui-accent-hover", "colors.accentPressed": "--spui-ui-accent-pressed",
  "colors.accentSubtle": "--spui-ui-accent-subtle", "colors.accentSubtleHover": "--spui-ui-accent-subtle-hover", "colors.accentSubtlePressed": "--spui-ui-accent-subtle-pressed", "colors.accentForeground": "--spui-ui-accent-text", "colors.secondaryHover": "--spui-button-secondary-hover",
  "colors.foreground": "--spui-ui-text", "colors.foregroundMuted": "--spui-ui-muted", "colors.foregroundTertiary": "--spui-ui-text-muted", "colors.foregroundSubtle": "--spui-ui-foreground-subtle",
  "colors.foregroundDisabled": "--spui-ui-foreground-disabled", "colors.canvas": "--spui-ui-canvas",
  "colors.surface": "--spui-ui-surface", "colors.surfaceHover": "--spui-ui-surface-hover", "colors.surfaceAlt": "--spui-ui-surface-alt", "colors.surfaceSecondary": "--spui-ui-surface-secondary", "colors.surfaceSubtle": "--spui-ui-surface-subtle", "colors.surfaceRaised": "--spui-ui-surface-raised",
  "colors.surfaceSunken": "--spui-ui-surface-sunken", "colors.border": "--spui-ui-stroke", "colors.borderSubtle": "--spui-ui-border-subtle",
  "colors.borderStrong": "--spui-ui-border-strong", "colors.borderFocus": "--spui-ui-border-focus", "colors.borderDisabled": "--spui-ui-border-disabled",
  "colors.selectedBackground": "--spui-selection-background", "colors.selectedBackgroundHover": "--spui-selection-background-hover", "colors.selectedForeground": "--spui-selection-foreground",
  "colors.selectedBorder": "--spui-selection-border", "colors.link": "--spui-link-color", "colors.linkVisited": "--spui-link-visited", "colors.overlay": "--spui-overlay-scrim",
  "colors.info": "--spui-ui-info", "colors.infoSurface": "--spui-ui-info-surface",
  "colors.success": "--spui-ui-success", "colors.successSurface": "--spui-ui-success-surface", "colors.warning": "--spui-ui-warning",
  "colors.warningSurface": "--spui-ui-warning-surface", "colors.danger": "--spui-ui-danger", "colors.dangerSurface": "--spui-ui-danger-surface", "colors.focus": "--spui-ui-focus", "colors.focusRing": "--spui-focus-ring",
  "typography.fontFamily": "--spui-font-family", "typography.fontFamilyMono": "--spui-font-family-mono",
  "typography.fontSize": "--spui-text-font-size", "typography.fontSizeSmall": "--spui-text-font-size-small",
  "typography.fontSizeLarge": "--spui-text-font-size-large", "typography.fontSizeHeading": "--spui-text-font-size-heading",
  "typography.fontWeight": "--spui-text-font-weight", "typography.fontWeightStrong": "--spui-text-font-weight-strong",
  "typography.lineHeight": "--spui-text-line-height", "typography.lineHeightHeading": "--spui-text-line-height-heading",
  "typography.fontSize100": "--fontSizeBase100", "typography.fontSize200": "--fontSizeBase200", "typography.fontSize300": "--fontSizeBase300",
  "typography.fontSize400": "--fontSizeBase400", "typography.fontSize500": "--fontSizeBase500", "typography.fontSize600": "--fontSizeBase600",
  "typography.fontSize700": "--fontSizeHero700", "typography.fontSize800": "--fontSizeHero800", "typography.fontSize900": "--fontSizeHero900", "typography.fontSize1000": "--fontSizeHero1000",
  "typography.fontSize1100": "--spui-text-font-size-1100", "typography.fontSize1200": "--spui-text-font-size-1200",
  "typography.lineHeight100": "--lineHeightBase100", "typography.lineHeight200": "--lineHeightBase200", "typography.lineHeight300": "--lineHeightBase300",
  "typography.lineHeight400": "--lineHeightBase400", "typography.lineHeight500": "--lineHeightBase500", "typography.lineHeight600": "--lineHeightBase600",
  "typography.lineHeight700": "--lineHeightHero700", "typography.lineHeight800": "--lineHeightHero800", "typography.lineHeight900": "--lineHeightHero900", "typography.lineHeight1000": "--lineHeightHero1000",
  "typography.lineHeight1100": "--spui-text-line-height-1100", "typography.lineHeight1200": "--spui-text-line-height-1200",
  "typography.fontWeightRegular": "--fontWeightRegular", "typography.fontWeightMedium": "--fontWeightMedium",
  "typography.fontWeightSemibold": "--fontWeightSemibold", "typography.fontWeightBold": "--fontWeightBold",
  "typography.letterSpacing": "--spui-text-letter-spacing",
  "spacing.controlHeight": "--spui-control-height", "spacing.controlGap": "--spui-control-gap", "spacing.controlPaddingInline": "--spui-control-padding-inline",
  "spacing.controlPaddingBlock": "--spui-control-padding-block", "spacing.cardPadding": "--spui-card-padding", "spacing.fieldGap": "--spui-field-gap",
  "spacing.sectionGap": "--spui-section-gap", "spacing.listGap": "--spui-list-gap", "spacing.touchTargetMin": "--spui-touch-target-min",
  "shape.controlRadius": "--spui-control-radius", "shape.inputRadius": "--spui-input-radius", "shape.cardRadius": "--spui-card-radius",
  "shape.surfaceRadius": "--spui-surface-radius", "shape.pillRadius": "--spui-pill-radius", "shape.focusRingWidth": "--spui-focus-ring-width",
  "elevation.cardShadow": "--spui-card-shadow", "elevation.controlShadow": "--spui-control-shadow", "elevation.popoverShadow": "--spui-popover-shadow",
  "elevation.overlayShadow": "--spui-overlay-shadow", "elevation.focusShadow": "--spui-focus-shadow",
  "materials.glassBlur": "--spui-glass-blur", "materials.glassSaturation": "--spui-glass-saturation",
  "materials.glassSurfaceOpacity": "--spui-glass-surface-opacity", "materials.glassCanvasOpacity": "--spui-glass-canvas-opacity", "materials.glassBorderOpacity": "--spui-glass-border-opacity",
  "motion.durationFast": "--spui-motion-duration-fast", "motion.durationNormal": "--spui-motion-duration-normal", "motion.durationSlow": "--spui-motion-duration-slow",
  "motion.easingStandard": "--spui-motion-easing-standard", "motion.easingEmphasized": "--spui-motion-easing-emphasized",
  "layers.dropdown": "--spui-layer-dropdown", "layers.popover": "--spui-layer-popover", "layers.toast": "--spui-layer-toast"
} as const;

export function getSharePointUIDesignTokens(theme?: SharePointUIDesignTheme): Record<string, string> {
  const accent = theme?.colors?.accent ?? theme?.brandColor ?? theme?.palette?.themePrimary;
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(theme?.palette ?? {})) {
    if (value !== undefined) result[`--spui-palette-${toKebab(name)}`] = String(value);
  }
  for (const [name, value] of Object.entries(theme?.fluentTokens ?? {})) {
    if (value !== undefined && (typeof value === "string" || typeof value === "number")) {
      result[name.startsWith("--") ? name : `--${name}`] = String(value);
    }
  }
  if (accent) Object.assign(result, {
    "--spui-ui-accent": accent,
    "--spui-ui-accent-hover": `color-mix(in srgb, ${accent} 84%, black)`,
    "--spui-selection-background": `color-mix(in srgb, ${accent} 14%, var(--spui-ui-surface))`,
    "--spui-selection-border": accent,
    "--spui-link-color": `var(--spui-semantic-link, color-mix(in srgb, ${accent} 55%, var(--spui-ui-text) 45%))`,
    "--spui-focus-ring": "var(--spui-ui-border-focus)",
    "--spui-ui-info": accent,
    "--spui-ui-info-surface": `color-mix(in srgb, ${accent} 12%, var(--spui-ui-surface))`,
    "--spui-primary-background": accent,
    "--spui-primary-hover": `color-mix(in srgb, ${accent} 84%, black)`
  });
  if (accent && !theme?.colors?.accentForeground) {
    const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(accent)?.[1];
    if (hex) {
      const normalized = hex.length === 3 ? [...hex].map(value => value + value).join("") : hex;
      const channels = normalized.match(/[\da-f]{2}/gi)!.map(value => Number.parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      result["--spui-ui-accent-text"] = luminance > 0.179 ? "#000000" : "#ffffff";
    }
  }
  for (const [group, values] of Object.entries(theme ?? {})) {
    if (group === "brandColor" || group === "palette" || group === "customProperties") continue;
    for (const [name, value] of Object.entries(values ?? {})) {
      if (value !== undefined) {
        const token = designTokenMap[`${group}.${name}` as keyof typeof designTokenMap];
        if (token) result[token] = String(value);
      }
    }
  }
  // App-specific properties are the final design-pack layer; direct provider tokens still win later.
  for (const [name, value] of Object.entries(theme?.customProperties ?? {})) {
    if (name.startsWith("--") && name.length > 2) result[name] = String(value);
  }
  return result;
}
const appliedProperties = new WeakMap<HTMLElement, Set<string>>();
const toKebab = (key: string): string => key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

export type SharePointUIThemeOptions = { appearance?: SharePointUIAppearance; baseAppearance?: SharePointUIBaseAppearance; density?: SharePointUIDensity; theme?: SharePointUIDesignTheme; tokens?: Partial<SharePointUIStyleTokens> };

export function applySharePointTheme(target: HTMLElement, theme?: SharePointTheme, fluentTokens?: FluentThemeTokens, options: SharePointUIThemeOptions = {}): void {
  const style = target.style;
  for (const name of appliedProperties.get(target) ?? []) style.removeProperty(name);
  const names = new Set<string>();
  if (theme) {
    for (const [group, values] of Object.entries({ palette: theme.palette, semantic: theme.semanticColors })) {
      for (const [name, value] of Object.entries(values ?? {})) {
        if (!value) continue;
        const property = `--spui-${group}-${toKebab(name)}`;
        style.setProperty(property, value);
        names.add(property);
      }
    }
    for (const [group, values] of Object.entries({ effects: theme.effects, spacing: theme.spacing, "default-font-style": theme.defaultFontStyle })) {
      for (const [name, value] of Object.entries(values ?? {})) {
        if (typeof value !== "string" && typeof value !== "number") continue;
        const property = `--spui-${group}-${toKebab(name)}`;
        style.setProperty(property, String(value));
        names.add(property);
      }
    }
    for (const [name, values] of Object.entries(theme.fonts ?? {})) {
      for (const [propertyName, value] of Object.entries(values ?? {})) {
        if (typeof value !== "string" && typeof value !== "number") continue;
        const property = `--spui-fonts-${toKebab(name)}-${toKebab(propertyName)}`;
        style.setProperty(property, String(value));
        names.add(property);
      }
    }
    style.setProperty("--spui-is-inverted", theme.isInverted ? "1" : "0");
    names.add("--spui-is-inverted");
  }
  // Older SPFx themes expose their brand only in palette.themePrimary. The
  // appearance presets consume the semantic role, so bridge that value when
  // neither semantic colors nor Fluent v9 already provide a brand token.
  const semanticAccent = theme?.semanticColors?.primaryButtonBackground;
  const fluentAccent = fluentTokens?.colorBrandBackground;
  const paletteAccent = theme?.palette?.themePrimary;
  if (!semanticAccent && !fluentAccent && paletteAccent) {
    style.setProperty("--spui-semantic-primary-button-background", paletteAccent);
    names.add("--spui-semantic-primary-button-background");
  }
  for (const [name, value] of Object.entries(fluentTokens ?? {})) {
    if (typeof value !== "string" && typeof value !== "number") continue;
    const property = name.startsWith("--") ? name : `--${name}`;
    style.setProperty(property, String(value));
    names.add(property);
  }
  target.dataset.spuiAppearance = options.appearance ?? "fluent";
  const styleTokens = getSharePointUIStyleTokens(options.appearance, { ...getSharePointUIDesignTokens(options.theme), ...options.tokens }, options.baseAppearance, options.density);
  for (const [property, value] of Object.entries(styleTokens)) {
    style.setProperty(property, String(value));
    names.add(property);
  }
  style.colorScheme = String(styleTokens["--spui-color-scheme"] ?? "light");
  appliedProperties.set(target, names);
}

