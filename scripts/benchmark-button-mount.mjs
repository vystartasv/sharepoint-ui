import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const root = resolve(process.cwd());
const profile = process.argv.includes("--profile");
const cpuProfile = process.argv.includes("--cpu-profile");
const bundle = await build({
  stdin: {
    sourcefile: "button-mount-benchmark.tsx",
    loader: "tsx",
    resolveDir: root,
  contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{flushSync}from"react-dom";import{FluentProvider,webLightTheme,webDarkTheme,Button as FluentButton}from"@fluentui/react-components";import{SharePointUIProvider,Button as SpuiButton}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";import{defineButton}from"${resolve(root, "packages/sharepoint-ui/src/elements/button.ts")}";defineButton();const profile=${profile};window.buttonRenderMetrics={count:0,ms:0};if(profile){const proto=customElements.get("spui-button").prototype,render=proto.render;proto.render=function(){const start=performance.now();try{return render.call(this)}finally{window.buttonRenderMetrics.count++;window.buttonRenderMetrics.ms+=performance.now()-start}}}function App({kind,count}){const fluent=kind.startsWith("fluent"),themed=kind.endsWith("Themed"),raw=kind.startsWith("spuiRaw");const children=Array.from({length:count},(_,i)=>fluent?<FluentButton key={i}>Action {i}</FluentButton>:raw?React.createElement("spui-button",{key:i,"data-spui-appearance":themed?"glass":"fluent","data-spui-base-appearance":"fluent"},"Action "+i):<SpuiButton key={i}>Action {i}</SpuiButton>);if(fluent)return <FluentProvider theme={themed?webDarkTheme:webLightTheme}>{children}</FluentProvider>;return <SharePointUIProvider appearance={themed?"glass":undefined} theme={themed?{colors:{accent:"#1565c0"},typography:{fontFamily:"Arial, sans-serif"},customProperties:Object.fromEntries(Array.from({length:80},(_,i)=>["--benchmark-token-"+i,i+"px"]))}:undefined}>{children}</SharePointUIProvider>}window.mountSample=(kind,count)=>{window.buttonRenderMetrics={count:0,ms:0};const host=document.createElement("div");host.dataset.kind=kind;document.body.append(host);if(kind==="native"){const start=performance.now();const fragment=document.createDocumentFragment();for(let i=0;i<count;i++){const button=document.createElement("spui-button");button.textContent="Action "+i;fragment.append(button)}host.append(fragment);host.getBoundingClientRect();const duration=performance.now()-start;const rendered=host.querySelectorAll("spui-button").length;const renderMetrics={...window.buttonRenderMetrics};host.remove();return{duration,rendered,renderMetrics}}const root=createRoot(host);const start=performance.now();flushSync(()=>root.render(React.createElement(App,{kind,count})));host.getBoundingClientRect();const duration=performance.now()-start;const rendered=host.querySelectorAll(kind.startsWith("fluent")?"button":"spui-button").length;const provider=host.querySelector("[data-spui-provider]");const themePropagation=provider?{providerCount:host.querySelectorAll("[data-spui-provider]").length,providerStyleProperties:provider.style.length,childInlineStyleHosts:host.querySelectorAll("spui-button[style]").length,providerDisplay:getComputedStyle(provider).display}:undefined;const renderMetrics={...window.buttonRenderMetrics};flushSync(()=>root.unmount());host.remove();return{duration,rendered,renderMetrics,themePropagation}};`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: {
    react: resolve(root, "examples/spfx124-webpart/node_modules/react"),
    "react-dom/client": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/client.js"),
    "react-dom": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/index.js"),
  },
  nodePaths: [resolve(root, "examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  let cpuProfileSummary;
  if (cpuProfile) {
    const session = await page.context().newCDPSession(page);
    await session.send("Profiler.enable");
    await session.send("Profiler.start");
    await page.evaluate(() => { for (let i = 0; i < 3; i++) window.mountSample("spui", 500); });
    const { profile: cpu } = await session.send("Profiler.stop");
    const samples = new Map();
    for (const node of cpu.nodes) {
      const frame = node.callFrame;
      const key = `${frame.functionName || "(anonymous)"} (${frame.url.split("/").pop()}:${frame.lineNumber + 1})`;
      samples.set(key, (samples.get(key) ?? 0) + (node.hitCount ?? 0));
    }
    cpuProfileSummary = Object.fromEntries([...samples].sort((a, b) => b[1] - a[1]).slice(0, 15));
    await session.detach();
  }
  const results = await page.evaluate(profile => {
    const summary = values => {
      const sorted = [...values].sort((a, b) => a - b);
      return { medianMs: Number(sorted[Math.floor(sorted.length * 0.5)].toFixed(2)), p95Ms: Number(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)].toFixed(2)), samples: sorted.length };
    };
    const measurements = [];
    for (const count of [100, 500]) {
      const samples = { fluentReact: [], sharePointReact: [], sharePointRawReact: [], sharePointNative: [], fluentThemedReact: [], sharePointThemedReact: [], sharePointRawThemedReact: [] };
      const renderMetrics = { fluentReact: undefined, sharePointReact: undefined, sharePointRawReact: undefined, sharePointNative: undefined, fluentThemedReact: undefined, sharePointThemedReact: undefined, sharePointRawThemedReact: undefined };
      const themePropagation = {};
      const kinds = [["fluentReact", "fluent"], ["sharePointReact", "spui"], ["sharePointRawReact", "spuiRaw"], ["sharePointNative", "native"], ["fluentThemedReact", "fluentThemed"], ["sharePointThemedReact", "spuiThemed"], ["sharePointRawThemedReact", "spuiRawThemed"]];
      for (let round = 0; round < 25; round++) {
        for (const [key, kind] of kinds) {
          const result = window.mountSample(kind, count);
          if (result.rendered !== count) throw new Error(`${kind} rendered ${result.rendered}/${count}`);
          if (profile && round === 5) renderMetrics[key] = result.renderMetrics;
          if (round === 5 && result.themePropagation) themePropagation[key] = result.themePropagation;
          if (round >= 5) samples[key].push(result.duration);
        }
      }
      if (count === 500 && (themePropagation.sharePointThemedReact?.providerCount !== 1 || themePropagation.sharePointThemedReact?.childInlineStyleHosts !== 0 || themePropagation.sharePointThemedReact?.providerDisplay !== "contents")) throw new Error("SharePoint React theme tokens must be applied once on the provider root and inherited by component hosts");
      measurements.push({ count, defaultTheme: Object.fromEntries(["fluentReact", "sharePointReact", "sharePointRawReact", "sharePointNative"].map(key => [key, summary(samples[key])])), customTheme: Object.fromEntries(["fluentThemedReact", "sharePointThemedReact", "sharePointRawThemedReact"].map(key => [key, summary(samples[key])])), themePropagation, ...(profile ? { customElementRenderMetrics: renderMetrics } : {}) });
    }
    return measurements;
  }, profile);
  assert.deepEqual(errors, [], "benchmark completed without page errors");
  const report = { status: "passed", browser: `Chromium ${await browser.version()}`, workload: "Mount identical text Buttons, commit/upgrade to DOM, force first layout", themeCases: { defaultTheme: "Fluent webLightTheme vs default SharePoint UI provider; includes direct custom elements", customTheme: "Fluent webDarkTheme vs glass appearance with brand, typography, and 80 custom tokens" }, warmupRounds: 5, measuredRounds: 20, profilingInstrumentation: profile, measurements: results, ...(cpuProfileSummary ? { cpuProfile: cpuProfileSummary } : {}), pageErrors: errors.length, caveat: "Single local headless Chromium process; one synthetic custom-token pack; not a cross-browser, SharePoint-host, or user-perceived latency benchmark." };
  const reportPath = resolve(root, "test-results/benchmarks/button-mount-latest.json");
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ...report, reportPath }, null, 2));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
