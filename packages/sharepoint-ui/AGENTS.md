# Agent guide for SharePoint UI

Use this page as the short route from a SharePoint task to a working component. The library is designed for SPFx 1.24 and React 18, but its custom elements can be used without React.

For the predictable cross-component pattern and copy-ready Tooltip/Persona composition, start with [`QUICKSTART.md`](./QUICKSTART.md). Component pages and their linked JSON slices supply the exact component-specific props, slots, and callback signatures.

## Pick the smallest entry point

- In an SPFx React web part, import the React adapter from `@spfx-fast/sharepoint-ui/react` and import only the components used.
- In plain HTML or another framework, import a leaf definition such as `@spfx-fast/sharepoint-ui/elements/button`, then call `defineButton()` once. For native form labels, use `createLabel()` from `@spfx-fast/sharepoint-ui/elements/label`; it returns a real `<label>` so `htmlFor`/`for` association works.
- `defineSharePointUIElements()` registers the full current catalog; use it only when the whole catalog is needed.
- Set `brandColor` in `SharePointUIProvider` theme data to derive matching accent, focus, selection, surface, hover, and border tokens. Explicit design tokens override the derived values; the theme API also has a framework-free `@spfx-fast/sharepoint-ui/theme` entry point.

For temporary feedback, mount one `Toaster` near the app root and dispatch from descendants with `useToastController()`. For a controller outside the Toaster subtree or when an app has multiple toast regions, set `toasterId` on the target Toaster and pass the same ID to `useToastController(toasterId)`. The controller supports both `updateToast(id, update)` and Fluent's `updateToast({ toastId, content, ...options })` form. Use a permanent status surface as well when the information must remain available after the toast expires.

```tsx
import { Button, Toaster, useToastController } from "@spfx-fast/sharepoint-ui/react";

function SaveButton() {
  const { dispatchToast } = useToastController();
  return <Button onClick={() => dispatchToast("Your changes are available.", { title: "Saved", intent: "success" })}>Save</Button>;
}

<Toaster><SaveButton /></Toaster>
```

For framework-neutral use, import `defineToaster` from `@spfx-fast/sharepoint-ui/elements/toaster`, call it once, then use `toaster.show({ title, body, intent })`; retain the returned ID for `update(id, options)`, `dismiss(id)`, `pause(id)`, and `play(id)`. Toasts default to a 3-second timeout and continue timing while hovered or while the browser window is unfocused; `timeout: 0` or `timeout: -1` keeps a toast open until it is dismissed. The React controller exposes `pauseToast(id)` and `playToast(id)`. Focusing any toast pauses the region's timers, ArrowUp/ArrowDown moves through visible toasts, Delete dismisses the focused toast, and Escape dismisses the focused or newest toast. Keep important notifications on a persistent surface after the toast closes.

The Toaster provides one polite and one assertive live region and serializes announcements; assertive messages take priority over pending polite messages. New announcements are ignored while focus is inside the Toaster. Individual Toast elements are groups, not live regions.

Compose a nested `Menu` inside its parent menu's children and use a `MenuItem` as its trigger. The parent treats that trigger as one item; the forward arrow opens the child (Right in LTR, Left in RTL), and the backward arrow closes it and restores focus to its trigger. Selecting a child command closes the menu hierarchy.

For desktop-style command navigation, place top-level `Menu` components inside `MenuBar` and use `MenuBarItem` as each trigger. MenuBar handles one Tab stop, Home/End, LTR/RTL horizontal focus, and closes sibling menus when another opens. `Menu` handles vertical menu navigation, nested submenus, Escape, and command selection.

Use `ContextMenu` for commands attached to a surface: right-click its trigger, or focus the trigger and press the Context Menu key or Shift+F10. It opens at the pointer or target edge, moves focus into the menu, and restores focus on Escape. Plain HTML and other framework consumers can add the `context-menu` attribute to `spui-menu`.

Use `SearchBox` for a free-form query, not `ComboBox` when users are choosing from suggestions. It supports controlled `value` or initial `defaultValue`, `onValueChange`, Enter submission through `onSearch`, and a localized clear button. The custom element participates in form value/reset and required validation.

