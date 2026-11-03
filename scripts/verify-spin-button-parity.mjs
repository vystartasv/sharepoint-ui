import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.spin-button-change-type-contract.tsx");
const typeFixture = `import { SpinButton, type SpinButtonOnChangeData } from "./react.js"; type Assert<T extends true> = T; type ValueIsOptional = Assert<undefined extends SpinButtonOnChangeData["value"] ? true : false>; const usage = <SpinButton onChange={(_event, data) => { const value: number | null | undefined = data.value; void value; }} />;`;
const originalFileExists = ts.sys.fileExists;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.fileExists = file => resolve(file) === typeFixturePath || originalFileExists(file);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `SpinButton Fluent event contract should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    sourcefile: "spin-button-parity.tsx", loader: "tsx", resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SpinButton}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineSpinButton}from"${resolve("packages/sharepoint-ui/src/elements/spin-button.ts")}";import{SpinButton as FluentSpinButton}from"@fluentui/react-spinbutton";window.changes=[];window.edits=[];window.formSubmits={local:0,fluent:0,native:0};window.keyDefaults=[];function App(){const[value,setValue]=React.useState(2);return <><form id="react-form" onSubmit={event=>{event.preventDefault();window.formSubmits.local++}}><SpinButton data-testid="controlled" label="Weight" name="weight" value={value} displayValue={value.toFixed(1)+" kg"} min={0} max={5} step={0.1} stepPage={1} precision={1} incrementLabel="Increase weight" decrementLabel="Decrease weight" onChange={(event,data)=>{window.changes.push([data.value,data.displayValue,event.target.value,event.currentTarget===event.target,event.nativeEvent.type,event.nativeEvent.key,event.key,event.currentTarget.tagName,typeof event.preventDefault,typeof event.stopPropagation,typeof event.persist,typeof event.isDefaultPrevented]);setValue(data.value)}} onValueChange={v=>window.edits.push(v)}/><SpinButton data-testid="default" label="Quantity" name="quantity" defaultValue={3.2} displayValue="ignored uncontrolled display" min={0} max={4} step={0.2} size="small" appearance="filled-lighter"/><SpinButton data-testid="hold-local" label="Hold local" defaultValue={2} max={100} step={0.2}/><SpinButton data-testid="slotted" label="Slotted quantity" name="slotted" defaultValue={1} min={0} max={2} step={1} input={{inputMode:"numeric", "data-testid":"slotted-input"}} incrementButton={{"data-testid":"slotted-increment"}} decrementButton={{"data-testid":"slotted-decrement"}}/><button type="submit" name="action" value="save">Save</button><button type="reset">Reset</button></form><form id="fluent-form" onSubmit={event=>{event.preventDefault();window.formSubmits.fluent++}}><FluentSpinButton data-testid="fluent" aria-label="Fluent weight" defaultValue={2}/><FluentSpinButton data-testid="hold-fluent" aria-label="Fluent hold" defaultValue={2} max={100} step={0.2}/><button type="submit">Save Fluent</button></form></>};createRoot(document.querySelector("#react")).render(<App/>);document.querySelector("#native-form").addEventListener("submit",event=>{event.preventDefault();window.formSubmits.native++});window.mountNative=()=>{defineSpinButton();const form=document.querySelector("#native-form");const el=document.createElement("spui-spin-button");el.dataset.testid="native";el.setAttribute("label","Native count");el.setAttribute("name","count");el.setAttribute("default-value","4");el.setAttribute("min","0");el.setAttribute("max","4");el.setAttribute("step","1");el.setAttribute("aria-valuetext","Four items");el.setAttribute("appearance","underline");el.setAttribute("dir","rtl");form.append(el);const reset=document.createElement("button");reset.type="reset";reset.textContent="Reset native";form.append(reset)};window.mountNative();`,
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((req, res) => req.url === "/bundle.js"
  ? res.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : res.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='react'></main><form id='native-form'></form><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const host = name => page.getByTestId(name);
  const input = name => host(name).locator("input:not([hidden])");
  const fluentInput = page.getByTestId("fluent");
  assert.equal(await page.locator("#fluent-form button").nth(0).getAttribute("aria-label"), "Increment value", "fallback increment label matches pinned Fluent");
  assert.equal(await page.locator("#fluent-form button").nth(1).getAttribute("aria-label"), "Decrement value", "fallback decrement label matches pinned Fluent");
  assert.equal(await host("hold-local").locator("button").nth(0).getAttribute("aria-label"), await page.locator("#fluent-form button").nth(0).getAttribute("aria-label"), "React adapter preserves Fluent's default increment label");
  assert.equal(await host("hold-local").locator("button").nth(1).getAttribute("aria-label"), await page.locator("#fluent-form button").nth(1).getAttribute("aria-label"), "React adapter preserves Fluent's default decrement label");
  const holdLocal = host("hold-local").locator("button").first();
  const holdFluent = page.locator("#fluent-form button").nth(2);
  await holdLocal.evaluate(button => button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  await holdFluent.evaluate(button => button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  await page.waitForTimeout(720);
  await holdLocal.evaluate(button => button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 })));
  await holdFluent.evaluate(button => button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 })));
  assert.equal(await host("hold-local").evaluate(el => el.value), await host("hold-fluent").inputValue(), "press-and-hold repeats at the same cadence as Fluent");
  assert.ok(Number(await host("hold-local").evaluate(el => el.value)) > 2.2, "press-and-hold accelerates beyond the initial step");
  await input("controlled").evaluate(node => node.addEventListener("keydown", event => window.keyDefaults.push(["local", event.key, event.defaultPrevented])));
  await fluentInput.evaluate(node => node.addEventListener("keydown", event => window.keyDefaults.push(["fluent", event.key, event.defaultPrevented])));
  assert.equal(await page.getByRole("spinbutton", { name: "Weight", exact: true }).count(), 1, "visible label names the spinbutton");
  assert.equal(await input("controlled").getAttribute("role"), "spinbutton");
  assert.equal(await input("controlled").getAttribute("aria-valuenow"), "2");
  assert.equal(await input("controlled").getAttribute("aria-valuemin"), "0");
  assert.equal(await input("controlled").getAttribute("aria-valuemax"), "5");
  assert.equal(await input("controlled").getAttribute("aria-valuetext"), "2.0 kg");
  assert.equal(await host("default").evaluate(el => el.value), "3.2", "defaultValue initializes uncontrolled value");
  assert.equal(await input("default").inputValue(), "3.2", "displayValue is ignored in uncontrolled mode");
  assert.equal(await host("default").getAttribute("size"), "small");
  assert.equal(await input("default").evaluate(el => getComputedStyle(el.closest("div[part~='control-group']")).minHeight), "50px", "small size keeps both controls above the 24px target minimum");
  for (const stepper of await host("default").locator("button").all()) {
    const { width, height } = await stepper.boundingBox();
    assert.ok(width >= 24 && height >= 24, `stepper target is at least 24×24px (${width}×${height})`);
  }
  assert.equal(await host("default").getAttribute("appearance"), "filled-lighter");
  assert.equal(await input("slotted").getAttribute("data-testid"), "slotted-input", "React input slot forwards native attributes");
  assert.equal(await input("slotted").getAttribute("aria-label"), "Slotted quantity", "replacement input receives the Field label for accessible naming");
  assert.equal(await host("slotted").locator("[data-testid=slotted-increment]").getAttribute("slot"), "incrementButton");
  await host("slotted").locator("[data-testid=slotted-increment]").click();
  assert.equal(await host("slotted").evaluate(el => el.value), "2", "replacement increment button uses the native spin engine");
  await host("slotted").locator("[data-testid=slotted-decrement]").click();
  assert.equal(await host("slotted").evaluate(el => el.value), "1", "replacement decrement button uses the native spin engine");
  assert.equal(await host("controlled").locator("button").nth(0).getAttribute("aria-label"), "Increase weight");
  await input("controlled").press("ArrowUp");
  await page.waitForFunction(() => window.changes.length > 0);
  await page.waitForFunction(() => document.querySelector('[data-testid="controlled"]').value === "2.1");
  assert.equal(await host("controlled").evaluate(el => el.value), "2.1");
  assert.equal(await input("controlled").inputValue(), "2.1 kg", "controlled displayValue is refreshed by React");
  assert.deepEqual(await page.evaluate(() => window.changes), [[2.1,undefined,"2.0 kg",true,"keydown","ArrowUp","ArrowUp","INPUT","function","function","function","function"]], "onChange receives a React-shaped wrapper for the original keyboard event");
  assert.deepEqual(await page.evaluate(() => window.edits), [2.1], "legacy callback reports a stepped value");
  await input("controlled").press("PageUp");
  await page.waitForFunction(() => document.querySelector('[data-testid="controlled"]').value === "3.1");
  assert.equal(await host("controlled").evaluate(el => el.value), "3.1", "PageUp applies stepPage");
  await input("controlled").press("End");
  await page.waitForFunction(() => document.querySelector('[data-testid="controlled"]').value === "5");
  assert.equal(await host("controlled").evaluate(el => el.value), "5", "End moves to the max bound");
  assert.equal(await host("controlled").locator("button").nth(0).isDisabled(), true, "upper stepper disables at max");
  await input("controlled").press("Home");
  await page.waitForFunction(() => document.querySelector('[data-testid="controlled"]').value === "0");
  await input("controlled").press("Shift+End");
  assert.equal(await host("controlled").evaluate(el => el.value), "0", "Shift+End preserves text-selection behavior instead of applying the max bound");
  assert.equal(await host("controlled").evaluate(el => el.value), "0", "Home moves to the min bound");
  const previousEditCount = await page.evaluate(() => window.edits.length);
  await input("controlled").fill("4.88");
  await input("controlled").press("Escape");
  assert.equal(await host("controlled").evaluate(el => el.value), "0", "Escape discards an uncommitted edit");
  await input("controlled").fill("2.34");
  assert.equal(await page.evaluate(() => window.edits.length), previousEditCount + 2, "legacy callback reports edits");
  await input("controlled").press("Enter");
  await page.waitForFunction(() => document.querySelector('[data-testid="controlled"]').value === "2.3");
  assert.equal(await host("controlled").evaluate(el => el.value), "2.3", "commit rounds to precision");
  await fluentInput.press("Enter");
  await page.waitForFunction(() => window.formSubmits.local === 1 && window.formSubmits.fluent === 1);
  assert.deepEqual(await page.evaluate(() => window.formSubmits), { local: 1, fluent: 1, native: 0 }, "Enter submits both local and Fluent spinbutton forms");
  assert.deepEqual(await page.evaluate(() => window.keyDefaults.filter(([source, key]) => key === "Enter")), [["local", "Enter", false], ["fluent", "Enter", false]], "Enter remains unprevented for native form submission");
  assert.deepEqual(await page.evaluate(() => window.keyDefaults.filter(([source, key]) => ["ArrowUp", "PageUp", "End", "Home", "Enter"].includes(key))), [["local", "ArrowUp", false], ["local", "PageUp", true], ["local", "End", false], ["local", "Home", false], ["local", "End", false], ["local", "Enter", false], ["fluent", "Enter", false]], "only PageUp/PageDown prevent browser defaults, matching Fluent key behavior");
  assert.deepEqual((await page.evaluate(() => window.changes)).at(-1).slice(0, 2), [2.3, "2.34"], "commit reports the rounded value and entered display string");
  const uncontrolled = host("default");
  await uncontrolled.locator("button").nth(0).click();
  assert.equal(await uncontrolled.evaluate(el => el.value), "3.4", "stepper increments by step");
  assert.deepEqual(await page.locator("#react-form").evaluate(form => [...new FormData(form).entries()]), [["weight","2.3"],["quantity","3.4"],["slotted","1"]]);
  await host("controlled").locator("button").first().click();
  assert.deepEqual((await page.evaluate(() => window.changes)).at(-1).slice(4), ["mousedown", undefined, undefined, "BUTTON", "function", "function", "function", "function"], "stepper onChange wraps the Fluent-aligned press event with its button currentTarget");
  const native = host("native");
  assert.equal(await native.evaluate(el => el.value), "4", "stepper does not cross max");
  assert.equal(await input("native").getAttribute("aria-valuetext"), "Four items", "explicit aria-valuetext is preserved");
  assert.equal(await native.locator("button").nth(0).getAttribute("aria-label"), "Increment value");
  assert.ok(await native.evaluate(el => el.shadowRoot.querySelector("input").getBoundingClientRect().x > el.shadowRoot.querySelector("[part~=buttons]").getBoundingClientRect().x), "RTL places the steppers at the logical end");
  assert.equal(await native.locator("button").nth(0).isDisabled(), true);
  await native.locator("input").fill("2");
  await native.locator("input").press("Enter");
  assert.deepEqual(await page.evaluate(() => window.formSubmits.native), 1, "Enter submits an associated form when the internal input is in a shadow root");
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["count","2"]]);
  await page.getByRole("button", { name: "Reset native" }).click();
  assert.equal(await native.evaluate(el => el.value), "4", "form reset restores the default");
  await native.evaluate(el => { const replacement = document.createElement("input"); replacement.slot = "input"; replacement.setAttribute("aria-label", "Assigned native spin input"); const up = document.createElement("button"); up.slot = "incrementButton"; up.textContent = "Up"; const down = document.createElement("button"); down.slot = "decrementButton"; down.textContent = "Down"; el.append(replacement, up, down); });
  const assignedInput = native.locator("input[slot=input]");
  await assignedInput.waitFor();
  await native.evaluate(el => { el.value = "1"; });
  assert.equal(await assignedInput.getAttribute("aria-valuenow"), "1", "direct custom-element input slot receives spin semantics");
  assert.equal(await native.evaluate(el => el.shadowRoot.querySelector(".input-fallback").hidden), true, "internal input fallback hides when replaced");
  await assignedInput.press("ArrowUp");
  assert.equal(await native.evaluate(el => el.value), "2", "assigned input receives spin keyboard handling");
  await native.locator("button[slot=incrementButton]").click();
  const directButtons = await native.evaluate(el => [...el.querySelectorAll("button")].map(button => ({slot:button.slot,disabled:button.disabled,value:button.closest("spui-spin-button")?.value})));
  assert.deepEqual(directButtons.map(button => button.slot), ["input", "incrementButton", "decrementButton"].slice(1), "both assigned stepper controls remain connected after interaction");
  await native.evaluate(el => el.querySelector("button[slot=decrementButton]")?.click());
  assert.equal(await native.evaluate(el => el.value), "2", "direct custom-element stepper slots use host stepping behavior");
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["count","2"]], "assigned input remains form-associated through host");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", enterFormSubmission: true, nativeKeyDefaultBehavior: true, replaceableInputAndStepperSlots: true, controlledAndDefaultValues: true, displayValue: true, callbacks: true, keyboardAndBounds: true, precisionAndStepPage: true, appearanceAndSize: true, steppers: true, nativeFormAndReset: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
