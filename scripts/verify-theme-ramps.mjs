import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { composeSharePointUIDesignThemes, getSharePointUIDesignTokens } from "../packages/sharepoint-ui/dist/theme.js";
import { getSharePointUIStyleTokens } from "../packages/sharepoint-ui/dist/appearance.js";
import { contrastRatio } from "./lib/color-contrast.mjs";

const bundle = await build({
  stdin: {
    sourcefile: "theme-ramps.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{webLightTheme}from"@fluentui/react-theme";import{SharePointUIProvider,Button,Input,Text,composeSharePointUIDesignThemes}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{applySharePointTheme}from"${resolve("packages/sharepoint-ui/src/theme.ts")}";window.fluentThemeExpected=webLightTheme;const Probe=()=> <Text><span data-probe="true" style={{backgroundColor:"var(--spui-ui-surface-raised)",color:"var(--spui-ui-foreground-disabled)",border:"1px solid var(--spui-ui-border-subtle)",outline:"1px solid var(--spui-ui-border-strong)"}}>probe</span></Text>;const customTheme=composeSharePointUIDesignThemes({customProperties:{"--app-theme-gap":"6px","--app-theme-color":"tomato"}},{customProperties:{"--app-theme-gap":"9px"}});const fluentPack=composeSharePointUIDesignThemes({fluentTokens:{colorBrandBackground:"rgb(21, 77, 143)"}},{fluentTokens:{spacingHorizontalM:"22px"}});const layerTheme=composeSharePointUIDesignThemes({layers:{dropdown:24,popover:80}},{layers:{popover:100,toast:110}});const strongSection={backgroundColor:"#092b4f",color:"#fff","--spui-semantic-body-text":"#fff","--spui-semantic-body-background":"#092b4f","--spui-semantic-card-background":"#103d6b","--spui-semantic-focus-border":"#ffcc00"};const focusSamples=["fluent","ios","windows","linux","glass"].map(appearance=><section key={appearance} style={strongSection}><SharePointUIProvider appearance={appearance as any} theme={{brandColor:"#cf4292"}}><Input data-testid={"focus-"+appearance} aria-label="Focus sample"/></SharePointUIProvider></section>);createRoot(document.querySelector("#root")).render(<>{focusSamples}<section style={strongSection}><SharePointUIProvider appearance="ios" theme={{colors:{borderFocus:"#00ff88"}}}><Input data-testid="focus-override" aria-label="Focus override"/></SharePointUIProvider></section><SharePointUIProvider theme={layerTheme}><Text data-testid="layers">layers</Text></SharePointUIProvider><SharePointUIProvider theme={{materials:{glassBlur:"14px",glassSurfaceOpacity:"88%"}}}><SharePointUIProvider data-testid="glass-material" appearance="glass" theme={{materials:{glassSaturation:"165%",glassSurfaceOpacity:"92%",glassCanvasOpacity:"80%",glassBorderOpacity:"72%"}}}><Text data-testid="glass-material-probe">glass</Text></SharePointUIProvider></SharePointUIProvider><SharePointUIProvider data-testid="light" appearance="fluent" theme={{brandColor:"#1769aa"}} fluentTokens={{colorNeutralForegroundDisabled:"rgb(130, 130, 130)"}}><Probe/></SharePointUIProvider><SharePointUIProvider data-testid="dark" appearance="ios"><Probe/></SharePointUIProvider><SharePointUIProvider data-testid="override" appearance="fluent" theme={{colors:{surfaceRaised:"rgb(240, 10, 20)",borderSubtle:"rgb(10, 20, 30)"}}}><Probe/></SharePointUIProvider><SharePointUIProvider data-testid="custom" theme={customTheme}><Text><span data-custom-probe="true" style={{marginInlineStart:"var(--app-theme-gap)",color:"var(--app-theme-color)"}}>custom</span></Text></SharePointUIProvider><SharePointUIProvider data-testid="fluent-pack" theme={fluentPack}><Text><span data-fluent-pack-probe="true" style={{color:"var(--colorBrandBackground)",marginInlineStart:"var(--spacingHorizontalM)"}}>Fluent</span></Text></SharePointUIProvider><SharePointUIProvider data-testid="fluent-full-theme" theme={{fluentTokens:webLightTheme}}><Text><span data-full-theme-probe="true">full theme</span></Text></SharePointUIProvider><SharePointUIProvider theme={{palette:{themePrimary:"rgb(22, 119, 204)",neutralLighter:"rgb(244, 246, 248)"}}}><Text><span data-palette-probe="true" style={{backgroundColor:"var(--spui-palette-neutral-lighter)",color:"var(--spui-ui-accent)"}}>palette</span></Text></SharePointUIProvider><SharePointUIProvider theme={{colors:{accent:"blue"},customProperties:{"--spui-ui-accent":"rgb(12, 34, 56)"}}}><Text><span data-precedence-probe="true" style={{color:"var(--spui-ui-accent)"}}>precedence</span></Text></SharePointUIProvider><SharePointUIProvider theme={{colors:{accent:"#1769aa",accentPressed:"rgb(1, 2, 3)"}}}><Button data-testid="theme-button" appearance="primary">Press</Button></SharePointUIProvider></>);const native=document.createElement("div");native.dataset.nativeCustomTheme="true";applySharePointTheme(native,undefined,undefined,{theme:{customProperties:{"--app-theme-gap":"11px"},fluentTokens:{colorBrandBackground:"rgb(21, 77, 143)"}}});document.querySelector("#native-root").append(native);`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

assert.deepEqual(getSharePointUIDesignTokens({ colors: {
  accentPressed: "rgb(1, 2, 3)", accentSubtle: "rgb(4, 5, 6)", accentSubtleHover: "rgb(7, 8, 9)",
  accentSubtlePressed: "rgb(10, 11, 12)", borderFocus: "rgb(13, 14, 15)", borderDisabled: "rgb(16, 17, 18)", linkVisited: "rgb(17, 18, 19)",
  focus: "rgb(20, 21, 22)", surfaceSecondary: "rgb(21, 22, 23)", surfaceSubtle: "rgb(22, 23, 24)",
  foregroundTertiary: "rgb(23, 24, 25)", surfaceAlt: "rgb(24, 25, 26)",
  selectedBackgroundHover: "rgb(19, 20, 21)", secondaryHover: "rgb(25, 26, 27)"
} }), {
  "--spui-ui-accent-pressed": "rgb(1, 2, 3)", "--spui-ui-accent-subtle": "rgb(4, 5, 6)",
  "--spui-ui-accent-subtle-hover": "rgb(7, 8, 9)", "--spui-ui-accent-subtle-pressed": "rgb(10, 11, 12)",
  "--spui-ui-border-focus": "rgb(13, 14, 15)", "--spui-ui-border-disabled": "rgb(16, 17, 18)",
  "--spui-ui-focus": "rgb(20, 21, 22)", "--spui-ui-surface-secondary": "rgb(21, 22, 23)", "--spui-ui-surface-subtle": "rgb(22, 23, 24)",
  "--spui-ui-text-muted": "rgb(23, 24, 25)", "--spui-ui-surface-alt": "rgb(24, 25, 26)",
  "--spui-link-visited": "rgb(17, 18, 19)",
  "--spui-selection-background-hover": "rgb(19, 20, 21)",
  "--spui-button-secondary-hover": "rgb(25, 26, 27)"
}, "semantic interaction roles map to stable CSS variables");

assert.deepEqual(getSharePointUIDesignTokens({ layers: { dropdown: 24, popover: 80, toast: 90 } }), {
  "--spui-layer-dropdown": "24", "--spui-layer-popover": "80", "--spui-layer-toast": "90"
}, "typed layer roles map to shared CSS variables");
assert.deepEqual(composeSharePointUIDesignThemes({ layers: { dropdown: 24, popover: 80 } }, { layers: { popover: 100, toast: 110 } }).layers, {
  dropdown: 24, popover: 100, toast: 110
}, "composed theme packs merge layer roles with later-pack precedence");
assert.deepEqual(getSharePointUIDesignTokens({ materials: { glassBlur: "20px", glassSaturation: "165%", glassSurfaceOpacity: "92%", glassCanvasOpacity: "80%", glassBorderOpacity: "72%" } }), {
  "--spui-glass-blur": "20px", "--spui-glass-saturation": "165%", "--spui-glass-surface-opacity": "92%",
  "--spui-glass-canvas-opacity": "80%", "--spui-glass-border-opacity": "72%"
}, "typed material roles map to shared CSS variables");
assert.deepEqual(composeSharePointUIDesignThemes({ materials: { glassBlur: "14px", glassSurfaceOpacity: "88%" } }, { materials: { glassBlur: "20px" } }).materials, {
  glassBlur: "20px", glassSurfaceOpacity: "88%"
}, "material packs merge by group with later-pack precedence");
const glassStyleTokens = getSharePointUIStyleTokens("glass", getSharePointUIDesignTokens({ materials: { glassBlur: "20px", glassSaturation: "165%", glassSurfaceOpacity: "92%", glassCanvasOpacity: "80%", glassBorderOpacity: "72%" } }));
assert.match(String(glassStyleTokens["--spui-card-backdrop"]), /blur\(var\(--spui-glass-blur,16px\)\) saturate\(var\(--spui-glass-saturation,150%\)\)/, "glass blur and saturation remain theme-variable driven");
assert.match(String(glassStyleTokens["--spui-ui-surface"]), /var\(--spui-glass-surface-opacity,88%\)/, "glass surface opacity remains theme-variable driven");
assert.equal(glassStyleTokens["--spui-glass-blur"], "20px", "typed materials tune glass while the appearance derives its colors");

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=root></div><div id=native-root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const values = {};
  for (const colorScheme of ["light", "dark"]) {
    const page = await browser.newPage({ colorScheme });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForSelector("[data-probe]");
    values[colorScheme] = await page.locator("[data-probe]").evaluateAll(nodes => nodes.map(node => {
      const style = getComputedStyle(node);
      return { surface: style.backgroundColor, disabled: style.color, borderSubtle: style.borderTopColor, borderStrong: style.outlineColor };
    }));
    assert.deepEqual(errors, [], `${colorScheme} theme has no page errors`);
    await page.close();
  }
  assert.notEqual(values.light[0].surface, "rgb(255, 255, 255)", "raised surface derives from the blue-brand fluent surface");
  assert.equal(values.light[0].disabled, "rgb(130, 130, 130)", "Fluent disabled foreground token is honored");
  assert.notEqual(values.light[0].borderSubtle, values.light[0].borderStrong, "subtle and strong borders have distinct derived values");
  assert.notEqual(values.dark[1].surface, "rgb(255, 255, 255)", "iOS dark raised surface derives from the active dark theme");
  assert.equal(values.light[2].surface, "rgb(240, 10, 20)", "explicit surface role overrides the derived ramp");
  assert.equal(values.light[2].borderSubtle, "rgb(10, 20, 30)", "explicit border role overrides the derived ramp");
  const custom = await browser.newPage();
  await custom.goto(`http://127.0.0.1:${server.address().port}`);
  await custom.waitForSelector("[data-custom-probe]");
  const strongFocusSamples = [];
  for (const appearance of ["fluent", "ios", "windows", "linux", "glass"]) {
    const field = custom.getByTestId(`focus-${appearance}`).locator("input");
    await field.focus();
    await custom.waitForTimeout(150);
    const colors = await field.evaluate(input => {
      const control = input.getRootNode().host.shadowRoot.querySelector(".control");
      const section = input.getRootNode().host.closest("section");
      const style = getComputedStyle(control);
      return { border: style.borderTopColor, surface: style.backgroundColor, section: getComputedStyle(section).backgroundColor, focusRing: style.getPropertyValue("--spui-focus-ring") };
    });
    const contrast = contrastRatio(colors.border, colors.surface);
    assert.notEqual(colors.border, "rgb(255, 204, 0)", `${appearance} focus border adjusts the SharePoint focus semantic against its active section`);
    assert.ok(contrast >= 3, `${appearance} focus border must have 3:1 UI contrast: ${JSON.stringify({ colors, contrast })}`);
    strongFocusSamples.push({ appearance, ...colors, contrast: Number(contrast.toFixed(2)) });
  }
  const overrideField = custom.getByTestId("focus-override").locator("input");
  await overrideField.focus();
  await custom.waitForTimeout(150);
  const explicitFocusBorder = await overrideField.evaluate(input => getComputedStyle(input.getRootNode().host.shadowRoot.querySelector(".control")).borderTopColor);
  assert.equal(explicitFocusBorder, "rgb(0, 255, 136)", "typed theme.colors.borderFocus overrides the inherited SharePoint focus color");
  await custom.emulateMedia({ forcedColors: "active" });
  await custom.getByTestId("focus-fluent").locator("input").focus();
  const forcedFocus = await custom.getByTestId("focus-fluent").evaluate(node => { const control=node.shadowRoot.querySelector(".control");const style=getComputedStyle(control);return {outlineWidth:style.outlineWidth,outlineStyle:style.outlineStyle,outlineColor:style.outlineColor}; });
  assert.equal(forcedFocus.outlineWidth, "2px", "forced-colors focus keeps a visible two-pixel system outline");
  assert.equal(forcedFocus.outlineStyle, "solid");
  const pressedButton=custom.getByTestId("theme-button").locator("button");await pressedButton.hover();await custom.mouse.down();await custom.waitForTimeout(200);const pressedState=await pressedButton.evaluate(button=>({active:button.matches(":active"),background:getComputedStyle(button).backgroundColor,role:getComputedStyle(button).getPropertyValue("--spui-ui-accent-pressed")}));const pressedBackground=pressedState.background;await custom.mouse.up();const expectedPressedBackground=await custom.evaluate(()=>{const node=document.createElement("span");node.style.backgroundColor="rgb(1, 2, 3)";document.body.append(node);const value=getComputedStyle(node).backgroundColor;node.remove();return value;});assert.equal(pressedBackground,expectedPressedBackground,"Button primary pressed state uses the theme semantic role");
  const layerValues = await custom.getByTestId("layers").evaluate(node => Object.fromEntries(["--spui-layer-dropdown", "--spui-layer-popover", "--spui-layer-toast"].map(name => [name, getComputedStyle(node).getPropertyValue(name).trim()])));
  assert.deepEqual(layerValues, { "--spui-layer-dropdown": "24", "--spui-layer-popover": "100", "--spui-layer-toast": "110" }, "typed layer values compose and reach React provider scopes");
  const customThemeValues = await custom.locator("[data-custom-probe]").evaluate(node => ({ gap: getComputedStyle(node).marginInlineStart, token: getComputedStyle(node).getPropertyValue("--app-theme-color").trim() }));
  const glassMaterialValues = await custom.getByTestId("glass-material-probe").evaluate(node => { const style=getComputedStyle(node); return Object.fromEntries(["--spui-glass-blur","--spui-glass-saturation","--spui-glass-surface-opacity","--spui-glass-canvas-opacity","--spui-glass-border-opacity"].map(name=>[name,style.getPropertyValue(name).trim()])); });
  assert.deepEqual(glassMaterialValues,{"--spui-glass-blur":"14px","--spui-glass-saturation":"165%","--spui-glass-surface-opacity":"92%","--spui-glass-canvas-opacity":"80%","--spui-glass-border-opacity":"72%"},"nested glass material packs inherit and override each typed role");
  const nativeCustomProperty = await custom.locator("[data-native-custom-theme]").evaluate(node => getComputedStyle(node).getPropertyValue("--app-theme-gap").trim());
  const nativeFluentToken = await custom.locator("[data-native-custom-theme]").evaluate(node => getComputedStyle(node).getPropertyValue("--colorBrandBackground").trim());
  assert.deepEqual(customThemeValues, { gap: "9px", token: "tomato" }, "composed custom properties use later-pack precedence and reach React descendants");
  assert.equal(nativeCustomProperty, "11px", "applySharePointTheme forwards custom theme properties");
  assert.equal(nativeFluentToken, "rgb(21, 77, 143)", "applySharePointTheme forwards native Fluent values in a design pack");
  const paletteValues = await custom.locator("[data-palette-probe]").evaluate(node => { const style = getComputedStyle(node.closest("spui-text")); return { background: style.getPropertyValue("--spui-palette-neutral-lighter").trim(), accent: style.getPropertyValue("--spui-ui-accent").trim() }; });
  const customRoleOverride = await custom.locator("[data-precedence-probe]").evaluate(node => getComputedStyle(node.closest("spui-text")).getPropertyValue("--spui-ui-accent").trim());
  const fluentPackValues = await custom.locator("[data-fluent-pack-probe]").evaluate(node => { const style = getComputedStyle(node.closest("spui-text")); return { color: style.getPropertyValue("--colorBrandBackground").trim(), spacing: style.getPropertyValue("--spacingHorizontalM").trim() }; });
  const fluentThemeCoverage = await custom.locator("[data-full-theme-probe]").evaluate(node => { const style = getComputedStyle(node.closest("spui-text")); const expected = window.fluentThemeExpected; const missing = Object.entries(expected).filter(([name, value]) => style.getPropertyValue(`--${name}`).trim() !== String(value).trim()).map(([name]) => name); return { total: Object.keys(expected).length, missing }; });
  assert.deepEqual(paletteValues, { background: "rgb(244, 246, 248)", accent: "rgb(22, 119, 204)" }, "SharePoint palette colors and themePrimary are exposed as theme tokens");
  assert.equal(customRoleOverride, "rgb(12, 34, 56)", "custom properties override semantic roles in a composed theme pack");
  assert.deepEqual(fluentPackValues, { color: "rgb(21, 77, 143)", spacing: "22px" }, "named Fluent tokens compose and reach component theme scopes");
  assert.equal(fluentThemeCoverage.total, 459, "the pinned Fluent v9 theme baseline contains 459 token values");
  assert.deepEqual(fluentThemeCoverage.missing, [], "all named Fluent theme tokens survive the typed pack and provider without loss");
  await custom.close();
  console.log(JSON.stringify({ status: "passed", light: values.light, dark: values.dark, focusContrast: strongFocusSamples, forcedColorsFocus: forcedFocus, explicitFocusBorder, explicitOverrides: true, disabledForeground: true, layerValues, composedCustomProperties: customThemeValues, nativeCustomProperty, nativeFluentToken, paletteValues, customRoleOverride, fluentPackValues, fluentThemeCoverage, buttonPressedThemeRole: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
