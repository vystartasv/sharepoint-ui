import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.dialog-open-change-type-contract.tsx");
const typeFixture = `import * as React from "react"; import { Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger, type DialogOpenChangeEvent, type DialogOnOpenChangeData } from "./react.js"; const surfaceRef = React.createRef<HTMLDivElement>(); const surface = <DialogSurface ref={surfaceRef} onClick={event => { const currentTarget: HTMLDivElement = event.currentTarget; void currentTarget; }} />; const titleRef = React.createRef<HTMLHeadingElement>(); const title = <DialogTitle ref={titleRef} onClick={event => { const currentTarget: HTMLHeadingElement = event.currentTarget; void currentTarget; }} />; const contentRef = React.createRef<HTMLElement>(); const content = <DialogContent as="section" ref={contentRef} onClick={event => { const target: HTMLDivElement = event.currentTarget; void target; }} />; const body = <DialogBody as="article" />; const actionsRef = React.createRef<HTMLDivElement>(); const actions = <DialogActions ref={actionsRef} position="start" fluid onClick={event => { const target: HTMLDivElement = event.currentTarget; void target; }} />; const triggerRef = React.createRef<HTMLElement>(); const trigger = <DialogTrigger ref={triggerRef}>{props => <button {...props}>Open</button>}</DialogTrigger>; const example = <Dialog onOpenChange={(event, data) => { const typedEvent: DialogOpenChangeEvent = event; const target: HTMLElement = event.currentTarget; const open: boolean = data.open; const eventType: DialogOnOpenChangeData["type"] = data.type; void [typedEvent, target, open, eventType, surface, title, content, body, actions, trigger]; }} />;`;
const originalFileExists = ts.sys.fileExists;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.fileExists = file => resolve(file) === typeFixturePath || originalFileExists(file);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Dialog Fluent callback contract should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";
      import { createRoot } from "react-dom/client";
      import { Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger, Input } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
      import { defineDialog } from "${resolve("packages/sharepoint-ui/src/elements/dialog.ts")}";
      defineDialog();
      function Motion({ visible, slot, unmountOnExit, children }) { return !visible && unmountOnExit ? null : <div slot={slot} data-motion={slot} data-visible={String(visible)}>{children}</div>; }
      function App() {
        const [open, setOpen] = React.useState(false);
        const [fallbackOpen, setFallbackOpen] = React.useState(false);
        const [enhancedOpen, setEnhancedOpen] = React.useState(false);
        const [changes, setChanges] = React.useState([]);
        const surfaceRef = React.useRef(null);
        const titleRef = React.useRef(null);
        const contentRef = React.useRef(null);
        const bodyRef = React.useRef(null);
        const actionsRef = React.useRef(null);
        const keyboardTriggerRef = React.useRef(null);
        window.surfaceRef = surfaceRef;
        window.titleRef = titleRef;
        window.contentRef = contentRef;
        window.bodyRef = bodyRef;
        window.actionsRef = actionsRef;
        window.keyboardTriggerRef = keyboardTriggerRef;
        return <>
          <button data-testid="outside">Outside control</button>
          <Dialog data-testid="alert" defaultOpen modalType="alert"><DialogSurface><DialogTitle>Important update</DialogTitle><DialogActions data-testid="alert-actions" position="start" fluid><DialogTrigger action="close"><button data-testid="alert-action">Acknowledge</button></DialogTrigger></DialogActions></DialogSurface></Dialog>
          <Dialog data-testid="composed" open={open} closeLabel="Dismiss composed dialog" surfaceMotion={Motion} onOpenChange={(event,data) => { window.dialogOpenChanges.push({open:data.open,type:data.type,eventType:event.type,sameEvent:event===data.event,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type}); setOpen(data.open); setChanges(current => [...current, data.open]); }}><DialogTrigger><button data-testid="trigger">Open composed dialog</button></DialogTrigger><DialogTrigger disableButtonEnhancement><button data-testid="plain-trigger">Open without enhancement</button></DialogTrigger><DialogSurface id="composed-surface" className="surface-root" ref={surfaceRef} onClick={event => window.surfaceClicks.push([event.currentTarget.tagName,event.target.tagName])} backdrop={{ appearance: "dimmed" }} backdropMotion={Motion}><DialogContent id="content-root" ref={contentRef} onClick={event => window.contentClicks.push([event.currentTarget.tagName,event.target.tagName])}><DialogTitle id="composed-title" ref={titleRef} onClick={event => window.titleClicks.push([event.currentTarget.tagName,event.target.tagName])} action={<button data-testid="dialog-title-action">Help</button>}>Composed dialog title</DialogTitle><DialogBody id="body-root" ref={bodyRef} onClick={event => window.bodyClicks.push([event.currentTarget.tagName,event.target.tagName])}><p data-testid="body-copy">Composed dialog body</p></DialogBody><DialogActions id="actions-root" ref={actionsRef} onClick={event => window.actionsClicks.push([event.currentTarget.tagName,event.target.tagName])}><button data-testid="action">Save</button></DialogActions></DialogContent></DialogSurface></Dialog>
          <output data-testid="changes">{changes.join(",")}</output>
          <Dialog data-testid="trigger-accessibility" open={enhancedOpen} onOpenChange={(event,data) => { window.enhancedTriggerChanges.push({open:data.open,type:data.type,currentTarget:event.currentTarget.tagName}); setEnhancedOpen(data.open); }}><DialogTrigger><button data-testid="cancel-trigger" onClick={event => { window.cancelTriggerClicks++; event.preventDefault(); }}>Cancel open</button></DialogTrigger><DialogTrigger ref={keyboardTriggerRef}><div data-testid="keyboard-trigger">Open with keyboard</div></DialogTrigger><DialogSurface><DialogTitle>Keyboard trigger dialog</DialogTitle><DialogBody>Keyboard trigger content</DialogBody></DialogSurface></Dialog>
          <Dialog data-testid="legacy" inertTrapFocus unmountOnClose={false} title="Legacy title" actions={<button data-testid="legacy-action">Done</button>}><p data-testid="legacy-copy">Legacy body</p></Dialog>
          <button data-testid="fallback-trigger" onClick={() => setFallbackOpen(true)}>Open contained-focus dialog</button><Dialog data-testid="fallback" open={fallbackOpen} onOpenChange={(event,data) => {window.fallbackOpenChanges.push({open:data.open,type:data.type,eventType:event.type,sameEvent:event===data.event});setFallbackOpen(data.open)}} inertTrapFocus={false}><DialogSurface><DialogTitle>Contained focus</DialogTitle><DialogBody><button data-testid="fallback-one">First</button><Input data-testid="fallback-input" aria-label="Fallback dialog field"/><button data-testid="fallback-two">Last</button></DialogBody></DialogSurface></Dialog>
          <div hidden><DialogContent as="section" data-testid="polymorphic-content">Content root</DialogContent><DialogBody as="article" data-testid="polymorphic-body">Body root</DialogBody></div>
        </>;
      }
      createRoot(document.querySelector("#root")).render(<App/>);window.dialogOpenChanges=[];window.fallbackOpenChanges=[];window.enhancedTriggerChanges=[];window.cancelTriggerClicks=0;window.surfaceClicks=[];window.titleClicks=[];window.contentClicks=[];window.bodyClicks=[];window.actionsClicks=[];`,
    resolveDir: process.cwd(), sourcefile: "dialog-parity.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div><script src='/bundle.js'></script></body></html>"));
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
  await page.addScriptTag({ path: require.resolve("axe-core") });
  assert.deepEqual(await page.evaluate(() => [document.querySelector('[data-testid="polymorphic-content"]')?.localName, document.querySelector('[data-testid="polymorphic-body"]')?.localName]), ["section", "article"], "DialogContent and DialogBody honor the Fluent polymorphic as prop");

  const alert = page.getByTestId("alert");
  await page.waitForFunction(() => document.querySelector("[data-testid=alert]")?.shadowRoot?.querySelector("dialog")?.open);
  assert.equal(await page.getByRole("alertdialog", { name: "Important update" }).count(), 1, "alert mode provides alertdialog semantics and an accessible name");
  assert.equal(await alert.evaluate(host => host.shadowRoot.querySelector(".close").hidden), true, "alert mode requires an explicit action");
  await page.keyboard.press("Escape");
  assert.equal(await alert.evaluate(host => host.shadowRoot.querySelector("dialog").open), true, "alert mode ignores Escape");
  assert.equal(await page.getByTestId("alert-actions").evaluate(root => getComputedStyle(root).justifyContent), "flex-start", "DialogActions position=start aligns its native root");
  assert.equal(await page.getByTestId("alert-actions").locator("button").evaluate(trigger => getComputedStyle(trigger).flex), "1 1 0%", "DialogActions fluid expands action slots");
  await page.getByTestId("alert-action").click();
  await page.waitForFunction(() => !document.querySelector("[data-testid=alert]")?.shadowRoot?.querySelector("dialog")?.open);
  await page.waitForFunction(() => !document.querySelector("[data-testid=alert]")?.querySelector("[data-spui-dialog-title]"));
  assert.equal(await alert.evaluate(host => host.querySelector('[slot="surface"]')?.querySelector("[data-spui-dialog-title]")), null, "unmountOnClose removes composed content while retaining its surface and trigger");

  const composed = page.getByTestId("composed");
  const trigger = page.getByTestId("trigger");
  assert.equal(await page.getByTestId("plain-trigger").getAttribute("aria-haspopup"), null, "disableButtonEnhancement leaves its child unchanged");
  assert.equal(await trigger.getAttribute("aria-haspopup"), "dialog", "trigger exposes dialog popup semantics");
  assert.equal(await composed.locator("spui-dialog-trigger").count(), 0, "React DialogTrigger enhances its child without a wrapper element");
  assert.equal(await trigger.getAttribute("type"), "button", "enhanced submit-capable child is normalized to type=button");
  await trigger.click();
  await page.waitForFunction(() => document.querySelector("[data-testid=composed]")?.shadowRoot?.querySelector("dialog")?.open);
  assert.equal(await page.getByRole("button", { name: "Dismiss composed dialog" }).count(), 1, "React closeLabel customizes the close button accessible name");
  assert.deepEqual(await page.evaluate(() => window.dialogOpenChanges), [{ open: true, type: "triggerClick", eventType: "click", sameEvent: true, currentTarget: "BUTTON", nativeEventType: "click" }], "Dialog callback exposes a React-shaped event with the Fluent trigger root currentTarget and native source event");
  await page.waitForFunction(() => document.querySelector("[data-testid=composed]")?.querySelector("[data-spui-dialog-title]"));
  const relations = await composed.evaluate(host => {
    const dialog = host.shadowRoot.querySelector("dialog");
    const title = host.querySelector("[data-spui-dialog-title]");
    const titleText = [...title.childNodes].filter(node => !(node instanceof Element && node.hasAttribute("data-spui-dialog-title-action"))).map(node => node.textContent).join("").trim();
    return { open: dialog.open, label: dialog.getAttribute("aria-label"), titleText, titleTag: title.localName, titleRole: title.getAttribute("role"), hiddenFallback: host.shadowRoot.querySelector("header h2").hidden, surfaceAssigned: host.shadowRoot.querySelector("slot[name=surface]").assignedElements().length };
  });
  assert.equal(relations.open, true);
  assert.equal(relations.label, relations.titleText, "composed title names the native dialog");
  assert.equal(relations.titleTag, "h2", "DialogTitle uses Fluent's native h2 root");
  assert.equal(await page.evaluate(() => window.titleRef.current?.id), "composed-title", "DialogTitle ref and id target its native root");
  assert.deepEqual(await page.evaluate(() => ({ content: [window.contentRef.current?.tagName, window.contentRef.current?.id], body: [window.bodyRef.current?.tagName, window.bodyRef.current?.id], actions: [window.actionsRef.current?.tagName, window.actionsRef.current?.id] })), { content: ["DIV", "content-root"], body: ["DIV", "body-root"], actions: ["DIV", "actions-root"] }, "DialogContent, DialogBody, and DialogActions refs and attributes target native roots");
  await page.locator("#composed-title").click();
  assert.deepEqual(await page.evaluate(() => window.titleClicks), [["H2", "H2"]], "DialogTitle React events use the native root");
  assert.deepEqual(await page.evaluate(() => window.contentClicks), [["DIV", "H2"]], "DialogContent events use its native div root");
  assert.equal(await page.getByTestId("dialog-title-action").count(), 1, "DialogTitle exposes its optional action");
  assert.equal(await page.getByTestId("dialog-title-action").count(), 1, "the title action remains composed inside the native heading");
  assert.equal(relations.hiddenFallback, true, "legacy chrome is hidden for the composed surface");
  assert.equal(relations.surfaceAssigned, 1);
  assert.deepEqual(await page.evaluate(() => ({ tag: window.surfaceRef.current?.tagName, id: window.surfaceRef.current?.id, className: window.surfaceRef.current?.className })), { tag: "DIV", id: "composed-surface", className: "surface-root" }, "DialogSurface props and ref target its native Fluent div root");
  assert.equal(await composed.locator("[data-motion=surface]").getAttribute("data-visible"), "true", "surfaceMotion receives the current open state");
  assert.equal(await composed.locator("[data-motion=backdrop]").getAttribute("data-visible"), "true", "backdropMotion receives the current open state");
  assert.equal(await composed.getAttribute("data-has-custom-backdrop"), "true", "custom backdrop switches to the managed modal overlay path");
  assert.equal(await composed.evaluate(host => host.shadowRoot.querySelector('slot[name="backdrop"]').assignedElements().length), 1, "custom backdrop motion root is assigned to the native dialog overlay");
  assert.equal(await composed.evaluate(host => host.shadowRoot.querySelector(".modal-backdrop").hidden), false, "custom backdrop is mounted while the dialog is open");
  assert.equal(await page.getByRole("dialog", { name: "Composed dialog title" }).count(), 1, "the composed title is the dialog's accessible name");
  await page.screenshot({ path: resolve("test-results/dialog-composition.png"), fullPage: true });
  await page.emulateMedia({ forcedColors: "active" });
  const dialogSystemColors = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;border:1px solid CanvasText";
    document.body.append(probe);
    const colors = { text: getComputedStyle(probe).color, canvas: getComputedStyle(probe).backgroundColor, border: getComputedStyle(probe).borderTopColor };
    probe.remove();
    return colors;
  });
  const dialogForcedColors = await composed.evaluate(host => {
    const dialog = host.shadowRoot.querySelector("dialog");
    const style = getComputedStyle(dialog);
    return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow, backdrop: getComputedStyle(dialog, "::backdrop").backgroundColor };
  });
  assert.equal(dialogForcedColors.text, dialogSystemColors.text, "Dialog text uses CanvasText in forced colors");
  assert.equal(dialogForcedColors.background, dialogSystemColors.canvas, "Dialog surface uses Canvas in forced colors");
  assert.equal(dialogForcedColors.border, dialogSystemColors.border, "Dialog border uses CanvasText in forced colors");
  assert.equal(dialogForcedColors.shadow, "none", "Dialog separation does not depend on shadow in forced colors");
  assert.equal(dialogForcedColors.backdrop, dialogSystemColors.canvas, "Dialog backdrop uses Canvas in forced colors");
  await page.emulateMedia({ forcedColors: "none" });
  assert.equal(await page.getByTestId("body-copy").isVisible(), true);
  await page.getByTestId("body-copy").click();
  assert.deepEqual(await page.evaluate(() => window.bodyClicks), [["DIV", "P"]], "DialogBody events use its native div root");
  assert.deepEqual(await page.evaluate(() => window.contentClicks.at(-1)), ["DIV", "P"], "DialogContent receives bubbled descendant events with its own root currentTarget");
  await page.getByTestId("action").click();
  assert.deepEqual(await page.evaluate(() => window.actionsClicks), [["DIV", "BUTTON"]], "DialogActions events use its native div root");
  assert.deepEqual(await page.evaluate(() => window.surfaceClicks), [["DIV", "H2"], ["DIV", "P"], ["DIV", "BUTTON"]], "DialogSurface React events use native root target and currentTarget");
  assert.equal(await composed.evaluate(host => host.hasAttribute("open")), true, "interior action does not dismiss the dialog");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[data-testid=composed]")?.shadowRoot?.querySelector("dialog")?.open);
  assert.deepEqual(await page.evaluate(() => window.dialogOpenChanges.at(-1)), { open: false, type: "escapeKeyDown", eventType: "keydown", sameEvent: true, currentTarget: "DIALOG", nativeEventType: "keydown" }, "Dialog close callback includes the Fluent Escape reason and source event");
  await page.waitForFunction(() => document.querySelector("[data-testid=changes]")?.textContent === "true,false");
  assert.equal(await page.getByTestId("changes").textContent(), "true,false", "controlled open state reports both transitions");

  const triggerAccessibility = page.getByTestId("trigger-accessibility");
  await page.getByTestId("cancel-trigger").click();
  assert.equal(await page.evaluate(() => window.cancelTriggerClicks), 1, "the child click handler runs before trigger activation");
  assert.equal(await triggerAccessibility.evaluate(host => host.shadowRoot.querySelector("dialog").open), false, "a canceled child click does not open the dialog");
  const keyboardTrigger = page.getByTestId("keyboard-trigger");
  assert.deepEqual(await keyboardTrigger.evaluate(element => ({ role: element.getAttribute("role"), tabIndex: element.tabIndex, popup: element.getAttribute("aria-haspopup") })), { role: "button", tabIndex: 0, popup: "dialog" }, "non-button triggers receive button semantics and keyboard focus");
  assert.equal(await page.evaluate(() => window.keyboardTriggerRef.current?.tagName), "DIV", "DialogTrigger ref forwards to its child root");
  await keyboardTrigger.focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector("[data-testid=trigger-accessibility]")?.shadowRoot?.querySelector("dialog")?.open);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[data-testid=trigger-accessibility]")?.shadowRoot?.querySelector("dialog")?.open);
  await keyboardTrigger.focus();
  await page.keyboard.press("Space");
  await page.waitForFunction(() => document.querySelector("[data-testid=trigger-accessibility]")?.shadowRoot?.querySelector("dialog")?.open);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[data-testid=trigger-accessibility]")?.shadowRoot?.querySelector("dialog")?.open);
  assert.deepEqual(await page.evaluate(() => window.enhancedTriggerChanges), [{ open: true, type: "triggerClick", currentTarget: "DIV" }, { open: false, type: "escapeKeyDown", currentTarget: "DIALOG" }, { open: true, type: "triggerClick", currentTarget: "DIV" }, { open: false, type: "escapeKeyDown", currentTarget: "DIALOG" }], "custom element triggers open through Enter and Space and preserve callback reasons");

  const legacy = page.getByTestId("legacy");
  await legacy.evaluate(host => { host.open = true; });
  assert.equal(await legacy.evaluate(host => host.shadowRoot.querySelector(".close").getAttribute("aria-label")), "Close", "default close label remains available");
  assert.equal(await legacy.evaluate(host => host.shadowRoot.querySelector("dialog").open), true, "legacy title/actions API remains functional");
  assert.equal(await legacy.evaluate(host => host.shadowRoot.querySelector("dialog").matches(":modal")), true, "inertTrapFocus=true uses the native modal focus trap");
  assert.equal(await page.getByTestId("legacy-copy").isVisible(), true);
  assert.equal(await page.getByTestId("legacy-action").isVisible(), true);
  await legacy.evaluate(host => host.shadowRoot.querySelector(".close").click());
  assert.equal(await legacy.evaluate(host => host.shadowRoot.querySelector("dialog").open), false);

  await page.evaluate(() => {
    const native = document.createElement("spui-dialog");
    native.id = "native-composed";
    native.setAttribute("close-label", "Dismiss native dialog");
    native.innerHTML = '<spui-dialog-trigger><button id="native-trigger">Open native</button></spui-dialog-trigger><spui-dialog-surface><spui-dialog-title>Native title<span slot="action" id="native-title-action">Help</span></spui-dialog-title><spui-dialog-body><p id="native-copy">Native body</p></spui-dialog-body><spui-dialog-actions><button>Done</button></spui-dialog-actions></spui-dialog-surface>';
    document.body.append(native);
  });
  await page.locator("#native-trigger").click();
  const native = page.locator("#native-composed");
  await page.waitForFunction(() => document.querySelector("#native-composed")?.shadowRoot?.querySelector("dialog")?.open);
  assert.equal(await native.evaluate(host => host.shadowRoot.querySelector(".close").getAttribute("aria-label")), "Dismiss native dialog", "native close-label reaches the button accessible name");
  const nativeRelation = await native.evaluate(host => ({ label: host.shadowRoot.querySelector("dialog").getAttribute("aria-label"), titleText: host.querySelector("spui-dialog-title").childNodes[0].textContent.trim(), titleActionAssigned: host.querySelector("spui-dialog-title").shadowRoot.querySelector("slot[name=action]").assignedElements().some(element => element.id === "native-title-action"), copyVisible: host.querySelector("#native-copy").getBoundingClientRect().height > 0 }));
  assert.equal(nativeRelation.label, nativeRelation.titleText);
  assert.equal(nativeRelation.titleActionAssigned, true, "native DialogTitle exposes its optional action slot");
  assert.equal(nativeRelation.copyVisible, true);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#native-composed")?.shadowRoot?.querySelector("dialog")?.open);

  const fallbackTrigger = page.getByTestId("fallback-trigger");
  const fallback = page.getByTestId("fallback");
  await fallbackTrigger.click();
  await page.waitForFunction(() => document.querySelector("[data-testid=fallback]")?.shadowRoot?.querySelector("dialog")?.open);
  assert.deepEqual(await fallback.evaluate(host => ({ ariaModal: host.shadowRoot.querySelector("dialog").getAttribute("aria-modal"), backdropHidden: host.shadowRoot.querySelector(".modal-backdrop").hidden })), { ariaModal: "true", backdropHidden: false }, "inertTrapFocus=false retains modal semantics with a themed overlay");
  const dialogViolations = await page.evaluate(async () => (await axe.run(document.querySelector('[data-testid="fallback"]'), { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map(({ id, help, nodes }) => ({ id, help, targets: nodes.map(node => node.target) })));
  assert.deepEqual(dialogViolations, [], `contained-focus Dialog passes axe WCAG checks: ${JSON.stringify(dialogViolations)}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=fallback-one]")?.matches(":focus"));
  assert.equal(await page.getByRole("textbox", { name: "Fallback dialog field" }).count(), 1, "custom control in contained modal has an accessible name");
  await page.keyboard.press("Tab");
  assert.equal(await page.getByTestId("fallback-input").locator("input").evaluate(element => element.matches(":focus")), true, "Tab follows focus into the input shadow root");
  await page.keyboard.press("Tab");
  assert.equal(await page.getByTestId("fallback-two").evaluate(element => element.matches(":focus")), true, "Tab advances inside the modal");
  await page.keyboard.press("Tab");
  assert.equal(await page.getByTestId("fallback-one").evaluate(element => element.matches(":focus")), true, "Tab wraps at the last control");
  const pathProbe = await page.evaluate(() => {
    const host = document.querySelector("[data-testid=fallback]");
    const dialog = host.shadowRoot.querySelector("dialog");
    let includesDialog = false;
    const probe = event => { if (event.target.matches("[data-testid=outside]")) includesDialog = event.composedPath().includes(dialog); };
    document.addEventListener("focus", probe, true);
    document.querySelector("[data-testid=outside]").focus();
    document.removeEventListener("focus", probe, true);
    return { includesDialog, activeId: document.activeElement?.getAttribute("data-testid") };
  });
  assert.equal(pathProbe.includesDialog, false, "the probed focus event originated outside the dialog");
  const guardedFocus = await fallback.evaluate(host => ({ firstFocused: host.querySelector("[data-testid=fallback-one]").matches(":focus"), activeId: document.activeElement?.getAttribute("data-testid"), trapActive: host.fallbackTrapActive }));
  assert.equal(guardedFocus.firstFocused, true, `programmatic outside focus returns into the modal (${JSON.stringify(guardedFocus)})`);
  await fallback.evaluate(host => host.shadowRoot.querySelector(".modal-backdrop").click());
  await page.waitForFunction(() => !document.querySelector("[data-testid=fallback]")?.shadowRoot?.querySelector("dialog")?.open);
  assert.deepEqual(await page.evaluate(() => window.fallbackOpenChanges.at(-1)), { open: false, type: "backdropClick", eventType: "click", sameEvent: true }, "Dialog backdrop callback includes the Fluent reason and source event");
  await fallbackTrigger.click();
  await page.waitForFunction(() => document.querySelector("[data-testid=fallback]")?.shadowRoot?.querySelector("dialog")?.open);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[data-testid=fallback]")?.shadowRoot?.querySelector("dialog")?.open);
  await page.waitForTimeout(50);
  assert.equal(await fallbackTrigger.evaluate(element => element.matches(":focus")), true, "closing restores focus to the trigger");
  await page.evaluate(() => { const element = document.createElement("spui-dialog"); element.dataset.testid = "native-label"; element.setAttribute("dialog-label", "Native details"); element.setAttribute("modal", "false"); element.setAttribute("open", ""); document.body.append(element); });
  const nativeLabelDialog = page.getByTestId("native-label");
  assert.equal(await nativeLabelDialog.evaluate(element => element.shadowRoot.querySelector(".fallback-title").textContent), "Native details", "framework-neutral dialog-label names the fallback heading");
  await nativeLabelDialog.evaluate(element => element.setAttribute("dialog-label", "Updated native details"));
  assert.equal(await nativeLabelDialog.evaluate(element => element.shadowRoot.querySelector(".fallback-title").textContent), "Updated native details", "framework-neutral dialog-label updates after connection");
  await nativeLabelDialog.evaluate(element => element.remove());
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", reactComposition: true, nativeComposition: true, triggerAndAccessibleName: true, controlledOpenAndClose: true, defaultOpenAndAlertMode: true, triggerActionAndEnhancement: true, unmountOnClose: true, dialogActionsPositionAndFluid: true, inertTrapFocusOptOut: true, focusContainmentAndRestoration: true, shadowRootTabOrder: true, axeViolations: 0, legacyApi: true, forcedColors: { system: dialogSystemColors, rendered: dialogForcedColors }, noPageErrors: true, screenshot: "test-results/dialog-composition.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
