import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";
import { chromium } from "/Users/vilius/.t3/projects/spfx-research/node_modules/playwright/index.mjs";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.swatch-picker-callback-type-contract.tsx");
const typeFixture = `import { SwatchPicker, type SwatchPickerSelectionChangeEvent, type SwatchPickerOnSelectionChangeData } from "./react.js"; const example = <SwatchPicker onSelectionChange={(event, data) => { const supportedEvent: SwatchPickerSelectionChangeEvent = event; if (data.type === "click") { const button: HTMLButtonElement = data.event.currentTarget; void button; } const value: string = data.selectedValue; void [supportedEvent, value]; }} />;`;
const originalFileExists = ts.sys.fileExists;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.fileExists = file => resolve(file) === typeFixturePath || originalFileExists(file);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `SwatchPicker Fluent callback contract should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: { contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { SharePointUIProvider, SwatchPicker, SwatchPickerRow, ColorSwatch, EmptySwatch } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import { defineSwatchPicker } from "${resolve("packages/sharepoint-ui/src/elements/swatch-picker.ts")}"; defineSwatchPicker(); window.reactSelection=null; function App(){const [selected,setSelected]=React.useState(["red"]);return <SharePointUIProvider lang="ar" dir="rtl" strings={{colorSwatches:"لوحة الألوان",colorAdd:"إضافة لون"}}><SwatchPicker data-testid="react-multiple" selectionMode="multiple" selectedValues={selected} onSelectionChange={(event,data)=>{window.reactSelection={sameEvent:event===data.event,eventType:event.type,type:data.type,selectedValue:data.selectedValue,selectedSwatch:data.selectedSwatch,selectedColor:data.selectedColor,selectedValues:data.selectedValues,selectedColors:data.selectedColors,selectionMode:data.selectionMode};setSelected(data.selectedValues)}}><SwatchPickerRow><ColorSwatch value="red" color="#f00" aria-label="Red" icon={<span data-testid="react-swatch-icon">✓</span>}/><ColorSwatch value="blue" color="#00f" aria-label="Blue"/><ColorSwatch value="disabled" color="#888" aria-label="Disabled" disabled disabledIcon={<span data-testid="react-disabled-icon">×</span>}/><EmptySwatch data-testid="react-empty"/></SwatchPickerRow></SwatchPicker></SharePointUIProvider>} createRoot(document.querySelector("#react-root")).render(<App/>);`, resolveDir: process.cwd(), sourcefile: "swatch-picker-check.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"],
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")], write: false,
});

