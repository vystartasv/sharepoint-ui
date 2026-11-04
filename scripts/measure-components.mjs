import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const packageDir = "packages/sharepoint-ui";
const manifest = JSON.parse(fs.readFileSync(`${packageDir}/components.json`, "utf8"));
const barrel = fs.readFileSync(`${packageDir}/src/index.ts`, "utf8");
const modules = new Map([...barrel.matchAll(/export \{ (\w+) \} from "\.\/(.+)\.js"/g)].map((match) => [match[1], match[2]]));
const components = manifest.components.map(({ name }) => {
  const leaf = modules.get(name);
  if (!leaf) throw new Error(`No runtime export found for ${name}`);
  const base = `${packageDir}/dist/${leaf}`;
  const moduleUrl = pathToFileURL(path.resolve(`${base}.js`)).href;
  const source = `import { performance } from "node:perf_hooks"; const start = performance.now(); await import(${JSON.stringify(moduleUrl)}); console.log((performance.now() - start).toFixed(3));`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", source], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(run.stderr);
  return {
    name,
    moduleBytes: fs.statSync(`${base}.js`).size,
    declarationBytes: fs.statSync(`${base}.d.ts`).size,
    coldImportMs: Number(run.stdout.trim()),
  };
});

const measurements = {
  measuredWith: {
    node: process.version,
    react: manifest.react,
    method: "isolated Node ESM import of each emitted component module, including React peer startup",
  },
  componentCount: components.length,
  componentJsBytes: components.reduce((sum, component) => sum + component.moduleBytes, 0),
  components,
};
fs.writeFileSync(`${packageDir}/measurements.json`, `${JSON.stringify(measurements, null, 2)}\n`);
console.log(`${components.length} modules: ${measurements.componentJsBytes.toLocaleString()} JS bytes total.`);
