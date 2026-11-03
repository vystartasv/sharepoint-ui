import assert from "node:assert/strict";
import { createRequire } from "node:module";
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
  ...[${componentNames.join(", ")}].map((Component, index) => React.createElement(Component, { key: index, "data-form-check": String(index), form: "external-controls", name: "field" + index, "aria-labelledby": "form-control-label" }))));`,
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
  if (new URL(request.url, "http://localhost").pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><span id='form-control-label' hidden>Form control name</span><div id='root'></div></body></html>");
  if (new URL(request.url, "http://localhost").pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  response.writeHead(404).end();
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/bundle.js` });
  await page.evaluate(() => window.mount());
  const associations = await page.locator("[data-form-check]").evaluateAll(nodes => nodes.map(node => ({
    index: Number(node.getAttribute("data-form-check")),
    formId: node.form?.id,
  })));
  assert.equal(associations.length, componentNames.length, "all form-associated React controls rendered");
  for (const association of associations) assert.equal(association.formId, "external-controls", `${componentNames[association.index]} associates with an external form`);
  const labelledControlNames = new Set(["Button", "Checkbox", "ComboBox", "Input", "RadioGroup", "SearchBox", "Select", "Slider", "SpinButton", "Switch", "TextArea"]);
  for (const name of labelledControlNames) {
    const host = page.locator(`[data-form-check="${componentNames.indexOf(name)}"]`);
    const resolved = await host.evaluate(element => element.shadowRoot
      ? [...element.shadowRoot.querySelectorAll("input,select,textarea,button,fieldset,[role=combobox]")].some(control => control.getAttribute("aria-label") === "Form control name")
      : false);
    assert.equal(resolved, true, `${name} resolves an external aria-labelledby reference into its shadow control`);
  }
  assert.deepEqual(errors, [], "form-associated controls render without browser errors");
  console.log(`Verified form prop types and external form ownership for ${componentNames.length} React controls.`);
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
