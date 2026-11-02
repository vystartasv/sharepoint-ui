import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { build } from "esbuild";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);
const names = [];
for (let index = 0; index < args.length; index++) {
  if (args[index] === "--with" && args[index + 1]) names.push(args[++index]);
  else if (args[index].startsWith("--with=")) names.push(args[index].slice("--with=".length));
  else if (!args[index].startsWith("--")) names.push(args[index]);
}
const [name] = names;
if (!name) throw new Error("Usage: npm run measure:component -- <ReactComponentOrHookName>");
const catalog = JSON.parse(await readFile(resolve(root, "packages/sharepoint-ui/components.json"), "utf8"));
const components = names.map(componentName => catalog.components.find(item => item.react === componentName)).filter(Boolean);
const reactApis = names.filter(componentName => !components.some(component => component.react === componentName));
const reactSource = await readFile(resolve(root, "packages/sharepoint-ui/src/react.tsx"), "utf8");
for (const apiName of reactApis) {
  if (!new RegExp(`export\\s+function\\s+${apiName}\\b`).test(reactSource)) {
    throw new Error(`Unknown component or exported React function: ${apiName}. Check the component catalog and packages/sharepoint-ui/src/react.tsx.`);
  }
}
const factoryModules = [...new Set(components.map(component => component.module))];
const factoryBindings = components.map(component => `factoryModule${factoryModules.indexOf(component.module)}.${component.factory}`);

const slices = [
  components.length > 0 && components.every(component => component.define) && { name: "custom-element", source: `${components.map(component => `import { ${component.define} } from "./packages/sharepoint-ui/src/elements/${component.module}.ts";`).join(" ")} ${components.map(component => `${component.define}();`).join(" ")}` },
  components.length > 0 && components.every(component => component.factory) && { name: "native-factory", source: `${factoryModules.map((module, index) => `import * as factoryModule${index} from "./packages/sharepoint-ui/src/elements/${module}.ts";`).join(" ")} console.log(${factoryBindings.join(", ")});` },
  { name: components.length ? "react-adapter" : "react-api", source: `import { ${names.join(", ")} } from "./packages/sharepoint-ui/src/react.tsx"; console.log(${names.join(", ")});` },
].filter(Boolean);

for (const slice of slices) {
  const result = await build({
    stdin: { contents: slice.source, resolveDir: root, sourcefile: `${name}-${slice.name}.ts`, loader: "ts" },
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
  const includedFiles = Object.entries(output.inputs).filter(([, input]) => input.bytesInOutput > 0).map(([path]) => path);
  console.log(JSON.stringify({
    component: names.join("+"),
    slice: slice.name,
    rawBytes: bytes.length,
    gzipBytes: gzipSync(bytes).length,
    brotliBytes: brotliCompressSync(bytes).length,
    inputModules: Object.keys(result.metafile.inputs).length,
    includedModules: includedFiles.length,
    ...(args.includes("--verbose") ? { includedFiles } : {}),
    caveat: "Minified tree-shaken JavaScript only; excludes React runtime, CSS assets, and SharePoint host cost.",
  }));
}
