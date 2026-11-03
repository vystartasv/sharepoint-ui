import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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

const catalog = JSON.parse(await readFile(siteCatalog, "utf8"));
const grouped = new Map();
for (const component of catalog.components) grouped.set(component.module, [...(grouped.get(component.module) ?? []), component]);

const titleFor = value => value.split("-").map(part => part === "ui" ? "UI" : part[0].toUpperCase() + part.slice(1)).join(" ");
const quote = value => JSON.stringify(String(value ?? ""));
const escapeHtml = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("{", "&#123;").replaceAll("}", "&#125;");
const slugFor = value => value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const titleForComponent = component => component.react ?? titleFor(component.tag?.replace(/^spui-/, "") ?? component.module);
const familyPreviewTags = {
  accordion: "spui-accordion", avatar: "spui-avatar-group", carousel: "spui-carousel", "data-grid": "spui-data-grid",
  field: "spui-field", "field-composition": "spui-field", image: "img", label: "label", listbox: "spui-listbox", overflow: "spui-overflow", popover: "spui-popover", tabs: "spui-tabs", text: "spui-text", toast: "spui-toast", tree: "spui-tree",
};
const renderless = new Set([
  "OverflowProvider", "useOverflowSnapshot", "OverflowReorderObserver", "AvatarGroupProvider", "AccordionProvider",
  "DataGridContextProvider", "ColumnIdContextProvider", "TabListProvider", "PopoverProvider", "CarouselProvider",
]);
const presetText = {
  Body1: ["300", "regular"], Body1Strong: ["300", "semibold"], Body1Stronger: ["300", "bold"], Body2: ["400", "regular"],
  Caption1: ["200", "regular"], Caption1Strong: ["200", "semibold"], Caption1Stronger: ["200", "bold"], Caption2: ["100", "regular"],
  Caption2Strong: ["100", "semibold"], Display: ["1000", "semibold"], LargeTitle: ["900", "semibold"], Subtitle1: ["500", "semibold"],
  Subtitle2: ["400", "semibold"], Subtitle2Stronger: ["400", "bold"], Title1: ["800", "semibold"], Title2: ["700", "semibold"], Title3: ["600", "semibold"],
};

function exampleFor(component) {
  const customTag = component.tag?.startsWith("spui-") ? component.tag : undefined;
  if (!customTag) {
    if (component.react === "Image") return { tag: "img", attrs: 'src="/sharepoint-ui-docs/preview-image.svg" alt="Blue and violet abstract shapes" width="220" height="120"', content: "", related: true };
    if (presetText[component.react]) return { tag: "spui-text", attrs: `size="${presetText[component.react][0]}" weight="${presetText[component.react][1]}"`, content: "Quarterly access review", related: true };
    return { tag: familyPreviewTags[component.module] ?? grouped.get(component.module)?.find(item => item.tag?.startsWith("spui-"))?.tag, attrs: "", content: `Live ${titleFor(component.module)} example`, related: true };
  }
  const tag = customTag;
  const attrs = [];
  if (["spui-button", "spui-compound-button", "spui-menu-button", "spui-split-button"].includes(tag)) attrs.push('appearance="primary"');
  if (["spui-input", "spui-search-box", "spui-text-area"].includes(tag)) attrs.push('value="Quarterly access review"', 'placeholder="Enter a value"');
  if (tag === "spui-progress-bar") attrs.push('value="68"', 'aria-label="Upload progress"');
  if (tag === "spui-rating") attrs.push('value="4"', 'aria-label="Rating"');
  const content = tag === "spui-button" ? "Save changes" : titleForComponent(component);
  return { tag, attrs: attrs.join(" "), content, related: false };
}

function markupFor(example) {
  if (!example?.tag) return "";
  const attrs = example.attrs ? ` ${example.attrs}` : "";
  if (example.tag === "spui-button") return `<spui-button appearance="secondary">View details</spui-button><spui-button${attrs}>${escapeHtml(example.content)}</spui-button>`;
  if (example.tag === "img") return `<img${attrs} />`;
  return `<${example.tag}${attrs}>${escapeHtml(example.content)}</${example.tag}>`;
}

const output = resolve(siteRoot, "src/content/docs/components");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const familyIndex = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
const catalogLinks = [];
let generatedPages = 0;

