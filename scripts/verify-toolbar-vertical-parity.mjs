import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "toolbar-vertical.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Toolbar,ToolbarButton,ToolbarDivider}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineToolbar}from"${resolve("packages/sharepoint-ui/src/elements/toolbar.ts")}";createRoot(document.querySelector("#react")).render(<Toolbar data-testid="toolbar" vertical><ToolbarButton data-testid="vertical-button" vertical icon={<span>★</span>}>Vertical</ToolbarButton><ToolbarDivider vertical={false}/><ToolbarButton data-testid="horizontal-button">Horizontal</ToolbarButton></Toolbar>);defineToolbar();const native=document.createElement("spui-toolbar");native.id="native";native.setAttribute("vertical","");const divider=document.createElement("spui-toolbar-separator");divider.setAttribute("vertical","false");native.append(document.createElement("button"),divider);document.querySelector("#native-root").append(native);`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=react></div><div id=native-root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const toolbar = page.getByTestId("toolbar");
  await page.waitForFunction(() => document.querySelector("[data-testid=vertical-button]")?.shadowRoot?.querySelector("button"));
  assert.equal(await toolbar.getAttribute("orientation"), "vertical", "vertical aliases toolbar orientation");
  assert.equal(await toolbar.locator("spui-toolbar-separator").getAttribute("aria-orientation"), "horizontal", "vertical toolbar defaults to horizontal divider");
  assert.equal(await page.getByTestId("vertical-button").locator("button").evaluate(button => getComputedStyle(button).flexDirection), "column", "ToolbarButton vertical stacks its contents");
  assert.equal(await page.getByTestId("horizontal-button").locator("button").evaluate(button => getComputedStyle(button).flexDirection), "row", "ToolbarButton default remains horizontal");
  assert.equal(await toolbar.locator("spui-toolbar-separator[vertical=false]").getAttribute("aria-orientation"), "horizontal", "explicit divider orientation overrides toolbar context");
  const native = page.locator("#native");
  assert.equal(await native.getAttribute("data-orientation"), "vertical", "direct custom-element vertical attribute works");
  assert.equal(await native.locator("spui-toolbar-separator").getAttribute("aria-orientation"), "horizontal", "direct custom-element divider override works");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", verticalToolbar: true, verticalButton: true, dividerOverride: true, reactAndCustomElement: true, pageErrors: 0 }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
