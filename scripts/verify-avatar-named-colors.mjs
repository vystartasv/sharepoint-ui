import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const require = createRequire(resolve("examples/spfx124-webpart/package.json"));
const { webLightTheme, webDarkTheme } = require("@fluentui/react-theme");
const themeData = theme => Object.fromEntries(Object.keys(theme)
  .filter(key => /^colorPalette[A-Z].*Background2$/.test(key) || /^colorPalette[A-Z].*Foreground2$/.test(key) || /^colorPalette[A-Z].*BorderActive$/.test(key))
  .map(key => [key, theme[key]]));
const light = themeData(webLightTheme);
const dark = themeData(webDarkTheme);
const colors = ["dark-red", "cranberry", "red", "pumpkin", "peach", "marigold", "gold", "brass", "brown", "forest", "seafoam", "dark-green", "light-teal", "teal", "steel", "blue", "royal-blue", "cornflower", "navy", "lavender", "purple", "grape", "lilac", "pink", "magenta", "plum", "beige", "mink", "platinum", "anchor"];
assert.equal(colors.length, 30, "reference theme exposes all 30 Fluent Avatar named colors");
const computedColor = value => {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value ?? "")?.[1];
  if (!hex) return value;
  const normalized = hex.length === 3 ? [...hex].map(channel => channel + channel).join("") : hex;
  return `rgb(${normalized.match(/[\da-f]{2}/gi).map(channel => Number.parseInt(channel, 16)).join(", ")})`;
};

