import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "popover-default-open.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="default-open" label="Initially open" defaultOpen unstable_disableAutoFocus onOpenChange={(event,data)=>window.changes.push(["default",data.open,event?.type])}><PopoverTrigger><button>Default</button></PopoverTrigger><PopoverSurface>Initial content</PopoverSurface></Popover><Popover data-testid="default-closed" label="Initially closed" onOpenChange={(event,data)=>window.changes.push(["closed",data.open,event?.type])}><PopoverTrigger><button>Closed</button></PopoverTrigger><PopoverSurface>Closed content</PopoverSurface></Popover><Popover data-testid="controlled" label="Controlled closed" defaultOpen open={false}><PopoverTrigger><button>Controlled</button></PopoverTrigger><PopoverSurface>Controlled content</PopoverSurface></Popover></>);window.mountNative=()=>{const host=document.createElement("spui-popover");host.id="native";host.setAttribute("default-open","");host.setAttribute("unstable-disable-auto-focus","");const trigger=document.createElement("button");trigger.slot="trigger";trigger.textContent="Native";const content=document.createElement("div");content.slot="content";content.textContent="Native content";host.append(trigger,content);document.querySelector("#native-root").append(host)};window.changes=[];window.mountNative();`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=root></div><div id=native-root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="default-open"]')?.open && document.querySelector("#native")?.open);
  assert.equal(await page.getByTestId("default-closed").evaluate(node => node.open), false, "default state remains closed without defaultOpen");
  assert.equal(await page.getByTestId("controlled").evaluate(node => node.open), false, "controlled open=false takes precedence over defaultOpen");
  await page.evaluate(() => { const native = document.querySelector("#native"); native.addEventListener("click", event => { window.nativeSourceEvent = event; }, true); native.addEventListener("spui-open-change", event => { window.nativeOpenChange = event.detail; }); });
  await page.locator("#native button").evaluate(button => button.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true })));
  assert.equal(await page.evaluate(() => window.nativeOpenChange.event === window.nativeSourceEvent), true, "native event detail preserves the exact originating click object");
  assert.equal(await page.evaluate(() => window.nativeOpenChange.open), false);
  await page.getByTestId("default-open").getByRole("button").click();
  assert.equal(await page.getByTestId("default-open").evaluate(node => node.open), false, "uncontrolled popover can close after its initial open state");
  assert.deepEqual(await page.evaluate(() => window.changes), [["default", false, "click"]], "Fluent callback receives the source click and open data only on user transition");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactDefaultOpen: true, nativeDefaultOpen: true, nativeSourceEventIdentity: true, defaultClosed: true, controlledPrecedence: true, transitionAfterInitialization: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
