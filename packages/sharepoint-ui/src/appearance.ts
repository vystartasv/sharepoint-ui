export type SharePointUIAppearance = "fluent" | "ios" | "windows" | "linux" | "glass";
export type SharePointUIDensity = "compact" | "comfortable" | "touch";
export type SharePointUIStyleTokens = Record<`--spui-${string}`, string | number>;
export const DEFAULT_ACCENT = "#78716c";

const presets: Record<SharePointUIAppearance, SharePointUIStyleTokens> = {
  fluent: { "--spui-font-family": '"Segoe UI", sans-serif', "--spui-control-radius": "4px", "--spui-control-height": "32px", "--spui-card-radius": "8px", "--spui-base-card-padding": "16px", "--spui-card-padding": "16px", "--spui-base-control-gap": "8px", "--spui-control-gap": "8px", "--spui-control-padding-inline": "14px", "--spui-ui-text": "#242424", "--spui-ui-muted": "#616161", "--spui-ui-canvas": "#f5f5f5", "--spui-ui-surface": "#ffffff", "--spui-ui-surface-hover": "#f5f5f5", "--spui-ui-stroke": "#d1d1d1", "--spui-ui-accent": DEFAULT_ACCENT, "--spui-ui-accent-hover": "color-mix(in srgb, var(--spui-ui-accent) 84%, black)", "--spui-ui-accent-text": "#ffffff", "--spui-ui-success": "#107c10", "--spui-ui-success-surface": "#dff6dd", "--spui-ui-warning": "#835b00", "--spui-ui-warning-surface": "#fff4ce", "--spui-ui-danger": "#b10e1c", "--spui-ui-danger-surface": "#fde7e9", "--spui-focus-ring": "var(--spui-ui-accent)", "--spui-card-shadow": "0 1px 3px #0001", "--spui-color-scheme": "light" },
  ios: { "--spui-font-family": '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif', "--spui-control-radius": "11px", "--spui-control-height": "44px", "--spui-card-radius": "18px", "--spui-base-card-padding": "20px", "--spui-card-padding": "20px", "--spui-base-control-gap": "10px", "--spui-control-gap": "10px", "--spui-control-padding-inline": "16px", "--spui-ui-text": "light-dark(#1c1c1e, #f2f2f7)", "--spui-ui-muted": "light-dark(#636366, #aeaeb2)", "--spui-ui-canvas": "light-dark(#f2f2f7, #000000)", "--spui-ui-surface": "light-dark(#ffffff, #1c1c1e)", "--spui-ui-surface-hover": "light-dark(#e5e5ea, #2c2c2e)", "--spui-ui-stroke": "light-dark(#c6c6c8, #38383a)", "--spui-ui-accent": DEFAULT_ACCENT, "--spui-ui-accent-hover": "color-mix(in srgb, var(--spui-ui-accent) 84%, black)", "--spui-ui-accent-text": "#ffffff", "--spui-ui-success": "light-dark(#248a3d, #30d158)", "--spui-ui-success-surface": "light-dark(#e4f5e9, #14321c)", "--spui-ui-warning": "light-dark(#9a6700, #ffd60a)", "--spui-ui-warning-surface": "light-dark(#fff3d6, #342900)", "--spui-ui-danger": "light-dark(#d70015, #ff453a)", "--spui-ui-danger-surface": "light-dark(#ffe5e8, #3a1114)", "--spui-focus-ring": "var(--spui-ui-accent)", "--spui-card-shadow": "light-dark(0 2px 10px #1c1c1e12, 0 2px 10px #0008)", "--spui-control-shadow": "light-dark(0 1px 2px #1c1c1e0d, none)", "--spui-color-scheme": "light dark" },
  windows: { "--spui-font-family": '"Segoe UI Variable", "Segoe UI", sans-serif', "--spui-control-radius": "6px", "--spui-control-height": "32px", "--spui-card-radius": "8px", "--spui-base-card-padding": "16px", "--spui-card-padding": "16px", "--spui-base-control-gap": "8px", "--spui-control-gap": "8px", "--spui-ui-text": "#1a1a1a", "--spui-ui-muted": "#5d5d5d", "--spui-ui-canvas": "#f3f3f3", "--spui-ui-surface": "#ffffff", "--spui-ui-surface-hover": "#f5f5f5", "--spui-ui-stroke": "#d1d1d1", "--spui-ui-accent": DEFAULT_ACCENT, "--spui-ui-accent-hover": "color-mix(in srgb, var(--spui-ui-accent) 84%, black)", "--spui-ui-accent-text": "#ffffff", "--spui-ui-success": "#0f7b0f", "--spui-ui-success-surface": "#dff6dd", "--spui-ui-warning": "#835b00", "--spui-ui-warning-surface": "#fff4ce", "--spui-ui-danger": "#c42b1c", "--spui-ui-danger-surface": "#fde7e9", "--spui-focus-ring": "var(--spui-ui-accent)", "--spui-card-shadow": "0 2px 6px #00000012", "--spui-color-scheme": "light" },
  linux: { "--spui-font-family": "system-ui, Ubuntu, Cantarell, sans-serif", "--spui-control-radius": "6px", "--spui-control-height": "36px", "--spui-card-radius": "10px", "--spui-base-card-padding": "18px", "--spui-card-padding": "18px", "--spui-base-control-gap": "8px", "--spui-control-gap": "8px", "--spui-ui-text": "#241f31", "--spui-ui-muted": "#5e5c64", "--spui-ui-canvas": "#f6f5f4", "--spui-ui-surface": "#ffffff", "--spui-ui-surface-hover": "#f1f0ef", "--spui-ui-stroke": "#c7c5c3", "--spui-ui-accent": DEFAULT_ACCENT, "--spui-ui-accent-hover": "color-mix(in srgb, var(--spui-ui-accent) 84%, black)", "--spui-ui-accent-text": "#ffffff", "--spui-ui-success": "#2ec27e", "--spui-ui-success-surface": "#e4f5ec", "--spui-ui-warning": "#9c6e03", "--spui-ui-warning-surface": "#fff3d6", "--spui-ui-danger": "#e01b24", "--spui-ui-danger-surface": "#ffe5e8", "--spui-focus-ring": "var(--spui-ui-accent)", "--spui-card-shadow": "0 2px 8px #00000012", "--spui-color-scheme": "light" },
  glass: {}
};

