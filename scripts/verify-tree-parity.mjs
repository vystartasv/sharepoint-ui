import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "/Users/vilius/.t3/projects/spfx-research/node_modules/playwright/index.mjs";

const bundle = await build({
  stdin: { contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Tree}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineTree}from"${resolve("packages/sharepoint-ui/src/elements/tree.ts")}";defineTree();window.events={checked:[],open:[],navigation:[],single:[],default:[]};const items=[{id:"root",label:"Root",children:[{id:"leaf",label:"Leaf"}]}];function App(){return <><Tree data-testid="tree" items={items} label="Files" selectionMode="multiselect" defaultCheckedItems={[["leaf","mixed"]]} openItems={["root"]} appearance="subtle-alpha" size="small" navigationMode="treegrid" renderItem={node=><><span data-testid={"name-"+node.id}>{node.label}</span><button type="button" aria-label={"Action "+node.label}>Action</button></>} onCheckedChange={(event,data)=>window.events.checked.push({value:data.value,checked:data.checked,entries:[...data.checkedItems],selectionMode:data.selectionMode,eventType:event.type,currentTarget:event.currentTarget.localName,nativeEventType:event.nativeEvent.type,sameEvent:event===data.event})} onOpenChange={(event,data)=>{if(data.type==="ExpandIconClick"||data.type==="Click"){const branch:React.MouseEvent<HTMLElement>=data.event;void branch;}else{const branch:React.KeyboardEvent<HTMLElement>=data.event;void branch;}window.events.open.push({value:data.value,open:data.open,type:data.type,openItems:[...data.openItems],sameEvent:event===data.event,eventType:data.event.type})}} onNavigation={(event,data)=>{if(data.type==="Click"){const branch:React.MouseEvent<HTMLElement>=data.event;void branch;}else{const branch:React.KeyboardEvent<HTMLElement>=data.event;void branch;}data.preventScroll();window.events.navigation.push({value:data.value,parentValue:data.parentValue,type:data.type,sameEvent:event===data.event,eventType:data.event.type,currentTarget:data.event.currentTarget.localName,nativeEventType:data.event.nativeEvent.type,isScrollPrevented:data.isScrollPrevented,canPreventScroll:typeof data.preventScroll==="function"})}}/><Tree data-testid="single" items={[{id:"solo",label:"Solo"}]} selectionMode="single" selectedKeys={["solo"]} onSelectionChange={keys=>window.events.single.push(keys)}/><Tree data-testid="default" items={[{id:"default-leaf",label:"Default leaf"}]} onSelectionChange={keys=>window.events.default.push(keys)}/></>}createRoot(document.querySelector("#root")).render(<App/>);window.nativeSelection=[];const native=document.createElement("spui-tree");native.items=items;native.openItems=["root"];native.checkedItems=[["leaf","mixed"]];native.setAttribute("selection-mode","multiple");native.setAttribute("appearance","transparent");native.setAttribute("size","small");native.setAttribute("navigation-mode","treegrid");native.addEventListener("spui-tree-selection-change",event=>window.nativeSelection.push({keys:event.detail.selectedKeys,entries:[...event.detail.checkedItems],checked:event.detail.checked}));document.body.append(native);window.nativeDefault=document.createElement("spui-tree");window.nativeDefault.items=[{id:"native-default",label:"Native default"}];document.body.append(window.nativeDefault);`, resolveDir: process.cwd(), sourcefile: "tree-parity.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"],
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")], write: false,
});
const server = createServer((request, response) => new URL(request.url, "http://localhost").pathname === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><main id='root'></main><script src='/bundle.js'></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const tree = page.getByTestId("tree");
  const root = tree.locator('[data-tree-key="root"]');
  const leaf = tree.locator('[data-tree-key="leaf"]');
  assert.equal(await root.getAttribute("aria-expanded"), "true");
  assert.equal(await tree.locator(".spui-tree").getAttribute("data-appearance"), "subtle-alpha");
  assert.equal(await tree.locator(".spui-tree").getAttribute("data-size"), "small");
  assert.equal(await tree.locator(".spui-tree").getAttribute("data-navigation-mode"), "treegrid");
  assert.equal(await leaf.getAttribute("aria-checked"), "mixed");
  const native = page.locator("spui-tree").first();
  const defaultTree = page.getByTestId("default");
  assert.equal(await defaultTree.locator("[aria-selected]").count(), 0, "React Tree defaults to no selection semantics");
  await defaultTree.locator('[data-tree-key="default-leaf"]').click();
  assert.deepEqual(await page.evaluate(() => window.events.default), [], "React Tree does not select by default");
  assert.equal(await page.evaluate(() => window.nativeDefault.shadowRoot.querySelectorAll("[aria-selected]").length), 0, "native Tree defaults to no selection semantics");
  await page.evaluate(() => window.nativeDefault.shadowRoot.querySelector('[data-tree-key="native-default"]').click());
  assert.equal(await page.evaluate(() => window.nativeDefault.shadowRoot.querySelectorAll("[aria-selected]").length), 0, "native Tree does not select by default");
  assert.equal(await native.locator('[data-tree-key="root"]').getAttribute("aria-expanded"), "true");
  assert.equal(await native.locator('[data-tree-key="leaf"]').getAttribute("aria-checked"), "mixed");
  assert.equal(await native.getAttribute("appearance"), "transparent");
  assert.equal(await native.getAttribute("size"), "small");
  await native.locator('[data-tree-key="leaf"]').click();
  await native.locator('[data-tree-key="leaf"]').click();
  assert.deepEqual(await page.evaluate(() => window.nativeSelection), [
    { keys: ["leaf"], entries: [["leaf", true]], checked: true },
    { keys: [], entries: [["leaf", false]], checked: false }
  ], "native multi-selection resolves mixed, checked, and unchecked states");
  assert.equal(await native.locator('[data-tree-key="leaf"]').getAttribute("aria-checked"), "false");
  await root.focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(() => window.events.navigation.some(event => event.value === "leaf"));
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-tree-key") === "leaf");
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Action Leaf" }).waitFor({ state: "visible" });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Action Leaf");
  await page.keyboard.press("ArrowLeft");
  await page.getByTestId("name-leaf").click();
  await page.getByTestId("name-leaf").click();
  await tree.getByRole("button", { name: "Expand or collapse Root" }).click();
  assert.deepEqual(await page.evaluate(() => window.events.checked), [
    { value: "leaf", checked: true, entries: [["leaf", true]], selectionMode: "multiselect", eventType: "change", currentTarget: "input", nativeEventType: "click", sameEvent: true },
    { value: "leaf", checked: false, entries: [["leaf", false]], selectionMode: "multiselect", eventType: "change", currentTarget: "input", nativeEventType: "click", sameEvent: true }
  ], "mixed activation checks the item; unchecking preserves Fluent's explicit false map entry");
  await page.getByTestId("single").locator('[data-tree-key="solo"]').click();
  assert.deepEqual(await page.evaluate(() => window.events.single), [[]], "single selection can be toggled off");
  assert.deepEqual(await page.evaluate(() => window.events.open), [{ value: "root", open: false, type: "ExpandIconClick", openItems: [], sameEvent: true, eventType: "click" }]);
  assert.deepEqual(await page.evaluate(() => window.events.navigation[0]), { value: "leaf", parentValue: "root", type: "ArrowDown", sameEvent: true, eventType: "keydown", currentTarget: "div", nativeEventType: "keydown", isScrollPrevented: true, canPreventScroll: true });
  assert.deepEqual(await page.evaluate(() => window.events.navigation.filter(event => event.type === "Click").map(event => ({ value: event.value, sameEvent: event.sameEvent, eventType: event.eventType, currentTarget: event.currentTarget, nativeEventType: event.nativeEventType }))), [
    { value: "leaf", sameEvent: true, eventType: "click", currentTarget: "div", nativeEventType: "click" },
    { value: "leaf", sameEvent: true, eventType: "click", currentTarget: "div", nativeEventType: "click" }
  ], "clicking a tree item reports Fluent's Click navigation branch with its originating React event");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", openItemsAndCallback: true, checkedItemsMixedStateAndCallback: true, keyboardNavigationCallback: true, appearanceSizeAndNavigationMode: true, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
