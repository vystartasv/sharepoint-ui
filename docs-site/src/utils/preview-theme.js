export function createPreviewThemeOverrides(capturedTokens, accent, derive = false) {
  const overrides = {
    ...capturedTokens,
    "--spui-ui-accent": accent,
    "--spui-ui-accent-hover": `color-mix(in srgb, ${accent} 84%, black)`,
    "--spui-focus-ring": accent,
    "--spui-semantic-focus-border": accent,
    "--colorStrokeFocus2": accent,
    "--spui-semantic-primary-button-background": accent,
    "--colorBrandBackground": accent,
  };
  if (derive) {
    const darker = `color-mix(in srgb, ${accent} 78%, black)`;
    const canvas = `color-mix(in srgb, ${accent} 7%, white)`;
    const surface = `color-mix(in srgb, ${accent} 2%, white)`;
    const surfaceHover = `color-mix(in srgb, ${accent} 12%, white)`;
    const border = `color-mix(in srgb, ${accent} 24%, #d1d1d1)`;
    Object.assign(overrides, {
      "--spui-semantic-body-background": canvas,
      "--spui-semantic-card-background": surface,
      "--spui-semantic-body-divider": border,
      "--spui-semantic-button-background-hovered": surfaceHover,
      "--spui-ui-canvas": canvas,
      "--spui-ui-surface": surface,
      "--spui-ui-surface-alt": canvas,
      "--spui-ui-surface-hover": surfaceHover,
      "--spui-ui-stroke": border,
      "--spui-ui-border-subtle": `color-mix(in srgb, ${accent} 14%, #e5e5e5)`,
      "--spui-selection-background": `color-mix(in srgb, ${accent} 15%, white)`,
      "--colorNeutralBackground1": surface,
      "--colorNeutralBackground1Hover": surfaceHover,
      "--colorNeutralBackground2": canvas,
      "--colorNeutralStroke2": border,
    });
    overrides["--spui-semantic-primary-button-background-hovered"] = `color-mix(in srgb, ${accent} 86%, black)`;
    overrides["--spui-semantic-primary-button-text"] = "#ffffff";
    overrides["--spui-semantic-input-focus-border-alt"] = accent;
    overrides["--spui-semantic-input-background-checked"] = accent;
    overrides["--spui-semantic-input-foreground-checked"] = "#ffffff";
    overrides["--spui-semantic-link"] = accent;
    overrides["--spui-semantic-link-hovered"] = darker;
    overrides["--colorBrandBackground2"] = `color-mix(in srgb, ${accent} 12%, white)`;
    overrides["--colorBrandBackground2Hover"] = `color-mix(in srgb, ${accent} 20%, white)`;
    overrides["--colorBrandBackgroundPressed"] = `color-mix(in srgb, ${accent} 76%, black)`;
    overrides["--colorBrandBackgroundSelected"] = darker;
    overrides["--colorBrandBackground3Static"] = darker;
    overrides["--colorBrandForeground2"] = darker;
    overrides["--colorBrandForeground2Hover"] = darker;
    overrides["--colorBrandForegroundLink"] = accent;
    overrides["--colorBrandStroke2Hover"] = `color-mix(in srgb, ${accent} 62%, white)`;
  }
  return overrides;
}
