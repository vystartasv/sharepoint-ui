import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const components = ["Input", "TextArea", "Checkbox", "Select", "SpinButton", "Slider", "ComboBox", "Dropdown", "SearchBox", "FileUpload"];
const imports = components.join(",");
const elements = [
  '<Input data-testid="input" aria-label="Input" required {...events("input")} />',
  '<TextArea data-testid="textarea" aria-label="Text area" required {...events("textarea")} />',
  '<Checkbox data-testid="checkbox" aria-label="Checkbox" required {...events("checkbox")} />',
  '<Select data-testid="select" aria-label="Select" required {...events("select")}><option value="">Choose</option><option value="a">A</option></Select>',
  '<SpinButton data-testid="spin" aria-label="Spin" required {...events("spin")} />',
  '<Slider data-testid="slider" aria-label="Slider" {...events("slider")} />',
  '<ComboBox data-testid="combo" aria-label="Combo" {...events("combo")}><Option value="a">A</Option></ComboBox>',
  '<Dropdown data-testid="dropdown" aria-label="Dropdown" button="Choose" {...events("dropdown")}><Option value="a">A</Option></Dropdown>',
  '<SearchBox data-testid="search" aria-label="Search" {...events("search")} />',
  '<FileUpload data-testid="upload" label="Upload" {...events("upload")} />',
];
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{${imports},Option}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.events=[];window.expectedRoots={};window.eventsFor=id=>({onClickCapture:event=>window.events.push([id,"click","capture",event.target.tagName,event.currentTarget.tagName]),onClick:event=>window.events.push([id,"click","bubble",event.target.tagName,event.currentTarget.tagName]),onFocusCapture:event=>window.events.push([id,"focus","capture",event.target.tagName,event.currentTarget.tagName]),onFocus:event=>window.events.push([id,"focus","bubble",event.target.tagName,event.currentTarget.tagName]),onInvalidCapture:event=>window.events.push([id,"invalid","capture",event.target.tagName,event.currentTarget.tagName]),onInvalid:event=>window.events.push([id,"invalid","bubble",event.target.tagName,event.currentTarget.tagName])});const events=window.eventsFor;createRoot(document.querySelector("#root")).render(<>${elements.join("")}</>);`,
    resolveDir: root,
    sourcefile: "react-native-form-control-events.tsx",
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
const { chromium } = createRequire(import.meta.url)("playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=input]")?.shadowRoot?.querySelector("input"));
  for (const id of ["input", "textarea", "checkbox", "select", "spin", "slider", "combo", "dropdown", "search", "upload"]) {
    await page.getByTestId(id).evaluate(host => {
      const control = host.shadowRoot?.querySelector(host.dataset.testid === "upload" ? ".drop" : "input,textarea,select,button");
      if (!control) throw new Error(`Missing native root for ${host.dataset.testid}`);
      window.expectedRoots[host.dataset.testid] = control.tagName;
      control.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
      control.dispatchEvent(new FocusEvent("focusin", { bubbles: true, composed: true }));
      host.dispatchEvent(new Event("invalid", { cancelable: true }));
    });
  }
  const { recorded, expectedRoots } = await page.evaluate(() => ({ recorded: window.events, expectedRoots: window.expectedRoots }));
  for (const id of ["input", "textarea", "checkbox", "select", "spin", "slider", "combo", "dropdown", "search", "upload"]) {
    const rows = recorded.filter(([component]) => component === id);
    assert.equal(rows.length, 6, `${id} invokes each React handler once`);
    for (const type of ["click", "focus", "invalid"]) {
      const pair = rows.filter(([, eventType]) => eventType === type);
      assert.deepEqual(pair.map(([, , phase]) => phase), ["capture", "bubble"], `${id} preserves ${type} phases`);
      assert.ok(pair.every(([, , , target, currentTarget]) => target === currentTarget && currentTarget === expectedRoots[id]), `${id} targets the inner native control`);
    }
  }
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", controls: components.length, events: ["click", "focus", "invalid"], targetAndCurrentTarget: true, callbacksNotDuplicated: true, noBrowserErrors: true }, null, 2));
} finally {
  await browser?.close();
  server.close();
}

