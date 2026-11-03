import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.card-selection-event-type-contract.tsx");
const typeFixture = `import { Card, type CardProps, type CardOnSelectionChangeEvent } from "./react.js"; type Assert<T extends true> = T; type EventOf<T> = NonNullable<T> extends (event: infer E, ...args: any[]) => unknown ? E : never; type EventMatches = Assert<EventOf<CardProps["onSelectionChange"]> extends CardOnSelectionChangeEvent ? true : false>; const example = <Card onClick={event => { const currentTarget: HTMLDivElement = event.currentTarget; const align: string = event.currentTarget.align; void [currentTarget, align]; }} onClickCapture={event => { const currentTarget: HTMLDivElement = event.currentTarget; void currentTarget; }} onSelectionChange={(event, data) => { const typedEvent: CardOnSelectionChangeEvent = event; const target: Element = event.currentTarget; const selected: boolean = data.selected; const nativeEvent: Event = event.nativeEvent; void [typedEvent, target, selected, nativeEvent]; }} />;`;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Card Fluent callback contract should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";
import { createRoot } from "react-dom/client";
import { Card, Button } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
import { defineCard } from "${resolve("packages/sharepoint-ui/src/elements/card.ts")}";
window.cardClickEvents=[];window.cardCaptureEvents=[];window.mount = () => {
  defineCard();
  const native = document.querySelector("#native");
  const defaultCard = document.createElement("spui-card"); defaultCard.setAttribute("aria-label", "Native default card"); defaultCard.setAttribute("default-selected", ""); defaultCard.setAttribute("dir", "rtl"); defaultCard.textContent = "Native content"; native.append(defaultCard);
  const disabledCard = document.createElement("spui-card"); disabledCard.setAttribute("aria-label", "Disabled native card"); disabledCard.setAttribute("selectable", ""); disabledCard.setAttribute("disabled", ""); disabledCard.textContent = "Disabled"; native.append(disabledCard);
  const interactiveCard = document.createElement("spui-card"); interactiveCard.setAttribute("aria-label", "Interactive native card"); interactiveCard.setAttribute("selectable", ""); interactiveCard.innerHTML = '<a href="#action" data-testid="inner-link">Open record</a>'; native.append(interactiveCard);
  const actionCard = document.createElement("spui-card"); actionCard.setAttribute("aria-label", "Native card with action"); actionCard.setAttribute("selectable", ""); actionCard.innerHTML = '<button slot="floating-action" data-testid="native-card-action">More</button>Native card content'; native.append(actionCard);
  const customCheckboxCard = document.createElement("spui-card"); customCheckboxCard.setAttribute("aria-label", "Native custom checkbox card"); customCheckboxCard.setAttribute("selectable", ""); const customCheckbox = document.createElement("input"); customCheckbox.slot = "checkbox"; customCheckbox.setAttribute("data-testid", "native-custom-checkbox"); customCheckboxCard.append(customCheckbox, "Custom checkbox content"); native.append(customCheckboxCard);
  window.nativeChanges = []; native.addEventListener("spui-selection-change", event => window.nativeChanges.push(event.detail.selected));
  function App() {
    const [selected, setSelected] = React.useState(false);
    const [changes, setChanges] = React.useState(0);
    return <><Card data-testid="controlled" aria-label="Controlled record" className="parity-card" title="Card host props" selected={selected} floatingAction={<Button data-testid="card-floating-action">More</Button>} onSelectionChange={(event, data) => { window.reactEventType = event.type; window.reactCurrentTarget = event.currentTarget.tagName; window.reactNativeEventType = event.nativeEvent.type; window.reactSelected = data.selected; setChanges(count => count + 1); setSelected(data.selected); }}>Controlled</Card>
      <Card data-testid="uncontrolled" aria-label="Default record" defaultSelected onSelectionChange={(event, data) => { window.defaultEvent = data.selected; }}>Default</Card>
      <Card data-testid="disabled" aria-label="Disabled record" selectable disabled>Unavailable</Card>
      <Card data-testid="custom-checkbox-card" aria-label="Custom checkbox card" checkbox={<input data-testid="custom-card-checkbox" />} onSelectionChange={(_event, data) => { window.customCheckboxSelection = data.selected; }}>Custom checkbox content</Card>
      <Card data-testid="no-tab" focusMode="no-tab"><Button data-testid="no-tab-first">First action</Button><a href="#last-no-tab" data-testid="no-tab-last">Last action</a></Card><button data-testid="after-no-tab">After trapped card</button>
      <Card data-testid="tab-exit" focusMode="tab-exit"><Button data-testid="tab-exit-first">First action</Button><a href="#last-tab-exit" data-testid="tab-exit-last">Last action</a></Card><button data-testid="after-tab-exit">After limited card</button>
      <Card data-testid="tab-only" focusMode="tab-only"><Button data-testid="tab-only-first">First action</Button><a href="#last-tab-only" data-testid="tab-only-last">Last action</a></Card><button data-testid="after-tab-only">After tab-only card</button>
      <Card data-testid="interactive-inferred" onClick={event=>window.cardClickEvents.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})} onClickCapture={event=>window.cardCaptureEvents.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})}>Interactive</Card>
      <output data-testid="changes">{changes}</output></>;
  }
  createRoot(document.querySelector("#react")).render(<App />);
};`,
    resolveDir: process.cwd(),
    sourcefile: "card-selection-check.tsx",
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
  const path = new URL(request.url, "http://localhost").pathname;
  if (path === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='native'></main><main id='react'></main><script src='/bundle.js'></script><script>window.mount()</script></body></html>");
  if (path === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
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
  const native = page.locator("spui-card").nth(0);
  const nativeCheckbox = native.locator(".selection");
  assert.equal(await native.getAttribute("role"), "region");
  assert.equal(await native.evaluate(element => element.defaultSelected), true, "defaultSelected property preserves the initial value");
  assert.equal(await nativeCheckbox.isChecked(), true, "default-selected initializes selection");
  assert.equal(await nativeCheckbox.getAttribute("aria-label"), "Select Native default card");
  const nativeCustomCheckboxCard = page.locator("spui-card[aria-label='Native custom checkbox card']");
  const nativeCustomCheckbox = page.getByTestId("native-custom-checkbox");
  assert.equal(await nativeCustomCheckboxCard.evaluate(host => host.shadowRoot.querySelector("slot[name=checkbox]").assignedElements()[0]?.type), "checkbox", "native checkbox slot is assigned and normalized");
  assert.equal(await nativeCustomCheckbox.getAttribute("aria-label"), "Select Native custom checkbox card");
  await nativeCustomCheckbox.click();
  assert.equal(await nativeCustomCheckboxCard.getAttribute("selected"), "", "native slotted checkbox updates card selection");
  await nativeCustomCheckbox.focus(); await page.keyboard.press("Enter");
  assert.equal(await nativeCustomCheckbox.isChecked(), false, "Enter deselects through a native slotted checkbox");
  assert.equal(await nativeCustomCheckboxCard.getAttribute("selected"), null);
  await nativeCheckbox.focus();
  await page.keyboard.press("Space");
  assert.equal(await nativeCheckbox.isChecked(), false, "space deselects native card");
  assert.equal(await native.getAttribute("selected"), null);
  await page.keyboard.press("Enter");
  assert.equal(await nativeCheckbox.isChecked(), true, "Enter selects through the native card checkbox");
  assert.equal(await native.getAttribute("selected"), "");
  await native.click();
  assert.equal(await nativeCheckbox.isChecked(), false, "card body toggles native card selection");
  assert.deepEqual(await page.evaluate(() => window.nativeChanges), [true, false, false, true, false]);
  const rtlBox = await nativeCheckbox.boundingBox();
  const cardBox = await native.boundingBox();
  assert.ok(rtlBox.x > cardBox.x + cardBox.width / 2, "selection control follows RTL inline-start");
  const nativeActionCard = page.locator("spui-card[aria-label='Native card with action']");
  assert.equal(await nativeActionCard.evaluate(host => host.shadowRoot.querySelector("slot[name=floating-action]").assignedElements().length), 1, "native floating-action slot is assigned");
  await page.getByTestId("native-card-action").click();
  assert.equal(await nativeActionCard.getAttribute("selected"), null, "an action inside the card does not select the card");

  const actionCard = page.locator("spui-card").nth(2);
  await actionCard.getByTestId("inner-link").click();
  assert.equal(await actionCard.getAttribute("selected"), null, "nested link click does not select card");
  const disabledNative = page.locator("spui-card").nth(1);
  await disabledNative.click();
  assert.equal(await disabledNative.getAttribute("selected"), null, "disabled card cannot select");
  assert.equal(await disabledNative.locator(".selection").isDisabled(), true);

  const controlled = page.getByTestId("controlled");
  assert.equal(await controlled.getAttribute("class"), "parity-card", "React Card forwards className to its custom-element host");
  assert.equal(await controlled.getAttribute("title"), "Card host props", "React Card forwards inherited native title props");
  const controlledCheckbox = controlled.locator(".selection");
  assert.equal(await controlled.evaluate(host => host.shadowRoot.querySelector("slot[name=floating-action]").assignedElements().length), 1, "React floatingAction prop maps to the native slot");
  await page.getByTestId("card-floating-action").click();
  assert.equal(await controlledCheckbox.isChecked(), false, "React floating action does not toggle selection");
  const customCheckboxCard = page.getByTestId("custom-checkbox-card");
  const customCheckbox = page.getByTestId("custom-card-checkbox");
  assert.equal(await customCheckboxCard.evaluate(host => host.shadowRoot.querySelector("slot[name=checkbox]").assignedElements().length), 1, "React checkbox prop maps to the native slot");
  assert.equal(await customCheckbox.getAttribute("aria-label"), "Select Custom checkbox card");
  await customCheckbox.click();
  assert.equal(await customCheckboxCard.getAttribute("selected"), "", "React slotted checkbox updates card selection");
  assert.equal(await page.evaluate(() => window.customCheckboxSelection), true, "custom checkbox selection reaches the React callback");
  await customCheckbox.focus(); await page.keyboard.press("Enter");
  assert.equal(await customCheckboxCard.getAttribute("selected"), null, "Enter deselects through the React slotted checkbox");
  assert.equal(await page.evaluate(() => window.customCheckboxSelection), false, "React selection callback receives the Enter result");
  await controlledCheckbox.focus(); await page.keyboard.press("Space");
  await page.waitForFunction(() => window.reactSelected === true && window.reactEventType === "change" && window.reactCurrentTarget === "SPUI-CARD" && window.reactNativeEventType === "change");
  await page.waitForFunction(() => document.querySelector('[data-testid="changes"]').textContent === "1");
  assert.equal(await controlled.getAttribute("selected"), "", "React controlled state is reflected back");
  await controlledCheckbox.focus(); await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.reactSelected === false && document.querySelector('[data-testid="changes"]').textContent === "2");
  assert.equal(await controlled.getAttribute("selected"), null, "Enter updates controlled React card selection");
  const uncontrolled = page.getByTestId("uncontrolled");
  assert.equal(await uncontrolled.locator(".selection").isChecked(), true);
  await uncontrolled.locator(".selection").focus(); await page.keyboard.press("Space");
  assert.equal(await uncontrolled.locator(".selection").isChecked(), false);
  assert.equal(await page.evaluate(() => window.defaultEvent), false, "default selection reports next value");
  await page.keyboard.press("Enter");
  assert.equal(await uncontrolled.locator(".selection").isChecked(), true, "Enter selects an uncontrolled React card");
  assert.equal(await page.evaluate(() => window.defaultEvent), true, "default selection reports the Enter result");
  const disabledReact = page.getByTestId("disabled");
  await disabledReact.click();
  assert.equal(await disabledReact.getAttribute("selected"), null);

  const activePath = () => page.evaluate(() => {
    const values = [];
    let active = document.activeElement;
    while (active) {
      const testId = active.getAttribute?.("data-testid");
      if (testId) values.push(testId);
      active = active.shadowRoot?.activeElement ?? null;
    }
    return values;
  });
  const waitForActive = testId => page.waitForFunction(expected => {
    let active = document.activeElement;
    while (active) {
      if (active.getAttribute?.("data-testid") === expected) return true;
      active = active.shadowRoot?.activeElement ?? null;
    }
    return false;
  }, testId);
  const noTab = page.getByTestId("no-tab");
  assert.equal(await noTab.getAttribute("tabindex"), "0");
  await noTab.focus(); await page.keyboard.press("Enter");
  await waitForActive("no-tab-first");
  assert.ok((await activePath()).includes("no-tab-first"), "Enter enters a no-tab focus group through nested custom-element shadow DOM");
  await page.keyboard.press("Tab");
  await waitForActive("no-tab-last");
  assert.ok((await activePath()).includes("no-tab-last"));
  await page.keyboard.press("Tab");
  await waitForActive("no-tab-first");
  assert.ok((await activePath()).includes("no-tab-first"), "no-tab wraps forward at the final descendant");
  await page.keyboard.press("Shift+Tab");
  await waitForActive("no-tab-last");
  assert.ok((await activePath()).includes("no-tab-last"), "no-tab wraps backward at the first descendant");
  await page.keyboard.press("Escape");
  await waitForActive("no-tab");
  assert.ok((await activePath()).includes("no-tab"), "Escape returns focus to the Card root");

  const tabExit = page.getByTestId("tab-exit");
  await tabExit.focus(); await page.keyboard.press("Enter");
  await waitForActive("tab-exit-first");
  assert.ok((await activePath()).includes("tab-exit-first"));
  await page.keyboard.press("Tab"); await waitForActive("tab-exit-last"); assert.ok((await activePath()).includes("tab-exit-last"));
  await page.keyboard.press("Tab"); assert.ok((await activePath()).includes("after-tab-exit"), "tab-exit releases focus after the final descendant");

  const tabOnly = page.getByTestId("tab-only");
  await tabOnly.focus(); await page.keyboard.press("Tab");
  assert.ok((await activePath()).includes("tab-only-first"), "tab-only enters by Tab without Enter");
  await page.keyboard.press("Tab"); assert.ok((await activePath()).includes("tab-only-last"));
  await page.keyboard.press("Tab"); assert.ok((await activePath()).includes("after-tab-only"), "tab-only preserves normal exit after the last descendant");
  assert.equal(await page.getByTestId("interactive-inferred").getAttribute("focus-mode"), "no-tab", "interactive React Cards default to no-tab focus behavior");
  assert.equal(await page.getByTestId("interactive-inferred").getAttribute("tabindex"), "0");
  await page.getByTestId("interactive-inferred").click();
  assert.deepEqual(await page.evaluate(() => window.cardClickEvents[0]), { target: "DIV", currentTarget: "DIV", nativeEventType: "click" }, "Card onClick targets its native Fluent-like root slot");
  assert.deepEqual(await page.evaluate(() => window.cardCaptureEvents[0]), { target: "DIV", currentTarget: "DIV", nativeEventType: "click" }, "Card onClickCapture targets its native root slot");
  assert.deepEqual(errors, [], "page has no runtime errors");

  const selectionDispatch = await page.evaluate(() => {
    const checkbox = document.querySelector("spui-card").shadowRoot.querySelector(".selection");
    const samples = [];
    for (let index = 0; index < 50; index++) {
      checkbox.checked = !checkbox.checked;
      const started = performance.now();
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      samples.push(performance.now() - started);
    }
    samples.sort((a, b) => a - b);
    return { samples: samples.length, p50: samples[24], p95: samples[47] };
  });

  mkdirSync(resolve("test-results"), { recursive: true });
  await page.screenshot({ path: resolve("test-results/card-selection-local.png"), fullPage: true });
  const result = { status: "passed", viewport: "390x844", nativeDefaultAndKeyboard: true, nativeClickAndCustomEvent: true, rtlSelectionPosition: true, reactAndNativeFloatingAction: true, reactAndNativeCustomCheckbox: true, nestedActionDoesNotSelect: true, disabledSelection: true, reactControlledAndCallback: true, reactDefaultSelected: true, cardFocusModes: { noTabEnterAndEscape: true, noTabForwardBackwardTrap: true, tabExitReleasesAfterLast: true, tabOnlyUsesTabSequence: true, interactiveDefaultsToNoTab: true }, selectionDispatchMs: selectionDispatch, pageErrors: errors, screenshot: resolve("test-results/card-selection-local.png") };
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser?.close();
  server.close();
}
