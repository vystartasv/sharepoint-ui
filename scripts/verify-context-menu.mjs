import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { ContextMenu, MenuItem } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import { defineMenu } from "${resolve("packages/sharepoint-ui/src/elements/menu.ts")}";
function Sample(){return <ContextMenu data-testid="react-menu" label="Document commands" trigger={<button data-testid="react-target" style={{position:"fixed",left:280,top:200,width:100,height:40}}>Document</button>}><MenuItem data-testid="react-copy">Copy</MenuItem><MenuItem>Rename</MenuItem></ContextMenu>}
createRoot(document.getElementById("react-root")).render(<div dir="ltr"><Sample/></div>);
window.mountNative = () => { defineMenu(); const make=(tag,attrs={},text="")=>{const node=document.createElement(tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);node.textContent=text;return node;};const wrap=make("div",{dir:"rtl"});const menu=make("spui-menu",{label:"إجراءات المستند","context-menu":"","data-testid":"native-menu"});const target=make("button",{slot:"trigger","data-testid":"native-target",style:"position:fixed;left:600px;top:400px;width:100px;height:40px"},"مستند");const content=make("div",{slot:"menu"});content.append(make("spui-menu-item",{"data-testid":"native-copy"},"نسخ"),make("spui-menu-item",{},"إعادة تسمية"));menu.append(target,content);wrap.append(menu);document.getElementById("native-root").append(wrap);};`,
    resolveDir: process.cwd(), sourcefile: "context-menu-check.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='react-root'></div><div id='native-root'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 650 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const target = page.getByTestId("react-target");
  await page.mouse.click(310, 230, { button: "right" });
  const reactMenu = page.getByTestId("react-menu");
  assert.equal(await reactMenu.evaluate(node => node.open), true, "React context menu opens on right-click");
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "react-copy");
  const pointerPosition = await reactMenu.evaluate(node => ({ left: parseFloat(node.shadowRoot.querySelector(".surface").style.left), top: parseFloat(node.shadowRoot.querySelector(".surface").style.top) }));
  assert.deepEqual(pointerPosition, { left: 310, top: 230 }, "menu is positioned at the pointer");
  await page.keyboard.press("Escape");
  assert.equal(await reactMenu.evaluate(node => node.open), false, "Escape closes the pointer menu");
  await page.mouse.click(310, 230, { button: "right" });
  assert.equal(await reactMenu.evaluate(node => node.open), true, "context menu can reopen");
  await page.mouse.click(850, 600);
  assert.equal(await reactMenu.evaluate(node => node.open), false, "outside pointer closes the context menu");

  await target.focus();
  await page.keyboard.press("Shift+F10");
  assert.equal(await reactMenu.evaluate(node => node.open), true, "Shift+F10 opens the React context menu");
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "react-copy");
  await page.keyboard.press("Escape");
  const keyboardFocusRestored = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  assert.equal(keyboardFocusRestored, "react-target", "Escape restores focus to the trigger");

  await target.evaluate(node => { node.style.left = "770px"; node.style.top = "590px"; });
  await target.evaluate(node => node.addEventListener("contextmenu", event => { window.lastContext = { x: event.clientX, y: event.clientY }; }));
  const targetBounds = await target.evaluate(node => { const rect=node.getBoundingClientRect();return {left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom}; });
  assert.ok(targetBounds.left <= 850 && targetBounds.right >= 850 && targetBounds.top <= 610 && targetBounds.bottom >= 610, "edge invocation lands on the trigger");
  await page.mouse.click(850, 610, { button: "right" });
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "react-copy");
  const contextPoint = await page.evaluate(() => window.lastContext);
  assert.deepEqual(contextPoint, { x: 850, y: 610 }, "edge context event preserves pointer coordinates");
  const edgeBounds = await reactMenu.evaluate(node => { const rect=node.shadowRoot.querySelector(".surface").getBoundingClientRect();return {right:rect.right,bottom:rect.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight}; });
  assert.ok(edgeBounds.right <= edgeBounds.viewportWidth - 4 && edgeBounds.bottom <= edgeBounds.viewportHeight - 4, "menu stays inside the viewport near its edges");
  await page.keyboard.press("Escape");

  await page.evaluate(() => window.mountNative());
  const nativeTarget = page.getByTestId("native-target");
  await nativeTarget.evaluate(node => node.focus());
  await page.keyboard.press("ContextMenu");
  const nativeMenu = page.getByTestId("native-menu");
  assert.equal(await nativeMenu.evaluate(node => node.open), true, "native Context Menu key opens menu");
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "native-copy");
  const rtlPlacement = await nativeMenu.evaluate(node => ({ left: parseFloat(node.shadowRoot.querySelector(".surface").style.left), top: parseFloat(node.shadowRoot.querySelector(".surface").style.top), triggerRight: node.querySelector("[slot=trigger]").getBoundingClientRect().right }));
  assert.equal(rtlPlacement.left, rtlPlacement.triggerRight, "RTL keyboard invocation anchors at the logical start edge");
  await page.keyboard.press("Escape");
  const nativeFocusRestored = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  assert.equal(nativeFocusRestored, "native-target", "native Escape restores trigger focus");

  const result = { browser: "Chromium headless", reactLTR: { pointerPosition, keyboardFocusRestored, edgeBounds, targetBounds, contextPoint }, nativeRTL: { rtlPlacement, nativeFocusRestored }, errors };
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
