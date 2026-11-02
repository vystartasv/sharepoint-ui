import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "select-parity.tsx", loader: "tsx", resolveDir: process.cwd(),
  contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Select}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineSelect}from"${resolve("packages/sharepoint-ui/src/elements/select.ts")}";window.changes=[];window.values=[];function App(){const[value,setValue]=React.useState("b");const[multiValue,setMultiValue]=React.useState(["a","b"]);return <><form id="react-form"><Select data-testid="controlled" label="Category" name="category" value={value} autoComplete="off" required size="large" appearance="underline" icon={<span data-testid="custom-icon">⌄</span>} onChange={(event,data)=>{window.changes.push([event.target.value,event.currentTarget===event.target,data.value]);setValue(data.value)}} onValueChange={v=>window.values.push(v)}><option value="">Choose one</option><option value="a">Alpha</option><option value="b">Beta</option></Select><Select data-testid="grouped" label="Grouped" name="grouped" defaultValue="b"><optgroup label="Greek"><option value="a">Alpha</option><option value="b">Beta</option></optgroup></Select><Select data-testid="replacement" label="Replacement" name="replacement" value="y" select={{"data-testid":"replacement-control",className:"custom-select"}}><option value="x">X-ray</option><option value="y">Yankee</option></Select><Select data-testid="element-replacement" label="Element replacement" name="element" value="z" select={<select data-testid="element-select" aria-label="Custom accessible name"><option value="z">Zulu</option><option value="w">Whiskey</option></select>} /><Select data-testid="small" label="Small" defaultValue="a" size="small" appearance="filled-lighter"><option value="a">Alpha</option><option value="b">Beta</option></Select><button type="reset">Reset</button></form><form id="external-form"></form><Select data-testid="external-form-select" label="External form" form="external-form" name="external" value="x"><option value="x">X-ray</option><option value="y">Yankee</option></Select><form id="multiple-form"><Select data-testid="multiple" label="Multiple choices" form="multiple-form" name="choice" multiple defaultValue={["a","b"]} required><option value="a">Alpha</option><option value="b">Beta</option><option value="c">Gamma</option></Select></form><form id="controlled-multiple-form"><Select data-testid="controlled-multiple" label="Controlled multiple choices" form="controlled-multiple-form" name="controlledChoice" multiple value={multiValue} onChange={event=>setMultiValue(Array.from(event.target.selectedOptions,option=>option.value))}><option value="a">Alpha</option><option value="b">Beta</option><option value="c">Gamma</option></Select></form></>};createRoot(document.querySelector("#react")).render(<App/>);window.mountNative=()=>{defineSelect();const form=document.querySelector("#native-form");const el=document.createElement("spui-select");el.dataset.testid="native";el.setAttribute("label","Native choice");el.setAttribute("name","choice");el.setAttribute("value","x");el.setAttribute("appearance","filled-darker");el.innerHTML="<optgroup label='Named group'><option value='x'>X-ray</option><option value='y'>Yankee</option></optgroup><span slot='icon' data-testid='native-icon'>↓</span>";form.append(el);const reset=document.createElement("button");reset.type="reset";reset.textContent="Reset native";form.append(reset)};window.mountNative();`,
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
  const select = name => host(name).locator("select");
  assert.equal(await page.getByRole("combobox", { name: "Category" }).count(), 1, "visible label names the native select");
  assert.equal(await select("controlled").inputValue(), "b");
  assert.equal(await host("controlled").getAttribute("multiple"), null, "single-select omits the false boolean custom-element attribute");
  assert.equal(await select("controlled").evaluate(el => el.multiple), false, "single native select remains single-select");
  const grouped = host("grouped");
  assert.equal(await grouped.locator("select optgroup").getAttribute("label"), "Greek", "fallback select preserves option groups");
  assert.deepEqual(await grouped.locator("select option").allTextContents(), ["Alpha", "Beta"]);
  assert.equal(await select("grouped").inputValue(), "b", "default value resolves to an option inside a group");
  assert.equal(await host("controlled").getAttribute("size"), "large");
  assert.equal(await select("controlled").evaluate(el => getComputedStyle(el).minHeight), "40px");
  assert.equal(await host("controlled").getAttribute("appearance"), "underline");
  assert.equal(await host("controlled").locator("select").getAttribute("autocomplete"), "off", "top-level autoComplete is forwarded to the native select");
  assert.equal(await host("controlled").locator('[slot="icon"]').getAttribute("aria-hidden"), "true", "custom React icon is a decorative select slot");
  assert.equal(await host("controlled").locator('[slot="icon"]').getByTestId("custom-icon").count(), 1);
  const replacement = host("replacement");
  assert.equal(await replacement.locator('[slot="select"]').getAttribute("class"), "custom-select", "Select.select props land on the replaceable native control");
  assert.equal(await replacement.locator('[slot="select"]').inputValue(), "y", "host value controls the replacement select");
  assert.equal(await replacement.getByRole("combobox", { name: "Replacement" }).count(), 1, "host label names the replacement control");
  assert.equal(await host("element-select").getAttribute("slot"), "select", "React element slots are retained as native select controls");
  assert.equal(await host("element-select").inputValue(), "z");
  assert.equal(await page.getByRole("combobox", { name: "Custom accessible name" }).count(), 1, "explicit slot naming takes precedence over the host label");
  assert.equal(await host("small").evaluate(el => el.shadowRoot.querySelector('slot[name="icon"]').assignedElements().length), 0, "default icon fallback renders when no slot is supplied");
  assert.equal(await host("small").evaluate(el => el.shadowRoot.querySelector('slot[name="icon"] svg') !== null), true);
  await select("controlled").selectOption("a");
  await page.waitForFunction(() => document.querySelector('[data-testid="controlled"]').value === "a");
  assert.deepEqual(await page.evaluate(() => window.changes), [["a",true,"a"]], "onChange receives native event and Fluent data");
  assert.deepEqual(await page.evaluate(() => window.values), ["a"], "legacy value callback remains available");
  const small = host("small");
  assert.equal(await select("small").inputValue(), "a");
  assert.equal(await select("small").evaluate(el => getComputedStyle(el).minHeight), "24px");
  assert.equal(await small.getAttribute("appearance"), "filled-lighter");
  assert.deepEqual(JSON.parse(await page.locator("#react-form").evaluate(form => JSON.stringify([...new FormData(form).entries()]))), [["category","a"],["grouped","b"],["replacement","y"],["element","z"]]);
  assert.equal(await host("external-form-select").getAttribute("form"), "external-form", "the native form owner prop is retained on the form-associated host");
  assert.equal(await host("external-form-select").locator("select").getAttribute("form"), "external-form", "the form owner is also exposed on the native select slot");
  assert.deepEqual(JSON.parse(await page.locator("#external-form").evaluate(form => JSON.stringify([...new FormData(form).entries()]))), [["external","x"]], "form attribute associates a Select outside the form subtree");
  assert.equal(await host("multiple").locator('[slot="select"]').getAttribute("multiple"), "", "multiple is forwarded to the native control");
  assert.deepEqual(JSON.parse(await page.locator("#multiple-form").evaluate(form => JSON.stringify([...new FormData(form).entries()]))), [["choice","a"],["choice","b"]], "multi-select form values preserve all selected options");
  assert.equal(await host("multiple").locator('[slot="select"]').evaluate(el => el.checkValidity()), true, "required multi-select validity uses its selected options");
  await host("multiple").locator('[slot="select"]').selectOption(["b", "c"]);
  assert.deepEqual(JSON.parse(await page.locator("#multiple-form").evaluate(form => JSON.stringify([...new FormData(form).entries()]))), [["choice","b"],["choice","c"]], "multi-select updates all form values");
  await page.locator("#multiple-form").evaluate(form => form.reset());
  assert.deepEqual(JSON.parse(await page.locator("#multiple-form").evaluate(form => JSON.stringify([...new FormData(form).entries()]))), [["choice","a"],["choice","b"]], "multi-select reset restores every selected default");
  assert.deepEqual(await host("controlled-multiple").locator('[slot="select"]').evaluate(el => [...el.selectedOptions].map(option => option.value)), ["a", "b"], "array-valued controlled value selects each option");
  assert.deepEqual(JSON.parse(await page.locator("#controlled-multiple-form").evaluate(form => JSON.stringify([...new FormData(form).entries()]))), [["controlledChoice","a"],["controlledChoice","b"]], "controlled multi-select submits each selected value");
  await host("controlled-multiple").locator('[slot="select"]').selectOption(["b", "c"]);
  await page.waitForTimeout(50);
  assert.deepEqual(await host("controlled-multiple").locator('[slot="select"]').evaluate(el => [...el.selectedOptions].map(option => option.value)), ["b", "c"], "controlled array value updates with the change event");
  assert.deepEqual(JSON.parse(await page.locator("#controlled-multiple-form").evaluate(form => JSON.stringify([...new FormData(form).entries()]))), [["controlledChoice","b"],["controlledChoice","c"]], "controlled array value updates with the change event");
  await page.locator("#react-form button[type=reset]").click();
  assert.equal(await select("grouped").inputValue(), "b", "form reset restores grouped default value");
  const native = host("native");
  assert.equal(await native.evaluate(el => el.value), "x");
  assert.equal(await native.locator("select optgroup").getAttribute("label"), "Named group", "native fallback keeps optgroup labels");
  await native.evaluate(el => { const option = document.createElement("option"); option.value = "z"; option.textContent = "Zulu"; el.querySelector("optgroup").append(option); });
  await page.waitForFunction(() => document.querySelector('[data-testid="native"]')?.shadowRoot?.querySelector("select option[value=z]")?.textContent === "Zulu");
  await native.locator("select").selectOption("z");
  assert.equal(await native.evaluate(el => el.value), "z", "dynamically added grouped option is selectable");
  assert.deepEqual(JSON.parse(await page.locator("#native-form").evaluate(form => JSON.stringify([...new FormData(form).entries()]))), [["choice","z"]]);
  assert.equal(await native.getAttribute("appearance"), "filled-darker");
  assert.equal(await native.evaluate(el => el.shadowRoot.querySelector('slot[name="icon"]').assignedElements()[0]?.getAttribute("data-testid")), "native-icon");
  await native.locator("select").selectOption("y");
  assert.deepEqual(JSON.parse(await page.locator("#native-form").evaluate(form => JSON.stringify([...new FormData(form).entries()]))), [["choice","y"]]);
  await page.evaluate(() => {
    const grouped = document.createElement("spui-select");
    grouped.dataset.testid = "reset-grouped";
    grouped.setAttribute("label", "Grouped reset");
    grouped.innerHTML = "<optgroup label='Reset options'><option selected>Text fallback</option><option value='other'>Other</option></optgroup>";
    document.querySelector("#native-form").append(grouped);
  });
  const resetGrouped = host("reset-grouped");
  assert.equal(await resetGrouped.evaluate(el => el.value), "Text fallback", "option without value uses its text value");
  await resetGrouped.locator("select").selectOption("other");
  await page.getByRole("button", { name: "Reset native" }).click();
  assert.equal(await native.evaluate(el => el.value), "x", "form reset restores the selected default");
  assert.equal(await resetGrouped.evaluate(el => el.value), "Text fallback", "form reset restores a selected option nested in optgroup");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", nativeLabelsAndKeyboardControl: true, callbackEventAndData: true, controlledAndDefaultValues: true, sizesAndAppearances: true, nativeFormAndReset: true, externalFormOwner: true, multipleSelectionFormValues: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
