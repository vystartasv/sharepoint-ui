import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    sourcefile: "button-polymorphic.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.actions=0;window.links=0;window.formSubmits=0;window.fieldsetSubmits=0;window.formResets=0;window.invalidEvents=0;window.preventClicks=0;window.nativePrevented=false;window.submitData=[];window.submitterAttrs=[];createRoot(document.querySelector("#root")).render(<><Button data-testid="link" as="a" href="/destination" target="_blank" onClick={()=>window.links++}>Open page</Button><Button data-testid="action" as="a" onClick={()=>window.actions++}>Run action</Button><Button data-testid="disabled" as="a" href="/blocked" disabled disabledFocusable onClick={()=>window.actions++}>Disabled link</Button><Button data-testid="unsafe" as="a" href="javascript:alert(1)">Unsafe link</Button><Button data-testid="native" onClick={()=>window.actions++}>Native button</Button><form data-testid="submit-form" onSubmit={event=>{event.preventDefault();window.formSubmits++;const submitter=event.nativeEvent.submitter;window.submitterAttrs=[submitter.getAttribute("formaction"),submitter.getAttribute("formenctype"),submitter.getAttribute("formmethod"),submitter.getAttribute("formnovalidate"),submitter.getAttribute("formtarget")];window.submitData=[...new FormData(event.currentTarget,submitter).entries()]}}><input data-testid="required-input" name="title" required onInvalid={()=>window.invalidEvents++}/><Button data-testid="submit" type="submit" name="command" value="save">Save form</Button><Button data-testid="form-override" type="submit" name="command" value="override" formAction="/override" formMethod="post" formEncType="text/plain" formNoValidate formTarget="_self">Override form settings</Button><Button data-testid="prevent-submit" type="submit" onClick={event=>{window.preventClicks++;event.preventDefault();window.nativePrevented=event.nativeEvent.defaultPrevented}}>Cancel submission</Button><Button data-testid="disabled-submit" type="submit" disabled>Disabled submit</Button></form><form data-testid="fieldset-form" onSubmit={event=>{event.preventDefault();window.fieldsetSubmits++}}><fieldset data-testid="disabled-fieldset" disabled><Button data-testid="fieldset-submit" type="submit">Disabled by fieldset</Button></fieldset></form><form data-testid="reset-form" onReset={()=>window.formResets++}><input data-testid="reset-input" defaultValue="Original"/><Button data-testid="reset" type="reset">Reset form</Button></form><form id="external-form" data-testid="external-form" onSubmit={event=>{event.preventDefault();window.externalSubmits=(window.externalSubmits??0)+1}}/><Button data-testid="external-submit" form="external-form" type="submit">Submit external form</Button></>);`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve(root, "node_modules/react"), "react-dom/client": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve(root, "examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><div id='root'></div><script src='/bundle.js'></script>"));
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
  const link = page.getByTestId("link").locator("a");
  assert.equal(await link.getAttribute("href"), "/destination");
  assert.equal(await link.getAttribute("role"), "link");
  assert.match(await link.getAttribute("rel"), /noopener/);
  assert.match(await link.getAttribute("rel"), /noreferrer/);
  const action = page.getByTestId("action").locator("a");
  assert.equal(await action.getAttribute("role"), "button");
  assert.equal(await action.getAttribute("tabindex"), "0");
  await action.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.actions), 1, "action anchor activates with Enter");
  await action.focus();
  await page.keyboard.press("Space");
  assert.equal(await page.evaluate(() => window.actions), 2, "action anchor activates with Space");
  const disabled = page.getByTestId("disabled").locator("a");
  assert.equal(await disabled.getAttribute("href"), null, "disabled anchor cannot navigate");
  assert.equal(await disabled.getAttribute("aria-disabled"), "true");
  assert.equal(await disabled.getAttribute("tabindex"), "0", "disabledFocusable anchor remains focusable");
  await disabled.focus();
  await page.keyboard.press("Enter");
  await page.getByTestId("unsafe").locator("a").click();
  assert.equal(await page.evaluate(() => window.actions), 2, "disabledFocusable blocks action callbacks");
  assert.equal(await page.getByTestId("unsafe").locator("a").getAttribute("href"), null, "unsafe URL scheme is discarded");
  const native = page.getByTestId("native").locator("button");
  assert.equal(await native.getAttribute("type"), "button", "default root remains a native button");
  assert.equal(await page.evaluate(() => window.links), 0);
  await page.getByTestId("submit").locator("button").click();
  assert.equal(await page.evaluate(() => window.formSubmits), 0, "required validation blocks submission");
  assert.equal(await page.evaluate(() => window.invalidEvents), 1, "submit preserves native constraint validation");
  await page.getByTestId("required-input").fill("Draft");
  await page.getByTestId("submit").locator("button").click();
  assert.equal(await page.evaluate(() => window.formSubmits), 1, "type=submit participates in the ancestor form");
  assert.deepEqual(await page.evaluate(() => window.submitData), [["title", "Draft"], ["command", "save"]], "submit preserves input data and the Button name/value");
  await page.getByTestId("form-override").locator("button").click();
  assert.equal(await page.evaluate(() => window.formSubmits), 2, "form override submitter activates");
  assert.deepEqual(await page.evaluate(() => window.submitterAttrs), ["/override", "text/plain", "post", "true", "_self"], "native form override props are copied to the form submitter");
  await page.getByTestId("prevent-submit").locator("button").click();
  assert.equal(await page.evaluate(() => window.preventClicks), 1, "React receives click before form proxy activation");
  assert.equal(await page.evaluate(() => window.nativePrevented), true, "React preventDefault reaches the native click event");
  assert.equal(await page.evaluate(() => window.formSubmits), 2, "preventDefault on the React click cancels form submission");
  await page.getByTestId("disabled-submit").evaluate(host => host.shadowRoot.querySelector("button").click());
  assert.equal(await page.evaluate(() => window.formSubmits), 2, "prevented and disabled submit buttons do not submit");
  const fieldsetButton = page.getByTestId("fieldset-submit").locator("button");
  assert.equal(await fieldsetButton.isDisabled(), true, "disabled fieldset disables the shadow button");
  await fieldsetButton.evaluate(button => button.click());
  assert.equal(await page.evaluate(() => window.fieldsetSubmits), 0, "disabled fieldset prevents form-associated submission");
  await page.getByTestId("disabled-fieldset").evaluate(fieldset => fieldset.disabled = false);
  assert.equal(await fieldsetButton.isDisabled(), false, "enabling the fieldset restores the shadow button");
  await fieldsetButton.click();
  assert.equal(await page.evaluate(() => window.fieldsetSubmits), 1, "reenabled fieldset button submits its form");
  await page.getByTestId("external-submit").locator("button").click();
  assert.equal(await page.evaluate(() => window.externalSubmits), 1, "form attribute associates an external form");
  const resetInput = page.getByTestId("reset-input");
  await resetInput.fill("Changed");
  await page.getByTestId("reset").locator("button").click();
  assert.equal(await resetInput.inputValue(), "Original", "type=reset restores ancestor form controls");
  assert.equal(await page.evaluate(() => window.formResets), 1, "type=reset dispatches the form reset event");
  const css = await page.getByTestId("link").evaluate(host => host.shadowRoot.querySelector("style")?.textContent ?? [...host.shadowRoot.adoptedStyleSheets].flatMap(sheet => [...sheet.cssRules].map(rule => rule.cssText)).join(" "));
  assert.match(css, /--spui-semantic-button-border/, "polymorphic selector expansion preserves theme token names");
  await page.evaluate(() => {
    const element = document.createElement("spui-button");
    element.id = "native-anchor"; element.setAttribute("as", "a"); element.setAttribute("href", "/native"); element.textContent = "Native link";
    document.body.append(element);
  });
  const nativeAnchor = page.locator("#native-anchor").locator("a");
  assert.equal(await nativeAnchor.getAttribute("href"), "/native", "framework-neutral custom element keeps native link behavior");
  assert.equal(await nativeAnchor.getAttribute("role"), "link");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", anchorLink: true, actionAnchorKeyboardActivation: true, disabledFocusableAnchor: true, unsafeUrlBlocked: true, nativeButtonDefault: true, nativeCustomElementLink: true, formSubmitAndReset: true, nativeConstraintValidation: true, submitterNameValue: true, preventedAndDisabledSubmit: true, externalFormAssociation: true, disabledFieldsetBehavior: true, pageErrors: errors.length }, null, 2));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
