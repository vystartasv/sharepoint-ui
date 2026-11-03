# @vilius/sharepoint-ui

Host-aware UI components for SharePoint Framework. The package exposes framework-independent custom elements and an optional React 18 adapter. SPFx 1.24 is the validated host.

```tsx
import { SharePointUIProvider, SharePointCard, Button, TextField } from "@vilius/sharepoint-ui/react";

<SharePointUIProvider lang="en-GB" dir="ltr" appearance="fluent">
  <SharePointCard>
    <TextField label="Work item" value={title} onValueChange={setTitle} />
    <Button onClick={save}>Save</Button>
  </SharePointCard>
</SharePointUIProvider>
```

React `ref` is supported on 157 catalogued adapters and targets the rendered root element (normally the custom-element host; `InfoLabel` targets its `span`, and `Option`/`OptionGroup` target standalone listbox `div`s outside a ComboBox). The generated catalog records the ref type, and `npm run verify:react-refs` mounts every ref-enabled adapter and checks its root. `Input` and `TextArea` refs also expose `focus()` and `select()` methods that reach the internal native controls.

Define reusable theme packs as typed partial themes, then compose them in precedence order. The host SharePoint theme still supplies defaults; design-theme values override host-derived semantic roles, `customProperties` supplies app-specific CSS variables, and direct provider `tokens` overrides remain the final styling layer. Typography packs map `fontSize1100`/`fontSize1200` and `lineHeight1100`/`lineHeight1200` to the library's extended `Text` sizes; `fontFamilyMono` styles `Text` with `font="monospace"` and semantic `code`/`pre` elements. The `layers` group coordinates dropdowns, popovers/menus, and toasts across composed controls. The `materials` group tunes glass blur, saturation, and translucency while retaining the active SharePoint/Fluent-derived colors.

```tsx
import { SharePointUIProvider, composeSharePointUIDesignThemes, type SharePointUIDesignTheme } from "@vilius/sharepoint-ui/react";

const brandPack = { palette: { themePrimary: "#1769aa", themeLighter: "#dceafa" }, typography: { fontFamily: "Aptos, sans-serif" } } satisfies SharePointUIDesignTheme;
const productPack = { colors: { surfaceRaised: "#f7f9fc" }, shape: { cardRadius: "14px" }, materials: { glassBlur: "20px", glassSaturation: "165%", glassSurfaceOpacity: "92%" }, layers: { dropdown: 30, popover: 100, toast: 110 }, customProperties: { "--workbench-card-gap": "12px" } } satisfies SharePointUIDesignTheme;

<SharePointUIProvider theme={composeSharePointUIDesignThemes(brandPack, productPack)}>
  {/* Components inherit both packs and the active SharePoint theme. */}
</SharePointUIProvider>
```

`palette` exposes named SharePoint palette colors as `--spui-palette-*` variables; `themePrimary` also seeds the derived accent unless `brandColor` or `colors.accent` is set. Use `customProperties` for app-specific variables or to deliberately override a semantic role.

`Avatar`, `AvatarGroupItem`, and `Persona` accept Fluent's 30 named avatar colors (for example `color="cornflower"` or `color="seafoam"`). When the matching Fluent palette tokens are present, the component uses their `Background2`, `Foreground2`, and active-border values in both light and dark themes; otherwise it blends the named hue with the current surface and uses the current foreground color.

The shared color roles include `accentPressed`, `accentSubtle`, `accentSubtleHover`, `accentSubtlePressed`, `borderFocus`, `borderDisabled`, `focus`, `foregroundTertiary`, `surfaceAlt`, `surfaceSecondary`, `surfaceSubtle`, `selectedBackgroundHover`, `secondaryHover`, and `linkVisited`. Focus and surface roles derive from SharePoint/Fluent tokens where present; `foregroundTertiary` follows Fluent's tertiary foreground role. Brand-derived links mix the site accent toward the active text color for readability across strong and light section surfaces; an explicit SharePoint semantic link token takes precedence, and `theme.colors.link`/`linkVisited` can tune the roles. Neutral Button and Breadcrumb hover colors derive from the active surface and text colors; set `theme.colors.secondaryHover` when the product theme requires a specific neutral hover. Use component tokens for one-control tuning and `customProperties` for app-specific roles.

Buttons inherit their default size from `ButtonContextProvider`; an explicit `size` prop wins. `useButtonContext()` reads the current `{ size }` value. A Button with an icon and no children automatically uses icon-only spacing; pass `iconOnly` to control that layout explicitly.

Set `as="a"` with `href` to render a link, or omit `href` for an anchor that acts as a button. Link anchors support native URL attributes; action anchors support Enter and Space. Native buttons preserve `type="submit"`/`type="reset"`, form association, constraint validation, disabled-fieldset behavior, and successful `name`/`value` submission through shadow DOM. Disabled anchors lose their `href`, and unsafe `javascript:`, `data:`, and `vbscript:` URLs are discarded.

```tsx
import { Button, ButtonContextProvider } from "@vilius/sharepoint-ui/react";

<ButtonContextProvider value={{ size: "small" }}>
  <Button>Compact action</Button>
  <Button size="large">Large action</Button>
  <Button aria-label="Close" icon={<CloseIcon />} />
</ButtonContextProvider>
```

Use `ButtonGroup` to give related actions one accessible name and choose horizontal or vertical layout. Buttons keep their ordinary Tab behavior; the group does not create an extra tab stop.

`CompoundButton` accepts an optional `contentContainer` element to replace the title/description wrapper while retaining the same `children` and `secondaryContent`; its title remains the button's accessible name and the secondary line remains its accessible description. Native consumers can provide a wrapper with `slot="content-container"` and put its content inside that wrapper.

```tsx
import { Button, ButtonGroup } from "@vilius/sharepoint-ui/react";

<ButtonGroup label="File actions">
  <Button>Open</Button>
  <Button>Share</Button>
</ButtonGroup>
```

For framework-neutral consumers, register `defineButtonGroup()` from `@vilius/sharepoint-ui/elements/button-group` and use `<spui-button-group aria-label="File actions">`.

Checkbox supports `checked` and `defaultChecked` as `boolean` or `"mixed"`, plus `shape`, `size`, and `labelPosition`. Use `label` for its visible accessible name. Replace the native control with `input` props or an `<input>` element; replace the themed indicator with the `indicator` node or native `slot="indicator"` content. The input remains the accessible, keyboard-operable form control, while the indicator part reflects checked and mixed states. The library's compact `size="small"` keeps the 14px visual indicator while its label provides a minimum 24px pointer target, including icon-only controls. `onChange` reports the tri-state as `{ checked }`; the existing `onCheckedChange` callback remains boolean. Both Checkbox and Switch accept `name`, `value`, `required`, and `disabled`, participate in native `FormData`, reset with their form, and inherit disabled fieldsets. Set `disabledFocusable` with `disabled` to keep a disabled control in keyboard order with `aria-disabled="true"`; pointer and Space activation stay suppressed, and it does not submit a form value.

```tsx
import { useState } from "react";
import { Checkbox, type CheckboxCheckedState } from "@vilius/sharepoint-ui/react";

function SelectAllRows() {
  const [selectionState, setSelectionState] = useState<CheckboxCheckedState>("mixed");
  return <Checkbox label="Select all rows" checked={selectionState}
    onChange={(_event, { checked }) => setSelectionState(checked)} shape="circular" size="large"
    labelPosition="before" name="rows" value="all" />;
}
```

For custom elements, `<spui-checkbox checked="mixed" shape="circular" size="large" name="rows" value="all">Select all rows</spui-checkbox>` uses the same behavior.

Switch supports Fluent's `label` prop (with `children` retained as an alias), `size="small" | "medium"`, `labelPosition="before" | "after" | "above"`, and `onChange(event, { checked })`. Replace its native control with `input` props or an `<input>` element and customize the themed track/thumb through `indicator`; both slots work with React and native custom-element composition while retaining switch semantics and form submission.

`Tab` accepts an optional `icon` node, rendered in the leading `icon` slot. Framework-neutral consumers can provide `<span slot="icon">…</span>`. `TabList` accepts `onTabSelect(event, { value })` and `reserveSelectedTabSpace` (default `true`). Width reservation measures tab content without counting named-slot icons, preventing shifts when selection changes label weight; set it to `false` to opt out.

React `Tabs`, `TabList`, `Tab`, and `TabPanel` accept string, number, boolean, `null`, or object values. Non-string values cross the custom-element boundary using an internal key; selection callbacks receive the original number, boolean, or object reference. Plain string values remain unchanged, and direct custom-element values remain strings.

`TabListProvider` supplies selection, style, keyboard, and tab-registration callbacks to a composed `TabList` and its `Tab` children. Explicit `TabList` props override the provider defaults.

`RadioGroup` supports controlled `value` or `defaultValue`, `layout="vertical" | "horizontal" | "horizontal-stacked"`, and `onChange(event, { value })`. The existing `orientation` and `onValueChange` props remain available. Each `Radio` can override its label position with `labelPosition="after" | "below"` and receive its own `onChange(event, { value })` callback.

```tsx
import { useState } from "react";
import { Radio, RadioGroup } from "@vilius/sharepoint-ui/react";

function BillingCycle() {
  const [cycle, setCycle] = useState("yearly");
  return <RadioGroup label="Billing cycle" name="cycle" value={cycle}
    layout="horizontal-stacked" onChange={(_event, { value }) => setCycle(value)}>
    <Radio value="monthly">Monthly</Radio>
    <Radio value="yearly">Yearly</Radio>
  </RadioGroup>;
}
```

Framework-neutral code can register `defineRadioGroup()` and use `<spui-radio-group label="Billing cycle" name="cycle" default-value="yearly" layout="horizontal-stacked"><spui-radio-option value="monthly">Monthly</spui-radio-option><spui-radio-option value="yearly">Yearly</spui-radio-option></spui-radio-group>`. The group dispatches `spui-change`; each option dispatches `spui-radio-change` when selected.

`Slider` supports controlled `value` or uncontrolled `defaultValue`, Fluent `size="small|medium"` and `vertical`, plus `onChange(event, { value })`. `onValueChange(value)` remains available. The native range input handles pointer and keyboard interaction, and the element participates in form submission and reset.

`SpinButton` provides increment/decrement buttons, Arrow and Page Up/Down stepping, Home/End bounds, precision rounding, controlled `value`/`displayValue` or uncontrolled `defaultValue`, and Fluent `onChange(event, { value, displayValue })`. `onValueChange(value)` remains available for each edit. `appearance` accepts `outline`, `underline`, `filled-darker`, or `filled-lighter`; `size` accepts `small` or `medium`. Localize the stepper names with `incrementLabel`/`decrementLabel` or `SharePointUIProvider` strings `spinButtonIncrement`/`spinButtonDecrement`.

