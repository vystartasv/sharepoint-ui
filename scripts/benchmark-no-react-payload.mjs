import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const libraryPackage = JSON.parse(await readFile(resolve(root, "packages/sharepoint-ui/package.json"), "utf8"));
const fluentPackagePath = resolve(root, "examples/spfx124-webpart/node_modules/@fluentui/react-components/package.json");
const fluentPackage = JSON.parse(await readFile(fluentPackagePath, "utf8"));
if (!fluentPackage.version.startsWith("9.")) throw new Error(`Expected Fluent UI v9, found ${fluentPackage.version}.`);

const cases = [
  {
    name: "SharePoint UI custom elements (no React)",
    resolveDir: root,
    sourcefile: "sharepoint-ui-elements.ts",
    loader: "ts",
    source: `import { defineButton } from "@spfx-fast/sharepoint-ui/elements/button";
import { defineInput } from "@spfx-fast/sharepoint-ui/elements/input";
import { defineCard } from "@spfx-fast/sharepoint-ui/elements/card";
import { defineTag } from "@spfx-fast/sharepoint-ui/elements/tags";
defineButton(); defineInput(); defineCard(); defineTag();`,
  },
  {
    name: "SharePoint UI React adapters",
    resolveDir: root,
    sourcefile: "sharepoint-ui-react.tsx",
    loader: "tsx",
    source: `import { Button, Input, Card, Tag } from "@spfx-fast/sharepoint-ui/react";
console.log(Button, Input, Card, Tag);`,
  },
  {
    name: `Fluent UI React v9 (${fluentPackage.version})`,
    resolveDir: resolve(root, "examples/spfx124-webpart"),
    sourcefile: "fluent-ui-controls.tsx",
    loader: "tsx",
    source: `import { Button, Input, Card, Tag } from "@fluentui/react-components";
console.log(Button, Input, Card, Tag);`,
  },
];

const results = [];
for (const item of cases) {
  const result = await build({
    stdin: { contents: item.source, resolveDir: item.resolveDir, sourcefile: item.sourcefile, loader: item.loader },
    bundle: true,
    write: false,
    metafile: true,
    minify: true,
    treeShaking: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    external: ["react", "react-dom"],
    logLevel: "silent",
  });
  const bytes = result.outputFiles[0].contents;
  const output = Object.values(result.metafile.outputs)[0];
  results.push({
    implementation: item.name,
    rawBytes: bytes.length,
    gzipBytes: gzipSync(bytes).length,
    brotliBytes: brotliCompressSync(bytes).length,
    includedModules: Object.values(output.inputs).filter(input => input.bytesInOutput > 0).length,
  });
}

const fluent = results.at(-1);
console.log(JSON.stringify({
  measuredOn: new Date().toISOString().slice(0, 10),
  sharePointUiVersion: libraryPackage.version,
  components: ["Button", "Input", "Card", "Tag"],
  builder: `esbuild ${JSON.parse(await readFile(resolve(root, "node_modules/esbuild/package.json"), "utf8")).version}`,
  target: "ES2022, minified, tree-shaken browser ESM",
  external: ["react", "react-dom"],
  results: results.map(result => ({
    ...result,
    gzipReductionVsFluentPercent: result === fluent ? 0 : Number(((1 - result.gzipBytes / fluent.gzipBytes) * 100).toFixed(1)),
  })),
  caveat: "JavaScript payload for these four component imports only. React and React DOM are external in both React builds; this does not measure CSS files, host/runtime cost, rendering speed, or complete behavioral parity.",
}, null, 2));
