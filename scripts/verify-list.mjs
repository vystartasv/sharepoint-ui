import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{useState}from"react";import{SharePointUIProvider,List,ListItem,Checkbox}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";function App(){const [selected,setSelected]=useState(["second"]);return <SharePointUIProvider dir="rtl" theme={{colors:{accent:"#2468aa"}}}><List aria-label="Recent documents" data-testid="selectable" navigationMode="items" selectionMode="multiselect" selectedItems={selected} onSelectionChange={(event,data)=>{window.selectionContracts.push(event===data.event&&data.type==="change"&&event.currentTarget.tagName==="SPUI-LIST"&&event.nativeEvent.type==="click");window.selectedChanges.push(data.selectedItems);setSelected(data.selectedItems)}}><ListItem value="first" data-testid="first" onAction={(event,data)=>{window.actionContracts.push(event===data.event&&data.type==="ListItemAction"&&data.value==="first") ;window.actions.push(data.value)}}>First document</ListItem><ListItem value="second" data-testid="second" onAction={(_event,data)=>{window.actions.push(data.value);_event.preventDefault()}}>Second document</ListItem><ListItem value="locked" data-testid="locked" disabledSelection checkmark={<Checkbox data-testid="disabled-checkmark" aria-label="Select locked item"/>}>Read-only item</ListItem><ListItem value="button-row" data-testid="button-row" onAction={(_event,data)=>window.actions.push(data.value)}><button data-testid="nested-action">Nested action</button></ListItem></List><List aria-label="Quick actions" data-testid="action-only"><ListItem data-testid="action-only-item" value="run" onAction={(_event,data)=>window.actionOnlyCalls.push(data.value)}>Run action</ListItem></List><List data-testid="checkmark-list" selectionMode="multiselect" defaultSelectedItems={["checkmark"]} onSelectionChange={(_event,data)=>window.checkmarkEvents.push(data.selectedItems)} ><ListItem onAction={(_event,data)=>window.checkmarkActions.push(data.value)} value="checkmark" data-testid="custom-checkmark-item" checkmark={<Checkbox data-testid="custom-checkmark" aria-label="Select custom checkmark item"/>}>Custom checkmark</ListItem></List><List data-testid="single" selectionMode="single" defaultSelectedItems={["a"]}><ListItem value="a">A</ListItem><ListItem value="b">B</ListItem></List><List aria-label="Grid list" data-testid="composite" navigationMode="composite"><ListItem value="row-1"><div role="gridcell"><button data-testid="cell-a">A</button><button data-testid="cell-b">B</button></div></ListItem><ListItem value="row-2"><div role="gridcell"><button data-testid="cell-c">C</button></div></ListItem></List></SharePointUIProvider>}window.selectedChanges=[];window.checkmarkEvents=[];window.checkmarkActions=[];window.actions=[];window.actionOnlyCalls=[];window.selectionContracts=[];window.actionContracts=[];createRoot(document.querySelector("#root")).render(<App/>);`,
    resolveDir: root,
    sourcefile: "list.tsx",
    loader: "tsx",
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='root'></main><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="selectable"]')?.shadowRoot?.querySelector("slot"));

  const actionOnlyList = page.getByTestId("action-only");
  const actionOnlyItem = page.getByTestId("action-only-item");
  assert.equal(await actionOnlyList.getAttribute("role"), "list");
  assert.equal(await actionOnlyItem.getAttribute("role"), "listitem");
  assert.equal(await actionOnlyItem.getAttribute("tabindex"), "0", "an action-only row is keyboard reachable without selection/navigation mode");
  await page.addScriptTag({ path: resolve(root, "node_modules/axe-core/axe.min.js") });
  const actionOnlyAxe = await page.evaluate(async () => window.axe.run(document.querySelector('[data-testid="action-only"]'), { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } }));
  assert.deepEqual(actionOnlyAxe.violations.map(({ id }) => id), [], "the accessible action-only list has no axe violations");
  await actionOnlyItem.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  assert.deepEqual(await page.evaluate(() => window.actionOnlyCalls), ["run", "run"], "Enter and Space invoke an action-only row");

  const list = page.getByTestId("selectable");
  assert.equal(await list.getAttribute("role"), "listbox");
  assert.equal(await list.getAttribute("aria-multiselectable"), "true");
  assert.equal(await page.getByTestId("first").getAttribute("role"), "option");
  assert.equal(await page.getByTestId("second").getAttribute("aria-selected"), "true");
  assert.equal(await page.getByTestId("first").getAttribute("tabindex"), "0", "only the active row enters the tab sequence");
  assert.equal(await page.getByTestId("second").getAttribute("tabindex"), "-1");
  assert.ok(await page.getByTestId("first").evaluate(node => node.shadowRoot.querySelector("slot[name=checkmark]") !== null));

  await page.getByTestId("first").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="first"]')?.getAttribute("aria-selected") === "true");
  assert.equal(await page.getByTestId("first").getAttribute("aria-selected"), "true", JSON.stringify({ changes: await page.evaluate(() => window.selectedChanges), actions: await page.evaluate(() => window.actions) }));
  assert.deepEqual(await page.evaluate(() => window.selectedChanges.at(-1)), ["second", "first"]);
  assert.deepEqual(await page.evaluate(() => window.selectionContracts), [true], "selection callback includes Fluent event/type data");
  assert.deepEqual(await page.evaluate(() => window.actionContracts), [true], "action callback includes Fluent event/type data");
  await page.getByTestId("locked").evaluate(node => node.click());
  assert.equal(await page.getByTestId("locked").getAttribute("aria-selected"), "false", "disabledSelection prevents changing selection");
  assert.equal(await page.getByTestId("locked").getAttribute("aria-disabled"), "true");
  assert.equal(await page.getByTestId("disabled-checkmark").locator("input").isDisabled(), true, "disabledSelection disables the custom checkmark control");

  const customCheckmark = page.getByTestId("custom-checkmark").locator("input");
  const customCheckmarkItem = page.getByTestId("custom-checkmark-item");
  assert.equal(await customCheckmark.isChecked(), true, "custom checkmark inherits default selection");
  await customCheckmark.click();
  await page.waitForFunction(() => document.querySelector("[data-testid=custom-checkmark-item]")?.getAttribute("aria-selected") === "false");
  assert.equal(await customCheckmark.isChecked(), false, "custom checkmark click updates List selection");
  await customCheckmark.click();
  await page.waitForFunction(() => document.querySelector("[data-testid=custom-checkmark-item]")?.getAttribute("aria-selected") === "true");
  assert.equal(await customCheckmark.isChecked(), true, "custom checkmark follows selection state after toggling back");
  assert.deepEqual(await page.evaluate(() => window.checkmarkEvents), [[], ["checkmark"]], "custom checkmark emits one selection change per toggle");
  assert.deepEqual(await page.evaluate(() => window.checkmarkActions), [], "checkmark interaction does not trigger the ListItem action callback");

  await page.getByTestId("second").click();
  assert.equal(await page.getByTestId("second").getAttribute("aria-selected"), "true", "preventDefault from onAction suppresses selection");
  assert.deepEqual(await page.evaluate(() => window.actions), ["first", "second"]);
  await page.getByTestId("nested-action").click();
  assert.equal(await page.getByTestId("button-row").getAttribute("aria-selected"), "false", "nested controls keep their own click action");
  assert.deepEqual(await page.evaluate(() => window.actions), ["first", "second"]);

  const first = page.getByTestId("first");
  await first.focus(); await page.keyboard.press("ArrowDown");
  assert.ok(await page.getByTestId("second").evaluate(node => node.matches(":focus")), "ArrowDown moves focus to the next row");
  await page.keyboard.press("ArrowDown");
  assert.ok(await page.getByTestId("button-row").evaluate(node => node.matches(":focus")), "vertical navigation skips disabled rows");
  await page.keyboard.press("Home");
  assert.ok(await first.evaluate(node => node.matches(":focus")), "Home returns focus to the first row");
  await page.keyboard.press("End");
  assert.ok(await page.getByTestId("button-row").evaluate(node => node.matches(":focus")), "End reaches the last enabled row while skipping a disabled row");
  await page.keyboard.press("ArrowUp");
  assert.ok(await page.getByTestId("second").evaluate(node => node.matches(":focus")), "ArrowUp skips a disabled row at the end boundary");
  await page.keyboard.press("Home");
  assert.ok(await first.evaluate(node => node.matches(":focus")), "Home returns to the first row after boundary navigation");
  await page.keyboard.press(" ");
  await page.waitForFunction(() => document.querySelector('[data-testid="first"]')?.getAttribute("aria-selected") === "false");
  assert.equal(await first.getAttribute("aria-selected"), "false", "Space toggles selection");
  assert.deepEqual(await page.evaluate(() => window.actions), ["first", "second"], "Space toggles selection without invoking ListItem onAction");

  const single = page.getByTestId("single");
  assert.equal(await single.getAttribute("role"), "listbox");
  assert.equal(await single.locator("spui-list-item[value=b]").getAttribute("aria-selected"), "false");
  await single.locator("spui-list-item[value=b]").click();
  assert.equal(await single.locator("spui-list-item[value=a]").getAttribute("aria-selected"), "false");
  assert.equal(await single.locator("spui-list-item[value=b]").getAttribute("aria-selected"), "true", "single mode replaces the prior selection");

  const composite = page.getByTestId("composite");
  assert.equal(await composite.getAttribute("role"), "grid");
  assert.equal(await composite.locator("spui-list-item").first().getAttribute("role"), "row");
  await composite.locator("spui-list-item").first().focus(); await page.keyboard.press("ArrowRight");
  assert.ok(await page.getByTestId("cell-b").evaluate(node => node.matches(":focus")), "RTL inline navigation enters the visual-start control");
  await page.keyboard.press("ArrowRight");
  assert.ok(await page.getByTestId("cell-a").evaluate(node => node.matches(":focus")), "RTL right arrow follows logical inline movement");
  await page.keyboard.press("ArrowLeft");
  assert.ok(await page.getByTestId("cell-b").evaluate(node => node.matches(":focus")), "RTL left arrow reverses logical inline movement");

  const direct = await page.evaluate(() => {
    const list = document.createElement("spui-list"); list.selectionMode = "single";
    const item = document.createElement("spui-list-item"); item.value = 42; const nativeCheckmark = document.createElement("input"); nativeCheckmark.type = "checkbox"; nativeCheckmark.slot = "checkmark"; item.append(nativeCheckmark, document.createTextNode("Direct row"));
    list.append(item); document.body.append(list);
    let selectionEvent; list.addEventListener("spui-selection-change", event => selectionEvent = event);
    item.click();
    const selectedAfterClick = list.selectedItems; nativeCheckmark.checked = false; nativeCheckmark.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    return { listRole: list.getAttribute("role"), itemRole: item.getAttribute("role"), selected: selectedAfterClick, checkmarkSelection: list.selectedItems, checkmarkSynced: nativeCheckmark.checked, eventType: selectionEvent.detail.type, sourceEvent: selectionEvent.detail.event.type };
  });
  assert.deepEqual(direct, { listRole: "listbox", itemRole: "option", selected: [42], checkmarkSelection: [], checkmarkSynced: false, eventType: "change", sourceEvent: "change" }, "framework-neutral list supports native composition, typed values, and Fluent selection event data");
  const nativeSpace = await page.evaluate(() => {
    const list = document.createElement("spui-list"); list.selectionMode = "single";
    const item = document.createElement("spui-list-item"); item.value = "native-space";
    let actions = 0; item.addEventListener("spui-list-item-action", () => actions++);
    list.append(item); document.body.append(list); item.focus();
    item.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, composed: true, cancelable: true }));
    return { selectedItems: list.selectedItems, actions };
  });
  assert.deepEqual(nativeSpace, { selectedItems: ["native-space"], actions: 0 }, "native Space selection bypasses the item action callback");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", adapters: ["React", "custom element"], assertions: ["role mapping", "controlled and default selection", "single and multi selection", "custom checkmark synchronization", "cancelable actions", "action-only keyboard reachability", "Enter/Space activation", "Home/End skip disabled rows", "Space selection bypasses onAction", "disabled selection", "nested control isolation", "roving focus", "vertical keyboard movement", "composite grid navigation", "RTL", "targeted axe audit", "direct element composition"], noPageErrors: true }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
