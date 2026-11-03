import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,MenuButton,CompoundButton,ToggleButton,Hamburger,Link,Nav,NavItem,NavCategory,NavCategoryItem,NavSubItemGroup,NavSubItem,AppItem}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.events=[];window.track=(id,phase)=>(event=>window.events.push({id,phase,type:event.type,target:event.target.tagName,currentTarget:event.currentTarget.tagName,key:event.key,code:event.code,nativeType:event.nativeEvent.type}));const eventProps=id=>({onKeyDown:window.track(id,"bubble"),onKeyDownCapture:window.track(id,"capture"),onKeyUp:window.track(id,"bubble"),onKeyUpCapture:window.track(id,"capture"),onKeyPress:window.track(id,"bubble"),onKeyPressCapture:window.track(id,"capture")});createRoot(document.querySelector("#root")).render(<><Button data-testid="button" {...eventProps("button")}>Button</Button><MenuButton data-testid="menu-button" {...eventProps("menu-button")}>Menu</MenuButton><CompoundButton data-testid="compound-button" {...eventProps("compound-button")}>Compound</CompoundButton><ToggleButton data-testid="toggle-button" {...eventProps("toggle-button")}>Toggle</ToggleButton><Hamburger data-testid="hamburger" {...eventProps("hamburger")}/><Link as="button" data-testid="link" {...eventProps("link")}>Link</Link><Nav data-testid="nav" {...eventProps("nav")}><NavItem value="item" data-testid="nav-item" {...eventProps("nav-item")}>Item</NavItem><NavCategory value="category"><NavCategoryItem data-testid="nav-category-item" {...eventProps("nav-category-item")}>Category</NavCategoryItem><NavSubItemGroup><NavSubItem value="subitem" data-testid="nav-subitem" {...eventProps("nav-subitem")}>Subitem</NavSubItem></NavSubItemGroup></NavCategory><AppItem value="app" data-testid="app-item" {...eventProps("app-item")}>App</AppItem></Nav></>);`,
    resolveDir: root,
    sourcefile: "react-native-keyboard-events.tsx",
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
  for (const id of ids) {
    await page.getByTestId(id).evaluate((host, rootId) => {
      const nativeRoot = host.shadowRoot?.querySelector(rootId === "nav" ? "nav" : "button,a");
      if (!nativeRoot) throw new Error(`Missing native keyboard root for ${rootId}`);
      for (const type of ["keydown", "keypress", "keyup"]) nativeRoot.dispatchEvent(new KeyboardEvent(type, { key: "k", code: "KeyK", bubbles: true, composed: true, cancelable: true }));
    }, id);
  }

  const recorded = await page.evaluate(() => window.events);
  assert.equal(recorded.length, ids.length * 6 + 24, "each native root emits capture and bubble callbacks, and Nav also observes its four bubbling item events");
  for (const id of ids) {
    if (id === "nav") {
      const navEvents = recorded.filter(event => event.id === id);
      assert.equal(navEvents.length, 30, "Nav receives its own keyboard events and all four nested navigation item events");
      for (const type of ["keydown", "keypress", "keyup"]) {
        const typeEvents = navEvents.filter(event => event.type === type);
        assert.deepEqual(typeEvents.map(event => event.phase), Array(5).fill(["capture", "bubble"]).flat(), `Nav preserves capture and bubble order for ${type}`);
        assert.deepEqual(typeEvents.map(event => event.target).sort(), ["BUTTON", "BUTTON", "BUTTON", "BUTTON", "BUTTON", "BUTTON", "BUTTON", "BUTTON", "NAV", "NAV"], `Nav retains nested targets while keeping its native root as currentTarget for ${type}`);
        assert.ok(typeEvents.every(event => event.currentTarget === "NAV" && event.key === "k" && event.code === "KeyK" && event.nativeType === type));
      }
      continue;
    }
    const expectedRoot = id === "nav" ? "NAV" : "BUTTON";
    assert.deepEqual(recorded.filter(event => event.id === id), ["keydown", "keypress", "keyup"].flatMap(type => ["capture", "bubble"].map(phase => ({ id, phase, type, target: expectedRoot, currentTarget: expectedRoot, key: "k", code: "KeyK", nativeType: type }))), `${id} delivers keyboard events to its native root in capture then bubble order`);
  }
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", nativeRoots: ids.length, keyboardCaptureAndBubble: true, keyAndCodeFields: true, noBrowserErrors: true }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
