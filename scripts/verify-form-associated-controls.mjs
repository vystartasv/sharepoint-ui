import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const root = process.cwd();
const reactPath = resolve(root, "packages/sharepoint-ui/src/react.tsx");
const componentNames = [
  "Button", "Checkbox", "ColorPicker", "ComboBox", "DatePicker", "Dropdown", "FileUpload",
  "Input", "RadioGroup", "Rating", "RichTextEditor", "SearchBox", "Select", "Slider",
  "SpinButton", "Switch", "TagPicker", "TextArea",
];
const componentCatalog = JSON.parse(await readFile(resolve(root, "packages/sharepoint-ui/components.json"), "utf8"));
const nativeTags = componentNames.map(name => componentCatalog.components.find(component => component.react === name)?.tag);
assert.ok(nativeTags.every(Boolean), "all form-associated controls have registered custom-element tags");
const labelledControlSelectors = new Map([
  ["Button", "button"], ["Checkbox", "input"], ["ColorPicker", ".picker"], ["ComboBox", "[role=combobox]"],
  ["DatePicker", "input"], ["Dropdown", "[role=combobox]"], ["FileUpload", "input"], ["Input", "input"],
  ["RadioGroup", "fieldset"], ["Rating", "[role=radiogroup]"], ["RichTextEditor", "[role=textbox]"],
  ["SearchBox", "input"], ["Select", "select"], ["Slider", "input"], ["SpinButton", "input"],
  ["Switch", "input"], ["TagPicker", "input"], ["TextArea", "textarea"],
]);
const labelledControlNames = new Set(labelledControlSelectors.keys());
const labelledControls = [...labelledControlSelectors].map(([name, selector]) => [componentNames.indexOf(name), selector]);
const labelledControlIndexes = labelledControls.map(([index]) => index);
const descriptionPaths = labelledControls.flatMap(([index, selector]) => [["data-form-check", index, selector], ["data-native-check", index, selector]]);
const namePaths = descriptionPaths;

