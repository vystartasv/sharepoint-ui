import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { resolve } from "node:path";

const dataUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='16'%3E%3Crect width='24' height='16' fill='teal'/%3E%3C/svg%3E";
const bundle = await build({
  stdin: {
    sourcefile: "image-parity.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Image}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{createImage}from"${resolve("packages/sharepoint-ui/src/elements/image.ts")}";const src="${dataUrl}";createRoot(document.querySelector("#root")).render(<><div className="box" data-testid="box"><Image data-testid="default" src={src} alt="Default image" fit="default"/><Image data-testid="none" src={src} alt="No fit" fit="none"/><Image data-testid="center" src={src} alt="Centered" fit="center"/><Image data-testid="contain" src={src} alt="Contained" fit="contain"/><Image data-testid="cover" src={src} alt="Covered" fit="cover"/><Image data-testid="block" src={src} alt="Block image" block/><Image data-testid="explicit" src={src} alt="Sized image" fit="cover" width={80} height={40}/><Image data-testid="rounded" src={src} alt="Rounded image" shape="rounded" bordered shadow/></div></>);window.sourceAssignments=[];window.mountNative=(fit,width,height,block)=>{const keys=["srcset","sizes","width","height","src"],saved=keys.map(key=>[key,Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,key)]);for(const[key,descriptor]of saved)Object.defineProperty(HTMLImageElement.prototype,key,{...descriptor,set(value){window.sourceAssignments.push(key);descriptor.set.call(this,value)}});let img;try{img=createImage({src,srcSet:src+" 1x",sizes:"80px",alt:"Native image",fit,shape:"square",width:width??80,height:height??40,block,bordered:true,shadow:true})}finally{for(const[key,descriptor]of saved)Object.defineProperty(HTMLImageElement.prototype,key,descriptor)}img.dataset.testid="native";document.querySelector("#native").append(img)};window.mountNative("cover");`},
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setContent(`<style>.box{width:160px;height:100px;--spui-image-border:rgb(1,2,3);--spui-image-shadow:0 2px 4px rgb(0 0 0 / .2)}</style><div id="root"></div><div id="native"></div>`);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.waitForSelector('[data-testid="default"]');
  const read = id => page.getByTestId(id).evaluate(img => ({
    objectFit: getComputedStyle(img).objectFit,
    objectPosition: getComputedStyle(img).objectPosition,
    widthStyle: img.style.width,
    heightStyle: img.style.height,
    widthAttribute: img.getAttribute("width"),
    heightAttribute: img.getAttribute("height"),
    display: getComputedStyle(img).display,
    borderRadius: getComputedStyle(img).borderRadius,
    borderStyle: getComputedStyle(img).borderStyle,
    boxShadow: getComputedStyle(img).boxShadow,
    alt: img.alt,
    loading: img.loading,
    decoding: img.decoding,
  }));

  assert.equal((await read("default")).objectFit, "fill", "default fit leaves native image sizing intact");
  assert.equal((await read("default")).widthStyle, "", "default fit does not force full-size fill");
  for (const fit of ["none", "center", "contain", "cover"]) {
    const state = await read(fit);
    assert.equal(state.widthStyle, "100%", `${fit} fills width when dimensions are omitted`);
    assert.equal(state.heightStyle, "100%", `${fit} fills height when dimensions are omitted`);
  }
  assert.equal((await read("none")).objectPosition, "0% 0%", "none fit anchors at top-left");
  assert.equal((await read("center")).objectPosition, "50% 50%", "center fit centers the source image");
  assert.equal((await read("contain")).objectPosition, "50% 50%", "contain fit centers the source image");
  assert.equal((await read("cover")).objectPosition, "50% 50%", "cover fit centers the source image");
  const block = await read("block");
  assert.equal(block.display, "block");
  assert.equal(block.widthStyle, "100%");
  const explicit = await read("explicit");
  assert.equal(explicit.widthAttribute, "80");
  assert.equal(explicit.heightAttribute, "40");
  assert.equal(explicit.widthStyle, "");
  assert.equal(explicit.heightStyle, "");
  const rounded = await read("rounded");
  assert.equal(rounded.borderStyle, "solid");
  assert.ok(rounded.boxShadow !== "none");
  assert.equal(rounded.alt, "Rounded image");
  const native = await read("native");
  assert.equal(native.widthStyle, "", "explicit intrinsic dimensions avoid overriding native image sizing");
  assert.equal(native.heightStyle, "");
  assert.equal(native.alt, "Native image");
  assert.equal(native.loading, "lazy");
  assert.equal(native.decoding, "async");
  assert.equal(native.widthAttribute, "80");
  assert.equal(native.heightAttribute, "40");
  assert.deepEqual(await page.evaluate(() => window.sourceAssignments), ["srcset", "sizes", "width", "height", "src"], "the responsive candidate and intrinsic dimensions are configured before src starts loading");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactAndNative: true, fitModes: ["default", "none", "center", "contain", "cover"], fitFill: true, explicitDimensions: true, responsiveSourceConfiguredBeforeRequest: true, blockFullWidth: true, shapeBorderShadow: true, altAndLoadingDefaults: true, pageErrors: errors.length }));
} finally {
  await browser.close();
}
