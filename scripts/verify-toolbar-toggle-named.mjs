import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "toolbar-toggle-named.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Toolbar,ToolbarToggleButton}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineToolbar}from"${resolve("packages/sharepoint-ui/src/elements/toolbar.ts")}";function App(){const[checkedValues,setCheckedValues]=React.useState({view:["grid"]});return <Toolbar data-testid="react-toolbar" checkedValues={checkedValues} onCheckedValueChange={(_event,data)=>{window.reactChange=data;setCheckedValues(current=>({...current,[data.name]:data.checkedItems}))}}><ToolbarToggleButton data-testid="react-grid" name="view" value="grid">Grid</ToolbarToggleButton><ToolbarToggleButton data-testid="react-details" name="view" value="details">Details</ToolbarToggleButton></Toolbar>}createRoot(document.querySelector("#react")).render(<App/>);window.mountNative=()=>{defineToolbar();const toolbar=document.createElement("spui-toolbar");toolbar.id="native-toolbar";toolbar.defaultCheckedValues={view:["grid"]};toolbar.addEventListener("spui-checked-value-change",event=>window.nativeChange=event.detail);for(const [value,label] of [["grid","Grid"],["details","Details"]]){const button=document.createElement("spui-toggle-button");button.setAttribute("name","view");button.setAttribute("value",value);button.textContent=label;toolbar.append(button)}document.querySelector("#native").append(toolbar)};`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=react></div><div id=native></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const grid = page.getByTestId("react-grid");
  const details = page.getByTestId("react-details");
  await page.waitForFunction(() => document.querySelector('[data-testid=react-grid]')?.hasAttribute("checked"));
  assert.equal(await grid.locator("button").getAttribute("aria-pressed"), "true", "named controlled values initialize the toggle");
  assert.equal(await details.locator("button").getAttribute("aria-pressed"), "false");
  await details.locator("button").click();
  await page.waitForFunction(() => document.querySelector('[data-testid=react-details]')?.hasAttribute("checked"));
  assert.deepEqual(await page.evaluate(() => window.reactChange), { name: "view", checkedItems: ["grid", "details"] }, "named toggles allow multiple values in one group");
  await grid.locator("button").click();
  await page.waitForFunction(() => !document.querySelector('[data-testid=react-grid]')?.hasAttribute("checked"));
  assert.deepEqual(await page.evaluate(() => window.reactChange), { name: "view", checkedItems: ["details"] }, "unchecking removes only that value");

  await page.evaluate(() => window.mountNative());
  const nativeToolbar = page.locator("#native-toolbar");
  const nativeGrid = nativeToolbar.locator('spui-toggle-button[value="grid"]');
  const nativeDetails = nativeToolbar.locator('spui-toggle-button[value="details"]');
  await page.waitForFunction(() => document.querySelector('#native-toolbar spui-toggle-button[value=grid]')?.hasAttribute("checked"));
  assert.equal(await nativeGrid.getAttribute("checked"), "");
  await nativeDetails.locator("button").click();
  await page.waitForFunction(() => document.querySelector('#native-toolbar spui-toggle-button[value=details]')?.hasAttribute("checked"));
  assert.deepEqual(await page.evaluate(() => window.nativeChange), { name: "view", checkedItems: ["grid", "details"] });
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", controlledNamedValues: true, multipleValuesPerName: true, customElementPath: true, pageErrors: 0 }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
