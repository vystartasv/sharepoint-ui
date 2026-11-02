import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.toolbar-checked-event-type-contract.tsx");
const typeFixture = `import { Toolbar, type ToolbarProps, type ToolbarCheckedValueChangeEvent } from "./react.js"; type Assert<T extends true> = T; type EventOf<T> = NonNullable<T> extends (event: infer E, ...args: any[]) => unknown ? E : never; type EventMatches = Assert<EventOf<ToolbarProps["onCheckedValueChange"]> extends ToolbarCheckedValueChangeEvent ? true : false>; const example = <Toolbar onCheckedValueChange={(event, data) => { const typedEvent: ToolbarCheckedValueChangeEvent = event; const target: Element = event.currentTarget; const name: string = data.name; const nativeEvent: Event = event.nativeEvent; void [typedEvent, target, name, nativeEvent]; }} />;`;
const originalFileExists = ts.sys.fileExists;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.fileExists = file => resolve(file) === typeFixturePath || originalFileExists(file);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Toolbar Fluent callback contract should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    sourcefile: "toolbar-radio.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Toolbar,ToolbarGroup,ToolbarRadioGroup,ToolbarRadioButton,ToolbarButton,ToolbarToggleButton}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineToolbar}from"${resolve("packages/sharepoint-ui/src/elements/toolbar.ts")}";function App(){const[checkedValues,setCheckedValues]=React.useState({alignment:["left"]});return <Toolbar data-testid="react-toolbar" label="Text formatting" checkedValues={checkedValues} onCheckedValueChange={(event,data)=>{window.reactSelection={...data,eventType:event.type,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type};setCheckedValues(current=>({...current,[data.name]:data.checkedItems}))}}><ToolbarRadioGroup label="Text alignment"><ToolbarRadioButton name="alignment" value="left">Left</ToolbarRadioButton><ToolbarRadioButton name="alignment" value="center">Center</ToolbarRadioButton><ToolbarRadioButton name="alignment" value="right" disabled>Right</ToolbarRadioButton></ToolbarRadioGroup><ToolbarGroup label="View options"><ToolbarButton data-testid="react-bold">Bold</ToolbarButton><ToolbarToggleButton data-testid="react-grid" name="grid" value="on">Grid</ToolbarToggleButton></ToolbarGroup></Toolbar>}createRoot(document.querySelector("#react")).render(<App/>);window.mountNative=()=>{defineToolbar();const toolbar=document.createElement("spui-toolbar");toolbar.id="native-toolbar";toolbar.setAttribute("label","Native formatting");toolbar.defaultCheckedValues={alignment:["center"]};toolbar.addEventListener("spui-checked-value-change",event=>window.nativeSelection={name:event.detail.name,checkedItems:event.detail.checkedItems,eventType:event.detail.sourceEvent?.type,currentTarget:event.detail.currentTarget?.tagName});const group=document.createElement("spui-toolbar-radio-group");group.setAttribute("label","Text alignment");for(const [value,label,disabled] of [["left","Left",false],["center","Center",false],["right","Right",true]]){const button=document.createElement("spui-toolbar-radio-button");button.setAttribute("name","alignment");button.setAttribute("value",value);if(disabled)button.setAttribute("disabled","");button.textContent=label;group.append(button)}const commands=document.createElement("spui-toolbar-group");commands.setAttribute("label","View options");const bold=document.createElement("button");bold.textContent="Bold";commands.append(bold);toolbar.append(group,commands);document.querySelector("#native").append(toolbar)};`,
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='native'></div><div id='react'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const reactToolbar = page.getByTestId("react-toolbar");
  const reactGroup = reactToolbar.getByRole("radiogroup", { name: "Text alignment" });
  const reactLeft = reactGroup.getByRole("radio", { name: "Left" });
  const reactCenter = reactGroup.getByRole("radio", { name: "Center" });
  const reactRight = reactGroup.getByRole("radio", { name: "Right" });
  assert.equal(await reactLeft.getAttribute("aria-checked"), "true");
  assert.equal(await reactCenter.getAttribute("aria-checked"), "false");
  assert.equal(await reactRight.isDisabled(), true);
  assert.equal(await reactLeft.getAttribute("aria-pressed"), null, "radio buttons do not expose toggle-button semantics");
  await reactCenter.click();
  await page.waitForFunction(() => document.querySelector('[data-testid="react-toolbar"]')?.querySelector('[value="center"]')?.hasAttribute("checked"));
  assert.deepEqual(await page.evaluate(() => window.reactSelection), { name: "alignment", checkedItems: ["center"], eventType: "click", currentTarget: "BUTTON", nativeEventType: "click" });
  assert.equal(await reactCenter.getAttribute("aria-checked"), "true", "controlled React values update the selected radio");
  await reactCenter.focus(); await page.keyboard.press("ArrowRight");
  assert.equal(await page.getByTestId("react-bold").evaluate(node => node.shadowRoot.querySelector("button").tabIndex), 0, "toolbar navigation skips disabled radios and crosses groups");
  assert.equal(await page.getByTestId("react-grid").locator("button").getAttribute("aria-pressed"), "false", "ToolbarToggleButton uses the shared toggle engine");

  await page.evaluate(() => window.mountNative());
  const nativeToolbar = page.locator("#native-toolbar");
  const nativeGroup = nativeToolbar.getByRole("radiogroup", { name: "Text alignment" });
  const nativeLeft = nativeGroup.getByRole("radio", { name: "Left" });
  const nativeCenter = nativeGroup.getByRole("radio", { name: "Center" });
  assert.equal(await nativeCenter.getAttribute("aria-checked"), "true", "custom element default checked values initialize the group");
  await nativeLeft.click();
  assert.deepEqual(await page.evaluate(() => window.nativeSelection), { name: "alignment", checkedItems: ["left"], eventType: "click", currentTarget: "BUTTON" });
  assert.equal(await nativeLeft.getAttribute("aria-checked"), "true");
  assert.equal(await nativeCenter.getAttribute("aria-checked"), "false", "custom element radio selection is exclusive by name");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", reactControlledRadioSelection: true, nativeDefaultAndRadioSelection: true, radiogroupSemantics: true, disabledRadioSkipped: true, toolbarButtonAndToggleAliases: true, pageErrors: errors }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
