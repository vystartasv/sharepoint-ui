import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: { contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {SharePointUIProvider,Spinner} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import {defineSpinner} from "${resolve("packages/sharepoint-ui/src/elements/spinner.ts")}"; window.mount=()=>{defineSpinner(); const sizes=["extra-tiny","tiny","extra-small","small","medium","large","extra-large","huge"]; for(const size of sizes){const node=document.createElement("spui-spinner");node.id="size-"+size;node.setAttribute("size",size);node.setAttribute("label",size);document.querySelector("#sizes").append(node)} for(const pos of ["before","after","above","below"]){const node=document.createElement("spui-spinner");node.id="position-"+pos;node.setAttribute("label","Working");node.setAttribute("label-position",pos);document.querySelector("#positions").append(node)} const rtl=document.createElement("spui-spinner");rtl.id="rtl-before";rtl.dir="rtl";rtl.setAttribute("label","انتظر");rtl.setAttribute("label-position","before");document.querySelector("#positions").append(rtl);const delayed=document.createElement("spui-spinner");delayed.id="delayed";delayed.setAttribute("label","Delayed work");delayed.setAttribute("delay","80");document.querySelector("#positions").append(delayed);const cancelled=document.createElement("spui-spinner");cancelled.setAttribute("delay","100");cancelled.id="cancelled";document.querySelector("#positions").append(cancelled);cancelled.remove();createRoot(document.querySelector("#react")).render(React.createElement(SharePointUIProvider,{strings:{loading:"جارٍ التحميل"}},React.createElement(Spinner,{"data-testid":"react-spinner",size:"huge",appearance:"inverted",labelPosition:"above"})))}`, resolveDir: process.cwd(), sourcefile: "spinner-parity-test.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const html = `<!doctype html><html><body style="font:14px system-ui;--spui-ui-accent-text:#fff"><div id="sizes"></div><div id="positions"></div><div id="react"></div><script src="/bundle.js"></script></body></html>`;
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end(html));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 860, height: 620 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => window.mount());
  const expected = { "extra-tiny": 16, tiny: 20, "extra-small": 24, small: 28, medium: 32, large: 36, "extra-large": 40, huge: 44 };
  for (const [size, pixels] of Object.entries(expected)) {
    const spinner = page.locator(`#size-${size}`);
    assert.equal(await spinner.getAttribute("role"), "progressbar");
    assert.equal(await spinner.getAttribute("aria-label"), size);
    assert.equal(await spinner.locator(".ring").evaluate(node => Number.parseFloat(getComputedStyle(node).width)), pixels, `${size} size matches Fluent's reference dimensions`);
  }
  for (const position of ["before", "after", "above", "below"]) {
    const spinner = page.locator(`#position-${position}`);
    const layout = await spinner.evaluate(node => ({ direction: getComputedStyle(node).direction, flexDirection: getComputedStyle(node).flexDirection, labelOrder: getComputedStyle(node.shadowRoot.querySelector(".label")).order, ringOrder: getComputedStyle(node.shadowRoot.querySelector(".spinner")).order }));
    assert.equal(layout.flexDirection, position === "above" || position === "below" ? "column" : "row");
    assert.equal(layout.labelOrder, position === "before" || position === "above" ? "0" : "1");
    assert.equal(layout.ringOrder, position === "before" || position === "above" ? "1" : "0");
  }
  assert.equal(await page.locator("#rtl-before").evaluate(node => getComputedStyle(node).direction), "rtl");
  assert.ok(await page.locator("#rtl-before .tail").evaluate(node => getComputedStyle(node).maskImage.includes("255deg")), "RTL mode mirrors the segmented spinner tail");
  const react = page.getByTestId("react-spinner");
  await react.waitFor();
  assert.equal(await react.getAttribute("role"), "progressbar");
  assert.equal(await react.getAttribute("aria-label"), "جارٍ التحميل", "SharePointUIProvider localization reaches React Spinner");
  assert.equal(await react.getAttribute("data-size"), "huge");
  assert.equal(await react.getAttribute("data-appearance"), "inverted");
  assert.equal(await react.locator(".spinner").evaluate(node => getComputedStyle(node).color), "rgb(255, 255, 255)");
  assert.equal(await react.locator(".tail").evaluate(node => getComputedStyle(node).animationName), "spui-spinner-tail", "Fluent-style tail animation is active");
  assert.equal(await react.locator(".tail").evaluate(node => getComputedStyle(node, "::before").animationName), "spui-spinner-tail-start", "segmented tail start is animated independently");
  const delayed = page.locator("#delayed");
  assert.equal(await delayed.getAttribute("data-delay-pending"), "");
  assert.equal(await delayed.evaluate(node => getComputedStyle(node).display), "none");
  await page.waitForFunction(() => !document.querySelector("#delayed").hasAttribute("data-delay-pending"));
  assert.equal(await delayed.evaluate(node => getComputedStyle(node).display), "inline-flex");
  await delayed.evaluate(node => node.setAttribute("delay", "120"));
  assert.equal(await delayed.evaluate(node => getComputedStyle(node).display), "none", "a changed delay restarts visibility timing");
  await page.waitForFunction(() => !document.querySelector("#delayed").hasAttribute("data-delay-pending"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.locator("#size-medium .ring").evaluate(node => getComputedStyle(node).animationName), "none");
  assert.equal(await page.locator("#size-medium .tail").evaluate(node => getComputedStyle(node).animationName), "none", "reduced motion stops the tail animation");
  assert.notEqual(await page.locator("#size-medium .tail").evaluate(node => getComputedStyle(node).backgroundImage), "none", "reduced motion retains a static loading indicator");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const labelColorBeforeForcedColors = await page.locator("#size-medium .label").evaluate(node => getComputedStyle(node).color);
  await page.emulateMedia({ forcedColors: "active" });
  assert.equal(await page.locator("#size-medium .spinner").evaluate(node => getComputedStyle(node).forcedColorAdjust), "none", "spinner keeps its system-color tail visible in forced colors");
  assert.notEqual(await page.locator("#size-medium .label").evaluate(node => getComputedStyle(node).color), labelColorBeforeForcedColors, "spinner label switches to the system text color in forced colors");
  await page.emulateMedia({ forcedColors: "none" });
  assert.equal(await page.locator("#cancelled").count(), 0);
  await page.screenshot({ path: resolve("test-results/spinner-parity.png"), fullPage: true });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", sizeCount: 8, labelPositions: 4, invertedAppearance: true, segmentedTail: true, rtl: true, delayedVisibility: true, delayReset: true, providerLocalization: true, reducedMotion: true, forcedColors: true, pageErrors: errors.length }));
} finally { await browser?.close(); server.close(); }
