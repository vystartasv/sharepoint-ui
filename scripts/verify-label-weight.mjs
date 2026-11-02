import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "label-weight.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Label,InfoLabel,InfoButton}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{createLabel}from"${resolve("packages/sharepoint-ui/src/elements/label.ts")}";createRoot(document.querySelector("#root")).render(<><Label data-testid="default">Default</Label><Label data-testid="semibold" weight="semibold">Strong</Label><Label data-testid="large" size="large">Large</Label><Label data-testid="required" required>Required</Label><Label data-testid="required-slot" required={{children:"!",className:"custom-required",style:{paddingInlineStart:"9px"}}}>Slot required</Label><Label data-testid="disabled" required disabled>Disabled</Label><InfoLabel data-testid="info" htmlFor="basic" info="Help">Info</InfoLabel><InfoLabel data-testid="slots" htmlFor="custom" info="Custom help" label={{weight:"semibold",className:"label-slot"}} infoButton={{label:"Custom help label",size:"large"}}>Custom</InfoLabel><InfoLabel data-testid="element-slots" htmlFor="custom-element" info="Element help" label={<Label data-testid="custom-label">Element</Label>} infoButton={<InfoButton data-testid="custom-info" label="Element help label"/>}>Ignored</InfoLabel></>);document.body.append(createLabel("Native default"),createLabel("Native strong",{weight:"semibold"}),createLabel("Required native",{required:"!"}),createLabel("Disabled native",{required:true,disabled:true}));` ,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><style>:root{--colorPaletteRedForeground3:rgb(193,55,70);--colorNeutralForegroundDisabled:rgb(120,120,120)}</style><div id=root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  assert.equal(await page.getByTestId("default").evaluate(node => getComputedStyle(node).fontWeight), "400", "Label defaults to Fluent regular weight");
  assert.equal(await page.locator("style[data-spui-label-styles]").count(), 1, "Label shares a single forced-colors stylesheet per document");
  assert.equal(await page.getByTestId("semibold").evaluate(node => getComputedStyle(node).fontWeight), "600", "Label supports semibold weight");
  assert.equal(await page.getByTestId("large").evaluate(node => getComputedStyle(node).fontWeight), "600", "Fluent large labels default to semibold");
  const requiredLabel = page.getByTestId("required");
  assert.equal(await requiredLabel.locator(".spui-label-required").evaluate(node => getComputedStyle(node).color), "rgb(193, 55, 70)", "required marker uses the theme's Fluent danger token");
  assert.equal(await requiredLabel.locator(".spui-label-required").evaluate(node => getComputedStyle(node).paddingInlineStart), "4px", "required marker uses Fluent spacing");
  const requiredSlot = page.getByTestId("required-slot").locator(".custom-required");
  assert.equal(await requiredSlot.textContent(), "!");
  assert.equal(await requiredSlot.getAttribute("aria-hidden"), "true");
  assert.equal(await requiredSlot.evaluate(node => getComputedStyle(node).paddingInlineStart), "9px", "Fluent required-slot props override the marker defaults");
  const disabledLabel = page.getByTestId("disabled");
  assert.equal(await disabledLabel.evaluate(node => getComputedStyle(node).color), "rgb(120, 120, 120)", "disabled labels use the disabled foreground token without opacity fading");
  assert.equal(await disabledLabel.locator(".spui-label-required").evaluate(node => getComputedStyle(node).color), "rgb(120, 120, 120)", "required marker inherits disabled labeling color");
  assert.equal(await disabledLabel.getAttribute("aria-disabled"), null, "visual disabled state does not add ARIA unsupported by Fluent Label");
  assert.equal(await page.getByTestId("info").locator("label").evaluate(node => getComputedStyle(node).fontWeight), "400", "InfoLabel forwards weight");
  assert.equal(await page.getByTestId("info").locator("label").getAttribute("for"), "basic", "InfoLabel keeps label association");
  assert.equal(await page.getByTestId("slots").locator("label").getAttribute("for"), "custom", "label slot props keep label association");
  assert.equal(await page.getByTestId("slots").locator("label").evaluate(node => getComputedStyle(node).fontWeight), "600", "label slot props override label style");
  assert.equal(await page.getByTestId("slots").locator("spui-info-button").getAttribute("label"), "Custom help label", "infoButton slot props customize the trigger");
  assert.equal(await page.getByTestId("element-slots").locator("label").getAttribute("for"), "custom-element", "label slot elements inherit label association");
  assert.equal(await page.getByTestId("element-slots").locator("spui-info-button").getAttribute("label"), "Element help label", "infoButton slot elements are supported");
  const nativeLabels = page.locator("body > label");
  assert.equal(await nativeLabels.nth(0).evaluate(node => getComputedStyle(node).fontWeight), "400");
  assert.equal(await nativeLabels.nth(1).evaluate(node => getComputedStyle(node).fontWeight), "600");
  assert.equal(await nativeLabels.nth(2).locator(".spui-label-required").getAttribute("aria-hidden"), "true");
  assert.equal(await nativeLabels.nth(2).locator(".spui-label-required").evaluate(node => getComputedStyle(node).color), "rgb(193, 55, 70)");
  await page.emulateMedia({ forcedColors: "active" });
  const forcedDisabledColors = await disabledLabel.evaluate(node => ({ label: getComputedStyle(node).color, required: getComputedStyle(node.querySelector(".spui-label-required")).color }));
  assert.equal(forcedDisabledColors.label, forcedDisabledColors.required, "disabled label and required marker share a forced-colors system color");
  assert.notEqual(forcedDisabledColors.label, "rgb(120, 120, 120)", "forced-colors replaces authored disabled colors with GrayText");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", defaultRegular: true, semibold: true, largeDefaultsSemibold: true, requiredMarkerThemeAndSpacing: true, disabledForeground: true, forcedColors: true, infoLabelForwarding: true, labelAssociation: true, labelAndInfoButtonSlots: true, nativeFactory: true, pageErrors: 0 }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
