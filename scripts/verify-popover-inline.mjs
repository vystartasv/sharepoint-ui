import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "popover-inline.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";function Motion({visible,children}){const ref=React.useRef(null);React.useLayoutEffect(()=>{const animation=ref.current?.animate([{opacity:visible?0:1},{opacity:visible?1:0}],{duration:1000,easing:"linear",fill:"both"});return()=>animation?.cancel()},[visible]);return <div ref={ref} data-testid="motion" data-visible={String(visible)}>{children}</div>}definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="react" label="Inline" defaultOpen inline unstable_disableAutoFocus><PopoverTrigger><button>Open</button></PopoverTrigger><PopoverSurface><span data-testid="react-content">React surface</span></PopoverSurface></Popover><Popover data-testid="animated" label="Animated" defaultOpen surfaceMotion={Motion} unstable_disableAutoFocus><PopoverTrigger><button>Animated trigger</button></PopoverTrigger><PopoverSurface><button>Inside</button></PopoverSurface></Popover></>);window.mountNative=()=>{const host=document.createElement("spui-popover");host.id="native";host.setAttribute("default-open","");host.setAttribute("unstable-disable-auto-focus","");host.setAttribute("label","Native default");const trigger=document.createElement("button");trigger.slot="trigger";trigger.textContent="Open";const content=document.createElement("div");content.slot="content";content.dataset.testid="native-content";content.textContent="Native surface";host.append(trigger,content);document.querySelector("#native-root").append(host);host.inline=true};window.mountNative();`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=root></div><div id=native-root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await (await import("playwright")).chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("#native") !== null);
  const reactState = await page.getByTestId("react").evaluate(host => ({ reflected: host.inline, attribute: host.hasAttribute("inline"), contentStayedInSource: host.querySelector('[slot="content"]') !== null, surfaceInTopLayer: host.shadowRoot.querySelector(".surface").matches(":popover-open") }));
  assert.deepEqual(reactState, { reflected: true, attribute: true, contentStayedInSource: true, surfaceInTopLayer: true });
  const nativeState = await page.locator("#native").evaluate(host => ({ reflected: host.inline, attribute: host.hasAttribute("inline"), contentStayedInSource: host.querySelector('[slot="content"]') !== null, surfaceInTopLayer: host.shadowRoot.querySelector(".surface").matches(":popover-open") }));
  assert.deepEqual(nativeState, { reflected: true, attribute: true, contentStayedInSource: true, surfaceInTopLayer: true });
  const animated = page.getByTestId("animated");
  assert.equal(await animated.locator(".surface").evaluate(panel => panel.matches(":popover-open")), true, "motion popover starts in the top layer");
  await animated.getByRole("button", { name: "Animated trigger" }).focus();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector('[data-testid="motion"]')?.getAttribute("data-visible") === "false");
  assert.equal(await animated.locator(".surface").evaluate(panel => panel.matches(":popover-open")), true, "top-layer surface stays open while its motion exits");
  assert.equal(await animated.locator(".surface").evaluate(panel => panel.inert), true, "exiting surface is inert");
  await page.waitForFunction(() => !document.querySelector('[data-testid="animated"]')?.shadowRoot?.querySelector(".surface")?.matches(":popover-open"));
  await page.locator("#native").evaluate(host => { host.inline = false; });
  assert.equal(await page.locator("#native").getAttribute("inline"), null, "native property reflects false by removing the attribute");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactPropReflection: true, nativePropertyReflection: true, sourceOrderPreserved: true, nativeTopLayerPlacement: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
