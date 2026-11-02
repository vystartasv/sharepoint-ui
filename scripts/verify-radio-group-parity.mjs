import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.radio-group-change-type-contract.tsx");
const typeFixture = `import * as React from "react"; import { RadioGroup, Radio, Checkbox, Switch, TextArea, type RadioGroupProps, type RadioProps, type CheckboxProps, type SwitchProps, type TextAreaProps } from "./react.js"; type Assert<T extends true> = T; type EventOf<T> = NonNullable<T> extends (event: infer E, ...args: any[]) => unknown ? E : never; type GroupEvent = EventOf<RadioGroupProps["onChange"]>; type RadioEvent = EventOf<RadioProps["onChange"]>; type CheckboxEvent = EventOf<CheckboxProps["onChange"]>; type SwitchEvent = EventOf<SwitchProps["onChange"]>; type TextAreaEvent = EventOf<TextAreaProps["onChange"]>; type GroupMatches = Assert<GroupEvent extends React.FormEvent<HTMLDivElement> ? true : false>; type RadioMatches = Assert<RadioEvent extends React.ChangeEvent<HTMLInputElement> ? true : false>; type CheckboxMatches = Assert<CheckboxEvent extends React.ChangeEvent<HTMLInputElement> ? true : false>; type SwitchMatches = Assert<SwitchEvent extends React.ChangeEvent<HTMLInputElement> ? true : false>; type TextAreaMatches = Assert<TextAreaEvent extends React.ChangeEvent<HTMLTextAreaElement> ? true : false>; const usage = <><RadioGroup label="Plan" onChange={(event, data) => { const target: HTMLDivElement = event.currentTarget; const value: string = data.value; void [target, value]; }} /><Radio value="a" onChange={event => { const target: HTMLInputElement = event.currentTarget; void target.checked; }} /><Checkbox onChange={event => { const target: HTMLInputElement = event.currentTarget; void target.checked; }} /><Switch onChange={event => { const target: HTMLInputElement = event.currentTarget; void target.checked; }} /><TextArea onChange={event => { const target: HTMLTextAreaElement = event.currentTarget; void target.value; }} /></>;`;
const configPath = resolve("packages/sharepoint-ui/tsconfig.json");
const configRead = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(configRead.config, ts.sys, resolve("packages/sharepoint-ui"));
const typeOptions = { ...parsedConfig.options, noEmit: true, rootDir: undefined };
const host = ts.createCompilerHost(typeOptions);
const originalFileExists = host.fileExists.bind(host), originalReadFile = host.readFile.bind(host), originalGetSourceFile = host.getSourceFile.bind(host);
host.fileExists = file => resolve(file) === typeFixturePath || originalFileExists(file);
host.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, host)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], "RadioGroup, Radio, Checkbox, Switch, and TextArea onChange match their Fluent React event contracts");

