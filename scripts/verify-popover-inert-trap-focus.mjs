import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "popover-inert-trap-focus.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<Popover data-testid="react" label="Inert focus" defaultOpen trapFocus legacyTrapFocus={false}><PopoverTrigger><button data-testid="react-trigger">Open</button></PopoverTrigger><PopoverSurface><button data-testid="react-control">Inside</button></PopoverSurface></Popover>);window.mountNative=()=>{const host=document.createElement("spui-popover");host.id="native";host.setAttribute("trap-focus","");host.setAttribute("inert-trap-focus","");host.setAttribute("label","Native inert focus");const trigger=document.createElement("button");trigger.slot="trigger";trigger.textContent="Open";const content=document.createElement("div");content.slot="content";const button=document.createElement("button");button.dataset.testid="native-control";button.textContent="Inside";content.append(button);host.append(trigger,content);document.querySelector("#native-root").append(host)};window.mountNative();`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=root></div><div id=native-root></div><button id=outside>Outside</button><button id=preserved inert>Pre-inert</button><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await (await import("playwright")).chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="native-control"]') !== null);
  assert.equal(await page.locator("#outside").evaluate(node => node.inert), true, "React inert mode makes outside content inert");
  assert.equal(await page.getByTestId("react-trigger").evaluate(node => Boolean(node.closest("[inert]"))), true, "React inert mode makes its trigger inert while open");
  assert.equal(await page.getByTestId("react-control").evaluate(node => node.closest("[inert]") === null), true, "React surface remains interactive");
  await page.locator("#outside").evaluate(node => node.focus());
  assert.notEqual(await page.evaluate(() => document.activeElement?.id), "outside", "inert outside element cannot receive focus");
  await page.locator("#native").evaluate(node => { node.open = true; });
  assert.equal(await page.locator("#outside").evaluate(node => node.inert), true, "outside content stays inert while either popover is open");
  assert.equal(await page.getByTestId("native-control").evaluate(node => node.closest("[inert]") === null), true, "native surface remains interactive");
  await page.getByTestId("react").evaluate(node => { node.open = false; });
  assert.equal(await page.locator("#outside").evaluate(node => node.inert), true, "closing one overlay keeps the other overlay modal");
  assert.equal(await page.locator("#root").evaluate(node => node.inert), true, "closed overlay content becomes inert while another remains open");
  await page.locator("#native").evaluate(node => { node.open = false; });
  assert.equal(await page.locator("#outside").evaluate(node => node.inert), false, "last close restores outside state");
  assert.equal(await page.locator("#preserved").evaluate(node => node.inert), true, "last close preserves a pre-existing inert state");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactLegacyFalseMapsToInert: true, nativeInertAttribute: true, concurrentOverlays: true, surfaceRemainsInteractive: true, outsideFocusBlocked: true, originalInertStateRestored: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
