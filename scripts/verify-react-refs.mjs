import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { chromium } from "playwright";

const catalog = JSON.parse(await readFile(resolve("packages/sharepoint-ui/components.json"), "utf8"));
const refComponents = catalog.components.filter(component => typeof component.api.reactRefType === "string");
const importNames = refComponents.map(component => component.react).join(",");
const probeProps = { Input: { value: "SharePoint" }, TextArea: { value: "SharePoint UI" }, Tab: { value: "ref-probe" }, TabPanel: { value: "ref-probe" }, InfoLabel: { info: "Additional information", children: "Field label" } };
const probes = refComponents.map(component => `React.createElement(ProbeBoundary,{key:${JSON.stringify(component.react)},name:${JSON.stringify(component.react)},children:React.createElement(${component.react},{...${JSON.stringify(probeProps[component.react] ?? {})},ref:(window.refs[${JSON.stringify(component.react)}]=React.createRef())})})`).join(",");

const bundle = await build({
  stdin: {
    sourcefile: "react-button-ref.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{${importNames}}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";window.refs={};window.refNames=${JSON.stringify(refComponents.map(component => component.react))};class ProbeBoundary extends React.Component{state={failed:false};static getDerivedStateFromError(){return{failed:true}}componentDidCatch(error){window.probeFailures.push({name:this.props.name,message:error.message})}render(){return this.state.failed?null:this.props.children}}window.probeFailures=[];createRoot(document.querySelector("#root")).render(React.createElement(React.Fragment,null,${probes}));`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => {
  if (new URL(request.url, "http://localhost").pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><div id=root></div><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.refNames?.every(name => window.refs[name]?.current), { timeout: 5000 }).catch(() => undefined);
  const result = await page.evaluate(() => ({
    refs: Object.fromEntries(window.refNames.map(name => [name, { tagName: window.refs[name].current?.tagName, isElement: window.refs[name].current instanceof HTMLElement, connected: window.refs[name].current?.isConnected }])),
    inputMethods: [window.refs.Input?.current?.focus, window.refs.Input?.current?.select, window.refs.TextArea?.current?.focus, window.refs.TextArea?.current?.select].every(method => typeof method === "function"),
    failures: window.probeFailures,
  }));
  const missingRefs = Object.entries(result.refs).filter(([, value]) => !value.tagName || !value.connected).map(([name]) => name);
  if (missingRefs.length) throw new Error(`React host refs did not mount for ${missingRefs.join(", ")}; probe errors: ${JSON.stringify(result.failures)}; page errors: ${errors.join(" | ")}`);
  for (const component of refComponents) {
    const ref = result.refs[component.react];
    const expectedTag = ({ InfoLabel: "SPAN", Option: "DIV", OptionGroup: "DIV" })[component.react] ?? component.tag.toUpperCase();
    assert.deepEqual(ref, { tagName: expectedTag, isElement: true, connected: true }, `${component.react} ref points to its ${expectedTag.toLowerCase()} host`);
  }
  assert.equal(result.inputMethods, true, "Input and TextArea refs retain focus and selection APIs");
  await page.evaluate(() => { window.refs.Input.current.select(); window.refs.TextArea.current.select(); });
  assert.equal(await page.locator("spui-input").evaluate(element => element.shadowRoot.querySelector("input").selectionEnd), 10, "Input ref selection reaches the native input");
  assert.equal(await page.locator("spui-textarea").evaluate(element => element.shadowRoot.querySelector("textarea").selectionEnd), 13, "TextArea ref selection reaches the native textarea");
  assert.deepEqual(errors, [], "React ref forwarding produces no browser errors");
  console.log(JSON.stringify({ status: "passed", forwardedHostCount: refComponents.length, forwardedHosts: refComponents.map(component => component.tag), selectionApi: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
