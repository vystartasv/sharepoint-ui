import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve("packages/sharepoint-ui/dist");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch {
  const fallback = "/Users/vilius/.t3/projects/spfx-research/node_modules/playwright";
  if (!existsSync(fallback)) throw new Error("Install Playwright locally or provide the workspace Playwright package.");
  ({ chromium } = require(fallback));
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (!/^\/(elements\/virtual-list|elements\/shared)\.js$/.test(pathname)) {
    response.writeHead(404).end();
    return;
  }
  const file = resolve(root, `.${pathname}`);
  try {
    response.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" });
    response.end(readFileSync(file));
  } catch { response.writeHead(404).end(); }
});

await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
const address = server.address();
const base = `http://127.0.0.1:${address.port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  const result = await page.evaluate(async baseUrl => {
    const { defineVirtualList } = await import(`${baseUrl}/elements/virtual-list.js`);
    defineVirtualList();
    const list = document.createElement("spui-virtual-list");
    list.setAttribute("measure-items", "");
    list.setAttribute("row-height", "40");
    list.style.setProperty("--spui-list-height", "320px");
    const items = Array.from({ length: 5000 }, (_, index) => index);
    list.items = items;
    list.renderItem = (item, index) => {
      const row = document.createElement("div");
      row.textContent = index % 7 === 0 ? `Row ${item} — ${"variable-height detail ".repeat(8)}` : `Row ${item}`;
      row.style.width = "220px";
      row.style.whiteSpace = "normal";
      row.style.overflowWrap = "anywhere";
      return row;
    };
    window.__virtualList = list;
    document.body.append(list);
    for (let frame = 0; frame < 8; frame++) await new Promise(resolve => requestAnimationFrame(resolve));
    const initialRows = list.shadowRoot.querySelectorAll('[role="listitem"]').length;
    const initialHeights = [...list.shadowRoot.querySelectorAll('[role="listitem"]')].map(row => Math.round(row.getBoundingClientRect().height));
    const start = performance.now();
    list.scrollToIndex(items.length - 1);
    const scrollToLastSynchronousMs = performance.now() - start;
    for (let frame = 0; frame < 8; frame++) await new Promise(resolve => requestAnimationFrame(resolve));
    const rows = [...list.shadowRoot.querySelectorAll('[role="listitem"]')];
    return {
      initialRows,
      initialDistinctHeights: [...new Set(initialHeights)].sort((a, b) => a - b),
      mountedAtEnd: rows.length,
      firstPositionAtEnd: rows[0]?.getAttribute("aria-posinset"),
      lastPositionAtEnd: rows.at(-1)?.getAttribute("aria-posinset"),
      scrollToLastSynchronousMs: +scrollToLastSynchronousMs.toFixed(2),
      totalContentHeight: Math.round(list.shadowRoot.querySelector(".content").getBoundingClientRect().height),
      viewportHeight: list.shadowRoot.querySelector(".viewport").clientHeight,
    };
  }, base);
  assert(result.initialRows <= 24, `Expected bounded initial rows; got ${result.initialRows}`);
  assert(result.initialDistinctHeights.length > 1, "Rows were not measured at multiple heights.");
  assert.equal(result.lastPositionAtEnd, "5000");
  assert(result.mountedAtEnd <= 24, `Expected bounded end rows; got ${result.mountedAtEnd}`);
  const screenshot = resolve("test-results/variable-virtual-list-local.png");
  mkdirSync(resolve("test-results"), { recursive: true });
  await page.evaluate(() => window.__virtualList.scrollToIndex(7));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: screenshot });
  console.log(JSON.stringify({ browser: "Chromium headless", items: 5000, variableHeights: true, ...result, screenshot, assertions: "passed", note: "Single local browser run; synchronous index jump excludes layout settling and does not represent SharePoint host timing." }, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