Use `Nav` for app destinations: `NavItem` and `NavSubItem` preserve native anchor navigation when given `href`; `NavCategoryItem` only expands/collapses its category. Any of these accepts an `Avatar` through `avatar={<Avatar name="Team" image={photoUrl} size={28} />}`; the React adapter marks it decorative so the item text stays the accessible name. Direct custom elements use `slot="avatar"` and should mark the Avatar `decorative`. Keep destination activation and category disclosure separate. `selectedValue`/`openCategories` are controlled; use `defaultSelectedValue`/`defaultOpenCategories` for initial state. `multiple` allows several categories open. Items follow normal Tab and native Enter/Space behavior. At 640px and below Nav becomes a 44px menu button with a theme-derived drawer at the logical start; Escape, outside click, and destination selection dismiss it. Use controlled `open`/`onOpenChange` or `defaultOpen`, and localize `openLabel`/`closeLabel` or provider strings `navigationMenu`/`navigationClose`. Set the provider `lang`; it derives LTR/RTL, and an explicit `dir` overrides that choice. The desktop rail defaults to 260px (`--spui-nav-width`).

For a Fluent-shaped application shell, compose `NavDrawer` with `NavDrawerHeader`, `NavDrawerBody`, and `NavDrawerFooter`; choose `type="overlay"` or `type="inline"`. Its default `tabbable={false}` follows roving arrow navigation; opt into `tabbable` when each destination should be a Tab stop. Use `selectedCategoryValue`/`defaultSelectedCategoryValue` for the selected category and the Fluent callback names `onNavItemSelect`/`onNavCategoryItemToggle` when sharing code with Fluent. `AppItem` is a destination, `AppItemStatic` is decorative identity text, and `SplitNavItem` keeps its primary destination independent from optional action, menu, and toggle buttons; add matching tooltip slots for accessible labels. Connect `Hamburger.onClick` to the owning controlled `open` state.

Use `Drawer` for focused side-sheet or full-screen work. Opt into the header expansion control with `expandable`; use controlled `expanded`/`onExpandedChange` when the app owns state. Localize it with `expandLabel`/`restoreLabel` or provider strings `drawerExpand`/`drawerRestore`. For direct custom elements, set `expandable` and listen for `spui-expanded-change`; the control is hidden by default. The surface inherits `dir` and uses logical placement for `start`/`end`.

Compose `DrawerHeader`, `DrawerHeaderNavigation`, `DrawerHeaderTitle`, `DrawerBody`, and `DrawerFooter` inside `OverlayDrawer` or `Drawer`. `DrawerHeaderTitle` can provide a separate `action`; the drawer engine keeps the heading and popup semantics. `OverlayDrawer` defaults to a modal start-side small surface and supports `modalType` and `defaultOpen`. React `Drawer` accepts `surfaceMotion` and `backdropMotion` components; exiting top-layer content stays inert until its animations finish. Ensure custom motion respects reduced-motion preferences. Use `InlineDrawer` for non-modal in-flow content, or `Drawer type="inline"`; it does not trap focus. For direct elements, `spui-inline-drawer` accepts `title`, default body content, `slot="header-navigation"`, `slot="header-action"`, and `slot="actions"`.

Use `Input` for a bare form-associated input when a label/layout is composed separately. Supply `aria-label` or `aria-labelledby` for its accessible name; because the native control lives in a shadow root, an outside `<label htmlFor>` cannot label the inner input. Use `TextField` when the library should render the visible, associated label. `Input` supports native input types, controlled `value` or initial `defaultValue`, `onValueChange`, `name`, `required`, reset, disabled fieldsets, size/appearance, and `before`/`after` slots.

Use `Text` or its named typography presets (`Body1`, `Title1`, `Caption1Strong`, and others) for token-based copy. `Text` defaults to Fluent size `300`; outside React, set `size` and `weight` on `<spui-text>` to use the same typography engine.

Use React `Field` to compose one form control with a visible label, hint, required/disabled state, and `error`/`warning`/`success` validation feedback. For framework-neutral code, pass the native or custom form control to `createFormField(control, options)`; it returns a light-DOM wrapper and connects the label, helper text, and validation message through stable IDs and ARIA references. The control remains responsible for native form submission and validity.

Use `FileUpload` for file selection UI in forms, then send the emitted `File[]` to the app's upload action. It supports `accept`, `multiple`, `maxFiles`, `maxFileSize` (bytes), `disabled`, `required`, and localized labels; use `onFilesChange` and `onFilesError` rather than inspecting shadow DOM. Native forms receive selected files under the host's `name`; the component does not upload or persist them to SharePoint.

Use `Button` for one action; choose `appearance="primary" | "secondary" | "outline" | "subtle" | "transparent"`, `size="small" | "medium" | "large"`, and `shape="rounded" | "circular" | "square"` without replacing the element. Use `MenuButton` as a `Menu` trigger when the trigger should include a chevron; `Menu` owns popup state and focus behavior, and `menuIcon` can replace the default chevron. Use `CompoundButton` when an action needs a title, short description, and optional decorative `icon`. Use `ToggleButton` for a binary pressed state (`pressed` + `onPressedChange`, or `defaultPressed`). Use `SplitButton` when a primary action has related alternatives: its `menuItems` should be `MenuItem` elements and its `menuLabel` should name the menu trigger.

