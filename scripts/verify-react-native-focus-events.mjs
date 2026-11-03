import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,Nav,NavItem}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.events=[];window.track=(id,phase)=>(event=>window.events.push({id,phase,type:event.type,target:event.target.tagName,currentTarget:event.currentTarget.tagName,relatedTarget:event.relatedTarget?.id||event.relatedTarget?.tagName||null,nativeType:event.nativeEvent.type}));const focusProps=id=>({onFocus:window.track(id,"bubble"),onFocusCapture:window.track(id,"capture"),onBlur:window.track(id,"bubble"),onBlurCapture:window.track(id,"capture")});createRoot(document.querySelector("#root")).render(<><Button data-testid="button" {...focusProps("button")}>Button</Button><Nav data-testid="nav" {...focusProps("nav")}><NavItem value="item" data-testid="nav-item" {...focusProps("nav-item")}>Item</NavItem></Nav> </>);`,
    resolveDir: root,
    sourcefile: "react-native-focus-events.tsx",
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
  await page.waitForFunction(() => document.querySelector("[data-testid=nav-item]")?.shadowRoot?.querySelector("button,a"));
  await page.getByTestId("button").evaluate(host => host.shadowRoot.querySelector("button").focus());
  await page.getByTestId("nav-item").evaluate(host => host.shadowRoot.querySelector("button,a").focus());
  await page.locator("#outside").focus();

  const events = await page.evaluate(() => window.events);
  assert.deepEqual(events.map(({ id, phase, type, target, currentTarget, nativeType }) => ({ id, phase, type, target, currentTarget, nativeType })), [
    { id: "button", phase: "capture", type: "focus", target: "BUTTON", currentTarget: "BUTTON", nativeType: "focusin" },
    { id: "button", phase: "bubble", type: "focus", target: "BUTTON", currentTarget: "BUTTON", nativeType: "focusin" },
    { id: "button", phase: "capture", type: "blur", target: "BUTTON", currentTarget: "BUTTON", nativeType: "focusout" },
    { id: "button", phase: "bubble", type: "blur", target: "BUTTON", currentTarget: "BUTTON", nativeType: "focusout" },
    { id: "nav", phase: "capture", type: "focus", target: "BUTTON", currentTarget: "NAV", nativeType: "focusin" },
    { id: "nav-item", phase: "capture", type: "focus", target: "BUTTON", currentTarget: "BUTTON", nativeType: "focusin" },
    { id: "nav-item", phase: "bubble", type: "focus", target: "BUTTON", currentTarget: "BUTTON", nativeType: "focusin" },
    { id: "nav", phase: "bubble", type: "focus", target: "BUTTON", currentTarget: "NAV", nativeType: "focusin" },
    { id: "nav", phase: "capture", type: "blur", target: "BUTTON", currentTarget: "NAV", nativeType: "focusout" },
    { id: "nav-item", phase: "capture", type: "blur", target: "BUTTON", currentTarget: "BUTTON", nativeType: "focusout" },
    { id: "nav-item", phase: "bubble", type: "blur", target: "BUTTON", currentTarget: "BUTTON", nativeType: "focusout" },
    { id: "nav", phase: "bubble", type: "blur", target: "BUTTON", currentTarget: "NAV", nativeType: "focusout" },
  ], "focus and blur preserve React event types, native event names, and ancestor capture/bubble order across nested shadow roots");
  const focusOut = events.find(event => event.id === "nav-item" && event.type === "blur" && event.phase === "bubble");
  assert.equal(focusOut.relatedTarget, "outside", "blur carries the newly focused element as relatedTarget");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", focusBlurReactTypes: true, nativeFocusInOut: true, nestedCaptureAndBubble: true, relatedTarget: true, noBrowserErrors: true }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