`Select` supports controlled `value` or uncontrolled `defaultValue`, Fluent `onChange(event, { value })`, and `appearance="outline|underline|filled-darker|filled-lighter"` with `size="small|medium|large"`. Its inner control remains a native select; size is applied to the custom-element host so it does not enable multirow list mode. Supply `select` as native select props or a `<select>` element to replace the control while retaining host value, label, validation, form, and event behavior. Without that slot, direct `<option>` children use the built-in native select. Replace the default chevron with the React `icon` prop or a native `slot="icon"` element; the icon is positioned with logical direction-aware spacing and inherits the theme foreground.

Use leaf modules from `@vilius/sharepoint-ui/elements/*` when registering custom elements directly. React is an optional peer; custom-element consumers do not load the React adapter.

Cards can opt into selection with `selected`, `defaultSelected`, or `onSelectionChange`. Selection uses a real checkbox with a visible keyboard focus ring; links, buttons, and other nested controls keep their own actions. The accessible checkbox label defaults to `Select {aria-label}`; set `selectionLabel` to provide a localized label.

```tsx
import { Card } from "@vilius/sharepoint-ui/react";

<Card aria-label="Quarterly plan" selected={isSelected}
  onSelectionChange={(_event, { selected }) => setIsSelected(selected)}>
  Quarterly plan.docx
</Card>
```

Plain custom-element consumers can use `<spui-card selectable default-selected aria-label="Quarterly plan">` and listen for `spui-selection-change` with `{ selected }` detail.

Nonselectable cards can opt into Fluent-style focus grouping with `focusMode="no-tab"`, `"tab-exit"`, or `"tab-only"`; the default is `"off"`. `no-tab` enters on Enter, traps Tab within its descendants, and exits on Escape. `tab-exit` enters on Enter and releases Tab after the last (or before the first) descendant. `tab-only` keeps descendants in the regular tab order. Cards with pointer interaction handlers default to `no-tab`; selectable and disabled cards do not use focus grouping. The custom element accepts the equivalent `focus-mode` attribute.

Tooltips support Fluent `relationship="label|description|inaccessible"`, normal/inverted theme appearances, optional arrows, separate `showDelay`/`hideDelay`, controlled `visible`/`onVisibleChange`, and aligned `positioning` (for example `{ position: "above", align: "start", offset: 8 }`). The legacy `placement`, `open`, `delay`, and `onOpenChange` props remain available. Label and description relationships preserve existing ARIA references; inaccessible adds none. Tooltips flip when the requested edge has no room, clamp within the viewport, and reposition after trigger/content resizing or scrolling. Only one tooltip is visible at a time. Escape and backgrounding dismiss it; touch pointer entry does not invoke hover behavior, while keyboard focus does.

`Popover` supports a simple `trigger` prop or composable parts. The trigger can be any native button or link, and the surface inherits SharePoint theme tokens while positioning against the trigger. Set `positioning` to a Fluent shorthand such as `"above-end"` or an object such as `{ position: "below", align: "start", offset: { mainAxis: 12, crossAxis: 4 }, fallbackPositions: ["before-start", "after-end"], autoSize: "height", matchTargetSize: true }`; numeric `offset` remains shorthand for the main axis, `coverTarget` overlays the target, and `arrowPadding` keeps an enabled arrow away from surface corners while aligning it to the target. `align: "start" | "end"` follows LTR/RTL inline direction. Fallbacks are tried in order before the automatic opposite-side flip and viewport clamp. `flipBoundary` and `overflowBoundary` accept an `Element`, a `DOMRectReadOnly` or `{ x, y, width, height }` rectangle, an element array (intersected), or `"clippingParents"`, `"scrollParent"`, and `"window"`, so flip selection and final overflow clamping can use different regions. `overflowBoundaryPadding` accepts a number or `{ top, start, bottom, end }`, keeps the surface inset from that region, and contributes to auto-sizing; start/end follow the active text direction. `strategy: "absolute" | "fixed"` selects the CSS positioning strategy and defaults to `"absolute"`; deprecated `positionFixed` remains as a compatibility alias, with an explicit `strategy` taking precedence. `target` can replace the trigger as the positioning reference with an `Element` or virtual element exposing `getBoundingClientRect()` and optional `contextElement`; target resizing triggers repositioning. Boundary objects are passed through the React prop or custom element's `.positioning` property. Set `pinned: true` to keep the requested side and clamp it into view without flipping. `autoSize` accepts `true`, `"width"`, or `"height"` (and Fluent's legacy `"always"`, `"width-always"`, and `"height-always"` aliases); it constrains overflowing content and enables scrolling. `matchTargetSize` matches the surface width to its trigger. The maximum surface width and height can also be styled with `--spui-popover-max-width` and `--spui-popover-max-height`. Set `defaultOpen` for an uncontrolled initially open surface. By default, it closes when focus moves to an iframe outside the surface; set `closeOnIframeFocus={false}` (or the custom attribute `close-on-iframe-focus="false"`) to opt out. An iframe inside the surface keeps the popover open. Set `openOnHover` to open while the pointer is over the trigger or surface; leaving schedules dismissal after `mouseLeaveDelay` (500 ms by default), allowing the pointer to move between them. Set `openOnContext` to open above the pointer on right-click and close on page scroll; it suppresses normal trigger-click opening. Set `closeOnScroll` to dismiss it when scrolling outside the popover; scrolling inside its content keeps it open. By default it stays open and repositions. The React adapter accepts `surfaceMotion` for custom enter/exit transitions; while exiting, the surface remains in the browser top layer but is inert and hidden from assistive technology. Honor `prefers-reduced-motion` in custom motion components.

`PopoverProvider` can supply controlled `open` state and shared interaction/style defaults to a composed `Popover`. Its `setOpen(event, open)` callback owns state changes; explicit `Popover` props take precedence. It accepts Fluent's context-shaped value, while the local surface stays in source order and uses the browser top layer; `mountNode` is not used to portal content into `document.body`, so SharePoint section theme inheritance is retained.

`TeachingPopoverFooter.footerLayout` accepts `"horizontal"` (default) or `"vertical"` to arrange its action buttons; the horizontal layout aligns actions to the end, while vertical layout stacks them.

`TeachingPopoverCarousel.announcement(value)` can return localized screen-reader text after a step changes; returning an empty string suppresses that announcement. `onFinish(event, { value })` fires when the final next button is activated. `TeachingPopoverCarouselFooter.initialStepText` and `finalStepText` replace the previous/next button labels at the first and last steps; explicit button `altText` takes precedence. Supply the controls through `previous` and `next` when you want fixed footer positions, or compose them among `children`; native elements can assign `slot="previous"` and `slot="next"`.

For custom elements, assign an `announcement` function to `<spui-teaching-popover-carousel>` and listen for `spui-announcement` (`{ value, message, currentPage, totalPages }`) or `spui-finish` (`{ value }`). Set `initial-step-text` and `final-step-text` on `<spui-teaching-popover-carousel-footer>`; explicit `alt-text` on a footer button takes precedence.

`InfoButton` supports `inline` (default `true`) and forwards it to its themed Popover. The custom element reflects the property and uses `inline="false"` to represent `false`; its surface remains in source order and uses the native top layer in either mode. Inline mode applies Fluent's low stacking level (`z-index: 1`); overlay mode uses the library overlay level (`z-index: 10000`).

`PopoverTrigger` adds `aria-haspopup="dialog"`, `aria-controls`, and `aria-expanded` to its focusable trigger by default. Set `disableButtonEnhancement` to preserve a trigger's existing ARIA contract when it already manages its own popup semantics; the custom-element equivalent is `disable-button-enhancement` on `spui-popover-trigger`.

Popover automatically focuses the first focusable element in its surface when it opens. Set `unstable_disableAutoFocus` (or `unstable-disable-auto-focus` on the custom element) to leave focus where it is; when the surface has no focusable children, the surface itself receives focus.

`trapFocus` keeps keyboard focus within the surface. By default, `legacyTrapFocus` behavior cycles Tab and Shift+Tab; set `inertTrapFocus` to make outside page content inert while the popover is open, then restore its original inert state on close. Fluent's deprecated `legacyTrapFocus={false}` selects inert behavior, while `legacyTrapFocus={true}` selects the older focus cycle. Both options are available as `inert-trap-focus` and `legacy-trap-focus` custom-element attributes.

Set `inline` to retain Fluent's explicit source-order intent. The custom-element engine keeps slotted content in its original SharePoint DOM position either way and uses the browser's native popover top layer for unclipped overlay placement, so it does not create a body portal or lose inherited section theme tokens. The `inline` property and attribute are reflected for composition and styling.

```tsx
<Popover label="Request details" arrow>
  <PopoverTrigger><Button>Details</Button></PopoverTrigger>
  <PopoverSurface><Text>Owner and status information</Text></PopoverSurface>
</Popover>
```

`ProgressBar` defaults to an indeterminate state; set `value` and `max` for determinate progress (`max` defaults to `1`). Fluent `color="brand|success|warning|error"`, `shape="rounded|square"`, and `thickness="medium|large"` options inherit the active SharePoint/Fluent theme. Its default track is a translucent tint of the inherited foreground, and the fill derives from its semantic status color plus that foreground so both remain visible on light and strong sections; set `--spui-progress-track` or `--spui-progress-color` to override either. Inside `Field`, an unset color follows its error, warning, or success validation state; explicit `color` wins. Field labels, hints, and validation messages also supply the progress bar's accessible name and description. Replace the React `bar` slot or assign a native `slot="bar"` element to customize the fill while retaining progress sizing. Indeterminate motion follows RTL direction and uses Fluent's reduced-motion opacity pulse.

`Spinner` supports Fluent's eight sizes, primary/inverted appearance, four label positions, a segmented theme-derived tail, RTL mirroring, localized labels, delayed display, forced colors, and reduced motion. `spinner` and `spinnerTail` accept custom visual slots; their contents are hidden from assistive technology unless the supplied element explicitly overrides that. `SpinnerContextProvider` supplies a default size to nested spinners; an explicit `size` prop takes precedence. `useSpinnerContext()` reads the current `{ size }` value.

```tsx
import { Spinner, SpinnerContextProvider } from "@vilius/sharepoint-ui/react";

<SpinnerContextProvider value={{ size: "small" }}>
  <Spinner label="Loading files" />
  <Spinner size="huge" label="Loading preview" />
</SpinnerContextProvider>
```

```tsx
<ProgressBar value={completed / total} max={1} color="success" thickness="large" label="Uploading files" />
```

For brief status feedback, place one `Toaster` near the application root and dispatch from its descendants. Set `limit` to cap visible notifications; excess Toasts wait without consuming their timeout and are promoted by ascending `priority` (equal priorities stay FIFO). Important notifications should also be available in a persistent page surface.

`MessageBar` is a persistent surface; its intent supplies a default info, success, warning, or error icon. Pass `icon` to replace it in React, or use `slot="icon"` in framework-neutral markup. Multiline layout includes a bottom reflow spacer by default; replace it with `bottomReflowSpacer` or `slot="bottom-reflow-spacer"`. Existing title, body, and action composition remains available through `MessageBarTitle`, `MessageBarBody`, and `MessageBarActions`.

