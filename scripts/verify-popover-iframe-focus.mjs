import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "popover-iframe-focus.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="default" label="Default close" defaultOpen unstable_disableAutoFocus onOpenChange={(event,data)=>window.changes.push(["default",data.open,event?.type])}><PopoverTrigger><button>Default</button></PopoverTrigger><PopoverSurface>Default content</PopoverSurface></Popover><Popover data-testid="optout" label="React opt out" defaultOpen unstable_disableAutoFocus closeOnIframeFocus={false}><PopoverTrigger><button>Opt out</button></PopoverTrigger><PopoverSurface>Opt out content</PopoverSurface></Popover><Popover data-testid="inside" label="Inside frame" defaultOpen unstable_disableAutoFocus onOpenChange={(event,data)=>window.changes.push(["inside",data.open,event?.type])}><PopoverTrigger><button>Inside</button></PopoverTrigger><PopoverSurface><iframe id="inside-frame" title="Inside frame" srcdoc="<button>inside</button>"></iframe></PopoverSurface></Popover></>);window.mountNative=()=>{const host=document.createElement("spui-popover");host.id="native-optout";host.setAttribute("default-open","");host.setAttribute("close-on-iframe-focus","false");host.setAttribute("unstable-disable-auto-focus","");const trigger=document.createElement("button");trigger.slot="trigger";trigger.textContent="Native opt out";const content=document.createElement("div");content.slot="content";content.textContent="Native content";host.append(trigger,content);document.querySelector("#native-root").append(host)};window.changes=[];window.mountNative();window.focusFrame=id=>{const frame=document.querySelector(id);frame.focus();window.dispatchEvent(new Event("blur"));return document.activeElement===frame};`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><iframe id=outside-frame title=Outside srcdoc='<button>outside</button>'></iframe><div id=root></div><div id=native-root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await (await import("playwright")).chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => ["default", "optout", "inside", "native-optout"].every(id => document.querySelector(id === "native-optout" ? "#native-optout" : `[data-testid=${id}]`)?.open));
  assert.equal(await page.evaluate(() => window.focusFrame("#inside-frame")), true, "inside iframe receives focus");
  await page.waitForTimeout(30);
  assert.equal(await page.getByTestId("default").evaluate(node => node.open), false, "iframe outside this Popover closes the default Popover");
  assert.equal(await page.getByTestId("inside").evaluate(node => node.open), true, "iframe inside its Popover does not close it");
  assert.equal(await page.getByTestId("optout").evaluate(node => node.open), true, "React opt-out remains open");
  assert.equal(await page.locator("#native-optout").evaluate(node => node.open), true, "custom-element opt-out remains open");
  assert.equal(await page.evaluate(() => window.focusFrame("#outside-frame")), true, "outside iframe receives focus");
  await page.waitForTimeout(30);
  assert.equal(await page.getByTestId("inside").evaluate(node => node.open), false, "outside iframe closes the remaining default Popover");
  assert.equal(await page.getByTestId("optout").evaluate(node => node.open), true);
  assert.deepEqual(await page.evaluate(() => window.changes), [["default", false, "blur"], ["inside", false, "focusout"]]);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", defaultDismissal: true, internalIframePreserved: true, reactAndNativeOptOut: true, focusRequests: "inside then outside", noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
