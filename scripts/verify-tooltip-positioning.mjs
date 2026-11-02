import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: { contents: `import { defineTooltip } from "${resolve("packages/sharepoint-ui/src/elements/tooltip.ts")}"; defineTooltip();`, resolveDir: process.cwd(), sourcefile: "tooltip-check.ts", loader: "ts" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
});
const html = "<!doctype html><html><body><spui-tooltip id='top-tip' content='Top tooltip' placement='top' delay='0'><button id='top-trigger' style='position:fixed;top:2px;left:180px'>Top</button></spui-tooltip><spui-tooltip id='bottom-tip' content='Bottom tooltip' placement='bottom' delay='0'><button id='bottom-trigger' style='position:fixed;bottom:2px;left:180px'>Bottom</button></spui-tooltip><spui-tooltip id='ltr-start' content='LTR start' placement='start' delay='0'><button id='ltr-trigger' style='position:fixed;top:200px;left:2px'>LTR start</button></spui-tooltip><div dir='rtl'><spui-tooltip id='rtl-start' content='RTL start' placement='start' delay='0'><button id='rtl-trigger' style='position:fixed;top:120px;right:2px'>RTL start</button></spui-tooltip></div><div id='clip' style='position:fixed;left:2px;top:500px;width:100px;height:36px;overflow:hidden;transform:translateZ(0)'><spui-tooltip id='clipped' content='Tooltip escapes transformed clipping container' placement='top' delay='0'><button id='clip-trigger' style='width:80px'>Clip</button></spui-tooltip></div><spui-tooltip id='first' content='First' delay='0'><button id='first-trigger' style='position:fixed;top:260px;left:40px'>First</button></spui-tooltip><spui-tooltip id='second' content='Second' delay='0'><button id='second-trigger' style='position:fixed;top:320px;left:40px'>Second</button></spui-tooltip><spui-tooltip id='touch' content='Touch tip' delay='0'><div id='touch-trigger' style='position:fixed;top:400px;left:40px'>Touch target</div></spui-tooltip><script src='/bundle.js'></script></body></html>";
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end(html));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const tooltipFor = id => page.locator(`#${id} [role=tooltip]`);
  await page.getByText("Top", { exact: true }).hover();
  await tooltipFor("top-tip").waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector("#top-tip [role=tooltip]").style.top !== "");
  const topTarget = await page.locator("#top-trigger").boundingBox();
  const topTip = await tooltipFor("top-tip").boundingBox();
  assert.ok(topTip.y >= topTarget.y + topTarget.height, "top placement flips below when the viewport edge has no room");
  assert.ok(topTip.x >= 8 && topTip.x + topTip.width <= 382, "flipped tooltip stays within horizontal viewport margins");
  const originalLeft = Number.parseFloat(await tooltipFor("top-tip").evaluate(element => element.style.left));
  await page.locator("#top-trigger").evaluate(element => { element.style.width = "100px"; });
  await page.waitForFunction(original => Number.parseFloat(document.querySelector("#top-tip [role=tooltip]").style.left) > original + 10, originalLeft);
  const movedTarget = await page.locator("#top-trigger").boundingBox();
  const movedTip = await tooltipFor("top-tip").boundingBox();
  assert.ok(Math.abs(movedTip.x + movedTip.width / 2 - (movedTarget.x + movedTarget.width / 2)) <= 1, "ResizeObserver recenters after the trigger resizes");

  await page.locator("#bottom-trigger").hover();
  await tooltipFor("bottom-tip").waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector("#bottom-tip [role=tooltip]").style.top !== "");
  const bottomTarget = await page.locator("#bottom-trigger").boundingBox();
  const bottomTip = await tooltipFor("bottom-tip").boundingBox();
  assert.ok(bottomTip.y + bottomTip.height <= bottomTarget.y - 7, "bottom placement flips above near the lower viewport edge");

  await page.locator("#ltr-trigger").hover();
  await tooltipFor("ltr-start").waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector("#ltr-start [role=tooltip]").style.left !== "");
  const ltrTarget = await page.locator("#ltr-trigger").boundingBox();
  const ltrTip = await tooltipFor("ltr-start").boundingBox();
  assert.ok(ltrTip.x >= ltrTarget.x + ltrTarget.width, "LTR start placement flips right when the left edge has no room");

  await page.locator("#rtl-trigger").hover();
  await tooltipFor("rtl-start").waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector("#rtl-start [role=tooltip]").style.left !== "");
  const rtlTarget = await page.locator("#rtl-trigger").boundingBox();
  const rtlTip = await tooltipFor("rtl-start").boundingBox();
  assert.ok(rtlTip.x + rtlTip.width <= rtlTarget.x - 7, "RTL logical start flips to the left when the right edge is constrained");

  await page.locator("#clip-trigger").hover();
  const clippedTooltip = tooltipFor("clipped");
  await clippedTooltip.waitFor({ state: "visible" });
  assert.ok(await clippedTooltip.evaluate(element => element.matches(":popover-open")), "tooltip enters the browser top layer");
  const clippingBounds = await page.locator("#clip").boundingBox();
  const clippedBounds = await clippedTooltip.boundingBox();
  assert.ok(clippedBounds.y < clippingBounds.y, "top-layer tooltip remains visible outside its transformed overflow clip");

  await page.locator("#first-trigger").hover();
  await tooltipFor("first").waitFor({ state: "visible" });
  await page.locator("#second-trigger").hover();
  await tooltipFor("second").waitFor({ state: "visible" });
  assert.equal(await tooltipFor("first").isVisible(), false, "only one tooltip remains visible at a time");
  await page.keyboard.press("Escape");
  await tooltipFor("second").waitFor({ state: "hidden" });
  await page.mouse.move(380, 800);
  await page.locator("#second-trigger").hover();
  await tooltipFor("second").waitFor({ state: "visible" });
  await page.locator("#second").evaluate(element => { Object.defineProperty(element.ownerDocument, "visibilityState", { configurable: true, value: "hidden" }); element.ownerDocument.dispatchEvent(new Event("visibilitychange")); });
  await tooltipFor("second").waitFor({ state: "hidden" });
  assert.deepEqual(errors, []);

  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touchPage = await touchContext.newPage();
  await touchPage.goto(`http://127.0.0.1:${server.address().port}`);
  await touchPage.locator("#touch-trigger").tap();
  await touchPage.waitForTimeout(80);
  assert.equal(await touchPage.locator("#touch [role=tooltip]").isVisible(), false, "touch pointer entry does not open hover-only content");
  await touchContext.close();

  console.log(JSON.stringify({ status: "passed", viewport: "390x844", topAndBottomCollision: true, ltrAndRtlLogicalSideCollision: true, transformedContainerClippingEscaped: true, topLayer: true, resizeRepositioning: true, oneVisibleTooltip: true, escapeDismissal: true, hiddenDocumentDismissal: true, touchDoesNotTriggerHover: true, pageErrors: errors.length }));
} finally { await browser?.close(); server.close(); }
