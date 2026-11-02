import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const root = resolve(process.cwd());
const typeFixturePath = resolve("packages/sharepoint-ui/src/.menu-checked-event-type-contract.tsx");
const typeFixture = `import { Menu, type MenuProps, type MenuCheckedValueChangeEvent } from "./react.js"; type Assert<T extends true> = T; type EventOf<T> = NonNullable<T> extends (event: infer E, ...args: any[]) => unknown ? E : never; type EventMatches = Assert<EventOf<MenuProps["onCheckedValueChange"]> extends MenuCheckedValueChangeEvent ? true : false>; const example = <Menu onCheckedValueChange={(event, data) => { const typedEvent: MenuCheckedValueChangeEvent = event; const target: Element = event.currentTarget; const name: string = data.name; const nativeEvent: Event = event.nativeEvent; void [typedEvent, target, name, nativeEvent]; }} onOpenChange={(event, data) => { if (data.type === "scrollOutside" || data.type === "menuMouseEnter") { const eventData: MouseEvent | TouchEvent = data.event; void [eventData, event]; } }} />;`;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Menu Fluent callback contract should type-check: ${typeErrors.join("\n")}`);
const bundle = await build({
  stdin: { sourcefile: "menu-parity.tsx", loader: "tsx", resolveDir: root, contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,Menu,MenuItem,MenuItemCheckbox,MenuItemLink,MenuItemRadio,MenuItemSwitch,MenuList,MenuPopover,MenuSplitGroup,MenuTrigger}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";import{defineMenu}from"${resolve(root, "packages/sharepoint-ui/src/elements/menu.ts")}";window.selectionChanges=[];window.menuSelects=[];window.menuOpenChanges=[];window.hoverChanges=[];window.scrollChanges=[];window.controlledChanges=0;window.React=React;window.createRoot=createRoot;function App(){return <><Menu data-testid="composed" label="Preferences" defaultOpen hasIcons hasCheckmarks defaultCheckedValues={{channels:["mail"],sort:["name"],notifications:[]}} onCheckedValueChange={(event,data)=>window.selectionChanges.push({...data,eventType:event.type,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})} onOpenChange={(event,data)=>window.menuOpenChanges.push({open:data.open,type:data.type,eventType:event.type,sameEvent:event===data.event,bubble:data.bubble,keyboard:data.keyboard})} onSelect={(value)=>window.menuSelects.push(value)}><MenuTrigger><Button data-testid="trigger">Preferences</Button></MenuTrigger><MenuPopover><MenuList><MenuItemCheckbox name="channels" value="mail" data-testid="mail" persistOnClick checkmark={<b data-testid="custom-menu-checkmark">✓</b>} content={<span data-testid="custom-menu-content">Email updates</span>}>Email updates</MenuItemCheckbox><MenuItemRadio name="sort" value="name" data-testid="sort-name" persistOnClick checkmark={<i data-testid="custom-radio-checkmark">●</i>}>Sort by name</MenuItemRadio><MenuItemSwitch name="notifications" value="enabled" data-testid="switch" persistOnClick switchIndicator={<span data-testid="switch-indicator">●</span>}>Notifications</MenuItemSwitch><MenuItemLink href="#target" data-testid="link" checkmark={{className:"custom-link-checkmark", "data-testid":"custom-link-checkmark", children:"✓"}} icon={{className:"custom-link-icon", "data-testid":"custom-link-icon", children:"↗"}} content={{className:"custom-link-content", "data-testid":"custom-link-content", children:"Open target"}} secondaryContent={{className:"custom-link-secondary", "data-testid":"custom-link-secondary", children:"Opens in new tab"}}>Fallback target</MenuItemLink><MenuItem data-testid="persist" value="keep" persistOnClick>Keep menu open</MenuItem><MenuItem data-testid="submenu-slot" hasSubmenu submenuIndicator={<span data-testid="custom-submenu-indicator">»</span>}>Actions</MenuItem><MenuItem data-testid="mail-first" value="mail-first">Mail preferences</MenuItem><MenuSplitGroup data-testid="split-group"><MenuItem value="copy">Copy</MenuItem><MenuItem data-testid="more" value="more">More</MenuItem></MenuSplitGroup></MenuList></MenuPopover></Menu><Menu data-testid="hover" label="Hover" openOnHover hoverDelay={10} onOpenChange={(event,data)=>window.hoverChanges.push({open:data.open,type:data.type,eventType:event.type,sameEvent:event===data.event})} trigger={<Button data-testid="hover-trigger">Hover menu</Button>}><MenuItem>Hover action</MenuItem></Menu><Menu data-testid="scroll" label="Scroll" defaultOpen closeOnScroll onOpenChange={(event,data)=>window.scrollChanges.push({open:data.open,type:data.type,eventType:event.type,sameEvent:event===data.event})} trigger={<Button data-testid="scroll-trigger">Scroll menu</Button>}><MenuItem>Scroll action</MenuItem></Menu><Menu data-testid="inline" label="Inline" inline positioning={{placement:"below",align:"end",offset:12}} trigger={<Button data-testid="inline-trigger">Inline menu</Button>}><MenuItem>Inline action</MenuItem></Menu></>}createRoot(document.querySelector("#root")).render(<App/>);window.mountControlled=()=>{const Controlled=()=>{const [values,setValues]=React.useState({density:[]});return React.createElement(Menu,{"data-testid":"controlled-menu",defaultOpen:true,checkedValues:values,onCheckedValueChange:(_event,data)=>{window.controlledChanges++;setValues(current=>({...current,[data.name]:data.checkedItems}))}},React.createElement(MenuItemCheckbox,{name:"density",value:"compact","data-testid":"controlled-toggle",persistOnClick:true},"Compact density"))};createRoot(document.querySelector("#controlled-root")).render(React.createElement(Controlled));};window.mountNative=()=>{defineMenu();const menu=document.createElement("spui-menu");menu.id="native";menu.setAttribute("label","Native");const trigger=document.createElement("spui-menu-trigger");trigger.slot="trigger";trigger.dataset.testid="native-trigger";trigger.textContent="Native trigger";const list=document.createElement("spui-menu-list");list.slot="menu";const item=document.createElement("spui-menu-item");item.setAttribute("kind","switch");item.setAttribute("name","native");item.setAttribute("value","enabled");item.textContent="Native setting";const indicator=document.createElement("span");indicator.slot="switch-indicator";indicator.textContent="●";item.append(indicator);list.append(item);const messages=document.createElement("spui-menu-item");messages.dataset.testid="native-message";messages.setAttribute("has-submenu","");const nativeContent=document.createElement("span");nativeContent.slot="content";nativeContent.textContent="Messages";const nativeCheck=document.createElement("span");nativeCheck.slot="checkmark";nativeCheck.textContent="✓";const nativeSubmenu=document.createElement("span");nativeSubmenu.slot="submenuIndicator";nativeSubmenu.textContent="→";messages.append(nativeContent,nativeCheck,nativeSubmenu);const link=document.createElement("spui-menu-item-link");link.href="#native-target";const linkContent=document.createElement("span");linkContent.slot="content";linkContent.textContent="Native link";const linkCheck=document.createElement("span");linkCheck.slot="checkmark";linkCheck.textContent="✓";link.append(linkContent,linkCheck);const more=document.createElement("spui-menu-item");more.dataset.testid="native-more";more.textContent="More";list.append(messages,link,more);menu.append(trigger,list);document.querySelector("#native-root").append(menu);};` },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve(root, "node_modules/react"), "react-dom/client": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve(root, "examples/spfx124-webpart/node_modules")],
});
const html = `<!doctype html><html><body><div id="root"></div><div id="controlled-root"></div><div id="native-root"></div><div id="target">Target</div><script src="/bundle.js"></script></body></html>`;
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end(html));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=composed]")?.shadowRoot?.querySelector(".surface"));
  const menu = page.getByTestId("composed");
  assert.equal(await menu.evaluate(node => node.open), true, "defaultOpen opens on mount");
  assert.deepEqual(await page.getByTestId("trigger").evaluate(host => { const button = host.shadowRoot.querySelector("button"); return { haspopup: button.getAttribute("aria-haspopup"), expanded: button.getAttribute("aria-expanded"), controls: button.getAttribute("aria-controls") }; }), { haspopup: "menu", expanded: "true", controls: null }, "popup semantics reach the focusable control without an invalid cross-shadow ID reference");
  const rootVisualFlags = await page.getByTestId("persist").evaluate(item => ({ hasCheckmarks: item.closest("[has-checkmarks]")?.hasAttribute("has-checkmarks"), checkmarkVisible: !item.shadowRoot.querySelector(".check").hidden, hasIcons: item.closest("[has-icons]")?.hasAttribute("has-icons"), iconReserved: !item.shadowRoot.querySelector(".icon").hidden }));
  assert.deepEqual(rootVisualFlags, { hasCheckmarks: true, checkmarkVisible: true, hasIcons: true, iconReserved: true }, "Menu root visual flags reach menu items without a configured MenuList");
  await page.emulateMedia({ forcedColors: "active" });
  const menuSystem = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;border:1px solid CanvasText";
    document.body.append(probe);
    const colors = { text: getComputedStyle(probe).color, canvas: getComputedStyle(probe).backgroundColor, border: getComputedStyle(probe).borderTopColor };
    probe.remove();
    return colors;
  });
  const menuForced = await menu.evaluate(host => {
    const surface = host.shadowRoot.querySelector(".surface");
    const style = getComputedStyle(surface);
    return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow };
  });
  assert.equal(menuForced.text, menuSystem.text, "Menu text uses CanvasText in forced colors");
  assert.equal(menuForced.background, menuSystem.canvas, "Menu surface uses Canvas in forced colors");
  assert.equal(menuForced.border, menuSystem.border, "Menu surface border uses CanvasText");
  assert.equal(menuForced.shadow, "none", "Menu separation does not rely on shadow in forced colors");
  await page.emulateMedia({ forcedColors: "none" });
  assert.equal(await page.getByTestId("mail").getAttribute("checked"), "true", "defaultCheckedValues reach checkbox items");
  assert.equal(await page.getByTestId("mail").getAttribute("persist-on-click"), "", "selectable item persistence is forwarded to the menu engine");
  assert.equal(await page.getByTestId("mail").evaluate(host => host.shadowRoot.querySelector("slot[name=content]").assignedElements()[0]?.textContent), "Email updates", "content slot replaces default label content");
  assert.equal(await page.getByTestId("mail").evaluate(host => host.shadowRoot.querySelector("slot[name=checkmark]").assignedElements()[0]?.textContent), "✓", "checkbox checkmark slot replaces the default glyph");
  assert.equal(await page.getByTestId("sort-name").evaluate(host => host.shadowRoot.querySelector("slot[name=checkmark]").assignedElements()[0]?.textContent), "●", "radio checkmark slot is replaceable");
  assert.equal(await page.getByTestId("submenu-slot").evaluate(host => host.shadowRoot.querySelector("slot[name=submenuIndicator]").assignedElements()[0]?.textContent), "»", "submenu indicator slot replaces the default chevron");
  await page.getByTestId("mail").click();
  assert.equal(await menu.evaluate(node => node.open), true, "persistOnClick keeps a selectable menu open");
  assert.deepEqual(await page.evaluate(() => window.selectionChanges.at(-1)), { name: "channels", checkedItems: [], eventType: "click", currentTarget: "BUTTON", nativeEventType: "click" });
  await page.getByTestId("sort-name").click();
  assert.deepEqual(await page.evaluate(() => window.selectionChanges.at(-1)), { name: "sort", checkedItems: ["name"], eventType: "click", currentTarget: "BUTTON", nativeEventType: "click" });
  const switchItem = page.getByTestId("switch");
  assert.equal(await switchItem.evaluate(host => host.shadowRoot.querySelector("slot[name=switch-indicator]").assignedElements()[0]?.textContent), "●", "React switchIndicator is assigned to its native slot");
  await switchItem.click();
  assert.equal(await switchItem.getAttribute("checked"), "", "switch toggles checked state");
  assert.equal(await menu.evaluate(node => node.open), true, "switch item persistence keeps menu open");
  assert.equal(await switchItem.locator("button").getAttribute("role"), "menuitemcheckbox");
  await page.getByTestId("persist").click();
  assert.equal(await menu.evaluate(node => node.open), true, "MenuItem.persistOnClick keeps the menu open");
  await page.keyboard.press("Escape");
  assert.equal(await menu.evaluate(node => node.open), false, "Escape closes composed menu");assert.deepEqual(await page.evaluate(()=>window.menuOpenChanges.at(-1)),{open:false,type:"menuPopoverKeyDown",eventType:"keydown",sameEvent:true,bubble:false,keyboard:true},"open-change carries keyboard source data");
  await page.getByTestId("trigger").click();assert.deepEqual(await page.evaluate(()=>window.menuOpenChanges.at(-1)),{open:true,type:"menuTriggerClick",eventType:"click",sameEvent:true,bubble:false,keyboard:false},"open-change carries trigger click data");
  const link = page.getByTestId("link");
  assert.equal(await link.evaluate(host => host.shadowRoot.querySelector('slot[name="checkmark"]').assignedElements()[0]?.textContent), "✓", "React MenuItemLink checkmark slot is assigned");
  assert.equal(await link.evaluate(host => host.shadowRoot.querySelector('slot[name="content"]').assignedElements()[0]?.textContent), "Open target", "React MenuItemLink content slot is assigned");
  for (const [slot, className] of [["checkmark", "custom-link-checkmark"], ["icon", "custom-link-icon"], ["content", "custom-link-content"], ["secondary-content", "custom-link-secondary"]]) {
    assert.equal(await link.evaluate((host, name) => host.shadowRoot.querySelector(`slot[name="${name}"]`).assignedElements()[0]?.getAttribute("class"), slot), className, `MenuItemLink ${slot} slot props reach the rendered slot element`);
  }
  assert.equal(await link.evaluate(host => host.shadowRoot.querySelector('slot[name="secondary-content"]').assignedElements()[0]?.textContent), "Opens in new tab", "secondaryContent supports object slot props");
  await link.click();assert.deepEqual(await page.evaluate(()=>window.menuOpenChanges.at(-1)),{open:false,type:"menuItemClick",eventType:"click",sameEvent:true,bubble:false,keyboard:false},"open-change carries item click data");
  assert.equal(new URL(page.url()).hash, "#target", "MenuItemLink retains native anchor navigation");
  assert.equal(await menu.evaluate(node => node.open), false, "link selection closes menu");

  await page.getByTestId("trigger").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="mail"]')?.shadowRoot?.activeElement);
  await page.keyboard.press("m");
  assert.equal(await page.getByTestId("mail-first").evaluate(host => host.shadowRoot.activeElement === host.shadowRoot.querySelector("button")), true, "first-character search wraps forward from the active menu item");
  await page.keyboard.press("m");
  assert.equal(await page.getByTestId("more").evaluate(host => host.shadowRoot.activeElement === host.shadowRoot.querySelector("button")), true, "repeated first characters cycle through matching menu items like Fluent");
  await page.waitForTimeout(550);
  await page.keyboard.press("o");
  await page.keyboard.press("p");
  assert.equal(await page.getByTestId("link").evaluate(host => host.shadowRoot.activeElement === host.shadowRoot.querySelector("a")), true, "multi-character typeahead remains available as an extension");

  await page.evaluate(() => window.mountControlled());
  const controlledToggle = page.getByTestId("controlled-toggle");
  assert.equal(await controlledToggle.getAttribute("checked"), null, "controlled selection begins unchecked");
  await controlledToggle.click();
  assert.equal(await controlledToggle.evaluate(node => node.hasAttribute("checked")), true, "controlled callback updates the rendered selection");
  assert.equal(await page.evaluate(() => window.controlledChanges), 1, "controlled checked-value callback fires once");

  await page.getByTestId("hover-trigger").hover();
  await page.waitForFunction(() => document.querySelector("[data-testid=hover]")?.open === true);assert.deepEqual(await page.evaluate(()=>window.hoverChanges.at(-1)),{open:true,type:"menuTriggerMouseEnter",eventType:"pointerover",sameEvent:true});
  await page.mouse.move(500, 500);
  await page.waitForFunction(() => document.querySelector("[data-testid=hover]")?.open === false);assert.deepEqual(await page.evaluate(()=>window.hoverChanges.at(-1)),{open:false,type:"menuTriggerMouseLeave",eventType:"pointerout",sameEvent:true});
  const inline = page.getByTestId("inline");
  await page.getByTestId("inline-trigger").click();
  assert.equal(await inline.evaluate(node => node.open), true, "positioning options open inline menu");
  assert.equal(await inline.evaluate(node => node.shadowRoot.querySelector(".surface").hasAttribute("popover")), false, "inline skips the top layer");
  await page.emulateMedia({ forcedColors: "active" });
  const inlineForced = await inline.evaluate(host => {
    const style = getComputedStyle(host.shadowRoot.querySelector(".surface"));
    return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow };
  });
  assert.equal(inlineForced.text, menuSystem.text, "inline Menu text uses CanvasText in forced colors");
  assert.equal(inlineForced.background, menuSystem.canvas, "inline Menu surface uses Canvas");
  assert.equal(inlineForced.border, menuSystem.border, "inline Menu border uses CanvasText");
  assert.equal(inlineForced.shadow, "none", "inline Menu does not rely on shadow in forced colors");
  await page.emulateMedia({ forcedColors: "none" });
  await page.getByTestId("scroll-trigger").click();
  assert.equal(await page.getByTestId("scroll").evaluate(node => node.open), true);
  await page.evaluate(() => document.dispatchEvent(new WheelEvent("wheel", { bubbles: true })));
  assert.equal(await page.getByTestId("scroll").evaluate(node => node.open), false, "closeOnScroll closes after an outside wheel gesture");assert.deepEqual(await page.evaluate(()=>window.scrollChanges.at(-1)),{open:false,type:"scrollOutside",eventType:"wheel",sameEvent:true});

  await page.getByTestId("hover").evaluate(node => { node.open = true; });
  await inline.evaluate(node => { node.open = true; });
  await inline.locator("spui-menu-item").first().hover();
  assert.equal(await page.getByTestId("hover").evaluate(node => node.open), false, "entering a sibling menu dismisses the open hover menu");
  assert.deepEqual(await page.evaluate(() => window.hoverChanges.at(-1)), { open: false, type: "menuMouseEnter", eventType: "mouseover", sameEvent: true }, "menuMouseEnter preserves Fluent's originating mouse event");

  await page.evaluate(() => window.mountNative());
  const native = page.locator("#native");
  await native.locator("spui-menu-trigger").click();
  await page.waitForFunction(() => document.querySelector("#native")?.open === true);
  const nativeItem = native.locator("spui-menu-item").first();
  assert.equal(await nativeItem.evaluate(host => host.shadowRoot.querySelector("slot[name=switch-indicator]").assignedElements()[0]?.textContent), "●", "native switch-indicator slot is assigned");
  const nativeMessage = page.getByTestId("native-message");
  assert.equal(await nativeMessage.evaluate(host => host.shadowRoot.querySelector("slot[name=content]").assignedElements()[0]?.textContent), "Messages", "custom-element content slot is assigned");
  assert.equal(await nativeMessage.evaluate(host => host.shadowRoot.querySelector("slot[name=checkmark]").assignedElements()[0]?.textContent), "✓");
  assert.equal(await nativeMessage.evaluate(host => host.shadowRoot.querySelector("slot[name=submenuIndicator]").assignedElements()[0]?.textContent), "→");
  const nativeLink = native.locator("spui-menu-item-link");
  assert.equal(await nativeLink.evaluate(host => host.shadowRoot.querySelector('slot[name="checkmark"]').assignedElements()[0]?.textContent), "✓", "native MenuItemLink checkmark slot is assigned");
  assert.equal(await nativeLink.evaluate(host => host.shadowRoot.querySelector('slot[name="content"]').assignedElements()[0]?.textContent), "Native link", "native MenuItemLink content slot is assigned");
  assert.equal(await nativeItem.locator("button").getAttribute("role"), "menuitemcheckbox", "framework-neutral switch uses menuitemcheckbox semantics");
  await nativeItem.click();
  assert.equal(await nativeItem.getAttribute("checked"), "", "framework-neutral switch toggles");
  await native.locator("spui-menu-trigger").click();
  await page.waitForFunction(() => document.querySelector("#native")?.open === true);
  await page.waitForFunction(() => document.querySelector("#native")?.querySelector("spui-menu-item")?.shadowRoot?.activeElement);
  await page.keyboard.press("m");
  assert.equal(await page.getByTestId("native-message").evaluate(host => host.shadowRoot.activeElement === host.shadowRoot.querySelector("button")), true, "custom-element menus support first-character wraparound");
  await page.keyboard.press("m");
  assert.equal(await page.getByTestId("native-more").evaluate(host => host.shadowRoot.activeElement === host.shadowRoot.querySelector("button")), true, "custom-element menus cycle repeated first characters");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", reactComposition: true, controlledAndDefaultCheckedValues: true, checkboxRadioSwitch: true, nativeLink: true, itemAndMenuPersistence: true, firstCharacterWraparoundAndRepeatedKeyCycling: true, multiCharacterTypeahead: true, nativeTypeaheadParity: true, hoverOpenClose: true, closeOnScroll: true, inlineAndPositioning: true, forcedColors: { system: menuSystem, surface: menuForced, inline: inlineForced }, customElementParts: true, pageErrors: errors.length }));
} finally {
  await browser?.close(); server.close();
}
