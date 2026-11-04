import { useState } from "react";
import {
  Accordion, Alert, AttachmentList, Avatar, AvatarGroup, Badge, Breadcrumb, Button, ButtonGroup,
  Card, Carousel, Checkbox, ComboBox, CommandBar, CopyButton, DataGrid, DateRangePicker,
  Dialog, Divider, Drawer, EmptyState, Field, FileDropzone, FilterBar, Image, Input, Label,
  Link, List, ListView, LookupPicker, Menu, Nav, Pagination, PersonPicker, Persona, Popover,
  ProgressBar, Radio, RadioGroup, Rating, Select, SharePointField, SharePointThemeProvider,
  Skeleton, Spinner, SwatchPicker, Switch, Table, Tabs, Tag, TagGroup, TagPicker, Text,
  TextArea, Toast, Tree, ViewCard, ViewSwitcher, VirtualList,
} from "@spfx-fast/sharepoint-ui/react";
import "./component-playground.css";

type Row = { id: string; title: string; owner: string; status: string };

const rows: Row[] = [
  { id: "1", title: "Review access", owner: "Avery Chen", status: "Open" },
  { id: "2", title: "Update site", owner: "Jordan Lee", status: "In progress" },
  { id: "3", title: "Publish guidance", owner: "Sam Rivera", status: "Done" },
];
const columns = [
  { key: "title", label: "Request", sortable: true },
  { key: "owner", label: "Owner" },
  { key: "status", label: "Status" },
] as const;
const people = [
  { value: "avery", name: "Avery Chen", detail: "Site owner" },
  { value: "jordan", name: "Jordan Lee", detail: "Member" },
];
const lookups = [
  { id: "policies", label: "Policies" },
  { id: "requests", label: "Requests" },
];
const listItems = ["Access review", "Team site update", "New guidance", "Owner changes"];
const sourceFiles: Record<string, string> = {
  ComboBox: "combobox",
  TextArea: "textarea",
  SharePointField: "sharepoint-field",
};

