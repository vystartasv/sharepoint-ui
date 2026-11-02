import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "virtualizer-scrollviews.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{VirtualizerScrollView,VirtualizerScrollViewDynamic}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";window.refs={};window.dynamicSizeCalls=0;function App(){const fixed=React.useRef(null),dynamic=React.useRef(null);window.refs.fixed=fixed;window.refs.dynamic=dynamic;return <><VirtualizerScrollView data-testid="fixed" style={{height:"150px"}} numItems={500} itemSize={30} imperativeRef={fixed} enablePagination before={{className:"fixed-before"}} after={{"data-testid":"fixed-after-slot"}} beforeContainer={{"data-testid":"fixed-before-container"}} afterContainer={<section data-testid="fixed-after-container"/>}>{index=><div>Fixed {index}</div>}</VirtualizerScrollView><VirtualizerScrollViewDynamic data-testid="dynamic" style={{height:"180px"}} numItems={100000} itemSize={32} getItemSize={index=>{window.dynamicSizeCalls++;return index%2?48:28}} imperativeRef={dynamic} axis="vertical" before={<strong data-testid="dynamic-before-slot"/>} after={<em data-testid="dynamic-after-slot"/>} beforeContainer={<section data-testid="dynamic-before-container"/>} afterContainer={{className:"dynamic-after-container"}}>{index=><div style={{height:index%2?48:28}}>Dynamic {index}</div>}</VirtualizerScrollViewDynamic></>}createRoot(document.querySelector("#root")).render(<App/>);`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
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

  const fixed = page.getByTestId("fixed").locator('[role="list"]');
  const dynamic = page.getByTestId("dynamic").locator('[role="list"]');
  await page.waitForFunction(() => document.querySelector('[data-testid="fixed"] [role="list"] [data-spui-virtual-row]') && document.querySelector('[data-testid="dynamic"] [role="list"] [data-spui-virtual-row]'));
  const initial = await page.evaluate(() => ({
    fixedRows: document.querySelectorAll('[data-testid="fixed"] [data-spui-virtual-row]').length,
    dynamicRows: document.querySelectorAll('[data-testid="dynamic"] [data-spui-virtual-row]').length,
    fixedSnap: getComputedStyle(document.querySelector('[data-testid="fixed"] [role="list"]')).scrollSnapType,
    fixedFirst: document.querySelector('[data-testid="fixed"] [data-spui-virtual-row]')?.getAttribute("aria-posinset"),
    dynamicSetSize: document.querySelector('[data-testid="dynamic"] [data-spui-virtual-row]')?.getAttribute("aria-setsize"),
    dynamicSizeCalls: window.dynamicSizeCalls,
  }));
  assert.ok(initial.fixedRows < 30, `fixed view should render a bounded window: ${initial.fixedRows}`);
  assert.ok(initial.dynamicRows < 30, `dynamic view should render a bounded window: ${initial.dynamicRows}`);
  assert.ok(initial.dynamicSizeCalls < 100, `dynamic size callback should be called only for rendered rows: ${initial.dynamicSizeCalls}`);
  assert.equal(initial.fixedSnap, "none");
  assert.equal(initial.fixedFirst, "1");
  assert.equal(initial.dynamicSetSize, "100000");
  assert.equal(await page.getByTestId("fixed-before-container").getAttribute("data-spui-virtualizer-container"), "before");
  assert.equal(await page.getByTestId("fixed-after-slot").getAttribute("data-spui-virtualizer-slot"), "after");
  assert.equal(await page.getByTestId("dynamic-before-slot").getAttribute("data-spui-virtualizer-slot"), "before");
  assert.equal(await page.locator(".dynamic-after-container").getAttribute("data-spui-virtualizer-container"), "after");

  await page.evaluate(() => { document.querySelector('[data-testid="fixed"] [role="list"]').scrollTop = 165; });
  await page.waitForTimeout(350);
  const paginatedOffset = await fixed.evaluate(node => node.scrollTop);
  assert.equal(Math.round(paginatedOffset / 30), 6, `scroll pagination should settle on the nearest item; got ${paginatedOffset}`);

  await page.evaluate(() => { window.refs.fixed.current.scrollTo(499); window.refs.dynamic.current.scrollTo(99999); });
  await page.waitForFunction(() => document.querySelector('[data-testid="fixed"] [data-spui-virtual-index="499"]') && document.querySelector('[data-testid="dynamic"] [data-spui-virtual-index="99999"]'), { timeout: 10000 }).catch(() => undefined);
  const end = await page.evaluate(() => ({
    fixedLast: document.querySelector('[data-testid="fixed"] [data-spui-virtual-index="499"]')?.getAttribute("aria-posinset"),
    dynamicLast: document.querySelector('[data-testid="dynamic"] [data-spui-virtual-index="99999"]')?.getAttribute("aria-posinset"),
    fixedScrollTop: document.querySelector('[data-testid="fixed"] [role="list"]').scrollTop,
    dynamicScrollTop: document.querySelector('[data-testid="dynamic"] [role="list"]').scrollTop,
  }));
  assert.equal(end.fixedLast, "500");
  assert.equal(end.dynamicLast, "100000");
  assert.ok(end.fixedScrollTop > 0);
  assert.ok(end.dynamicScrollTop > 0);
  const dynamicSizeCalls = await page.evaluate(() => window.dynamicSizeCalls);
  assert.ok(dynamicSizeCalls < 100, `scrolling to distant rows must keep dynamic sizing work bounded: ${dynamicSizeCalls}`);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", boundedRendering: true, dynamicCallbackCalls: { initial: initial.dynamicSizeCalls, afterDistantScroll: dynamicSizeCalls }, responsiveStaticView: true, dynamicSizes: true, imperativeScroll: true, scrollPagination: true, initial, paginatedOffset, end, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
