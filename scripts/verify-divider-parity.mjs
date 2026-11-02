import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Divider}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineDivider}from"${resolve("packages/sharepoint-ui/src/elements/divider.ts")}";defineDivider();createRoot(document.querySelector("#root")).render(<><Divider data-testid="brand" appearance="brand" alignContent="start" style={{"--spui-base-accent":"rgb(20, 100, 200)"}}><span>Section</span></Divider><Divider data-testid="strong" appearance="strong" /><Divider data-testid="custom-wrapper" wrapper={<strong data-testid="divider-wrapper">Custom heading</strong>}><span data-testid="ignored-default">Ignored fallback</span></Divider><div style={{display:"flex",height:80,alignItems:"stretch"}}><Divider data-testid="vertical" vertical appearance="subtle" /></div></>);`,
    resolveDir: process.cwd(), sourcefile: "divider-parity.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 650 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=brand]")?.shadowRoot?.querySelector("slot[name=wrapper]").assignedNodes().length);

  const brand = page.getByTestId("brand");
  assert.equal(await brand.getAttribute("role"), "separator", "labeled dividers retain separator semantics");
  assert.equal(await brand.evaluate(host => host.getAttribute("data-orientation")), "horizontal");
  assert.equal(await brand.getAttribute("aria-orientation"), "horizontal");
  const brandLabelId = await brand.getAttribute("aria-labelledby");
  assert.ok(brandLabelId, "labeled divider references its wrapper as the accessible name");
  assert.equal(await brand.evaluate((host, id) => [...host.children].find(child => child.id === id)?.textContent?.trim(), brandLabelId), "Section");
  assert.equal(await brand.evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".line")).backgroundColor), "rgb(20, 100, 200)", "brand appearance derives from the active theme accent");
  const alignment = await brand.evaluate(host => [...host.shadowRoot.querySelectorAll(".line")].map(line => line.getBoundingClientRect().width));
  assert.ok(alignment[0] < alignment[1], `alignContent=start places content at the beginning (${alignment})`);

  const customWrapper = page.getByTestId("custom-wrapper");
  assert.equal(await page.getByTestId("divider-wrapper").textContent(), "Custom heading", "React wrapper slot content is rendered");
  assert.equal(await page.getByTestId("ignored-default").count(), 0, "a custom wrapper replaces the default children slot");
  assert.equal(await customWrapper.evaluate(host => host.shadowRoot.querySelector("slot[name=wrapper]").assignedElements().length), 1, "React wrapper is assigned to the named wrapper slot");
  assert.equal(await customWrapper.getAttribute("role"), "separator");
  assert.equal(await customWrapper.getAttribute("aria-labelledby"), await customWrapper.evaluate(host => host.firstElementChild.id));

  const strong = page.getByTestId("strong");
  assert.equal(await strong.getAttribute("role"), "separator");
  assert.equal(await strong.getAttribute("aria-orientation"), "horizontal");
  const strongColor = await strong.evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".line")).backgroundColor);
  assert.notEqual(strongColor, "rgb(209, 209, 209)", "strong appearance changes the default divider stroke");
  assert.deepEqual(await strong.evaluate(host => [...host.shadowRoot.querySelectorAll(".line")].map(line => getComputedStyle(line).display)), ["block", "none"], "unlabeled dividers render one continuous rule");
  const strongWidth = await strong.evaluate(host => host.shadowRoot.querySelector(".line").getBoundingClientRect().width / host.getBoundingClientRect().width);
  assert.ok(strongWidth > 0.95, `unlabeled rule spans the divider (${strongWidth})`);

  const vertical = page.getByTestId("vertical");
  assert.equal(await vertical.getAttribute("role"), "separator");
  assert.equal(await vertical.getAttribute("aria-orientation"), "vertical");
  const bounds = await vertical.boundingBox();
  assert.ok(bounds.height > 40 && bounds.width <= 2, `vertical divider stretches along its parent's cross axis (${JSON.stringify(bounds)})`);

  await page.evaluate(() => {
    const divider = document.createElement("spui-divider");
    divider.id = "native-divider";
    divider.setAttribute("vertical", "");
    divider.setAttribute("appearance", "brand");
    document.body.append(divider);
  });
  const native = page.locator("#native-divider");
  assert.equal(await native.getAttribute("role"), "separator", "direct custom-element attributes retain separator semantics");
  assert.equal(await native.getAttribute("aria-orientation"), "vertical", "direct custom-element attributes follow the same engine");
  assert.equal(await native.getAttribute("data-divider-appearance"), "brand");
  await page.evaluate(() => {
    const divider = document.createElement("spui-divider");
    divider.id = "native-wrapped-divider";
    divider.innerHTML = '<strong slot="wrapper" id="native-wrapper">Native label</strong>';
    document.body.append(divider);
  });
  assert.equal(await page.locator("#native-wrapped-divider").evaluate(host => host.shadowRoot.querySelector("slot[name=wrapper]").assignedElements().some(element => element.id === "native-wrapper")), true, "native wrapper slot is assigned");
  assert.equal(await page.locator("#native-wrapped-divider").getAttribute("role"), "separator");
  assert.equal(await page.locator("#native-wrapped-divider").getAttribute("aria-label"), "Native label", "native slotted labels give the separator an accessible name");
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve("test-results/divider-parity.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", reactAndNativeAdapters: true, separatorAndLabelSemantics: true, verticalOrientation: true, themedAppearanceVariants: true, alignContent: true, noPageErrors: true, screenshot: "test-results/divider-parity.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
