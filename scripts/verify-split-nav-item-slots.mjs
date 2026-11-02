import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const bundle = await build({
  stdin: {
    sourcefile: "split-nav-item-slots.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,MenuButton,Nav,NavSubItem,SplitNavItem,ToggleButton,Tooltip}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.actions=[];createRoot(document.querySelector("#root")).render(<><Nav><SplitNavItem value="docs" navItem={<NavSubItem value="docs" href="#docs">Documents</NavSubItem>} actionButton={<Button onClick={()=>window.actions.push("action")}>Pin</Button>} actionButtonTooltip={<Tooltip content="Pin this destination" relationship="label"/>} menuButton={<MenuButton onClick={()=>window.actions.push("menu")}>More</MenuButton>} menuButtonTooltip={<Tooltip content="More options" relationship="label"/>} toggleButton={<ToggleButton onClick={()=>window.actions.push("toggle")}>Favorite</ToggleButton>} toggleButtonTooltip={<Tooltip content="Favorite destination" relationship="label"/>}/></Nav><SplitNavItem data-testid="legacy" value="legacy" actionLabel="Legacy action" onAction={()=>window.actions.push("legacy")}>Legacy link</SplitNavItem></>);`,
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
  const split = page.locator("spui-split-nav-item").first();
  assert.equal(await split.locator("spui-nav-sub-item a").getAttribute("href"), "#docs", "navItem slot replaces the primary destination");
  for (const slot of ["action", "menu-button", "toggle-button"]) assert.equal(await split.locator(`[slot="${slot}"]`).count(), 1, `${slot} is assigned`);
  await page.getByRole("button", { name: "Pin" }).click();
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("button", { name: "Favorite" }).click();
  assert.deepEqual(await page.evaluate(() => window.actions), ["action", "menu", "toggle"], "all independent controls keep their own actions");
  assert.equal(await split.locator("spui-tooltip").count(), 3, "each optional tooltip composes around its matching control");
  assert.equal(await split.locator("spui-nav-sub-item").count(), 1, "secondary controls do not replace the primary link");
  const legacy = page.getByTestId("legacy");
  await legacy.locator('[slot="action"]').click();
  assert.equal(await page.evaluate(() => window.actions.at(-1)), "legacy", "legacy action API remains supported");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", navItemOverride: true, threeActionSlots: true, tooltipComposition: true, legacyAction: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
