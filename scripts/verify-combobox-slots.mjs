import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "combobox-slots.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{ComboBox,ComboOption}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineCombobox}from"${resolve("packages/sharepoint-ui/src/elements/combobox.ts")}";createRoot(document.querySelector("#react")).render(<ComboBox data-testid="react-combo" label="Fruit" aria-label="Fruit selector" defaultValue="Apple" selectedValue="apple" clearable defaultOpen input={{type:"search", "data-testid":"react-input"}} clearIcon={<b data-testid="react-clear-icon">x</b>} expandIcon={<b data-testid="react-expand-icon">v</b>} listbox={<ul data-testid="react-listbox"/>}><ComboOption value="apple">Apple</ComboOption><ComboOption value="banana">Banana</ComboOption></ComboBox>);window.mountNative=()=>{defineCombobox();const combo=document.createElement("spui-combobox");combo.id="native-combo";combo.setAttribute("label","Native fruit");combo.setAttribute("aria-label","Native fruit selector");combo.setAttribute("value","Apple");combo.setAttribute("selected-value","apple");combo.setAttribute("clearable","");combo.setAttribute("open","");combo.innerHTML='<spui-combobox-option value="apple">Apple</spui-combobox-option><spui-combobox-option value="banana">Banana</spui-combobox-option><input slot="input" type="search" data-testid="native-input"><span slot="clear-icon" data-testid="native-clear-icon">x</span><span slot="expand-icon" data-testid="native-expand-icon">v</span><ul slot="listbox" data-testid="native-listbox"></ul>';document.querySelector("#native").append(combo)};window.mountNative();`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><div id=react></div><div id=native></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  for (const [host, inputTestId, listTestId, iconTestIds, accessibleName] of [
    [page.getByTestId("react-combo"), "react-input", "react-listbox", ["react-clear-icon", "react-expand-icon"], "Fruit selector"],
    [page.locator("#native-combo"), "native-input", "native-listbox", ["native-clear-icon", "native-expand-icon"], "Native fruit selector"],
  ]) {
    const input = page.getByTestId(inputTestId);
    assert.equal(await input.getAttribute("slot"), "input");
    assert.equal(await input.getAttribute("role"), "combobox");
    assert.equal(await input.getAttribute("aria-label"), accessibleName);
    assert.equal(await input.inputValue(), "Apple");
    const listbox = page.getByTestId(listTestId);
    assert.equal(await listbox.getAttribute("slot"), "listbox");
    assert.equal(await listbox.getAttribute("role"), "listbox");
    assert.equal(await listbox.getByRole("option", { name: "Apple" }).count(), 1);
    for (const id of iconTestIds) assert.equal(await page.getByTestId(id).getAttribute("slot"), id.includes("clear") ? "clear-icon" : "expand-icon");
    assert.equal(await host.locator(".expand").isVisible(), true);
    assert.equal(await host.locator(".clear").isVisible(), true);
    await input.fill("Ban");
    assert.equal(await listbox.getByRole("option").count(), 1, "the assigned input continues driving filtering");
    assert.equal(await listbox.getByRole("option").innerText(), "Banana");
    await input.press("ArrowDown");
    await input.press("Enter");
    assert.deepEqual(await host.evaluate(node => ({ value: node.value, selectedValue: node.selectedValue })), { value: "Banana", selectedValue: "banana" }, "the assigned input preserves keyboard selection");
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactSlots: ["input", "clearIcon", "expandIcon", "listbox"], nativeSlots: ["input", "clearIcon", "expandIcon", "listbox"], assignedInputFiltering: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
