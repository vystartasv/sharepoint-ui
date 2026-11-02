import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "tree-compound.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Tree,TreeItem,TreeItemLayout,TreeItemPersonaLayout,FlatTree,FlatTreeItem}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";window.events={open:[],selected:[]};function App(){const[open,setOpen]=React.useState(true);return <><Tree data-testid="nested" selectionMode="single" onSelectionChange={keys=>window.events.selected.push(keys)}><TreeItem value="parent" itemType="branch" open={open} onOpenChange={(event,data)=>{window.events.open.push({open:data.open,sameEvent:event===data.event,eventType:data.event.type});setOpen(data.open)}}><TreeItemLayout iconBefore={<span aria-hidden="true">📁</span>} aside={<span>2 items</span>}>Folder</TreeItemLayout><Tree><TreeItem value="child" itemType="leaf"><TreeItemPersonaLayout media={<span aria-hidden="true">👤</span>} main="Owner" description="Project lead" /></TreeItem></Tree></TreeItem></Tree><FlatTree data-testid="flat" selectionMode="multiple"><FlatTreeItem value="flat-parent" itemType="branch" open aria-level={1} aria-setsize={1} aria-posinset={1}><TreeItemLayout>Flat folder</TreeItemLayout></FlatTreeItem><FlatTreeItem value="flat-child" itemType="leaf" parentValue="flat-parent" aria-level={2} aria-setsize={1} aria-posinset={1}><TreeItemLayout>Flat child</TreeItemLayout></FlatTreeItem></FlatTree></>}createRoot(document.querySelector("#root")).render(<App/>);`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><main id='root'></main><script src='/bundle.js'></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const nested = page.getByTestId("nested");
  const parent = nested.locator('[data-tree-key="parent"]');
  assert.equal(await parent.getAttribute("aria-expanded"), "true");
  assert.equal(await nested.locator('[data-tree-key="child"]').getAttribute("aria-level"), "2");
  assert.equal(await nested.getByText("Project lead").count(), 1, "persona description renders in the nested layout");
  await nested.locator('[data-tree-key="child"]').click();
  await page.waitForFunction(() => window.events.selected.some(keys => keys.includes("child")));
  await nested.getByRole("button", { name: "Expand or collapse Folder" }).click();
  await page.waitForFunction(() => window.events.open.length === 1 && window.events.open[0].open === false);
  assert.deepEqual(await page.evaluate(() => window.events.open), [{ open: false, sameEvent: true, eventType: "click" }]);
  await nested.locator('[data-tree-key="child"]').waitFor({ state: "detached" });

  const flat = page.getByTestId("flat");
  assert.equal(await flat.locator('[data-tree-key="flat-parent"]').getAttribute("aria-expanded"), "true");
  assert.equal(await flat.locator('[data-tree-key="flat-child"]').getAttribute("aria-level"), "2");
  await flat.locator('[data-tree-key="flat-child"]').click();
  assert.equal(await flat.locator('[data-tree-key="flat-child"]').getAttribute("aria-checked"), "true");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", nestedComposition: true, personaLayout: true, controlledItemExpansion: true, flatParentLinking: true, multiselect: true, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
