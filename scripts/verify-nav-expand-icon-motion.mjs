import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const bundle = await build({
  stdin: {
    sourcefile: "nav-expand-icon-motion.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Nav,NavCategory,NavCategoryItem,NavSubItemGroup}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";function Motion({visible,children}){return <span data-testid="icon-motion" data-visible={String(visible)} style={{display:"inline-flex",transform:visible?"rotate(180deg)":"rotate(0deg)",transition:"transform 100ms linear"}}>{children}</span>}createRoot(document.querySelector("#root")).render(<Nav defaultOpenCategories={["docs"]}><NavCategory value="docs"><NavCategoryItem expandIconMotion={Motion}>Documents</NavCategoryItem><NavSubItemGroup /></NavCategory></Nav>);`,
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
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const iconMotion = page.getByTestId("icon-motion");
  assert.equal(await iconMotion.getAttribute("data-visible"), "true", "initially open category exposes visible state");
  assert.equal(await iconMotion.locator("svg path").count(), 1, "motion slot wraps the theme-current-color default chevron");
  await page.locator("spui-nav-category-item button").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="icon-motion"]')?.getAttribute("data-visible") === "false");
  assert.equal(await page.locator("spui-nav-category-item").getAttribute("expanded"), null, "category state still controls its disclosure button");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", visibleState: true, defaultChevron: true, disclosureState: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
