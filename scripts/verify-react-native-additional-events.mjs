import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const bindings = [
  ["copy", "onCopy"], ["cut", "onCut"], ["paste", "onPaste"],
  ["compositionend", "onCompositionEnd"], ["compositionstart", "onCompositionStart"], ["compositionupdate", "onCompositionUpdate"],
  ["beforeinput", "onBeforeInput"], ["input", "onInput"], ["input", "onChange"],
  ["drag", "onDrag"], ["dragend", "onDragEnd"], ["dragenter", "onDragEnter"], ["dragexit", "onDragExit"], ["dragleave", "onDragLeave"], ["dragover", "onDragOver"], ["dragstart", "onDragStart"], ["drop", "onDrop"],
  ["touchcancel", "onTouchCancel"], ["touchend", "onTouchEnd"], ["touchmove", "onTouchMove"], ["touchstart", "onTouchStart"],
  ["wheel", "onWheel"], ["animationstart", "onAnimationStart"], ["animationend", "onAnimationEnd"], ["animationiteration", "onAnimationIteration"], ["transitionend", "onTransitionEnd"],
];
const families = { clipboard: bindings.slice(0, 3), composition: bindings.slice(3, 6), input: bindings.slice(6, 9), drag: bindings.slice(9, 17), touch: bindings.slice(17, 21), wheel: bindings.slice(21, 22), animation: bindings.slice(22, 25), transition: bindings.slice(25) };
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,MenuButton,CompoundButton,ToggleButton,Hamburger,Link,Nav,NavItem,NavCategory,NavCategoryItem,NavSubItemGroup,NavSubItem,AppItem}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.events=[];window.bindings=${JSON.stringify(bindings)};window.track=(id,phase,source)=>(event=>{const native=event.nativeEvent;const fields=native instanceof ClipboardEvent?{clipboardData:Boolean(event.clipboardData)}:native instanceof CompositionEvent?{data:event.data}:native instanceof InputEvent?{data:event.data,inputType:event.inputType,isComposing:event.isComposing,dataTransfer:Boolean(event.dataTransfer)}:native instanceof DragEvent?{dataTransfer:Boolean(event.dataTransfer)}:native instanceof TouchEvent?{touchCount:event.touches.length,changedTouchCount:event.changedTouches.length}:native instanceof WheelEvent?{deltaX:event.deltaX,deltaY:event.deltaY,deltaMode:event.deltaMode}:native instanceof AnimationEvent?{animationName:event.animationName,elapsedTime:event.elapsedTime,pseudoElement:event.pseudoElement}:native instanceof TransitionEvent?{propertyName:event.propertyName,elapsedTime:event.elapsedTime,pseudoElement:event.pseudoElement}:{};window.events.push({id,phase,source,type:event.type,target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeType:native.type,...fields})});const eventProps=id=>Object.fromEntries(window.bindings.flatMap(([type,prop])=>[[prop,window.track(id,"bubble",prop)],[prop+"Capture",window.track(id,"capture",prop)]]));createRoot(document.querySelector("#root")).render(<><Button data-testid="button" {...eventProps("button")}>Button</Button><MenuButton data-testid="menu-button" {...eventProps("menu-button")}>Menu</MenuButton><CompoundButton data-testid="compound-button" {...eventProps("compound-button")}>Compound</CompoundButton><ToggleButton data-testid="toggle-button" {...eventProps("toggle-button")}>Toggle</ToggleButton><Hamburger data-testid="hamburger" {...eventProps("hamburger")}/><Link as="button" data-testid="link" {...eventProps("link")}>Link</Link><Nav data-testid="nav" {...eventProps("nav")}><NavItem value="item" data-testid="nav-item" {...eventProps("nav-item")}>Item</NavItem><NavCategory value="category"><NavCategoryItem data-testid="nav-category-item" {...eventProps("nav-category-item")}>Category</NavCategoryItem><NavSubItemGroup><NavSubItem value="subitem" data-testid="nav-subitem" {...eventProps("nav-subitem")}>Subitem</NavSubItem></NavSubItemGroup></NavCategory><AppItem value="app" data-testid="app-item" {...eventProps("app-item")}>App</AppItem></Nav></>);`,
    resolveDir: root,
    sourcefile: "react-native-additional-events.tsx",
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
const { chromium } = createRequire(import.meta.url)("playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=app-item]")?.shadowRoot?.querySelector("button,a"));

  const ids = ["button", "menu-button", "compound-button", "toggle-button", "hamburger", "link", "nav", "nav-item", "nav-category-item", "nav-subitem", "app-item"];
  const eventTypes = [...new Set(bindings.map(([type]) => type))];
  for (const id of ids) {
    await page.getByTestId(id).evaluate((host, rootId) => {
      const nativeRoot = host.shadowRoot?.querySelector(rootId === "nav" ? "nav" : "button,a");
      if (!nativeRoot) throw new Error(`Missing native event root for ${rootId}`);
      for (const type of ["copy", "cut", "paste"]) nativeRoot.dispatchEvent(new ClipboardEvent(type, { bubbles: true, composed: true, cancelable: true, clipboardData: new DataTransfer() }));
      for (const type of ["compositionend", "compositionstart", "compositionupdate"]) nativeRoot.dispatchEvent(new CompositionEvent(type, { bubbles: true, composed: true, data: "あ" }));
      for (const type of ["beforeinput", "input"]) nativeRoot.dispatchEvent(new InputEvent(type, { bubbles: true, composed: true, cancelable: true, data: "x", inputType: "insertText", isComposing: true, dataTransfer: new DataTransfer() }));
      for (const type of ["drag", "dragend", "dragenter", "dragexit", "dragleave", "dragover", "dragstart", "drop"]) nativeRoot.dispatchEvent(new DragEvent(type, { bubbles: true, composed: true, cancelable: true, dataTransfer: new DataTransfer() }));
      const touch = new Touch({ identifier: 1, target: nativeRoot, clientX: 8, clientY: 13 });
      for (const type of ["touchcancel", "touchend", "touchmove", "touchstart"]) nativeRoot.dispatchEvent(new TouchEvent(type, { bubbles: true, composed: true, cancelable: true, touches: [touch], targetTouches: [touch], changedTouches: [touch] }));
      nativeRoot.dispatchEvent(new WheelEvent("wheel", { bubbles: true, composed: true, cancelable: true, deltaX: 2, deltaY: 9, deltaMode: 1 }));
      for (const type of ["animationstart", "animationend", "animationiteration"]) nativeRoot.dispatchEvent(new AnimationEvent(type, { bubbles: true, composed: true, animationName: "fade", elapsedTime: 1.25, pseudoElement: "::before" }));
      nativeRoot.dispatchEvent(new TransitionEvent("transitionend", { bubbles: true, composed: true, propertyName: "opacity", elapsedTime: 0.4, pseudoElement: "::after" }));
    }, id);
  }

  const recorded = await page.evaluate(() => window.events);
  assert.equal(recorded.length, ids.length * eventTypes.length * 2 + 4 * eventTypes.length * 2 + ids.length * 2 + 4 * 2, "all native roots emit capture and bubble callbacks, including normalized onChange, and Nav observes its nested items");
  for (const id of ids) {
    const rows = recorded.filter(event => event.id === id);
    if (id === "nav") {
      assert.equal(rows.length, eventTypes.length * 10 + 10, "Nav sees its own events plus all four nested item events and onChange callbacks");
      for (const type of eventTypes) {
        const typeRows = rows.filter(event => event.nativeType === type);
        assert.equal(typeRows.length, type === "input" ? 20 : 10, `${type} preserves all direct and nested Nav callbacks`);
        assert.equal(typeRows.filter(event => event.target === "NAV").length, type === "input" ? 4 : 2, `${type} preserves the direct Nav root target`);
        assert.equal(typeRows.filter(event => event.target === "BUTTON").length, type === "input" ? 16 : 8, `${type} preserves four nested Nav targets`);
        assert.ok(typeRows.every(event => event.currentTarget === "NAV" && event.nativeType === type));
        assert.ok(typeRows.filter(event => event.source === "onChange").every(event => event.type === "change"), "onChange receives React change event type");
      }
    } else {
      assert.equal(rows.length, eventTypes.length * 2 + 2, `${id} receives each event and both normalized onChange callbacks`);
      for (const type of eventTypes) {
        const typeRows = rows.filter(event => event.nativeType === type);
        assert.equal(typeRows.length, type === "input" ? 4 : 2, `${id} receives ${type} in capture and bubble phases`);
        assert.deepEqual(typeRows.map(event => event.phase), type === "input" ? ["capture", "capture", "bubble", "bubble"] : ["capture", "bubble"]);
        assert.ok(typeRows.every(event => event.target === "BUTTON" && event.currentTarget === "BUTTON" && event.nativeType === type));
        assert.ok(typeRows.filter(event => event.source === "onChange").every(event => event.type === "change"), "onChange receives React change event type");
      }
    }
  }
  assert.ok(recorded.filter(event => ["copy", "cut", "paste"].includes(event.nativeType)).every(event => event.clipboardData), "clipboard data is preserved");
  assert.ok(recorded.filter(event => event.nativeType.startsWith("composition")).every(event => event.data === "あ"), "composition data is preserved");
  assert.ok(recorded.filter(event => event.nativeType === "beforeinput" || event.nativeType === "input").every(event => event.data === "x" && event.inputType === "insertText" && event.isComposing && event.dataTransfer), "input event fields are preserved");
  assert.ok(recorded.filter(event => event.nativeType.startsWith("drag")).every(event => event.dataTransfer), "drag DataTransfer is preserved");
  assert.ok(recorded.filter(event => event.nativeType.startsWith("touch")).every(event => event.touchCount === 1 && event.changedTouchCount === 1), "touch lists are preserved");
  assert.ok(recorded.filter(event => event.nativeType === "wheel").every(event => event.deltaX === 2 && event.deltaY === 9 && event.deltaMode === 1), "wheel deltas are preserved");
  assert.ok(recorded.filter(event => event.nativeType.startsWith("animation")).every(event => event.animationName === "fade" && event.elapsedTime === 1.25 && event.pseudoElement === "::before"), "animation fields are preserved");
  assert.ok(recorded.filter(event => event.nativeType === "transitionend").every(event => event.propertyName === "opacity" && event.elapsedTime === 0.4 && event.pseudoElement === "::after"), "transition fields are preserved");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", nativeRoots: ids.length, eventFamilies: Object.fromEntries(Object.entries(families).map(([name, entries]) => [name, entries.length])), captureAndBubble: true, payloadFields: true, hostCallbacksNotDuplicated: true, noBrowserErrors: true }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