```tsx
import { Button, Toaster, useToastController } from "@vilius/sharepoint-ui/react";

function SaveButton() {
  const { dispatchToast } = useToastController();
  return <Button onClick={() => dispatchToast("Your changes are available.", { title: "Saved", intent: "success", priority: 0 })}>Save</Button>;
}

<Toaster limit={3}><SaveButton /></Toaster>
```

The controller also exposes `updateToast`, `dismissToast`, `dismissAllToasts`, `pauseToast(id)`, `playToast(id)`, and `focusNewest()`. Toasts pause while any toast in the region has focus; ArrowUp/ArrowDown moves between them, Delete dismisses the focused toast, and Escape dismisses the focused or newest toast. Set `timeout={0}` or `timeout={-1}` for a persistent toast. Keep important notifications in a persistent surface as well.

Each Toaster owns one polite and one assertive screen-reader live region. Announcements are serialized, with assertive messages moved ahead of pending polite messages; new announcements are suppressed while focus is inside the Toaster. Toasts themselves are labelled groups rather than separate live regions, which avoids duplicate announcements when several arrive together.

`Alert` exposes `icon`, `avatar`, and `action` composition slots; `avatar` takes precedence over the icon. Its existing `actions` prop remains available for grouped actions. Warning and error intents announce assertively by default; set `assertive={false}` to keep a warning polite.

Menus can contain other `Menu` components. Use a `MenuItem` as the nested menu's trigger; Right Arrow opens it in LTR, Left Arrow opens it in RTL, and the opposite arrow closes it and returns focus to its trigger. Escape closes the current submenu; selecting a command closes its menu hierarchy. `MenuItem` supports icon, subtext, secondary shortcut content, disabled-focusable behavior, and `persistOnClick`. Use `MenuItemCheckbox`, `MenuItemRadio`, and `MenuItemSwitch` for named values, or `MenuItemLink` for native navigation.

Menu items support locale-aware first-character search that wraps from the current item; pressing the same character again cycles to the next matching item. Multi-character typeahead is also supported.

```tsx
<Menu trigger={<MenuButton>File</MenuButton>} label="File">
  <MenuItem value="new">New</MenuItem>
  <Menu trigger={<MenuItem>Share</MenuItem>} label="Share">
    <MenuItem value="copy-link">Copy link</MenuItem>
  </Menu>
</Menu>
```

For Fluent-style part composition, `MenuTrigger` marks the trigger child and `MenuPopover`/`MenuList` wrap the content. Checked values can be controlled at `Menu` with `checkedValues` or initialized with `defaultCheckedValues`; `onCheckedValueChange` reports the changed name and full checked-value list. Set `persistOnItemClick` on `Menu` or `persistOnClick` on an item to keep the menu open after selection. `defaultOpen`, `openOnHover`/`hoverDelay`, `openOnContext`, `closeOnScroll`, `inline`, and `positioning` support common interaction and placement needs. Positioning accepts a side/alignment shorthand or `{ placement, align, offset }`. Provide `surfaceMotion` for custom enter/exit animation; exiting menus stay top-layer but inert until the animation finishes. Respect reduced-motion preferences in custom motion.

```tsx
<Menu label="View options" defaultCheckedValues={{ columns: ["owner"] }} onCheckedValueChange={onCheckedValueChange}>
  <MenuTrigger><Button>View options</Button></MenuTrigger>
  <MenuPopover>
    <MenuList hasCheckmarks hasIcons>
      <MenuItemCheckbox name="columns" value="owner" icon={<PersonIcon />} secondaryContent="⌘O">Owner</MenuItemCheckbox>
      <MenuItemSwitch name="notifications" value="enabled" persistOnClick>Notifications</MenuItemSwitch>
      <MenuItemLink href="/views/all" secondaryContent="↵">All items</MenuItemLink>
    </MenuList>
  </MenuPopover>
</Menu>
```

`MenuButton` is a dedicated menu trigger with the same appearance, size, shape, icon, disabled, and `disabledFocusable` options as `Button`, plus a trailing theme-aware chevron. `Menu` supplies `aria-haspopup`, `aria-expanded`, keyboard opening, dismissal, and focus restoration. Set `menuIcon` to replace the chevron; set `icon` for an additional leading icon.

For desktop-style command navigation, compose top-level menus in `MenuBar`. It supplies `role="menubar"`, one Tab stop, Home/End, and RTL-aware horizontal arrow focus; each `Menu` remains responsible for opening and navigating its command list.

```tsx
<MenuBar label="Document commands">
  <Menu label="File" trigger={<MenuBarItem>File</MenuBarItem>}>
    <MenuItem value="new">New</MenuItem>
    <MenuItem value="open">Open</MenuItem>
  </Menu>
  <Menu label="Edit" trigger={<MenuBarItem>Edit</MenuBarItem>}>
    <MenuItem value="undo">Undo</MenuItem>
  </Menu>
</MenuBar>
```

Use `ContextMenu` when commands belong to a target surface rather than a visible trigger. Right-click the trigger, press the Context Menu key, or press Shift+F10; focus moves into the menu and Escape returns it to the target. The pointer invocation positions the menu at the click while keyboard invocation aligns to the target's logical start edge. Framework-neutral consumers can set the `context-menu` attribute on `spui-menu`.

```tsx
import { ContextMenu, MenuItem } from "@vilius/sharepoint-ui/react";

<ContextMenu label="Document commands" trigger={<button>Quarterly plan.docx</button>}>
  <MenuItem onSelect={openDocument}>Open</MenuItem>
  <MenuItem onSelect={renameDocument}>Rename</MenuItem>
</ContextMenu>
```

For framework-neutral consumers, `defineToaster()` registers `<spui-toaster>`; its `limit` attribute caps visible Toasts, and `priority` on each Toast orders the pending queue (lower numbers first, FIFO for ties). Queued Toast timers and announcements wait until promotion. `show(options)` returns an ID accepted by `update(id, options)`, `dismiss(id)`, `pause(id)`, and `play(id)`. `focusNewest()` and `dismissAll()` are also available on the element.

Use `SearchBox` for free-form queries, `ComboBox` for filtering suggestions, and `Dropdown` for selection without typing. Compose `<Option>` and `<OptionGroup>` inside either picker; use `<Listbox>` when the options should remain visible in the page. `ComboboxProvider` accepts Fluent's option registration, active-option, selection, open-state, appearance, and size context fields, and retains the library's `value`, `setValue`, and callback conveniences. Dropdown supports selected/default options, controlled/default open state, multiselect, clear, appearance, size, and placement; values are returned as `{ optionValue, optionText, selectedOptions }`. Its `button`, `listbox`, `clearButton`, and `expandIcon` slots can be composed in React; framework-neutral consumers can assign the equivalent named slots. A custom listbox element replaces the listbox root and receives options rendered from Dropdown's `<Option>` children. `SearchBox` supports controlled `value` or initial `defaultValue`, Fluent `onChange(event, { value })` for typing and clearing, the `onValueChange` alias, Enter submission through `onSearch`, localized clear text, and native form value/reset/required behavior. Compose `contentBefore`, `contentAfter`, and `dismiss` in React; custom-element consumers use `slot="content-before"`, `slot="content-after"`, and `slot="dismiss"`. The clear action remains a labeled button-role control when its dismiss icon is customized. Choose `appearance="outline" | "underline" | "filled-darker" | "filled-lighter"` and `size="small" | "medium" | "large"`.

```tsx
import { ComboboxProvider, Dropdown, Option, OptionGroup } from "@vilius/sharepoint-ui/react";

<ComboboxProvider value={{ onOptionSelect: (_event, data) => saveCategory(data.optionValue) }}>
  <Dropdown label="Category" defaultSelectedOptions={["planning"]} clearable>
    <OptionGroup label="Work">
      <Option value="planning" text="Planning">Planning</Option>
      <Option value="delivery" text="Delivery">Delivery</Option>
    </OptionGroup>
  </Dropdown>
</ComboboxProvider>
```

`Text` exposes Fluent typography through the framework-neutral `<spui-text>` element and React adapter. Sizes `100`–`1000` use Fluent's exact base/hero font-size and line-height tokens; `1100` and `1200` are library extensions with dedicated `--spui-text-font-size-*` and `--spui-text-line-height-*` overrides. It also supports semantic tags, weights, base/monospace/numeric fonts, logical alignment, emphasis, wrapping, and truncation. React exports Fluent's named presets: `Display`, `LargeTitle`, `Title1`–`Title3`, `Subtitle1`–`Subtitle2Stronger`, `Body1`–`Body2`, and `Caption1`–`Caption2Strong`. Presets render the same `spui-text` element, so custom-element users can compose `size` and `weight` directly. Font family and typography tokens inherit from SharePoint/Fluent CSS variables, with accessible fallbacks.

`Input` matches Fluent's text-based input types, sizes, outline/underline/filled appearances, and `contentBefore`/`contentAfter` slots. `onChange(event, { value })` is supported alongside `onValueChange`; `value` is controlled and `defaultValue` is uncontrolled. Shadow-filled appearances remain available for compatibility.

`Field` pairs a control with a visible label, hint, required state, and validation message. Its child may be a control element or a render function: `<Field label="Work email" hint="Use your company address." validationMessage="Enter a valid address." required>{fieldProps => <Input type="email" {...fieldProps} />}</Field>`. The render function receives the generated `id`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, and `aria-required` props; existing control descriptions are retained. Built-in TextField, Input, TextArea, Select, RadioGroup, Checkbox, Switch, SpinButton, Slider, DatePicker, ComboBox, SearchBox, ColorPicker, FileUpload, and RichTextEditor adapters consume Field context when nested under wrappers, so render props are optional for those controls. Context supplies a shadow-safe accessible name and description as well as required/disabled state, validation state, and size. Error and warning messages use `role="alert"`; success messages do not mark the control invalid. Framework-neutral apps can use `createFormField(control, options)` for a light-DOM wrapper.

`TextArea` supports controlled `value` and uncontrolled `defaultValue`, Fluent `onChange(event, { value })` plus the `onValueChange` alias, `outline`/filled appearances (including shadow variants), `small`/`medium`/`large` sizing, and `resize="none|horizontal|vertical|both"`. It is form-associated, so `name`, required validation, form submission/reset, and disabled fieldsets work. The visible label stays associated with the native textarea inside its shadow root; the framework-neutral element accepts matching `appearance`, `size`, and `resize` attributes.

```tsx
import { Input } from "@vilius/sharepoint-ui/react";

<Input type="email" aria-label="Work email" name="email" required
  contentBefore={<span aria-hidden="true">@</span>}
  contentAfter={<span aria-hidden="true">.com</span>}
  appearance="filled-lighter" size="large"
  onChange={(_event, { value }) => validateEmail(value)} />
```