const bundle = await build({
  stdin: {
    sourcefile: "avatar-named-colors.tsx", loader: "tsx", resolveDir: process.cwd(),
    contents: `import*as React from"react";import{createRoot}from"react-dom/client";import{AvatarGroupItem,Persona}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineAvatar}from"${resolve("packages/sharepoint-ui/src/elements/avatar.ts")}";const colors=${JSON.stringify(colors)};defineAvatar();for(const id of["light","dark","fallback-light","fallback-strong"])for(const color of colors){const avatar=document.createElement("spui-avatar");avatar.setAttribute("color",color);avatar.setAttribute("name",color);if(color==="blue")avatar.setAttribute("active","active");document.getElementById(id).append(avatar)}createRoot(document.getElementById("composed")).render(React.createElement(React.Fragment,null,React.createElement(AvatarGroupItem,{name:"Group blue",color:"blue","data-testid":"group-blue"}),React.createElement(Persona,{name:"Persona blue",color:"blue","data-testid":"persona-blue"})));`,
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end(`<!doctype html><meta charset=utf-8><div id="light"></div><div id="dark"></div><div id="fallback-light"></div><div id="fallback-strong"></div><div id="composed"></div><script>
  const light=${JSON.stringify(light)},dark=${JSON.stringify(dark)};
  for(const [id,theme,surface,text] of [["light",light,"#ffffff","#242424"],["dark",dark,"#292929","#ffffff"]]){const root=document.getElementById(id);root.style.setProperty("--spui-ui-surface",surface);root.style.setProperty("--spui-ui-text",text);for(const [name,value]of Object.entries(theme))root.style.setProperty("--"+name,value)}
  for(const [name,value]of Object.entries(light))document.getElementById("composed").style.setProperty("--"+name,value);
  document.getElementById("fallback-light").style.cssText="--spui-ui-surface:#ffffff;--spui-ui-text:#242424";
  document.getElementById("fallback-strong").style.cssText="--spui-ui-surface:#101820;--spui-ui-text:#ffffff";
  </script><script src="/bundle.js"></script>`));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("#light spui-avatar[color=anchor]")?.shadowRoot?.querySelector(".surface"));

  const measure = async (rootId, expectedTheme) => page.locator(`#${rootId} spui-avatar`).evaluateAll((avatars, theme) => avatars.map(avatar => {
    const name = avatar.getAttribute("color");
    const stem = name.split("-").map(part => part[0].toUpperCase() + part.slice(1)).join("");
    const surface = getComputedStyle(avatar.shadowRoot.querySelector(".surface"));
    return { name, background: surface.backgroundColor, foreground: surface.color, expectedBackground: theme[`colorPalette${stem}Background2`], expectedForeground: theme[`colorPalette${stem}Foreground2`], activeShadow: name === "blue" ? surface.boxShadow : undefined };
  }), expectedTheme);
  const ratio = (foreground, background) => {
    const linear = channel => { const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; };
    const rgb = color => {
      const srgb = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?:\s*\/[^)]+)?\)$/.exec(color);
      if (srgb) return srgb.slice(1).map(value => linear(Number(value) * 255));
      const channels = /rgb\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/.exec(color);
      return channels ? channels.slice(1).map(value => linear(Number(value))) : [0, 0, 0];
    };
    const luminance = color => { const [r, g, b] = rgb(color); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const a = luminance(foreground), b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const lightValues = await measure("light", light);
  const darkValues = await measure("dark", dark);
  const fluentContrast = {};
  for (const values of [lightValues, darkValues]) for (const item of values) {
    assert.equal(item.background, computedColor(item.expectedBackground), `${item.name} uses the active Fluent Background2 token`);
    assert.equal(item.foreground, computedColor(item.expectedForeground), `${item.name} uses the active Fluent Foreground2 token`);
  }
  for (const [scheme, values] of [["light", lightValues], ["dark", darkValues]]) {
    const ratios = values.map(item => ({ name: item.name, ratio: ratio(item.foreground, item.background) }));
    fluentContrast[scheme] = { samples: ratios.length, minimumContrast: Math.min(...ratios.map(item => item.ratio)), worstCase: ratios.reduce((worst, item) => item.ratio < worst.ratio ? item : worst) };
    assert.ok(fluentContrast[scheme].minimumContrast >= 4.5, `Fluent ${scheme} named colors meet 4.5:1`);
  }
  assert.ok(lightValues.find(item => item.name === "blue").activeShadow.includes(computedColor(webLightTheme.colorPaletteBlueBorderActive)), "active ring follows the named palette border token");

  const fallback = {};
  for (const rootId of ["fallback-light", "fallback-strong"]) {
    const values = await page.locator(`#${rootId} spui-avatar`).evaluateAll(avatars => avatars.map(avatar => {
      const style = getComputedStyle(avatar.shadowRoot.querySelector(".surface"));
      return { name: avatar.getAttribute("color"), foreground: style.color, background: style.backgroundColor };
    }));
    const contrast = values.map(item => ({ ...item, ratio: ratio(item.foreground, item.background) }));
    fallback[rootId] = { samples: contrast.length, minimumContrast: Math.min(...contrast.map(item => item.ratio)), worstCases: [...contrast].sort((a, b) => a.ratio - b.ratio).slice(0, 3) };
    assert.ok(fallback[rootId].minimumContrast >= 4.5, `${rootId} fallback named colors meet 4.5:1`);
  }

  const composed = await page.evaluate(() => ["group-blue", "persona-blue"].map(id => {
    const host = document.querySelector(`[data-testid=${id}]`);
    const avatar = host.matches("spui-avatar-group-item") ? host.shadowRoot.querySelector("spui-avatar") : host.shadowRoot.querySelector("spui-avatar");
    return { id, color: avatar.getAttribute("color"), background: getComputedStyle(avatar.shadowRoot.querySelector(".surface")).backgroundColor };
  }));
  assert.deepEqual(composed.map(item => item.background), [computedColor(webLightTheme.colorPaletteBlueBackground2), computedColor(webLightTheme.colorPaletteBlueBackground2)], "AvatarGroupItem and Persona preserve named colors");
  await page.emulateMedia({ forcedColors: "active" });
  const forcedColors = await page.locator("#light spui-avatar[color=blue]").evaluate(avatar => ({
    active: matchMedia("(forced-colors: active)").matches,
    background: getComputedStyle(avatar.shadowRoot.querySelector(".surface")).backgroundColor,
    foreground: getComputedStyle(avatar.shadowRoot.querySelector(".surface")).color,
    outline: getComputedStyle(avatar.shadowRoot.querySelector(".surface")).outlineColor,
  }));
  assert.equal(forcedColors.active, true);
  assert.notEqual(forcedColors.background, computedColor(webLightTheme.colorPaletteBlueBackground2), "forced colors replace named palette fill");
  assert.notEqual(forcedColors.foreground, computedColor(webLightTheme.colorPaletteBlueForeground2), "forced colors replace named palette text");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", namedColorCount: colors.length, lightAndDarkThemeTokenParity: true, fluentContrast, fallback, activeRingNamedToken: true, composed, forcedColors, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
