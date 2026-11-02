import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "avatar-group-pie.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{AvatarGroup,AvatarGroupItem,AvatarGroupPopover,Tooltip}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineAvatarGroup}from"${resolve("packages/sharepoint-ui/src/elements/avatar-group.ts")}";createRoot(document.querySelector("#react")).render(<><AvatarGroup data-testid="pie-two" layout="pie" size={48}><AvatarGroupItem name="Ada"/><AvatarGroupItem name="Lin"/></AvatarGroup><AvatarGroup data-testid="pie-three" layout="pie" size={48}><AvatarGroupItem name="Ada"/><AvatarGroupItem name="Lin"/><AvatarGroupItem name="Sam"/><AvatarGroupItem name="Noa"/></AvatarGroup><AvatarGroup data-testid="stack" layout="stack"><AvatarGroupItem name="Ada"/><AvatarGroupItem name="Lin"/></AvatarGroup><AvatarGroupPopover data-testid="people-overflow" open count={3} triggerButton={<button data-testid="people-trigger"/>} tooltip={<Tooltip data-testid="people-tooltip" content="Team members" relationship="label"/>} popoverSurface={<div data-testid="people-surface"/>} content={<ul data-testid="people-content"/>}><AvatarGroupItem name="Ada" avatar={{initials:"AD",color:"purple","data-testid":"custom-person-avatar"}} overflowLabel={{className:"custom-person-label","data-testid":"custom-person-label",children:"Ada Example"}}/><AvatarGroupItem name="Lin"/><AvatarGroupItem name="Sam"/></AvatarGroupPopover></>);defineAvatarGroup();const native=document.createElement("spui-avatar-group");native.id="native";native.setAttribute("layout","pie");native.setAttribute("size","40");native.innerHTML='<spui-avatar-group-item name="Ada"></spui-avatar-group-item><spui-avatar-group-item name="Lin"></spui-avatar-group-item>';document.querySelector("#native-root").append(native);`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=react></div><div id=native-root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="pie-three"]')?.shadowRoot?.querySelector(".avatars"));

  const twoSlices = await page.getByTestId("pie-two").evaluate(host => [...host.querySelectorAll("spui-avatar-group-item")].map(item => ({
    index: item.dataset.pieIndex,
    total: item.dataset.pieTotal,
    clipPath: getComputedStyle(item).clipPath,
  })));
  assert.deepEqual(twoSlices.map(item => [item.index, item.total]), [["0", "2"], ["1", "2"]]);
  assert.ok(twoSlices.every(item => item.clipPath.startsWith("inset(")), "two-person pie layout clips each avatar to its half");

  const three = page.getByTestId("pie-three");
  const initial = await three.evaluate(host => ({
    layout: host.shadowRoot.querySelector(".group").dataset.layout,
    size: getComputedStyle(host.shadowRoot.querySelector(".avatars")).width,
    visible: [...host.querySelectorAll("spui-avatar-group-item")].filter(item => !item.hasAttribute("data-spui-avatar-group-hidden")).length,
    overflow: host.shadowRoot.querySelector("button").textContent,
    overflowLabel: host.shadowRoot.querySelector("button").getAttribute("aria-label"),
    clips: [...host.querySelectorAll("spui-avatar-group-item")].slice(0, 3).map(item => getComputedStyle(item).clipPath),
  }));
  assert.deepEqual(initial, { layout: "pie", size: "48px", visible: 3, overflow: "+1", overflowLabel: "+1 Show more people (1)", clips: initial.clips });
  assert.ok(initial.clips.every(value => value.startsWith("inset(")), "three-person pie layout clips each avatar into a quadrant");
  await three.evaluate(host => host.shadowRoot.querySelector("button").click());
  const expanded = await three.evaluate(host => ({
    expanded: host.shadowRoot.querySelector("button").getAttribute("aria-expanded"),
    visible: [...host.querySelectorAll("spui-avatar-group-item")].filter(item => !item.hasAttribute("data-spui-avatar-group-hidden")).length,
    layout: host.shadowRoot.querySelector(".group").dataset.layout,
  }));
  assert.deepEqual(expanded, { expanded: "true", visible: 4, layout: "pie" }, "overflow remains reachable by expanding to the regular row layout");

  const nativeLtr = await page.locator("#native").evaluate(host => [...host.querySelectorAll("spui-avatar-group-item")].map(item => {
    const style = getComputedStyle(item);
    return { left: style.left, right: style.right, clipPath: style.clipPath };
  }));
  assert.deepEqual(nativeLtr.map(item => item.left), ["-10px", "10px"], "LTR pie slices use logical start offsets");
  await page.locator("#native").evaluate(host => host.setAttribute("dir", "rtl"));
  const native = await page.locator("#native").evaluate(host => ({
    layout: host.shadowRoot.querySelector(".group").dataset.layout,
    size: getComputedStyle(host.shadowRoot.querySelector(".avatars")).width,
    inheritedSize: host.querySelector("spui-avatar-group-item").getAttribute("size"),
    slices: [...host.querySelectorAll("spui-avatar-group-item")].map(item => {
      const style = getComputedStyle(item);
      return { left: style.left, right: style.right, clipPath: style.clipPath };
    }),
  }));
  assert.deepEqual({ ...native, slices: native.slices.map(({ left, right }) => [left, right]) }, { layout: "pie", size: "40px", inheritedSize: "40", slices: [["0px", "-10px"], ["0px", "10px"]] }, "RTL mirrors the slice position onto the inline-start edge");
  assert.ok(native.slices.every(item => item.clipPath.startsWith("inset(")), "direct custom elements support RTL pie layout");
  assert.equal(native.slices[0].clipPath, "inset(0px 25% 0px calc(25% + 1px))", "RTL mirrors the first slice clipping geometry");
  const stackLayout = await page.getByTestId("stack").evaluate(host => host.shadowRoot.querySelector(".group").dataset.layout);
  assert.equal(stackLayout, "stack", "existing stack layout remains unchanged");
  const peoplePopover = page.getByTestId("people-overflow");
  await page.waitForFunction(() => document.querySelector('[data-testid="people-overflow"]')?.open === true);
  assert.equal(await page.getByTestId("people-trigger").getAttribute("type"), "button", "custom triggerButton retains button semantics");
  assert.equal(await page.getByTestId("people-trigger").getAttribute("aria-label"), "Show more people (3)", "default localized count label applies to a custom trigger");
  assert.equal(await page.getByTestId("people-tooltip").getAttribute("relationship"), "label", "custom tooltip slot wraps the trigger");
  assert.equal(await page.getByTestId("people-content").getAttribute("role"), "list", "custom content slot retains list semantics");
  assert.equal(await page.getByTestId("people-content").getByRole("listitem").count(), 3, "default avatar rows project into custom list content");
  assert.equal(await page.getByTestId("custom-person-avatar").getAttribute("initials"), "AD", "AvatarGroupItem accepts Avatar slot props");
  assert.equal(await page.getByTestId("custom-person-avatar").getAttribute("color"), "purple", "Avatar slot props override the default avatar appearance");
  assert.equal(await page.getByTestId("custom-person-label").textContent(), "Ada Example", "overflowLabel accepts span slot props and custom content");
  assert.equal(await page.getByTestId("people-surface").getAttribute("aria-label"), "Overflow", "custom popoverSurface gets the accessible default label");
  assert.equal(await peoplePopover.getByRole("dialog", { name: "People" }).count(), 1, "popover surface remains an accessible dialog");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", twoSlices, threePersonOverflow: initial, expanded, nativeLTR: nativeLtr, nativeRTL: native, stackLayout, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
