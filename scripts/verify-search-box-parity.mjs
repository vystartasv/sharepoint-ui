import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "search-box-parity.tsx", loader: "tsx", resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SearchBox}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineSearchBox}from"${resolve("packages/sharepoint-ui/src/elements/search.ts")}";window.changes=[];window.values=[];window.searches=[];function App(){const[value,setValue]=React.useState("Report");return <form onSubmit={event=>event.preventDefault()}><SearchBox data-testid="controlled" label="Search reports" value={value} autoComplete="off" maxLength={80} minLength={2} pattern="[A-Za-z]+" inputMode="search" clearLabel="Clear report search" contentBefore={<span data-testid="before-content">Filter</span>} contentAfter={<button type="button" data-testid="after-content">Advanced</button>} dismiss={<span data-testid="dismiss-content">Remove</span>} onChange={(event,data)=>{window.changes.push([event.type,event.target.tagName,event.currentTarget.tagName,data.value]);setValue(data.value)}} onValueChange={v=>window.values.push(v)} onSearch={v=>window.searches.push(v)}/><SearchBox data-testid="default" label="Search people" defaultValue="Ada"/><SearchBox data-testid="typed" label="Contact email" type="email" defaultValue="" children={<span data-testid="ignored-search-child">Not rendered</span>}/></form>};createRoot(document.querySelector("#react")).render(<App/>);window.mountNative=()=>{defineSearchBox();const host=document.createElement("spui-search-box");host.dataset.testid="native";host.setAttribute("label","Native search");host.defaultValue="Draft";host.innerHTML='<span slot="content-before">Native filter</span><span slot="content-after">Native option</span><span slot="dismiss">Remove</span>';document.querySelector("#native").append(host)};window.mountNative();`,
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((req, res) => req.url === "/bundle.js"
  ? res.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : res.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='react'></main><main id='native'></main><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const host = name => page.getByTestId(name);
  const input = name => host(name).locator("input");
  assert.equal(await page.getByRole("searchbox", { name: "Search reports" }).count(), 1);
  assert.deepEqual(await input("controlled").evaluate(node => ({ autoComplete: node.autocomplete, maxLength: node.maxLength, minLength: node.minLength, pattern: node.pattern, inputMode: node.inputMode })), { autoComplete: "off", maxLength: 80, minLength: 2, pattern: "[A-Za-z]+", inputMode: "search" }, "Fluent inherited input attributes reach the internal search field");
  await host("controlled").evaluate(node => node.setAttribute("maxlength", "90"));
  assert.equal(await input("controlled").evaluate(node => node.maxLength), 90, "native input attributes stay synchronized after host updates");
  for (const appearance of ["filled-darker-shadow", "filled-lighter-shadow"]) {
    await host("controlled").evaluate((node, value) => node.setAttribute("appearance", value), appearance);
    assert.notEqual(await host("controlled").evaluate(node => getComputedStyle(node.shadowRoot.querySelector(".control")).boxShadow), "none", `${appearance} appearance renders its shadow treatment`);
  }
  assert.equal(await host("controlled").evaluate(node => node.shadowRoot.querySelector('slot[name="content-before"]').assignedElements()[0].textContent), "Filter");
  assert.equal(await host("controlled").evaluate(node => node.shadowRoot.querySelector('slot[name="content-after"]').assignedElements()[0].textContent), "Advanced");
  assert.equal(await host("controlled").evaluate(node => node.shadowRoot.querySelector('slot[name="dismiss"]').assignedElements()[0].textContent), "Remove");
  assert.deepEqual(await host("controlled").evaluate(node => [...node.shadowRoot.querySelector(".control").children].map(child => child.matches('slot[name="content-before"]') ? "before" : child.localName === "input" ? "input" : "after")), ["before", "input", "after"], "before/after slots retain Fluent's order around the primary input");
  assert.equal(await host("native").evaluate(node => node.shadowRoot.querySelector('slot[name="content-before"]').assignedElements()[0].textContent), "Native filter", "native authors can use kebab-case content slots");
  await page.getByTestId("after-content").click();
  assert.equal(await host("controlled").evaluate(node => node.value), "Report", "contentAfter actions remain independent from clearing the search value");
  await input("controlled").fill("Budget");
  await page.waitForFunction(() => document.querySelector('[data-testid="controlled"]').value === "Budget");
  assert.deepEqual(await page.evaluate(() => window.changes), [["input","INPUT","INPUT","Budget"]]);
  assert.deepEqual(await page.evaluate(() => window.values), ["Budget"]);
  await input("controlled").fill("1");
  assert.equal(await host("controlled").evaluate(node => node.matches(":invalid")), true, "minLength validity reaches the form-associated host");
  assert.equal(await host("controlled").evaluate(node => node.form.checkValidity()), false, "the enclosing form rejects a too-short search value");
  await input("controlled").fill("12");
  assert.equal(await host("controlled").evaluate(node => node.matches(":invalid")), true, "pattern validity reaches the form-associated host");
  assert.equal(await host("controlled").evaluate(node => node.form.checkValidity()), false, "the enclosing form rejects a pattern mismatch");
  await input("controlled").fill("Budget");
  assert.equal(await host("controlled").evaluate(node => node.matches(":valid")), true, "the host returns to valid after the input constraints are satisfied");
  await host("controlled").getByRole("button", { name: "Clear report search" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="controlled"]').value === "");
  assert.deepEqual((await page.evaluate(() => window.changes)).at(-1), ["click","SPAN","SPAN",""]);
  assert.deepEqual((await page.evaluate(() => window.values)).at(-1), "");
  await input("controlled").fill("Budget");
  await input("controlled").press("Enter");
  assert.deepEqual(await page.evaluate(() => window.searches), ["Budget"]);
  await host("controlled").getByRole("button", { name: "Clear report search" }).focus();
  await page.keyboard.press("Space");
  await page.waitForFunction(() => document.querySelector('[data-testid="controlled"]').value === "");
  assert.deepEqual((await page.evaluate(() => window.changes)).at(-1), ["click","SPAN","SPAN",""]); // Space activates the Fluent button-role dismiss slot.
  assert.equal(await input("typed").evaluate(node => node.type), "email", "the inherited input type prop reaches the internal input");
  assert.equal(await page.getByTestId("ignored-search-child").count(), 0, "SearchBox accepts the inherited React children field while preserving Fluent’s documented no-children rendering");
  assert.equal(await host("default").evaluate(el => el.value), "Ada", "defaultValue initializes the custom element");
  assert.equal(await host("native").evaluate(el => el.value), "Draft");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", accessibleName: true, inputChangeEvent: true, clearMouseAndKeyboardActivation: true, contentBeforeAfterDismissSlots: true, nativeSlotComposition: true, afterActionIsolation: true, legacyValueCallback: true, defaultValue: true, enterSearch: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
