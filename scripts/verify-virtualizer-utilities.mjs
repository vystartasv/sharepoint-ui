import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const source = resolve("packages/sharepoint-ui/src/virtualizer-hooks.ts");
const bundle = await build({
  stdin: {
    sourcefile: "virtualizer-utilities.tsx", loader: "tsx", resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{createResizeObserverFromDocument,getRTLRootMargin,scrollToItemDynamic,scrollToItemStatic,useDynamicVirtualizerMeasure,useIntersectionObserver,useMeasureList,useResizeObserverRef_unstable,useStaticVirtualizerMeasure}from"${source}";window.utility={getRTLRootMargin,scrollToItemDynamic,scrollToItemStatic,createResizeObserverFromDocument};window.events=[];function App(){const root=React.useRef(null),target=React.useRef(null);const seen=React.useCallback(entries=>{window.events.push(...entries.map(entry=>entry.isIntersecting))},[]);const io=useIntersectionObserver(seen,{root:null,rootMargin:"1px 2px 3px 4px"});const ro=useResizeObserverRef_unstable(entries=>{window.resizeEntries=(window.resizeEntries||0)+entries.length});const fixed=useStaticVirtualizerMeasure({defaultItemSize:40,bufferItems:2,bufferSize:8});const[contextIndex,setContextIndex]=React.useState(10);const context=React.useMemo(()=>({contextIndex,setContextIndex,childProgressiveSizes:{current:Array.from({length:100},(_,i)=>(i+1)*20)}}),[contextIndex]);const dynamic=useDynamicVirtualizerMeasure({defaultItemSize:20,numItems:100,getItemSize:()=>20,bufferItems:1,bufferSize:10,virtualizerContext:context});const measured=useMeasureList(5,3,10,40);React.useLayoutEffect(()=>{window.io=io;io.setObserverInit({root:root.current,rootMargin:"1px 2px 3px 4px"});io.setObserverList([target.current])},[]);React.useLayoutEffect(()=>{window.measurements={fixed:fixed.virtualizerLength,fixedBuffer:fixed.bufferItems,dynamic:dynamic.virtualizerLength,dynamicBuffer:dynamic.bufferItems,contextIndex:contextIndex,width:measured.widthArray.current[6],height:measured.heightArray.current[6],updates:measured.sizeUpdateCount,updateScrollPosition:dynamic.updateScrollPosition};});return <><div ref={root} dir="ltr" data-testid="root" style={{height:120,overflow:"auto"}}><div ref={target} data-testid="target" style={{height:30}}/><div ref={ro} data-testid="resize" style={{width:10,height:10}}/></div><div ref={fixed.scrollRef} data-testid="fixed-viewport" style={{height:120}}/><div ref={dynamic.scrollRef} data-testid="dynamic-viewport" style={{height:100}}/><div data-testid="measured-row" ref={element=>measured.createIndexedRef(1)(element as any)} style={{width:120,height:24}}/></>}createRoot(document.getElementById("root")).render(<App/>);`,
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
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
  const page = await browser.newPage({ viewport: { width: 600, height: 400 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.io?.observer.current && window.events.includes(true));
  const initialMargin = await page.evaluate(() => window.io.observer.current.rootMargin);
  assert.equal(initialMargin, "1px 2px 3px 4px");
  await page.getByTestId("root").evaluate(element => element.setAttribute("dir", "rtl"));
  await page.waitForFunction(() => window.io.observer.current?.rootMargin === "1px 4px 3px 2px");
  assert.equal(await page.evaluate(() => window.utility.getRTLRootMargin("1px 2px 3px 4px", document.querySelector('[dir="rtl"]'), window)), "1px 4px 3px 2px");
  await page.getByTestId("resize").evaluate(element => { element.style.width = "40px"; });
  await page.waitForFunction(() => window.resizeEntries > 0);
  await page.waitForFunction(() => window.measurements?.fixed === 8 && window.measurements?.dynamic === 8 && window.measurements?.width === 120 && window.measurements?.height === 24);
  await page.getByTestId("measured-row").evaluate(element => { element.style.height = "31px"; });
  await page.waitForFunction(() => window.measurements?.height === 31);
  await page.evaluate(() => window.measurements.updateScrollPosition(240));
  await page.waitForFunction(() => window.measurements?.contextIndex === 12);

  const scroll = await page.evaluate(() => {
    const calls=[];
    const view={scrollTo:options=>calls.push(options)};
    window.utility.scrollToItemStatic({index:3,itemSize:20,totalItems:10,scrollViewRef:{current:view}});
    window.utility.scrollToItemStatic({index:3,itemSize:20,totalItems:10,scrollViewRef:{current:view},axis:"horizontal",reversed:true});
    window.utility.scrollToItemDynamic({index:2,itemSizes:{current:[10,20,30]},totalSize:60,scrollViewRef:{current:view}});
    window.utility.scrollToItemDynamic({index:2,itemSizes:{current:[10,20,30]},totalSize:60,scrollViewRef:{current:view},axis:"horizontal",reversed:true});
    return calls;
  });
  assert.deepEqual(scroll, [{ top: 60, behavior: "auto" }, { left: 120, behavior: "auto" }, { top: 30, behavior: "auto" }, { left: 0, behavior: "auto" }]);
  assert.equal(await page.evaluate(() => Boolean(window.utility.createResizeObserverFromDocument(document, () => {}))), true);
  assert.deepEqual(errors, []);
  const measurements = await page.evaluate(() => ({ fixedLength: window.measurements.fixed, fixedBufferItems: window.measurements.fixedBuffer, dynamicLength: window.measurements.dynamic, dynamicBufferItems: window.measurements.dynamicBuffer, measuredWidth: window.measurements.width, measuredHeight: window.measurements.height, sizeUpdateCount: window.measurements.updates }));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", intersectionObserver: true, rtlMarginRecalculation: true, resizeObserverRef: true, fixedAndDynamicMeasurement: measurements, indexedMeasurementResize: true, imperativeFixedAndMeasuredScroll: scroll, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
