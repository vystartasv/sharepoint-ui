import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.color-picker-change-type-contract.tsx");
const typeFixture = `import * as React from "react"; import { AlphaSlider, ColorArea, ColorPicker, ColorSlider } from "./react.js"; import type { AlphaSliderProps as FluentAlphaSliderProps, ColorAreaProps as FluentColorAreaProps, ColorPickerProps as FluentColorPickerProps, ColorSliderProps as FluentColorSliderProps } from "../../../examples/spfx124-webpart/node_modules/@fluentui/react-color-picker/dist/index.js"; type Assert<T extends true> = T; type Fits<A,B> = A extends B ? B extends A ? true : false : false;
type _picker = Assert<Fits<NonNullable<import("./react.js").ColorPickerProps["onColorChange"]>, NonNullable<FluentColorPickerProps["onColorChange"]>>>;
type _area = Assert<Fits<NonNullable<import("./react.js").ColorAreaProps["onChange"]>, NonNullable<FluentColorAreaProps["onChange"]>>>;
declare const localPickerCallback: NonNullable<import("./react.js").ColorPickerProps["onColorChange"]>; const fluentPickerCallback: NonNullable<FluentColorPickerProps["onColorChange"]> = localPickerCallback;
declare const localAreaCallback: NonNullable<import("./react.js").ColorAreaProps["onChange"]>; const fluentAreaCallback: NonNullable<FluentColorAreaProps["onChange"]> = localAreaCallback;
type _slider = Assert<Fits<NonNullable<import("./react.js").ColorSliderProps["onChange"]>, NonNullable<FluentColorSliderProps["onChange"]>>>;
type _alpha = Assert<Fits<NonNullable<import("./react.js").AlphaSliderProps["onChange"]>, NonNullable<FluentAlphaSliderProps["onChange"]>>>;
const example = <><ColorPicker onColorChange={(event, data) => { const source: React.SyntheticEvent | Event = event; if (data.type === "change") { const inputEvent: React.ChangeEvent<HTMLInputElement> = data.event; void inputEvent; } void [source, data.color]; }} /><AlphaSlider onChange={(event, data) => { const source: React.SyntheticEvent | Event = event; const color = data.color; void [source, color]; }} /><ColorArea onChange={(event, data) => { const source: React.SyntheticEvent | Event = event; const hue: number = data.color.h; void [source, hue]; }} /><ColorSlider onChange={(event, data) => { const source: React.SyntheticEvent | Event = event; const hue: number = data.color.h; void [source, hue]; }} /></>;`;
const originalFileExists = ts.sys.fileExists;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true, baseUrl: process.cwd(), paths: { react: ["packages/sharepoint-ui/node_modules/@types/react/index.d.ts"] } };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.fileExists = file => resolve(file) === typeFixturePath || originalFileExists(file);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => `${diagnostic.start === undefined ? "" : `${diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start).line + 1}: `}${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
assert.deepEqual(typeErrors, [], `Color control Fluent callback contracts should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
  contents: `import * as React from "react";
import { createRoot } from "react-dom/client";
import { AlphaSlider, ColorArea, ColorPicker, ColorSlider, SharePointUIProvider } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
import { defineColorPicker } from "${resolve("packages/sharepoint-ui/src/elements/color-picker.ts")}";
window.mount = () => {
  defineColorPicker();
  const nativeForm = document.querySelector("#native-form");
  const native = document.createElement("spui-color-picker");
  native.name = "brand"; native.setAttribute("label", "Brand color"); native.setAttribute("value", "#336699"); native.setAttribute("alpha", "0.5"); native.setAttribute("required", ""); native.setAttribute("dir", "rtl");
  nativeForm.append(native);
  const composedNative = document.createElement("spui-color-picker"); composedNative.setAttribute("label", "Composed native picker"); composedNative.setAttribute("value", "#336699"); composedNative.setAttribute("dir", "rtl");
  const nativeAreaControl = document.createElement("spui-color-area"); nativeAreaControl.slot = "area"; nativeAreaControl.setAttribute("aria-label", "Native saturation and brightness");
  const nativeHueControl = document.createElement("spui-color-slider"); nativeHueControl.slot = "sliders"; nativeHueControl.setAttribute("channel", "hue"); nativeHueControl.setAttribute("aria-label", "Native hue");
  const nativeAlphaControl = document.createElement("spui-alpha-slider"); nativeAlphaControl.slot = "alpha"; nativeAlphaControl.setAttribute("aria-label", "Native opacity");
  composedNative.append(nativeAreaControl, nativeHueControl, nativeAlphaControl); nativeForm.append(composedNative);const nativeSlotSlider = document.createElement("spui-color-slider"); nativeSlotSlider.id = "native-slot-slider"; nativeSlotSlider.setAttribute("channel", "hue"); const nativeSlotInput = document.createElement("input"); nativeSlotInput.slot = "input"; nativeSlotInput.setAttribute("aria-label", "Slotted native hue"); nativeSlotInput.dataset.testid = "native-slot-input"; const nativeSlotRail = document.createElement("span"); nativeSlotRail.slot = "rail"; nativeSlotRail.dataset.testid = "native-slot-rail"; const nativeSlotThumb = document.createElement("span"); nativeSlotThumb.slot = "thumb"; nativeSlotThumb.dataset.testid = "native-slot-thumb"; nativeSlotSlider.append(nativeSlotInput, nativeSlotRail, nativeSlotThumb); nativeForm.append(nativeSlotSlider);
  function App() { const [value, setValue] = React.useState("#336699"); const [hsv, setHsv] = React.useState({ h: 210, s: 2 / 3, v: 0.6, a: 0.25 }); const [standalone, setStandalone] = React.useState({ h: 30, s: 0.5, v: 0.4, a: 0.8 }); return <SharePointUIProvider lang="ar" dir="rtl" strings={{ colorChoose: "اختيار اللون", colorHex: "رمز اللون", colorHue: "درجة اللون", colorArea: "التشبع والسطوع", colorAreaValue: "تشبع {saturation}٪، سطوع {brightness}٪", colorSaturation: "التشبع", colorValue: "القيمة", colorFormat: "صيغة اللون", colorRgb: "قيم RGB", colorRed: "أحمر", colorGreen: "أخضر", colorBlue: "أزرق", colorOpacity: "الشفافية" }}><ColorPicker data-testid="react-picker" label="لون العلامة" value={value} onValueChange={(next, alpha) => { window.lastReactChange = { value: next, alpha }; setValue(next); }} onFormatChange={format => { window.lastFormatChange = format; }} /><ColorPicker data-testid="hsv-picker" label="HSV color" color={hsv} onColorChange={(event,data) => { window.lastHsvChange = data.color; window.lastHsvMeta = { type: data.type, eventType: event.type, sameEvent: event === data.event }; setHsv(data.color); }} onValueChange={(next, alpha) => { window.lastHsvValue = { value: next, alpha }; }} /><ColorPicker data-testid="hsv-default" label="HSV default" defaultColor={{ h: 120, s: 1, v: 0.5, a: 0.4 }} /><ColorPicker data-testid="composed-picker" label="Composed picker" value={value} alpha={0.7} onValueChange={(next, alpha) => { window.lastComposedChange = { value: next, alpha }; setValue(next); }}><ColorArea aria-label="Composed saturation and brightness" /><ColorSlider channel="hue" aria-label="Composed hue" /><ColorSlider channel="saturation" aria-label="Composed saturation" /><ColorSlider channel="value" /><AlphaSlider transparency aria-label="Composed opacity" /></ColorPicker><ColorArea data-testid="standalone-area" aria-label="Standalone area" color={standalone} onChange={(event, data) => { window.lastStandaloneArea = data.color; window.lastStandaloneAreaMeta = { type: data.type, eventType: data.event.type, sameEvent: event === data.event }; window.lastStandaloneAreaMetaEvent = { currentTargetTag: data.event.currentTarget?.tagName, nativeEventType: data.event.nativeEvent?.type }; setStandalone(data.color); }} /><ColorSlider data-testid="standalone-slider" channel="hue" color={standalone} onChange={(event, data) => { window.lastStandaloneSlider = data.color; window.lastStandaloneSliderMeta = { type: data.type, eventType: data.event.type, sameEvent: event === data.event }; window.lastStandaloneSliderMetaEvent = { currentTargetTag: data.event.currentTarget?.tagName, nativeEventType: data.event.nativeEvent?.type }; setStandalone(data.color); }} /><AlphaSlider data-testid="standalone-alpha" defaultColor={standalone} onChange={(event, data) => { window.lastStandaloneAlpha = data.color; }} /><ColorSlider data-testid="slot-slider" channel="hue" color={standalone} input={{ "aria-label": "Custom hue", "data-testid": "custom-hue-input" }} rail={<div data-testid="custom-hue-rail" />} thumb={<span data-testid="custom-hue-thumb" />} /></SharePointUIProvider>; }
  createRoot(document.querySelector("#react-root")).render(<App />);
};`,
    resolveDir: process.cwd(),
    sourcefile: "color-picker-check.tsx",
    loader: "tsx",
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
  write: false,
});

