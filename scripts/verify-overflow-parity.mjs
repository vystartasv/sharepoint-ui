import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const root = process.cwd();
const bundle = await build({
  stdin: {
    sourcefile: "overflow-parity.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Overflow,OverflowDivider,OverflowItem,OverflowReorderObserver,OverflowProvider,useOverflowItem,useOverflowCount,useOverflowVisibility,useOverflowSnapshot,useIsOverflowItemVisible,useIsOverflowGroupVisible,Button,MenuItem}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.nativeDetails={};document.addEventListener("spui-overflow-change",event=>window.nativeDetails[event.target.dataset.testid]=event.detail);window.changes=[];window.verticalChanges=[];window.externalChanges=[];window.hookChanges=[];window.stateProbes={};const empty=()=>()=>{};let manualSnapshot={itemVisibility:{manual:false},groupVisibility:{manual:"overflow"},invisibleItemCount:1};let manualListener=()=>{};const manualValue={hasOverflow:true,itemVisibility:{manual:false},groupVisibility:{manual:"overflow"},registerItem:empty,registerOverflowMenu:empty,updateOverflow:()=>{},forceUpdateOverflow:()=>{},registerDivider:empty,getSnapshot:()=>manualSnapshot,subscribe(listener){manualListener=listener;return empty()}};function StateProbe({id,name,groupId}){const visible=useIsOverflowItemVisible(id);const group=useIsOverflowGroupVisible(groupId);const count=useOverflowCount();const all=useOverflowVisibility();window.stateProbes[name]={visible,group,count,all};return null}function SnapshotProbe(){const count=useOverflowSnapshot(snapshot=>snapshot.invisibleItemCount);window.stateProbes.snapshot=count;return null}function HookItem({id,priority}){const ref=useOverflowItem(id,priority,"hook");return <button ref={ref} style={{width:"90px",height:"30px"}}>{id}</button>}function App(){return <><Overflow data-testid="overflow" label="File actions" padding={0} style={{width:"230px"}} onOverflowChange={(event,data)=>window.changes.push({event,data})}><OverflowReorderObserver/><StateProbe id="primary-a" name="inside" groupId="primary"/><OverflowItem id="primary-a" groupId="primary" priority={0} style={{width:"90px"}}><Button>First</Button></OverflowItem><OverflowItem id="primary-b" groupId="primary" priority={10} style={{width:"90px"}}><Button>Second</Button></OverflowItem><OverflowItem id="secondary" groupId="secondary" priority={20} style={{width:"90px"}} overflowContent={<MenuItem value="secondary">Secondary</MenuItem>}><Button>Third</Button></OverflowItem></Overflow><OverflowProvider value={manualValue}><StateProbe id="manual" name="manual" groupId="manual"/><SnapshotProbe/></OverflowProvider><Overflow data-testid="hook-overflow" padding={0} style={{width:"230px"}} overflowContent={<MenuItem value="hook-a">Hook action</MenuItem>} onOverflowChange={(event,data)=>window.hookChanges.push({event,data})}><div style={{display:"flex",gap:"6px"}}><HookItem id="hook-a" priority={0}/><HookItem id="hook-b" priority={10}/><HookItem id="hook-c" priority={20}/></div></Overflow><Overflow data-testid="vertical" overflowAxis="vertical" padding={0} style={{width:"230px",height:"230px"}} onOverflowChange={(event,data)=>window.verticalChanges.push({event,data})}><OverflowItem id="vertical-a" groupId="vertical" priority={0} style={{width:"90px",height:"90px"}}><Button>Top</Button></OverflowItem><OverflowItem id="vertical-b" groupId="vertical" priority={10} style={{width:"90px",height:"90px"}}><Button>Middle</Button></OverflowItem><OverflowItem id="vertical-c" priority={20} style={{width:"90px",height:"90px"}}><Button>Bottom</Button></OverflowItem></Overflow><Overflow data-testid="external-hidden" hasHiddenItems overflowContent={<MenuItem value="external">External hidden action</MenuItem>} style={{width:"360px"}} onOverflowChange={(event,data)=>window.externalChanges.push({event,data})}><OverflowItem id="external-visible" style={{width:"90px"}}><Button>Visible</Button></OverflowItem></Overflow><OverflowDivider data-testid="divider-with-child" groupId="custom"><span data-testid="divider-child">Custom divider</span></OverflowDivider></>}createRoot(document.querySelector("#root")).render(<App/>);window.updateSnapshot=()=>{manualSnapshot={...manualSnapshot,invisibleItemCount:2};manualListener()};` },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((_request, response) => response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='root'></main></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.waitForFunction(() => window.changes.length > 0, null, { timeout: 5000 });
  await page.waitForFunction(() => window.nativeDetails.overflow?.hasOverflow === true, null, { timeout: 5000 });
  const initial = await page.evaluate(() => {
    const { event, data } = window.changes.at(-1);
    return { event, data, nativeDetail: window.nativeDetails.overflow, renderedItems: document.querySelector('[data-testid="overflow"]').shadowRoot.querySelector("slot:not([name])").assignedElements().length };
  });
  assert.equal(initial.event, null, "Fluent Overflow callback uses null as its event argument");
  assert.equal(initial.data.hasOverflow, true);
  assert.equal(initial.renderedItems, 3, "reorder observer marker adds no DOM node");
  assert.deepEqual(Object.keys(initial.data.itemVisibility).sort(), ["primary-a", "primary-b", "secondary"]);
  assert.equal(initial.data.itemVisibility["primary-a"], false);
  assert.equal(initial.data.itemVisibility["primary-b"], true);
  assert.equal(initial.data.groupVisibility.primary, "overflow", "mixed item visibility marks its group as overflowing");
  assert.equal(initial.data.groupVisibility.secondary, "visible");
  assert.deepEqual(initial.nativeDetail.overflowIds, ["primary-a"]);
  assert.deepEqual(initial.nativeDetail.visibleIds, ["primary-b", "secondary"]);
  assert.deepEqual(initial.nativeDetail.itemVisibility, initial.data.itemVisibility);
  assert.deepEqual(initial.nativeDetail.groupVisibility, initial.data.groupVisibility);

  await page.waitForFunction(() => window.verticalChanges.length > 0 && window.externalChanges.length > 0, null, { timeout: 5000 });
  await page.waitForFunction(() => window.hookChanges.length > 0 && window.stateProbes.inside?.visible === false && window.stateProbes.manual?.visible === false, null, { timeout: 5000 });
  const additional = await page.evaluate(() => ({ vertical: window.verticalChanges.at(-1), external: window.externalChanges.at(-1), externalTriggerHidden: document.querySelector('[data-testid="external-hidden"]').shadowRoot.querySelector('slot[name="overflow-trigger"]').assignedElements()[0].hidden }));
  assert.equal(additional.vertical.event, null);
  assert.equal(additional.vertical.data.hasOverflow, true, "vertical axis measures block size");
  assert.equal(additional.vertical.data.itemVisibility["vertical-a"], false);
  assert.equal(additional.vertical.data.groupVisibility.vertical, "overflow");
  assert.equal(additional.external.data.hasOverflow, true, "externally hidden items reserve the overflow menu");
  assert.equal(additional.external.data.itemVisibility["external-visible"], true);
  assert.equal(additional.externalTriggerHidden, false);
  const dividerSlot = await page.getByTestId("divider-with-child").evaluate(host => ({ hasChild: host.hasAttribute("has-child"), assigned: host.shadowRoot.querySelector("slot").assignedElements().map(element => element.dataset.testid), background: getComputedStyle(host).backgroundColor }));
  assert.deepEqual(dividerSlot, { hasChild: true, assigned: ["divider-child"], background: "rgba(0, 0, 0, 0)" }, "OverflowDivider renders an optional child without the native line fallback");
  const contextResults = await page.evaluate(() => ({ inside: window.stateProbes.inside, manual: window.stateProbes.manual, hook: window.hookChanges.at(-1) }));
  assert.equal(contextResults.inside.count, 1);
  assert.equal(contextResults.inside.group, "overflow");
  assert.equal(contextResults.inside.all.itemVisibility["primary-a"], false);
  assert.equal(contextResults.manual.count, 1);
  assert.equal(contextResults.manual.group, "overflow");
  assert.equal(contextResults.manual.count, 1);
  assert.equal(await page.evaluate(() => window.stateProbes.snapshot), 1);
  await page.evaluate(() => window.updateSnapshot());
  await page.waitForFunction(() => window.stateProbes.snapshot === 2, null, { timeout: 5000 });
  assert.equal(contextResults.hook.event, null);
  assert.equal(contextResults.hook.data.itemVisibility["hook-a"], false, "useOverflowItem registers nested single-child composition items");
  assert.equal(contextResults.hook.data.groupVisibility.hook, "overflow");

  const host = page.getByTestId("overflow");
  await host.evaluate(element => { element.style.width = "360px"; });
  await page.waitForFunction(() => window.changes.at(-1)?.data.hasOverflow === false, null, { timeout: 5000 });
  const expanded = await page.evaluate(() => window.changes.at(-1).data);
  assert.deepEqual(expanded.itemVisibility, { "primary-a": true, "primary-b": true, secondary: true });
  assert.equal(expanded.groupVisibility.primary, "visible");
  await host.evaluate(element => { element.style.width = "230px"; element.querySelector('[id="primary-a"]').setAttribute("priority", "10"); });
  await page.waitForFunction(() => window.changes.at(-1)?.data.itemVisibility["primary-b"] === false, null, { timeout: 5000 });
  await host.evaluate(element => { const first = element.querySelector('[id="primary-a"]'); const second = element.querySelector('[id="primary-b"]'); second.after(first); });
  await page.waitForFunction(() => window.changes.at(-1)?.data.itemVisibility["primary-a"] === false, null, { timeout: 5000 });
  const reordered = await page.evaluate(() => ({ ids: [...document.querySelector('[data-testid="overflow"]').children].filter(item => item.localName === "spui-overflow-item").map(item => item.id), data: window.changes.at(-1).data }));
  assert.deepEqual(reordered.ids, ["primary-b", "primary-a", "secondary"]);
  assert.equal(reordered.data.itemVisibility["primary-a"], false, "a child-list reorder re-evaluates equal-priority overflow items without an observer marker");
  assert.equal(reordered.data.itemVisibility["primary-b"], true);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", fluentCallbackShape: true, nativeEventState: true, mixedGroupVisibility: true, providerAndVisibilityHooks: true, nestedUseOverflowItemComposition: true, renderlessReorderObserver: true, dynamicChildReordering: true, horizontalAndVerticalAxes: true, externalHiddenItems: true, resizeReflow: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
