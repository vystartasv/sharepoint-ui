import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { contrastRatio } from "./lib/color-contrast.mjs";

const bundle = await build({
  stdin: {
    sourcefile: "nav-theme-contrast.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Nav,NavItem}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";const appearances=["fluent","ios","windows","linux","glass"];const brands=[{name:"blue",color:"#1769aa",strong:"#092b4f"},{name:"green",color:"#217a36",strong:"#153b27"},{name:"pink",color:"#c83282",strong:"#47172f"},{name:"tenant-teal",color:"#007780",strong:"#003c3e"}];const directions=["ltr","rtl"];function App(){return <>{appearances.flatMap(appearance=>brands.flatMap(brand=>["light","strong"].flatMap(surface=>directions.map(dir=>{const id=brand.name+"-"+appearance+"-"+surface+"-"+dir;const background=surface==="light"?"#ffffff":brand.strong;return <section key={id} data-case={id} dir={dir} style={{colorScheme:surface==="light"?"light":"dark",backgroundColor:background,color:surface==="light"?"#242424":"#ffffff","--spui-semantic-body-text":surface==="light"?"#242424":"#ffffff","--spui-semantic-body-background":background}}><SharePointUIProvider appearance={appearance} dir={dir} theme={{brandColor:brand.color}} tokens={{"--spui-color-scheme":surface==="light"?"light":"dark"}}><Nav label="Primary navigation" selectedValue="home"><NavItem value="home" href="#home">Home</NavItem><NavItem value="reports" href="#reports">Reports</NavItem></Nav></SharePointUIProvider></section>}))))}</>}createRoot(document.querySelector("#root")).render(<App/>);`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='root'></main><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelectorAll("section spui-nav-item").length === 160);
  await page.keyboard.press("Tab");
  const focusChecks = await page.locator("section").evaluateAll(sections => sections.map(section => {
    const host = section.querySelector('spui-nav-item[value="home"]');
    const control = host.shadowRoot.querySelector("a,button");
    control.focus();
    const style = getComputedStyle(control);
    return { case: section.dataset.case, outline: style.outlineColor, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, surface: getComputedStyle(section).backgroundColor };
  }));
  const focusContrasts = focusChecks.map(item => ({ ...item, contrast: item.outlineStyle === "none" || Number.parseFloat(item.outlineWidth) < 2 ? 0 : Number(contrastRatio(item.outline, item.surface, item.surface).toFixed(2)) }));
  const focusFailures = focusContrasts.filter(item => item.contrast < 3);
  const measured = await page.locator("section").evaluateAll(sections => sections.flatMap(section => {
    const navItems = [...section.querySelectorAll("spui-nav-item")];
    return navItems.map(host => {
      const control = host.shadowRoot.querySelector("a,button");
      const style = getComputedStyle(control);
      return { case: section.dataset.case, value: host.getAttribute("value"), selected: host.hasAttribute("selected"), foreground: style.color, background: style.backgroundColor, surface: getComputedStyle(section).backgroundColor };
    });
  }));
  const checks = measured.map(item => ({ ...item, contrast: Number(contrastRatio(item.foreground, item.background, item.surface).toFixed(2)) }));
  const failures = checks.filter(item => item.contrast < 4.5);
  assert.equal(errors.length, 0, `no browser errors: ${errors.join(" | ")}`);
  assert.equal(failures.length, 0, `Nav labels must meet 4.5:1; failing samples: ${JSON.stringify(failures.slice(0, 8))}`);
  assert.equal(focusFailures.length, 0, `Nav keyboard focus indicators must meet 3:1 and be at least 2px; failing samples: ${JSON.stringify(focusFailures.slice(0, 8))}`);
  const report = { status: "passed", cases: 80, measuredLabels: checks.length, measuredFocusIndicators: focusContrasts.length, appearances: ["fluent", "ios", "windows", "linux", "glass"], brands: ["blue", "green", "pink", "tenant teal"], surfaces: ["light", "brand-paired strong"], directions: ["ltr", "rtl"], minimumText: checks.reduce((min, item) => item.contrast < min.contrast ? item : min), minimumFocus: focusContrasts.reduce((min, item) => item.contrast < min.contrast ? item : min), failures: failures.length, focusFailures: focusFailures.length, pageErrors: errors.length };
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