```tsx
import { CompoundButton, Menu, MenuButton, MenuItem, SplitButton, ToggleButton } from "@spfx-fast/sharepoint-ui/react";

<CompoundButton secondaryContent="Includes the latest approved changes" onClick={openSummary}>Review summary</CompoundButton>
<ToggleButton pressed={pinned} onPressedChange={setPinned}>Pin item</ToggleButton>
<Menu trigger={<MenuButton>More actions</MenuButton>} label="More actions"><MenuItem value="copy">Copy link</MenuItem></Menu>
<SplitButton menuLabel="More publish options" onClick={publishNow}
  menuItems={<><MenuItem onSelect={saveDraft}>Save draft</MenuItem><MenuItem onSelect={schedule}>Schedule</MenuItem></>}>Publish</SplitButton>
```

For framework-neutral use, import the button definitions from `@spfx-fast/sharepoint-ui/elements/button` and `@spfx-fast/sharepoint-ui/elements/button-variants`; `MenuButton` composes directly in `spui-menu`'s `trigger` slot, while `SplitButton` also needs `defineMenu`, `defineMenuItem`, and related item definitions from `@spfx-fast/sharepoint-ui/elements/menu`. `spui-toggle-button` emits `spui-pressed-change` with `{ pressed }`; `spui-split-button` is the labelled group host for a `spui-button` in its `primary` slot and a `spui-menu` in its `menu` slot. Supply the menu trigger in `spui-menu`'s `trigger` slot and menu items in its `menu` slot. In custom-element composition, set `disabled` on both the primary button and menu trigger.

## Build with existing pieces

```tsx
import { SharePointUIProvider, SharePointCard, ViewCard, Button, TextField } from "@spfx-fast/sharepoint-ui/react";

<SharePointUIProvider lang="en-GB" dir="ltr" appearance="fluent">
  <SharePointCard>
    <ViewCard kind="task" title={task.title} subtitle={task.dueLabel}>
      <Button onClick={() => openTask(task.id)}>Open task</Button>
    </ViewCard>
    <TextField label="Search tasks" value={query} onValueChange={setQuery} />
  </SharePointCard>
</SharePointUIProvider>
```

Use `Card` for the themed surface and compose `CardHeader`, `CardPreview`, and `CardFooter` for reusable document, media, person, or task views. `Card` supports `appearance="filled | filled-alternative | outline | subtle"`, `orientation="vertical | horizontal"`, and `size="small | medium | large"`; `SharePointCard` remains a compatibility alias. Header slots are `image`, `header`, `description`, and logical-end `action`; Preview accepts media or custom content plus an optional `logo`; Footer accepts children plus an optional logical-end `action`.

Use `Carousel` to present a small, curated sequence of existing cards or views. Give it a meaningful `label`; each direct child is a slide, so reuse `ViewCard` instead of rebuilding record markup. It uses native touch scrolling and scroll snapping, 44px previous/next and slide controls, keyboard arrows, reduced-motion behavior, RTL-aware direction, localized provider strings, and optional `wrap`. Prefer manual navigation for SharePoint task/document content; autoplay is intentionally not enabled by default. Listen to `onIndexChange` or control it with `selectedIndex`.

```tsx
import { Carousel, ViewCard, Badge } from "@spfx-fast/sharepoint-ui/react";

<Carousel label="Recently updated documents" onIndexChange={setActiveDocument}>
  {documents.map(document => <ViewCard key={document.id} kind="document" title={document.name} subtitle={document.modifiedLabel}>
    <Badge slot="status">{document.status}</Badge>
  </ViewCard>)}
</Carousel>
```

For framework-neutral use, call `defineCarousel()` from `@spfx-fast/sharepoint-ui/elements/carousel`; compose direct child slide elements, set `aria-label`, and listen for `spui-carousel-change` with `{ value: index }`.

Use `Overflow` for responsive command strips. Keep essential actions `pinned`, give other actions a stable `id` and relative `priority` (higher stays visible longer), and supply an equivalent `MenuItem` through `overflowContent`. Set that MenuItem's `value` to the same item ID to receive it through `onOverflowItemSelect`. `OverflowDivider` hides when its `groupId` has no visible items. `minimumVisible`, `overflowDirection`, and `padding` control the width policy. The native engine observes size and item-list changes; it does not clone or reparent interactive controls. For plain elements, provide your own trigger/menu in the `overflow-trigger` slot and use `spui-overflow-change` (`visibleIds`, `overflowIds`) to render its contents.

