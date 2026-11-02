import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const root = process.cwd();
const bundle = await build({
  stdin: {
    sourcefile: "carousel-auto-groups.ts",
    loader: "ts",
    resolveDir: root,
    contents: `import { defineCarousel } from "${resolve(root, "packages/sharepoint-ui/src/elements/carousel.ts")}"; defineCarousel(); window.mount = () => { const carousel = document.createElement("spui-carousel"); carousel.id = "carousel"; carousel.setAttribute("aria-label", "Mixed-width carousel"); carousel.setAttribute("group-size", "auto"); carousel.setAttribute("motion-physics-duration", "0"); window.groupEvents = []; carousel.announcement = (_index, _total, groups) => { window.groupEvents.push(groups); return "Page changed"; }; for (const [index, width] of [200, 500, 150, 400].entries()) { const slide = document.createElement("article"); slide.textContent = "Slide " + (index + 1); slide.style.setProperty("--spui-carousel-slide-width", width + "px"); carousel.append(slide); } document.querySelector("#fixture").append(carousel); };`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
});

const server = createServer((request, response) => {
  if (new URL(request.url, "http://localhost").pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><div id=fixture style='width:700px'></div><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => window.mount());
  const carousel = page.locator("#carousel");
  await page.waitForFunction(() => document.querySelector("#carousel")?.shadowRoot?.querySelectorAll(".indicator").length === 2);

  await carousel.evaluate(node => node.shadowRoot.querySelector(".next").click());
  await page.waitForFunction(() => document.querySelector("#carousel")?.getAttribute("data-selected-index") === "1");
  assert.deepEqual(await page.evaluate(() => window.groupEvents.at(-1)), [[0, 1], [2, 3]], "announcement receives actual mixed-width group membership");

  await carousel.locator("article").nth(1).evaluate(slide => slide.style.setProperty("--spui-carousel-slide-width", "300px"));
  await page.waitForFunction(() => document.querySelector("#carousel")?.getAttribute("data-selected-index") === "0");
  await carousel.evaluate(node => node.shadowRoot.querySelector(".next").click());
  await page.waitForFunction(() => document.querySelector("#carousel")?.getAttribute("data-selected-index") === "1");
  assert.deepEqual(await page.evaluate(() => window.groupEvents.at(-1)), [[0, 1, 2], [3]], "resize recomputes variable-width group membership");
  assert.deepEqual(errors, [], "mixed-width grouping has no browser errors");
  console.log(JSON.stringify({ assertions: "passed", initialGroups: [[0, 1], [2, 3]], resizedGroups: [[0, 1, 2], [3]], pageErrors: errors }, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
