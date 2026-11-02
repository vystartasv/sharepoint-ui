import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { Button, Menu, MenuBar, MenuBarItem, MenuItem } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import { defineMenuBar } from "${resolve("packages/sharepoint-ui/src/elements/menu.ts")}";
function Sample(){return <MenuBar data-testid="react-bar" label="Application menus"><Menu data-testid="react-file-menu" label="File" trigger={<MenuBarItem data-testid="react-file">File</MenuBarItem>}><MenuItem data-testid="react-new">New</MenuItem><MenuItem>Open</MenuItem></Menu><Menu data-testid="react-edit-menu" label="Edit" trigger={<MenuBarItem data-testid="react-edit">Edit</MenuBarItem>}><MenuItem>Undo</MenuItem><MenuItem>Redo</MenuItem></Menu></MenuBar>}
createRoot(document.getElementById("react-root")).render(<div dir="ltr"><Sample/></div>);
window.mountNative = () => { defineMenuBar(); const el=(tag,attrs={},text="")=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);n.textContent=text;return n;}; const wrap=el("div",{dir:"rtl"});const bar=el("spui-menu-bar",{"aria-label":"قائمة التطبيق","data-testid":"native-bar"}); for(const [key,label] of [["file","ملف"],["edit","تحرير"]]){const menu=el("spui-menu",{label});const trigger=el("spui-menu-bar-item",{slot:"trigger","data-testid":"native-"+key},label);menu.append(trigger);const list=el("div",{slot:"menu"});list.append(el("spui-menu-item",{"data-testid":"native-"+key+"-child"},key==="file"?"جديد":"تراجع"));menu.append(list);bar.append(menu);}wrap.append(bar);document.getElementById("native-root").append(wrap);};`,
    resolveDir: process.cwd(), sourcefile: "menu-bar-check.tsx", loader: "tsx",
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const press = async (testId, key) => { await page.getByTestId(testId).evaluate(node => node.focus()); await page.keyboard.press(key); };

  const reactRole = await page.getByTestId("react-bar").evaluate(node => ({ role: node.getAttribute("role"), orientation: node.getAttribute("aria-orientation"), name: node.getAttribute("aria-label") }));
  const reactInitialTabStops = await page.evaluate(() => ["react-file","react-edit"].map(id => document.querySelector(`[data-testid=${id}]`).shadowRoot.querySelector("button").tabIndex));
  const reactTriggerRole = await page.getByTestId("react-file").evaluate(node => node.shadowRoot.querySelector("button").getAttribute("role"));
  await press("react-file", "ArrowRight");
  const rightFocused = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  await page.keyboard.press("Home");
  const homeFocused = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  await page.keyboard.press("End");
  const endFocused = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  await press("react-file", "ArrowDown");
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "react-new", null, { timeout: 5000 });
  const downOpenedFile = await page.getByTestId("react-file-menu").evaluate(node => node.open);
  const expandedWhileOpen = await page.getByTestId("react-file").evaluate(node => node.shadowRoot.querySelector("button").getAttribute("aria-expanded"));
  await press("react-new", "Escape");
  const escapeRestored = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  const escapeClosed = !(await page.getByTestId("react-file-menu").evaluate(node => node.open));
  await page.getByTestId("react-edit").click();
  const openedEditByClick = await page.getByTestId("react-edit-menu").evaluate(node => node.open);
  const siblingClosed = !(await page.getByTestId("react-file-menu").evaluate(node => node.open));
  await page.mouse.click(980, 680);
  const outsideClosed = !(await page.getByTestId("react-edit-menu").evaluate(node => node.open));

  await page.evaluate(() => window.mountNative());
  const nativeRole = await page.getByTestId("native-bar").evaluate(node => ({role:node.getAttribute("role"),orientation:node.getAttribute("aria-orientation"),name:node.getAttribute("aria-label")}));
  const nativeInitialTabStops = await page.evaluate(() => ["native-file","native-edit"].map(id => document.querySelector(`[data-testid=${id}]`).shadowRoot.querySelector("button").tabIndex));
  await press("native-file", "ArrowLeft");
  const rtlForwardFocused = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  await press("native-file", "ArrowDown");
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "native-file-child");
  const nativeFileOpen = await page.locator("#native-root spui-menu").nth(0).evaluate(node => node.open);
  await press("native-file-child", "Escape");
  const nativeEscapeRestored = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  const nativeEscapeClosed = !(await page.locator("#native-root spui-menu").nth(0).evaluate(node => node.open));
  await page.getByTestId("native-edit").click();
  const nativeEditOpen = await page.locator("#native-root spui-menu").nth(1).evaluate(node => node.open);
  const nativeSiblingClosed = !(await page.locator("#native-root spui-menu").nth(0).evaluate(node => node.open));

  assert.deepEqual(reactRole, { role: "menubar", orientation: "horizontal", name: "Application menus" });
  assert.deepEqual(reactInitialTabStops, [0, -1]);
  assert.equal(reactTriggerRole, "menuitem");
  assert.equal(rightFocused, "react-edit");
  assert.equal(homeFocused, "react-file");
  assert.equal(endFocused, "react-edit");
  assert.equal(downOpenedFile, true);
  assert.equal(expandedWhileOpen, "true");
  assert.equal(escapeRestored, "react-file");
  assert.equal(escapeClosed, true);
  assert.equal(openedEditByClick, true);
  assert.equal(siblingClosed, true);
  assert.equal(outsideClosed, true);
  assert.deepEqual(nativeRole, { role: "menubar", orientation: "horizontal", name: "قائمة التطبيق" });
  assert.deepEqual(nativeInitialTabStops, [0, -1]);
  assert.equal(rtlForwardFocused, "native-edit");
  assert.equal(nativeFileOpen, true);
  assert.equal(nativeEscapeClosed, true);
  assert.equal(nativeEscapeRestored, "native-file");
  assert.equal(nativeEditOpen, true);
  assert.equal(nativeSiblingClosed, true);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ browser: "Chromium headless", reactLTR: { role: reactRole, initialTabStops: reactInitialTabStops, triggerRole: reactTriggerRole, rightFocused, homeFocused, endFocused, downOpenedFile, expandedWhileOpen, escapeRestored, escapeClosed, openedEditByClick, siblingClosed, outsideClosed }, nativeRTL: { role: nativeRole, initialTabStops: nativeInitialTabStops, rtlForwardFocused, nativeFileOpen, nativeEscapeClosed, nativeEscapeRestored, nativeEditOpen, nativeSiblingClosed }, errors }, null, 2));
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