function Demo({ name, notify }: { name: string; notify: (message: string) => void }) {
  const [checked, setChecked] = useState(true);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("summary");
  const [view, setView] = useState("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState([
    { id: "brief", name: "Project brief.pdf", status: "uploaded" as const },
    { id: "notes", name: "Review notes.docx", status: "uploading" as const, progress: 68 },
  ]);
  const [filter, setFilter] = useState("");
  const [rating, setRating] = useState("3");
  const [selectedIds, setSelectedIds] = useState<string[]>(["1"]);
  const [selected, setSelected] = useState("avery");
  const [choice, setChoice] = useState("Blue");

  switch (name) {
    case "Accordion": return <Accordion items={[
      { id: "details", label: "What is included?", content: "A small, controlled React component." },
      { id: "customize", label: "Can I customize it?", content: "Yes. Use native props and CSS tokens." },
    ]} />;
    case "Alert": return <Alert role="status">Your changes are saved.</Alert>;
    case "AttachmentList": return <AttachmentList label="Project attachments" items={attachments} onRemove={id => setAttachments(items => items.filter(item => item.id !== id))} />;
    case "Avatar": return <Avatar name="Avery Chen" />;
    case "AvatarGroup": return <AvatarGroup label="Project team" maxVisible={2} people={[
      { id: "avery", name: "Avery Chen" }, { id: "jordan", name: "Jordan Lee" }, { id: "sam", name: "Sam Rivera" },
    ]} />;
    case "Badge": return <Badge>Needs review</Badge>;
    case "Breadcrumb": return <Breadcrumb label="Page location" items={[
      { label: "Home", href: "/sharepoint-ui/" }, { label: "Requests", href: "/sharepoint-ui/components/" }, { label: "Access review" },
    ]} />;
    case "Button": return <Button onClick={() => notify("Save action selected.")}>Save changes</Button>;
    case "ButtonGroup": return <ButtonGroup label="Text formatting"><Button onClick={() => notify("Bold selected.")}>Bold</Button><Button onClick={() => notify("Italic selected.")}>Italic</Button></ButtonGroup>;
    case "Card": return <Card><h3>Access review</h3><p>Three requests are waiting for an owner.</p><Button onClick={() => notify("Requests opened.")}>View requests</Button></Card>;
    case "Carousel": return <Carousel label="Project updates" items={[
      { id: "one", label: "Update one", content: <p>Site structure approved.</p> },
      { id: "two", label: "Update two", content: <p>Owners have been notified.</p> },
    ]} />;
    case "Checkbox": return <label className="playground-inline"><Checkbox checked={checked} onChange={event => setChecked(event.currentTarget.checked)} /> Notify the owner</label>;
    case "ComboBox": return <label className="playground-control">Choose a site<ComboBox id="demo-site" options={[{ value: "Marketing" }, { value: "Operations" }, { value: "Research" }]} placeholder="Type or choose" /></label>;
    case "CommandBar": return <CommandBar label="Request commands"><Button onClick={() => notify("New request selected.")}>New request</Button><Button onClick={() => notify("Export selected.")}>Export</Button></CommandBar>;
    case "CopyButton": return <CopyButton value="https://contoso.sharepoint.com/sites/team">Copy page link</CopyButton>;
    case "DataGrid": return <DataGrid<Row> label="Open requests" caption="Three example requests" rows={rows} columns={columns} getRowId={row => row.id} rowLabel={row => row.title} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} />;
    case "DateRangePicker": return <DateRangePicker id="demo-range" label="Review period" startProps={{ defaultValue: "2026-11-01" }} endProps={{ defaultValue: "2026-11-30" }} />;
    case "Dialog": return <><Button onClick={() => setDialogOpen(true)}>Review changes</Button><Dialog open={dialogOpen} title="Apply these changes?" onOpenChange={setDialogOpen}><p>This native dialog keeps focus on the decision.</p><Button onClick={() => setDialogOpen(false)}>Apply changes</Button></Dialog></>;
    case "Divider": return <><Text>Team workspace</Text><Divider /><Text>Updated just now</Text></>;
    case "Drawer": return <><Button onClick={() => setDrawerOpen(true)}>Open details</Button><Drawer open={drawerOpen} title="Request details" placement="end" onOpenChange={setDrawerOpen}><p>Owner: Avery Chen</p><Button onClick={() => setDrawerOpen(false)}>Done</Button></Drawer></>;
    case "EmptyState": return <EmptyState title="No requests yet" description="Create a request to start tracking work."><Button onClick={() => notify("Create request selected.")}>Create request</Button></EmptyState>;
    case "Field": return <Field id="demo-field" label="Workspace name" hint="Use a short name." required><Input placeholder="Operations" required /></Field>;
    case "FileDropzone": return <><FileDropzone id="demo-files" label="Supporting files" hint="Choose or drop PDF files." accept=".pdf" multiple files={files} onFiles={setFiles} /><p role="status">{files.length ? `${files.length} file${files.length === 1 ? "" : "s"} selected.` : "No files selected."}</p></>;
    case "FilterBar": return <FilterBar label="Request filters" activeFilterCount={filter ? 1 : 0} onClear={() => setFilter("")}><label className="playground-control">Search requests<Input type="search" value={filter} onChange={event => setFilter(event.currentTarget.value)} placeholder="Search" /></label></FilterBar>;
    case "Image": return <Image src="/sharepoint-ui/favicon.svg" alt="SharePoint UI mark" width={48} height={48} />;
    case "Input": return <label className="playground-control">Search requests<Input type="search" placeholder="Search requests" /></label>;
    case "Label": return <><Label htmlFor="demo-labelled-input">Workspace name</Label><Input id="demo-labelled-input" placeholder="Operations" /></>;
    case "Link": return <Link href="/sharepoint-ui/components/">Open the component catalog</Link>;
    case "List": return <List aria-label="Recent work items">{listItems.slice(0, 3).map(item => <li key={item}>{item}</li>)}</List>;
    case "ListView": return <ListView<Row> label="Open requests" rows={rows} columns={columns} getRowId={row => row.id} rowLabel={row => row.title} emptyTitle="No requests" page={{ currentPage: page, totalPages: 3, onPageChange: setPage }} />;
    case "LookupPicker": return <LookupPicker id="demo-lookup" label="Related list" options={lookups} placeholder="Choose a list" />;
    case "Menu": return <Menu label="Request actions"><Button onClick={() => notify("Edit selected.")}>Edit request</Button><Button onClick={() => notify("Archive selected.")}>Archive</Button></Menu>;
    case "Nav": return <Nav label="Workspace sections" items={[
      { id: "overview", label: "Overview", href: "/sharepoint-ui/", current: true },
      { id: "requests", label: "Requests", href: "/sharepoint-ui/components/" },
      { id: "settings", label: "Settings", href: "/sharepoint-ui/theming/" },
    ]} />;
    case "Pagination": return <Pagination label="Request pages" currentPage={page} totalPages={4} onPageChange={setPage} />;
    case "PersonPicker": return <PersonPicker id="demo-person" label="Request owner" options={people} placeholder="Choose a person" />;
    case "Persona": return <Persona name="Avery Chen" description="Site owner" />;
    case "Popover": return <Popover label="More about this request"><p>Requests are reviewed by the assigned site owner.</p></Popover>;
    case "ProgressBar": return <ProgressBar label="Upload progress" value={68} max={100} />;
    case "Radio": return <label className="playground-inline"><Radio name="demo-radio" value="email" defaultChecked /> Email updates</label>;
    case "RadioGroup": return <RadioGroup label="Notification frequency"><label className="playground-inline"><Radio name="frequency" value="daily" defaultChecked /> Daily</label><label className="playground-inline"><Radio name="frequency" value="weekly" /> Weekly</label></RadioGroup>;
    case "Rating": return <Rating label="Rate this request" min={1} max={5} value={rating} onChange={event => setRating(event.currentTarget.value)} />;
    case "Select": return <label className="playground-control">Request status<Select defaultValue="open"><option value="open">Open</option><option value="progress">In progress</option><option value="done">Done</option></Select></label>;
    case "SharePointField": return <SharePointField name="priority" label="Priority" type="choice" choices={["Low", "Normal", "High"]} value={choice} onValueChange={value => typeof value === "string" && setChoice(value)} />;
    case "Skeleton": return <div className="playground-stack" aria-label="Loading request preview"><Skeleton width="55%" height="1rem" /><Skeleton width="90%" height=".75rem" /><Skeleton width="75%" height=".75rem" /></div>;
    case "Spinner": return <Spinner label="Saving request" />;
    case "SwatchPicker": return <SwatchPicker name="theme-color" label="Accent color" value={choice} onChange={event => setChoice(event.currentTarget.value)} options={[{ value: "Blue", label: "Blue", color: "#0f6cbd" }, { value: "Green", label: "Green", color: "#107c10" }, { value: "Purple", label: "Purple", color: "#8764b8" }]} />;
    case "Switch": return <label className="playground-inline"><Switch checked={checked} onChange={event => setChecked(event.currentTarget.checked)} /> Enable notifications</label>;
    case "Table": return <Table caption="Request owners"><thead><tr><th scope="col">Request</th><th scope="col">Owner</th></tr></thead><tbody><tr><td>Access review</td><td>Avery Chen</td></tr><tr><td>Site update</td><td>Jordan Lee</td></tr></tbody></Table>;
    case "Tabs": return <Tabs label="Request details" value={tab} onValueChange={setTab} items={[
      { id: "summary", label: "Summary", content: <p>Three requests need attention.</p> },
      { id: "owners", label: "Owners", content: <p>Avery Chen and Jordan Lee.</p> },
    ]} />;
    case "Tag": return <Tag onRemove={() => notify("Review tag removed.")}>Needs review</Tag>;
    case "TagGroup": return <TagGroup label="Request labels"><Tag>Access</Tag><Tag>Priority</Tag><Tag>Open</Tag></TagGroup>;
    case "TagPicker": return <TagPicker id="demo-tags" label="Request tags" size={3} defaultValue="access" options={[{ value: "access", label: "Access" }, { value: "content", label: "Content" }, { value: "priority", label: "Priority" }]} />;
    case "Text": return <Text as="p">A short description of this workspace request.</Text>;
    case "TextArea": return <label className="playground-control">Request details<TextArea rows={3} defaultValue="Review site access for the new team." /></label>;
    case "Toast": return <div className="playground-stack"><Button onClick={() => setToastOpen(true)}>Show toast</Button><Toast open={toastOpen} message="Your changes are saved." onDismiss={() => setToastOpen(false)} /></div>;
    case "Tree": return <Tree label="Site contents" items={[
      { id: "documents", label: "Documents", defaultOpen: true, children: [{ id: "guides", label: "Guides", href: "/sharepoint-ui/agents/" }, { id: "reports", label: "Reports", href: "/sharepoint-ui/deployment/" }] },
      { id: "pages", label: "Pages", href: "/sharepoint-ui/components/" },
    ]} />;
    case "ViewCard": return <ViewCard title="Access review" subtitle="Updated today" description="Review members with access to this site."><Button onClick={() => notify("Access review opened.")}>Open review</Button></ViewCard>;
    case "ViewSwitcher": return <ViewSwitcher label="Request layout" value={view} views={[{ value: "list", label: "List" }, { value: "cards", label: "Cards" }]} onChange={setView} />;
    case "VirtualList": return <VirtualList label="Recent work items" items={listItems} itemHeight={40} height={160} getItemKey={(item, index) => `${index}-${item}`} renderItem={item => <span>{item}</span>} />;
    default: return <p>This component does not have a playground example yet.</p>;
  }
}

