import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    sourcefile: "data-grid-fluent-benchmark.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{flushSync}from"react-dom";import{FluentProvider,webLightTheme,DataGrid as FluentDataGrid,DataGridBody as FluentDataGridBody,DataGridCell as FluentDataGridCell,DataGridHeader as FluentDataGridHeader,DataGridHeaderCell as FluentDataGridHeaderCell,DataGridRow as FluentDataGridRow,createTableColumn as fluentCreateTableColumn}from"@fluentui/react-components";import{defineDataGrid}from"${resolve(root, "packages/sharepoint-ui/src/elements/data-grid.ts")}";defineDataGrid();function FluentGrid({items,columns}){return <FluentProvider theme={webLightTheme}><FluentDataGrid aria-label="Benchmark grid" items={items} columns={columns} getRowId={item=>item.id} focusMode="cell" style={{height:400,overflow:"auto"}}><FluentDataGridHeader><FluentDataGridRow>{({renderHeaderCell})=><FluentDataGridHeaderCell>{renderHeaderCell()}</FluentDataGridHeaderCell>}</FluentDataGridRow></FluentDataGridHeader><FluentDataGridBody>{({item,rowId,index})=><FluentDataGridRow key={rowId} item={item} rowId={rowId} rowIndex={index+1}>{({renderCell})=><FluentDataGridCell>{renderCell(item)}</FluentDataGridCell>}</FluentDataGridRow>}</FluentDataGridBody></FluentDataGrid></FluentProvider>}window.measureGrid=async(kind,count,columnCount)=>{const items=Array.from({length:count},(_,id)=>Object.fromEntries([["id",id],...Array.from({length:columnCount},(_,column)=>["c"+column,"Row "+id+" column "+column])]));const columns=Array.from({length:columnCount},(_,index)=>({id:"c"+index,label:"Column "+index,value:item=>item["c"+index]}));const root=document.querySelector("#root");root.replaceChildren();const fluentColumns=columns.map(column=>fluentCreateTableColumn({columnId:column.id,renderHeaderCell:()=>column.label,renderCell:item=>item[column.id]}));let reactRoot;if(kind==="fluent"){reactRoot=createRoot(root)}const start=performance.now();if(kind==="fluent"){flushSync(()=>reactRoot.render(<FluentGrid items={items} columns={fluentColumns}/>))}else{const grid=document.createElement("spui-data-grid");grid.setAttribute("aria-label","Benchmark grid");grid.setAttribute("row-height","36");grid.setAttribute("virtualize-columns","");grid.style.setProperty("--spui-data-grid-height","400px");grid.columns=columns.map(column=>({id:column.id,label:column.label,value:item=>item[column.id]}));grid.items=items;root.append(grid)}const host=kind==="fluent"?root.querySelector('[role="grid"]'):root.querySelector("spui-data-grid");host.getBoundingClientRect();const mountMs=performance.now()-start;const getMetrics=()=>{const grid=kind==="fluent"?host:host.shadowRoot.querySelector(".viewport");const rows=kind==="fluent"?grid.querySelectorAll('[role="row"]').length-1:host.shadowRoot.querySelectorAll(".data-row").length;const cells=kind==="fluent"?grid.querySelectorAll('[role="gridcell"]').length:host.shadowRoot.querySelectorAll(".data-row [data-col-index]").length;return{rows,cells}};const before=getMetrics();const grid=kind==="fluent"?host:host.shadowRoot.querySelector(".viewport");const scrollStart=performance.now();grid.scrollTop=grid.scrollHeight;grid.dispatchEvent(new Event("scroll"));await new Promise(requestAnimationFrame);const scrollFrameMs=performance.now()-scrollStart;const after=getMetrics();if(kind==="fluent"){flushSync(()=>reactRoot.unmount())}root.replaceChildren();return{mountMs,scrollFrameMs,before,after}};`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: {
    react: resolve(root, "examples/spfx124-webpart/node_modules/react"),
    "react-dom/client": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/client.js"),
    "react-dom": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/index.js"),
  },
  nodePaths: [resolve(root, "examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await (await import("playwright")).chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const results = await page.evaluate(async () => {
    const summary = values => {
      const sorted = [...values].sort((a, b) => a - b);
      return { medianMs: +sorted[Math.floor(sorted.length * 0.5)].toFixed(2), p95Ms: +sorted[Math.ceil(sorted.length * 0.95) - 1].toFixed(2), samples: sorted.length };
    };
    const output = [];
    for (const count of [100, 1000]) {
      const samples = { spui: [], fluent: [] };
      let structure;
      for (let round = 0; round < 15; round++) {
        for (const kind of ["spui", "fluent"]) {
          const result = await window.measureGrid(kind, count, 20);
          if (round === 4) structure = { ...structure, [kind]: result };
          if (round >= 5) samples[kind].push(result);
        }
      }
      output.push({ rows: count, columns: 20, warmupRounds: 5, measuredRounds: 10, mount: { spui: summary(samples.spui.map(row => row.mountMs)), fluent: summary(samples.fluent.map(row => row.mountMs)) }, scrollFrame: { spui: summary(samples.spui.map(row => row.scrollFrameMs)), fluent: summary(samples.fluent.map(row => row.scrollFrameMs)) }, structure });
    }
    return output;
  });
  assert.deepEqual(errors, []);
  for (const measurement of results) {
    assert(measurement.structure.spui.before.rows <= 30, "SharePoint UI row rendering remains viewport-bounded");
    assert(measurement.structure.spui.before.cells <= 600, "SharePoint UI cell rendering remains viewport-bounded");
    assert.equal(measurement.structure.fluent.before.rows, measurement.rows, "Fluent baseline renders every supplied row");
    assert.equal(measurement.structure.fluent.before.cells, measurement.rows * measurement.columns, "Fluent baseline renders every supplied cell");
  }
  const report = { status: "passed", browser: `Chromium ${await browser.version()}`, workload: "Same data and 20-column schema; SharePoint UI row/column virtualization vs Fluent DataGrid's standard composed rendering", rows: [100, 1000], warmupRounds: 5, measuredRounds: 10, measurements: results, pageErrors: errors.length, caveat: "Local headless Chromium only. Fluent's standard DataGrid does not include row virtualization; this compares ordinary Fluent composition with this library's virtualized grid capability, not equal DOM output. Scroll measurement includes one animation frame and is not SharePoint-host latency." };
  const reportPath = resolve(root, "test-results/benchmarks/data-grid-fluent-latest.json");
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ...report, reportPath }, null, 2));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
