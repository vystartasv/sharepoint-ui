import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Breadcrumb,BreadcrumbItem,BreadcrumbButton,BreadcrumbDivider}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<><Breadcrumb data-testid="crumb" label="Current path" focusMode="arrow" size="large" dir="rtl"><BreadcrumbItem><BreadcrumbButton data-testid="first">First</BreadcrumbButton></BreadcrumbItem><BreadcrumbDivider data-testid="divider"/><BreadcrumbItem><BreadcrumbButton data-testid="second" href="/second">Second</BreadcrumbButton></BreadcrumbItem><BreadcrumbItem><BreadcrumbButton data-testid="focusable" disabled disabledFocusable>Disabled but focusable</BreadcrumbButton></BreadcrumbItem><BreadcrumbItem current><BreadcrumbButton data-testid="current" current>Current</BreadcrumbButton></BreadcrumbItem></Breadcrumb><Breadcrumb data-testid="custom-list-breadcrumb" list={<ul data-testid="custom-list"/>}><BreadcrumbItem><BreadcrumbButton>One</BreadcrumbButton></BreadcrumbItem><BreadcrumbItem current>Two</BreadcrumbItem></Breadcrumb></>);`,
    resolveDir: root,
    sourcefile: "breadcrumb-parity.tsx",
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
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=crumb]")?.shadowRoot?.querySelector('slot[name="list"] > ol > slot')?.assignedElements().length === 5);

  const crumb = page.getByTestId("crumb");
  const first = page.getByTestId("first").locator("button");
  const second = page.getByTestId("second").locator("a");
  const focusable = page.getByTestId("focusable").locator("button");
  const current = page.getByTestId("current").locator("button");
  assert.equal(await crumb.evaluate(host => host.shadowRoot.querySelector("nav").getAttribute("aria-label")), "Current path");
  assert.equal(await first.getAttribute("tabindex"), "0");
  assert.equal(await second.getAttribute("tabindex"), "-1");
  assert.equal(await second.getAttribute("href"), "/second", "BreadcrumbButton supports link semantics");
  assert.equal(await current.getAttribute("aria-current"), "page");
  assert.equal(await current.getAttribute("aria-disabled"), "true");
  assert.equal(await focusable.getAttribute("aria-disabled"), "true");
  assert.equal(await focusable.getAttribute("disabled"), null, "disabledFocusable remains natively focusable");
  assert.equal(await first.evaluate(button => getComputedStyle(button).fontSize), "16px", "Breadcrumb size flows to action controls");
  const customList = page.getByTestId("custom-list");
  assert.equal(await customList.getAttribute("role"), "list", "custom list root receives list semantics");
  assert.equal(await customList.locator("spui-breadcrumb-item").count(), 2, "Breadcrumb children are composed into the custom list root");
  assert.equal(await customList.evaluate(node => getComputedStyle(node).display), "flex", "custom list root receives layout styling");

  const divider = page.getByTestId("divider");
  assert.equal(await divider.getAttribute("aria-hidden"), "true");
  assert.equal(await divider.getAttribute("role"), "presentation");
  for (const id of ["first", "second", "focusable"]) {
    assert.equal(await page.getByTestId(id).evaluate(host => getComputedStyle(host.parentElement, "::after").content), "none", "explicit divider suppresses automatic item separators");
  }

  await first.focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await second.evaluate(button => button === button.getRootNode().activeElement), true, "RTL ArrowLeft advances across the divider");
  await page.keyboard.press("ArrowLeft");
  assert.equal(await focusable.evaluate(button => button === button.getRootNode().activeElement), true, "disabledFocusable participates in roving focus");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => location.pathname), "/", "disabledFocusable blocks activation");

  await page.evaluate(() => {
    const root = document.createElement("spui-breadcrumb");
    root.id = "automatic";
    const a = document.createElement("spui-breadcrumb-item"); a.textContent = "A";
    const b = document.createElement("spui-breadcrumb-item"); b.textContent = "B";
    root.append(a, b); document.body.append(root);
  });
  await page.evaluate(() => {
    const root = document.createElement("spui-breadcrumb"); root.id = "native-custom-list";
    const list = document.createElement("ul"); list.slot = "list";
    const item = document.createElement("spui-breadcrumb-item"); item.textContent = "Native item";
    list.append(item); root.append(list); document.body.append(root);
  });
  assert.equal(await page.locator("#native-custom-list [slot=list]").getAttribute("role"), "list", "native slotted list gets list semantics");
  assert.equal(await page.locator("#native-custom-list spui-breadcrumb-item").count(), 1, "native slotted list preserves item handling");
  assert.equal(await page.locator("#automatic spui-breadcrumb-item").first().evaluate(host => getComputedStyle(host, "::after").content), '"›"', "automatic separators remain when no explicit divider is present");
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/breadcrumb-composition.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", buttonAndLinkSlots: true, replaceableListSlot: true, inheritedSize: true, explicitAndAutomaticSeparators: true, rtlRovingFocus: true, disabledFocusable: true, noPageErrors: true, screenshot: "test-results/breadcrumb-composition.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
