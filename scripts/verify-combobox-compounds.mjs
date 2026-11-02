import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.combobox-event-type-contract.tsx");
const typeFixture = `import * as React from "react"; import { ComboBox, Dropdown, Listbox, type ComboBoxProps, type DropdownProps, type ListboxProps, type ComboboxSelectionEvent, type ComboboxOpenChangeEvent, type ComboboxOptionValue } from "./react.js"; type Assert<T extends true> = T; type EventOf<T> = NonNullable<T> extends (event: infer E, ...args: any[]) => void ? E : never; type ComboSelection = EventOf<ComboBoxProps["onOptionSelect"]>; type DropdownSelection = EventOf<DropdownProps["onOptionSelect"]>; type ListboxSelection = EventOf<ListboxProps["onOptionSelect"]>; type ComboOpen = EventOf<ComboBoxProps["onOpenChange"]>; type DropdownOpen = EventOf<DropdownProps["onOpenChange"]>; type ComboSelectionMatches = Assert<ComboSelection extends ComboboxSelectionEvent ? true : false>; type DropdownSelectionMatches = Assert<DropdownSelection extends ComboboxSelectionEvent ? true : false>; type ListboxSelectionMatches = Assert<ListboxSelection extends ComboboxSelectionEvent ? true : false>; type ComboOpenMatches = Assert<ComboOpen extends ComboboxOpenChangeEvent ? true : false>; type DropdownOpenMatches = Assert<DropdownOpen extends ComboboxOpenChangeEvent ? true : false>; type ActiveOptionMatches = Assert<NonNullable<Parameters<NonNullable<ComboBoxProps["onActiveOptionChange"]>>[1]["nextOption"]> extends ComboboxOptionValue ? true : false>; const usage = <><ComboBox onOptionSelect={event => { const native: Event = event.nativeEvent; void native; }} onOpenChange={event => { const native: Event = event.nativeEvent; void native; }} onActiveOptionChange={(_event, data) => { const value: string | undefined = data.nextOption?.value; void value; }} /><Dropdown onOptionSelect={event => { const native: Event = event.nativeEvent; void native; }} onOpenChange={event => { const native: Event = event.nativeEvent; void native; }} /><Listbox onOptionSelect={event => { const native: Event = event.nativeEvent; void native; }} /></>;`;
const typeConfigPath = resolve("packages/sharepoint-ui/tsconfig.json");
const typeConfig = ts.readConfigFile(typeConfigPath, ts.sys.readFile);
const typeOptions = { ...ts.parseJsonConfigFileContent(typeConfig.config, ts.sys, resolve("packages/sharepoint-ui")).options, noEmit: true, rootDir: undefined };
const typeHost = ts.createCompilerHost(typeOptions);
const originalExists = typeHost.fileExists.bind(typeHost), originalRead = typeHost.readFile.bind(typeHost), originalSource = typeHost.getSourceFile.bind(typeHost);
typeHost.fileExists = file => resolve(file) === typeFixturePath || originalExists(file);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalRead(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalSource(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], "Combobox, Dropdown, and Listbox callbacks match Fluent event and active-option contracts");

