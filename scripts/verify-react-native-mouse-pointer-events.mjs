import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const mouseTypes = ["auxclick", "contextmenu", "dblclick", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup"];
const pointerTypes = ["gotpointercapture", "lostpointercapture", "pointercancel", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup"];
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,MenuButton,CompoundButton,ToggleButton,Hamburger,Link,Nav,NavItem,NavCategory,NavCategoryItem,NavSubItemGroup,NavSubItem,AppItem}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.events=[];window.track=(id,phase)=>(event=>{const common={id,phase,type:event.type,target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeType:event.nativeEvent.type};const pointer=event.type.includes("pointercapture")||event.type.startsWith("pointer");window.events.push(pointer?{...common,pointerId:event.pointerId,pointerType:event.pointerType,pressure:event.pressure}:{...common,button:event.button,clientX:event.clientX})});const eventProps=id=>({onAuxClick:window.track(id,"bubble"),onAuxClickCapture:window.track(id,"capture"),onContextMenu:window.track(id,"bubble"),onContextMenuCapture:window.track(id,"capture"),onDoubleClick:window.track(id,"bubble"),onDoubleClickCapture:window.track(id,"capture"),onMouseDown:window.track(id,"bubble"),onMouseDownCapture:window.track(id,"capture"),onMouseMove:window.track(id,"bubble"),onMouseMoveCapture:window.track(id,"capture"),onMouseOut:window.track(id,"bubble"),onMouseOutCapture:window.track(id,"capture"),onMouseOver:window.track(id,"bubble"),onMouseOverCapture:window.track(id,"capture"),onMouseUp:window.track(id,"bubble"),onMouseUpCapture:window.track(id,"capture"),onGotPointerCapture:window.track(id,"bubble"),onGotPointerCaptureCapture:window.track(id,"capture"),onLostPointerCapture:window.track(id,"bubble"),onLostPointerCaptureCapture:window.track(id,"capture"),onPointerCancel:window.track(id,"bubble"),onPointerCancelCapture:window.track(id,"capture"),onPointerDown:window.track(id,"bubble"),onPointerDownCapture:window.track(id,"capture"),onPointerMove:window.track(id,"bubble"),onPointerMoveCapture:window.track(id,"capture"),onPointerOut:window.track(id,"bubble"),onPointerOutCapture:window.track(id,"capture"),onPointerOver:window.track(id,"bubble"),onPointerOverCapture:window.track(id,"capture"),onPointerUp:window.track(id,"bubble"),onPointerUpCapture:window.track(id,"capture")});createRoot(document.querySelector("#root")).render(<><Button data-testid="button" {...eventProps("button")}>Button</Button><MenuButton data-testid="menu-button" {...eventProps("menu-button")}>Menu</MenuButton><CompoundButton data-testid="compound-button" {...eventProps("compound-button")}>Compound</CompoundButton><ToggleButton data-testid="toggle-button" {...eventProps("toggle-button")}>Toggle</ToggleButton><Hamburger data-testid="hamburger" {...eventProps("hamburger")}/><Link as="button" data-testid="link" {...eventProps("link")}>Link</Link><Nav data-testid="nav" {...eventProps("nav")}><NavItem value="item" data-testid="nav-item" {...eventProps("nav-item")}>Item</NavItem><NavCategory value="category"><NavCategoryItem data-testid="nav-category-item" {...eventProps("nav-category-item")}>Category</NavCategoryItem><NavSubItemGroup><NavSubItem value="subitem" data-testid="nav-subitem" {...eventProps("nav-subitem")}>Subitem</NavSubItem></NavSubItemGroup></NavCategory><AppItem value="app" data-testid="app-item" {...eventProps("app-item")}>App</AppItem></Nav></>);`,
    resolveDir: root,
    sourcefile: "react-native-mouse-pointer-events.tsx",
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
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=app-item]")?.shadowRoot?.querySelector("button,a"));

  const ids = ["button", "menu-button", "compound-button", "toggle-button", "hamburger", "link", "nav", "nav-item", "nav-category-item", "nav-subitem", "app-item"];
  const types = [...mouseTypes, ...pointerTypes];
  for (const id of ids) {
    await page.getByTestId(id).evaluate((host, { rootId, mouseTypes, pointerTypes }) => {
      const nativeRoot = host.shadowRoot?.querySelector(rootId === "nav" ? "nav" : "button,a");
      if (!nativeRoot) throw new Error(`Missing native event root for ${rootId}`);
      for (const type of mouseTypes) nativeRoot.dispatchEvent(new MouseEvent(type, { bubbles: true, composed: true, cancelable: true, button: 1, clientX: 12 }));
      for (const type of pointerTypes) nativeRoot.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, cancelable: true, pointerId: 7, pointerType: "pen", pressure: 0.5 }));
    }, { rootId: id, mouseTypes, pointerTypes });
  }

  const recorded = await page.evaluate(() => window.events);
  assert.equal(recorded.length, ids.length * types.length * 2 + 4 * types.length * 2, "all native roots emit capture and bubble callbacks; Nav also observes its four nested items");
  for (const id of ids) {
    const rows = recorded.filter(event => event.id === id);
    if (id === "nav") {
      assert.equal(rows.length, types.length * 10, "Nav sees its own events plus all four nested item events");
      for (const type of types) {
        const typeRows = rows.filter(event => event.type === type);
        assert.deepEqual(typeRows.map(event => event.phase), Array(5).fill(["capture", "bubble"]).flat(), `${type} preserves nested Nav capture/bubble order`);
        assert.equal(typeRows.filter(event => event.target === "NAV").length, 2, `${type} preserves the direct Nav root target`);
        assert.equal(typeRows.filter(event => event.target === "BUTTON").length, 8, `${type} preserves four nested item targets`);
        assert.ok(typeRows.every(event => event.currentTarget === "NAV" && event.nativeType === type));
      }
    } else {
      const root = "BUTTON";
      assert.equal(rows.length, types.length * 2, `${id} receives all mouse and pointer event callbacks`);
      assert.deepEqual(rows, types.flatMap(type => ["capture", "bubble"].map(phase => type.startsWith("pointer") || type.includes("pointercapture")
        ? { id, phase, type, target: root, currentTarget: root, nativeType: type, pointerId: 7, pointerType: "pen", pressure: 0.5 }
        : { id, phase, type, target: root, currentTarget: root, nativeType: type, button: ["mousemove", "mouseout", "mouseover"].includes(type) ? 0 : 1, clientX: 12 })), `${id} maps React callbacks to native-root event fields`);
    }
  }
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", nativeRoots: ids.length, mouseEventTypes: mouseTypes.length, pointerEventTypes: pointerTypes.length, captureAndBubble: true, pointerFields: true, noBrowserErrors: true }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
