import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "popover-hover.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="hover" label="Hover" openOnHover onOpenChange={(event,data)=>window.changes.push({open:data.open,eventType:event?.type})}><PopoverTrigger><button>Hover trigger</button></PopoverTrigger><PopoverSurface>Hover surface</PopoverSurface></Popover><Popover data-testid="short" label="Short delay" openOnHover mouseLeaveDelay={30}><PopoverTrigger><button>Short trigger</button></PopoverTrigger><PopoverSurface>Short surface</PopoverSurface></Popover><Popover data-testid="controlled" label="Controlled" open={false} openOnHover onOpenChange={(event,data)=>window.controlledChanges.push({open:data.open,eventType:event?.type})}><PopoverTrigger><button>Controlled trigger</button></PopoverTrigger><PopoverSurface>Controlled surface</PopoverSurface></Popover></>);window.pointer=(selector,type)=>{const m=selector.match(/^(.*) \\.surface$/);const target=m?document.querySelector(m[1]).shadowRoot.querySelector(".surface"):document.querySelector(selector);return target.dispatchEvent(new PointerEvent(type,{bubbles:false,pointerType:"mouse"}))};window.mountNative=()=>{const host=document.createElement("spui-popover");host.id="native";host.setAttribute("open-on-hover","");host.setAttribute("mouse-leave-delay","25");const trigger=document.createElement("button");trigger.slot="trigger";trigger.textContent="Native hover";const content=document.createElement("div");content.slot="content";content.textContent="Native surface";host.append(trigger,content);document.querySelector("#native-root").append(host)};window.changes=[];window.controlledChanges=[];window.mountNative();`,
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
  browser = await (await import("playwright")).chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const open = id => page.locator(id).evaluate(node => node.open);
  await page.evaluate(() => window.pointer('[data-testid="hover"] button', "pointerenter"));
  assert.equal(await open('[data-testid="hover"]'), true, "hover enters open the React popover");
  await page.evaluate(() => window.pointer('[data-testid="hover"] button', "pointerleave"));
  await page.waitForTimeout(100);
  await page.evaluate(() => window.pointer('[data-testid="hover"] .surface', "pointerenter"));
  await page.waitForTimeout(450);
  assert.equal(await open('[data-testid="hover"]'), true, "moving from trigger into surface cancels delayed close");
  await page.evaluate(() => window.pointer('[data-testid="hover"] .surface', "pointerleave"));
  await page.waitForTimeout(100);
  assert.equal(await open('[data-testid="hover"]'), true, "default 500ms mouse leave delay is honored");
  await page.waitForTimeout(450);
  assert.equal(await open('[data-testid="hover"]'), false, "popover closes after default delay");
  assert.deepEqual(await page.evaluate(() => window.changes), [{ open: true, eventType: "pointerenter" }, { open: false, eventType: "pointerleave" }], "hover callback receives its source pointer events and open data");
  await page.evaluate(() => window.pointer('[data-testid="short"] button', "pointerenter"));
  await page.evaluate(() => window.pointer('[data-testid="short"] button', "pointerleave"));
  await page.waitForTimeout(80);
  assert.equal(await open('[data-testid="short"]'), false, "custom leave delay is applied");
  await page.evaluate(() => window.pointer("#native button", "pointerenter"));
  assert.equal(await open("#native"), true, "native custom-element hover opens");
  await page.evaluate(() => window.pointer("#native button", "pointerleave"));
  await page.waitForTimeout(60);
  assert.equal(await open("#native"), false, "native mouse-leave-delay attribute closes");
  await page.evaluate(() => window.pointer('[data-testid="controlled"] button', "pointerenter"));
  await page.evaluate(() => new Promise(requestAnimationFrame));
  assert.equal(await open('[data-testid="controlled"]'), false, "controlled closed state remains authoritative");
  assert.deepEqual(await page.evaluate(() => window.controlledChanges), [{ open: true, eventType: "pointerenter" }], "controlled hover reports Fluent open data and the source pointer event");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", triggerAndSurfaceHover: true, defaultDelayMs: 500, customDelayMs: 30, nativeAttributes: true, controlledState: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
