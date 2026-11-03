import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.menu-mount-node-contract.tsx");
const typeFixture = `import { Menu, type MenuProps } from "./react.js"; const targets: MenuProps["mountNode"][] = [document.body, { className: "menu-layer" }, null]; const examples = [<Menu mountNode={targets[0]} />, <Menu mountNode={targets[1]} />, <Menu mountNode={targets[2]} />]; void examples;`;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const typeHost = ts.createCompilerHost(typeOptions);
const originalReadFile = typeHost.readFile;
const originalGetSourceFile = typeHost.getSourceFile;
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Menu mountNode forms should type-check: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,Menu,MenuItem,MenuItemCheckbox,SharePointUIProvider}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";window.events=[];function App(){return <SharePointUIProvider fluentTokens={{colorNeutralBackground1:"#e8dcd0"}}><div id="app"><Menu data-testid="mounted-menu" label="Mounted actions" mountNode={document.getElementById("menu-target")} onSelect={(value)=>window.events.push(value)} onOpenChange={(_event,data)=>window.events.push(data.open)} trigger={<Button data-testid="menu-trigger">Actions</Button>}><MenuItem data-testid="first-item">First action</MenuItem><Menu data-testid="submenu" label="More actions" trigger={<MenuItem data-testid="submenu-trigger">More</MenuItem>}><MenuItem data-testid="child-item">Child action</MenuItem></Menu><MenuItemCheckbox data-testid="check-item" name="settings" value="compact">Compact</MenuItemCheckbox></Menu><Menu mountNode={{className:"class-menu-layer"}} trigger={<Button>Class target</Button>}><MenuItem>Class action</MenuItem></Menu><Menu mountNode={null} trigger={<Button>Body fallback</Button>}><MenuItem>Fallback action</MenuItem></Menu></div></SharePointUIProvider>}createRoot(document.getElementById("root")).render(<App/>);`,
    resolveDir: process.cwd(), sourcefile: "menu-mount-node.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><div id='menu-target' style='--spui-menu-background:rgb(12,34,56)'></div><div id='root'></div><script src='/bundle.js'></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
  const errors = [];
  await page.addInitScript(() => { window.deepActiveTestId = () => { let active = document.activeElement; let id; while (active) { if (active.getAttribute?.("data-testid")) id = active.getAttribute("data-testid"); active = active.shadowRoot?.activeElement ?? null; } return id; }; });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("body > .class-menu-layer .spui-menu-portal-surface") && [...document.querySelectorAll("body > [data-portal-node] .spui-menu-portal-surface")].length >= 2);
  const host = page.getByTestId("mounted-menu");
  const trigger = page.getByTestId("menu-trigger");
  const surface = page.locator("#menu-target .spui-menu-portal-surface");
  await page.waitForFunction(() => document.querySelector("#menu-target .spui-menu-portal-surface"));
  assert.equal(await host.evaluate(node => Boolean(node.closest("#root"))), true, "Menu host stays at its original React location");
  assert.equal(await page.locator("#menu-target").evaluate(node => node.querySelector('[data-testid="mounted-menu"]')), null, "the mount target does not contain the Menu host");
  assert.equal(await surface.count(), 1);
  assert.equal(await page.locator("body > .class-menu-layer .spui-menu-portal-surface").count(), 1, "className mount target creates its body container");
  assert.equal(await page.locator("body > [data-portal-node]:not(.class-menu-layer) .spui-menu-portal-surface").count(), 1, "null mount target falls back to a body container");
  await trigger.click();
  await page.waitForFunction(() => document.querySelector("#menu-target .spui-menu-portal-surface")?.matches(":popover-open"));
  assert.equal(await surface.getAttribute("role"), "menu");
  assert.equal(await surface.evaluate(node => getComputedStyle(node).backgroundColor), "rgb(12, 34, 56)", "custom mount target theme variables reach the popup");
  await page.waitForFunction(() => window.deepActiveTestId() === "first-item");
  await page.keyboard.press("ArrowDown");
  const activeAfterMove = await page.evaluate(() => window.deepActiveTestId());
  assert.equal(activeAfterMove, "submenu-trigger", "keyboard movement includes the submenu trigger in the portaled surface");
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => document.querySelector('[data-testid="submenu"]')?.open, null, { timeout: 5000 });
  await page.waitForFunction(() => window.deepActiveTestId() === "child-item", null, { timeout: 1000 }).catch(async () => { const state = await page.getByTestId("submenu").evaluate(node => ({ open: node.open, items: node.menuItems?.().map(item => item.getAttribute("data-testid")), activeIndex: node.activeIndex?.(), panel: node.shadowRoot?.querySelector(".surface")?.outerHTML.slice(0, 800) })); throw new Error(`submenu failed to focus first item: ${JSON.stringify({ state, active: await page.evaluate(() => window.deepActiveTestId()) })}`); });
  await page.keyboard.press("Escape");
  assert.equal(await page.getByTestId("submenu").evaluate(node => node.open), false, "Escape closes the nested popup");
  assert.equal(await host.evaluate(node => node.open), true, "closing a submenu leaves its parent open");
  await page.getByTestId("first-item").click();
  assert.equal(await host.evaluate(node => node.open), false, "selecting an item closes the portaled menu");
  assert.deepEqual(await page.evaluate(() => window.events), [true, false, ""], "open, close, and select callbacks survive portaling");
  await page.emulateMedia({ forcedColors: "active" });
  const forced = await surface.evaluate(node => ({ color: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor, shadow: getComputedStyle(node).boxShadow }));
  assert.equal(forced.shadow, "none", "forced-colors mode removes the popup shadow");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", menuRemainsInTree: true, targetOwnsSurfaceOnly: true, targetThemeInherited: true, keyboardAndSubmenu: true, callbacks: true, forcedColors: forced, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