const bundle = await build({
  stdin: { contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {RadioGroup,Radio} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import {defineRadioGroup} from "${resolve("packages/sharepoint-ui/src/elements/radio-group.ts")}"; function App(){const [value,setValue]=React.useState("yearly");return <><form id="controlled"><RadioGroup data-testid="react-controlled" label="Billing cycle" name="billing" value={value} layout="horizontal-stacked" onValueChange={v=>window.legacyValue=v} onChange={(event,data)=>{window.changedValue=data.value;window.reactChange={currentTarget:event.currentTarget.tagName,target:event.target.tagName,nativeType:event.nativeEvent.type,preventDefault:typeof event.preventDefault,isDefaultPrevented:typeof event.isDefaultPrevented};setValue(data.value)}}><Radio value="monthly" label={<span data-testid="radio-label-slot">Monthly Billing</span>} labelPosition="after" className="monthly-radio-root" style={{outline:"red solid 1px"}} data-automation="radio-root-prop" input={{className:"custom-radio-input","aria-label":"Monthly Billing","data-testid":"radio-input-slot",inputMode:"numeric",autoComplete:"one-time-code"}} indicator={<span data-testid="radio-indicator-slot"/>} onChange={(event,data)=>{window.optionValue=data.value;window.optionChange={target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeType:event.nativeEvent.type,sameTarget:event.target===event.currentTarget,nativeCurrentTarget:event.nativeEvent.currentTarget===event.currentTarget}}}>Monthly</Radio><Radio value="yearly">Yearly</Radio></RadioGroup></form><form id="static-controlled"><RadioGroup data-testid="react-static" label="Static choice" name="static" value="fixed"><Radio value="fixed">Fixed</Radio><Radio value="other">Other</Radio></RadioGroup></form><form id="uncontrolled"><RadioGroup data-testid="react-default" label="Plan" name="plan" defaultValue="pro" required><Radio value="basic">Basic</Radio><Radio value="pro">Pro</Radio></RadioGroup><button type="reset">Reset plans</button></form><form id="required"><RadioGroup data-testid="react-required" label="Required choice" name="requiredChoice" required><Radio value="a">Choice A</Radio><Radio value="b">Choice B</Radio></RadioGroup></form></>} createRoot(document.querySelector("#react")).render(<App/>); window.mountNative=()=>{defineRadioGroup();const form=document.createElement("form");form.id="native-form";const group=document.createElement("spui-radio-group");group.dataset.testid="native-group";group.setAttribute("label","Native direction");group.setAttribute("name","nativeChoice");group.setAttribute("default-value","rtl");group.setAttribute("layout","horizontal-stacked");group.setAttribute("dir","rtl");group.innerHTML="<spui-radio-option value='ltr'>Left to right<span slot='label'>Left to right</span><input slot='input' data-testid='native-radio-input-slot' inputmode='decimal' autocomplete='email'><span slot='indicator' data-testid='native-radio-indicator-slot'>✦</span></spui-radio-option><spui-radio-option value='rtl'>Right to left</spui-radio-option>";form.append(group);const fieldset=document.createElement("fieldset");fieldset.disabled=true;const disabled=document.createElement("spui-radio-group");disabled.dataset.testid="native-disabled";disabled.setAttribute("label","Disabled choices");disabled.setAttribute("name","disabledChoice");disabled.setAttribute("default-value","yes");disabled.innerHTML="<spui-radio-option value='yes'>Yes</spui-radio-option><spui-radio-option value='no'>No</spui-radio-option>";fieldset.append(disabled);form.append(fieldset);const reset=document.createElement("button");reset.type="reset";reset.textContent="Reset native";form.append(reset);document.querySelector("#native").append(form)};`, resolveDir: process.cwd(), sourcefile: "radio-check.tsx", loader: "tsx" },
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
  const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const controlled = page.getByTestId("react-controlled");
  assert.equal(await controlled.evaluate(element => element.value), "yearly");
  assert.equal(await page.getByRole("group", { name: "Billing cycle" }).count(), 1);
  assert.equal(await controlled.evaluate(element => element.shadowRoot.querySelector("fieldset").dataset.layout), "horizontal-stacked");
  assert.deepEqual(await controlled.evaluate(element => [...element.shadowRoot.querySelectorAll("label")].map(label => getComputedStyle(label).flexDirection)), ["row", "column"], "individual label position overrides the horizontal-stacked default");
  assert.equal(await controlled.evaluate(element => element.shadowRoot.querySelector('input[data-testid="radio-input-slot"]')?.getAttribute("aria-label")), "Monthly Billing", "React input slot attributes reach the native radio");
  assert.equal(await controlled.evaluate(element => element.shadowRoot.querySelector('input[data-testid="radio-input-slot"]')?.classList.contains("custom-radio-input")), true, "React input slot class reaches the native radio");
  assert.equal(await controlled.evaluate(element => element.shadowRoot.querySelector('input[data-testid="radio-input-slot"]')?.getAttribute("inputmode")), "numeric", "React input slot forwards native inputMode attributes");
  assert.equal(await controlled.evaluate(element => element.shadowRoot.querySelector('input[data-testid="radio-input-slot"]')?.getAttribute("autocomplete")), "one-time-code", "React input slot forwards native autoComplete attributes");
  assert.equal(await controlled.evaluate(element => element.shadowRoot.querySelector('input[data-testid="radio-input-slot"]')?.getAttribute("data-automation")), "radio-root-prop", "native Radio props reach the input slot");
  assert.equal(await controlled.evaluate(element => element.querySelector("spui-radio-option")?.getAttribute("class")), "monthly-radio-root", "React className becomes the standard class attribute on custom elements");
  assert.equal(await controlled.evaluate(element => element.shadowRoot.querySelector("label.monthly-radio-root")?.style.outline), "red solid 1px", "Radio root class and style reach the label root");
  assert.equal(await page.getByRole("radio", { name: "Monthly Billing" }).count(), 1, "custom React label slot defines the accessible name");
  assert.equal(await controlled.evaluate(element => element.shadowRoot.querySelector('label [data-testid="radio-label-slot"]')?.textContent), "Monthly Billing", "custom React label content is projected into the visible control");
  assert.equal(await controlled.evaluate(element => element.shadowRoot.querySelector('label .radio-indicator[data-testid="radio-indicator-slot"]')?.hidden), false, "custom React indicator is rendered in the radio control");
  await page.getByRole("radio", { name: "Yearly" }).focus();
  await page.getByRole("radio", { name: "Yearly" }).press("ArrowLeft");
  await page.waitForFunction(() => window.changedValue === "monthly" && window.legacyValue === "monthly" && window.optionValue === "monthly" && document.querySelector('[data-testid="react-controlled"]').value === "monthly");
  assert.deepEqual(await page.evaluate(() => window.reactChange), { currentTarget: "DIV", target: "INPUT", nativeType: "change", preventDefault: "function", isDefaultPrevented: "function" }, "React RadioGroup receives Fluent-shaped currentTarget, native target, and event methods");
  assert.deepEqual(await page.evaluate(() => window.optionChange), { target: "INPUT", currentTarget: "INPUT", nativeType: "change", sameTarget: true, nativeCurrentTarget: true }, "Radio onChange exposes Fluent's native input event shape");
  assert.equal(await controlled.evaluate(element => element.value), "monthly");
  assert.deepEqual(await page.locator("#controlled").evaluate(form => [...new FormData(form).entries()]), [["billing", "monthly"]]);
  await page.getByRole("radio", { name: "Other" }).click();
  assert.equal(await page.getByTestId("react-static").evaluate(element => element.value), "fixed", "controlled value stays authoritative when the owner does not update it");

  const uncontrolled = page.getByTestId("react-default");
  assert.equal(await uncontrolled.evaluate(element => element.value), "pro");
  assert.equal(await uncontrolled.evaluate(element => element.defaultValue), "pro");
  await page.getByRole("radio", { name: "Basic" }).check();
  assert.deepEqual(await page.locator("#uncontrolled").evaluate(form => [...new FormData(form).entries()]), [["plan", "basic"]]);
  await page.getByRole("button", { name: "Reset plans" }).click();
  assert.equal(await uncontrolled.evaluate(element => element.value), "pro");

  const required = page.getByTestId("react-required");
  assert.equal(await required.evaluate(element => element.checkValidity()), false);
  assert.equal(await required.evaluate(element => element.validity.valueMissing), true);
  assert.ok(await required.evaluate(element => element.validationMessage.length > 0));
  await page.getByRole("radio", { name: "Choice B" }).check();
  assert.equal(await required.evaluate(element => element.checkValidity()), true);

  const native = page.getByTestId("native-group");
  assert.equal(await native.evaluate(element => element.shadowRoot.querySelector('input[data-testid="native-radio-input-slot"]')?.value), "ltr", "native input slot keeps the group value");
  assert.equal(await native.evaluate(element => element.shadowRoot.querySelector('input[data-testid="native-radio-input-slot"]')?.getAttribute("inputmode")), "decimal", "native input slot forwards standard input attributes");
  assert.equal(await native.evaluate(element => element.shadowRoot.querySelector('input[data-testid="native-radio-input-slot"]')?.getAttribute("autocomplete")), "email", "native input slot preserves browser input hints");
  assert.equal(await native.evaluate(element => element.shadowRoot.querySelector('label .radio-indicator[data-testid="native-radio-indicator-slot"]')?.textContent), "✦", "native indicator slot content is projected into the control");
  assert.equal(await native.evaluate(element => element.defaultValue), "rtl");
  assert.equal(await native.evaluate(element => element.value), "rtl");
  assert.equal(await native.evaluate(element => element.shadowRoot.querySelector("fieldset").dataset.layout), "horizontal-stacked");
  const rtlGeometry = await native.evaluate(element => ({ input: element.shadowRoot.querySelector("input:checked").getBoundingClientRect(), text: element.shadowRoot.querySelector("input:checked").nextElementSibling.getBoundingClientRect() }));
  assert.ok(rtlGeometry.input.x > rtlGeometry.text.x, "native label order follows RTL direction");
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["nativeChoice", "rtl"]]);
  const nativeDisabled = page.getByTestId("native-disabled");
  assert.equal(await nativeDisabled.evaluate(element => element.shadowRoot.querySelector("input").disabled), true);
  await page.locator("#native-form > fieldset").evaluate(element => { element.disabled = false; });
  assert.equal(await nativeDisabled.evaluate(element => element.shadowRoot.querySelector("input").disabled), false);
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["nativeChoice", "rtl"], ["disabledChoice", "yes"]]);
  await native.getByRole("radio", { name: "Left to right" }).check();
  await page.getByRole("button", { name: "Reset native" }).click();
  assert.equal(await native.evaluate(element => element.value), "rtl");
  const focusedOption = native.getByRole("radio", { name: "Left to right" });
  await focusedOption.focus();
  await focusedOption.evaluate(input => { input.dataset.focusIdentity = "retained"; });
  await native.locator("spui-radio-option").first().evaluate(option => { option.firstChild.data = "Updated left-to-right label"; option.querySelector("[slot=label]").textContent = "Updated left-to-right label"; });
  const updatedFocusedOption = native.getByRole("radio", { name: "Updated left-to-right label" });
  await updatedFocusedOption.waitFor();
  assert.equal(await updatedFocusedOption.getAttribute("data-focus-identity"), "retained", "text-only option updates preserve the native radio input and its focus");
  assert.equal(await updatedFocusedOption.evaluate(input => input === input.getRootNode().activeElement), true, "updated label keeps keyboard focus on the radio input");
  assert.equal(await native.evaluate(element => element.value), "rtl", "text-only option updates preserve selection");
  const performance = await page.evaluate(() => {
    const percentile = (samples, fraction) => [...samples].sort((a, b) => a - b)[Math.min(samples.length - 1, Math.ceil(samples.length * fraction) - 1)];
    const mountSamples = {};
    for (const count of [1, 20, 100]) {
      const samples = [];
      for (let run = 0; run < 10; run++) {
        const fixture = document.createElement("div");
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < count; index++) {
          const group = document.createElement("spui-radio-group");
          group.setAttribute("label", "Benchmark choice");
          group.setAttribute("name", `bench-${run}-${index}`);
          group.innerHTML = "<spui-radio-option value='a'>Option A</spui-radio-option><spui-radio-option value='b'>Option B</spui-radio-option>";
          fragment.append(group);
        }
        fixture.append(fragment);
        const start = performance.now();
        document.body.append(fixture);
        fixture.querySelector("spui-radio-group").getBoundingClientRect();
        samples.push(performance.now() - start);
        fixture.remove();
      }
      mountSamples[count] = { samples: samples.length, p50Ms: percentile(samples, 0.5), p95Ms: percentile(samples, 0.95) };
    }
    const group = document.createElement("spui-radio-group");
    group.setAttribute("label", "Dispatch benchmark");
    group.setAttribute("name", "dispatch-benchmark");
    group.innerHTML = "<spui-radio-option value='a'>Option A</spui-radio-option><spui-radio-option value='b'>Option B</spui-radio-option>";
    document.body.append(group);
    let observed = 0;
    group.addEventListener("spui-change", () => observed++);
    const radios = [...group.shadowRoot.querySelectorAll("input")];
    const samples = [];
    for (let index = 0; index < 50; index++) {
      const radio = radios[index % 2];
      const start = performance.now();
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
      samples.push(performance.now() - start);
    }
    group.remove();
    return { mountSamples, selectionDispatchMs: { samples: samples.length, p50Ms: percentile(samples, 0.5), p95Ms: percentile(samples, 0.95), observedChanges: observed } };
  });
  assert.equal(performance.selectionDispatchMs.observedChanges, 50);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactControlledAndDefault: true, changeDataAndLegacyCallback: true, radioItemCallback: true, horizontalStacked: true, requiredValidity: true, formData: true, reset: true, fieldsetDisabled: true, rtl: true, dynamicOptionTextPreservesFocus: true, pageErrors: errors.length, performance }));
} finally { await browser?.close(); server.close(); }
