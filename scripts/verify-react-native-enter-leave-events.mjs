import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.events=[];const track=(type,phase)=>(event=>window.events.push({type,phase,eventType:event.type,target:event.target.tagName,currentTarget:event.currentTarget.tagName,relatedTarget:event.relatedTarget?.id||event.relatedTarget?.tagName||null,nativeType:event.nativeEvent.type,pointerId:event.pointerId??null,pointerType:event.pointerType??null}));createRoot(document.querySelector("#root")).render(<Button data-testid="button" icon={<b data-testid="slotted-icon">Icon</b>} onMouseEnter={track("mouse","enter")} onMouseLeave={track("mouse","leave")} onPointerEnter={track("pointer","enter")} onPointerLeave={track("pointer","leave")}>Content</Button>);`,
    resolveDir: root,
    sourcefile: "react-native-enter-leave-events.tsx",
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div><button id='outside'>Outside</button><script src='/bundle.js'></script></body></html>"));
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
  await page.waitForFunction(() => document.querySelector("[data-testid=button]")?.shadowRoot?.querySelector("button .content"));
  await page.getByTestId("button").evaluate((host, outsideId) => {
    const control = host.shadowRoot.querySelector("button");
    const content = control.querySelector(".content");
    const icon = host.querySelector("[data-testid=slotted-icon]");
    const outside = document.getElementById(outsideId);
    control.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, composed: true, relatedTarget: outside }));
    content.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, composed: true, relatedTarget: icon }));
    content.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, composed: true, relatedTarget: icon }));
    content.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, composed: true, relatedTarget: outside }));
    control.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, composed: true, relatedTarget: outside, pointerId: 7, pointerType: "pen", pressure: 0.5 }));
    content.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, composed: true, relatedTarget: icon, pointerId: 7, pointerType: "pen", pressure: 0.5 }));
    content.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, composed: true, relatedTarget: icon, pointerId: 7, pointerType: "pen", pressure: 0.5 }));
    content.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, composed: true, relatedTarget: outside, pointerId: 7, pointerType: "pen", pressure: 0.5 }));
  }, "outside");

  const events = await page.evaluate(() => window.events);
  assert.deepEqual(events, [
    { type: "mouse", phase: "enter", eventType: "mouseenter", target: "BUTTON", currentTarget: "BUTTON", relatedTarget: "outside", nativeType: "mouseover", pointerId: null, pointerType: null },
    { type: "mouse", phase: "leave", eventType: "mouseleave", target: "SPAN", currentTarget: "BUTTON", relatedTarget: "outside", nativeType: "mouseout", pointerId: null, pointerType: null },
    { type: "pointer", phase: "enter", eventType: "pointerenter", target: "BUTTON", currentTarget: "BUTTON", relatedTarget: "outside", nativeType: "pointerover", pointerId: 7, pointerType: "pen" },
    { type: "pointer", phase: "leave", eventType: "pointerleave", target: "SPAN", currentTarget: "BUTTON", relatedTarget: "outside", nativeType: "pointerout", pointerId: 7, pointerType: "pen" },
  ], "enter/leave fire only at the native root boundary, include slotted content, and preserve React event names");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", mouseEnterLeave: true, pointerEnterLeave: true, slottedDescendantsDoNotRetrigger: true, nativeEventTypes: true, noBrowserErrors: true }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
