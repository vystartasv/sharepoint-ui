import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium, webkit } from "playwright";
import ts from "typescript";

const browserType = process.env.SPUI_BROWSER === "webkit" ? webkit : chromium;

const typeFixturePath = resolve("packages/sharepoint-ui/src/.input-change-type-contract.tsx");
const typeFixture = `
  import * as React from "react";
  import { Input, type InputProps } from "./react.js";
  type Assert<T extends true> = T;
  type InputChangeEvent = NonNullable<InputProps["onChange"]> extends (event: infer TEvent, data: { value: string }) => void ? TEvent : never;
  type EventMatchesFluent = Assert<InputChangeEvent extends React.ChangeEvent<HTMLInputElement> ? true : false>;
  const usage = <Input aria-label="Quantity" type="number" onChange={(event, data) => {
    const inputValue: string = event.currentTarget.value;
    const checked: boolean = event.currentTarget.checked;
    const value: string = data.value;
    void [inputValue, checked, value];
  }} />;
`;
const configPath = resolve("packages/sharepoint-ui/tsconfig.json");
const configRead = ts.readConfigFile(configPath, ts.sys.readFile);
assert.equal(configRead.error, undefined, "library tsconfig is readable");
const parsedConfig = ts.parseJsonConfigFileContent(configRead.config, ts.sys, resolve("packages/sharepoint-ui"));
const typeOptions = { ...parsedConfig.options, noEmit: true, rootDir: undefined };
const host = ts.createCompilerHost(typeOptions);
const originalFileExists = host.fileExists.bind(host);
const originalReadFile = host.readFile.bind(host);
const originalGetSourceFile = host.getSourceFile.bind(host);
host.fileExists = file => resolve(file) === typeFixturePath || originalFileExists(file);
host.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => resolve(file) === typeFixturePath
  ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX)
  : originalGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile);
const typeProgram = ts.createProgram([typeFixturePath], typeOptions, host);
const typeErrors = ts.getPreEmitDiagnostics(typeProgram).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], "Input onChange event matches Fluent's ChangeEvent<HTMLInputElement> contract");

