import { getSharePointUIDesignTokens } from "@spfx-fast/sharepoint-ui/theme";

export function createPreviewThemeOverrides(capturedTokens, accent, derive = false) {
  return {
    ...capturedTokens,
    ...(derive ? getSharePointUIDesignTokens({ brandColor: accent }) : {}),
    "--spui-ui-accent": accent,
    "--spui-ui-accent-hover": `color-mix(in srgb, ${accent} 84%, black)`,
    "--spui-focus-ring": accent,
    "--spui-semantic-focus-border": accent,
    "--colorStrokeFocus2": accent,
    "--spui-semantic-primary-button-background": accent,
    "--colorBrandBackground": accent,
  };
}
