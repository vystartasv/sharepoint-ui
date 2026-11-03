import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
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

const sharePointFieldCases = [
  {
    name: "SharePointField custom element (all controls bundled)",
    resolveDir: root,
    sourcefile: "sharepoint-field-element.ts",
    loader: "ts",
    source: `import { defineSharePointField } from "@spfx-fast/sharepoint-ui/elements/sharepoint-fields";
defineSharePointField();`,
  },
  {
    name: "SharePointField custom element (lazy control chunks)",
    resolveDir: root,
    sourcefile: "sharepoint-field-element.ts",
    loader: "ts",
    splitting: true,
    source: `import { defineSharePointField } from "@spfx-fast/sharepoint-ui/elements/sharepoint-fields";
defineSharePointField();`,
  },
  {
    name: "SharePointField React adapter",
    resolveDir: root,
    sourcefile: "sharepoint-field-react.tsx",
    loader: "tsx",
    source: `import { SharePointField } from "@spfx-fast/sharepoint-ui/react";
console.log(SharePointField);`,
  },
];

async function measure(item) {
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
    ...(item.splitting ? { splitting: true, outdir: resolve(root, ".benchmark") } : {}),
    logLevel: "silent",
  });
  const outputs = Object.entries(result.metafile.outputs);
  const entry = outputs.find(([, output]) => output.entryPoint);
  const entryPath = entry?.[0];
  const entryFile = result.outputFiles.find(file => entryPath && resolve(file.path) === resolve(entryPath));
  const inputs = [...new Map(outputs.flatMap(([, output]) => Object.entries(output.inputs)).filter(([, input]) => input.bytesInOutput > 0)).entries()];
  const largestModules = inputs.sort(([, left], [, right]) => right.bytesInOutput - left.bytesInOutput).slice(0, 6).map(([path, input]) => ({ path, bytes: input.bytesInOutput }));
  const outputFiles = new Map(result.outputFiles.map(file => [resolve(file.path), file]));
  const outputMetadata = new Map(outputs.map(([path, output]) => [resolve(path), output]));
  const totalGzipBytes = result.outputFiles.reduce((total, file) => total + gzipSync(file.contents).length, 0);
  const totalBrotliBytes = result.outputFiles.reduce((total, file) => total + brotliCompressSync(file.contents).length, 0);
  const lazyFieldPayloads = item.splitting ? [
    { fieldMix: "Common fields: text, choice, Boolean, MultiChoice", modules: ["sharepoint-field-basic-controls.js"] },
    { fieldMix: "Rich-text Note", modules: ["rich-text-editor.js"] },
    { fieldMix: "Lookup or User", modules: ["combobox.js"] },
    { fieldMix: "Date or date-time", modules: ["date-picker.js"] },
    { fieldMix: "Mixed form using all four groups", modules: ["sharepoint-field-basic-controls.js", "rich-text-editor.js", "combobox.js", "date-picker.js"] },
  ].map(({ fieldMix, modules }) => {
    const files = new Set();
    const includeStaticDependencies = path => {
      const absolutePath = resolve(path);
      if (files.has(absolutePath)) return;
      const metadata = outputMetadata.get(absolutePath);
      if (!metadata) return;
      files.add(absolutePath);
      for (const imported of metadata.imports) {
        if (imported.external || imported.kind === "dynamic-import") continue;
        const relativeToOutput = resolve(dirname(absolutePath), imported.path);
        const dependency = outputMetadata.has(relativeToOutput) ? relativeToOutput : resolve(root, imported.path);
        includeStaticDependencies(dependency);
      }
    };
    if (entryPath) includeStaticDependencies(entryPath);
    for (const moduleName of modules) {
      const chunk = outputs.find(([, output]) => Object.keys(output.inputs).some(path => path.endsWith(moduleName)));
      if (chunk) includeStaticDependencies(chunk[0]);
    }
    const payloadFiles = [...files].map(path => outputFiles.get(path)).filter(Boolean);
    return {
      fieldMix,
      rawBytes: payloadFiles.reduce((total, file) => total + file.contents.length, 0),
      gzipBytes: payloadFiles.reduce((total, file) => total + gzipSync(file.contents).length, 0),
      brotliBytes: payloadFiles.reduce((total, file) => total + brotliCompressSync(file.contents).length, 0),
      emittedFiles: payloadFiles.length,
    };
  }) : undefined;
  return {
    implementation: item.name,
    rawBytes: result.outputFiles.reduce((total, file) => total + file.contents.length, 0),
    gzipBytes: totalGzipBytes,
    brotliBytes: totalBrotliBytes,
    includedModules: inputs.length,
    ...(item.splitting ? {
      initialGzipBytes: entryFile ? gzipSync(entryFile.contents).length : 0,
      initialRawBytes: entryFile?.contents.length ?? 0,
      lazyChunkCount: result.outputFiles.length - 1,
      lazyChunksGzipBytes: totalGzipBytes - (entryFile ? gzipSync(entryFile.contents).length : 0),
      payloadsByFieldMix: lazyFieldPayloads,
      lazyChunks: outputs.filter(([path]) => path !== entryPath).map(([path]) => ({
        path: path.split("/").at(-1),
        gzipBytes: outputFiles.has(resolve(path)) ? gzipSync(outputFiles.get(resolve(path)).contents).length : 0,
        modules: Object.keys(result.metafile.outputs[path].inputs).map(modulePath => modulePath.split("/").slice(-2).join("/")),
        imports: result.metafile.outputs[path].imports.filter(item => !item.external).map(item => ({ path: item.path.split("/").at(-1), kind: item.kind })),
      })),
    } : {}),
    ...(item.name.startsWith("SharePointField") ? { largestModules } : {}),
  };
}

const results = await Promise.all(cases.map(measure));
const sharePointFieldResults = await Promise.all(sharePointFieldCases.map(measure));

const fluent = results.at(-1);
const sharePointFieldReact = sharePointFieldResults.at(-1);
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
  sharePointFieldSlice: {
    components: ["SharePointField"],
    results: sharePointFieldResults.map(result => ({
      ...result,
      gzipReductionVsReactPercent: result === sharePointFieldReact ? 0 : Number(((1 - result.gzipBytes / sharePointFieldReact.gzipBytes) * 100).toFixed(1)),
    })),
    caveat: "This measures the imported SharePointField API and its registered control dependencies, not a rendered form, network request, or complete SPFx application.",
  },
  caveat: "JavaScript payload for these four component imports only. React and React DOM are external in both React builds; this does not measure CSS files, host/runtime cost, rendering speed, or complete behavioral parity.",
}, null, 2));