export function ComponentPlayground({ name, summary }: { name: string; summary: string }) {
  const [accent, setAccent] = useState("#0f6cbd");
  const [radius, setRadius] = useState(4);
  const [disabled, setDisabled] = useState(false);
  const [message, setMessage] = useState("Interact with the component preview.");
  const [resetKey, setResetKey] = useState(0);
  const slug = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

  return <SharePointThemeProvider theme={{ accent, radius: `${radius}px` }}>
    <section className="component-playground" aria-label={`${name} playground`}>
      <div className="playground-toolbar" aria-label="Playground settings">
        <label>Accent <input type="color" value={accent} onChange={event => setAccent(event.currentTarget.value)} /></label>
        <label>Radius <input type="range" min="0" max="12" value={radius} onChange={event => setRadius(Number(event.currentTarget.value))} /><output>{radius}px</output></label>
        <label className="playground-inline"><input type="checkbox" checked={disabled} onChange={event => setDisabled(event.currentTarget.checked)} /> Disable controls</label>
        <button type="button" onClick={() => { setResetKey(key => key + 1); setMessage("Preview reset."); }}>Reset example</button>
      </div>

      <div className={`playground-canvas${disabled ? " is-disabled" : ""}`}>
        <fieldset disabled={disabled} key={resetKey}>
          <legend className="playground-sr-only">Live {name} example</legend>
          <Demo name={name} notify={setMessage} />
        </fieldset>
      </div>
      <p className="playground-status" role="status" aria-live="polite">{message}</p>

      <div className="playground-meta">
        <p>{summary}</p>
        <p><code>{`import { ${name} } from "@spfx-fast/sharepoint-ui/react";`}</code></p>
        <a href={`https://github.com/vystartasv/sharepoint-ui/blob/main/packages/sharepoint-ui/src/${sourceFiles[name] ?? slug}.tsx`}>View source</a>
      </div>
    </section>
  </SharePointThemeProvider>;
}
