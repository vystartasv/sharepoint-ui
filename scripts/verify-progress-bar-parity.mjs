import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "progress-bar-parity.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Field,ProgressBar,SharePointUIProvider}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineProgressBar}from"${resolve("packages/sharepoint-ui/src/elements/progress-bar.ts")}";createRoot(document.querySelector("#react")).render(<SharePointUIProvider fluentTokens={{colorBrandBackground:"rgb(12, 100, 200)"}}><span id="progress-name">Report upload</span><span id="progress-help">Two files remaining</span><ProgressBar data-testid="default" value={0.5}/><ProgressBar data-testid="success" value={0.25} color="success" shape="square" thickness="large" max={2}/><ProgressBar data-testid="warning" color="warning"/><ProgressBar data-testid="error" value={3} max={2} color="error"/><ProgressBar data-testid="named" value={0.4} label="Fallback" aria-label="Tenant upload"/><ProgressBar data-testid="labelled" value={0.4} label="Fallback" aria-labelledby="progress-name" aria-describedby="progress-help" aria-valuetext="Half complete"/><ProgressBar data-testid="custom-bar-host" value={0.4} bar={<span data-testid="custom-bar" style={{backgroundColor:"purple"}}>Custom</span>}/><Field label="Failed upload" hint="Retry after checking access." validationMessage="Upload failed." validationState="error"><ProgressBar data-testid="field-error" value={0.5}/></Field><Field label="Pending review" validationMessage="Review in progress." validationState="warning"><ProgressBar data-testid="field-warning" value={0.5}/></Field><Field label="Completed upload" validationMessage="Upload verified." validationState="success"><ProgressBar data-testid="field-success" value={1}/></Field><Field label="Override upload" hint="This upload overrides the field color." validationState="error"><ProgressBar data-testid="field-explicit" value={0.5} color="warning"/></Field></SharePointUIProvider>);window.mountNative=()=>{defineProgressBar();const p=document.createElement("spui-progress-bar");p.id="native";p.setAttribute("value","0.4");p.setAttribute("max","2");p.setAttribute("color","warning");p.setAttribute("shape","square");p.setAttribute("thickness","large");p.setAttribute("label","Native work");p.setAttribute("aria-label","Native upload");const bar=document.createElement("span");bar.slot="bar";bar.id="native-custom-bar";p.append(bar);document.querySelector("#native-root").append(p)};window.mountNative();`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => {
  if (new URL(request.url, "http://localhost").pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=react></div><div id=native-root></div><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const get = name => page.locator(`[data-testid="${name}"]`);
  assert.equal(await get("default").getAttribute("aria-valuemax"), "1", "Fluent max defaults to 1");
  assert.equal(await get("default").getAttribute("aria-valuenow"), "0.5");
  assert.equal(await get("default").getAttribute("aria-label"), "Loading");
  assert.equal(await page.locator('[data-testid="success"]').getAttribute("shape"), "square");
  assert.equal(await page.locator('[data-testid="success"]').getAttribute("thickness"), "large");
  assert.equal(await get("success").evaluate(node => getComputedStyle(node.shadowRoot.querySelector(".track")).height), "4px");
  const statusFills = {};
  for (const name of ["success", "warning", "error"]) statusFills[name] = await get(name).evaluate(node => getComputedStyle(node.shadowRoot.querySelector(".indicator")).backgroundColor);
  assert.equal(new Set(Object.values(statusFills)).size, 3, "status colors remain distinct after adapting to inherited foreground");
  assert.equal(await get("success").evaluate(node => getComputedStyle(node.shadowRoot.querySelector(".track")).borderRadius), "0px");
  assert.ok(statusFills.warning && statusFills.error, "warning and error fills resolve from their semantic tokens");
  assert.equal(await get("warning").getAttribute("aria-valuenow"), null, "missing value is indeterminate");
  assert.equal(await page.locator('[data-testid="warning"]').getAttribute("data-indeterminate"), "", "indeterminate state is exposed for reduced motion");
  assert.equal(await get("warning").evaluate(node => getComputedStyle(node.shadowRoot.querySelector(".indicator")).animationName), "spui-progress-indeterminate");
  assert.equal(await get("error").getAttribute("aria-valuenow"), "2", "value is clamped at max");
  assert.notEqual(await get("default").evaluate(node => getComputedStyle(node.shadowRoot.querySelector(".indicator")).backgroundColor), "rgb(12, 100, 200)", "brand fill derives contrast from the inherited foreground");
  assert.equal(await get("named").getAttribute("aria-label"), "Tenant upload", "host aria-label overrides the custom label fallback");
  assert.equal(await get("labelled").getAttribute("aria-label"), null, "aria-labelledby prevents a competing generated label");
  assert.equal(await get("labelled").getAttribute("aria-labelledby"), "progress-name");
  assert.equal(await get("labelled").getAttribute("aria-describedby"), "progress-help");
  assert.equal(await get("labelled").getAttribute("aria-valuetext"), "Half complete");
  assert.equal(await get("labelled").getAttribute("role"), "progressbar");
  assert.equal(await get("labelled").evaluate(node => node.shadowRoot.querySelector('[role="progressbar"]')), null, "the host owns progressbar semantics");
  assert.equal(await get("labelled").evaluate(node => node.shadowRoot.querySelector(".track").getAttribute("aria-hidden")), "true");
  assert.equal(await page.locator('[data-testid="custom-bar"]').getAttribute("slot"), "bar", "React bar prop composes into the native bar slot");
  assert.equal(await page.locator('[data-testid="custom-bar"]').evaluate(node => node.style.getPropertyValue("--spui-progress-value")), "40%");
  assert.equal(await page.locator('[data-testid="custom-bar"]').evaluate(node => getComputedStyle(node).backgroundColor), "rgb(128, 0, 128)", "custom bar styles remain usable");
  const fieldStatusColors = {};
  for (const [name, color] of [["field-error", "error"], ["field-warning", "warning"], ["field-success", "success"], ["field-explicit", "warning"]]) {
    const progressBar = get(name);
    assert.equal(await progressBar.getAttribute("color"), color, `${name} resolves the Field validation color`);
    fieldStatusColors[name] = await progressBar.evaluate(node => getComputedStyle(node.shadowRoot.querySelector(".indicator")).backgroundColor);
    assert.ok(await progressBar.getAttribute("aria-labelledby"), `${name} references its Field label`);
    const descriptionIds = (await progressBar.getAttribute("aria-describedby")).split(/\s+/);
    assert.ok(descriptionIds.length > 0, `${name} references its Field message/hint descriptions`);
    for (const id of descriptionIds) assert.equal(await page.locator(`[id="${id}"]`).count(), 1, `${name} description ID ${id} resolves`);
  }
  assert.equal(new Set([fieldStatusColors["field-error"], fieldStatusColors["field-warning"], fieldStatusColors["field-success"]]).size, 3, "derived status colors remain visually distinct");
  assert.equal(fieldStatusColors["field-explicit"], fieldStatusColors["field-warning"], "explicit status color overrides the Field state");
  const native = page.locator("#native");
  assert.equal(await native.getAttribute("role"), "progressbar");
  assert.equal(await native.getAttribute("aria-valuemax"), "2");
  assert.equal(await native.getAttribute("aria-valuenow"), "0.4");
  assert.equal(await native.getAttribute("aria-label"), "Native upload");
  await native.evaluate(node => node.removeAttribute("aria-label"));
  assert.equal(await native.getAttribute("aria-label"), "Native work", "custom label is the native custom-element fallback");
  await native.evaluate(node => node.setAttribute("aria-labelledby", "native-label"));
  assert.equal(await native.getAttribute("aria-label"), null, "labelledby removes the generated fallback");
  await native.evaluate(node => { node.removeAttribute("value"); node.setAttribute("dir", "rtl"); });
  assert.equal(await native.getAttribute("aria-valuenow"), null, "attribute changes update the accessible indeterminate state");
  assert.equal(await page.locator("#native-custom-bar").evaluate(node => getComputedStyle(node).animationName), "spui-progress-indeterminate-rtl");
  assert.equal(await page.locator("#native-custom-bar").evaluate(node => getComputedStyle(node).animationDuration), "3s", "indeterminate sweep matches Fluent duration");
  assert.equal(await page.locator("#native-custom-bar").evaluate(node => getComputedStyle(node).animationTimingFunction), "linear");
  await native.evaluate(node => { node.setAttribute("value", "0.01"); });
  assert.equal(await native.getAttribute("data-determinate-transition"), null, "values at the 1% threshold do not transition");
  await native.evaluate(node => { node.setAttribute("value", "0.03"); });
  assert.equal(await native.getAttribute("data-determinate-transition"), "", "values above the 1% threshold transition");
  assert.equal(await page.locator("#native-custom-bar").evaluate(node => node.style.getPropertyValue("--spui-progress-value")), "1.5%");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await native.evaluate(node => node.removeAttribute("value"));
  assert.equal(await page.locator("#native-custom-bar").evaluate(node => getComputedStyle(node).animationName), "spui-progress-pulse", "reduced motion replaces the sweep with a low-motion opacity pulse");
  assert.equal(await page.locator("#native-custom-bar").evaluate(node => getComputedStyle(node).animationDuration), "3s");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", defaultMax: 1, colors: ["brand", "success", "warning", "error"], fieldValidationColorAndAriaContext: true, squareAndLarge: true, indeterminateAndClampedValues: true, reactAndNativeBarSlot: true, fluentMotionAndOnePercentThreshold: true, nativeElement: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