```tsx
import { Button, MenuItem, Overflow, OverflowDivider, OverflowItem } from "@spfx-fast/sharepoint-ui/react";

<Overflow label="Page actions" onOverflowItemSelect={runAction} minimumVisible={1}>
  <OverflowItem id="save" pinned overflowContent={<MenuItem value="save">Save</MenuItem>}>
    <Button appearance="primary" onClick={() => runAction("save")}>Save</Button>
  </OverflowItem>
  <OverflowDivider groupId="secondary" />
  <OverflowItem id="export" priority={10} groupId="secondary" overflowContent={<MenuItem value="export">Export</MenuItem>}>
    <Button onClick={() => runAction("export")}>Export</Button>
  </OverflowItem>
</Overflow>
```

For a selectable brand palette, use `SwatchPicker` with descriptive names and stable values. Keep arrow-key focus as the default for large palettes; set `focusMode="tab"` only when each choice should get a separate Tab stop. Use `ImageSwatch` for texture or material options and `EmptySwatch` to open a color editor.

```tsx
import { ColorSwatch, EmptySwatch, SwatchPicker } from "@spfx-fast/sharepoint-ui/react";

<SwatchPicker aria-label="Workspace colors" selectedValue={selectedColor} columns={4} onSelectionChange={setSelection}>
  <ColorSwatch value="brand" color="#007780" aria-label="Brand teal" />
  <ColorSwatch value="blue" color="#005A9E" aria-label="Blue" />
  <ColorSwatch value="locked" color="#777777" aria-label="Managed color" disabled />
  <EmptySwatch aria-label="Add a color" onAdd={openColorPicker} />
</SwatchPicker>
```

```tsx
import { Badge, Button, Card, CardFooter, CardHeader, CardPreview, Link } from "@spfx-fast/sharepoint-ui/react";

<Card aria-label="Quarterly planning document">
  <CardHeader image={<span aria-label="Word document">DOCX</span>} header="Quarterly planning.docx" description="Modified yesterday · Shared Documents" action={<Badge>Shared</Badge>} />
  <CardPreview logo={<span>DOCX</span>}><img src={previewUrl} alt="First page of the quarterly planning document" /></CardPreview>
  <CardFooter action={<Button appearance="secondary">Share</Button>}><Link href={libraryUrl}>Open library</Link></CardFooter>
</Card>
```

For plain HTML or another framework, call `defineCard()` from `@spfx-fast/sharepoint-ui/elements/card` and `defineCardHeader()`, `defineCardPreview()`, and `defineCardFooter()` from `@spfx-fast/sharepoint-ui/elements/card-primitives`; compose the matching `spui-card-*` tags and named slots. Import only the elements the view uses.

Use `Avatar` for a standalone image or initials marker. Use `Persona` when the identity also needs primary/secondary/tertiary text and presence; set `presenceLabel` to localize the status name and use the `avatar` slot to replace its default marker. Place it in `ViewCard`'s `leading` slot only when the card layout has room for its identity text. Use `Link` for navigation, `Divider` to separate content groups, and `Accordion`/`AccordionItem` for progressive disclosure. For document, person, task, approval, and list-item cards, extend `ViewCard` with its named slots rather than cloning its markup. Keep SharePoint fetching, permissions, and writes in an SPFx service; controls emit values and do not silently persist data.

For a people stack with named overflow details, compose `AvatarGroupItem` children and an `AvatarGroupPopover` inside `AvatarGroup`. The popover count defaults to its child count; pass `count` when children are hidden in fragments. `indicator="icon"` replaces the numeric trigger, and `onOpenChange` supports controlled app state. `AvatarGroupItem` takes the same identity inputs as `Avatar` and inherits `AvatarGroup.size` unless it has its own size. The popup uses the library Popover, localized `label`/`triggerLabel`, Escape dismissal, outside dismissal, and logical placement. Framework-neutral consumers can import `defineAvatarGroup` from `@spfx-fast/sharepoint-ui/elements/avatar-group` and `defineAvatarGroupItem`/`defineAvatarGroupPopover` from `@spfx-fast/sharepoint-ui/elements/avatar-group-primitives`; use the `spui-avatar-group-item` and `spui-avatar-group-popover` tags as direct children of `spui-avatar-group`.

## Customize without forking