`Label` renders a real native `<label>` in React. For plain JavaScript or another framework, `createLabel(content, { htmlFor, size, required })` returns an `HTMLLabelElement`, preserving browser label association and click-to-focus behavior. `required` adds a visual marker; set `required` on the associated control as well.

```tsx
import { Label, Text } from "@vilius/sharepoint-ui/react";

<Text as="h2" size={700} weight="semibold">Quarterly plan</Text>
<Label htmlFor="work-item" required>Work item</Label>
<input id="work-item" required />
```

```ts
import { defineText } from "@vilius/sharepoint-ui/elements/text";
import { createLabel } from "@vilius/sharepoint-ui/elements/label";

defineText();
document.body.append(createLabel("Work item", { htmlFor: "work-item", required: true }));
```

`ColorPicker` combines the browser's native color chooser with an interactive saturation/brightness area, hue and opacity sliders, editable HEX/RGB values, and tenant-derived accent/status swatches. Use the format selector or set `format="rgb"`; `onFormatChange` reports changes to a controlled format. Use the arrow keys on the color area to adjust saturation and brightness; Shift+Arrow changes them in larger steps. The component's value remains a six-digit hex string; alpha is a separate number from `0` to `1`. Localize the hue, area, saturation/value, channel, format, and value-description strings through `SharePointUIProvider`. Its area, hue, saturation/value, and alpha controls can be composed and replaced while sharing the picker's state. `ColorPicker.onColorChange` matches Fluent's `(event, { color, event, type: "change" })` contract and carries the originating keyboard, pointer, or input event. `ColorArea`, `ColorSlider`, and `AlphaSlider` callbacks use the same data shape; their native `spui-color-change` detail carries those fields too.

```tsx
import { AlphaSlider, ColorArea, ColorPicker, ColorSlider } from "@vilius/sharepoint-ui/react";

<ColorPicker label="Highlight color" value={color} alpha={opacity}
  onValueChange={(nextColor, nextOpacity) => { setColor(nextColor); setOpacity(nextOpacity); }}
  colors={["#1673C9", "#6B4EFF", "#D83B01"]} />

<ColorPicker label="Brand color" color={hsv} onColorChange={(_event, data) => setHsv(data.color)}>
  <ColorArea aria-label="Saturation and brightness" />
  <ColorSlider channel="hue" aria-label="Hue" />
  <ColorSlider channel="saturation" aria-label="Saturation" />
  <AlphaSlider aria-label="Opacity" transparency />
</ColorPicker>
```

`Toolbar` groups commands into one keyboard stop. Use `ToolbarButton` and `ToolbarToggleButton` for the standard subtle command appearances, `ToolbarRadioGroup` with named `ToolbarRadioButton` values for mutually exclusive choices, `ToolbarGroup` for named or visual command sets, and `ToolbarDivider` (or `ToolbarSeparator`) between them. `checkedValues` controls radio selection; `defaultCheckedValues` initializes it, and `onCheckedValueChange` reports `{ name, checkedItems }`. The toolbar handles Arrow keys, Home/End, disabled commands, RTL movement, and optional edge wrapping. Framework-neutral elements are available for each primitive.

```tsx
import { Button, Toolbar, ToolbarGroup, ToolbarSeparator } from "@vilius/sharepoint-ui/react";

<Toolbar label="Document actions" orientation="horizontal">
  <ToolbarGroup label="File">
    <Button onClick={save}>Save</Button>
    <Button onClick={share}>Share</Button>
  </ToolbarGroup>
  <ToolbarSeparator />
  <ToolbarGroup label="Edit">
    <Button onClick={undo}>Undo</Button>
    <Button onClick={redo}>Redo</Button>
  </ToolbarGroup>
</Toolbar>
```

`Overflow` keeps higher-priority and pinned commands visible as its width changes. Supply the same action as a `MenuItem` through each item's `overflowContent`; the menu reuses your callback without moving or cloning the visible control.

```tsx
import { Button, MenuItem, Overflow, OverflowDivider, OverflowItem } from "@vilius/sharepoint-ui/react";

<Overflow label="Document actions" onOverflowItemSelect={runAction}>
  <OverflowItem id="save" pinned overflowContent={<MenuItem value="save">Save</MenuItem>}>
    <Button appearance="primary" onClick={() => runAction("save")}>Save</Button>
  </OverflowItem>
  <OverflowDivider groupId="secondary" />
  <OverflowItem id="export" priority={10} groupId="secondary" overflowContent={<MenuItem value="export">Export</MenuItem>}>
    <Button onClick={() => runAction("export")}>Export</Button>
  </OverflowItem>
</Overflow>
```

`onOverflowChange(event, data)` follows Fluent's state shape: `hasOverflow`, `itemVisibility`, and `groupVisibility`. Set `overflowAxis="vertical"` for height-based overflow; the default is horizontal and the default menu padding is 10px. Use `hasHiddenItems` with `overflowContent` when the menu also contains items managed outside the visible OverflowItems. The native `spui-overflow-change` event keeps `visibleIds` and `overflowIds` and includes the state fields. The engine uses `ResizeObserver` and watches child changes, so it adapts to container resizing and reordered/inserted actions. Plain custom-element consumers listen for `spui-overflow-change` and provide their menu in the `overflow-trigger` slot.

Headless React compositions can use `OverflowProvider` with the registration context, `useOverflowItem`/`useOverflowDivider`/`useOverflowMenu` to register elements, and the visibility hooks to read current state. `useOverflowSnapshot(selector)` subscribes to the latest snapshot and rerenders when the selected value changes; use it when building a custom overflow root or menu.

`OverflowReorderObserver` is available as a Fluent-compatible renderless marker. The native engine observes child-list mutations itself, so you do not need to add it for reorder updates in this library.

`SwatchPicker` supports accessible color and image swatches, a disabled option, row or grid layout, arrow-key roving focus, and controlled or default selection. Swatches use Fluent's 20/24/28/32px size scale; picker spacing is 2px or 4px. Selected color and image swatches show a theme-derived inset ring. Its `onSelectionChange(event, data)` callback includes Fluent's `event`, `type: "click"`, `selectedValue`, and `selectedSwatch` fields plus the library's selected-color arrays and selection mode. `EmptySwatch` provides an add-color action that you can connect to `ColorPicker` or a custom dialog.

```tsx
import { ColorSwatch, EmptySwatch, SwatchPicker } from "@vilius/sharepoint-ui/react";

<SwatchPicker aria-label="Workspace colors" selectedValue={colorName} columns={5}
  onSelectionChange={(_event, { selectedValue, selectedColor }) => { setColorName(selectedValue); setColor(selectedColor); }}>
  <ColorSwatch value="teal" color="#007780" aria-label="Teal" />
  <ColorSwatch value="blue" color="#005A9E" aria-label="Blue" />
  <ColorSwatch value="locked" color="#777777" aria-label="Managed color" disabled />
  <EmptySwatch aria-label="Add a color" onAdd={openColorPicker} />
</SwatchPicker>
```

Arrow keys move focus through enabled swatches; Enter or Space selects the focused color. Use `focusMode="tab"` when every swatch should be in the normal Tab sequence.

`Nav` is for moving between app destinations. Use `NavItem`/`NavSubItem` with `href` for native links; use `NavCategoryItem` as a disclosure button that reveals a `NavSubItemGroup`. Selection and category expansion can be controlled independently. `NavCategoryItem` accepts `expandIconMotion` to animate its default or custom expand icon using the current category state. `NavSubItemGroup` accepts `collapseMotion` for custom category enter/exit animation; exiting groups stay mounted but inert and hidden from assistive technology until the motion finishes. Respect `prefers-reduced-motion` in custom motion. Add an `Avatar` with the optional `avatar` prop on `NavItem`, `NavSubItem`, or `NavCategoryItem`; the React adapter marks it decorative so the navigation label stays the accessible name. Direct custom-element avatars should use `decorative`. At viewport widths of 640px or less, Nav changes to a 44px menu button and a theme-derived, logical-start drawer; Escape, outside click, and destination selection close it. Pass `open`/`onOpenChange` for controlled state or `defaultOpen` for initial state, and localize `openLabel`/`closeLabel` (or the provider strings `navigationMenu`/`navigationClose`). Set `dir="rtl"` on Nav or inherit it from an ancestor for Arabic and other RTL locales. Desktop Nav remains a 260px rail by default, controlled by `--spui-nav-width`. Opt into a collapsible icon rail with `collapsible`; use `defaultCollapsed` or controlled `collapsed`/`onCollapsedChange`. The compact width defaults to 64px (`--spui-nav-collapsed-width`), keeps full accessible names and hover titles, and shows the entry initial when no icon/avatar is supplied. The desktop toggle is localized through `navigationExpand`/`navigationCollapse`. Keyboard focus follows the mobile menu button into the drawer and returns to it on Escape.

For Fluent v9 Nav composition, `AppItem` is a selectable app destination, `AppItemStatic` is a non-interactive app identity, and `SplitNavItem` keeps its secondary action separate from navigation. Its `navItem` slot can replace the primary destination, and `actionButton`, `menuButton`, and `toggleButton` provide independent controls; pair each with its optional tooltip slot. The legacy `action` and `onAction` props remain supported. `NavDrawer` adds `NavDrawerHeader`, `NavDrawerBody`, and `NavDrawerFooter`; its mobile `type="overlay"` uses the top layer, while `type="inline"` opens in page flow. `tabbable={false}` uses one Tab stop with ArrowUp/ArrowDown/Home/End movement; `tabbable` enables normal Tab stops. Use `selectedCategoryValue`/`defaultSelectedCategoryValue` and `onNavItemSelect`/`onNavCategoryItemToggle` when matching Fluent's category selection contract. `Hamburger` is a localized, keyboard-operable control; connect its `onClick` to the owning drawer state.

```tsx
import { Avatar, Nav, NavCategory, NavCategoryItem, NavItem, NavSubItem, NavSubItemGroup } from "@vilius/sharepoint-ui/react";

<Nav label="Workspace" collapsible defaultCollapsed={false} selectedValue={selected} openCategories={open} onItemSelect={value => setSelected(value)} onCategoryToggle={(_, __, values) => setOpen(values)}>
  <NavItem value="home" href="/sites/workspace" avatar={<Avatar name="Workspace" image="/assets/workspace.png" size={28} />}>Home</NavItem>
  <NavCategory value="projects">
    <NavCategoryItem>Projects</NavCategoryItem>
    <NavSubItemGroup><NavSubItem value="atlas" href="/sites/workspace/SitePages/atlas.aspx">Project Atlas</NavSubItem></NavSubItemGroup>
  </NavCategory>
</Nav>
```

```tsx
import { Avatar } from "@vilius/sharepoint-ui/react";

<Avatar name="Amara Okafor" size={40} color="colorful" active="active" />
```

