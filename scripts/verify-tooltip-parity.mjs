import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.tooltip-visible-event-type-contract.tsx");
const typeFixture = `import { Tooltip, type TooltipPositioning, type TooltipPositioningTargetRect, type TooltipVisibleChangeEvent } from "./react.js"; const targetRect: TooltipPositioningTargetRect = {x:1,y:2,left:1,top:2,right:4,bottom:6,width:3,height:4}; const positioning: TooltipPositioning = {position:"above",align:"start",offset:({targetRect})=>({mainAxis:targetRect.width,crossAxis:1}),fallbackPositions:["below-end","after-top"],autoSize:"height",matchTargetSize:"width",overflowBoundaryPadding:{start:4,end:8},target:{getBoundingClientRect:()=>targetRect},positioningRef:{current:null},onPositioningEnd:event=>{const placement:string=event.detail.placement;void placement;}}; const example = <Tooltip positioning={positioning} onVisibleChange={(event, data) => { const typedEvent: TooltipVisibleChangeEvent = event; if (event) { const target: HTMLElement = event.currentTarget; const nativeEvent: Event = event.nativeEvent; void [target, nativeEvent]; } const visible: boolean = data.visible; void [typedEvent, visible]; }} />;`;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Tooltip Fluent callback contract should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,Tooltip}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineTooltip}from"${resolve("packages/sharepoint-ui/src/elements/tooltip.ts")}";defineTooltip();window.tooltipEvents=[];window.positioningEvents=[];function App(){const[visible,setVisible]=React.useState(false);return <><Tooltip relationship="label" content="Save document" showDelay={80} hideDelay={100} data-testid="label-tooltip"><button data-testid="label-trigger" aria-labelledby="original-name">S</button></Tooltip><Tooltip relationship="description" content="Existing help plus tooltip" data-testid="description-tooltip"><button data-testid="description-trigger" aria-describedby="existing-help">D</button></Tooltip><Tooltip relationship="description" content="Shadow-safe tooltip description" data-testid="shadow-description-tooltip"><Button data-testid="shadow-description-trigger">Save</Button></Tooltip><Tooltip relationship="inaccessible" content="Available elsewhere" data-testid="inaccessible-tooltip"><button data-testid="inaccessible-trigger" aria-label="Existing action">I</button></Tooltip><Tooltip appearance="inverted" withArrow positioning={{position:"above",align:"start",offset:10,fallbackPositions:["below-end"],autoSize:"height",onPositioningEnd:event=>window.positioningEvents.push(event.detail)}} content="Arrow tip" showDelay={0} data-testid="arrow-tooltip"><button data-testid="arrow-trigger" style={{position:"fixed",left:200,top:250}}>A</button></Tooltip><Tooltip visible={visible} onVisibleChange={(event,data)=>{window.tooltipEvents.push({visible:data.visible,eventType:event?.type??null,currentTarget:event?.currentTarget.localName??null,nativeEventType:event?.nativeEvent.type??null,keyboardKey:data.documentKeyboardEvent?.key??null});setVisible(data.visible)}} content="Controlled tip" showDelay={0} data-testid="controlled-tooltip"><button data-testid="controlled-trigger" style={{position:"fixed",left:400,top:250}}>C</button></Tooltip></>};createRoot(document.querySelector("#root")).render(<App/>);`,
    resolveDir: process.cwd(), sourcefile: "tooltip-parity.tsx", loader: "tsx",
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
  const page = await browser.newPage({ viewport: { width: 900, height: 650 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const labelTrigger = page.getByTestId("label-trigger");
  const labelId = await labelTrigger.getAttribute("aria-labelledby");
  assert.ok(labelId?.includes("original-name"));
  assert.ok(labelId?.split(/\s+/).some(id => id.startsWith("spui-tooltip-")), "label relationship adds the tooltip id while preserving existing references");
  const descriptionTrigger = page.getByTestId("description-trigger");
  const descriptionIds = await descriptionTrigger.getAttribute("aria-describedby");
  assert.ok(descriptionIds?.includes("existing-help"));
  assert.ok(descriptionIds?.split(/\s+/).some(id => id.startsWith("spui-tooltip-")), "description relationship composes with existing descriptions");
  const shadowDescription = page.getByTestId("shadow-description-trigger");
  assert.equal(await shadowDescription.getAttribute("aria-describedby"), null, "tooltip avoids an ID reference that cannot cross into a trigger's shadow root");
  assert.equal(await shadowDescription.getAttribute("aria-description"), "Shadow-safe tooltip description");
  assert.equal(await shadowDescription.evaluate(node => node.shadowRoot.querySelector("button").getAttribute("aria-description")), "Shadow-safe tooltip description", "custom button forwards the shadow-safe description to its native control");
  assert.equal(await page.getByTestId("inaccessible-trigger").getAttribute("aria-describedby"), null, "inaccessible relationship adds no description reference");
  assert.equal(await page.getByTestId("inaccessible-trigger").getAttribute("aria-label"), "Existing action");
  await page.getByTestId("label-tooltip").evaluate(node => node.setAttribute("relationship", "inaccessible"));
  assert.equal(await labelTrigger.getAttribute("aria-labelledby"), "original-name", "relationship changes restore the trigger's original naming reference");

  await page.getByTestId("label-trigger").hover();
  const labelState = () => page.getByTestId("label-tooltip").evaluate(node => { const surface = node.querySelector("[role=tooltip]"); return { open: node.hasAttribute("open"), hidden: surface?.hidden, popoverOpen: surface?.matches(":popover-open") ?? false }; });
  await page.waitForTimeout(35);
  assert.equal((await labelState()).open, false, "showDelay prevents early opening");
  await page.waitForTimeout(150);
  assert.equal((await labelState()).open, true, "showDelay opens after it expires");
  assert.equal((await labelState()).popoverOpen, true, "open tooltip enters the browser top layer");
  await page.mouse.move(880, 630);
  await page.waitForTimeout(35);
  assert.equal((await labelState()).open, true, "hideDelay prevents early closing");
  await page.waitForFunction(() => !document.querySelector("#label-tooltip")?.hasAttribute("open"));

  await page.getByTestId("arrow-trigger").hover();
  await page.waitForTimeout(100);
  const arrowHostState = await page.getByTestId("arrow-tooltip").evaluate(node => ({ open: node.hasAttribute("open"), showDelay: node.getAttribute("show-delay"), disabled: node.hasAttribute("disabled"), html: node.innerHTML }));
  assert.equal(arrowHostState.open, true, `arrow tooltip opens after hover (${JSON.stringify(arrowHostState)})`);
  const positioningEvents = await page.evaluate(() => window.positioningEvents);
  assert.ok(positioningEvents.length > 0 && positioningEvents.at(-1).placement.startsWith("top"), "React object positioning reaches the native engine and reports its resolved placement");
  const arrowState = await page.getByTestId("arrow-tooltip").evaluate(node => { const surface = node.querySelector("[role=tooltip]"); return { appearance: surface?.getAttribute("data-appearance"), placement: surface?.getAttribute("data-placement"), arrowCount: surface?.querySelectorAll("[data-spui-tooltip-arrow][aria-hidden=true]").length ?? 0 }; });
  assert.equal(arrowState.appearance, "inverted");
  assert.equal(arrowState.placement, "top");
  assert.equal(arrowState.arrowCount, 1, "withArrow renders a decorative arrow");
  const anchor = await page.getByTestId("arrow-trigger").boundingBox();
  const arrowMetrics = await page.getByTestId("arrow-tooltip").evaluate(node => { const surface = node.querySelector("[role=tooltip]"); const arrow = surface?.querySelector("[data-spui-tooltip-arrow]"); return { tipX: surface?.getBoundingClientRect().x ?? -1, surfaceWidth: surface?.getBoundingClientRect().width, arrowLeft: arrow?.style.left, arrowOffset: arrow?.offsetLeft, arrowCenter: arrow ? arrow.getBoundingClientRect().x + arrow.getBoundingClientRect().width / 2 : -1 }; });
  const tipX = arrowMetrics.tipX;
  assert.ok(Math.abs(tipX - anchor.x) < 2, "above-start positioning aligns the tooltip to the trigger's inline start");
  assert.ok(Math.abs(arrowMetrics.arrowCenter - (anchor.x + anchor.width / 2)) < 2, `arrow points to the trigger even when the surface is start-aligned (${JSON.stringify({ arrowMetrics, anchor })})`);

  await page.emulateMedia({ forcedColors: "active" });
  const systemColors = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;border:1px solid CanvasText";
    document.body.append(probe);
    const result = { text: getComputedStyle(probe).color, canvas: getComputedStyle(probe).backgroundColor, border: getComputedStyle(probe).borderTopColor };
    probe.remove();
    return result;
  });
  const forcedTooltip = await page.getByTestId("arrow-tooltip").evaluate(node => {
    const surface = node.querySelector("[role=tooltip]");
    const style = getComputedStyle(surface);
    return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow };
  });
  const normalForcedTooltip = await page.getByTestId("label-tooltip").evaluate(node => {
    node.setAttribute("open", "");
    const style = getComputedStyle(node.querySelector("[role=tooltip]"));
    return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow };
  });
  for (const [appearance, result] of [["inverted", forcedTooltip], ["normal", normalForcedTooltip]]) {
    assert.equal(result.text, systemColors.text, `${appearance} Tooltip text adapts to CanvasText in forced colors`);
    assert.equal(result.background, systemColors.canvas, `${appearance} Tooltip surface adapts to Canvas in forced colors`);
    assert.equal(result.border, systemColors.border, `${appearance} Tooltip border remains visible in forced colors`);
    assert.equal(result.shadow, "none", `${appearance} Tooltip does not rely on shadow for separation in forced colors`);
  }
  await page.emulateMedia({ forcedColors: "none" });

  await page.getByTestId("controlled-trigger").hover();
  await page.waitForTimeout(100);
  const controlledState = await page.getByTestId("controlled-tooltip").evaluate(node => ({ open: node.hasAttribute("open"), showDelay: node.getAttribute("show-delay"), html: node.innerHTML }));
  assert.equal(controlledState.open, true, `React controlled visibility reflects consumer state (${JSON.stringify(controlledState)})`);
  assert.equal(await page.getByTestId("controlled-tooltip").evaluate(node => node.hasAttribute("open")), true, "React controlled visibility reflects consumer state");
  assert.deepEqual(await page.evaluate(() => window.tooltipEvents.at(-1)), { visible: true, eventType: "pointerenter", currentTarget: "spui-tooltip", nativeEventType: "pointerenter", keyboardKey: null }, "Fluent visibility callback receives the source pointer event");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#controlled-tooltip")?.hasAttribute("open"));
  assert.deepEqual(await page.evaluate(() => window.tooltipEvents.find(change => change.keyboardKey === "Escape")), { visible: false, eventType: null, currentTarget: null, nativeEventType: null, keyboardKey: "Escape" }, "Fluent keyboard dismissal exposes the document keyboard event and no pointer/focus event");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", ariaLabelDescriptionAndInaccessibleRelationships: true, existingAriaPreserved: true, separateShowHideDelays: true, normalAndInvertedAppearance: true, arrowRendering: true, alignedPositioning: true, forcedColors: { systemColors, normalTooltip: normalForcedTooltip, invertedTooltip: forcedTooltip }, fluentVisibilityCallbackEvents: true, controlledReactVisibility: true, noPageErrors: true }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