- Use `SharePointUIProvider` for locale, direction, appearance, strings, and theme-token overrides.
- Keep the React provider at the app or page root: it renders one `display: contents` theme wrapper so all tokens inherit through DOM and shadow boundaries. Avoid placing it inside slot-driven custom-element composition; per-component inline styles still override inherited tokens.
- React refs are supported on 157 catalogued adapters and target the rendered root element (normally the custom-element host; `InfoLabel` targets its `span`; standalone `Option`/`OptionGroup` render a `div` outside a ComboBox). `Input` and `TextArea` refs also expose `focus()` and `select()`. `npm run verify:react-refs` checks every ref-enabled catalog entry in Chromium.
- Override CSS variables for broad design changes and `::part(...)` for one component detail. Fonts inherit through `--spui-font-family`.
- In tests, prefer role/name queries and stable user-visible semantics. Add `data-testid` to the component host only when semantics are insufficient; custom elements accept it directly, and React adapters forward it to the host. Avoid selectors based on shadow DOM internals or generated IDs.
- Set `lang` for content language; `SharePointUIProvider` derives `dir` from it. Set `dir` only when the region's direction should override its language. Supply localized provider strings for every built-in label used by the page.
- Use the `fluent`, `ios`, `windows`, or `linux` base appearance. The no-host-theme accent fallback is stone (`DEFAULT_ACCENT`, `#78716c`); SharePoint semantic theme colors override it when provided. Accent hover, focus fallback, and glass tint derive from the active accent. `glass` derives surface and spacing from its selected base appearance and theme.

## Data and rich text

- For dynamic SP list forms, get metadata using `getSharePointFieldMetadataUrl(webUrl, listId)`, then map each result with `getSharePointFieldAdapter(field)`. Use a DatePicker for `control: "date-picker"` and an Input with `type={adapter.inputType}` for date/time fields (`datetime-local`). Use `serializeSharePointFieldValues(fields, valuesByInternalName)` for one PATCH body: omitted values stay untouched, `null` clears optional fields, and invalid or unknown values throw. It validates supplied values only; new-item forms must include every required value. `getSharePointListItemUrl(webUrl, listId, itemId)` constructs the item endpoint; the host still owns authorization, ETag, and REST entity-type metadata. The adapter's `required`, `readOnly`, `step`, `min`, `max`, and `maxLength` metadata should drive the UI. Generic and focused serializers reject read-only or empty required values and enforce configured numeric precision and bounds. URL recipes expose `urlFormat` (`hyperlink` or `picture`) for record views. Use `getSharePointNextPageUrl(webUrl, nextLink)` to safely follow same-origin OData pages. `getSharePointLookupOptionsUrl(field, sourceWebUrl)` builds lookup requests. These helpers validate and shape data but do not send requests or replace SharePoint permissions and server validation; people search remains tenant-authorized app work.

- Forward SharePoint adapter `min`, `max`, and `maxLength` to matching controls when present. The serializers enforce those numeric bounds and text limits too; SharePoint remains the final validator.
- Use `ColorPicker` when users need a theme-aware color choice. Its `value` is `#RRGGBB`, `alpha` is `0`–`1`, and `onValueChange(value, alpha)` receives both values. Pass `colors` for app-specific swatches; tenant accent, success, warning, and danger swatches are included by default. The element submits `#RRGGBB` or `#RRGGBBAA` as a native form value.

