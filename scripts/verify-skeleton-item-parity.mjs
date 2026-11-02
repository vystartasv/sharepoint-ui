import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Skeleton,SkeletonItem}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<SharePointUIProvider><Skeleton data-testid="composition" aria-label="Loading profile" animation="pulse" appearance="translucent"><SkeletonItem data-testid="avatar" shape="circle" size={40}/><SkeletonItem data-testid="line" size={20}/></Skeleton><Skeleton data-testid="plain" shape="circle" width="48px" height="48px" animated={false}/><Skeleton data-testid="override" animation="wave"><SkeletonItem data-testid="override-item" animation="none" shape="square" size={32}/></Skeleton></SharePointUIProvider>);`,
    resolveDir: root,
    sourcefile: "skeleton-item-parity.tsx",
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
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const skeleton = page.getByTestId("composition");
  assert.equal(await page.getByRole("progressbar", { name: "Loading profile" }).count(), 1, "composed Skeleton exposes a labelled progressbar");
  const avatar = page.getByTestId("avatar");
  assert.equal(await avatar.getAttribute("data-shape"), "circle");
  assert.equal(await avatar.getAttribute("data-size"), "40");
  assert.equal(await avatar.getAttribute("data-animation"), "pulse", "animation inherits from Skeleton");
  assert.equal(await avatar.getAttribute("data-appearance"), "translucent", "appearance inherits from Skeleton");
  assert.equal(await avatar.evaluate(node => getComputedStyle(node).width), "40px");
  assert.equal(await page.getByTestId("line").evaluate(node => getComputedStyle(node).height), "20px");
  assert.equal(await skeleton.getAttribute("data-has-items"), "", "composition switches parent to slot mode");

  const plain = page.getByTestId("plain");
  assert.equal(await plain.getAttribute("aria-hidden"), "true", "standalone legacy Skeleton remains hidden from assistive technology");
  assert.equal(await plain.evaluate(node => getComputedStyle(node).width), "48px");
  assert.equal(await page.getByTestId("override-item").getAttribute("data-animation"), "none", "item-level motion overrides parent motion");
  assert.equal(await page.getByTestId("override-item").getAttribute("data-size"), "32");

  await page.evaluate(() => {
    const parent = document.createElement("spui-skeleton"); parent.setAttribute("aria-label", "Native loading"); parent.setAttribute("animation", "wave"); parent.setAttribute("size", "24");
    const item = document.createElement("spui-skeleton-item"); item.setAttribute("shape", "square"); parent.append(item); document.body.append(parent);
  });
  const native = page.locator("spui-skeleton[aria-label='Native loading']");
  assert.equal(await native.getAttribute("role"), "progressbar", "framework-neutral composition gets progressbar semantics");
  assert.equal(await native.locator("spui-skeleton-item").getAttribute("data-size"), "24", "direct custom-element item inherits parent size");
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/skeleton-item-parity.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", compositionAndProgressbarName: true, inheritedAndOverriddenOptions: true, sizeAndShapeGeometry: true, legacyStandaloneShape: true, directCustomElementComposition: true, noPageErrors: true, screenshot: "test-results/skeleton-item-parity.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
