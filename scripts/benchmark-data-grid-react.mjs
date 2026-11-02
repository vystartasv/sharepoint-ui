import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    sourcefile: "data-grid-react-benchmark.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{flushSync}from"react-dom";import{FluentProvider,webLightTheme,DataGrid as FluentDataGrid,DataGridBody as FluentDataGridBody,DataGridCell as FluentDataGridCell,DataGridHeader as FluentDataGridHeader,DataGridHeaderCell as FluentDataGridHeaderCell,DataGridRow as FluentDataGridRow,createTableColumn}from"@fluentui/react-components";import{DataGrid as SpuiDataGrid}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";function FluentGrid({items,columns}){const fluentColumns=columns.map(column=>createTableColumn({columnId:column.id,renderHeaderCell:()=>column.label,renderCell:item=>item[column.id]}));return <FluentProvider theme={webLightTheme}><FluentDataGrid aria-label="Benchmark grid" items={items} columns={fluentColumns} getRowId={item=>item.id} focusMode="cell" style={{height:400,overflow:"auto"}}><FluentDataGridHeader><FluentDataGridRow>{({renderHeaderCell})=><FluentDataGridHeaderCell>{renderHeaderCell()}</FluentDataGridHeaderCell>}</FluentDataGridRow></FluentDataGridHeader><FluentDataGridBody>{({item,rowId,index})=><FluentDataGridRow key={rowId} item={item} rowId={rowId} rowIndex={index+1}>{({renderCell})=><FluentDataGridCell>{renderCell(item)}</FluentDataGridCell>}</FluentDataGridRow>}</FluentDataGridBody></FluentDataGrid></FluentProvider>}function SpuiGrid({items,columns}){return <SpuiDataGrid aria-label="Benchmark grid" items={items} columns={columns} getRowId={item=>item.id} selectionMode="none" focusMode="cell" rowHeight={36} height={400} overscan={4} virtualize={items.length > 100} virtualizeColumns={columns.length > 16}/>}window.measureGrid=async(kind,count,columnCount)=>{const items=Array.from({length:count},(_,id)=>({id,...Object.fromEntries(Array.from({length:columnCount},(_,column)=>["c"+column,"Row "+id+" column "+column]))}));const columns=Array.from({length:columnCount},(_,column)=>({id:"c"+column,label:"Column "+column,value:item=>item["c"+column]}));const host=document.querySelector("#root");host.replaceChildren();const reactRoot=createRoot(host);const start=performance.now();flushSync(()=>reactRoot.render(kind==="fluent"?<FluentGrid items={items} columns={columns}/>:<SpuiGrid items={items} columns={columns}/>));const grid=host.querySelector('[role="grid"]');grid.getBoundingClientRect();const mountMs=performance.now()-start;const metrics=()=>({rows:grid.querySelectorAll('[role="row"]').length-1,cells:grid.querySelectorAll('[role="gridcell"]').length});const before=metrics();const scrollStart=performance.now();grid.scrollTop=grid.scrollHeight;grid.dispatchEvent(new Event("scroll",{bubbles:true}));await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);const scrollSettleMs=performance.now()-scrollStart;const after=metrics();flushSync(()=>reactRoot.unmount());host.replaceChildren();return{mountMs,scrollSettleMs,before,after}};`,
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
  const measurements = await page.evaluate(async () => {
    const summarize = values => {
      const sorted = [...values].sort((a, b) => a - b);
      return { medianMs: +sorted[Math.floor(sorted.length * 0.5)].toFixed(2), p95Ms: +sorted[Math.ceil(sorted.length * 0.95) - 1].toFixed(2), samples: sorted.length };
    };
    const results = [];
    for (const rows of [100, 1000]) {
      const samples = { spui: [], fluent: [] };
      let structure;
      for (let round = 0; round < 15; round++) {
        for (const kind of ["spui", "fluent"]) {
          const result = await window.measureGrid(kind, rows, 20);
          if (round === 4) structure = { ...structure, [kind]: result };
          if (round >= 5) samples[kind].push(result);
        }
      }
      results.push({ rows, columns: 20, warmupRounds: 5, measuredRounds: 10, mount: { spuiReact: summarize(samples.spui.map(sample => sample.mountMs)), fluentReact: summarize(samples.fluent.map(sample => sample.mountMs)) }, scrollSettle: { spuiReact: summarize(samples.spui.map(sample => sample.scrollSettleMs)), fluentReact: summarize(samples.fluent.map(sample => sample.scrollSettleMs)) }, structure });
    }
    return results;
  });
  assert.deepEqual(errors, []);
  for (const result of measurements) {
    if (result.rows <= 100) {
      assert.equal(result.structure.spui.before.rows, result.rows, "default React grid renders small datasets without row virtualization");
      if (result.columns > 16) assert(result.structure.spui.before.cells < result.rows * result.columns, "default React grid virtualizes columns above its threshold");
      else assert.equal(result.structure.spui.before.cells, result.rows * result.columns, "default React grid renders all cells below the column threshold");
    } else {
      assert(result.structure.spui.before.rows <= 30, "default React grid bounds large dataset rows");
      assert(result.structure.spui.before.cells <= 600, "default React grid bounds large dataset cells");
    }
    assert.equal(result.structure.fluent.before.rows, result.rows, "Fluent React grid renders every supplied row");
    assert.equal(result.structure.fluent.before.cells, result.rows * result.columns, "Fluent React grid renders every supplied cell");
  }
  const report = { status: "passed", browser: `Chromium ${await browser.version()}`, workload: "Same 20-column data rendered by each library's React DataGrid API; SharePoint UI virtualizes rows and columns above threshold, Fluent standard DataGrid renders supplied rows", warmupRounds: 5, measuredRounds: 10, measurements, pageErrors: errors.length, caveat: "Local headless Chromium only. DOM sizes differ because Fluent's standard DataGrid does not virtualize rows. Scroll settles after two animation frames. Not a SharePoint-host or user-perceived latency comparison." };
  const reportPath = resolve(root, "test-results/benchmarks/data-grid-react-latest.json");
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ...report, reportPath }, null, 2));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
