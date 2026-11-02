import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(resolve(pkgDir, "components.json"), "utf8"));
const built = await access(resolve(pkgDir, "src/react.tsx")).then(() => false).catch(() => true);
const sourceDir = resolve(pkgDir, built ? "dist" : "src");
const adapter = await readFile(resolve(sourceDir, built ? "react.d.ts" : "react.tsx"), "utf8");
const barrel = await readFile(resolve(sourceDir, built ? "index.d.ts" : "index.ts"), "utf8");
const errors = [];

for (const component of catalog.components) {
  if (typeof component.summary !== "string" || !component.summary.trim()) errors.push(`${component.react}: missing human-readable component summary`);
  if (!component.api?.reactSignature || !Array.isArray(component.api.slots) || !Array.isArray(component.api.callbackProps)) errors.push(`${component.react}: missing agent API signature, slots, or callback props`);
  const exportName = component.define ?? component.factory;
  if (!component.reactOnly && !exportName) errors.push(`${component.react}: missing custom-element definition or native-element factory`);
  const signature = component.api.reactRefType
    ? (() => {
      const declaration = new RegExp(`export const ${component.react} = (?:/\\* @__PURE__ \\*/ )?React\\.forwardRef<${component.api.reactRefType},`);
      const declarationIndex = adapter.search(declaration);
      const generic = component.api.generic ? `<${component.api.generic}>` : "";
      const forwardedRef = component.api.forwardRefParameterType ? `forwardedRef: ${component.api.forwardRefParameterType}` : "forwardedRef";
      const functionSignature = `function ${component.react}${generic}(${component.api.reactSignature}, ${forwardedRef})`;
      return declarationIndex >= 0 && adapter.indexOf(functionSignature, declarationIndex) >= declarationIndex;
    })()
    : adapter.includes(`export function ${component.react}${component.api.generic ? `<${component.api.generic}>` : ""}(${component.api.reactSignature})`);
  if (!signature) errors.push(`${component.react}: catalog API signature is stale`);
  if (!new RegExp(`\\b${component.react}\\b`).test(adapter)) errors.push(`${component.react}: missing React adapter export`);
  for (const helper of component.api.reactHelpers ?? []) {
    if (!new RegExp(`\\bexport\\s+(?:const|function|type|interface)\\s+${helper}\\b`).test(adapter)) errors.push(`${component.react}: missing catalogued React helper ${helper}`);
  }
  if (component.reactOnly) continue;
  const source = await readFile(resolve(sourceDir, `elements/${component.module}.${built ? "js" : "ts"}`), "utf8").catch(() => null);
  if (!source) { errors.push(`${component.tag}: missing source module ${component.module}`); continue; }
  const literalRegistration = new RegExp(`customElements\\.define\\(["']${component.tag}["']`).test(source);
  const sharedFactoryRegistration = source.includes(`"${component.tag}"`) && /customElements\.define\(tag,/.test(source);
  const partRegistration = component.tag.startsWith("spui-teaching-popover-") && source.includes(`partTag("${component.tag.slice("spui-teaching-popover-".length)}")`) && /function definePart\(/.test(source) && /customElements\.define\(tag,/.test(source);
  if (component.registered !== false && !literalRegistration && !sharedFactoryRegistration && !partRegistration && !(source.includes(`"${component.tag}"`) && /customElements\.define\(name/.test(source))) errors.push(`${component.tag}: missing custom-element definition`);
  if (exportName && !new RegExp(`\\b${exportName}\\b`).test(barrel)) errors.push(`${exportName}: missing public element/factory export`);
}
if (!catalog.frameworkCompatibility?.spfx || catalog.components.length === 0) errors.push("Catalog requires SPFx compatibility and components.");
if (errors.length) { console.error(`Catalog check failed:\n- ${errors.join("\n- ")}`); process.exitCode = 1; }
else console.log(`Validated ${catalog.components.length} component entries against React adapters and custom-element exports.`);
