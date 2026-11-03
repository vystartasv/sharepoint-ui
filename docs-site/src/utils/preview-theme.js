export function createPreviewThemeOverrides(capturedTokens, accent, derive = false) {
  const overrides = {
    ...capturedTokens,
    "--spui-ui-accent": accent,
    "--spui-semantic-primary-button-background": accent,
    "--colorBrandBackground": accent,
  };
  if (derive) {
    const darker = `color-mix(in srgb, ${accent} 78%, black)`;
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
