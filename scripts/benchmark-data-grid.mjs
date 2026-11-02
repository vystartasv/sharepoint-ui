import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const root = resolve(process.cwd());
const cpuProfile = process.argv.includes("--cpu-profile");
const bundle = await build({
  stdin: {
    sourcefile: "data-grid-benchmark.ts",
    loader: "ts",
    resolveDir: root,
    contents: `import{defineDataGrid}from"${resolve(root, "packages/sharepoint-ui/src/elements/data-grid.ts")}";defineDataGrid();`,
  },
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  write: false,
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=root></div><script type=module src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => customElements.get("spui-data-grid"));

  const results = await page.evaluate(async () => {
    const items = Array.from({ length: 5000 }, (_, id) => ({ id, title: `Document ${id}`, owner: `Person ${id % 73}`, status: ["Active", "Review", "Complete"][id % 3], modified: `2026-10-${String(id % 28 + 1).padStart(2, "0")}` }));
    const columnsByCount = new Map([20, 100].map(count => [count, Array.from({ length: count }, (_, index) => ({ id: `column-${index}`, label: `Column ${index}`, value: item => index % 4 === 0 ? item.title : index % 4 === 1 ? item.owner : index % 4 === 2 ? item.status : item.modified }))]));
      window.mountDataGrid = async (columnCount, repaintCount = 1) => {
      const grid = document.createElement("spui-data-grid");
      grid.setAttribute("aria-label", `Documents with ${columnCount} columns`);
      grid.setAttribute("row-height", "36");
      grid.setAttribute("selection-mode", "multiple");
      grid.setAttribute("virtualize-columns", "true");
      grid.style.setProperty("--spui-data-grid-height", "400px");
      grid.columns = columnsByCount.get(columnCount);
      grid.items = items;
      const start = performance.now();
      document.querySelector("#root").append(grid);
      grid.getBoundingClientRect();
      const mountLayoutMs = performance.now() - start;
      for (let frame = 0; frame < 3; frame++) await new Promise(requestAnimationFrame);
      const viewport = grid.shadowRoot.querySelector(".viewport");
      const initialRows = grid.shadowRoot.querySelectorAll(".data-row").length;
      const initialCells = grid.shadowRoot.querySelectorAll(".data-row [data-col-index]").length;
      const scrollStart = performance.now();
      viewport.scrollTop = viewport.scrollHeight;
      viewport.dispatchEvent(new Event("scroll"));
      await new Promise(requestAnimationFrame);
      const scrollPaintMs = performance.now() - scrollStart;
      const endRows = grid.shadowRoot.querySelectorAll(".data-row").length;
      const endCells = grid.shadowRoot.querySelectorAll(".data-row [data-col-index]").length;
      const firstEndRow = grid.shadowRoot.querySelector(".data-row")?.getAttribute("aria-rowindex");
      const totalRows = Number(viewport.getAttribute("aria-rowcount"));
      const repaintStart = performance.now();
      for (let index = 0; index < repaintCount; index++) grid.paint();
      const visibleRepaintMs = (performance.now() - repaintStart) / repaintCount;
      grid.remove();
      return { mountLayoutMs, scrollPaintMs, visibleRepaintMs, initialRows, initialCells, endRows, endCells, firstEndRow, totalRows };
    };
    const summarize = values => {
      const sorted = [...values].sort((a, b) => a - b);
      return { medianMs: +sorted[Math.floor(sorted.length * .5)].toFixed(2), p95Ms: +sorted[Math.ceil(sorted.length * .95) - 1].toFixed(2), samples: sorted.length };
    };
    const measurements = [];
    for (const columnCount of [20, 100]) {
      const samples = [];
      let structure;
      for (let round = 0; round < 25; round++) {
        const result = await window.mountDataGrid(columnCount);
        if (round === 5) structure = result;
        if (round >= 5) samples.push(result);
      }
      measurements.push({ columnCount, mountLayout: summarize(samples.map(item => item.mountLayoutMs)), scrollPaint: summarize(samples.map(item => item.scrollPaintMs)), visibleRepaint: summarize(samples.map(item => item.visibleRepaintMs)), structure });
    }
    return measurements;
  });
  let cpuProfileSummary;
  if (cpuProfile) {
    const session = await page.context().newCDPSession(page);
    await session.send("Profiler.enable");
    await session.send("Profiler.start");
    await page.evaluate(() => window.mountDataGrid(100, 30));
    const { profile } = await session.send("Profiler.stop");
    const samples = new Map();
    for (const node of profile.nodes) {
      const frame = node.callFrame;
      const key = `${frame.functionName || "(anonymous)"} (${frame.url.split("/").pop()}:${frame.lineNumber + 1})`;
      samples.set(key, (samples.get(key) ?? 0) + (node.hitCount ?? 0));
    }
    cpuProfileSummary = Object.fromEntries([...samples].sort((a, b) => b[1] - a[1]).slice(0, 15));
    await session.detach();
  }
  assert.deepEqual(errors, [], "benchmark completed without page errors");
  for (const measurement of results) {
    assert(measurement.structure.initialRows <= 30 && measurement.structure.endRows <= 30, "row rendering remains viewport-bounded");
    assert.equal(measurement.structure.totalRows, 5001, "ARIA row count includes header");
    assert(Number(measurement.structure.firstEndRow) > 4900, "end scroll renders end-of-data rows");
    assert(measurement.structure.initialCells <= 300 && measurement.structure.endCells <= 300, "column virtualization bounds cell DOM");
  }
  console.log(JSON.stringify({ status: "passed", browser: `Chromium ${await browser.version()}`, items: 5000, rowHeightPx: 36, viewportHeightPx: 400, warmupRounds: 5, measuredRounds: 20, ...(cpuProfileSummary ? { cpuProfile: cpuProfileSummary } : {}), measurements: results, pageErrors: errors.length, caveat: "Local headless Chromium only. Mount includes connected render and forced layout; scrollPaint includes one animation frame and the scheduled visible-row paint; visibleRepaint directly measures synchronous reconciliation of the mounted viewport rows. Not a SharePoint-host or user-perceived latency comparison." }, null, 2));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
