import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";

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
const reactSource = await readFile(resolve(projectRoot, "packages/sharepoint-ui/src/react.tsx"), "utf8");
const reactAst = ts.createSourceFile("react.tsx", reactSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const reactTypes = new Map(reactAst.statements.filter(statement => ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)).map(statement => [statement.name.text, statement]));

const elementEntrypoints = await readFile(resolve(projectRoot, "packages/sharepoint-ui/src/elements.ts"), "utf8");
const registrationFunctions = new Map([...elementEntrypoints.matchAll(/import\s*\{([^}]+)\}\s*from\s*"\.\/elements\/([^\"]+)\.js"/g)].map(([, names, module]) => [module, [...names.matchAll(/\b(define[A-Z]\w*)\b/g)].map(([, name]) => name)]));
const previewModules = new Map(catalog.components.filter(component => component.tag?.startsWith("spui-")).map(component => [component.tag, component.module]));
const requiredModules = new Set(previewModules.values());
const missingRegistrations = [...requiredModules].filter(module => !registrationFunctions.get(module)?.length);
if (missingRegistrations.length) throw new Error(`Missing custom-element registrations for: ${missingRegistrations.join(", ")}`);
const previewRuntime = [
  `export const previewModuleByTag = ${JSON.stringify(Object.fromEntries(previewModules))};`,
  "export const previewModuleLoaders = {",
  ...[...requiredModules].sort().map(module => `  ${JSON.stringify(module)}: async () => { const elements = await import(${JSON.stringify(`@spfx-fast/sharepoint-ui/elements/${module}`)}); ${registrationFunctions.get(module).map(name => `elements.${name}();`).join(" ")} },`),
  "};",
  `const loadingModules = new Map();`,
  `export function registerPreviewElements(demo) { const modules = new Set([...demo.querySelectorAll("*")].map(element => previewModuleByTag[element.localName]).filter(Boolean)); return Promise.all([...modules].map(module => { let loading = loadingModules.get(module); if (!loading) { loading = previewModuleLoaders[module](); loadingModules.set(module, loading); loading.catch(() => loadingModules.delete(module)); } return loading; })); }`,
  "",
].join("\n");
await writeFile(resolve(siteRoot, "src/components/preview-elements.generated.js"), previewRuntime);

