import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const siteRoot = resolve(import.meta.dirname, "..");
const projectRoot = resolve(siteRoot, "..");
const siteCatalog = resolve(siteRoot, "catalog/components.json");
await mkdir(dirname(siteCatalog), { recursive: true });
const catalogSources = [
  resolve(projectRoot, "packages/sharepoint-ui/components.json"),
  resolve(siteRoot, "node_modules/@spfx-fast/sharepoint-ui/components.json"),
];
const catalogSource = catalogSources.find(existsSync);
if (!catalogSource) throw new Error("Cannot find components.json in the workspace or installed @spfx-fast/sharepoint-ui package.");
await copyFile(catalogSource, siteCatalog);
const catalog = JSON.parse(await (await import("node:fs/promises")).readFile(siteCatalog, "utf8"));
const components = catalog.components;
const grouped = new Map();
for (const component of components) {
  const family = component.module;
  grouped.set(family, [...(grouped.get(family) ?? []), component]);
}

const titleFor = value => value.split("-").map(part => part === "ui" ? "UI" : part[0].toUpperCase() + part.slice(1)).join(" ");
const quote = value => JSON.stringify(String(value ?? ""));
const output = resolve(siteRoot, "src/content/docs/components");
await mkdir(output, { recursive: true });
for (const name of await readdir(output)) if (name.endsWith(".mdx")) await rm(join(output, name));

const familyIndex = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
for (const [module, entries] of familyIndex) {
  const firstSummary = entries.find(entry => entry.summary)?.summary ?? `Components and composition parts in the ${titleFor(module)} family.`;
  const sections = entries.map(entry => {
    const react = entry.react ? `**React export:** \`${entry.react}\`` : "**React export:** Not supplied";
    const customElement = entry.tag ? `**Custom element:** \`<${entry.tag}>\`` : "**Custom element:** Not supplied";
    const slots = entry.api?.slots?.length ? entry.api.slots.map(slot => `\`${slot}\``).join(", ") : "None declared";
    const callbacks = entry.api?.callbackProps?.length ? entry.api.callbackProps.map(prop => `\`${prop}\``).join(", ") : "None declared";
    const relatedApis = entry.api?.relatedReactApis?.length ? entry.api.relatedReactApis.map(api => `<p><strong><code>${api.name}</code>:</strong> ${api.description}</p>`).join("\n  ") : "";
    const signature = entry.api?.reactSignature ? `\n<details>\n<summary>React API signature</summary>\n\n\`\`\`tsx\n${entry.api.reactSignature}\n\`\`\`\n\n</details>` : "";
    const styling = entry.api?.styling?.length ? entry.api.styling.map(item => `\`${item}\``).join(", ") : "Use the provider theme and element CSS parts.";
    return `### ${entry.react ?? entry.tag ?? titleFor(entry.module)}\n\n${entry.summary ?? ""}\n\n<div class="api-entry">\n  <p class="api-meta"><span>${react}</span><span>${customElement}</span></p>\n  <p><strong>Slots:</strong> ${slots}</p>\n  <p><strong>Callbacks:</strong> ${callbacks}</p>\n  <p><strong>Styling:</strong> ${styling}</p>\n  ${signature}\n  ${relatedApis}\n</div>`;
  });
  const page = `---\ntitle: ${quote(titleFor(module))}\ndescription: ${quote(firstSummary)}\n---\n\n${sections.join("\n\n") }\n`;
  await writeFile(join(output, `${module}.mdx`), page);
}

const index = `---\ntitle: Component catalog\ndescription: Browse ${components.length} component exports across ${grouped.size} modules.\n---\n\n# Component catalog\n\nSearch component names, API signatures, callbacks, slots, and summaries using the site search.\n\nThe package index lists **${components.length} component exports across ${grouped.size} modules**, including the complete set of named components in the pinned Fluent UI React v9 suite baseline.\n\n${familyIndex.map(([module, entries]) => `- [${titleFor(module)}](/sharepoint-ui-docs/components/${module}/) — ${entries.map(entry => entry.react).filter(Boolean).join(", ")}`).join("\n")}\n`;
await writeFile(resolve(siteRoot, "src/content/docs/catalog.mdx"), index);
console.log(JSON.stringify({ components: components.length, modules: grouped.size, generatedPages: grouped.size + 1 }));
