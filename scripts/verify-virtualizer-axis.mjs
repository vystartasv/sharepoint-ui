import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { Virtualizer } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import { defineVirtualList } from "${resolve("packages/sharepoint-ui/src/elements/virtual-list.ts")}";
window.refs={ltr:React.createRef(),rtl:React.createRef(),vertical:React.createRef(),window:React.createRef()};function Sample({id="ltr",dir="ltr",axis="horizontal",measured=false,scrollMode="element"}){return <div dir={dir}><Virtualizer data-testid={id+"-virtualizer"} aria-label="Large collection" axis={axis} scrollMode={scrollMode} numItems={5000} itemSize={axis==="vertical"?40:100} virtualizerLength={8} bufferItems={2} measureItems={measured} style={{"--spui-list-width":"360px","--spui-list-height":"200px"}} imperativeRef={window.refs[id]}>{index=><div style={measured?{width:60+(index%3)*50,whiteSpace:"nowrap"}:{}}>{"Item "+index}</div>}</Virtualizer></div>}
createRoot(document.getElementById("root")).render(<><Sample/><Sample id="rtl" dir="rtl" measured/><Sample id="vertical" axis="vertical"/><Sample id="window" axis="vertical" scrollMode="window"/></>);
window.mountNative=()=>{defineVirtualList();const make=(tag,attrs={})=>{const node=document.createElement(tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);return node;};for(const [id,dir,measured] of [["native-ltr","ltr",false],["native-rtl","rtl",true]]){const wrap=make("div",{dir});const list=make("spui-virtual-list",{"data-testid":id,"aria-label":"Native collection",style:"--spui-list-width:360px"});list.axis="horizontal";list.itemSize=100;if(measured)list.setAttribute("measure-items","");list.items=Array.from({length:5000},(_,index)=>index);list.itemKey=item=>item;list.renderItem=item=>{const row=document.createElement("span");row.textContent="Item "+item;row.style.width=(60+(item%3)*50)+"px";row.style.whiteSpace="nowrap";return row;};wrap.append(list);document.getElementById("root").append(wrap);}};`,
    resolveDir: process.cwd(), sourcefile: "virtualizer-axis-check.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
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
  const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => window.mountNative());
  const list = testId => page.getByTestId(testId).locator("[role=list]");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="ltr-virtualizer"] [data-spui-virtual-row]').length > 0);

  const ltr = list("ltr-virtualizer");
  const initial = await ltr.evaluate(node => ({ width: node.clientWidth, scrollWidth: node.scrollWidth, rowCount: node.querySelectorAll("[data-spui-virtual-row]").length, first: node.querySelector("[data-spui-virtual-row]")?.getAttribute("aria-posinset"), setSize: node.querySelector("[data-spui-virtual-row]")?.getAttribute("aria-setsize") }));
  assert.equal(initial.width, 360);
  assert.ok(initial.rowCount <= 8, `horizontal DOM should stay bounded; rendered ${initial.rowCount}`);
  assert.equal(initial.first, "1");
  assert.equal(initial.setSize, "5000");

  await page.evaluate(() => window.refs.ltr.current.scrollTo(4999));
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="ltr-virtualizer"] [data-spui-virtual-row]')].some(row => row.getAttribute("aria-posinset") === "5000"));
  const ltrEnd = await ltr.evaluate(node => { const row=node.querySelector('[data-spui-virtual-index="4999"]');const rect=row.getBoundingClientRect(),view=node.getBoundingClientRect();return {left:node.scrollLeft,lastRendered:Math.max(...[...node.querySelectorAll("[data-spui-virtual-row]")].map(item=>Number(item.dataset.spuiVirtualIndex))),posInSet:row.getAttribute("aria-posinset"),lastVisible:rect.right>view.left&&rect.left<view.right}; });
  assert.equal(ltrEnd.lastRendered, 4999);
  assert.equal(ltrEnd.posInSet, "5000");
  assert.equal(ltrEnd.lastVisible, true);

  const vertical = list("vertical-virtualizer");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="vertical-virtualizer"] [data-spui-virtual-row]').length > 0);
  const verticalInitial = await vertical.evaluate(node => ({ height: node.clientHeight, scrollHeight: node.scrollHeight, rowCount: node.querySelectorAll("[data-spui-virtual-row]").length }));
  assert.equal(verticalInitial.height, 200);
  assert.ok(verticalInitial.rowCount <= 9, `vertical rendering should stay bounded; rendered ${verticalInitial.rowCount}`);
  await page.evaluate(() => window.refs.vertical.current.scrollTo(4999));
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="vertical-virtualizer"] [data-spui-virtual-row]')].some(row => row.dataset.spuiVirtualIndex === "4999"));
  const verticalEnd = await vertical.evaluate(node => { const row=node.querySelector('[data-spui-virtual-index="4999"]');const rect=row.getBoundingClientRect(),view=node.getBoundingClientRect();return {top:node.scrollTop,lastVisible:rect.bottom>view.top&&rect.top<view.bottom}; });
  assert.ok(verticalEnd.top > 0);
  assert.equal(verticalEnd.lastVisible, true);
  assert.ok(ltrEnd.left > 0);

  const windowList = list("window-virtualizer");
  await page.waitForFunction(() => document.querySelector('[data-testid="window-virtualizer"] [data-spui-virtual-row]'));
  const windowInitial = await windowList.evaluate(node => ({ viewportHeight: node.clientHeight, scrollHeight: node.scrollHeight, rowCount: node.querySelectorAll("[data-spui-virtual-row]").length, first: node.querySelector("[data-spui-virtual-row]")?.dataset.spuiVirtualIndex }));
  assert.ok(windowInitial.rowCount <= 30, `window mode must keep rendered DOM bounded: ${windowInitial.rowCount}`);
  assert.equal(windowInitial.first, "0");
  await page.evaluate(() => window.refs.window.current.scrollTo(4999));
  await page.waitForFunction(() => document.querySelector('[data-testid="window-virtualizer"] [data-spui-virtual-index="4999"]'), { timeout: 10000 });
  const windowEnd = await windowList.evaluate(node => ({ pageY: window.scrollY, rowCount: node.querySelectorAll("[data-spui-virtual-row]").length, visible: (() => { const row=node.querySelector('[data-spui-virtual-index="4999"]'),rect=row.getBoundingClientRect();return rect.bottom>0&&rect.top<window.innerHeight; })() }));
  assert.ok(windowEnd.pageY > 0, "window mode should scroll the document");
  assert.ok(windowEnd.rowCount <= 30, `window mode stays bounded at the end: ${windowEnd.rowCount}`);
  assert.equal(windowEnd.visible, true, "imperative scrollTo should bring the target into the browser viewport");

  const rtl = list("rtl-virtualizer");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="rtl-virtualizer"] [data-spui-virtual-row]').length > 0);
  const rtlStart = await rtl.evaluate(node => ({ direction: getComputedStyle(node).direction, scrollWidth: node.scrollWidth, first: node.querySelector("[data-spui-virtual-row]")?.dataset.spuiVirtualIndex }));
  assert.equal(rtlStart.direction, "rtl");
  await page.evaluate(() => window.refs.rtl.current.scrollTo(4999));
  await page.waitForFunction(() => {
    const viewport = document.querySelector('[data-testid="rtl-virtualizer"]');
    const row = viewport?.querySelector('[data-spui-virtual-index="4999"]');
    if (!row || !viewport) return false;
    const rowRect = row.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const visible = rowRect.right > viewportRect.left && rowRect.left < viewportRect.right;
    const previous = window.__rtlVirtualizerGeometry;
    const current = { left: rowRect.left, right: rowRect.right, scrollLeft: viewport.scrollLeft };
    const stable = visible && previous && Math.abs(previous.left - current.left) < 0.5 && Math.abs(previous.right - current.right) < 0.5 && Math.abs(previous.scrollLeft - current.scrollLeft) < 0.5;
    window.__rtlVirtualizerGeometry = current;
    return Boolean(stable);
  }, null, { timeout: 10000 }).catch(async error => {
    const details = await rtl.evaluate(node => {
      const row = node.querySelector('[data-spui-virtual-index="4999"]');
      if (!row) return { scrollLeft: node.scrollLeft, rowMounted: false };
      const rowRect = row.getBoundingClientRect();
      const viewportRect = node.getBoundingClientRect();
      return { scrollLeft: node.scrollLeft, rowMounted: true, rowRect: { left: rowRect.left, right: rowRect.right }, viewport: { left: viewportRect.left, right: viewportRect.right } };
    });
    throw new Error('RTL virtualizer target did not enter the viewport: ' + JSON.stringify(details) + '; ' + error.message);
  });
  const rtlEnd = await rtl.evaluate(node => { const row=node.querySelector('[data-spui-virtual-index="4999"]');const rect=row.getBoundingClientRect(),view=node.getBoundingClientRect();return {left:node.scrollLeft,lastRendered:Math.max(...[...node.querySelectorAll("[data-spui-virtual-row]")].map(item=>Number(item.dataset.spuiVirtualIndex))),widths:[...node.querySelectorAll("[data-spui-virtual-row]")].slice(0,3).map(item=>Math.round(item.getBoundingClientRect().width)),lastVisible:rect.right>view.left&&rect.left<view.right,rect:{left:rect.left,right:rect.right},viewport:{left:view.left,right:view.right}}; });
  assert.ok(rtlEnd.left < 0, "RTL scroll position uses the logical reverse direction");
  assert.equal(rtlEnd.lastRendered, 4999);
  if (!rtlEnd.lastVisible) console.error("rtl-end-diagnostics", JSON.stringify(rtlEnd));
  assert.equal(rtlEnd.lastVisible, true, "the last RTL item is visibly inside the viewport");
  assert.ok(new Set(rtlEnd.widths).size > 1, `measured horizontal item widths should differ: ${rtlEnd.widths.join(",")}`);

  const nativeInitial = await page.getByTestId("native-ltr").evaluate(node => {const view=node.shadowRoot.querySelector(".viewport");return {width:view.clientWidth,scrollWidth:view.scrollWidth,count:view.querySelectorAll("[role=listitem]").length,orientation:node.axis,itemSize:node.itemSize};});
  assert.equal(nativeInitial.width,360);
  assert.ok(nativeInitial.count<=8,`native horizontal rendering should stay bounded; rendered ${nativeInitial.count}`);
  assert.equal(nativeInitial.orientation,"horizontal");
  assert.equal(nativeInitial.itemSize,100);
  await page.getByTestId("native-ltr").evaluate(node=>node.scrollToIndex(4999));
  await page.waitForFunction(()=>[...document.querySelector('[data-testid="native-ltr"]').shadowRoot.querySelectorAll("[role=listitem]")].some(row=>row.getAttribute("aria-posinset")==="5000"));
  const nativeLTREnd = await page.getByTestId("native-ltr").evaluate(node=>{const view=node.shadowRoot.querySelector(".viewport"),row=view.querySelector('[aria-posinset="5000"]'),rect=row.getBoundingClientRect(),viewport=view.getBoundingClientRect();return {left:view.scrollLeft,visible:rect.right>viewport.left&&rect.left<viewport.right,setSize:row.getAttribute("aria-setsize")};});
  assert.ok(nativeLTREnd.left>0);
  assert.equal(nativeLTREnd.visible,true);
  assert.equal(nativeLTREnd.setSize,"5000");
  await page.getByTestId("native-rtl").evaluate(node=>node.scrollToIndex(4999));
  await page.waitForFunction(()=>[...document.querySelector('[data-testid="native-rtl"]').shadowRoot.querySelectorAll("[role=listitem]")].some(row=>row.getAttribute("aria-posinset")==="5000"));
  const nativeRTLEnd = await page.getByTestId("native-rtl").evaluate(node=>{const view=node.shadowRoot.querySelector(".viewport"),row=view.querySelector('[aria-posinset="5000"]'),rect=row.getBoundingClientRect(),viewport=view.getBoundingClientRect();return {left:view.scrollLeft,visible:rect.right>viewport.left&&rect.left<viewport.right,widths:[...view.querySelectorAll("[role=listitem]")].slice(0,3).map(row=>Math.round(row.getBoundingClientRect().width))};});
  assert.ok(nativeRTLEnd.left<0);
  assert.equal(nativeRTLEnd.visible,true,JSON.stringify(nativeRTLEnd));
  assert.ok(new Set(nativeRTLEnd.widths).size>1);

  const result = { browser: "Chromium headless", ltr: { initial, end: ltrEnd }, vertical: { initial: verticalInitial, end: verticalEnd }, window: { initial: windowInitial, end: windowEnd }, rtl: { start: rtlStart, end: rtlEnd }, native: { initial: nativeInitial, ltrEnd: nativeLTREnd, rtlEnd: nativeRTLEnd }, errors };
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
