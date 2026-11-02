import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { getSharePointUIStyleTokens } from "../packages/sharepoint-ui/src/appearance.ts";
import { getSharePointUIDesignTokens } from "../packages/sharepoint-ui/dist/theme.js";

const designTokens = getSharePointUIDesignTokens({
  colors: { foregroundSubtle: "#625b70", surfaceRaised: "#fff", selectedBackground: "#eee8ff", selectedForeground: "#241a35", selectedBorder: "#6750a4", link: "#57409a", info: "#2468aa", infoSurface: "#eaf4ff" },
  typography: { fontFamilyMono: "monospace", fontSizeHeading: "24px", fontWeightStrong: 700, lineHeightHeading: "1.25" },
  spacing: { sectionGap: "28px", touchTargetMin: "44px", controlPaddingBlock: "6px" },
  shape: { inputRadius: "8px", focusRingWidth: "3px" },
  elevation: { popoverShadow: "0 8px 28px #0003" },
  motion: { durationSlow: "240ms", easingEmphasized: "ease-in-out" },
});
for (const name of ["--spui-ui-foreground-subtle", "--spui-ui-surface-raised", "--spui-selection-background", "--spui-selection-foreground", "--spui-selection-border", "--spui-link-color", "--spui-ui-info", "--spui-ui-info-surface", "--spui-font-family-mono", "--spui-text-font-size-heading", "--spui-text-font-weight-strong", "--spui-text-line-height-heading", "--spui-section-gap", "--spui-touch-target-min", "--spui-control-padding-block", "--spui-input-radius", "--spui-focus-ring-width", "--spui-popover-shadow", "--spui-motion-duration-slow", "--spui-motion-easing-emphasized"]) {
  assert.ok(designTokens[name], `design theme maps ${name}`);
}
assert.equal(getSharePointUIStyleTokens("fluent", { ...designTokens, "--spui-ui-surface-raised": "#123456" })["--spui-ui-surface-raised"], "#123456", "direct tokens override typed theme roles");

for (const appearance of ["fluent", "ios", "windows", "linux", "glass"]) {
  const tokens = getSharePointUIStyleTokens(appearance, undefined, "ios");
  assert.equal(tokens["--spui-motion-duration-fast"], "120ms");
  assert.equal(tokens["--spui-motion-duration-normal"], "150ms");
}
assert.equal(getSharePointUIStyleTokens("fluent", { "--spui-motion-duration-normal": "310ms" })["--spui-motion-duration-normal"], "310ms");
assert.equal(getSharePointUIStyleTokens("fluent", undefined, "fluent", "compact")["--spui-control-height"], "28.16px", "compact density scales the control height from the selected appearance");
assert.equal(getSharePointUIStyleTokens("ios", undefined, "ios", "touch")["--spui-control-height"], "49.28px", "touch density scales the selected iOS appearance");
assert.equal(getSharePointUIStyleTokens("fluent", undefined, "fluent", "touch")["--spui-touch-target-min"], "44px", "touch density preserves the minimum touch target token");
assert.equal(getSharePointUIStyleTokens("fluent", getSharePointUIDesignTokens({ spacing: { controlHeight: "40px" } }), "fluent", "compact")["--spui-control-height"], "40px", "explicit theme spacing takes precedence over a density preset");
const brandTokens = getSharePointUIDesignTokens({ brandColor: "#ffcc00" });
assert.equal(brandTokens["--spui-ui-accent"], "#ffcc00");
assert.equal(brandTokens["--spui-ui-accent-text"], "#000000", "bright hex brands receive a dark on-accent foreground");
assert.equal(getSharePointUIDesignTokens({ brandColor: "#334477", colors: { accentForeground: "#ffeeaa" } })["--spui-ui-accent-text"], "#ffeeaa", "explicit on-accent foreground takes precedence");
assert.equal(getSharePointUIDesignTokens({ brandColor: "#ffcc00", colors: { accent: "#334477" } })["--spui-ui-accent-hover"], "color-mix(in srgb, #334477 84%, black)", "explicit accent role also becomes the palette derivation source");

const bundle = await build({
  stdin: { contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Button}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineButton}from"${resolve("packages/sharepoint-ui/src/elements/button.ts")}";defineButton();createRoot(document.querySelector("#react")).render(React.createElement(React.Fragment,null,React.createElement(SharePointUIProvider,{theme:{colors:{surfaceRaised:"#fff"}},tokens:{"--spui-ui-surface-raised":"#123456"}},React.createElement(Button,{"data-testid":"theme-button"},"Theme")),React.createElement(SharePointUIProvider,{density:"compact"},React.createElement(SharePointUIProvider,{theme:{brandColor:"#ffcc00"}},React.createElement(Button,{"data-testid":"derived-theme-button"},"Brand")))));`, resolveDir: process.cwd(), sourcefile: "motion-check.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const html = `<!doctype html><html><body style="--spui-motion-duration-normal:310ms;--spui-motion-easing-standard:linear"><div id="react"></div><spui-button id="button">Save</spui-button><script src="/bundle.js"></script></body></html>`;
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end(html));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=theme-button]"));
  assert.equal(await page.getByTestId("theme-button").evaluate(node => getComputedStyle(node).getPropertyValue("--spui-ui-surface-raised").trim()), "#123456", "direct token override wins over the typed theme role in React");
  const derived = await page.getByTestId("derived-theme-button").evaluate(node => { const style = getComputedStyle(node); return { accent: style.getPropertyValue("--spui-ui-accent").trim(), foreground: style.getPropertyValue("--spui-ui-accent-text").trim(), height: style.getPropertyValue("--spui-control-height").trim(), touchTarget: style.getPropertyValue("--spui-touch-target-min").trim() }; });
  assert.deepEqual(derived, { accent: "#ffcc00", foreground: "#000000", height: "28.16px", touchTarget: "44px" }, "React provider combines a derived brand palette with compact density and accessible touch targets");
  const button = page.locator("#button").locator("button");
  await page.waitForFunction(() => document.querySelector("#button")?.shadowRoot?.querySelector("button"));
  const styled = await button.evaluate(node => ({ duration: getComputedStyle(node).transitionDuration, easing: getComputedStyle(node).transitionTimingFunction }));
  assert.deepEqual(styled.duration.split(", "), ["0.31s", "0.31s", "0.31s"]);
  assert.deepEqual(styled.easing.split(", "), ["linear", "linear", "linear"]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reduced = await button.evaluate(node => getComputedStyle(node).transitionDuration);
  assert.equal(reduced, "0s");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", appearancePresets: 5, expandedDesignTokenMappings: Object.keys(designTokens).length, derivedBrandPalette: brandTokens, density: { compactControlHeight: "28.16px", touchTargetMin: "44px" }, reactTokenPrecedence: true, customDuration: styled.duration, customEasing: styled.easing, reducedMotionDuration: reduced, pageErrors: errors.length }));
} finally { await browser?.close(); server.close(); }
