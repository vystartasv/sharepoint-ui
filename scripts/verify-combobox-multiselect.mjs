import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: { contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {ComboBox,ComboOption} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import {defineCombobox} from "${resolve("packages/sharepoint-ui/src/elements/combobox.ts")}"; function App(){const [selected,setSelected]=React.useState(["alpha"]);return <><form id="react-form"><ComboBox data-testid="react" label="Requests" name="requests" required multiselect selectedOptions={selected} onSelectedOptionsChange={setSelected}><ComboOption value="alpha">Alpha</ComboOption><ComboOption value="beta">Beta</ComboOption><ComboOption value="gamma" disabled>Gamma</ComboOption></ComboBox></form><form id="freeform-form"><ComboBox data-testid="react-freeform" label="Freeform" name="freeform" freeform><ComboOption value="known">Known option</ComboOption></ComboBox></form><form id="default-form"><ComboBox data-testid="react-default" label="Default choices" name="defaults" multiselect defaultSelectedOptions={["alpha"]}><ComboOption value="alpha">Alpha</ComboOption><ComboOption value="beta">Beta</ComboOption></ComboBox></form></>} createRoot(document.querySelector("#react-root")).render(<App/>); window.mountNative=()=>{defineCombobox();const form=document.createElement("form");form.id="native-form";const combo=document.createElement("spui-combobox");combo.id="native";combo.setAttribute("label","Native requests");combo.setAttribute("name","requests");combo.setAttribute("required","");combo.setAttribute("multiselect","");combo.setAttribute("default-selected-options",JSON.stringify(["alpha"]));for(const [value,label,disabled] of [["alpha","Alpha",false],["beta","Beta",false],["gamma","Gamma",true]]){const option=document.createElement("spui-combobox-option");option.setAttribute("value",value);option.textContent=label;if(disabled)option.setAttribute("disabled","");combo.append(option)}form.append(combo);document.querySelector("#native-root").append(form)};`, resolveDir: process.cwd(), sourcefile: "combobox-check.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"],
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")], write: false,
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='react-root'></main><main id='native-root'></main><script src='/bundle.js'></script><script>window.mountNative()</script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 700, height: 600 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const freeform = page.getByTestId("react-freeform");
  await freeform.locator("input").fill("custom value");
  assert.deepEqual(await page.locator("#freeform-form").evaluate(form => new FormData(form).getAll("freeform")), ["custom value"], "Fluent freeform alias submits typed values");
  const native = page.locator("#native");
  const react = page.getByTestId("react");
  for (const combo of [native, react]) {
    assert.equal(await combo.locator('[role="listbox"]').getAttribute("aria-multiselectable"), "true");
    assert.equal(await combo.locator('[role="option"][aria-selected="true"]').count(), 1);
    assert.equal((await combo.locator(".tag").innerText()).replace(/\s+/g, ""), "Alpha×");
    await combo.locator("input").click();
    assert.equal(await combo.locator('[role="listbox"]').isVisible(), true);
    await combo.locator('[role="option"]', { hasText: "Beta" }).evaluate(option => option.click());
    if (await combo.getAttribute("data-testid") === "react") await page.waitForFunction(() => document.querySelector('[data-testid="react"]').selectedOptions.length === 2);
    assert.equal(await combo.locator('[role="listbox"]').isVisible(), true, "multi-select stays open after a selection");
    assert.equal(await combo.locator('[role="option"][aria-selected="true"]').count(), 2);
    assert.equal(await combo.locator(".tag").count(), 2);
    assert.equal(await combo.locator("input").inputValue(), "", "selected option labels do not replace the input value");
    assert.equal(await combo.locator('[role="option"][aria-disabled="true"]').count(), 1);
    await combo.locator('[role="option"][aria-disabled="true"]').evaluate(option => option.click());
    assert.equal(await combo.locator(".tag").count(), 2, "disabled options cannot enter the selection");
  }
  await native.locator("input").press("Escape");
  await react.locator("input").press("Escape");
  const defaultCombo = page.getByTestId("react-default");
  await page.waitForFunction(() => document.querySelector('[data-testid="react-default"]').selectedOptions.length === 1);
  assert.deepEqual(await page.locator("#default-form").evaluate(form => [...new FormData(form).entries()]), [["defaults", "alpha"]]);
  await defaultCombo.locator("input").click();
  await defaultCombo.locator('[role="option"]', { hasText: "Beta" }).evaluate(option => option.click());
  assert.deepEqual(await page.locator("#default-form").evaluate(form => [...new FormData(form).entries()]), [["defaults", "alpha"], ["defaults", "beta"]]);
  await page.locator("#default-form").evaluate(form => form.reset());
  await page.waitForFunction(() => document.querySelector('[data-testid="react-default"]').selectedOptions.length === 1);
  assert.deepEqual(await page.locator("#default-form").evaluate(form => [...new FormData(form).entries()]), [["defaults", "alpha"]]);
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["requests", "alpha"], ["requests", "beta"]]);
  assert.deepEqual(await page.locator("#react-form").evaluate(form => [...new FormData(form).entries()]), [["requests", "alpha"], ["requests", "beta"]]);
  assert.equal(await page.locator("#native-form").evaluate(form => form.checkValidity()), true);
  await native.locator("input").press("Escape");
  await react.locator("input").press("Escape");
  await native.locator(".remove").last().evaluate(button => button.click());
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["requests", "alpha"]]);
  await page.locator("#native-form").evaluate(form => form.reset());
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["requests", "alpha"]]);
  await native.evaluate(node => node.formStateRestoreCallback(JSON.stringify(["beta"])));
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["requests", "beta"]]);
  await page.locator("#native-form").evaluate(form => form.reset());
  await native.locator("input").click();
  await native.locator("input").press("ArrowDown");
  await native.locator("input").press("Space");
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["requests", "alpha"], ["requests", "beta"]]);
  await native.locator("input").press("Escape");
  await react.locator("input").press("Backspace");
  await page.waitForFunction(() => document.querySelector('[data-testid="react"]').selectedOptions.length === 1);
  assert.deepEqual(await page.locator("#react-form").evaluate(form => [...new FormData(form).entries()]), [["requests", "alpha"]]);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", nativeAndReact: true, controlledAndDefaultSelections: true, multiSelectOpenState: true, arrowSpaceSelection: true, checkedOptions: true, selectedTags: true, removals: true, repeatedFormValues: true, formResetAndStateRestore: true, requiredValidity: true, disabledOptions: true, pageErrors: errors.length }));
} finally { await browser?.close(); server.close(); }
