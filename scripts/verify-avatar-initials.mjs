import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "avatar-initials.ts",
    loader: "ts",
    resolveDir: process.cwd(),
    contents: `import{defineAvatar}from"${resolve("packages/sharepoint-ui/src/elements/avatar.ts")}";defineAvatar();`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(`<!doctype html><html lang="en"><meta charset="utf-8"><body>
    <spui-avatar id="two" name="Ada Lovelace"></spui-avatar>
    <spui-avatar id="three" name="Ada Byron Lovelace"></spui-avatar>
    <spui-avatar id="four" name="Ada Byron King Lovelace"></spui-avatar>
    <spui-avatar id="small" name="Ada Lovelace" size="16"></spui-avatar>
    <div lang="tr-TR"><spui-avatar id="turkish" name="ipek özcan"></spui-avatar></div>
    <div dir="rtl"><spui-avatar id="rtl" name="Ada Lovelace"></spui-avatar><spui-avatar id="arabic" name="علي محمد"></spui-avatar></div>
    <div lang="invalid_locale"><spui-avatar id="invalid-locale" name="Ada Lovelace"></spui-avatar></div>
    <spui-avatar id="explicit" name="Ada Lovelace" initials="XY" dir="rtl"></spui-avatar>
    <script src="/bundle.js"></script></body></html>`));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForSelector("#two[role=img]");
  const initials = await page.evaluate(() => Object.fromEntries(["two", "three", "four", "small", "turkish", "rtl", "arabic", "invalid-locale", "explicit"].map(id => [id, {
    text: document.querySelector(`#${id}`).shadowRoot.querySelector(".initials").textContent,
    name: document.querySelector(`#${id}`).getAttribute("aria-label"),
  }])));
  assert.equal(initials.two.text, "AL", "two-word names use both initials");
  assert.equal(initials.three.text, "AL", "three-word names use the first and third initials");
  assert.equal(initials.four.text, "A", "longer names use the first initial only");
  assert.equal(initials.small.text, "A", "small avatars use one initial");
  assert.equal(initials.turkish.text, "İÖ", "casing uses inherited Turkish locale");
  assert.equal(initials.rtl.text, "LA", "Latin initials follow RTL visual ordering");
  assert.equal(initials.arabic.text, "مع", "Arabic names retain Unicode initials and RTL ordering");
  assert.equal(initials["invalid-locale"].text, "AL", "invalid inherited locales fall back safely");
  assert.equal(initials.explicit.text, "XY", "author-supplied initials retain their exact order");
  assert.deepEqual(errors, [], "page has no runtime errors");
  console.log(JSON.stringify({ status: "passed", initials, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
