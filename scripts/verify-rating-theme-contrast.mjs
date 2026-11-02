import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { contrastRatio } from "./lib/color-contrast.mjs";

const bundle = await build({
  stdin: {
    sourcefile: "rating-theme-contrast.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Rating,RatingDisplay}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";const appearances=["fluent","ios","windows","linux","glass"];const brands=[{name:"blue",color:"#1769aa",strong:"#092b4f"},{name:"green",color:"#217a36",strong:"#153b27"},{name:"pink",color:"#c83282",strong:"#47172f"},{name:"tenant-teal",color:"#007780",strong:"#003c3e"}];function App(){return <>{appearances.flatMap(appearance=>brands.flatMap(brand=>["light","strong"].flatMap(surface=>["ltr","rtl"].flatMap(dir=>["neutral","brand","marigold"].map(color=>{const id=brand.name+"-"+appearance+"-"+surface+"-"+dir+"-"+color;const background=surface==="light"?"#ffffff":brand.strong;return <section key={id} data-case={id} dir={dir} style={{colorScheme:surface==="light"?"light":"dark",backgroundColor:background,color:surface==="light"?"#242424":"#ffffff","--spui-semantic-body-text":surface==="light"?"#242424":"#ffffff","--spui-semantic-body-background":background}}><SharePointUIProvider appearance={appearance} dir={dir} theme={{brandColor:brand.color}} tokens={{"--spui-color-scheme":surface==="light"?"light":"dark"}}><Rating label="Priority" value={3} readOnly color={color}/><RatingDisplay label="Priority display" value={3} color={color}/></SharePointUIProvider></section>})))))}</>}createRoot(document.querySelector("#root")).render(<App/>);`,
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
  await page.waitForFunction(() => document.querySelectorAll("section spui-rating").length === 240 && document.querySelectorAll("section spui-rating-display").length === 240);
  const readings = await page.locator("section").evaluateAll(sections => sections.flatMap(section => {
    const backdrop = getComputedStyle(section).backgroundColor;
    const ratings = [...section.querySelectorAll("spui-rating,spui-rating-display")];
    return ratings.flatMap(host => {
      const items = host.localName === "spui-rating" ? [...host.shadowRoot.querySelectorAll(".star")] : [...host.shadowRoot.querySelectorAll("spui-rating-item")];
      const hostStyle = getComputedStyle(host);
      return items.flatMap((item, index) => {
        const root = host.localName === "spui-rating" ? item : item.shadowRoot;
        const empty = root.querySelector(host.localName === "spui-rating" ? ".icon" : ".outline");
        const filled = root.querySelector(host.localName === "spui-rating" ? ".fill" : ".filled");
        const colors = [{ state: "empty-outline", foreground: getComputedStyle(empty).color }];
        if (filled && filled.getBoundingClientRect().width > 0) colors.push({ state: "filled", foreground: getComputedStyle(filled).color });
        return colors.map(({ state, foreground }) => ({ component: host.localName, case: section.dataset.case, star: index + 1, state, foreground, background: backdrop, uiText: hostStyle.getPropertyValue("--spui-ui-text").trim(), uiMuted: hostStyle.getPropertyValue("--spui-ui-muted").trim(), uiSurface: hostStyle.getPropertyValue("--spui-ui-surface").trim(), bodyText: hostStyle.getPropertyValue("--spui-semantic-body-text").trim(), bodySubtext: hostStyle.getPropertyValue("--spui-semantic-body-subtext").trim() }));
      });
    });
  }));
  const checks = readings.map(item => ({ ...item, contrast: Number(contrastRatio(item.foreground, item.background).toFixed(2)) }));
  const failures = checks.filter(item => item.contrast < 3);
  assert.equal(errors.length, 0, `no browser errors: ${errors.join(" | ")}`);
  assert.equal(failures.length, 0, `Rating graphical states must meet 3:1; failing samples: ${JSON.stringify(failures.slice(0, 10))}`);
  console.log(JSON.stringify({ status: "passed", cases: 240, components: ["Rating", "RatingDisplay"], starStateReadings: checks.length, colors: ["neutral", "brand", "marigold"], appearances: ["fluent", "ios", "windows", "linux", "glass"], brands: ["blue", "green", "pink", "tenant teal"], surfaces: ["light", "brand-paired strong"], directions: ["ltr", "rtl"], minimum: checks.reduce((min, item) => item.contrast < min.contrast ? item : min), failures: failures.length, pageErrors: errors.length }, null, 2));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