- Use `Table` for compact composable rows and `DataGrid` for virtualized/editable data. Compose `TableHeader`, `TableBody`, `TableRow`, `TableHeaderCell`, and `TableCell`; use `TableSelectionCell` for selection, `TableCellLayout`/`TableCellActions` for concise record content, `TableResizeHandle` for consumer-controlled width, and `createTableColumn` for reusable column definitions. Sorting and resizing emit requests: keep that state in the host and pass it back through `sortDirection` or `value`.
- For Fluent-shaped custom React tables, compose `useTableFeatures(options, plugins)` with `useTableSelection`, `useTableSort`, and `useTableColumnSizing_unstable`; keep the plugin order stable between renders because each plugin runs React hooks. `TableFeaturePlugin` remains generic so item types flow from `useTableFeatures` into the plugin pipeline.
- Composed DataGrid descendants can select shared state with `useDataGridContext_unstable(selector)`. Its context extends Fluent's `TableFeaturesState` contract with `getRows`, `selection`, `sort`, `tableRef`, and `columnSizing_unstable`, plus SharePoint data-source and editing state. Indexed sources expose currently loaded rows; selecting one field avoids rerenders when unrelated context fields change.
- Use `Select` for fixed options, `ComboBox` for searchable options, `ViewCard` for repeated SharePoint records, `VirtualList` for large collections, and `DataGrid` when records need columns, sorting, or selection. React and framework-neutral VirtualList support horizontal/vertical axes and measured item sizes; set `axis="horizontal"`, `measureItems`, and a CSS `--spui-list-width` when rendering a horizontal rail. Direction follows `dir`, including normalized RTL scroll offsets. Give DataGrid typed columns and a stable `getRowId`; it automatically virtualizes above 100 display rows and windows body columns when there are more than 16 (override with `virtualize` and `virtualizeColumns`). It retains the full header and track widths for horizontal scrolling. Set `filterable` to show a labeled quick-search field over columns (mark a column `searchable: false` to exclude it), localize it with `filterLabel`, and use controlled `filterValue`/`onFilterValueChange` or initial `defaultFilterValue`. Use `selectionMode="single" | "multiple"` and `onSelectionChange` as needed. Use controlled `multiSort`/`onMultiSortChange` or initial `defaultMultiSort`; Shift+click sortable headers to add, reverse, or remove secondary keys. Localize the accessible priority phrase through `sortPriorityLabel` (use `{priority}` as its replacement token). Set `groupBy` to a column id for accessible group headings and counts; use `collapsedGroupKeys`/`onCollapsedGroupKeysChange` for controlled expansion or `defaultCollapsedGroupKeys` for initial collapsed groups. Group keys are stable JSON tuples; `getDataGridGroupKey(columnId, value)` returns one when you need to initialize collapsed state. Set `resizableColumns` for pointer resizing with keyboard arrows, Home/End, double-click auto-fit to the currently rendered rows, and RTL-aware direction. Set `reorderableColumns` for drag handles or Alt+Shift+Arrow keyboard movement; control `columnOrder` and persist `onColumnOrderChange` when layouts should survive a reload. Use `columnWidths` for controlled widths, `defaultColumnWidths` for initial widths, `minWidth`/`maxWidth` on columns for bounds, and `onColumnResize` to persist user choices. Use `getRowHeight(item, index)` for record-dependent heights; it is memoized per displayed data set and participates in virtual range lookup and arrow-key reveal. Invalid heights fall back to `rowHeight`, and values are capped at 10,000 px. Ctrl+C/Cmd+C copies the focused cell or selected rows as TSV. Paste TSV into editable cells; multi-cell paste is limited to 1,000 cells and 1,000,000 characters, validates the full range first, and requires `onCellsEdit` so the host can persist it transactionally. Local values update only after callback success. A single-cell paste can use `onCellEdit`. Cell content can be composed with a regular React `renderCell` callback.
- For Fluent-style React composition, pass either `items` or an indexed `dataSource`, `createTableColumn()` definitions, and `getRowId` to `DataGrid`, then compose `DataGridHeader`/`DataGridBody`, `DataGridRow`, `DataGridHeaderCell`, and `DataGridCell`. Use the render helper's `columns` when mapping cells so custom rows follow `columnOrder`; set `reorderableColumns`, `columnOrder`, and `onColumnOrderChange` for user-managed layouts. The composed path also supports `resizableColumns`, `columnWidths`/`defaultColumnWidths`, `columnSizingOptions`, `onColumnResize`, sort state, selection, editing, and all DataGrid focus modes. `dataSource.length` counts display rows; implement `loadRange(start, end, signal)`, `getItem` or `getRow`, and optional `subscribe`; give the grid a bounded height so it can request only visible rows plus overscan. Range requests abort when the viewport moves, `onRenderedRange` reports mounted bounds, and loading failures reach `onDataLoadError` and an alert. A provider `group` row gets a built-in accessible toggle; listen for `onDataSourceGroupToggle` and update the source rows. Use `selectionModel`/`onDataSourceSelectionChange` for compact query-scoped select-all on remote data. Mark a body `DataGridCell` with `editable` and provide its current `value` plus optional `editType`; use grid-level `onCellEdit` to persist changes, `validateCellEdit` to reject invalid values, and localized `rowLabel`/`editHint` for editor announcements. Successful edits update the local cell value only after persistence succeeds; rejected edits retain the draft and announce the error.
- For a framework-neutral grid, import `defineDataGrid` from `@spfx-fast/sharepoint-ui/elements/data-grid`, then assign its `items`, `columns`, `itemKey`, optional `renderCell`, `selectedKeys`, `sort` or `sorts`, `filterValue`, `resizableColumns`, `columnWidths`, `reorderableColumns`, `columnOrder`, `groupBy`, and `collapsedGroupKeys` properties. Add the `filterable` attribute and set a localized `filter-label` to show its native searchbox. Set `virtualize-columns="false"` to render every body cell in a wide grid. Listen for `spui-selection-change`, `spui-sort-change` (`detail.sort` is the primary key; `detail.sorts` contains all keys), `spui-filter-change`, `spui-column-resize`, `spui-column-order-change`, `spui-group-state-change`, `spui-cells-edit`, and `spui-cells-edit-error`; set `onCellsEdit` for atomic multi-cell paste persistence. Auto-fit resize events include `detail.autoFit === true`. Set the optional `getRowHeight` property for record-dependent heights; assign it after `items` for immediate remeasurement. Invalid heights fall back to `row-height`, and values are capped at 10,000 px. Give it a `label` or `aria-label`.
- Use `Tree` for nested SharePoint navigation or folder hierarchies. Supply unique stable `id` values and `label`s; `children` may be nested. `defaultExpandedKeys` and `defaultSelectedKeys` initialize state, while `expandedKeys` and `selectedKeys` control it. Selection and expansion callbacks return key arrays; the selection callback also returns selected node records. It supports Up/Down/Home/End, expand/collapse arrows mirrored in RTL, Enter/Space, and locale-aware typeahead.
- For framework-neutral Tree, import `defineTree` from `@spfx-fast/sharepoint-ui/elements/tree`, assign `items`, `expandedKeys`, and `selectedKeys` properties, and listen for `spui-tree-expanded-change` and `spui-tree-selection-change`.
- Localize React defaults with `SharePointUIProvider` strings: `Tree`/`FlatTree` use `treeLabel`, `treeToggleLabel`, `treeEmptyMessage`; `Toolbar`, `Breadcrumb`, and `MenuBar` use their matching `*Label` strings; `SplitButton`, `Hamburger`, and `SplitNavItem` use `splitButtonMenuLabel`, `navigationToggle`, and `splitNavItemActionLabel`; virtualized lists use `virtualizerLabel`; row selection and resize handles use `dataGridSelectRow` and `tableResizeHandle`. Explicit labels take precedence. Direct custom elements use their `label`/`aria-label` attributes.
- Use `Tag` inside a labelled `TagGroup` for filters and selected values. A dismissible React Tag calls `onDismiss(value, label)`; update the parent array to remove it. Semantic colors and `brand` appearance derive from the active SharePoint theme. For framework-neutral use, import `defineTag` and `defineTagGroup` from `@spfx-fast/sharepoint-ui/elements/tags` and listen for `spui-dismiss`.
- Use `TagPicker` when users need to search and select multiple values. Supply unique stable option values, a visible label, and controlled `selectedValues`/`onChange`; disabled options cannot be selected. Its popup flips and sizes within the viewport and clipping ancestors, including SharePoint sections; set `positioning` for placement, alignment, fallback, offset, or explicit boundary control. Its `name` submits repeated values in native forms. For framework-neutral use, import `defineTagPicker` from `@spfx-fast/sharepoint-ui/elements/tag-picker`, assign the `value` array, and listen for `spui-change`.
- Use `Rating` for a labelled star score. `value` is controlled; `defaultValue` initializes an uncontrolled rating. Use `step={0.5}` for half stars, set `max` for the scale, and provide `itemLabel` when the radio option labels need custom localization.
- For framework-neutral `spui-virtual-list`, assign `items`, `renderItem`, and `itemKey` after importing `defineVirtualList`. Set `axis="horizontal"` or its `axis` property, `item-size`/`itemSize` for the estimated width or height, and `measure-items`/`measureItems` to track rendered sizes. `row-height` remains the vertical compatibility alias. Set `--spui-list-width` for a horizontal viewport; direction follows inherited `dir`, including logical RTL scrolling. Use `scrollToIndex(index, "start" | "center" | "end", behavior)` for programmatic navigation.
- `RichTextEditor` emits allowlist-normalized HTML. Store it in a SharePoint rich-text field and render it back through the editor or another sanitizer-aware view; do not inject saved HTML with raw `innerHTML`. After inserting a table, click a cell to enable row/column insertion and deletion; table removal is available from any selected cell. Editing controls disable for merged cells so row/column changes cannot corrupt their spans. Localize the toolbar through `SharePointUIProvider.strings` (for example, `richTextInsertRowBelow` and `richTextDeleteTable`).
- Pass a SharePoint multiline field's metadata as React `field={column}` so the editor derives the maximum content mode the field can store. `RichText: false` selects plain text; `RestrictedMode: true` removes enhanced rich actions; `RichTextMode: "Compatible"` selects compatible rich formatting; `"FullHtml"` selects the broad sanitized HTML mode. Explicit `contentMode` may narrow but never exceed that capability ceiling; `allowHyperlink={false}` can further disable links, but cannot override `AllowHyperlink: false`. For framework-neutral custom elements, spread `getRichTextEditorFieldOptions(column)` instead. If no restrictions are available, the editor keeps the broad sanitized HTML mode.
- Connect the editor's `linkPicker` to the SPFx app's existing page/file picker; this keeps tenant-specific picker dependencies out of the UI package. Return `null` on cancel, otherwise map the selected item's absolute URL and optional label into `RichTextEditorLink`. The editor validates the URL and leaves it for review before Apply.

