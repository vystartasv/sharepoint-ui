import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Button,Drawer,DrawerBody,DrawerFooter,DrawerHeader,DrawerHeaderNavigation,DrawerHeaderTitle,InlineDrawer,OverlayDrawer}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";function Motion({visible,position,size,dir,children}){return <div data-testid="drawer-motion" data-visible={String(visible)} data-position={position} data-size={size} data-dir={dir}>{children}</div>}function OverlaySurfaceMotion({visible,position,dir,children}){const ref=React.useRef(null);React.useLayoutEffect(()=>{const surface=ref.current?.querySelector("spui-drawer")?.shadowRoot?.querySelector("dialog");const offset=position==="start"?(dir==="rtl"?"16px":"-16px"):dir==="rtl"?"-16px":"16px";surface?.animate([{opacity:visible?0:1,transform:visible?"translateX("+offset+")":"translateX(0)"},{opacity:visible?1:0,transform:visible?"translateX(0)":"translateX("+offset+")"}],{duration:90,easing:"ease",fill:"both"})},[visible,position,dir]);return <div ref={ref} data-testid="overlay-surface-motion" data-visible={String(visible)}>{children}</div>}function OverlayBackdropMotion({visible,size,slot,children}){const ref=React.useRef(null);React.useLayoutEffect(()=>{ref.current?.animate([{opacity:visible?0:1},{opacity:visible?1:0}],{duration:size==="small"?90:110,easing:"linear",fill:"both"})},[visible,size]);return <div ref={ref} slot={slot} data-testid="overlay-backdrop-motion" data-visible={String(visible)}>{children}</div>}function Demo(){const[open,setOpen]=React.useState(false);const[motionOpen,setMotionOpen]=React.useState(true);return <SharePointUIProvider strings={{drawerNavigation:"ملاحة اللوحة",drawerLabel:"محتوى إضافي"}}><Button data-testid="open-overlay" onClick={()=>setOpen(true)}>Open details</Button><OverlayDrawer data-testid="overlay" surfaceMotion={OverlaySurfaceMotion} backdropMotion={OverlayBackdropMotion} open={open} onOpenChange={next=>{window.openChanges.push(next);setOpen(next)}}><DrawerHeader><DrawerHeaderNavigation><Button>Back</Button></DrawerHeaderNavigation><DrawerHeaderTitle heading={<h3 data-testid="drawer-heading" className="custom-heading"/>} action={<Button>More</Button>}>Edit document</DrawerHeaderTitle></DrawerHeader><DrawerBody data-testid="body">Document details</DrawerBody><DrawerFooter data-testid="footer"><Button appearance="primary">Save</Button></DrawerFooter></OverlayDrawer><OverlayDrawer data-testid="uncontrolled" defaultOpen title="Uncontrolled details" onOpenChange={next=>window.uncontrolledChanges.push(next)} ><span data-testid="uncontrolled-child">Body</span></OverlayDrawer><OverlayDrawer data-testid="preserved" open={false} title="Preserved details" unmountOnClose={false}><span data-testid="preserved-child">Keep state</span></OverlayDrawer><InlineDrawer data-testid="closed-inline" unmountOnClose={false}><span data-testid="closed-inline-child">Preserve inline state</span></InlineDrawer><Button data-testid="toggle-motion-inline" onClick={()=>setMotionOpen(value=>!value)}>Toggle animated inline drawer</Button><Drawer data-testid="motion-inline" type="inline" open={motionOpen} surfaceMotion={Motion} dir="rtl" position="end" size="medium" title="Animated inline">Animated content</Drawer><Drawer data-testid="drawer-default" type="inline" defaultOpen title="Drawer default open">Default open body</Drawer><InlineDrawer data-testid="inline" open title="Workspace navigation" separator size="small"><DrawerHeaderTitle data-testid="default-heading">Workspace navigation</DrawerHeaderTitle><DrawerBody>Navigation items</DrawerBody><DrawerFooter><Button>Manage</Button></DrawerFooter></InlineDrawer><InlineDrawer data-testid="rtl-inline" dir="rtl" open title="محتوى إضافي" position="end" separator size="medium">Arabic content</InlineDrawer><Drawer data-testid="inline-shortcut" type="inline" open title="Inline shortcut">In flow</Drawer></SharePointUIProvider>}window.openChanges=[];window.uncontrolledChanges=[];createRoot(document.querySelector("#root")).render(<Demo/>);`,
    resolveDir: root,
    sourcefile: "drawer-family-parity.tsx",
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div><script src='/bundle.js'></script></body></html>"));
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
  const uncontrolled = page.getByTestId("uncontrolled");
  assert.equal(await uncontrolled.locator("dialog").evaluate(dialog => dialog.open), true, "defaultOpen initializes uncontrolled overlay state");
  assert.equal(await page.getByTestId("uncontrolled-child").count(), 1);
  await uncontrolled.getByRole("button", { name: "Close" }).click();
  assert.equal(await uncontrolled.locator("dialog").evaluate(dialog => dialog.open), false, "uncontrolled overlay closes from its close action");
  assert.deepEqual(await page.evaluate(() => window.uncontrolledChanges), [false], "dismissal reaches the overlay state owner");
  await page.waitForFunction(() => !document.querySelector('[data-testid="uncontrolled-child"]'));
  assert.equal(await page.getByTestId("uncontrolled-child").count(), 0, "unmountOnClose removes overlay children after close");
  assert.equal(await page.getByTestId("preserved").locator("dialog").evaluate(dialog => dialog.open), false);
  assert.equal(await page.getByTestId("preserved-child").count(), 1, "unmountOnClose=false preserves closed overlay children");
  assert.equal(await page.getByTestId("closed-inline-child").count(), 1, "unmountOnClose=false preserves closed inline content");
  assert.deepEqual(await page.getByTestId("drawer-motion").evaluate(node => ({ visible: node.dataset.visible, position: node.dataset.position, size: node.dataset.size, dir: node.dataset.dir })), { visible: "true", position: "end", size: "medium", dir: "rtl" }, "surfaceMotion receives open state and direction-aware drawer parameters");
  await page.getByTestId("toggle-motion-inline").click();
  assert.equal(await page.getByTestId("drawer-motion").getAttribute("data-visible"), "false");
  assert.equal(await page.getByTestId("motion-inline").locator("aside").getAttribute("aria-hidden"), "true", "closed animated inline content is hidden from assistive technology");
  assert.equal(await page.getByTestId("motion-inline").locator("aside").evaluate(node => node.inert), true, "closed animated inline content is inert during exit motion");
  assert.equal(await page.getByTestId("drawer-default").locator("aside").isVisible(), true, "Drawer defaultOpen initializes uncontrolled inline state");
  await page.getByTestId("open-overlay").click();
  await page.waitForFunction(() => document.querySelector("[data-testid=overlay]")?.shadowRoot?.querySelector("dialog")?.open);
  assert.equal(await page.getByTestId("overlay-surface-motion").getAttribute("data-visible"), "true");
  assert.equal(await page.getByTestId("overlay-backdrop-motion").getAttribute("data-visible"), "true");

  const overlayHost = page.getByTestId("overlay");
  const overlayDialog = overlayHost.locator("dialog");
  assert.equal(await overlayDialog.getAttribute("aria-labelledby"), "title", "composed header title labels the dialog heading");
  assert.equal(await page.getByRole("dialog", { name: "Edit document" }).count(), 1);
  assert.equal(await page.getByRole("navigation", { name: "ملاحة اللوحة" }).count(), 1, "provider localizes the header navigation name");
  assert.equal(await page.getByRole("button", { name: "More" }).count(), 1, "header title action is rendered alongside close controls");
  assert.equal(await page.getByTestId("drawer-heading").evaluate(node => node.tagName), "H3", "heading slot supports semantic heading elements");
  assert.equal(await page.getByTestId("drawer-heading").innerText(), "Edit document", "heading slot receives title content");
  assert.equal(await page.getByTestId("default-heading").locator("h2").count(), 1, "drawer title defaults to Fluent's semantic h2 heading");
  assert.equal(await page.getByTestId("body").innerText(), "Document details");
  assert.equal(await page.getByTestId("footer").count(), 1, "DrawerFooter is placed in the footer slot");
  assert.equal(await page.getByRole("button", { name: "Save" }).count(), 1);
  assert.equal(await overlayHost.getAttribute("position"), "start", "OverlayDrawer uses Fluent's start-side default");
  assert.equal(await overlayHost.getAttribute("size"), "small", "OverlayDrawer uses Fluent's small default");

  const inline = page.getByTestId("inline");
  const aside = inline.locator("aside");
  assert.equal(await page.getByRole("complementary", { name: "Workspace navigation" }).count(), 1, "InlineDrawer is a labelled complementary region");
  assert.equal(await aside.evaluate(node => getComputedStyle(node).inlineSize), "240px", "small inline drawer uses compact in-flow width");
  assert.equal(await aside.evaluate(node => getComputedStyle(node).borderInlineEndWidth), "1px", "separator follows logical end in LTR");
  assert.equal(await inline.getByRole("button", { name: "Manage" }).count(), 1);
  const rtl = page.getByTestId("rtl-inline").locator("aside");
  assert.equal(await rtl.evaluate(node => getComputedStyle(node).borderInlineStartWidth), "1px", "end separator follows RTL logical start edge");
  assert.equal(await page.getByTestId("inline-shortcut").locator("aside").isVisible(), true, "Drawer type=inline selects the in-flow surface");
  assert.equal(await page.getByTestId("inline-shortcut").locator("aside").evaluate(node => getComputedStyle(node).borderInlineEndWidth), "0px", "InlineDrawer separator defaults to false");

  await page.emulateMedia({ forcedColors: "active" });
  const systemColors = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;border:1px solid CanvasText";
    document.body.append(probe);
    const colors = { text: getComputedStyle(probe).color, canvas: getComputedStyle(probe).backgroundColor, border: getComputedStyle(probe).borderTopColor };
    probe.remove();
    return colors;
  });
  const forcedModal = await page.getByTestId("uncontrolled").locator("dialog").evaluate(node => {
    const style = getComputedStyle(node);
    return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow, backdrop: getComputedStyle(node, "::backdrop").backgroundColor };
  });
  assert.equal(forcedModal.text, systemColors.text, "OverlayDrawer text uses CanvasText in forced colors");
  assert.equal(forcedModal.background, systemColors.canvas, "OverlayDrawer surface uses Canvas");
  assert.equal(forcedModal.border, systemColors.border, "OverlayDrawer border uses CanvasText");
  assert.equal(forcedModal.shadow, "none", "OverlayDrawer does not rely on shadow in forced colors");
  assert.equal(forcedModal.backdrop, systemColors.canvas, "OverlayDrawer backdrop uses Canvas");
  const forcedInline = await aside.evaluate(node => {
    const style = getComputedStyle(node);
    return { text: style.color, background: style.backgroundColor, border: style.borderInlineEndColor };
  });
  assert.equal(forcedInline.text, systemColors.text, "InlineDrawer text uses CanvasText");
  assert.equal(forcedInline.background, systemColors.canvas, "InlineDrawer surface uses Canvas");
  assert.equal(forcedInline.border, systemColors.border, "InlineDrawer separator uses CanvasText");
  await page.emulateMedia({ forcedColors: "none" });

  await page.evaluate(() => {
    const drawer = document.createElement("spui-inline-drawer"); drawer.id = "native-inline"; drawer.setAttribute("open", ""); drawer.setAttribute("separator", ""); drawer.setAttribute("aria-label", "Native navigation");
    const nav = document.createElement("nav"); nav.slot = "header-navigation"; nav.setAttribute("aria-label", "Native drawer navigation"); nav.textContent = "Back";
    const title = document.createElement("span"); title.slot = "title"; title.textContent = "Native title";
    const body = document.createElement("p"); body.textContent = "Native content";
    const actions = document.createElement("div"); actions.slot = "actions"; actions.textContent = "Native actions";
    drawer.append(nav, title, body, actions); document.body.append(drawer);
  });
  assert.equal(await page.getByRole("complementary", { name: "Native navigation" }).count(), 1, "framework-neutral inline drawer works with named slots");
  assert.equal(await page.getByRole("navigation", { name: "Native drawer navigation" }).count(), 1);
  await page.screenshot({ path: resolve(root, "test-results/drawer-overlay-composition.png"), fullPage: true });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("[data-testid=overlay-surface-motion]")?.getAttribute("data-visible") === "false");
  assert.equal(await overlayDialog.evaluate(dialog => dialog.open), true, "native top-layer dialog stays open during its motion exit");
  assert.equal(await overlayDialog.evaluate(dialog => dialog.inert), true, "exiting dialog is inert while motion plays");
  await page.waitForFunction(() => !document.querySelector("[data-testid=overlay]")?.shadowRoot?.querySelector("dialog")?.open);
  assert.deepEqual(await page.evaluate(() => window.openChanges), [false], "modal dismissal emits the controlled open change");
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/drawer-family-parity.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", composedOverlaySlotsAndAccessibleName: true, localizedNavigation: true, overlayDefaultAndControlledState: true, inlineFlowAndSeparator: true, rtlLogicalPlacement: true, drawerTypeInline: true, forcedColors: { systemColors, modal: forcedModal, inline: forcedInline }, directCustomElementSlots: true, noPageErrors: true, screenshots: ["test-results/drawer-overlay-composition.png", "test-results/drawer-family-parity.png"] }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
