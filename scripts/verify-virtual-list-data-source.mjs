import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { VirtualList } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import { defineVirtualList } from "${resolve("packages/sharepoint-ui/src/elements/virtual-list.ts")}";
function makeSource(delay=80){const items=Array(5000).fill(undefined),listeners=new Set(),requests=[];return {items,requests,failNext:false,get length(){return items.length},getItem(index){return items[index]},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},notify(){for(const listener of listeners)listener()},loadRange(start,end,signal){const request={start,end,aborted:false,failed:false};requests.push(request);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{signal.removeEventListener("abort",abort);if(signal.aborted)return;if(this.failNext==="reject"){this.failNext=false;request.failed=true;reject(new Error("range load failed"));return;}if(this.failNext==="partial"){this.failNext=false;request.failed=true;resolve();return;}for(let i=start;i<end;i++)items[i]="Loaded item "+i;this.notify();resolve();},delay);const abort=()=>{clearTimeout(timer);request.aborted=true;reject(new DOMException("Aborted","AbortError"));};signal.addEventListener("abort",abort,{once:true});});}};}
window.reactSource=makeSource();window.reactLoadErrors=[];function App(){return <VirtualList data-testid="async-react-list" aria-label="Async records" dataSource={window.reactSource} onDataLoadError={error=>window.reactLoadErrors.push(String(error))} renderItem={(item,index)=><span>{item??("Loading record "+(index+1))}</span>} rowHeight={32} overscan={2} style={{"--spui-list-height":"160px",width:"280px"}}/>;}createRoot(document.getElementById("react-root")).render(<App/>);
window.mountNative=()=>{defineVirtualList();const source=makeSource();window.nativeSource=source;const list=document.createElement("spui-virtual-list");list.setAttribute("data-testid","async-native-list");list.setAttribute("aria-label","Native async records");list.style.setProperty("--spui-list-height","160px");list.itemSize=32;list.dataSource=source;list.renderItem=(item,index)=>{const span=document.createElement("span");span.textContent=item??("Loading record "+(index+1));return span;};window.nativeLoadErrors=[];list.addEventListener("spui-data-load-error",event=>window.nativeLoadErrors.push(String(event.detail.error)));document.getElementById("native-root").append(list);};`,
    resolveDir: process.cwd(), sourcefile: "virtual-list-source-check.tsx", loader: "tsx",
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
  const page = await browser.newPage({ viewport: { width: 640, height: 500 } });
  page.setDefaultTimeout(5000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => window.mountNative());

  const react = page.getByTestId("async-react-list").locator("[role=list]");
  const native = page.getByTestId("async-native-list");
  await page.waitForFunction(() => window.reactSource.requests.length > 0 && window.nativeSource.requests.length > 0);
  assert.equal(await react.getAttribute("aria-label"), "Async records");
  assert.equal(await react.getAttribute("aria-busy"), "true");
  assert.equal(await native.evaluate(node => node.shadowRoot.querySelector(".viewport").getAttribute("aria-busy")), "true");
  await react.evaluate(node => { node.scrollTop = 3200; node.dispatchEvent(new Event("scroll")); });
  await native.evaluate(node => node.scrollToIndex(2000));
  await page.waitForFunction(() => window.reactSource.requests.some(request => request.aborted) && window.nativeSource.requests.some(request => request.aborted));
  await page.waitForFunction(() => window.reactSource.items[100] === "Loaded item 100" && window.nativeSource.items[2000] === "Loaded item 2000");

  const loadedReact = await react.evaluate(node => ({ busy: node.getAttribute("aria-busy"), count: node.querySelectorAll("[role=listitem]").length, text: node.textContent, first: node.querySelector("[role=listitem]")?.getAttribute("aria-posinset"), total: node.querySelector("[role=listitem]")?.getAttribute("aria-setsize") }));
  const loadedNative = await native.evaluate(node => { const view=node.shadowRoot.querySelector(".viewport"),first=view.querySelector("[role=listitem]");return {busy:view.getAttribute("aria-busy"),count:view.querySelectorAll("[role=listitem]").length,text:view.textContent,first:first?.getAttribute("aria-posinset"),total:first?.getAttribute("aria-setsize")}; });
  assert.ok(loadedReact.count <= 20, `React list should stay virtualized, rendered ${loadedReact.count}`);
  assert.ok(loadedNative.count <= 20, `native list should stay virtualized, rendered ${loadedNative.count}`);
  assert.equal(loadedReact.total, "5000"); assert.equal(loadedNative.total, "5000");
  assert.match(loadedReact.text, /Loaded item/); assert.match(loadedNative.text, /Loaded item 2000/);
  assert.equal(loadedReact.busy, null); assert.equal(loadedNative.busy, "false");

  await page.evaluate(() => { window.reactSource.failNext="reject"; window.nativeSource.failNext="reject"; });
  await react.evaluate(node => { node.scrollTop = 120000; node.dispatchEvent(new Event("scroll")); });
  await native.evaluate(node => node.scrollToIndex(4000));
  await page.waitForFunction(() => window.reactLoadErrors.length === 1 && window.nativeLoadErrors.length === 1);
  assert.equal(await react.getAttribute("aria-busy"), null);
  assert.equal(await native.evaluate(node => node.shadowRoot.querySelector(".viewport").getAttribute("aria-busy")), "false");

  await page.evaluate(() => { window.reactSource.notify(); window.nativeSource.notify(); });
  await page.waitForFunction(() => window.reactSource.items[3750] === "Loaded item 3750" && window.nativeSource.items[4000] === "Loaded item 4000");
  await page.evaluate(() => { window.reactSource.failNext="partial"; window.nativeSource.failNext="partial"; });
  await react.evaluate(node => { node.scrollTop = 140000; node.dispatchEvent(new Event("scroll")); });
  await native.evaluate(node => node.scrollToIndex(4500));
  await page.waitForFunction(() => window.reactLoadErrors.length === 2 && window.nativeLoadErrors.length === 2);
  assert.match(await page.evaluate(() => window.reactLoadErrors[1]), /every requested item/);
  assert.match(await page.evaluate(() => window.nativeLoadErrors[1]), /every requested item/);
  await page.evaluate(() => { window.reactSource.notify(); window.nativeSource.notify(); });
  await page.waitForFunction(() => window.reactSource.items[4375] === "Loaded item 4375" && window.nativeSource.items[4500] === "Loaded item 4500");
  assert.deepEqual(pageErrors, []);
  console.log(JSON.stringify({ status: "passed", react: { rangeRequests: await page.evaluate(() => window.reactSource.requests.map(({ start, end, aborted, failed }) => ({ start, end, aborted, failed }))), boundedRenderedRows: loadedReact.count, rejectionAndPartialFailureReported: true, subscriptionRetry: true }, native: { rangeRequests: await page.evaluate(() => window.nativeSource.requests.map(({ start, end, aborted, failed }) => ({ start, end, aborted, failed }))), boundedRenderedRows: loadedNative.count, rejectionAndPartialFailureReported: true, subscriptionRetry: true }, pageErrors }, null, 2));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
