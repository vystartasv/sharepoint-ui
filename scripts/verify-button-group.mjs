import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: { contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { Button, ButtonGroup } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import { defineButtonGroup } from "${resolve("packages/sharepoint-ui/src/elements/button-group.ts")}"; createRoot(document.querySelector("#react")).render(<ButtonGroup label="File actions" data-testid="react-group"><Button data-testid="react-save">Save</Button><Button data-testid="react-share">Share</Button></ButtonGroup>); window.mountNative=()=>{defineButtonGroup(); const group=document.createElement("spui-button-group"); group.setAttribute("aria-label","إجراءات الملف"); group.setAttribute("orientation","vertical"); group.dataset.testid="native-group"; for(const [id,label] of [["native-save","حفظ"],["native-share","مشاركة"]]){const button=document.createElement("button");button.dataset.testid=id;button.textContent=label;group.append(button)} document.querySelector("#native").dir="rtl"; document.querySelector("#native").append(group)};`,
    resolveDir: process.cwd(), sourcefile: "button-group-check.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='react'></main><main id='native'></main><script src='/bundle.js'></script><script>window.mountNative()</script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const react = page.getByTestId("react-group");
  assert.equal(await react.getAttribute("role"), "group");
  assert.equal(await react.getAttribute("aria-label"), "File actions");
  assert.equal(await react.getAttribute("orientation"), "horizontal");
  const horizontalButtons = await Promise.all([page.getByTestId("react-save"), page.getByTestId("react-share")].map(node => node.boundingBox()));
  assert.ok(horizontalButtons[0].x < horizontalButtons[1].x && Math.abs(horizontalButtons[0].y - horizontalButtons[1].y) < 1, "horizontal orientation lays out controls inline");
  await page.getByTestId("react-save").focus(); await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.testid), "react-share");
  const native = page.getByTestId("native-group");
  assert.equal(await native.getAttribute("role"), "group");
  assert.equal(await native.getAttribute("aria-label"), "إجراءات الملف");
  assert.equal(await native.getAttribute("orientation"), "vertical");
  const verticalButtons = await Promise.all([page.getByTestId("native-save"), page.getByTestId("native-share")].map(node => node.boundingBox()));
  assert.ok(verticalButtons[0].y < verticalButtons[1].y, "vertical orientation stacks controls");
  await page.getByTestId("native-save").focus(); await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.testid), "native-share");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", viewport: "390x844", reactGroupLabelAndOrientation: true, horizontalLayout: true, nativeArabicRtlGroup: true, verticalLayout: true, nativeButtonTabSequence: true, pageErrors: errors.length }));
} finally { await browser?.close(); server.close(); }