`color="colorful"` selects a stable color derived from the current SharePoint palette and recalculates it when the host theme changes. Generated initials use inherited `lang` for casing and inherited `dir` for RTL ordering: two-word names use two initials, three-word names use the first and third, and longer names use the first. A 16px avatar uses one initial. Explicit `initials` are preserved as supplied. Add `image` or an `icon`/`badge` slot to customize the marker. Keep `name` for its accessible label.

`AvatarGroup` composes existing Avatar components, keeps a bounded number visible, and reveals the overflow with a keyboard-operable button. Its labels inherit the provider strings and can be overridden for app-specific wording.

Use `AvatarGroupProvider` to share size/layout defaults through custom group composition; explicit `AvatarGroup` props take precedence.

```tsx
import { Avatar, AvatarGroup } from "@vilius/sharepoint-ui/react";

<AvatarGroup label="Project collaborators" maxVisible={3}>
  <Avatar name="Amara Okafor" color="colorful" />
  <Avatar name="Vilius Petrauskas" color="colorful" />
  <Avatar name="Jordan Lee" color="colorful" />
  <Avatar name="Sofia Chen" color="colorful" />
</AvatarGroup>
```

`Persona` adds identity details and presence to the same Avatar foundation. Supply `presenceLabel` in the current locale; set `textPosition="below"` for compact people lists, pass an `avatar` slot to provide a custom marker, or compose `primaryText`, `secondaryText`, `tertiaryText`, and `quaternaryText` to replace the corresponding text lines. `primaryText` defaults to `name`.

```tsx
import { Persona } from "@vilius/sharepoint-ui/react";

<Persona name="Amara Okafor" secondaryText="Product owner" tertiaryText="London"
  presence="available" presenceLabel="Available" color="colorful" />
```

The no-host-theme accent defaults to stone (`DEFAULT_ACCENT`, `#78716c`); derived hover, focus, and glass surfaces mix from that base. When SharePoint theme tokens are supplied, the active tenant accent and semantic colors take precedence. Set `appearance="glass"` with a base appearance to derive the translucent finish and spacing from that appearance.

Theme input layers together: `applySharePointTheme()` forwards SPFx palette, semantic colors, effects, spacing, font ramps, and default font styles as `--spui-*` variables, top-level `fluentTokens` accepts raw Fluent tokens and `theme` sets typed semantic roles, design scales, and nested `theme.fluentTokens` for complete Fluent-token packs, and `tokens` directly overrides any library `--spui-*` token. Fluent token keys may be written as `colorBrandBackground` or `--colorBrandBackground`; the pinned Fluent v9 theme object (459 values) passes through intact and nested providers merge these values by key. The semantic theme includes foreground, surface, border, selection, link, overlay, and info/success/warning/danger colors; font families and type roles; control, card, field, section, list, and touch-target spacing; radii; elevation; motion; and `layers.dropdown`, `layers.popover`, and `layers.toast`. The layer roles control the stacking of dropdowns, floating menus/popovers, and notifications while preserving their defaults; browser top-layer dialogs and popovers remain above these regular z-index layers. Shared roles such as `--spui-ui-surface-raised`, `--spui-selection-background`, and `--spui-text-font-size-heading` are also available to app-owned slots and composed controls. Component-specific values remain available through `tokens` or CSS custom properties. Nested providers merge each semantic group and inherit density. Set provider `density="compact|comfortable|touch"` to scale appearance-based spacing and control sizes; explicit spacing roles still win, and the 44px minimum touch-target token stays fixed. Set `theme.brandColor` to derive accent, hover, selection, link, focus, and info roles; six-digit or three-digit hex values also get an automatic black-or-white on-accent foreground. For other CSS color syntaxes, set `theme.colors.accentForeground` explicitly. Host SharePoint variables provide defaults; appearance and density define the base; raw Fluent variables feed inherited aliases; derived brand values are applied next; explicitly supplied semantic roles override generated roles; direct `tokens` and element inline styles win last. `applySharePointTheme()` accepts the same `density` and `theme.brandColor` options for framework-neutral consumers.

`SharePointUIProvider` places theme variables on one `display: contents` wrapper, so component hosts inherit them through light DOM and shadow roots without receiving a copy of the full token map. Use it at the app or page root, outside slot-driven custom-element compositions. Component `style` props remain inline and take precedence over provider tokens.

The published [`@vilius/sharepoint-ui/tokens`](./tokens.json) JSON file is generated from element style sources and lists each `--spui-*` variable by consuming component and theme-definition source. Dynamic namespaces such as `--spui-palette-*` are listed under `dynamicPrefixes`. It is a discoverability index; component-internal variables can change between releases. Run `npm run tokens:generate` after changing component styles and `npm run tokens:check` to detect stale output.

```tsx
<SharePointUIProvider
  appearance="ios"
  density="compact"
  theme={{
    brandColor: "#6750a4",
    colors: { foreground: "#241a35", foregroundSubtle: "#625b70", surface: "#fffafd", surfaceRaised: "#fff", selectedBackground: "#eee8ff", link: "#57409a" },
    typography: { fontFamily: '"Aptos", sans-serif', fontFamilyMono: '"Cascadia Code", monospace', fontSize: "15px", fontSizeHeading: "24px", lineHeight: "1.5" },
    spacing: { controlHeight: "40px", controlGap: "10px", controlPaddingInline: "14px", cardPadding: "20px", sectionGap: "28px", touchTargetMin: "44px" },
    shape: { controlRadius: "12px", inputRadius: "8px", cardRadius: "18px", focusRingWidth: "3px" },
    elevation: { cardShadow: "0 4px 18px #241a3520", popoverShadow: "0 8px 28px #241a3530" },
    motion: { durationFast: "100ms", durationSlow: "240ms", easingStandard: "ease-out" },
    layers: { dropdown: 30, popover: 100, toast: 110 },
  }}
  fluentTokens={{ colorNeutralForeground1: "#241a35" }}
  tokens={{ "--spui-control-radius": "14px", "--spui-control-gap": "12px" }}
>
  <App />
</SharePointUIProvider>
```

