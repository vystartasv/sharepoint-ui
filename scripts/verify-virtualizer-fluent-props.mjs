import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { Virtualizer, useVirtualizerContext } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
window.scrollRef=React.createRef();window.dataRef=React.createRef();window.containerSize={current:0};window.scrollPositions=[];window.contextChanges=[];function ContextProbe(){const value=useVirtualizerContext();window.contextSeen=value.contextIndex;return null;}function App(){const[contextIndex,setContextIndex]=React.useState(0);const sizes=React.useRef([]);const virtualizerContext={contextIndex,setContextIndex:index=>{window.contextChanges.push(index);setContextIndex(index);},childProgressiveSizes:sizes};window.virtualizerContext=virtualizerContext;return <Virtualizer data-testid="virtualizer" aria-label="Reversed directory" numItems={100} itemSize={20} virtualizerLength={12} bufferSize={60} gap={5} reversed getItemSize={index=>20+(index%2)*8} containerSizeRef={window.containerSize} updateScrollPosition={offset=>window.scrollPositions.push(offset)} virtualizerContext={virtualizerContext} imperativeRef={window.scrollRef} imperativeVirtualizerRef={window.dataRef} style={{"--spui-list-height":"120px"}} before={{className:"virtual-before"}} after={<span data-testid="virtual-after-slot"/>} beforeContainer={{"data-testid":"virtual-before-container"}} afterContainer={<section data-testid="virtual-after-container"/>}>{index=><><span>{"Cell "+index}</span><ContextProbe/></>}</Virtualizer>}createRoot(document.getElementById("root")).render(<App/>);`,
    resolveDir: process.cwd(), sourcefile: "virtualizer-fluent-props-check.tsx", loader: "tsx",
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
  const list = page.getByTestId("virtualizer").locator("[role=list]");
  assert.equal(await page.getByTestId("virtual-before-container").getAttribute("data-spui-virtualizer-container"), "before");
  assert.equal(await page.getByTestId("virtual-after-container").getAttribute("data-spui-virtualizer-container"), "after");
  assert.equal(await page.getByTestId("virtual-after-slot").getAttribute("data-spui-virtualizer-slot"), "after");
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-testid="virtualizer"]');
    const previous = node?.querySelector('[data-spui-virtual-index="98"]');
    const last = node?.querySelector('[data-spui-virtual-index="99"]');
    return previous && last && window.virtualizerContext.childProgressiveSizes.current.length === 100
      && Math.abs(previous.getBoundingClientRect().top - last.getBoundingClientRect().bottom - 5) < 1;
  });
  const initial = await list.evaluate(node => {
    const rows = [...node.querySelectorAll("[data-spui-virtual-row]")];
    return {
      height: node.clientHeight,
      count: rows.length,
      first: Math.min(...rows.map(row => Number(row.dataset.spuiVirtualIndex))),
      last: Math.max(...rows.map(row => Number(row.dataset.spuiVirtualIndex))),
      topIndex: rows.reduce((top, row) => row.getBoundingClientRect().top < top.top ? { index: Number(row.dataset.spuiVirtualIndex), top: row.getBoundingClientRect().top } : top, { index: -1, top: Infinity }).index,
      gap: Math.round(node.querySelector('[data-spui-virtual-index="98"]').getBoundingClientRect().top - node.querySelector('[data-spui-virtual-index="99"]').getBoundingClientRect().bottom),
      rowSizes: rows.filter(row => Number(row.dataset.spuiVirtualIndex) >= 98).map(row => ({ index: Number(row.dataset.spuiVirtualIndex), height: row.getBoundingClientRect().height })),
    };
  });
  assert.equal(initial.height, 120);
  assert.ok(initial.count <= 12, `pixel buffering should stay bounded; rendered ${initial.count}`);
  assert.ok(initial.first > 85 && initial.last === 99, `reverse mode should start from the far end: ${JSON.stringify(initial)}`);
  assert.equal(initial.topIndex, 99);
  assert.equal(initial.gap, 5);
  const initialState = await page.evaluate(() => ({ containerSize: window.containerSize.current, totalSize: window.virtualizerContext.childProgressiveSizes.current.at(-1), contextChanges: window.contextChanges.length, scrollPositions: [...window.scrollPositions] }));
  assert.equal(initialState.containerSize, 120);
  assert.equal(initialState.totalSize, 2895);
  const dataRef = await page.evaluate(() => ({ keys: Object.keys(window.dataRef.current).sort(), progressiveCount: window.dataRef.current.progressiveSizes.current.length, nodeCount: window.dataRef.current.nodeSizes.current.length, firstSizes: window.dataRef.current.nodeSizes.current.slice(0, 3) }));
  assert.deepEqual(dataRef.keys, ["currentIndex", "nodeSizes", "progressiveSizes", "setFlaggedIndex"]);
  assert.equal(dataRef.progressiveCount, 100);
  assert.equal(dataRef.nodeCount, 100);
  assert.deepEqual(dataRef.firstSizes, [20, 28, 20]);
  assert.equal(await page.evaluate(() => typeof window.scrollRef.current.scrollTo), "function", "legacy scroll ref remains distinct");
  assert.ok(initialState.contextChanges > 0);
  assert.ok(initialState.scrollPositions.length <= 2 && initialState.scrollPositions.every(position => position === initialState.scrollPositions[0]), `initial sizing should settle at one anchor position without repeated correction: ${JSON.stringify(initialState)}`);

  await page.evaluate(() => window.scrollRef.current.scrollTo(0));
  await page.waitForTimeout(100);
  const afterScroll = await page.evaluate(() => {const view=document.querySelector('[data-testid="virtualizer"] [role="list"]');return { positions: window.scrollPositions, refIndex:window.scrollRef.current?.currentIndex?.current, refLength:window.scrollRef.current?.virtualizerLength?.current, contextSeen: window.contextSeen, contextIndex: window.virtualizerContext.contextIndex, rows: [...document.querySelectorAll('[data-testid="virtualizer"] [data-spui-virtual-row]')].map(row => row.dataset.spuiVirtualIndex), scrollTop: view.scrollTop, scrollHeight:view.scrollHeight, contentHeight:view.firstElementChild.getBoundingClientRect().height, rowTransforms:[...view.querySelectorAll('[data-spui-virtual-row]')].slice(0,2).map(row=>row.style.transform) };});
  assert.ok(afterScroll.positions.length > initialState.scrollPositions.length && afterScroll.rows.includes(String(afterScroll.contextIndex)) && afterScroll.refIndex === afterScroll.contextIndex, JSON.stringify({ afterScroll, initial }));
  const end = await list.evaluate(node => {
    const view = node.getBoundingClientRect();
    const visibleRows = [...node.querySelectorAll("[data-spui-virtual-row]")].filter(row => { const rect = row.getBoundingClientRect(); return rect.bottom > view.top && rect.top < view.bottom; }).map(row => row.dataset.spuiVirtualIndex);
    return { scrollTop: node.scrollTop, visibleRows };
  });
  assert.ok(end.scrollTop > 0);
  assert.ok(end.visibleRows.length > 0, `scrollTo must leave visible rows in the viewport: ${JSON.stringify(end)}`);
  const finalState = await page.evaluate(() => ({ scrollPosition: window.scrollPositions.at(-1), contextSeen: window.contextSeen, contextIndex: window.virtualizerContext.contextIndex, contextChanges: window.contextChanges.length }));
  assert.ok(finalState.scrollPosition > 0);
  assert.equal(finalState.contextSeen, finalState.contextIndex);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", browser: "Chromium headless", props: { bufferSize: 60, getItemSize: "variable 20/28px", gap: 5, reversed: true, containerSizeRef: initialState.containerSize, updateScrollPosition: finalState.scrollPosition, virtualizerContext: true }, initial, end, contextChanges: finalState.contextChanges, pageErrors: errors }, null, 2));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