```tsx
import { RichTextEditor, type RichTextEditorLink } from "@spfx-fast/sharepoint-ui/react";

const linkPicker = async (current: RichTextEditorLink | null) => {
  const selected = await pageFilePicker.open({ initialUrl: current?.href });
  return selected ? { href: selected.url, text: selected.name, title: selected.name } : null;
};

<RichTextEditor value={html} onValueChange={setHtml} linkPicker={linkPicker}
  onLinkPickerError={error => console.error("SharePoint link picker failed", error)} />
```
- Persist through `SPHttpClient` in the web part. Include loading, saved, and error states, and verify important writes by reading the item back.

## Before handing off a web part

- Confirm selected imports survive the production bundler and the generated SPFx template can resolve the package.
- Check keyboard use, visible focus, form submission/reset when applicable, and small-screen layout.
- Check the chosen SharePoint theme, a strong background, and RTL if the page may be localized.
- Report what was measured. Host page heap and timings include SharePoint work and are not component-only numbers.

For a fast local bundle estimate of a catalog component, run `npm run measure:component -- AvatarGroup` from the repository root. It reports raw, gzip, and Brotli sizes plus resolved/included module counts for its custom-element, native-factory, and React slices when those APIs exist; the React runtime and SharePoint host are excluded. Add `--verbose` to see the retained modules.

