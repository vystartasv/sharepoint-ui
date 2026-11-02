import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.popover-open-change-event-type-contract.tsx");
const typeFixture = `import * as React from "react"; import { Popover, type PopoverOpenChangeEvent } from "./react.js"; const example = <Popover onOpenChange={(event, data) => { const typedEvent: PopoverOpenChangeEvent = event; const target: EventTarget | null = event.currentTarget; const open: boolean = data.open; void [typedEvent, target, open]; }} />;`;
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost({}).getSourceFile;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Popover Fluent callback contract should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    sourcefile: "popover-context.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverProvider,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="context" label="Context popover" openOnContext onOpenChange={(event,data)=>window.changes.push({open:data.open,eventType:event.type,currentTarget:event.currentTarget.localName,nativeEventType:event.nativeEvent.type})}><PopoverTrigger><button style={{position:"fixed",left:100,top:80,width:60,height:30}}>Context</button></PopoverTrigger><PopoverSurface>Context surface</PopoverSurface></Popover><Popover data-testid="normal" label="Normal popover"><PopoverTrigger><button>Normal</button></PopoverTrigger><PopoverSurface>Normal surface</PopoverSurface></Popover></>);function ProviderPopover(){const[open,setOpen]=React.useState(false);const triggerRef=React.useRef(null),contentRef=React.useRef(null),arrowRef=React.useRef(null);React.useEffect(()=>{window.providerReady=true},[]);const value={open,toggleOpen:()=>setOpen(current=>!current),setOpen:(event,next)=>{window.providerSourceEvent=event.type;setOpen(next)},triggerRef,contentRef,openOnHover:false,openOnContext:true,mountNode:null,withArrow:true,arrowRef,size:"large",appearance:"brand",trapFocus:true,inertTrapFocus:false,inline:true};return <PopoverProvider value={value}><Popover data-testid="provider" label="Provider popover"><PopoverTrigger><button>Provider trigger</button></PopoverTrigger><PopoverSurface>Provider surface</PopoverSurface></Popover></PopoverProvider>}createRoot(document.querySelector("#provider")).render(<ProviderPopover/>);window.dispatchContext=(selector,x,y)=>document.querySelector(selector).dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2,clientX:x,clientY:y}));window.mountNative=()=>{const host=document.createElement("spui-popover");host.id="native";host.setAttribute("open-on-context","");const trigger=document.createElement("button");trigger.slot="trigger";trigger.style.cssText="position:fixed;left:300px;top:80px;width:60px;height:30px";trigger.textContent="Native context";const content=document.createElement("div");content.slot="content";content.textContent="Native surface";host.append(trigger,content);document.querySelector("#native-root").append(host)};window.changes=[];window.mountNative();`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=root></div><div id=provider></div><div id=native-root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await (await import("playwright")).chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.providerReady === true);
  const provider = page.getByTestId("provider");
  assert.equal(await provider.getAttribute("open"), null, "provider starts controlled and closed");
  assert.equal(await provider.getAttribute("data-spui-controlled-open"), "true");
  assert.equal(await provider.getAttribute("open-on-context"), "true");
  assert.equal(await provider.getAttribute("size"), "large");
  assert.equal(await provider.getAttribute("appearance"), "brand");
  assert.equal(await provider.getAttribute("trap-focus"), "true");
  assert.equal(await provider.getAttribute("inert-trap-focus"), "false");
  assert.equal(await provider.getAttribute("inline"), "true");
  assert.equal(await provider.getAttribute("arrow"), "true");
  assert.equal(await page.evaluate(() => window.dispatchContext('[data-testid="provider"] button', 220, 140)), false);
  await page.waitForFunction(() => document.querySelector('[data-testid="provider"]')?.open === true);
  assert.equal(await page.evaluate(() => window.providerSourceEvent), "contextmenu", "provider receives the source context-menu event");
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  await page.waitForFunction(() => document.querySelector('[data-testid="provider"]')?.open === false);
  assert.equal(await page.evaluate(() => window.dispatchContext('[data-testid="normal"] button', 180, 120)), true, "default context menu behavior is not prevented");
  assert.equal(await page.getByTestId("normal").evaluate(node => node.open), false, "default Popover does not open on context click");
  assert.equal(await page.evaluate(() => window.dispatchContext('[data-testid="context"] button', 180, 120)), false, "opted-in context menu suppresses the browser menu");
  await page.waitForFunction(() => document.querySelector('[data-testid="context"]')?.open);
  await page.waitForTimeout(180);
  const position = await page.getByTestId("context").locator(".surface").evaluate(node => { const r = node.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height, placement: node.dataset.placement }; });
  assert.equal(position.placement, "top");
  assert.ok(Math.abs(position.left - (180 - position.width / 2)) < 1, "context Popover centers around pointer x");
  assert.ok(Math.abs(position.top - (120 - position.height - 8)) < 1, `context Popover opens above pointer with default gap: ${JSON.stringify(position)}`);
  await page.getByTestId("context").locator("button").evaluate(button => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  assert.equal(await page.getByTestId("context").evaluate(node => node.open), true, "ordinary click does not replace context-only opening");
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  assert.equal(await page.getByTestId("context").evaluate(node => node.open), false, "context Popover closes when the page scrolls");
  assert.equal(await page.evaluate(() => window.dispatchContext("#native [slot=trigger]", 380, 220)), false);
  assert.equal(await page.locator("#native").evaluate(node => node.open), true, "custom element context-menu attribute opens");
  assert.deepEqual(await page.evaluate(() => window.changes), [{ open: true, eventType: "contextmenu", currentTarget: "spui-popover", nativeEventType: "contextmenu" }, { open: false, eventType: "scroll", currentTarget: "spui-popover", nativeEventType: "scroll" }]);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactAndNative: true, contextMenuPreventedOnlyWhenEnabled: true, pointerAnchoring: position, contextOnlyActivation: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