export type SharePointUIBaseAppearance = Exclude<SharePointUIAppearance, "glass">;

function scalePresetLength(value: string | number | undefined, scale: number): string {
  if (typeof value !== "string") return String(value ?? "0px");
  const pixels = /^(-?\d*\.?\d+)px$/.exec(value.trim());
  // ponytail: presets use px lengths; keep custom units intact instead of emitting unsupported CSS math.
  return pixels ? `${Number(pixels[1]) * scale}px` : value;
}

export function getSharePointUIStyleTokens(appearance: SharePointUIAppearance = "fluent", overrides?: Partial<SharePointUIStyleTokens>, baseAppearance: SharePointUIBaseAppearance = "fluent", density: SharePointUIDensity = "comfortable"): SharePointUIStyleTokens {
  const selectedBase = appearance === "glass" ? baseAppearance : appearance;
  const tokens: SharePointUIStyleTokens = { ...presets[selectedBase] };
  Object.assign(tokens, { "--spui-motion-duration-fast": "120ms", "--spui-motion-duration-normal": "150ms", "--spui-motion-easing-standard": "cubic-bezier(.2,0,0,1)" });
  if (selectedBase === "fluent") Object.assign(tokens, {
    "--spui-ui-text": "var(--spui-semantic-body-text, var(--colorNeutralForeground1, #242424))",
    "--spui-ui-muted": "var(--spui-semantic-body-subtext, var(--colorNeutralForeground2, #616161))",
    "--spui-ui-canvas": "var(--spui-semantic-body-background, var(--colorNeutralBackground2, #f5f5f5))",
    "--spui-ui-surface": "var(--spui-semantic-card-background, var(--spui-semantic-body-background, var(--colorNeutralBackground1, #ffffff)))",
    "--spui-ui-surface-hover": "var(--spui-semantic-button-background-hovered, var(--colorNeutralBackground1Hover, #f5f5f5))",
    "--spui-ui-stroke": "var(--spui-semantic-body-divider, var(--colorNeutralStroke2, #d1d1d1))",
    "--spui-ui-accent": `var(--spui-semantic-primary-button-background, var(--colorBrandBackground, ${DEFAULT_ACCENT}))`,
    "--spui-ui-accent-hover": "var(--spui-semantic-primary-button-background-hovered, color-mix(in srgb, var(--spui-ui-accent) 84%, black))",
    "--spui-ui-accent-text": "var(--spui-semantic-primary-button-text, var(--colorNeutralForegroundOnBrand, #ffffff))",
    "--spui-ui-success": "var(--spui-semantic-success-text, #107c10)",
    "--spui-ui-success-surface": "var(--spui-semantic-success-background, #dff6dd)",
    "--spui-ui-warning": "var(--spui-semantic-warning-text, #835b00)",
    "--spui-ui-warning-surface": "var(--spui-semantic-warning-background, #fff4ce)",
    "--spui-ui-danger": "var(--spui-semantic-error-text, #b10e1c)",
    "--spui-ui-danger-surface": "var(--spui-semantic-error-background, #fde7e9)",
    "--spui-focus-ring": "var(--spui-semantic-focus-border, var(--colorStrokeFocus2, var(--spui-ui-accent)))"
  });
  else {
    const presetText = String(tokens["--spui-ui-text"]);
    const presetMuted = String(tokens["--spui-ui-muted"]);
    const presetCanvas = String(tokens["--spui-ui-canvas"]);
    const presetSurface = String(tokens["--spui-ui-surface"]);
    const presetStroke = String(tokens["--spui-ui-stroke"]);
    const presetAccent = String(tokens["--spui-ui-accent"]);
    const presetAccentHover = String(tokens["--spui-ui-accent-hover"]);
    const presetAccentText = String(tokens["--spui-ui-accent-text"]);
    Object.assign(tokens, {
      "--spui-ui-text": `var(--spui-semantic-body-text, var(--colorNeutralForeground1, ${presetText}))`,
      "--spui-ui-muted": `var(--spui-semantic-body-subtext, var(--colorNeutralForeground2, ${presetMuted}))`,
      "--spui-ui-canvas": `color-mix(in srgb, var(--spui-semantic-body-background, ${presetCanvas}) 90%, var(--spui-semantic-primary-button-background, ${presetAccent}) 10%)`,
      "--spui-ui-surface": `var(--spui-semantic-card-background, var(--spui-semantic-body-background, var(--colorNeutralBackground1, ${presetSurface})))`,
      "--spui-ui-surface-hover": `color-mix(in srgb, var(--spui-ui-surface, ${presetSurface}) 90%, var(--spui-ui-accent, ${presetAccent}) 10%)`,
      "--spui-ui-stroke": `var(--spui-semantic-body-divider, var(--colorNeutralStroke2, ${presetStroke}))`,
      "--spui-ui-accent": `var(--spui-semantic-primary-button-background, var(--colorBrandBackground, ${presetAccent}))`,
      "--spui-ui-accent-hover": `var(--spui-semantic-primary-button-background-hovered, color-mix(in srgb, var(--spui-ui-accent, ${presetAccent}) 84%, var(--spui-ui-text, ${presetText}) 16%))`,
      "--spui-ui-accent-text": `var(--spui-semantic-primary-button-text, var(--colorNeutralForegroundOnBrand, ${presetAccentText}))`,
      "--spui-ui-success": `var(--spui-semantic-success-text, ${tokens["--spui-ui-success"]})`,
      "--spui-ui-success-surface": `var(--spui-semantic-success-background, ${tokens["--spui-ui-success-surface"]})`,
      "--spui-ui-warning": `var(--spui-semantic-warning-text, ${tokens["--spui-ui-warning"]})`,
      "--spui-ui-warning-surface": `var(--spui-semantic-warning-background, ${tokens["--spui-ui-warning-surface"]})`,
      "--spui-ui-danger": `var(--spui-semantic-error-text, ${tokens["--spui-ui-danger"]})`,
      "--spui-ui-danger-surface": `var(--spui-semantic-error-background, ${tokens["--spui-ui-danger-surface"]})`,
      "--spui-focus-ring": "var(--spui-semantic-focus-border, var(--colorStrokeFocus2, var(--spui-ui-accent)))"
    });
  }
  if (selectedBase === "ios") {
    const tenantText = "var(--spui-semantic-body-text, var(--colorNeutralForeground1, #1c1c1e))";
    const tenantMuted = "var(--spui-semantic-body-subtext, var(--colorNeutralForeground2, #636366))";
    const tenantCanvas = "var(--spui-semantic-body-background, #f2f2f7)";
    const tenantSurface = "var(--spui-semantic-card-background, var(--colorNeutralBackground1, #ffffff))";
    const tenantAccent = `var(--spui-semantic-primary-button-background, var(--colorBrandBackground, ${DEFAULT_ACCENT}))`;
    Object.assign(tokens, {
      "--spui-ui-text": `light-dark(${tenantText}, color-mix(in srgb, ${tenantText} 14%, white 86%))`,
      "--spui-ui-muted": `light-dark(${tenantMuted}, color-mix(in srgb, ${tenantMuted} 18%, white 82%))`,
      "--spui-ui-canvas": `light-dark(color-mix(in srgb, ${tenantCanvas} 90%, ${tenantAccent} 10%), color-mix(in srgb, ${tenantCanvas} 18%, black 82%))`,
      "--spui-ui-surface": `light-dark(${tenantSurface}, color-mix(in srgb, ${tenantSurface} 20%, black 80%))`,
      "--spui-ui-surface-hover": `light-dark(color-mix(in srgb, var(--spui-ui-surface, #ffffff) 90%, ${tenantAccent} 10%), color-mix(in srgb, var(--spui-ui-surface, #1c1c1e) 90%, white 10%))`,
      "--spui-ui-stroke": "light-dark(var(--spui-semantic-body-divider, var(--colorNeutralStroke2, #c6c6c8)), color-mix(in srgb, var(--spui-semantic-body-divider, #38383a) 25%, white 75%))",
      "--spui-ui-accent": `light-dark(${tenantAccent}, ${tenantAccent})`,
      "--spui-ui-accent-hover": `var(--spui-semantic-primary-button-background-hovered, color-mix(in srgb, ${tenantAccent} 84%, black))`,
      "--spui-ui-success": "light-dark(var(--spui-semantic-success-text, #248a3d), color-mix(in srgb, var(--spui-semantic-success-text, #248a3d) 32%, white 68%))",
      "--spui-ui-success-surface": "light-dark(var(--spui-semantic-success-background, #e4f5e9), color-mix(in srgb, var(--spui-semantic-success-background, #14321c) 28%, black 72%))",
      "--spui-ui-warning": "light-dark(var(--spui-semantic-warning-text, #9a6700), color-mix(in srgb, var(--spui-semantic-warning-text, #9a6700) 30%, white 70%))",
      "--spui-ui-warning-surface": "light-dark(var(--spui-semantic-warning-background, #fff3d6), color-mix(in srgb, var(--spui-semantic-warning-background, #342900) 28%, black 72%))",
      "--spui-ui-danger": "light-dark(var(--spui-semantic-error-text, #d70015), color-mix(in srgb, var(--spui-semantic-error-text, #d70015) 30%, white 70%))",
      "--spui-ui-danger-surface": "light-dark(var(--spui-semantic-error-background, #ffe5e8), color-mix(in srgb, var(--spui-semantic-error-background, #3a1114) 28%, black 72%))",
      "--spui-focus-ring": "var(--spui-semantic-focus-border, var(--colorStrokeFocus2, var(--spui-ui-accent)))"
    });
  }
  // Stable shared roles for applications that style slots or compose their own
  // controls. These remain live aliases so SharePoint and appearance changes
  // continue to flow through without copying resolved colors at render time.
  Object.assign(tokens, {
    "--spui-ui-foreground-subtle": "color-mix(in srgb, var(--spui-ui-text) 72%, var(--spui-ui-surface))",
    "--spui-ui-foreground-disabled": "var(--spui-semantic-disabled-text, var(--colorNeutralForegroundDisabled, color-mix(in srgb, var(--spui-ui-muted) 68%, var(--spui-ui-surface))))",
    "--spui-ui-text-muted": "var(--colorNeutralForeground3, var(--spui-ui-muted))",
    "--spui-ui-surface-raised": "color-mix(in srgb, var(--spui-ui-surface) 96%, var(--spui-ui-text))",
    "--spui-ui-surface-secondary": "var(--colorNeutralBackground3, var(--spui-ui-surface-raised))",
    "--spui-ui-surface-subtle": "var(--colorNeutralBackground2, var(--spui-ui-canvas))",
    "--spui-ui-surface-alt": "var(--colorNeutralBackground2, var(--spui-ui-surface-subtle))",
    "--spui-ui-surface-sunken": "color-mix(in srgb, var(--spui-ui-canvas) 92%, var(--spui-ui-text))",
    "--spui-ui-border-subtle": "color-mix(in srgb, var(--spui-ui-stroke) 55%, var(--spui-ui-surface))",
    "--spui-ui-border-strong": "color-mix(in srgb, var(--spui-ui-stroke) 72%, var(--spui-ui-text))",
    "--spui-ui-border-focus": "color-mix(in srgb, var(--spui-semantic-focus-border, var(--colorStrokeFocus2, var(--spui-ui-accent))) 30%, var(--spui-ui-text, #242424))",
    "--spui-ui-focus": "var(--spui-ui-border-focus)",
    "--spui-ui-border-disabled": "var(--colorNeutralStrokeDisabled, color-mix(in srgb, var(--spui-ui-stroke) 40%, var(--spui-ui-surface)))",
    "--spui-ui-accent-pressed": "var(--colorBrandBackgroundPressed, color-mix(in srgb, var(--spui-ui-accent) 76%, black))",
    "--spui-ui-accent-subtle": "var(--colorBrandBackground2, color-mix(in srgb, var(--spui-ui-accent) 14%, var(--spui-ui-surface)))",
    "--spui-ui-accent-subtle-hover": "var(--colorBrandBackground2Hover, color-mix(in srgb, var(--spui-ui-accent) 20%, var(--spui-ui-surface)))",
    "--spui-ui-accent-subtle-pressed": "var(--colorBrandBackground2Pressed, color-mix(in srgb, var(--spui-ui-accent) 26%, var(--spui-ui-surface)))",
    "--spui-ui-hover": "var(--spui-ui-surface-hover)",
    "--spui-selection-background": "color-mix(in srgb, var(--spui-ui-accent) 14%, var(--spui-ui-surface))",
    "--spui-selection-background-hover": "var(--colorNeutralBackground1Selected, color-mix(in srgb, var(--spui-ui-accent) 20%, var(--spui-ui-surface)))",
    "--spui-selection-foreground": "var(--spui-ui-text)",
    "--spui-selection-border": "var(--spui-ui-accent)",
    "--spui-link-color": "var(--spui-semantic-link, color-mix(in srgb, var(--spui-ui-accent) 55%, var(--spui-ui-text) 45%))",
    "--spui-link-visited": "var(--spui-semantic-link-visited, var(--spui-link-color))",
    "--spui-overlay-scrim": "rgb(0 0 0 / 40%)",
    "--spui-ui-info": "var(--spui-ui-accent)",
    "--spui-ui-info-surface": "color-mix(in srgb, var(--spui-ui-accent) 12%, var(--spui-ui-surface))",
    "--spui-font-family-mono": "ui-monospace, SFMono-Regular, Consolas, monospace",
    "--spui-text-font-size-small": "12px",
    "--spui-text-font-size-large": "18px",
    "--spui-text-font-size-heading": "24px",
    "--spui-text-font-weight-strong": "600",
    "--spui-text-line-height-heading": "1.25",
    "--spui-text-letter-spacing": "normal",
    "--spui-control-padding-block": "6px",
    "--spui-section-gap": "24px",
    "--spui-list-gap": "var(--spui-control-gap)",
    "--spui-touch-target-min": "44px",
    "--spui-surface-radius": "var(--spui-card-radius)",
    "--spui-pill-radius": "999px",
    "--spui-focus-ring-width": "2px",
    "--spui-popover-shadow": "0 4px 16px #0002",
    "--spui-overlay-shadow": "0 12px 40px #0003",
    "--spui-focus-shadow": "0 0 0 2px var(--spui-focus-ring)",
    "--spui-motion-duration-slow": "220ms",
    "--spui-motion-easing-emphasized": "cubic-bezier(.2,0,0,1)"
  });
  const densityScale = density === "compact" ? 0.88 : density === "touch" ? 1.12 : 1;
  if (densityScale !== 1) {
    for (const name of ["--spui-control-height", "--spui-control-gap", "--spui-control-padding-inline", "--spui-control-padding-block", "--spui-card-padding", "--spui-field-gap", "--spui-section-gap", "--spui-list-gap", "--spui-base-card-padding", "--spui-base-control-gap", "--spui-base-control-padding", "--spui-base-control-height"] as const) {
      if (tokens[name] !== undefined) tokens[name] = scalePresetLength(tokens[name], densityScale);
    }
  }
  // Treat incoming style tokens as the selected base theme. Glass derives its
  // finish from those resolved colors and dimensions, then explicit glass
  // token overrides can still opt out of an individual derived value.
  for (const [name, value] of Object.entries(overrides ?? {})) if (typeof value === "string" || typeof value === "number") tokens[name as `--spui-${string}`] = value;
  tokens["--spui-base-card-padding"] = overrides?.["--spui-base-card-padding"] ?? tokens["--spui-card-padding"] ?? "16px";
  tokens["--spui-base-control-gap"] = overrides?.["--spui-base-control-gap"] ?? tokens["--spui-control-gap"] ?? "8px";
  tokens["--spui-base-control-padding"] = overrides?.["--spui-base-control-padding"] ?? tokens["--spui-control-padding-inline"] ?? "14px";
  tokens["--spui-base-control-height"] = overrides?.["--spui-base-control-height"] ?? tokens["--spui-control-height"] ?? "32px";
  if (appearance === "glass") Object.assign(tokens, {
    "--spui-base-text": overrides?.["--spui-ui-text"] ?? tokens["--spui-ui-text"],
    "--spui-base-muted": overrides?.["--spui-ui-muted"] ?? tokens["--spui-ui-muted"],
    "--spui-base-canvas": overrides?.["--spui-ui-canvas"] ?? tokens["--spui-ui-canvas"],
    "--spui-base-surface": overrides?.["--spui-ui-surface"] ?? tokens["--spui-ui-surface"],
    "--spui-base-stroke": overrides?.["--spui-ui-stroke"] ?? tokens["--spui-ui-stroke"],
    "--spui-base-accent": overrides?.["--spui-ui-accent"] ?? tokens["--spui-ui-accent"],
    "--spui-base-accent-text": overrides?.["--spui-ui-accent-text"] ?? tokens["--spui-ui-accent-text"],
    "--spui-base-success": overrides?.["--spui-ui-success-surface"] ?? tokens["--spui-ui-success-surface"],
    "--spui-base-warning": overrides?.["--spui-ui-warning-surface"] ?? tokens["--spui-ui-warning-surface"],
    "--spui-base-danger": overrides?.["--spui-ui-danger-surface"] ?? tokens["--spui-ui-danger-surface"],
    "--spui-base-success-text": overrides?.["--spui-ui-success"] ?? tokens["--spui-ui-success"],
    "--spui-base-warning-text": overrides?.["--spui-ui-warning"] ?? tokens["--spui-ui-warning"],
    "--spui-base-danger-text": overrides?.["--spui-ui-danger"] ?? tokens["--spui-ui-danger"],
    "--spui-ui-text": "var(--spui-base-text)",
    "--spui-ui-muted": "var(--spui-base-muted)",
    "--spui-ui-canvas": "color-mix(in srgb, var(--spui-base-canvas) var(--spui-glass-canvas-opacity,84%), transparent)",
    "--spui-ui-surface": "color-mix(in srgb, var(--spui-base-surface) var(--spui-glass-surface-opacity,88%), transparent)",
    "--spui-ui-surface-hover": "color-mix(in srgb, var(--spui-base-surface) 90%, var(--spui-base-accent) 10%)",
    "--spui-ui-stroke": "color-mix(in srgb, var(--spui-base-stroke) var(--spui-glass-border-opacity,64%), transparent)",
    "--spui-ui-accent": "var(--spui-base-accent)",
    "--spui-ui-accent-hover": "color-mix(in srgb, var(--spui-base-accent) 84%, black)",
    "--spui-ui-accent-text": "var(--spui-base-accent-text)",
    "--spui-ui-success-surface": "color-mix(in srgb, var(--spui-base-success) 72%, transparent)",
    "--spui-ui-warning-surface": "color-mix(in srgb, var(--spui-base-warning) 72%, transparent)",
    "--spui-ui-danger-surface": "color-mix(in srgb, var(--spui-base-danger) 72%, transparent)",
    "--spui-success-surface": "var(--spui-ui-success-surface)",
    "--spui-warning-surface": "var(--spui-ui-warning-surface)",
    "--spui-danger-surface": "var(--spui-ui-danger-surface)",
    "--spui-success-text": "var(--spui-base-success-text)",
    "--spui-warning-text": "var(--spui-base-warning-text)",
    "--spui-danger-text": "var(--spui-base-danger-text)",
    "--spui-control-background": "color-mix(in srgb, var(--spui-base-surface) 86%, transparent)",
    "--spui-control-border": "color-mix(in srgb, var(--spui-base-stroke) 72%, transparent)",
    "--spui-primary-background": "color-mix(in srgb, var(--spui-base-accent) 94%, var(--spui-base-surface) 6%)",
    "--spui-primary-hover": "color-mix(in srgb, var(--spui-base-accent) 86%, black 14%)",
    "--spui-card-background": "linear-gradient(145deg, color-mix(in srgb, var(--spui-base-surface) 76%, var(--spui-base-accent) 12%), color-mix(in srgb, var(--spui-base-surface) 84%, var(--spui-base-accent) 8%))",
    "--spui-card-border": "var(--spui-ui-stroke)",
    "--spui-card-backdrop": "blur(var(--spui-glass-blur,16px)) saturate(var(--spui-glass-saturation,150%))",
    "--spui-card-shadow": "0 8px 28px color-mix(in srgb, var(--spui-base-text) 14%, transparent)",
    "--spui-spacing-scale": "1.12",
    "--spui-control-padding-inline": scalePresetLength(tokens["--spui-base-control-padding"], 1.12),
    "--spui-control-height": scalePresetLength(tokens["--spui-base-control-height"], 1.04),
    "--spui-card-padding": scalePresetLength(tokens["--spui-base-card-padding"], 1.12),
    "--spui-control-gap": scalePresetLength(tokens["--spui-base-control-gap"], 1.12),
    "--spui-color-scheme": tokens["--spui-color-scheme"] ?? "light"
  });
  if (appearance === "glass") {
    // Directly specified finished values win; base values still flow through
    // the glass transforms above.
    for (const name of ["--spui-control-padding-inline", "--spui-control-height", "--spui-card-padding", "--spui-control-gap", "--spui-color-scheme"]) {
      const value = overrides?.[name as `--spui-${string}`];
      if (typeof value === "string" || typeof value === "number") tokens[name as `--spui-${string}`] = value;
    }
  }
  return tokens;
}