for (const [module, entries] of familyIndex) {
  const familyDir = join(output, module);
  await mkdir(familyDir, { recursive: true });
  const firstSummary = entries.find(entry => entry.summary)?.summary ?? `Components and composition APIs in the ${titleFor(module)} family.`;
  const localSlugs = new Set();
  const items = [];

  for (const entry of entries) {
    const name = titleForComponent(entry);
    let slug = slugFor(entry.react ?? entry.tag ?? name);
    if (!slug || localSlugs.has(slug)) slug = `${slug || "component"}-${localSlugs.size + 1}`;
    localSlugs.add(slug);
    const pagePath = `/sharepoint-ui-docs/components/${module}/${slug}/`;
    const example = exampleFor(entry);
    const markup = markupFor(example);
    const react = entry.react ? `<strong>React export:</strong> <code>${escapeHtml(entry.react)}</code>` : "<strong>React export:</strong> Not supplied";
    const customElement = entry.tag?.startsWith("spui-") ? `<strong>Custom element:</strong> <code>&lt;${escapeHtml(entry.tag)}&gt;</code>` : "<strong>Custom element:</strong> Not supplied";
    const reactRoot = entry.tag && !entry.tag.startsWith("spui-") ? `<strong>React root type:</strong> <code>${escapeHtml(entry.tag)}</code>` : "";
    const slots = entry.api?.slots?.length ? entry.api.slots.map(slot => `<code>${escapeHtml(slot)}</code>`).join(", ") : "None declared";
    const callbacks = entry.api?.callbackProps?.length ? entry.api.callbackProps.map(prop => `<code>${escapeHtml(prop)}</code>`).join(", ") : "None declared";
    const styling = entry.api?.styling?.length ? entry.api.styling.map(item => `<code>${escapeHtml(item)}</code>`).join(", ") : "Use the provider theme and element CSS parts.";
    const signature = entry.api?.reactSignature ? `\n<details>\n<summary>React API signature</summary>\n\n\`\`\`tsx\n${entry.api.reactSignature}\n\`\`\`\n\n</details>` : "";
    const relatedApis = entry.api?.relatedReactApis?.length ? entry.api.relatedReactApis.map(api => `<p><strong><code>${escapeHtml(api.name)}</code>:</strong> ${escapeHtml(api.description)}</p>`).join("\n") : "";
    const previewNote = !entry.tag?.startsWith("spui-")
      ? renderless.has(entry.react)
        ? `This API provides shared state or behavior and has no standalone visual. The preview shows the related ${titleFor(module)} surface.`
        : `This React composition API renders inside its parent. The preview shows the related ${titleFor(module)} surface; its signature and composition details are below.`
      : "Interact with the component below. Change its appearance or accent to see the theme tokens update live.";
    const preview = markup ? `\n<div class="component-demo" data-component-demo data-default-appearance="ios" data-label="${escapeHtml(name)}">\n  <div class="component-demo__toolbar">\n    <label>Appearance <select data-preview-appearance aria-label="Preview appearance"><option value="ios" selected>iOS</option><option value="fluent">Fluent</option><option value="windows">Windows</option><option value="linux">Linux</option><option value="glass">Glass</option></select></label>\n    <label>Accent <input data-preview-accent type="color" value="#78716c" aria-label="Preview accent color" /></label>\n  </div>\n  <div class="component-demo__stage">${markup}</div>\n  <output class="component-demo__status" aria-live="polite">${escapeHtml(previewNote)}</output>\n</div>\n` : `\n<div class="component-demo__note">${escapeHtml(previewNote)}</div>\n`;
    const customExample = entry.tag?.startsWith("spui-") && markup ? `\n<details>\n<summary>Custom element markup</summary>\n\n\`\`\`html\n${markup}\n\`\`\`\n\n</details>` : "";
    const relatedPreview = !entry.tag?.startsWith("spui-") && markup ? `\n<details>\n<summary>Related live preview markup</summary>\n\n\`\`\`html\n${markup}\n\`\`\`\n\n</details>` : "";
    const page = `---\ntitle: ${quote(name)}\ndescription: ${quote(entry.summary ?? firstSummary)}\n---\n\nimport ComponentPreviewRuntime from "../../../../components/ComponentPreviewRuntime.astro";\n\n<ComponentPreviewRuntime />\n\n${entry.summary ?? ""}\n\n${preview}\n<div class="api-entry">\n  <p class="api-meta"><span>${react}</span><span>${reactRoot}</span><span>${customElement}</span></p>\n  <p><strong>Slots:</strong> ${slots}</p>\n  <p><strong>Callbacks:</strong> ${callbacks}</p>\n  <p><strong>Styling:</strong> ${styling}</p>\n  ${signature}\n  ${relatedApis}\n</div>\n${customExample}${relatedPreview}\n`;
    await writeFile(join(familyDir, `${slug}.mdx`), page);
    items.push(`- [${name}](${pagePath})`);
    catalogLinks.push(`- [${name}](${pagePath}) — ${entry.summary ?? titleFor(module)}`);
    generatedPages++;
  }

  const familyPage = `---\ntitle: ${quote(titleFor(module))}\ndescription: ${quote(firstSummary)}\n---\n\n${firstSummary}\n\n${entries.length} component${entries.length === 1 ? "" : "s"} in this family:\n\n${items.join("\n")}\n`;
  await writeFile(join(familyDir, "index.mdx"), familyPage);
}

const index = `---\ntitle: Component catalog\ndescription: Browse ${catalog.components.length} component exports across ${grouped.size} modules.\n---\n\n# Component catalog\n\nBrowse the complete component set in the sidebar, or search the component names, API signatures, callbacks, slots, and summaries. Each visual component page includes a live preview with appearance and accent controls. Context providers and hooks link to their related rendered component.\n\n${catalogLinks.join("\n")}\n`;
await writeFile(resolve(siteRoot, "src/content/docs/catalog.mdx"), index);
console.log(JSON.stringify({ components: catalog.components.length, modules: grouped.size, componentPages: generatedPages, generatedPages: generatedPages + grouped.size + 1 }));