const html = `<!doctype html><div id="default"><spui-swatch-picker aria-label="Theme palette" selection-mode="multiple" default-selected-values='["red"]'><spui-swatch-picker-row><spui-color-swatch value="red" color="#f00" aria-label="Red"></spui-color-swatch><spui-color-swatch value="blue" color="#00f" aria-label="Blue"></spui-color-swatch></spui-swatch-picker-row></spui-swatch-picker></div><div id="controlled"><spui-swatch-picker aria-label="Controlled palette" selection-mode="multiple" selected-values='["blue"]'><spui-swatch-picker-row><spui-color-swatch value="red" color="#f00" aria-label="Red"></spui-color-swatch><spui-color-swatch value="blue" color="#00f" aria-label="Blue"></spui-color-swatch></spui-swatch-picker-row></spui-swatch-picker></div><div id="row"><spui-swatch-picker aria-label="Row palette" layout="row" dir="rtl" selection-mode="multiple"><spui-color-swatch value="red" color="#f00" aria-label="Red"></spui-color-swatch><spui-color-swatch value="blue" color="#00f" aria-label="Blue"></spui-color-swatch></spui-swatch-picker></div><div id="single"><spui-swatch-picker aria-label="Single palette" layout="row" default-selected-value="red"><spui-color-swatch value="red" color="#f00" aria-label="Red"></spui-color-swatch><spui-color-swatch value="blue" color="#00f" aria-label="Blue"></spui-color-swatch></spui-swatch-picker></div><div id="icons"><spui-color-swatch id="native-icon" color="#f00" value="icon" selected><span slot="icon" data-testid="native-swatch-icon">ok</span></spui-color-swatch><spui-color-swatch id="native-disabled-custom" color="#888" value="disabled-custom" disabled><span slot="disabled-icon" data-testid="native-disabled-icon">no</span></spui-color-swatch><spui-color-swatch id="native-disabled-default" color="#777" value="disabled-default" disabled></spui-color-swatch></div><div id="react-root"></div><script src="/bundle.js"></script>`;
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end(html));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.stack || error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  await page.evaluate(() => {
    const image = document.createElement("spui-image-swatch"); image.id = "native-image"; image.setAttribute("src", "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="); image.setAttribute("value", "image");
    const empty = document.createElement("spui-empty-swatch"); empty.id = "native-empty";
    document.querySelector("#icons").append(image, empty);
  });
  const fluentSizes = { "extra-small": 20, small: 24, medium: 28, large: 32 };
  for (const id of ["native-icon", "native-image", "native-empty"]) for (const [size, expected] of Object.entries(fluentSizes)) {
    const swatch = page.locator(`#${id}`);
    await swatch.evaluate((element, value) => element.setAttribute("size", value), size);
    assert.equal(await swatch.evaluate(element => element.shadowRoot.querySelector("button").getBoundingClientRect().width), expected, `${id} ${size} dimensions match Fluent`);
  }
  assert.notEqual(await page.locator("#native-icon button").evaluate(button => getComputedStyle(button).boxShadow), "none", "selected standalone color swatches show a selection ring");
  assert.equal(await page.locator("#native-empty").getAttribute("aria-label"), "Add color", "empty swatches provide a stable accessible name without reflecting in a loop");

  assert.equal(await page.locator("#native-icon").evaluate(host => host.shadowRoot.querySelector("slot[name=icon]").assignedElements()[0]?.textContent), "ok", "native icon slot is assigned");
  assert.equal(await page.locator("#native-disabled-custom").evaluate(host => host.shadowRoot.querySelector("slot[name=disabled-icon]").assignedElements()[0]?.textContent), "no", "native disabledIcon replaces the fallback");
  assert.equal(await page.locator("#native-disabled-default").evaluate(host => host.shadowRoot.querySelector("slot[name=disabled-icon] svg") !== null), true, "disabled swatches provide the prohibited-icon fallback");

  const defaultPicker = page.locator("#default spui-swatch-picker");
  assert.deepEqual(await defaultPicker.evaluate(element => element.selectedValues), ["red"]);
  assert.equal(await defaultPicker.getAttribute("aria-multiselectable"), "true");
  assert.equal(await defaultPicker.getAttribute("role"), "grid");
  assert.equal(await defaultPicker.evaluate(element => getComputedStyle(element.shadowRoot.querySelector(".items")).gap), "4px", "medium picker spacing matches Fluent");
  assert.equal(await defaultPicker.locator('spui-color-swatch[value="red"]').evaluate(element => element.getAttribute("aria-selected")), "true", "grid cell exposes selected state on its gridcell role");
  assert.equal(await defaultPicker.locator('spui-color-swatch[value="red"]').getAttribute("role"), "gridcell");
  assert.notEqual(await defaultPicker.locator('spui-color-swatch[value="red"] button').evaluate(button => getComputedStyle(button).boxShadow), "none", "selected grid swatches display selection through the host state");
  await defaultPicker.evaluate(element => element.setAttribute("spacing", "small"));
  assert.equal(await defaultPicker.evaluate(element => getComputedStyle(element.shadowRoot.querySelector(".items")).gap), "2px", "small picker spacing matches Fluent");
  assert.equal(await defaultPicker.locator('spui-color-swatch[value="red"]').evaluate(element => element.shadowRoot.querySelector("button").hasAttribute("role")), false, "nested native button keeps button semantics instead of duplicating gridcell role");
  await defaultPicker.locator('spui-color-swatch[value="blue"]').click();
  assert.deepEqual(await defaultPicker.evaluate(element => element.selectedValues), ["red", "blue"]);
  assert.deepEqual(await defaultPicker.evaluate(element => [...element.querySelectorAll("spui-color-swatch")].map(item => item.shadowRoot.querySelector("button").tabIndex)), [-1, 0], "multiple selected swatches retain one roving tab stop");
  const nativeChanges = [];
  await defaultPicker.evaluate(element => element.addEventListener("spui-selection-change", event => { const data = event.detail; window.nativeChange = { eventType: data.event.type, sourceTarget: data.event.target.localName, type: data.type, selectedValue: data.selectedValue, selectedSwatch: data.selectedSwatch, selectedColor: data.selectedColor, selectedValues: data.selectedValues, selectedColors: data.selectedColors, selectionMode: data.selectionMode }; }));
  await defaultPicker.locator('spui-color-swatch[value="red"]').click();
  assert.deepEqual(await defaultPicker.evaluate(element => element.selectedValues), ["blue"]);
  assert.deepEqual(await page.evaluate(() => window.nativeChange), { eventType: "click", sourceTarget: "button", type: "click", selectedValue: "red", selectedSwatch: "#f00", selectedColor: "#f00", selectedValues: ["blue"], selectedColors: ["#00f"], selectionMode: "multiple" });

  const controlledPicker = page.locator("#controlled spui-swatch-picker");
  await controlledPicker.locator('spui-color-swatch[value="red"]').click();
  assert.deepEqual(await controlledPicker.evaluate(element => element.selectedValues), ["blue"], "controlled selection waits for the owner to update the array");
  await controlledPicker.evaluate(element => { element.selectedValues = ["red", "blue"]; });
  assert.deepEqual(await controlledPicker.evaluate(element => element.selectedValues), ["red", "blue"]);

  const rowPicker = page.locator("#row spui-swatch-picker");
  assert.equal(await rowPicker.getAttribute("role"), "group");
  assert.equal(await rowPicker.locator('spui-color-swatch[value="red"]').evaluate(element => element.shadowRoot.querySelector("button").getAttribute("role")), "checkbox");
  assert.equal(await rowPicker.locator('spui-color-swatch[value="red"]').evaluate(element => element.shadowRoot.querySelector("button").getAttribute("aria-checked")), "false");
  await rowPicker.locator('spui-color-swatch[value="red"]').evaluate(element => element.focus());
  await page.keyboard.press("ArrowRight");
  assert.equal(await rowPicker.evaluate(element => element.querySelector('spui-color-swatch[value="blue"]').shadowRoot.activeElement?.tagName), "BUTTON", "RTL arrow keys move focus toward the previous visual item");
  await page.keyboard.press("Space");
  assert.deepEqual(await rowPicker.evaluate(element => element.selectedValues), ["blue"]);
  assert.equal(await rowPicker.locator('spui-color-swatch[value="blue"]').evaluate(element => element.shadowRoot.querySelector("button").getAttribute("aria-checked")), "true");

  const single = page.locator("#single spui-swatch-picker");
  await single.locator('spui-color-swatch[value="blue"]').click();
  assert.equal(await single.evaluate(element => element.selectedValue), "blue");
  assert.deepEqual(await single.evaluate(element => element.selectedValues), ["blue"], "single-selection API remains compatible");
  assert.equal(await single.getAttribute("aria-multiselectable"), null);
  assert.equal(await single.locator('spui-color-swatch[value="blue"]').evaluate(element => element.shadowRoot.querySelector("button").getAttribute("role")), "radio");

  const reactPicker = page.getByTestId("react-multiple");
  assert.equal(await reactPicker.getAttribute("aria-label"), "لوحة الألوان", "React SwatchPicker gets a localized default accessible name");
  const reactEmpty = page.getByTestId("react-empty");
  assert.equal(await reactEmpty.getAttribute("aria-label"), "إضافة لون", "React EmptySwatch gets a localized default accessible name");
  assert.equal(await reactEmpty.locator("button").getAttribute("aria-label"), "إضافة لون", "the internal empty-swatch control uses the localized name");
  assert.equal(await reactPicker.locator('spui-color-swatch[value="red"]').evaluate(host => host.shadowRoot.querySelector("slot[name=icon]").assignedElements().length), 1, "React icon prop maps to the native slot");
  assert.equal(await reactPicker.locator('spui-color-swatch[value="disabled"]').evaluate(host => host.shadowRoot.querySelector("slot[name=disabled-icon]").assignedElements().length), 1, "React disabledIcon prop maps to the native slot");
  await reactPicker.locator('spui-color-swatch[value="blue"]').click();
  await page.waitForFunction(() => window.reactSelection?.selectedValues?.includes("blue"));
  await page.waitForFunction(() => document.querySelector('[data-testid="react-multiple"]')?.getAttribute("selected-values") === '["red","blue"]');
  const reactState = await reactPicker.evaluate(element => ({ selectedValues: element.selectedValues, serialized: element.getAttribute("selected-values") }));
  assert.deepEqual(reactState.selectedValues, ["red", "blue"], JSON.stringify({ reactState, callback: await page.evaluate(() => window.reactSelection) }));
  assert.deepEqual(await page.evaluate(() => window.reactSelection), { sameEvent: true, eventType: "click", type: "click", selectedValue: "blue", selectedSwatch: "#00f", selectedColor: "#00f", selectedValues: ["red", "blue"], selectedColors: ["#f00", "#00f"], selectionMode: "multiple" });
  assert.deepEqual(errors, []);
  await page.screenshot({ path: resolve("test-results/swatch-picker-multiselect.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", native: { defaultMultiple: true, controlledMultiple: true, toggleOff: true, gridMultiselectSemantics: true, rowCheckboxSemantics: true, rtlKeyboardSelection: true, singleRovingTabStop: true, singleSelectCompatibility: true, selectionEventArrays: true, iconSlots: true, disabledIconOverride: true, disabledIconFallback: true, fluentSizeScale: true, visibleSelectedState: true }, react: { controlledMultiple: true, callbackArrays: true, iconSlots: true }, pageErrors: errors.length, visualCapture: "test-results/swatch-picker-multiselect.png" }, null, 2));
} finally { await browser?.close(); server.close(); }
