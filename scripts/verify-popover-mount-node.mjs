import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.popover-mount-node-contract.tsx");
const typeFixture = `import { Popover, TeachingPopover, type PopoverContextValue, type PortalMountNode } from "./react.js"; const targets: PortalMountNode[] = [document.body, { className: "popover-layer" }, null]; const examples = [<Popover mountNode={targets[0]} />, <Popover mountNode={targets[1]} />, <Popover mountNode={targets[2]} />, <TeachingPopover mountNode={document.body} />]; const provider: PopoverContextValue = { open: false, toggleOpen: () => {}, setOpen: () => {}, triggerRef: { current: null }, contentRef: { current: null }, openOnHover: false, openOnContext: false, mountNode: { className: "provider-layer" }, withArrow: false, arrowRef: { current: null }, size: "medium", trapFocus: false, inline: false }; void [examples, provider];`;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
const originalReadFile = typeHost.readFile;
const originalGetSourceFile = typeHost.getSourceFile;
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Popover mountNode forms should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,Popover,PopoverSurface,SharePointUIProvider,TeachingPopover,TeachingPopoverBody,TeachingPopoverTitle}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";window.events=[];function App(){return <SharePointUIProvider fluentTokens={{colorNeutralBackground1:"#e8dcd0"}}><main id="app"><Popover data-testid="mounted-popover" label="Edit details" mountNode={document.getElementById("popover-target")} onOpenChange={(_event,data)=>window.events.push(data.open)} trigger={<Button data-testid="popover-trigger">Open details</Button>}><PopoverSurface><TeachingPopoverTitle data-testid="popover-title">Details title</TeachingPopoverTitle><Button data-testid="save-action" data-spui-popover-close>Save changes</Button></PopoverSurface></Popover><Popover mountNode={{className:"class-popover-layer"}} trigger={<Button>Class target</Button>}><PopoverSurface>Class content</PopoverSurface></Popover><Popover mountNode={null} trigger={<Button>Body fallback</Button>}><PopoverSurface>Fallback content</PopoverSurface></Popover><TeachingPopover data-testid="mounted-teaching" label="Welcome" mountNode={document.getElementById("teaching-target")} trigger={<Button data-testid="teaching-trigger">Start guide</Button>}><TeachingPopoverTitle data-testid="teaching-title">Welcome to the guide</TeachingPopoverTitle><TeachingPopoverBody><Button data-testid="teaching-next">Continue</Button></TeachingPopoverBody></TeachingPopover></main></SharePointUIProvider>}createRoot(document.getElementById("root")).render(<App/>);`,
    resolveDir: process.cwd(), sourcefile: "popover-mount-node.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><div id='popover-target' style='--spui-popover-background:rgb(12,34,56)'></div><div id='teaching-target'></div><div id='root'></div><script src='/bundle.js'></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  await page.addInitScript(() => { window.deepActiveTestId = () => { let active = document.activeElement; let id; while (active) { if (active.getAttribute?.("data-testid")) id = active.getAttribute("data-testid"); active = active.shadowRoot?.activeElement ?? null; } return id; }; });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("#popover-target .spui-popover-portal-surface") && document.querySelector("#teaching-target .spui-popover-portal-surface"));
  const host = page.getByTestId("mounted-popover");
  const trigger = page.getByTestId("popover-trigger");
  const surface = page.locator("#popover-target .spui-popover-portal-surface");
  assert.equal(await host.evaluate(node => Boolean(node.closest("#root"))), true, "Popover host and trigger stay in the React tree");
  assert.equal(await page.locator("#popover-target [data-testid=mounted-popover]").count(), 0, "custom target receives the surface, not the Popover host");
  assert.equal(await surface.getAttribute("role"), "group");
  const labelledBy = await surface.getAttribute("aria-labelledby");
  assert.ok(labelledBy, "mounted Popover title provides an accessible name");
  assert.equal(await page.getByTestId("popover-title").getAttribute("id"), labelledBy);
  assert.equal(await surface.evaluate(node => getComputedStyle(node).backgroundColor), "rgb(12, 34, 56)", "target theme variables reach the popup");
  assert.equal(await page.locator("body > .class-popover-layer .spui-popover-portal-surface").count(), 1, "className target creates its body portal container");
  assert.equal(await page.locator("body > [data-portal-node]:not(.class-popover-layer) .spui-popover-portal-surface").count(), 1, "null target selects a body fallback");
  const teaching = page.locator("#teaching-target .spui-popover-portal-surface");
  await page.getByTestId("teaching-trigger").click();
  await page.waitForFunction(() => document.querySelector("#teaching-target .spui-popover-portal-surface")?.matches(":popover-open"));
  assert.equal(await teaching.getAttribute("role"), "dialog", "TeachingPopover keeps its modal dialog semantics when mounted elsewhere");
  assert.equal(await teaching.getAttribute("aria-modal"), "true");
  assert.equal(await teaching.evaluate(node => node.inert), false, "inert focus management leaves the external TeachingPopover surface interactive");
  assert.equal(await page.getByTestId("teaching-title").count(), 1);
  await page.keyboard.press("Escape");
  assert.equal(await page.getByTestId("mounted-teaching").evaluate(node => node.open), false, "TeachingPopover Escape dismissal survives portaling");
  await trigger.click();
  await page.waitForFunction(() => document.querySelector("#popover-target .spui-popover-portal-surface")?.matches(":popover-open"));
  await page.waitForFunction(() => window.deepActiveTestId() === "save-action");
  await page.keyboard.press("Escape");
  assert.equal(await host.evaluate(node => node.open), false, "Escape closes a mounted Popover");
  assert.equal(await page.evaluate(() => window.deepActiveTestId()), "popover-trigger", "Escape restores focus to the trigger");
  await trigger.click();
  await page.getByTestId("save-action").click();
  assert.equal(await host.evaluate(node => node.open), false, "close actions inside the external surface close the Popover");
  await trigger.click();
  await page.mouse.click(950, 680);
  assert.equal(await host.evaluate(node => node.open), false, "outside pointer dismissal includes the external surface boundary");
  assert.deepEqual(await page.evaluate(() => window.events), [true, false, true, false, true, false]);
  await page.emulateMedia({ forcedColors: "active" });
  const forced = await surface.evaluate(node => ({ border: getComputedStyle(node).borderTopColor, shadow: getComputedStyle(node).boxShadow }));
  assert.equal(forced.shadow, "none", "forced colors removes the portal surface shadow");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", triggerRemainsInTree: true, elementClassAndNullMounts: true, themeInherited: true, titleAndModalSemantics: true, escapeAndFocusRestore: true, closeAndOutsideDismissal: true, forcedColors: forced, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