The current catalog includes buttons, fields, cards, avatars, Persona, toggles, ColorPicker, SearchBox, select/radio/combobox, number/date/range inputs, status, progress, alert, Toast/Toaster feedback, skeleton, dialog, Link, Breadcrumb, Divider, Accordion, Toolbar, Tree, SharePoint view cards, an accessible basic rich-text editor, accessible multi-select TagPicker, half-step Rating, VirtualList/Virtualizer, and sortable/selectable DataGrid. Tree supports nested typed data, controlled or default selection/expansion, roving keyboard focus, locale-aware typeahead, and language-aware RTL navigation. Both React and framework-neutral virtual lists keep rendered items bounded to the viewport plus overscan, support horizontal or vertical axes, and measure variable item sizes. DataGrid adds stable row identity, locale-aware single or multi-column sorting, optional cross-column quick filtering, selection, keyboard cell navigation, row and horizontal column virtualization with record-dependent row heights, pointer/keyboard column resizing, double-click auto-fit, `containerWidthOffset`-aware fitting, optional pointer/keyboard column reordering, and accessible row grouping with counts and controlled expand/collapse state. Column windowing activates above 16 columns by default and can be controlled with `virtualizeColumns` or `virtualize-columns`. Shift+click sortable headers to add, reverse, or remove secondary sort keys. React supports controlled `multiSort`/`onMultiSortChange` and uncontrolled `defaultMultiSort`; the custom element accepts a `sorts` array and emits it in `spui-sort-change`. Opt in to the labeled quick-search field with `filterable`; `filterValue`/`defaultFilterValue` and `onFilterValueChange` support controlled and uncontrolled use. Indexed DataGrid sources render only the visible row range, cancel stale loads, expose loading/error state, and can return accessible provider-owned group rows. Their compact selection model supports selecting all matching rows without loading them, with a small exclusion list for deselected items; `selectionScopeKey` binds that selection to a server query so a changed query cannot silently select its new results. Providers can implement `copySelection(selection, columns, signal)` to return TSV for remote selections. Paste loads only missing destination rows through `loadRange` before full validation and the existing atomic `onCellsEdit` commit. Copy output and paste input are each limited to 1,000,000 characters; multi-cell paste is limited to 1,000 cells. Browse the [component catalog](https://vystartasv.github.io/sharepoint-ui-docs/components/) for the full coverage list and live examples.

`DatePicker` keeps its form value as ISO `YYYY-MM-DD`, displays and parses dates using the inherited `lang`, and includes an accessible month calendar with locale week starts, RTL-aware arrow keys, month/year navigation, and min/max disabling. It supports native form submission, required and invalid-date validity, reset, and disabled fieldsets. Override labels with the `SharePointUIProvider` strings `datePickerCalendar`, `datePickerPreviousMonth`, `datePickerNextMonth`, `datePickerInvalid`, and `datePickerRequired`, or use the matching `calendarLabel`, `previousMonthLabel`, `nextMonthLabel`, `invalidDateMessage`, and `requiredMessage` props for a single picker.

```tsx
import { DatePicker } from "@vilius/sharepoint-ui/react";

<DatePicker label="Review date" name="reviewDate" value={reviewDate}
  min="2026-01-01" max="2027-12-31" onValueChange={setReviewDate} />
```

`Dialog` reports open changes as `(event, data)`, where `data` includes `open`, the originating browser event, and Fluent's `type` reason: `triggerClick`, `escapeKeyDown`, or `backdropClick`. The same object is emitted in the native `spui-open-change` event detail. Programmatic controlled prop changes do not synthesize user interaction callbacks.

Set `closeLabel` to localize or override the built-in close button's accessible name; it defaults to the provider's shared close string. Framework-neutral consumers can set the `close-label` attribute.

`DialogTitle` accepts an optional `action` slot for a control aligned after the heading. Provide `action` in React or a child with `slot="action"` in framework-neutral markup.

`Drawer` uses a native dialog as a modal or non-modal top-layer surface, with logical `start`/`end` placement, top/bottom sheets, four sizes, dismissible controls, title/actions slots, and controlled open state. A dismissible non-modal Drawer closes on outside pointer press or Escape; set `dismissible={false}` for a persistent pane, which remains until its owner closes it. Opt into the full-screen expansion control with `expandable`; `expanded` and `onExpandedChange` control it. The control announces its current action with `aria-label` and `aria-pressed`, and `expandLabel`/`restoreLabel` or provider strings `drawerExpand`/`drawerRestore` localize it. Direct custom elements use the `expandable` and `expanded` attributes and receive `spui-expanded-change`. Use `closeLabel` for a localized dismiss name when the provider's shared close string is not sufficient. React consumers may provide `surfaceMotion` and `backdropMotion` components for custom enter/exit animation; the native dialog remains open and inert until exit animations finish. Respect `prefers-reduced-motion` in custom motion components.

Use `DrawerHeader`, `DrawerHeaderNavigation`, `DrawerHeaderTitle`, `DrawerBody`, and `DrawerFooter` to compose the overlay surface. The header helper is a fragment so its named title and navigation slots remain direct children of the drawer. `DrawerHeaderTitle` accepts an optional `action`. `OverlayDrawer` is the Fluent convenience API with `start`/`small` defaults and `modalType`; `defaultOpen` initializes its uncontrolled state. `InlineDrawer` stays in page flow as a labelled, non-modal complementary region and supports a separator, logical placement, and the same header/body/footer pieces. `Drawer type="inline"` selects that in-flow engine.

```tsx
import { Button, DrawerBody, DrawerFooter, DrawerHeader, DrawerHeaderNavigation, DrawerHeaderTitle, InlineDrawer, OverlayDrawer } from "@vilius/sharepoint-ui/react";

<OverlayDrawer open={editing} onOpenChange={setEditing}>
  <DrawerHeader>
    <DrawerHeaderNavigation label="Document navigation"><Button>Back</Button></DrawerHeaderNavigation>
    <DrawerHeaderTitle action={<Button appearance="subtle">More</Button>}>Edit document</DrawerHeaderTitle>
  </DrawerHeader>
  <DrawerBody>Document fields and supporting information</DrawerBody>
  <DrawerFooter><Button onClick={() => setEditing(false)}>Cancel</Button><Button appearance="primary">Save</Button></DrawerFooter>
</OverlayDrawer>

<InlineDrawer open title="Workspace navigation" separator>
  <Button>Documents</Button>
</InlineDrawer>
```

```tsx
import { Button, Drawer } from "@vilius/sharepoint-ui/react";

<Button aria-controls="workspace-drawer" aria-expanded={open} onClick={() => setOpen(true)}>Details</Button>
<Drawer id="workspace-drawer" open={open} title="Workspace details" position="end" onOpenChange={setOpen}
  expandable expanded={expanded} onExpandedChange={setExpanded}
  actions={<Button onClick={() => setOpen(false)}>Done</Button>}>
  <p>Review library ownership and sharing settings.</p>
</Drawer>
```

`Tag` and `TagGroup` provide theme-derived filter/status chips, semantic `color="success" | "warning" | "danger" | "informative"` variants, size and shape variants, optional dismissal, and a composed horizontal or vertical group. Semantic fills and borders derive from the active theme surface and status colors; selected states use the theme selection role. Tag text and boundaries meet 4.5:1 and 3:1 in a 48-case light/strong-surface matrix across filled, outline, and brand appearances; forced-colors mode uses system colors. TagGroup accepts controlled `selectedValues` or `defaultSelectedValues`, inherits appearance, size, disabled and dismissible defaults, and emits `onTagSelect`/`onDismiss`. It defaults to a labelled toolbar and supports arrow-key navigation. `InteractionTag` composes a primary action and optional secondary dismiss action; `selected` is exposed as `aria-pressed` on the primary button. Both actions work through React callbacks or composed custom events. A dismissible `Tag` emits `onDismiss`; remove it from your controlled data to update the group.

```tsx
import { Tag, TagGroup } from "@vilius/sharepoint-ui/react";

<TagGroup aria-label="Active filters">
  {filters.map(filter => <Tag key={filter.id} value={filter.id} dismissible
    onDismiss={id => setFilters(items => items.filter(item => item.id !== id))}>
    {filter.label}
  </Tag>)}
</TagGroup>
```

```tsx
import { InteractionTag, InteractionTagPrimary, InteractionTagSecondary } from "@vilius/sharepoint-ui/react";

<InteractionTag value={document.id} selected={selected} onTagSelect={() => setSelected(value => !value)} onDismiss={() => removeDocument(document.id)}>
  <InteractionTagPrimary media={<Avatar name={document.owner} />}
    secondaryText={document.status}>{document.title}</InteractionTagPrimary>
  <InteractionTagSecondary />
</InteractionTag>
```

`TagPicker` combines search, multi-selection, removable chips, keyboard navigation, and form submission. Keep its option values stable, control the selected value array, and supply a label (or `aria-label`). Set `selectedLabel` or `SharePointUIProvider`'s `tagPickerSelected` string to localize the accessible name of the selected-options group. Compose `TagPickerControl`, `TagPickerGroup`, and `TagPickerInput` to customize the selected-value area, and `TagPickerList`/`TagPickerOptionGroup` to organize results while retaining the same picker state engine. `inline` keeps the open results in the regular document layer; `noPopover` keeps them visible for static or embedded result layouts. The default uses the browser top layer so SharePoint sections can’t clip the list.

```tsx
import { TagPicker, TagPickerControl, TagPickerGroup, TagPickerInput, TagPickerList, TagPickerOption, TagPickerOptionGroup } from "@vilius/sharepoint-ui/react";

<TagPicker label="Task owners" selectedValues={owners} onChange={setOwners}>
  <TagPickerOption value="amara">Amara Okafor</TagPickerOption>
  <TagPickerOption value="jordan">Jordan Lee</TagPickerOption>
  <TagPickerOption value="external" disabled>External user</TagPickerOption>
</TagPicker>
```

For a custom control layout, the compound parts retain the picker’s built-in keyboard, filtering, and form behavior:

```tsx
<TagPicker label="Task owners" selectedValues={owners} onChange={setOwners}>
  <TagPickerControl secondaryAction={<Button appearance="subtle">Browse directory</Button>}>
    <TagPickerGroup label="Selected owners">{selectedOwnerChips}</TagPickerGroup>
    <TagPickerInput placeholder="Search people" clearable />
  </TagPickerControl>
  <TagPickerList>
    <TagPickerOptionGroup label="Engineering">
      <TagPickerOption value="amara">Amara Okafor</TagPickerOption>
      <TagPickerOption value="jordan">Jordan Lee</TagPickerOption>
    </TagPickerOptionGroup>
  </TagPickerList>
</TagPicker>
```

The framework-neutral element uses `defineTagPicker` from `@vilius/sharepoint-ui/elements/tag-picker`, a `value: string[]` property, `spui-change` events, and child `spui-tag-picker-option` entries. Set `name` to submit each selected value as a repeated form field.

`Rating` uses native radio semantics, supports controlled/default values, configurable max and half-step precision, custom `iconFilled`/`iconOutline` React components (or `icon-filled`/`icon-outline` slots on the custom element), and native form participation with `name` and `required`.

```tsx
import { Rating } from "@vilius/sharepoint-ui/react";

<Rating label="Prioritization rating" value={rating} max={5} step={0.5}
  color="marigold" onChange={(_event, data) => setRating(data.value)} />
```

`RatingDisplay` is the read-only counterpart; it supports fractional values, compact mode, a localized count, custom icons, and custom item composition. `RatingItem` can also be used directly inside `<spui-rating-display>` to compose the stars. A display is announced as one image with a generated or supplied label.

```tsx
import { RatingDisplay, RatingItem } from "@vilius/sharepoint-ui/react";

<RatingDisplay value={4.5} count={128} color="brand" size="large" label="Customer rating">
  {Array.from({ length: 5 }, (_, index) => <RatingItem key={index} value={index + 1} />)}
</RatingDisplay>
```

`List` composes `ListItem` rows with optional single or multiple selection. It supports controlled `selectedItems`, `defaultSelectedItems`, a cancelable `onAction`, and `navigationMode="items" | "composite"`; the composite mode exposes grid/row semantics for rows containing focusable cells. Arrow keys move between rows, and composite rows also move through their internal controls. Selection callbacks provide `{ event, type: "change", selectedItems }`; item action callbacks provide `{ event, type: "ListItemAction", value }`, matching Fluent's event data shape. The native `spui-selection-change` detail includes the originating event and `type: "change"`. Use `disabledSelection` to prevent selection while preserving an item's action. A custom `checkmark` control such as `Checkbox` stays synchronized with the row selection and disabled state.

```tsx
import { Checkbox, List, ListItem } from "@vilius/sharepoint-ui/react";

<List aria-label="Recent documents" selectionMode="multiselect"
  defaultSelectedItems={["plan", "brief"]}>
  <ListItem value="plan" checkmark={<Checkbox aria-label="Select project plan" />}>Project plan</ListItem>
  <ListItem value="brief" disabledSelection>Read-only brief</ListItem>
</List>
```

Framework-neutral consumers can register `defineList()` from `@vilius/sharepoint-ui/elements/list` and compose `<spui-list selection-mode="multiselect"><spui-list-item value="plan">Project plan</spui-list-item></spui-list>`. Listen for `spui-selection-change` and cancelable `spui-list-item-action` events.

`Link` supports native safe URLs, subtle appearance, underline modes, inline text styling, and `disabledFocusable`. With `href`, it renders an anchor; without `href`, it renders a non-submitting button. Set `as="span"` for a button-like span with keyboard activation. Disabled-focusable links remain in the Tab sequence with `aria-disabled="true"` while blocking navigation and click callbacks. Unsafe URL schemes are removed from the rendered anchor.

`Breadcrumb` composes ordinary links into a labelled navigation landmark and ordered list. Pass `list={<ul />}` to replace the list root while retaining the same `BreadcrumbItem` children; framework-neutral consumers can assign an `<ol>` or `<ul>` with `slot="list"`. Use `current` on the current location item; optional `focusMode="arrow"` adds roving focus, Home/End, and RTL-aware arrow navigation while skipping the non-interactive current item.

```tsx
import { Breadcrumb, BreadcrumbItem, Link } from "@vilius/sharepoint-ui/react";

<Breadcrumb label="Page location" focusMode="arrow">
  <BreadcrumbItem><Link href="/sites/workspace">Workspace</Link></BreadcrumbItem>
  <BreadcrumbItem><Link href="/sites/workspace/Shared%20Documents">Shared documents</Link></BreadcrumbItem>
  <BreadcrumbItem current>Quarterly planning</BreadcrumbItem>
</Breadcrumb>
```

```tsx
import { Tree } from "@vilius/sharepoint-ui/react";
import type { TreeNode } from "@vilius/sharepoint-ui";

const libraries: TreeNode[] = [
  { id: "shared", label: "Shared documents", children: [
    { id: "planning", label: "Planning" },
  ] },
];

<Tree aria-label="Document libraries" items={libraries}
  defaultExpandedKeys={["shared"]} selectionMode="single" />
```

Tree defaults to no selection, matching Fluent UI; pass `selectionMode="single"` or `"multiselect"` to make rows selectable. It also accepts Fluent-style `openItems`/`defaultOpenItems` and `checkedItems`/`defaultCheckedItems`. Mixed items become checked on activation; unchecked multiselect callback maps retain an explicit `false` value, and single selection can be cleared by activating the selected item. `onOpenChange`, `onCheckedChange`, and `onNavigation` expose the corresponding state and keyboard navigation; `appearance` (`subtle`, `subtle-alpha`, `transparent`), `size` (`small`, `medium`), and `navigationMode` (`tree`, `treegrid`) tune the item surface and focus behavior. Existing `expandedKeys` and `selectedKeys` props remain supported. The custom element exposes `openItems`/`checkedItems` properties and matching appearance, size, and navigation attributes; `checkedItems` accepts keys or `[key, true|false|"mixed"]` entries, and selection events include the updated checked map.

Localize React defaults with `SharePointUIProvider` strings `treeLabel`, `treeToggleLabel`, `treeEmptyMessage`, `toolbarLabel`, `breadcrumbLabel`, `menuBarLabel`, `splitButtonMenuLabel`, `navigationToggle`, `splitNavItemActionLabel`, `virtualizerLabel`, `dataGridLabel`, `dataGridFilterLabel`, `dataGridSelectRow`, `dataGridSelectAll`, `dataGridRowLabel`, `dataGridLoadingLabel`, `dataGridEmptyLabel`, `dataGridSortPriority`, `dataGridResizeLabel`, `dataGridReorderLabel`, `dataGridEmptyGroupLabel`, `dataGridExpandGroupLabel`, `dataGridCollapseGroupLabel`, `dataGridGroupCountLabel`, `dataGridEditHint`, `dataGridSelectionCopied`, `dataGridCopyFailed`, `dataGridPasteOne`, `dataGridPasteMany`, `dataGridPasteFailed`, `dataGridColumnReordered`, and `tableResizeHandle`; explicit component labels take precedence. DataGrid message templates support `{message}`, `{count}`, `{label}`, and `{position}` placeholders where relevant. Direct custom elements accept their existing `label`/`aria-label` attributes.

`Tree` and `FlatTree` accept an optional `collapseMotion` component using the `PresenceMotionSlotProps` contract. It receives `visible` and `unmountOnExit` around each branch's ARIA `group`; exiting groups become inert and hidden from assistive technology while motion completes. Without this prop, Tree keeps its flat row rendering path.

For lift-and-shift composition, `TreeItem` declares branch/leaf structure and a `TreeItemLayout` or `TreeItemPersonaLayout` supplies the content. `FlatTree` accepts flat `FlatTreeItem` records with `parentValue`, which is useful when records arrive from an indexed SharePoint source.

```tsx
import { Tree, TreeItem, TreeItemLayout, TreeItemPersonaLayout } from "@vilius/sharepoint-ui/react";

<Tree aria-label="Workspace" selectionMode="single">
  <TreeItem value="team" itemType="branch" open>
    <TreeItemLayout iconBefore={<FolderIcon />} aside={<Badge>4</Badge>}>Team files</TreeItemLayout>
    <Tree>
      <TreeItem value="owner" itemType="leaf">
        <TreeItemPersonaLayout media={<Avatar name="Avery Chen" />} main="Avery Chen" description="Owner" />
      </TreeItem>
    </Tree>
  </TreeItem>
</Tree>
```

```tsx
import { VirtualList } from "@vilius/sharepoint-ui/react";

<VirtualList
  aria-label="Open tasks"
  items={tasks}
  itemKey={task => task.id}
  style={{ height: 360 }}
  renderItem={task => <><strong>{task.title}</strong><span>{task.owner}</span></>}
/>
```

For large index-based collections, use `Virtualizer` to avoid creating an `items` array just to pass a count. It supports horizontal and vertical scrolling, fixed or measured item sizes, bounded overscan, and imperative index navigation. Set `scrollMode="window"` for vertical page-flow lists that virtualize against browser scrolling rather than an inner scroll box. `itemSize` is the estimated width for horizontal lists or height for vertical lists; `measureItems` updates that estimate as rendered items resize. Dynamic `getItemSize(index)` callbacks are evaluated for rendered rows and refined by measurement. `gap` adds spacing to the calculated offsets; `bufferItems` sets item-count overscan, while `bufferSize` converts a pixel buffer into a bounded item overscan. `reversed` lays out items from the far edge inward. `containerSizeRef` receives the current viewport size, and `updateScrollPosition(position)` reports user and imperative scroll changes. Pass `virtualizerContext` to share the current rendered index with descendants; supplying `childProgressiveSizes` also materializes the legacy full prefix-size array. `useVirtualizerContext()` reads the current context. Set `--spui-list-width` on the host to size a horizontal viewport, and set `dir="rtl"` for logical RTL scrolling.

`VirtualizerScrollView` and `VirtualizerScrollViewDynamic` are compatibility views for the legacy Fluent APIs. They reuse the same responsive virtualizer engine and support `imperativeRef`, optional scroll pagination, and a `container` class/style slot. Prefer `Virtualizer` for new code.

The React entry point also exports the Fluent-compatible virtualizer helpers `useIntersectionObserver`, `useResizeObserverRef_unstable`, `useStaticVirtualizerMeasure`, `useDynamicVirtualizerMeasure`, `useMeasureList`, `createResizeObserverFromDocument`, `getRTLRootMargin`, `scrollToItemStatic`, and `scrollToItemDynamic`. Observer creation uses the target element's own window, which is useful when an SPFx web part runs inside an iframe. The observer hook reapplies four-sided root margins when its root changes to RTL. For a list you own, prefer `Virtualizer`'s imperative handle; the standalone dynamic scroll helper sums measured item sizes up to the target index.

For async collections, `VirtualList` accepts a `VirtualListDataSource` with a stable `length`, synchronous `getItem(index)`, and abortable `loadRange(start, end, signal)`. The range is end-exclusive and must populate every requested item before resolving. Optional `subscribe` notifies the list after external changes and allows retry after a reported load failure. Unloaded items are passed to `renderItem` as `undefined`; `aria-busy` tracks the active request, and `onDataLoadError` receives failures. The native element emits `spui-data-load-error` with the failed range and error.

```tsx
import type { VirtualListDataSource } from "@vilius/sharepoint-ui";
import { VirtualList } from "@vilius/sharepoint-ui/react";

<VirtualList dataSource={sharePointRows} aria-label="Documents"
  onDataLoadError={(error, range) => reportLoadFailure(error, range)}
  renderItem={(item, index) => item ? <DocumentRow item={item} /> : <RowPlaceholder index={index} />} />
```

```tsx
import { Virtualizer } from "@vilius/sharepoint-ui/react";

<Virtualizer aria-label="Open tasks" numItems={50_000} itemSize={40} virtualizerLength={24}>
  {index => <TaskRow task={tasks[index]} />}
</Virtualizer>

<Virtualizer className="recent-people" axis="horizontal" aria-label="Recently active people"
  numItems={people.length} itemSize={120} bufferItems={3} measureItems>
  {index => <Persona {...people[index]} />}
</Virtualizer>

<style>{`.recent-people { --spui-list-width: 100%; }`}</style>
```

The framework-neutral `spui-virtual-list` uses the same `axis="horizontal"`, `item-size`/`itemSize`, and `measure-items`/`measureItems` options. `row-height` remains supported for vertical lists. Its `scrollToIndex(index, align, behavior)` method navigates to items without creating a React dependency.

```ts
import { defineVirtualList } from "@vilius/sharepoint-ui/elements/virtual-list";

defineVirtualList();
type Person = { name: string };
const list = document.createElement("spui-virtual-list");
list.setAttribute("aria-label", "Recently active people");
list.axis = "horizontal";
list.itemSize = 120;
list.measureItems = true;
list.style.setProperty("--spui-list-width", "100%");
list.items = people;
list.renderItem = value => {
  const person = value as Person;
  const row = document.createElement("span");
  row.textContent = person.name;
  return row;
};
document.querySelector("#people-rail")?.append(list);
```

```tsx
import { Button, Table, TableBody, TableCell, TableCellActions, TableCellLayout, TableHeader, TableHeaderCell, TableRow, TableSelectionCell } from "@vilius/sharepoint-ui/react";

<Table aria-label="SharePoint requests" size="small" appearance="dividers">
  <TableHeader><TableRow><TableSelectionCell aria-label="Select all requests" /><TableHeaderCell sortable sortDirection={sort} onSort={setSort}>Modified</TableHeaderCell><TableHeaderCell>Request</TableHeaderCell></TableRow></TableHeader>
  <TableBody>{requests.map(request => <TableRow key={request.id} selected={selectedIds.indexOf(request.id) >= 0}>
    <TableSelectionCell aria-label={`Select ${request.id}`} checked={selectedIds.indexOf(request.id) >= 0} onSelectionChange={checked => toggleRequest(request.id, checked)} />
    <TableCell>{request.modified}</TableCell>
    <TableCell><TableCellLayout appearance="primary" truncate>{request.title}<TableCellActions><Button size="small">Open</Button></TableCellActions></TableCellLayout></TableCell>
  </TableRow>)}</TableBody>
</Table>
```

`Table` is the compact composable surface for ordinary lists. It provides table, row-group, row, header-cell and data-cell semantics; controlled sorting events; selection cells; pointer and keyboard resizing through `TableResizeHandle`; and `createTableColumn` for reusable column definitions. Set `noNativeElements` to use flex layout while retaining the same table roles. Use `DataGrid` when you need virtualized rows or columns, editing, grouping, remote data, or clipboard operations.

For app-owned table markup, compose Fluent-style feature plugins instead of rewriting row sorting, selection, and resizing. `useTableFeatures` supplies row IDs and row enhancers; `useTableSelection`, `useTableSort`, and `useTableColumnSizing_unstable` add state and actions. Keep the plugin list and order stable across renders. Attach `table.tableRef` to the measured container and apply the sizing props to header and body cells.

```tsx
import * as React from "react";
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, createTableColumn, useTableColumnSizing_unstable, useTableFeatures, useTableSelection, useTableSort } from "@vilius/sharepoint-ui/react";

type Request = { id: string; title: string };
const columns = [createTableColumn<Request>({
  columnId: "title",
  compare: (a, b) => a.title.localeCompare(b.title),
  renderCell: request => request.title,
})];

function RequestTable({ requests }: { requests: Request[] }) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string | number>>(new Set());
  const [sortState, setSortState] = React.useState<{ sortColumn: string | undefined; sortDirection: "ascending" | "descending" }>({ sortColumn: "title", sortDirection: "ascending" });
  const table = useTableFeatures({ items: requests, columns, getRowId: request => request.id }, [
    useTableSelection<Request>({ selectionMode: "multiselect", selectedItems: selectedIds,
      onSelectionChange: (_event, data) => setSelectedIds(data.selectedItems) }),
    useTableSort<Request>({ sortState, onSortChange: (_event, next) => setSortState(next) }),
    useTableColumnSizing_unstable<Request>({ autoFitColumns: false, columnSizingOptions: { title: { minWidth: 120, idealWidth: 240 } } }),
  ]);
  const rows = table.sort.sort(table.getRows());
  const titleHeader = table.columnSizing_unstable.getTableHeaderCellProps("title");
  const titleCell = table.columnSizing_unstable.getTableCellProps("title");
  return <div ref={table.tableRef}><Table aria-label="Requests">
    <TableHeader><TableRow><TableHeaderCell style={titleHeader.style} aside={titleHeader.aside}>
      <button type="button" onClick={event => table.sort.toggleColumnSort(event, "title")}>Sort requests</button>
    </TableHeaderCell></TableRow></TableHeader>
    <TableBody>{rows.map(row => <TableRow key={row.rowId} selected={table.selection.isRowSelected(row.rowId)}>
      <TableCell style={titleCell.style}><button type="button" onClick={event => table.selection.toggleRow(event, row.rowId)}>
        {row.item.title} · {table.selection.isRowSelected(row.rowId) ? "Selected" : "Select"}
      </button></TableCell>
    </TableRow>)}</TableBody>
  </Table></div>;
}
```

```tsx
import { DataGrid } from "@vilius/sharepoint-ui/react";
import type { DataGridColumn } from "@vilius/sharepoint-ui";

type Task = { id: string; title: string; owner: string };
const columns: DataGridColumn<Task>[] = [
  { id: "id", label: "ID", width: "120px" },
  { id: "title", label: "Task" },
  { id: "owner", label: "Owner" },
];

<DataGrid items={tasks} columns={columns} getRowId={task => task.id}
  selectionMode="multiple" height={360} />
```

For Fluent-style composition, add `DataGridHeader`/`DataGridBody`, `DataGridRow`, and cells beneath `DataGrid`. This path accepts the same indexed `dataSource` as the virtualized renderer, automatically windows rows to the bounded grid viewport, aborts stale range requests, and supports provider group rows and compact query-scoped select-all. Supply `onDataLoadError`, `onRenderedRange`, `onDataSourceGroupToggle`, or `onDataSourceSelectionChange` to observe provider activity. `DataGridHeaderCell.sortDirection` can explicitly display `"ascending"` or `"descending"` state with matching `aria-sort` and a direction indicator; composed grids derive it from `sortState` when omitted. `DataGridSelectionCell` supports `checked="mixed"`, checkbox/radio `type`, subtle row-hover visibility, `invisible`, and deprecated `hidden` behavior. A body cell opts into editing with `editable` and its current `value`; Enter starts editing when the cell has no nested action, while F2 always starts it. Escape cancels, Enter or blur validates and saves, and an asynchronous `onCellEdit` must resolve before the displayed value is accepted. Rejected saves keep the draft open. Use `editType="number" | "date"`, `validateCellEdit`, and localized `rowLabel`/`editHint` as needed. For local collections, composed rows automatically virtualize above 100 items; set `virtualize` to override and supply `rowHeight`/`overscan` estimates.

For large or server-paged lists, supply an indexed source instead of materializing all rows. `length` is the displayed row count; provide `selectableCount` when that count includes group headers. Implement `getItem` for a flat list, or `getRow` when the provider also returns group headers. Sorting, filtering, and grouping order are owned by the source; update its cache and notify subscribers after the query changes.

```tsx
import { DataGrid } from "@vilius/sharepoint-ui/react";
import type { DataGridDataSource } from "@vilius/sharepoint-ui";

const listeners = new Set<() => void>();
const cache = new Map<number, Task>();
let queryKey = "initial";
const source: DataGridDataSource<Task> = {
  get length() { return totalRows; },
  get selectionScopeKey() { return queryKey; },
  getItem: index => cache.get(index),
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  async loadRange(start, end, signal) {
    const rows = await fetchTasks({ start, end, sort, filter, signal });
    rows.forEach((task, offset) => cache.set(start + offset, task));
    listeners.forEach(listener => listener());
  },
  async copySelection(selection, selectedColumns, signal) {
    return exportTasksAsTsv({ selection, columns: selectedColumns, sort, filter, signal });
  },
};

<DataGrid dataSource={source} columns={columns} getRowId={task => task.id}
  onSortChange={next => updateServerSort(next)}
  onFilterValueChange={next => updateServerFilter(next)} />
```

For grouped sources, return rows such as `{ kind: "group", key, label, count, expanded }` and `{ kind: "item", item, rowId?, itemIndex? }`. Handle `onDataSourceGroupToggle` by updating the provider rows and notifying subscribers. The native element exposes the same callback as `onDataSourceGroupToggle` and emits `spui-data-source-group-toggle`.

The header checkbox selects all records matching the provider's current query using a compact model; it does not enumerate IDs. Individual deselection adds an excluded key. Set `selectionScopeKey` to a stable key for the active server query; all-matching selection records that key and stops applying when the query changes. Update the key before notifying subscribers when sort/filter/group state changes. Use `onDataSourceSelectionChange` and persist the model alongside the server query for bulk operations. The callback's `selectedItems` includes loaded records only. React supports controlled `selectionModel` and uncontrolled `defaultSelectionModel`; the native element exposes `selectionModel` and emits it with `spui-selection-change`.

Press **Ctrl+C / Cmd+C** on a grid cell to copy its value, or on a selected row to copy selected rows as tab-separated values. For remote selections, implement `copySelection(selection, columns, signal)` to return TSV without loading every row; async copy uses the browser Clipboard API and announces errors. Paste TSV into an editable cell to fill a rectangular range. For indexed sources, the grid loads only the destination rows that are missing before validating. Quoted tabs, newlines, and quotes are preserved. Every target cell is checked for editability and validation before saving; numeric and date cells reject invalid values. A multi-cell paste (up to 1,000 cells and 1,000,000 characters) requires `onCellsEdit`, which should persist the complete edit list as one transaction. The grid updates local values only after that promise succeeds. A rejected save leaves all cells unchanged. A one-cell paste uses `onCellEdit`.

```tsx
<DataGrid items={tasks} columns={columns} getRowId={task => task.id}
  selectionMode="multiple"
  onCellsEdit={edits => saveTaskEditsTransactionally(edits)} />
```

Framework-neutral consumers assign `grid.onCellsEdit = async edits => ...`. Successful bulk commits emit `spui-cells-edit` with `{ edits }`; rejected or invalid pastes emit `spui-cells-edit-error` with `{ message, edits }`.

Provide `getRowHeight` when records need different row heights. Heights are bounded to 10,000 px; virtual positioning and arrow-key reveal use the same prefix-sum index as variable-size lists.

```tsx
<DataGrid items={tasks} columns={columns} getRowId={task => task.id}
  height={360} rowHeight={40}
  getRowHeight={task => task.description.length > 120 ? 88 : 40} />
```

```tsx
import { Input } from "@vilius/sharepoint-ui/react";

<Input type="email" aria-label="Contact email" name="contactEmail"
  value={email} onValueChange={setEmail} required />
```

`Input` is a bare, form-associated control with native validation/reset and `before`/`after` slots. Supply `input` as native input props or an `<input>` element to replace its internal native control; host value, disabled/required state, validation, events, and form submission continue to work. Supply `aria-label` or `aria-labelledby` because a document-level `<label>` cannot label the native input inside its shadow root. Use `TextField` when you want the library to render an associated visible label.

Use `FileUpload` to select files for an application upload flow. It supports browse and drag/drop, type/count/size limits, removable file rows, localized labels, required validation, and native form `FormData`. It reports `File[]` through `onFilesChange`; the application remains responsible for sending those files to SharePoint or another service.

```tsx
import { FileUpload } from "@vilius/sharepoint-ui/react";

<FileUpload label="Attachments" name="attachments" accept=".pdf,image/*"
  multiple maxFiles={5} maxFileSize={10 * 1024 * 1024}
  onFilesChange={setFiles} onFilesError={reportFileErrors} />
```

For custom elements, call `defineFileUpload()` from `@vilius/sharepoint-ui/elements/file-upload`. Listen for `spui-file-change` (`detail.files`) and `spui-file-error` (`detail.errors`); selected files are available from the host's `files` property.

`RichTextEditor` sanitizes rich HTML pasted from other apps and preserves line breaks when plain text is pasted; markup-looking plain text stays inert. Undo/redo, form reset/required behavior, and disabled fieldsets are supported. It can insert durable images when the application provides an uploader. The callback owns SharePoint library selection, upload permissions, and URL persistence; returned links must use HTTP or HTTPS. The editor also accepts pasted image files through the same callback, limits each image to 10 MiB, and saves the resulting image URL in its HTML value.

```tsx
<RichTextEditor label="Description" value={html} onValueChange={setHtml}
  onImageUpload={async file => uploadToSharePointSiteAssets(file)} />
```

Framework-neutral consumers set the element's `uploadImage` property to the same `(file: File) => Promise<string>` contract. Failed uploads emit `spui-image-upload-error`; the existing editor value is preserved.

`components.json` is the agent-facing API index: it records each React signature, callback props, child slots, styling hooks, and the cross-cutting SharePoint theme, localization, persistence, and accessibility contract. Run `npm run catalog:check --workspace @vilius/sharepoint-ui` to catch stale signatures and missing entries.

Compose a small manual Carousel from the existing SharePoint view cards. It uses native touch scrolling, keyboard controls, localized provider strings, RTL-aware key handling, and reduced-motion behavior.

```tsx
import { Badge, Carousel, ViewCard } from "@vilius/sharepoint-ui/react";

<Carousel label="Recently updated documents" onIndexChange={setActiveIndex}>
  {documents.map(document => <ViewCard key={document.id} kind="document"
    title={document.name} subtitle={document.modifiedLabel}>
    <Badge slot="status">{document.status}</Badge>
  </ViewCard>)}
</Carousel>
```

For custom-element or other framework use, call `defineCarousel()` from `@vilius/sharepoint-ui/elements/carousel` and compose direct child slides; it emits `spui-carousel-change` with `{ value: index }`.

```tsx
import { Accordion, AccordionItem } from "@vilius/sharepoint-ui/react";

<Accordion mode="single">
  <AccordionItem heading="Document details" defaultOpen>
    <p>Owner, modified date, and library information.</p>
  </AccordionItem>
  <AccordionItem heading="Sharing">Access and sharing details.</AccordionItem>
</Accordion>
```

`AccordionProvider` can supply controlled `openItems`, `multiple`, `collapsible`, and `navigation` defaults to a composed `Accordion`; its `requestToggle({ event, value })` callback owns state updates. Explicit props on `Accordion` take precedence.
In single non-collapsible mode, the only open header exposes `aria-disabled="true"` while remaining in the tab order, matching Fluent's disabled-focusable behavior.
`AccordionHeader` accepts Fluent's `button` slot as a native button element or button props. Use it to add a class, inline styles, accessible labels, data attributes for stable tests, or an `onClick` handler; the library retains ownership of the button's expanded, disabled, type, and keyboard-navigation state. The handler receives the native click event and can call `preventDefault()` to cancel the toggle.
`AccordionPanel` accepts `collapseMotion` for a custom presence transition. While closing, the region remains mounted but becomes inert and `aria-hidden` until the motion finishes; reopening cancels the pending exit. Custom motion should respect `prefers-reduced-motion`.

For agent-friendly composition, theming, localization, RTL, rich-text persistence, and handoff checks, see [AGENTS.md](./AGENTS.md). Agent Skills compatible tools can load the task-specific skill from `skills/sharepoint-ui`; for example: `npx skills add ./node_modules/@vilius/sharepoint-ui/skills/sharepoint-ui`.