const titleFor = value => value.split("-").map(part => part === "ui" ? "UI" : part[0].toUpperCase() + part.slice(1)).join(" ");
const quote = value => JSON.stringify(String(value ?? ""));
const escapeHtml = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("{", "&#123;").replaceAll("}", "&#125;");
const slugFor = value => value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const titleForComponent = component => component.react?.replace(/([a-z0-9])([A-Z])/g, "$1 $2") ?? titleFor(component.tag?.replace(/^spui-/, "") ?? component.module);
const familyPreviewTags = {
  accordion: "spui-accordion", avatar: "spui-avatar-group", carousel: "spui-carousel", "data-grid": "spui-data-grid",
  field: "spui-field", "field-composition": "spui-field", image: "img", label: "label", listbox: "spui-listbox", overflow: "spui-overflow", popover: "spui-popover", "radio-group": "spui-radio-group", tabs: "spui-tabs", text: "spui-text", toast: "spui-toast", tree: "spui-tree", "virtual-list": "spui-virtual-list",
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

const propertyDescriptions = {
  accept: "File types the upload control accepts.", action: "Action shown for this item.", active: "Whether this item is currently active.", activeAppearance: "Visual treatment for the active state.", align: "How content is aligned within the component.", appearance: "Visual style used by the component.", as: "HTML element or link behavior used for the root.", axis: "Direction in which items are arranged or scrolled.",
  alt: "Alternative text announced for an image.", autoComplete: "Browser autofill behavior for this field.", checked: "Whether this option is selected.", children: "Content rendered inside the component.", color: "Color or palette choice for this item.", columns: "Column definitions shown in the data view.", content: "Content shown inside the component's surface.", dataSource: "Source that supplies rows or options as needed.", defaultChecked: "Initial selected state when the control manages its own state.", defaultOpen: "Initial open state when the component manages its own state.", defaultSelected: "Initial selection when the component manages its own state.", defaultValue: "Initial value when the component manages its own state.", description: "Supporting text shown with the main label.", disabled: "Prevents interaction and communicates that the control is unavailable.", editable: "Whether the value can be changed by the user.", expanded: "Whether the section or item is expanded.", fit: "How media is sized inside its available space.", form: "ID of the form this control belongs to.", height: "Height of the component or its viewport.", hidden: "Whether the component is hidden.", hint: "Help text shown alongside the control.", href: "Destination opened by this link.", icon: "Icon displayed with the component.", id: "Unique HTML identifier for this element.", image: "Image displayed by this component.", input: "Native input control or input settings used by this component.", indicator: "Custom visual mark shown for the control's state.", label: "Accessible label, usually shown next to the control.", labelPosition: "Where the label appears relative to its control.", layout: "How child items are arranged.", loading: "Whether to show a loading state.", max: "Largest value the control accepts.", min: "Smallest value the control accepts.", mountNode: "Element where the popup or floating surface is mounted.", multiple: "Whether more than one value can be selected.", name: "Form field name used when submitting a form.", onChange: "Called when the user changes the value.", onClick: "Called when the user activates the component.", onDismiss: "Called when the user dismisses the component.", onOpenChange: "Called when the component opens or closes.", onValueChange: "Called with the new value when it changes.", open: "Whether the component is currently open.", orientation: "Direction in which options are arranged.", placeholder: "Hint shown while the value is empty.", placement: "Preferred position for a popup or floating surface.", readOnly: "Shows the value without allowing it to be edited.", required: "Requires a value before the form can be submitted.", rows: "Row data or number of visible rows, depending on the component.", selected: "Whether this item is selected.", selectedValues: "Currently selected values in a controlled group.", shape: "Shape used for the component.", size: "Size preset used by the component.", sortState: "Current column sorting state.", src: "Source URL for the image or media.", step: "Amount added or removed when the value changes.", style: "Inline CSS styles for this element.", value: "Current value; supplying it lets the parent control the component.", variant: "Component variant that selects a behavior or visual treatment.", width: "Width of the component or its viewport.",
};
const slotDescriptions = {
  action: "Action control shown with the component.", actions: "Action controls shown with the component.", avatar: "Avatar content displayed for this person or group.", body: "Main content of the surface.", content: "Content shown inside the component.", default: "Main content placed inside the component.", footer: "Content or actions shown at the bottom.", header: "Heading and supporting content shown at the top.", icon: "Icon displayed next to the label or content.", image: "Image displayed in this region.", indicator: "Visual mark showing the control's state.", input: "Native form input used by the component.", label: "Visible label for the control.", leading: "Content shown before the main label.", media: "Image or media displayed with the content.", overflow: "Items shown when the main row does not fit.", preview: "Preview content shown with the item.", secondary: "Secondary action or supporting content.", status: "Status text or badge shown with the item.", title: "Visible title for the component.", trigger: "Control the user activates to open or reveal the component.",
};

function collectPropertyNodes(type, result = new Map(), seen = new Set()) {
  if (!type || seen.has(type)) return result;
  seen.add(type);
  if (ts.isTypeLiteralNode(type)) {
    for (const member of type.members) if (ts.isPropertySignature(member) && member.name) {
      const name = member.name.getText(reactAst).replace(/^['\"]|['\"]$/g, "");
      if (!result.has(name)) result.set(name, member);
    }
  } else if (ts.isInterfaceDeclaration(type)) {
    for (const member of type.members) if (ts.isPropertySignature(member) && member.name) {
      const name = member.name.getText(reactAst).replace(/^['\"]|['\"]$/g, "");
      if (!result.has(name)) result.set(name, member);
    }
  } else if (ts.isIntersectionTypeNode(type) || ts.isUnionTypeNode(type)) type.types.forEach(part => collectPropertyNodes(part, result, seen));
  else if (ts.isTypeAliasDeclaration(type)) collectPropertyNodes(type.type, result, seen);
  else if (ts.isTypeReferenceNode(type)) {
    const local = reactTypes.get(type.typeName.getText(reactAst));
    if (local && !["ElementProps", "NativeClickHostProps", "NativeFormHostProps"].includes(local.name.text)) collectPropertyNodes(local, result, seen);
  }
  return result;
}

function apiPropertiesFor(component) {
  const propsType = component.react ? reactTypes.get(`${component.react}Props`) : undefined;
  if (propsType) return collectPropertyNodes(propsType);
  const signature = component.api?.reactSignature ?? "";
  const inlineType = /^\{[\s\S]*?\}:\s*([\s\S]+)$/.exec(signature)?.[1]?.trim();
  if (!inlineType) return new Map();
  const reference = /^([A-Za-z_$][\w$]*)$/.exec(inlineType)?.[1];
  if (reference && reactTypes.has(reference)) return collectPropertyNodes(reactTypes.get(reference));
  const source = ts.createSourceFile("component-props.ts", `type ComponentProps = ${inlineType};`, ts.ScriptTarget.Latest, true);
  const declaration = source.statements.find(ts.isTypeAliasDeclaration);
  const result = new Map();
  const walk = type => {
    if (!type) return;
    if (ts.isTypeLiteralNode(type)) for (const member of type.members) if (ts.isPropertySignature(member) && member.name) result.set(member.name.getText(source).replace(/^['\"]|['\"]$/g, ""), member);
    else if (ts.isIntersectionTypeNode(type) || ts.isUnionTypeNode(type)) type.types.forEach(walk);
  };
  if (declaration) walk(declaration.type);
  return result;
}

function propertyDescription(name, member) {
  const docs = member.jsDoc?.map(doc => typeof doc.comment === "string" ? doc.comment.trim() : "").filter(Boolean).join(" ");
  if (docs) return docs;
  if (propertyDescriptions[name]) return propertyDescriptions[name];
  const words = name.replace(/^on/, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  const type = member.type?.getText(member.getSourceFile()) ?? "";
  if (name.startsWith("on")) return `Called when ${words || "the component event"} occurs.`;
  if (/^default[A-Z]/.test(name)) return `Initial ${words.replace(/^default\s*/, "")} used before the user changes it.`;
  if (/\bboolean\b/.test(type)) return `Turns ${words} on or off.`;
  if (/ReactNode|React\.ReactNode/.test(type)) return `Content displayed in the ${words} area.`;
  if (/=>/.test(type)) return `Function that supplies or handles ${words}.`;
  if (/^['\"]/.test(type)) return `Chooses the ${words} option.`;
  return `Sets the ${words} used by this component.`;
}

function propertyTableFor(component) {
  const properties = apiPropertiesFor(component);
  if (!properties.size) return `<section class="api-table-section"><h2>Properties</h2><p>This API does not declare additional component properties. Common HTML attributes are accepted where applicable.</p></section>`;
  const rows = [...properties].map(([name, member]) => {
    const type = member.type?.getText(member.getSourceFile()) ?? "unknown";
    const optional = member.questionToken ? "Optional. " : "Required. ";
    return `<tr><th scope="row"><code>${escapeHtml(name)}</code></th><td><code>${escapeHtml(type).replaceAll("|", "&#124;")}</code>${member.questionToken ? "" : "<span class=\"api-required\">required</span>"}</td><td>${escapeHtml(optional + propertyDescription(name, member))}</td></tr>`;
  }).join("\n");
  return `<section class="api-table-section"><h2>Properties</h2><div class="api-table-scroll"><table class="api-table"><thead><tr><th scope="col">Property</th><th scope="col">Type</th><th scope="col">What it does</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function slotsTableFor(slots) {
  if (!slots?.length) return `<section class="api-table-section"><h2>Slots</h2><p>This component has no named slots.</p></section>`;
  const rows = slots.map(slot => {
    const [name, ...explicit] = slot.split(/\s+/);
    const description = explicit.join(" ") || slotDescriptions[name] || `Content assigned to the ${name} region.`;
    return `<tr><th scope="row"><code>${escapeHtml(name)}</code></th><td>${escapeHtml(description)}</td></tr>`;
  }).join("\n");
  return `<section class="api-table-section"><h2>Slots</h2><div class="api-table-scroll"><table class="api-table"><thead><tr><th scope="col">Slot</th><th scope="col">What goes here</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function exampleFor(component) {
  const compositions = {
    accordion: { tag: "spui-accordion", attrs: 'value="access"', markup: '<spui-accordion value="access"><spui-accordion-item value="access" open><spui-accordion-header>Access policy</spui-accordion-header><spui-accordion-panel>Review who can open this workspace.</spui-accordion-panel></spui-accordion-item></spui-accordion>' },
    carousel: { tag: "spui-carousel", attrs: 'aria-label="Project updates" default-selected-index="0"', markup: '<spui-carousel aria-label="Project updates" default-selected-index="0"><spui-carousel-card>Workspace launch</spui-carousel-card><spui-carousel-card>Quarterly review</spui-carousel-card><spui-carousel-card>Team updates</spui-carousel-card></spui-carousel>' },
    dialog: { tag: "spui-dialog", attrs: 'aria-label="Save changes"', markup: '<spui-dialog aria-label="Save changes"><spui-dialog-trigger slot="trigger"><spui-button appearance="secondary">Open dialog</spui-button></spui-dialog-trigger><spui-dialog-title>Save changes</spui-dialog-title><spui-dialog-body>Your edits are ready to share with the team.</spui-dialog-body><spui-dialog-actions><spui-button appearance="secondary">Cancel</spui-button><spui-button appearance="primary">Save</spui-button></spui-dialog-actions></spui-dialog>' },
    drawer: { tag: "spui-inline-drawer", attrs: 'open title="Item details"', markup: '<spui-inline-drawer open title="Item details"><spui-drawer-body>Quarterly access review<br />Owner: Vilius Petrauskas</spui-drawer-body><spui-drawer-footer><spui-button appearance="primary">Open item</spui-button></spui-drawer-footer></spui-inline-drawer>' },
    menu: { tag: "spui-menu", attrs: 'open', markup: '<spui-menu open><spui-button slot="trigger" appearance="secondary">More actions</spui-button><spui-menu-item slot="menu">Open item</spui-menu-item><spui-menu-item slot="menu">Copy link</spui-menu-item><spui-menu-divider slot="menu"></spui-menu-divider><spui-menu-item slot="menu">Archive</spui-menu-item></spui-menu>' },
    popover: { tag: "spui-popover", attrs: '', markup: '<spui-popover><spui-button slot="trigger" appearance="secondary">Review details</spui-button><spui-popover-surface slot="content"><strong>Quarterly review</strong><br />Updated just now</spui-popover-surface></spui-popover>' },
    tabs: { tag: "spui-tabs", attrs: 'value="overview"', markup: '<spui-tabs value="overview"><spui-tab-list><spui-tab value="overview">Overview</spui-tab><spui-tab value="activity">Activity</spui-tab></spui-tab-list><spui-tab-panel value="overview">Workspace overview and key details.</spui-tab-panel></spui-tabs>' },
    "avatar-group-primitives": { tag: "spui-avatar-group-popover", attrs: 'count="2" label="Other reviewers" trigger-label="View {count} more reviewers"', markup: '<spui-avatar-group-popover count="2" label="Other reviewers" trigger-label="View {count} more reviewers"><li>Maria Chen</li><li>Daniel Morgan</li></spui-avatar-group-popover>' },
  };
  if (compositions[component.module]) return { ...compositions[component.module], content: "", related: true, kind: "composition" };
  if (component.module === "radio-group") return { tag: "spui-radio-group", attrs: 'label="Delivery method" value="email" name="delivery"', content: "", related: true };
  if (component.module === "combobox") return { tag: "spui-combobox", attrs: 'label="Work item" placeholder="Choose a work item" value="access-review"', content: "", related: true, kind: "combobox" };
  if (component.module === "tag-picker") return { tag: "spui-tag-picker", attrs: 'label="Reviewers" placeholder="Add a reviewer" selected-options="[&quot;vilius&quot;]"', content: "", related: true, kind: "tag-picker" };
  if (component.react === "Virtualizer") return { tag: "spui-virtual-list", attrs: 'aria-label="Recent documents"', content: "", related: true };
  if (component.react === "RichTextEditor") return { tag: "spui-rich-text-editor", attrs: 'label="Project notes" value="&lt;p&gt;Quarterly review: &lt;strong&gt;in progress&lt;/strong&gt;.&lt;/p&gt;"', content: "", related: false };
  const customTag = component.tag?.startsWith("spui-") ? component.tag : undefined;
  if (!customTag) {
    if (component.react === "Image") return { tag: "img", attrs: 'src="/sharepoint-ui/preview-image.svg" alt="Blue and violet abstract shapes" width="220" height="120"', content: "", related: true };
    if (presetText[component.react]) return { tag: "spui-text", attrs: `size="${presetText[component.react][0]}" weight="${presetText[component.react][1]}"`, content: "Quarterly access review", related: true };
    return { tag: familyPreviewTags[component.module] ?? grouped.get(component.module)?.find(item => item.tag?.startsWith("spui-"))?.tag, attrs: "", content: `Live ${titleFor(component.module)} example`, related: true };
  }
  const tag = customTag;
  const attrs = [];
  if (["spui-button", "spui-compound-button", "spui-menu-button", "spui-split-button"].includes(tag)) attrs.push('appearance="primary"');
  if (["spui-input", "spui-search-box", "spui-text-area"].includes(tag)) attrs.push('value="Quarterly access review"', 'placeholder="Enter a value"');
    if (tag === "spui-progress-bar") attrs.push('value="68"', 'aria-label="Upload progress"');
    if (tag === "spui-slider") attrs.push('value="64"', 'min="0"', 'max="100"', 'step="1"', 'label="Review completion"');
  if (tag === "spui-rating") attrs.push('value="4"', 'aria-label="Rating"');
  if (tag === "spui-counter-badge") attrs.push('count="12"');
  if (tag === "spui-tooltip") return { tag, attrs: "", content: "", related: true, kind: "tooltip" };
  const content = tag === "spui-button" ? "Save changes" : tag === "spui-slider" ? "" : titleForComponent(component);
  return { tag, attrs: attrs.join(" "), content, related: false };
}

function markupFor(example) {
  if (!example?.tag) return "";
  if (example.markup) return example.markup;
  const attrs = example.attrs ? ` ${example.attrs}` : "";
  if (example.tag === "spui-button") return `<spui-button appearance="secondary">View details</spui-button><spui-button${attrs}>${escapeHtml(example.content)}</spui-button>`;
  if (example.tag === "spui-split-button") return `<spui-split-button aria-label="Save options"><spui-button slot="primary" appearance="primary">Save</spui-button><spui-menu-button slot="menu" aria-label="More save options">More options</spui-menu-button></spui-split-button>`;
  if (example.tag === "spui-radio-group") return `<spui-radio-group${attrs}><spui-radio-option value="email">Email</spui-radio-option><spui-radio-option value="phone">Phone</spui-radio-option></spui-radio-group>`;
  if (example.kind === "combobox") return `<spui-combobox${attrs}><spui-combobox-option value="access-review" label="Quarterly access review">Quarterly access review</spui-combobox-option><spui-combobox-option value="site-launch" label="Site launch">Site launch</spui-combobox-option></spui-combobox>`;
  if (example.kind === "tag-picker") return `<spui-tag-picker${attrs}><spui-tag-picker-option value="vilius" text="Vilius Petrauskas" selected>Vilius Petrauskas</spui-tag-picker-option><spui-tag-picker-option value="maria" text="Maria Chen">Maria Chen</spui-tag-picker-option></spui-tag-picker>`;
  if (example.kind === "tooltip") return `<spui-tooltip><spui-button appearance="secondary">Focus for help</spui-button><span slot="tooltip">This action updates the selected workspace.</span></spui-tooltip>`;
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
    const pagePath = `/sharepoint-ui/components/${module}/${slug}/`;
    const example = exampleFor(entry);
    const markup = markupFor(example);
    const react = entry.react ? `<strong>React export:</strong> <code>${escapeHtml(entry.react)}</code>` : "<strong>React export:</strong> Not supplied";
    const customElement = entry.tag?.startsWith("spui-") ? `<strong>Custom element:</strong> <code>&lt;${escapeHtml(entry.tag)}&gt;</code>` : "<strong>Custom element:</strong> Not supplied";
    const reactRoot = entry.tag && !entry.tag.startsWith("spui-") ? `<strong>React root type:</strong> <code>${escapeHtml(entry.tag)}</code>` : "";
    const callbacks = entry.api?.callbackProps?.length ? entry.api.callbackProps.map(prop => `<code>${escapeHtml(prop)}</code>`).join(", ") : "None declared";
    const properties = propertyTableFor(entry);
    const slotTable = slotsTableFor(entry.api?.slots);
    const styling = entry.api?.styling?.length ? entry.api.styling.map(item => `<code>${escapeHtml(item)}</code>`).join(", ") : "Use the provider theme and element CSS parts.";
    const signature = entry.api?.reactSignature ? `\n<details>\n<summary>React API signature</summary>\n\n\`\`\`tsx\n${entry.api.reactSignature}\n\`\`\`\n\n</details>` : "";
    const relatedApis = entry.api?.relatedReactApis?.length ? entry.api.relatedReactApis.map(api => `<p><strong><code>${escapeHtml(api.name)}</code>:</strong> ${escapeHtml(api.description)}</p>`).join("\n") : "";
    const previewNote = example.related
      ? `The ${titleFor(module)} example is assembled so this API can be seen in its working context.`
      : !entry.tag?.startsWith("spui-")
      ? renderless.has(entry.react)
        ? `This API provides shared state or behavior and has no standalone visual. The preview shows the related ${titleFor(module)} surface.`
        : `This React composition API renders inside its parent. The preview shows the related ${titleFor(module)} surface; its signature and composition details are below.`
      : "Interact with the component below. Change its appearance or accent to see the theme tokens update live.";
    const preview = markup ? `\n<div class="component-demo" data-component-demo data-default-appearance="ios" data-label="${escapeHtml(name)}">\n  <div class="component-demo__toolbar">\n    <label>Appearance <select data-preview-appearance aria-label="Preview appearance"><option value="ios" selected>iOS</option><option value="fluent">Fluent</option><option value="windows">Windows</option><option value="linux">Linux</option><option value="glass">Glass</option></select></label>\n    <label>Theme <select data-preview-theme aria-label="Preview SharePoint theme"><option value="sharepoint" selected>SharePoint teal</option><option value="blue">Blue</option><option value="green">Green</option><option value="pink">Pink</option><option value="custom">Custom</option></select></label>\n    <label>Accent <input data-preview-accent type="color" value="#007780" aria-label="Preview accent color" /></label>\n  </div>\n  <div class="component-demo__stage">${markup}</div>\n  <div class="component-demo__token-readout" data-preview-tokens aria-label="Applied theme token values"></div>\n  <output class="component-demo__status" aria-live="polite">${escapeHtml(previewNote)}</output>\n</div>\n` : `\n<div class="component-demo__note">${escapeHtml(previewNote)}</div>\n`;
    const customExample = entry.tag?.startsWith("spui-") && markup ? `\n<details>\n<summary>${example.related ? "Composed custom element example" : "Custom element markup"}</summary>\n\n\`\`\`html\n${markup}\n\`\`\`\n\n</details>` : "";
    const relatedPreview = !entry.tag?.startsWith("spui-") && markup ? `\n<details>\n<summary>Related live preview markup</summary>\n\n\`\`\`html\n${markup}\n\`\`\`\n\n</details>` : "";
    const agentSlice = `/sharepoint-ui/agents/components/${slugFor(module)}/${slug}.json`;
    const eventSlice = entry.tag?.startsWith("spui-") ? ` Custom-element events are in the [${escapeHtml(module)} event inventory](/sharepoint-ui/agents/events/${slugFor(module)}.json); it is module-scoped.` : "";
    const agentPath = `\n> **Building with an agent?** Follow the [component conventions](/sharepoint-ui/guides/component-patterns/), then use the [quickstart](/sharepoint-ui/agents/QUICKSTART.md) and this component’s [API slice](${agentSlice}).${eventSlice}\n`;
    const page = `---\ntitle: ${quote(name)}\ndescription: ${quote(entry.summary ?? firstSummary)}\n---\n\nimport ComponentPreviewRuntime from "../../../../components/ComponentPreviewRuntime.astro";\n\n<ComponentPreviewRuntime />\n\n${entry.summary ?? ""}\n${agentPath}\n${preview}\n${properties}\n${slotTable}\n<div class="api-entry">\n  <p class="api-meta"><span>${react}</span><span>${reactRoot}</span><span>${customElement}</span></p>\n  <p><strong>Callbacks:</strong> ${callbacks}</p>\n  <p><strong>Styling:</strong> ${styling}</p>\n  ${signature}\n  ${relatedApis}\n</div>\n${customExample}${relatedPreview}\n`;
    await writeFile(join(familyDir, `${slug}.mdx`), page);
    items.push(`- [${name}](${pagePath})`);
    catalogLinks.push(`- [${name}](${pagePath}) — ${entry.summary ?? titleFor(module)}`);
    generatedPages++;
  }

  const familyPage = `---\ntitle: ${quote(titleFor(module))}\ndescription: ${quote(firstSummary)}\n---\n\n${firstSummary}\n\n${entries.length} component${entries.length === 1 ? "" : "s"} in this family:\n\n${items.join("\n")}\n`;
  await writeFile(join(familyDir, "index.mdx"), familyPage);
}

const index = `---\ntitle: Component catalog\ndescription: Browse ${catalog.components.length} component exports across ${grouped.size} modules.\n---\n\n# Component catalog\n\nBrowse the complete component set in the sidebar, or search the component names, API signatures, callbacks, slots, and summaries. Every visual component page includes a live preview with appearance and SharePoint theme controls, a visible semantic-token readout, and live component values. Context providers and hooks link to their related rendered component.\n\n${catalogLinks.join("\n")}\n`;
await writeFile(resolve(siteRoot, "src/content/docs/catalog.mdx"), index);
console.log(JSON.stringify({ components: catalog.components.length, modules: grouped.size, componentPages: generatedPages, generatedPages: generatedPages + grouped.size + 1 }));
