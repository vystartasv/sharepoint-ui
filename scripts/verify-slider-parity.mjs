import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.slider-change-type-contract.tsx");
const typeFixture = `import { Slider, type SliderOnChangeData } from "./react.js"; const usage = <Slider onChange={(event, data) => { const target: HTMLInputElement = event.currentTarget; const value: number = data.value; void [target, value]; }} />;`;
const originalFileExists = ts.sys.fileExists;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.fileExists = file => resolve(file) === typeFixturePath || originalFileExists(file);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Slider Fluent event contract should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    sourcefile: "slider-parity.tsx", loader: "tsx", resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Slider}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineSlider}from"${resolve("packages/sharepoint-ui/src/elements/slider.ts")}";window.values=[];function App(){const[value,setValue]=React.useState(25);return <><form id="form"><Slider data-testid="controlled" label="Volume" value={value} min={0} max={100} onValueChange={v=>window.values.push(["value",v])} onChange={(event,data)=>{window.values.push(["change",data.value,event.target.value,event.currentTarget===event.target]);setValue(data.value)}}/><Slider data-testid="default" label="Balance" defaultValue={35}/><Slider data-testid="small" label="Small" defaultValue={10} size="small"/><Slider data-testid="vertical" label="Vertical" defaultValue={60} vertical/><Slider data-testid="slotted" label="Slotted level" name="slottedLevel" defaultValue={20} min={0} max={100} input={{inputMode:"numeric","aria-orientation":"vertical"}} rail={<i data-testid="slotted-rail"/>} thumb={<b data-testid="slotted-thumb"/>}/><button type="reset">Reset</button></form></>};createRoot(document.querySelector("#react")).render(<App/>);window.mountNative=()=>{defineSlider();const form=document.querySelector("#native-form");const slider=document.createElement("spui-slider");slider.dataset.testid="native";slider.setAttribute("label","Native level");slider.setAttribute("default-value","40");slider.setAttribute("name","level");slider.setAttribute("vertical","");form.append(slider);const reset=document.createElement("button");reset.type="reset";reset.textContent="Reset native";form.append(reset)};window.mountNative();`,
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
  const control = name => page.getByTestId(name);
  const sliderInput = name => control(name).locator("input:not([hidden])");
  assert.equal(await control("default").evaluate(el => el.value), 35, "React defaultValue sets the initial value");
  assert.equal(await sliderInput("default").getAttribute("aria-orientation"), "horizontal", "horizontal sliders expose their orientation to assistive technology");
  assert.equal(await sliderInput("default").getAttribute("min"), "0");
  assert.equal(await sliderInput("default").getAttribute("max"), "100");
  assert.equal(await control("small").getAttribute("size"), "small");
  assert.equal(await sliderInput("small").evaluate(el => getComputedStyle(el).minHeight), "24px");
  assert.equal(await control("vertical").evaluate(el => el.shadowRoot.querySelector("input").getAttribute("aria-orientation")), "vertical");
  assert.equal(await sliderInput("vertical").evaluate(el => el.getBoundingClientRect().height), 160);
  await control("vertical").evaluate(el => { el.removeAttribute("vertical"); });
  assert.equal(await sliderInput("vertical").getAttribute("aria-orientation"), "horizontal", "orientation resets to horizontal when vertical is removed");
  await control("vertical").evaluate(el => { el.setAttribute("vertical", ""); });
  assert.equal(await sliderInput("vertical").getAttribute("aria-orientation"), "vertical");
  assert.equal(await sliderInput("slotted").getAttribute("aria-label"), "Slotted level", "React input slot receives its accessible name");
  assert.equal(await sliderInput("slotted").getAttribute("aria-orientation"), "vertical", "explicit input slot orientation is retained");
  assert.equal(await sliderInput("slotted").getAttribute("inputmode"), "numeric");
  assert.equal(await control("slotted").locator("[slot=rail]").count(), 1);
  assert.equal(await control("slotted").locator("[slot=thumb]").getAttribute("aria-hidden"), "true");
  await sliderInput("slotted").evaluate(el => { el.value = "60"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal(await control("slotted").evaluate(el => el.value), 60);
  assert.equal(await control("slotted").evaluate(el => el.shadowRoot.querySelector(".track").style.getPropertyValue("--spui-slider-progress-percent")), "60%");
  assert.deepEqual(await page.locator("#form").evaluate(form => [...new FormData(form).entries()]).then(entries => entries.filter(([name]) => name === "slottedLevel")), [["slottedLevel","60"]], "slotted range input retains host form participation");
  await sliderInput("controlled").evaluate(el => { el.value = "42"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  assert.equal(await control("controlled").evaluate(el => el.value), 42, "controlled value follows the React callback");
  assert.deepEqual(await page.evaluate(() => window.values), [["value",42],["change",42,"42",true]], "both callbacks receive the selected value and native event");
  const native = control("native");
  assert.equal(await native.evaluate(el => el.value), 40);
  assert.equal(await native.evaluate(el => el.shadowRoot.querySelector("input").getAttribute("orient")), "vertical");
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["level","40"]]);
  await sliderInput("native").evaluate(el => { el.value = "55"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.getByRole("button", { name: "Reset native" }).click();
  assert.equal(await native.evaluate(el => el.value), 40, "form reset restores defaultValue");
  await native.evaluate(el => { const input = document.createElement("input"); input.slot = "input"; const rail = document.createElement("span"); rail.slot = "rail"; const thumb = document.createElement("span"); thumb.slot = "thumb"; el.append(input, rail, thumb); });
  const nativeAssigned = native.locator("input[slot=input]"); await nativeAssigned.waitFor();
  await native.evaluate(el => { el.value = 70; });
  assert.equal(await nativeAssigned.getAttribute("aria-label"), "Native level");
  assert.equal(await native.evaluate(el => el.shadowRoot.querySelector(".input-fallback").hidden), true);
  assert.equal(await native.evaluate(el => el.shadowRoot.querySelector(".track").style.getPropertyValue("--spui-slider-progress-percent")), "70%");
  await native.evaluate(el => el.setAttribute("aria-orientation", "horizontal"));
  assert.equal(await nativeAssigned.getAttribute("aria-orientation"), "horizontal", "host ARIA orientation is forwarded to the primary input");
  await native.evaluate(el => el.removeAttribute("aria-orientation"));
  assert.equal(await nativeAssigned.getAttribute("aria-orientation"), "vertical", "removing the host override restores vertical default orientation");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", replaceableInputRailAndThumb: true, defaultValue: true, horizontalOrientationDefault: true, verticalOrientationUpdates: true, explicitInputOrientationPreserved: true, hostAriaOrientationOverride: true, size: true, vertical: true, controlledCallback: true, nativeFormValueAndReset: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