Coverage is still growing. Check [the current parity plan](../../investigation/FLUENT-V9-PARITY-PLAN.md) before assuming a Fluent v9 family exists.

### Compose accessible fields

Use `Field` around one native or custom form control to add an associated label, hint, required indicator, and validation message. A message without an explicit `validationState` is treated as an error; success, warning, and error colors derive from the active theme. Disabled controls keep their label and helper text readable.

```tsx
import { Field, Input } from "@spfx-fast/sharepoint-ui/react";

<Field label="Work item" hint="Use a short, recognizable title" required>
  <Input name="title" value={title} onValueChange={setTitle} />
</Field>
```

Plain DOM and non-React consumers can compose the same structure with `createFormField(control, options)` from `@spfx-fast/sharepoint-ui/elements/field-composition`. It returns a light-DOM wrapper and associates the control with the label, hint, and validation message using native label and ARIA relationships.

### Display images

Use the native-image `Image` adapter for required alternative text, responsive `srcSet`/`sizes`, lazy loading, fit, shape, border, and theme-aware shadow. Set `alt=""` only for decorative images; provide intrinsic `width` and `height` to reserve layout space.

```tsx
import { Image } from "@spfx-fast/sharepoint-ui/react";

<Image src={preview} srcSet={previewSrcSet} sizes="(max-width: 640px) 100vw, 640px"
  alt="Quarterly planning document preview" width={620} height={350}
  fit="cover" shape="rounded" bordered shadow />
```

Framework-neutral consumers can create the equivalent `<img>` with `createImage({ src, alt, width, height, fit, shape, bordered, shadow })` from `@spfx-fast/sharepoint-ui/elements/image`. It remains a browser-native image and does not register a custom element.

For framework-neutral guided tours, call `defineTeachingPopover()` from `@spfx-fast/sharepoint-ui/elements/teaching-popover` once. Compose `<spui-teaching-popover>` with `<spui-teaching-popover-trigger slot="trigger">`, `<spui-teaching-popover-surface slot="content">`, and the header/title/body/footer parts. Use `<spui-teaching-popover-carousel>` with direct `<spui-teaching-popover-carousel-card value="...">` children; its footer buttons use `nav-type="previous|next|dismiss"`, and `alt-text` supplies the label shown at the first/last edge. Listen for `spui-carousel-change` (uncontrolled) or `spui-value-change` (controlled) with `{ value, currentPage, totalPages }`. Set `lang` and `dir` on the guided popover so its default labels and keyboard direction match the active locale.
