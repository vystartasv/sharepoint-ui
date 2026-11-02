import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "/Users/vilius/.t3/projects/spfx-research/node_modules/playwright/index.mjs";

const bundle = await build({
  stdin: { contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Tree,FlatTree,FlatTreeItem}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineTree}from"${resolve("packages/sharepoint-ui/src/elements/tree.ts")}";defineTree();function Motion({visible,children}){return <div data-motion-visible={visible}>{children}</div>}function App(){return <><Tree data-testid="tree" items={[{id:"root",label:"Root",children:[{id:"child",label:"Child",children:[{id:"leaf",label:"Leaf"}]}]}]} defaultOpenItems={["root","child"]} collapseMotion={Motion}/><FlatTree data-testid="flat-tree" defaultOpenItems={["flat-root"]} collapseMotion={Motion}><FlatTreeItem value="flat-root" itemType="branch" aria-level={1} aria-setsize={1} aria-posinset={1}>Flat Root</FlatTreeItem><FlatTreeItem value="flat-child" parentValue="flat-root" itemType="leaf" aria-level={2} aria-setsize={1} aria-posinset={1}>Flat Child</FlatTreeItem></FlatTree></>}createRoot(document.querySelector("#root")).render(<App/>);`, resolveDir: process.cwd(), sourcefile: "tree-collapse-motion.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"],
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")], write: false,
});
const server = createServer((request, response) => new URL(request.url, "http://localhost").pathname === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><main id='root'></main><script src='/bundle.js'></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const tree = page.getByTestId("tree");
  const root = tree.locator('[data-tree-key="root"]');
  const motion = root.locator("xpath=following-sibling::div");
  const group = motion.locator(":scope > [role='group']");
  assert.equal(await motion.getAttribute("data-motion-visible"), "true");
  assert.equal(await group.getAttribute("role"), "group");
  await tree.getByRole("button", { name: "Expand or collapse Root" }).click();
  assert.equal(await motion.getAttribute("data-motion-visible"), "false");
  assert.equal(await group.getAttribute("aria-hidden"), "true");
  assert.equal(await group.getAttribute("inert"), "");
  assert.equal(await tree.locator('[data-tree-key="child"]').getAttribute("tabindex"), "-1");
  await root.focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-tree-key") === "root");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-tree-key")), "root");

  await tree.getByRole("button", { name: "Expand or collapse Root" }).click();
  assert.equal(await motion.getAttribute("data-motion-visible"), "true");
  await root.focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-tree-key") === "child");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-tree-key")), "child");

  const flatTree = page.getByTestId("flat-tree");
  const flatRoot = flatTree.locator('[data-tree-key="flat-root"]');
  const flatMotion = flatRoot.locator("xpath=following-sibling::div");
  const flatGroup = flatMotion.locator(":scope > [role='group']");
  assert.equal(await flatMotion.getAttribute("data-motion-visible"), "true");
  await flatTree.getByRole("button", { name: "Expand or collapse Flat Root" }).click();
  assert.equal(await flatGroup.getAttribute("aria-hidden"), "true");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", nestedTreeMotion: true, flatTreeMotion: true, exitingGroupsInert: true, rovingFocusUsesVisibleRows: true, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