const server = createServer((request, response) => {
  if (new URL(request.url, "http://localhost").pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><form id='native-form'></form><div id='react-root'></div></body></html>");
  if (new URL(request.url, "http://localhost").pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  response.writeHead(404).end();
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/bundle.js` });
  await page.evaluate(() => window.mount());

  const hsv = page.getByTestId("hsv-picker");
  assert.deepEqual(await hsv.evaluate(element => element.color), { h: 210, s: 2 / 3, v: 0.6, a: 0.25 });
  assert.equal(await hsv.evaluate(element => element.value), "#336699");
  assert.equal(await hsv.evaluate(element => element.alpha), 0.25);
  await hsv.getByRole("slider", { name: "التشبع والسطوع" }).press("ArrowRight");
  const hsvChange = await page.evaluate(() => window.lastHsvChange);
  assert.deepEqual(await page.evaluate(() => window.lastHsvMeta), { type: undefined, eventType: "keydown", sameEvent: true }, "ColorPicker callbacks preserve non-input keyboard events using Fluent's undefined event-data branch");
  assert.equal(hsvChange.h, 210);
  assert.ok(Math.abs(hsvChange.s - (2 / 3 - 0.01)) < 0.00001);
  assert.equal(hsvChange.v, 0.6);
  assert.equal(hsvChange.a, 0.25);
  assert.deepEqual(await hsv.evaluate(element => element.color), hsvChange, "the React controlled HSV state is reflected back on the element");
  assert.deepEqual(await page.evaluate(() => window.lastHsvValue), { value: await hsv.evaluate(element => element.value), alpha: 0.25 }, "legacy HEX value callbacks remain available with HSV callbacks");
  const hsvDefault = page.getByTestId("hsv-default");
  assert.equal(await hsvDefault.evaluate(element => element.value), "#008000");
  assert.equal(await hsvDefault.evaluate(element => element.alpha), 0.4);

  const standaloneArea = page.getByTestId("standalone-area");
  await standaloneArea.getByRole("slider", { name: "Saturation" }).press("ArrowLeft");
  const standaloneAreaChange = await page.evaluate(() => window.lastStandaloneArea);
  assert.ok(Math.abs(standaloneAreaChange.s - 0.51) < 0.00001);
  assert.deepEqual(await page.evaluate(() => window.lastStandaloneAreaMeta), { type: "change", eventType: "change", sameEvent: true }, "ColorArea bridges native range input events to Fluent-shaped React change events");
  assert.deepEqual(await page.evaluate(() => window.lastStandaloneAreaMetaEvent), { currentTargetTag: "INPUT", nativeEventType: "input" });
  assert.deepEqual(await standaloneArea.evaluate(element => element.color), standaloneAreaChange, "standalone ColorArea reflects controlled HSV updates");
  const standaloneSlider = page.getByTestId("standalone-slider");
  await standaloneSlider.getByRole("slider").evaluate(element => { element.value = "180"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal((await page.evaluate(() => window.lastStandaloneSlider)).h, 180, "standalone ColorSlider reports the changed HSV object");
  assert.deepEqual(await page.evaluate(() => window.lastStandaloneSliderMeta), { type: "change", eventType: "change", sameEvent: true }, "ColorSlider bridges native range input events to Fluent-shaped React change events");
  assert.deepEqual(await page.evaluate(() => window.lastStandaloneSliderMetaEvent), { currentTargetTag: "INPUT", nativeEventType: "input" });
  const slotSlider = page.getByTestId("slot-slider");
  assert.equal(await page.getByTestId("custom-hue-input").getAttribute("slot"), "input");
  assert.equal(await page.getByTestId("custom-hue-rail").getAttribute("slot"), "rail");
  assert.equal(await page.getByTestId("custom-hue-thumb").getAttribute("slot"), "thumb");
  await slotSlider.getByRole("slider", { name: "Custom hue" }).evaluate(element => { element.value = "180"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal(await slotSlider.evaluate(element => element.color.h), 180, "React slot input drives the ColorSlider controller");
  const standaloneAlpha = page.getByTestId("standalone-alpha");
  await standaloneAlpha.getByRole("slider").evaluate(element => { element.value = "25"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal((await page.evaluate(() => window.lastStandaloneAlpha)).a, 0.25, "standalone AlphaSlider reports opacity changes");

  const nativeHsv = await page.evaluate(() => {
    const element = document.createElement("spui-color-picker");
    element.id = "native-hsv"; element.defaultColor = { h: 0, s: 1, v: 1, a: 0.5 };
    document.querySelector("#native-form").append(element);
    return { value: element.value, alpha: element.alpha, color: element.color };
  });
  assert.deepEqual(nativeHsv, { value: "#FF0000", alpha: 0.5, color: { h: 0, s: 1, v: 1, a: 0.5 } });
  const standaloneNative = await page.evaluate(() => {
    const area = document.createElement("spui-color-area"); area.id = "standalone-native-area"; area.defaultColor = { h: 30, s: 0.5, v: 0.4, a: 0.8 };
    const slider = document.createElement("spui-color-slider"); slider.id = "standalone-native-slider"; slider.channel = "hue"; slider.color = { h: 90, s: 0.4, v: 0.6, a: 0.7 };
    const alpha = document.createElement("spui-alpha-slider"); alpha.id = "standalone-native-alpha"; alpha.color = { h: 240, s: 1, v: 1, a: 0.8 };
    area.addEventListener("spui-color-change", event => { window.nativeAreaEventData = { type: event.detail.type, eventType: event.detail.event?.type }; });
    slider.addEventListener("spui-color-change", event => { window.nativeSliderEventData = { type: event.detail.type, eventType: event.detail.event?.type }; });
    for (const element of [area, slider, alpha]) document.querySelector("#native-form").append(element);
    return { area: area.color, slider: slider.color, alpha: alpha.color };
  });
  assert.deepEqual(standaloneNative, { area: { h: 30, s: 0.5, v: 0.4, a: 0.8 }, slider: { h: 90, s: 0.4, v: 0.6, a: 0.7 }, alpha: { h: 240, s: 1, v: 1, a: 0.8 } });
  await page.locator("#standalone-native-area").getByRole("slider", { name: "Saturation" }).press("ArrowRight");
  assert.deepEqual(await page.evaluate(() => window.nativeAreaEventData), { type: "change", eventType: "input" }, "native ColorArea forwards the native range input event from keyboard interaction");
  await page.locator("#standalone-native-slider").getByRole("slider").evaluate(element => { element.value = "180"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal(await page.locator("#standalone-native-slider").evaluate(element => element.color.h), 180);
  assert.deepEqual(await page.evaluate(() => window.nativeSliderEventData), { type: "change", eventType: "input" }, "native ColorSlider event exposes its source event and change type");
  await page.locator("#standalone-native-alpha").getByRole("slider").evaluate(element => { element.value = "35"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal(await page.getByTestId("native-slot-input").getAttribute("slot"), "input");
  assert.equal(await page.getByTestId("native-slot-rail").getAttribute("slot"), "rail");
  assert.equal(await page.getByTestId("native-slot-thumb").getAttribute("slot"), "thumb");
  await page.locator("#native-slot-slider").getByRole("slider", { name: "Slotted native hue" }).evaluate(element => { element.value = "180"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal(await page.locator("#native-slot-slider").evaluate(element => element.color.h), 180);
  assert.equal(await page.locator("#standalone-native-alpha").evaluate(element => element.color.a), 0.35);
  await page.evaluate(() => { document.querySelector("#native-hsv").color = { h: 240, s: 1, v: 1, a: 0.25 }; });
  assert.equal(await page.locator("#native-hsv").evaluate(element => element.value), "#0000FF");
  await page.locator("#native-form").evaluate(form => form.reset());
  assert.deepEqual(await page.locator("#native-hsv").evaluate(element => ({ value: element.value, alpha: element.alpha })), { value: "#FF0000", alpha: 0.5 }, "native reset restores the HSV default");

  const react = page.getByTestId("react-picker");
  const reactArea = react.getByRole("slider", { name: "التشبع والسطوع" });
  const reactHue = react.getByRole("slider", { name: "درجة اللون" });
  await reactArea.waitFor({ state: "visible" });
  assert.equal(await reactArea.getAttribute("aria-valuenow"), "67");
  assert.match(await reactArea.getAttribute("aria-valuetext"), /تشبع 67٪، سطوع 60٪/);
  await reactArea.press("ArrowRight");
  await reactArea.press("ArrowUp");
  const reactChange = await page.evaluate(() => window.lastReactChange);
  assert.ok(reactChange?.value && reactChange.value !== "#336699");
  assert.equal(reactChange.alpha, 1);
  await reactHue.evaluate(element => { element.value = "120"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  const reactHex = await react.locator(".hex").inputValue();
  assert.notEqual(reactHex, reactChange.value);
  const reactFormat = react.getByRole("combobox", { name: "صيغة اللون" });
  await reactFormat.selectOption("rgb");
  assert.equal(await page.evaluate(() => window.lastFormatChange), "rgb");
  await react.getByRole("spinbutton", { name: "أحمر" }).fill("18");
  await react.getByRole("spinbutton", { name: "أخضر" }).fill("52");
  await react.getByRole("spinbutton", { name: "أزرق" }).fill("200");
  assert.equal((await page.evaluate(() => window.lastReactChange)).value, "#1234C8");
  await reactFormat.selectOption("hex");
  assert.equal(await react.getByRole("textbox", { name: "رمز اللون" }).inputValue(), "#1234C8");

  const composed = page.getByTestId("composed-picker");
  const composedArea = composed.getByRole("group", { name: "Composed saturation and brightness" });
  const composedSaturation = composed.getByRole("slider", { name: "Composed saturation", exact: true });
  const composedValue = composed.getByRole("slider", { name: "القيمة", exact: true });
  const composedAlpha = composed.getByRole("slider", { name: "Composed opacity" });
  await composedValue.waitFor({ state: "visible" });
  assert.ok(Number(await composedSaturation.getAttribute("aria-valuenow")) >= 0);
  await composedSaturation.evaluate(element => { element.value = "40"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal(await composedSaturation.getAttribute("aria-valuenow"), "40");
  await composedSaturation.focus(); await composedSaturation.press("ArrowRight");
  assert.equal(await composedSaturation.getAttribute("aria-valuenow"), "39");
  await composedSaturation.focus(); await composedSaturation.press("ArrowRight");
  assert.equal(await composedSaturation.getAttribute("aria-valuenow"), "38");
  await composedAlpha.evaluate(element => { element.value = "25"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal((await page.evaluate(() => window.lastComposedChange)).alpha, 0.75);
  assert.equal(await composedSaturation.getAttribute("aria-valuenow"), "38");

  const native = page.locator("#native-form spui-color-picker").first();
  const nativeArea = native.getByRole("slider", { name: "Saturation and brightness" });
  const nativeHue = native.getByRole("slider", { name: "Hue" });
  assert.equal(await nativeArea.getAttribute("aria-valuenow"), "67");
  await nativeArea.focus();
  await nativeArea.press("ArrowLeft"); // RTL reverses the horizontal saturation direction.
  assert.equal(await nativeArea.getAttribute("aria-valuenow"), "68");
  await nativeHue.evaluate(element => { element.value = "120"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  const beforePointer = await native.evaluate(element => element.value);
  await nativeArea.click({ position: { x: 250, y: 4 } });
  const afterPointer = await native.evaluate(element => element.value);
  assert.notEqual(afterPointer, beforePointer);
  assert.match(await native.evaluate(element => element.shadowRoot.querySelector(".preview").style.backgroundColor), /,\s*0\.5\)$/);

  const nativeFormat = native.getByRole("combobox", { name: "Color format" });
  await nativeFormat.selectOption("rgb");
  const redChannel = native.getByRole("spinbutton", { name: "Red" });
  await redChannel.fill("999");
  assert.equal(await native.evaluate(element => element.checkValidity()), false);
  await nativeFormat.selectOption("hex");
  assert.equal(await native.evaluate(element => element.checkValidity()), true);
  await nativeFormat.selectOption("rgb");
  await redChannel.fill("12");
  await native.getByRole("spinbutton", { name: "Green" }).fill("34");
  await native.getByRole("spinbutton", { name: "Blue" }).fill("56");
  const afterRgb = await native.evaluate(element => element.value);
  assert.equal(afterRgb, "#0C2238");
  await nativeFormat.selectOption("hex");
  assert.equal(await native.getByRole("textbox", { name: "Hex color" }).inputValue(), "#0C2238");

  const formValue = await page.locator("#native-form").evaluate(form => new FormData(form).get("brand"));
  assert.equal(formValue, `${afterRgb}80`);
  const sizeSamples = await native.evaluate(element => {
    const area = element.shadowRoot.querySelector(".area");
    const durations = [];
    for (let index = 0; index < 50; index++) {
      const start = performance.now();
      area.dispatchEvent(new KeyboardEvent("keydown", { key: index % 2 ? "ArrowUp" : "ArrowDown", bubbles: true }));
      durations.push(performance.now() - start);
    }
    return durations.sort((a, b) => a - b);
  });
  const interaction = { samples: sizeSamples.length, handlerP50Ms: sizeSamples[24], handlerP95Ms: sizeSamples[47], viewport: "390x844" };

  await native.evaluate(element => { element.disabled = true; });
  assert.equal(await nativeHue.isDisabled(), true);
  assert.equal(await nativeArea.getAttribute("aria-disabled"), "true");
  assert.equal(await nativeArea.getAttribute("tabindex"), "-1");
  const nativeComposed = page.locator("#native-form spui-color-picker").nth(1);
  const nativeComposedArea = nativeComposed.getByRole("group", { name: "Native saturation and brightness" });
  const nativeComposedSaturation = nativeComposed.getByRole("slider", { name: "Saturation" });
  const nativeComposedHue = nativeComposed.getByRole("slider", { name: "Native hue" });
  const nativeComposedAlpha = nativeComposed.getByRole("slider", { name: "Native opacity" });
  await nativeComposedHue.evaluate(element => { element.value = "120"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.notEqual(await nativeComposed.evaluate(element => element.value), "#336699");
  await nativeComposedAlpha.evaluate(element => { element.value = "50"; element.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal(await nativeComposed.evaluate(element => element.alpha), 0.5);
  await nativeComposedSaturation.focus(); await nativeComposedSaturation.press("ArrowLeft");
  assert.equal(await nativeComposedSaturation.getAttribute("aria-valuenow"), "68");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", react: { hsvObjectControl: true, hsvChangeCallback: hsvChange, hsvDefaultColor: true, legacyHexCallback: true, localizedHueAndArea: true, keyboardChange: reactChange, hueUpdate: reactHex, rgbEntry: "#1234C8", formatChange: true, standaloneControls: { area: standaloneAreaChange, slider: await page.evaluate(() => window.lastStandaloneSlider), alpha: await page.evaluate(() => window.lastStandaloneAlpha) }, composition: { sharedAreaAndSliderState: true, rtlKeyboard: true, transparentAlpha: 0.75 } }, native: { hsvPropertyControl: true, hsvDefaultAndReset: nativeHsv, standaloneControls: standaloneNative, rtlKeyboard: true, pointerSelection: afterPointer, rgbRangeValidation: true, rgbEntry: afterRgb, formValue, disabled: true, composition: { hueAndAreaState: true, alpha: 0.5 } }, interaction, pageErrors: errors }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
