import fs from "node:fs";
import path from "node:path";

const root = path.resolve("packages/sharepoint-ui/src");
const files = [path.join(root, "react.tsx"), ...fs.readdirSync(path.join(root, "elements"), { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith(".ts"))
  .map(entry => path.join(root, "elements", entry.name))];
const durations = new Map([["100ms", "fast"], ["120ms", "fast"], [".12s", "fast"], ["140ms", "normal"], ["150ms", "normal"], [".15s", "normal"]]);
let declarations = 0;
let replacements = 0;

for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(/transition\s*:\s*([^;}]+)/g, (declaration, value) => {
    if (value.includes("var(--spui-motion-duration-")) return declaration;
    if (!/(?:ms|s)\b/.test(value)) return declaration;
    declarations++;
    const updated = value.replace(/(?<![\w.-])(?:100ms|120ms|\.12s|140ms|150ms|\.15s)(?![\w.-])/g, duration => {
      const token = durations.get(duration);
      if (!token) return duration;
      replacements++;
      return `var(--spui-motion-duration-${token},${duration})`;
    }).replace(/(?<![\w-])ease(?![\w-])/g, "var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))");
    return declaration.replace(value, updated);
  });
  if (after !== before) fs.writeFileSync(file, after);
}

console.log(JSON.stringify({ filesScanned: files.length, declarationsWithDurations: declarations, durationReplacements: replacements }));