const bundle = await build({
  stdin: {
    sourcefile: "combobox-compounds.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{ComboBox,Dropdown,Listbox,Option,OptionGroup,ComboboxProvider}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";window.events={dropdown:[],dropdownSlots:[],open:[],active:[],listbox:[],provider:[],combo:[],comboOpen:[],fluentRegistered:[],fluentUnregistered:[],fluentSelected:[],fluentActive:[],fluentOpen:[]};function App(){return <><ComboboxProvider value={{onOptionSelect:(_event,data)=>window.events.provider.push(data)}}><Dropdown data-testid="dropdown" label="Choose a color" defaultValue="Blue" defaultSelectedOptions={["blue"]} onOptionSelect={(event,data)=>window.events.dropdown.push({...data,eventType:event.type,target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeType:event.nativeEvent.type,preventDefault:typeof event.preventDefault})} onOpenChange={(event,data)=>window.events.open.push({open:data.open,eventType:event.type,nativeType:event.nativeEvent.type,currentTarget:event.currentTarget.tagName})} onActiveOptionChange={(event,data)=>window.events.active.push({...data,eventType:event.type,nativeType:event.nativeEvent.type,currentTarget:event.currentTarget.tagName,eventDetail:data.event instanceof CustomEvent?{id:data.event.detail.id,previousId:data.event.detail.previousId}:null})} clearable appearance="filled-lighter" size="large" positioning="below-start"><OptionGroup label="Cool colors"><Option value="blue" text="Blue">Blue</Option><Option value="green" text="Green">Green</Option></OptionGroup><OptionGroup label="Warm colors"><Option value="red" text="Red">Red</Option></OptionGroup></Dropdown></ComboboxProvider><ComboBox data-testid="combo" label="Type a color" defaultValue="Blue" selectedValue="blue" clearable defaultOpen disableAutoFocus inlinePopup appearance="filled-darker" size="large" positioning="above-end" onOpenChange={(event,data)=>window.events.comboOpen.push({open:data.open,eventType:event.type,nativeType:event.nativeEvent.type,currentTarget:event.currentTarget.tagName})} onActiveOptionChange={(event,data)=>window.events.active.push({...data,eventType:event.type,sameEvent:event===data.event})} onOptionSelect={(event,data)=>window.events.combo.push({...data,eventType:event.type,target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeType:event.nativeEvent.type,preventDefault:typeof event.preventDefault})}><OptionGroup label="Cool colors"><Option value="green" text="Green">Green</Option></OptionGroup></ComboBox><Dropdown data-testid="dropdown-slots" label="Custom controls" button={<button data-testid="custom-trigger">Open custom</button>} listbox={<ul data-testid="custom-listbox" className="custom-listbox" />} defaultValue="Green" defaultSelectedOptions={["green"]} clearable clearButton={<button data-testid="custom-clear">Remove selection</button>} expandIcon={<i data-testid="custom-expand">v</i>} onOptionSelect={(_event,data)=>window.events.dropdownSlots.push(data)}><Option value="green">Green</Option></Dropdown><Listbox data-testid="listbox" multiselect defaultSelectedOptions={["one"]} onOptionSelect={(_event,data)=>window.events.listbox.push(data)}><Option value="one" text="One">One</Option><OptionGroup label="More"><Option value="two" text="Two">Two</Option></OptionGroup></Listbox></>}createRoot(document.querySelector("#root")).render(<App/>);function ProviderDemo(){const[open,setOpen]=React.useState(false),[selectedOptions,setSelectedOptions]=React.useState(["alpha"]),[activeOption,setActiveOption]=React.useState();const registerOption=React.useCallback((option,element)=>{window.events.fluentRegistered.push({value:option.value,text:option.text,connected:element.isConnected});return()=>window.events.fluentUnregistered.push(option.value)},[]);const setProviderOpen=React.useCallback((event,next)=>{window.events.fluentOpen.push({open:next,eventType:event?.type});setOpen(next)},[]);const selectOption=React.useCallback((_event,option)=>{window.events.fluentSelected.push(option.value);setSelectedOptions([option.value])},[]);const setProviderActive=React.useCallback(option=>{const next=typeof option==="function"?option(activeOption):option;window.events.fluentActive.push(next?.value??null);setActiveOption(next)},[activeOption]);const value=React.useMemo(()=>({activeOption,appearance:"filled-lighter",focusVisible:false,open,registerOption,selectedOptions,selectOption,setActiveOption:setProviderActive,setOpen:setProviderOpen,size:"large"}),[activeOption,open,registerOption,selectedOptions,selectOption,setProviderActive,setProviderOpen]);return React.createElement(ComboboxProvider,{value},React.createElement(Dropdown,{"data-testid":"fluent-provider",label:"Provider state"},React.createElement(Option,{value:"alpha",text:"Alpha"},"Alpha"),React.createElement(Option,{value:"beta",text:"Beta"},"Beta")))}const providerRoot=document.createElement("div");providerRoot.style.cssText="position:fixed;right:12px;top:400px;z-index:100000";document.body.append(providerRoot);createRoot(providerRoot).render(React.createElement(ProviderDemo));`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><main id='root'></main><script src='/bundle.js'></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.events.fluentRegistered.length === 2);
  const fluentProvider = page.getByTestId("fluent-provider");
  assert.equal(await fluentProvider.getAttribute("open"), null, "the provider's initial closed state reaches the dropdown engine");
  assert.equal(await fluentProvider.getAttribute("appearance"), "filled-lighter", "the Fluent context appearance reaches the dropdown engine");
  assert.equal(await fluentProvider.getAttribute("size"), "large", "the Fluent context size reaches the dropdown engine");
  assert.deepEqual(await page.evaluate(() => window.events.fluentRegistered.map(option => ({ value: option.value, text: option.text, connected: option.connected }))), [
    { value: "alpha", text: "Alpha", connected: true },
    { value: "beta", text: "Beta", connected: true },
  ], "composed options register with the compatible context provider");
  await fluentProvider.getByRole("combobox").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="fluent-provider"]')?.hasAttribute("open"));
  await fluentProvider.getByRole("option", { name: "Beta" }).click();
  await page.waitForFunction(() => window.events.fluentSelected.length === 1);
  assert.deepEqual(await page.evaluate(() => ({ selected: window.events.fluentSelected, open: window.events.fluentOpen, active: window.events.fluentActive })), {
    selected: ["beta"], open: [{ open: true, eventType: "click" }, { open: false, eventType: "click" }], active: ["alpha", null],
  }, "selection, open, and active-option updates reach the Fluent context value");
  await fluentProvider.evaluate(node => { if (node.parentElement) node.parentElement.style.display = "none"; });
  const dropdown = page.getByTestId("dropdown");
  const input = dropdown.locator("input");
  assert.equal(await input.getAttribute("readonly"), "");
  assert.equal(await input.inputValue(), "Blue");
  assert.equal(await dropdown.locator(".clear").isVisible(), true);
  assert.equal(await dropdown.getAttribute("appearance"), "filled-lighter");
  assert.equal(await dropdown.getAttribute("size"), "large");
  assert.equal(await dropdown.getAttribute("positioning"), "below-start");
  const dropdownTrigger = dropdown.getByRole("combobox");
  assert.equal(await dropdownTrigger.getAttribute("aria-haspopup"), "listbox");
  await dropdownTrigger.click();
  assert.equal(await dropdown.getByRole("group", { name: "Cool colors" }).count(), 1, "group label should be represented in the popup accessibility tree");
  await page.getByRole("option", { name: "Green" }).click();
  await page.waitForFunction(() => window.events.dropdown.length === 1 && window.events.provider.length === 1);
  const selection = await page.evaluate(() => ({ dropdown: window.events.dropdown[0], provider: window.events.provider[0], open: window.events.open, active: window.events.active }));
  assert.equal(selection.dropdown.optionValue, "green");
  assert.equal(selection.dropdown.optionText, "Green");
  assert.equal(selection.dropdown.eventType, "click");
  assert.deepEqual({ target: selection.dropdown.target, currentTarget: selection.dropdown.currentTarget, nativeType: selection.dropdown.nativeType, preventDefault: selection.dropdown.preventDefault }, { target: "DIV", currentTarget: "DIV", nativeType: "click", preventDefault: "function" }, "Dropdown selection exposes a React-shaped mouse event on the selected option");
  assert.deepEqual(selection.dropdown.selectedOptions, ["green"]);
  assert.equal(selection.provider.optionValue, "green");
  assert.deepEqual(selection.open, [{ open: true, eventType: "click", nativeType: "click", currentTarget: "BUTTON" }, { open: false, eventType: "click", nativeType: "click", currentTarget: "DIV" }]);
  assert.deepEqual(selection.active[0].nextOption, { id: "blue", value: "blue", text: "Blue", disabled: undefined }, "active option changes expose Fluent OptionValue objects");
  assert.equal(selection.active[0].type, "change");
  assert.equal(selection.active[0].eventType, "click");
  assert.deepEqual(selection.active[0].eventDetail, { id: "blue", previousId: null }, "active-option event exposes Fluent active-descendant detail");
  await dropdown.locator(".clear").click();
  await page.waitForFunction(() => window.events.dropdown.length === 2);
  assert.deepEqual(await page.evaluate(() => window.events.dropdown[1].selectedOptions), []);

  const slottedDropdown = page.getByTestId("dropdown-slots");
  assert.equal(await slottedDropdown.getByTestId("custom-expand").textContent(), "v");
  const customTrigger = slottedDropdown.getByTestId("custom-trigger");
  assert.equal(await customTrigger.getAttribute("role"), "combobox");
  assert.equal(await customTrigger.getAttribute("aria-haspopup"), "listbox");
  await customTrigger.click();
  assert.equal(await customTrigger.getAttribute("aria-expanded"), "true");
  const customListbox = slottedDropdown.getByTestId("custom-listbox");
  assert.equal(await customListbox.getAttribute("role"), "listbox");
  assert.ok(await customListbox.getAttribute("id"));
  assert.equal(await customListbox.getByRole("option", { name: "Green" }).count(), 1);
  assert.equal((await customListbox.evaluate(node => getComputedStyle(node).position)), "absolute");
  await customTrigger.press("Enter");
  await page.waitForFunction(() => window.events.dropdownSlots.length === 1);
  const customClear = slottedDropdown.getByTestId("custom-clear");
  assert.equal(await customClear.getAttribute("aria-label"), "Clear");
  assert.equal(await customClear.getAttribute("type"), "button");
  await customClear.click();
  await page.waitForFunction(() => window.events.dropdownSlots.length === 2);
  assert.deepEqual(await page.evaluate(() => window.events.dropdownSlots[1].selectedOptions), []);
  await page.evaluate(() => {
    const native = document.createElement("spui-combobox");
    native.setAttribute("label", "Native slot test");
    native.setAttribute("read-only", "");
    native.setAttribute("button-trigger", "");
    native.setAttribute("clearable", "");
    native.setAttribute("selected-value", "green");
    native.setAttribute("clear-label", "Remove color");
    native.innerHTML = '<spui-combobox-option value="green">Green</spui-combobox-option><button slot="button">Native trigger</button><button slot="clear-button">Remove</button><b slot="expand-icon">v</b><ul slot="listbox"></ul>';
    window.nativeSlotEvents = [];
    native.addEventListener("spui-change", event => window.nativeSlotEvents.push(event.detail.selectedOptions));
    native.dataset.testid = "native-dropdown-slots";
    document.body.append(native);
  });
  const nativeSlottedDropdown = page.locator("[data-testid=native-dropdown-slots]");
  assert.equal(await nativeSlottedDropdown.evaluate(node => node.shadowRoot.querySelector("slot[name=expand-icon]").assignedNodes().map(child => child.textContent).join("")), "v", "native expandIcon is assigned to the shadow slot");
  const nativeTrigger = nativeSlottedDropdown.locator("button[slot=button]");
  assert.equal(await nativeTrigger.getAttribute("role"), "combobox");
  assert.equal(await nativeTrigger.getAttribute("aria-label"), "Native slot test", "light-DOM trigger receives a resolvable accessible name");
  assert.equal(await nativeTrigger.getAttribute("aria-labelledby"), null, "button does not reference a label across shadow boundaries");
  assert.equal(await nativeSlottedDropdown.evaluate(node => node.shadowRoot.querySelector('slot[name="button"] button') === null), true, "assigned trigger removes the duplicate-id fallback button");
  await nativeTrigger.click();
  assert.equal(await nativeTrigger.getAttribute("aria-expanded"), "true");
  assert.equal(await nativeSlottedDropdown.locator("ul[slot=listbox]").getAttribute("role"), "listbox");
  assert.equal(await nativeSlottedDropdown.locator("ul[slot=listbox]").getByRole("option", { name: "Green" }).count(), 1);
  await nativeTrigger.press("Enter");
  assert.equal(await nativeSlottedDropdown.locator("button[slot=clear-button]").getAttribute("aria-label"), "Remove color");
  await nativeSlottedDropdown.locator("button[slot=clear-button]").click();
  await page.waitForFunction(() => window.nativeSlotEvents.length === 2 && window.nativeSlotEvents[1].length === 0);

  const combo = page.getByTestId("combo");
  assert.equal(await combo.getAttribute("clearable"), "true");
  assert.equal(await combo.getAttribute("default-open"), "true");
  assert.equal(await combo.getAttribute("disable-auto-focus"), "true");
  assert.equal(await combo.getAttribute("inline-popup"), "true");
  assert.equal(await combo.getAttribute("appearance"), "filled-darker");
  assert.equal(await combo.getAttribute("size"), "large");
  assert.equal(await combo.getAttribute("positioning"), "above-end");
  assert.equal(await combo.locator("input").inputValue(), "Blue", "defaultValue initializes the input");
  assert.equal(await combo.locator(".clear").isVisible(), true);
  await combo.locator("input").fill("Gr");
  await combo.locator("input").press("ArrowDown");
  await page.waitForFunction(() => window.events.active.some(data => data.nextOption?.value === "green"));
  await combo.locator("input").press("Enter");
  const comboSelection = await page.evaluate(() => window.events.combo[0]);
  assert.equal(comboSelection.optionValue, "green");
  assert.equal(comboSelection.optionText, "Green");
  assert.deepEqual(comboSelection.selectedOptions, ["green"]);
  assert.equal(comboSelection.eventType, "keydown");
  const comboInput = combo.locator("input");
  await combo.evaluate(node => node.setOpen(true));
  await combo.evaluate(node => node.setOpen(false));
  assert.deepEqual(await page.evaluate(() => window.events.comboOpen.slice(-2)), [{ open: true, eventType: "spui-open-change", nativeType: "spui-open-change", currentTarget: "SPUI-COMBOBOX" }, { open: false, eventType: "spui-open-change", nativeType: "spui-open-change", currentTarget: "SPUI-COMBOBOX" }], "programmatic open state changes retain the custom-event fallback");
  await comboInput.focus();
  await comboInput.press("x");
  await page.waitForFunction(() => window.events.comboOpen.at(-1)?.open === true);
  assert.deepEqual(await page.evaluate(() => window.events.comboOpen.slice(-1)), [{ open: true, eventType: "keydown", nativeType: "keydown", currentTarget: "INPUT" }], "typing opens the popup with the initiating key event");
  assert.deepEqual(await page.evaluate(() => window.events.combo.at(-1).selectedOptions), [], "typing with no matching option clears the prior single selection through the React callback");
  await comboInput.press("Escape");
  assert.deepEqual(await page.evaluate(() => window.events.comboOpen.slice(-1)), [{ open: false, eventType: "keydown", nativeType: "keydown", currentTarget: "INPUT" }], "Escape closes the popup with the initiating key event");
  await comboInput.press("ArrowDown");
  assert.deepEqual(await page.evaluate(() => window.events.comboOpen.slice(-1)), [{ open: true, eventType: "keydown", nativeType: "keydown", currentTarget: "INPUT" }], "Arrow navigation opens the popup with the initiating key event");
  await comboInput.press("Escape");
  await comboInput.click();
  await page.evaluate(() => { const button = document.createElement("button"); button.id = "outside-combobox"; button.textContent = "Outside"; document.body.append(button); });
  await page.getByRole("button", { name: "Outside" }).click();
  await page.waitForFunction(() => window.events.comboOpen.at(-1)?.eventType === "blur");
  assert.deepEqual(await page.evaluate(() => window.events.comboOpen.slice(-1)), [{ open: false, eventType: "blur", nativeType: "blur", currentTarget: "SPUI-COMBOBOX" }], "blur closes the popup with the initiating focus event");

  const listbox = page.getByTestId("listbox");
  assert.equal(await listbox.getAttribute("aria-multiselectable"), "true");
  assert.equal(await listbox.getByRole("option", { name: "One" }).getAttribute("aria-selected"), "true");
  await listbox.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await page.waitForFunction(() => window.events.listbox.length === 1);
  assert.deepEqual(await page.evaluate(() => window.events.listbox[0].selectedOptions), ["one", "two"]);
  assert.equal(await listbox.getByRole("option", { name: "Two" }).getAttribute("aria-selected"), "true");
  assert.equal(await listbox.getByRole("group", { name: "More" }).count(), 1);

  await page.evaluate(() => {
    const element = document.createElement("spui-combobox");
    element.setAttribute("label", "Keyboard parity");
    element.innerHTML = '<spui-combobox-option-group label="Disabled group" disabled><spui-combobox-option value="blocked">Blocked</spui-combobox-option></spui-combobox-option-group><spui-combobox-option value="alpha">Alpha</spui-combobox-option><spui-combobox-option value="beta">Beta</spui-combobox-option><spui-combobox-option value="gamma">Gamma</spui-combobox-option>';
    element.dataset.testid = "keyboard-parity-combo";
    document.body.append(element);
  });
  const keyboardCombo = page.getByTestId("keyboard-parity-combo");
  const keyboardInput = keyboardCombo.locator("input");
  await keyboardInput.press("Enter");
  assert.equal(await keyboardInput.getAttribute("aria-expanded"), "true", "Enter opens a closed Combobox");
  const activeOption = async () => keyboardCombo.evaluate(element => element.shadowRoot.getElementById(element.shadowRoot.querySelector("input").getAttribute("aria-activedescendant"))?.textContent?.trim());
  assert.equal(await activeOption(), "Alpha", "opening skips a disabled option group");
  await keyboardInput.press("End");
  assert.equal(await activeOption(), "Gamma", "End moves to the last enabled option");
  await keyboardInput.press("Home");
  assert.equal(await activeOption(), "Alpha", "Home moves to the first enabled option");
  await keyboardInput.press("End");
  await keyboardInput.press("PageUp");
  assert.equal(await activeOption(), "Alpha", "PageUp moves toward the first option and stops at the boundary");
  await keyboardInput.press("PageDown");
  assert.equal(await activeOption(), "Gamma", "PageDown moves toward the last option and stops at the boundary");
  await keyboardInput.press("Tab");
  assert.equal(await keyboardInput.inputValue(), "Gamma", "Tab commits the active single-select option");

  await keyboardInput.fill("be");
  assert.equal(await activeOption(), "Beta", "typing activates the first enabled option with a matching prefix");
  await keyboardInput.fill("zzz");
  assert.equal(await keyboardInput.inputValue(), "zzz", "clearing a selection retains the user's unmatched search text");
  assert.equal(await keyboardCombo.evaluate(element => element.selectedValue), "", "typing with no matching option clears the previous selection");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", dropdownReadonly: true, comboBoxComposition: true, optionGrouping: true, controlledCallbacks: true, dropdownSlots: true, nativeSlots: true, clearing: true, listboxKeyboard: true, multiselect: true, comboboxKeyboardParity: true, typingPrefixActivation: true, typingClearsStaleSelection: true, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
