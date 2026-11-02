import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "persona-parity.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Persona}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePersona}from"${resolve("packages/sharepoint-ui/src/elements/persona.ts")}";createRoot(document.querySelector("#react")).render(<><Persona data-testid="normal" name="Avery" presence="available"/><Persona data-testid="presence-only" name="Avery" presence="busy" presenceOnly textAlignment="center"/><Persona data-testid="slots" name="Fallback name" primaryText={<strong data-testid="primary-slot">Preferred name</strong>} secondaryText={<span data-testid="secondary-slot">Role</span>} tertiaryText="City" quaternaryText={<span data-testid="quaternary-slot">Team</span>}/>{["extra-small","small","medium","large","extra-large","huge"].map(size=><Persona key={size} data-testid={"size-"+size} name="Size" size={size}/>)}</>);definePersona();const native=document.createElement("spui-persona");native.id="native";native.setAttribute("name","Jordan");native.setAttribute("presence","away");native.setAttribute("presence-only","");native.setAttribute("text-alignment","center");const primary=document.createElement("span");primary.slot="primary-text";primary.textContent="Native primary";const extra=document.createElement("span");extra.slot="quaternary-text";extra.textContent="Native fourth line";native.append(primary,extra);document.querySelector("#native-root").append(native);`,
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
  const normal = page.getByTestId("normal");
  const only = page.getByTestId("presence-only");
  await page.waitForFunction(() => document.querySelector("[data-testid=presence-only]")?.shadowRoot?.querySelector(".presence")?.dataset.presence === "busy");
  assert.equal(await normal.evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".avatar-fallback")).display), "grid", "normal Persona retains its avatar");
  assert.equal(await only.evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".avatar-fallback")).display), "none", "presenceOnly removes the avatar");
  assert.equal(await only.evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".presence")).position), "static", "presenceOnly displays the status marker by itself");
  assert.equal(await only.evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".details")).justifyContent), "center", "textAlignment=center centers Persona text");
  const slotted = page.getByTestId("slots");
  assert.equal(await slotted.evaluate(host => host.shadowRoot.querySelector('slot[name="primary-text"]').assignedElements()[0]?.textContent), "Preferred name", "primaryText replaces the name fallback");
  assert.equal(await slotted.evaluate(host => host.shadowRoot.querySelector('slot[name="secondary-text"]').assignedElements()[0]?.textContent), "Role");
  assert.equal(await slotted.evaluate(host => host.shadowRoot.querySelector('slot[name="tertiary-text"]').assignedElements()[0]?.textContent), "City");
  assert.equal(await slotted.evaluate(host => host.shadowRoot.querySelector('slot[name="quaternary-text"]').assignedElements()[0]?.textContent), "Team");
  for (const [size, expected] of [["extra-small",20],["small",28],["medium",32],["large",36],["extra-large",40],["huge",56]]) {
    assert.equal(await page.getByTestId(`size-${size}`).evaluate(host => host.shadowRoot.querySelector(".avatar-wrap").getBoundingClientRect().width), expected, `Persona ${size} matches Fluent avatar dimensions`);
  }
  const native = page.locator("#native");
  assert.equal(await native.evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".avatar-fallback")).display), "none", "direct custom-element attributes support presenceOnly");
  assert.equal(await native.evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".details")).justifyContent), "center", "direct custom-element attributes support text alignment");
  assert.equal(await native.evaluate(host => host.shadowRoot.querySelector('slot[name="primary-text"]').assignedElements()[0]?.textContent), "Native primary", "native primaryText slot replaces its fallback");
  assert.equal(await native.evaluate(host => host.shadowRoot.querySelector('slot[name="quaternary-text"]').assignedElements()[0]?.textContent), "Native fourth line", "native quaternaryText slot renders");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", presenceOnly: true, textAlignment: true, fourTextSlots: true, reactAndCustomElement: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
