import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{CompoundButton}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.enabledClicks=0;window.disabledClicks=0;createRoot(document.querySelector("#root")).render(<><CompoundButton data-testid="before" icon={<b>+</b>} secondaryContent="Create a new record" onClick={()=>window.enabledClicks++}>Add record</CompoundButton><CompoundButton data-testid="after" icon={<b>+</b>} iconPosition="after">Review record</CompoundButton><CompoundButton data-testid="custom-content" secondaryContent="Custom description" contentContainer={<div data-testid="custom-content-root"/>}>Custom title</CompoundButton><CompoundButton data-testid="disabled" disabled>Unavailable</CompoundButton><CompoundButton data-testid="disabled-focusable" disabled disabledFocusable onClick={()=>window.disabledClicks++}>Unavailable but focusable</CompoundButton></>);`,
    resolveDir: root,
    sourcefile: "compound-button-parity.tsx",
    loader: "tsx",
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve(root, "node_modules/react"), "react-dom/client": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve(root, "examples/spfx124-webpart/node_modules")],
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
  const page = await browser.newPage({ viewport: { width: 900, height: 480 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=before]")?.shadowRoot?.querySelector("button"));

  const beforeHost = page.getByTestId("before");
  const before = beforeHost.locator("button");
  const afterHost = page.getByTestId("after");
  const after = afterHost.locator("button");
  const positions = await Promise.all([before, after].map(control => control.evaluate(button => {
    const icon = button.querySelector(".icon").getBoundingClientRect();
    const content = button.querySelector(".content").getBoundingClientRect();
    return { icon: icon.left, content: content.left };
  })));
  assert.ok(positions[0].icon < positions[0].content, "default iconPosition places icon before content");
  assert.ok(positions[1].icon > positions[1].content, "iconPosition=after places icon after content");
  assert.equal(await before.getAttribute("aria-label"), "Add record", "title content provides the accessible name");
  assert.equal(await before.getAttribute("aria-describedby"), "description", "secondary content is described");
  assert.equal(await beforeHost.evaluate(host => host.shadowRoot.querySelector(".description slot").assignedNodes({ flatten: true }).map(node => node.textContent).join("")), "Create a new record", "secondary content is slotted into the description");
  const customHost = page.getByTestId("custom-content");
  const customButton = customHost.locator("button");
  assert.equal(await customHost.locator('[slot="content-container"]').getAttribute("data-testid"), "custom-content-root");
  assert.equal(await customButton.getAttribute("aria-label"), "Custom title", "custom content root preserves the button name");
  assert.equal(await customButton.getAttribute("aria-description"), "Custom description", "custom content root preserves the secondary description");
  assert.equal(await customHost.locator("[data-content-title]").textContent(), "Custom title");
  await customHost.locator("[data-content-title]").evaluate(node => { node.textContent = "Updated title"; });
  await page.waitForFunction(() => document.querySelector('[data-testid="custom-content"]')?.shadowRoot?.querySelector("button")?.getAttribute("aria-label") === "Updated title");

  const disabled = page.getByTestId("disabled").locator("button");
  assert.equal(await disabled.isDisabled(), true, "ordinary disabled is native disabled");
  const focusable = page.getByTestId("disabled-focusable").locator("button");
  assert.equal(await focusable.getAttribute("aria-disabled"), "true");
  assert.equal(await focusable.getAttribute("disabled"), null, "disabledFocusable remains focusable");
  await focusable.focus(); await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.disabledClicks), 0, "disabledFocusable blocks React activation");
  await before.click();
  assert.equal(await page.evaluate(() => window.enabledClicks), 1, "enabled CompoundButton still activates");

  await page.evaluate(() => {
    const button = document.createElement("spui-compound-button"); button.id = "native-compound";
    button.setAttribute("disabled", ""); button.setAttribute("disabled-focusable", ""); button.setAttribute("icon-position", "after");
    window.nativeClicks = 0; button.addEventListener("click", () => window.nativeClicks++);
    button.innerHTML = '<span slot="icon">!</span>Native action<span slot="secondary-content">Native details</span>'; document.body.append(button);
  });
  const nativeHost = page.locator("#native-compound");
  const native = nativeHost.locator("button");
  assert.equal(await native.getAttribute("aria-disabled"), "true", "direct custom element supports disabledFocusable");
  assert.equal(await native.getAttribute("disabled"), null);
  const nativeOrder = await native.evaluate(button => button.querySelector(".icon").getBoundingClientRect().left > button.querySelector(".content").getBoundingClientRect().left);
  assert.equal(nativeOrder, true, "direct custom element supports after icon position");
  await native.evaluate(button => button.click());
  assert.equal(await page.evaluate(() => window.nativeClicks), 0, "direct custom element blocks disabledFocusable activation");
  await page.evaluate(() => {
    const button = document.createElement("spui-compound-button"); button.id = "native-content";
    const content = document.createElement("div"); content.slot = "content-container";
    const title = document.createElement("span"); title.dataset.contentTitle = ""; title.textContent = "Native custom title";
    const description = document.createElement("small"); description.dataset.contentDescription = ""; description.textContent = "Native custom description";
    content.append(title, description); button.append(content); document.body.append(button);
  });
  assert.equal(await page.locator("#native-content button").getAttribute("aria-label"), "Native custom title");
  assert.equal(await page.locator("#native-content button").getAttribute("aria-description"), "Native custom description");
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/compound-button-parity.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", iconPositionBeforeAndAfter: true, titleAndSecondaryContent: true, contentContainerReactAndNative: true, dynamicAccessibleName: true, disabledFocusableReactAndNative: true, enabledActivation: true, noPageErrors: true, screenshot: "test-results/compound-button-parity.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
