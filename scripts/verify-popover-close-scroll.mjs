import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "popover-close-scroll.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="close" label="Close on scroll" defaultOpen unstable_disableAutoFocus closeOnScroll onOpenChange={(event,data)=>window.changes.push({open:data.open,eventType:event?.type})}><PopoverTrigger><button>Close</button></PopoverTrigger><PopoverSurface><div data-testid="inner" style={{height:40,overflow:"auto"}}><div style={{height:200}}>Scrollable content</div></div></PopoverSurface></Popover><Popover data-testid="stay" label="Stay open" defaultOpen unstable_disableAutoFocus><PopoverTrigger><button>Stay</button></PopoverTrigger><PopoverSurface>Surface</PopoverSurface></Popover></>);window.mountNative=()=>{const host=document.createElement("spui-popover");host.id="native";host.setAttribute("close-on-scroll","");host.setAttribute("open","");host.setAttribute("unstable-disable-auto-focus","");const trigger=document.createElement("button");trigger.slot="trigger";trigger.textContent="Native";const content=document.createElement("div");content.slot="content";content.textContent="Native surface";host.append(trigger,content);document.querySelector("#native-root").append(host)};window.changes=[];window.mountNative();`,
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
  await page.waitForFunction(() => ["close", "stay", "native"].every(id => document.querySelector(id === "native" ? "#native" : `[data-testid=${id}]`)?.open));
  await page.getByTestId("inner").evaluate(node => { node.scrollTop = 10; node.dispatchEvent(new Event("scroll")); });
  assert.equal(await page.getByTestId("close").evaluate(node => node.open), true, "scrolling inside the popover keeps it open");
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  assert.equal(await page.getByTestId("close").evaluate(node => node.open), false, "outside scroll closes the opted-in React popover");
  assert.equal(await page.getByTestId("stay").evaluate(node => node.open), true, "default behavior repositions and remains open");
  assert.equal(await page.locator("#native").evaluate(node => node.open), false, "native close-on-scroll attribute is supported");
  assert.deepEqual(await page.evaluate(() => window.changes), [{ open: false, eventType: "scroll" }], "React callback reports dismissal data and its source scroll event");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", outsideScrollCloses: true, insideScrollStaysOpen: true, defaultRemainsOpen: true, customElement: true, onOpenChange: true, pageErrors: 0 }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
