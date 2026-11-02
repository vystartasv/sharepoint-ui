import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { contrastRatio } from "./lib/color-contrast.mjs";

const families = ["accordion", "alert", "avatar", "badge", "breadcrumb", "button", "card", "carousel", "checkbox", "color-picker", "combobox", "dialog", "divider", "drawer", "field", "image", "infobutton", "infolabel", "input", "label", "link", "list", "menu", "message-bar", "nav", "overflow", "persona", "popover", "progress", "radio", "rating", "search", "select", "skeleton", "slider", "spinbutton", "spinner", "swatch-picker", "switch", "table", "tabs", "tag-picker", "tags", "teaching-popover", "text", "textarea", "toast", "toolbar", "tooltip", "tree", "virtualizer"];
const catalog = JSON.parse(await readFile(resolve("investigation/fluent-v9-catalog-9.75.0.json"), "utf8"));
assert.deepEqual([...families].sort(), catalog.families.map(({ family }) => family).sort(), "rendered accessibility fixture tracks every Fluent catalog family");

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Accordion,AccordionItem,AccordionHeader,AccordionPanel,Tree,Button,Link,Input,TextArea,Checkbox,Switch,Badge,Alert,Card,CardHeader,Select,RadioGroup,Radio,SpinButton,Slider,DatePicker,ComboBox,ComboOption,Dropdown,SearchBox,FileUpload,Avatar,AvatarGroup,AvatarGroupItem,Breadcrumb,BreadcrumbItem,Persona,ProgressBar,Rating,RichTextEditor,Table,TableHeader,TableBody,TableRow,TableHeaderCell,TableCell,Tabs,TabList,Tab,TabPanel,TagPicker,TagPickerOption,Toolbar,ToolbarButton,ViewCard,ColorPicker,Dialog,Drawer,Image,InfoButton,InfoLabel,Label,List,ListItem,Menu,MenuItem,MessageBar,MessageBarBody,Overflow,OverflowItem,Popover,Skeleton,Spinner,SwatchPicker,SwatchPickerRow,ColorSwatch,TeachingPopover,Text,Toast,Toaster,Tooltip,Carousel,CarouselCard,Virtualizer,Field,Divider,Nav,NavItem,Tag,TagGroup,DataGrid}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineAccordion}from"${resolve("packages/sharepoint-ui/src/elements/accordion.ts")}";import{defineTree}from"${resolve("packages/sharepoint-ui/src/elements/tree.ts")}";defineAccordion();defineTree();function Motion({visible,children}){return <div data-visible={visible}>{children}</div>}function App(){return <main><h1>Accessible component check</h1><Button>Save changes</Button><Link href="/documents">View documents</Link><Input aria-label="Search documents" defaultValue="planning"/><TextArea aria-label="Notes" defaultValue="Review the project plan"/><Checkbox label="Include archived files"/><Switch>Enable notifications</Switch><Badge color="success">Saved</Badge><Alert intent="success">Changes saved</Alert><Card><CardHeader header="Quarterly plan" description="Updated today"/></Card><Select label="Country" defaultValue="gb"><option value="gb">United Kingdom</option></Select><RadioGroup label="Billing cycle" defaultValue="monthly"><Radio value="monthly">Monthly</Radio><Radio value="annual">Annual</Radio></RadioGroup><SpinButton label="Quantity" defaultValue={2} min={0} max={10}/><Slider label="Volume" defaultValue={50}/><DatePicker label="Review date" defaultValue="2026-06-01"/><ComboBox label="Department" defaultValue="People"><ComboOption value="people">People</ComboOption><ComboOption value="finance">Finance</ComboOption></ComboBox><Dropdown label="Department menu" button={<button>Choose department</button>}><ComboOption value="people">People</ComboOption><ComboOption value="finance">Finance</ComboOption></Dropdown><SearchBox label="Search files" defaultValue="report"/><FileUpload label="Attachments"/><ColorPicker aria-label="Brand color" label="Brand color" defaultValue="#336699"/><Dialog open title="Share document"><p>Share this document with your team.</p></Dialog><Drawer type="inline" open title="Document details">Owner: Amara Okafor</Drawer><Image src="/document-preview.png" alt="Quarterly roadmap preview" width={160} height={90}/><InfoButton label="About retention" info="Documents remain available for seven years."/><InfoLabel info="This value is visible to site owners.">Retention period</InfoLabel><Label htmlFor="project-code">Project code</Label><Input id="project-code" aria-label="Project code" defaultValue="ATL-204"/><List aria-label="Recent tasks" selectionMode="single"><ListItem value="one">Review launch plan</ListItem><ListItem value="two">Update owner details</ListItem></List><Menu label="Document commands" trigger={<Button>Document commands</Button>} open><MenuItem value="open">Open</MenuItem><MenuItem value="share">Share</MenuItem></Menu><MessageBar intent="success"><MessageBarBody>Changes saved successfully.</MessageBarBody></MessageBar><Overflow aria-label="More actions" style={{width:240}} overflowContent={<Button>More actions</Button>}><OverflowItem id="edit"><Button>Edit</Button></OverflowItem><OverflowItem id="share"><Button>Share</Button></OverflowItem></Overflow><Popover label="Additional details" trigger={<Button>Details</Button>} open>Last updated today</Popover><Skeleton shape="text"/><Spinner label="Loading records"/><SwatchPicker aria-label="Accent color" defaultSelectedValue="blue"><SwatchPickerRow><ColorSwatch value="blue" color="#336699" aria-label="Blue"/><ColorSwatch value="green" color="#287d3c" aria-label="Green"/></SwatchPickerRow></SwatchPicker><TeachingPopover label="Quick tip" trigger={<Button>Quick tip</Button>} open><p>Use views to organize documents.</p></TeachingPopover><Text as="p" size={400}>Text follows the shared type ramp.</Text><Toaster aria-label="Notifications" inline><Toast title="Saved" timeout={0}>Your document is ready.</Toast></Toaster><Tooltip content="Open this document" open><Button>Open document</Button></Tooltip><Carousel label="Recent files"><CarouselCard>Roadmap.docx</CarouselCard><CarouselCard>Release notes.docx</CarouselCard></Carousel><Virtualizer label="Recent records" numItems={3} itemSize={32} virtualizerLength={3}>{index=><span>Record {index+1}</span>}</Virtualizer><Breadcrumb label="Location"><BreadcrumbItem href="/">Home</BreadcrumbItem><BreadcrumbItem current>Documents</BreadcrumbItem></Breadcrumb><Avatar name="Amara Okafor"/><AvatarGroup label="Project collaborators" maxVisible={2}><AvatarGroupItem name="Amara Okafor"/><AvatarGroupItem name="Jordan Lee"/><AvatarGroupItem name="Vilius Petrauskas"/></AvatarGroup><Persona name="Amara Okafor" secondaryText="Product owner" presence="available" presenceLabel="Available"/><ProgressBar value={0.6} label="Upload progress"/><Rating label="Priority" value={3} readOnly/><RichTextEditor label="Description" defaultValue="<p>Quarterly plan</p>"/><Table aria-label="Recent documents"><TableHeader><TableRow><TableHeaderCell>Name</TableHeaderCell><TableHeaderCell>Status</TableHeaderCell></TableRow></TableHeader><TableBody><TableRow><TableCell>Roadmap.docx</TableCell><TableCell>Ready</TableCell></TableRow></TableBody></Table><Tabs defaultSelectedValue="summary"><TabList aria-label="Document views"><Tab value="summary">Summary</Tab><Tab value="activity">Activity</Tab></TabList><TabPanel value="summary">Document summary</TabPanel><TabPanel value="activity">Recent activity</TabPanel></Tabs><TagPicker label="Owners" defaultSelectedValues={[]}><TagPickerOption value="amara">Amara Okafor</TagPickerOption></TagPicker><Field label="Project code" hint="Use the short identifier from the project register." required><Input defaultValue="ATL-204"/></Field><Divider>More controls</Divider><Nav label="Section navigation" defaultSelectedValue="overview"><NavItem value="overview">Overview</NavItem><NavItem value="documents">Documents</NavItem></Nav><TagGroup label="Applied filters"><Tag value="documents">Documents</Tag><Tag value="recent">Recently updated</Tag></TagGroup><DataGrid aria-label="Small task grid" label="Small task grid" items={[{id:"a",title:"Review roadmap"},{id:"b",title:"Approve release"}]} columns={[{id:"id",label:"ID"},{id:"title",label:"Task"}]} getRowId={item=>item.id}/><Toolbar label="Document actions"><ToolbarButton>Open</ToolbarButton><ToolbarButton>Share</ToolbarButton></Toolbar><h2>Saved views</h2><ViewCard kind="document" title="Roadmap.docx" subtitle="Modified today" description="Quarterly planning document"/><Accordion mode="single" defaultOpenItems="details"><AccordionItem value="details"><AccordionHeader>Document details</AccordionHeader><AccordionPanel><p>Owner and library information.</p></AccordionPanel></AccordionItem><AccordionItem value="sharing"><AccordionHeader>Sharing</AccordionHeader><AccordionPanel><p>People with access.</p></AccordionPanel></AccordionItem></Accordion><Tree aria-label="Document folders" items={[{id:"shared",label:"Shared documents",children:[{id:"planning",label:"Planning",children:[{id:"quarterly",label:"Quarterly reports"}]}]}]} defaultOpenItems={["shared","planning"]} collapseMotion={Motion}/></main>}createRoot(document.querySelector("#root")).render(<App/>);`,
    resolveDir: process.cwd(), sourcefile: "accessibility-tree-accordion.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => new URL(request.url, "http://localhost").pathname === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html lang='en'><head><title>Accessibility fixture</title></head><body><div id='root'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ path: resolve("node_modules/axe-core/axe.min.js") });
  await page.waitForTimeout(250); // Let toast entry motion finish before color-contrast sampling.
  const results = await page.evaluate(async () => window.axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
  }));
  if (results.violations.some(issue => issue.id === "button-name")) console.log(JSON.stringify(await page.locator("spui-combobox").last().evaluate(host => ({ hostId: host.id, label: host.getAttribute("label"), trigger: host.shadowRoot.querySelector('slot[name="button"]')?.assignedElements()[0]?.outerHTML, fallback: host.shadowRoot.querySelector('slot[name="button"]')?.querySelector("button")?.outerHTML, labelElement: host.shadowRoot.querySelector("label")?.outerHTML })), null, 2));
  const violations = results.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
  assert.deepEqual(violations, [], "no axe accessibility violations");
  assert.equal(results.incomplete.some(issue => issue.id === "target-size"), false, "all sample touch targets meet axe's 24px target-size checks");
  assert.deepEqual(pageErrors, [], "no browser errors");
  const incompleteChecks = results.incomplete.map(({ id, impact, help, nodes }) => ({ id, impact, help, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
  const ariaIdReferenceAudit = await page.evaluate(() => {
    const attributes = ["aria-controls", "aria-describedby", "aria-labelledby", "aria-owns", "aria-flowto", "aria-activedescendant", "aria-errormessage"];
    const unresolved = [];
    const visit = (root) => {
      for (const element of root.querySelectorAll("*")) {
        for (const attribute of attributes) {
          const value = element.getAttribute(attribute);
          if (!value) continue;
          for (const id of value.split(/\s+/).filter(Boolean)) {
            const scope = element.getRootNode();
            if (!(scope instanceof ShadowRoot || scope instanceof Document) || !scope.getElementById(id)) unresolved.push({ component: element.localName, attribute, id });
          }
        }
        if (element.shadowRoot) visit(element.shadowRoot);
      }
    };
    visit(document);
    return unresolved;
  });
  assert.deepEqual(ariaIdReferenceAudit, [], `every ARIA ID reference resolves in the element's own DOM root: ${JSON.stringify(ariaIdReferenceAudit)}`);
  const incompleteResolutionChecks = await page.evaluate(() => {
    const rating = document.querySelector("spui-rating");
    const ratingGroup = rating?.shadowRoot?.querySelector(".items");
    const dialogClose = document.querySelector("spui-dialog")?.shadowRoot?.querySelector(".close");
    return {
      ratingHasNamedRadioGroup: ratingGroup?.getAttribute("role") === "radiogroup" && ratingGroup.getAttribute("aria-label") === "Priority",
      ratingGlyphsAreDecorative: Boolean(ratingGroup?.querySelectorAll(".icon").length) && [...ratingGroup.querySelectorAll(".icon")].every(icon => icon.getAttribute("aria-hidden") === "true"),
      dialogCloseHasAccessibleName: dialogClose?.getAttribute("aria-label") === "Close",
    };
  });
  assert.deepEqual(incompleteResolutionChecks, { ratingHasNamedRadioGroup: true, ratingGlyphsAreDecorative: true, dialogCloseHasAccessibleName: true }, "axe-incomplete shadow content has direct semantic checks");
  const incompleteContrastSamples = await page.evaluate(() => {
    const combo = document.querySelector('spui-combobox[label="Department"]');
    const dropdown = document.querySelector('spui-combobox[label="Department menu"]');
    const rating = document.querySelector("spui-rating");
    const drawer = document.querySelector("spui-inline-drawer");
    const toast = document.querySelector("spui-toast");
    const cards = [...document.querySelectorAll("spui-carousel-card")];
    const avatars = [
      document.querySelector('spui-avatar[aria-label="Amara Okafor"][active-appearance="ring"]')?.shadowRoot?.querySelector(".initials"),
      ...[...document.querySelectorAll("spui-avatar-group-item")].map(host => {
        const avatarSlot = host.shadowRoot?.querySelector('slot[name="avatar"]');
        const avatar = avatarSlot?.assignedElements().find(element => element.localName === "spui-avatar") ?? avatarSlot?.querySelector("spui-avatar");
        return avatar?.shadowRoot?.querySelector(".initials");
      }),
      document.querySelector("spui-persona")?.shadowRoot?.querySelector(".avatar-fallback")?.shadowRoot?.querySelector(".initials"),
    ].filter(Boolean);
    const composedParent = element => {
      if (element.parentElement) return element.parentElement;
      const root = element.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    };
    const opaqueBackground = element => {
      for (let current = element; current; current = composedParent(current)) {
        const value = getComputedStyle(current).backgroundColor;
        const slashAlpha = /\/\s*([\d.]+)\s*\)$/.exec(value);
        const commaAlpha = /^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)$/.exec(value);
        const alpha = slashAlpha ? Number(slashAlpha[1]) : commaAlpha ? Number(commaAlpha[1]) : 1;
        if (alpha >= 0.999) return value;
      }
      return "rgb(255, 255, 255)";
    };
    const sample = (name, element) => element instanceof Element ? ({ name, foreground: getComputedStyle(element).color, background: opaqueBackground(element) }) : ({ name, missing: true });
    const expand = combo?.shadowRoot?.querySelector(".expand");
    const dropdownExpand = dropdown?.shadowRoot?.querySelector(".expand");
    return {
      decorativeExpand: expand?.getAttribute("aria-hidden") === "true" && dropdownExpand?.getAttribute("aria-hidden") === "true",
      text: [
        sample("combobox-label", combo?.shadowRoot?.querySelector("label")),
        sample("inline-drawer-body", drawer?.shadowRoot?.querySelector(".body")),
        sample("toast-body", toast),
        ...cards.map((card, index) => sample(`carousel-card-${index + 1}`, card)),
        ...avatars.map((avatar, index) => sample(`avatar-initials-${index + 1}`, avatar)),
      ],
      ratingGlyphs: [
        ...[...(rating?.shadowRoot?.querySelectorAll(".icon") ?? [])].map((icon, index) => sample(`rating-star-${index + 1}`, icon)),
        ...[...(rating?.shadowRoot?.querySelectorAll(".fill") ?? [])].filter(fill => fill.getBoundingClientRect().width > 0).map((fill, index) => sample(`rating-filled-star-${index + 1}`, fill)),
      ],
      expandIcons: [
        expand ? { name: "combobox-chevron", foreground: getComputedStyle(expand).color, background: opaqueBackground(combo.shadowRoot.querySelector(".control")) } : { name: "combobox-chevron", missing: true },
        dropdownExpand ? { name: "dropdown-chevron", foreground: getComputedStyle(dropdownExpand).color, background: opaqueBackground(dropdown.shadowRoot.querySelector(".control")) } : { name: "dropdown-chevron", missing: true },
      ],
    };
  });
  assert.equal(incompleteContrastSamples.decorativeExpand, true, "Combobox and Dropdown chevrons are explicitly decorative");
  assert.deepEqual(incompleteContrastSamples.text.filter(sample => sample.missing), [], "each axe-incomplete contrast target resolves to a rendered text element");
  assert.deepEqual(incompleteContrastSamples.expandIcons.filter(sample => sample.missing), [], "each axe-incomplete chevron target resolves to a rendered icon");
  const incompleteColorContrastCount = incompleteChecks.find(issue => issue.id === "color-contrast")?.nodes.length ?? 0;
  const directContrastRatios = {
    text: incompleteContrastSamples.text.map(sample => ({ name: sample.name, ratio: Number(contrastRatio(sample.foreground, sample.background).toFixed(2)) })),
    ratingGlyphs: incompleteContrastSamples.ratingGlyphs.map(sample => ({ name: sample.name, ratio: Number(contrastRatio(sample.foreground, sample.background).toFixed(2)), foreground: sample.foreground, background: sample.background })),
    expandIcons: incompleteContrastSamples.expandIcons.map(sample => ({ name: sample.name, ratio: Number(contrastRatio(sample.foreground, sample.background).toFixed(2)) })),
  };
  const directContrastTargetCount = directContrastRatios.text.length + directContrastRatios.ratingGlyphs.length + directContrastRatios.expandIcons.length;
  assert.ok(directContrastTargetCount >= incompleteColorContrastCount, "direct checks cover all axe-incomplete color-contrast targets");
  for (const [index, sample] of incompleteContrastSamples.text.entries()) {
    assert.ok(directContrastRatios.text[index].ratio >= 4.5, `${sample.name} contrast is below 4.5:1: ${JSON.stringify(sample)}`);
  }
  for (const sample of directContrastRatios.ratingGlyphs) {
    assert.ok(sample.ratio >= 3, `${sample.name} graphical contrast is below 3:1: ${JSON.stringify(sample)}`);
  }
  for (const sample of directContrastRatios.expandIcons) {
    assert.ok(sample.ratio >= 3, `${sample.name} decorative contrast is below 3:1: ${JSON.stringify(sample)}`);
  }
  const targetDiagnostics = await page.locator("spui-spin-button").evaluateAll(nodes => nodes.flatMap(host => [...host.shadowRoot.querySelectorAll("button")].map(button => ({ label: button.getAttribute("aria-label"), box: button.getBoundingClientRect().toJSON() }))));
  const report = { status: "passed", engine: "axe-core", familyCount: families.length, families, violations, incompleteChecks, ariaIdReferenceAudit, incompleteResolutionChecks, incompleteContrastSamples, directContrastRatios, targetDiagnostics, pageErrors };
  await mkdir("test-results/accessibility", { recursive: true });
  await writeFile("test-results/accessibility/fluent-family-fixture.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ status: report.status, engine: report.engine, familyCount: report.familyCount, violationCount: violations.length, incompleteRuleCounts: Object.fromEntries([...new Set(incompleteChecks.map(issue => issue.id))].map(id => [id, incompleteChecks.filter(issue => issue.id === id).reduce((sum, issue) => sum + issue.nodes.length, 0)])), directlyMeasuredContrastTargets: directContrastTargetCount, axeIncompleteContrastTargets: incompleteColorContrastCount, minimumDirectTextContrast: Math.min(...directContrastRatios.text.map(sample => sample.ratio)), minimumDirectNonTextContrast: Math.min(...directContrastRatios.ratingGlyphs.concat(directContrastRatios.expandIcons).map(sample => sample.ratio)), pageErrors: pageErrors.length, report: "test-results/accessibility/fluent-family-fixture.json" }, null, 2));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
