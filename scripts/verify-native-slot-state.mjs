import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const sources = {
  checkbox: `import{defineCheckbox}from"${resolve("packages/sharepoint-ui/src/elements/toggle.ts")}";defineCheckbox()`,
  switch: `import{defineSwitch}from"${resolve("packages/sharepoint-ui/src/elements/toggle.ts")}";defineSwitch()`,
  select: `import{defineSelect}from"${resolve("packages/sharepoint-ui/src/elements/select.ts")}";defineSelect()`,
  slider: `import{defineSlider}from"${resolve("packages/sharepoint-ui/src/elements/slider.ts")}";defineSlider()`,
  spin: `import{defineSpinButton}from"${resolve("packages/sharepoint-ui/src/elements/spin-button.ts")}";defineSpinButton()`,
  combo: `import{defineCombobox}from"${resolve("packages/sharepoint-ui/src/elements/combobox.ts")}";defineCombobox()`,
  input: `import{defineInput}from"${resolve("packages/sharepoint-ui/src/elements/input.ts")}";defineInput()`,
  inputText: `import{defineInput}from"${resolve("packages/sharepoint-ui/src/elements/input.ts")}";defineInput()`,
  textarea: `import{defineTextArea}from"${resolve("packages/sharepoint-ui/src/elements/textarea.ts")}";defineTextArea()`,
};
const controls = {
  checkbox: ["spui-checkbox", "input", { checked: true, disabled: true, required: true, value: "custom" }],
  switch: ["spui-switch", "input", { checked: true, disabled: true, required: true, value: "custom" }],
  select: ["spui-select", "select", { disabled: true, required: true, multiple: true, value: "two" }],
  slider: ["spui-slider", "input", { disabled: true, defaultValue: "27", value: "37" }],
  spin: ["spui-spin-button", "input", { disabled: true, required: true, readOnly: true, defaultValue: "13", value: "17" }],
  combo: ["spui-combobox", "input", { disabled: true, required: true, readOnly: true, defaultValue: "combo-default", value: "chosen" }],
  input: ["spui-input", "input", { type: "checkbox", defaultChecked: true, disabled: true, required: true, readOnly: true, value: "yes" }],
  inputText: ["spui-input", "input", { defaultValue: "native-default", value: "native-current", disabled: true, required: true, readOnly: true }],
  textarea: ["spui-textarea", "textarea", { disabled: true, required: true, readOnly: true, defaultValue: "native-default", value: "native-current" }],
};
const server = createServer(async (request, response) => {
  const kind = new URL(request.url, "http://localhost").searchParams.get("control");
  if (!controls[kind]) return response.writeHead(404).end();
  const bundle = await build({ stdin: { sourcefile: `${kind}.ts`, loader: "ts", resolveDir: process.cwd(), contents: sources[kind] }, bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false });
  const [tag, slot, props] = controls[kind];
  response.writeHead(200, { "content-type": "text/html" }).end(`<!doctype html><form id="root"></form><script>${bundle.outputFiles[0].text}</script><script>const host=document.createElement(${JSON.stringify(tag)});host.id="host";host.setAttribute("label","test");${kind === "input" ? 'host.setAttribute("type","checkbox");' : kind === "inputText" ? 'host.setAttribute("type","text");' : ""}const control=document.createElement(${JSON.stringify(slot)});control.slot=${JSON.stringify(slot)};${slot === "select" ? 'control.innerHTML="<option value=one>One</option><option value=two selected>Two</option>";' : ""}for(const[key,value]of Object.entries(${JSON.stringify(props)}))control[key]=value;host.append(control);document.querySelector("#root").append(host);</script>`);
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const results = [];
  const resetResults = [];
  for (const [kind, [tag, slot, expected]] of Object.entries(controls)) {
    await page.goto(`http://127.0.0.1:${server.address().port}/?control=${kind}`);
    const host = page.locator("#host");
    const native = host.locator(`[slot=${slot}]`);
    for (const [property, value] of Object.entries(expected)) assert.equal(await native.evaluate((node, key) => node[key], property), value, `${kind} preserves assigned ${property}`);
    if (kind === "input") assert.equal(await native.evaluate(node => node.checked), true, "input preserves an assigned native checked state");
    await host.evaluate(node => { node.setAttribute("disabled", ""); node.removeAttribute("disabled"); });
    if (expected.disabled) assert.equal(await native.evaluate(node => node.disabled), true, `${kind} restores assigned disabled after host toggles`);
    if (expected.required) {
      await host.evaluate(node => { node.setAttribute("required", ""); node.removeAttribute("required"); });
      assert.equal(await native.evaluate(node => node.required), true, `${kind} restores assigned required after host toggles`);
    }
    if (expected.readOnly) {
      await host.evaluate(node => { node.setAttribute("read-only", ""); node.removeAttribute("read-only"); });
      assert.equal(await native.evaluate(node => node.readOnly), true, `${kind} restores assigned read-only after host toggles`);
    }
    if (expected.value !== undefined) assert.equal(await native.evaluate(node => node.value), expected.value, `${kind} preserves assigned value`);
    const fieldset = await page.evaluate(() => {
      const fieldset = document.createElement("fieldset");
      const host = document.querySelector("#host");
      host.remove();
      fieldset.append(host);
      document.querySelector("#root").append(fieldset);
      return true;
    });
    assert.ok(fieldset);
    const control = host.locator(`[slot=${slot}]`);
    await page.locator("fieldset").evaluate(node => { node.disabled = true; });
    assert.equal(await control.evaluate(node => node.disabled), true, `${kind} follows a disabled fieldset`);
    await page.locator("fieldset").evaluate(node => { node.disabled = false; });
    assert.equal(await control.evaluate(node => node.disabled), Boolean(expected.disabled), `${kind} restores state after a disabled fieldset`);
    if (kind === "inputText" || kind === "textarea" || kind === "slider" || kind === "spin") {
      await control.evaluate(node => { node.value = "edited"; });
      await page.locator("#root").evaluate(form => form.reset());
      assert.equal(await control.inputValue(), expected.defaultValue, `${kind} restores an assigned native default value after form reset`);
      resetResults.push(kind);
    }
    if (kind === "input") { await control.evaluate(node => { node.checked = false; }); await page.locator("#root").evaluate(form => form.reset()); assert.equal(await control.evaluate(node => node.checked), true, "input restores an assigned checked default after form reset"); resetResults.push(kind); }
    if (kind === "select") { await control.evaluate(node => { node.value = "one"; }); await page.locator("#root").evaluate(form => form.reset()); assert.equal(await control.evaluate(node => node.value), "two", "select restores assigned option defaults after form reset"); resetResults.push(kind); }
    if (kind === "combo") { await control.evaluate(node => { node.value = "edited"; }); await page.locator("#root").evaluate(form => form.reset()); assert.equal(await control.evaluate(node => node.value), expected.defaultValue, "combobox restores the assigned input default after form reset"); resetResults.push(kind); }
    results.push(kind);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", assignedControlDefaults: results, formResetRoundTrips: resetResults, fieldsetRoundTrips: results.length, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
