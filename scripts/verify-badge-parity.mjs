import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Badge,CounterBadge,PresenceBadge}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<><Badge data-testid="badge" className="parity-badge" title="Badge host props" color="warning" appearance="tint" shape="rounded" size="large" icon={<b>!</b>} iconPosition="after" style={{"--spui-ui-warning":"rgb(130, 80, 0)","--spui-ui-warning-surface":"rgb(255, 244, 206)"}}>Review</Badge><CounterBadge data-testid="overflow" count={105} overflowCount={99}/><CounterBadge data-testid="zero" count={0}/><CounterBadge data-testid="show-zero" count={0} showZero/><CounterBadge data-testid="dot" count={8} dot/><PresenceBadge data-testid="available" status="available" style={{"--spui-ui-success":"rgb(16, 124, 16)"}}/><PresenceBadge data-testid="oof" status="busy" outOfOffice aria-label="Busy, out of office"/></>);`,
    resolveDir: root,
    sourcefile: "badge-parity.tsx",
    loader: "tsx",
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve(root, "node_modules/react"), "react-dom/client": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve(root, "examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
const { webLightTheme, webDarkTheme } = require(resolve(root, "examples/spfx124-webpart/node_modules/@fluentui/react-theme"));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=badge]")?.shadowRoot?.querySelector("slot").assignedNodes().length);

  const paletteContract = {
    brand: { filled: ["colorBrandBackground", "colorNeutralForegroundOnBrand"], ghost: ["colorBrandForeground1"], outline: ["colorBrandForeground1", "colorBrandForeground1"], tint: ["colorBrandBackground2", "colorBrandForeground2", "colorBrandStroke2"] },
    danger: { filled: ["colorPaletteRedBackground3", "colorNeutralForegroundOnBrand"], ghost: ["colorPaletteRedForeground3"], outline: ["colorPaletteRedForeground3", "colorPaletteRedBorder2"], tint: ["colorPaletteRedBackground1", "colorPaletteRedForeground1", "colorPaletteRedBorder1"] },
    important: { filled: ["colorNeutralForeground1", "colorNeutralBackground1"], ghost: ["colorNeutralForeground1"], outline: ["colorNeutralForeground3", "colorNeutralStrokeAccessible"], tint: ["colorNeutralForeground3", "colorNeutralBackground1", "colorTransparentStroke"] },
    informative: { filled: ["colorNeutralBackground5", "colorNeutralForeground3"], ghost: ["colorNeutralForeground3"], outline: ["colorNeutralForeground3", "colorNeutralStroke2"], tint: ["colorNeutralBackground4", "colorNeutralForeground3", "colorNeutralStroke2"] },
    severe: { filled: ["colorPaletteDarkOrangeBackground3", "colorNeutralForegroundOnBrand"], ghost: ["colorPaletteDarkOrangeForeground3"], outline: ["colorPaletteDarkOrangeForeground3", "colorPaletteDarkOrangeForeground3"], tint: ["colorPaletteDarkOrangeBackground1", "colorPaletteDarkOrangeForeground1", "colorPaletteDarkOrangeBorder1"] },
    subtle: { filled: ["colorNeutralBackground1", "colorNeutralForeground1"], ghost: ["colorNeutralForegroundStaticInverted"], outline: ["colorNeutralForegroundStaticInverted", "colorNeutralForegroundStaticInverted"], tint: ["colorNeutralBackground1", "colorNeutralForeground3", "colorNeutralStroke2"] },
    success: { filled: ["colorPaletteGreenBackground3", "colorNeutralForegroundOnBrand"], ghost: ["colorPaletteGreenForeground3"], outline: ["colorPaletteGreenForeground3", "colorPaletteGreenBorder2"], tint: ["colorPaletteGreenBackground1", "colorPaletteGreenForeground1", "colorPaletteGreenBorder1"] },
    warning: { filled: ["colorPaletteYellowBackground3", "colorNeutralForeground1Static"], ghost: ["colorPaletteYellowForeground2"], outline: ["colorPaletteYellowForeground2", "colorPaletteYellowForeground2"], tint: ["colorPaletteYellowBackground1", "colorPaletteYellowForeground1", "colorPaletteYellowBorder1"] },
  };
  const measureBadgePalette = (theme, mode) => page.evaluate(({ theme, contract, mode }) => {
    for (const [name, value] of Object.entries(theme)) document.body.style.setProperty(`--${name}`, value);
    const rgb = token => { const value = theme[token]; if (value === "transparent") return "rgba(0, 0, 0, 0)"; const hex = value.slice(1); return `rgb(${[0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16)).join(", ")})`; };
    const output = [];
    for (const [color, appearances] of Object.entries(contract)) for (const [appearance, tokens] of Object.entries(appearances)) {
      const element = document.createElement("spui-badge"); element.setAttribute("color", color); element.setAttribute("appearance", appearance); element.textContent = `${color} ${appearance}`; document.body.append(element);
      const style = getComputedStyle(element);
      const expected = appearance === "filled" ? ["backgroundColor", "color", "borderColor"] : appearance === "tint" ? ["backgroundColor", "color", "borderColor"] : appearance === "outline" ? ["backgroundColor", "color", "borderColor"] : ["backgroundColor", "color", "borderColor"];
      const values = [style.backgroundColor, style.color, style.borderColor];
      const wanted = appearance === "ghost" ? ["rgba(0, 0, 0, 0)", rgb(tokens[0]), "rgba(0, 0, 0, 0)"] : appearance === "outline" ? ["rgba(0, 0, 0, 0)", rgb(tokens[0]), rgb(tokens[1])] : tokens.length === 2 ? [rgb(tokens[0]), rgb(tokens[1]), "rgba(0, 0, 0, 0)"] : [rgb(tokens[0]), rgb(tokens[1]), rgb(tokens[2])];
      const luminance = input => { const channels = input.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => { const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }); return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722; };
      const contrast = values[0].startsWith("rgba") ? null : (() => { const ranks = [luminance(values[0]), luminance(values[1])].sort((a, b) => b - a); return (ranks[0] + 0.05) / (ranks[1] + 0.05); })();
      output.push({ mode, color, appearance, values, wanted, contrast }); element.remove();
    }
    return output;
  }, { theme, contract: paletteContract, mode });
  const badgePalette = [...await measureBadgePalette(webLightTheme, "light"), ...await measureBadgePalette(webDarkTheme, "dark")];
  for (const result of badgePalette) {
    assert.deepEqual(result.values, result.wanted, `${result.color}/${result.appearance} resolves Fluent palette tokens: ${JSON.stringify(result)}`);
    if (result.contrast !== null) assert.ok(result.contrast >= 4.5, `${result.color}/${result.appearance} text contrast ${result.contrast.toFixed(2)}:1`);
  }
  await page.evaluate(theme => { for (const [name, value] of Object.entries(theme)) document.body.style.setProperty(`--${name}`, value); }, webLightTheme);
  const badgeSizes = await page.evaluate(() => ["tiny", "extra-small", "small", "medium", "large", "extra-large"].map(size => {
    const element = document.createElement("spui-badge"); element.setAttribute("size", size); document.body.append(element);
    const rect = element.getBoundingClientRect(); const result = { size, width: rect.width, height: rect.height }; element.remove(); return result;
  }));
  assert.deepEqual(badgeSizes.map(({ width, height }) => [width, height]), [[6,6],[10,10],[16,16],[20,20],[24,24],[32,32]], "all Badge sizes match Fluent dimensions");
  await page.emulateMedia({ forcedColors: "active" });
  const forcedColors = await page.evaluate(() => {
    document.body.style.backgroundColor = "Canvas";
    const result = { active: matchMedia("(forced-colors: active)").matches, badges: {} };
    const luminance = input => { const channels = input.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => { const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }); return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722; };
    for (const appearance of ["filled", "ghost", "outline", "tint"]) {
      const element = document.createElement("spui-badge"); element.setAttribute("appearance", appearance); element.textContent = appearance; document.body.append(element);
      const style = getComputedStyle(element), background = style.backgroundColor.includes(", 0)") ? getComputedStyle(document.body).backgroundColor : style.backgroundColor;
      const ranks = [luminance(style.color), luminance(background)].sort((a, b) => b - a);
      result.badges[appearance] = { background, foreground: style.color, border: style.borderColor, contrast: (ranks[0] + 0.05) / (ranks[1] + 0.05) }; element.remove();
    }
    const presence = document.createElement("spui-presence-badge"); presence.setAttribute("status", "busy"); document.body.append(presence);
    const style = getComputedStyle(presence); result.presence = { background: style.backgroundColor, foreground: style.color, border: style.borderColor }; presence.remove(); return result;
  });
  assert.equal(forcedColors.active, true, "forced-colors emulation is active");
  for (const [appearance, result] of Object.entries(forcedColors.badges)) {
    assert.ok(result.contrast >= 7, `${appearance} Badge forced-colors text contrast is ${result.contrast.toFixed(2)}:1`);
    assert.notEqual(result.border, "rgba(0, 0, 0, 0)", `${appearance} Badge keeps a visible system-color boundary`);
  }
  assert.notEqual(forcedColors.presence.background, forcedColors.presence.foreground, "PresenceBadge uses Canvas behind CanvasText so its status glyph remains visible");
  await page.emulateMedia({ forcedColors: "none" });

  const badge = page.getByTestId("badge");
  assert.equal(await badge.getAttribute("class"), "parity-badge", "React Badge forwards className to its custom-element host");
  assert.equal(await badge.getAttribute("title"), "Badge host props", "React Badge forwards inherited native title props");
  assert.equal(await badge.getAttribute("appearance"), "tint");
  assert.equal(await badge.getAttribute("color"), "warning");
  assert.equal(await badge.evaluate(host => getComputedStyle(host).borderRadius), "6px", "rounded shape uses the compact rounded geometry");
  assert.equal(await badge.evaluate(host => getComputedStyle(host).fontSize), "14px", "large size applies");
  const iconOrder = await badge.evaluate(host => {
    const icon = host.shadowRoot.querySelector(".icon").getBoundingClientRect();
    const content = host.shadowRoot.querySelector(".content").getBoundingClientRect();
    return { icon: icon.left, content: content.left, background: getComputedStyle(host).backgroundColor };
  });
  assert.ok(iconOrder.icon > iconOrder.content, `iconPosition=after positions the icon after text (${JSON.stringify(iconOrder)})`);
  assert.equal(iconOrder.background, `rgb(${[0, 2, 4].map(index => parseInt(webLightTheme.colorPaletteYellowBackground1.slice(1).slice(index, index + 2), 16)).join(", ")})`, "tint appearance inherits the Fluent warning tint token");
  const warningContrast = await badge.evaluate(host => {
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => { const c = channel / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    const [foreground, background] = [getComputedStyle(host).color, getComputedStyle(host).backgroundColor].map(rgb);
    const luminance = channels => channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  });
  assert.ok(warningContrast >= 4.5, `warning badge text has 4.5:1 contrast (${warningContrast})`);

  const overflow = page.getByTestId("overflow");
  assert.equal(await overflow.locator(".content").textContent(), "99+", "count is capped at overflowCount");
  assert.equal(await overflow.getAttribute("aria-label"), "99+");
  await overflow.evaluate(host => host.setAttribute("count", "42"));
  assert.equal(await overflow.locator(".content").textContent(), "42");
  assert.equal(await overflow.getAttribute("aria-label"), "42", "generated count labels stay current when count changes");
  assert.equal(await page.getByTestId("zero").evaluate(host => getComputedStyle(host).display), "none", "zero is hidden unless showZero is enabled");
  assert.equal(await page.getByTestId("show-zero").locator(".content").textContent(), "0");
  assert.equal(await page.getByTestId("dot").evaluate(host => host.shadowRoot.querySelector(".content").getBoundingClientRect().width), 0, "dot mode hides the numeric label");

  const available = page.getByTestId("available");
  assert.equal(await available.getAttribute("role"), "img");
  assert.equal(await available.getAttribute("aria-label"), "available");
  assert.equal(await available.evaluate(host => getComputedStyle(host).backgroundColor), `rgb(${[0, 2, 4].map(index => parseInt(webLightTheme.colorNeutralBackground1.slice(1).slice(index, index + 2), 16)).join(", ")})`, "presence uses the neutral surface");
  assert.equal(await available.evaluate(host => getComputedStyle(host).color), `rgb(${[0, 2, 4].map(index => parseInt(webLightTheme.colorPaletteLightGreenForeground3.slice(1).slice(index, index + 2), 16)).join(", ")})`, "presence status color matches Fluent tokens");
  await available.evaluate(host => host.setAttribute("status", "away"));
  assert.equal(await available.getAttribute("aria-label"), "away", "generated presence labels track state changes");
  const oof = page.getByTestId("oof");
  assert.equal(await oof.getAttribute("aria-label"), "Busy, out of office", "explicit accessible status labels are preserved");
  await oof.evaluate(host => host.setAttribute("status", "offline"));
  assert.equal(await oof.getAttribute("aria-label"), "Busy, out of office", "explicit accessible labels remain authoritative on state changes");
  assert.equal(await oof.evaluate(host => host.shadowRoot.querySelector("svg").children.length), 3, "out-of-office marker is drawn as vector geometry");
  assert.equal(await oof.evaluate(host => host.shadowRoot.querySelector("svg").getAttribute("aria-hidden")), "true");

  await page.evaluate(() => {
    const element = document.createElement("spui-counter-badge");
    element.id = "native-counter"; element.setAttribute("count", "4"); document.body.append(element);
    const presence = document.createElement("spui-presence-badge");
    presence.id = "native-presence"; presence.setAttribute("status", "offline"); document.body.append(presence);
  });
  assert.equal(await page.locator("#native-counter .content").textContent(), "4", "direct custom-element attributes use the same engine");
  assert.equal(await page.locator("#native-presence").getAttribute("aria-label"), "offline");
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/badge-family.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", paletteMatrixCases: badgePalette.length, fluentTokenParity: true, badgeSizes, minimumFilledAndTintContrast: Math.min(...badgePalette.map(result => result.contrast).filter(value => value !== null)), forcedColors: { allAppearancesKeepAAContrastAndBoundaries: true, presenceUsesCanvasAndCanvasText: true }, themedBadgeVariants: true, iconPosition: true, counterZeroDotAndOverflow: true, presenceStatusesAndAccessibility: true, directCustomElements: true, noPageErrors: true, screenshot: "test-results/badge-family.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
