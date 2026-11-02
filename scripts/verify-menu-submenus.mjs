import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { Button, Menu, MenuItem } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import { defineMenu } from "${resolve("packages/sharepoint-ui/src/elements/menu.ts")}";window.menuOpenChanges=[];
function Sample(){return <Menu data-testid="parent" label="Actions" onOpenChange={(event,data)=>window.menuOpenChanges.push({open:data.open,type:data.type,eventType:event.type,sameEvent:event===data.event,bubble:data.bubble,keyboard:data.keyboard})} trigger={<Button data-testid="parent-trigger">Actions</Button>}><MenuItem data-testid="top">Top action</MenuItem><Menu data-testid="submenu" label="Share" trigger={<MenuItem data-testid="submenu-trigger">Share</MenuItem>}><MenuItem data-testid="child-a" value="copy">Copy link</MenuItem><MenuItem data-testid="child-b" value="invite">Invite</MenuItem></Menu></Menu>}
createRoot(document.getElementById("react-root")).render(<div dir="ltr"><Sample/></div>);
window.mountNative = (dir) => { defineMenu(); const el=(tag,attrs={},text="")=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);n.textContent=text;return n;}; const wrap=el("div",{dir});const parent=el("spui-menu",{label:"Actions","data-testid":"native-parent"});const trigger=el("button",{slot:"trigger","data-testid":"native-parent-trigger"},"Actions");const content=el("div",{slot:"menu"});content.append(el("spui-menu-item",{"data-testid":"native-top"},"Top action"));const sub=el("spui-menu",{label:"Share","data-testid":"native-submenu"});sub.append(el("spui-menu-item",{slot:"trigger","data-testid":"native-submenu-trigger"},"Share"));const children=el("div",{slot:"menu"});children.append(el("spui-menu-item",{"data-testid":"native-child-a"},"Copy link"),el("spui-menu-item",{"data-testid":"native-child-b"},"Invite"));sub.append(children);content.append(sub);parent.append(trigger,content);wrap.append(parent);document.getElementById("native-root").append(wrap);};`,
    resolveDir: process.cwd(), sourcefile: "menu-submenu-check.tsx", loader: "tsx",
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
  await page.addInitScript(() => { window.deepActiveTestId = () => { let active = document.activeElement; let id; while (active) { if (active.getAttribute?.("data-testid")) id = active.getAttribute("data-testid"); active = active.shadowRoot?.activeElement ?? null; } return id; }; });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const press = async (testId, key) => { await page.getByTestId(testId).evaluate(node => node.focus()); await page.keyboard.press(key); };
  const runReact = async (dir, openKey, closeKey) => {
    const parent = page.locator("#react-root spui-menu").first();
    await page.getByTestId("parent-trigger").click();
    await press("top", "ArrowDown");
    await press("submenu-trigger", openKey);
    const opened = await page.getByTestId("submenu").evaluate(node => node.open);const bubbledOpenChange=await page.evaluate(()=>window.menuOpenChanges.at(-1));
    await page.waitForFunction(() => window.deepActiveTestId() === "child-a");
    const firstChildFocused = await page.evaluate(() => window.deepActiveTestId());
    const triggerSemantics = await page.getByTestId("submenu-trigger").evaluate(node => { const button=node.shadowRoot.querySelector("button"); return { haspopup:button?.getAttribute("aria-haspopup"), expanded:button?.getAttribute("aria-expanded") }; });
    const placement = await page.getByTestId("submenu").getAttribute("placement");
    await press("child-a", closeKey);
    const returnedToTrigger = await page.evaluate(() => window.deepActiveTestId());
    const closedWithParentOpen = !(await page.getByTestId("submenu").evaluate(node => node.open)) && await parent.evaluate(node => node.open);
    await press("submenu-trigger", openKey);
    await press("child-a", "Enter");
    const hierarchyClosed = !(await page.getByTestId("submenu").evaluate(node => node.open)) && !(await parent.evaluate(node => node.open));
    await page.getByTestId("parent-trigger").click();
    await press("top", "ArrowDown");
    await press("submenu-trigger", openKey);
    await page.waitForFunction(() => window.deepActiveTestId() === "child-a");
    await press("child-a", "Tab");
    const tabClosedHierarchy = !(await page.getByTestId("submenu").evaluate(node => node.open)) && !(await parent.evaluate(node => node.open));
    await page.getByTestId("parent-trigger").click();
    await page.getByTestId("submenu-trigger").click();
    const clickOpenedSubmenu = await page.getByTestId("submenu").evaluate(node => node.open);
    await page.waitForFunction(() => window.deepActiveTestId() === "child-a");
    await page.emulateMedia({ forcedColors: "active" });
    const systemColors = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;border:1px solid CanvasText";
      document.body.append(probe);
      const colors = { text: getComputedStyle(probe).color, canvas: getComputedStyle(probe).backgroundColor, border: getComputedStyle(probe).borderTopColor };
      probe.remove();
      return colors;
    });
    const forcedSurfaces = await Promise.all([parent, page.getByTestId("submenu")].map(host => host.evaluate(node => {
      const style = getComputedStyle(node.shadowRoot.querySelector(".surface"));
      return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow };
    })));
    for (const [index, surface] of forcedSurfaces.entries()) {
      assert.equal(surface.text, systemColors.text, `nested menu surface ${index} uses CanvasText in forced colors`);
      assert.equal(surface.background, systemColors.canvas, `nested menu surface ${index} uses Canvas`);
      assert.equal(surface.border, systemColors.border, `nested menu surface ${index} uses CanvasText border`);
      assert.equal(surface.shadow, "none", `nested menu surface ${index} does not rely on shadow`);
    }
    await page.emulateMedia({ forcedColors: "none" });
    await page.mouse.click(980, 680);
    const outsideClickClosed = !(await parent.evaluate(node => node.open));const outsideCloseData=await page.evaluate(()=>window.menuOpenChanges.at(-1));
    return { dir, opened, bubbledOpenChange, forcedColors: { systemColors, surfaces: forcedSurfaces }, firstChildFocused, triggerSemantics, placement, returnedToTrigger, closedWithParentOpen, hierarchyClosed, tabClosedHierarchy, clickOpenedSubmenu, outsideClickClosed, outsideCloseData };
  };
  const ltr = await runReact("ltr", "ArrowRight", "ArrowLeft");
  assert.equal(ltr.opened, true);assert.deepEqual(ltr.bubbledOpenChange,{open:true,type:"menuTriggerKeyDown",eventType:"keydown",sameEvent:true,bubble:true,keyboard:true},"nested open-change reports a bubbled keyboard source");
  assert.equal(ltr.firstChildFocused, "child-a");
  assert.deepEqual(ltr.triggerSemantics, { haspopup: "menu", expanded: "true" });
  assert.equal(ltr.placement, "end");
  assert.equal(ltr.returnedToTrigger, "submenu-trigger");
  assert.equal(ltr.closedWithParentOpen, true);
  assert.equal(ltr.hierarchyClosed, true);
  assert.equal(ltr.tabClosedHierarchy, true);
  assert.equal(ltr.clickOpenedSubmenu, true);
  assert.equal(ltr.outsideClickClosed, true);assert.deepEqual(ltr.outsideCloseData,{open:false,type:"clickOutside",eventType:"pointerdown",sameEvent:true,bubble:false,keyboard:false},"outside dismissal reports its pointer source");

  // Exercise the framework-neutral adapter in RTL.
  await page.evaluate(() => window.mountNative("rtl"));
  const nativeParent = page.getByTestId("native-parent");
  await page.getByTestId("native-parent-trigger").click();
  await press("native-top", "ArrowDown");
  await press("native-submenu-trigger", "ArrowLeft");
  const nativeOpened = await page.getByTestId("native-submenu").evaluate(node => node.open);
  await page.waitForTimeout(100);
  const nativeFocused = await page.evaluate(() => window.deepActiveTestId());
  const nativePlacement = await page.getByTestId("native-submenu").getAttribute("placement");
  await press("native-child-a", "ArrowRight");
  const nativeReturned = await page.evaluate(() => window.deepActiveTestId());
  const nativeParentStayedOpen = await nativeParent.evaluate(node => node.open);
  await press("native-submenu-trigger", "ArrowLeft");
  await press("native-child-a", "Escape");
  const escapeClosedSubmenu = !(await page.getByTestId("native-submenu").evaluate(node => node.open)) && await nativeParent.evaluate(node => node.open);
  const escapeReturnedFocus = await page.evaluate(() => window.deepActiveTestId());
  await press("native-submenu-trigger", "Escape");
  const secondEscapeClosedParent = !(await nativeParent.evaluate(node => node.open));
  assert.equal(nativeOpened, true);
  assert.equal(nativePlacement, "end");
  assert.equal(nativeFocused, "native-child-a");
  assert.equal(nativeReturned, "native-submenu-trigger");
  assert.equal(nativeParentStayedOpen, true);
  assert.equal(escapeClosedSubmenu, true);
  assert.equal(escapeReturnedFocus, "native-submenu-trigger");
  assert.equal(secondEscapeClosedParent, true);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ browser: "Chromium headless", reactLTR: ltr, nativeRTL: { opened: nativeOpened, placement: nativePlacement, firstChildFocused: nativeFocused, returnedToTrigger: nativeReturned, parentStayedOpen: nativeParentStayedOpen, escapeClosedSubmenu, escapeReturnedFocus, secondEscapeClosedParent }, errors }, null, 2));
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
