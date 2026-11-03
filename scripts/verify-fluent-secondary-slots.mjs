import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const root = process.cwd();
const reactPath = resolve(root, "packages/sharepoint-ui/src/react.tsx");
const bundle = await build({
  stdin: {
    sourcefile: "fluent-secondary-slots.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{BreadcrumbButton,CarouselAutoplayButton,CarouselButton,Hamburger,NavDivider,ToolbarButton,ToolbarDivider,ToolbarRadioButton,ToolbarToggleButton}from"${reactPath}";const icon=(id:string)=> <svg data-testid={id} viewBox="0 0 16 16"><path d="M2 2h12v12H2z"/></svg>;createRoot(document.querySelector("#root")).render(<><BreadcrumbButton data-testid="breadcrumb" icon={icon("breadcrumb-icon")}>Breadcrumb</BreadcrumbButton><CarouselButton data-testid="carousel" icon={icon("carousel-icon")}>Next</CarouselButton><CarouselAutoplayButton data-testid="autoplay" icon={icon("autoplay-icon")}/><Hamburger data-testid="hamburger" icon={icon("hamburger-icon")} label="Open navigation"/><NavDivider data-testid="nav-divider" wrapper={{className:"nav-wrapper", "data-testid":"nav-wrapper"}} appearance="brand" alignContent="end" inset vertical style={{"--spui-ui-accent":"rgb(12, 34, 56)"}}/><NavDivider data-testid="nav-divider-default"/><ToolbarButton data-testid="toolbar" icon={icon("toolbar-icon")}>Command</ToolbarButton><ToolbarDivider data-testid="toolbar-divider" wrapper={<span className="toolbar-wrapper" data-testid="toolbar-wrapper"/>}/><ToolbarRadioButton data-testid="radio" name="view" value="list" icon={icon("radio-icon")}>List</ToolbarRadioButton><ToolbarToggleButton data-testid="toggle" name="mode" value="compact" icon={icon("toggle-icon")}>Compact</ToolbarToggleButton></>);`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  alias: { react: resolve(root, "node_modules/react"), "react-dom/client": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve(root, "examples/spfx124-webpart/node_modules")],
  write: false,
});
const server = createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div></body></html>");
  if (pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  return response.writeHead(404).end();
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/bundle.js` });
  const iconHosts = ["breadcrumb", "carousel", "autoplay", "hamburger", "toolbar", "radio", "toggle"];
  for (const name of iconHosts) {
    const host = page.getByTestId(name);
    const slotContent = host.locator('[slot="icon"]');
    const icon = host.getByTestId(`${name}-icon`);
    assert.equal(await slotContent.count(), 1, `${name} icon is projected into the Fluent icon slot`);
    assert.equal(await icon.count(), 1, `${name} icon content is retained`);
    assert.equal(await slotContent.getAttribute("aria-hidden"), "true", `${name} icon is decorative while its text remains the accessible name`);
    const assigned = await host.evaluate(node => node.shadowRoot?.querySelector('slot[name="icon"]')?.assignedElements().length ?? 0);
    assert.equal(assigned, 1, `${name} native engine renders the icon slot`);
  }
  for (const name of ["nav-divider", "toolbar-divider"]) {
    const host = page.getByTestId(name);
    const wrapper = page.getByTestId(name === "nav-divider" ? "nav-wrapper" : "toolbar-wrapper");
    assert.equal(await wrapper.count(), 1, `${name} accepts a wrapper slot`);
    assert.equal(await host.evaluate(node => node.shadowRoot?.querySelector('slot[name="wrapper"]')?.assignedElements().length), 1, `${name} wrapper reaches the native engine`);
  }
  const navDivider = page.getByTestId("nav-divider");
  assert.equal(await navDivider.getAttribute("role"), "separator");
  assert.equal(await navDivider.getAttribute("aria-orientation"), "vertical", "vertical NavDivider exposes its orientation to assistive technology");
  assert.deepEqual(await navDivider.evaluate(node => {
    const before = node.shadowRoot.querySelector(".line");
    const after = node.shadowRoot.querySelector(".line:last-child");
    const style = getComputedStyle(node);
    return { appearance: node.dataset.dividerAppearance, align: node.dataset.alignContent, before: getComputedStyle(before).backgroundColor, afterGrow: getComputedStyle(after).flexGrow, insetStart: style.marginInlineStart, insetEnd: style.marginInlineEnd, width: style.width };
  }), { appearance: "brand", align: "end", before: "rgb(12, 34, 56)", afterGrow: "0", insetStart: "16px", insetEnd: "16px", width: "1px" }, "NavDivider props affect appearance, label alignment, inset, and vertical geometry");
  assert.equal(await page.getByTestId("nav-divider-default").getAttribute("aria-orientation"), "horizontal", "NavDivider defaults to horizontal orientation");
  assert.equal(await page.getByRole("button", { name: "Breadcrumb" }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "Next" }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "Play" }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "Open navigation" }).count(), 1);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", iconSlots: iconHosts.length, wrapperSlots: 2, navDividerProps: ["alignContent", "appearance", "inset", "vertical"], accessibleNames: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
