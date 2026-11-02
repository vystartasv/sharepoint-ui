import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.tab-select-event-type-contract.tsx");
const typeFixture = `import { TabList, type TabListProps, type TabSelectEvent } from "./react.js"; type Assert<T extends true> = T; type EventOf<T> = NonNullable<T> extends (event: infer E, ...args: any[]) => unknown ? E : never; type EventMatches = Assert<EventOf<TabListProps["onTabSelect"]> extends TabSelectEvent ? true : false>; const example = <TabList onTabSelect={(event, data) => { const typedEvent: TabSelectEvent = event; const target: HTMLElement = event.currentTarget; const value: unknown = data.value; const nativeEvent: Event = event.nativeEvent; void [typedEvent, target, value, nativeEvent]; }} />;`;
const originalFileExists = ts.sys.fileExists;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.fileExists = file => resolve(file) === typeFixturePath || originalFileExists(file);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `TabList Fluent callback contract should type-check: ${typeErrors.join("\n")}`);
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "tabs-parity.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Tabs,TabList,TabListProvider,Tab,TabPanel}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineTabs}from"${resolve("packages/sharepoint-ui/src/elements/tabs.ts")}";createRoot(document.querySelector("#react")).render(<><Tabs><TabList data-testid="list" defaultSelectedValue="one" onTabSelect={(event,data)=>window.selection={value:data.value,type:event.type,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type}}><Tab value="one">Settings</Tab><Tab value="two" content={<span>Custom tab label</span>}>Settings</Tab></TabList><TabPanel value="one">One</TabPanel><TabPanel value="two">Two</TabPanel></Tabs><Tabs><TabList data-testid="no-reserve" defaultSelectedValue="one" reserveSelectedTabSpace={false}><Tab value="one">Settings</Tab><Tab value="two">Settings</Tab></TabList></Tabs><TabList data-testid="icon-list" defaultSelectedValue="icon-one"><Tab value="icon-one" icon={<span aria-hidden="true">★</span>}>Files</Tab><Tab value="icon-two" icon={<span aria-hidden="true">★</span>}>Files</Tab></TabList><TabList data-testid="native-prefix-list" onTabSelect={(_event,data)=>window.nativePrefixValue=data.value}>{React.createElement("spui-tab",{value:"number:1"},"One")}{React.createElement("spui-tab",{value:"number:2"},"Two")}</TabList></>);createRoot(document.querySelector("#numeric")).render(<TabList data-testid="numeric-list" defaultSelectedValue={1} onTabSelect={(_event,data)=>window.numericSelection=data.value}><Tab value={1}>One</Tab><Tab value={2}>Two</Tab></TabList>);window.firstTabObject={id:"first"};window.secondTabObject={id:"second"};createRoot(document.querySelector("#objects")).render(<Tabs data-testid="object-tabs" selectedValue={window.firstTabObject} onTabSelect={value=>window.objectSelection=value}><TabList><Tab value={window.firstTabObject}>First object</Tab><Tab value={window.secondTabObject}>Second object</Tab></TabList><TabPanel value={window.firstTabObject}>First object panel</TabPanel><TabPanel value={window.secondTabObject}>Second object panel</TabPanel></Tabs>);createRoot(document.querySelector("#empty-value")).render(<Tabs data-testid="empty-tabs" defaultSelectedValue=""><TabList><Tab value="">Empty value</Tab><Tab value="next">Next</Tab></TabList><TabPanel value="">Empty panel</TabPanel><TabPanel value="next">Next panel</TabPanel></Tabs>);function ProviderTabs(){const[selected,setSelected]=React.useState("provider-one");const registered=React.useRef({});const value={selectedValue:selected,selectTabOnFocus:false,reserveSelectedTabSpace:false,appearance:"subtle",disabled:false,size:"large",vertical:true,onTabSelect:(event,data)=>window.providerSelection={value:data.value,type:event.type},onRegister:data=>{registered.current[data.value]=data;window.providerRegistered=Object.keys(registered.current).length},onUnregister:data=>{delete registered.current[data.value];window.providerRegistered=Object.keys(registered.current).length},onSelect:(event,data)=>setSelected(data.value),getRegisteredTabs:()=>({selectedValue:selected,registeredTabs:registered.current})};return <TabListProvider value={value}><TabList data-testid="provider-list"><Tab value="provider-one">One</Tab><Tab value="provider-two">Two</Tab></TabList></TabListProvider>}createRoot(document.querySelector("#provider-react")).render(<ProviderTabs/>);window.mountNative=()=>{defineTabs();const list=document.createElement("spui-tab-list");list.dataset.testid="native-list";list.setAttribute("default-selected-value","first");list.setAttribute("aria-label","Native views");for(const value of ["first","second"]){const tab=document.createElement("spui-tab");tab.setAttribute("value",value);tab.textContent="Files";if(value==="first"){const icon=document.createElement("span");icon.slot="icon";icon.setAttribute("aria-hidden","true");icon.textContent="★";tab.append(icon)}list.append(tab)}document.querySelector("#native").append(list)};window.mountNative();`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => {
  if (new URL(request.url, "http://localhost").pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><main id=react></main><main id=provider-react></main><main id=native></main><main id=numeric></main><main id=objects></main><main id=empty-value></main><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const list = page.getByTestId("list");
  const tabs = list.getByRole("tab");
  const before = await tabs.nth(0).evaluate(node => node.getBoundingClientRect().width);
  assert.equal(await tabs.nth(0).getAttribute("aria-selected"), "true");
  assert.equal(await tabs.nth(1).getAttribute("reserve-selected-tab-space"), "");
  assert.equal(await tabs.nth(0).evaluate(node => node.shadowRoot.querySelector(".reserved").textContent), "Settings");
  await tabs.nth(0).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await tabs.nth(1).evaluate(node => document.activeElement === node), true, "arrow keys move roving focus");
  assert.equal(await tabs.nth(0).getAttribute("aria-selected"), "true", "focus alone does not select by default");
  await page.keyboard.press("Enter");
  assert.deepEqual(await page.evaluate(() => window.selection), { value: "two", type: "keydown", currentTarget: "SPUI-TAB", nativeEventType: "keydown" }, "keyboard selection reports a React-shaped source event with the selected tab as currentTarget");
  assert.equal(await tabs.nth(1).getAttribute("aria-selected"), "true");
  await tabs.nth(0).click();
  assert.deepEqual(await page.evaluate(() => window.selection), { value: "one", type: "click", currentTarget: "SPUI-TAB", nativeEventType: "click" }, "pointer selection reports its source event");
  await tabs.nth(1).click();
  assert.deepEqual(await page.evaluate(() => window.selection), { value: "two", type: "click", currentTarget: "SPUI-TAB", nativeEventType: "click" }, "TabList reports the selected value and source event");
  assert.equal(await tabs.nth(1).getAttribute("aria-selected"), "true");
  const after = await tabs.nth(0).evaluate(node => node.getBoundingClientRect().width);
  assert.equal(after, before, "unselected tab reserves the selected label width");

  const iconTabs = page.getByTestId("icon-list").getByRole("tab");
  assert.equal(await iconTabs.nth(0).evaluate(node => node.shadowRoot.querySelector('slot[name="icon"]').assignedNodes().length), 1, "React icon prop renders through the named icon slot");
  assert.equal(await page.getByTestId("icon-list").getByRole("tab", { name: "Files", exact: true }).count(), 2, "decorative icon content does not pollute the tab accessible name");
  assert.equal(await iconTabs.nth(0).evaluate(node => node.shadowRoot.querySelector(".reserved").textContent), "Files", "reserved selected width measures content without icon text");
  const iconWidth = await iconTabs.nth(0).evaluate(node => node.getBoundingClientRect().width);
  await iconTabs.nth(1).click();
  assert.equal(await iconTabs.nth(0).evaluate(node => node.getBoundingClientRect().width), iconWidth, "icon tabs retain stable width when selection changes");

  const noReserve = page.getByTestId("no-reserve");
  assert.equal(await noReserve.getAttribute("reserve-selected-tab-space"), "false");
  assert.equal(await noReserve.getByRole("tab").nth(1).getAttribute("reserve-selected-tab-space"), null, "false opt-out reaches the custom element tabs");

  const numeric = page.getByTestId("numeric-list");
  assert.equal(await numeric.getByRole("tab").nth(0).getAttribute("aria-selected"), "true", "numeric default values select the matching tab");
  await numeric.getByRole("tab").nth(1).click();
  await page.waitForFunction(() => window.numericSelection === 2);
  assert.equal(await page.evaluate(() => typeof window.numericSelection), "number", "callbacks preserve numeric TabValue types");

  const objectTabs = page.getByTestId("object-tabs");
  assert.equal(await objectTabs.getByRole("tab").nth(0).getAttribute("aria-selected"), "true", "object-valued Tabs selection matches by object identity");
  assert.equal(await objectTabs.getByRole("tabpanel").nth(0).isVisible(), true);
  assert.equal(await objectTabs.getByRole("tabpanel").nth(1).isVisible(), false);
  await objectTabs.getByRole("tab").nth(1).click();
  await page.waitForFunction(() => window.objectSelection === window.secondTabObject);
  assert.equal(await objectTabs.getByRole("tab").nth(0).getAttribute("aria-selected"), "true", "controlled object selection remains owner-controlled");
  assert.equal(await page.evaluate(() => window.objectSelection === window.secondTabObject), true, "callbacks preserve the original object reference");
  assert.equal(await objectTabs.getByRole("tabpanel").nth(0).isVisible(), true, "controlled object selection keeps its active panel");

  const emptyTabs = page.getByTestId("empty-tabs");
  assert.equal(await emptyTabs.getByRole("tab").nth(0).getAttribute("aria-selected"), "true", "empty string remains a valid TabValue");
  assert.equal(await emptyTabs.locator("spui-tab-panel").nth(0).getAttribute("selected"), "true", "empty-string selection activates its associated panel");
  assert.equal(await emptyTabs.locator("spui-tab-panel").nth(1).getAttribute("selected"), "false");
  await emptyTabs.getByRole("tab").nth(1).click();
  assert.equal(await emptyTabs.getByRole("tab").nth(1).getAttribute("aria-selected"), "true", "empty-string selection can move to a following value");
  assert.equal(await emptyTabs.locator("spui-tab-panel").nth(1).getAttribute("selected"), "true");
  await emptyTabs.getByRole("tab").nth(0).click();
  assert.equal(await emptyTabs.getByRole("tab").nth(0).getAttribute("aria-selected"), "true", "an empty string can be selected again after another value");
  assert.equal(await emptyTabs.locator("spui-tab-panel").nth(0).getAttribute("selected"), "true");

  assert.equal(await page.getByRole("tab", { name: "Custom tab label" }).count(), 1, "React content slot supplies the tab accessible name");

  const providerList = page.getByTestId("provider-list");
  await page.waitForFunction(() => window.providerRegistered === 2);
  assert.equal(await providerList.getAttribute("selected-value"), "provider-one", "provider controls selected value");
  assert.equal(await providerList.getAttribute("vertical"), "true", "provider supplies vertical layout");
  assert.equal(await providerList.getAttribute("appearance"), "subtle", "provider supplies appearance");
  assert.equal(await providerList.getAttribute("size"), "large", "provider supplies size");
  assert.equal(await providerList.getAttribute("select-on-focus"), null, "provider false selection-on-focus default is preserved");
  assert.equal(await providerList.getAttribute("reserve-selected-tab-space"), "false", "provider can disable reserved tab width");
  const providerTabs = providerList.getByRole("tab");
  assert.equal(await providerTabs.nth(0).getAttribute("aria-selected"), "true");
  await providerTabs.nth(1).click();
  await page.waitForFunction(() => window.providerSelection?.value === "provider-two");
  assert.deepEqual(await page.evaluate(() => window.providerSelection), { value: "provider-two", type: "click" }, "provider selection callbacks receive event and value");
  await page.waitForFunction(() => document.querySelector('[data-testid="provider-list"]')?.getAttribute("selected-value") === "provider-two");
  assert.equal(await providerList.getAttribute("selected-value"), "provider-two", "provider onSelect drives controlled selection");
  assert.equal(await providerTabs.nth(1).getAttribute("aria-selected"), "true");
  assert.equal(await page.evaluate(() => window.providerRegistered), 2, "descendant Tabs register with the provider");
  const native = page.getByTestId("native-list");
  assert.equal(await native.locator('[role="tablist"]').getAttribute("aria-label"), "Native views");
  assert.equal(await native.locator("spui-tab").nth(0).getAttribute("reserve-selected-tab-space"), "", "framework-neutral lists enable width reservation by default");
  assert.equal(await native.locator("spui-tab").nth(0).evaluate(node => node.shadowRoot.querySelector('slot[name="icon"]').assignedNodes().length), 1, "framework-neutral tabs render assigned icon slot content");
  assert.equal(await native.locator("spui-tab").nth(0).evaluate(node => node.shadowRoot.querySelector(".reserved").textContent), "Files", "framework-neutral reservation excludes named-slot icon text");
  await native.locator("spui-tab").nth(0).evaluate(tab => { const content = document.createElement("span"); content.slot = "content"; content.textContent = "Assigned native label"; tab.append(content); });
  assert.equal(await native.locator("spui-tab").nth(0).getAttribute("aria-label"), null);
  assert.equal(await native.locator("spui-tab").nth(0).evaluate(node => node.getContentText()), "Assigned native label", "framework-neutral content slot supplies tab text");
  await native.locator("spui-tab").nth(1).click();
  assert.equal(await native.locator("spui-tab").nth(1).getAttribute("aria-selected"), "true");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactAndCustomElement: true, onTabSelect: true, tabListProvider: true, numericAndObjectTabValues: true, controlledObjectIdentity: true, emptyStringTabValue: true, stableSelectedWidth: true, iconPropAndNativeSlot: true, iconTextExcludedFromReservedWidth: true, optOut: true, accessibleTabList: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
