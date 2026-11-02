import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.accordion-toggle-event-type-contract.tsx");
const typeFixture = `import { Accordion, type AccordionToggleEvent } from "./react.js"; const example = <Accordion onToggle={(event, data) => { const typedEvent: AccordionToggleEvent = event; const target: HTMLElement = event.currentTarget; const value: string | number = data.value; const nativeEvent: Event = event.nativeEvent; void [typedEvent, target, value, nativeEvent]; }} />;`;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Accordion Fluent callback contract should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Accordion,AccordionProvider,AccordionItem,AccordionHeader,AccordionPanel}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineAccordion}from"${resolve("packages/sharepoint-ui/src/elements/accordion.ts")}";defineAccordion();function App(){const[openItems,setOpenItems]=React.useState(["a"]);const[providerItems,setProviderItems]=React.useState(["provider-a"]);return <><Accordion mode="single" collapsible defaultOpenItems="details" data-testid="single" onToggle={(event,data)=>{window.toggleEvents.push({value:data.value,openItems:data.openItems,eventType:event.type,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type});}}><AccordionItem value="details"><AccordionHeader expandIconPosition="start" icon={<span>gear</span>} expandIcon={<b>plus</b>} button={{className:"custom-header-button",title:"Details trigger", "aria-label":"Toggle document details", "data-testid":"accordion-trigger-details",style:{borderRadius:"9px"},onClick:event=>{window.buttonEvents.push(event.type);if(window.cancelButtonToggle)event.preventDefault();}}} data-testid="details-heading">Document details</AccordionHeader><AccordionPanel data-testid="details-panel"><p>Owner and library information.</p></AccordionPanel></AccordionItem><AccordionItem value="sharing"><AccordionHeader>Sharing</AccordionHeader><AccordionPanel>Access details.</AccordionPanel></AccordionItem></Accordion><AccordionProvider value={{openItems:providerItems,requestToggle:({value})=>setProviderItems(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value]),multiple:true,collapsible:true,navigation:"linear"}}><Accordion data-testid="provider"><AccordionItem value="provider-a" heading="Provider A">A</AccordionItem><AccordionItem value="provider-b" heading="Provider B">B</AccordionItem></Accordion></AccordionProvider><Accordion multiple navigation="linear" data-testid="multi"><AccordionItem value="a"><AccordionHeader>A</AccordionHeader><AccordionPanel>Panel A</AccordionPanel></AccordionItem><AccordionItem value="b"><AccordionHeader>B</AccordionHeader><AccordionPanel>Panel B</AccordionPanel></AccordionItem><AccordionItem value="c" disabled><AccordionHeader>C</AccordionHeader><AccordionPanel>Panel C</AccordionPanel></AccordionItem></Accordion><Accordion openItems={openItems} onToggle={(_,data)=>setOpenItems(data.openItems)} data-testid="controlled"><AccordionItem value="a" heading="Controlled A">Controlled panel A</AccordionItem><AccordionItem value="b" heading="Controlled B">Controlled panel B</AccordionItem></Accordion></>}window.toggleEvents=[];window.buttonEvents=[];window.cancelButtonToggle=false;createRoot(document.querySelector("#root")).render(<App/>);window.mountNative=()=>{const host=document.createElement("spui-accordion");host.innerHTML='<spui-accordion-item value="native-a"><spui-accordion-header slot="heading"><span slot="icon">N</span>Native A<span slot="expand-icon">+</span></spui-accordion-header><spui-accordion-panel slot="panel">Native panel</spui-accordion-panel></spui-accordion-item><spui-accordion-item value="native-b" heading="Native B">Native fallback panel</spui-accordion-item>';host.defaultOpenItems=["native-a"];document.querySelector("#native").append(host);return host;};`,
    resolveDir: process.cwd(), sourcefile: "accordion-parity.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div><div id='native'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 650 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const single = page.getByTestId("single");
  const singleState = () => single.evaluate(node => [...node.children].filter(item => item.localName === "spui-accordion-item" && item.hasAttribute("open")).map(item => item.getAttribute("value")));
  assert.deepEqual(await singleState(), ["details"], "defaultOpenItems initializes a single accordion");
  const firstItem = single.locator("spui-accordion-item[value=details]");
  const headerButton = firstItem.locator("button[data-testid=accordion-trigger-details]");
  assert.equal(await headerButton.getAttribute("title"), "Details trigger", "button slot forwards descriptive attributes");
  assert.equal(await headerButton.getAttribute("aria-label"), "Toggle document details", "button slot forwards accessible labels");
  assert.equal(await headerButton.evaluate(button => getComputedStyle(button).borderRadius), "9px", "button slot forwards inline styles");
  assert.equal(await firstItem.evaluate(item => item.shadowRoot.querySelector("[role=region]")?.getAttribute("aria-labelledby")), await firstItem.evaluate(item => item.shadowRoot.querySelector("button")?.id), "panel is labelled by its trigger");
  assert.equal(await firstItem.evaluate(item => item.shadowRoot.querySelector("button").getAttribute("aria-controls")), await firstItem.evaluate(item => item.shadowRoot.querySelector("[role=region]").id));
  assert.equal(await firstItem.evaluate(item => Boolean(item.shadowRoot.querySelector("button slot[name=heading]"))), true, "composed header content is inside the trigger");
  const header = page.getByTestId("details-heading");
  assert.equal(await header.getAttribute("has-expand-icon"), "", "custom expandIcon replaces the default disclosure glyph");
  assert.equal(await header.evaluate(node => node.shadowRoot.querySelector("slot[name=icon]").assignedNodes().map(child => child.textContent).join("")), "gear");
  assert.equal(await header.evaluate(node => node.shadowRoot.querySelector("slot[name=expand-icon]").assignedNodes().map(child => child.textContent).join("")), "plus");
  assert.equal(await firstItem.evaluate(item => item.shadowRoot.querySelector(".icon").hidden), true);
  await page.evaluate(() => { window.cancelButtonToggle = true; });
  await headerButton.click();
  assert.deepEqual(await page.evaluate(() => window.buttonEvents), ["click"], "button slot click handler receives the native click event");
  assert.equal(await firstItem.getAttribute("open"), "", "button slot can prevent the default toggle");
  await page.evaluate(() => { window.cancelButtonToggle = false; });
  await headerButton.click();
  assert.equal(await firstItem.getAttribute("open"), null, "button slot click keeps native accordion toggle behavior");
  await headerButton.click();
  assert.equal(await firstItem.getAttribute("open"), "", "button slot can reopen its item");
  await single.locator("spui-accordion-item[value=sharing] button").click();
  assert.deepEqual(await singleState(), ["sharing"], "single mode closes the previous item");
  assert.deepEqual(await page.evaluate(() => window.toggleEvents.at(-1)), { value: "sharing", openItems: ["sharing"], eventType: "click", currentTarget: "BUTTON", nativeEventType: "click" }, "toggle callback reports value and open items");

  const provider = page.getByTestId("provider");
  const providerOpenItems = () => provider.evaluate(node => [...node.children].filter(item => item.localName === "spui-accordion-item" && item.hasAttribute("open")).map(item => item.getAttribute("value")));
  assert.deepEqual(await providerOpenItems(), ["provider-a"], "provider openItems control the composed accordion");
  assert.deepEqual(await provider.evaluate(node => ({ multiple: node.hasAttribute("multiple"), collapsible: node.hasAttribute("collapsible"), navigation: node.getAttribute("navigation") })), { multiple: true, collapsible: true, navigation: "linear" }, "provider behavior defaults reach the local accordion engine");
  await provider.locator('spui-accordion-item[value="provider-b"] button').click();
  await page.waitForFunction(() => [...document.querySelector('[data-testid="provider"]').children].filter(item => item.localName === "spui-accordion-item" && item.hasAttribute("open")).length === 2);
  assert.deepEqual(await providerOpenItems(), ["provider-a", "provider-b"], "provider requestToggle controls the next open item set");

  const multi = page.getByTestId("multi");
  const triggers = multi.locator("spui-accordion-item button");
  await triggers.nth(0).focus();
  await page.keyboard.press("ArrowDown");
  assert.equal(await triggers.nth(1).evaluate(node => node === node.getRootNode().activeElement), true, "linear navigation moves focus between headers");
  await triggers.nth(1).click();
  await triggers.nth(0).click();
  assert.deepEqual(await multi.evaluate(node => [...node.children].filter(item => item.localName === "spui-accordion-item" && item.hasAttribute("open")).map(item => item.getAttribute("value"))), ["a", "b"], "multiple mode keeps independent panels open");
  assert.equal(await triggers.nth(2).isDisabled(), true, "disabled accordion items expose native disabled state");

  const controlled = page.getByTestId("controlled");
  await controlled.locator("spui-accordion-item[value=b] button").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="controlled"] spui-accordion-item[value="b"]')?.hasAttribute("open"));
  assert.deepEqual(await controlled.evaluate(node => [...node.children].filter(item => item.localName === "spui-accordion-item" && item.hasAttribute("open")).map(item => item.getAttribute("value"))), ["b"], "controlled values reconcile from the React owner");
  await page.evaluate(() => window.mountNative());
  const native = page.locator("#native spui-accordion");
  assert.deepEqual(await native.evaluate(node => [...node.children].filter(item => item.localName === "spui-accordion-item" && item.hasAttribute("open")).map(item => item.getAttribute("value"))), ["native-a"], "custom element accepts property-based defaults");
  assert.equal(await native.locator("spui-accordion-header").first().evaluate(node => node.shadowRoot.querySelector("slot[name=icon]").assignedNodes().map(child => child.textContent).join("")), "N");
  assert.equal(await native.locator("spui-accordion-header").first().evaluate(node => node.shadowRoot.querySelector("slot[name=expand-icon]").assignedNodes().map(child => child.textContent).join("")), "+");
  await native.locator("spui-accordion-item[value=native-b] button").click();
  assert.deepEqual(await native.evaluate(node => [...node.children].filter(item => item.localName === "spui-accordion-item" && item.hasAttribute("open")).map(item => item.getAttribute("value"))), ["native-b"], "native composition updates single mode state");
  const locked = await page.evaluate(() => {
    const accordion = document.createElement("spui-accordion");
    accordion.setAttribute("mode", "single");
    const item = document.createElement("spui-accordion-item"); item.setAttribute("value", "locked"); item.setAttribute("open", "");
    const header = document.createElement("spui-accordion-header"); header.slot = "heading"; header.textContent = "Locked open";
    item.append(header, document.createTextNode("Locked content")); accordion.append(item); document.body.append(accordion); return { accordion, item };
  });
  const lockedButton = page.locator("spui-accordion-item[value=locked] button");
  assert.equal(await lockedButton.getAttribute("aria-disabled"), "true", "non-collapsible open trigger exposes disabled state");
  assert.equal(await lockedButton.evaluate(button => button.disabled), false, "disabledFocusable trigger remains natively enabled");
  assert.equal(await lockedButton.evaluate(button => button.tabIndex), 0, "disabledFocusable trigger stays in the tab order");
  await lockedButton.evaluate(button => button.click());
  assert.equal(await page.locator("spui-accordion-item[value=locked]").getAttribute("open"), "", "disabledFocusable trigger cannot collapse the only open item");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", composition: true, accordionHeaderIconSlots: true, accordionHeaderButtonSlot: true, disabledFocusableSingleItem: true, singleAndMultiple: true, controlledAndDefaultState: true, accessibleHeaderPanelRelationships: true, navigation: true, nativeCustomElement: true, noPageErrors: true }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
