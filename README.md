# SharePoint UI

A framework-independent, host-aware UI library for SharePoint Framework. Custom elements own rendering and behavior; optional React wrappers register only the elements used. React is not required by the core.

## Build

```sh
npm install
npm run setup:spfx
npm run build:spfx
```

Build the Astro documentation site locally with `npm run build:docs`. Pushes to `main` automatically build and deploy it to [GitHub Pages](https://vystartasv.github.io/sharepoint-ui/).

Before packaging a new tenant checkpoint, run `npm run version:spfx:patch` to advance the SPFx web-part package, solution, feature, and lockfile versions together. The dry-run and artifact report also show the independent UI library version so the four version numbers are easy to distinguish.

For a repeatable checkpoint, preview version changes with `npm run version:spfx:dry-run`, then bump and run `npm run build:spfx:measured`. It builds once and reports the hashed web-part bundle's raw/gzip/Brotli sizes plus the `.sppkg` size. Measure selected component imports with `npm run measure:component -- DataGrid DataGridBody DataGridCell`. Run `npm run verify:data-grid-parity` to compile the library once, then execute the composed and virtualized DataGrid browser checks.

The demo uses React 18.3.1, SPFx 1.24.0, Node 22, TypeScript 5.8, and the Heft build rig. It includes buttons, text inputs, checkboxes, switches, text areas, cards, badges, message bars, and spinners, with a live LTR/RTL and locale toggle.

## A focused payload advantage

The framework-free custom-element path keeps small SharePoint and Copilot surfaces lightweight. In a minified, tree-shaken comparison of Button, Input, Card, and Tag imports, the custom-element bundle was 11.6 KB gzip versus 44.4 KB for Fluent UI React 9.75. The React adapters measured 23.6 KB. These are component JavaScript slices, not complete-app or render-speed benchmarks. Reproduce the comparison with `npm run benchmark:no-react-payload`; see the [payload benchmark notes](docs-site/src/content/docs/guides/payload.mdx).


## Use selected components

Import only the React components the web part renders. Package metadata marks modules side-effect free, and each custom-element definition lives in a leaf module so production bundlers can discard unused families.

```tsx
import { Button, Checkbox, Drawer, Menu, MenuItem, TextArea } from "@spfx-fast/sharepoint-ui/react";

<Button variant="primary">Save</Button>
<Checkbox checked={enabled} onCheckedChange={setEnabled}>Enable alerts</Checkbox>
<TextArea label="Summary" value={summary} onValueChange={setSummary} />
<Menu label="Workspace actions" trigger={<Button>Actions</Button>} onSelect={handleAction}>
  <MenuItem value="open">Open workspace</MenuItem>
  <MenuItem kind="checkbox" checked={archived} onCheckedChange={setArchived}>Show archived</MenuItem>
</Menu>
<Drawer open={detailsOpen} title="Workspace details" position="end" onOpenChange={setDetailsOpen}>
  <p>Review library ownership and sharing settings.</p>
</Drawer>
```

For framework-free use, register only a selected custom element:

```ts
import { defineButton } from "@spfx-fast/sharepoint-ui/elements/button";
defineButton();
```

```html
<spui-button variant="primary">Save</spui-button>
```

## Theme, fonts, and appearance

`applySharePointTheme()` forwards every enumerable classic SPFx palette and semantic color, plus each Fluent v9 theme token from `ThemeProvider.tryGetThemeV2()`. The forwarding has no fixed token allowlist.

The React provider supports `fluent`, `ios`, `windows`, `linux`, and `glass` appearance presets, language/direction, localized strings, and custom `--spui-*` tokens. Fluent is the default for SharePoint. Any component can also be customized with CSS variables, a host `className`/`style`, or named shadow parts such as `spui-button::part(control)`.

The iOS appearance includes adaptive light/dark system colors, SF system-font fallbacks, touch-size controls, grouped surfaces, separators, and spacious cards. Glass composes over the selected base appearance: it derives translucent surfaces, borders, hover/status colors, accent blends, blur, and spacing from the base tokens. Card padding, control padding, and gaps scale by 1.12; control height scales by 1.04. To change the glass starting density, pass a `--spui-base-*` dimension such as `--spui-base-card-padding`; glass scales that starting value. For a direct finished-value override, use the corresponding `--spui-card-padding` or `--spui-control-*` token. Base color overrides such as `--spui-ui-accent` flow into the glass accent and hover calculations. Glass surfaces use a theme-derived 88% base tint; the SPFx tenant demo passed 90 theme/appearance/strong-background combinations at minimum 5.16:1 body-text and 4.52:1 action-label contrast.

```tsx
<SharePointUIProvider
  appearance="glass"
  baseAppearance="ios"
  lang="ar"
  dir="rtl"
  strings={{ loading: "جارٍ التحميل" }}
  tokens={{
    "--spui-font-family": '"Atkinson Hyperlegible", sans-serif',
    "--spui-ui-accent": "#bf3b8d",
    "--spui-base-card-padding": "24px",
  }}
>
  {children}
</SharePointUIProvider>
```

## Compose a SharePoint record card

`ViewCard` provides consistent document, person, task, approval, and list-item structure. Replace the example fields with list or Graph data, add metadata and actions through slots, and style individual parts without copying the component.

```tsx
<ViewCard kind="document" title={file.name} subtitle={file.modifiedLabel} description={file.summary}>
  <FileIcon slot="leading" aria-hidden="true" />
  <span slot="eyebrow">{file.libraryName}</span>
  <Badge slot="status">{file.status}</Badge>
  <span>{file.sizeLabel} · {file.ownerName}</span>
  <Button slot="actions" onClick={() => openFile(file.url)}>Open file</Button>
</ViewCard>
```

The custom-element equivalent is `spui-view-card` with the same attributes and named slots. See the [SPFx template](templates/sharepoint-ui-webpart/README.md) for an English/Arabic, locale-aware record-card example.

## Dialog

`Dialog` wraps the native `<dialog>` element, so modal focus handling and Escape behavior use the browser implementation. Give it a title or `aria-label`; provide actions through the `actions` prop. `onOpenChange` receives Escape, close-button, and caller-driven dismissal.

```tsx
<Dialog
  open={confirming}
  title="Confirm changes"
  onOpenChange={setConfirming}
  actions={<>
    <Button onClick={() => setConfirming(false)}>Cancel</Button>
    <Button variant="primary" onClick={save}>Confirm</Button>
  </>}
>
  Save these changes to the SharePoint list?
</Dialog>
```

For framework-free use, register `defineDialog()` and use `<spui-dialog open title="Confirm changes">…</spui-dialog>`. Translate the `close-label` attribute and supply `lang`/`dir` through the host or provider.

## Progress

`ProgressBar` uses the browser's native `<progress>` element for accessible determinate or indeterminate status. Give it a useful label; omit `value` to show indeterminate progress.

```tsx
<ProgressBar value={completedItems} max={totalItems} label="Loading documents" />
<ProgressBar label="Loading documents" />
```

The custom-element API is `<spui-progress-bar value="64" max="100" label="Reviewing list data">`; remove `value` for indeterminate progress.

Use the same `lang`, `dir`, `data-spui-appearance`, and custom properties on a host ancestor when using custom elements directly. The component APIs accept caller-provided labels and content so applications own translations.

## Use the custom SPFx CLI template

With the current Microsoft SPFx CLI:

```sh
spfx create \
  --template sharepoint-ui-webpart \
  --template-url https://github.com/vystartasv/sharepoint-ui/tree/main \
  --library-name my-sharepoint-app \
  --component-name "My SharePoint App" \
  --component-description "My SharePoint experience"
```

The generated app depends on `@spfx-fast/sharepoint-ui@^0.4.2`.

For a no-React Microsoft 365 Copilot UX component, use the framework-free access-review template:

```sh
npx --yes @microsoft/spfx-cli@0.1.0-pre.3 create \
  --template spfx-fast-copilot-access-review \
  --template-url https://github.com/vystartasv/sharepoint-ui/tree/main \
  --library-name spfx-fast-access-review \
  --component-name "Access review" \
  --component-description "Review SharePoint access items in Copilot" \
  --solution-name spfx-fast-access-review \
  --package-manager npm
```

The generated Copilot app reads and updates a SharePoint list, inherits tenant theme tokens, follows the current locale's text direction, and syncs visible state with Copilot. See [the template setup](templates/README.md) for local use and the current CLI category limitation.

## Theme contract

`applySharePointTheme()` forwards every enumerable classic SPFx palette and semantic color value. It also forwards every Fluent UI v9 token provided by SPFx `ThemeProvider.tryGetThemeV2()`. The prototype does not maintain a hand-curated allowlist.

## Parity status

This is still a partial behavioral implementation, not complete Fluent v9 parity. The 51-family named-API check currently finds local exports for all families; it checks names only, not behavior, accessibility, theming, documentation, or performance. RichTextEditor and FileUpload are SharePoint additions. Track the component-level gaps and release gates in [FLUENT-V9-PARITY-PLAN.md](investigation/FLUENT-V9-PARITY-PLAN.md). Tenant-specific pages and screenshots are kept in local validation artifacts and are not published with the source.

Run `npm run parity:check` to fail on catalog drift or candidate Fluent 9.75 component-name, own-prop, slot-prop, literal-value, and callback-payload gaps. This is a contract regression gate; it does not prove runtime behavior or accessibility.

### Native Select

The Select adapter keeps the browser's native option list and keyboard selection while adding a theme-aware label and a stable `spui-change` event. Its custom element is form-associated where the browser supports `ElementInternals`.

```tsx
<Select label="Record type" name="recordType" value={type} onValueChange={setType}>
  <option value="document">Document</option>
  <option value="person">Person</option>
  <option value="task">Task</option>
</Select>
```

The framework-independent form is `<spui-select label="Record type" name="recordType"><option value="document">Document</option></spui-select>`; set `value`, `required`, and `disabled` on the host as needed. Native select type-to-select keyboard behavior and selection passed on the published SPFx page.

### Popover

`Popover` supplies a non-modal, theme-derived surface in the browser top layer. Give the trigger an accessible button label and the popover a `label`; Escape and outside pointer interaction close it, and Escape returns focus to the trigger. The React adapter accepts a ready-to-use trigger element and content:

```tsx
<Popover label="Workspace actions" trigger={<Button>More actions</Button>} onOpenChange={(_event, data) => setOpen(data.open)}>
  <p>Manage sharing settings for this view.</p>
  <Button data-spui-popover-close>Close</Button>
</Popover>
```

For custom elements, place the trigger in `slot="trigger"`, content in `slot="content"`, and an optional heading in `slot="title"`. Set `placement="top|bottom|start|end"`; logical sides follow the inherited or explicit `dir`, including RTL. Customize the panel with `--spui-popover-background`, `--spui-popover-border`, `--spui-popover-color`, `--spui-popover-radius`, and `--spui-popover-shadow`, or `spui-popover::part(surface)`.

### Native RadioGroup

`RadioGroup` uses one native radio group with a fieldset and legend, so arrow-key navigation, checked state, and individual labels come from the browser. Options stay composable as `Radio` children.

```tsx
<RadioGroup label="Priority" name="priority" value={priority} onValueChange={setPriority}>
  <Radio value="low">Low</Radio>
  <Radio value="normal">Normal</Radio>
  <Radio value="urgent">Urgent</Radio>
</RadioGroup>
```

The custom-element form is `<spui-radio-group label="Priority" name="priority"><spui-radio-option value="low">Low</spui-radio-option></spui-radio-group>`. `required`, `disabled`, `orientation="horizontal"`, and controlled `value` are supported. The tenant check verified arrow-key selection, required invalid/valid states, FormData submission, and reset to the initial unchecked state.

### Native SpinButton

`SpinButton` wraps a native number input and forwards `min`, `max`, and `step`, keeping numeric keyboard increments and browser validity. Its React value is numeric; clearing the field reports `undefined`.

```tsx
<SpinButton label="Days remaining" value={days} min={0} max={30} step={1} onValueChange={next => setDays(next ?? 0)} />
```

Use `<spui-spin-button label="Days remaining" value="4" min="0" max="30" step="1">` without React. The custom element is form-associated where `ElementInternals` is available.

### Native SpinButton

`SpinButton` wraps a native number input and forwards `min`, `max`, and `step`, keeping numeric keyboard increments and browser validity. Its React value is numeric; clearing the field reports `undefined`.

```tsx
<SpinButton label="Days remaining" value={days} min={0} max={30} step={1} onValueChange={next => setDays(next ?? 0)} />
```

Use `<spui-spin-button label="Days remaining" value="4" min="0" max="30" step="1">` without React. The custom element is form-associated where `ElementInternals` is available. Tenant checks covered ArrowUp, numeric value updates, and all three constraints.

### Native Slider

`Slider` wraps a native range input with a visible label, optional value text, and theme-derived accent/focus colors. Arrow keys and touch/pointer input retain browser behavior.

```tsx
<Slider label="Completion" value={completion} min={0} max={100} step={5} valueText={`${completion}%`} onValueChange={setCompletion} />
```

The custom-element API is `<spui-slider label="Completion" value="60" min="0" max="100" step="5" aria-valuetext="60%">`.

### Native DatePicker

`DatePicker` wraps the browser's native date input with SharePoint tokens, a visible accessible label, ISO `YYYY-MM-DD` values, min/max bounds and form association. The calendar picker follows the browser and operating system locale.

```tsx
<DatePicker label="Review date" value={date} min="2026-01-01" max="2027-12-31" onValueChange={setDate} />
```

Use `<spui-date-picker label="Review date" value="2026-11-01" min="2026-01-01" max="2027-12-31">` without React.

### Combobox

`ComboBox` combines a labeled text input with a filtered listbox. Arrow keys move the active option, Enter selects it, and Escape closes the list and restores the committed selection. Keep display text (`value`) separate from the submitted option key (`selectedValue`); `allowFreeform` submits the typed text instead when no option is selected.

```tsx
<ComboBox label="Assignee" value={name} selectedValue={personId} required onValueChange={setName} onOptionSelect={(_name, id) => setPersonId(id)}>
  <ComboOption value="amara">Amara Okafor</ComboOption>
  <ComboOption value="lionel">Lionel Mensah</ComboOption>
</ComboBox>
```

The custom-element form is `<spui-combobox label="Assignee"><spui-combobox-option value="amara">Amara Okafor</spui-combobox-option></spui-combobox>`. It exposes the active descendant, expanded state, selected option, localized empty result, and native custom-element form value.

### RichTextEditor (SharePoint addition)

`RichTextEditor` provides a labeled formatting toolbar with roving arrow-key focus, undo/redo, emphasis, lists, safe links, and table insertion. It emits normalized HTML through `onValueChange`; its custom element is form-associated where supported and supports read-only state. Paste is sanitized while preserving supported table structure, emphasis, headings, and links. Unknown tags and attributes are removed. It is a lightweight editor, not a collaborative document-authoring engine; inline images need a SharePoint asset-persistence contract before they can be safely added.

```tsx
<RichTextEditor label="Notes" value={html} onValueChange={setHtml} required />
```

The SPFx lab stores normalized HTML in the `Body` rich-text field of a dedicated `SharePoint UI Rich Text Tests` list, reloads the latest item, and verifies save by reading the item back. Its editor labels are supplied through `SharePointUIProvider` strings, including Arabic defaults in the lab. The published tenant page passed save/readback and unsafe-markup checks.


## External field guides

- [SPFx Agent Workflow](products/spfx-agent-workflow/README.md)
- [SharePoint Deployment Field Guide](products/sharepoint-deployment-field-guide/README.md)

## Contributing

The repository is currently private. See [CONTRIBUTING.md](CONTRIBUTING.md) for access and contribution guidance.
