import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";
import { createRoot } from "react-dom/client";
import { RichTextEditor, SharePointUIProvider } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
import { defineRichTextEditor } from "${resolve("packages/sharepoint-ui/src/elements/rich-text-editor.ts")}";
window.mount = () => {
  defineRichTextEditor();
  const native = document.createElement("spui-rich-text-editor"); native.setAttribute("label", "Native editor"); native.setAttribute("name", "body"); native.setAttribute("required", ""); native.setAttribute("value", "<p>Initial body</p>"); native.id = "native";
  native.value = "<table><thead><tr><th scope=\\\"col\\\">Head A</th><th scope=\\\"col\\\">Head B</th></tr></thead><tbody><tr><td>Cell A</td><td>Cell B</td></tr><tr><td>Cell C</td><td>Cell D</td></tr></tbody></table><script>alert(1)<\\/script>";
  const nativeForm = document.createElement("form"); nativeForm.id = "native-form"; nativeForm.append(native); const disabledFieldset = document.createElement("fieldset"); disabledFieldset.id = "native-editor-fieldset"; disabledFieldset.disabled = true; const disabledEditor = document.createElement("spui-rich-text-editor"); disabledEditor.name = "disabledBody"; disabledEditor.setAttribute("required", ""); disabledFieldset.append(disabledEditor); nativeForm.append(disabledFieldset); document.querySelector("#native-root").append(nativeForm);
  native.value = "<table><thead><tr><th scope=\\\"col\\\">Head A</th><th scope=\\\"col\\\">Head B</th></tr></thead><tbody><tr><td>Cell A</td><td>Cell B</td></tr><tr><td>Cell C</td><td>Cell D</td></tr></tbody></table><script>alert(1)<\\/script>";
  function App() { return <SharePointUIProvider lang="ar" dir="rtl" strings={{ richTextChooseImage: "اختر صورة", richTextRequired: "أدخل نصًا.", richTextInsertImage: "إدراج صورة", richTextInsertRowBelow: "إدراج صف أسفل", richTextInsertColumnAfter: "إدراج عمود بعد", richTextDeleteRow: "حذف الصف", richTextDeleteColumn: "حذف العمود", richTextDeleteTable: "حذف الجدول" }}><><form id="react-form"><RichTextEditor label="محرر أصلي" data-testid="react" name="body" required defaultValue={native.value} onImageUpload={async file => "https://contoso.sharepoint.com/ReactAssets/" + encodeURIComponent(file.name)}></RichTextEditor></form><form id="external-rich-form"></form><RichTextEditor label="External editor" data-testid="react-external" name="externalBody" form="external-rich-form" required defaultValue="<p>External body</p>" /><RichTextEditor label="Required editor" data-testid="react-required" required /><RichTextEditor label="Read-only required editor" data-testid="react-readonly" readOnly required /><RichTextEditor label="Controlled editor" data-testid="react-controlled" value="Controlled" /></></SharePointUIProvider>; }
  createRoot(document.querySelector("#react-root")).render(<App />);
};`,
    resolveDir: process.cwd(),
    sourcefile: "rich-text-check.tsx",
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
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html lang='en'><body><div id='native-root'></div><div id='react-root'></div></body></html>");
  if (pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  response.writeHead(404).end();
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.setDefaultTimeout(3000);
  const errors = [];
  page.on("pageerror", error => errors.push({ message: error.message, stack: error.stack }));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/bundle.js` });
  await page.evaluate(() => window.mount());
  const native = page.locator("#native");
  const preconnectedValue = await page.evaluate(() => {
    const editor = document.createElement("spui-rich-text-editor");
    editor.dataset.testid = "preconnected-editor";
    editor.value = "<p>Assigned before connection</p>";
    const beforeConnection = editor.value;
    document.querySelector("#native-root").append(editor);
    const afterConnection = editor.value;
    editor.formStateRestoreCallback("<p>Restored by the browser</p>");
    return { beforeConnection, afterConnection, afterRestore: editor.value };
  });
  assert.deepEqual(preconnectedValue, { beforeConnection: "<p>Assigned before connection</p>", afterConnection: "<p>Assigned before connection</p>", afterRestore: "<p>Restored by the browser</p>" }, "pre-connection assignment and browser-restored form state survive custom-element connection");
  const selectCell = cell => cell.click();
  const editTable = async editor => {
    const cell = editor.locator("[role=textbox] td").first();
    await selectCell(cell);
    const rowButton = editor.getByRole("button", { name: /Insert row below|إدراج صف أسفل/ });
    await rowButton.waitFor({ state: "visible" });
    await page.waitForFunction(element => !element.disabled, await rowButton.elementHandle());
    assert.equal(await rowButton.isDisabled(), false);
    await rowButton.click();
    await assertCount(editor.locator("tbody tr"), 3);
    const addColumn = editor.getByRole("button", { name: /Insert column after|إدراج عمود بعد/ });
    await addColumn.click();
    await assertCount(editor.locator("tbody tr:first-child td"), 3);
    const removeColumn = editor.getByRole("button", { name: /Delete column|حذف العمود/ });
    await removeColumn.click();
    await assertCount(editor.locator("tbody tr:first-child td"), 2);
    const removeRow = editor.getByRole("button", { name: /Delete row|حذف الصف/ });
    await removeRow.click();
    await assertCount(editor.locator("tbody tr"), 2);
    assert.equal(await editor.locator("script").count(), 0);
    return editor.locator("[role=textbox]").getAttribute("aria-label");
  };
  const nativeLabel = await editTable(native);
  const reactEditor = page.getByTestId("react");
  const requiredEditor = page.getByTestId("react-required");
  assert.deepEqual(await requiredEditor.evaluate(host => ({ valid: host.checkValidity(), message: host.validationMessage, missing: host.validity?.valueMissing, willValidate: host.willValidate })), { valid: false, message: "أدخل نصًا.", missing: true, willValidate: true }, "required validation exposes localized native validity state and message");
  const readOnlyEditor = page.getByTestId("react-readonly");
  assert.deepEqual(await readOnlyEditor.evaluate(host => ({ valid: host.checkValidity(), willValidate: host.willValidate, readOnly: host.getAttribute("read-only") })), { valid: true, willValidate: false, readOnly: "true" }, "read-only required editors are barred from validation like native controls");
  await requiredEditor.evaluate(host => host.setCustomValidity("Custom editor error."));
  assert.equal(await requiredEditor.evaluate(host => host.validationMessage), "Custom editor error.", "RichTextEditor supports setCustomValidity");
  await requiredEditor.evaluate(host => host.setCustomValidity(""));
  await requiredEditor.evaluate(host => host.setAttribute("required-message", "الرجاء إدخال محتوى."));
  assert.equal(await requiredEditor.evaluate(host => host.validationMessage), "الرجاء إدخال محتوى.", "required validation message updates when localization changes");
  assert.equal(await reactEditor.locator('input[type="file"]').getAttribute("aria-label"), "اختر صورة", "the hidden image file input receives the provider's localized accessible name");
  await reactEditor.evaluate(host => host.setAttribute("image-input-label", "اختر ملف صورة"));
  assert.equal(await reactEditor.locator('input[type="file"]').getAttribute("aria-label"), "اختر ملف صورة", "the hidden image file input tracks runtime localization updates");
  const reactLabel = await editTable(reactEditor);
  const controlledEditor = page.getByTestId("react-controlled");
  const controlledSurface = controlledEditor.locator('[role="textbox"]');
  await controlledSurface.click();
  await controlledSurface.press("End");
  await controlledSurface.pressSequentially(" changed");
  assert.equal(await controlledEditor.evaluate(node => node.value), "Controlled", "controlled React value is restored when the owner does not update it");
  assert.equal(await page.locator("#native-form").evaluate(form => form.checkValidity()), true);
  assert.equal(await page.locator("#react-form").evaluate(form => form.checkValidity()), true);
  assert.deepEqual(await page.locator("#native-form").evaluate(form => [...new FormData(form).entries()]), [["body", await native.evaluate(node => node.value)]]);
  assert.deepEqual(await page.locator("#react-form").evaluate(form => [...new FormData(form).entries()]), [["body", await reactEditor.evaluate(node => node.value)]]);
  const externalEditor = page.getByTestId("react-external");
  assert.equal(await externalEditor.evaluate(host => host.form?.id), "external-rich-form", "React RichTextEditor associates with a form outside its DOM subtree");
  assert.deepEqual(await page.locator("#external-rich-form").evaluate(form => [...new FormData(form).entries()]), [["externalBody", "<p>External body</p>"]], "externally associated RichTextEditor contributes its value to FormData");
  const disabledNativeEditor = page.locator("#native-editor-fieldset spui-rich-text-editor");
  assert.equal(await disabledNativeEditor.locator('[role="textbox"]').getAttribute("contenteditable"), "false", "disabled fieldsets disable editor input");
  await page.locator("#native-form").evaluate(form => { const disabled = new FormData(form).get("disabledBody"); if (disabled !== null) throw new Error("disabled editor submitted a form value"); });
  await page.locator("#native-editor-fieldset").evaluate(fieldset => { fieldset.disabled = false; });
  assert.equal(await disabledNativeEditor.locator('[role="textbox"]').getAttribute("contenteditable"), "true", "reenabling a fieldset restores editor input");
  assert.deepEqual(await disabledNativeEditor.evaluate(host => ({ valid: host.checkValidity(), willValidate: host.willValidate, missing: host.validity?.valueMissing })), { valid: false, willValidate: true, missing: true }, "reenabling a fieldset restores required validation");
  await reactEditor.getByRole("button", { name: "حذف الجدول" }).click();
  await assertCount(reactEditor.locator("[role=textbox] table"), 0);
  assert.equal(await reactEditor.getByRole("button", { name: "حذف الجدول" }).isDisabled(), true);
  await page.waitForFunction(() => typeof document.querySelector('[data-testid="react"]')?.uploadImage === "function");
  await reactEditor.getByRole("button", { name: "إدراج صورة" }).click();
  await reactEditor.locator('input[type="file"]').setInputFiles({ name: "react-image.png", mimeType: "image/png", buffer: Buffer.from("image") });
  await page.waitForFunction(() => document.querySelector('[data-testid="react"]')?.value.includes("ReactAssets/react-image.png"));
  await native.evaluate(node => { node.value = '<table><tbody><tr><td colspan="2">Merged cell</td><td>Other</td></tr><tr><td>A</td><td>B</td><td>C</td></tr></tbody></table>'; });
  await selectCell(native.locator("[role=textbox] td").first());
  assert.equal(await native.getByRole("button", { name: "Insert row below" }).isDisabled(), true);
  await native.evaluate(node => { node.uploadImage = async file => `https://contoso.sharepoint.com/SiteAssets/${encodeURIComponent(file.name)}`; });
  await native.getByRole("button", { name: "Insert image" }).click();
  await native.locator('input[type="file"]').setInputFiles({ name: "diagram.png", mimeType: "image/png", buffer: Buffer.from("image") });
  await page.waitForFunction(() => document.querySelector("#native").value.includes("<img"));
  const savedImageHtml = await native.evaluate(node => node.value);
  assert.match(savedImageHtml, /<img src="https:\/\/contoso\.sharepoint\.com\/SiteAssets\/diagram\.png" alt="diagram\.png">/);
  await native.evaluate(node => { node.value = '<p>safe</p><img src="data:image/png;base64,AAAA" onerror="alert(1)">'; });
  assert.doesNotMatch(await native.evaluate(node => node.value), /data:image|onerror/);
  const pasteHtml = '<h1 onclick="alert(1)">Heading</h1><div><span style="color:red"><strong>First paragraph</strong></span></div><pre>const value = 1;</pre><hr><del>Removed text</del><a href="javascript:alert(1)">unsafe link</a><table><tbody><tr><td>Cell</td></tr></tbody></table><script>alert(1)</script>';
  for (const editor of [native, reactEditor]) {
    const pasted = await editor.evaluate((node, html) => {
      const editable = node.shadowRoot.querySelector('[role="textbox"]');
      editable.replaceChildren();
      editable.focus();
      const selection = editable.ownerDocument.getSelection();
      const range = editable.ownerDocument.createRange();
      range.selectNodeContents(editable);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      const transfer = new DataTransfer();
      transfer.setData("text/html", html);
      transfer.setData("text/plain", "fallback text");
      editable.dispatchEvent(new ClipboardEvent("paste", { clipboardData: transfer, bubbles: true, cancelable: true, composed: true }));
      return node.value;
    }, pasteHtml);
    assert.match(pasted, /<h1>Heading<\/h1>/);
    assert.match(pasted, /<div><strong>First paragraph<\/strong><\/div>/);
    assert.match(pasted, /<pre>const value = 1;<\/pre>/);
    assert.match(pasted, /<hr>/);
    assert.match(pasted, /<del>Removed text<\/del>/);
    assert.match(pasted, /<table>/);
    assert.doesNotMatch(pasted, /onclick|style=|javascript:|<script/i);
  }
  for (const editor of [native, reactEditor]) {
    const plainPasted = await editor.evaluate((node, text) => {
      node.value = "<p>Start</p>";
      const editable = node.shadowRoot.querySelector('[role="textbox"]');
      editable.focus();
      const selection = editable.ownerDocument.getSelection();
      const range = editable.ownerDocument.createRange();
      range.selectNodeContents(editable);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      const transfer = new DataTransfer();
      transfer.setData("text/plain", text);
      editable.dispatchEvent(new ClipboardEvent("paste", { clipboardData: transfer, bubbles: true, cancelable: true, composed: true }));
      return { html: node.value, text: editable.innerText };
    }, "first & second\r\n<script>alert(1)</script>\nlast line");
    assert.deepEqual(plainPasted.text.split(/\n+/), ["Startfirst & second", "<script>alert(1)</script>", "last line"], "plain-text paste preserves CRLF/LF line boundaries and literal markup-looking text");
    assert.doesNotMatch(plainPasted.html, /<script|onerror|javascript:/i, "plain-text paste keeps markup-like text inert");
  }
  for (const editor of [native, reactEditor]) {
    await editor.evaluate(node => { node.value = "<p>History base</p>"; });
    const editable = editor.locator('[role="textbox"]');
    await editable.click();
    await editable.press("End");
    await editable.pressSequentially(" changed");
    assert.match(await editor.evaluate(node => node.value), /History base changed/);
    await editable.press("Control+z");
    assert.doesNotMatch(await editor.evaluate(node => node.value), /changed/);
    await editable.press("Control+Shift+z");
    assert.match(await editor.evaluate(node => node.value), /History base changed/);
  }
  await page.locator("#native-form").evaluate(form => form.reset());
  await page.locator("#react-form").evaluate(form => form.reset());
  assert.equal(await native.evaluate(node => node.value), "<p>Initial body</p>");
  assert.equal(await reactEditor.locator("[role=textbox] table").count(), 1);
  await native.evaluate(node => {
    const editable = node.shadowRoot.querySelector('[role="textbox"]');
    editable.focus();
    const transfer = new DataTransfer();
    transfer.items.add(new File(["image"], "pasted.png", { type: "image/png" }));
    editable.dispatchEvent(new ClipboardEvent("paste", { clipboardData: transfer, bubbles: true, cancelable: true, composed: true }));
    return node.value;
  });
  await page.waitForFunction(() => document.querySelector("#native").value.includes("pasted.png"));
  assert.match(await native.evaluate(node => node.value), /SiteAssets\/pasted\.png/);
  const toolbar = reactEditor.getByRole("toolbar", { name: "Rich text formatting" });
  const bold = toolbar.getByRole("button", { name: "Bold" });
  const italic = toolbar.getByRole("button", { name: "Italic" });
  assert.equal(await reactEditor.getByRole("textbox", { name: "محرر أصلي" }).count(), 1, "RTL editor has a programmatic name");
  await bold.focus(); await page.keyboard.press("ArrowLeft");
  assert.equal(await page.evaluate(() => document.querySelector('[data-testid="react"]').shadowRoot.activeElement?.getAttribute("aria-label")), "Italic", "RTL toolbar arrow keys follow inline direction");
  await page.keyboard.press("Home");
  assert.equal(await page.evaluate(() => document.querySelector('[data-testid="react"]').shadowRoot.activeElement?.getAttribute("aria-label")), "Bold", "Home returns to the first toolbar control");
  await page.keyboard.press("End");
  assert.equal(await page.evaluate(() => document.querySelector('[data-testid="react"]').shadowRoot.activeElement?.getAttribute("aria-label")), "Link", "End moves to the last enabled toolbar control");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.querySelector('[data-testid="react"]').shadowRoot.activeElement?.getAttribute("role")), "textbox", "keyboard users can leave the toolbar and reach the editor");
  assert.equal(await italic.getAttribute("tabindex"), "-1", "toolbar keeps one tab stop after roving focus");
  assert.equal(await nativeLabel, "Native editor");
  assert.equal(await reactLabel, "محرر أصلي");
  assert.deepEqual(errors, [], JSON.stringify(errors));
  console.log(JSON.stringify({ assertions: "passed", nativeTableEditing: true, reactTableEditing: true, richPasteStructureAndSanitization: true, plainTextPastePreservesLineBreaks: true, plainTextMarkupRemainsInert: true, nativeAndReactUndoRedo: true, nativeAndReactDefaultValueReset: true, controlledReactValue: true, formParticipationAndValidity: true, disabledFieldsetDisablesAndReenables: true, pastedImageUpload: true, rtlLabels: true, rtlToolbarRovingFocus: true, tabNavigationBetweenToolbarAndEditor: true, mergedCellGuard: true, sanitizedContent: true, nativeAndReactDurableImageUpload: true, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
async function assertCount(locator, expected) { assert.equal(await locator.count(), expected); }
