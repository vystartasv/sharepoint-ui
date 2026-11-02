import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {Drawer} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import {defineDrawer} from "${resolve("packages/sharepoint-ui/src/elements/drawer.ts")}";
function Sample(){const [open,setOpen]=React.useState(true);const [expanded,setExpanded]=React.useState(false);return <Drawer data-testid="react-drawer" open={open} onOpenChange={setOpen} title="Workspace details" expandable expanded={expanded} onExpandedChange={setExpanded}><p>Details</p></Drawer>}
createRoot(document.getElementById("react-root")).render(<Sample/>);
window.mountNative=()=>{defineDrawer();const drawer=document.createElement("spui-drawer");drawer.id="native-drawer";drawer.setAttribute("open","");drawer.setAttribute("title","تفاصيل مساحة العمل");drawer.setAttribute("expandable","");drawer.setAttribute("dir","rtl");drawer.addEventListener("spui-expanded-change",event=>window.nativeExpandEvents.push(event.detail.expanded));document.getElementById("native-root").append(drawer)};window.mountNonModal=()=>{const dismissible=document.createElement("spui-drawer");dismissible.id="non-modal-dismissible";dismissible.setAttribute("modal","false");dismissible.setAttribute("open","");dismissible.setAttribute("title","Supporting pane");const persistent=document.createElement("spui-drawer");persistent.id="non-modal-persistent";persistent.setAttribute("modal","false");persistent.setAttribute("dismissible","false");persistent.setAttribute("open","");persistent.setAttribute("title","Persistent pane");const content=document.createElement("button");content.textContent="Still working";persistent.append(content);document.getElementById("native-root").append(dismissible,persistent)};window.nativeExpandEvents=[];`,
    resolveDir: process.cwd(), sourcefile: "drawer-expand-check.tsx", loader: "tsx",
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

  const react = page.getByTestId("react-drawer");
  const reactSurface = react.locator("dialog");
  assert.equal(await reactSurface.isVisible(), true, "React Drawer opens modally");
  const reactExpand = react.locator(".expand");
  assert.equal(await reactExpand.getAttribute("aria-label"), "Expand drawer to full screen");
  await reactExpand.click();
  await page.waitForFunction(() => document.querySelector('[data-testid="react-drawer"]')?.hasAttribute("expanded"));
  await page.waitForFunction(() => Math.abs(document.querySelector('[data-testid="react-drawer"]')?.shadowRoot.querySelector("dialog").getBoundingClientRect().width - innerWidth) < 1);
  assert.equal(await reactExpand.getAttribute("aria-pressed"), "true", "expanded state is exposed to assistive technology");
  const reactExpandedBounds = await reactSurface.evaluate(node => { const rect=node.getBoundingClientRect();return {width:rect.width,height:rect.height}; });
  assert.ok(reactExpandedBounds.width >= 899 && reactExpandedBounds.height === 650, "expanded React Drawer fills the viewport");
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/drawer-expand.png" });
  await reactExpand.click();
  await page.waitForFunction(() => !document.querySelector('[data-testid="react-drawer"]')?.hasAttribute("expanded"));
  await page.waitForFunction(() => Math.abs(document.querySelector('[data-testid="react-drawer"]')?.shadowRoot.querySelector("dialog").getBoundingClientRect().width - 480) < 1);
  assert.equal(await reactExpand.getAttribute("aria-label"), "Expand drawer to full screen", "React Drawer restores its initial size");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotionTransition = await reactSurface.evaluate(node => getComputedStyle(node).transitionDuration);
  assert.ok(reducedMotionTransition.split(",").every(value => Number.parseFloat(value) === 0), "reduced motion disables expansion transitions");
  await react.locator(".close").click();
  await page.waitForFunction(() => !document.querySelector('[data-testid="react-drawer"]')?.hasAttribute("open"));

  await page.evaluate(() => window.mountNative());
  const native = page.locator("#native-drawer");
  const nativeExpand = native.locator(".expand");
  assert.equal(await nativeExpand.getAttribute("aria-label"), "Expand drawer to full screen");
  await nativeExpand.click();
  await page.waitForFunction(() => Math.abs(document.querySelector("#native-drawer")?.shadowRoot.querySelector("dialog").getBoundingClientRect().width - innerWidth) < 1);
  const nativeExpandedBounds = await native.locator("dialog").evaluate(node => { const rect=node.getBoundingClientRect();return {width:rect.width,height:rect.height}; });
  assert.ok(nativeExpandedBounds.width >= 899 && nativeExpandedBounds.height === 650, "framework-neutral RTL Drawer fills the viewport");
  assert.deepEqual(await page.evaluate(() => window.nativeExpandEvents), [true], "native API emits an expansion state event");
  assert.equal(await nativeExpand.getAttribute("aria-pressed"), "true");
  await nativeExpand.click();
  assert.equal(await nativeExpand.getAttribute("aria-label"), "Expand drawer to full screen", "native Drawer restores its initial size");
  await native.locator(".close").click();
  await page.waitForFunction(() => !document.querySelector("#native-drawer")?.hasAttribute("open"));

  await page.evaluate(() => window.mountNonModal());
  const dismissible = page.locator("#non-modal-dismissible");
  assert.equal(await dismissible.locator("dialog").isVisible(), true, "non-modal drawer opens");
  await page.mouse.click(10, 10);
  await page.waitForFunction(() => !document.querySelector("#non-modal-dismissible")?.hasAttribute("open"));
  const persistent = page.locator("#non-modal-persistent");
  assert.equal(await persistent.locator(".close").isVisible(), false, "persistent non-modal mode hides the close action");
  await persistent.getByRole("button", { name: "Still working" }).focus();
  await page.keyboard.press("Escape");
  assert.equal(await persistent.locator("dialog").isVisible(), true, "persistent non-modal mode ignores Escape");
  await page.mouse.click(10, 10);
  assert.equal(await persistent.locator("dialog").isVisible(), true, "persistent non-modal mode ignores outside presses");
  await persistent.evaluate(node => node.removeAttribute("open"));
  await page.waitForFunction(() => !document.querySelector("#non-modal-persistent")?.shadowRoot.querySelector("dialog").open);

  const defaultDrawer = await page.evaluate(() => { const node=document.createElement("spui-drawer");document.body.append(node);return node.shadowRoot.querySelector(".expand").hidden; });
  assert.equal(defaultDrawer, true, "expansion control stays opt-in");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", viewport: "900x650", reactExpandedBounds, nativeExpandedBounds, rtl: true, controlledReact: true, nativeEvent: true, nonModalOutsideDismiss: true, persistentNonModal: true, reducedMotionTransition, pageErrors: errors }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
