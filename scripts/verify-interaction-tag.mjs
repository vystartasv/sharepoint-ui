import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.tag-dismiss-event-type-contract.tsx");
const typeFixture = `import * as React from "react"; import { TagGroup, type TagDismissEvent } from "./react.js"; const example = <TagGroup onDismiss={(event, data) => { const typedEvent: TagDismissEvent = event; const target: Element = event.currentTarget; const value: string = data.value; void [typedEvent, target, value]; }} onTagSelect={(event, data) => { const callbackEvent: Event | React.SyntheticEvent = event; if (data.type === "click") { const branch: React.MouseEvent<HTMLButtonElement> = data.event; void branch; } else { const branch: Event | React.SyntheticEvent = data.event; void branch; } void [callbackEvent, data.value]; }} />;`;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `TagGroup Fluent callback contract should type-check: ${typeErrors.join("\n")}`);

function contrastRatio(foreground, background) {
  const luminance = color => {
    const channels = color.startsWith("color(srgb") ? color.match(/[\d.]+/g).slice(0, 3).map(Number) : color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255);
    return channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  };
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const bundle = await build({
  stdin: { contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{InteractionTag,InteractionTagPrimary,InteractionTagSecondary,Tag,TagGroup}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineInteractionTag,defineTag,defineTagGroup}from"${resolve("packages/sharepoint-ui/src/elements/tags.ts")}";window.events=[];window.tagDismiss=[];createRoot(document.querySelector("#react")).render(<><InteractionTag value="documents" label="Documents" appearance="brand" selected onTagSelect={(event,data)=>window.events.push({type:"select",...data})} onDismiss={(event,data)=>window.events.push({type:"dismiss",...data})}><InteractionTagPrimary media={<span>M</span>} primaryText={<span data-testid="interaction-primary-text">Library title</span>} secondaryText="5 files">Library</InteractionTagPrimary><InteractionTagSecondary/></InteractionTag><Tag data-testid="rich-tag" dismissible label="Quarterly report" media={<span>PDF</span>} icon={<b>★</b>} primaryText="Quarterly report" secondaryText="Updated today" dismissIcon={<i>×</i>} onDismiss={(value,label)=>window.tagDismiss.push({value,label})} /></>);window.groupEvents=[];createRoot(document.querySelector("#group")).render(<TagGroup label="Document filters" appearance="outline" size="small" dismissible defaultSelectedValues={["alpha"]} onTagSelect={(event,data)=>window.groupEvents.push({sameEvent:event===data.event,eventType:event.type,dataType:data.type,value:data.value,selectedValues:data.selectedValues,currentTarget:event.currentTarget.tagName,target:event.target.tagName,nativeEventType:event.nativeEvent.type})} onDismiss={(event,data)=>window.groupEvents.push({type:"dismiss",...data,eventType:event.type,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})}><InteractionTag value="alpha"><InteractionTagPrimary data-testid="alpha-primary">Alpha</InteractionTagPrimary></InteractionTag><InteractionTag value="beta"><InteractionTagPrimary data-testid="beta-primary">Beta</InteractionTagPrimary></InteractionTag><Tag value="old" label="Old document">Old</Tag></TagGroup>);window.controlledEvents=[];createRoot(document.querySelector("#controlled")).render(<TagGroup label="Controlled" selectedValues={["fixed"]} onTagSelect={(event,data)=>window.controlledEvents.push({eventType:event.type,dataType:data.type,value:data.value,selectedValues:data.selectedValues,currentTarget:event.currentTarget.tagName,target:event.target.tagName,nativeEventType:event.nativeEvent.type})}><InteractionTag value="fixed"><InteractionTagPrimary>Fixed</InteractionTagPrimary></InteractionTag></TagGroup>);window.mountNative=()=>{defineInteractionTag();defineTag();defineTagGroup();const host=document.createElement("spui-interaction-tag");host.setAttribute("value","native");host.setAttribute("label","Native record");host.setAttribute("selected","");const primary=document.createElement("spui-interaction-tag-primary");primary.textContent="Native primary";const secondary=document.createElement("spui-interaction-tag-secondary");host.append(primary,secondary);document.querySelector("#native").append(host);window.nativeEvents=[];host.addEventListener("spui-tag-select",event=>window.nativeEvents.push({type:"select",...event.detail}));host.addEventListener("spui-dismiss",event=>window.nativeEvents.push({type:"dismiss",...event.detail}));const richTag=document.createElement("spui-tag");richTag.id="native-rich-tag";richTag.setAttribute("dismissible","");richTag.setAttribute("label","Native slot tag");for(const [slotName,text] of [["media","IMG"],["icon","!"],["primary-text","Native primary"],["secondary-text","Native detail"],["dismiss-icon","×"]]){const part=document.createElement("span");part.slot=slotName;part.textContent=text;richTag.append(part)}document.querySelector("#native").append(richTag);const group=document.createElement("spui-tag-group");group.setAttribute("label","Native group");group.setAttribute("size","extra-small");group.setAttribute("default-selected-values","[\\"native-a\\"]");const a=document.createElement("spui-interaction-tag");a.setAttribute("value","native-a");const ap=document.createElement("spui-interaction-tag-primary");ap.dataset.testid="native-group-a";ap.textContent="A";a.append(ap);const b=document.createElement("spui-interaction-tag");b.setAttribute("value","native-b");const bp=document.createElement("spui-interaction-tag-primary");bp.dataset.testid="native-group-b";bp.textContent="B";const primaryOverride=document.createElement("span");primaryOverride.slot="primary-text";primaryOverride.textContent="B override";bp.append(primaryOverride);b.append(bp);group.append(a,b);group.addEventListener("spui-selection-change",event=>window.nativeEvents.push({type:"group-select",eventType:event.detail.event.type,dataType:event.detail.type,value:event.detail.value,selectedValues:event.detail.selectedValues}));document.querySelector("#native").append(group)};`, resolveDir: process.cwd(), sourcefile: "interaction-tag-check.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const html = "<!doctype html><html><body><main id='react'></main><main id='group'></main><main id='controlled'></main><main id='native' dir='rtl'></main><script src='/bundle.js'></script><script>window.mountNative()</script></body></html>";
const server = createServer((request, response) => request.url === "/bundle.js" ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents) : response.writeHead(200, { "content-type": "text/html" }).end(html));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const richTag = page.getByTestId("rich-tag");
  await richTag.waitFor();
  const reactSlots = await richTag.evaluate(node => Object.fromEntries(["media", "icon", "primary-text", "secondary-text", "dismiss-icon"].map(name => [name, node.shadowRoot.querySelector(`slot[name="${name}"]`).assignedNodes({ flatten: true }).map(item => item.textContent.trim()).join("")])));
  assert.deepEqual(reactSlots, { media: "PDF", icon: "★", "primary-text": "Quarterly report", "secondary-text": "Updated today", "dismiss-icon": "×" }, "React Tag content slots render into their Fluent positions");
  const richDismiss = richTag.getByRole("button", { name: "Remove Quarterly report" });
  await richDismiss.click();
  assert.deepEqual(await page.evaluate(() => window.tagDismiss), [{ value: "", label: "Quarterly report" }], "slotted primary text provides the dismiss callback label");
  const nativeRichTag = page.locator("#native-rich-tag");
  const nativeSlotNames = await nativeRichTag.evaluate(node => ["media", "icon", "primary-text", "secondary-text", "dismiss-icon"].map(name => [name, node.shadowRoot.querySelector(`slot[name="${name}"]`).assignedNodes({ flatten: true }).length]));
  assert.deepEqual(nativeSlotNames.map(([name]) => name), ["media", "icon", "primary-text", "secondary-text", "dismiss-icon"]);
  assert.ok(nativeSlotNames.every(([, count]) => count === 1), "direct custom elements support all Fluent Tag slots");
  assert.equal(await nativeRichTag.getByRole("button", { name: "Remove Native slot tag" }).count(), 1);
  const primary = page.locator("#react spui-interaction-tag-primary").getByRole("button");
  assert.equal(await page.getByTestId("interaction-primary-text").textContent(), "Library title", "React primaryText replaces the default children slot");
  assert.equal(await primary.evaluate(button => button.getRootNode().host.shadowRoot.querySelector("slot[name=primary-text]").assignedElements().length), 1, "React primaryText is assigned to the named slot");
  assert.equal(await primary.getAttribute("aria-pressed"), "true", "selected state reaches the primary action");
  assert.equal(await primary.getAttribute("aria-label"), null, "primary action retains its visible text as its accessible name");
  await primary.click();
  assert.deepEqual(await page.evaluate(() => window.events[0]), { type: "select", value: "documents", selected: true });
  const secondary = page.getByRole("button", { name: "Remove Documents" });
  assert.equal(await secondary.count(), 1, "secondary action has a useful localized accessible name");
  await secondary.click();
  assert.deepEqual(await page.evaluate(() => window.events[1]), { type: "dismiss", value: "documents" });
  const tag = page.locator("#react spui-interaction-tag");
  await page.locator("#react").evaluate(node => node.style.setProperty("--colorBrandBackground", "#0067c0"));
  const blueSurface = await tag.evaluate(node => getComputedStyle(node).backgroundColor);
  await page.locator("#react").evaluate(node => node.style.setProperty("--colorBrandBackground", "#008a45"));
  const greenSurface = await tag.evaluate(node => getComputedStyle(node).backgroundColor);
  assert.notEqual(blueSurface, greenSurface, "surface color recalculates from the inherited theme accent");
  await tag.evaluate(node => node.setAttribute("disabled", ""));
  assert.equal(await primary.isDisabled(), true);
  assert.equal(await secondary.isDisabled(), true);
  await tag.evaluate(node => node.removeAttribute("disabled"));
  const nativePrimary = page.locator("#native > spui-interaction-tag > spui-interaction-tag-primary").getByRole("button");
  assert.equal(await nativePrimary.getAttribute("aria-pressed"), "true");
  const nativeTag = page.locator("#native > spui-interaction-tag");
  await page.locator("#native").evaluate(node => node.style.setProperty("--spui-semantic-primary-button-background", "#005a9e"));
  const nativeBlue = await nativeTag.evaluate(node => getComputedStyle(node).backgroundColor);
  await page.locator("#native").evaluate(node => node.style.setProperty("--spui-semantic-primary-button-background", "#187a42"));
  assert.notEqual(nativeBlue, await nativeTag.evaluate(node => getComputedStyle(node).backgroundColor), "custom elements derive their surface from inherited SPFx semantic tokens");
  await nativePrimary.click();
  assert.equal(await page.evaluate(() => window.nativeEvents[0].type), "select");
  await page.locator("#native > spui-interaction-tag > spui-interaction-tag-secondary").getByRole("button").click();
  assert.deepEqual(await page.evaluate(() => ({ type: window.nativeEvents[1].type, value: window.nativeEvents[1].value })), { type: "dismiss", value: "native" });
  const nativeGroup = page.getByRole("toolbar", { name: "Native group" });
  const nativeA = nativeGroup.locator("spui-interaction-tag[value=native-a]").getByRole("button");
  const nativeB = nativeGroup.locator("spui-interaction-tag[value=native-b]").getByRole("button");
  assert.equal(await nativeGroup.locator("[data-testid=native-group-b]").evaluate(host => host.shadowRoot.querySelector("slot[name=primary-text]").assignedElements()[0]?.textContent), "B override", "native primary-text replaces the default children slot");
  assert.equal(await nativeA.getAttribute("aria-pressed"), "true", "custom-element default selection initializes");
  await nativeB.click();
  assert.equal(await nativeB.getAttribute("aria-pressed"), "true");
  assert.deepEqual(await page.evaluate(() => window.nativeEvents[2]), { type: "group-select", eventType: "click", dataType: "click", value: "native-b", selectedValues: ["native-a", "native-b"] });
  await nativeA.focus();
  await page.keyboard.press("ArrowLeft");
  const nativeFocus = await page.evaluate(() => { let node = document.activeElement; while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement; return node?.getRootNode() instanceof ShadowRoot ? node.getRootNode().host.getAttribute("data-testid") : node?.getAttribute("data-testid"); });
  assert.equal(nativeFocus, "native-group-b", "RTL left arrow advances logically");
  const group = page.getByRole("toolbar", { name: "Document filters" });
  const alpha = group.locator("spui-interaction-tag[value=alpha]").getByRole("button");
  const beta = group.locator("spui-interaction-tag[value=beta]").getByRole("button");
  assert.equal(await alpha.getAttribute("aria-pressed"), "true", "defaultSelectedValues initializes the selection");
  assert.equal(await group.locator("spui-tag[value=old]").getAttribute("size"), "small", "group size is inherited by Tag");
  assert.equal(await group.locator("spui-tag[value=old]").getAttribute("appearance"), "outline", "group appearance is inherited by Tag");
  assert.equal(await group.locator("spui-tag[value=old]").getAttribute("dismissible"), "", "group dismissal default reaches Tag");
  await beta.click();
  assert.equal(await beta.getAttribute("aria-pressed"), "true", "uncontrolled selection toggles the clicked tag");
  assert.deepEqual(await page.evaluate(() => window.groupEvents[0]), { sameEvent: true, eventType: "click", dataType: "click", value: "beta", selectedValues: ["alpha", "beta"], currentTarget: "BUTTON", target: "BUTTON", nativeEventType: "click" });
  await group.locator("spui-tag[value=old]").getByRole("button", { name: "Remove Old document" }).click();
  assert.deepEqual(await page.evaluate(() => window.groupEvents[1]), { type: "dismiss", value: "old", eventType: "click", currentTarget: "BUTTON", nativeEventType: "click" });
  await alpha.focus();
  await page.keyboard.press("ArrowRight");
  const focusTarget = await page.evaluate(() => { let node = document.activeElement; while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement; return node?.getRootNode() instanceof ShadowRoot ? node.getRootNode().host.getAttribute("data-testid") : node?.getAttribute("data-testid"); });
  assert.equal(focusTarget, "beta-primary", "arrow navigation advances between tag actions");
  const fixed = page.locator("#controlled spui-interaction-tag[value=fixed]").getByRole("button");
  await fixed.click();
  assert.deepEqual(await page.evaluate(() => window.controlledEvents[0]), { eventType: "click", dataType: "click", value: "fixed", selectedValues: [], currentTarget: "BUTTON", target: "BUTTON", nativeEventType: "click" });
  assert.equal(await fixed.getAttribute("aria-pressed"), "true", "controlled selection waits for parent values");
  await group.evaluate(node => node.setAttribute("disabled", ""));
  assert.equal(await beta.isDisabled(), true, "group disabled state reaches descendant actions");
  await group.evaluate(node => node.removeAttribute("disabled"));
  assert.equal(await beta.isDisabled(), false, "removing group disabled state restores child interactivity");
  const toneSamples = await page.evaluate(() => {
    const colors = { success: "#107c10", warning: "#835b00", danger: "#b10e1c", informative: "#cf4292" };
    for (const [background, surface, text] of [["light", "#ffffff", "#242424"], ["strong", "#103d6b", "#ffffff"]]) {
      const section = document.createElement("section");
      section.dataset.themeBackground = background;
      section.style.cssText = `background:${background === "strong" ? "#092b4f" : "#ffffff"};padding:16px;--spui-ui-surface:${surface};--spui-base-surface:${surface};--spui-ui-text:${text};--spui-ui-stroke:${background === "strong" ? "#8da6bd" : "#d1d1d1"};--spui-ui-accent:#cf4292;--spui-ui-success:${colors.success};--spui-ui-warning:${colors.warning};--spui-ui-danger:${colors.danger};--spui-ui-info:${colors.informative}`;
      for (const appearance of ["filled", "outline", "brand"]) for (const color of Object.keys(colors)) for (const selected of [false, true]) {
        const tag = document.createElement("spui-tag");
        tag.dataset.testid = `tag-tone-${background}-${appearance}-${color}${selected ? "-selected" : ""}`;
        tag.setAttribute("appearance", appearance);
        tag.setAttribute("color", color);
        if (selected) tag.setAttribute("selected", "");
        tag.textContent = `${color} ${appearance}${selected ? " selected" : ""}`;
        section.append(tag);
      }
      document.body.append(section);
    }
    return [...document.querySelectorAll("[data-testid^=tag-tone-]")].map(node => { const style = getComputedStyle(node); return { id: node.dataset.testid, color: style.color, background: style.backgroundColor, border: style.borderTopColor }; });
  });
  assert.equal(toneSamples.length, 48, "four semantic Tag colors render in selected and unselected states for every appearance on light and strong surfaces");
  for (const sample of toneSamples) {
    assert.ok(contrastRatio(sample.color, sample.background) >= 4.5, `${sample.id} text contrast is at least 4.5:1 (${contrastRatio(sample.color, sample.background).toFixed(2)}:1): ${JSON.stringify(sample)}`);
    assert.ok(contrastRatio(sample.border, sample.background) >= 3, `${sample.id} boundary contrast is at least 3:1 (${contrastRatio(sample.border, sample.background).toFixed(2)}:1)`);
  }
  await page.emulateMedia({ forcedColors: "active" });
  const forcedColorsTag = await page.locator('[data-testid="tag-tone-strong-brand-informative-selected"]').evaluate(node => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, color: style.color, borderColor: style.borderTopColor, outlineWidth: style.outlineWidth };
  });
  assert.equal(forcedColorsTag.background, "rgb(255, 255, 255)", "forced-colors tag uses the system Canvas background");
  assert.equal(forcedColorsTag.outlineWidth, "1px", "forced-colors selected tag retains a visible system selection outline");
  await page.emulateMedia({ forcedColors: "none" });
  await page.screenshot({ path: resolve("test-results/interaction-tag.png"), fullPage: true });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactActions: true, customElementActions: true, reactAndCustomGroupSelection: true, controlledAndDefaultValues: true, groupCallbacks: true, inheritedTagDefaults: true, fluentTagSlotsReactAndNative: true, primaryTextDismissName: true, keyboardNavigation: true, rtlCustomElement: true, selectedSemantics: true, accessibleDismissName: true, disabledPropagation: true, reactThemeAccentRecalculation: true, customElementThemeTokenRecalculation: true, semanticColorContrastMatrix: { samples: toneSamples.length, minimumTextContrast: Math.min(...toneSamples.map(sample => contrastRatio(sample.color, sample.background))), minimumBoundaryContrast: Math.min(...toneSamples.map(sample => contrastRatio(sample.border, sample.background))) }, forcedColorsTag: { visibleCanvasBackground: true, selectedOutlineWidth: forcedColorsTag.outlineWidth }, pageErrors: errors.length }));
} finally { await browser?.close(); server.close(); }
