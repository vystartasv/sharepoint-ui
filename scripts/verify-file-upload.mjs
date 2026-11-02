import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "file-upload-parity.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{FileUpload}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineFileUpload}from"${resolve("packages/sharepoint-ui/src/elements/file-upload.ts")}";window.fileChanges=[];window.fileErrors=[];function App(){return <form id="react-form"><FileUpload data-testid="react-upload" label="Attachments" name="attachments" accept=".txt,text/plain" multiple required maxFiles={2} maxFileSize={10} onFilesChange={files=>window.fileChanges.push(files.map(file=>file.name))} onFilesError={errors=>window.fileErrors.push(errors.map(error=>error.code))}/><button type="reset">Reset</button></form>}createRoot(document.querySelector("#react")).render(<App/>);window.mountNative=()=>{defineFileUpload();const form=document.createElement("form");form.id="native-form";const fieldset=document.createElement("fieldset");fieldset.disabled=true;const upload=document.createElement("spui-file-upload");upload.dataset.testid="native-upload";upload.setAttribute("label","Supporting files");upload.setAttribute("name","supportingFiles");upload.setAttribute("accept","text/plain");upload.setAttribute("multiple","");upload.setAttribute("required","");fieldset.append(upload);form.append(fieldset);const reset=document.createElement("button");reset.type="reset";reset.textContent="Reset native";form.append(reset);document.querySelector("#native").append(form);window.nativeUpload=upload};window.mountNative();`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='react'></div><div id='native'></div><script src='/bundle.js'></script></body></html>"));
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

  const reactUpload = page.getByTestId("react-upload");
  const reactInput = reactUpload.locator("input[type=file]");
  assert.equal(await reactUpload.getAttribute("role"), "group", "React adapter exposes a group role");
  assert.equal(await reactInput.getAttribute("aria-label"), "Attachments", "native file input has an accessible name");
  assert.equal(await page.locator("#react-form").evaluate(form => form.checkValidity()), false, "required upload starts invalid");
  await reactInput.setInputFiles([
    { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("note") },
    { name: "plan.txt", mimeType: "text/plain", buffer: Buffer.from("plan") },
  ]);
  assert.equal(await page.locator("#react-form").evaluate(form => form.checkValidity()), true, "valid selected files satisfy required validity");
  assert.deepEqual(await reactUpload.locator(".filename").allTextContents(), ["notes.txt", "plan.txt"]);
  assert.deepEqual(await page.locator("#react-form").evaluate(form => [...new FormData(form).getAll("attachments")].map(file => file.name)), ["notes.txt", "plan.txt"], "FileUpload contributes each selected file to FormData");

  await reactInput.setInputFiles({ name: "extra.txt", mimeType: "text/plain", buffer: Buffer.from("extra") });
  assert.equal(await reactUpload.locator(".filename").count(), 2, "maximum file count preserves existing files");
  assert.equal(await reactUpload.locator(".status").getAttribute("role"), "status", "validation errors use a live status region");
  assert.match(await reactUpload.locator(".status").textContent(), /maximum number/i);
  await reactInput.setInputFiles({ name: "image.png", mimeType: "image/png", buffer: Buffer.from("png") });
  assert.match(await reactUpload.locator(".status").textContent(), /not accepted/i, "rejected file types are announced");
  assert.deepEqual(await page.evaluate(() => window.fileErrors), [["too-many-files"], ["file-type-not-accepted"]], "React adapter forwards typed rejection details");

  await page.locator("#react-form button[type=reset]").click();
  assert.equal(await reactUpload.locator(".filename").count(), 0, "form reset clears selected files");
  assert.equal(await reactUpload.locator(".status").textContent(), "", "form reset clears stale file errors");
  assert.deepEqual(await page.locator("#react-form").evaluate(form => [...new FormData(form).entries()]), [], "reset removes files from form submission");
  assert.equal(await page.locator("#react-form").evaluate(form => form.checkValidity()), false, "reset restores required invalidity");

  await reactInput.setInputFiles([
    { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("note") },
    { name: "plan.txt", mimeType: "text/plain", buffer: Buffer.from("plan") },
  ]);
  await reactUpload.getByRole("button", { name: "Remove notes.txt" }).focus();
  await page.keyboard.press("Enter");
  assert.deepEqual(await reactUpload.locator(".filename").allTextContents(), ["plan.txt"], "keyboard removal deletes the requested file");
  assert.equal(await reactUpload.evaluate(host => host.shadowRoot.activeElement?.getAttribute("aria-label")), "Remove plan.txt", "removing a row moves focus to the next file action");
  await page.keyboard.press("Enter");
  assert.equal(await reactUpload.locator(".filename").count(), 0, "keyboard can remove the final file");
  assert.equal(await reactUpload.evaluate(host => host.shadowRoot.activeElement?.className), "browse", "removing the final file returns focus to Browse");
  assert.deepEqual(await page.locator("#react-form").evaluate(form => [...new FormData(form).entries()]), [], "removed files are absent from FormData");

  const nativeUpload = page.getByTestId("native-upload");
  assert.equal(await nativeUpload.locator("input[type=file]").isDisabled(), true, "disabled fieldset disables the internal native file input");
  assert.equal(await nativeUpload.locator(".browse").isDisabled(), true, "disabled fieldset disables the visible browse action");
  await page.locator("#native-form fieldset").evaluate(fieldset => { fieldset.disabled = false; });
  const nativeInput = nativeUpload.locator("input[type=file]");
  assert.equal(await page.locator("#native-form").evaluate(form => form.checkValidity()), false, "enabled required upload participates in native form validity");
  await nativeInput.setInputFiles({ name: "native.txt", mimeType: "text/plain", buffer: Buffer.from("native") });
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).getAll("supportingFiles")].map(file => file.name)), ["native.txt"], "custom element submits files without the React adapter");
  await nativeUpload.getByRole("button", { name: "Remove native.txt" }).focus();
  await page.keyboard.press("Enter");
  assert.equal(await nativeUpload.evaluate(host => host.shadowRoot.activeElement?.className), "browse", "native keyboard removal returns focus to Browse");
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [], "native keyboard removal clears form submission");
  await page.locator("#native-form button[type=reset]").click();
  assert.equal(await nativeUpload.locator(".filename").count(), 0, "direct custom-element form reset clears files");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", reactAndNative: true, acceptedFiles: true, fileCountAndTypeRejection: true, typedErrorCallbacks: true, formDataAndRequiredValidity: true, resetClearsFilesAndStaleErrors: true, keyboardRemovalFocusRestoration: true, disabledFieldset: true, pageErrors: errors }, null, 2));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