const bundle = await build({
  stdin: { contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {Input} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import {defineInput} from "${resolve("packages/sharepoint-ui/src/elements/input.ts")}"; function App(){const [value,setValue]=React.useState("email@example.com");const [checked,setChecked]=React.useState(true);return <><form id="controlled"><Input data-testid="react-controlled" type="email" aria-label="Email" name="email" required value={value} size="small" appearance="filled-darker-shadow" contentBefore={<b>From</b>} contentAfter={<b>.org</b>} onValueChange={next=>window.legacyValue=next} onChange={(event,data)=>{window.changeValue=data.value;window.eventTargetValue=event.target.value;window.eventCurrentTargetValue=event.currentTarget.value;setValue(data.value)}}/></form><form id="uncontrolled"><Input data-testid="react-default" aria-label="Notes" name="notes" defaultValue="draft"/><button type="reset">Reset notes</button></form><form id="static-controlled"><Input data-testid="react-static" aria-label="Static" value="fixed"/></form><form id="slot-form"><Input data-testid="input-slot" aria-label="Slot field" name="slotField" value="slot-value" input={{"data-testid":"slotted-input",className:"custom-input"}}/><Input data-testid="input-element" aria-label="Number field" name="number" value="7" input={<input type="number" min={0} data-testid="number-input"/>}/></form><form id="native-prop-form"></form><Input data-testid="native-props" type="number" aria-label="Bounded quantity" form="native-prop-form" name="quantity" value={6} min={2} max={10} step="2" autoComplete="off"/><form id="checkbox-default-form"><Input data-testid="checkbox-default" type="checkbox" aria-label="Opt in" name="optIn" value="yes" defaultChecked/><button type="reset">Reset checkbox</button></form><form id="checkbox-controlled-form"><Input data-testid="checkbox-controlled" type="checkbox" aria-label="Controlled opt in" name="controlledOptIn" value="active" checked={checked} onChange={event=>setChecked(event.currentTarget.checked)}/></form></>} createRoot(document.querySelector("#react")).render(<App/>); window.mountNative=()=>{defineInput();const form=document.createElement("form");form.id="native-form";const empty=document.createElement("spui-input");empty.dataset.testid="native-empty";empty.setAttribute("aria-label","Empty value");empty.setAttribute("name","empty");empty.setAttribute("value","");form.append(empty);const slotted=document.createElement("spui-input");slotted.dataset.testid="native-slotted";slotted.setAttribute("aria-label","Native slotted");slotted.setAttribute("name","nativeSlot");const nativeInput=document.createElement("input");nativeInput.slot="input";nativeInput.defaultValue="native-slot";slotted.append(nativeInput);form.append(slotted);const fieldset=document.createElement("fieldset");fieldset.disabled=true;const disabled=document.createElement("spui-input");disabled.dataset.testid="native-disabled";disabled.setAttribute("aria-label","Disabled fieldset input");disabled.setAttribute("name","disabledInput");disabled.setAttribute("value","kept");fieldset.append(disabled);form.append(fieldset);const reset=document.createElement("button");reset.type="reset";reset.textContent="Reset native";form.append(reset);document.querySelector("#native").append(form)};` , resolveDir: process.cwd(), sourcefile: "input-check.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='react'></main><main id='native'></main><script src='/bundle.js'></script><script>window.mountNative()</script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await browserType.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const controlled = page.getByTestId("react-controlled");
  assert.equal(await controlled.evaluate(element => element.value), "email@example.com");
  assert.equal(await controlled.evaluate(element => element.shadowRoot.querySelector(".control").getBoundingClientRect().height), 24);
  assert.equal(await controlled.evaluate(element => element.getAttribute("appearance")), "filled-darker-shadow");
  assert.ok(await controlled.evaluate(element => getComputedStyle(element.shadowRoot.querySelector(".control")).boxShadow !== "none"));
  assert.equal(await controlled.evaluate(element => getComputedStyle(element.shadowRoot.querySelector(".control")).transitionDuration), "0s", "reduced motion removes animation without hiding state");
  const themeContrast = await controlled.evaluate(element => {
    const luminance = color => {
      const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255)
        .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const contrast = (foreground, background) => {
      const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
    };
    const cases = [
      ["blue-light", "#0078d4", "#ffffff"], ["green-light", "#107c10", "#ffffff"], ["pink-light", "#c239b3", "#ffffff"],
      ["blue-dark", "#0078d4", "#1b1b1b"], ["green-dark", "#107c10", "#1b1b1b"], ["pink-dark", "#c239b3", "#1b1b1b"],
    ];
    const input = element.shadowRoot.querySelector("input");
    const control = element.shadowRoot.querySelector(".control");
    element.setAttribute("appearance", "outline");
    const results = cases.map(([name, accent, surface]) => {
      element.style.setProperty("--spui-focus-ring", accent);
      element.style.setProperty("--spui-ui-accent", accent);
      element.style.setProperty("--spui-ui-surface", surface);
      input.focus();
      const border = getComputedStyle(control).borderTopColor;
      const background = getComputedStyle(control).backgroundColor;
      return { name, ratio: contrast(border, background), tokenApplied: border === `rgb(${parseInt(accent.slice(1, 3), 16)}, ${parseInt(accent.slice(3, 5), 16)}, ${parseInt(accent.slice(5, 7), 16)})` };
    });
    for (const token of ["--spui-focus-ring", "--spui-ui-accent", "--spui-ui-surface"]) element.style.removeProperty(token);
    element.setAttribute("appearance", "filled-darker-shadow");
    input.blur();
    return results;
  });
  assert.ok(themeContrast.every(theme => theme.tokenApplied && theme.ratio >= 3), `focus indicator contrast must be at least 3:1: ${JSON.stringify(themeContrast)}`);
  await page.emulateMedia({ forcedColors: "active" });
  await controlled.locator("input").focus();
  assert.equal(await controlled.evaluate(element => getComputedStyle(element.shadowRoot.querySelector(".control")).outlineStyle), "solid", "forced colors preserves a system focus outline");
  await page.emulateMedia({ forcedColors: "none" });
  await controlled.locator("input").blur();
  assert.equal(await controlled.locator('[slot="before"]').innerText(), "From");
  assert.equal(await controlled.locator('[slot="after"]').innerText(), ".org");
  assert.equal(await page.getByRole("textbox", { name: "Email" }).count(), 1);
  await controlled.locator("input").fill("typed@example.com");
  await page.waitForFunction(() => window.changeValue === "typed@example.com" && window.legacyValue === "typed@example.com" && document.querySelector('[data-testid="react-controlled"]').value === "typed@example.com");
  assert.equal(await page.evaluate(() => window.eventTargetValue), "typed@example.com", "onChange receives the pre-restoration value on its event target");
  assert.equal(await page.evaluate(() => window.eventCurrentTargetValue), "typed@example.com", "onChange currentTarget points to the native input during dispatch");
  assert.deepEqual(await page.locator("#controlled").evaluate(form => [...new FormData(form).entries()]), [["email", "typed@example.com"]]);
  await page.getByTestId("react-static").locator("input").fill("changed");
  assert.equal(await page.getByTestId("react-static").evaluate(element => element.value), "fixed", "controlled value remains authoritative when the owner does not update it");
  const propSlot = page.getByTestId("input-slot");
  assert.equal(await propSlot.locator('[slot="input"]').getAttribute("class"), "custom-input");
  assert.equal(await propSlot.locator('[slot="input"]').inputValue(), "slot-value");
  assert.equal(await page.getByRole("textbox", { name: "Slot field" }).count(), 1);
  assert.equal(await propSlot.evaluate(element => element.shadowRoot.querySelector(".input-fallback").hidden), true, "a native slotted input hides the fallback control");
  const checkboxFallback = page.getByTestId("checkbox-default");
  assert.equal(await checkboxFallback.evaluate(element => element.shadowRoot.querySelector(".input-fallback").hidden), false, "controls without a native slot keep the fallback interactive");
  const elementSlot = page.getByTestId("input-element");
  assert.equal(await elementSlot.locator('[slot="input"]').getAttribute("type"), "number", "native input element slot keeps its type");
  assert.equal(await elementSlot.locator('[slot="input"]').inputValue(), "7");
  assert.deepEqual(await page.locator("#slot-form").evaluate(form => [...new FormData(form).entries()]), [["slotField", "slot-value"],["number", "7"]]);
  const nativeProps = page.getByTestId("native-props");
  for (const [name, expected] of [["form", "native-prop-form"], ["min", "2"], ["max", "10"], ["step", "2"], ["autocomplete", "off"]]) assert.equal(await nativeProps.locator("input").getAttribute(name), expected, `native input ${name} prop is forwarded`);
  assert.deepEqual(await page.locator("#native-prop-form").evaluate(form => [...new FormData(form).entries()]), [["quantity", "6"]], "external form attribute associates the form-aware Input");
  const defaultCheckbox = page.getByTestId("checkbox-default");
  const defaultCheckboxInput = defaultCheckbox.locator("input");
  const checkboxGeometry = await defaultCheckboxInput.evaluate(input => { const rect = input.getBoundingClientRect(); const control = input.getRootNode().host.shadowRoot.querySelector(".control"); const controlRect = control.getBoundingClientRect(); const style = getComputedStyle(input); return { hidden: input.hidden, display: style.display, visibility: style.visibility, opacity: style.opacity, width: rect.width, height: rect.height, controlWidth: controlRect.width, controlHeight: controlRect.height }; });
  assert.equal(await defaultCheckboxInput.isVisible(), true, JSON.stringify(checkboxGeometry));
  assert.equal(await defaultCheckbox.locator("input").isChecked(), true, "defaultChecked reaches the native checkbox");
  assert.deepEqual(await page.locator("#checkbox-default-form").evaluate(form => [...new FormData(form).entries()]), [["optIn", "yes"]], "checked checkbox contributes its value to FormData");
  await defaultCheckbox.locator("input").uncheck();
  assert.deepEqual(await page.locator("#checkbox-default-form").evaluate(form => [...new FormData(form).entries()]), [], "unchecked checkbox is omitted from FormData");
  await page.getByRole("button", { name: "Reset checkbox" }).click();
  assert.equal(await defaultCheckbox.locator("input").isChecked(), true, "form reset restores defaultChecked");
  const controlledCheckbox = page.getByTestId("checkbox-controlled");
  assert.equal(await controlledCheckbox.locator("input").isChecked(), true);
  await controlledCheckbox.locator("input").click();
  await page.waitForFunction(() => document.querySelector("[data-testid=checkbox-controlled]").checked === false);
  assert.equal(await controlledCheckbox.locator("input").isChecked(), false, "controlled checked state follows its React owner");
  assert.deepEqual(await page.locator("#checkbox-controlled-form").evaluate(form => [...new FormData(form).entries()]), [], "controlled unchecked checkbox is omitted from form data");

  const uncontrolled = page.getByTestId("react-default");
  await uncontrolled.locator("input").fill("edited");
  assert.equal(await uncontrolled.evaluate(element => element.value), "edited");
  await page.getByRole("button", { name: "Reset notes" }).click();
  assert.equal(await uncontrolled.evaluate(element => element.value), "draft");
  assert.deepEqual(await page.locator("#uncontrolled").evaluate(form => [...new FormData(form).entries()]), [["notes", "draft"]]);

  const nativeEmpty = page.getByTestId("native-empty");
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["empty", ""],["nativeSlot", "native-slot"]], "an empty string is still a successful native form value");
  const nativeSlotted = page.getByTestId("native-slotted");
  await page.waitForFunction(() => document.querySelector('[data-testid="native-slotted"]')?.shadowRoot?.querySelector('slot[name="input"]')?.assignedElements().length === 1);
  assert.equal(await nativeSlotted.locator('[slot="input"]').inputValue(), "native-slot");
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["empty", ""],["nativeSlot", "native-slot"]], "native input slot does not double-submit");
  const nativeDisabled = page.getByTestId("native-disabled");
  assert.equal(await nativeDisabled.locator("input").evaluate(input => input.disabled), true);
  await page.locator("#native-form > fieldset").evaluate(fieldset => { fieldset.disabled = false; });
  assert.equal(await nativeDisabled.locator("input").evaluate(input => input.disabled), false);
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["empty", ""],["nativeSlot", "native-slot"], ["disabledInput", "kept"]]);
  await nativeEmpty.evaluate(element => element.value = "reset me");
  await page.getByRole("button", { name: "Reset native" }).click();
  assert.equal(await nativeEmpty.evaluate(element => element.value), "");
  assert.equal(await nativeSlotted.evaluate(element => element.value), "native-slot", "native slot default value restores on form reset");

  const sizes = {};
  for (const [size, height] of [["small", 24], ["medium", 32], ["large", 40]]) {
    await page.evaluate(({ size }) => { const element = document.createElement("spui-input"); element.setAttribute("size", size); element.setAttribute("aria-label", "Size sample"); document.querySelector("#native").append(element); }, { size });
    sizes[size] = await page.locator("spui-input").last().evaluate(element => element.shadowRoot.querySelector(".control").getBoundingClientRect().height);
    assert.equal(sizes[size], height);
    await page.locator("spui-input").last().evaluate(element => element.remove());
  }
  const performance = await page.evaluate(() => {
    const percentile = (samples, fraction) => [...samples].sort((a, b) => a - b)[Math.min(samples.length - 1, Math.ceil(samples.length * fraction) - 1)];
    const mounts = {};
    for (const count of [1, 20, 100]) {
      const samples = [];
      for (let run = 0; run < 10; run++) {
        const fixture = document.createElement("div");
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < count; index++) {
          const input = document.createElement("spui-input");
          input.setAttribute("aria-label", "Benchmark input");
          fragment.append(input);
        }
        fixture.append(fragment);
        const start = performance.now();
        document.body.append(fixture);
        fixture.querySelector("spui-input").getBoundingClientRect();
        samples.push(performance.now() - start);
        fixture.remove();
      }
      mounts[count] = { samples: samples.length, p50Ms: percentile(samples, 0.5), p95Ms: percentile(samples, 0.95) };
    }
    const input = document.createElement("spui-input");
    input.setAttribute("aria-label", "Input event benchmark");
    document.body.append(input);
    const native = input.shadowRoot.querySelector("input");
    let observed = 0;
    input.addEventListener("spui-input", () => observed++);
    const samples = [];
    for (let index = 0; index < 50; index++) {
      const start = performance.now();
      native.value = String(index);
      native.dispatchEvent(new Event("input", { bubbles: true }));
      samples.push(performance.now() - start);
    }
    input.remove();
    return { mountMs: mounts, inputEventMs: { samples: samples.length, p50Ms: percentile(samples, 0.5), p95Ms: percentile(samples, 0.95), observed } };
  });
  assert.equal(performance.inputEventMs.observed, 50);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", browser: browser.version(), slots: true, callbackAndLegacyValue: true, controlledAndDefaultValue: true, appearances: true, sizes, themeContrast, reducedMotion: true, forcedColors: true, formDataEmptyString: true, fieldsetDisabled: true, formReset: true, pageErrors: errors.length, performance }));
} finally { await browser?.close(); server.close(); }
