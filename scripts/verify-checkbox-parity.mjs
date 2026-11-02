import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: { contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { Checkbox, Switch } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import { defineCheckbox, defineSwitch } from "${resolve("packages/sharepoint-ui/src/elements/toggle.ts")}"; function App(){const [checked,setChecked]=React.useState("mixed");return <><form id="react-form"><Checkbox data-testid="react-mixed" label="Select all" name="selection" value="all" checked={checked} onCheckedChange={value=>{window.reactChecked=value;setChecked(value)}} onChange={(event,data)=>{window.reactStateChanged=data.checked;window.reactChange={target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeType:event.nativeEvent.type,sameTarget:event.target===event.currentTarget,nativeCurrentTarget:event.nativeEvent.currentTarget===event.currentTarget}}}/><Checkbox data-testid="react-default" label="Default checked" name="default" value="yes" defaultChecked/><Checkbox data-testid="react-slotted" label={<span data-testid="custom-checkbox-label">Slotted checkbox</span>} name="slotted" value="ready" defaultChecked input={{"data-testid":"custom-checkbox-input",className:"slot-input"}} indicator={<span data-testid="custom-checkbox-indicator">✓</span>}/><Checkbox data-testid="react-slot-element" label="Element slot" input={<input data-testid="checkbox-element-input"/>} indicator={<span>★</span>}/><Checkbox data-testid="react-required" label="Required" name="required" required/><Checkbox data-testid="react-small-hit" aria-label="Small standalone checkbox" size="small" dir="rtl"/><fieldset id="react-fieldset" disabled><Checkbox data-testid="react-fieldset-check" label="Fieldset choice" name="fieldset" value="enabled" defaultChecked/></fieldset><button type="reset">Reset</button></form><form id="switch-form"><Switch data-testid="react-switch" name="alerts" value="on" defaultChecked size="small" labelPosition="above" onChange={(event,data)=>{window.switchChanged=data.checked;window.switchEvent={target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeType:event.nativeEvent.type,sameTarget:event.target===event.currentTarget,nativeCurrentTarget:event.nativeEvent.currentTarget===event.currentTarget}}}>Alerts</Switch><Switch data-testid="react-switch-label-prop" label="Use label prop" name="label-prop" /><Switch data-testid="react-switch-slotted" label="Slotted alerts" name="slottedAlerts" value="yes" defaultChecked input={<input data-testid="switch-input-element"/>} indicator={<span data-testid="switch-indicator-element">●</span>}/></form></>} createRoot(document.querySelector("#react")).render(<App/>); window.mountNative=()=>{defineCheckbox();defineSwitch();const form=document.createElement("form");form.id="native-form";const checkbox=document.createElement("spui-checkbox");checkbox.dataset.testid="native-mixed";checkbox.setAttribute("checked","mixed");checkbox.setAttribute("shape","circular");checkbox.setAttribute("size","large");checkbox.setAttribute("label-position","before");checkbox.setAttribute("dir","rtl");checkbox.setAttribute("aria-label","Mixed selection");checkbox.setAttribute("name","nativeSelection");checkbox.setAttribute("value","mixed");form.append(checkbox);const required=document.createElement("spui-checkbox");required.dataset.testid="native-required";required.setAttribute("required","");required.setAttribute("name","nativeRequired");required.textContent="Required native";form.append(required);const fieldset=document.createElement("fieldset");fieldset.disabled=true;const disabled=document.createElement("spui-checkbox");disabled.dataset.testid="native-fieldset";disabled.setAttribute("default-checked","");disabled.setAttribute("name","nativeDisabled");disabled.textContent="Disabled fieldset";fieldset.append(disabled);form.append(fieldset);const reset=document.createElement("button");reset.type="reset";reset.textContent="Reset native";form.append(reset);const slotted=document.createElement("spui-checkbox");slotted.dataset.testid="native-slotted";slotted.setAttribute("checked","mixed");slotted.setAttribute("aria-label","Native slotted checkbox");const nativeInput=document.createElement("input");nativeInput.slot="input";nativeInput.dataset.testid="native-checkbox-input";const nativeIndicator=document.createElement("span");nativeIndicator.slot="indicator";nativeIndicator.dataset.testid="native-checkbox-indicator";nativeIndicator.textContent="✓";slotted.append(nativeInput,nativeIndicator);const switchForm=document.createElement("form");switchForm.id="native-switch-form";const switchHost=document.createElement("spui-switch");switchHost.dataset.testid="native-switch-slotted";switchHost.setAttribute("default-checked","");switchHost.setAttribute("name","nativeSwitch");switchHost.setAttribute("value","on");const switchInput=document.createElement("input");switchInput.slot="input";switchInput.dataset.testid="native-switch-input";const switchIndicator=document.createElement("span");switchIndicator.slot="indicator";switchIndicator.dataset.testid="native-switch-indicator";switchIndicator.textContent="●";const switchLabel=document.createElement("span");switchLabel.slot="label";switchLabel.textContent="Native slotted switch";switchHost.append(switchInput,switchIndicator,switchLabel);switchForm.append(switchHost);document.querySelector("#native").append(form,slotted,switchForm)};`,
    resolveDir: process.cwd(), sourcefile: "checkbox-check.tsx", loader: "tsx",
  },
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
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  assert.equal(await page.getByRole("switch", { name: "Use label prop" }).count(), 1, "Switch label prop provides its accessible name");
  const reactSwitchSlot = page.getByTestId("react-switch-slotted");
  assert.equal(await page.getByTestId("switch-input-element").getAttribute("type"), "checkbox");
  assert.equal(await page.getByTestId("switch-input-element").getAttribute("role"), "switch");
  assert.equal(await reactSwitchSlot.locator('[slot="indicator"]').getAttribute("aria-hidden"), "true");
  assert.equal(await reactSwitchSlot.evaluate(element => element.shadowRoot.querySelector(".indicator").dataset.state), "checked");
  assert.equal(await page.getByRole("switch", { name: "Slotted alerts" }).count(), 1, JSON.stringify(await reactSwitchSlot.evaluate(element => ({host:element.outerHTML,root:element.shadowRoot.innerHTML,flat:element.shadowRoot.querySelector("slot[name=label]").assignedElements().map(x=>x.outerHTML),input:element.shadowRoot.querySelector("slot[name=input]").assignedElements().map(x=>x.outerHTML)}))));
  assert.equal(await page.getByTestId("native-switch-input").getAttribute("role"), "switch", "native input slot receives switch semantics");
  assert.equal(await page.getByRole("switch", { name: "Native slotted switch" }).count(), 1, "native label slot names the switch");
  assert.equal(await page.getByTestId("native-switch-slotted").evaluate(element => element.shadowRoot.querySelector(".indicator").dataset.state), "checked");
  assert.deepEqual(await page.locator("#native-switch-form").evaluate(form => [...new FormData(form).entries()]), [["nativeSwitch", "on"]]);
  const reactSlotted = page.getByTestId("react-slotted");
  assert.equal(await reactSlotted.locator('[slot="input"]').getAttribute("class"), "slot-input");
  assert.equal(await reactSlotted.locator('[slot="input"]').getAttribute("type"), "checkbox");
  assert.equal(await reactSlotted.locator('[slot="indicator"]').getAttribute("aria-hidden"), "true");
  assert.equal(await reactSlotted.locator('[slot="label"]').getAttribute("data-testid"), "custom-checkbox-label");
  assert.equal(await reactSlotted.evaluate(element => element.shadowRoot.querySelector(".indicator").dataset.state), "checked");
  assert.equal(await page.getByRole("checkbox", { name: "Slotted checkbox", exact: true }).count(), 1);
  await reactSlotted.locator('[slot="input"]').uncheck();
  await page.waitForFunction(() => document.querySelector('[data-testid="react-slotted"]').shadowRoot.querySelector(".indicator").dataset.state === "unchecked");
  await reactSlotted.locator('[slot="input"]').check();
  await page.waitForFunction(() => document.querySelector('[data-testid="react-slotted"]').shadowRoot.querySelector(".indicator").dataset.state === "checked");
  assert.equal(await page.getByTestId("checkbox-element-input").getAttribute("type"), "checkbox", "React element slots are normalized to checkbox semantics");
  const nativeSlotted = page.getByTestId("native-slotted");
  assert.equal(await nativeSlotted.locator('[slot="input"]').evaluate(input => input.indeterminate), true);
  assert.equal(await nativeSlotted.evaluate(element => element.shadowRoot.querySelector(".indicator").dataset.state), "mixed");
  assert.equal(await nativeSlotted.locator('[slot="indicator"]').getAttribute("data-testid"), "native-checkbox-indicator");

  const nativeMixed = page.getByTestId("native-mixed");
  assert.equal(await nativeMixed.evaluate(element => element.checked), "mixed");
  assert.equal(await nativeMixed.evaluate(element => element.shadowRoot.querySelector("input").indeterminate), true);
  assert.equal(await nativeMixed.evaluate(element => element.shadowRoot.querySelector("input").checked), false);
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [], "mixed checkboxes do not submit a checked value");
  assert.equal(await page.getByRole("checkbox", { name: "Mixed selection" }).count(), 1, "native internal input keeps its accessible checkbox role and name");
  const nativeInput = nativeMixed.locator("input");
  assert.equal(await nativeInput.evaluate(input => getComputedStyle(input).borderRadius), "50%");
  assert.equal(await nativeInput.evaluate(input => input.getBoundingClientRect().width), 20);
  assert.equal(await nativeInput.evaluate(input => input.getAttribute("aria-checked")), null, "native checkbox semantics remain exposed to assistive technology");
  const rtlLabelGeometry = await nativeMixed.evaluate(element => ({ input: element.shadowRoot.querySelector("input").getBoundingClientRect(), text: element.shadowRoot.querySelector("label > span:last-child").getBoundingClientRect() }));
  assert.ok(rtlLabelGeometry.input.x < rtlLabelGeometry.text.x, "before label position follows RTL reading order");
  assert.equal(await nativeMixed.getAttribute("label-position"), "before");
  assert.equal(await nativeMixed.evaluate(element => element.checkValidity()), true);

  const nativeRequired = page.getByTestId("native-required");
  assert.equal(await nativeRequired.evaluate(element => element.checkValidity()), false);
  assert.equal(await nativeRequired.evaluate(element => element.validity.valueMissing), true);
  assert.ok(await nativeRequired.evaluate(element => element.validationMessage.length > 0), "required state exposes localized browser validation text");
  const nativeRequiredInput = nativeRequired.locator("input");
  await nativeRequiredInput.check();
  assert.equal(await nativeRequired.evaluate(element => element.checkValidity()), true);

  const nativeFieldset = page.getByTestId("native-fieldset");
  assert.equal(await nativeFieldset.evaluate(element => element.shadowRoot.querySelector("input").disabled), true);
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["nativeRequired", "on"]]);
  await page.locator("#native-form fieldset").evaluate(element => { element.disabled = false; });
  assert.equal(await nativeFieldset.evaluate(element => element.shadowRoot.querySelector("input").disabled), false);
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["nativeRequired", "on"],["nativeDisabled", "on"]]);
  await nativeRequiredInput.uncheck();
  await page.getByText("Reset native").click();
  assert.equal(await nativeFieldset.evaluate(element => element.checked), true, "form reset restores the custom element default");

  const reactMixed = page.getByTestId("react-mixed");
  assert.equal(await reactMixed.evaluate(element => element.checked), "mixed");
  await reactMixed.locator("input").check();
  await page.waitForFunction(() => window.reactChecked === true);
  assert.equal(await page.evaluate(() => window.reactStateChanged), true, "Fluent-style onChange reports the tri-state value");
  assert.deepEqual(await page.evaluate(() => window.reactChange), { target: "INPUT", currentTarget: "INPUT", nativeType: "change", sameTarget: true, nativeCurrentTarget: true }, "Checkbox onChange exposes Fluent's input event shape");
  assert.equal(await reactMixed.evaluate(element => element.checked), true);
  assert.deepEqual(await page.locator("#react-form").evaluate(form => [...new FormData(form).entries()]), [["selection", "all"],["default", "yes"],["slotted", "ready"]]);
  await page.locator("#react-fieldset").evaluate(element => { element.disabled = false; });
  await page.waitForFunction(() => !document.querySelector('[data-testid="react-fieldset-check"]').shadowRoot.querySelector("input").disabled);
  assert.deepEqual(await page.locator("#react-form").evaluate(form => [...new FormData(form).entries()]), [["selection", "all"],["default", "yes"],["slotted", "ready"],["fieldset", "enabled"]]);

  const reactRequired = page.getByTestId("react-required");
  assert.equal(await reactRequired.evaluate(element => element.checkValidity()), false);
  await reactRequired.locator("input").check();
  assert.equal(await reactRequired.evaluate(element => element.checkValidity()), true);
  const smallHitTarget = page.getByTestId("react-small-hit");
  const smallHitBounds = await smallHitTarget.evaluate(element => { const rect = element.shadowRoot.querySelector("label").getBoundingClientRect(); return { width: rect.width, height: rect.height, inputWidth: element.shadowRoot.querySelector("input").getBoundingClientRect().width }; });
  assert.ok(smallHitBounds.width >= 24 && smallHitBounds.height >= 24, `small icon-only checkbox hit target meets 24px minimum in RTL: ${JSON.stringify(smallHitBounds)}`);
  assert.equal(smallHitBounds.inputWidth, 14, "larger pointer target does not visually enlarge the compact control");
  await smallHitTarget.locator("input").focus();
  await page.keyboard.press("Space");
  assert.equal(await smallHitTarget.evaluate(element => element.checked), true, "expanded label target preserves native keyboard operation");
  const reactDefault = page.getByTestId("react-default");
  await reactDefault.locator("input").uncheck();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  assert.equal(await reactDefault.evaluate(element => element.checked), true, "React defaultChecked resets with its form");
  const switchElement = page.getByTestId("react-switch");
  assert.equal(await switchElement.evaluate(element => element.shadowRoot.querySelector("input").getAttribute("role")), "switch");
  assert.equal(await switchElement.getAttribute("size"), "small");
  assert.equal(await switchElement.evaluate(element => element.shadowRoot.querySelector("input").getBoundingClientRect().width), 32);
  assert.equal(await switchElement.evaluate(element => getComputedStyle(element.shadowRoot.querySelector("label")).flexDirection), "column");
  assert.deepEqual(await switchElement.evaluate(element => { const rect = element.shadowRoot.querySelector(".indicator").getBoundingClientRect(), thumb = getComputedStyle(element.shadowRoot.querySelector(".indicator"), "::after"); return { width: rect.width, height: rect.height, thumbWidth: parseFloat(thumb.width), thumbHeight: parseFloat(thumb.height) }; }), { width: 32, height: 16, thumbWidth: 14, thumbHeight: 14 });
  await switchElement.evaluate(element => { element.setAttribute("size", "medium"); element.setAttribute("label-position", "before"); });
  assert.deepEqual(await switchElement.evaluate(element => { const input = element.shadowRoot.querySelector("input"), rect = input.getBoundingClientRect(), thumb = getComputedStyle(input, "::after"); return { width: rect.width, height: rect.height, thumbWidth: parseFloat(thumb.width), thumbHeight: parseFloat(thumb.height) }; }), { width: 40, height: 20, thumbWidth: 18, thumbHeight: 18 });
  assert.equal(await switchElement.evaluate(element => getComputedStyle(element.shadowRoot.querySelector("label")).flexDirection), "row-reverse");
  assert.deepEqual(await switchElement.evaluate(element => { const rect = element.shadowRoot.querySelector(".indicator").getBoundingClientRect(), thumb = getComputedStyle(element.shadowRoot.querySelector(".indicator"), "::after"); return { width: rect.width, height: rect.height, thumbWidth: parseFloat(thumb.width), thumbHeight: parseFloat(thumb.height) }; }), { width: 40, height: 20, thumbWidth: 18, thumbHeight: 18 });
  await switchElement.locator("input").uncheck();
  await page.waitForFunction(() => window.switchChanged === false);
  await switchElement.locator("input").check();
  await page.waitForFunction(() => window.switchChanged === true);
  assert.deepEqual(await page.evaluate(() => window.switchEvent), { target: "INPUT", currentTarget: "INPUT", nativeType: "change", sameTarget: true, nativeCurrentTarget: true }, "Switch onChange exposes Fluent's input event shape");
  assert.deepEqual(await page.locator("#switch-form").evaluate(form => [...new FormData(form).entries()]), [["alerts", "on"],["slottedAlerts", "yes"]]);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactAndCustomElement: true, mixedTriState: true, squareCircularAndSize: true, labelPosition: true, smallHitTarget: smallHitBounds, formData: true, requiredValidity: true, fieldsetDisabled: true, formReset: true, switchRole: true, switchLabelProp: await page.getByRole("switch", { name: "Use label prop" }).count() === 1, switchMediumDimensions: true, pageErrors: errors.length }));
} finally { await browser?.close(); server.close(); }
