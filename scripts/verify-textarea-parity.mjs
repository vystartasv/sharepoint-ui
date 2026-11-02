import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: { contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{TextArea}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineTextArea}from"${resolve("packages/sharepoint-ui/src/elements/textarea.ts")}";defineTextArea();window.events=[];function App(){const[value,setValue]=React.useState("Initial");return <><form id="controlled-form"><TextArea data-testid="controlled" label="Description" name="description" required value={value} form="controlled-form" autoComplete="off" cols={44} dirName="descriptionDirection" maxLength={120} minLength={2} wrap="hard" appearance="filled-darker-shadow" size="small" resize="both" onValueChange={next=>window.legacy=next} onChange={(event,data)=>{window.events.push({value:data.value,type:event.type,targetValue:event.target.value,targetTag:event.target.tagName,currentTargetTag:event.currentTarget.tagName,nativeType:event.nativeEvent.type,sameTarget:event.target===event.currentTarget,nativeCurrentTarget:event.nativeEvent.currentTarget===event.currentTarget});setValue(data.value)}}/></form><form id="slotted-form"><TextArea data-testid="slotted" label="Slot label" name="slotted" defaultValue="Slot start" textarea={{rows:4, "aria-label":"Explicit slot name"}}/></form><form id="uncontrolled-form"><TextArea data-testid="uncontrolled" label="Notes" name="notes" required defaultValue="Draft" size="large" resize="vertical"/><button type="reset">Reset</button></form></>}createRoot(document.querySelector("#react")).render(<App/>);window.mountNative=()=>{const form=document.createElement("form");form.id="native-form";const area=document.createElement("spui-textarea");area.dataset.testid="native";area.setAttribute("label","Native notes");area.setAttribute("name","native");area.setAttribute("default-value","Native draft");area.setAttribute("appearance","filled-lighter");area.setAttribute("resize","horizontal");form.append(area);document.querySelector("#native").append(form);window.nativeArea=area};`, resolveDir: process.cwd(), sourcefile: "textarea-parity.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='react'></main><main id='native'></main><script src='/bundle.js'></script><script>window.mountNative()</script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const controlled = page.getByTestId("controlled");
  const control = controlled.locator("textarea");
  await control.waitFor();
  assert.equal(await control.getAttribute("required"), "");
  assert.equal(await control.getAttribute("form"), "controlled-form");
  assert.equal(await control.getAttribute("autocomplete"), "off");
  assert.equal(await control.getAttribute("cols"), "44");
  assert.equal(await control.getAttribute("dirname"), "descriptionDirection");
  assert.equal(await control.getAttribute("maxlength"), "120");
  assert.equal(await control.getAttribute("minlength"), "2");
  assert.equal(await control.getAttribute("wrap"), "hard");
  assert.equal(await control.evaluate(node => getComputedStyle(node).minHeight), "64px", "small size applies the compact textarea height");
  assert.equal(await control.evaluate(node => getComputedStyle(node).resize), "both", "resize direction reaches the native control");
  assert.notEqual(await control.evaluate(node => getComputedStyle(node).boxShadow), "none", "filled shadow appearance is styled");
  await control.fill("Changed");
  assert.deepEqual(await page.evaluate(() => window.events.at(-1)), { value: "Changed", type: "input", targetValue: "Changed", targetTag: "TEXTAREA", currentTargetTag: "TEXTAREA", nativeType: "input", sameTarget: true, nativeCurrentTarget: true }, "onChange receives the native input event and Fluent value data");
  assert.equal(await page.evaluate(() => window.legacy), "Changed", "legacy onValueChange remains supported");
  assert.equal(await control.inputValue(), "Changed", "controlled value follows the owner update");
  assert.deepEqual(await page.locator("#controlled-form").evaluate(form => [...new FormData(form).entries()]), [["description", "Changed"]], "custom textarea participates in form submission");

  const slotted = page.getByTestId("slotted");
  const slottedControl = slotted.getByRole("textbox", { name: "Explicit slot name" });
  assert.equal(await slottedControl.getAttribute("rows"), "4", "React textarea slot preserves native textarea props");
  assert.equal(await slotted.locator("textarea.textarea-fallback").evaluate(node => node.hidden), true, "fallback textarea is hidden when a replacement is assigned");
  await slottedControl.fill("Slot updated");
  assert.deepEqual(await page.locator("#slotted-form").evaluate(form => [...new FormData(form).entries()]), [["slotted", "Slot updated"]], "slotted textarea participates in host form submission");

  const uncontrolled = page.getByTestId("uncontrolled");
  const uncontrolledControl = uncontrolled.locator("textarea");
  assert.equal(await uncontrolledControl.inputValue(), "Draft", "defaultValue initializes the uncontrolled value");
  assert.equal(await uncontrolledControl.evaluate(node => getComputedStyle(node).minHeight), "88px", "large size applies the larger textarea height");
  await uncontrolledControl.fill("");
  const requiredState = await uncontrolled.evaluate(element => ({ value: element.shadowRoot.querySelector("textarea").value, required: element.shadowRoot.querySelector("textarea").required, native: element.shadowRoot.querySelector("textarea").validity.valueMissing, custom: element.validity.valueMissing, message: element.validationMessage }));
  assert.equal(requiredState.custom, true, `required validation is exposed through ElementInternals: ${JSON.stringify(requiredState)}`);
  await uncontrolledControl.fill("Edited");
  assert.equal(await uncontrolledControl.inputValue(), "Edited");
  await page.getByRole("button", { name: "Reset" }).click();
  assert.equal(await uncontrolledControl.inputValue(), "Draft", "form reset restores the custom element default value");
  assert.deepEqual(await page.locator("#uncontrolled-form").evaluate(form => [...new FormData(form).entries()]), [["notes", "Draft"]]);

  const native = page.getByTestId("native");
  await native.locator("textarea").waitFor();
  assert.equal(await native.evaluate(element => element.value), "Native draft", "custom element exposes the default value as its current value");
  assert.equal(await native.locator("textarea").evaluate(node => getComputedStyle(node).resize), "horizontal");
  assert.equal(await native.getAttribute("appearance"), "filled-lighter");
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["native", "Native draft"]]);
  await native.evaluate(element => { const replacement = document.createElement("textarea"); replacement.slot = "textarea"; replacement.value = "Assigned value"; replacement.setAttribute("aria-label", "Assigned native textarea"); element.append(replacement); });
  const assigned = native.locator("textarea[slot=textarea]");
  await assigned.waitFor();
  await native.evaluate(element => { element.value = "Assigned value"; });
  await page.waitForFunction(() => window.nativeArea.value === "Assigned value");
  assert.equal(await native.evaluate(element => element.value), "Assigned value", "custom element value property resolves to its assigned native textarea");
  await assigned.fill("Assigned edited");
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["native", "Assigned edited"]], "native custom-element slot participates in host form submission");
  await native.evaluate(element => { element.value = "Property update"; element.setAttribute("size", "small"); element.setAttribute("resize", "none"); });
  assert.equal(await assigned.inputValue(), "Property update", "typed value property updates the native control");
  assert.equal(await assigned.evaluate(node => getComputedStyle(node).resize), "none", "native attribute changes update resize behavior");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", replaceableTextareaSlot: true, controlledAndDefaultValue: true, fluentOnChangeAndLegacyCallback: true, appearanceSizeAndResize: true, nativePropertyAndAttributeUpdates: true, formSubmissionValidationAndReset: true, pageErrors: errors.length }));
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