const program = ts.createProgram([reactPath], {
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  target: ts.ScriptTarget.ES2022,
  strict: true,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();
const sourceFile = program.getSourceFile(reactPath);
assert.ok(sourceFile, "React adapter source is available to TypeScript");
for (const name of componentNames) {
  const declaration = sourceFile.statements.find(statement =>
    ts.isVariableStatement(statement)
    && statement.declarationList.declarations.some(item => ts.isIdentifier(item.name) && item.name.text === name))
    ?.declarationList.declarations.find(item => ts.isIdentifier(item.name) && item.name.text === name);
  assert.ok(declaration?.initializer && ts.isCallExpression(declaration.initializer), `${name} has a React adapter declaration`);
  const propsType = declaration.initializer.typeArguments?.[1];
  assert.ok(propsType, `${name} declares its adapter props type`);
  const props = checker.getTypeFromTypeNode(propsType);
  assert.ok(checker.getPropertyOfType(props, "form"), `${name} React props expose native form ownership`);
}

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";
import { createRoot } from "react-dom/client";
import { ${componentNames.join(", ")} } from "${reactPath}";
window.mount = () => createRoot(document.querySelector("#root")).render(React.createElement(React.Fragment, null,
  React.createElement("form", { id: "external-controls" }),
  ...[${componentNames.join(", ")}].map((Component, index) => React.createElement(Component, { key: index, "data-form-check": String(index), form: "external-controls", name: "field" + index, "aria-labelledby": "form-control-label", ...([${labelledControlIndexes.join(", ")}].includes(index) ? { "aria-describedby": "form-control-description", "aria-description": "Host description fallback" } : {}) }))));
window.mountNative = () => {
  const tags = ${JSON.stringify(nativeTags)};
  const describedIndexes = ${JSON.stringify(labelledControlIndexes)};
  for (let index = 0; index < tags.length; index++) {
    const host = document.createElement(tags[index]);
    host.setAttribute("data-native-check", String(index));
    host.setAttribute("form", "external-controls");
    host.setAttribute("name", "native-field" + index);
    host.setAttribute("aria-labelledby", "form-control-label");
    if (describedIndexes.includes(index)) {
      host.setAttribute("aria-describedby", "form-control-description");
      host.setAttribute("aria-description", "Host description fallback");
    }
    document.querySelector("#native").append(host);
  }
};`,
    resolveDir: root,
    sourcefile: "form-associated-controls.tsx",
    loader: "tsx",
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  alias: { react: resolve(root, "node_modules/react"), "react-dom/client": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve(root, "examples/spfx124-webpart/node_modules")],
  write: false,
});
const server = createServer((request, response) => {
  if (new URL(request.url, "http://localhost").pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><span id='form-control-label' hidden>Form control name</span><span id='form-control-description' hidden>Form control help text</span><div id='root'></div><div id='native'></div></body></html>");
  if (new URL(request.url, "http://localhost").pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  response.writeHead(404).end();
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium, webkit } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await (process.env.SPUI_BROWSER === "webkit" ? webkit : chromium).launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.stack ?? error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/bundle.js` });
  await page.evaluate(() => { window.mount(); window.mountNative(); });
  const associations = await page.locator("[data-form-check]").evaluateAll(nodes => nodes.map(node => ({
    index: Number(node.getAttribute("data-form-check")),
    formId: node.form?.id,
  })));
  assert.equal(associations.length, componentNames.length, "all form-associated React controls rendered");
  for (const association of associations) assert.equal(association.formId, "external-controls", `${componentNames[association.index]} associates with an external form`);
  const unresolvedNames = await page.evaluate(paths => paths.flatMap(([attribute, index, selector]) => {
    const control = document.querySelector(`[${attribute}="${index}"]`)?.shadowRoot?.querySelector(selector);
    return control && control.getAttribute("aria-label") !== "Form control name" && control.getAttribute("aria-labelledby") !== "form-control-label" ? [{ attribute, index, tag: control.localName }] : [];
  }), namePaths);
  assert.deepEqual(unresolvedNames, [], "React and native primary controls inherit aria-labelledby from the host");
  const unresolvedDescriptions = await page.evaluate(paths => paths.flatMap(([attribute, index, selector]) => {
    const control = document.querySelector(`[${attribute}="${index}"]`)?.shadowRoot?.querySelector(selector);
    return control?.getAttribute("aria-description") === "Form control help text" ? [] : [{ attribute, index, tag: control?.localName, description: control?.getAttribute("aria-description"), describedBy: control?.getAttribute("aria-describedby") }];
  }), descriptionPaths);
  assert.deepEqual(unresolvedDescriptions, [], "React and native primary controls resolve external aria-describedby references");
  assert.equal(await page.locator(`[data-form-check="${componentNames.indexOf("Input")}"]`).getByRole("textbox", { name: "Form control name", description: "Form control help text", exact: true }).count(), 1, "Input exposes a description referenced from outside its shadow root");
  await page.evaluate(() => {
    const description = document.getElementById("form-control-description");
    description.setAttribute("aria-labelledby", "nested-form-control-description");
    const nested = document.createElement("span"); nested.id = "nested-form-control-description"; nested.textContent = "Nested help text"; document.body.append(nested);
  });
  await page.waitForFunction(paths => paths.every(([attribute, index, selector]) => document.querySelector(`[${attribute}="${index}"]`)?.shadowRoot?.querySelector(selector)?.getAttribute("aria-description") === "Nested help text"), descriptionPaths);
  await page.evaluate(() => { document.getElementById("nested-form-control-description").textContent = "Updated nested help text"; });
  await page.waitForFunction(paths => paths.every(([attribute, index, selector]) => document.querySelector(`[${attribute}="${index}"]`)?.shadowRoot?.querySelector(selector)?.getAttribute("aria-description") === "Updated nested help text"), descriptionPaths);
  await page.evaluate(() => {
    const replacement = document.createElement("span"); replacement.id = "nested-form-control-description"; replacement.textContent = "Replacement nested help text";
    document.getElementById("nested-form-control-description").replaceWith(replacement);
  });
  await page.waitForFunction(paths => paths.every(([attribute, index, selector]) => document.querySelector(`[${attribute}="${index}"]`)?.shadowRoot?.querySelector(selector)?.getAttribute("aria-description") === "Replacement nested help text"), descriptionPaths);
  const inputIndex = componentNames.indexOf("Input");
  assert.equal(await page.locator(`[data-form-check="${componentNames.indexOf("Input")}"]`).getByRole("textbox", { name: "Form control name", description: "Replacement nested help text", exact: true }).count(), 1, "Input tracks nested description changes and replacement across its shadow boundary");
  await page.evaluate(paths => paths.forEach(([attribute, index]) => document.querySelector(`[${attribute}="${index}"]`).removeAttribute("aria-describedby")), descriptionPaths);
  await page.waitForTimeout(50);
  const descriptionFallbacks = await page.evaluate(paths => paths.flatMap(([attribute, index, selector]) => {
    const control = document.querySelector(`[${attribute}="${index}"]`)?.shadowRoot?.querySelector(selector);
    return control && (control.getAttribute("aria-description") !== "Host description fallback" || control.getAttribute("aria-describedby") === "form-control-description")
      ? [{ attribute, index, tag: control.localName, role: control.getAttribute("role"), description: control.getAttribute("aria-description"), describedBy: control.getAttribute("aria-describedby") }]
      : [];
  }), descriptionPaths);
  assert.deepEqual(descriptionFallbacks, [], "external aria-describedby takes precedence, then removing it restores aria-description on React and native controls");
  await page.evaluate(() => { document.getElementById("form-control-label").textContent = "Updated form control name"; });
  await page.waitForFunction(paths => paths.every(([attribute, index, selector]) => {
    const control = document.querySelector(`[${attribute}="${index}"]`)?.shadowRoot?.querySelector(selector);
    return control?.getAttribute("aria-label") === "Updated form control name" || control?.getAttribute("aria-labelledby") === "form-control-label";
  }), namePaths);
  await page.evaluate(paths => paths.forEach(([attribute, index]) => document.querySelector(`[${attribute}="${index}"]`).removeAttribute("aria-labelledby")), namePaths);
  await page.waitForFunction(paths => paths.every(([attribute, index, selector]) => {
    const control = document.querySelector(`[${attribute}="${index}"]`)?.shadowRoot?.querySelector(selector);
    return control && control.getAttribute("aria-label") !== "Updated form control name" && control.getAttribute("aria-labelledby") !== "form-control-label";
  }), namePaths);
  const inputHost = page.locator(`[data-form-check="${componentNames.indexOf("Input")}"]`);
  await inputHost.evaluate(host => {
    host.setAttribute("aria-labelledby", "late-form-control-label");
    const label = document.createElement("span"); label.id = "late-form-control-label"; label.textContent = "Late form label"; document.body.append(label);
  });
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Late form label", componentNames.indexOf("Input"));
  await page.evaluate(() => { document.getElementById("late-form-control-label").textContent = "Updated late form label"; });
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Updated late form label", componentNames.indexOf("Input"));
  await page.evaluate(() => {
    document.getElementById("late-form-control-label").setAttribute("aria-labelledby", "nested-form-control-label");
    const nested = document.createElement("span"); nested.id = "nested-form-control-label"; nested.setAttribute("aria-labelledby", "final-form-control-label"); nested.textContent = "ignored intermediate name";
    const final = document.createElement("span"); final.id = "final-form-control-label"; final.textContent = "Recursive form label";
    document.body.append(nested, final);
  });
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Recursive form label", componentNames.indexOf("Input"));
  await page.evaluate(() => { document.getElementById("final-form-control-label").textContent = "Updated recursive form label"; });
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Updated recursive form label", componentNames.indexOf("Input"));
  await page.evaluate(() => {
    const replacement = document.createElement("span"); replacement.id = "final-form-control-label"; replacement.textContent = "Replaced recursive form label";
    document.getElementById("final-form-control-label").replaceWith(replacement);
  });
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Replaced recursive form label", componentNames.indexOf("Input"));
  await page.evaluate(index => {
    const visible = document.createElement("span"); visible.id = "visible-form-control-label"; visible.append("Visible name", Object.assign(document.createElement("span"), { textContent: "ignored hidden name" }));
    visible.lastElementChild.setAttribute("aria-hidden", "true");
    const hidden = document.createElement("span"); hidden.id = "hidden-form-control-label"; hidden.hidden = true; hidden.textContent = "Direct hidden name";
    document.body.append(visible, hidden);
    document.querySelector(`[data-form-check="${index}"]`).setAttribute("aria-labelledby", visible.id);
  }, inputIndex);
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Visible name", componentNames.indexOf("Input"));
  await page.evaluate(index => document.querySelector(`[data-form-check="${index}"]`).setAttribute("aria-labelledby", "hidden-form-control-label"), inputIndex);
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Direct hidden name", componentNames.indexOf("Input"));
  await page.evaluate(index => {
    const first = document.createElement("span"); first.id = "cycle-form-label-first"; first.setAttribute("aria-labelledby", "cycle-form-label-second"); first.setAttribute("aria-label", "Cycle fallback name");
    const second = document.createElement("span"); second.id = "cycle-form-label-second"; second.setAttribute("aria-labelledby", "cycle-form-label-first"); second.textContent = "Cycle content";
    const before = document.createElement("span"); before.id = "ordered-form-label-before"; before.textContent = "First phrase";
    const after = document.createElement("span"); after.id = "ordered-form-label-after"; after.textContent = "Second phrase";
    document.body.append(first, second, before, after);
    document.querySelector(`[data-form-check="${index}"]`).setAttribute("aria-labelledby", first.id);
  }, inputIndex);
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Cycle fallback name", inputIndex);
  await page.evaluate(index => document.querySelector(`[data-form-check="${index}"]`).setAttribute("aria-labelledby", "ordered-form-label-after ordered-form-label-before"), inputIndex);
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Second phrase First phrase", inputIndex);
  await page.evaluate(index => {
    const value = document.createElement("input"); value.id = "referenced-form-control-value"; value.value = "Before input event"; document.body.append(value);
    document.querySelector(`[data-form-check="${index}"]`).setAttribute("aria-labelledby", value.id);
  }, inputIndex);
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "Before input event", inputIndex);
  await page.evaluate(() => {
    const value = document.getElementById("referenced-form-control-value"); value.value = "After input event"; value.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForFunction(index => document.querySelector(`[data-form-check="${index}"]`)?.shadowRoot?.querySelector("input")?.getAttribute("aria-label") === "After input event", inputIndex);
  assert.deepEqual(errors, [], "form-associated controls render without browser errors");
  console.log(`Verified form prop types and external ownership for ${componentNames.length} React controls, plus recursive accessible names and descriptions across ${labelledControlNames.size} React and native control pairs.`);
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
