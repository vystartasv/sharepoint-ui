import * as React from "react";
import { defineButton } from "./elements/button.js";
import { defineButtonGroup } from "./elements/button-group.js";
import { defineCompoundButton, defineMenuButton, defineSplitButton, defineToggleButton, type ButtonAppearance, type ButtonShape, type ButtonSize } from "./elements/button-variants.js";
import { defineInput, type InputAppearance, type InputSize, type InputType } from "./elements/input.js";
import { defineFileUpload, type FileUploadError } from "./elements/file-upload.js";
import { getImageStyle, type ImageFit, type ImageShape } from "./elements/image.js";
import { defineField } from "./elements/field.js";
import { getFieldValidationTokens, mergeFieldIdRefs, type FieldOrientation, type FieldValidationState } from "./elements/field-composition.js";
import { defineCard, type CardAppearance, type CardFocusMode, type CardOrientation, type CardSize } from "./elements/card.js";
import { defineCardFooter, defineCardHeader, defineCardPreview } from "./elements/card-primitives.js";
import { defineBadge, defineCounterBadge, definePresenceBadge, type BadgeAppearance, type BadgeColor, type BadgeShape, type BadgeSize, type PresenceBadgeStatus } from "./elements/badge.js";
import { defineCheckbox, defineSwitch } from "./elements/toggle.js";
import { defineTextArea } from "./elements/textarea.js";
import { defineSpinner, type SpinnerAppearance, type SpinnerLabelPosition, type SpinnerSize } from "./elements/spinner.js";
export type { SpinnerAppearance, SpinnerLabelPosition, SpinnerSize } from "./elements/spinner.js";
import { defineMessageBar, defineMessageBarActions, defineMessageBarBody, defineMessageBarGroup, defineMessageBarTitle, type MessageBarGroupAnimation, type MessageBarIntent, type MessageBarLayout, type MessageBarPoliteness, type MessageBarShape } from "./elements/message-bar.js";
import { defineViewCard } from "./elements/view-card.js";
import { defineDialog, defineDialogActions, defineDialogBody, defineDialogContent, defineDialogSurface, defineDialogTitle, defineDialogTrigger, type DialogOpenChangeData } from "./elements/dialog.js";
export type { DialogOpenChangeData } from "./elements/dialog.js";
export type DialogOpenChangeEvent = React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>;
export type DialogOnOpenChangeData =
  | { type: "escapeKeyDown"; open: boolean; event: React.KeyboardEvent<HTMLElement> }
  | { type: "backdropClick" | "triggerClick"; open: boolean; event: React.MouseEvent<HTMLElement> };
import { defineDrawer, defineInlineDrawer } from "./elements/drawer.js";
import { defineProgressBar, type ProgressBarColor, type ProgressBarShape, type ProgressBarThickness } from "./elements/progress-bar.js";
export type { ProgressBarColor, ProgressBarShape, ProgressBarThickness } from "./elements/progress-bar.js";
import { defineSelect } from "./elements/select.js";
import { defineRadioGroup } from "./elements/radio-group.js";
import { defineSpinButton } from "./elements/spin-button.js";
export type { SpinButtonAppearance, SpinButtonSize, SpinButtonChangeData } from "./elements/spin-button.js";
import { defineSlider } from "./elements/slider.js";
import { defineDatePicker } from "./elements/date-picker.js";
import { defineCombobox } from "./elements/combobox.js";
import { defineRichTextEditor } from "./elements/rich-text-editor.js";
import { defineAlert } from "./elements/alert.js";
import { defineSkeleton, defineSkeletonItem, type SkeletonAnimation, type SkeletonAppearance, type SkeletonItemSize, type SkeletonShape } from "./elements/skeleton.js";
import { defineLink } from "./elements/link.js";
import { defineDivider, type DividerAppearance } from "./elements/divider.js";
export type { DividerAppearance } from "./elements/divider.js";
import { defineAccordion, type AccordionItemValue, type AccordionNavigation } from "./elements/accordion.js";
import { defineAvatar, type AvatarColor } from "./elements/avatar.js";
import { defineAvatarGroup } from "./elements/avatar-group.js";
import { defineAvatarGroupItem } from "./elements/avatar-group-primitives.js";
import { definePersona, type PersonaPresence, type PersonaSize } from "./elements/persona.js";
import { VariableSizeIndex, type VirtualListDataSource } from "./elements/virtual-list.js";
import { clampDataGridColumnWidth, clampDataGridRowHeight, dataGridColumnVar, filterDataGridItems, fitDataGridColumnWidths, formatDataGridClipboard, getDataGridColumnSizing, getDataGridColumnWindow, getDataGridCellValue, groupDataGridItems, isDataGridRowSelected, parseDataGridClipboard, parseDataGridClipboardValue, parseDataGridInputValue, sortDataGridItems, toDataGridInputValue, writeDataGridClipboardText, type DataGridCellEdit, type DataGridColumn, getDataGridDataSourceRow, type DataGridDataSource, type DataGridDataSourceRow, type DataGridColumnSizingOptions, type DataGridColumnWidths, type DataGridEditValue, type DataGridFocusMode, type DataGridGroup, type DataGridSelectionAppearance, type DataGridSelectionModel, setDataGridRowSelected, type DataGridSort, type DataGridSortState } from "./elements/data-grid-model.js";
import { flattenAllTree, flattenTree, type TreeNode, type VisibleTreeNode } from "./elements/tree-model.js";
import { defineInteractionTag, defineInteractionTagPrimary, defineInteractionTagSecondary, defineTag, defineTagGroup, type InteractionTagSelectData, type TagAppearance, type TagGroupSelectData, type TagSize } from "./elements/tags.js";
import { defineTagPicker, type TagPickerOpenChangeType, type TagPickerOnOpenChangeData, type TagPickerOnOptionSelectData } from "./elements/tag-picker.js";
export type { TagPickerOpenChangeType, TagPickerOnOpenChangeData, TagPickerOnOptionSelectData } from "./elements/tag-picker.js";
import { defineRating } from "./elements/rating.js";
import { defineRatingDisplay, defineRatingItem } from "./elements/rating-display.js";
import { defineList, defineListItem, type ListItemActionData, type ListItemActionEvent, type ListItemValue, type ListNavigationMode, type ListSelectionChangeData, type ListSelectionMode } from "./elements/list.js";
export type { ListItemActionData, ListItemActionEvent, ListSelectionChangeData } from "./elements/list.js";
import { defineBreadcrumb, defineBreadcrumbButton, defineBreadcrumbDivider, defineBreadcrumbItem } from "./elements/breadcrumb.js";
import { defineTabs } from "./elements/tabs.js";
import { defineTooltip, type TooltipAppearance, type TooltipPositioning, type TooltipRelationship, type TooltipVisibleChangeData } from "./elements/tooltip.js";
import { definePopover, type PopoverOpenChangeData, type PopoverPositioning } from "./elements/popover.js";
export type { PopoverAlignment, PopoverAutoSize, PopoverBoundary, PopoverBoundaryPadding, PopoverBoundaryRect, PopoverOffset, PopoverOpenChangeData, PopoverPosition, PopoverPositioning, PopoverTarget } from "./elements/popover.js";
import { defineTeachingPopover as defineNativeTeachingPopover, type TeachingPopoverCarouselValueChangeType } from "./elements/teaching-popover.js";
export type { TeachingPopoverCarouselValueChangeType, TeachingPopoverCarouselValueChangeDetail, TeachingPopoverFinishDetail } from "./elements/teaching-popover.js";
import { defineMenu, defineMenuItem, defineMenuItemLink, defineMenuDivider, defineMenuGroup, defineMenuGroupHeader, defineMenuList, defineMenuPopover, defineMenuSplitGroup, defineMenuTrigger, defineMenuBar as defineNativeMenuBar, defineMenuBarItem, type MenuOpenChangeData } from "./elements/menu.js";
export type { MenuOpenChangeData, MenuOpenChangeType } from "./elements/menu.js";
import { defineText, type TextFont, type TextSize, type TextTag, type TextWeight } from "./elements/text.js";
import { defineToast, defineToastBody, defineToastFooter, defineToastTitle, type ToastIntent, type ToastPoliteness } from "./elements/toast.js";
import { defineToaster, type ToastAnnounce, type ToastPosition } from "./elements/toaster.js";
export type { ToastAnnounce, ToastAnnounceOptions } from "./elements/toaster.js";
export type { ToastAppearance } from "./elements/toast.js";
import { defineSearchBox, type SearchAppearance, type SearchSize } from "./elements/search.js";
import { defineColorPicker, defineColorArea, defineColorSlider, defineAlphaSlider, type ColorPickerFormat, type ColorPickerHsvColor, type ColorPickerShape, type ColorPickerSize, type ColorSliderChannel } from "./elements/color-picker.js";
export type { ColorPickerHsvColor } from "./elements/color-picker.js";
import { defineToolbar, defineToolbarGroup, defineToolbarSeparator, defineToolbarRadioGroup, defineToolbarRadioButton, type ToolbarCheckedValues } from "./elements/toolbar.js";
import { defineNav, defineNavItem, defineAppItem, defineAppItemStatic, defineHamburger, defineNavDrawer, defineNavDrawerBody, defineNavDrawerFooter, defineNavDrawerHeader, defineSplitNavItem, defineNavCategory, defineNavCategoryItem, defineNavSubItemGroup, defineNavSubItem, defineNavDivider, defineNavSectionHeader, type NavItemSelectData, type NavCategoryToggleData } from "./elements/nav.js";
export type { NavItemSelectData, NavCategoryToggleData } from "./elements/nav.js";
export type NavReactItemSelectData = Omit<NavItemSelectData, "event" | "type"> & ({ type: undefined; event: SharePointUIEvent } | { type: "click"; event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement> });
export type NavReactCategoryToggleData = Omit<NavCategoryToggleData, "event" | "type"> & ({ type: undefined; event: SharePointUIEvent } | { type: "click"; event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement> });
function createNavActionEvent(sourceEvent: MouseEvent, dispatchEvent: Event, host: HTMLElement): React.MouseEvent<HTMLButtonElement | HTMLAnchorElement> {
  const target = sourceEvent.composedPath().find((entry): entry is HTMLAnchorElement | HTMLButtonElement => entry instanceof HTMLAnchorElement || entry instanceof HTMLButtonElement)
    ?? sourceEventTarget(sourceEvent, host) as HTMLAnchorElement | HTMLButtonElement;
  return createReactEventBridge(sourceEvent, dispatchEvent, target, target) as React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>;
}
import { ensureLabelStyles, getLabelStyle, type LabelSize, type LabelWeight } from "./elements/label.js";
import { defineInfoButton, type InfoPlacement } from "./elements/info.js";
import { defineCarousel, defineCarouselCard, defineCarouselNav, defineCarouselNavButton, defineCarouselNavImageButton, defineCarouselButton, defineCarouselAutoplayButton, defineCarouselNavContainer, defineCarouselSlider, defineCarouselViewport, type CarouselAlign, type CarouselAppearance, type CarouselIndexChangeData, type CarouselMotion } from "./elements/carousel.js";
export type { CarouselIndexChangeData } from "./elements/carousel.js";
export type { CarouselAlign, CarouselAppearance, CarouselMotion } from "./elements/carousel.js";
import { defineOverflow, defineOverflowItem, defineOverflowDivider, type OverflowAxis, type OverflowState } from "./elements/overflow.js";
export type { OverflowAxis, OverflowState } from "./elements/overflow.js";
import { defineSwatchPicker as defineNativeSwatchPicker } from "./elements/swatch-picker.js";
import { createTableColumn as createNativeTableColumn, defineTable as defineNativeTable } from "./elements/table.js";
import { getSharePointUIStyleTokens, type SharePointUIAppearance, type SharePointUIBaseAppearance, type SharePointUIDensity, type SharePointUIStyleTokens } from "./appearance.js";
import { getSharePointUIDesignTokens, type FluentThemeTokens, type SharePointUIDesignTheme } from "./theme.js";
export { createResizeObserverFromDocument, getRTLRootMargin, scrollToItemDynamic, scrollToItemStatic, useDynamicVirtualizerMeasure, useIntersectionObserver, useMeasureList, useResizeObserverRef_unstable, useStaticVirtualizerMeasure } from "./virtualizer-hooks.js";
export type { IndexedResizeCallbackElement, ResizeCallbackWithRef, ScrollToItemDynamicParams, ScrollToItemStaticParams, VirtualizerContextMeasureProps, VirtualizerMeasureDynamicProps, VirtualizerMeasureProps } from "./virtualizer-hooks.js";
export { composeSharePointUIDesignThemes } from "./theme.js";
export type { FluentThemeTokens, SharePointUIDesignTheme } from "./theme.js";
export type { AvatarColor, AvatarNamedColor } from "./elements/avatar.js";
export type { SharePointUIDensity } from "./appearance.js";

export type SharePointUIEvent = Event | React.SyntheticEvent;
type SharePointUIEventData<T> = T extends { event: unknown }
  ? Omit<T, "event"> & { event: SharePointUIEvent }
  : T extends { event?: unknown }
    ? Omit<T, "event"> & { event?: SharePointUIEvent }
    : T;
type MenuEventData<T> = T extends { type: infer Type; event: infer E }
  ? Type extends "clickOutside" | "scrollOutside"
    ? Omit<T, "event"> & { event: E }
    : Type extends "menuSafeZoneMouseEnter"
      ? Omit<T, "event"> & { event: React.MouseEvent<Element> }
      : Omit<T, "event"> & { event: E extends MouseEvent ? React.MouseEvent<HTMLElement> : E extends KeyboardEvent ? React.KeyboardEvent<HTMLElement> : E }
  : never;
type MenuReactOpenChangeData = MenuOpenChangeData extends infer T ? T extends MenuOpenChangeData ? MenuEventData<T> : never : never;
type MenuReactOpenChangeEvent = MenuReactOpenChangeData["event"];
type ElementProps = React.HTMLAttributes<HTMLElement> & { [attribute: `data-${string}`]: string | number | boolean | undefined };
export type FieldControlProps = Pick<React.HTMLAttributes<HTMLElement>, "id" | "aria-label" | "aria-labelledby" | "aria-describedby" | "aria-description" | "aria-invalid" | "aria-required">;
export type FieldControlOptions = { supportsLabelFor?: boolean; supportsRequired?: boolean; supportsSize?: boolean };
export type FieldContextValue = Readonly<{
  generatedControlId: string;
  labelText?: string;
  descriptionText?: string;
  orientation: FieldOrientation;
  required: boolean;
  size: LabelSize;
  validationState: FieldValidationState;
  labelFor?: string;
  labelId?: string;
  validationMessageId?: string;
  hintId?: string;
  disabled?: boolean;
}>;
const FieldContext = React.createContext<FieldContextValue | undefined>(undefined);

/** Merge Field context into a form control or custom control's prop set. */
export function useFieldControlProps_unstable<T extends object>(props: T, options: FieldControlOptions = {}): T & FieldControlProps {
  const field = React.useContext(FieldContext);
  if (!field) return props as T & FieldControlProps;
  const next: Record<string, unknown> = { ...(props as Record<string, unknown>) };
  if (next.id == null) next.id = field.generatedControlId;
  if (field.labelText && next["aria-label"] == null) next["aria-label"] = field.labelText;
  if (field.descriptionText && next["aria-description"] == null) next["aria-description"] = field.descriptionText;
  if (field.validationState === "error" && next["aria-invalid"] == null) next["aria-invalid"] = true;
  if (field.required) {
    if (options.supportsRequired) next.required ??= true;
    else next["aria-required"] ??= true;
  }
  if (field.disabled) next.disabled ??= true;
  if (options.supportsSize && next.size == null) next.size = field.size;
  const tokens = getFieldValidationTokens(field.validationState);
  if (tokens) next.style = { ...(next.style as React.CSSProperties | undefined), "--spui-control-border": tokens.border, "--spui-input-border": tokens.border, "--spui-focus-ring": tokens.border };
  return next as T & FieldControlProps;
}

export type ToastDispatchOptions = { id?: string; toastId?: string; title?: React.ReactNode; priority?: number; intent?: ToastIntent; appearance?: "brand" | "inverted"; politeness?: ToastPoliteness; timeout?: number; dismissLabel?: string; pauseOnHover?: boolean; pauseOnWindowBlur?: boolean; action?: React.ReactNode; onAction?: (id: string) => void };
type SpuiEventDetail = { value?: string | number; valueType?: string; values?: string[]; selectedValues?: string[]; selected?: boolean; selectedItems?: ListItemValue[]; selectedColors?: string[]; selectedOptions?: string[]; selectedValue?: string; selectedSwatch?: string; selectedColor?: string; color?: ColorPickerHsvColor; selectionMode?: "single" | "multiple"; checked?: boolean | "mixed"; checkedItems?: string[]; name?: string; pressed?: boolean; open?: boolean; openItems?: string[]; reason?: string; expanded?: boolean; collapsed?: boolean; openCategories?: string[]; visibleIds?: string[]; overflowIds?: string[]; href?: string | null; label?: string; alpha?: number; format?: string; files?: File[]; errors?: FileUploadError[]; sourceEvent?: Event; event?: Event; originalEvent?: Event; type?: string };
export type SharePointUIStrings = { loading: string; close: string; dismiss: string; notifications?: string; clear: string; spinButtonIncrement?: string; spinButtonDecrement?: string; remove: string; noResults: string; required: string; invalidValue: string; moreInformation: string; people?: string; showMorePeople?: string; showFewerPeople?: string; navigationMenu?: string; navigationClose?: string; navigationExpand?: string; navigationCollapse?: string; treeLabel?: string; treeToggleLabel?: string; treeEmptyMessage?: string; splitButtonMenuLabel?: string; navigationToggle?: string; splitNavItemActionLabel?: string; virtualizerLabel?: string; dataGridLabel?: string; dataGridFilterLabel?: string; dataGridSelectRow?: string; dataGridSelectAll?: string; dataGridRowLabel?: string; dataGridLoadingLabel?: string; dataGridEmptyLabel?: string; dataGridSortPriority?: string; dataGridResizeLabel?: string; dataGridReorderLabel?: string; dataGridEmptyGroupLabel?: string; dataGridExpandGroupLabel?: string; dataGridCollapseGroupLabel?: string; dataGridGroupCountLabel?: string; dataGridEditHint?: string; dataGridSelectionCopied?: string; dataGridCopyFailed?: string; dataGridPasteOne?: string; dataGridPasteMany?: string; dataGridPasteFailed?: string; dataGridColumnReordered?: string; tableResizeHandle?: string; toolbarLabel?: string; breadcrumbLabel?: string; menuBarLabel?: string; drawerExpand?: string; drawerRestore?: string; drawerLabel?: string; drawerNavigation?: string; tableResizeColumn?: string; ratingValue: string; colorChoose: string; colorHex: string; colorHue?: string; colorArea?: string; colorAreaValue?: string; colorSaturation?: string; colorValue?: string; colorFormat?: string; colorRgb?: string; colorRed?: string; colorGreen?: string; colorBlue?: string; colorOpacity: string; colorSwatches: string; colorAdd?: string; colorSwatch: string; colorInvalid: string; richTextBold: string; richTextItalic: string; richTextUnderline: string; richTextBulletList: string; richTextNumberList: string; richTextLink: string; richTextToolbar: string; richTextLinkPrompt: string; richTextRequired?: string; richTextChooseImage?: string; richTextUndo?: string; richTextRedo?: string; richTextInsertTable?: string; richTextInsertImage?: string; richTextInsertRowAbove?: string; richTextInsertRowBelow?: string; richTextInsertColumnBefore?: string; richTextInsertColumnAfter?: string; richTextDeleteRow?: string; richTextDeleteColumn?: string; richTextDeleteTable?: string; fileUploadBrowse?: string; fileUploadDrop?: string; fileUploadRemove?: string; fileUploadSelected?: string; fileUploadRequired?: string; fileUploadTypeError?: string; fileUploadSizeError?: string; fileUploadLimitError?: string; datePickerCalendar?: string; datePickerPreviousMonth?: string; datePickerNextMonth?: string; datePickerInvalid?: string; datePickerRequired?: string; carouselDescription?: string; carouselPrevious?: string; carouselNext?: string; carouselSlide?: string; carouselRoleDescription?: string; carouselSlides?: string; carouselNavigation?: string; carouselPlay?: string; carouselPause?: string; teachingPopoverLabel?: string; teachingPopoverDismiss?: string; teachingPopoverPrevious?: string; teachingPopoverNext?: string; teachingPopoverFinish?: string; teachingPopoverSteps?: string; teachingPopoverPageCount?: string; teachingPopoverPageLabel?: string; overflowDescription?: string; overflowMenuLabel?: string };
type UIContextValue = { lang?: string; dir?: "ltr" | "rtl" | "auto"; appearance: SharePointUIAppearance; baseAppearance: SharePointUIBaseAppearance; density: SharePointUIDensity; theme?: SharePointUIDesignTheme; hasThemeValues: boolean; tokens?: Partial<SharePointUIStyleTokens>; fluentTokens?: FluentThemeTokens; styleTokens: SharePointUIStyleTokens; fluentTokenStyles: Record<string, string | number>; hostStyle: React.CSSProperties; providesCssInheritance: boolean; strings: SharePointUIStrings };
const defaultStrings: SharePointUIStrings = { loading: "Loading", close: "Close", dismiss: "Dismiss", notifications: "Notifications", clear: "Clear", spinButtonIncrement: "Increase value", spinButtonDecrement: "Decrease value", remove: "Remove", noResults: "No results", required: "Required", invalidValue: "Enter a valid value", moreInformation: "More information", people: "People", showMorePeople: "Show more people ({count})", showFewerPeople: "Show fewer people", navigationMenu: "Open navigation", navigationClose: "Close navigation", navigationExpand: "Expand navigation", navigationCollapse: "Collapse navigation", treeLabel: "Tree", treeToggleLabel: "Expand or collapse", treeEmptyMessage: "No items", splitButtonMenuLabel: "More options", navigationToggle: "Toggle navigation", splitNavItemActionLabel: "More actions", virtualizerLabel: "Items", dataGridLabel: "Data grid", dataGridFilterLabel: "Search rows", dataGridSelectRow: "Select row", dataGridSelectAll: "Select all rows", dataGridRowLabel: "row", dataGridLoadingLabel: "Loading…", dataGridEmptyLabel: "No items", dataGridSortPriority: "Sort priority {priority}", dataGridResizeLabel: "Resize column", dataGridReorderLabel: "Reorder column", dataGridEmptyGroupLabel: "No value", dataGridExpandGroupLabel: "Expand group", dataGridCollapseGroupLabel: "Collapse group", dataGridGroupCountLabel: "{count} items", dataGridEditHint: "Press Enter or F2 to edit", tableResizeHandle: "Resize column", dataGridSelectionCopied: "Selection copied.", dataGridCopyFailed: "Copy failed. {message}", dataGridPasteOne: "Pasted {count} cell.", dataGridPasteMany: "Pasted {count} cells.", dataGridPasteFailed: "Paste failed. {message}", dataGridColumnReordered: "{label}, {position} of {count}", toolbarLabel: "Toolbar", breadcrumbLabel: "Breadcrumb", menuBarLabel: "Menu bar", drawerExpand: "Expand drawer to full screen", drawerRestore: "Restore drawer size", drawerLabel: "Supplementary content", drawerNavigation: "Drawer navigation", tableResizeColumn: "Resize {column} column", ratingValue: "{value} of {max}", colorChoose: "Choose color", colorHex: "Hex color", colorHue: "Hue", colorArea: "Saturation and brightness", colorAreaValue: "{saturation}% saturation, {brightness}% brightness", colorSaturation: "Saturation", colorValue: "Brightness", colorFormat: "Color format", colorRgb: "RGB color values", colorRed: "Red", colorGreen: "Green", colorBlue: "Blue", colorOpacity: "Opacity", colorSwatches: "Color swatches", colorAdd: "Add color", colorSwatch: "Select {color}", colorInvalid: "Enter a 3 or 6 digit hex color, for example #336699.", richTextBold: "Bold", richTextItalic: "Italic", richTextUnderline: "Underline", richTextBulletList: "Bulleted list", richTextNumberList: "Numbered list", richTextLink: "Link", richTextToolbar: "Rich text formatting", richTextLinkPrompt: "Link URL", richTextRequired: "Enter some text.", richTextChooseImage: "Choose image", richTextUndo: "Undo", richTextRedo: "Redo", richTextInsertTable: "Insert table", richTextInsertImage: "Insert image", richTextInsertRowAbove: "Insert row above", richTextInsertRowBelow: "Insert row below", richTextInsertColumnBefore: "Insert column before", richTextInsertColumnAfter: "Insert column after", richTextDeleteRow: "Delete row", richTextDeleteColumn: "Delete column", richTextDeleteTable: "Delete table", fileUploadBrowse: "Browse files", fileUploadDrop: "Drag files here or browse to select", fileUploadRemove: "Remove", fileUploadSelected: "Selected files", fileUploadRequired: "Select at least one file.", fileUploadTypeError: "The selected file type is not accepted.", fileUploadSizeError: "The selected file exceeds the allowed size.", fileUploadLimitError: "The maximum number of files has been reached.", carouselDescription: "Carousel", carouselPrevious: "Previous slide", carouselNext: "Next slide", carouselSlide: "Slide {index} of {count}", carouselRoleDescription: "carousel", carouselSlides: "Carousel slides", carouselNavigation: "Slide navigation", carouselPlay: "Play", carouselPause: "Pause", teachingPopoverLabel: "Guided steps", teachingPopoverDismiss: "Dismiss", teachingPopoverPrevious: "Previous step", teachingPopoverNext: "Next step", teachingPopoverFinish: "Finish tour", teachingPopoverSteps: "Tour steps", teachingPopoverPageCount: "{current} of {total}", teachingPopoverPageLabel: "Step {current} of {total}", overflowDescription: "Overflow actions", overflowMenuLabel: "More actions ({count})" };
const defaultHostStyle = Object.freeze({ "--spui-font-family": '"Segoe UI", sans-serif', "--spui-color-scheme": "light", colorScheme: "light" }) as React.CSSProperties;
const UIContext = React.createContext<UIContextValue>({ appearance: "fluent", baseAppearance: "fluent", density: "comfortable", hasThemeValues: false, styleTokens: getSharePointUIStyleTokens(), fluentTokenStyles: {}, hostStyle: defaultHostStyle, providesCssInheritance: false, strings: defaultStrings });
const AvatarGroupSizeContext = React.createContext(32);
export type AvatarGroupContextValue = { size: number; layout: "stack" | "spread" | "pie"; isOverflow?: boolean };
const AvatarGroupContext = React.createContext<AvatarGroupContextValue | undefined>(undefined);
type BreadcrumbSize = "small" | "medium" | "large";
const BreadcrumbSizeContext = React.createContext<BreadcrumbSize>("medium");
const AvatarGroupOverflowContext = React.createContext(false);
export type MenuCheckedValues = Record<string, string[]>;
export type MenuCheckedValueChangeEvent = React.MouseEvent | React.KeyboardEvent;
export type MenuCheckedValueChangeData = { name: string; checkedItems: string[] };
type MenuSelectionContextValue = { checkedValues: MenuCheckedValues; change: (event: MenuCheckedValueChangeEvent, name: string, value: string, checked: boolean, kind: "checkbox" | "radio" | "switch") => void };
const MenuSelectionContext = React.createContext<MenuSelectionContextValue | null>(null);
const MenuGroupHeaderContext = React.createContext<string | undefined>(undefined);
export type ToastControllerUpdateOptions = Omit<ToastDispatchOptions, "id" | "toastId"> & { toastId: string; content?: React.ReactNode };
type ToastControllerUpdate = {
  (id: string, update: { content?: React.ReactNode; options?: ToastDispatchOptions }): void;
  (options: ToastControllerUpdateOptions): void;
};
type ToastControllerValue = { dispatchToast: (content: React.ReactNode, options?: ToastDispatchOptions) => string; updateToast: ToastControllerUpdate; dismissToast: (id: string) => void; dismissAllToasts: () => void; pauseToast: (id: string) => boolean; playToast: (id: string) => boolean; focusNewest: () => boolean };
const ToastControllerContext = React.createContext<ToastControllerValue | null>(null);
const toastControllerRegistry = new Map<string, ToastControllerValue>();
const toastControllerEventName = "spui-toast-controller";
type ToastControllerEventDetail = { toasterId?: string; action: "dispatch" | "update" | "dismiss" | "dismissAll" | "pause" | "play" | "focusNewest"; id?: string; content?: React.ReactNode; options?: ToastDispatchOptions; update?: ToastControllerUpdateOptions; legacyUpdate?: { content?: React.ReactNode; options?: ToastDispatchOptions }; result?: boolean };
function dispatchToastControllerEvent(detail: ToastControllerEventDetail): boolean {
  if (typeof document === "undefined" || !document.defaultView) return false;
  document.dispatchEvent(new document.defaultView.CustomEvent(toastControllerEventName, { detail }));
  return detail.result ?? false;
}
export type CarouselContextValue = {
  activeIndex: number;
  appearance?: CarouselAppearance;
  circular: boolean;
  selectPageByElement: (event: React.FocusEvent, element: HTMLElement, jump?: boolean) => number;
  selectPageByDirection: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>, direction: "next" | "prev") => number;
  selectPageByIndex: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>, value: number, jump?: boolean) => void;
  subscribeForValues: (listener: (data: { activeIndex: number; navItemsCount: number; groupIndexList: number[][]; slideNodes: HTMLElement[]; canLoop?: boolean }) => void) => () => void;
  enableAutoplay: (autoplay: boolean, temporary?: boolean) => void;
  resetAutoplay: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  viewportRef?: React.RefObject<HTMLDivElement | null>;
};
export type CarouselAnnouncerFunction = (index: number, totalSlides: number, slideGroupList: number[][]) => string;
const CarouselContext = React.createContext<CarouselContextValue | undefined>(undefined);

const ensureDefined = (define: () => void): void => { if (typeof customElements !== "undefined") define(); };
function hasDesignThemeValues(theme?: SharePointUIDesignTheme): boolean {
  return Object.values(theme ?? {}).some(value => typeof value === "string" || typeof value === "number" ? value !== undefined : value != null && Object.keys(value).length > 0);
}
function useHostProps(props: Record<string, unknown>): Record<string, unknown> {
  const context = React.useContext(UIContext);
  const lang = context.lang || (typeof document === "undefined" ? undefined : document.documentElement.lang || undefined);
  const dir = context.dir || (typeof document === "undefined" ? undefined : (document.documentElement.dir as UIContextValue["dir"]) || undefined);
  const style = context.providesCssInheritance ? props.style as React.CSSProperties | undefined : props.style ? { ...context.hostStyle, ...props.style as React.CSSProperties } : context.hostStyle;
  const className = props.className;
  return { ...props, className, "data-spui-appearance": props["data-spui-appearance"] ?? context.appearance, "data-spui-base-appearance": props["data-spui-base-appearance"] ?? context.baseAppearance, style, ...(props.lang === undefined && lang ? { lang } : {}), ...(props.dir === undefined && dir ? { dir } : {}) };
}
function customElementProps(hostProps: Record<string, unknown>): Record<string, unknown> {
  if (typeof hostProps.className !== "string") return hostProps;
  const { className, ...attributes } = hostProps;
  return { ...attributes, class: className };
}
function useCustomElementProps(props: Record<string, unknown>): Record<string, unknown> {
  return customElementProps(useHostProps(props));
}
function getVisibleText(value: React.ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (Array.isArray(value)) return value.map(getVisibleText).filter(Boolean).join(" ");
  if (!React.isValidElement(value)) return "";
  const props = value.props as { children?: React.ReactNode; "aria-label"?: string; "aria-hidden"?: boolean | "true" | "false" };
  if (props["aria-hidden"] === true || props["aria-hidden"] === "true") return "";
  return props["aria-label"]?.trim() || getVisibleText(props.children);
}
function renderIconSlot(icon: React.ReactNode): React.ReactNode {
  if (icon == null) return null;
  return React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<{ slot?: string; "aria-hidden"?: boolean }>, { slot: "icon", "aria-hidden": true })
    : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon);
}
type DividerWrapper = React.ReactElement | React.HTMLAttributes<HTMLDivElement>;
function renderDividerWrapper(wrapper?: DividerWrapper): React.ReactNode {
  if (wrapper == null) return null;
  return React.isValidElement(wrapper)
    ? React.cloneElement(wrapper as React.ReactElement<{ slot?: string }>, { slot: "wrapper" })
    : React.createElement("div", { ...wrapper, slot: "wrapper" });
}
function useSpuiEvent(ref: React.RefObject<HTMLElement | null>, eventName: string, callback?: (detail: SpuiEventDetail, event: Event) => void): void {
  const callbackRef = React.useRef(callback);
  React.useLayoutEffect(() => { callbackRef.current = callback; }, [callback]);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !callback) return;
    const listener = (event: Event) => callbackRef.current?.((event as CustomEvent<SpuiEventDetail>).detail, event);
    element.addEventListener(eventName, listener);
    return () => element.removeEventListener(eventName, listener);
  }, [ref, eventName, Boolean(callback)]);
}

function createReactEventBridge<T extends Element>(sourceEvent: Event, dispatchEvent: Event, currentTarget: T, target = sourceEvent.target): React.SyntheticEvent<T> {
  let propagationStopped = false;
  const bridged = {
    nativeEvent: sourceEvent,
    target: target as EventTarget & T,
    currentTarget,
    bubbles: sourceEvent.bubbles,
    cancelable: sourceEvent.cancelable,
    get defaultPrevented() { return sourceEvent.defaultPrevented || dispatchEvent.defaultPrevented; },
    eventPhase: sourceEvent.eventPhase,
    isTrusted: sourceEvent.isTrusted,
    timeStamp: sourceEvent.timeStamp,
    type: sourceEvent.type,
    preventDefault: () => { sourceEvent.preventDefault(); dispatchEvent.preventDefault(); },
    isDefaultPrevented: () => sourceEvent.defaultPrevented || dispatchEvent.defaultPrevented,
    stopPropagation: () => { propagationStopped = true; sourceEvent.stopPropagation(); dispatchEvent.stopPropagation(); },
    isPropagationStopped: () => propagationStopped,
    persist: () => undefined,
  } as React.SyntheticEvent<T>;
  if (sourceEvent instanceof MouseEvent) {
    Object.assign(bridged, {
      altKey: sourceEvent.altKey,
      button: sourceEvent.button,
      buttons: sourceEvent.buttons,
      clientX: sourceEvent.clientX,
      clientY: sourceEvent.clientY,
      ctrlKey: sourceEvent.ctrlKey,
      getModifierState: (key: string) => sourceEvent.getModifierState(key),
      metaKey: sourceEvent.metaKey,
      movementX: sourceEvent.movementX,
      movementY: sourceEvent.movementY,
      pageX: sourceEvent.pageX,
      pageY: sourceEvent.pageY,
      relatedTarget: sourceEvent.relatedTarget,
      screenX: sourceEvent.screenX,
      screenY: sourceEvent.screenY,
      shiftKey: sourceEvent.shiftKey,
    });
  }
  if (sourceEvent instanceof KeyboardEvent) {
    Object.assign(bridged, {
      altKey: sourceEvent.altKey,
      charCode: sourceEvent.charCode,
      ctrlKey: sourceEvent.ctrlKey,
      getModifierState: (key: string) => sourceEvent.getModifierState(key),
      key: sourceEvent.key,
      keyCode: sourceEvent.keyCode,
      location: sourceEvent.location,
      metaKey: sourceEvent.metaKey,
      repeat: sourceEvent.repeat,
      shiftKey: sourceEvent.shiftKey,
      which: sourceEvent.which,
    });
  }
  if (sourceEvent instanceof FocusEvent) Object.assign(bridged, { relatedTarget: sourceEvent.relatedTarget });
  return bridged;
}

function createReactChangeEventBridge(sourceEvent: Event, dispatchEvent: Event, currentTarget: HTMLInputElement): React.ChangeEvent<HTMLInputElement> {
  return Object.assign(createReactEventBridge(sourceEvent, dispatchEvent, currentTarget), { type: "change" }) as React.ChangeEvent<HTMLInputElement>;
}

function sourceEventTarget<T extends Element>(sourceEvent: Event, fallback: T): T {
  return (sourceEvent.currentTarget instanceof Element ? sourceEvent.currentTarget : sourceEvent.target instanceof Element ? sourceEvent.target : fallback) as T;
}

function useExposeHostRef<T extends HTMLElement>(localRef: React.RefObject<T | null>, forwardedRef: React.ForwardedRef<HTMLElement>): void {
  React.useImperativeHandle(forwardedRef, () => localRef.current!, [localRef]);
}

function getActiveMotionAnimations(root: HTMLElement): Animation[] {
  const animations = new Set<Animation>();
  const visit = (element: Element): void => {
    for (const animation of element.getAnimations()) if (animation.playState === "running") animations.add(animation);
    if (element.shadowRoot) for (const child of element.shadowRoot.children) visit(child);
    for (const child of element.children) visit(child);
  };
  visit(root);
  return [...animations];
}

function useNativeMotionPresence(ref: React.RefObject<HTMLElement | null>, visible: boolean, enabled: boolean, animationRoot: React.RefObject<HTMLElement | null> = ref): void {
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { open?: boolean }) | null;
    if (!element) return;
    if (!enabled) { element.open = visible; return; }
    element.setAttribute("motion", "");
    element.setAttribute("motion-visible", String(visible));
    if (visible) {
      element.removeAttribute("motion-exit-complete");
      element.open = true;
      return;
    }
    if (!element.open) { element.setAttribute("motion-exit-complete", ""); return; }
    element.removeAttribute("motion-exit-complete");
    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;
    const finish = (): void => {
      if (cancelled) return;
      element.setAttribute("motion-exit-complete", "");
      element.open = false;
    };
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        const animations = getActiveMotionAnimations(animationRoot.current ?? element);
        if (animations.length) void Promise.allSettled(animations.map(animation => animation.finished)).then(finish);
        else finish();
      });
    });
    return () => { cancelled = true; cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, [ref, visible, enabled, animationRoot]);
}

export function SharePointUIProvider({ children, lang, dir, appearance, baseAppearance, density, theme, tokens, fluentTokens, strings }: React.PropsWithChildren<{ lang?: string; dir?: "ltr" | "rtl" | "auto"; appearance?: SharePointUIAppearance; baseAppearance?: SharePointUIBaseAppearance; density?: SharePointUIDensity; theme?: SharePointUIDesignTheme; tokens?: Partial<SharePointUIStyleTokens>; fluentTokens?: FluentThemeTokens; strings?: Partial<SharePointUIStrings> }>): React.ReactElement {
  const parent = React.useContext(UIContext);
  const mergedTheme: SharePointUIDesignTheme = { ...parent.theme, ...theme, palette: { ...parent.theme?.palette, ...theme?.palette }, fluentTokens: { ...parent.theme?.fluentTokens, ...theme?.fluentTokens }, colors: { ...parent.theme?.colors, ...theme?.colors }, typography: { ...parent.theme?.typography, ...theme?.typography }, spacing: { ...parent.theme?.spacing, ...theme?.spacing }, shape: { ...parent.theme?.shape, ...theme?.shape }, elevation: { ...parent.theme?.elevation, ...theme?.elevation }, materials: { ...parent.theme?.materials, ...theme?.materials }, motion: { ...parent.theme?.motion, ...theme?.motion }, layers: { ...parent.theme?.layers, ...theme?.layers }, customProperties: { ...parent.theme?.customProperties, ...theme?.customProperties } };
  const mergedTokens = { ...parent.tokens, ...tokens };
  const mergedFluentTokens = { ...parent.fluentTokens, ...fluentTokens };
  const resolvedAppearance = appearance ?? parent.appearance;
  const resolvedBaseAppearance = baseAppearance ?? parent.baseAppearance;
  const resolvedDensity = density ?? parent.density;
  const styleTokens = getSharePointUIStyleTokens(resolvedAppearance, { ...getSharePointUIDesignTokens(mergedTheme), ...mergedTokens }, resolvedBaseAppearance, resolvedDensity);
  const fluentTokenStyles = Object.fromEntries(Object.entries(mergedFluentTokens).filter(([, value]) => typeof value === "string" || typeof value === "number").map(([name, value]) => [name.startsWith("--") ? name : `--${name}`, value as string | number]));
  const hasThemeValues = hasDesignThemeValues(mergedTheme);
  const inheritsDefaultTokens = resolvedAppearance === "fluent" && resolvedBaseAppearance === "fluent" && resolvedDensity === "comfortable" && !hasThemeValues && !Object.keys(mergedTokens).length && !Object.keys(mergedFluentTokens).length;
  const hostStyle = inheritsDefaultTokens ? defaultHostStyle : Object.freeze({ ...fluentTokenStyles, ...styleTokens, colorScheme: styleTokens["--spui-color-scheme"] }) as React.CSSProperties;
  const value: UIContextValue = { lang: lang ?? parent.lang, dir: dir ?? parent.dir, appearance: resolvedAppearance, baseAppearance: resolvedBaseAppearance, density: resolvedDensity, theme: mergedTheme, hasThemeValues, tokens: mergedTokens, fluentTokens: mergedFluentTokens, styleTokens, fluentTokenStyles, hostStyle, providesCssInheritance: true, strings: { ...parent.strings, ...strings } };
  return <UIContext.Provider value={value}><div data-spui-provider="" data-spui-appearance={resolvedAppearance} data-spui-base-appearance={resolvedBaseAppearance} lang={lang ?? parent.lang} dir={dir ?? parent.dir} style={{ ...hostStyle, display: "contents" }}>{children}</div></UIContext.Provider>;
}

export type TextProps = ElementProps & { as?: TextTag; size?: TextSize; weight?: TextWeight; font?: TextFont; align?: "start" | "center" | "end" | "justify"; italic?: boolean; underline?: boolean; strikethrough?: boolean; truncate?: boolean; wrap?: boolean; block?: boolean; children?: React.ReactNode };
export const Text = React.forwardRef<HTMLElement, TextProps>(function Text({ as = "span", size = 300, weight, font = "base", align = "start", italic = false, underline = false, strikethrough = false, truncate = false, wrap = true, block = false, children, ...props }: TextProps, forwardedRef): React.ReactElement {
  ensureDefined(defineText);
  return React.createElement("spui-text", useCustomElementProps({ ...props, ref: forwardedRef, as, size, weight, font, align, italic: italic || undefined, underline: underline || undefined, strikethrough: strikethrough || undefined, truncate: truncate || undefined, wrap: wrap ? undefined : "false", block: block || undefined }), children);
});

export type TextPresetProps = Omit<Parameters<typeof Text>[0], "size" | "weight" | "font">;
const textPreset = (props: TextPresetProps, size: TextSize, weight: TextWeight = "regular"): React.ReactElement => React.createElement(Text, { ...props, size, weight, font: "base" });
export function Body1(props: TextPresetProps): React.ReactElement { return textPreset(props, 300); }
export function Body1Strong(props: TextPresetProps): React.ReactElement { return textPreset(props, 300, "semibold"); }
export function Body1Stronger(props: TextPresetProps): React.ReactElement { return textPreset(props, 300, "bold"); }
export function Body2(props: TextPresetProps): React.ReactElement { return textPreset(props, 400); }
export function Caption1(props: TextPresetProps): React.ReactElement { return textPreset(props, 200); }
export function Caption1Strong(props: TextPresetProps): React.ReactElement { return textPreset(props, 200, "semibold"); }
export function Caption1Stronger(props: TextPresetProps): React.ReactElement { return textPreset(props, 200, "bold"); }
export function Caption2(props: TextPresetProps): React.ReactElement { return textPreset(props, 100); }
export function Caption2Strong(props: TextPresetProps): React.ReactElement { return textPreset(props, 100, "semibold"); }
export function Display(props: TextPresetProps): React.ReactElement { return textPreset(props, 1100, "semibold"); }
export function LargeTitle(props: TextPresetProps): React.ReactElement { return textPreset(props, 900, "semibold"); }
export function Subtitle1(props: TextPresetProps): React.ReactElement { return textPreset(props, 500, "semibold"); }
export function Subtitle2(props: TextPresetProps): React.ReactElement { return textPreset(props, 400, "semibold"); }
export function Subtitle2Stronger(props: TextPresetProps): React.ReactElement { return textPreset(props, 400, "bold"); }
export function Title1(props: TextPresetProps): React.ReactElement { return textPreset(props, 800, "semibold"); }
export function Title2(props: TextPresetProps): React.ReactElement { return textPreset(props, 700, "semibold"); }
export function Title3(props: TextPresetProps): React.ReactElement { return textPreset(props, 600, "semibold"); }

export type LabelRequiredSlotProps = React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode };
export type LabelRequired = boolean | React.ReactNode | LabelRequiredSlotProps;

export function Label({ htmlFor, size = "medium", weight = "regular", required = false, disabled = false, children, style, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { size?: LabelSize; weight?: LabelWeight; required?: LabelRequired; disabled?: boolean }): React.ReactElement {
  if (typeof document !== "undefined") ensureLabelStyles(document);
  const labelStyle = { ...getLabelStyle(size, disabled, weight), ...style } as React.CSSProperties;
  const hostProps = useHostProps({ ...props, className: ["spui-label", props.className].filter(Boolean).join(" "), htmlFor, style: labelStyle, "data-size": size, "data-disabled": String(disabled) });
  const requiredStyle = { color: disabled ? "var(--spui-ui-foreground-disabled,var(--spui-semantic-disabled-text,var(--colorNeutralForegroundDisabled,#bdbdbd)))" : "var(--spui-label-required-color,var(--colorPaletteRedForeground3,var(--spui-semantic-error-text,#c50f1f)))", paddingInlineStart: "var(--spui-label-required-gap,var(--spacingHorizontalXS,4px))" } as React.CSSProperties;
  const slotProps = required && typeof required === "object" && !Array.isArray(required) && !React.isValidElement(required) && !("$$typeof" in required) ? required as LabelRequiredSlotProps : undefined;
  const requiredContent: React.ReactNode = required === true ? "*" : slotProps ? slotProps.children : required as React.ReactNode;
  const requiredMarker = !required ? null : React.createElement("span", { ...slotProps, "aria-hidden": slotProps?.["aria-hidden"] ?? true, className: ["spui-label-required", slotProps?.className].filter(Boolean).join(" "), style: { ...requiredStyle, ...slotProps?.style } }, requiredContent);
  return React.createElement("label", hostProps as React.LabelHTMLAttributes<HTMLLabelElement>, children, requiredMarker);
}

export type InfoButtonPopoverProps = { label?: string; placement?: InfoPlacement; arrow?: boolean; trapFocus?: boolean };

export const InfoButton = React.forwardRef<HTMLElement, ElementProps & { info?: React.ReactNode; children?: React.ReactNode; label?: string; placement?: InfoPlacement; size?: "small" | "medium" | "large"; inline?: boolean; popover?: InfoButtonPopoverProps; open?: boolean; onOpenChange?: (open: boolean) => void }>(function InfoButton({ info, children, label, placement = "top", size = "medium", inline = true, popover, open, onOpenChange, ...props }: ElementProps & { info?: React.ReactNode; children?: React.ReactNode; label?: string; placement?: InfoPlacement; size?: "small" | "medium" | "large"; inline?: boolean; popover?: InfoButtonPopoverProps; open?: boolean; onOpenChange?: (open: boolean) => void }, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineInfoButton);
  useSpuiEvent(ref, "spui-open-change", detail => onOpenChange?.(Boolean(detail.open)));
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { open?: boolean; syncOpen?: (value: boolean) => void }) | null;
    if (element && open !== undefined) element.syncOpen ? element.syncOpen(open) : element.open = open;
  }, [open]);
  return React.createElement("spui-info-button", useCustomElementProps({ ...props, ref, label: label ?? context.strings.moreInformation, placement, size, inline: inline ? undefined : "false", "popover-label": popover?.label, "popover-placement": popover?.placement, "popover-arrow": (popover?.arrow ?? true) || undefined, "popover-trap-focus": popover?.trapFocus || undefined, open }), info ?? children);
});

export type InfoLabelLabelSlot = React.ReactElement<any> | Omit<Parameters<typeof Label>[0], "children">;
export type InfoLabelButtonSlot = React.ReactElement<any> | Omit<Parameters<typeof InfoButton>[0], "children" | "info">;

export type InfoLabelProps = React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode; info: React.ReactNode; htmlFor?: string; size?: LabelSize; weight?: LabelWeight; required?: LabelRequired; disabled?: boolean; infoButtonLabel?: string; placement?: InfoPlacement; label?: InfoLabelLabelSlot; infoButton?: InfoLabelButtonSlot | null };
export const InfoLabel = React.forwardRef<HTMLSpanElement, InfoLabelProps>(function InfoLabel({ children, info, htmlFor, size = "medium", weight = "regular", required = false, disabled = false, infoButtonLabel, placement = "top", label, infoButton, style, ...props }: InfoLabelProps, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const labelElement = label as React.ReactElement<any> | undefined;
  const infoButtonElement = infoButton as React.ReactElement<any> | null | undefined;
  const labelProps = { htmlFor, size, weight, required, disabled, ...(label && !React.isValidElement(label) ? label : {}) };
  const labelNode = React.isValidElement(labelElement)
    ? React.cloneElement(labelElement as React.ReactElement<any>, { ...(htmlFor && (labelElement.props as { htmlFor?: string }).htmlFor == null ? { htmlFor } : {}), children } as any)
    : React.createElement(Label, labelProps, children);
  const infoButtonNode = infoButton === null ? null : React.isValidElement(infoButtonElement)
    ? React.cloneElement(infoButtonElement, undefined, info)
    : React.createElement(InfoButton, { label: infoButtonLabel ?? context.strings.moreInformation, placement, ...infoButton }, info);
  return React.createElement("span", useHostProps({ ...props, ref: forwardedRef, style: { display: "inline-flex", alignItems: "baseline", gap: "0.25em", ...style } }),
    labelNode,
    infoButtonNode);
});

export type ButtonContextValue = { size?: ButtonSize };
const ButtonContext = React.createContext<ButtonContextValue | undefined>(undefined);
export const ButtonContextProvider = ButtonContext.Provider;
export function useButtonContext(): ButtonContextValue { return React.useContext(ButtonContext) ?? {}; }

export type ButtonProps = ElementProps & { as?: "button" | "a"; href?: string; target?: string; rel?: string; download?: string | boolean; hrefLang?: string; referrerPolicy?: string; form?: string; formAction?: string; formEncType?: string; formMethod?: string; formNoValidate?: boolean; formTarget?: string; name?: string; value?: string | number | readonly string[]; type?: "button" | "submit" | "reset"; variant?: "primary" | "default"; appearance?: ButtonAppearance; size?: ButtonSize; shape?: ButtonShape; iconOnly?: boolean; disabled?: boolean; disabledFocusable?: boolean; vertical?: boolean; icon?: React.ReactNode; iconPosition?: "before" | "after" };

export const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button({ as = "button", icon, iconPosition = "before", disabledFocusable = false, vertical = false, download, hrefLang, referrerPolicy, formAction, formEncType, formMethod, formNoValidate, formTarget, value, ...props }: ButtonProps, forwardedRef): React.ReactElement {
  ensureDefined(defineButton);
  const buttonContext = useButtonContext();
  const iconOnly = props.iconOnly ?? (icon != null && props.children == null);
  return React.createElement("spui-button", useCustomElementProps({ ...props, ref: forwardedRef, as, value: value === undefined ? undefined : Array.isArray(value) ? value.join(",") : String(value), download: download === false ? undefined : download === true ? "" : download, hreflang: hrefLang, referrerpolicy: referrerPolicy, formaction: formAction, formenctype: formEncType, formmethod: formMethod, formnovalidate: formNoValidate || undefined, formtarget: formTarget, size: props.size ?? buttonContext.size ?? "medium", vertical: vertical || undefined, "icon-only": iconOnly || undefined, iconOnly: undefined, "disabled-focusable": disabledFocusable || undefined, "icon-position": iconPosition, variant: props.variant }), icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon), props.children);
});

/** A themed menu trigger. Compose it as Menu's trigger; Menu owns open state, focus, and dismissal. */
export const MenuButton = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; menuIcon?: React.ReactNode; appearance?: ButtonAppearance; size?: ButtonSize; shape?: ButtonShape; disabled?: boolean; disabledFocusable?: boolean; type?: "button" | "submit" | "reset" }>(function MenuButton({ children, icon, menuIcon, appearance = "secondary", size = "medium", shape = "rounded", disabled, disabledFocusable = false, ...props }: ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; menuIcon?: React.ReactNode; appearance?: ButtonAppearance; size?: ButtonSize; shape?: ButtonShape; disabled?: boolean; disabledFocusable?: boolean; type?: "button" | "submit" | "reset" }, forwardedRef): React.ReactElement {
  ensureDefined(defineMenuButton);
  return React.createElement("spui-menu-button", useCustomElementProps({ ref: forwardedRef, ...props, appearance, size, shape, disabled: disabled || undefined, "disabled-focusable": disabledFocusable || undefined }),
    icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon),
    children,
    menuIcon == null ? null : React.createElement("span", { slot: "menu-icon", "aria-hidden": true }, menuIcon));
});

export const ButtonGroup = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; orientation?: "horizontal" | "vertical"; label?: string }>(function ButtonGroup({ children, orientation = "horizontal", label, ...props }: ElementProps & { children?: React.ReactNode; orientation?: "horizontal" | "vertical"; label?: string }, forwardedRef): React.ReactElement {
  ensureDefined(defineButtonGroup);
  return React.createElement("spui-button-group", useCustomElementProps({ ref: forwardedRef, ...props, orientation, "aria-label": label ?? props["aria-label"] }), children);
});

export const CompoundButton = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; secondaryContent?: React.ReactNode; contentContainer?: React.ReactElement; icon?: React.ReactNode; iconPosition?: "before" | "after"; appearance?: ButtonAppearance; size?: ButtonSize; shape?: ButtonShape; disabled?: boolean; disabledFocusable?: boolean }>(function CompoundButton({ children, secondaryContent, contentContainer, icon, iconPosition = "before", appearance = "secondary", size = "medium", shape = "rounded", disabled, disabledFocusable = false, ...props }: ElementProps & { children?: React.ReactNode; secondaryContent?: React.ReactNode; contentContainer?: React.ReactElement; icon?: React.ReactNode; iconPosition?: "before" | "after"; appearance?: ButtonAppearance; size?: ButtonSize; shape?: ButtonShape; disabled?: boolean; disabledFocusable?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineCompoundButton);
  const customContent = contentContainer == null ? null : React.cloneElement(contentContainer, { slot: "content-container" },
    React.createElement("span", { className: "title", "data-content-title": "", style: { fontWeight: 600 } }, children),
    secondaryContent == null ? null : React.createElement("span", { id: "description", className: "description", "data-content-description": "", style: { color: "var(--spui-ui-muted,var(--spui-semantic-body-subtext,#605e5c))", fontSize: 12, lineHeight: 1.35 } }, secondaryContent));
  return React.createElement("spui-compound-button", useCustomElementProps({ ref: forwardedRef, ...props, appearance, size, shape, disabled: disabled || undefined, "disabled-focusable": disabledFocusable || undefined, "icon-position": iconPosition }),
    icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon),
    customContent ?? children,
    customContent == null && secondaryContent != null ? React.createElement("span", { slot: "secondary-content" }, secondaryContent) : null);
});

export const ToggleButton = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; pressed?: boolean; defaultPressed?: boolean; checked?: boolean; defaultChecked?: boolean; isAccessible?: boolean; onPressedChange?: (pressed: boolean) => void; onCheckedChange?: (checked: boolean) => void; appearance?: ButtonAppearance; size?: ButtonSize; shape?: ButtonShape; disabled?: boolean; disabledFocusable?: boolean; icon?: React.ReactNode; iconPosition?: "before" | "after"; name?: string; value?: string }>(function ToggleButton({ children, pressed, defaultPressed, checked, defaultChecked, isAccessible = false, onPressedChange, onCheckedChange, appearance = "secondary", size = "medium", shape = "rounded", disabled, disabledFocusable = false, icon, iconPosition = "before", ...props }: ElementProps & { children?: React.ReactNode; pressed?: boolean; defaultPressed?: boolean; checked?: boolean; defaultChecked?: boolean; isAccessible?: boolean; onPressedChange?: (pressed: boolean) => void; onCheckedChange?: (checked: boolean) => void; appearance?: ButtonAppearance; size?: ButtonSize; shape?: ButtonShape; disabled?: boolean; disabledFocusable?: boolean; icon?: React.ReactNode; iconPosition?: "before" | "after"; name?: string; value?: string }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineToggleButton);
  const controlledChecked = checked ?? pressed;
  const initialChecked = defaultChecked ?? defaultPressed;
  useSpuiEvent(ref, "spui-checked-change", detail => { const value = Boolean(detail.checked); onCheckedChange?.(value); onPressedChange?.(value); });
  React.useLayoutEffect(() => { const element = ref.current as (HTMLElement & { checked?: boolean }) | null; if (element && controlledChecked !== undefined) element.checked = controlledChecked; }, [controlledChecked]);
  return React.createElement("spui-toggle-button", useCustomElementProps({ ...props, ref, appearance, size, shape, disabled: disabled || undefined, "disabled-focusable": disabledFocusable || undefined, "icon-position": iconPosition, controlled: controlledChecked !== undefined ? "" : undefined, "default-checked": initialChecked || undefined, "is-accessible": isAccessible || undefined }), icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon), children);
});

function isReactElement(value: unknown): value is React.ReactElement { return React.isValidElement(value); }

export const SplitButton = React.forwardRef<HTMLElement, ElementProps & { children: React.ReactNode; menuItems: React.ReactNode; menuLabel?: string; appearance?: ButtonAppearance; size?: ButtonSize; shape?: ButtonShape; disabled?: boolean; disabledFocusable?: boolean; icon?: React.ReactNode; iconPosition?: "before" | "after"; menuIcon?: React.ReactNode; onClick?: React.MouseEventHandler<HTMLElement>; primaryActionButton?: React.ReactElement | Partial<React.ComponentProps<typeof Button>>; menuButton?: React.ReactElement | Partial<React.ComponentProps<typeof MenuButton>> }>(function SplitButton({ children, menuItems, menuLabel, appearance = "primary", size = "medium", shape = "rounded", disabled, disabledFocusable = false, icon, iconPosition = "before", menuIcon, onClick, primaryActionButton, menuButton, ...props }: ElementProps & { children: React.ReactNode; menuItems: React.ReactNode; menuLabel?: string; appearance?: ButtonAppearance; size?: ButtonSize; shape?: ButtonShape; disabled?: boolean; disabledFocusable?: boolean; icon?: React.ReactNode; iconPosition?: "before" | "after"; menuIcon?: React.ReactNode; onClick?: React.MouseEventHandler<HTMLElement>; primaryActionButton?: React.ReactElement | Partial<React.ComponentProps<typeof Button>>; menuButton?: React.ReactElement | Partial<React.ComponentProps<typeof MenuButton>> }, forwardedRef): React.ReactElement {
  ensureDefined(defineSplitButton);
  const strings = React.useContext(UIContext).strings;
  const resolvedMenuLabel = menuLabel ?? strings.splitButtonMenuLabel ?? "More options";
  const groupLabel = typeof children === "string" ? `${children} actions` : "Actions";
  const triggerIcon = menuIcon ?? React.createElement("svg", { viewBox: "0 0 12 8", width: 12, height: 8, "aria-hidden": true, focusable: false }, React.createElement("path", { d: "m1 1 5 5 5-5", fill: "none", stroke: "currentColor", strokeWidth: 1.5 }));
  const triggerDefaults = { "aria-label": resolvedMenuLabel, disabled, disabledFocusable, iconOnly: true, size, shape, appearance: "secondary" as const };
  const trigger = isReactElement(menuButton)
    ? React.cloneElement(menuButton as React.ReactElement<any>, { ...triggerDefaults, ...menuButton.props })
    : menuButton ? React.createElement(MenuButton, { ...triggerDefaults, ...(menuButton as React.ComponentProps<typeof MenuButton>) }) : React.createElement(Button, triggerDefaults, triggerIcon);
  const primaryDefaults = { slot: "primary", appearance, size, shape, disabled, disabledFocusable, icon, iconPosition, onClick };
  const primary = isReactElement(primaryActionButton)
    ? React.cloneElement(primaryActionButton as React.ReactElement<any>, { ...primaryDefaults, ...primaryActionButton.props, slot: "primary" })
    : primaryActionButton ? React.createElement(Button, { ...primaryDefaults, ...(primaryActionButton as React.ComponentProps<typeof Button>), slot: "primary" }, (primaryActionButton as React.ComponentProps<typeof Button>).children ?? children) : React.createElement(Button, primaryDefaults, children);
  return React.createElement("spui-split-button", useCustomElementProps({ ref: forwardedRef, ...props, role: "group", "aria-label": props["aria-label"] ?? groupLabel }),
    primary,
    React.createElement(Menu, { slot: "menu", trigger, label: resolvedMenuLabel }, menuItems));
});

export type ToolbarCheckedValueChangeEvent = React.MouseEvent | React.KeyboardEvent;
export type ToolbarCheckedValueChangeData = { name: string; checkedItems: string[] };
export type ToolbarProps = ElementProps & { children?: React.ReactNode; label?: string; orientation?: "horizontal" | "vertical"; vertical?: boolean; loop?: boolean; size?: "small" | "medium" | "large"; checkedValues?: ToolbarCheckedValues; defaultCheckedValues?: ToolbarCheckedValues; onCheckedValueChange?: (event: ToolbarCheckedValueChangeEvent, data: ToolbarCheckedValueChangeData) => void };

export const Toolbar = React.forwardRef<HTMLElement, ToolbarProps>(function Toolbar({ children, label, orientation = "horizontal", vertical, loop = true, size = "medium", checkedValues, defaultCheckedValues, onCheckedValueChange, ...props }: ToolbarProps, forwardedRef): React.ReactElement {
  const ref = React.useRef<(HTMLElement & { checkedValues?: ToolbarCheckedValues; defaultCheckedValues?: ToolbarCheckedValues }) | null>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineToolbar);
  useSpuiEvent(ref, "spui-checked-value-change", (rawDetail, event) => {
    const detail = rawDetail as SpuiEventDetail & { name?: string; checkedItems?: string[]; sourceEvent?: Event; currentTarget?: HTMLElement };
    const sourceEvent = detail.sourceEvent ?? event;
    const currentTarget = detail.currentTarget ?? sourceEventTarget(sourceEvent, ref.current!);
    const callbackEvent = createReactEventBridge(sourceEvent, event, currentTarget) as unknown as ToolbarCheckedValueChangeEvent;
    onCheckedValueChange?.(callbackEvent, { name: String(detail.name ?? ""), checkedItems: detail.checkedItems ?? [] });
  });
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (defaultCheckedValues !== undefined) element.defaultCheckedValues = defaultCheckedValues;
    element.checkedValues = checkedValues;
  }, [checkedValues, defaultCheckedValues]);
  const strings = React.useContext(UIContext).strings;
  const accessibleLabel = label || (typeof props["aria-label"] === "string" ? props["aria-label"] : strings.toolbarLabel || "Toolbar");
  const resolvedOrientation = vertical === undefined ? orientation : vertical ? "vertical" : "horizontal";
  return React.createElement("spui-toolbar", useCustomElementProps({ ...props, ref, label: accessibleLabel, orientation: resolvedOrientation, size, loop: loop ? undefined : "false" }), children);
});

export const ToolbarGroup = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; label?: string }>(function ToolbarGroup({ children, label, ...props }: ElementProps & { children?: React.ReactNode; label?: string }, forwardedRef): React.ReactElement {
  ensureDefined(defineToolbarGroup);
  return React.createElement("spui-toolbar-group", useCustomElementProps({ ref: forwardedRef, ...props, label, "aria-label": props["aria-label"] ?? label }), children);
});

export const ToolbarSeparator = React.forwardRef<HTMLElement, ElementProps>(function ToolbarSeparator(props: ElementProps = {}, forwardedRef): React.ReactElement {
  ensureDefined(defineToolbarSeparator);
  return React.createElement("spui-toolbar-separator", useCustomElementProps({ ref: forwardedRef, ...props }));
});

export function ToolbarButton({ children, icon, appearance = "subtle", size = "medium", shape = "rounded", vertical = false, ...props }: ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; appearance?: "primary" | "secondary" | "outline" | "subtle" | "transparent"; size?: "small" | "medium" | "large"; shape?: "rounded" | "circular" | "square"; vertical?: boolean }): React.ReactElement {
  return React.createElement(Button, { ...props, appearance, size, shape, vertical, icon }, children);
}

export function ToolbarToggleButton({ children, icon, name, value, appearance = "subtle", size = "medium", shape = "rounded", ...props }: ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; name: string; value: string; appearance?: "primary" | "secondary" | "outline" | "subtle" | "transparent"; size?: "small" | "medium" | "large"; shape?: "rounded" | "circular" | "square"; pressed?: boolean; defaultPressed?: boolean; onPressedChange?: (pressed: boolean) => void }): React.ReactElement {
  return React.createElement(ToggleButton, { ...props, name, value, appearance, size, shape, icon }, children);
}

export const ToolbarRadioGroup = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; label?: string }>(function ToolbarRadioGroup({ children, label, ...props }: ElementProps & { children?: React.ReactNode; label?: string }, forwardedRef): React.ReactElement {
  ensureDefined(defineToolbarRadioGroup);
  return React.createElement("spui-toolbar-radio-group", useCustomElementProps({ ref: forwardedRef, ...props, label, "aria-label": props["aria-label"] ?? label }), children);
});

export const ToolbarRadioButton = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; name: string; value: string; appearance?: "primary" | "subtle" | "transparent"; size?: "small" | "medium" | "large"; disabled?: boolean }>(function ToolbarRadioButton({ children, icon, name, value, appearance = "subtle", size, disabled, ...props }: ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; name: string; value: string; appearance?: "primary" | "subtle" | "transparent"; size?: "small" | "medium" | "large"; disabled?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineToolbarRadioButton);
  return React.createElement("spui-toolbar-radio-button", useCustomElementProps({ ref: forwardedRef, ...props, name, value, appearance, size, disabled }), renderIconSlot(icon), children);
});

export const ToolbarDivider = React.forwardRef<HTMLElement, ElementProps & { vertical?: boolean; wrapper?: DividerWrapper }>(function ToolbarDivider({ vertical, wrapper, ...props }: ElementProps & { vertical?: boolean; wrapper?: DividerWrapper } = {}, forwardedRef): React.ReactElement {
  ensureDefined(defineToolbarSeparator);
  return React.createElement("spui-toolbar-separator", useCustomElementProps({ ref: forwardedRef, ...props, vertical: vertical === undefined ? undefined : String(vertical) }), renderDividerWrapper(wrapper));
});

type OverflowItemBaseProps = ElementProps & { id: string; groupId?: string; overflowLabel?: string; overflowContent?: React.ReactNode; children?: React.ReactNode };
export type OverflowItemProps = OverflowItemBaseProps & ({ pinned: true; priority?: never } | { pinned?: false; priority?: number });

export const OverflowItem = React.forwardRef<HTMLElement, OverflowItemProps>(function OverflowItem({ id, priority = 0, pinned = false, groupId, overflowLabel, overflowContent, children, ...props }: OverflowItemProps, forwardedRef): React.ReactElement {
  ensureDefined(defineOverflowItem);
  void overflowLabel; void overflowContent;
  return React.createElement("spui-overflow-item", useCustomElementProps({ ref: forwardedRef, ...props, id, priority, pinned: pinned || undefined, "group-id": groupId }), children);
});

export const OverflowDivider = React.forwardRef<HTMLElement, ElementProps & { groupId: string; children?: React.ReactNode }>(function OverflowDivider({ groupId, children, ...props }: ElementProps & { groupId: string; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineOverflowDivider);
  return React.createElement("spui-overflow-divider", useCustomElementProps({ ref: forwardedRef, ...props, "aria-hidden": true, "group-id": groupId }), children);
});

/** The native Overflow engine already observes child-list changes; this renderless marker is only needed by other implementations. */
export function OverflowReorderObserver(_props: Record<string, never> = {}): null { return null; }

export type OverflowGroupState = OverflowState["groupVisibility"][string];
export type OverflowItemEntry = { element: HTMLElement; id: string; priority: number; groupId?: string; pinned?: boolean };
export type OverflowDividerEntry = { element: HTMLElement; groupId: string };
export type OverflowSnapshot = { itemVisibility: Record<string, boolean>; groupVisibility: Record<string, OverflowGroupState>; invisibleItemCount: number };
export type OverflowContextValue = OverflowState & {
  registerItem: (item: OverflowItemEntry) => () => void;
  registerOverflowMenu: (element: HTMLElement) => () => void;
  updateOverflow: (padding?: number) => void;
  forceUpdateOverflow: () => void;
  registerDivider: (divider: OverflowDividerEntry) => () => void;
  containerRef?: React.RefObject<HTMLElement | null>;
  getSnapshot: () => OverflowSnapshot;
  subscribe: (listener: () => void) => () => void;
};

const emptyOverflowContext: OverflowContextValue = {
  hasOverflow: false,
  itemVisibility: {},
  groupVisibility: {},
  registerItem: () => () => undefined,
  registerOverflowMenu: () => () => undefined,
  updateOverflow: () => undefined,
  forceUpdateOverflow: () => undefined,
  registerDivider: () => () => undefined,
  getSnapshot: () => ({ itemVisibility: {}, groupVisibility: {}, invisibleItemCount: 0 }),
  subscribe: () => () => undefined,
};
const OverflowContext = React.createContext<OverflowContextValue>(emptyOverflowContext);

export function OverflowProvider({ value, children }: { value: OverflowContextValue; children?: React.ReactNode }): React.ReactElement {
  return React.createElement(OverflowContext.Provider, { value }, children);
}

export function useIsOverflowItemVisible(id: string): boolean {
  return React.useContext(OverflowContext).itemVisibility[id] ?? true;
}

export function useIsOverflowGroupVisible(id: string): OverflowGroupState {
  return React.useContext(OverflowContext).groupVisibility[id] ?? "visible";
}

export function useOverflowCount(): number {
  const { itemVisibility } = React.useContext(OverflowContext);
  return Object.values(itemVisibility).filter(visible => !visible).length;
}

export function useOverflowVisibility(): Pick<OverflowState, "itemVisibility" | "groupVisibility"> {
  const { itemVisibility, groupVisibility } = React.useContext(OverflowContext);
  return { itemVisibility, groupVisibility };
}

/** Subscribe to a selected value from the latest overflow snapshot. */
export function useOverflowSnapshot<TSelected>(selector: (snapshot: OverflowSnapshot) => TSelected): TSelected {
  const { getSnapshot, subscribe } = React.useContext(OverflowContext);
  const selectorRef = React.useRef(selector);
  selectorRef.current = selector;
  const select = React.useCallback(() => selectorRef.current(getSnapshot()), [getSnapshot]);
  const [selected, setSelected] = React.useState(select);
  React.useLayoutEffect(() => {
    const checkForUpdates = () => setSelected(select());
    checkForUpdates();
    return subscribe(checkForUpdates);
  }, [subscribe, select]);
  return selected;
}

export function useOverflowItem<TElement extends HTMLElement = HTMLElement>(id: string, priority = 0, groupId?: string, pinned = false): React.RefObject<TElement | null> {
  const ref = React.useRef<TElement>(null);
  const { registerItem } = React.useContext(OverflowContext);
  React.useLayoutEffect(() => ref.current ? registerItem({ element: ref.current, id, priority, groupId, pinned }) : undefined, [registerItem, id, priority, groupId, pinned]);
  return ref;
}

export function useOverflowDivider<TElement extends HTMLElement = HTMLElement>(groupId?: string): React.RefObject<TElement | null> {
  const ref = React.useRef<TElement>(null);
  const { registerDivider } = React.useContext(OverflowContext);
  React.useLayoutEffect(() => ref.current && groupId ? registerDivider({ element: ref.current, groupId }) : undefined, [registerDivider, groupId]);
  return ref;
}

export function useOverflowMenu<TElement extends HTMLElement = HTMLElement>(id?: string): { ref: React.MutableRefObject<TElement | null>; overflowCount: number; isOverflowing: boolean } {
  const ref = React.useRef<TElement>(null);
  const { registerOverflowMenu, hasOverflow } = React.useContext(OverflowContext);
  const overflowCount = useOverflowCount();
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (id) element.id = id;
    return registerOverflowMenu(element);
  }, [registerOverflowMenu, id]);
  return { ref, overflowCount, isOverflowing: hasOverflow };
}

export function Overflow({ children, label, minimumVisible = 0, overflowDirection = "end", overflowAxis = "horizontal", hasHiddenItems = false, overflowContent, padding = 10, onOverflowChange, onOverflowItemSelect, ...props }: ElementProps & { children?: React.ReactNode; label?: string; minimumVisible?: number; overflowDirection?: "start" | "end"; overflowAxis?: OverflowAxis; hasHiddenItems?: boolean; overflowContent?: React.ReactNode; padding?: number; onOverflowChange?: (event: null, data: OverflowState) => void; onOverflowItemSelect?: (id: string) => void }): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null);
  const [overflowIds, setOverflowIds] = React.useState<string[]>([]);
  const [overflowState, setOverflowState] = React.useState<OverflowState>(emptyOverflowContext);
  const stateRef = React.useRef<OverflowState>(emptyOverflowContext);
  const subscribers = React.useRef(new Set<() => void>());
  const strings = React.useContext(UIContext).strings;
  ensureDefined(defineOverflow); ensureDefined(defineOverflowItem); ensureDefined(defineOverflowDivider);
  useSpuiEvent(ref, "spui-overflow-change", detail => {
    const nextOverflowIds = Array.isArray(detail.overflowIds) ? detail.overflowIds : [];
    setOverflowIds(nextOverflowIds);
    const data = detail as SpuiEventDetail & { hasOverflow?: boolean; itemVisibility?: Record<string, boolean>; groupVisibility?: OverflowState["groupVisibility"] };
    const nextState: OverflowState = { hasOverflow: Boolean(data.hasOverflow), itemVisibility: data.itemVisibility ?? {}, groupVisibility: data.groupVisibility ?? {} };
    stateRef.current = nextState;
    setOverflowState(nextState);
    for (const listener of subscribers.current) listener();
    onOverflowChange?.(null, nextState);
  });
  const refresh = React.useCallback(() => { (ref.current as (HTMLElement & { refresh?: () => void }) | null)?.refresh?.(); }, []);
  const forceRefresh = React.useCallback(() => { (ref.current as (HTMLElement & { forceRefresh?: () => void }) | null)?.forceRefresh?.(); }, []);
  const registerItem = React.useCallback((item: OverflowItemEntry) => {
    const element = item.element;
    const previous = new Map<string, string | null>();
    const write = (name: string, value: string | undefined) => {
      previous.set(name, element.getAttribute(name));
      if (value === undefined) element.removeAttribute(name); else element.setAttribute(name, value);
    };
    write("data-overflow-item", "");
    write("data-overflow-id", item.id);
    write("priority", String(item.priority));
    write("pinned", item.pinned ? "" : undefined);
    write("group-id", item.groupId);
    refresh();
    return () => { for (const [name, value] of previous) { if (value === null) element.removeAttribute(name); else element.setAttribute(name, value); } refresh(); };
  }, [refresh]);
  const registerDivider = React.useCallback((divider: OverflowDividerEntry) => {
    const element = divider.element;
    const previous = { marker: element.getAttribute("data-overflow-divider"), group: element.getAttribute("group-id") };
    element.setAttribute("data-overflow-divider", ""); element.setAttribute("group-id", divider.groupId); refresh();
    return () => { if (previous.marker === null) element.removeAttribute("data-overflow-divider"); else element.setAttribute("data-overflow-divider", previous.marker); if (previous.group === null) element.removeAttribute("group-id"); else element.setAttribute("group-id", previous.group); refresh(); };
  }, [refresh]);
  const registerOverflowMenu = React.useCallback((element: HTMLElement) => {
    const previousSlot = element.getAttribute("slot");
    element.setAttribute("slot", "overflow-trigger"); refresh();
    return () => { if (previousSlot === null) element.removeAttribute("slot"); else element.setAttribute("slot", previousSlot); refresh(); };
  }, [refresh]);
  const updateOverflow = React.useCallback((nextPadding?: number) => {
    if (nextPadding !== undefined) ref.current?.setAttribute("padding", String(nextPadding));
    refresh();
  }, [refresh]);
  const forceUpdateOverflow = forceRefresh;
  const getSnapshot = React.useCallback((): OverflowSnapshot => ({
    itemVisibility: stateRef.current.itemVisibility,
    groupVisibility: stateRef.current.groupVisibility,
    invisibleItemCount: Object.values(stateRef.current.itemVisibility).filter(visible => !visible).length,
  }), []);
  const subscribe = React.useCallback((listener: () => void) => {
    subscribers.current.add(listener);
    return () => { subscribers.current.delete(listener); };
  }, []);
  const contextValue = React.useMemo<OverflowContextValue>(() => ({
    ...overflowState,
    registerItem,
    registerOverflowMenu,
    updateOverflow,
    forceUpdateOverflow,
    registerDivider,
    containerRef: ref,
    getSnapshot,
    subscribe,
  }), [overflowState, registerItem, registerOverflowMenu, updateOverflow, forceUpdateOverflow, registerDivider, getSnapshot, subscribe]);
  const itemMap = new Map(React.Children.toArray(children).filter(React.isValidElement).map(child => [String((child as React.ReactElement<OverflowItemProps>).props.id), child as React.ReactElement<OverflowItemProps>]));
  const menuLabel = (strings.overflowMenuLabel || "More actions ({count})").replace("{count}", String(overflowIds.length));
  const menuItems = overflowIds.map(id => {
    const item = itemMap.get(id);
    if (!item) return null;
    return React.createElement(React.Fragment, { key: id }, item.props.overflowContent ?? React.createElement(MenuItem, { value: id }, item.props.overflowLabel || id));
  });
  const trigger = React.createElement(Button, { appearance: "subtle", size: "small", iconOnly: true, "aria-label": menuLabel }, React.createElement("span", { "aria-hidden": true }, "⋯"));
  const menu = React.createElement(Menu, { label: label || strings.overflowDescription, trigger, onSelect: value => onOverflowItemSelect?.(value) }, ...menuItems, overflowContent);
  const host = React.createElement("spui-overflow", useCustomElementProps({ ...props, ref, "aria-label": label || strings.overflowDescription, "minimum-visible": minimumVisible, "overflow-direction": overflowDirection, "overflow-axis": overflowAxis, "has-hidden-items": hasHiddenItems || undefined, padding }), children, React.createElement("div", { slot: "overflow-trigger", hidden: overflowIds.length === 0 && !hasHiddenItems }, menu));
  return React.createElement(OverflowProvider, { value: contextValue }, host);
}

export type CardOnSelectionChangeEvent = React.MouseEvent | React.KeyboardEvent | React.ChangeEvent;
export type CardProps = ElementProps & { appearance?: CardAppearance; orientation?: CardOrientation; size?: CardSize; focusMode?: CardFocusMode; selected?: boolean; defaultSelected?: boolean; disabled?: boolean; selectionLabel?: string; checkbox?: React.ReactElement<HTMLInputElement>; floatingAction?: React.ReactNode; onSelectionChange?: (event: CardOnSelectionChangeEvent, data: { selected: boolean }) => void };
export const Card = React.forwardRef<HTMLElement, CardProps>(function Card({ children, appearance = "filled", orientation = "vertical", size = "medium", focusMode, selected, defaultSelected, disabled = false, selectionLabel, checkbox, floatingAction, onSelectionChange, ...props }: CardProps, forwardedRef): React.ReactElement {
  ensureDefined(defineCard);
  const ref = React.useRef<HTMLElement | null>(null);
  const attachRef = React.useCallback((element: HTMLElement | null) => {
    ref.current = element;
    if (typeof forwardedRef === "function") forwardedRef(element);
    else if (forwardedRef) (forwardedRef as unknown as { current: HTMLElement | null }).current = element;
  }, [forwardedRef]);
  React.useEffect(() => {
    const element = ref.current;
    if (!element || !onSelectionChange) return;
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ selected: boolean; event?: Event }>).detail;
      const sourceEvent = detail.event ?? event;
      const callbackEvent = createReactEventBridge(sourceEvent, event, element) as unknown as CardOnSelectionChangeEvent;
      onSelectionChange(callbackEvent, { selected: detail.selected });
      if (selected !== undefined) element.toggleAttribute("selected", selected);
    };
    element.addEventListener("spui-selection-change", listener);
    return () => element.removeEventListener("spui-selection-change", listener);
  }, [onSelectionChange, selected]);
  const selectable = selected !== undefined || defaultSelected !== undefined || onSelectionChange !== undefined || checkbox != null;
  const interactive = !disabled && ["onClick", "onDoubleClick", "onMouseUp", "onMouseDown", "onPointerUp", "onPointerDown", "onTouchStart", "onTouchEnd", "onDragStart", "onDragEnd"].some(name => typeof props[name as keyof typeof props] === "function");
  const effectiveFocusMode = focusMode ?? (interactive ? "no-tab" : "off");
  return React.createElement("spui-card", useCustomElementProps({ ...props, ref: attachRef, appearance, orientation, size, selectable: selectable ? "" : undefined, selected: selected ? "" : undefined, "default-selected": defaultSelected ? "" : undefined, disabled: disabled ? "" : undefined, "selection-label": selectionLabel, "focus-mode": effectiveFocusMode }), children, checkbox == null ? null : React.cloneElement(checkbox, { slot: "checkbox" }), floatingAction == null ? null : React.createElement("div", { slot: "floating-action" }, floatingAction));
});

export const SharePointCard = Card;

export type { CardAppearance, CardFocusMode, CardOrientation, CardSize };

export const CardHeader = React.forwardRef<HTMLElement, ElementProps & { image?: React.ReactNode; header?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }>(function CardHeader({ image, header, description, action, children, ...props }: ElementProps & { image?: React.ReactNode; header?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineCardHeader);
  const headerContent = header ?? children;
  return React.createElement("spui-card-header", useCustomElementProps({ ...props, ref: forwardedRef }),
    image == null ? null : React.createElement("span", { slot: "image" }, image),
    headerContent == null ? null : React.createElement("span", { slot: "header" }, headerContent),
    description == null ? null : React.createElement("span", { slot: "description" }, description),
    action == null ? null : React.createElement("span", { slot: "action" }, action));
});

export const CardFooter = React.forwardRef<HTMLElement, ElementProps & { action?: React.ReactNode }>(function CardFooter({ action, children, ...props }: ElementProps & { action?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineCardFooter);
  return React.createElement("spui-card-footer", useCustomElementProps({ ...props, ref: forwardedRef }), children,
    action == null ? null : React.createElement("span", { slot: "action" }, action));
});

export const CardPreview = React.forwardRef<HTMLElement, ElementProps & { logo?: React.ReactNode }>(function CardPreview({ logo, children, ...props }: ElementProps & { logo?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineCardPreview);
  return React.createElement("spui-card-preview", useCustomElementProps({ ...props, ref: forwardedRef }), children,
    logo == null ? null : React.createElement("span", { slot: "logo" }, logo));
});

export const ViewCard = React.forwardRef<HTMLElement, ElementProps & { kind: "document" | "person" | "task" | "approval" | "list-item"; title: string; subtitle?: string; description?: string }>(function ViewCard({ kind, title, subtitle, description, children, ...props }: ElementProps & { kind: "document" | "person" | "task" | "approval" | "list-item"; title: string; subtitle?: string; description?: string }, forwardedRef): React.ReactElement {
  ensureDefined(defineViewCard);
  return React.createElement("spui-view-card", useCustomElementProps({ ref: forwardedRef, ...props, kind, title, subtitle, description }), children);
});

export type PresenceMotionSlotProps = { visible: boolean; appear?: boolean; unmountOnExit?: boolean; slot?: string; children?: React.ReactNode };
export type DrawerSurfaceMotionSlotProps = PresenceMotionSlotProps & { position: "start" | "end" | "top" | "bottom"; size: "small" | "medium" | "large" | "full"; dir: "ltr" | "rtl" };
export type DrawerBackdropMotionSlotProps = PresenceMotionSlotProps & { size: "small" | "medium" | "large" | "full" };
type DialogMotionContextValue = { visible: boolean; unmountOnClose: boolean; surfaceMotion?: React.ComponentType<PresenceMotionSlotProps> };
const DialogMotionContext = React.createContext<DialogMotionContextValue>({ visible: true, unmountOnClose: true });

function setDialogSurfaceContent(children: React.ReactNode, mounted: boolean, hasMotion: boolean): React.ReactNode {
  return React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    if (child.type === React.Fragment) return React.cloneElement(child, undefined, setDialogSurfaceContent(child.props.children, mounted, hasMotion));
    if (!mounted && !hasMotion && child.type === DialogSurface) return React.cloneElement(child, undefined, null);
    return child;
  });
}

function getDialogSurfaceOptions(children: React.ReactNode): { backdropAppearance?: "dimmed" | "transparent"; hasBackdrop?: boolean; hasMotion?: boolean } {
  let result: { backdropAppearance?: "dimmed" | "transparent"; hasBackdrop?: boolean; hasMotion?: boolean } = {};
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) { result = getDialogSurfaceOptions(child.props.children); return; }
    if (child.type !== DialogSurface) return;
    const props = child.props as { backdrop?: unknown; backdropMotion?: unknown };
    const backdrop = props.backdrop;
    if (React.isValidElement(backdrop)) result = { backdropAppearance: (backdrop.props as { appearance?: "dimmed" | "transparent" }).appearance, hasBackdrop: true, hasMotion: Boolean(props.backdropMotion) };
    else if (backdrop && typeof backdrop === "object") result = { backdropAppearance: (backdrop as { appearance?: "dimmed" | "transparent" }).appearance, hasBackdrop: true, hasMotion: Boolean(props.backdropMotion) };
    else if (props.backdropMotion) result = { hasMotion: true };
  });
  return result;
}

export const Dialog = React.forwardRef<HTMLElement, ElementProps & { open?: boolean; defaultOpen?: boolean; title?: string; modal?: boolean; modalType?: "modal" | "non-modal" | "alert"; inertTrapFocus?: boolean; dismissible?: boolean; closeLabel?: string; unmountOnClose?: boolean; surfaceMotion?: React.ComponentType<PresenceMotionSlotProps>; actions?: React.ReactNode; onOpenChange?: (event: DialogOpenChangeEvent, data: DialogOnOpenChangeData) => void; children?: React.ReactNode }>(function Dialog({ open, defaultOpen = false, title, modal = true, modalType, inertTrapFocus = false, dismissible = true, closeLabel, unmountOnClose = true, surfaceMotion, actions, onOpenChange, children, ...props }: ElementProps & { open?: boolean; defaultOpen?: boolean; title?: string; modal?: boolean; modalType?: "modal" | "non-modal" | "alert"; inertTrapFocus?: boolean; dismissible?: boolean; closeLabel?: string; unmountOnClose?: boolean; surfaceMotion?: React.ComponentType<PresenceMotionSlotProps>; actions?: React.ReactNode; onOpenChange?: (event: DialogOpenChangeEvent, data: DialogOnOpenChangeData) => void; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const controlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const visible = controlled ? open : uncontrolledOpen;
  ensureDefined(defineDialog);
  useSpuiEvent(ref, "spui-open-change", (detail, dispatchEvent) => {
    const change = detail as DialogOpenChangeData;
    if (!controlled) setUncontrolledOpen(change.open);
    if (!onOpenChange || !ref.current) return;
    const surface = ref.current.shadowRoot?.querySelector("dialog");
    if (!surface) return;
    const callbackEvent = createReactEventBridge(change.event, dispatchEvent, surface) as unknown as DialogOpenChangeEvent;
    onOpenChange(callbackEvent, { ...change, event: callbackEvent } as DialogOnOpenChangeData);
  });
  const surfaceOptions = getDialogSurfaceOptions(children);
  const hasPresenceMotion = Boolean(surfaceMotion || surfaceOptions.hasMotion);
  useNativeMotionPresence(ref, visible, hasPresenceMotion);
  const content = unmountOnClose && !hasPresenceMotion ? setDialogSurfaceContent(children, visible, false) : children;
  return React.createElement("spui-dialog", useCustomElementProps({ ...props, ref, open: !hasPresenceMotion && controlled ? open : undefined, "default-open": !hasPresenceMotion && !controlled && defaultOpen || undefined, motion: hasPresenceMotion || undefined, title, modal: modalType ? undefined : modal, "modal-type": modalType, "inert-trap-focus": inertTrapFocus === undefined ? undefined : String(inertTrapFocus), dismissible, "close-label": closeLabel ?? context.strings.close, "backdrop-appearance": surfaceOptions.backdropAppearance, "data-has-custom-backdrop": surfaceOptions.hasBackdrop || undefined }),
    React.createElement(DialogMotionContext.Provider, { value: { visible, unmountOnClose, surfaceMotion } }, content),
    actions ? React.createElement("div", { slot: "actions", style: { display: "flex", flexWrap: "wrap", gap: 8 } }, actions) : null);
});

export type DialogBackdropSlotProps = React.ReactElement | (React.HTMLAttributes<HTMLDivElement> & { appearance?: "dimmed" | "transparent" });

export function DialogSurface({ children, backdrop, backdropMotion, ...props }: ElementProps & { children?: React.ReactNode; backdrop?: DialogBackdropSlotProps; backdropMotion?: React.ComponentType<PresenceMotionSlotProps> }): React.ReactElement {
  const motion = React.useContext(DialogMotionContext);
  ensureDefined(defineDialogSurface);
  const surface = React.createElement("spui-dialog-surface", useCustomElementProps(props), children);
  const surfaceContent = motion.surfaceMotion
    ? React.createElement(motion.surfaceMotion, { visible: motion.visible, appear: motion.unmountOnClose, unmountOnExit: motion.unmountOnClose, slot: "surface" }, surface)
    : React.cloneElement(surface, { slot: "surface" });
  let backdropContent: React.ReactNode = null;
  if (backdrop) {
    const appearance = React.isValidElement(backdrop) ? (backdrop.props as { appearance?: "dimmed" | "transparent" }).appearance : (backdrop as React.HTMLAttributes<HTMLDivElement> & { appearance?: "dimmed" | "transparent" }).appearance;
    const slotContent = React.isValidElement(backdrop)
      ? React.cloneElement(backdrop, { slot: "backdrop", "aria-hidden": true, "data-appearance": appearance ?? "dimmed" } as React.HTMLAttributes<HTMLDivElement>)
      : React.createElement("div", { ...backdrop, slot: "backdrop", "aria-hidden": true, "data-appearance": appearance });
    backdropContent = backdropMotion
      ? React.createElement(backdropMotion, { visible: motion.visible, appear: motion.unmountOnClose, unmountOnExit: motion.unmountOnClose, slot: "backdrop" }, slotContent)
      : slotContent;
  }
  return React.createElement(React.Fragment, null, backdropContent, surfaceContent);
}

export const DialogTitle = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; action?: React.ReactNode }>(function DialogTitle({ children, action, ...props }: ElementProps & { children?: React.ReactNode; action?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineDialogTitle);
  return React.createElement("spui-dialog-title", useCustomElementProps({ ref: forwardedRef, ...props, role: props.role ?? "heading", "aria-level": props["aria-level"] ?? 2 }), children, action == null ? null : React.createElement("div", { slot: "action" }, action));
});

export const DialogContent = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function DialogContent({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineDialogContent);
  return React.createElement("spui-dialog-content", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const DialogBody = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function DialogBody({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineDialogBody);
  return React.createElement("spui-dialog-body", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const DialogActions = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; fluid?: boolean; position?: "start" | "end" }>(function DialogActions({ children, fluid = false, position = "end", ...props }: ElementProps & { children?: React.ReactNode; fluid?: boolean; position?: "start" | "end" }, forwardedRef): React.ReactElement {
  ensureDefined(defineDialogActions);
  return React.createElement("spui-dialog-actions", useCustomElementProps({ ref: forwardedRef, ...props, fluid: fluid || undefined, position }), children);
});

export const DialogTrigger = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; action?: "open" | "close"; disableButtonEnhancement?: boolean }>(function DialogTrigger({ children, action, disableButtonEnhancement = false, ...props }: ElementProps & { children?: React.ReactNode; action?: "open" | "close"; disableButtonEnhancement?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineDialogTrigger);
  return React.createElement("spui-dialog-trigger", useCustomElementProps({ ref: forwardedRef, ...props, action, "disable-button-enhancement": disableButtonEnhancement || undefined }), children);
});

export function Drawer({ type = "overlay", open, defaultOpen = false, unmountOnClose = true, separator = false, title, modal = true, dismissible = true, position = "end", size = "medium", expandable = false, expanded, surfaceMotion, backdropMotion, closeLabel, expandLabel, restoreLabel, actions, onOpenChange, onExpandedChange, onDismiss, children, ...props }: ElementProps & { type?: "overlay" | "inline"; open?: boolean; defaultOpen?: boolean; unmountOnClose?: boolean; separator?: boolean; title?: string; modal?: boolean; dismissible?: boolean; position?: "start" | "end" | "top" | "bottom"; size?: "small" | "medium" | "large" | "full"; expandable?: boolean; expanded?: boolean; surfaceMotion?: React.ComponentType<DrawerSurfaceMotionSlotProps>; backdropMotion?: React.ComponentType<DrawerBackdropMotionSlotProps>; closeLabel?: string; expandLabel?: string; restoreLabel?: string; actions?: React.ReactNode; onOpenChange?: (open: boolean) => void; onExpandedChange?: (expanded: boolean) => void; onDismiss?: () => void; children?: React.ReactNode }): React.ReactElement {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const actualOpen = open ?? uncontrolledOpen;
  const handleOpenChange = (next: boolean): void => { if (open === undefined) setUncontrolledOpen(next); onOpenChange?.(next); };
  const context = React.useContext(UIContext);
  const ref = React.useRef<HTMLElement>(null);
  ensureDefined(defineDrawer);
  useSpuiEvent(ref, "spui-open-change", detail => handleOpenChange(Boolean(detail.open)));
  useSpuiEvent(ref, "spui-dismiss", onDismiss ? () => onDismiss() : undefined);
  useSpuiEvent(ref, "spui-expanded-change", detail => onExpandedChange?.(Boolean(detail.expanded)));
  React.useLayoutEffect(() => { const element = ref.current; if (element && expanded !== undefined) element.toggleAttribute("expanded", expanded); }, [expanded]);
  const motionEnabled = Boolean(surfaceMotion || backdropMotion);
  const motionRootRef = React.useRef<HTMLDivElement>(null);
  useNativeMotionPresence(ref, actualOpen, motionEnabled && type !== "inline", motionRootRef);
  if (type === "inline") return React.createElement(InlineDrawer, { ...props, open: actualOpen, title, position, size, separator, unmountOnClose, surfaceMotion, actions }, children);
  const drawer = React.createElement("spui-drawer", useCustomElementProps({ ...props, ref, open: motionEnabled ? undefined : actualOpen, motion: motionEnabled || undefined, title, modal, dismissible, position, size, expandable: expandable || undefined, expanded, "data-has-custom-backdrop": backdropMotion || undefined, "close-label": closeLabel ?? context.strings.close, "expand-label": expandLabel ?? context.strings.drawerExpand ?? "Expand drawer to full screen", "restore-label": restoreLabel ?? context.strings.drawerRestore ?? "Restore drawer size" }),
    backdropMotion ? React.createElement(backdropMotion, { visible: actualOpen, appear: unmountOnClose, unmountOnExit: unmountOnClose, size, slot: "backdrop" }, React.createElement("div", { slot: "backdrop", "aria-hidden": true })) : null,
    unmountOnClose && !actualOpen && !motionEnabled ? null : children,
    actions ? React.createElement("div", { slot: "actions", style: { display: "flex", flexWrap: "wrap", gap: 8 } }, actions) : null);
  const surfaced = surfaceMotion
    ? React.createElement("div", { ref: motionRootRef, style: { display: "contents" } }, React.createElement(surfaceMotion, { visible: actualOpen, appear: unmountOnClose, unmountOnExit: unmountOnClose, position, size, dir: props.dir === "rtl" || context.dir === "rtl" || (props.dir === undefined && context.dir === undefined && typeof document !== "undefined" && getComputedStyle(document.documentElement).direction === "rtl") ? "rtl" : "ltr" }, drawer))
    : backdropMotion ? React.createElement("div", { ref: motionRootRef, style: { display: "contents" } }, drawer) : drawer;
  return surfaced;
}

export function DrawerHeader({ children }: { children?: React.ReactNode }): React.ReactElement {
  return React.createElement(React.Fragment, null, children);
}

export function DrawerHeaderNavigation({ children, label, ...props }: ElementProps & { children?: React.ReactNode; label?: string }): React.ReactElement {
  const context = React.useContext(UIContext);
  return React.createElement("nav", useHostProps({ ...props, slot: "header-navigation", "aria-label": props["aria-label"] ?? label ?? context.strings.drawerNavigation ?? "Drawer navigation", style: { display: "flex", alignItems: "center", gap: 8, ...props.style } }), children);
}

export type DrawerHeaderTitleHeadingSlot = React.ReactElement<any> | Omit<React.HTMLAttributes<HTMLElement>, "children">;

export function DrawerHeaderTitle({ children, action, heading, ...props }: ElementProps & { children?: React.ReactNode; action?: React.ReactNode; heading?: DrawerHeaderTitleHeadingSlot }): React.ReactElement {
  const headingElement = heading as React.ReactElement<any> | undefined;
  const title = React.isValidElement(headingElement)
    ? React.cloneElement(headingElement as React.ReactElement<any>, { slot: "title", "data-spui-drawer-title": "", children } as any)
    : React.createElement("h2", { slot: "title", "data-spui-drawer-title": "", style: { margin: 0 }, ...(heading ?? {}) }, children);
  return React.createElement(React.Fragment, null,
    React.createElement("div", useHostProps({ ...props, slot: "title", "data-spui-drawer-title": "", style: { display: "flex", alignItems: "center", ...props.style } }), title),
    action == null ? null : React.createElement("span", { slot: "header-action", style: { display: "inline-flex", alignItems: "center" } }, action));
}

export function DrawerBody({ children, ...props }: ElementProps & { children?: React.ReactNode }): React.ReactElement {
  return React.createElement("div", useHostProps({ ...props, style: { minWidth: 0, ...props.style } }), children);
}

export function DrawerFooter({ children, ...props }: ElementProps & { children?: React.ReactNode }): React.ReactElement {
  return React.createElement("div", useHostProps({ ...props, slot: "actions", style: { display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 8, ...props.style } }), children);
}

export function InlineDrawer({ open = false, title, position = "start", size = "small", separator = false, unmountOnClose = true, surfaceMotion, actions, children, ...props }: ElementProps & { open?: boolean; title?: string; position?: "start" | "end" | "top" | "bottom"; size?: "small" | "medium" | "large" | "full"; separator?: boolean; unmountOnClose?: boolean; surfaceMotion?: React.ComponentType<DrawerSurfaceMotionSlotProps>; actions?: React.ReactNode; children?: React.ReactNode }): React.ReactElement {
  const context = React.useContext(UIContext);
  ensureDefined(defineInlineDrawer);
  const dir = props.dir === "rtl" || context.dir === "rtl" || (props.dir === undefined && context.dir === undefined && typeof document !== "undefined" && getComputedStyle(document.documentElement).direction === "rtl") ? "rtl" : "ltr";
  const drawer = React.createElement("spui-inline-drawer", useCustomElementProps({ ...props, open: open || undefined, motion: surfaceMotion ? true : undefined, title, position, size, separator: separator || undefined, "aria-label": props["aria-label"] ?? title ?? context.strings.drawerLabel ?? "Supplementary content" }),
    title == null ? null : React.createElement("span", { slot: "title" }, title), unmountOnClose && !open && !surfaceMotion ? null : children,
    actions == null ? null : React.createElement("div", { slot: "actions", style: { display: "flex", flexWrap: "wrap", gap: 8 } }, actions));
  return surfaceMotion
    ? React.createElement(surfaceMotion, { visible: open, appear: unmountOnClose, unmountOnExit: unmountOnClose, position, size, dir }, drawer)
    : drawer;
}

export function OverlayDrawer({ open, defaultOpen, modalType = "modal", position = "start", size = "small", onOpenChange, ...props }: Omit<Parameters<typeof Drawer>[0], "type" | "open" | "modal" | "position" | "size" | "onOpenChange"> & { open?: boolean; defaultOpen?: boolean; modalType?: "modal" | "non-modal"; position?: "start" | "end" | "bottom"; size?: "small" | "medium" | "large" | "full"; onOpenChange?: (open: boolean) => void }): React.ReactElement {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
  const actualOpen = open ?? uncontrolledOpen;
  const handleOpenChange = (next: boolean): void => { if (open === undefined) setUncontrolledOpen(next); onOpenChange?.(next); };
  return React.createElement(Drawer, { ...props, type: "overlay", open: actualOpen, modal: modalType !== "non-modal", position, size, onOpenChange: handleOpenChange });
}

export const ProgressBar = React.forwardRef<HTMLElement, ElementProps & { value?: number; max?: number; label?: string; color?: ProgressBarColor; shape?: ProgressBarShape; thickness?: ProgressBarThickness; bar?: React.ReactNode; indeterminateMotion?: React.ReactNode }>(function ProgressBar({ value, max = 1, label, color, shape = "rounded", thickness = "medium", bar, indeterminateMotion, ...props }: ElementProps & { value?: number; max?: number; label?: string; color?: ProgressBarColor; shape?: ProgressBarShape; thickness?: ProgressBarThickness; bar?: React.ReactNode; indeterminateMotion?: React.ReactNode }, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const field = React.useContext(FieldContext);
  ensureDefined(defineProgressBar);
  const fieldColor = field?.validationState === "error" || field?.validationState === "warning" || field?.validationState === "success" ? field.validationState : undefined;
  let describedBy: string | undefined;
  for (const id of [field?.validationMessageId, field?.hintId, props["aria-describedby"]]) describedBy = mergeFieldIdRefs(describedBy ?? null, id);
  const hostProps = useHostProps({ ...props, ref: forwardedRef, value, max, label: label ?? context.strings.loading, color: color ?? fieldColor ?? "brand", shape: shape === "rounded" ? undefined : shape, thickness: thickness === "medium" ? undefined : thickness, "aria-labelledby": props["aria-labelledby"] ?? field?.labelId, "aria-describedby": describedBy });
  const boundedMax = Number.isFinite(max) && max > 0 ? max : 1;
  const barWidth = value === undefined || !Number.isFinite(value) ? undefined : `${Math.min(boundedMax, Math.max(0, value)) / boundedMax * 100}%`;
  const progressStyle = { "--spui-progress-value": barWidth } as React.CSSProperties;
  const barSlot = bar === undefined ? null : React.isValidElement(bar)
    ? React.cloneElement(bar as React.ReactElement<{ slot?: string; style?: React.CSSProperties }>, { slot: "bar", style: { ...progressStyle, ...(bar.props as { style?: React.CSSProperties }).style } })
    : React.createElement("span", { slot: "bar", style: progressStyle }, bar);
  const motionSlot = indeterminateMotion == null ? null : React.isValidElement(indeterminateMotion)
    ? React.cloneElement(indeterminateMotion as React.ReactElement<{ slot?: string }>, { slot: "indeterminateMotion" })
    : React.createElement("span", { slot: "indeterminateMotion" }, indeterminateMotion);
  return React.createElement("spui-progress-bar", customElementProps(hostProps), barSlot, motionSlot);
});

export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;
export type { SelectAppearance, SelectSize, SelectChangeData } from "./elements/select.js";
export type SelectProps = Omit<ElementProps, "onChange"> & { label?: string; value?: string | number | readonly string[]; defaultValue?: string | number | readonly string[]; autoComplete?: string; required?: boolean; disabled?: boolean; name?: string; form?: string; multiple?: boolean; size?: "small" | "medium" | "large"; appearance?: "outline" | "underline" | "filled-darker" | "filled-lighter"; icon?: React.ReactNode; select?: React.ReactElement<React.SelectHTMLAttributes<HTMLSelectElement>> | React.SelectHTMLAttributes<HTMLSelectElement>; onValueChange?: (value: string) => void; onChange?: (event: SelectChangeEvent, data: { value: string }) => void; children?: React.ReactNode };

export const Select = React.forwardRef<HTMLElement, SelectProps>(function Select(inputProps: SelectProps, forwardedRef): React.ReactElement {
  const { label, value, defaultValue, autoComplete, required, disabled, name, form, multiple, size = "medium", appearance = "outline", icon, select, onValueChange, onChange, children, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true, supportsSize: true });
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineSelect);
  useSpuiEvent(ref, "spui-change", (rawDetail, event) => {
    const detail = rawDetail as SpuiEventDetail & { optionText?: string };
    const selectedValue = String(detail.value ?? "");
    onValueChange?.(selectedValue);
    const sourceEvent = detail.sourceEvent ?? event;
    onChange?.(createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current as HTMLElement) as HTMLSelectElement) as SelectChangeEvent, { value: selectedValue });
  });
  const slotMultiple = React.isValidElement(select) ? select.props.multiple : select?.multiple;
  const inferredMultiple = Array.isArray(value) || Array.isArray(defaultValue);
  const effectiveMultiple = multiple ?? inferredMultiple;
  const nativeValueProps = { ...(value === undefined ? {} : { value }), ...(defaultValue === undefined ? {} : { defaultValue }) };
  const nativeSelectProps = { ...(autoComplete === undefined ? {} : { autoComplete }), ...(form === undefined ? {} : { form }), ...(effectiveMultiple === undefined ? {} : { multiple: effectiveMultiple }), ...nativeValueProps };
  const selectSlot = select == null
    ? effectiveMultiple
      ? React.createElement("select", { ...nativeSelectProps, slot: "select", required, disabled }, children)
      : children
    : React.isValidElement(select)
      ? React.cloneElement(select as React.ReactElement<React.SelectHTMLAttributes<HTMLSelectElement>>, { ...nativeSelectProps, ...select.props, slot: "select" } as React.SelectHTMLAttributes<HTMLSelectElement> & { slot: string })
      : React.createElement("select", { ...nativeSelectProps, ...select, slot: "select" }, children);
  const hostValue = value === undefined || Array.isArray(value) ? undefined : String(value);
  const hostDefaultValue = defaultValue === undefined || Array.isArray(defaultValue) ? undefined : String(defaultValue);
  return React.createElement("spui-select", useCustomElementProps({ ...props, ref, label, value: hostValue, "default-value": hostDefaultValue, "auto-complete": autoComplete, size, appearance, required, disabled, name, form, multiple: slotMultiple === undefined && effectiveMultiple ? true : undefined }), selectSlot, icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon));
});

export type RadioGroupProps = Omit<ElementProps, "onChange"> & { label?: string; value?: string; defaultValue?: string; name?: string; form?: string; required?: boolean; disabled?: boolean; layout?: "vertical" | "horizontal" | "horizontal-stacked"; orientation?: "vertical" | "horizontal"; onValueChange?: (value: string) => void; onChange?: (event: React.FormEvent<HTMLDivElement>, data: { value: string }) => void };

export const RadioGroup = React.forwardRef<HTMLElement, RadioGroupProps>(function RadioGroup(inputProps: RadioGroupProps, forwardedRef): React.ReactElement {
  const { label, value, defaultValue, name, required, disabled, layout, orientation, onValueChange, onChange, children, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true });
  const ref = React.useRef<HTMLElement>(null)
  const callbackRoot = React.useRef<HTMLDivElement>(null);
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineRadioGroup);
  useSpuiEvent(ref, "spui-change", (detail, event) => {
    const nextValue = String(detail.value ?? "");
    if (value !== undefined && ref.current) (ref.current as HTMLElement & { value: string }).value = value;
    onValueChange?.(nextValue);
    const nativeEvent = detail.sourceEvent instanceof Event ? detail.sourceEvent : event;
    const reactEvent = createReactEventBridge(nativeEvent, event, callbackRoot.current! ) as React.FormEvent<HTMLDivElement>;
    onChange?.(reactEvent, { value: nextValue });
  });
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { value?: string; defaultValue?: string }) | null;
    if (!element) return;
    if (value !== undefined) element.value = value;
    else if (defaultValue !== undefined) element.defaultValue = defaultValue;
  }, [value, defaultValue]);
  return React.createElement("div", { ref: callbackRoot, style: { display: "contents" }, "data-spui-radio-group-callback-root": "" }, React.createElement("spui-radio-group", useCustomElementProps({ ...props, ref, label, value, name, required, disabled, layout: layout ?? orientation ?? "vertical", orientation: undefined, "default-value": defaultValue }), children));
});

export type RadioInputSlot = React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> | React.InputHTMLAttributes<HTMLInputElement>;
export type RadioIndicatorSlot = React.ReactElement<React.HTMLAttributes<HTMLSpanElement>> | React.HTMLAttributes<HTMLSpanElement>;
export type RadioProps = Omit<ElementProps, "onChange"> & { value?: string; label?: React.ReactNode; labelPosition?: "after" | "below"; disabled?: boolean; input?: RadioInputSlot; indicator?: RadioIndicatorSlot; onChange?: (event: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => void; children?: React.ReactNode };

export const Radio = React.forwardRef<HTMLElement, RadioProps>(function Radio({ value, label, labelPosition, disabled, input, indicator, onChange, children, ...props }: RadioProps, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineRadioGroup);
  useSpuiEvent(ref, "spui-radio-change", (detail, event) => {
    const sourceEvent = detail.sourceEvent instanceof Event ? detail.sourceEvent : event;
    const currentTarget = sourceEventTarget(sourceEvent, ref.current!) as HTMLInputElement;
    onChange?.(createReactEventBridge(sourceEvent, event, currentTarget) as React.ChangeEvent<HTMLInputElement>, { value: String(detail.value ?? "") });
  });
  const inputSlot = input == null ? null : React.isValidElement(input)
    ? React.cloneElement(input as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, { slot: "input", hidden: true })
    : React.createElement("input", { ...input, slot: "input", hidden: true });
  const indicatorSlot = indicator == null ? null : React.isValidElement(indicator)
    ? React.cloneElement(indicator as React.ReactElement<React.HTMLAttributes<HTMLSpanElement>>, { slot: "indicator", hidden: true, "aria-hidden": true })
    : React.createElement("span", { ...indicator, slot: "indicator", hidden: true, "aria-hidden": true }, indicator.children);
  const labelText = typeof label === "string" || typeof label === "number" ? String(label) : undefined;
  const labelSlot = label == null || labelText !== undefined ? null : React.isValidElement(label)
    ? React.cloneElement(label as React.ReactElement<React.HTMLAttributes<HTMLElement>>, { slot: "label", hidden: true })
    : React.createElement("span", { slot: "label", hidden: true }, label);
  return React.createElement("spui-radio-option", useCustomElementProps({ ...props, ref, value, label: labelText, disabled, "label-position": labelPosition }), inputSlot, indicatorSlot, labelSlot, children);
});

export type SpinButtonChangeEvent = React.MouseEvent<HTMLButtonElement> | React.ChangeEvent<HTMLElement> | React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>;
export type SpinButtonOnChangeData = { value?: number | null; displayValue?: string };
export type SpinButtonProps = Omit<ElementProps, "onChange"> & { label?: string; value?: number | null; defaultValue?: number | null; displayValue?: string; input?: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> | React.InputHTMLAttributes<HTMLInputElement>; incrementButton?: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>> | React.ButtonHTMLAttributes<HTMLButtonElement>; decrementButton?: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>> | React.ButtonHTMLAttributes<HTMLButtonElement>; min?: number; max?: number; step?: number; stepPage?: number; precision?: number; appearance?: "outline" | "underline" | "filled-darker" | "filled-lighter"; size?: "small" | "medium"; incrementLabel?: string; decrementLabel?: string; name?: string; form?: string; required?: boolean; disabled?: boolean; readOnly?: boolean; onValueChange?: (value: number | undefined) => void; onChange?: (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => void };

export const SpinButton = React.forwardRef<HTMLElement, SpinButtonProps>(function SpinButton(inputProps: SpinButtonProps, forwardedRef): React.ReactElement {
  const { label, value, defaultValue, displayValue, input, incrementButton, decrementButton, min, max, step, stepPage, precision, appearance = "outline", size = "medium", incrementLabel, decrementLabel, name, required, disabled, readOnly, onValueChange, onChange, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true, supportsSize: true });
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const context = React.useContext(UIContext);
  ensureDefined(defineSpinButton);
  useSpuiEvent(ref, "spui-change", detail => onValueChange?.(detail.value === "" || detail.value === undefined ? undefined : Number(detail.value)));
  useSpuiEvent(ref, "spui-commit", (rawDetail, event) => {
    const detail = rawDetail as SpuiEventDetail & { value?: number | null; displayValue?: string; sourceEvent?: Event };
    if (value !== undefined && ref.current) (ref.current as HTMLElement & { value: number | null }).value = value;
    const sourceEvent = detail.sourceEvent ?? event;
    const currentTarget = sourceEventTarget(sourceEvent, ref.current as HTMLElement);
    onChange?.(createReactEventBridge(sourceEvent, event, currentTarget) as SpinButtonChangeEvent, { value: detail.value === null || detail.value === undefined ? null : Number(detail.value), displayValue: detail.displayValue });
  });
  const resolvedIncrementLabel = incrementLabel ?? context.strings.spinButtonIncrement ?? "Increase value";
  const resolvedDecrementLabel = decrementLabel ?? context.strings.spinButtonDecrement ?? "Decrease value";
  const inputSlot = input == null ? null : React.isValidElement(input)
    ? React.cloneElement(input as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, { slot: "input" } as React.InputHTMLAttributes<HTMLInputElement> & { slot: string })
    : React.createElement("input", { ...input, slot: "input" });
  const buttonSlot = (button: SpinButtonProps["incrementButton"], slot: "incrementButton" | "decrementButton", label: string): React.ReactNode => button == null ? null : React.isValidElement(button)
    ? React.cloneElement(button as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>, { slot, type: button.props.type ?? "button", "aria-label": button.props["aria-label"] ?? label } as React.ButtonHTMLAttributes<HTMLButtonElement> & { slot: string })
    : React.createElement("button", { ...button, slot, type: button.type ?? "button", "aria-label": button["aria-label"] ?? label });
  return React.createElement("spui-spin-button", useCustomElementProps({ ...props, ref, label, value, "default-value": defaultValue, "display-value": value !== undefined ? displayValue : undefined, min, max, step, "step-page": stepPage, precision, appearance, size, "increment-label": resolvedIncrementLabel, "decrement-label": resolvedDecrementLabel, name, required, disabled, "read-only": readOnly }), inputSlot, buttonSlot(incrementButton, "incrementButton", resolvedIncrementLabel), buttonSlot(decrementButton, "decrementButton", resolvedDecrementLabel));
});

export type SliderOnChangeData = { value: number };
export type SliderProps = Omit<ElementProps, "onChange"> & { label?: string; value?: number; defaultValue?: number; input?: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> | React.InputHTMLAttributes<HTMLInputElement>; rail?: React.ReactNode; thumb?: React.ReactNode; min?: number; max?: number; step?: number; size?: "small" | "medium"; vertical?: boolean; name?: string; form?: string; disabled?: boolean; valueText?: string; onValueChange?: (value: number) => void; onChange?: (event: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => void };

export const Slider = React.forwardRef<HTMLElement, SliderProps>(function Slider(inputProps: SliderProps, forwardedRef): React.ReactElement {
  const { label, value, defaultValue, input, rail, thumb, min = 0, max = 100, step = 1, size = "medium", vertical, name, disabled, valueText, onValueChange, onChange, ...props } = useFieldControlProps_unstable(inputProps, { supportsSize: true });
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineSlider);
  useSpuiEvent(ref, "spui-change", (detail, event) => {
    const nextValue = Number(detail.value);
    onValueChange?.(nextValue);
    const sourceEvent = detail.sourceEvent ?? event;
    onChange?.(createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current as HTMLElement) as HTMLInputElement) as React.ChangeEvent<HTMLInputElement>, { value: nextValue });
  });
  const inputSlot = input == null ? null : React.isValidElement(input)
    ? React.cloneElement(input as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, { slot: "input" } as React.InputHTMLAttributes<HTMLInputElement> & { slot: string })
    : React.createElement("input", { ...input, slot: "input" });
  return React.createElement("spui-slider", useCustomElementProps({ ...props, ref, label, value, "default-value": defaultValue, min, max, step, size, vertical, name, disabled, "aria-valuetext": valueText }), inputSlot, rail == null ? null : React.createElement("span", { slot: "rail", "aria-hidden": true }, rail), thumb == null ? null : React.createElement("span", { slot: "thumb", "aria-hidden": true }, thumb));
});

export type DatePickerProps = ElementProps & { label?: string; value?: string; defaultValue?: string; min?: string; max?: string; name?: string; form?: string; placeholder?: string; required?: boolean; disabled?: boolean; readOnly?: boolean; calendarLabel?: string; previousMonthLabel?: string; nextMonthLabel?: string; invalidDateMessage?: string; requiredMessage?: string; onValueChange?: (value: string) => void };

export const DatePicker = React.forwardRef<HTMLElement, DatePickerProps>(function DatePicker(inputProps: DatePickerProps, forwardedRef): React.ReactElement {
  const { label, value, defaultValue, min, max, name, placeholder, required, disabled, readOnly, calendarLabel, previousMonthLabel, nextMonthLabel, invalidDateMessage, requiredMessage, onValueChange, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true });
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const context = React.useContext(UIContext);
  ensureDefined(defineDatePicker);
  useSpuiEvent(ref, "spui-change", detail => { const next = String(detail.value ?? ""); if (value !== undefined && ref.current) (ref.current as HTMLElement & { value: string }).value = value; onValueChange?.(next); });
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { value?: string; defaultValue?: string }) | null;
    if (!element) return;
    if (value !== undefined) element.value = value;
    else if (defaultValue !== undefined) element.defaultValue = defaultValue;
  }, [value, defaultValue]);
  return React.createElement("spui-date-picker", useCustomElementProps({ ...props, ref, label, min, max, name, placeholder, required, disabled, "read-only": readOnly, "calendar-label": calendarLabel ?? context.strings.datePickerCalendar, "previous-month-label": previousMonthLabel ?? context.strings.datePickerPreviousMonth, "next-month-label": nextMonthLabel ?? context.strings.datePickerNextMonth, "invalid-date-message": invalidDateMessage ?? context.strings.datePickerInvalid, "required-message": requiredMessage ?? context.strings.datePickerRequired }));
});

export type ComboboxPositioning = "above" | "below" | "above-start" | "above-end" | "below-start" | "below-end" | { position?: "above" | "below"; align?: "start" | "center" | "end" };
export type ComboboxSelectionEvent = React.ChangeEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>;
export type ComboboxOpenChangeEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | React.FocusEvent<HTMLElement>;
export type ComboboxActiveOptionChangeData =
  | { event: React.SyntheticEvent | Event; type: undefined; previousOption: ComboboxOptionValue | null | undefined; nextOption: ComboboxOptionValue | null | undefined }
  | { event: CustomEvent<{ id: string; previousId: string | null }>; type: "change"; previousOption: ComboboxOptionValue | null | undefined; nextOption: ComboboxOptionValue | null | undefined };
export type ComboBoxProps = ElementProps & { label?: string; value?: string; defaultValue?: string; selectedValue?: string; selectedOptions?: readonly string[]; defaultSelectedOptions?: readonly string[]; multiselect?: boolean; name?: string; form?: string; input?: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> | React.InputHTMLAttributes<HTMLInputElement>; listbox?: React.ReactElement; placeholder?: string; required?: boolean; disabled?: boolean; freeform?: boolean; allowFreeform?: boolean; noResults?: string; clearable?: boolean; clearIcon?: React.ReactNode; expandIcon?: React.ReactNode; defaultOpen?: boolean; disableAutoFocus?: boolean; inlinePopup?: boolean; open?: boolean; appearance?: "filled-darker" | "filled-lighter" | "outline" | "underline"; size?: "small" | "medium" | "large"; positioning?: ComboboxPositioning; children?: React.ReactNode; onValueChange?: (value: string) => void; onOptionSelect?: (event: ComboboxSelectionEvent, data: ComboboxOptionSelectData) => void; onSelectedOptionsChange?: (selectedOptions: string[]) => void; onOpenChange?: (event: ComboboxOpenChangeEvent, data: { open: boolean }) => void; onActiveOptionChange?: (event: React.SyntheticEvent | Event, data: ComboboxActiveOptionChangeData) => void };

export const ComboBox = React.forwardRef<HTMLElement, ComboBoxProps>(function ComboBox(inputProps: ComboBoxProps, forwardedRef): React.ReactElement {
  const { label, value, defaultValue, selectedValue, selectedOptions, defaultSelectedOptions, multiselect = false, name, input, listbox, placeholder, required, disabled, freeform, allowFreeform, noResults, clearable, clearIcon, expandIcon, defaultOpen, disableAutoFocus, inlinePopup, open, appearance, size, positioning, onValueChange, onOptionSelect, onSelectedOptionsChange, onOpenChange, onActiveOptionChange, children, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true, supportsSize: true });
  const ref = React.useRef<HTMLElement & { selectedOptions: string[] }>(null)
  useExposeHostRef(ref, forwardedRef);;
  const context = React.useContext(UIContext);
  const provider = React.useContext(CompoundComboboxContext);
  ensureDefined(defineCombobox);
  useSpuiEvent(ref, "spui-input", detail => { const next = String(detail.value ?? ""); onValueChange?.(next); provider?.onValueChange?.(next); provider?.setValue?.(next); });
  useSpuiEvent(ref, "spui-open-change", (detail, event) => {
    const nextOpen = Boolean(detail.open);
    const sourceEvent = (detail as SpuiEventDetail & { event?: Event }).event ?? event;
    const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!)) as unknown as ComboboxOpenChangeEvent;
    onOpenChange?.(callbackEvent, { open: nextOpen });
    provider?.onOpenChange?.(nextOpen);
    provider?.setOpen?.(callbackEvent, nextOpen);
    const controlledOpen = open ?? provider?.open;
    if (controlledOpen !== undefined && ref.current && (open !== undefined || !provider?.setOpen)) (ref.current as HTMLElement & { setOpen?: (next: boolean) => void }).setOpen?.(controlledOpen);
  });
  useSpuiEvent(ref, "spui-active-option-change", (rawDetail, event) => {
    const detail = rawDetail as SpuiEventDetail & { event?: Event; type?: "change"; previousOption?: string | null; nextOption?: string | null };
    const sourceEvent = detail.event ?? event;
    const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!));
    const previousOption = detail.previousOption == null ? detail.previousOption : getProviderOption(ref.current, String(detail.previousOption));
    const nextOption = detail.nextOption == null ? detail.nextOption : getProviderOption(ref.current, String(detail.nextOption));
    provider?.setActiveOption?.(nextOption ?? undefined);
    if (detail.type === "change") onActiveOptionChange?.(callbackEvent, { event: event as CustomEvent<{ id: string; previousId: string | null }>, type: "change", previousOption, nextOption });
    else onActiveOptionChange?.(callbackEvent, { event: callbackEvent, type: undefined, previousOption, nextOption });
  });
  useSpuiEvent(ref, "spui-change", (rawDetail, event) => {
    const data = rawDetail as SpuiEventDetail & { event?: Event; selectedValue?: string; optionText?: string; selectedOptions?: string[] };
    const text = String(data.value ?? "");
    const selected = String(data.selectedValue ?? "");
    onValueChange?.(text);
    provider?.onValueChange?.(text);
    provider?.setValue?.(text);
    const sourceEvent = data.event ?? event;
    const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!)) as unknown as ComboboxSelectionEvent;
    const optionData = { optionValue: selected || undefined, optionText: data.optionText == null ? (selected ? text : undefined) : String(data.optionText), selectedOptions: Array.isArray(data.selectedOptions) ? data.selectedOptions.map(String) : selected ? [selected] : [] };
    const option = getProviderOption(ref.current, selected || undefined, optionData.optionText);
    if (option) provider?.selectOption?.(callbackEvent, option);
    onOptionSelect?.(callbackEvent, optionData);
    provider?.onOptionSelect?.(callbackEvent, optionData);
    const selectedValues = Array.isArray(data.selectedOptions) ? data.selectedOptions.map(String) : undefined;
    if (selectedValues) {
      onSelectedOptionsChange?.(selectedValues);
      if (selectedOptions !== undefined && ref.current) ref.current.selectedOptions = [...selectedOptions];
    }
  });
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (selectedOptions !== undefined) element.selectedOptions = [...selectedOptions];
    else if (defaultSelectedOptions !== undefined && !element.hasAttribute("default-selected-options")) element.setAttribute("default-selected-options", JSON.stringify(defaultSelectedOptions));
  }, [selectedOptions, defaultSelectedOptions]);
  const inputSlot = input == null ? null : React.isValidElement(input)
    ? React.cloneElement(input as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, { slot: "input" } as React.InputHTMLAttributes<HTMLInputElement> & { slot: string })
    : React.createElement("input", { ...input, slot: "input" });
  const listboxSlot = listbox == null ? null : React.cloneElement(listbox, { slot: "listbox" }, null);
  const clearIconSlot = clearIcon == null ? null : React.isValidElement(clearIcon)
    ? React.cloneElement(clearIcon as React.ReactElement<{ slot?: string }>, { slot: "clear-icon" })
    : React.createElement("span", { slot: "clear-icon", "aria-hidden": true }, clearIcon);
  const expandIconSlot = expandIcon == null ? null : React.isValidElement(expandIcon)
    ? React.cloneElement(expandIcon as React.ReactElement<{ slot?: string }>, { slot: "expand-icon" })
    : React.createElement("span", { slot: "expand-icon", "aria-hidden": true }, expandIcon);
  return React.createElement(CompoundComboboxContext.Provider, { value: { ...provider, mode: "combobox", value: value ?? provider?.value, selectedOptions: selectedOptions ?? provider?.selectedOptions, multiselect } }, React.createElement("spui-combobox", useCustomElementProps({ ...props, ref, label, value: value ?? defaultValue ?? provider?.value, "selected-value": selectedValue, multiselect: multiselect || undefined, name, placeholder, required, disabled, "allow-freeform": freeform ?? allowFreeform, "no-results": noResults ?? context.strings.noResults, clearable, "default-open": open === undefined && provider?.open === undefined ? defaultOpen : undefined, open: open ?? provider?.open ? "" : undefined, "disable-auto-focus": disableAutoFocus, appearance: appearance ?? provider?.appearance, size: size ?? provider?.size, positioning: typeof positioning === "string" ? positioning : positioning?.position ? `${positioning.position}${positioning.align && positioning.align !== "center" ? `-${positioning.align}` : ""}` : undefined, "inline-popup": inlinePopup }), children, inputSlot, clearIconSlot, expandIconSlot, listboxSlot));
});

export const ComboOption = React.forwardRef<HTMLElement, { value: string; label?: string; disabled?: boolean; children?: React.ReactNode }>(function ComboOption({ value, label, disabled, children }: { value: string; label?: string; disabled?: boolean; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineCombobox);
  return React.createElement("spui-combobox-option", useCustomElementProps({ ref: forwardedRef, value, label, disabled }), children);
});

export type ComboboxOptionSelectData = { optionValue: string | undefined; optionText: string | undefined; selectedOptions: string[] };
export type ComboboxOptionValue = { disabled?: boolean; id: string; text: string; value: string };
export type ComboboxContextValue = {
  activeOption?: ComboboxOptionValue;
  appearance: NonNullable<DropdownProps["appearance"]>;
  focusVisible: boolean;
  open: boolean;
  registerOption: (option: ComboboxOptionValue, element: HTMLElement) => () => void;
  selectedOptions: string[];
  selectOption: (event: ComboboxSelectionEvent, option: ComboboxOptionValue) => void;
  setActiveOption: React.Dispatch<React.SetStateAction<ComboboxOptionValue | undefined>>;
  setOpen: (event: ComboboxOpenChangeEvent, open: boolean) => void;
  size: NonNullable<DropdownProps["size"]>;
};
export type ComboboxProviderValue = Partial<Omit<ComboboxContextValue, "selectedOptions">> & {
  value?: string;
  selectedOptions?: readonly string[];
  setValue?: (value: string | undefined) => void;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onOptionSelect?: (event: ComboboxSelectionEvent, data: ComboboxOptionSelectData) => void;
};
type CompoundComboboxContextValue = ComboboxProviderValue & { mode: "combobox" | "listbox"; multiselect?: boolean; select?: (event: ComboboxSelectionEvent, value: string, text: string) => void };
const CompoundComboboxContext = React.createContext<CompoundComboboxContextValue | undefined>(undefined);

function getProviderOption(host: HTMLElement | null, value: string | undefined, text?: string): ComboboxOptionValue | undefined {
  if (value === undefined) return undefined;
  const option = [...(host?.querySelectorAll<HTMLElement>("spui-combobox-option") ?? [])].find(element => element.getAttribute("value") === value);
  return { id: option?.id || value, value, text: text ?? option?.getAttribute("label") ?? option?.textContent?.trim() ?? value, disabled: option?.hasAttribute("disabled") || undefined };
}

/** Supply shared value and selection callbacks to composed options. */
export function ComboboxProvider({ value, children }: { value: ComboboxProviderValue; children?: React.ReactNode }): React.ReactElement {
  return <CompoundComboboxContext.Provider value={{ ...value, mode: "combobox" }}>{children}</CompoundComboboxContext.Provider>;
}

export type DropdownProps = ElementProps & {
  label?: string;
  button?: React.ReactNode;
  appearance?: "filled-darker" | "filled-lighter" | "outline" | "underline";
  clearable?: boolean;
  clearButton?: React.ReactNode;
  defaultOpen?: boolean;
  defaultValue?: string;
  disableAutoFocus?: boolean;
  defaultSelectedOptions?: string[];
  inlinePopup?: boolean;
  listbox?: React.ReactElement;
  multiselect?: boolean;
  form?: string;
  onOpenChange?: (event: ComboboxOpenChangeEvent, data: { open: boolean }) => void;
  onOptionSelect?: (event: ComboboxSelectionEvent, data: ComboboxOptionSelectData) => void;
  onActiveOptionChange?: (event: React.SyntheticEvent | Event, data: ComboboxActiveOptionChangeData) => void;
  expandIcon?: React.ReactNode;
  open?: boolean;
  placeholder?: string;
  positioning?: ComboboxPositioning;
  selectedOptions?: string[];
  size?: "small" | "medium" | "large";
  value?: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

/** Selection-only combobox that shares the theme, form, and keyboard engine with ComboBox. */
export const Dropdown = React.forwardRef<HTMLElement, DropdownProps>(function Dropdown({ label, button, listbox, value, defaultValue, selectedOptions, defaultSelectedOptions, multiselect = false, disabled, placeholder, onOptionSelect, onOpenChange, onActiveOptionChange, defaultOpen, open, clearable, clearButton, expandIcon, disableAutoFocus, appearance, size, positioning, inlinePopup, children, ...props }: DropdownProps, forwardedRef): React.ReactElement {
  const strings = React.useContext(UIContext).strings;
  const provider = React.useContext(CompoundComboboxContext);
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineCombobox);
  useSpuiEvent(ref, "spui-open-change", (detail, event) => {
    const nextOpen = Boolean(detail.open);
    const sourceEvent = (detail as SpuiEventDetail & { event?: Event }).event ?? event;
    const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!)) as unknown as ComboboxOpenChangeEvent;
    onOpenChange?.(callbackEvent, { open: nextOpen });
    provider?.onOpenChange?.(nextOpen);
    provider?.setOpen?.(callbackEvent, nextOpen);
    const controlledOpen = open ?? provider?.open;
    if (controlledOpen !== undefined && ref.current && (open !== undefined || !provider?.setOpen)) (ref.current as HTMLElement & { setOpen?: (next: boolean) => void }).setOpen?.(controlledOpen);
  });
  useSpuiEvent(ref, "spui-change", (rawDetail, event) => {
    const detail = rawDetail as SpuiEventDetail & { optionText?: string };
    const selected = Array.isArray(detail.selectedOptions) ? detail.selectedOptions.map(String) : detail.selectedValue ? [String(detail.selectedValue)] : [];
    const data: ComboboxOptionSelectData = { optionValue: detail.selectedValue == null ? undefined : String(detail.selectedValue), optionText: detail.optionText == null ? (detail.value == null ? undefined : String(detail.value)) : String(detail.optionText), selectedOptions: selected };
    const sourceEvent = detail.event && typeof detail.event === "object" ? detail.event as Event : event;
    const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!)) as unknown as ComboboxSelectionEvent;
    provider?.setValue?.(String(detail.value ?? ""));
    const selectedOption = getProviderOption(ref.current, data.optionValue, data.optionText);
    if (selectedOption) provider?.selectOption?.(callbackEvent, selectedOption);
    onOptionSelect?.(callbackEvent, data);
    provider?.onOptionSelect?.(callbackEvent, data);
  });
  useSpuiEvent(ref, "spui-input", detail => { const next = String(detail.value ?? ""); provider?.onValueChange?.(next); provider?.setValue?.(next); });
  useSpuiEvent(ref, "spui-active-option-change", (rawDetail, event) => {
    const detail = rawDetail as SpuiEventDetail & { event?: Event; type?: "change"; previousOption?: string | null; nextOption?: string | null };
    const sourceEvent = detail.event ?? event;
    const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!));
    const previousOption = detail.previousOption == null ? detail.previousOption : getProviderOption(ref.current, String(detail.previousOption));
    const nextOption = detail.nextOption == null ? detail.nextOption : getProviderOption(ref.current, String(detail.nextOption));
    provider?.setActiveOption?.(nextOption ?? undefined);
    if (detail.type === "change") onActiveOptionChange?.(callbackEvent, { event: event as CustomEvent<{ id: string; previousId: string | null }>, type: "change", previousOption, nextOption });
    else onActiveOptionChange?.(callbackEvent, { event: callbackEvent, type: undefined, previousOption, nextOption });
  });
  const clearButtonSlot = clearButton == null ? null : React.isValidElement(clearButton)
    ? React.cloneElement(clearButton as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>, { slot: "clear-button", type: "button", className: (clearButton.props as React.ButtonHTMLAttributes<HTMLButtonElement>).className ?? "clear", "aria-label": (clearButton.props as React.ButtonHTMLAttributes<HTMLButtonElement>)["aria-label"] ?? strings.clear })
    : React.createElement("button", { slot: "clear-button", type: "button", "aria-label": strings.clear }, clearButton);
  const buttonSlot = button == null ? null : React.isValidElement(button)
    ? React.cloneElement(button as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>, { slot: "button", type: "button", className: (button.props as React.ButtonHTMLAttributes<HTMLButtonElement>).className ?? "trigger", role: "combobox", "aria-haspopup": "listbox" })
    : React.createElement("button", { slot: "button", type: "button", className: "trigger", role: "combobox", "aria-haspopup": "listbox" }, button);
  // The Dropdown engine renders its Option children into this root; keep React's
  // virtual child tree empty so it does not try to restore replaced list items.
  const listboxSlot = listbox == null ? null : React.cloneElement(listbox, { slot: "listbox" }, null);
  return React.createElement(CompoundComboboxContext.Provider, { value: { ...provider, mode: "combobox", multiselect, selectedOptions: selectedOptions ?? provider?.selectedOptions, value: value ?? provider?.value } },
    React.createElement("spui-combobox", useCustomElementProps({ ...props, ref, label: label ?? "", value: value ?? defaultValue ?? provider?.value, "selected-value": !multiselect ? selectedOptions?.[0] ?? defaultSelectedOptions?.[0] ?? provider?.selectedOptions?.[0] : undefined, "selected-options": multiselect ? selectedOptions ? JSON.stringify(selectedOptions) : provider?.selectedOptions ? JSON.stringify(provider.selectedOptions) : undefined : undefined, "default-selected-options": defaultSelectedOptions && multiselect ? JSON.stringify(defaultSelectedOptions) : undefined, multiselect: multiselect || undefined, disabled, placeholder, "read-only": "", "button-trigger": "", "clear-label": strings.clear, open: (open ?? provider?.open) ? "" : undefined, "default-open": defaultOpen ? "" : undefined, clearable: clearable ? "" : undefined, "disable-auto-focus": disableAutoFocus ? "" : undefined, appearance: appearance ?? provider?.appearance, size: size ?? provider?.size, positioning: typeof positioning === "string" ? positioning : positioning?.position ? `${positioning.position}${positioning.align && positioning.align !== "center" ? `-${positioning.align}` : ""}` : undefined, "inline-popup": inlinePopup ? "" : undefined, "no-results": strings.noResults }), children, buttonSlot, clearButtonSlot, expandIcon == null ? null : React.createElement("span", { slot: "expand-icon", "aria-hidden": true }, expandIcon), listboxSlot));
});

export type ListboxProps = ElementProps & { children?: React.ReactNode; selectedOptions?: string[]; defaultSelectedOptions?: string[]; multiselect?: boolean; disableAutoFocus?: boolean; onOptionSelect?: (event: ComboboxSelectionEvent, data: ComboboxOptionSelectData) => void };
/** Standalone keyboard-operable listbox for composing selectable Option elements. */
export function Listbox({ children, selectedOptions, defaultSelectedOptions = [], multiselect = false, disableAutoFocus = false, onOptionSelect, ...props }: ListboxProps): React.ReactElement {
  const [uncontrolled, setUncontrolled] = React.useState(defaultSelectedOptions);
  const selected = selectedOptions ?? uncontrolled;
  const select = (event: ComboboxSelectionEvent, value: string, text: string): void => {
    const next = multiselect ? selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value] : [value];
    if (selectedOptions === undefined) setUncontrolled(next);
    onOptionSelect?.(event, { optionValue: value, optionText: text, selectedOptions: next });
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const options = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])')];
    if (!options.length) return;
    const current = options.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? Math.min(options.length - 1, current + 1) : event.key === "ArrowUp" ? Math.max(0, current < 0 ? options.length - 1 : current - 1) : -1;
    if (next >= 0) { event.preventDefault(); options[next].focus(); }
    else if ((event.key === "Enter" || event.key === " ") && current >= 0) { event.preventDefault(); options[current].click(); }
  };
  return <CompoundComboboxContext.Provider value={{ mode: "listbox", selectedOptions: selected, multiselect, select }}><div {...props} role="listbox" aria-multiselectable={multiselect || undefined} tabIndex={disableAutoFocus ? undefined : 0} onKeyDown={onKeyDown}>{children}</div></CompoundComboboxContext.Provider>;
}

export type OptionProps = ElementProps & { value?: string; text?: string; disabled?: boolean; checkIcon?: React.ReactNode; children?: React.ReactNode };
/** Option for Dropdown/ComboBox or a standalone Listbox. */
export const Option = React.forwardRef<HTMLElement, OptionProps>(function Option({ value, text, disabled = false, checkIcon, children, ...props }: OptionProps, forwardedRef): React.ReactElement {
  const context = React.useContext(CompoundComboboxContext);
  const optionText = text ?? (typeof children === "string" ? children : "");
  const optionValue = value ?? optionText;
  const optionRef = React.useRef<HTMLElement>(null);
  useExposeHostRef(optionRef, forwardedRef);
  React.useLayoutEffect(() => {
    const host = optionRef.current;
    if (!host || context?.mode !== "combobox" || !context.registerOption) return;
    return context.registerOption({ id: host.id || optionValue, value: optionValue, text: optionText, disabled: disabled || undefined }, host);
  }, [context?.mode, context?.registerOption, disabled, optionText, optionValue]);
  if (context?.mode === "combobox") return React.createElement("spui-combobox-option", useCustomElementProps({ ref: optionRef, ...props, value: optionValue, label: optionText, disabled: disabled || undefined }), children);
  const selected = context?.selectedOptions?.includes(optionValue) ?? false;
  return <div {...props} ref={forwardedRef as React.Ref<HTMLDivElement>} role="option" aria-selected={selected} aria-disabled={disabled || undefined} tabIndex={-1} style={{ display: "flex", alignItems: "center", minHeight: 36, padding: "8px 10px", borderRadius: "var(--spui-control-radius,4px)", background: selected ? "var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))" : "transparent", color: "var(--spui-ui-text,inherit)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, ...props.style }} onClick={event => { props.onClick?.(event); if (!disabled) context?.select?.(event, optionValue, optionText); }}>{checkIcon ?? (selected ? <span aria-hidden="true">✓</span> : null)}{children}</div>;
});

export type OptionGroupProps = ElementProps & { label?: string; children?: React.ReactNode };
/** Group related options under an accessible label. */
export const OptionGroup = React.forwardRef<HTMLElement, OptionGroupProps>(function OptionGroup({ label, children, ...props }: OptionGroupProps, forwardedRef): React.ReactElement {
  const context = React.useContext(CompoundComboboxContext);
  if (context?.mode === "combobox") return React.createElement("spui-combobox-option-group", useCustomElementProps({ ref: forwardedRef, ...props, label }), children);
  return <div {...props} ref={forwardedRef as React.Ref<HTMLDivElement>} role="group" aria-label={label}>{label ? <div>{label}</div> : null}{children}</div>;
});

export type RichTextEditorProps = ElementProps & { label?: string; value?: string; defaultValue?: string; placeholder?: string; disabled?: boolean; readOnly?: boolean; required?: boolean; name?: string; form?: string; onValueChange?: (html: string) => void; onImageUpload?: (file: File) => Promise<string> };

export const RichTextEditor = React.forwardRef<HTMLElement, RichTextEditorProps>(function RichTextEditor(inputProps: RichTextEditorProps, forwardedRef): React.ReactElement {
  const { label, value, defaultValue, placeholder, disabled, readOnly, required, name, onValueChange, onImageUpload, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true });
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const strings = React.useContext(UIContext).strings;
  ensureDefined(defineRichTextEditor);
  React.useEffect(() => { const element = ref.current as (HTMLElement & { uploadImage?: (file: File) => Promise<string> }) | null; if (element) element.uploadImage = onImageUpload; return () => { if (element) delete element.uploadImage; }; }, [onImageUpload]);
  useSpuiEvent(ref, "spui-input", value !== undefined || onValueChange ? detail => {
    onValueChange?.(String(detail.value ?? ""));
    if (value !== undefined && ref.current) (ref.current as HTMLElement & { value: string }).value = value;
  } : undefined);
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { value?: string }) | null;
    if (!element) return;
    if (value !== undefined) {
      if (element.value !== value) element.value = value;
    } else if (defaultValue !== undefined && !element.hasAttribute("value")) {
      element.setAttribute("value", defaultValue);
      if (element.value !== defaultValue) element.value = defaultValue;
    }
  }, [value, defaultValue]);
  return React.createElement("spui-rich-text-editor", useCustomElementProps({ ...props, ref, label, placeholder, disabled, "read-only": readOnly, required, name, "required-message": strings.richTextRequired, "bold-label": strings.richTextBold, "italic-label": strings.richTextItalic, "underline-label": strings.richTextUnderline, "bullet-list-label": strings.richTextBulletList, "number-list-label": strings.richTextNumberList, "link-label": strings.richTextLink, "undo-label": strings.richTextUndo, "redo-label": strings.richTextRedo, "insert-table-label": strings.richTextInsertTable, "insert-image-label": strings.richTextInsertImage, "image-input-label": strings.richTextChooseImage, "insert-row-above-label": strings.richTextInsertRowAbove, "insert-row-below-label": strings.richTextInsertRowBelow, "insert-column-before-label": strings.richTextInsertColumnBefore, "insert-column-after-label": strings.richTextInsertColumnAfter, "delete-row-label": strings.richTextDeleteRow, "delete-column-label": strings.richTextDeleteColumn, "delete-table-label": strings.richTextDeleteTable, "toolbar-label": strings.richTextToolbar, "link-prompt": strings.richTextLinkPrompt }));
});

export type BadgeProps = ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; appearance?: BadgeAppearance; color?: BadgeColor; iconPosition?: "before" | "after"; shape?: BadgeShape; size?: BadgeSize };
export const Badge = React.forwardRef<HTMLElement, BadgeProps>(function Badge({ children, icon, appearance = "filled", color = "brand", iconPosition = "before", shape = "circular", size = "medium", ...props }: BadgeProps, forwardedRef): React.ReactElement {
  ensureDefined(defineBadge);
  return React.createElement("spui-badge", useCustomElementProps({ ...props, ref: forwardedRef, appearance, color, "icon-position": iconPosition, shape, size }), icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon), children);
});

export const CounterBadge = React.forwardRef<HTMLElement, ElementProps & { count?: number; dot?: boolean; overflowCount?: number; showZero?: boolean; appearance?: "filled" | "ghost"; color?: Extract<BadgeColor, "brand" | "danger" | "important" | "informative">; shape?: "circular" | "rounded"; size?: BadgeSize; icon?: React.ReactNode; iconPosition?: "before" | "after" }>(function CounterBadge({ count = 0, dot = false, overflowCount = 99, showZero = false, appearance = "filled", color = "brand", shape = "circular", size = "medium", icon, iconPosition = "before", ...props }: ElementProps & { count?: number; dot?: boolean; overflowCount?: number; showZero?: boolean; appearance?: "filled" | "ghost"; color?: Extract<BadgeColor, "brand" | "danger" | "important" | "informative">; shape?: "circular" | "rounded"; size?: BadgeSize; icon?: React.ReactNode; iconPosition?: "before" | "after" }, forwardedRef): React.ReactElement {
  ensureDefined(defineCounterBadge);
  return React.createElement("spui-counter-badge", useCustomElementProps({ ref: forwardedRef, ...props, count, dot: dot || undefined, "overflow-count": overflowCount, "show-zero": showZero || undefined, appearance, color, shape, size, "icon-position": iconPosition }), icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon));
});

export const PresenceBadge = React.forwardRef<HTMLElement, ElementProps & { status?: PresenceBadgeStatus; outOfOffice?: boolean; size?: BadgeSize; icon?: React.ReactNode }>(function PresenceBadge({ status = "available", outOfOffice = false, size = "medium", icon, ...props }: ElementProps & { status?: PresenceBadgeStatus; outOfOffice?: boolean; size?: BadgeSize; icon?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(definePresenceBadge);
  return React.createElement("spui-presence-badge", useCustomElementProps({ ref: forwardedRef, ...props, status, "out-of-office": outOfOffice || undefined, size }), icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon));
});

export type TagProps = ElementProps & { children?: React.ReactNode; appearance?: "filled" | "outline" | "brand"; size?: "extra-small" | "small" | "medium" | "large"; shape?: "rounded" | "circular"; color?: "neutral" | "success" | "warning" | "danger" | "informative"; value?: string; label?: string; disabled?: boolean; selected?: boolean; dismissible?: boolean; dismissLabel?: string; onDismiss?: (value: string, label: string) => void; media?: React.ReactNode; icon?: React.ReactNode; primaryText?: React.ReactNode; secondaryText?: React.ReactNode; dismissIcon?: React.ReactNode };
export const Tag = React.forwardRef<HTMLElement, TagProps>(function Tag({ children, appearance, size, shape = "rounded", color, value, label, disabled = false, selected = false, dismissible = false, dismissLabel, onDismiss, media, icon, primaryText, secondaryText, dismissIcon, ...props }: TagProps, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement | null>(null);
  const attachRef = React.useCallback((element: HTMLElement | null) => {
    ref.current = element;
    if (typeof forwardedRef === "function") forwardedRef(element);
    else if (forwardedRef) (forwardedRef as unknown as { current: HTMLElement | null }).current = element;
  }, [forwardedRef]);
  const strings = React.useContext(UIContext).strings;
  ensureDefined(defineTag);
  useSpuiEvent(ref, "spui-dismiss", detail => onDismiss?.(String(detail.value ?? ""), String(detail.label ?? "")));
  return React.createElement("spui-tag", useCustomElementProps({ ...props, ref: attachRef, appearance, size, shape, color, value, label, disabled: disabled || undefined, selected: selected || undefined, dismissible: dismissible || undefined, "dismiss-label": dismissLabel ?? strings.remove }),
    media == null ? null : React.createElement("span", { slot: "media" }, media),
    icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon),
    primaryText == null ? children : React.createElement("span", { slot: "primary-text" }, primaryText),
    secondaryText == null ? null : React.createElement("span", { slot: "secondary-text" }, secondaryText),
    dismissIcon == null ? null : React.createElement("span", { slot: "dismiss-icon", "aria-hidden": true }, dismissIcon));
});

export const InteractionTag = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; appearance?: "filled" | "outline" | "brand"; size?: "extra-small" | "small" | "medium"; shape?: "rounded" | "circular"; value?: string; label?: string; disabled?: boolean; selected?: boolean; onTagSelect?: (event: Event, data: InteractionTagSelectData) => void; onDismiss?: (event: TagDismissEvent, data: { value: string }) => void }>(function InteractionTag({ children, appearance, size, shape = "rounded", value, label, disabled = false, selected = false, onTagSelect, onDismiss, ...props }: ElementProps & { children?: React.ReactNode; appearance?: "filled" | "outline" | "brand"; size?: "extra-small" | "small" | "medium"; shape?: "rounded" | "circular"; value?: string; label?: string; disabled?: boolean; selected?: boolean; onTagSelect?: (event: Event, data: InteractionTagSelectData) => void; onDismiss?: (event: TagDismissEvent, data: { value: string }) => void }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineInteractionTag);
  useSpuiEvent(ref, "spui-tag-select", (detail, event) => onTagSelect?.(event, { value: String(detail.value ?? ""), selected: Boolean(detail.selected) }));
  useSpuiEvent(ref, "spui-dismiss", (detail, event) => { const sourceEvent = detail.originalEvent ?? event; const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!)) as unknown as TagDismissEvent; onDismiss?.(callbackEvent, { value: String(detail.value ?? "") }); });
  return React.createElement("spui-interaction-tag", useCustomElementProps({ ...props, ref, appearance, size, shape, value, label, disabled: disabled || undefined, selected: selected || undefined }), children);
});

export const InteractionTagPrimary = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; media?: React.ReactNode; icon?: React.ReactNode; primaryText?: React.ReactNode; secondaryText?: React.ReactNode; hasSecondaryAction?: boolean }>(function InteractionTagPrimary({ children, media, icon, primaryText, secondaryText, hasSecondaryAction = false, ...props }: ElementProps & { children?: React.ReactNode; media?: React.ReactNode; icon?: React.ReactNode; primaryText?: React.ReactNode; secondaryText?: React.ReactNode; hasSecondaryAction?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineInteractionTagPrimary);
  return React.createElement("spui-interaction-tag-primary", useCustomElementProps({ ref: forwardedRef, ...props, "has-secondary-action": hasSecondaryAction || undefined, "data-spui-explicit-has-secondary-action": hasSecondaryAction || undefined }),
    media == null ? null : React.createElement("span", { slot: "media", "aria-hidden": true }, media),
    icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon),
    primaryText == null ? children : React.createElement("span", { slot: "primary-text" }, primaryText),
    secondaryText == null ? null : React.createElement("span", { slot: "secondary-text" }, secondaryText));
});

export const InteractionTagSecondary = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; label?: string }>(function InteractionTagSecondary({ children, label, ...props }: ElementProps & { children?: React.ReactNode; label?: string }, forwardedRef): React.ReactElement {
  const strings = React.useContext(UIContext).strings;
  ensureDefined(defineInteractionTagSecondary);
  return React.createElement("spui-interaction-tag-secondary", useCustomElementProps({ ref: forwardedRef, ...props, label, "remove-label": strings.remove }), children);
});

export type TagDismissEvent = React.MouseEvent | React.KeyboardEvent;
export type TagGroupReactSelectData = Omit<TagGroupSelectData, "event" | "type"> & (
  | { event: SharePointUIEvent; type: undefined }
  | { event: React.MouseEvent<HTMLButtonElement>; type: "click" }
);
export const TagGroup = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; orientation?: "horizontal" | "vertical"; label?: string; appearance?: TagAppearance; size?: TagSize; disabled?: boolean; dismissible?: boolean; selectedValues?: string[]; defaultSelectedValues?: string[]; onTagSelect?: (event: SharePointUIEvent, data: TagGroupReactSelectData) => void; onDismiss?: (event: TagDismissEvent, data: { value: string }) => void }>(function TagGroup({ children, orientation = "horizontal", label, appearance = "filled", size = "medium", disabled = false, dismissible = false, selectedValues, defaultSelectedValues, onTagSelect, onDismiss, ...props }: ElementProps & { children?: React.ReactNode; orientation?: "horizontal" | "vertical"; label?: string; appearance?: TagAppearance; size?: TagSize; disabled?: boolean; dismissible?: boolean; selectedValues?: string[]; defaultSelectedValues?: string[]; onTagSelect?: (event: SharePointUIEvent, data: TagGroupReactSelectData) => void; onDismiss?: (event: TagDismissEvent, data: { value: string }) => void }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineTagGroup);
  useSpuiEvent(ref, "spui-selection-change", (detail, event) => {
    const sourceEvent = detail.event instanceof Event ? detail.event : event;
    const target = sourceEvent.composedPath().find((entry): entry is HTMLButtonElement => entry instanceof HTMLButtonElement)
      ?? sourceEventTarget(sourceEvent, ref.current!) as HTMLButtonElement;
    const callbackEvent = createReactEventBridge(sourceEvent, event, target, target) as React.MouseEvent<HTMLButtonElement>;
    onTagSelect?.(callbackEvent, { event: callbackEvent, type: "click", value: String(detail.value ?? ""), selectedValues: detail.selectedValues ?? [] });
  });
  useSpuiEvent(ref, "spui-tag-dismiss", (detail, event) => { const sourceEvent = detail.sourceEvent ?? event; const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!)) as unknown as TagDismissEvent; onDismiss?.(callbackEvent, { value: String(detail.value ?? "") }); });
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { selectedValues?: string[] }) | null;
    if (element && selectedValues !== undefined) element.selectedValues = selectedValues;
  }, [selectedValues]);
  return React.createElement("spui-tag-group", useCustomElementProps({ ...props, ref, role: props.role ?? "toolbar", orientation, label, appearance, size, disabled: disabled || undefined, dismissible: dismissible || undefined, "default-selected-values": defaultSelectedValues === undefined ? undefined : JSON.stringify(defaultSelectedValues), "aria-label": props["aria-label"] ?? label }), children);
});

type TagPickerReactOpenChangeData = { open: boolean; reason: string } & (
  | { type: undefined; event: SharePointUIEvent }
  | { type: "click"; event: React.MouseEvent<HTMLDivElement> }
  | { type: "keydown"; event: React.KeyboardEvent<HTMLDivElement> }
  | { type: Exclude<TagPickerOpenChangeType, "click" | "keydown" | "programmatic">; event: SharePointUIEvent }
  | { type: "programmatic"; event: Event }
);
type TagPickerReactOptionSelectData = { value: string; selectedOptions: string[] } & (
  | { type: undefined; event: SharePointUIEvent }
  | { type: "click"; event: React.MouseEvent<HTMLDivElement> }
  | { type: "keydown"; event: React.KeyboardEvent<HTMLDivElement> }
);
export type TagPickerProps = Omit<ElementProps, "onChange"> & { children?: React.ReactNode; label?: string; form?: string; selectedValues?: string[]; defaultSelectedValues?: string[]; inputValue?: string; open?: boolean; defaultOpen?: boolean; inline?: boolean; noPopover?: boolean; onOpenChange?: (event: SharePointUIEvent, data: TagPickerReactOpenChangeData) => void; onOptionSelect?: (event: SharePointUIEvent, data: TagPickerReactOptionSelectData) => void; onInputValueChange?: (value: string) => void; onChange?: (values: string[]) => void };
export const TagPicker = React.forwardRef<HTMLElement, TagPickerProps>(function TagPicker({ children, label, selectedValues, defaultSelectedValues, inputValue, open, defaultOpen, inline = false, noPopover = false, onOpenChange, onOptionSelect, onInputValueChange, onChange, ...props }: TagPickerProps, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const strings = React.useContext(UIContext).strings;
  ensureDefined(defineTagPicker);
  useSpuiEvent(ref, "spui-change", detail => onChange?.(detail.values ?? detail.selectedValues ?? []));
  useSpuiEvent(ref, "spui-input", detail => onInputValueChange?.(String(detail.value ?? "")));
  useSpuiEvent(ref, "spui-open-change", (detail, dispatchEvent) => {
    const change = detail as TagPickerOnOpenChangeData;
    const sourceEvent = change.event;
    const currentTarget = ref.current?.shadowRoot?.querySelector<HTMLDivElement>(".control") ?? ref.current as HTMLDivElement;
    const callbackEvent = sourceEvent instanceof MouseEvent || sourceEvent instanceof KeyboardEvent
      ? createReactEventBridge(sourceEvent, dispatchEvent, currentTarget)
      : sourceEvent;
    const type = change.type === "programmatic" ? undefined : change.type;
    onOpenChange?.(callbackEvent, { ...change, type, event: callbackEvent } as TagPickerReactOpenChangeData);
  });
  useSpuiEvent(ref, "spui-option-select", (detail, dispatchEvent) => {
    const change = detail as TagPickerOnOptionSelectData;
    const sourceEvent = change.event;
    const currentTarget = ref.current?.shadowRoot?.querySelector<HTMLDivElement>(".control") ?? ref.current as HTMLDivElement;
    const callbackEvent = createReactEventBridge(sourceEvent, dispatchEvent, currentTarget);
    onOptionSelect?.(callbackEvent, { ...change, event: callbackEvent } as TagPickerReactOptionSelectData);
  });
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { value?: string[] }) | null;
    if (element && selectedValues !== undefined) element.value = selectedValues;
    if (element && inputValue !== undefined) (element as HTMLElement & { inputValue: string }).inputValue = inputValue;
    if (element && open !== undefined) (element as HTMLElement & { open: boolean }).open = open;
    else if (element && defaultOpen !== undefined) (element as HTMLElement & { defaultOpen: boolean }).defaultOpen = defaultOpen;
  }, [selectedValues, inputValue, open, defaultOpen]);
  return React.createElement("spui-tag-picker", useCustomElementProps({ ...props, ref, label, "selected-values": defaultSelectedValues === undefined ? undefined : JSON.stringify(defaultSelectedValues), "input-value": inputValue, inline: inline || undefined, "no-popover": noPopover || undefined, "no-results": strings.noResults, "remove-label": strings.remove }), children);
});

export function TagPickerControl({ children, secondaryAction, expandIcon }: ElementProps & { children?: React.ReactNode; secondaryAction?: React.ReactNode; expandIcon?: React.ReactNode }): React.ReactElement {
  return React.createElement(React.Fragment, null, children,
    secondaryAction == null ? null : React.createElement("span", { slot: "secondary-action" }, secondaryAction),
    expandIcon == null ? null : React.createElement("span", { slot: "expand-icon", "aria-hidden": true }, expandIcon));
}

export const TagPickerGroup = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; label?: string }>(function TagPickerGroup({ children, label, ...props }: ElementProps & { children?: React.ReactNode; label?: string }, forwardedRef): React.ReactElement {
  return React.createElement("spui-tag-picker-group", useCustomElementProps({ ref: forwardedRef, ...props, slot: "selected-group", role: "group", "aria-label": props["aria-label"] ?? label }), children);
});

export const TagPickerInput = React.forwardRef<HTMLElement, Omit<ElementProps, "children"> & { value?: string; placeholder?: string; disabled?: boolean; clearable?: boolean; appearance?: "filled-darker" | "filled-lighter" | "outline"; onValueChange?: (value: string) => void }>(function TagPickerInput({ value, placeholder, disabled = false, clearable = false, appearance, onValueChange, ...props }: Omit<ElementProps, "children"> & { value?: string; placeholder?: string; disabled?: boolean; clearable?: boolean; appearance?: "filled-darker" | "filled-lighter" | "outline"; onValueChange?: (value: string) => void }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  React.useEffect(() => {
    const picker = ref.current?.closest("spui-tag-picker");
    if (!picker || !onValueChange) return;
    const listener = (event: Event): void => onValueChange(String((event as CustomEvent<{ value?: string }>).detail?.value ?? ""));
    picker.addEventListener("spui-input", listener);
    return () => picker.removeEventListener("spui-input", listener);
  }, [onValueChange]);
  return React.createElement("spui-tag-picker-input", useCustomElementProps({ ...props, ref, value, placeholder, disabled: disabled || undefined, clearable: clearable || undefined, appearance }));
});

export function TagPickerList({ children }: ElementProps & { children?: React.ReactNode; disableAutoFocus?: boolean }): React.ReactElement {
  return React.createElement(React.Fragment, null, children);
}

export function TagPickerButton({ children, appearance = "secondary", size = "medium", disabled = false, ...props }: ElementProps & { children?: React.ReactNode; appearance?: ButtonAppearance; size?: ButtonSize; disabled?: boolean }): React.ReactElement {
  return React.createElement(Button, { ...props, slot: "button", type: "button", appearance, size, disabled: disabled || undefined }, children);
}

export const TagPickerOption = React.forwardRef<HTMLElement, ElementProps & { value: string; text?: string; label?: string; group?: string; media?: React.ReactNode; secondaryContent?: React.ReactNode; disabled?: boolean; children?: React.ReactNode }>(function TagPickerOption({ value, text, label, group, media, secondaryContent, disabled = false, children, ...props }: ElementProps & { value: string; text?: string; label?: string; group?: string; media?: React.ReactNode; secondaryContent?: React.ReactNode; disabled?: boolean; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  return React.createElement("spui-tag-picker-option", useCustomElementProps({ ref: forwardedRef, ...props, value, text, label, group, disabled: disabled || undefined }),
    media == null ? null : React.createElement("span", { slot: "media" }, media),
    React.createElement("span", { slot: "label" }, children),
    secondaryContent == null ? null : React.createElement("span", { slot: "secondary-content" }, secondaryContent));
});

export const TagPickerOptionGroup = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; label: string; disabled?: boolean }>(function TagPickerOptionGroup({ children, label, disabled = false }: ElementProps & { children?: React.ReactNode; label: string; disabled?: boolean }, forwardedRef): React.ReactElement {
  return React.createElement("spui-tag-picker-option-group", useCustomElementProps({ ref: forwardedRef, label, disabled: disabled || undefined }), children);
});

export type RatingOnChangeData = { value: number } & (
  | { event: SharePointUIEvent; type: undefined }
  | { event: React.FormEvent<HTMLDivElement>; type: "change" }
);
export type RatingInputSlot = React.ReactElement<any> | Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "value" | "checked" | "disabled" | "required">;

export type RatingProps = Omit<ElementProps, "onChange"> & { value?: number; defaultValue?: number; max?: number; step?: 0.5 | 1; size?: "small" | "medium" | "large" | "extra-large"; color?: "brand" | "marigold" | "neutral"; label?: string; itemLabel?: (rating: number) => string; iconFilled?: React.ElementType; iconOutline?: React.ElementType; fullValueInput?: RatingInputSlot; halfValueInput?: RatingInputSlot; name?: string; form?: string; disabled?: boolean; readOnly?: boolean; required?: boolean; onChange?: (event: SharePointUIEvent, data: RatingOnChangeData) => void };

export const Rating = React.forwardRef<HTMLElement, RatingProps>(function Rating({ value, defaultValue = 0, max = 5, step = 1, size = "extra-large", color = "neutral", label, itemLabel, iconFilled, iconOutline, fullValueInput, halfValueInput, name, disabled = false, readOnly = false, required = false, onChange, ...props }: RatingProps, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const strings = React.useContext(UIContext).strings;
  ensureDefined(defineRating);
  useSpuiEvent(ref, "spui-change", (detail, event) => {
    const sourceEvent = detail.event instanceof Event ? detail.event : event;
    const currentTarget = ref.current?.shadowRoot?.querySelector<HTMLDivElement>(".items") ?? ref.current as HTMLDivElement;
    const callbackEvent = createReactEventBridge(sourceEvent, event, currentTarget) as React.FormEvent<HTMLDivElement>;
    onChange?.(callbackEvent, { event: callbackEvent, type: "change", value: Number(detail.value ?? 0) });
  });
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { itemLabel?: (rating: number) => string }) | null;
    if (element) element.itemLabel = itemLabel;
  }, [itemLabel]);
  const inputSlot = (slot: RatingInputSlot | undefined, name: "full-value-input" | "half-value-input"): React.ReactNode => {
    if (slot == null) return null;
    return React.isValidElement(slot)
      ? React.cloneElement(slot as React.ReactElement<any>, { slot: name, hidden: true, "aria-hidden": true, tabIndex: -1 })
      : React.createElement("input", { ...(slot as React.InputHTMLAttributes<HTMLInputElement>), slot: name, hidden: true, "aria-hidden": true, tabIndex: -1 });
  };
  return React.createElement("spui-rating", useCustomElementProps({ ...props, ref, value, "default-value": defaultValue, max, step, size, color, label, name, disabled: disabled || undefined, readonly: readOnly || undefined, required: required || undefined, "item-label": strings.ratingValue }),
    iconOutline == null ? null : React.createElement("span", { slot: "icon-outline", hidden: true }, React.createElement(iconOutline, { "aria-hidden": true, focusable: "false" })),
    iconFilled == null ? null : React.createElement("span", { slot: "icon-filled", hidden: true }, React.createElement(iconFilled, { "aria-hidden": true, focusable: "false" })),
    inputSlot(fullValueInput, "full-value-input"), inputSlot(halfValueInput, "half-value-input"));
});

export const RatingItem = React.forwardRef<HTMLElement, ElementProps & { value?: number; selectedIcon?: React.ReactNode; unselectedIcon?: React.ReactNode }>(function RatingItem({ value = 1, selectedIcon, unselectedIcon, ...props }: ElementProps & { value?: number; selectedIcon?: React.ReactNode; unselectedIcon?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineRatingItem);
  return React.createElement("spui-rating-item", useCustomElementProps({ ref: forwardedRef, ...props, value }),
    unselectedIcon == null ? null : React.createElement("span", { slot: "unselected-icon" }, unselectedIcon),
    selectedIcon == null ? null : React.createElement("span", { slot: "selected-icon" }, selectedIcon));
});

export const RatingDisplay = React.forwardRef<HTMLElement, ElementProps & { value?: number; max?: number; count?: number; compact?: boolean; color?: "brand" | "marigold" | "neutral"; size?: "small" | "medium" | "large" | "extra-large"; icon?: React.ElementType; label?: string; valueText?: React.ReactNode; countText?: React.ReactNode; children?: React.ReactNode }>(function RatingDisplay({ value, max = 5, count, compact = false, color = "neutral", size = "medium", icon, label, valueText, countText, children, ...props }: ElementProps & { value?: number; max?: number; count?: number; compact?: boolean; color?: "brand" | "marigold" | "neutral"; size?: "small" | "medium" | "large" | "extra-large"; icon?: React.ElementType; label?: string; valueText?: React.ReactNode; countText?: React.ReactNode; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineRatingDisplay); ensureDefined(defineRatingItem);
  const items = children ?? (icon ? Array.from({ length: compact ? 1 : max }, (_, index) => React.createElement(RatingItem, { key: index + 1, value: index + 1, selectedIcon: React.createElement(icon), unselectedIcon: React.createElement(icon) })) : undefined);
  return React.createElement("spui-rating-display", useCustomElementProps({ ref: forwardedRef, ...props, value, max, count, compact: compact || undefined, color, size, "aria-label": label }),
    valueText == null ? null : React.createElement("span", { slot: "value-text" }, valueText),
    countText == null ? null : React.createElement("span", { slot: "count-text" }, countText), items);
});

export type ListOnSelectionChangeData =
  | { event: SharePointUIEvent; type: undefined; selectedItems: ListItemValue[] }
  | { event: React.SyntheticEvent; type: "change"; selectedItems: ListItemValue[] };

export const List = React.forwardRef<HTMLElement, ElementProps & { navigationMode?: ListNavigationMode; selectionMode?: ListSelectionMode; selectedItems?: ListItemValue[]; defaultSelectedItems?: ListItemValue[]; onSelectionChange?: (event: SharePointUIEvent, data: ListOnSelectionChangeData) => void; children?: React.ReactNode }>(function List({ navigationMode, selectionMode, selectedItems, defaultSelectedItems, onSelectionChange, children, ...props }: ElementProps & { navigationMode?: ListNavigationMode; selectionMode?: ListSelectionMode; selectedItems?: ListItemValue[]; defaultSelectedItems?: ListItemValue[]; onSelectionChange?: (event: SharePointUIEvent, data: ListOnSelectionChangeData) => void; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineList);
  useSpuiEvent(ref, "spui-selection-change", (rawDetail, event) => {
    const detail = rawDetail as SpuiEventDetail & { event?: Event };
    const selected = detail.selectedItems ?? [];
    if (detail.event) {
      const callbackEvent = createReactEventBridge(detail.event, event, ref.current!);
      onSelectionChange?.(callbackEvent, { event: callbackEvent, type: "change", selectedItems: selected });
    } else onSelectionChange?.(event, { event, type: undefined, selectedItems: selected });
  });
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { selectedItems?: ListItemValue[]; defaultSelectedItems?: ListItemValue[] }) | null;
    if (element) { element.selectedItems = selectedItems; if (defaultSelectedItems) element.defaultSelectedItems = defaultSelectedItems; }
  }, [selectedItems, defaultSelectedItems]);
  return React.createElement("spui-list", useCustomElementProps({ ...props, ref, "navigation-mode": navigationMode, "selection-mode": selectionMode }), children);
});

export const ListItem = React.forwardRef<HTMLElement, ElementProps & { value?: ListItemValue; disabledSelection?: boolean; checkmark?: React.ReactNode; onAction?: (event: ListItemActionEvent, data: SharePointUIEventData<ListItemActionData>) => void; children?: React.ReactNode }>(function ListItem({ value, disabledSelection = false, checkmark, onAction, children, ...props }: ElementProps & { value?: ListItemValue; disabledSelection?: boolean; checkmark?: React.ReactNode; onAction?: (event: ListItemActionEvent, data: SharePointUIEventData<ListItemActionData>) => void; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineListItem);
  useSpuiEvent(ref, "spui-list-item-action", (detail, event) => {
    const actionEvent = event as ListItemActionEvent;
    const actionValue = (detail.value ?? "") as ListItemValue;
    onAction?.(actionEvent, { event: actionEvent, type: "ListItemAction", value: actionValue });
  });
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { value?: ListItemValue }) | null;
    if (element && value !== undefined) element.value = value;
  }, [value]);
  return React.createElement("spui-list-item", useCustomElementProps({ ...props, ref, value: value === undefined ? undefined : String(value), "disabled-selection": disabledSelection || undefined, "has-action": onAction ? "" : undefined }),
    children, checkmark == null ? null : React.createElement("span", { slot: "checkmark" }, checkmark));
});

export const CarouselCard = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; autoSize?: boolean }>(function CarouselCard({ children, autoSize = false, ...props }: ElementProps & { children?: React.ReactNode; autoSize?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineCarouselCard);
  return React.createElement("spui-carousel-card", useCustomElementProps({ ref: forwardedRef, ...props, "auto-size": autoSize || undefined }), children);
});

export const CarouselNav = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; label?: string; appearance?: "brand"; slot?: string }>(function CarouselNav({ children, label, appearance, slot = "navigation", ...props }: ElementProps & { children?: React.ReactNode; label?: string; appearance?: "brand"; slot?: string }, forwardedRef): React.ReactElement {
  const strings = React.useContext(UIContext).strings;
  ensureDefined(defineCarouselNav); ensureDefined(defineCarouselNavButton); ensureDefined(defineCarouselNavImageButton);
  return React.createElement("spui-carousel-nav", useCustomElementProps({ ref: forwardedRef, ...props, slot, "aria-label": label || strings.carouselNavigation, appearance }), children);
});

export const CarouselNavButton = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; index: number; label?: string; selected?: boolean; disabled?: boolean }>(function CarouselNavButton({ children, index, label, selected = false, disabled = false, ...props }: ElementProps & { children?: React.ReactNode; index: number; label?: string; selected?: boolean; disabled?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineCarouselNavButton);
  return React.createElement("spui-carousel-nav-button", useCustomElementProps({ ref: forwardedRef, ...props, index, label, selected: selected || undefined, disabled: disabled || undefined }), children);
});

export const CarouselNavImageButton = React.forwardRef<HTMLElement, ElementProps & { index: number; src: string; alt: string; label?: string; image?: React.ReactElement; selected?: boolean; disabled?: boolean }>(function CarouselNavImageButton({ index, src, alt, label, image, selected = false, disabled = false, ...props }: ElementProps & { index: number; src: string; alt: string; label?: string; image?: React.ReactElement; selected?: boolean; disabled?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineCarouselNavImageButton);
  return React.createElement("spui-carousel-nav-image-button", useCustomElementProps({ ref: forwardedRef, ...props, index, src, alt, label, selected: selected || undefined, disabled: disabled || undefined }), image == null ? null : React.cloneElement(image, { slot: "image" }));
});

export const CarouselButton = React.forwardRef<HTMLElement, Omit<ElementProps, "slot"> & { children?: React.ReactNode; icon?: React.ReactNode; navType?: "prev" | "next"; label?: string; slot?: string | null }>(function CarouselButton({ children, icon, navType = "next", label, ...props }: Omit<ElementProps, "slot"> & { children?: React.ReactNode; icon?: React.ReactNode; navType?: "prev" | "next"; label?: string; slot?: string | null }, forwardedRef): React.ReactElement {
  ensureDefined(defineCarouselButton);
  return React.createElement("spui-carousel-button", useCustomElementProps({ ref: forwardedRef, ...props, slot: props.slot === null ? null : props.slot || (navType === "prev" ? "previous" : "next"), "nav-type": navType, label }), renderIconSlot(icon), children);
});

export type CarouselAutoplayChangeData = { checked: boolean } & (
  | { event: SharePointUIEvent; type: undefined }
  | { event: React.MouseEvent<HTMLButtonElement>; type: "click" }
);

export const CarouselAutoplayButton = React.forwardRef<HTMLElement, Omit<ElementProps, "slot"> & { icon?: React.ReactNode; playLabel?: string; pauseLabel?: string; onCheckedChange?: (event: SharePointUIEvent, data: CarouselAutoplayChangeData) => void; slot?: string | null }>(function CarouselAutoplayButton({ icon, playLabel, pauseLabel, onCheckedChange, ...props }: Omit<ElementProps, "slot"> & { icon?: React.ReactNode; playLabel?: string; pauseLabel?: string; onCheckedChange?: (event: SharePointUIEvent, data: CarouselAutoplayChangeData) => void; slot?: string | null }, forwardedRef): React.ReactElement {
  const strings = React.useContext(UIContext).strings;
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineCarouselAutoplayButton);
  useSpuiEvent(ref, "spui-carousel-autoplay-toggle", (detail, event) => {
    const change = detail as CarouselAutoplayChangeData;
    const sourceEvent = change.event instanceof Event ? change.event : event;
    const target = sourceEventTarget(sourceEvent, ref.current!);
    const callbackEvent = createReactEventBridge(sourceEvent, event, target as HTMLButtonElement) as React.MouseEvent<HTMLButtonElement>;
    onCheckedChange?.(callbackEvent, { ...change, event: callbackEvent } as CarouselAutoplayChangeData);
  });
  return React.createElement("spui-carousel-autoplay-button", useCustomElementProps({ ...props, ref, slot: props.slot === null ? null : props.slot || "autoplay", "play-label": playLabel || strings.carouselPlay || "Play", "pause-label": pauseLabel || strings.carouselPause || "Pause" }), renderIconSlot(icon));
});

export type CarouselNavButtonSlotProps = React.ReactElement | Omit<Parameters<typeof CarouselButton>[0], "navType" | "slot">;
export type CarouselAutoplaySlotProps = React.ReactElement | Omit<Parameters<typeof CarouselAutoplayButton>[0], "slot"> | boolean;
export type CarouselTooltipSlotProps = React.ReactElement | Omit<Parameters<typeof Tooltip>[0], "children" | "slot">;
export type CarouselReactIndexChangeData = { index: number } & (
  | { event: SharePointUIEvent; type: undefined }
  | { event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>; type: "click" }
  | { event: React.FocusEvent<Element>; type: "focus" }
  | { event: PointerEvent | MouseEvent; type: "drag" }
  | { event: Event; type: "autoplay" | "scroll" | "programmatic" }
  | { event: React.KeyboardEvent<HTMLElement>; type: "keydown" }
);

function createCarouselChangeEvent(change: { event: Event; eventType: CarouselIndexChangeData["type"] }, dispatchEvent: Event, host: HTMLElement): CarouselReactIndexChangeData["event"] {
  if (change.eventType === "click" && change.event instanceof MouseEvent) {
    const target = change.event.composedPath().find((entry): entry is HTMLButtonElement | HTMLAnchorElement => entry instanceof HTMLButtonElement || entry instanceof HTMLAnchorElement)
      ?? sourceEventTarget(change.event, host) as HTMLButtonElement | HTMLAnchorElement;
    return createReactEventBridge(change.event, dispatchEvent, target, target) as React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>;
  }
  if ((change.eventType === "focus" && change.event instanceof FocusEvent) || (change.eventType === "keydown" && change.event instanceof KeyboardEvent)) {
    return createReactEventBridge(change.event, dispatchEvent, sourceEventTarget(change.event, host)) as React.FocusEvent<Element> | React.KeyboardEvent<HTMLElement>;
  }
  return change.event;
}

export const CarouselNavContainer = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; prev?: CarouselNavButtonSlotProps | null; next?: CarouselNavButtonSlotProps | null; autoplay?: CarouselAutoplaySlotProps | null; prevTooltip?: CarouselTooltipSlotProps | null; nextTooltip?: CarouselTooltipSlotProps | null; autoplayTooltip?: CarouselTooltipSlotProps | null; layout?: "inline" | "inline-wide" | "overlay" | "overlay-wide" | "overlay-expanded" }>(function CarouselNavContainer({ children, prev, next, autoplay, prevTooltip, nextTooltip, autoplayTooltip, layout = "inline", ...props }: ElementProps & { children?: React.ReactNode; prev?: CarouselNavButtonSlotProps | null; next?: CarouselNavButtonSlotProps | null; autoplay?: CarouselAutoplaySlotProps | null; prevTooltip?: CarouselTooltipSlotProps | null; nextTooltip?: CarouselTooltipSlotProps | null; autoplayTooltip?: CarouselTooltipSlotProps | null; layout?: "inline" | "inline-wide" | "overlay" | "overlay-wide" | "overlay-expanded" }, forwardedRef): React.ReactElement {
  const strings = React.useContext(UIContext).strings;
  ensureDefined(defineCarouselNavContainer);
  const flattenChildren = (nodes: React.ReactNode): React.ReactNode[] => React.Children.toArray(nodes).flatMap(child => React.isValidElement(child) && child.type === React.Fragment ? flattenChildren(child.props.children) : [child]);
  const childNodes = flattenChildren(children);
  const isControl = (child: React.ReactNode, kind: "prev" | "next" | "autoplay"): child is React.ReactElement => {
    if (!React.isValidElement(child)) return false;
    if (kind === "autoplay") return child.type === CarouselAutoplayButton || child.type === "spui-carousel-autoplay-button" && child.props.slot === "autoplay";
    return child.type === CarouselButton && child.props.navType === kind || child.type === "spui-carousel-button" && child.props.slot === (kind === "prev" ? "previous" : "next");
  };
  const childControl = (kind: "prev" | "next" | "autoplay"): React.ReactElement | undefined => childNodes.find(child => isControl(child, kind)) as React.ReactElement | undefined;
  const renderControl = (kind: "prev" | "next", value: CarouselNavButtonSlotProps | null | undefined, tooltip: CarouselTooltipSlotProps | null | undefined): React.ReactNode => {
    if (value === null) return null;
    const slot = kind === "prev" ? "previous" : "next";
    const controlSlot = tooltip == null ? slot : null;
    const label = kind === "prev" ? strings.carouselPrevious || "Previous slide" : strings.carouselNext || "Next slide";
    const control = React.isValidElement(value)
      ? React.cloneElement(value, { slot: controlSlot } as Record<string, unknown>)
      : React.createElement(CarouselButton, { ...(value ?? {}), navType: kind, label: (value as { label?: string } | undefined)?.label ?? label, slot: controlSlot, children: (value as { children?: React.ReactNode } | undefined)?.children ?? label });
    if (tooltip == null) return control;
    return React.isValidElement(tooltip)
      ? React.cloneElement(tooltip, { slot, children: control } as Record<string, unknown>)
      : React.createElement(Tooltip, { ...(tooltip ?? {}), slot, content: (tooltip as { content?: React.ReactNode } | undefined)?.content ?? label, children: control } as Parameters<typeof Tooltip>[0]);
  };
  const renderAutoplay = (): React.ReactNode => {
    if (autoplay === false || autoplay === null) return null;
    const control = React.isValidElement(autoplay)
      ? React.cloneElement(autoplay, { slot: autoplayTooltip == null ? "autoplay" : null } as Record<string, unknown>)
      : React.createElement(CarouselAutoplayButton, { ...(typeof autoplay === "object" ? autoplay : {}), slot: autoplayTooltip == null ? "autoplay" : null });
    if (autoplayTooltip == null) return control;
    const label = strings.carouselPlay || "Play";
    return React.isValidElement(autoplayTooltip)
      ? React.cloneElement(autoplayTooltip, { slot: "autoplay", children: control } as Record<string, unknown>)
      : React.createElement(Tooltip, { ...(autoplayTooltip ?? {}), slot: "autoplay", content: (autoplayTooltip as { content?: React.ReactNode } | undefined)?.content ?? `${label} / ${strings.carouselPause || "Pause"}`, children: control } as Parameters<typeof Tooltip>[0]);
  };
  const previousChild = childControl("prev"), nextChild = childControl("next"), autoplayChild = childControl("autoplay");
  const previous = prev === undefined && previousChild ? prevTooltip == null ? null : renderControl("prev", React.cloneElement(previousChild, { slot: null } as Record<string, unknown>), prevTooltip) : renderControl("prev", prev, prevTooltip);
  const following = next === undefined && nextChild ? nextTooltip == null ? null : renderControl("next", React.cloneElement(nextChild, { slot: null } as Record<string, unknown>), nextTooltip) : renderControl("next", next, nextTooltip);
  const autoplayControl = autoplay === undefined && autoplayChild ? autoplayTooltip == null ? null : (() => { const child = React.cloneElement(autoplayChild, { slot: null } as Record<string, unknown>); const label = strings.carouselPlay || "Play"; return React.isValidElement(autoplayTooltip) ? React.cloneElement(autoplayTooltip, { slot: "autoplay", children: child } as Record<string, unknown>) : React.createElement(Tooltip, { ...(autoplayTooltip ?? {}), slot: "autoplay", content: (autoplayTooltip as { content?: React.ReactNode } | undefined)?.content ?? `${label} / ${strings.carouselPause || "Pause"}`, children: child } as Parameters<typeof Tooltip>[0]); })() : autoplay === undefined && autoplayTooltip == null ? null : renderAutoplay();
  const retainedChildren = childNodes.filter(child => !(prev !== undefined || prevTooltip != null) || !isControl(child, "prev")).filter(child => !(next !== undefined || nextTooltip != null) || !isControl(child, "next")).filter(child => !(autoplay !== undefined || autoplayTooltip != null) || !isControl(child, "autoplay"));
  return React.createElement("spui-carousel-nav-container", useCustomElementProps({ ref: forwardedRef, ...props, slot: props.slot || "navigation", layout }), previous, autoplayControl, retainedChildren, following);
});

export function CarouselProvider({ value, children }: { value: CarouselContextValue | undefined; children?: React.ReactNode }): React.ReactElement {
  return React.createElement(CarouselContext.Provider, { value }, children);
}

export function useCarouselContext(): CarouselContextValue | undefined {
  return React.useContext(CarouselContext);
}

export const CarouselSlider = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; cardFocus?: boolean }>(function CarouselSlider({ children, cardFocus = false, ...props }: ElementProps & { children?: React.ReactNode; cardFocus?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineCarouselSlider);
  return React.createElement("spui-carousel-slider", useCustomElementProps({ ref: forwardedRef, ...props, "card-focus": cardFocus || undefined }), children);
});

export const CarouselViewport = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function CarouselViewport({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineCarouselViewport);
  return React.createElement("spui-carousel-viewport", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const Carousel = React.forwardRef<HTMLElement, ElementProps & {
  children?: React.ReactNode; label?: string; roleDescription?: string; previousLabel?: string; nextLabel?: string; slideLabel?: string; slideGroupLabel?: string; navigationLabel?: string; playLabel?: string; pauseLabel?: string; slideWidth?: string;
  align?: CarouselAlign; appearance?: CarouselAppearance; motion?: CarouselMotion; motionDuration?: number; autoplay?: boolean; autoplayInterval?: number; selectedIndex?: number; activeIndex?: number; defaultSelectedIndex?: number; defaultActiveIndex?: number; wrap?: boolean; circular?: boolean; groupSize?: number | "auto"; draggable?: boolean; whitespace?: boolean; announcement?: CarouselAnnouncerFunction; onIndexChange?: (index: number) => void; onActiveIndexChange?: (event: SharePointUIEvent, data: CarouselReactIndexChangeData) => void
}>(function Carousel({ children, label, roleDescription, previousLabel, nextLabel, slideLabel, slideGroupLabel, navigationLabel, playLabel, pauseLabel, slideWidth, align = "center", appearance = "flat", motion = "slide", motionDuration = 240, autoplay = false, autoplayInterval = 4000, selectedIndex, activeIndex, defaultSelectedIndex, defaultActiveIndex, wrap = false, circular = false, groupSize = "auto", draggable = false, whitespace = false, announcement, onIndexChange, onActiveIndexChange, ...props }: ElementProps & {
  children?: React.ReactNode; label?: string; roleDescription?: string; previousLabel?: string; nextLabel?: string; slideLabel?: string; slideGroupLabel?: string; navigationLabel?: string; playLabel?: string; pauseLabel?: string; slideWidth?: string;
  align?: CarouselAlign; appearance?: CarouselAppearance; motion?: CarouselMotion; motionDuration?: number; autoplay?: boolean; autoplayInterval?: number; selectedIndex?: number; activeIndex?: number; defaultSelectedIndex?: number; defaultActiveIndex?: number; wrap?: boolean; circular?: boolean; groupSize?: number | "auto"; draggable?: boolean; whitespace?: boolean; announcement?: CarouselAnnouncerFunction; onIndexChange?: (index: number) => void; onActiveIndexChange?: (event: SharePointUIEvent, data: CarouselReactIndexChangeData) => void
}, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const strings = React.useContext(UIContext).strings;
  ensureDefined(defineCarousel);
  const motionKind = typeof motion === "string" ? motion : motion.kind;
  const motionPhysicsDuration = typeof motion === "string" ? undefined : motion.duration;
  const controlledIndex = activeIndex ?? selectedIndex;
  useSpuiEvent(ref, "spui-carousel-change", (detail, dispatchEvent) => { const change = detail as typeof detail & { event: Event; eventType: CarouselIndexChangeData["type"] }; const index = Number(change.value ?? 0); const event = createCarouselChangeEvent(change, dispatchEvent, ref.current!); const type = change.eventType === "programmatic" ? undefined : change.eventType; const data = { event, type, index } as CarouselReactIndexChangeData; onIndexChange?.(index); onActiveIndexChange?.(event, data); });
  React.useLayoutEffect(() => { if (controlledIndex !== undefined && ref.current) (ref.current as HTMLElement & { selectedIndex: number }).selectedIndex = controlledIndex; }, [controlledIndex]);
  React.useLayoutEffect(() => { const element = ref.current as (HTMLElement & { announcement?: CarouselAnnouncerFunction }) | null; if (element) element.announcement = announcement; }, [announcement]);
  return React.createElement("spui-carousel", useCustomElementProps({ ...props, ref, "aria-label": label || strings.carouselDescription, "aria-roledescription": roleDescription || strings.carouselRoleDescription, "previous-label": previousLabel || strings.carouselPrevious, "next-label": nextLabel || strings.carouselNext, "slide-label": slideLabel || strings.carouselSlide, "slide-group-label": slideGroupLabel || strings.carouselSlides, "navigation-label": navigationLabel || strings.carouselNavigation, "play-label": playLabel || strings.carouselPlay || "Play", "pause-label": pauseLabel || strings.carouselPause || "Pause", "slide-width": slideWidth, "group-size": groupSize, draggable: draggable || undefined, whitespace: whitespace || undefined, align, appearance, motion: motionKind, "motion-physics-duration": motionPhysicsDuration, "motion-duration": motionDuration, autoplay: autoplay || undefined, "autoplay-interval": autoplayInterval, "selected-index": controlledIndex, "active-index": activeIndex, "default-selected-index": defaultActiveIndex ?? defaultSelectedIndex, "default-active-index": defaultActiveIndex, controlled: controlledIndex !== undefined || undefined, wrap: wrap || undefined, circular: circular || undefined }), children);
});

export const Breadcrumb = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; label?: string; focusMode?: "tab" | "arrow"; size?: "small" | "medium" | "large"; separator?: string; list?: React.ReactElement }>(function Breadcrumb({ children, label, focusMode = "tab", size = "medium", separator, list, ...props }: ElementProps & { children?: React.ReactNode; label?: string; focusMode?: "tab" | "arrow"; size?: "small" | "medium" | "large"; separator?: string; list?: React.ReactElement }, forwardedRef): React.ReactElement {
  ensureDefined(defineBreadcrumb);
  ensureDefined(defineBreadcrumbItem);
  ensureDefined(defineBreadcrumbButton);
  ensureDefined(defineBreadcrumbDivider);
  const strings = React.useContext(UIContext).strings;
  const listSlot = list == null ? null : React.cloneElement(list, { slot: "list" }, children);
  return React.createElement(BreadcrumbSizeContext.Provider, { value: size }, React.createElement("spui-breadcrumb", useCustomElementProps({ ref: forwardedRef, ...props, label: label ?? strings.breadcrumbLabel, "focus-mode": focusMode, size, separator }), listSlot ?? children));
});

export const BreadcrumbItem = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; current?: boolean; size?: BreadcrumbSize }>(function BreadcrumbItem({ children, current = false, size, ...props }: ElementProps & { children?: React.ReactNode; current?: boolean; size?: BreadcrumbSize }, forwardedRef): React.ReactElement {
  const inheritedSize = React.useContext(BreadcrumbSizeContext);
  ensureDefined(defineBreadcrumbItem);
  return React.createElement("spui-breadcrumb-item", useCustomElementProps({ ref: forwardedRef, ...props, current: current || undefined, size: size ?? inheritedSize }), children);
});

export const BreadcrumbButton = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; href?: string; target?: string; rel?: string; type?: "button" | "submit" | "reset"; current?: boolean; disabled?: boolean; disabledFocusable?: boolean; size?: BreadcrumbSize }>(function BreadcrumbButton({ children, icon, href, target, rel, type = "button", current = false, disabled = false, disabledFocusable = false, size, ...props }: ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; href?: string; target?: string; rel?: string; type?: "button" | "submit" | "reset"; current?: boolean; disabled?: boolean; disabledFocusable?: boolean; size?: BreadcrumbSize }, forwardedRef): React.ReactElement {
  const inheritedSize = React.useContext(BreadcrumbSizeContext);
  ensureDefined(defineBreadcrumbButton);
  return React.createElement("spui-breadcrumb-button", useCustomElementProps({ ref: forwardedRef, ...props, href, target, rel, type, current: current || undefined, disabled: disabled || undefined, "disabled-focusable": disabledFocusable || undefined, "aria-current": current ? props["aria-current"] ?? "page" : props["aria-current"], size: size ?? inheritedSize }), renderIconSlot(icon), children);
});

export const BreadcrumbDivider = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function BreadcrumbDivider({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineBreadcrumbDivider);
  return React.createElement("spui-breadcrumb-divider", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const Nav = React.forwardRef<HTMLElement, Omit<ElementProps, "onSelect"> & { children?: React.ReactNode; label?: string; selectedValue?: string | null; defaultSelectedValue?: string | null; selectedCategoryValue?: string | null; defaultSelectedCategoryValue?: string | null; openCategories?: readonly string[]; defaultOpenCategories?: readonly string[]; open?: boolean; defaultOpen?: boolean; collapsed?: boolean; defaultCollapsed?: boolean; collapsible?: boolean; multiple?: boolean; density?: "small" | "medium" | "large"; tabbable?: boolean | "true" | "false"; openLabel?: string; closeLabel?: string; onItemSelect?: (value: string, href: string | null, label: string) => void; onCategoryToggle?: (value: string, open: boolean, openCategories: string[]) => void; onNavItemSelect?: (event: SharePointUIEvent, data: NavReactItemSelectData) => void; onNavCategoryItemToggle?: (event: SharePointUIEvent, data: NavReactCategoryToggleData) => void; onOpenChange?: (open: boolean) => void; onCollapsedChange?: (collapsed: boolean) => void }>(function Nav({ children, label = "Navigation", selectedValue, defaultSelectedValue, selectedCategoryValue, defaultSelectedCategoryValue, openCategories, defaultOpenCategories = [], open, defaultOpen, collapsed, defaultCollapsed, collapsible = false, multiple = true, density = "medium", openLabel, closeLabel, onItemSelect, onCategoryToggle, onNavItemSelect, onNavCategoryItemToggle, onOpenChange, onCollapsedChange, ...props }: Omit<ElementProps, "onSelect"> & { children?: React.ReactNode; label?: string; selectedValue?: string | null; defaultSelectedValue?: string | null; selectedCategoryValue?: string | null; defaultSelectedCategoryValue?: string | null; openCategories?: readonly string[]; defaultOpenCategories?: readonly string[]; open?: boolean; defaultOpen?: boolean; collapsed?: boolean; defaultCollapsed?: boolean; collapsible?: boolean; multiple?: boolean; density?: "small" | "medium" | "large"; tabbable?: boolean | "true" | "false"; openLabel?: string; closeLabel?: string; onItemSelect?: (value: string, href: string | null, label: string) => void; onCategoryToggle?: (value: string, open: boolean, openCategories: string[]) => void; onNavItemSelect?: (event: SharePointUIEvent, data: NavReactItemSelectData) => void; onNavCategoryItemToggle?: (event: SharePointUIEvent, data: NavReactCategoryToggleData) => void; onOpenChange?: (open: boolean) => void; onCollapsedChange?: (collapsed: boolean) => void }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const defaultsApplied = React.useRef(false);
  const strings = React.useContext(UIContext).strings;
  ensureDefined(defineNav);
  useSpuiEvent(ref, "spui-nav-item-select", (detail, dispatchEvent) => { const data = detail as NavItemSelectData; onItemSelect?.(data.value, data.href, data.label); const event = createNavActionEvent(data.event, dispatchEvent, ref.current!); onNavItemSelect?.(event, { ...data, event } as NavReactItemSelectData); });
  useSpuiEvent(ref, "spui-nav-category-toggle", (detail, dispatchEvent) => { const data = detail as NavCategoryToggleData; onCategoryToggle?.(data.value, data.open, data.openCategories); const event = createNavActionEvent(data.event, dispatchEvent, ref.current!); onNavCategoryItemToggle?.(event, { ...data, event } as NavReactCategoryToggleData); });
  useSpuiEvent(ref, "spui-nav-open-change", detail => onOpenChange?.(Boolean(detail.open)));
  useSpuiEvent(ref, "spui-nav-collapsed-change", detail => onCollapsedChange?.(Boolean(detail.collapsed)));
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { selectedValue?: string | null; defaultSelectedValue?: string | null; selectedCategoryValue?: string | null; defaultSelectedCategoryValue?: string | null; openCategories?: readonly string[]; defaultOpenCategories?: readonly string[]; open?: boolean; defaultOpen?: boolean; collapsed?: boolean; defaultCollapsed?: boolean }) | null;
    if (!element) return;
    if (selectedValue !== undefined) element.selectedValue = selectedValue;
    else if (!defaultsApplied.current && defaultSelectedValue !== undefined) element.defaultSelectedValue = defaultSelectedValue;
    if (selectedCategoryValue !== undefined) element.selectedCategoryValue = selectedCategoryValue;
    else if (!defaultsApplied.current && defaultSelectedCategoryValue !== undefined) element.defaultSelectedCategoryValue = defaultSelectedCategoryValue;
    if (openCategories !== undefined) element.openCategories = openCategories;
    else if (!defaultsApplied.current) element.defaultOpenCategories = defaultOpenCategories;
    if (open !== undefined) element.open = open;
    else if (!defaultsApplied.current && defaultOpen !== undefined) element.defaultOpen = defaultOpen;
    if (collapsed !== undefined) element.collapsed = collapsed;
    else if (!defaultsApplied.current && defaultCollapsed !== undefined) element.defaultCollapsed = defaultCollapsed;
    defaultsApplied.current = true;
  }, [selectedValue, defaultSelectedValue, selectedCategoryValue, defaultSelectedCategoryValue, openCategories, defaultOpenCategories, open, defaultOpen, collapsed, defaultCollapsed]);
  return React.createElement("spui-nav", useCustomElementProps({ ...props, ref, label, multiple: multiple ? "" : "false", density, collapsible: collapsible || undefined, "open-label": openLabel ?? strings.navigationMenu ?? "Open navigation", "close-label": closeLabel ?? strings.navigationClose ?? strings.close, "expand-label": strings.navigationExpand ?? "Expand navigation", "collapse-label": strings.navigationCollapse ?? "Collapse navigation" }), children);
});

function renderNavAvatar(avatar?: React.ReactElement): React.ReactElement | null {
  return avatar ? React.cloneElement(avatar, { slot: "avatar", ...(avatar.type === Avatar ? { decorative: true } : {}) } as React.HTMLAttributes<HTMLElement>) : null;
}

export const NavItem = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; value: string; href?: string; disabled?: boolean; icon?: React.ReactNode; avatar?: React.ReactElement }>(function NavItem({ children, value, href, disabled = false, icon, avatar, ...props }: ElementProps & { children?: React.ReactNode; value: string; href?: string; disabled?: boolean; icon?: React.ReactNode; avatar?: React.ReactElement }, forwardedRef): React.ReactElement {
  ensureDefined(defineNavItem);
  return React.createElement("spui-nav-item", useCustomElementProps({ ref: forwardedRef, ...props, value, href, disabled: disabled || undefined }), renderNavAvatar(avatar), icon === undefined ? null : React.createElement("span", { slot: "icon" }, icon), children);
});

type NavCategoryMotionContextValue = { open: boolean; setOpen: (open: boolean) => void };
const NavCategoryMotionContext = React.createContext<NavCategoryMotionContextValue | undefined>(undefined);

export const NavCategory = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; value: string; disabled?: boolean }>(function NavCategory({ children, value, disabled = false, ...props }: ElementProps & { children?: React.ReactNode; value: string; disabled?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineNavCategory);
  ensureDefined(defineNavCategoryItem); ensureDefined(defineNavSubItemGroup); ensureDefined(defineNavSubItem);
  const [open, setOpen] = React.useState(false);
  const context = React.useMemo(() => ({ open, setOpen }), [open]);
  return React.createElement(NavCategoryMotionContext.Provider, { value: context }, React.createElement("spui-nav-category", useCustomElementProps({ ref: forwardedRef, ...props, value, disabled: disabled || undefined }), children));
});

export const NavCategoryItem = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; avatar?: React.ReactElement; expandIcon?: React.ReactNode; expandIconMotion?: React.ComponentType<PresenceMotionSlotProps> }>(function NavCategoryItem({ children, icon, avatar, expandIcon, expandIconMotion, ...props }: ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; avatar?: React.ReactElement; expandIcon?: React.ReactNode; expandIconMotion?: React.ComponentType<PresenceMotionSlotProps> }, forwardedRef): React.ReactElement {
  const category = React.useContext(NavCategoryMotionContext);
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineNavCategoryItem);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !category) return;
    const sync = (): void => category.setOpen(element.hasAttribute("expanded"));
    const observer = new MutationObserver(sync);
    observer.observe(element, { attributes: true, attributeFilter: ["expanded"] });
    sync();
    return () => observer.disconnect();
  }, [category]);
  const expandIconNode = expandIcon ?? React.createElement("svg", { viewBox: "0 0 20 20", width: 20, height: 20, "aria-hidden": true, focusable: false }, React.createElement("path", { d: "M5.5 7.5 10 12l4.5-4.5", fill: "none", stroke: "currentColor", strokeWidth: 1.5 }));
  const renderedExpandIcon = expandIconMotion
    ? React.createElement(expandIconMotion, { visible: category?.open ?? false, children: expandIconNode })
    : expandIcon;
  return React.createElement("spui-nav-category-item", useCustomElementProps({ ...props, ref }), renderNavAvatar(avatar), icon === undefined ? null : React.createElement("span", { slot: "icon" }, icon), children, renderedExpandIcon == null ? null : React.createElement("span", { slot: "expand-icon" }, renderedExpandIcon));
});

export const NavSubItemGroup = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; collapseMotion?: React.ComponentType<PresenceMotionSlotProps> }>(function NavSubItemGroup({ children, collapseMotion, ...props }: ElementProps & { children?: React.ReactNode; collapseMotion?: React.ComponentType<PresenceMotionSlotProps> }, forwardedRef): React.ReactElement {
  const category = React.useContext(NavCategoryMotionContext);
  ensureDefined(defineNavSubItemGroup);
  const content = collapseMotion ? React.createElement(collapseMotion, { visible: category?.open ?? false, unmountOnExit: true }, children) : children;
  return React.createElement("spui-nav-sub-item-group", useCustomElementProps({ ref: forwardedRef, ...props, motion: collapseMotion ? true : undefined }), content);
});

export const NavSubItem = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; value: string; href?: string; disabled?: boolean; icon?: React.ReactNode; avatar?: React.ReactElement }>(function NavSubItem({ children, value, href, disabled = false, icon, avatar, ...props }: ElementProps & { children?: React.ReactNode; value: string; href?: string; disabled?: boolean; icon?: React.ReactNode; avatar?: React.ReactElement }, forwardedRef): React.ReactElement {
  ensureDefined(defineNavSubItem);
  return React.createElement("spui-nav-sub-item", useCustomElementProps({ ref: forwardedRef, ...props, value, href, disabled: disabled || undefined }), renderNavAvatar(avatar), icon === undefined ? null : React.createElement("span", { slot: "icon" }, icon), children);
});

export type NavDividerProps = ElementProps & { wrapper?: DividerWrapper };
export const NavDivider = React.forwardRef<HTMLElement, NavDividerProps>(function NavDivider({ wrapper, ...props }: NavDividerProps, forwardedRef): React.ReactElement {
  ensureDefined(defineNavDivider);
  return React.createElement("spui-nav-divider", useCustomElementProps({ ref: forwardedRef, ...props }), renderDividerWrapper(wrapper));
});

export const NavSectionHeader = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function NavSectionHeader({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineNavSectionHeader);
  return React.createElement("spui-nav-section-header", useCustomElementProps({ ref: forwardedRef, ...props }), children);
});

export const AppItem = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; value: string; href?: string; disabled?: boolean; icon?: React.ReactNode; avatar?: React.ReactElement }>(function AppItem({ children, value, href, disabled = false, icon, avatar, ...props }: ElementProps & { children?: React.ReactNode; value: string; href?: string; disabled?: boolean; icon?: React.ReactNode; avatar?: React.ReactElement }, forwardedRef): React.ReactElement {
  ensureDefined(defineAppItem);
  return React.createElement("spui-app-item", useCustomElementProps({ ref: forwardedRef, ...props, value, href, disabled: disabled || undefined }), renderNavAvatar(avatar), icon === undefined ? null : React.createElement("span", { slot: "icon" }, icon), children);
});

export const AppItemStatic = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; icon?: React.ReactNode }>(function AppItemStatic({ children, icon, ...props }: ElementProps & { children?: React.ReactNode; icon?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineAppItemStatic);
  return React.createElement("spui-app-item-static", useCustomElementProps({ ...props, ref: forwardedRef }), icon === undefined ? null : React.createElement("span", { slot: "icon" }, icon), children);
});

export const Hamburger = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; open?: boolean; label?: string; disabled?: boolean; onClick?: React.MouseEventHandler<HTMLElement> }>(function Hamburger({ children, icon, open = false, label, disabled = false, ...props }: ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; open?: boolean; label?: string; disabled?: boolean; onClick?: React.MouseEventHandler<HTMLElement> }, forwardedRef): React.ReactElement {
  ensureDefined(defineHamburger);
  const strings = React.useContext(UIContext).strings;
  const resolvedLabel = label ?? strings.navigationToggle ?? "Toggle navigation";
  const defaultIcon = React.createElement("svg", { viewBox: "0 0 24 24", width: 22, height: 22, "aria-hidden": true }, React.createElement("path", { d: "M4 6h16M4 12h16M4 18h16" }));
  return React.createElement("spui-hamburger", useCustomElementProps({ ref: forwardedRef, ...props, role: "button", tabindex: disabled ? -1 : 0, disabled: disabled || undefined, "aria-label": props["aria-label"] ?? resolvedLabel, "aria-expanded": open }), renderIconSlot(icon ?? (children == null ? defaultIcon : null)), children);
});

export type NavDrawerProps = Omit<React.ComponentProps<typeof Nav>, "children" | "open" | "defaultOpen" | "onOpenChange"> & {
  children?: React.ReactNode; type?: "overlay" | "inline"; open?: boolean; defaultOpen?: boolean; modal?: boolean; dismissible?: boolean;
  position?: "start" | "end" | "top" | "bottom"; size?: "small" | "medium" | "large" | "full"; expandable?: boolean; expanded?: boolean;
  unmountOnClose?: boolean; separator?: boolean; closeLabel?: string; onOpenChange?: (open: boolean) => void; onDismiss?: () => void;
  onExpandedChange?: (expanded: boolean) => void; tabbable?: boolean;
};

export const NavDrawer = React.forwardRef<HTMLElement, NavDrawerProps>(function NavDrawer({ children, type = "overlay", open, defaultOpen, modal = true, dismissible = true, position = "start", size = "medium", expandable = false, expanded, unmountOnClose = true, separator = false, closeLabel, onOpenChange, onDismiss, onExpandedChange, tabbable = false, ...props }: NavDrawerProps, forwardedRef): React.ReactElement {
  ensureDefined(defineNavDrawer);
  const { "data-testid": testId, label = "Navigation", ...navProps } = props;
  return React.createElement("spui-nav-drawer", useCustomElementProps({ ref: forwardedRef, "data-testid": testId, "data-type": type }),
    React.createElement(Drawer, { type, open, defaultOpen, modal, dismissible, position, size, expandable, expanded, unmountOnClose, separator, closeLabel, onOpenChange, onDismiss, onExpandedChange, "aria-label": label },
      React.createElement(Nav, { ...navProps, label, "data-drawer-type": type, tabbable: tabbable ? "true" : "false" }, children)));
});

export const NavDrawerHeader = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function NavDrawerHeader({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineNavDrawerHeader);
  return React.createElement("spui-nav-drawer-header", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const NavDrawerBody = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function NavDrawerBody({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineNavDrawerBody);
  return React.createElement("spui-nav-drawer-body", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const NavDrawerFooter = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function NavDrawerFooter({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineNavDrawerFooter);
  return React.createElement("spui-nav-drawer-footer", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const SplitNavItem = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; value: string; href?: string; disabled?: boolean; icon?: React.ReactNode; action?: React.ReactNode; actionLabel?: string; onAction?: React.MouseEventHandler<HTMLButtonElement>; navItem?: React.ReactElement; actionButton?: React.ReactElement; actionButtonTooltip?: React.ReactElement; menuButton?: React.ReactElement; menuButtonTooltip?: React.ReactElement; toggleButton?: React.ReactElement; toggleButtonTooltip?: React.ReactElement }>(function SplitNavItem({ children, value, href, disabled = false, icon, action, actionLabel, onAction, navItem, actionButton, actionButtonTooltip, menuButton, menuButtonTooltip, toggleButton, toggleButtonTooltip, ...props }: ElementProps & { children?: React.ReactNode; value: string; href?: string; disabled?: boolean; icon?: React.ReactNode; action?: React.ReactNode; actionLabel?: string; onAction?: React.MouseEventHandler<HTMLButtonElement>; navItem?: React.ReactElement; actionButton?: React.ReactElement; actionButtonTooltip?: React.ReactElement; menuButton?: React.ReactElement; menuButtonTooltip?: React.ReactElement; toggleButton?: React.ReactElement; toggleButtonTooltip?: React.ReactElement }, forwardedRef): React.ReactElement {
  ensureDefined(defineSplitNavItem);
  const strings = React.useContext(UIContext).strings;
  const resolvedActionLabel = actionLabel ?? strings.splitNavItemActionLabel ?? "More actions";
  const primary = navItem ?? React.createElement(NavItem, { value, href, disabled, icon }, children);
  const defaultAction = action ?? React.createElement("button", { type: "button", "aria-label": resolvedActionLabel, disabled, onClick: onAction }, "⋯");
  const renderControl = (control: React.ReactElement | React.ReactNode | undefined, tooltip: React.ReactElement | undefined, slot: string): React.ReactNode => {
    if (control == null) return null;
    if (tooltip) return React.cloneElement(tooltip as React.ReactElement<{ slot?: string; children?: React.ReactNode }>, { slot, children: control });
    return React.isValidElement(control)
      ? React.cloneElement(control as React.ReactElement<{ slot?: string }>, { slot })
      : React.createElement("span", { slot }, control);
  };
  return React.createElement("spui-split-nav-item", useCustomElementProps({ ...props, ref: forwardedRef }), primary,
    renderControl(actionButton ?? defaultAction, actionButtonTooltip, "action"),
    renderControl(menuButton, menuButtonTooltip, "menu-button"),
    renderControl(toggleButton, toggleButtonTooltip, "toggle-button"));
});

export type TabValue = unknown;
const tabObjectKeys = new WeakMap<object, string>();
const activeTabObjects = new Map<string, { value: object; count: number }>();
let nextTabObjectKey = 0;
const isReservedTabValue = (value: string): boolean => value === "null" || /^(?:number|boolean|object|string):/.test(value);
function tabValueType(value: TabValue): string {
  if (value === null) return "null";
  if (typeof value === "object") return "object";
  return typeof value;
}
function encodeTabValue(value: TabValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return isReservedTabValue(value) ? `string:${value}` : value;
  if (typeof value === "number") return `number:${String(value)}`;
  if (typeof value === "boolean") return `boolean:${String(value)}`;
  if (typeof value === "object") {
    let key = tabObjectKeys.get(value);
    if (!key) { key = `object:${++nextTabObjectKey}`; tabObjectKeys.set(value, key); }
    return key;
  }
  throw new TypeError("Tab values must be strings, numbers, booleans, null, or objects.");
}
function decodeTabValue(value: string, valueType?: string): TabValue {
  if (valueType === "object") return activeTabObjects.get(value)?.value ?? value;
  if (valueType === "number") return Number(value.slice(7));
  if (valueType === "boolean") return value.slice(8) === "true";
  if (valueType === "null") return null;
  if (valueType === "string") return value.startsWith("string:") ? value.slice(7) : value;
  return value;
}
function retainTabValue(value: TabValue): () => void {
  if (value === null || typeof value !== "object") return () => {};
  const key = encodeTabValue(value);
  const active = activeTabObjects.get(key);
  if (active) active.count++;
  else activeTabObjects.set(key, { value, count: 1 });
  return () => {
    const registered = activeTabObjects.get(key);
    if (registered && --registered.count === 0) activeTabObjects.delete(key);
  };
}

export const Tabs = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; selectedValue?: any; defaultSelectedValue?: any; disabled?: boolean; onTabSelect?: (value: any) => void }>(function Tabs<T = string>({ children, selectedValue, defaultSelectedValue, disabled = false, onTabSelect, ...props }: ElementProps & { children?: React.ReactNode; selectedValue?: T; defaultSelectedValue?: T; disabled?: boolean; onTabSelect?: (value: T) => void }, forwardedRef: React.ForwardedRef<HTMLElement>): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null);
  useExposeHostRef(ref, forwardedRef);
  ensureDefined(defineTabs);
  useSpuiEvent(ref, "spui-tab-select", detail => onTabSelect?.(decodeTabValue(String(detail.value ?? ""), detail.valueType as string | undefined) as T));
  return React.createElement("spui-tabs", useCustomElementProps({ ...props, ref, "selected-value": selectedValue === undefined ? undefined : encodeTabValue(selectedValue), "default-selected-value": defaultSelectedValue === undefined ? undefined : encodeTabValue(defaultSelectedValue), disabled: disabled || undefined }), children);
}) as <T = string>(props: ElementProps & { children?: React.ReactNode; selectedValue?: T; defaultSelectedValue?: T; disabled?: boolean; onTabSelect?: (value: T) => void } & React.RefAttributes<HTMLElement>) => React.ReactElement;

export type TabSelectData = { value: TabValue };
export type TabSelectEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | React.FocusEvent<HTMLElement>;
export type TabRegisterData = { value: TabValue; ref: React.RefObject<HTMLElement | null> };
export type TabListProviderValue = {
  onTabSelect?: (event: TabSelectEvent, data: TabSelectData) => void;
  selectTabOnFocus?: boolean;
  selectedValue?: TabValue;
  reserveSelectedTabSpace?: boolean;
  appearance: "transparent" | "subtle" | "subtle-circular" | "filled-circular";
  disabled: boolean;
  size: "small" | "medium" | "large";
  vertical: boolean;
  onRegister: (data: TabRegisterData) => void;
  onUnregister: (data: TabRegisterData) => void;
  onSelect: (event: TabSelectEvent, data: TabSelectData) => void;
  getRegisteredTabs: () => { selectedValue?: TabValue; previousSelectedValue?: TabValue; registeredTabs: Record<string, TabRegisterData> };
};
const TabListContext = React.createContext<TabListProviderValue | undefined>(undefined);
export function TabListProvider({ value, children }: { value: TabListProviderValue; children?: React.ReactNode }): React.ReactElement {
  return React.createElement(TabListContext.Provider, { value }, children);
}

export type TabListProps = ElementProps & { children?: React.ReactNode; selectedValue?: TabValue; defaultSelectedValue?: TabValue; selectTabOnFocus?: boolean; reserveSelectedTabSpace?: boolean; vertical?: boolean; disabled?: boolean; appearance?: "transparent" | "subtle" | "subtle-circular" | "filled-circular"; size?: "small" | "medium" | "large"; onTabSelect?: (event: TabSelectEvent, data: TabSelectData) => void };

export const TabList = React.forwardRef<HTMLElement, TabListProps>(function TabList({ children, selectedValue, defaultSelectedValue, selectTabOnFocus, reserveSelectedTabSpace, vertical, disabled, appearance, size, onTabSelect, ...props }: TabListProps, forwardedRef): React.ReactElement {
  const provider = React.useContext(TabListContext);
  const resolvedSelectedValue = selectedValue !== undefined ? selectedValue : provider?.selectedValue;
  const resolvedSelectOnFocus = selectTabOnFocus ?? provider?.selectTabOnFocus ?? false;
  const resolvedReserveSpace = reserveSelectedTabSpace ?? provider?.reserveSelectedTabSpace ?? true;
  const resolvedVertical = vertical ?? provider?.vertical ?? false;
  const resolvedDisabled = disabled ?? provider?.disabled ?? false;
  const resolvedAppearance = appearance ?? provider?.appearance ?? "transparent";
  const resolvedSize = size ?? provider?.size ?? "medium";
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineTabs);
  useSpuiEvent(ref, "spui-tab-select", (detail, event) => {
    const selectionDetail = detail as SpuiEventDetail & { sourceEvent?: Event; currentTarget?: HTMLElement };
    const sourceEvent = selectionDetail.sourceEvent ?? event;
    const callbackTarget = (selectionDetail.currentTarget instanceof HTMLElement ? selectionDetail.currentTarget : sourceEventTarget(sourceEvent, ref.current!));
    const callbackEvent = createReactEventBridge(sourceEvent, event, callbackTarget) as unknown as TabSelectEvent;
    const data = { value: decodeTabValue(String(selectionDetail.value ?? ""), selectionDetail.valueType as string | undefined) };
    provider?.onSelect(callbackEvent, data);
    if (provider?.onTabSelect !== onTabSelect) provider?.onTabSelect?.(callbackEvent, data);
    onTabSelect?.(callbackEvent, data);
  });
  return React.createElement("spui-tab-list", useCustomElementProps({ ...props, ref, "selected-value": resolvedSelectedValue === undefined ? undefined : encodeTabValue(resolvedSelectedValue), "default-selected-value": defaultSelectedValue === undefined ? undefined : encodeTabValue(defaultSelectedValue), "select-on-focus": resolvedSelectOnFocus || undefined, "reserve-selected-tab-space": resolvedReserveSpace ? undefined : "false", vertical: resolvedVertical || undefined, disabled: resolvedDisabled || undefined, appearance: resolvedAppearance, size: resolvedSize }), children);
});

export const Tab = React.forwardRef<HTMLElement, ElementProps & { value: TabValue; disabled?: boolean; icon?: React.ReactNode; content?: React.ReactNode; children?: React.ReactNode }>(function Tab({ value, disabled = false, icon, content, children, ...props }: ElementProps & { value: TabValue; disabled?: boolean; icon?: React.ReactNode; content?: React.ReactNode; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  const provider = React.useContext(TabListContext);
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  React.useEffect(() => {
    const releaseValue = retainTabValue(value);
    if (!provider || !ref.current) return releaseValue;
    const data = { value, ref };
    provider.onRegister(data);
    return () => { releaseValue(); provider.onUnregister(data); };
  }, [provider, value]);
  ensureDefined(defineTabs);
  return React.createElement("spui-tab", useCustomElementProps({ ...props, ref, value: encodeTabValue(value), "data-spui-tab-value-type": tabValueType(value), disabled: disabled || undefined }), icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon), content == null ? children : React.createElement("span", { slot: "content" }, content));
});

export const TabPanel = React.forwardRef<HTMLElement, ElementProps & { value: TabValue; children?: React.ReactNode }>(function TabPanel({ value, children, ...props }: ElementProps & { value: TabValue; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineTabs);
  return React.createElement("spui-tab-panel", useCustomElementProps({ ref: forwardedRef, ...props, value: encodeTabValue(value) }), children);
});

export type TooltipVisibleChangeEvent = React.PointerEvent<HTMLElement> | React.FocusEvent<HTMLElement> | undefined;
export const Tooltip = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; content?: React.ReactNode; placement?: "top" | "bottom" | "start" | "end" | "left" | "right"; positioning?: TooltipPositioning; align?: "start" | "center" | "end"; offset?: number; appearance?: TooltipAppearance; relationship?: TooltipRelationship; disabled?: boolean; open?: boolean; visible?: boolean; delay?: number; showDelay?: number; hideDelay?: number; withArrow?: boolean; onOpenChange?: (open: boolean) => void; onVisibleChange?: (event: TooltipVisibleChangeEvent, data: TooltipVisibleChangeData) => void }>(function Tooltip({ children, content, placement = "top", positioning, align, offset, appearance = "normal", relationship = "description", disabled = false, open, visible, delay, showDelay, hideDelay, withArrow = false, onOpenChange, onVisibleChange, ...props }: ElementProps & { children?: React.ReactNode; content?: React.ReactNode; placement?: "top" | "bottom" | "start" | "end" | "left" | "right"; positioning?: TooltipPositioning; align?: "start" | "center" | "end"; offset?: number; appearance?: TooltipAppearance; relationship?: TooltipRelationship; disabled?: boolean; open?: boolean; visible?: boolean; delay?: number; showDelay?: number; hideDelay?: number; withArrow?: boolean; onOpenChange?: (open: boolean) => void; onVisibleChange?: (event: TooltipVisibleChangeEvent, data: TooltipVisibleChangeData) => void }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const controlledVisible = visible ?? open;
  const controlledVisibleRef = React.useRef(controlledVisible);
  controlledVisibleRef.current = controlledVisible;
  ensureDefined(defineTooltip);
  useSpuiEvent(ref, "spui-open-change", (detail, event) => {
    const change = detail as TooltipVisibleChangeData & { event?: PointerEvent | FocusEvent };
    const nextVisible = change.visible;
    onOpenChange?.(nextVisible);
    const callbackEvent = change.event ? createReactEventBridge(change.event, event, sourceEventTarget(change.event, ref.current!)) as unknown as Exclude<TooltipVisibleChangeEvent, undefined> : undefined;
    onVisibleChange?.(callbackEvent, { visible: nextVisible, ...(change.documentKeyboardEvent ? { documentKeyboardEvent: change.documentKeyboardEvent } : {}) });
    if (controlledVisible !== undefined && nextVisible !== controlledVisible) requestAnimationFrame(() => { const requested = controlledVisibleRef.current; const element = ref.current as (HTMLElement & { open?: boolean }) | null; if (requested !== undefined && element && element.open !== requested) element.open = requested; });
  });
  React.useLayoutEffect(() => { const element = ref.current as (HTMLElement & { open?: boolean }) | null; if (element && controlledVisible !== undefined) element.open = controlledVisible; }, [controlledVisible]);
  const resolvedPositioning = typeof positioning === "string" ? positioning : positioning?.position;
  const resolvedAlign = typeof positioning === "object" ? positioning.align : align;
  const resolvedOffset = typeof positioning === "object" ? positioning.offset : offset;
  const resolvedPlacement = resolvedPositioning ?? placement;
  return React.createElement("spui-tooltip", useCustomElementProps({ ...props, ref, placement: resolvedPlacement, positioning: undefined, align: resolvedAlign, offset: resolvedOffset, appearance, relationship, disabled: disabled || undefined, open: controlledVisible, "show-delay": showDelay ?? delay, "hide-delay": hideDelay, "with-arrow": withArrow || undefined }), children,
    content === undefined ? null : React.createElement("span", { slot: "tooltip" }, content));
});

export type PopoverContextValue = {
  open: boolean;
  toggleOpen: (event: Event) => void;
  setOpen: (event: Event, open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<HTMLElement | null>;
  openOnHover: boolean;
  openOnContext: boolean;
  mountNode?: HTMLElement | null;
  withArrow: boolean;
  arrowRef: React.MutableRefObject<HTMLDivElement | null>;
  size: "small" | "medium" | "large";
  appearance?: "brand" | "inverted";
  trapFocus: boolean;
  inertTrapFocus?: boolean;
  inline: boolean;
};
const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined);
export function PopoverProvider({ value, children }: { value: PopoverContextValue; children?: React.ReactNode }): React.ReactElement {
  return React.createElement(PopoverContext.Provider, { value }, children);
}

export type PopoverOpenChangeEvent = MouseEvent | TouchEvent | FocusEvent | React.FocusEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>;
export const Popover = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; trigger?: React.ReactElement; label?: string; placement?: "top" | "bottom" | "start" | "end"; positioning?: PopoverPositioning; open?: boolean; defaultOpen?: boolean; openOnContext?: boolean; openOnHover?: boolean; mouseLeaveDelay?: number; closeOnIframeFocus?: boolean; onOpenChange?: (event: PopoverOpenChangeEvent, data: PopoverOpenChangeData) => void; inline?: boolean; trapFocus?: boolean; inertTrapFocus?: boolean; legacyTrapFocus?: boolean; unstable_disableAutoFocus?: boolean; arrow?: boolean; withArrow?: boolean; appearance?: "brand" | "inverted"; size?: "small" | "medium" | "large"; closeOnScroll?: boolean; surfaceMotion?: React.ComponentType<PresenceMotionSlotProps> }>(function Popover({ children, trigger, label, placement = "bottom", positioning, open, defaultOpen = false, openOnContext, openOnHover, mouseLeaveDelay, closeOnIframeFocus = true, onOpenChange, inline, trapFocus, inertTrapFocus, legacyTrapFocus, unstable_disableAutoFocus = false, arrow, withArrow, appearance, size, closeOnScroll = false, surfaceMotion, ...props }: ElementProps & { children?: React.ReactNode; trigger?: React.ReactElement; label?: string; placement?: "top" | "bottom" | "start" | "end"; positioning?: PopoverPositioning; open?: boolean; defaultOpen?: boolean; openOnContext?: boolean; openOnHover?: boolean; mouseLeaveDelay?: number; closeOnIframeFocus?: boolean; onOpenChange?: (event: PopoverOpenChangeEvent, data: PopoverOpenChangeData) => void; inline?: boolean; trapFocus?: boolean; inertTrapFocus?: boolean; legacyTrapFocus?: boolean; unstable_disableAutoFocus?: boolean; arrow?: boolean; withArrow?: boolean; appearance?: "brand" | "inverted"; size?: "small" | "medium" | "large"; closeOnScroll?: boolean; surfaceMotion?: React.ComponentType<PresenceMotionSlotProps> }, forwardedRef): React.ReactElement {
  const provider = React.useContext(PopoverContext);
  const resolvedOpen = open ?? provider?.open;
  const resolvedOpenOnContext = openOnContext ?? provider?.openOnContext ?? false;
  const resolvedOpenOnHover = openOnHover ?? provider?.openOnHover ?? false;
  const resolvedInline = inline ?? provider?.inline ?? false;
  const resolvedTrapFocus = trapFocus ?? provider?.trapFocus ?? false;
  const resolvedInertTrapFocus = inertTrapFocus ?? provider?.inertTrapFocus;
  const resolvedAppearance = appearance ?? provider?.appearance;
  const resolvedSize = size ?? provider?.size ?? "medium";
  const resolvedArrow = withArrow ?? arrow ?? provider?.withArrow ?? false;
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const [motionState, setMotionState] = React.useState(open ?? defaultOpen);
  const motionVisible = open ?? motionState;
  React.useLayoutEffect(() => { if (open !== undefined) setMotionState(open); }, [open]);
  ensureDefined(definePopover);
  const controlledOpenRef = React.useRef(resolvedOpen);
  controlledOpenRef.current = resolvedOpen;
  useSpuiEvent(ref, "spui-open-change", (detail, event) => {
    const change = detail as PopoverOpenChangeData & { event?: Event };
    const next = change.open;
    if (open === undefined) setMotionState(next);
    const sourceEvent = change.event ?? new Event("programmatic");
    const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!)) as unknown as PopoverOpenChangeEvent;
    onOpenChange?.(callbackEvent, { open: next });
    if (provider && next !== resolvedOpen) provider.setOpen(change.event ?? event, next);
    if (resolvedOpen !== undefined && next !== resolvedOpen) requestAnimationFrame(() => {
      const requested = controlledOpenRef.current;
      const element = ref.current as (HTMLElement & { open?: boolean; syncOpen?: (value: boolean) => void }) | null;
      if (requested !== undefined && element && element.open !== requested) {
        if (element.syncOpen) element.syncOpen(requested);
        else element.open = requested;
      }
    });
  });
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { open?: boolean; syncOpen?: (value: boolean) => void }) | null;
    if (element && resolvedOpen !== undefined && element.open !== resolvedOpen) {
      if (element.syncOpen) element.syncOpen(resolvedOpen);
      else element.open = resolvedOpen;
    }
  }, [resolvedOpen]);
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { positioning?: PopoverPositioning }) | null;
    if (element) element.positioning = positioning ?? (resolvedOpenOnContext ? "above" : placement);
  }, [positioning, placement, resolvedOpenOnContext]);
  const parts = React.Children.toArray(children);
  const triggerPart = parts.find(child => React.isValidElement(child) && child.type === PopoverTrigger);
  const surfacePart = parts.find(child => React.isValidElement(child) && child.type === PopoverSurface);
  const content = parts.filter(child => !(React.isValidElement(child) && (child.type === PopoverTrigger || child.type === PopoverSurface)));
  const triggerNode = trigger
    ? React.cloneElement(trigger as React.ReactElement<{ slot?: string }>, { slot: "trigger" })
    : React.isValidElement<{ children?: React.ReactNode }>(triggerPart)
      ? React.createElement(PopoverTrigger, { ...triggerPart.props, slot: "trigger" }, triggerPart.props.children)
      : null;
  const surfaceNode = React.isValidElement<{ children?: React.ReactNode }>(surfacePart)
    ? React.createElement(PopoverSurface, surfacePart.props, surfacePart.props.children)
    : content;
  return React.createElement("spui-popover", useCustomElementProps({ ...props, ref, label, placement, inline: resolvedInline || undefined, motion: surfaceMotion ? true : undefined, "data-spui-controlled-open": resolvedOpen !== undefined || undefined, "default-open": defaultOpen || undefined, "open-on-context": resolvedOpenOnContext || undefined, "open-on-hover": resolvedOpenOnHover || undefined, "mouse-leave-delay": mouseLeaveDelay, "close-on-iframe-focus": closeOnIframeFocus ? undefined : "false", "trap-focus": resolvedTrapFocus || undefined, "inert-trap-focus": resolvedInertTrapFocus === undefined ? undefined : String(resolvedInertTrapFocus), "legacy-trap-focus": legacyTrapFocus === undefined ? undefined : String(legacyTrapFocus), "unstable-disable-auto-focus": unstable_disableAutoFocus || undefined, arrow: resolvedArrow || undefined, "close-on-scroll": closeOnScroll || undefined, appearance: resolvedAppearance, size: resolvedSize }),
    triggerNode,
    React.createElement("div", { slot: "content" }, surfaceMotion
      ? React.createElement(surfaceMotion, { visible: motionVisible, appear: true, unmountOnExit: true, slot: "surface" }, surfaceNode)
      : surfaceNode));
});

export const PopoverTrigger = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; disableButtonEnhancement?: boolean }>(function PopoverTrigger({ children, disableButtonEnhancement = false, ...props }: ElementProps & { children?: React.ReactNode; disableButtonEnhancement?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(definePopover);
  return React.createElement("spui-popover-trigger", useCustomElementProps({ ref: forwardedRef, ...props, "disable-button-enhancement": disableButtonEnhancement || undefined }), children);
});

export const PopoverSurface = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function PopoverSurface({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(definePopover);
  return React.createElement("spui-popover-surface", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export type TeachingPopoverCarouselValueChangeData = { value?: string; event: SharePointUIEvent; type: TeachingPopoverCarouselValueChangeType };
export type TeachingPopoverCarouselFinishData = { value?: string; event: SharePointUIEvent; type: "click" };
export type TeachingPopoverCarouselChangeEvent = Event | React.SyntheticEvent<HTMLElement>;
type TeachingCarouselContextValue = { index: number; count: number; value: string; values: string[]; initialStepText?: string; finalStepText?: string; onValueChange?: (event: TeachingPopoverCarouselChangeEvent, data: TeachingPopoverCarouselValueChangeData) => void; onFinish?: (event: React.MouseEvent<HTMLElement>, data: TeachingPopoverCarouselFinishData) => void; setIndex: (index: number, event: TeachingPopoverCarouselChangeEvent) => void; selectValue: (value: string, event: TeachingPopoverCarouselChangeEvent) => void };
const TeachingCarouselContext = React.createContext<TeachingCarouselContextValue | null>(null);

/** Guided, keyboard-contained help surface. Its parts use native React composition and add no runtime dependency. */
export function TeachingPopover({ children, trigger, label, placement = "bottom", open, onOpenChange, ...props }: ElementProps & { children?: React.ReactNode; trigger?: React.ReactElement; label?: string; placement?: "top" | "bottom" | "start" | "end"; open?: boolean; onOpenChange?: (open: boolean) => void }): React.ReactElement {
  const context = React.useContext(UIContext);
  ensureDefined(defineNativeTeachingPopover);
  const parts = React.Children.toArray(children);
  const triggerPart = parts.find(child => React.isValidElement(child) && child.type === TeachingPopoverTrigger);
  const composedTrigger = trigger ?? (React.isValidElement<{ children?: React.ReactNode }>(triggerPart) ? triggerPart.props.children as React.ReactElement | undefined : undefined);
  const content = triggerPart ? parts.filter(child => child !== triggerPart) : children;
  return React.createElement(Popover, { ...props, trigger: composedTrigger, label: label ?? context.strings.teachingPopoverLabel, placement, open, onOpenChange: onOpenChange ? (_event, data) => onOpenChange(data.open) : undefined, trapFocus: true, arrow: true }, content);
}

export function TeachingPopoverTrigger({ children, ...props }: ElementProps & { children?: React.ReactNode }): React.ReactElement {
  return React.createElement("span", useHostProps({ ...props, style: { display: "contents", ...props.style }, "data-spui-teaching-trigger": "" }), children);
}

export function TeachingPopoverSurface({ children, ...props }: ElementProps & { children?: React.ReactNode }): React.ReactElement {
  return React.createElement("div", useHostProps({ ...props, style: { display: "grid", gap: "12px", minWidth: "min(320px, calc(100vw - 64px))", maxWidth: "100%", boxSizing: "border-box", ...props.style }, "data-spui-teaching-surface": "" }), children);
}

export type TeachingPopoverButtonSlot = React.ReactNode | Parameters<typeof Button>[0];
function teachingPopoverDismissButton(value: TeachingPopoverButtonSlot | undefined, label: string, slot: "dismiss-button", onDismiss?: () => void, renderByDefault = false): React.ReactNode {
  if (value == null && !renderByDefault) return null;
  const onClick = (event: React.MouseEvent<HTMLElement>): void => {
    onDismiss?.();
    if (!event.defaultPrevented) event.currentTarget.dispatchEvent(new CustomEvent("spui-popover-request-close", { bubbles: true, composed: true, detail: { sourceEvent: event.nativeEvent } }));
  };
  if (React.isValidElement(value)) {
    const element = value as React.ReactElement<Record<string, unknown> & { onClick?: (event: React.MouseEvent<HTMLElement>) => void }>;
    return React.cloneElement(element, { slot, "data-spui-react-action": "", "aria-label": element.props["aria-label"] ?? label, onClick: event => { element.props.onClick?.(event); onClick(event); } });
  }
  if (value && typeof value === "object" && !Array.isArray(value) && !("$$typeof" in value)) {
    const buttonProps = value as Parameters<typeof Button>[0];
    return React.createElement(Button, { ...buttonProps, slot, type: "button", iconOnly: buttonProps.iconOnly ?? true, "data-spui-react-action": "", "aria-label": buttonProps["aria-label"] ?? label, onClick: event => { buttonProps.onClick?.(event); onClick(event); } }, buttonProps.children);
  }
  const content = value as React.ReactNode;
  return React.createElement(Button, { slot, type: "button", appearance: "subtle", size: "small", shape: "circular", iconOnly: true, "aria-label": label, "data-spui-react-action": "", onClick }, content ?? "×");
}

export function TeachingPopoverHeader({ children, icon, dismissButton, onDismiss, dismissLabel, style, ...props }: ElementProps & { children?: React.ReactNode; icon?: React.ReactNode; dismissButton?: TeachingPopoverButtonSlot; onDismiss?: () => void; dismissLabel?: string }): React.ReactElement {
  const context = React.useContext(UIContext);
  const iconContent = icon ?? React.createElement("svg", { viewBox: "0 0 16 16", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.25, "aria-hidden": true }, React.createElement("path", { d: "M5.1 10.6c-.3-.8-.7-1.3-1.2-2A4.3 4.3 0 1 1 12.1 8c-.5.7-.9 1.2-1.2 2.6H5.2l-.1 0Zm.4 1.3h5m-4.5 1.4h4m-3.4 1.2h2.8" }));
  return React.createElement("header", useHostProps({ ...props, style: { display: "flex", alignItems: "center", gap: "8px", paddingBlockEnd: "4px", color: "var(--spui-ui-text-muted,var(--colorNeutralForeground3,#616161))", fontSize: "var(--spui-font-size-200,12px)", fontWeight: 600, ...style } }),
    React.createElement("span", { slot: "icon", "aria-hidden": true, style: { display: "inline-flex", alignItems: "center", flex: "none", color: "var(--spui-ui-accent,var(--colorBrandForeground1,#0f6cbd))" } }, iconContent), children,
    teachingPopoverDismissButton(dismissButton, dismissLabel ?? context.strings.teachingPopoverDismiss ?? context.strings.dismiss, "dismiss-button", onDismiss, true));
}

export function TeachingPopoverTitle({ children, dismissButton, ...props }: ElementProps & { children?: React.ReactNode; dismissButton?: TeachingPopoverButtonSlot }): React.ReactElement {
  const context = React.useContext(UIContext);
  return React.createElement("h2", useHostProps({ ...props, style: { display: "flex", alignItems: "center", gap: "8px", margin: 0, color: "var(--spui-ui-text,var(--colorNeutralForeground1,#242424))", font: "600 20px/1.3 var(--spui-font-family,inherit)", ...props.style } }), children,
    teachingPopoverDismissButton(dismissButton, context.strings.teachingPopoverDismiss ?? context.strings.dismiss, "dismiss-button"));
}

export function TeachingPopoverBody({ children, media, mediaLength = "medium", ...props }: ElementProps & { children?: React.ReactNode; media?: React.ReactNode; mediaLength?: "short" | "medium" | "tall" }): React.ReactElement {
  const aspectRatio = mediaLength === "short" ? "288 / 117" : mediaLength === "tall" ? "1" : "288 / 176";
  const mediaContent = React.isValidElement<{ style?: React.CSSProperties }>(media)
    ? React.cloneElement(media, { style: { display: "block", width: "100%", height: "100%", objectFit: "cover", ...media.props.style } })
    : media;
  return React.createElement("div", useHostProps({ ...props, style: { display: "grid", gap: "8px", paddingBlockEnd: "8px", color: "var(--spui-ui-text,var(--colorNeutralForeground1,#242424))", font: "var(--spui-font-family,inherit)", lineHeight: 1.5, ...props.style }, "data-media-length": media ? mediaLength : undefined }),
    media ? React.createElement("div", { "data-spui-teaching-media": "", style: { display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", width: "100%", maxWidth: "288px", aspectRatio, borderRadius: "var(--spui-card-radius,8px)", background: "var(--spui-ui-surface-alt,var(--colorNeutralBackground2,#f5f5f5))" } }, mediaContent) : null,
    children);
}

export const TeachingPopoverFooter = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; primary: React.ReactNode | Parameters<typeof Button>[0]; secondary?: React.ReactNode | Parameters<typeof Button>[0]; footerLayout?: "horizontal" | "vertical" }>(function TeachingPopoverFooter({ children, primary, secondary, footerLayout = "horizontal", ...props }: ElementProps & { children?: React.ReactNode; primary: React.ReactNode | Parameters<typeof Button>[0]; secondary?: React.ReactNode | Parameters<typeof Button>[0]; footerLayout?: "horizontal" | "vertical" }, forwardedRef): React.ReactElement {
  const horizontal = footerLayout === "horizontal";
  const closeOnAction = (event: React.MouseEvent<HTMLElement>): void => {
    if (!event.defaultPrevented) event.currentTarget.dispatchEvent(new CustomEvent("spui-popover-request-close", { bubbles: true, composed: true, detail: { sourceEvent: event.nativeEvent } }));
  };
  const action = (slot: "primary" | "secondary", value: React.ReactNode | Parameters<typeof Button>[0] | undefined, appearance: "primary" | "secondary"): React.ReactNode => {
    if (React.isValidElement(value)) {
      const element = value as React.ReactElement<Record<string, unknown> & { onClick?: (event: React.MouseEvent<HTMLElement>) => void }>;
      return React.cloneElement(element, { slot, "data-spui-react-action": "", onClick: event => { element.props.onClick?.(event); closeOnAction(event); } });
    }
    if (value && typeof value === "object" && !Array.isArray(value) && !("$$typeof" in value)) {
      const buttonProps = value as Parameters<typeof Button>[0];
      return React.createElement(Button, { ...buttonProps, slot, "data-spui-react-action": "", appearance: buttonProps.appearance ?? appearance, onClick: event => { buttonProps.onClick?.(event); closeOnAction(event); } });
    }
    const content = value as React.ReactNode;
    return slot === "primary"
      ? React.createElement(Button, { slot, appearance, "data-spui-react-action": "", onClick: closeOnAction }, content)
      : value == null ? null : React.createElement(Button, { slot, appearance, "data-spui-react-action": "", onClick: closeOnAction }, content);
  };
  return React.createElement("spui-teaching-popover-footer", useCustomElementProps({ ref: forwardedRef, ...props, "data-footer-layout": footerLayout, style: { display: "flex", flexDirection: horizontal ? "row" : "column", alignItems: horizontal ? "center" : "stretch", justifyContent: horizontal ? "flex-end" : "initial", flexWrap: horizontal ? "wrap" : "nowrap", gap: "8px", paddingBlockStart: "12px", ...props.style } }), action("primary", primary, "primary"), action("secondary", secondary, "secondary"), children);
});

export function TeachingPopoverCarousel({ children, defaultValue, value, onValueChange, onAnnouncement, announcement, onFinish, ...props }: ElementProps & { children?: React.ReactNode; value?: string; defaultValue?: string; onValueChange?: (event: TeachingPopoverCarouselChangeEvent, data: TeachingPopoverCarouselValueChangeData) => void; onAnnouncement?: (message: string) => void; announcement?: (newValue: string) => string; onFinish?: (event: React.MouseEvent<HTMLElement>, data: TeachingPopoverCarouselFinishData) => void }): React.ReactElement {
  const context = React.useContext(UIContext);
  const parts = React.Children.toArray(children);
  const cards = parts.filter((child): child is React.ReactElement<{ value: string }> => React.isValidElement(child) && child.type === TeachingPopoverCarouselCard);
  const controls = parts.filter(child => !cards.includes(child as React.ReactElement<{ value: string }>));
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? cards[0]?.props.value ?? "");
  const requestedValue = value ?? uncontrolled;
  const requestedIndex = cards.findIndex(card => card.props.value === requestedValue);
  const index = requestedIndex < 0 ? 0 : requestedIndex;
  const current = cards[index]?.props.value ?? "";
  const [announcementMessage, setAnnouncementMessage] = React.useState("");
  const previousValue = React.useRef(current);
  React.useLayoutEffect(() => {
    if (previousValue.current === current) return;
    previousValue.current = current;
    const localizedMessage = (context.strings.teachingPopoverPageCount ?? "{current} of {total}").replace("{current}", String(index + 1)).replace("{total}", String(cards.length));
    const message = announcement?.(current) ?? localizedMessage;
    onAnnouncement?.(message);
    setAnnouncementMessage(message);
  }, [current, index, cards.length, announcement, onAnnouncement, context.strings.teachingPopoverPageCount]);
  const setIndex = (next: number, event: TeachingPopoverCarouselChangeEvent): void => {
    const bounded = Math.max(0, Math.min(cards.length - 1, next));
    const nextValue = cards[bounded]?.props.value;
    if (nextValue === undefined || bounded === index) return;
    if (value === undefined) setUncontrolled(nextValue);
    onValueChange?.(event, { value: nextValue, event, type: event.type as TeachingPopoverCarouselValueChangeType });
  };
  const selectValue = (nextValue: string, event: TeachingPopoverCarouselChangeEvent): void => { const nextIndex = cards.findIndex(card => card.props.value === nextValue); if (nextIndex >= 0) setIndex(nextIndex, event); };
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    props.onKeyDown?.(event);
    if (event.defaultPrevented || !cards.length) return;
    const direction = getComputedStyle(event.currentTarget).direction;
    if (event.key === "ArrowRight") { event.preventDefault(); setIndex(index + (direction === "rtl" ? -1 : 1), event); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); setIndex(index + (direction === "rtl" ? 1 : -1), event); }
    else if (event.key === "Home") { event.preventDefault(); setIndex(0, event); }
    else if (event.key === "End") { event.preventDefault(); setIndex(cards.length - 1, event); }
  };
  return React.createElement(TeachingCarouselContext.Provider, { value: { index, count: cards.length, value: current, values: cards.map(card => card.props.value), onFinish, setIndex, selectValue } },
    React.createElement("div", useHostProps({ ...props, onKeyDown, role: "group", "aria-roledescription": "carousel", "aria-label": props["aria-label"] ?? context.strings.teachingPopoverLabel, style: { display: "grid", gap: "12px", minWidth: 0, ...props.style } }), cards[index] ?? null, controls, announcement ? React.createElement("span", { "data-spui-teaching-announcement": "", "aria-live": "polite", "aria-atomic": "true", style: { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 } }, announcementMessage) : null));
}

export function TeachingPopoverCarouselCard({ value: _value, children, ...props }: ElementProps & { value: string; children?: React.ReactNode }): React.ReactElement {
  const carousel = React.useContext(TeachingCarouselContext);
  const index = carousel?.values.indexOf(_value) ?? -1;
  const pageLabel = (React.useContext(UIContext).strings.teachingPopoverPageLabel ?? "Step {current} of {total}").replace("{current}", String(index + 1)).replace("{total}", String(carousel?.count ?? 0));
  return React.createElement("div", useHostProps({ ...props, role: "group", "aria-roledescription": "slide", "aria-label": props["aria-label"] ?? pageLabel, style: { display: "grid", gap: "8px", minWidth: 0, ...props.style }, "data-spui-teaching-card": "" }), children);
}

export function TeachingPopoverCarouselFooter({ children, previous, next, layout = "centered", initialStepText, finalStepText, ...props }: ElementProps & { children?: React.ReactNode; previous?: React.ReactNode; next?: React.ReactNode; layout?: "centered" | "offset"; initialStepText?: string; finalStepText?: string }): React.ReactElement {
  const context = React.useContext(UIContext);
  const carousel = React.useContext(TeachingCarouselContext);
  const footerContext = React.useMemo(() => carousel ? { ...carousel, initialStepText: initialStepText ?? context.strings.teachingPopoverPrevious, finalStepText: finalStepText ?? context.strings.teachingPopoverFinish } : carousel, [carousel, initialStepText, finalStepText, context.strings.teachingPopoverPrevious, context.strings.teachingPopoverFinish]);
  return React.createElement(TeachingCarouselContext.Provider, { value: footerContext }, React.createElement("footer", useHostProps({ ...props, "data-layout": layout, style: { display: "flex", alignItems: "center", justifyContent: layout === "offset" ? "space-between" : "center", flexWrap: "wrap", gap: "8px", ...props.style } }), previous, children, next));
}

export function TeachingPopoverCarouselFooterButton({ navType, altText, children, onClick, ...props }: ElementProps & { navType: "next" | "prev" | "previous" | "dismiss"; altText?: React.ReactNode; children?: React.ReactNode; onClick?: React.MouseEventHandler<HTMLElement> }): React.ReactElement {
  const carousel = React.useContext(TeachingCarouselContext);
  const context = React.useContext(UIContext);
  const previous = navType === "prev" || navType === "previous";
  const dismiss = navType === "dismiss";
  const atEdge = Boolean(carousel && (previous ? carousel.index === 0 : navType === "next" && carousel.index === carousel.count - 1));
  const fallback = dismiss ? context.strings.teachingPopoverFinish ?? "Finish tour" : previous ? context.strings.teachingPopoverPrevious ?? "Previous step" : context.strings.teachingPopoverNext ?? "Next step";
  const edgeText = altText ?? (previous ? carousel?.initialStepText : navType === "next" ? carousel?.finalStepText : undefined);
  const buttonText = atEdge && edgeText != null ? edgeText : children ?? fallback;
  const label = getVisibleText(buttonText) || fallback;
  const click = (event: React.MouseEvent<HTMLElement>): void => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (previous) carousel?.setIndex((carousel.index || 0) - 1, event);
    else if (navType === "next") carousel?.setIndex((carousel.index || 0) + 1, event);
    if (navType === "next" && atEdge) carousel?.onFinish?.(event, { value: carousel.value, event, type: "click" });
  };
  const buttonProps = useHostProps({ ...props, type: "button", appearance: navType === "next" ? "primary" : dismiss ? "subtle" : "secondary", size: "medium", style: { minWidth: "96px", ...props.style }, "aria-label": label, "data-spui-popover-close": dismiss ? "" : undefined, onClick: click }) as Parameters<typeof Button>[0];
  return React.createElement(Button, buttonProps, buttonText);
}

export function TeachingPopoverCarouselNav({ children, onKeyDown, ...props }: ElementProps & { children?: React.ReactNode }): React.ReactElement {
  const context = React.useContext(UIContext);
  const carousel = React.useContext(TeachingCarouselContext);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !carousel?.count) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const delta = event.key === "ArrowRight" ? (rtl ? -1 : 1) : event.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0;
    const next = event.key === "Home" ? 0 : event.key === "End" ? carousel.count - 1 : delta ? Math.max(0, Math.min(carousel.count - 1, carousel.index + delta)) : -1;
    if (next < 0) return;
    event.preventDefault();
    carousel.setIndex(next, event);
    const nav = event.currentTarget;
    const nextValue = carousel.values[next];
    requestAnimationFrame(() => { const host = [...nav.querySelectorAll<HTMLElement>("[data-value]")].find(button => button.dataset.value === nextValue); (host?.shadowRoot?.querySelector<HTMLButtonElement>("button") ?? host)?.focus(); });
  };
  return React.createElement("nav", useHostProps({ ...props, onKeyDown: handleKeyDown, "aria-label": props["aria-label"] ?? context.strings.teachingPopoverSteps ?? "Tour steps", style: { display: "flex", alignItems: "center", gap: "4px", ...props.style } }), children);
}

export function TeachingPopoverCarouselNavButton({ value, children, onClick, ...props }: ElementProps & { value: string; children?: React.ReactNode }): React.ReactElement {
  const carousel = React.useContext(TeachingCarouselContext);
  const selected = carousel?.value === value;
  const click = (event: React.MouseEvent<HTMLElement>): void => { onClick?.(event); if (!event.defaultPrevented) carousel?.selectValue(value, event); };
  const buttonProps = useHostProps({ ...props, type: "button", size: "small", shape: "circular", iconOnly: true, appearance: selected ? "primary" : "subtle", "aria-current": selected ? "step" : undefined, tabIndex: selected || !carousel ? 0 : -1, "data-value": value, onClick: click }) as Parameters<typeof Button>[0];
  return React.createElement(Button, buttonProps, children ?? value);
}

export function TeachingPopoverCarouselPageCount({ children, ...props }: ElementProps & { children?: React.ReactNode | ((currentPage: number, totalPages: number) => React.ReactNode) }): React.ReactElement {
  const carousel = React.useContext(TeachingCarouselContext);
  const context = React.useContext(UIContext);
  const currentPage = carousel?.count ? carousel.index + 1 : 0;
  const totalPages = carousel?.count ?? 0;
  const text = (context.strings.teachingPopoverPageCount ?? "{current} of {totalPages}").replace("{current}", String(currentPage)).replace("{totalPages}", String(totalPages)).replace("{total}", String(totalPages));
  const content = typeof children === "function" ? children(currentPage, totalPages) : children ?? text;
  return React.createElement("span", useHostProps({ ...props, "aria-live": "polite", style: { color: "var(--spui-ui-text-muted,var(--colorNeutralForeground3,#616161))", fontSize: "var(--spui-font-size-200,12px)", whiteSpace: "nowrap", ...props.style } }), content);
}

export type MenuPositioning = "top" | "bottom" | "start" | "end" | "above" | "below" | "before" | "after" | "above-start" | "above-end" | "below-start" | "below-end";
export type MenuPositioningOptions = { placement?: MenuPositioning; align?: "start" | "end"; offset?: number };
export type MenuProps = Omit<ElementProps, "onSelect" | "contextMenu"> & {
  children?: React.ReactNode; trigger?: React.ReactElement; label?: string; placement?: MenuPositioning; positioning?: MenuPositioning | MenuPositioningOptions;
  open?: boolean; defaultOpen?: boolean; contextMenu?: boolean; openOnContext?: boolean; openOnHover?: boolean; hoverDelay?: number;
  closeOnScroll?: boolean; inline?: boolean; persistOnItemClick?: boolean; checkedValues?: MenuCheckedValues; defaultCheckedValues?: MenuCheckedValues;
  hasCheckmarks?: boolean; hasIcons?: boolean; surfaceMotion?: React.ComponentType<PresenceMotionSlotProps>;
  onCheckedValueChange?: (event: MenuCheckedValueChangeEvent, data: MenuCheckedValueChangeData) => void;
  onOpenChange?: (event: MenuReactOpenChangeEvent, data: MenuReactOpenChangeData) => void; onSelect?: (value: string, label: string, checked: boolean) => void;
};

export function Menu({ children, trigger, label, placement, positioning, open, defaultOpen = false, contextMenu = false, openOnContext = contextMenu, openOnHover = false, hoverDelay = 300, closeOnScroll = false, inline = false, persistOnItemClick = false, checkedValues, defaultCheckedValues = {}, hasCheckmarks = false, hasIcons = false, surfaceMotion, onCheckedValueChange, onOpenChange, onSelect, ...props }: MenuProps): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null);
  const [internalCheckedValues, setInternalCheckedValues] = React.useState<MenuCheckedValues>(defaultCheckedValues);
  const [motionState, setMotionState] = React.useState(open ?? defaultOpen);
  const motionVisible = open ?? motionState;
  const currentCheckedValues = checkedValues ?? internalCheckedValues;
  ensureDefined(defineMenu);
  useSpuiEvent(ref, "spui-open-change", (detail, event) => {
    const change = detail as MenuOpenChangeData;
    if (open === undefined) setMotionState(change.open);
    const sourceEvent = change.event;
    const callbackEvent = sourceEvent instanceof MouseEvent || sourceEvent instanceof KeyboardEvent
      ? createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!))
      : sourceEvent;
    const dataEvent = change.type === "clickOutside" || change.type === "scrollOutside" ? sourceEvent : callbackEvent;
    onOpenChange?.(callbackEvent as MenuReactOpenChangeEvent, { ...change, event: dataEvent } as MenuReactOpenChangeData);
  });
  useSpuiEvent(ref, "spui-select", detail => onSelect?.(String(detail.value ?? ""), String(detail.label ?? ""), Boolean(detail.checked)));
  const selection = React.useMemo<MenuSelectionContextValue>(() => ({
    checkedValues: currentCheckedValues,
    change: (event, name, value, checked, kind) => {
      const previous = currentCheckedValues[name] ?? [];
      const nextValues = kind === "radio" ? (checked ? [value] : previous.filter(item => item !== value)) : checked ? [...new Set([...previous, value])] : previous.filter(item => item !== value);
      const next = { ...currentCheckedValues, [name]: nextValues };
      if (checkedValues === undefined) setInternalCheckedValues(next);
      onCheckedValueChange?.(event, { name, checkedItems: nextValues });
    }
  }), [currentCheckedValues, checkedValues, onCheckedValueChange]);
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { open?: boolean }) | null;
    if (element && open !== undefined) element.open = open;
  }, [open]);
  const parts = React.Children.toArray(children);
  const triggerPart = parts.find(child => React.isValidElement(child) && child.type === MenuTrigger);
  const menuChildren = parts.filter(child => child !== triggerPart);
  const triggerNode = trigger
    ? React.cloneElement(trigger as React.ReactElement<{ slot?: string }>, { slot: "trigger" })
    : triggerPart && React.isValidElement(triggerPart) ? React.cloneElement(triggerPart as React.ReactElement<{ slot?: string }>, { slot: "trigger" }) : null;
  const positionOptions = typeof positioning === "object" ? positioning : undefined;
  const positionValue = typeof positioning === "string" ? positioning : positionOptions?.placement ?? placement;
  const alignedPosition = positionOptions?.align && positionValue && ["top", "bottom", "above", "below"].includes(positionValue) ? `${positionValue === "above" ? "above" : positionValue === "below" ? "below" : positionValue}-${positionOptions.align}` : positionValue;
  const menuItems = React.createElement("div", { slot: "menu", "has-checkmarks": hasCheckmarks ? "" : undefined, "has-icons": hasIcons ? "" : undefined }, menuChildren);
  const motionContent = surfaceMotion ? React.createElement(surfaceMotion, { visible: motionVisible, appear: true, unmountOnExit: true, slot: "surface" }, menuItems) : menuItems;
  const menuElement = React.createElement("spui-menu", useCustomElementProps({ ...props, ref, label, placement, positioning: alignedPosition, motion: surfaceMotion ? true : undefined, "position-offset": positionOptions?.offset, "default-open": defaultOpen ? "" : undefined, "context-menu": contextMenu ? "" : undefined, "open-on-context": openOnContext ? "" : undefined, "open-on-hover": openOnHover ? "" : undefined, "hover-delay": hoverDelay, "close-on-scroll": closeOnScroll ? "" : undefined, inline: inline ? "" : undefined, "persist-on-item-click": persistOnItemClick ? "" : undefined }), triggerNode, motionContent);
  return React.createElement(MenuSelectionContext.Provider, { value: selection }, menuElement);
}

/** Open a command menu from a right-click, the Context Menu key, or Shift+F10. */
export function ContextMenu(props: MenuProps): React.ReactElement {
  return React.createElement(Menu, { ...props, contextMenu: true });
}

export const MenuBar = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; label?: string }>(function MenuBar({ children, label, ...props }: ElementProps & { children?: React.ReactNode; label?: string }, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeMenuBar);
  const strings = React.useContext(UIContext).strings;
  const accessibleLabel = label || (typeof props["aria-label"] === "string" ? props["aria-label"] : strings.menuBarLabel || "Menu bar");
  return React.createElement("spui-menu-bar", useCustomElementProps({ ref: forwardedRef, ...props, "aria-label": accessibleLabel }), children);
});

export const MenuBarItem = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function MenuBarItem({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineMenuBarItem);
  return React.createElement("spui-menu-bar-item", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const MenuItem = React.forwardRef<HTMLElement, Omit<ElementProps, "onSelect"> & { children?: React.ReactNode; content?: React.ReactNode; checkmark?: React.ReactNode; submenuIndicator?: React.ReactNode; icon?: React.ReactNode; secondaryContent?: React.ReactNode; subText?: React.ReactNode; switchIndicator?: React.ReactNode; kind?: "default" | "checkbox" | "radio" | "switch"; value?: string; name?: string; checked?: boolean; disabled?: boolean; disabledFocusable?: boolean; persistOnClick?: boolean; hasSubmenu?: boolean; onSelect?: (value: string, label: string, checked: boolean) => void; onCheckedChange?: (checked: boolean, event?: MenuCheckedValueChangeEvent) => void }>(function MenuItem({ children, content, checkmark, submenuIndicator, icon, secondaryContent, subText, switchIndicator, kind = "default", value, name, checked, disabled = false, disabledFocusable: _disabledFocusable, persistOnClick = false, hasSubmenu = false, onSelect, onCheckedChange, ...props }: Omit<ElementProps, "onSelect"> & { children?: React.ReactNode; content?: React.ReactNode; checkmark?: React.ReactNode; submenuIndicator?: React.ReactNode; icon?: React.ReactNode; secondaryContent?: React.ReactNode; subText?: React.ReactNode; switchIndicator?: React.ReactNode; kind?: "default" | "checkbox" | "radio" | "switch"; value?: string; name?: string; checked?: boolean; disabled?: boolean; disabledFocusable?: boolean; persistOnClick?: boolean; hasSubmenu?: boolean; onSelect?: (value: string, label: string, checked: boolean) => void; onCheckedChange?: (checked: boolean, event?: MenuCheckedValueChangeEvent) => void }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const checkedRef = React.useRef(checked);
  checkedRef.current = checked;
  ensureDefined(defineMenuItem);
  useSpuiEvent(ref, "spui-select", (detail, event) => {
    const next = Boolean(detail.checked);
    const sourceEvent = detail.event ?? event;
    const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!)) as unknown as MenuCheckedValueChangeEvent;
    onSelect?.(String(detail.value ?? ""), String(detail.label ?? ""), next);
    onCheckedChange?.(next, callbackEvent);
    if (checked !== undefined) setTimeout(() => { const element = ref.current as (HTMLElement & { checked?: boolean }) | null; if (element && checkedRef.current !== undefined) element.checked = checkedRef.current; }, 0);
  });
  React.useLayoutEffect(() => { const element = ref.current as (HTMLElement & { checked?: boolean }) | null; if (element && checked !== undefined) element.checked = checked; }, [checked]);
  return React.createElement("spui-menu-item", useCustomElementProps({ ...props, ref, kind, value, name, checked, disabled: disabled || undefined, "persist-on-click": persistOnClick ? "" : undefined, "has-submenu": hasSubmenu ? "" : undefined }), icon == null ? null : React.createElement("span", { slot: "icon" }, icon), content == null ? children : React.createElement("span", { slot: "content" }, content), checkmark == null ? null : React.createElement("span", { slot: "checkmark", "aria-hidden": true }, checkmark), submenuIndicator == null ? null : React.createElement("span", { slot: "submenuIndicator", "aria-hidden": true }, submenuIndicator), subText == null ? null : React.createElement("span", { slot: "subtext" }, subText), secondaryContent == null ? null : React.createElement("span", { slot: "secondary-content" }, secondaryContent), kind === "switch" && switchIndicator != null ? React.createElement("span", { slot: "switch-indicator" }, switchIndicator) : null);
});

export type MenuItemSelectableProps = Omit<ElementProps, "onSelect"> & { name: string; value: string; children?: React.ReactNode; content?: React.ReactNode; checkmark?: React.ReactNode; submenuIndicator?: React.ReactNode; icon?: React.ReactNode; secondaryContent?: React.ReactNode; subText?: React.ReactNode; checked?: boolean; defaultChecked?: boolean; disabled?: boolean; disabledFocusable?: boolean; hasSubmenu?: boolean; persistOnClick?: boolean; onCheckedChange?: (checked: boolean) => void };
export type MenuItemSwitchProps = MenuItemSelectableProps & { switchIndicator?: React.ReactNode };
function MenuSelectableItem({ kind, name, value, children, checked, defaultChecked = false, onCheckedChange, switchIndicator, ...props }: MenuItemSelectableProps & { kind: "checkbox" | "radio" | "switch"; switchIndicator?: React.ReactNode }): React.ReactElement {
  const selection = React.useContext(MenuSelectionContext);
  const [localChecked, setLocalChecked] = React.useState(defaultChecked);
  const selected = checked ?? (selection && Object.prototype.hasOwnProperty.call(selection.checkedValues, name) ? selection.checkedValues[name].includes(value) : localChecked);
  const change = (next: boolean, event?: MenuCheckedValueChangeEvent): void => { if (selection) selection.change(event ?? (new Event("spui-select") as unknown as MenuCheckedValueChangeEvent), name, value, next, kind); else setLocalChecked(next); onCheckedChange?.(next); };
  return React.createElement(MenuItem, { ...props, kind, name, value, checked: selected, onCheckedChange: change, switchIndicator }, children);
}
export function MenuItemCheckbox(props: MenuItemSelectableProps): React.ReactElement { return React.createElement(MenuSelectableItem, { ...props, kind: "checkbox" }); }
export function MenuItemRadio(props: MenuItemSelectableProps): React.ReactElement { return React.createElement(MenuSelectableItem, { ...props, kind: "radio" }); }
export function MenuItemSwitch(props: MenuItemSwitchProps): React.ReactElement { return React.createElement(MenuSelectableItem, { ...props, kind: "switch" }); }
export type MenuItemLinkProps = ElementProps & { href: string; target?: string; rel?: string; download?: string | boolean; disabled?: boolean; icon?: SpanSlotProps; checkmark?: SpanSlotProps; content?: SpanSlotProps; secondaryContent?: SpanSlotProps; children?: React.ReactNode };
export const MenuItemLink = React.forwardRef<HTMLElement, MenuItemLinkProps>(function MenuItemLink({ href, target, rel, download, disabled = false, icon, checkmark, content, secondaryContent, children, ...props }: MenuItemLinkProps, forwardedRef): React.ReactElement {
  ensureDefined(defineMenuItemLink);
  return React.createElement("spui-menu-item-link", useCustomElementProps({ ref: forwardedRef, ...props, href, target, rel, download: download === true ? "" : download, disabled: disabled || undefined }), renderSpanSlot(checkmark, "checkmark"), renderSpanSlot(icon, "icon"), renderSpanSlot(content ?? children, "content"), renderSpanSlot(secondaryContent, "secondary-content"));
});
export function MenuTrigger({ children, disableButtonEnhancement = false, ...props }: ElementProps & { children: React.ReactElement; disableButtonEnhancement?: boolean }): React.ReactElement {
  ensureDefined(defineMenuTrigger);
  const elementType = children.type;
  const nativeControl = elementType === "button" || elementType === "a" || typeof elementType !== "string";
  const childProps = children.props as React.HTMLAttributes<HTMLElement>;
  const onKeyDown: React.KeyboardEventHandler<HTMLElement> = event => {
    childProps.onKeyDown?.(event);
    props.onKeyDown?.(event);
    if (!disableButtonEnhancement && !nativeControl && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); (event.currentTarget as HTMLElement).click(); }
  };
  const child = React.cloneElement(children as React.ReactElement<{ slot?: string; role?: string; tabIndex?: number; "aria-haspopup"?: string; onKeyDown?: React.KeyboardEventHandler<HTMLElement> }>, { ...props, slot: props.slot as string | undefined, "aria-haspopup": "menu", ...(!disableButtonEnhancement && !nativeControl ? { role: "button", tabIndex: childProps.tabIndex ?? 0, onKeyDown } : {}) });
  return child;
}
export const MenuPopover = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function MenuPopover({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineMenuPopover);
  return React.createElement("spui-menu-popover", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});
export type MenuListProps = ElementProps & { children?: React.ReactNode; checkedValues?: MenuCheckedValues; defaultCheckedValues?: MenuCheckedValues; hasCheckmarks?: boolean; hasIcons?: boolean; onCheckedValueChange?: MenuProps["onCheckedValueChange"] };
export function MenuList({ children, checkedValues, defaultCheckedValues, hasCheckmarks = false, hasIcons = false, onCheckedValueChange, ...props }: MenuListProps): React.ReactElement {
  const parentSelection = React.useContext(MenuSelectionContext);
  const [internalValues, setInternalValues] = React.useState<MenuCheckedValues>(defaultCheckedValues ?? parentSelection?.checkedValues ?? {});
  const currentValues = checkedValues ?? internalValues;
  const selection = React.useMemo<MenuSelectionContextValue | null>(() => {
    if (parentSelection && checkedValues === undefined && defaultCheckedValues === undefined && !onCheckedValueChange) return parentSelection;
    if (!parentSelection && checkedValues === undefined && defaultCheckedValues === undefined && !onCheckedValueChange) return null;
    return {
      checkedValues: currentValues,
      change: (event, name, value, checked, kind) => {
        const previous = currentValues[name] ?? [];
        const nextValues = kind === "radio" ? (checked ? [value] : previous.filter(item => item !== value)) : checked ? [...new Set([...previous, value])] : previous.filter(item => item !== value);
        if (checkedValues === undefined) setInternalValues({ ...currentValues, [name]: nextValues });
        if (parentSelection && (checkedValues !== undefined || defaultCheckedValues !== undefined || onCheckedValueChange)) parentSelection.change(event, name, value, checked, kind);
        onCheckedValueChange?.(event, { name, checkedItems: nextValues });
      }
    };
  }, [parentSelection, checkedValues, defaultCheckedValues, currentValues, onCheckedValueChange]);
  ensureDefined(defineMenuList);
  const list = React.createElement("spui-menu-list", useCustomElementProps({ ...props, "has-checkmarks": hasCheckmarks ? "" : undefined, "has-icons": hasIcons ? "" : undefined }), children);
  return selection ? React.createElement(MenuSelectionContext.Provider, { value: selection }, list) : list;
}
export const MenuSplitGroup = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; orientation?: "horizontal" | "vertical" }>(function MenuSplitGroup({ children, orientation = "horizontal", ...props }: ElementProps & { children?: React.ReactNode; orientation?: "horizontal" | "vertical" }, forwardedRef): React.ReactElement {
  ensureDefined(defineMenuSplitGroup);
  return React.createElement("spui-menu-split-group", useCustomElementProps({ ref: forwardedRef, ...props, orientation }), children);
});

export const MenuDivider = React.forwardRef<HTMLElement, ElementProps>(function MenuDivider(props: ElementProps, forwardedRef): React.ReactElement {
  ensureDefined(defineMenuDivider);
  return React.createElement("spui-menu-divider", useCustomElementProps({ ref: forwardedRef, ...props }));
});

export const MenuGroup = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; label: string }>(function MenuGroup({ children, label, ...props }: ElementProps & { children?: React.ReactNode; label: string }, forwardedRef): React.ReactElement {
  const headerId = React.useId();
  const containsHeader = (nodes: React.ReactNode): boolean => React.Children.toArray(nodes).some(child => {
    if (!React.isValidElement(child)) return false;
    if (child.type === MenuGroupHeader) return true;
    return child.type === React.Fragment && containsHeader((child.props as { children?: React.ReactNode }).children);
  });
  const hasHeader = containsHeader(children);
  ensureDefined(defineMenuGroup);
  const group = React.createElement("spui-menu-group", useCustomElementProps({ ref: forwardedRef, ...props, label, "aria-labelledby": props["aria-labelledby"] ?? (hasHeader ? headerId : undefined), "aria-label": props["aria-label"] ?? (hasHeader ? undefined : label) }), children);
  return React.createElement(MenuGroupHeaderContext.Provider, { value: headerId }, group);
});

export const MenuGroupHeader = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function MenuGroupHeader({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  const headerId = React.useContext(MenuGroupHeaderContext);
  ensureDefined(defineMenuGroupHeader);
  return React.createElement("spui-menu-group-header", useCustomElementProps({ ...props, ref: forwardedRef, id: props.id ?? headerId }), children);
});

export type AvatarProps = ElementProps & { name?: string; image?: string; initials?: string; size?: number | string; shape?: "circular" | "square"; color?: AvatarColor; active?: "active" | "inactive" | "unset"; activeAppearance?: "ring" | "shadow" | "ring-shadow"; idForColor?: string; decorative?: boolean; icon?: React.ReactNode; badge?: React.ReactNode; children?: React.ReactNode };
export const Avatar = React.forwardRef<HTMLElement, AvatarProps>(function Avatar({ name, image, initials, size = 32, shape = "circular", color = "neutral", active, activeAppearance = "ring", idForColor, decorative = false, icon, badge, children, ...props }: AvatarProps, forwardedRef): React.ReactElement {
  ensureDefined(defineAvatar);
  return React.createElement("spui-avatar", useCustomElementProps({ ...props, ref: forwardedRef, name, image, initials, size, shape, color, active: active === "unset" ? undefined : active, "active-appearance": activeAppearance, "id-for-color": idForColor, decorative: decorative || undefined }),
    icon || children ? React.createElement("span", { slot: "icon" }, icon ?? children) : null,
    badge ? React.createElement("span", { slot: "badge" }, badge) : null);
});

export function AvatarGroupProvider({ value, children }: { value: AvatarGroupContextValue; children?: React.ReactNode }): React.ReactElement {
  return React.createElement(AvatarGroupContext.Provider, { value }, React.createElement(AvatarGroupSizeContext.Provider, { value: value.size }, React.createElement(AvatarGroupOverflowContext.Provider, { value: Boolean(value.isOverflow) }, children)));
}

export const AvatarGroup = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; label?: string; maxVisible?: number; layout?: "stack" | "spread" | "pie"; size?: number; expanded?: boolean; showMoreLabel?: string; showLessLabel?: string; onExpandedChange?: (expanded: boolean) => void }>(function AvatarGroup({ children, label, maxVisible = 5, layout, size, expanded, showMoreLabel, showLessLabel, onExpandedChange, ...props }: ElementProps & { children?: React.ReactNode; label?: string; maxVisible?: number; layout?: "stack" | "spread" | "pie"; size?: number; expanded?: boolean; showMoreLabel?: string; showLessLabel?: string; onExpandedChange?: (expanded: boolean) => void }, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const groupContext = React.useContext(AvatarGroupContext);
  const resolvedSize = size ?? groupContext?.size ?? 32;
  const resolvedLayout = layout ?? groupContext?.layout ?? "stack";
  const ref = React.useRef<HTMLElement & { expanded: boolean }>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineAvatarGroup);
  useSpuiEvent(ref, "spui-avatar-group-expanded-change", detail => onExpandedChange?.(Boolean(detail.expanded)));
  React.useLayoutEffect(() => {
    if (ref.current && expanded !== undefined) ref.current.expanded = expanded;
  }, [expanded]);
  return React.createElement(AvatarGroupSizeContext.Provider, { value: resolvedSize }, React.createElement("spui-avatar-group", useCustomElementProps({
    ...props,
    ref,
    label: label ?? context.strings.people ?? "People",
    "max-visible": maxVisible,
    layout: resolvedLayout,
    size: resolvedSize,
    expanded: expanded || undefined,
    "show-more-label": showMoreLabel ?? context.strings.showMorePeople ?? "Show more people ({count})",
    "show-less-label": showLessLabel ?? context.strings.showFewerPeople ?? "Show fewer people",
  }), children));
});

export type AvatarGroupItemAvatarSlot = React.ReactElement | Parameters<typeof Avatar>[0];
export type AvatarGroupItemProps = ElementProps & { name: string; avatar?: AvatarGroupItemAvatarSlot; overflowLabel?: SpanSlotProps; image?: string; initials?: string; size?: number; shape?: "circular" | "square"; color?: AvatarColor; active?: "active" | "inactive" | "unset"; activeAppearance?: "ring" | "shadow" | "ring-shadow"; idForColor?: string; icon?: React.ReactNode; badge?: React.ReactNode };

/** One identity in an AvatarGroup; inside AvatarGroupPopover it renders as a named list row. */
export const AvatarGroupItem = React.forwardRef<HTMLElement, AvatarGroupItemProps>(function AvatarGroupItem({ name, avatar, overflowLabel, image, initials, size, shape = "circular", color = "neutral", active, activeAppearance = "ring", idForColor, icon, badge, ...props }: AvatarGroupItemProps, forwardedRef): React.ReactElement {
  const overflow = React.useContext(AvatarGroupOverflowContext);
  const groupSize = React.useContext(AvatarGroupSizeContext);
  ensureDefined(defineAvatarGroupItem);
  const avatarProps = { name, image, initials, size: size ?? groupSize, shape, color, active: active === "unset" ? undefined : active, "active-appearance": activeAppearance, "id-for-color": idForColor, decorative: overflow || undefined };
  const defaultAvatar = React.createElement("spui-avatar", useCustomElementProps(avatarProps),
    icon == null ? null : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon),
    badge == null ? null : React.createElement("span", { slot: "badge" }, badge));
  const avatarNode = avatar == null ? defaultAvatar
    : React.isValidElement(avatar) ? React.cloneElement(avatar as React.ReactElement<{ slot?: string }>, overflow ? {} : { slot: "avatar" })
      : React.createElement(Avatar, { ...avatarProps, icon, badge, ...avatar, decorative: overflow || undefined, ...(!overflow ? { slot: "avatar" } : {}) } as Parameters<typeof Avatar>[0]);
  const labelNode = renderSpanSlot(overflowLabel ?? name, overflow ? undefined : "overflowLabel");
  if (overflow) {
    ensureDefined(defineAvatar);
    return React.createElement("li", useHostProps({ ...props, role: "listitem", style: { display: "flex", alignItems: "center", gap: 10, minHeight: 40, padding: "6px 8px", borderRadius: "var(--spui-control-radius,4px)", color: "var(--spui-ui-text,var(--spui-semantic-body-text,#242424))", ...props.style } }),
      avatarNode,
      labelNode);
  }
  return React.createElement("spui-avatar-group-item", useCustomElementProps({ ref: forwardedRef, ...props, ...avatarProps }), avatarNode, labelNode);
});

export type AvatarGroupPopoverProps = ElementProps & { children: React.ReactNode; count?: number; indicator?: "count" | "icon"; label?: string; triggerLabel?: string; open?: boolean; placement?: "top" | "bottom" | "start" | "end"; onOpenChange?: (open: boolean) => void; content?: React.ReactElement<React.HTMLAttributes<HTMLUListElement>> | React.HTMLAttributes<HTMLUListElement>; popoverSurface?: React.ReactElement<any> | Parameters<typeof PopoverSurface>[0]; tooltip?: React.ReactElement<any> | Parameters<typeof Tooltip>[0]; triggerButton?: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>> | React.ButtonHTMLAttributes<HTMLButtonElement> };

/** A labelled overflow trigger with a theme-aware people list in the library Popover. */
export function AvatarGroupPopover({ children, count, indicator, label, triggerLabel, open, placement = "bottom", onOpenChange, content, popoverSurface, tooltip, triggerButton, ...props }: AvatarGroupPopoverProps): React.ReactElement {
  const context = React.useContext(UIContext);
  const size = React.useContext(AvatarGroupSizeContext);
  const itemCount = count ?? React.Children.count(children);
  const triggerText = (triggerLabel ?? context.strings.showMorePeople ?? "Show more people ({count})").replace("{count}", String(itemCount));
  const showCount = indicator ?? (size < 24 ? "icon" : "count");
  const defaultTriggerContent = showCount === "icon"
    ? React.createElement("svg", { viewBox: "0 0 16 16", width: 16, height: 16, "aria-hidden": true }, React.createElement("path", { fill: "currentColor", d: "M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5-.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM1 12.2c0-2.2 2.2-3.7 5-3.7s5 1.5 5 3.7v1H1v-1Zm10.5-3.5c2 0 3.5 1.2 3.5 3v1h-2v-.5a4.5 4.5 0 0 0-1.5-3.5Z" }))
    : itemCount > 99 ? "99+" : `+${itemCount}`;
  const triggerElement = React.isValidElement(triggerButton) ? triggerButton as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>> : undefined;
  const triggerProps = (triggerElement ? triggerElement.props : triggerButton ?? {}) as React.ButtonHTMLAttributes<HTMLButtonElement>;
  const triggerNode = triggerElement
    ? React.cloneElement(triggerElement, { type: "button", "aria-label": triggerProps["aria-label"] ?? triggerText, children: triggerProps.children ?? defaultTriggerContent })
    : React.createElement("button", { ...triggerProps, type: "button", "aria-label": triggerProps["aria-label"] ?? triggerText }, triggerProps.children ?? defaultTriggerContent);
  const tooltipElement = React.isValidElement(tooltip) ? tooltip as React.ReactElement<Parameters<typeof Tooltip>[0]> : undefined;
  const tooltipProps = (tooltipElement ? tooltipElement.props : tooltip ?? {}) as Parameters<typeof Tooltip>[0];
  const tooltipNode = tooltipElement
    ? React.cloneElement(tooltipElement, { children: triggerNode })
    : React.createElement(Tooltip, { ...tooltipProps, content: tooltipProps.content ?? triggerText, relationship: tooltipProps.relationship ?? "label" }, triggerNode);
  const listChildren = React.isValidElement(content) ? content.props.children ?? children : children;
  const contentElement = React.isValidElement(content) ? content as React.ReactElement<React.HTMLAttributes<HTMLUListElement>> : undefined;
  const contentProps = (contentElement ? contentElement.props : content ?? {}) as React.HTMLAttributes<HTMLUListElement>;
  const listContent = contentElement
    ? React.cloneElement(contentElement, { role: contentElement.props.role ?? "list", children: React.createElement(AvatarGroupOverflowContext.Provider, { value: true }, listChildren) })
    : React.createElement("ul", { ...contentProps, role: contentProps.role ?? "list" }, React.createElement(AvatarGroupOverflowContext.Provider, { value: true }, listChildren));
  const surfaceElement = React.isValidElement(popoverSurface) ? popoverSurface as React.ReactElement<React.HTMLAttributes<HTMLDivElement>> : undefined;
  const surfaceProps = (surfaceElement ? surfaceElement.props : popoverSurface ?? {}) as React.HTMLAttributes<HTMLDivElement>;
  const surfaceContent = surfaceElement
    ? React.cloneElement(surfaceElement, { "aria-label": surfaceProps["aria-label"] ?? "Overflow", tabIndex: surfaceProps.tabIndex ?? 0, children: listContent })
    : React.createElement(PopoverSurface, { ...surfaceProps, "aria-label": surfaceProps["aria-label"] ?? "Overflow", tabIndex: surfaceProps.tabIndex ?? 0 }, listContent);
  return React.createElement(Popover, {
    ...props,
    label: label ?? context.strings.people ?? "More people",
    placement,
    open,
    trapFocus: true,
    trigger: tooltipNode,
    onOpenChange: (_event, data) => onOpenChange?.(data.open),
  }, surfaceContent);
}

export const Persona = React.forwardRef<HTMLElement, ElementProps & { name: string; image?: string; initials?: string; primaryText?: React.ReactNode; secondaryText?: React.ReactNode; tertiaryText?: React.ReactNode; quaternaryText?: React.ReactNode; presence?: PersonaPresence; presenceLabel?: string; size?: PersonaSize; color?: AvatarColor; textPosition?: "after" | "before" | "below"; textAlignment?: "start" | "center"; presenceOnly?: boolean; avatar?: React.ReactNode; children?: React.ReactNode }>(function Persona({ name, image, initials, primaryText, secondaryText, tertiaryText, quaternaryText, presence, presenceLabel, size = "medium", color = "neutral", textPosition = "after", textAlignment = "start", presenceOnly = false, avatar, children, ...props }: ElementProps & { name: string; image?: string; initials?: string; primaryText?: React.ReactNode; secondaryText?: React.ReactNode; tertiaryText?: React.ReactNode; quaternaryText?: React.ReactNode; presence?: PersonaPresence; presenceLabel?: string; size?: PersonaSize; color?: AvatarColor; textPosition?: "after" | "before" | "below"; textAlignment?: "start" | "center"; presenceOnly?: boolean; avatar?: React.ReactNode; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(definePersona);
  const textSlot = (node: React.ReactNode, slot: "primary-text" | "secondary-text" | "tertiary-text" | "quaternary-text"): React.ReactNode => node == null ? null : React.isValidElement(node)
    ? React.cloneElement(node as React.ReactElement<{ slot?: string }>, { slot })
    : React.createElement("span", { slot }, node);
  return React.createElement("spui-persona", useCustomElementProps({ ref: forwardedRef, ...props, name, image, initials, "secondary-text": typeof secondaryText === "string" ? secondaryText : undefined, "tertiary-text": typeof tertiaryText === "string" ? tertiaryText : undefined, presence, "presence-label": presenceLabel, size, color, "text-position": textPosition, "text-alignment": textAlignment, "presence-only": presenceOnly || undefined }),
    textSlot(primaryText, "primary-text"), textSlot(secondaryText, "secondary-text"), textSlot(tertiaryText, "tertiary-text"), textSlot(quaternaryText, "quaternary-text"),
    avatar === undefined ? null : React.createElement("span", { slot: "avatar" }, avatar),
    children === undefined ? null : React.createElement("span", { slot: "details" }, children));
});

export type VirtualListScrollToHandle = { scrollTo: (index: number, align?: "start" | "center" | "end", behavior?: ScrollBehavior) => void };

export type VirtualizerSlotProps = React.ReactElement<any> | React.HTMLAttributes<HTMLDivElement>;
export type VirtualizerBookendSlots = { before?: VirtualizerSlotProps; after?: VirtualizerSlotProps; beforeContainer?: VirtualizerSlotProps; afterContainer?: VirtualizerSlotProps };
export type VirtualListProps<T> = ElementProps & VirtualizerBookendSlots & { items?: T[]; itemCount?: number; dataSource?: VirtualListDataSource<T>; onDataLoadError?: (error: unknown, range: { start: number; end: number }) => void; renderItem: (item: T | undefined, index: number) => React.ReactNode; itemKey?: (item: T | undefined, index: number) => string | number; onRenderedRange?: (range: { start: number; end: number; total: number }) => void; onScrollStateChange?: (scrolling: boolean) => void; viewportRef?: React.Ref<HTMLDivElement>; scrollToIndexRef?: React.RefObject<VirtualListScrollToHandle | null>; virtualizerLength?: number; label?: string; rowHeight?: number; measureItems?: boolean; overscan?: number; axis?: "vertical" | "horizontal"; scrollMode?: "element" | "window" };
type VirtualListEngineProps<T> = VirtualListProps<T> & { onScrollOffsetChange?: (offset: number) => void; gap?: number; itemSizes?: readonly number[]; reversed?: boolean; enablePagination?: boolean };
function renderVirtualizerSlot(slot: VirtualizerSlotProps | undefined, name: "before" | "after"): React.ReactElement {
  const customElement = React.isValidElement(slot);
  const slotProps = (customElement ? slot.props : slot ?? {}) as React.HTMLAttributes<HTMLDivElement>;
  const props = { ...slotProps, "data-spui-virtualizer-slot": name };
  return customElement ? React.cloneElement(slot as React.ReactElement<any>, props) : React.createElement("div", props);
}

function renderVirtualizerBookend(container: VirtualizerSlotProps | undefined, content: React.ReactNode, side: "before" | "after", offset: number, axis: "vertical" | "horizontal", rtl: boolean): React.ReactElement {
  const customElement = React.isValidElement(container);
  const slotProps = (customElement ? container.props : container ?? {}) as React.HTMLAttributes<HTMLDivElement>;
  const style: React.CSSProperties = axis === "horizontal"
    ? { position: "absolute", insetBlock: 0, insetInlineStart: 0, inlineSize: "1px", transform: `translateX(${rtl ? -offset : offset}px)`, ...slotProps.style }
    : { position: "absolute", insetInline: 0, insetBlockStart: offset, blockSize: "1px", ...slotProps.style };
  const props = { role: "presentation", ...slotProps, style, "data-spui-virtualizer-container": side };
  return customElement ? React.cloneElement(container as React.ReactElement<any>, props, content) : React.createElement("div", props, content);
}

function VirtualListEngine<T>({ items, itemCount, dataSource, onDataLoadError, renderItem, itemKey, onRenderedRange, onScrollStateChange, onScrollOffsetChange, viewportRef, scrollToIndexRef, virtualizerLength, label, rowHeight = 40, measureItems = false, overscan = 4, axis = "vertical", scrollMode = "element", gap: requestedGap = 0, itemSizes, reversed = false, enablePagination = false, before, after, beforeContainer, afterContainer, ...props }: VirtualListEngineProps<T>): React.ReactElement {
  const strings = React.useContext(UIContext).strings;
  const accessibleLabel = label ?? strings.virtualizerLabel ?? "Items";
  const horizontal = axis === "horizontal";
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [viewportSize, setViewportSize] = React.useState(320);
  const [viewportReady, setViewportReady] = React.useState(false);
  const frame = React.useRef(0);
  const scrollTimer = React.useRef<number | undefined>(undefined);
  const paginationTimer = React.useRef<number | undefined>(undefined);
  const lastPaginationPosition = React.useRef(0);
  const lastPaginationIndex = React.useRef(0);
  const viewport = React.useRef<HTMLDivElement | null>(null);
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const windowScroll = scrollMode === "window" && !horizontal;
  const getOffset = React.useCallback((element: HTMLDivElement): number => windowScroll
    ? Math.max(0, -element.getBoundingClientRect().top)
    : horizontal ? Math.abs(element.scrollLeft) : element.scrollTop, [windowScroll, horizontal]);
  const onWindowScroll = React.useCallback(() => {
    const element = viewport.current;
    if (!element) return;
    const offset = getOffset(element);
    onScrollOffsetChange?.(offset);
    onScrollStateChange?.(true);
    window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => onScrollStateChange?.(false), 100);
    if (!frame.current) frame.current = requestAnimationFrame(() => { frame.current = 0; setScrollOffset(getOffset(element)); });
  }, [getOffset, onScrollOffsetChange, onScrollStateChange]);
  const heightIndex = React.useRef<VariableSizeIndex | null>(null);
  const resizeObserver = React.useRef<ResizeObserver | null>(null);
  const pendingAnchorAdjustment = React.useRef(0);
  const lastItemMeasured = React.useRef(false);
  const [measureVersion, setMeasureVersion] = React.useState(0);
  const [, setDataSourceVersion] = React.useState(0);
  const [sourceRevision, setSourceRevision] = React.useState(0);
  const [dataLoading, setDataLoading] = React.useState(false);
  const dataRequestActive = React.useRef(false);
  const dataLoadErrorRef = React.useRef(onDataLoadError);
  dataLoadErrorRef.current = onDataLoadError;
  const gap = Number.isFinite(requestedGap) ? Math.max(0, requestedGap) : 0;
  const measurementInput = React.useRef({ total: -1, rowHeight: -1, items: items as T[] | undefined, itemSizes, axis, gap });
  React.useEffect(() => () => { cancelAnimationFrame(frame.current); window.clearTimeout(scrollTimer.current); window.clearTimeout(paginationTimer.current); }, []);
  React.useLayoutEffect(() => {
    if (!viewport.current) return;
    const element = viewport.current;
    const resize = () => { setViewportSize((windowScroll ? window.innerHeight : horizontal ? element.clientWidth : element.clientHeight) || 320); setViewportReady(true); if (windowScroll) setScrollOffset(getOffset(element)); };
    resize();
    if (windowScroll) {
      window.addEventListener("scroll", onWindowScroll, { passive: true });
      window.addEventListener("resize", resize);
      return () => { window.removeEventListener("scroll", onWindowScroll); window.removeEventListener("resize", resize); };
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [horizontal, windowScroll, getOffset]);
  rowHeight = Number.isFinite(rowHeight) && rowHeight > 0 ? rowHeight : 40;
  overscan = Number.isFinite(overscan) ? Math.max(0, Math.min(50, Math.floor(overscan))) : 4;
  const sourceLength = dataSource?.length;
  const total = dataSource ? (Number.isFinite(sourceLength) ? Math.max(0, Math.floor(sourceLength!)) : 0) : items?.length ?? (Number.isFinite(itemCount) ? Math.max(0, Math.floor(itemCount!)) : 0);
  if (!heightIndex.current) heightIndex.current = new VariableSizeIndex(total, rowHeight);
  if (measurementInput.current.total !== total || measurementInput.current.rowHeight !== rowHeight || measurementInput.current.axis !== axis || measurementInput.current.gap !== gap || measurementInput.current.itemSizes !== itemSizes || (items && measurementInput.current.items !== items)) {
    heightIndex.current.reset(total, rowHeight + gap, itemSizes);
    lastItemMeasured.current = false;
    measurementInput.current = { total, rowHeight, items, itemSizes, axis, gap };
  }
  if (Number.isFinite(virtualizerLength) && virtualizerLength! > 0) overscan = Math.min(50, Math.max(0, Math.floor((virtualizerLength! - Math.ceil(viewportSize / rowHeight)) / 2)));
  const resolvedAccessibleLabel = typeof props["aria-label"] === "string" ? props["aria-label"] : accessibleLabel;
  const rtl = horizontal && (viewport.current ? getComputedStyle(viewport.current).direction === "rtl" : props.dir === "rtl");
  const previousLayout = React.useRef({ axis, rtl });
  React.useLayoutEffect(() => {
    const previous = previousLayout.current;
    previousLayout.current = { axis, rtl };
    const element = viewport.current;
    if (!element) return;
    if (previous.axis !== axis) {
      element.scrollTop = 0;
      element.scrollLeft = 0;
      setScrollOffset(0);
    } else if (horizontal && previous.rtl !== rtl) {
      const offset = Math.abs(element.scrollLeft);
      element.scrollLeft = rtl ? -offset : offset;
      setScrollOffset(offset);
    }
    setViewportSize((windowScroll ? window.innerHeight : horizontal ? element.clientWidth : element.clientHeight) || 320);
  }, [axis, horizontal, rtl, windowScroll]);
  const totalSize = measureItems ? Math.max(0, heightIndex.current.totalSize - (total && !itemSizes && !lastItemMeasured.current ? gap : 0)) : total * rowHeight + Math.max(0, total - 1) * gap;
  const indexOffset = (index: number): number => {
    const normalOffset = measureItems ? heightIndex.current!.offset(index) : index * (rowHeight + gap);
    if (!reversed) return normalOffset;
    const itemSize = measureItems ? Math.max(0, heightIndex.current!.size(index) - (index < total - 1 ? gap : 0)) : rowHeight;
    return Math.max(0, totalSize - normalOffset - itemSize);
  };
  const logicalScrollStart = reversed ? Math.max(0, totalSize - scrollOffset - viewportSize) : scrollOffset;
  const logicalScrollEnd = reversed ? Math.max(0, totalSize - scrollOffset) : scrollOffset + viewportSize;
  const firstVisible = measureItems ? heightIndex.current.indexAt(logicalScrollStart) : Math.floor(logicalScrollStart / (rowHeight + gap));
  const lastVisible = measureItems ? heightIndex.current.indexAt(logicalScrollEnd) + 1 : Math.ceil(logicalScrollEnd / (rowHeight + gap));
  const first = Math.max(0, firstVisible - overscan);
  const last = Math.min(total, lastVisible + overscan);
  const beforeOffset = measureItems ? heightIndex.current.offset(first) : first * (rowHeight + gap);
  const afterOffset = last >= total ? totalSize : measureItems ? heightIndex.current.offset(last) : last * (rowHeight + gap);
  const needsLoad = Boolean(dataSource && Array.from({ length: Math.max(0, last - first) }, (_, offset) => dataSource.getItem(first + offset)).some(item => item === undefined));
  React.useEffect(() => dataSource?.subscribe?.(() => { setDataSourceVersion(version => version + 1); if (!dataRequestActive.current) setSourceRevision(version => version + 1); }), [dataSource]);
  React.useEffect(() => {
    if (!viewportReady || !dataSource || !needsLoad || first >= last) { setDataLoading(false); return; }
    const controller = new AbortController(); let active = true;
    dataRequestActive.current = true;
    setDataLoading(true);
    Promise.resolve().then(() => dataSource.loadRange(first, last, controller.signal)).then(
      () => {
        if (!active) return;
        const stillMissing = Array.from({ length: last - first }, (_, offset) => dataSource.getItem(first + offset)).some(item => item === undefined);
        if (stillMissing) dataLoadErrorRef.current?.(new Error("loadRange resolved before every requested item was available"), { start: first, end: last });
        else setDataSourceVersion(version => version + 1);
      },
      error => { if (active && !controller.signal.aborted) dataLoadErrorRef.current?.(error, { start: first, end: last }); },
    ).finally(() => { if (active) { dataRequestActive.current = false; setDataLoading(false); } });
    return () => { active = false; dataRequestActive.current = false; controller.abort(); };
  }, [dataSource, first, last, needsLoad, sourceRevision, viewportReady]);
  const totalHeight = totalSize;
  React.useLayoutEffect(() => {
    if (!measureItems || !viewport.current) return;
    const element = viewport.current;
    const observer = new ResizeObserver(entries => {
      const offset = getOffset(element);
      const anchorIndex = heightIndex.current!.indexAt(reversed ? Math.max(0, totalSize - offset - (windowScroll ? window.innerHeight : horizontal ? element.clientWidth : element.clientHeight)) : offset);
      const scrollExtent = horizontal ? element.scrollWidth : totalSize;
      const viewportExtent = windowScroll ? window.innerHeight : horizontal ? element.clientWidth : element.clientHeight;
      const anchoredAtEnd = offset >= Math.max(0, scrollExtent - viewportExtent - rowHeight);
      let changed = false, adjustment = 0;
      for (const entry of entries) {
        const index = Number((entry.target as HTMLElement).dataset.spuiVirtualIndex);
        if (!Number.isInteger(index)) continue;
        if (index === total - 1) lastItemMeasured.current = true;
        const rect = (entry.target as HTMLElement).getBoundingClientRect();
        const measuredSize = horizontal ? rect.width : rect.height;
        const delta = heightIndex.current!.set(index, measuredSize + (index < total - 1 ? gap : 0));
        if (delta) { changed = true; if (anchoredAtEnd || (reversed ? index > anchorIndex : index < anchorIndex)) adjustment += delta; }
      }
      if (changed) {
        if (adjustment) pendingAnchorAdjustment.current += adjustment;
        setScrollOffset(getOffset(element));
        setMeasureVersion(version => version + 1);
      }
    });
    resizeObserver.current = observer;
    return () => { observer.disconnect(); resizeObserver.current = null; };
  }, [measureItems, horizontal, rtl, total, gap, reversed, totalSize, getOffset, windowScroll]);
  React.useLayoutEffect(() => {
    if (!measureItems || !resizeObserver.current || !viewport.current) return;
    viewport.current.querySelectorAll<HTMLElement>("[data-spui-virtual-row]").forEach(row => resizeObserver.current?.observe(row));
  }, [measureItems, first, last, total, measureVersion]);
  React.useLayoutEffect(() => {
    const element = viewport.current;
    const adjustment = pendingAnchorAdjustment.current;
    if (!measureItems || !element || !adjustment) return;
    pendingAnchorAdjustment.current = 0;
    if (windowScroll) window.scrollBy(0, adjustment);
    else if (horizontal) element.scrollLeft += rtl ? -adjustment : adjustment;
    else element.scrollTop += adjustment;
    const offset = getOffset(element);
    onScrollOffsetChange?.(offset);
    setScrollOffset(offset);
  }, [measureVersion, measureItems, horizontal, rtl, windowScroll, getOffset, onScrollOffsetChange]);
  const scrollHandle = React.useMemo<VirtualListScrollToHandle>(() => ({
    scrollTo: (index, align = "start", behavior = "auto") => {
      const element = viewport.current;
      if (!element || !total) return;
      const safeIndex = Math.max(0, Math.min(total - 1, Math.floor(index)));
      const offset = indexOffset(safeIndex);
      const size = measureItems ? Math.max(0, heightIndex.current!.size(safeIndex) - (safeIndex < total - 1 ? gap : 0)) : rowHeight;
      const viewportLength = windowScroll ? window.innerHeight : horizontal ? element.clientWidth : element.clientHeight;
      const destination = align === "center" ? offset - (viewportLength - size) / 2 : align === "end" ? offset - viewportLength + size : offset;
      if (windowScroll && hostRef.current) {
        const documentTop = hostRef.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, documentTop + destination), behavior });
      } else if (horizontal) element.scrollTo({ left: rtl ? -Math.max(0, destination) : Math.max(0, destination), behavior });
      else element.scrollTo({ top: Math.max(0, destination), behavior });
      const nextOffset = getOffset(element);
      onScrollOffsetChange?.(nextOffset);
      setScrollOffset(nextOffset);
    },
  }), [measureItems, rowHeight, total, horizontal, rtl, gap, reversed, totalSize, onScrollOffsetChange, getOffset, windowScroll]);
  React.useLayoutEffect(() => {
    if (scrollToIndexRef) (scrollToIndexRef as React.MutableRefObject<VirtualListScrollToHandle | null>).current = scrollHandle;
    return () => { if (scrollToIndexRef?.current === scrollHandle) (scrollToIndexRef as React.MutableRefObject<VirtualListScrollToHandle | null>).current = null; };
  }, [scrollHandle, scrollToIndexRef]);
  React.useEffect(() => onRenderedRange?.({ start: first, end: last, total }), [first, last, total, onRenderedRange]);
  const host = useHostProps(props);
  return <div {...host} ref={hostRef}>
    <div ref={node => { viewport.current = node; if (typeof viewportRef === "function") viewportRef(node); else if (viewportRef) (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node; }} role="list" aria-label={resolvedAccessibleLabel} tabIndex={0}
      onScroll={event => {
        if (windowScroll) return;
        const element = event.currentTarget;
        const offset = horizontal ? Math.abs(element.scrollLeft) : element.scrollTop;
        onScrollOffsetChange?.(offset);
        onScrollStateChange?.(true);
        window.clearTimeout(scrollTimer.current);
        scrollTimer.current = window.setTimeout(() => onScrollStateChange?.(false), 100);
        if (enablePagination) {
          window.clearTimeout(paginationTimer.current);
          paginationTimer.current = window.setTimeout(() => {
            if (!viewport.current || viewport.current !== element) return;
            const position = horizontal ? Math.abs(element.scrollLeft) : element.scrollTop;
            const closest = measureItems ? heightIndex.current!.indexAt(position) : Math.round(position / (rowHeight + gap));
            const direction = position >= lastPaginationPosition.current ? 1 : -1;
            const index = Math.max(0, Math.min(total - 1, closest === lastPaginationIndex.current && position !== lastPaginationPosition.current ? closest + direction : closest));
            const target = indexOffset(index);
            if (horizontal) element.scrollTo({ left: rtl ? -target : target, behavior: "smooth" }); else element.scrollTo({ top: target, behavior: "smooth" });
            lastPaginationPosition.current = target;
            lastPaginationIndex.current = index;
          }, 100);
        }
        if (!frame.current) frame.current = requestAnimationFrame(() => { frame.current = 0; setScrollOffset(offset); });
      }}
      aria-busy={dataLoading || undefined} style={{ ...props.style, position: "relative", overflow: windowScroll ? "visible" : "auto", width: horizontal ? "var(--spui-list-width,320px)" : undefined, height: windowScroll ? totalSize : horizontal ? rowHeight : props.style?.height ?? "var(--spui-list-height,320px)", overscrollBehavior: "contain" }}>
      <div style={{ position: "relative", width: horizontal ? totalHeight : "100%", height: horizontal ? "100%" : totalHeight }}>
        {renderVirtualizerBookend(beforeContainer, renderVirtualizerSlot(before, "before"), "before", beforeOffset, axis, rtl)}
        {Array.from({ length: Math.max(0, last - first) }, (_, offset) => {
          const index = first + offset;
          const item = dataSource ? dataSource.getItem(index) : items?.[index];
          const itemOffset = indexOffset(index);
          const itemStyle: React.CSSProperties = horizontal
            ? { boxSizing: "border-box", position: "absolute", insetInlineStart: 0, top: 0, minWidth: rowHeight, width: measureItems ? "auto" : rowHeight, height: "100%", transform: `translateX(${rtl ? -itemOffset : itemOffset}px)`, display: "flex", alignItems: "center", paddingBlock: "var(--spui-list-row-padding,12px)", borderInlineEnd: "1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#edebe9))" }
            : { boxSizing: "border-box", position: "absolute", insetInline: 0, top: 0, minHeight: rowHeight, height: measureItems ? "auto" : rowHeight, transform: `translateY(${itemOffset}px)`, display: "flex", alignItems: "center", paddingInline: "var(--spui-list-row-padding,12px)", borderBlockEnd: "1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#edebe9))" };
          return <div key={itemKey ? itemKey(item, index) : index} data-spui-virtual-row="" data-spui-virtual-index={index} role="listitem" aria-posinset={index + 1} aria-setsize={total}
            style={itemStyle}>
            {renderItem(item as T, index)}
          </div>;
        })}
        {renderVirtualizerBookend(afterContainer, renderVirtualizerSlot(after, "after"), "after", afterOffset, axis, rtl)}
      </div>
    </div>
  </div>;
}

export function VirtualList<T>({ items, itemCount, dataSource, onDataLoadError, renderItem, itemKey, onRenderedRange, onScrollStateChange, viewportRef, scrollToIndexRef, virtualizerLength, label, rowHeight = 40, measureItems = false, overscan = 4, axis = "vertical", ...props }: ElementProps & { items?: T[]; itemCount?: number; dataSource?: VirtualListDataSource<T>; onDataLoadError?: (error: unknown, range: { start: number; end: number }) => void; renderItem: (item: T | undefined, index: number) => React.ReactNode; itemKey?: (item: T | undefined, index: number) => string | number; onRenderedRange?: (range: { start: number; end: number; total: number }) => void; onScrollStateChange?: (scrolling: boolean) => void; viewportRef?: React.Ref<HTMLDivElement>; scrollToIndexRef?: React.RefObject<VirtualListScrollToHandle | null>; virtualizerLength?: number; label?: string; rowHeight?: number; measureItems?: boolean; overscan?: number; axis?: "vertical" | "horizontal"; scrollMode?: "element" | "window" }): React.ReactElement {
  return React.createElement(VirtualListEngine<T>, { ...props, items, itemCount, dataSource, onDataLoadError, renderItem, itemKey, onRenderedRange, onScrollStateChange, viewportRef, scrollToIndexRef, virtualizerLength, label, rowHeight, measureItems, overscan, axis });
}

export type VirtualizerChildRenderFunction = (index: number, isScrolling: boolean) => React.ReactNode;
export type VirtualizerScrollToHandle = { scrollTo: (index: number, behavior?: ScrollBehavior, callback?: (index: number) => void) => void; virtualizerLength: React.RefObject<number>; currentIndex: React.RefObject<number | undefined> };
export type VirtualizerDataRef = { progressiveSizes: React.RefObject<number[]>; nodeSizes: React.RefObject<number[]>; setFlaggedIndex: (index: number | null) => void; currentIndex: React.RefObject<number> };
export type ScrollToInterface = VirtualizerScrollToHandle;
export type VirtualizerContextProps = { contextIndex: number; setContextIndex: (index: number) => void; childProgressiveSizes?: React.MutableRefObject<number[]> };
export type DynamicVirtualizerContextProps = Required<VirtualizerContextProps>;
const VirtualizerContext = React.createContext<VirtualizerContextProps>({ contextIndex: 0, setContextIndex: () => undefined });
export function useVirtualizerContext(): VirtualizerContextProps { return React.useContext(VirtualizerContext); }
export const useVirtualizerContext_unstable = useVirtualizerContext;
export const VirtualizerContextProvider = VirtualizerContext.Provider;

/** Fixed or measured one-dimensional virtualization over the bounded VirtualList renderer. */
export function Virtualizer({ children, numItems, itemSize, virtualizerLength = 24, bufferItems, bufferSize, containerSizeRef, getItemSize, gap = 0, reversed = false, updateScrollPosition, virtualizerContext, axis = "vertical", measureItems = false, enableScrollLoad = false, enablePagination = false, flaggedIndex, onRenderedFlaggedIndex, onRenderedRange: onRenderedRangeChange, imperativeVirtualizerRef, imperativeRef, scrollViewRef, label, scrollMode = "element", before, after, beforeContainer, afterContainer, ...props }: Omit<ElementProps, "children"> & { children: VirtualizerChildRenderFunction; numItems: number; itemSize: number; virtualizerLength?: number; bufferItems?: number; bufferSize?: number; containerSizeRef?: React.RefObject<number>; getItemSize?: (index: number) => number; gap?: number; reversed?: boolean; updateScrollPosition?: (position: number) => void; virtualizerContext?: VirtualizerContextProps; axis?: "vertical" | "horizontal"; scrollMode?: "element" | "window"; measureItems?: boolean; enableScrollLoad?: boolean; enablePagination?: boolean; flaggedIndex?: React.MutableRefObject<number | null>; onRenderedFlaggedIndex?: (index: number) => void; onRenderedRange?: (range: { start: number; end: number; total: number }) => void; imperativeVirtualizerRef?: React.RefObject<VirtualizerDataRef | null>; imperativeRef?: React.RefObject<VirtualizerScrollToHandle | null>; scrollViewRef?: React.MutableRefObject<HTMLElement | null>; label?: string } & VirtualizerBookendSlots): React.ReactElement {
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [internalContextIndex, setInternalContextIndex] = React.useState(virtualizerContext?.contextIndex ?? 0);
  const viewport = React.useRef<HTMLDivElement | null>(null);
  const currentIndex = React.useRef(0);
  const internalFlaggedIndex = React.useRef<number | null>(null);
  const progressiveSizesRef = React.useRef<number[]>([]);
  const nodeSizesRef = React.useRef<number[]>([]);
  const listScrollHandle = React.useRef<VirtualListScrollToHandle | null>(null);
  const length = React.useRef(Math.max(0, Math.floor(virtualizerLength)));
  const reportedFlag = React.useRef<number | null>(null);
  const safeItemSize = Number.isFinite(itemSize) && itemSize > 0 ? itemSize : 1;
  const safeGap = Number.isFinite(gap) ? Math.max(0, gap) : 0;
  const dynamicSizeCache = React.useRef<{ getItemSize?: (index: number) => number; numItems: number; itemSize: number; gap: number; values: Map<number, number> }>({ getItemSize, numItems, itemSize: safeItemSize, gap: safeGap, values: new Map() });
  if (dynamicSizeCache.current.getItemSize !== getItemSize || dynamicSizeCache.current.numItems !== numItems || dynamicSizeCache.current.itemSize !== safeItemSize || dynamicSizeCache.current.gap !== safeGap) {
    dynamicSizeCache.current = { getItemSize, numItems, itemSize: safeItemSize, gap: safeGap, values: new Map() };
  }
  // Keep dynamic sizing proportional to rendered rows. The renderer supplies each
  // visible row's estimate and ResizeObserver refines its prefix-sum entry lazily.
  // A caller explicitly requesting the legacy progressive-size array opts into its
  // full materialization because that public contract requires every prefix value.
  const progressiveSizes = React.useMemo(() => {
    if (!getItemSize || !virtualizerContext?.childProgressiveSizes) return undefined;
    let total = 0;
    return Array.from({ length: Math.max(0, Math.floor(numItems)) }, (_, index) => {
      const size = getItemSize(index);
      total += (Number.isFinite(size) && size > 0 ? size : safeItemSize) + (index < numItems - 1 ? safeGap : 0);
      return total;
    });
  }, [getItemSize, numItems, safeItemSize, safeGap, virtualizerContext?.childProgressiveSizes]);
  React.useLayoutEffect(() => {
    if (progressiveSizes && virtualizerContext?.childProgressiveSizes) virtualizerContext.childProgressiveSizes.current = progressiveSizes;
  }, [progressiveSizes, virtualizerContext]);
  const contextValue = virtualizerContext ?? { contextIndex: internalContextIndex, setContextIndex: setInternalContextIndex };
  React.useLayoutEffect(() => {
    if (!containerSizeRef || !viewport.current) return;
    const element = viewport.current;
    const sizeRef = containerSizeRef as React.MutableRefObject<number>;
    const update = (): void => { sizeRef.current = axis === "horizontal" ? element.clientWidth : element.clientHeight; };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [axis, containerSizeRef]);
  const pixelBufferItems = bufferSize === undefined ? undefined : Math.ceil(Math.max(0, bufferSize) / safeItemSize);
  const renderBufferItems = bufferItems ?? pixelBufferItems;
  const handle = React.useMemo<VirtualizerScrollToHandle>(() => ({
    scrollTo: (index, behavior = "auto", callback) => {
      const element = viewport.current;
      const safeIndex = Math.max(0, Math.min(Math.max(0, numItems - 1), Math.floor(index)));
      if (element && numItems > 0) {
        currentIndex.current = safeIndex;
        if (listScrollHandle.current) listScrollHandle.current.scrollTo(safeIndex, "start", behavior);
        else {
          const totalSize = numItems * safeItemSize + Math.max(0, numItems - 1) * safeGap;
          const normalOffset = safeIndex * (safeItemSize + safeGap);
          const rowSize = safeItemSize;
          const offset = Math.max(0, reversed ? totalSize - normalOffset - rowSize : normalOffset);
          const applyScroll = (): void => {
            if (viewport.current !== element) return;
            if (axis === "horizontal") { const rtl = getComputedStyle(element).direction === "rtl"; element.scrollTo({ left: rtl ? -offset : offset, behavior }); }
            else element.scrollTo({ top: offset, behavior });
            updateScrollPosition?.(axis === "horizontal" ? Math.abs(element.scrollLeft) : element.scrollTop);
          };
          applyScroll();
        }
        if (callback) behavior === "smooth" ? element.addEventListener("scrollend", () => callback(safeIndex), { once: true }) : callback(safeIndex);
      }
    },
    virtualizerLength: length,
    currentIndex,
  }), [axis, safeItemSize, numItems, safeGap, reversed, updateScrollPosition]);
  const dataRef = React.useMemo<VirtualizerDataRef>(() => ({
    progressiveSizes: progressiveSizesRef,
    nodeSizes: nodeSizesRef,
    setFlaggedIndex: index => { internalFlaggedIndex.current = index; if (flaggedIndex) flaggedIndex.current = index; reportedFlag.current = null; },
    currentIndex,
  }), [flaggedIndex]);
  React.useLayoutEffect(() => {
    length.current = Math.max(0, Math.floor(virtualizerLength));
    if (imperativeRef) (imperativeRef as React.MutableRefObject<VirtualizerScrollToHandle | null>).current = handle;
    if (imperativeVirtualizerRef) (imperativeVirtualizerRef as React.MutableRefObject<VirtualizerDataRef | null>).current = dataRef;
    return () => {
      if (imperativeRef?.current === handle) (imperativeRef as React.MutableRefObject<VirtualizerScrollToHandle | null>).current = null;
      if (imperativeVirtualizerRef?.current === dataRef) (imperativeVirtualizerRef as React.MutableRefObject<VirtualizerDataRef | null>).current = null;
    };
  }, [handle, dataRef, imperativeRef, imperativeVirtualizerRef, virtualizerLength]);
  React.useLayoutEffect(() => {
    if (!imperativeVirtualizerRef) return;
    let total = 0;
    const count = Math.max(0, Math.floor(numItems));
    nodeSizesRef.current.length = count;
    progressiveSizesRef.current.length = count;
    for (let index = 0; index < count; index++) {
      const estimated = getItemSize?.(index) ?? safeItemSize;
      const size = dynamicSizeCache.current.values.get(index) ?? (Number.isFinite(estimated) && estimated > 0 ? estimated : safeItemSize);
      nodeSizesRef.current[index] = size;
      total += size + (index < count - 1 ? safeGap : 0);
      progressiveSizesRef.current[index] = total;
    }
  }, [imperativeVirtualizerRef, numItems, getItemSize, safeItemSize, safeGap]);
  const onRenderedRange = React.useCallback((range: { start: number; end: number; total: number }): void => {
    currentIndex.current = range.start;
    if (contextValue.contextIndex !== range.start) contextValue.setContextIndex(range.start);
    onRenderedRangeChange?.(range);
    const index = flaggedIndex?.current ?? internalFlaggedIndex.current;
    if (index != null && index >= range.start && index < range.end && reportedFlag.current !== index) {
      reportedFlag.current = index;
      onRenderedFlaggedIndex?.(index);
    }
  }, [contextValue, onRenderedRangeChange, flaggedIndex, onRenderedFlaggedIndex]);
  const list = React.createElement(VirtualListEngine<undefined>, {
    ...props,
    itemCount: numItems,
    renderItem: (_item, index) => {
      const content = children(index, enableScrollLoad && isScrolling);
      if (!getItemSize) return content;
      let size = dynamicSizeCache.current.values.get(index);
      if (size === undefined) {
        const requestedSize = getItemSize(index);
        size = Number.isFinite(requestedSize) && requestedSize > 0 ? requestedSize : safeItemSize;
        dynamicSizeCache.current.values.set(index, size);
      }
      const contentSize = Math.max(0, size - 1); // The virtual row contributes a one-pixel separator to its measured box.
      return <div style={axis === "horizontal" ? { width: contentSize, minWidth: contentSize, flex: "none" } : { height: contentSize, minHeight: contentSize, flex: "none" }}>{content}</div>;
    },
    label,
    before, after, beforeContainer, afterContainer,
    rowHeight: safeItemSize,
    axis,
    measureItems: measureItems || Boolean(getItemSize),
    gap: safeGap,
    reversed,
    overscan: renderBufferItems ?? 4,
    virtualizerLength: renderBufferItems === undefined ? virtualizerLength : undefined,
    onRenderedRange,
    scrollToIndexRef: listScrollHandle,
    onScrollStateChange: enableScrollLoad ? setIsScrolling : undefined,
    onScrollOffsetChange: updateScrollPosition,
    scrollMode,
    enablePagination,
    viewportRef: node => { viewport.current = node; if (scrollViewRef) scrollViewRef.current = node; },
  });
  return React.createElement(VirtualizerContext.Provider, { value: contextValue }, list);
}

type ScrollViewBaseProps = Omit<ElementProps, "children"> & {
  children: VirtualizerChildRenderFunction;
  itemSize: number;
  numItems: number;
  virtualizerLength?: number;
  bufferItems?: number;
  bufferSize?: number;
  scrollViewRef?: React.MutableRefObject<HTMLElement | null>;
  axis?: "vertical" | "horizontal";
  reversed?: boolean;
  enableScrollLoad?: boolean;
  getItemSize?: (index: number) => number;
  virtualizerContext?: VirtualizerContextProps;
  onRenderedFlaggedIndex?: (index: number) => void;
  flaggedIndex?: React.MutableRefObject<number | null>;
  imperativeVirtualizerRef?: React.RefObject<VirtualizerDataRef | null>;
  imperativeRef?: React.RefObject<VirtualizerScrollToHandle | null>;
  containerSizeRef?: React.RefObject<number>;
  updateScrollPosition?: (position: number) => void;
  gap?: number;
  enablePagination?: boolean;
  container?: Pick<React.HTMLAttributes<HTMLDivElement>, "className" | "style">;
  label?: string;
} & VirtualizerBookendSlots;

function useAdaptiveScrollViewLength(axis: "vertical" | "horizontal", itemSize: number, numItems: number, bufferItems: number | undefined, scrollViewRef: React.MutableRefObject<HTMLElement | null>): number {
  const [viewportSize, setViewportSize] = React.useState(320);
  React.useLayoutEffect(() => {
    const viewport = scrollViewRef.current;
    if (!viewport) return;
    const update = (): void => {
      const size = axis === "horizontal" ? viewport.clientWidth : viewport.clientHeight;
      if (size > 0) setViewportSize(previous => previous === size ? previous : size);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [axis, scrollViewRef]);
  const size = Number.isFinite(itemSize) && itemSize > 0 ? itemSize : 1;
  const buffer = Number.isFinite(bufferItems) ? Math.max(0, Math.floor(bufferItems!)) : 4;
  return Math.min(Math.max(0, Math.floor(numItems)), Math.max(1, Math.ceil(viewportSize / size) + buffer * 2));
}

/** Responsive compatibility view for Fluent's legacy fixed-size VirtualizerScrollView API. */
export function VirtualizerScrollView({ children, itemSize, numItems, virtualizerLength, bufferItems, bufferSize, scrollViewRef: providedScrollViewRef, axis = "vertical", reversed, enableScrollLoad, onRenderedFlaggedIndex, flaggedIndex, imperativeVirtualizerRef, imperativeRef, containerSizeRef, updateScrollPosition, gap, enablePagination, container, label, ...props }: ScrollViewBaseProps): React.ReactElement {
  const localScrollViewRef = React.useRef<HTMLElement | null>(null);
  const scrollViewRef = providedScrollViewRef ?? localScrollViewRef;
  const adaptiveLength = useAdaptiveScrollViewLength(axis, itemSize, numItems, bufferItems, scrollViewRef);
  const style = { height: "320px", ...props.style, ...container?.style };
  const className = [props.className, container?.className].filter(Boolean).join(" ") || undefined;
  return <Virtualizer {...props} className={className} style={style} axis={axis} reversed={reversed} numItems={numItems} itemSize={itemSize} virtualizerLength={virtualizerLength ?? adaptiveLength} bufferItems={bufferItems} bufferSize={bufferSize} scrollViewRef={scrollViewRef} containerSizeRef={containerSizeRef} getItemSize={undefined} gap={gap} enableScrollLoad={enableScrollLoad} enablePagination={enablePagination} onRenderedFlaggedIndex={onRenderedFlaggedIndex} flaggedIndex={flaggedIndex} imperativeVirtualizerRef={imperativeVirtualizerRef} imperativeRef={imperativeRef} updateScrollPosition={updateScrollPosition} label={label}>{children}</Virtualizer>;
}

/** Responsive measured compatibility view for Fluent's legacy dynamic VirtualizerScrollView API. */
export function VirtualizerScrollViewDynamic({ children, itemSize, numItems, virtualizerLength, bufferItems, bufferSize, scrollViewRef: providedScrollViewRef, axis = "vertical", reversed, enableScrollLoad, getItemSize, virtualizerContext, onRenderedFlaggedIndex, flaggedIndex, imperativeVirtualizerRef, imperativeRef, containerSizeRef, updateScrollPosition, gap, enablePagination, container, label, ...props }: ScrollViewBaseProps): React.ReactElement {
  const localScrollViewRef = React.useRef<HTMLElement | null>(null);
  const scrollViewRef = providedScrollViewRef ?? localScrollViewRef;
  const adaptiveLength = useAdaptiveScrollViewLength(axis, itemSize, numItems, bufferItems, scrollViewRef);
  const style = { height: "320px", ...props.style, ...container?.style };
  const className = [props.className, container?.className].filter(Boolean).join(" ") || undefined;
  return <Virtualizer {...props} className={className} style={style} axis={axis} reversed={reversed} numItems={numItems} itemSize={itemSize} virtualizerLength={virtualizerLength ?? adaptiveLength} bufferItems={bufferItems} bufferSize={bufferSize} scrollViewRef={scrollViewRef} containerSizeRef={containerSizeRef} getItemSize={getItemSize} gap={gap} measureItems={true} enableScrollLoad={enableScrollLoad} enablePagination={enablePagination} virtualizerContext={virtualizerContext} onRenderedFlaggedIndex={onRenderedFlaggedIndex} flaggedIndex={flaggedIndex} imperativeVirtualizerRef={imperativeVirtualizerRef} imperativeRef={imperativeRef} updateScrollPosition={updateScrollPosition} label={label}>{children}</Virtualizer>;
}

const EMPTY_DATA_GRID_ITEMS: unknown[] = [];
const EMPTY_DATA_GRID_COLUMN_WIDTHS: DataGridColumnWidths = Object.freeze({});
const EMPTY_DATA_GRID_COLUMN_SIZING_OPTIONS: DataGridColumnSizingOptions = Object.freeze({});
const DEFAULT_DATA_GRID_RESIZABLE_COLUMNS_OPTIONS = Object.freeze({ autoFitColumns: true });
export type DataGridColumnResizeData = { columnId: string; width: number };
export type DataGridColumnResizeEvent = MouseEvent | KeyboardEvent | TouchEvent | undefined;
export type DataGridSelectionChangeEvent = React.MouseEvent | React.KeyboardEvent;
function VirtualDataGrid<T>({ items, dataSource, onDataLoadError, onDataSourceGroupToggle, columns, getRowId, label: labelProp, height = 400, rowHeight = 40, getRowHeight, overscan = 4, virtualize, virtualizeColumns, focusMode = "cell", subtleSelection = false, selectionAppearance = "brand", selectionMode = "none", selectedKeys, defaultSelectedKeys = [], selectionModel, defaultSelectionModel, onDataSourceSelectionChange, onSelectionChange, sort, defaultSort, onSortChange, multiSort, defaultMultiSort = [], onMultiSortChange, sortPriorityLabel: sortPriorityLabelProp, filterable = false, filterValue, defaultFilterValue = "", onFilterValueChange, filterLabel: filterLabelProp, renderCell, onCellEdit, onCellsEdit, validateCellEdit, rowLabel: rowLabelProp, editHint: editHintProp, emptyMessage: emptyMessageProp, loadingLabel: loadingLabelProp, selectLabel: selectLabelProp, selectAllLabel: selectAllLabelProp, resizableColumns = false, columnWidths, defaultColumnWidths = EMPTY_DATA_GRID_COLUMN_WIDTHS, columnSizingOptions = EMPTY_DATA_GRID_COLUMN_SIZING_OPTIONS, resizableColumnsOptions = DEFAULT_DATA_GRID_RESIZABLE_COLUMNS_OPTIONS, containerWidthOffset = 0, onColumnResize, resizeLabel: resizeLabelProp, reorderableColumns = false, columnOrder, defaultColumnOrder, onColumnOrderChange, reorderLabel: reorderLabelProp, groupBy, collapsedGroupKeys, defaultCollapsedGroupKeys = [], onCollapsedGroupKeysChange, emptyGroupLabel: emptyGroupLabelProp, expandGroupLabel: expandGroupLabelProp, collapseGroupLabel: collapseGroupLabelProp, onRenderedRange, ...props }: ElementProps & { items?: T[]; dataSource?: DataGridDataSource<T>; onDataLoadError?: (error: unknown, range: { start: number; end: number }) => void; onDataSourceGroupToggle?: (groupKey: string, expanded: boolean) => void; columns: DataGridColumn<T>[]; getRowId: (item: T) => string | number; label?: string; height?: number | string; rowHeight?: number; getRowHeight?: (item: T, index: number) => number; overscan?: number; virtualize?: boolean; virtualizeColumns?: boolean; focusMode?: DataGridFocusMode; subtleSelection?: boolean; selectionAppearance?: DataGridSelectionAppearance; selectionMode?: "none" | "single" | "multiple" | "multiselect"; selectedKeys?: readonly (string | number)[]; defaultSelectedKeys?: readonly (string | number)[]; selectionModel?: DataGridSelectionModel; defaultSelectionModel?: DataGridSelectionModel; onDataSourceSelectionChange?: (selection: DataGridSelectionModel, selectedItems: T[]) => void; onSelectionChange?: (keys: string[], selectedItems: T[]) => void; sort?: DataGridSort | null; defaultSort?: DataGridSort; onSortChange?: (sort: DataGridSort | undefined) => void; multiSort?: readonly DataGridSort[]; defaultMultiSort?: readonly DataGridSort[]; onMultiSortChange?: (sorts: DataGridSort[]) => void; sortPriorityLabel?: string; filterable?: boolean; filterValue?: string; defaultFilterValue?: string; onFilterValueChange?: (value: string) => void; filterLabel?: string; renderCell?: (item: T, column: DataGridColumn<T>, rowIndex: number) => React.ReactNode; onCellEdit?: (edit: DataGridCellEdit<T>) => void | Promise<void>; onCellsEdit?: (edits: readonly DataGridCellEdit<T>[]) => void | Promise<void>; validateCellEdit?: (edit: DataGridCellEdit<T>) => string | undefined; rowLabel?: string; editHint?: string; emptyMessage?: React.ReactNode; loadingLabel?: string; selectLabel?: string; selectAllLabel?: string; resizableColumns?: boolean; columnWidths?: DataGridColumnWidths; defaultColumnWidths?: DataGridColumnWidths; columnSizingOptions?: DataGridColumnSizingOptions; resizableColumnsOptions?: { autoFitColumns?: boolean }; containerWidthOffset?: number; onColumnResize?: (event: DataGridColumnResizeEvent, data: DataGridColumnResizeData) => void; resizeLabel?: string; reorderableColumns?: boolean; columnOrder?: readonly string[]; defaultColumnOrder?: readonly string[]; onColumnOrderChange?: (columnIds: string[]) => void; reorderLabel?: string; groupBy?: string; collapsedGroupKeys?: readonly string[]; defaultCollapsedGroupKeys?: readonly string[]; onCollapsedGroupKeysChange?: (groupKeys: string[]) => void; emptyGroupLabel?: string; expandGroupLabel?: string; collapseGroupLabel?: string; onRenderedRange?: (range: { start: number; end: number; total: number }) => void }): React.ReactElement {
  selectionMode = selectionMode === "multiselect" ? "multiple" : selectionMode;
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(typeof height === "number" ? height : 400);
  const [viewportWidth, setViewportWidth] = React.useState(0);
  const [columnWindow, setColumnWindow] = React.useState({ start: 0, end: Math.min(columns.length, 16) });
  const [internalSelected, setInternalSelected] = React.useState<string[]>(defaultSelectedKeys.map(String));
  const [internalDataSourceSelection, setInternalDataSourceSelection] = React.useState<DataGridSelectionModel>(() => defaultSelectionModel ?? { mode: "explicit", keys: defaultSelectedKeys.map(String) });
  const [internalSort, setInternalSort] = React.useState<DataGridSort | undefined>(defaultSort);
  const [internalMultiSort, setInternalMultiSort] = React.useState<DataGridSort[]>(() => [...defaultMultiSort]);
  const [multiSortEnabled, setMultiSortEnabled] = React.useState(multiSort !== undefined || defaultMultiSort.length > 0);
  const [internalFilterValue, setInternalFilterValue] = React.useState(defaultFilterValue);
  const [internalColumnWidths, setInternalColumnWidths] = React.useState<Record<string, number>>(() => ({ ...defaultColumnWidths }));
  const [internalColumnOrder, setInternalColumnOrder] = React.useState<string[]>(() => [...(defaultColumnOrder ?? columns.map(column => column.id))]);
  const [internalCollapsedGroupKeys, setInternalCollapsedGroupKeys] = React.useState<string[]>(() => [...defaultCollapsedGroupKeys]);
  const [reorderAnnouncement, setReorderAnnouncement] = React.useState("");
  const [sourceRevision, setSourceRevision] = React.useState(0);
  const [sourceBusy, setSourceBusy] = React.useState(false);
  const [sourceError, setSourceError] = React.useState("");
  const [editedCells, setEditedCells] = React.useState<Record<string, DataGridEditValue>>({});
  const [editingCell, setEditingCell] = React.useState<{ rowId: string; columnId: string; draft: string; error?: string; saving?: boolean } | null>(null);
  const editingCellRef = React.useRef<typeof editingCell>(null);
  const updateEditingCell = (next: typeof editingCell): void => { editingCellRef.current = next; setEditingCell(next); };
  const frame = React.useRef(0);
  const viewport = React.useRef<HTMLDivElement>(null);
  const clipboardController = React.useRef<AbortController | null>(null);
  const resizing = React.useRef<{ column: DataGridColumn<T>; startX: number; startWidth: number; direction: number; pointerId: number } | undefined>(undefined);
  const selectionName = React.useId();
  const draggedColumn = React.useRef<string | undefined>(undefined);
  const [activeCell, setActiveCell] = React.useState({ row: 0, column: 0 });
  const pendingBoundaryFocus = React.useRef<{ row: number; column: number }>();
  const autoFitColumns = resizableColumnsOptions.autoFitColumns ?? true;
  React.useEffect(() => () => cancelAnimationFrame(frame.current), []);
  React.useEffect(() => { setEditedCells({}); updateEditingCell(null); }, [items, dataSource]);
  React.useLayoutEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(() => {
      setViewportHeight(viewport.current?.clientHeight || 400);
      setViewportWidth(viewport.current?.clientWidth || 0);
      updateColumnWindow();
    });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  React.useLayoutEffect(() => {
    if (!resizableColumns || columnWidths !== undefined || !viewport.current) return;
    if (autoFitColumns) return;
    setInternalColumnWidths(current => {
      const next = { ...current };
      let changed = false;
      for (const [columnIndex, column] of columns.entries()) {
        const option = columnSizingOptions[column.id];
        const hasInitialWidth = option?.defaultWidth !== undefined || option?.idealWidth !== undefined;
        if (next[column.id] !== undefined) continue;
        if (!hasInitialWidth && column.minWidth === undefined && column.maxWidth === undefined && option?.minWidth === undefined) continue;
        if (hasInitialWidth) {
          next[column.id] = getDataGridColumnSizing(column, columnSizingOptions).defaultWidth;
          changed = true;
          continue;
        }
        const cell = viewport.current?.querySelector<HTMLElement>(`[data-column-id="${CSS.escape(column.id)}"]`);
        const renderedWidth = cell?.getBoundingClientRect().width ?? 0;
        if (renderedWidth <= 0) continue;
        const width = clampDataGridColumnWidth(column, renderedWidth, option);
        if (Math.abs(width - renderedWidth) >= 1) { next[column.id] = width; changed = true; }
      }
      return changed ? next : current;
    });
  }, [columns, resizableColumns, columnWidths, columnSizingOptions, autoFitColumns]);
  rowHeight = Number.isFinite(rowHeight) && rowHeight > 0 ? rowHeight : 40;
  overscan = Number.isFinite(overscan) ? Math.max(0, Math.min(50, Math.floor(overscan))) : 4;
  const activeColumnOrder = columnOrder ?? internalColumnOrder;
  const orderedColumns = React.useMemo(() => {
    const byId = new Map(columns.map(column => [column.id, column]));
    return [...activeColumnOrder.flatMap(id => { const column = byId.get(id); return column ? [column] : []; }), ...columns.filter(column => !activeColumnOrder.includes(column.id))];
  }, [columns, activeColumnOrder]);
  const shouldVirtualizeColumns = virtualizeColumns ?? orderedColumns.length > 16;
  const activeMultiSort = multiSort ?? internalMultiSort;
  const activeSortState: DataGridSortState | undefined = multiSort !== undefined || multiSortEnabled ? activeMultiSort : sort === null ? undefined : sort ?? internalSort;
  const activeFilterValue = filterValue === undefined ? internalFilterValue : filterValue;
  const locale = typeof document === "undefined" ? undefined : document.documentElement.lang;
  const effectiveItems = (items ?? EMPTY_DATA_GRID_ITEMS) as T[];
  const filteredItems = React.useMemo(() => dataSource ? [] : filterDataGridItems(effectiveItems, orderedColumns, activeFilterValue, locale), [dataSource, effectiveItems, orderedColumns, activeFilterValue, locale]);
  const sortedItems = React.useMemo(() => dataSource ? [] : sortDataGridItems(filteredItems, orderedColumns, activeSortState, locale), [dataSource, filteredItems, orderedColumns, activeSortState, locale]);
  const uiStrings = React.useContext(UIContext).strings;
  const label = labelProp ?? (typeof props["aria-label"] === "string" ? props["aria-label"] as string : uiStrings.dataGridLabel ?? defaultStrings.dataGridLabel!);
  const sortPriorityLabel = sortPriorityLabelProp ?? uiStrings.dataGridSortPriority ?? defaultStrings.dataGridSortPriority!;
  const filterLabel = filterLabelProp ?? uiStrings.dataGridFilterLabel ?? defaultStrings.dataGridFilterLabel!;
  const rowLabel = rowLabelProp ?? uiStrings.dataGridRowLabel ?? defaultStrings.dataGridRowLabel!;
  const editHint = editHintProp ?? uiStrings.dataGridEditHint ?? defaultStrings.dataGridEditHint!;
  const emptyMessage = emptyMessageProp ?? uiStrings.dataGridEmptyLabel ?? defaultStrings.dataGridEmptyLabel!;
  const loadingLabel = loadingLabelProp ?? uiStrings.dataGridLoadingLabel ?? defaultStrings.dataGridLoadingLabel!;
  const selectLabel = selectLabelProp ?? uiStrings.dataGridSelectRow ?? defaultStrings.dataGridSelectRow!;
  const selectAllLabel = selectAllLabelProp ?? uiStrings.dataGridSelectAll ?? defaultStrings.dataGridSelectAll!;
  const resizeLabel = resizeLabelProp ?? uiStrings.dataGridResizeLabel ?? defaultStrings.dataGridResizeLabel!;
  const reorderLabel = reorderLabelProp ?? uiStrings.dataGridReorderLabel ?? defaultStrings.dataGridReorderLabel!;
  const emptyGroupLabel = emptyGroupLabelProp ?? uiStrings.dataGridEmptyGroupLabel ?? defaultStrings.dataGridEmptyGroupLabel!;
  const expandGroupLabel = expandGroupLabelProp ?? uiStrings.dataGridExpandGroupLabel ?? defaultStrings.dataGridExpandGroupLabel!;
  const collapseGroupLabel = collapseGroupLabelProp ?? uiStrings.dataGridCollapseGroupLabel ?? defaultStrings.dataGridCollapseGroupLabel!;
  const shownEmptyMessage = activeFilterValue.trim() ? uiStrings.noResults : emptyMessage;
  const setFilterValue = (value: string): void => {
    if (filterValue === undefined) setInternalFilterValue(value);
    onFilterValueChange?.(value);
  };
  type GridDisplayRow = { kind: "group"; group: DataGridGroup<T>; sourceGroup?: { expanded: boolean; count: number } } | { kind: "item"; item: T; itemIndex: number; key: string };
  const groups = React.useMemo(() => dataSource ? undefined : groupDataGridItems(sortedItems, orderedColumns, groupBy, typeof document === "undefined" ? undefined : document.documentElement.lang, emptyGroupLabel), [dataSource, sortedItems, orderedColumns, groupBy, emptyGroupLabel]);
  const activeCollapsedGroupKeys = collapsedGroupKeys ?? internalCollapsedGroupKeys;
  const collapsedGroupSet = React.useMemo(() => new Set(activeCollapsedGroupKeys), [activeCollapsedGroupKeys]);
  const sourceLength = dataSource ? Math.max(0, Math.floor(Number.isFinite(dataSource.length) ? dataSource.length : 0)) : 0;
  const sourceSelectableCount = dataSource ? Math.max(0, Math.floor(Number.isFinite(dataSource.selectableCount) ? dataSource.selectableCount! : sourceLength)) : sortedItems.length;
  const displayRows = React.useMemo<GridDisplayRow[]>(() => dataSource
    ? new Array(sourceLength)
    : groups
    ? groups.flatMap(group => [
      { kind: "group" as const, group },
      ...(collapsedGroupSet.has(group.key) ? [] : group.items.map((item, offset) => ({ kind: "item" as const, item, itemIndex: group.indices[offset], key: String(getRowId(item)) }))),
    ])
    : sortedItems.map((item, itemIndex) => ({ kind: "item" as const, item, itemIndex, key: String(getRowId(item)) })),
  [dataSource, sourceLength, groups, collapsedGroupSet, sortedItems, getRowId]);
  const shouldVirtualize = dataSource ? true : virtualize ?? displayRows.length > 100;
  const activeSelectedKeys = React.useMemo(() => selectedKeys === undefined ? internalSelected : selectedKeys.map(String), [selectedKeys, internalSelected]);
  const selectedSet = React.useMemo(() => new Set(activeSelectedKeys), [activeSelectedKeys]);
  const activeDataSourceSelection = selectionModel ?? (selectedKeys === undefined ? internalDataSourceSelection : { mode: "explicit" as const, keys: selectedKeys.map(String) });
  const sourceSelectionKeys = React.useMemo(() => new Set(activeDataSourceSelection.mode === "all" ? activeDataSourceSelection.excludedKeys : activeDataSourceSelection.keys), [activeDataSourceSelection]);
  const sourceSelectionActive = activeDataSourceSelection.mode === "all" && (activeDataSourceSelection.scopeKey === undefined || activeDataSourceSelection.scopeKey === dataSource?.selectionScopeKey);
  const isRowSelected = (key: string): boolean => dataSource ? activeDataSourceSelection.mode === "all" ? sourceSelectionActive && !sourceSelectionKeys.has(key) : sourceSelectionKeys.has(key) : selectedSet.has(key);
  const selectedCount = React.useMemo(() => sortedItems.reduce((count, item) => count + Number(selectedSet.has(String(getRowId(item)))), 0), [sortedItems, selectedSet, getRowId]);
  const headerHeight = 40;
  const rowSizes = React.useMemo(() => new VariableSizeIndex(displayRows.length, rowHeight, dataSource ? undefined : displayRows.map(row => row.kind === "item" ? clampDataGridRowHeight(getRowHeight?.(row.item, row.itemIndex), rowHeight) : rowHeight)), [displayRows, rowHeight, getRowHeight, dataSource]);
  const viewportStart = Math.max(0, scrollTop - headerHeight);
  const viewportEnd = viewportStart + Math.max(0, viewportHeight - headerHeight);
  const first = shouldVirtualize ? Math.max(0, rowSizes.indexAt(viewportStart) - overscan) : 0;
  const last = shouldVirtualize ? Math.min(displayRows.length, rowSizes.indexAt(viewportEnd) + overscan + 1) : displayRows.length;
  const loadErrorRef = React.useRef(onDataLoadError);
  loadErrorRef.current = onDataLoadError;
  React.useEffect(() => {
    setSourceError("");
    if (!dataSource) { setSourceBusy(false); return; }
    const unsubscribe = dataSource.subscribe?.(() => setSourceRevision(value => value + 1));
    return () => { clipboardController.current?.abort(); clipboardController.current = null; unsubscribe?.(); };
  }, [dataSource]);
  React.useEffect(() => {
    if (!dataSource || first >= last) { setSourceBusy(false); return; }
    const controller = new AbortController();
    let live = true;
    const missing = (): boolean => { for (let index = first; index < last; index++) if (getDataGridDataSourceRow(dataSource, index) === undefined) return true; return false; };
    if (!missing()) { setSourceBusy(false); return; }
    setSourceBusy(true);
    setSourceError("");
    void Promise.resolve().then(() => dataSource.loadRange(first, last, controller.signal)).then(() => {
      if (!live || controller.signal.aborted) return;
      if (missing()) throw new Error(`Data source did not provide every row in range ${first}–${last}.`);
      setSourceBusy(false);
      setSourceError("");
      setSourceRevision(value => value + 1);
    }).catch(error => {
      if (!live || controller.signal.aborted) return;
      setSourceBusy(false);
      setSourceError(error instanceof Error ? error.message : String(error));
      loadErrorRef.current?.(error, { start: first, end: last });
      viewport.current?.dispatchEvent(new CustomEvent("spui-data-load-error", { detail: { error, start: first, end: last }, bubbles: true, composed: true }));
    });
    return () => { live = false; controller.abort(); };
  }, [dataSource, first, last, sourceRevision]);
  React.useLayoutEffect(() => {
    const pending = pendingBoundaryFocus.current;
    if (!pending) return;
    const row = viewport.current?.querySelector<HTMLElement>(`[role="row"][data-row-index="${pending.row}"]`);
    if (!row || row.getAttribute("aria-busy") === "true") return;
    const cell = row.querySelector<HTMLElement>(`[role="gridcell"][data-column-index="${pending.column}"]`);
    if (!cell) return;
    pendingBoundaryFocus.current = undefined;
    requestAnimationFrame(() => {
      const focusTarget = focusMode === "row_unstable" ? row : cell.querySelector<HTMLElement>("button:not([disabled]),input:not([disabled]):not([data-tree-selector]),select:not([disabled]),textarea:not([disabled]),a[href]") ?? cell;
      focusTarget.focus();
    });
  }, [first, last, sourceRevision, focusMode, columnWindow, activeCell]);
  React.useEffect(() => onRenderedRange?.({ start: first, end: last, total: displayRows.length }), [first, last, displayRows.length, onRenderedRange]);
  const setGroupCollapsed = (key: string, collapsed: boolean): void => {
    const next = collapsed ? [...new Set([...activeCollapsedGroupKeys, key])] : activeCollapsedGroupKeys.filter(candidate => candidate !== key);
    if (collapsedGroupKeys === undefined) setInternalCollapsedGroupKeys(next);
    onCollapsedGroupKeysChange?.(next);
  };
  const rawColumnWidths = columnWidths ?? internalColumnWidths;
  const configuredColumnWidths = React.useMemo(() => Object.fromEntries(Object.entries(rawColumnWidths).flatMap(([id, width]) => {
    const column = orderedColumns.find(candidate => candidate.id === id);
    return column && Number.isFinite(width) && width > 0 ? [[id, clampDataGridColumnWidth(column, width, columnSizingOptions[id])]] : [];
  }).concat(orderedColumns.flatMap((column, index) => {
    const option = columnSizingOptions[column.id];
    const sizing = getDataGridColumnSizing(column, columnSizingOptions);
    if (rawColumnWidths[column.id] !== undefined || option?.defaultWidth === undefined && option?.idealWidth === undefined || resizableColumns && autoFitColumns && index === orderedColumns.length - 1) return [];
    return [[column.id, clampDataGridColumnWidth(column, sizing.defaultWidth, option)]];
  }))), [orderedColumns, rawColumnWidths, columnSizingOptions, autoFitColumns, resizableColumns]);
  const activeColumnWidths = React.useMemo(() => resizableColumns && autoFitColumns && viewportWidth > 0
    ? { ...configuredColumnWidths, ...fitDataGridColumnWidths(orderedColumns, viewportWidth - (Number.isFinite(containerWidthOffset) ? containerWidthOffset : 0), columnSizingOptions, rawColumnWidths, selectionMode === "none" ? 0 : 44) }
    : configuredColumnWidths,
  [resizableColumns, autoFitColumns, viewportWidth, containerWidthOffset, configuredColumnWidths, orderedColumns, columnSizingOptions, rawColumnWidths, selectionMode]);
  const updateColumnWindow = (): void => {
    if (!shouldVirtualizeColumns) return;
    const current = viewport.current;
    const headerCells = current?.querySelectorAll<HTMLElement>(".spui-grid-header [data-column-index]");
    const next = shouldVirtualizeColumns && current && headerCells
      ? getDataGridColumnWindow([...headerCells], current)
      : { start: 0, end: orderedColumns.length };
    setColumnWindow(previous => previous.start === next.start && previous.end === next.end ? previous : next);
  };
  React.useLayoutEffect(updateColumnWindow, [orderedColumns, shouldVirtualizeColumns, activeColumnWidths]);
  const renderedColumns = shouldVirtualizeColumns ? orderedColumns.slice(columnWindow.start, columnWindow.end) : orderedColumns;
  const moveColumn = (fromId: string, toId: string, after = false): void => {
    if (!fromId || fromId === toId || !orderedColumns.some(column => column.id === fromId) || !orderedColumns.some(column => column.id === toId)) return;
    const next = orderedColumns.map(column => column.id);
    next.splice(next.indexOf(fromId), 1);
    next.splice(next.indexOf(toId) + Number(after), 0, fromId);
    if (next.every((id, index) => id === orderedColumns[index].id)) return;
    if (columnOrder === undefined) setInternalColumnOrder(next);
    onColumnOrderChange?.(next);
    const moved = orderedColumns.find(column => column.id === fromId)!;
    setReorderAnnouncement((uiStrings.dataGridColumnReordered ?? defaultStrings.dataGridColumnReordered!).replace("{label}", moved.label).replace("{position}", String(next.indexOf(fromId) + 1)).replace("{count}", String(next.length)));
  };
  const commitColumnResize = (column: DataGridColumn<T>, width: number, event: DataGridColumnResizeEvent): void => {
    const next = clampDataGridColumnWidth(column, width, columnSizingOptions[column.id]);
    if (columnWidths === undefined) setInternalColumnWidths(current => ({ ...current, [column.id]: next }));
    onColumnResize?.(event, { columnId: column.id, width: next });
  };
  const gridColumns = [...(selectionMode === "none" ? [] : ["44px"]), ...orderedColumns.map((column, index) => {
    const sizing = getDataGridColumnSizing(column, columnSizingOptions);
    const option = columnSizingOptions[column.id];
    const isAutoFitLast = resizableColumns && autoFitColumns && index === orderedColumns.length - 1 && columnWidths?.[column.id] === undefined && internalColumnWidths[column.id] === undefined;
    const hasInitialWidth = option?.defaultWidth !== undefined || option?.idealWidth !== undefined;
    const fallback = isAutoFitLast ? `minmax(${sizing.minWidth}px, 1fr)` : hasInitialWidth ? `${sizing.defaultWidth}px` : column.width || "minmax(120px, 1fr)";
    return `var(${dataGridColumnVar(column.id)}, ${fallback})`;
  })].join(" ") || "minmax(0, 1fr)";
  const loadedSourceRows = (): { item: T; key: string }[] => dataSource ? Array.from({ length: last - first }, (_, offset) => getDataGridDataSourceRow(dataSource, first + offset)).flatMap(row => row?.kind === "item" ? [{ item: row.item, key: String(row.rowId ?? getRowId(row.item)) }] : []) : sortedItems.map(item => ({ item, key: String(getRowId(item)) }));
  const setDataSourceSelection = (next: DataGridSelectionModel): void => {
    if (selectionModel === undefined && selectedKeys === undefined) setInternalDataSourceSelection(next);
    const keys = new Set(next.mode === "all" ? next.excludedKeys : next.keys);
    const nextIsActive = next.mode === "all" && (next.scopeKey === undefined || next.scopeKey === dataSource?.selectionScopeKey);
    const selectedItems = loadedSourceRows().filter(row => next.mode === "all" ? nextIsActive && !keys.has(row.key) : keys.has(row.key)).map(row => row.item);
    onDataSourceSelectionChange?.(next, selectedItems);
    onSelectionChange?.(next.mode === "explicit" ? [...next.keys] : [], selectedItems);
  };
  const setSelection = (next: string[]): void => {
    if (selectedKeys === undefined) setInternalSelected(next);
    onSelectionChange?.(next, loadedSourceRows().filter(row => next.includes(row.key)).map(row => row.item));
  };
  const toggleRowSelection = (key: string): void => {
    if (selectionMode === "none") return;
    if (dataSource) { setDataSourceSelection(setDataGridRowSelected(activeDataSourceSelection, key, !isRowSelected(key), dataSource.selectionScopeKey)); return; }
    const selected = activeSelectedKeys.includes(key);
    const next = selectionMode === "single" ? selected ? [] : [key] : selected ? activeSelectedKeys.filter(candidate => candidate !== key) : [...activeSelectedKeys, key];
    setSelection(next);
  };
  const editKey = (rowId: string, columnId: string): string => JSON.stringify([rowId, columnId]);
  const focusGridCell = (rowId: string, columnId: string): void => {
    const columnIndex = orderedColumns.findIndex(column => column.id === columnId);
    requestAnimationFrame(() => viewport.current?.querySelector<HTMLElement>(`[data-row-key="${CSS.escape(rowId)}"][data-column-index="${columnIndex}"]`)?.focus());
  };
  const beginCellEdit = (rowId: string, item: T, column: DataGridColumn<T>, rowIndex: number, columnIndex: number): void => {
    if (!column.editable) return;
    const editKeyValue = editKey(rowId, column.id);
    const value = Object.hasOwn(editedCells, editKeyValue) ? editedCells[editKeyValue] : getDataGridCellValue(item, column);
    setActiveCell({ row: rowIndex, column: columnIndex });
    updateEditingCell({ rowId, columnId: column.id, draft: toDataGridInputValue(value, column.editType) });
  };
  const cancelCellEdit = (rowId: string, columnId: string): void => {
    const current = editingCellRef.current;
    if (!current || current.rowId !== rowId || current.columnId !== columnId || current.saving) return;
    updateEditingCell(null);
    focusGridCell(rowId, columnId);
  };
  const commitCellEdit = async (rowId: string, item: T, column: DataGridColumn<T>, draft: string): Promise<void> => {
    const current = editingCellRef.current;
    if (!current || current.rowId !== rowId || current.columnId !== column.id || current.saving) return;
    const value = parseDataGridInputValue(draft, column.editType);
    const edit: DataGridCellEdit<T> = { item, rowId, columnId: column.id, previousValue: getDataGridCellValue(item, column), value };
    let error: string | undefined;
    try { error = validateCellEdit?.(edit); } catch (reason) { error = reason instanceof Error ? reason.message : String(reason); }
    if (error) { updateEditingCell({ ...current, draft, error }); requestAnimationFrame(() => viewport.current?.querySelector<HTMLInputElement>("[data-testid='spui-data-grid-editor']")?.focus()); return; }
    updateEditingCell({ ...current, draft, saving: true, error: undefined });
    try {
      await onCellEdit?.(edit);
      setEditedCells(previous => ({ ...previous, [editKey(rowId, column.id)]: value }));
      updateEditingCell(null);
      focusGridCell(rowId, column.id);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason || "The value could not be saved.");
      updateEditingCell({ ...current, draft, saving: false, error: message });
      requestAnimationFrame(() => viewport.current?.querySelector<HTMLInputElement>("[data-testid='spui-data-grid-editor']")?.focus());
    }
  };
  const activeSort = sort === null ? undefined : sort ?? internalSort;
  const activeSorts = Array.isArray(activeSortState) ? activeSortState : activeSortState ? [activeSortState] : [];
  const changeSort = (columnId: string, additive = false): void => {
    if (additive || multiSort !== undefined || multiSortEnabled) {
      setMultiSortEnabled(true);
      const current = [...activeSorts];
      const index = current.findIndex(entry => entry.columnId === columnId);
      if (!additive) {
        const previous = current[0];
        const direction: DataGridSort["direction"] = previous?.columnId === columnId && previous.direction === "ascending" ? "descending" : "ascending";
        const next: DataGridSort[] = previous?.columnId === columnId && previous.direction === "descending" ? [] : [{ columnId, direction }];
        if (multiSort === undefined) setInternalMultiSort(next);
        if (sort === undefined) setInternalSort(next[0]);
        onMultiSortChange?.(next);
        onSortChange?.(next[0]);
        return;
      }
      if (index < 0) current.push({ columnId, direction: "ascending" });
      else if (current[index].direction === "ascending") current[index] = { columnId, direction: "descending" };
      else current.splice(index, 1);
      if (multiSort === undefined) setInternalMultiSort(current);
      if (sort === undefined) setInternalSort(current[0]);
      onMultiSortChange?.(current);
      onSortChange?.(current[0]);
      return;
    }
    const next = activeSort?.columnId === columnId ? activeSort.direction === "ascending" ? { columnId, direction: "descending" as const } : undefined : { columnId, direction: "ascending" as const };
    if (sort === undefined) setInternalSort(next);
    onSortChange?.(next);
  };
  const { "aria-label": gridAriaLabel, ...hostProps } = props;
  const host = useHostProps(hostProps);
  const currentEditValue = (item: T, rowId: string, column: DataGridColumn<T>): unknown => {
    const key = editKey(rowId, column.id);
    return Object.hasOwn(editedCells, key) ? editedCells[key] : getDataGridCellValue(item, column);
  };
  const onGridCopy = (event: React.ClipboardEvent<HTMLDivElement>): void => {
    if ((event.target as HTMLElement).closest("[data-testid='spui-data-grid-editor']")) return;
    const loadedRows = loadedSourceRows();
    const selectedItems = loadedRows.filter(row => isRowSelected(row.key)).map(row => row.item);
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[role=gridcell][data-column-index]");
    let values: unknown[][];
    if (selectedItems.length) values = selectedItems.map(item => {
      const rowId = String(getRowId(item));
      return orderedColumns.map(column => currentEditValue(item, rowId, column));
    });
    else if (cell) {
      const sourceRow = dataSource ? getDataGridDataSourceRow(dataSource, Number(cell.dataset.rowIndex)) : undefined;
      const display = dataSource ? sourceRow?.kind === "item" ? { kind: "item" as const, item: sourceRow.item, itemIndex: sourceRow.itemIndex ?? Number(cell.dataset.rowIndex), key: String(sourceRow.rowId ?? getRowId(sourceRow.item)) } : undefined : displayRows[Number(cell.dataset.rowIndex)];
      const column = orderedColumns[Number(cell.dataset.columnIndex)];
      if (!display || display.kind !== "item" || !column) return;
      values = [[currentEditValue(display.item, display.key, column)]];
    } else return;
    event.preventDefault();
    event.clipboardData.setData("text/plain", formatDataGridClipboard(values));
  };
  const copyDataSourceSelection = (): void => {
    const source = dataSource;
    if (!source?.copySelection) return;
    const selectionScopeKey = source.selectionScopeKey;
    const controller = new AbortController();
    clipboardController.current?.abort(); clipboardController.current = controller;
    const text = Promise.resolve().then(() => source.copySelection!(activeDataSourceSelection, orderedColumns.map(({ id, label }) => ({ id, label })), controller.signal)).then(value => {
      if (controller.signal.aborted || dataSource !== source) throw new DOMException("Clipboard operation cancelled", "AbortError");
      if (source.selectionScopeKey !== selectionScopeKey) throw new Error("The data query changed before copying completed.");
      if (value.length > 1_000_000) throw new Error("Copy is limited to 1,000,000 characters.");
      return value;
    });
    void writeDataGridClipboardText(text).then(() => {
      if (clipboardController.current === controller) setReorderAnnouncement(uiStrings.dataGridSelectionCopied ?? defaultStrings.dataGridSelectionCopied!);
    }, reason => {
      if (controller.signal.aborted) return;
      const message = reason instanceof Error ? reason.message : String(reason);
      setReorderAnnouncement((uiStrings.dataGridCopyFailed ?? defaultStrings.dataGridCopyFailed!).replace("{message}", message));
      viewport.current?.dispatchEvent(new CustomEvent("spui-clipboard-error", { detail: { operation: "copy", message }, bubbles: true, composed: true }));
    });
  };
  const onGridPaste = async (event: React.ClipboardEvent<HTMLDivElement>): Promise<void> => {
    if ((event.target as HTMLElement).closest("[data-testid='spui-data-grid-editor']")) return;
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[role=gridcell][data-column-index]");
    if (!cell) return;
    event.preventDefault();
    const edits: DataGridCellEdit<T>[] = [];
    try {
      const matrix = parseDataGridClipboard(event.clipboardData.getData("text/plain"));
      const cellCount = matrix.reduce((total, row) => total + row.length, 0);
      if (cellCount > 1000) throw new Error("Paste is limited to 1,000 cells at a time.");
      const startRow = Number(cell.dataset.rowIndex), startColumn = Number(cell.dataset.columnIndex);
      const source = dataSource;
      const selectionScopeKey = source?.selectionScopeKey;
      const controller = new AbortController();
      clipboardController.current?.abort(); clipboardController.current = controller;
      if (source) {
        const endRow = startRow + matrix.length;
        if (startRow < 0 || endRow > sourceLength) throw new Error("The pasted data extends past the last row.");
        let missing = false;
        for (let index = startRow; index < endRow; index++) if (getDataGridDataSourceRow(source, index) === undefined) { missing = true; break; }
        if (missing) await source.loadRange(startRow, endRow, controller.signal);
        if (controller.signal.aborted) return;
        if (dataSource !== source || source.selectionScopeKey !== selectionScopeKey) throw new Error("The data query changed before paste completed.");
        for (let index = startRow; index < endRow; index++) if (getDataGridDataSourceRow(source, index) === undefined) throw new Error("The data source did not provide every destination row.");
        setSourceRevision(value => value + 1);
      }
      const rows = dataSource
        ? Array.from({ length: Math.min(matrix.length, Math.max(0, sourceLength - startRow)) }, (_, offset) => { const row = getDataGridDataSourceRow(dataSource, startRow + offset); return row?.kind === "item" ? { kind: "item" as const, item: row.item, itemIndex: row.itemIndex ?? startRow + offset, key: String(row.rowId ?? getRowId(row.item)) } : undefined; })
        : displayRows.slice(startRow).filter((row): row is Extract<GridDisplayRow, { kind: "item" }> => row.kind === "item");
      for (let rowOffset = 0; rowOffset < matrix.length; rowOffset++) {
        const target = rows[rowOffset];
        if (!target) throw new Error("The pasted data extends past the last row.");
        for (let columnOffset = 0; columnOffset < matrix[rowOffset].length; columnOffset++) {
          const column = orderedColumns[startColumn + columnOffset];
          if (!column) throw new Error("The pasted data extends past the last column.");
          if (!column.editable) throw new Error(`${column.label} cannot be edited.`);
          const value = parseDataGridClipboardValue(matrix[rowOffset][columnOffset], column.editType);
          const edit: DataGridCellEdit<T> = { item: target.item, rowId: target.key, columnId: column.id, previousValue: currentEditValue(target.item, target.key, column), value };
          const validation = validateCellEdit?.(edit);
          if (validation) throw new Error(validation);
          edits.push(edit);
        }
      }
      if (edits.length > 1) {
        if (!onCellsEdit) throw new Error("Provide onCellsEdit to persist a multi-cell paste atomically.");
        await onCellsEdit(edits);
        setEditedCells(previous => Object.assign({ ...previous }, ...edits.map(edit => ({ [editKey(edit.rowId, edit.columnId)]: edit.value }))));
        viewport.current?.dispatchEvent(new CustomEvent("spui-cells-edit", { detail: { edits }, bubbles: true, composed: true }));
      } else if (edits.length === 1) {
        await onCellEdit?.(edits[0]);
        const edit = edits[0];
        setEditedCells(previous => ({ ...previous, [editKey(edit.rowId, edit.columnId)]: edit.value }));
        viewport.current?.dispatchEvent(new CustomEvent("spui-cell-edit", { detail: edit, bubbles: true, composed: true }));
      }
      setReorderAnnouncement((edits.length === 1 ? uiStrings.dataGridPasteOne ?? defaultStrings.dataGridPasteOne! : uiStrings.dataGridPasteMany ?? defaultStrings.dataGridPasteMany!).replace("{count}", String(edits.length)));
    } catch (reason) {
      if (clipboardController.current?.signal.aborted) return;
      const message = reason instanceof Error ? reason.message : String(reason);
      setReorderAnnouncement((uiStrings.dataGridPasteFailed ?? defaultStrings.dataGridPasteFailed!).replace("{message}", message));
      viewport.current?.dispatchEvent(new CustomEvent("spui-cells-edit-error", { detail: { message, edits }, bubbles: true, composed: true }));
    }
  };
  const onGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && !((event.target as HTMLElement).closest("[data-testid='spui-data-grid-editor']"))) {
      if (dataSource?.copySelection && (sourceSelectionActive || activeDataSourceSelection.mode === "explicit" && activeDataSourceSelection.keys.length > 0)) { event.preventDefault(); copyDataSourceSelection(); return; }
    }
    if (event.ctrlKey && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      if (event.key === "Home") {
        const first = viewport.current?.querySelector<HTMLElement>(".spui-grid-header [role=row] input:not([disabled]),.spui-grid-header [role=row] button:not([disabled]),.spui-grid-header [role=row] [tabindex='0']");
        first?.focus();
        return;
      }
      if (!displayRows.length || !orderedColumns.length) return;
      let row = displayRows.length - 1;
      if (!dataSource) while (row >= 0 && displayRows[row]?.kind !== "item") row--;
      if (row < 0) return;
      let column = orderedColumns.length - 1;
      if (shouldVirtualizeColumns) {
        setColumnWindow({ start: Math.max(0, column - 8), end: column + 1 });
        viewport.current?.scrollTo({ left: viewport.current.scrollWidth, behavior: "auto" });
      }
      setActiveCell({ row, column });
      pendingBoundaryFocus.current = { row, column };
      const top = headerHeight + rowSizes.offset(row);
      if (viewport.current) { viewport.current.scrollTop = top; setScrollTop(top); }
      return;
    }
    const reorderHandle = (event.target as HTMLElement).closest<HTMLElement>("[data-reorder-column]");
    if (reorderHandle && event.altKey && event.shiftKey && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      const currentIndex = orderedColumns.findIndex(column => column.id === reorderHandle.dataset.reorderColumn);
      const rtl = getComputedStyle(viewport.current!).direction === "rtl";
      const delta = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
      const nextIndex = currentIndex + delta;
      if (nextIndex >= 0 && nextIndex < orderedColumns.length) {
        event.preventDefault();
        moveColumn(orderedColumns[currentIndex].id, orderedColumns[nextIndex].id, nextIndex > currentIndex);
        requestAnimationFrame(() => viewport.current?.querySelector<HTMLElement>(`[data-reorder-column="${CSS.escape(orderedColumns[currentIndex].id)}"]`)?.focus());
      }
      return;
    }
    const handle = (event.target as HTMLElement).closest<HTMLElement>("[data-resize-column]");
    if (handle) {
      const column = columns.find(candidate => candidate.id === handle.dataset.resizeColumn);
      if (!column) return;
      const current = activeColumnWidths[column.id] ?? handle.parentElement!.getBoundingClientRect().width;
      const direction = getComputedStyle(viewport.current!).direction === "rtl" ? -1 : 1;
      const step = event.shiftKey ? 32 : 10;
      let width: number;
      if (event.key === "ArrowRight") width = current + step * direction;
      else if (event.key === "ArrowLeft") width = current - step * direction;
      else if (event.key === "Home") width = getDataGridColumnSizing(column, columnSizingOptions).minWidth;
      else if (event.key === "End") width = column.maxWidth ?? 1600;
      else return;
      event.preventDefault();
      commitColumnResize(column, width, event.nativeEvent);
      requestAnimationFrame(() => viewport.current?.querySelector<HTMLElement>(`[data-resize-column="${CSS.escape(column.id)}"]`)?.focus());
      return;
    }
    const rowForSelection = (event.target as HTMLElement).closest<HTMLElement>("[role=row][data-row-index]");
    if (event.key === " " && rowForSelection && selectionMode !== "none" && !(event.target as HTMLElement).closest("button,input,select,textarea,a,[contenteditable=true]")) { event.preventDefault(); toggleRowSelection(rowForSelection.dataset.rowKey || ""); return; }
    if (focusMode === "none") return;
    const rowElement = (event.target as HTMLElement).closest<HTMLElement>("[role=row][data-row-index]");
    if (rowElement && (focusMode === "row_unstable" || focusMode === "composite") && event.target === rowElement) {
      if (focusMode === "composite" && event.key === "ArrowRight") {
        const target = rowElement.querySelector<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"][role="gridcell"]');
        if (target) { event.preventDefault(); target.focus(); }
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        let next = Number(rowElement.dataset.rowIndex) + direction;
        while (!dataSource && next >= 0 && next < displayRows.length && displayRows[next]?.kind !== "item") next += direction;
        if (next >= 0 && next < displayRows.length) {
          event.preventDefault(); setActiveCell(current => ({ ...current, row: next }));
          const offset = rowSizes.offset(next), size = rowSizes.size(next);
          if (offset < viewport.current!.scrollTop) viewport.current!.scrollTop = offset;
          else if (offset + size > viewport.current!.scrollTop + viewport.current!.clientHeight - headerHeight) viewport.current!.scrollTop = offset + size - Math.max(0, viewport.current!.clientHeight - headerHeight);
          requestAnimationFrame(() => viewport.current?.querySelector<HTMLElement>(`[data-row-index="${next}"]`)?.focus());
        }
        return;
      }
    }
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[role=gridcell][data-column-index]");
    if (!cell) return;
    let row = Number(cell.dataset.rowIndex), column = Number(cell.dataset.columnIndex);
    if (focusMode === "composite") {
      if (event.key === "ArrowLeft") { const rowNode = cell.closest<HTMLElement>("[role=row][data-row-index]"); if (rowNode) { event.preventDefault(); rowNode.focus(); } }
      else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        let next = row + direction;
        while (!dataSource && next >= 0 && next < displayRows.length && displayRows[next]?.kind !== "item") next += direction;
        if (next >= 0 && next < displayRows.length) {
          event.preventDefault(); setActiveCell(current => ({ ...current, row: next }));
          const offset = rowSizes.offset(next), size = rowSizes.size(next);
          if (offset < viewport.current!.scrollTop) viewport.current!.scrollTop = offset;
          else if (offset + size > viewport.current!.scrollTop + viewport.current!.clientHeight - headerHeight) viewport.current!.scrollTop = offset + size - Math.max(0, viewport.current!.clientHeight - headerHeight);
          requestAnimationFrame(() => viewport.current?.querySelector<HTMLElement>(`[data-row-index="${next}"]`)?.focus());
        }
      }
      return;
    }
    if (event.key === "Enter" || event.key === "F2") {
      const sourceRow = dataSource ? getDataGridDataSourceRow(dataSource, row) : undefined;
      const displayRow = dataSource ? sourceRow?.kind === "item" ? { kind: "item" as const, item: sourceRow.item, itemIndex: sourceRow.itemIndex ?? row, key: String(sourceRow.rowId ?? getRowId(sourceRow.item)) } : undefined : displayRows[row];
      const definition = orderedColumns[column];
      if (displayRow?.kind === "item" && definition?.editable) { event.preventDefault(); beginCellEdit(displayRow.key, displayRow.item, definition, row, column); }
      return;
    }
    if (event.key === "ArrowDown") { let next = row + 1; while (!dataSource && next < displayRows.length && displayRows[next]?.kind !== "item") next++; if (next < displayRows.length) row = next; }
    else if (event.key === "ArrowUp") { let next = row - 1; while (!dataSource && next >= 0 && displayRows[next]?.kind !== "item") next--; if (next >= 0) row = next; }
    else if (event.key === "ArrowRight") column++;
    else if (event.key === "ArrowLeft") column--;
    else if (event.key === "Home") column = 0;
    else if (event.key === "End") column = columns.length - 1;
    else return;
    event.preventDefault();
    row = Math.max(0, Math.min(displayRows.length - 1, row));
    column = Math.max(0, Math.min(columns.length - 1, column));
    setActiveCell({ row, column });
    const nextOffset = rowSizes.offset(row), nextSize = rowSizes.size(row);
    const nextScroll = headerHeight + nextOffset;
    if (nextScroll < viewport.current!.scrollTop + headerHeight) viewport.current!.scrollTop = nextOffset;
    else if (nextScroll + nextSize > viewport.current!.scrollTop + viewport.current!.clientHeight) viewport.current!.scrollTop = nextOffset + nextSize - Math.max(0, viewport.current!.clientHeight - headerHeight);
    viewport.current?.querySelector<HTMLElement>(`.spui-grid-header [data-column-index="${column}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    updateColumnWindow();
    requestAnimationFrame(() => viewport.current?.querySelector<HTMLElement>(`[data-row-index="${row}"][data-column-index="${column}"]`)?.focus());
  };
  const startResize = (column: DataGridColumn<T>, event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return;
    event.preventDefault();
    const width = activeColumnWidths[column.id] ?? event.currentTarget.parentElement!.getBoundingClientRect().width;
    resizing.current = { column, startX: event.clientX, startWidth: width, direction: getComputedStyle(viewport.current!).direction === "rtl" ? -1 : 1, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveResize = (event: React.PointerEvent<HTMLDivElement>): void => {
    const current = resizing.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const width = clampDataGridColumnWidth(current.column, current.startWidth + (event.clientX - current.startX) * current.direction, columnSizingOptions[current.column.id]);
    viewport.current?.style.setProperty(dataGridColumnVar(current.column.id), `${width}px`);
    event.currentTarget.setAttribute("aria-valuenow", String(width));
  };
  const endResize = (event: React.PointerEvent<HTMLDivElement>, cancelled = false): void => {
    const current = resizing.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const width = cancelled ? current.startWidth : Number(event.currentTarget.getAttribute("aria-valuenow")) || current.startWidth;
    if (cancelled) viewport.current?.style.setProperty(dataGridColumnVar(current.column.id), `${current.startWidth}px`);
    resizing.current = undefined;
    if (!cancelled) commitColumnResize(current.column, width, event.nativeEvent);
  };
  const autoFitResize = (column: DataGridColumn<T>, event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const header = event.currentTarget.parentElement?.querySelector<HTMLElement>("button");
    const index = columns.indexOf(column);
    const cells = [...(viewport.current?.querySelectorAll<HTMLElement>(`[data-column-index="${index}"]`) ?? [])];
    const padding = getDataGridColumnSizing(column, columnSizingOptions).padding;
    const measure = (element: HTMLElement, extra: number): number => { const range = document.createRange(); range.selectNodeContents(element); return range.getBoundingClientRect().width + padding + extra; };
    const width = clampDataGridColumnWidth(column, Math.max(header ? measure(header, 18) : 0, ...cells.map(cell => measure(cell, 10))), columnSizingOptions[column.id]);
    commitColumnResize(column, width, event.nativeEvent);
    requestAnimationFrame(() => viewport.current?.querySelector<HTMLElement>(`[data-resize-column="${CSS.escape(column.id)}"]`)?.focus());
  };
  const columnWidthVars = Object.fromEntries(Object.entries(activeColumnWidths).map(([id, width]) => [dataGridColumnVar(id), `${width}px`])) as React.CSSProperties;
  const selectionStyles = `.spui-grid-viewport[data-selection-appearance=brand] .spui-grid-row[aria-selected=true]{background:color-mix(in srgb,var(--spui-ui-accent,#0078d4) 14%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}.spui-grid-viewport[data-selection-appearance=neutral] .spui-grid-row[aria-selected=true]{background:color-mix(in srgb,var(--spui-ui-text,#323130) 6%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}.spui-grid-row[aria-selected]{cursor:pointer}.spui-grid-viewport[data-subtle-selection=true] .spui-grid-selection input{opacity:0;transition:opacity var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}.spui-grid-viewport[data-subtle-selection=true] .spui-grid-row:hover .spui-grid-selection input,.spui-grid-viewport[data-subtle-selection=true] .spui-grid-row:focus-within .spui-grid-selection input{opacity:1}@media(prefers-reduced-motion:reduce){.spui-grid-selection input{transition:none}}@media(forced-colors:active){.spui-grid-row[aria-selected=true]{outline:1px solid Highlight}.spui-grid-viewport[data-selection-appearance=brand] .spui-grid-row[aria-selected=true],.spui-grid-viewport[data-selection-appearance=neutral] .spui-grid-row[aria-selected=true]{background:Canvas;color:CanvasText}}`;
  return <div {...host}>
    <style>{selectionStyles}</style>
    {filterable && <div role="search" style={{ marginBlockEnd: 8 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span>{filterLabel}</span>
        <input data-testid="spui-data-grid-filter" type="search" aria-label={filterLabel} value={activeFilterValue} onChange={event => setFilterValue(event.currentTarget.value)}
          style={{ boxSizing: "border-box", width: "min(100%,360px)", minHeight: 36, padding: "6px 10px", border: "1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))", borderRadius: "var(--spui-control-radius,4px)", background: "var(--spui-base-surface,var(--spui-ui-surface,#fff))", color: "var(--spui-ui-text,var(--spui-semantic-body-text,#242424))", font: "inherit" }} />
      </label>
    </div>}
    <style>{`.spui-grid-viewport{position:relative;overflow:auto;overscroll-behavior:contain;border:1px solid var(--spui-data-grid-border,var(--spui-ui-stroke,#d1d1d1));border-radius:var(--spui-data-grid-radius,var(--spui-control-radius,6px));background:var(--spui-data-grid-background,var(--spui-base-surface,var(--spui-ui-surface,#fff)));color:var(--spui-ui-text,var(--spui-semantic-body-text,#323130));outline:none}.spui-grid-viewport:focus-visible,.spui-grid-cell:focus-visible,.spui-grid-header button:focus-visible,.spui-grid-cell input:focus-visible,.spui-grid-resize-handle:focus-visible,.spui-grid-group-button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}.spui-grid-header{position:sticky;top:0;z-index:2;background:var(--spui-data-grid-header-background,var(--spui-base-canvas,var(--spui-ui-canvas,#f5f5f5)));box-shadow:0 1px 0 var(--spui-ui-stroke,#d1d1d1)}.spui-grid-row{box-sizing:border-box;display:grid;align-items:center;min-width:100%;border-block-end:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));background:var(--spui-data-grid-row-background,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}.spui-grid-row:hover{background:var(--spui-data-grid-row-hover,var(--spui-ui-surface-hover,#f5f5f5))}.spui-grid-cell{box-sizing:border-box;display:flex;align-items:center;min-width:0;height:100%;padding-inline:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.spui-grid-header-cell{position:relative;font-weight:600}.spui-grid-header button{width:100%;height:100%;border:0;background:transparent;color:inherit;font:inherit;text-align:start;cursor:pointer}.spui-grid-header-cell>button:not(.spui-grid-reorder-handle){flex:1;min-width:0;width:auto}.spui-grid-header .spui-grid-reorder-handle{flex:none;width:24px;height:28px;margin-inline-end:4px;padding:0;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));font:inherit;cursor:grab}.spui-grid-reorder-handle:hover{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5));color:var(--spui-ui-text,inherit)}.spui-grid-reorder-handle:active{cursor:grabbing}.spui-grid-reorder-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.spui-grid-resize-handle{position:absolute;z-index:1;inset-block:0;inset-inline-end:0;width:10px;display:flex;align-items:center;justify-content:center;touch-action:none;cursor:col-resize;outline:none}.spui-grid-resize-handle::after{content:"";width:1px;height:60%;background:transparent}.spui-grid-resize-handle:hover::after,.spui-grid-resize-handle:focus-visible::after{background:var(--spui-focus-ring,var(--spui-ui-accent,#0078d4))}.spui-grid-selection{justify-content:center;padding-inline:8px}@media(forced-colors:active){.spui-grid-resize-handle::after{background:CanvasText}.spui-grid-reorder-handle{color:ButtonText}}`}</style>
    <style>{`.spui-grid-group-row{background:var(--spui-data-grid-header-background,var(--spui-base-canvas,var(--spui-ui-canvas,#f5f5f5)));font-weight:600}.spui-grid-group-cell{grid-column:1/-1!important;padding-inline:8px}.spui-grid-group-button{display:flex;align-items:center;gap:8px;width:100%;height:100%;padding-inline:4px;border:0;background:transparent;color:inherit;font:inherit;text-align:start;cursor:pointer}.spui-grid-group-button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}.spui-grid-group-button span:last-child{margin-inline-start:auto;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));font-variant-numeric:tabular-nums}`}</style>
    <div ref={viewport} role="grid" aria-label={String(gridAriaLabel ?? label)} aria-rowcount={displayRows.length + 1} data-item-count={dataSource ? sourceLength : sortedItems.length} data-selection-appearance={selectionAppearance} data-subtle-selection={String(subtleSelection)} aria-colcount={columns.length + (selectionMode === "none" ? 0 : 1)} aria-busy={sourceBusy || undefined} tabIndex={(dataSource ? sourceLength : sortedItems.length) ? -1 : 0} onKeyDown={onGridKeyDown} onCopy={onGridCopy} onPaste={event => { void onGridPaste(event); }}
      onScroll={event => { const top = event.currentTarget.scrollTop; if (!frame.current) frame.current = requestAnimationFrame(() => { frame.current = 0; setScrollTop(top); updateColumnWindow(); }); }}
      style={{ height: typeof height === "number" ? `${height}px` : height, overflow: "auto", ...columnWidthVars } as React.CSSProperties} className="spui-grid-viewport">
      <div role="rowgroup" className="spui-grid-header" style={{ display: "grid", position: "sticky", top: 0, zIndex: 1 }}>
        <div role="row" aria-rowindex={1} className="spui-grid-row" style={{ gridTemplateColumns: gridColumns, height: headerHeight }}>
          {selectionMode !== "none" && <div role="columnheader" className="spui-grid-cell spui-grid-selection">{selectionMode === "multiple" && <input type="checkbox" aria-label={selectAllLabel} disabled={dataSource ? sourceSelectableCount === 0 : sortedItems.length === 0} checked={dataSource ? sourceSelectableCount > 0 && sourceSelectionActive && activeDataSourceSelection.mode === "all" && activeDataSourceSelection.excludedKeys.length === 0 : sortedItems.length > 0 && selectedCount === sortedItems.length} ref={node => { if (node) node.indeterminate = dataSource ? sourceSelectableCount > 0 && (sourceSelectionActive ? activeDataSourceSelection.excludedKeys.length > 0 : activeDataSourceSelection.mode === "explicit" && activeDataSourceSelection.keys.length > 0) : selectedCount > 0 && selectedCount < sortedItems.length; }} onChange={event => { if (dataSource) setDataSourceSelection(event.currentTarget.checked ? { mode: "all", excludedKeys: [], ...(dataSource.selectionScopeKey === undefined ? {} : { scopeKey: dataSource.selectionScopeKey }) } : { mode: "explicit", keys: [] }); else setSelection(event.currentTarget.checked ? sortedItems.map(getRowId).map(String) : []); }} />}</div>}
          {orderedColumns.map((column, columnIndex) => <div key={column.id} role="columnheader" data-column-id={column.id} data-column-index={columnIndex} aria-colindex={columnIndex + (selectionMode === "none" ? 1 : 2)} aria-sort={column.sortable === false ? undefined : activeSorts[0]?.columnId === column.id ? activeSorts[0].direction : "none"} className="spui-grid-cell spui-grid-header-cell" onDragOver={event => { if (reorderableColumns && draggedColumn.current) event.preventDefault(); }} onDrop={event => { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); const rtl = getComputedStyle(viewport.current!).direction === "rtl"; const after = rtl ? event.clientX < rect.left + rect.width / 2 : event.clientX > rect.left + rect.width / 2; if (reorderableColumns) moveColumn(draggedColumn.current ?? "", column.id, after); draggedColumn.current = undefined; }}>
            {reorderableColumns && <button type="button" className="spui-grid-reorder-handle" data-reorder-column={column.id} draggable aria-label={`${reorderLabel} ${column.label}`} title={`${reorderLabel} ${column.label}; use Alt+Shift+Arrow keys`} onDragStart={event => { draggedColumn.current = column.id; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", column.id); }} onDragEnd={() => { draggedColumn.current = undefined; }}>⠿</button>}
            {column.sortable === false ? column.label : <button type="button" aria-label={activeSorts.some(entry => entry.columnId === column.id) ? `${column.label}, ${sortPriorityLabel.replace("{priority}", String(activeSorts.findIndex(entry => entry.columnId === column.id) + 1))}` : column.label} onClick={event => changeSort(column.id, event.shiftKey)}>{column.label}{activeSorts.some(entry => entry.columnId === column.id) ? ` ${activeSorts.findIndex(entry => entry.columnId === column.id) + 1}${activeSorts.find(entry => entry.columnId === column.id)?.direction === "ascending" ? "▲" : "▼"}` : ""}</button>}
            {resizableColumns && column.resizable !== false && <div ref={element => { if (element && activeColumnWidths[column.id] === undefined) element.setAttribute("aria-valuenow", String(Math.round(element.parentElement?.getBoundingClientRect().width ?? 120))); }} className="spui-grid-resize-handle" data-resize-column={column.id} role="separator" aria-orientation="vertical" aria-label={`${resizeLabel} ${column.label}`} aria-valuemin={getDataGridColumnSizing(column, columnSizingOptions).minWidth} aria-valuemax={column.maxWidth ?? 1600} aria-valuenow={activeColumnWidths[column.id] ?? getDataGridColumnSizing(column, columnSizingOptions).defaultWidth} tabIndex={0} onDoubleClick={event => autoFitResize(column, event)} onPointerDown={event => startResize(column, event)} onPointerMove={moveResize} onPointerUp={event => endResize(event)} onPointerCancel={event => endResize(event, true)} onLostPointerCapture={event => endResize(event, true)} />}
          </div>)}
        </div>
      </div>
      <div role="rowgroup" style={{ position: "relative" }}>
        {(dataSource ? sourceLength : sortedItems.length) === 0 ? <div role="row" aria-rowindex={2} className="spui-grid-row" style={{ gridTemplateColumns: gridColumns }}><div role="gridcell" className="spui-grid-cell" style={{ gridColumn: `1 / span ${columns.length + (selectionMode === "none" ? 0 : 1)}` }}>{shownEmptyMessage}</div></div> : <>
          <div aria-hidden="true" role="presentation" style={{ height: shouldVirtualize ? rowSizes.offset(first) : 0 }} />
          {Array.from({ length: last - first }, (_, offset) => {
            const rowIndex = first + offset;
            const sourceRow = dataSource ? getDataGridDataSourceRow(dataSource, rowIndex) : undefined;
            const displayRow = dataSource ? sourceRow?.kind === "group" ? { kind: "group" as const, group: { key: sourceRow.key, label: sourceRow.label, value: undefined, items: [], indices: [] }, sourceGroup: { count: sourceRow.count, expanded: sourceRow.expanded } } : sourceRow?.kind === "item" ? { kind: "item" as const, item: sourceRow.item, itemIndex: sourceRow.itemIndex ?? rowIndex, key: String(sourceRow.rowId ?? getRowId(sourceRow.item)) } : undefined : displayRows[rowIndex];
            if (!displayRow) return <div key={`loading-${rowIndex}`} data-row-index={rowIndex} role="row" aria-rowindex={rowIndex + 2} aria-busy="true" aria-label={`${loadingLabel} ${rowIndex + 1}`} className="spui-grid-row" style={{ height: rowSizes.size(rowIndex), gridTemplateColumns: gridColumns }}>
              {selectionMode !== "none" && <div role="gridcell" className="spui-grid-cell spui-grid-selection" />}
              {renderedColumns.map((column, renderedIndex) => { const columnIndex = shouldVirtualizeColumns ? columnWindow.start + renderedIndex : renderedIndex; return <div key={column.id} role="gridcell" data-row-index={rowIndex} data-column-index={columnIndex} aria-colindex={columnIndex + (selectionMode === "none" ? 1 : 2)} className="spui-grid-cell" style={{ gridColumn: String(columnIndex + (selectionMode === "none" ? 1 : 2)), color: "var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161))" }}>{loadingLabel}</div>; })}
            </div>;
            if (displayRow.kind === "group") {
              const expanded = displayRow.sourceGroup ? displayRow.sourceGroup.expanded : !collapsedGroupSet.has(displayRow.group.key);
              const groupCount = displayRow.sourceGroup?.count ?? displayRow.group.items.length;
              return <div key={displayRow.group.key} data-group-key={displayRow.group.key} role="row" aria-rowindex={rowIndex + 2} className="spui-grid-row spui-grid-group-row" style={{ height: rowSizes.size(rowIndex), gridTemplateColumns: gridColumns }}>
                <div role="rowheader" aria-colspan={columns.length + (selectionMode === "none" ? 0 : 1)} className="spui-grid-cell spui-grid-group-cell" style={{ gridColumn: `1 / span ${columns.length + (selectionMode === "none" ? 0 : 1)}` }}>
                  <button type="button" className="spui-grid-group-button" aria-expanded={expanded} aria-label={`${expanded ? collapseGroupLabel : expandGroupLabel} ${displayRow.group.label}, ${groupCount}`} onClick={() => { if (displayRow.sourceGroup) { onDataSourceGroupToggle?.(displayRow.group.key, !expanded); viewport.current?.dispatchEvent(new CustomEvent("spui-data-source-group-toggle", { detail: { groupKey: displayRow.group.key, expanded: !expanded }, bubbles: true, composed: true })); } else setGroupCollapsed(displayRow.group.key, expanded); }}><span aria-hidden="true">{expanded ? "⌄" : "›"}</span><strong>{displayRow.group.label}</strong><span>{groupCount}</span></button>
                </div>
              </div>;
            }
            const { item, itemIndex, key } = displayRow, isSelected = isRowSelected(key);
            return <div key={key} data-row-index={rowIndex} data-row-key={key} data-item-index={itemIndex} role="row" aria-rowindex={rowIndex + 2} aria-selected={selectionMode === "none" ? undefined : isSelected} tabIndex={focusMode === "row_unstable" || focusMode === "composite" ? activeCell.row === rowIndex ? 0 : -1 : undefined} className="spui-grid-row" style={{ height: rowSizes.size(rowIndex), gridTemplateColumns: gridColumns }} onClick={() => { if (selectionMode !== "none") toggleRowSelection(key); }}>
              {selectionMode !== "none" && <div role="gridcell" data-row-index={rowIndex} data-column-index="-1" aria-colindex={1} className="spui-grid-cell spui-grid-selection"><input type={selectionMode === "single" ? "radio" : "checkbox"} name={selectionName} checked={isSelected} readOnly aria-label={`${selectLabel} ${itemIndex + 1}`} /></div>}
          {renderedColumns.map((column, renderedIndex) => {
            const columnIndex = shouldVirtualizeColumns ? columnWindow.start + renderedIndex : renderedIndex;
            const isEditing = editingCell?.rowId === key && editingCell.columnId === column.id && column.editable === true;
            const editedKey = editKey(key, column.id);
            const displayValue = Object.hasOwn(editedCells, editedKey) ? editedCells[editedKey] : getDataGridCellValue(item, column);
            return <div key={column.id} role="gridcell" data-row-index={rowIndex} data-row-key={key} data-column-id={column.id} data-column-index={columnIndex} aria-colindex={columnIndex + (selectionMode === "none" ? 1 : 2)} aria-keyshortcuts={column.editable ? "Enter F2" : undefined} tabIndex={(focusMode === "cell" || focusMode === "composite") && activeCell.row === rowIndex && activeCell.column === columnIndex ? 0 : -1} className="spui-grid-cell" title={column.editable ? editHint : undefined} style={{ gridColumn: String(columnIndex + (selectionMode === "none" ? 1 : 2)), ...(editingCell?.error && editingCell.rowId === key && editingCell.columnId === column.id ? { position: "relative" } : {}) }} onDoubleClick={() => beginCellEdit(key, item, column, rowIndex, columnIndex)}>
              {isEditing ? <>
                {editingCell.error && <span className="spui-grid-edit-error" role="alert" style={{ position: "absolute", zIndex: 3, insetBlockStart: "100%", insetInlineStart: 8, padding: "4px 8px", border: "1px solid var(--spui-semantic-danger,#d13438)", borderRadius: 4, background: "var(--spui-base-surface,#fff)", color: "var(--spui-semantic-danger,#d13438)", fontSize: 12 }}>{editingCell.error}</span>}
                <input autoFocus data-testid="spui-data-grid-editor" type={column.editType || "text"} aria-label={`${column.label}, ${rowLabel} ${itemIndex + 1}`} aria-invalid={Boolean(editingCell.error)} aria-busy={Boolean(editingCell.saving)} value={editingCell.draft} disabled={Boolean(editingCell.saving)} onChange={event => { const current = editingCellRef.current; if (current) updateEditingCell({ ...current, draft: event.currentTarget.value, error: undefined }); }} onBlur={event => { void commitCellEdit(key, item, column, event.currentTarget.value); }} onKeyDown={event => { event.stopPropagation(); if (event.key === "Escape") { event.preventDefault(); cancelCellEdit(key, column.id); } else if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }} style={{ boxSizing: "border-box", width: "100%", minWidth: 0, minHeight: 30, padding: "3px 6px", border: `1px solid var(${editingCell.error ? "--spui-semantic-danger" : "--spui-ui-accent"},${editingCell.error ? "#d13438" : "#78716c"})`, borderRadius: "var(--spui-control-radius,4px)", background: "var(--spui-base-surface,var(--spui-ui-surface,#fff))", color: "var(--spui-ui-text,var(--spui-semantic-body-text,#242424))", font: "inherit" }} />
              </> : Object.hasOwn(editedCells, editedKey) ? String(displayValue ?? "") : renderCell ? renderCell(item, column, itemIndex) : String(displayValue ?? "")}
            </div>;
          })}
            </div>;
          })}
          <div aria-hidden="true" role="presentation" style={{ height: shouldVirtualize ? Math.max(0, rowSizes.totalSize - rowSizes.offset(last)) : 0 }} />
        </>}
      </div>
    </div>
    <div className="spui-grid-reorder-status" role="status" aria-live="polite">{sourceError ? `Data could not be loaded: ${sourceError}` : reorderAnnouncement}</div>
  </div>;
}

type VirtualDataGridProps<T> = Parameters<typeof VirtualDataGrid<T>>[0];
export type DataGridCompositionSortState = { sortColumn: TableColumnId | undefined; sortDirection: TableSortDirection };
export type DataGridSelectionChangeData<T> = { selectedItems: Set<T> };
export type DataGridCompositionContextValue<T> = {
  items: readonly T[];
  dataSource?: DataGridDataSource<T>;
  totalRows: number;
  firstRow: number;
  lastRow: number;
  rowHeight: number;
  sourceBusy: boolean;
  sourceError: string;
  expandGroupLabel: string;
  collapseGroupLabel: string;
  groupCountLabel: string;
  toggleGroup: (group: Extract<DataGridDataSourceRow<T>, { kind: "group" }>) => void;
  columns: readonly TableColumnDefinition<T>[];
  getRowId: (item: T) => string | number;
  selectionMode: "none" | "single" | "multiselect";
  selectionAppearance: "brand" | "neutral";
  subtleSelection: boolean;
  focusMode: DataGridFocusMode;
  selectedItems: Set<T>;
  selectionModel: DataGridSelectionModel;
  setSelectionModel: (selection: DataGridSelectionModel, event: React.SyntheticEvent) => void;
  isItemSelected: (item: T) => boolean;
  isRowSelected: (rowId: string | number, item: T) => boolean;
  setSelectedItems: (items: Set<T>, event: React.SyntheticEvent) => void;
  sortState: DataGridCompositionSortState;
  setSortState: (state: DataGridCompositionSortState, event: React.MouseEvent) => void;
  activeCell: { row: number; column: number };
  setActiveCell: (row: number, column: number) => void;
  columnWidths: DataGridColumnWidths;
  resizeColumn: (id: string, width: number, event: DataGridColumnResizeEvent) => void;
  columnSizingOptions: DataGridColumnSizingOptions;
  resizableColumns: boolean;
  autoFitColumns: boolean;
  resizeLabel: string;
  orderedColumns?: readonly TableColumnDefinition<T>[];
  reorderColumn?: (fromId: string, toId: string, after?: boolean) => void;
  reorderableColumns?: boolean;
  reorderLabel?: string;
  draggedColumn?: React.MutableRefObject<string | undefined>;
  editHint: string;
  rowLabel: string;
  editedCells: Record<string, DataGridEditValue>;
  onCellEdit?: (edit: DataGridCellEdit<T>) => void | Promise<void>;
  validateCellEdit?: (edit: DataGridCellEdit<T>) => string | undefined;
  setEditedCell: (key: string, value: DataGridEditValue) => void;
};
export type DataGridContextValue<T> = Omit<DataGridCompositionContextValue<T>, "items" | "columns"> & {
  /** Fluent table feature state uses mutable snapshots; these arrays are local projections. */
  items: T[];
  columns: TableColumnDefinition<T>[];
  /** Fluent table feature state projected from the active DataGrid composition. */
  getRows: TableFeaturesState<T>["getRows"];
  selection: TableSelectionState;
  sort: TableSortState<T>;
  tableRef: React.RefObject<HTMLDivElement | null>;
  columnSizing_unstable: TableColumnSizingState;
  selectableRows: boolean;
  compositeRowTabsterAttribute: TableCompositeNavigationAttribute;
};
const defaultDataGridContextValue: DataGridContextValue<unknown> = {
  items: [], totalRows: 0, firstRow: 0, lastRow: 0, rowHeight: 40, sourceBusy: false, sourceError: "",
  expandGroupLabel: defaultStrings.dataGridExpandGroupLabel ?? "Expand group", collapseGroupLabel: defaultStrings.dataGridCollapseGroupLabel ?? "Collapse group", groupCountLabel: defaultStrings.dataGridGroupCountLabel ?? "{count} items",
  toggleGroup: () => {}, columns: [], getRowId: () => "", selectionMode: "none", selectionAppearance: "brand", subtleSelection: false, focusMode: "none",
  selectedItems: new Set(), selectionModel: { mode: "explicit", keys: [] }, setSelectionModel: () => {}, isItemSelected: () => false, isRowSelected: () => false, setSelectedItems: () => {},
  sortState: { sortColumn: undefined, sortDirection: "ascending" }, setSortState: () => {}, activeCell: { row: 0, column: 0 }, setActiveCell: () => {},
  columnWidths: EMPTY_DATA_GRID_COLUMN_WIDTHS, resizeColumn: () => {}, columnSizingOptions: EMPTY_DATA_GRID_COLUMN_SIZING_OPTIONS, resizableColumns: false, autoFitColumns: true,
  resizeLabel: defaultStrings.dataGridResizeLabel ?? "Resize column", orderedColumns: [], reorderableColumns: false,
  editHint: defaultStrings.dataGridEditHint ?? "Press Enter to edit", rowLabel: defaultStrings.dataGridRowLabel ?? "row", editedCells: {}, setEditedCell: () => {},
  getRows: () => [],
  selection: { selectionMode: "multiselect", selectedRows: new Set(), allRowsSelected: false, someRowsSelected: false, isRowSelected: () => false, toggleRow: () => {}, selectRow: () => {}, deselectRow: () => {}, toggleAllRows: () => {}, clearRows: () => {} },
  sort: { sortColumn: undefined, sortDirection: "ascending", getSortDirection: () => undefined, setColumnSort: () => {}, toggleColumnSort: () => {}, sort: rows => rows.slice() },
  tableRef: React.createRef<HTMLDivElement>(),
  columnSizing_unstable: { getOnMouseDown: () => () => {}, setColumnWidth: () => {}, getColumnWidths: () => [], getTableProps: props => props ?? {}, getTableHeaderCellProps: () => ({}), getTableCellProps: () => ({}), enableKeyboardMode: () => () => {} },
  selectableRows: false,
  compositeRowTabsterAttribute: { "data-tabster": JSON.stringify({ mover: { cyclic: false, direction: 2, memorizeCurrent: true } }) },
};
export type DataGridCompositionRow<T> = { item: T; rowId: string | number; index: number };
export type DataGridCompositionGroupRow<T> = { group: Extract<DataGridDataSourceRow<T>, { kind: "group" }>; index: number };
export type DataGridRowRenderHelpers<T> = {
  item?: T;
  rowId?: string | number;
  renderCell: (column: TableColumnDefinition<T>) => React.ReactNode;
  renderHeaderCell: (column: TableColumnDefinition<T>) => React.ReactNode;
  columns: readonly TableColumnDefinition<T>[];
  dataGridContextValue: DataGridContextValue<T>;
};
export type DataGridCompositionProps<T> = Omit<ElementProps, "children"> & {
  items?: readonly T[];
  dataSource?: DataGridDataSource<T>;
  onDataLoadError?: (error: unknown, range: { start: number; end: number }) => void;
  onDataSourceGroupToggle?: (groupKey: string, expanded: boolean) => void;
  onRenderedRange?: (range: { start: number; end: number; total: number }) => void;
  rowHeight?: number;
  overscan?: number;
  virtualize?: boolean;
  loadingLabel?: string;
  expandGroupLabel?: string;
  collapseGroupLabel?: string;
  groupCountLabel?: string;
  columns: readonly TableColumnDefinition<T>[];
  getRowId: (item: T) => string | number;
  selectionMode?: "none" | "single" | "multiselect";
  selectionAppearance?: "brand" | "neutral";
  subtleSelection?: boolean;
  focusMode?: DataGridFocusMode;
  selectedItems?: Set<T>;
  defaultSelectedItems?: Set<T>;
  selectionModel?: DataGridSelectionModel;
  defaultSelectionModel?: DataGridSelectionModel;
  onDataSourceSelectionChange?: (selection: DataGridSelectionModel, selectedItems: T[]) => void;
  onSelectionChange?: (event: DataGridSelectionChangeEvent, data: DataGridSelectionChangeData<T>) => void;
  sortState?: DataGridCompositionSortState;
  defaultSortState?: DataGridCompositionSortState;
  onSortChange?: (event: React.MouseEvent, state: DataGridCompositionSortState) => void;
  label?: string;
  resizableColumns?: boolean;
  columnWidths?: DataGridColumnWidths;
  defaultColumnWidths?: DataGridColumnWidths;
  columnSizingOptions?: DataGridColumnSizingOptions;
  resizableColumnsOptions?: { autoFitColumns?: boolean };
  containerWidthOffset?: number;
  onColumnResize?: (event: DataGridColumnResizeEvent, data: DataGridColumnResizeData) => void;
  resizeLabel?: string;
  reorderableColumns?: boolean;
  columnOrder?: readonly string[];
  defaultColumnOrder?: readonly string[];
  onColumnOrderChange?: (columnIds: string[]) => void;
  reorderLabel?: string;
  onCellEdit?: (edit: DataGridCellEdit<T>) => void | Promise<void>;
  validateCellEdit?: (edit: DataGridCellEdit<T>) => string | undefined;
  rowLabel?: string;
  editHint?: string;
  children?: React.ReactNode;
};
export type DataGridProps<T> = VirtualDataGridProps<T> | DataGridCompositionProps<T>;

type DataGridCompositionStore = {
  value: DataGridContextValue<unknown> | undefined;
  listeners: Set<() => void>;
};
const DataGridCompositionContext = React.createContext<DataGridCompositionStore | undefined>(undefined);
const subscribeToNoDataGrid = (): (() => void) => () => {};
const DataGridColumnIdContext = React.createContext<TableColumnId | undefined>(undefined);
const DataGridRowItemContext = React.createContext<unknown>(undefined);
const DataGridRowIdContext = React.createContext<string | number | undefined>(undefined);
const DataGridRegionContext = React.createContext<"header" | "body">("body");

export function DataGridContextProvider<T>({ value, children }: { value: DataGridContextValue<T> | undefined; children?: React.ReactNode }): React.ReactElement {
  const storeRef = React.useRef<DataGridCompositionStore | undefined>(undefined);
  if (!storeRef.current) storeRef.current = { value: value as DataGridContextValue<unknown> | undefined, listeners: new Set() };
  const store = storeRef.current;
  React.useLayoutEffect(() => {
    store.value = value as DataGridContextValue<unknown> | undefined;
    for (const listener of store.listeners) listener();
  }, [store, value]);
  return <DataGridCompositionContext.Provider value={store}>{children}</DataGridCompositionContext.Provider>;
}
export function ColumnIdContextProvider({ value, children }: { value: TableColumnId | undefined; children?: React.ReactNode }): React.ReactElement {
  return <DataGridColumnIdContext.Provider value={value}>{children}</DataGridColumnIdContext.Provider>;
}

function useDataGridComposition<T>(): DataGridContextValue<T> | undefined {
  return useDataGridContextSelector(context => context) as DataGridContextValue<T> | undefined;
}

function useDataGridContextSelector<TValue>(selector: (context: DataGridContextValue<unknown> | undefined) => TValue): TValue {
  const store = React.useContext(DataGridCompositionContext);
  const selectorRef = React.useRef(selector);
  selectorRef.current = selector;
  const snapshotRef = React.useRef<{ store: DataGridCompositionStore | undefined; source: DataGridContextValue<unknown> | undefined; value: TValue } | undefined>(undefined);
  const getSnapshot = React.useCallback(() => {
    const source = store?.value;
    const previous = snapshotRef.current;
    if (previous && previous.store === store && Object.is(previous.source, source)) return previous.value;
    const value = selectorRef.current(source);
    if (previous && previous.store === store && Object.is(previous.value, value)) {
      snapshotRef.current = { store, source, value: previous.value };
      return previous.value;
    }
    snapshotRef.current = { store, source, value };
    return value;
  }, [store]);
  const subscribe = React.useCallback((listener: () => void) => {
    if (!store) return subscribeToNoDataGrid();
    store.listeners.add(listener);
    return () => { store.listeners.delete(listener); };
  }, [store]);
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Select from the nearest DataGrid context, using Fluent-compatible defaults outside a provider. */
export function useDataGridContext_unstable<TValue>(selector: (context: DataGridContextValue<unknown>) => TValue): TValue {
  return useDataGridContextSelector(context => selector(context ?? defaultDataGridContextValue));
}

function ComposedDataGrid<T>({ items = [], dataSource, onDataLoadError, onDataSourceSelectionChange, onDataSourceGroupToggle, onRenderedRange, rowHeight: requestedRowHeight = 40, overscan = 4, virtualize, loadingLabel: loadingLabelProp, expandGroupLabel: expandGroupLabelProp, collapseGroupLabel: collapseGroupLabelProp, groupCountLabel: groupCountLabelProp, columns, getRowId, selectionMode = "none", selectionAppearance = "brand", subtleSelection = false, focusMode = "cell", selectedItems, defaultSelectedItems = new Set<T>(), selectionModel, defaultSelectionModel, onSelectionChange, sortState, defaultSortState, onSortChange, onCellEdit, validateCellEdit, rowLabel: rowLabelProp, editHint: editHintProp, label: labelProp, resizableColumns = false, columnWidths, defaultColumnWidths = EMPTY_DATA_GRID_COLUMN_WIDTHS, columnSizingOptions = EMPTY_DATA_GRID_COLUMN_SIZING_OPTIONS, resizableColumnsOptions = DEFAULT_DATA_GRID_RESIZABLE_COLUMNS_OPTIONS, containerWidthOffset = 0, onColumnResize, resizeLabel: resizeLabelProp, reorderableColumns = false, columnOrder, defaultColumnOrder, onColumnOrderChange, reorderLabel: reorderLabelProp, children, onKeyDown: onGridKeyDown, ...props }: DataGridCompositionProps<T>): React.ReactElement {
  const compositionStrings = React.useContext(UIContext).strings;
  const label = labelProp ?? (typeof props["aria-label"] === "string" ? props["aria-label"] as string : compositionStrings.dataGridLabel ?? defaultStrings.dataGridLabel!);
  const loadingLabel = loadingLabelProp ?? compositionStrings.dataGridLoadingLabel ?? defaultStrings.dataGridLoadingLabel!;
  const expandGroupLabel = expandGroupLabelProp ?? compositionStrings.dataGridExpandGroupLabel ?? defaultStrings.dataGridExpandGroupLabel!;
  const collapseGroupLabel = collapseGroupLabelProp ?? compositionStrings.dataGridCollapseGroupLabel ?? defaultStrings.dataGridCollapseGroupLabel!;
  const groupCountLabel = groupCountLabelProp ?? compositionStrings.dataGridGroupCountLabel ?? defaultStrings.dataGridGroupCountLabel!;
  const rowLabel = rowLabelProp ?? compositionStrings.dataGridRowLabel ?? defaultStrings.dataGridRowLabel!;
  const editHint = editHintProp ?? compositionStrings.dataGridEditHint ?? defaultStrings.dataGridEditHint!;
  const resizeLabel = resizeLabelProp ?? compositionStrings.dataGridResizeLabel ?? defaultStrings.dataGridResizeLabel!;
  const reorderLabel = reorderLabelProp ?? compositionStrings.dataGridReorderLabel ?? defaultStrings.dataGridReorderLabel!;
  const [internalSelection, setInternalSelection] = React.useState(() => new Set(defaultSelectedItems));
  const [internalSelectionModel, setInternalSelectionModel] = React.useState<DataGridSelectionModel>(() => defaultSelectionModel ?? { mode: "explicit", keys: [...defaultSelectedItems].map(item => String(getRowId(item))) });
  const [internalSort, setInternalSort] = React.useState<DataGridCompositionSortState>(defaultSortState ?? { sortColumn: undefined, sortDirection: "ascending" });
  const [internalWidths, setInternalWidths] = React.useState<DataGridColumnWidths>(() => ({ ...defaultColumnWidths }));
  const [keyboardSizingColumns, setKeyboardSizingColumns] = React.useState(() => new Set<string>());
  const keyboardSizingColumnsRef = React.useRef(keyboardSizingColumns);
  const [internalColumnOrder, setInternalColumnOrder] = React.useState<string[]>(() => [...(defaultColumnOrder ?? columns.map(column => String(column.columnId)))]);
  const [reorderAnnouncement, setReorderAnnouncement] = React.useState("");
  const [editedCells, setEditedCells] = React.useState<Record<string, DataGridEditValue>>({});
  const [sourceRevision, setSourceRevision] = React.useState(0);
  const [sourceVersion, setSourceVersion] = React.useState(0);
  const [sourceBusy, setSourceBusy] = React.useState(false);
  const [sourceError, setSourceError] = React.useState("");
  const [viewport, setViewport] = React.useState({ top: 0, height: 320, width: 0 });
  const gridRoot = React.useRef<HTMLDivElement>(null);
  const sizingCleanup = React.useRef<(() => void) | undefined>(undefined);
  React.useEffect(() => () => sizingCleanup.current?.(), []);
  const scrollFrame = React.useRef<number>();
  const sourceRequestActive = React.useRef(false);
  const pendingCellFocus = React.useRef<{ row: number; column: number }>();
  const dataLoadErrorRef = React.useRef(onDataLoadError);
  dataLoadErrorRef.current = onDataLoadError;
  const syncViewport = React.useCallback((): void => {
    const root = gridRoot.current;
    if (!root) return;
    const next = { top: root.scrollTop, height: root.clientHeight || 320, width: root.clientWidth };
    setViewport(current => current.top === next.top && current.height === next.height && current.width === next.width ? current : next);
  }, []);
  const safeRowHeight = clampDataGridRowHeight(requestedRowHeight, 40);
  const totalRows = dataSource ? Math.max(0, Math.floor(Number.isFinite(dataSource.length) ? dataSource.length : 0)) : items.length;
  const shouldVirtualize = dataSource ? true : virtualize ?? totalRows > 100;
  const firstRow = shouldVirtualize ? Math.max(0, Math.floor(Math.max(0, viewport.top - 40) / safeRowHeight) - Math.max(0, overscan)) : 0;
  const visibleCount = Math.max(1, Math.ceil(Math.max(0, viewport.height - 40) / safeRowHeight));
  const lastRow = shouldVirtualize ? Math.min(totalRows, firstRow + visibleCount + Math.max(0, overscan) * 2) : totalRows;
  const draggedColumn = React.useRef<string>();
  const activeColumnOrder = columnOrder ?? internalColumnOrder;
  const orderedColumns = React.useMemo(() => {
    const byId = new Map(columns.map(column => [String(column.columnId), column]));
    return [...activeColumnOrder.flatMap(id => { const column = byId.get(id); return column ? [column] : []; }), ...columns.filter(column => !activeColumnOrder.includes(String(column.columnId)))];
  }, [columns, activeColumnOrder]);
  const rawWidths = columnWidths ?? internalWidths;
  const autoFitColumns = resizableColumnsOptions.autoFitColumns !== false;
  const fitColumns = React.useMemo(() => resizableColumns && autoFitColumns && viewport.width > 0
    ? fitDataGridColumnWidths(orderedColumns.map(column => ({ id: String(column.columnId), label: String(column.columnId) })), viewport.width - (Number.isFinite(containerWidthOffset) ? containerWidthOffset : 0), columnSizingOptions, rawWidths, selectionMode === "none" ? 0 : 44)
    : {}, [resizableColumns, autoFitColumns, viewport.width, containerWidthOffset, orderedColumns, columnSizingOptions, rawWidths, selectionMode]);
  const activeWidths = React.useMemo(() => ({ ...rawWidths, ...fitColumns }), [rawWidths, fitColumns]);
  const [activeCell, setActiveCellState] = React.useState(() => ({ row: focusMode === "row_unstable" ? 1 : 0, column: 0 }));
  React.useEffect(() => { if (focusMode === "row_unstable") setActiveCellState(current => ({ ...current, row: totalRows ? 1 : 0 })); }, [focusMode, totalRows]);
  React.useEffect(() => {
    const root = gridRoot.current;
    if (!root) return;
    syncViewport();
    const observer = new ResizeObserver(syncViewport);
    observer.observe(root);
    return () => observer.disconnect();
  }, [syncViewport]);
  React.useEffect(() => {
    if (!dataSource) { setSourceBusy(false); setSourceError(""); return; }
    const unsubscribe = dataSource.subscribe?.(() => {
      setSourceVersion(value => value + 1);
      if (!sourceRequestActive.current) setSourceRevision(value => value + 1);
    });
    return () => { unsubscribe?.(); };
  }, [dataSource]);
  React.useEffect(() => {
    if (!dataSource || firstRow >= lastRow) { setSourceBusy(false); return; }
    const missing = (): boolean => { for (let index = firstRow; index < lastRow; index++) if (!getDataGridDataSourceRow(dataSource, index)) return true; return false; };
    if (!missing()) { setSourceBusy(false); setSourceError(""); return; }
    const controller = new AbortController(); let live = true;
    sourceRequestActive.current = true;
    setSourceBusy(true); setSourceError("");
    void Promise.resolve().then(() => dataSource.loadRange(firstRow, lastRow, controller.signal)).then(() => {
      if (!live || controller.signal.aborted) return;
      if (missing()) throw new Error(`Data source did not provide every row in range ${firstRow}–${lastRow}.`);
      sourceRequestActive.current = false;
      setSourceBusy(false); setSourceError(""); setSourceVersion(value => value + 1);
    }).catch(error => {
      if (!live || controller.signal.aborted) return;
      sourceRequestActive.current = false;
      const message = error instanceof Error ? error.message : String(error);
      setSourceBusy(false); setSourceError(message); dataLoadErrorRef.current?.(error, { start: firstRow, end: lastRow });
      gridRoot.current?.dispatchEvent(new CustomEvent("spui-data-load-error", { detail: { error, start: firstRow, end: lastRow }, bubbles: true, composed: true }));
    });
    return () => { live = false; sourceRequestActive.current = false; controller.abort(); };
  }, [dataSource, firstRow, lastRow, sourceRevision]);
  React.useLayoutEffect(() => {
    const root = gridRoot.current;
    const pending = pendingCellFocus.current;
    if (!pending) return;
    let frame = 0;
    let attempts = 0;
    const focusWhenMounted = (): void => {
      const target = root?.querySelector<HTMLElement>(`[data-grid-row-index="${pending.row}"][data-grid-column-index="${pending.column}"]`) ?? root?.querySelector<HTMLElement>(`[role="row"][data-grid-row-index="${pending.row}"] button`);
      if (target) { pendingCellFocus.current = undefined; target.focus(); return; }
      if (sourceError || attempts++ >= 300) { pendingCellFocus.current = undefined; return; }
      frame = requestAnimationFrame(focusWhenMounted);
    };
    focusWhenMounted();
    return () => cancelAnimationFrame(frame);
  }, [firstRow, lastRow, sourceVersion, sourceBusy, sourceError, activeCell]);
  React.useEffect(() => { onRenderedRange?.({ start: firstRow, end: lastRow, total: totalRows }); }, [firstRow, lastRow, totalRows, onRenderedRange]);
  React.useEffect(() => () => { if (scrollFrame.current !== undefined) cancelAnimationFrame(scrollFrame.current); }, []);
  const selected = selectedItems ?? internalSelection;
  const activeSelectionModel = selectionModel ?? internalSelectionModel;
  const isRowSelected = (rowId: string | number, item: T): boolean => dataSource ? isDataGridRowSelected(activeSelectionModel, String(rowId), dataSource.selectionScopeKey) : selected.has(item);
  const isItemSelected = (item: T): boolean => isRowSelected(getRowId(item), item);
  const setSelectionModel = (next: DataGridSelectionModel, event: React.SyntheticEvent): void => {
    if (selectionModel === undefined) setInternalSelectionModel(next);
    const loadedItems: T[] = [];
    for (let index = firstRow; index < lastRow; index++) {
      const row = dataSource ? getDataGridDataSourceRow(dataSource, index) : undefined;
      if (row?.kind === "item" && isDataGridRowSelected(next, String(row.rowId ?? getRowId(row.item)), dataSource?.selectionScopeKey)) loadedItems.push(row.item);
    }
    onDataSourceSelectionChange?.(next, loadedItems);
    onSelectionChange?.(event as DataGridSelectionChangeEvent, { selectedItems: new Set(loadedItems) });
  };
  const activeSort = sortState ?? internalSort;
  const setSelectedItems = (next: Set<T>, event: React.SyntheticEvent): void => {
    if (selectedItems === undefined) setInternalSelection(next);
    onSelectionChange?.(event as DataGridSelectionChangeEvent, { selectedItems: next });
  };
  const setSort = (next: DataGridCompositionSortState, event: React.MouseEvent): void => {
    if (sortState === undefined) setInternalSort(next);
    onSortChange?.(event, next);
  };
  const setActiveCell = (row: number, column: number): void => setActiveCellState({ row, column });
  const setEditedCell = (key: string, value: DataGridEditValue): void => setEditedCells(current => ({ ...current, [key]: value }));
  const resizeColumn = (id: string, width: number, event: DataGridColumnResizeEvent): void => {
    const sourceColumn = columns.find(column => String(column.columnId) === id);
    if (!sourceColumn) return;
    const sizingColumn = { id, label: id };
    const next = clampDataGridColumnWidth(sizingColumn, width, columnSizingOptions[id]);
    if (columnWidths === undefined) setInternalWidths(current => ({ ...current, [id]: next }));
    onColumnResize?.(event, { columnId: id, width: next });
  };
  const moveColumn = (fromId: string, toId: string, after = false): void => {
    if (!fromId || fromId === toId || !orderedColumns.some(column => String(column.columnId) === fromId) || !orderedColumns.some(column => String(column.columnId) === toId)) return;
    const next = orderedColumns.map(column => String(column.columnId));
    next.splice(next.indexOf(fromId), 1);
    next.splice(next.indexOf(toId) + Number(after), 0, fromId);
    if (next.every((id, index) => id === String(orderedColumns[index].columnId))) return;
    if (columnOrder === undefined) setInternalColumnOrder(next);
    onColumnOrderChange?.(next);
    const moved = orderedColumns.find(column => String(column.columnId) === fromId)!;
    setReorderAnnouncement((compositionStrings.dataGridColumnReordered ?? defaultStrings.dataGridColumnReordered!).replace("{label}", getVisibleText(moved.renderHeaderCell()) || String(moved.columnId)).replace("{position}", String(next.indexOf(fromId) + 1)).replace("{count}", String(next.length)));
  };
  const tracks = [...(selectionMode === "none" ? [] : ["44px"]), ...orderedColumns.map(column => {
    const id = String(column.columnId);
    const size = getDataGridColumnSizing({ id, label: id }, columnSizingOptions);
    return `${activeWidths[id] ?? size.defaultWidth}px`;
  })].join(" ");
  const toggleGroup = (group: Extract<DataGridDataSourceRow<T>, { kind: "group" }>): void => {
    onDataSourceGroupToggle?.(group.key, !group.expanded);
    gridRoot.current?.dispatchEvent(new CustomEvent("spui-data-source-group-toggle", { detail: { groupKey: group.key, expanded: !group.expanded }, bubbles: true, composed: true }));
  };
  const contextRows = React.useMemo(() => {
    if (!dataSource) return items.map((item, index) => ({ item, rowId: getRowId(item) ?? index }));
    const loaded: TableRowData<T>[] = [];
    for (let index = firstRow; index < lastRow; index++) {
      const row = getDataGridDataSourceRow(dataSource, index);
      if (row?.kind === "item") loaded.push({ item: row.item, rowId: row.rowId ?? getRowId(row.item) ?? index });
    }
    return loaded;
  }, [items, dataSource, firstRow, lastRow, sourceRevision, sourceVersion, getRowId]);
  const contextItems = React.useMemo(() => contextRows.map(row => row.item), [contextRows]);
  const contextColumns = React.useMemo(() => [...columns], [columns]);
  const fluentRows = React.useCallback(<TRow extends TableRowData<T> = TableRowData<T>>(enhance?: (row: TableRowData<T>) => TRow): TRow[] => contextRows.map(row => (enhance ?? ((value: TableRowData<T>) => value as TRow))(row)), [contextRows]);
  const fluentSelection = React.useMemo<TableSelectionState>(() => {
    const selectedRows = new Set(contextRows.filter(row => isRowSelected(row.rowId, row.item)).map(row => row.rowId));
    const updateRow = (event: React.SyntheticEvent, rowId: TableRowId, mode: "toggle" | "select" | "deselect"): void => {
      const row = contextRows.find(candidate => candidate.rowId === rowId);
      if (row === undefined || selectionMode === "none") return;
      const item = row.item;
      const currentlySelected = isRowSelected(rowId, item);
      const nextSelected = mode === "toggle" ? !currentlySelected : mode === "select";
      if (dataSource) {
        setSelectionModel(setDataGridRowSelected(activeSelectionModel, String(rowId), nextSelected, dataSource.selectionScopeKey), event);
        return;
      }
      const next = new Set(selectionMode === "single" ? [] : selected);
      if (nextSelected) next.add(item); else next.delete(item);
      setSelectedItems(next, event);
    };
    const sourceAllSelected = dataSource !== undefined && activeSelectionModel.mode === "all" && (activeSelectionModel.scopeKey === undefined || activeSelectionModel.scopeKey === dataSource.selectionScopeKey);
    const allRowsSelected = dataSource ? sourceAllSelected : contextRows.length > 0 && contextRows.every(row => isRowSelected(row.rowId, row.item));
    const someRowsSelected = dataSource
      ? activeSelectionModel.mode === "all" ? activeSelectionModel.excludedKeys.length > 0 : activeSelectionModel.keys.length > 0
      : selectedRows.size > 0 && !allRowsSelected;
    return {
      selectionMode: selectionMode === "single" ? "single" : "multiselect", selectedRows, allRowsSelected, someRowsSelected,
      isRowSelected: rowId => selectedRows.has(rowId),
      toggleRow: (event, rowId) => updateRow(event, rowId, "toggle"),
      selectRow: (event, rowId) => updateRow(event, rowId, "select"),
      deselectRow: (event, rowId) => updateRow(event, rowId, "deselect"),
      toggleAllRows: event => {
        if (selectionMode !== "multiselect") return;
        if (dataSource) {
          const model: DataGridSelectionModel = sourceAllSelected
            ? { mode: "explicit", keys: [] }
            : { mode: "all", excludedKeys: [], ...(dataSource.selectionScopeKey === undefined ? {} : { scopeKey: dataSource.selectionScopeKey }) };
          setSelectionModel(model, event);
        } else setSelectedItems(allRowsSelected ? new Set<T>() : new Set(contextRows.map(row => row.item)), event);
      },
      clearRows: event => dataSource ? setSelectionModel({ mode: "explicit", keys: [] }, event) : setSelectedItems(new Set(), event),
    };
  }, [contextRows, isRowSelected, selectionMode, dataSource, activeSelectionModel, setSelectionModel, setSelectedItems]);
  const fluentSort = React.useMemo<TableSortState<T>>(() => {
    const sort = <TRow extends TableRowData<T>>(rows: TRow[]): TRow[] => {
      const column = columns.find(candidate => candidate.columnId === activeSort.sortColumn);
      if (!column) return rows.slice();
      const direction = activeSort.sortDirection === "ascending" ? 1 : -1;
      return rows.slice().sort((a, b) => column.compare(a.item, b.item) * direction);
    };
    const commit = (event: React.SyntheticEvent, columnId: TableColumnId | undefined, direction: TableSortDirection): void => setSort({ sortColumn: columnId, sortDirection: direction }, event as React.MouseEvent);
    return {
      ...activeSort,
      getSortDirection: columnId => columnId === activeSort.sortColumn ? activeSort.sortDirection : undefined,
      setColumnSort: (event, columnId, direction) => commit(event, columnId, direction),
      toggleColumnSort: (event, columnId) => commit(event, columnId, activeSort.sortColumn === columnId && activeSort.sortDirection === "ascending" ? "descending" : "ascending"),
      sort,
    };
  }, [columns, activeSort, setSort]);
  const fluentSizing = React.useMemo<TableColumnSizingState>(() => {
    const widths = (): ColumnWidthState[] => orderedColumns.map(column => {
      const columnId = String(column.columnId);
      const sizing = getDataGridColumnSizing({ id: columnId, label: columnId }, columnSizingOptions);
      return { columnId, width: activeWidths[columnId] ?? sizing.defaultWidth, minWidth: sizing.minWidth, idealWidth: sizing.idealWidth, padding: sizing.padding };
    });
    const setWidth = (columnId: TableColumnId, width: number): void => resizeColumn(String(columnId), width, undefined);
    return {
      getOnMouseDown: columnId => event => {
        const startX = "touches" in event ? event.touches[0]?.clientX : event.clientX;
        const initial = activeWidths[String(columnId)];
        if (startX === undefined || initial === undefined) return;
        event.preventDefault();
        sizingCleanup.current?.();
        const touch = "touches" in event;
        const move = (nativeEvent: MouseEvent | TouchEvent): void => {
          const x = "touches" in nativeEvent ? nativeEvent.touches[0]?.clientX ?? nativeEvent.changedTouches[0]?.clientX : nativeEvent.clientX;
          const direction = gridRoot.current && getComputedStyle(gridRoot.current).direction === "rtl" ? -1 : 1;
          if (x !== undefined) resizeColumn(String(columnId), initial + (x - startX) * direction, nativeEvent);
        };
        const cleanup = (): void => {
          document.removeEventListener(touch ? "touchmove" : "mousemove", move);
          document.removeEventListener(touch ? "touchend" : "mouseup", finish);
          document.removeEventListener("touchcancel", finish);
          if (sizingCleanup.current === cleanup) sizingCleanup.current = undefined;
        };
        const finish = (): void => cleanup();
        sizingCleanup.current = cleanup;
        document.addEventListener(touch ? "touchmove" : "mousemove", move, { passive: false });
        document.addEventListener(touch ? "touchend" : "mouseup", finish, { once: true });
        if (touch) document.addEventListener("touchcancel", finish, { once: true });
      },
      setColumnWidth: setWidth,
      getColumnWidths: widths,
      getTableProps: props => ({ ...props, style: { minWidth: "fit-content", ...props?.style } }),
      getTableHeaderCellProps: columnId => {
        const id = String(columnId);
        const width = activeWidths[id];
        if (width === undefined) return {};
        const sizing = getDataGridColumnSizing({ id, label: id }, columnSizingOptions);
        const aside = resizableColumns ? <TableResizeHandle value={width} min={sizing.minWidth} label={resizeLabel.replace("{column}", id)} data-keyboard-mode={keyboardSizingColumns.has(id) || undefined} onResize={(_delta, value, event) => resizeColumn(id, value, event instanceof MouseEvent || event instanceof KeyboardEvent || event instanceof TouchEvent ? event : undefined)} /> : undefined;
        return { style: { width, minWidth: width, maxWidth: width }, aside };
      },
      getTableCellProps: columnId => {
        const width = activeWidths[String(columnId)];
        return width === undefined ? {} : { style: { width, minWidth: width, maxWidth: width } };
      },
      enableKeyboardMode: (columnId, onChange) => event => {
        event.preventDefault();
        event.stopPropagation();
        const id = String(columnId);
        const next = new Set(keyboardSizingColumnsRef.current);
        const enabled = !next.has(id);
        if (enabled) next.add(id); else next.delete(id);
        keyboardSizingColumnsRef.current = next;
        setKeyboardSizingColumns(next);
        onChange?.(columnId, enabled);
      },
    };
  }, [orderedColumns, columnSizingOptions, activeWidths, resizeColumn, resizableColumns, resizeLabel, keyboardSizingColumns]);
  const context = React.useMemo<DataGridContextValue<T>>(() => ({ items: contextItems, dataSource, totalRows, firstRow, lastRow, rowHeight: safeRowHeight, sourceBusy, sourceError, expandGroupLabel, collapseGroupLabel, groupCountLabel, toggleGroup, columns: contextColumns, getRowId, selectionMode, selectionAppearance, subtleSelection, focusMode, selectedItems: selected, selectionModel: activeSelectionModel, setSelectionModel, isItemSelected, isRowSelected, setSelectedItems, sortState: activeSort, setSortState: setSort, activeCell, setActiveCell, columnWidths: activeWidths, resizeColumn, columnSizingOptions, resizableColumns, autoFitColumns, resizeLabel, orderedColumns, reorderColumn: moveColumn, reorderableColumns, reorderLabel, draggedColumn, editHint, rowLabel, editedCells, onCellEdit, validateCellEdit, setEditedCell, getRows: fluentRows, selection: fluentSelection, sort: fluentSort, tableRef: gridRoot, columnSizing_unstable: fluentSizing, selectableRows: selectionMode !== "none", compositeRowTabsterAttribute: tableRowNavigationAttribute }), [contextItems, contextColumns, dataSource, totalRows, firstRow, lastRow, safeRowHeight, sourceBusy, sourceError, expandGroupLabel, collapseGroupLabel, groupCountLabel, onDataSourceGroupToggle, columns, getRowId, selectionMode, selectionAppearance, subtleSelection, focusMode, selected, selectionModel, activeSelectionModel, setSelectionModel, isItemSelected, isRowSelected, setSelectedItems, onSelectionChange, onDataSourceSelectionChange, activeSort, sortState, onSortChange, activeCell, activeWidths, columnWidths, columnSizingOptions, onColumnResize, resizableColumns, autoFitColumns, resizeLabel, orderedColumns, columnOrder, onColumnOrderChange, reorderableColumns, reorderLabel, editHint, rowLabel, editedCells, onCellEdit, validateCellEdit, fluentRows, fluentSelection, fluentSort, fluentSizing]);
  const focusBy = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.ctrlKey && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      const root = gridRoot.current;
      if (event.key === "Home") {
        const first = root?.querySelector<HTMLElement>("[role=rowgroup] [role=row] input:not([disabled]),[role=rowgroup] [role=row] button:not([disabled]),[role=rowgroup] [role=row] [tabindex='0']");
        first?.focus();
        return;
      }
      if (!totalRows || !(orderedColumns ?? columns).length) return;
      const rowIndex = totalRows;
      const columnIndex = (orderedColumns ?? columns).length - 1 + (selectionMode === "none" ? 0 : 1);
      setActiveCell(rowIndex, columnIndex);
      pendingCellFocus.current = { row: rowIndex, column: columnIndex };
      if (shouldVirtualize && root) {
        const top = 40 + (totalRows - 1) * safeRowHeight;
        root.scrollTop = top;
        setViewport({ top: root.scrollTop, height: root.clientHeight || 320, width: root.clientWidth });
      }
      return;
    }
    if (!/^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End)$/.test(event.key)) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const cell = target?.closest<HTMLElement>("[data-spui-composed-cell]");
    const inHeader = Boolean(target?.closest("[role=columnheader]"));
    if (!cell || target !== cell && target?.matches("input,button,select,textarea,a,[contenteditable=true]") && !inHeader) return;
    const row = Number(cell.dataset.gridRowIndex), column = Number(cell.dataset.gridColumnIndex);
    const allCells = [...(event.currentTarget.querySelectorAll<HTMLElement>("[data-spui-composed-cell]"))];
    const rowCells = allCells.filter(candidate => Number(candidate.dataset.gridRowIndex) === row);
    let next = cell;
    if (event.key === "Home") next = rowCells[0] ?? cell;
    else if (event.key === "End") next = rowCells.at(-1) ?? cell;
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const direction = (event.key === "ArrowRight" ? 1 : -1) * (getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1);
      next = rowCells[Math.max(0, Math.min(rowCells.length - 1, rowCells.indexOf(cell) + direction))] ?? cell;
    } else {
      const nextDataIndex = Math.max(0, Math.min(totalRows - 1, row - 1 + (event.key === "ArrowDown" ? 1 : -1)));
      const nextRow = nextDataIndex + 1;
      next = allCells.find(candidate => Number(candidate.dataset.gridRowIndex) === nextRow && Number(candidate.dataset.gridColumnIndex) === column) ?? cell;
      if (next === cell && shouldVirtualize && totalRows > 0) {
        const root = gridRoot.current;
        if (root && nextRow !== row) {
          event.preventDefault();
          root.scrollTop = 40 + nextDataIndex * safeRowHeight;
          setViewport({ top: root.scrollTop, height: root.clientHeight || 320, width: root.clientWidth });
          pendingCellFocus.current = { row: nextRow, column };
          setActiveCell(nextRow, column);
          return;
        }
      }
    }
    if (next !== cell) { event.preventDefault(); next.focus(); }
  };
  return <DataGridContextProvider value={context}>
    <>
      <div {...useHostProps({ ...props, ref: gridRoot, role: "grid", "aria-label": label ?? props["aria-label"] as string | undefined ?? "Data grid", "aria-rowcount": totalRows + 1, "aria-colcount": columns.length + (selectionMode === "none" ? 0 : 1), "aria-busy": sourceBusy || undefined, onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => { focusBy(event); onGridKeyDown?.(event); }, onScroll: (event: React.UIEvent<HTMLDivElement>) => { props.onScroll?.(event); if (scrollFrame.current === undefined) scrollFrame.current = requestAnimationFrame(() => { scrollFrame.current = undefined; syncViewport(); }); }, onDragStart: (event: React.DragEvent<HTMLDivElement>) => { const source = (event.target as HTMLElement).closest<HTMLElement>("[data-reorder-column]"); if (reorderableColumns && source?.dataset.reorderColumn) draggedColumn.current = source.dataset.reorderColumn; props.onDragStart?.(event); }, onDragEnd: (event: React.DragEvent<HTMLDivElement>) => { draggedColumn.current = undefined; props.onDragEnd?.(event); }, onDragOver: (event: React.DragEvent<HTMLDivElement>) => { if (reorderableColumns && draggedColumn.current && (event.target as HTMLElement).closest("[data-column-id]")) event.preventDefault(); props.onDragOver?.(event); }, onDrop: (event: React.DragEvent<HTMLDivElement>) => { const from = draggedColumn.current ?? event.dataTransfer.getData("text/plain"); const target = (event.target as HTMLElement).closest<HTMLElement>("[data-column-id]"); const to = target?.dataset.columnId; if (reorderableColumns && from && to) { event.preventDefault(); const rect = target.getBoundingClientRect(); const rtl = getComputedStyle(event.currentTarget).direction === "rtl"; moveColumn(from, to, rtl ? event.clientX < rect.left + rect.width / 2 : event.clientX > rect.left + rect.width / 2); draggedColumn.current = undefined; } props.onDrop?.(event); }, "data-selection-appearance": selectionAppearance, "data-spui-composed-grid": "", style: { boxSizing: "border-box", width: "100%", overflow: "auto", border: "1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))", borderRadius: "var(--spui-control-radius,6px)", background: "var(--spui-base-surface,var(--spui-ui-surface,#fff))", color: "var(--spui-ui-text,var(--spui-semantic-body-text,#242424))", fontFamily: "var(--spui-font-family,inherit)", "--spui-composed-grid-columns": tracks, ...props.style as React.CSSProperties } })}>
        {children}
      </div>
      {sourceBusy && <div role="status" aria-live="polite" className="spui-sr-only">{loadingLabel}</div>}
      {sourceError && <div role="alert">{sourceError}</div>}
      <div className="spui-grid-reorder-status" role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>{reorderAnnouncement}</div>
    </>
  </DataGridContextProvider>;
}

export function DataGrid<T>(props: DataGridCompositionProps<T>): React.ReactElement;
export function DataGrid<T>(props: VirtualDataGridProps<T>): React.ReactElement;
export function DataGrid<T>(props: DataGridProps<T>): React.ReactElement {
  if ("children" in props && props.children !== undefined) return <ComposedDataGrid {...props as DataGridCompositionProps<T>} />;
  return <VirtualDataGrid {...props as VirtualDataGridProps<T>} children={undefined} />;
}

export type DataGridHeaderProps = Omit<ElementProps, "children"> & { children?: React.ReactNode };
export function DataGridHeader({ children, ...props }: DataGridHeaderProps): React.ReactElement {
  return <DataGridRegionContext.Provider value="header"><div {...props} role="rowgroup" style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--spui-base-canvas,var(--spui-ui-canvas,#f5f5f5))", ...props.style as React.CSSProperties }}>{children}</div></DataGridRegionContext.Provider>;
}

export type DataGridBodyProps<T> = Omit<ElementProps, "children"> & { children: (row: DataGridCompositionRow<T>) => React.ReactNode; renderGroupRow?: (row: DataGridCompositionGroupRow<T>) => React.ReactNode };
export function DataGridBody<T>({ children, renderGroupRow, ...props }: DataGridBodyProps<T>): React.ReactElement {
  const context = useDataGridComposition<T>();
  if (!context) return <div {...props} role="rowgroup" />;
  const spacer = (height: number, key: string): React.ReactElement | null => height > 0 ? <div key={key} role="presentation" aria-hidden="true" style={{ height, gridColumn: "1 / -1", pointerEvents: "none" }} /> : null;
  const rows: React.ReactNode[] = [];
  for (let index = context.firstRow; index < context.lastRow; index++) {
    const sourceRow = context.dataSource ? getDataGridDataSourceRow(context.dataSource, index) : undefined;
    if (sourceRow?.kind === "group") {
      const rendered = renderGroupRow?.({ group: sourceRow, index });
      rows.push(rendered ?? <div key={`group:${sourceRow.key}`} role="row" data-spui-composed-row="" data-grid-row-index={index + 1} aria-rowindex={index + 2} style={{ display: "grid", gridTemplateColumns: "var(--spui-composed-grid-columns)", width: "max-content", minWidth: "100%", minHeight: context.rowHeight, alignItems: "center" }}>
        <div role="rowheader" aria-colindex={1} aria-colspan={(context.orderedColumns?.length ?? context.columns.length) + (context.selectionMode === "none" ? 0 : 1)} style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", minHeight: context.rowHeight, gap: 8, paddingInline: 12 }}>
          <button type="button" aria-expanded={sourceRow.expanded} aria-label={`${sourceRow.expanded ? context.collapseGroupLabel : context.expandGroupLabel} ${sourceRow.label}`} onClick={() => context.toggleGroup(sourceRow)}>{sourceRow.expanded ? "−" : "+"}</button>
          <span>{sourceRow.label}</span><span aria-label={context.groupCountLabel.replace("{count}", String(sourceRow.count))}>({sourceRow.count})</span>
        </div>
      </div>);
      continue;
    }
    const item = context.dataSource ? sourceRow?.kind === "item" ? sourceRow.item : undefined : context.items[index];
    if (item === undefined) {
      rows.push(<div key={`loading:${index}`} role="row" aria-rowindex={index + 2} aria-busy="true" data-spui-composed-placeholder="" style={{ display: "grid", gridTemplateColumns: "var(--spui-composed-grid-columns)", width: "max-content", minWidth: "100%", minHeight: context.rowHeight }}><div role="gridcell" aria-colspan={context.columns.length + (context.selectionMode === "none" ? 0 : 1)} style={{ gridColumn: "1 / -1", minHeight: context.rowHeight }} /></div>);
      continue;
    }
    const rowId = sourceRow?.kind === "item" ? sourceRow.rowId ?? context.getRowId(item) : context.getRowId(item);
    rows.push(<React.Fragment key={String(rowId)}>{children({ item, rowId, index })}</React.Fragment>);
  }
  return <DataGridRegionContext.Provider value="body"><div {...props} role="rowgroup">
    {spacer(context.firstRow * context.rowHeight, "top-spacer")}
    {rows}
    {spacer(Math.max(0, context.totalRows - context.lastRow) * context.rowHeight, "bottom-spacer")}
  </div></DataGridRegionContext.Provider>;
}

type DataGridCellChildProps = { rowIndex?: number; columnIndex?: number; children?: React.ReactNode };
function annotateDataGridChildren(children: React.ReactNode, rowIndex: number, context: DataGridCompositionContextValue<unknown>): React.ReactNode {
  let columnIndex = context.selectionMode === "none" ? 0 : 1;
  return React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    if (child.type === React.Fragment || child.type === DataGridColumnIdContext.Provider) return React.cloneElement(child as React.ReactElement<{ children?: React.ReactNode }>, { children: annotateDataGridChildren(child.props.children, rowIndex, context) });
    if (child.type === DataGridSelectionCell) return React.cloneElement(child as React.ReactElement<DataGridCellChildProps>, { rowIndex, columnIndex: 0 });
    if (child.type === DataGridCell || child.type === DataGridHeaderCell) {
      const currentColumnIndex = columnIndex++;
      const column = (context.orderedColumns ?? context.columns)[currentColumnIndex - (context.selectionMode === "none" ? 0 : 1)];
      return React.cloneElement(child as React.ReactElement<DataGridCellChildProps & { columnId?: TableColumnId }>, { rowIndex, columnIndex: currentColumnIndex, ...(column ? { columnId: column.columnId } : {}) });
    }
    return child;
  });
}

export type DataGridFluentCellRenderFunction<T> = (column: TableColumnDefinition<T>, dataGridContextValue: DataGridContextValue<T>) => React.ReactNode;
type DataGridRowBaseProps<T> = Omit<ElementProps, "children"> & { item?: T; rowId?: string | number; rowIndex?: number; appearance?: "brand" | "neutral" | "none"; selectionCell?: React.ReactNode };
export type DataGridRowProps<T> = DataGridRowBaseProps<T> & { children: React.ReactNode | ((helpers: DataGridRowRenderHelpers<T>) => React.ReactNode) | DataGridFluentCellRenderFunction<T> };
function containsDataGridSelectionCell(children: React.ReactNode): boolean {
  let found = false;
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return;
    if (child.type === DataGridSelectionCell) { found = true; return; }
    if (containsDataGridSelectionCell((child.props as { children?: React.ReactNode }).children)) found = true;
  });
  return found;
}
export function DataGridRow<T>(props: DataGridRowBaseProps<T> & { children: (helpers: DataGridRowRenderHelpers<T>) => React.ReactNode }): React.ReactElement;
export function DataGridRow<T>(props: DataGridRowBaseProps<T> & { children: DataGridFluentCellRenderFunction<T> }): React.ReactElement;
export function DataGridRow<T>(props: DataGridRowBaseProps<T> & { children: React.ReactNode }): React.ReactElement;
export function DataGridRow<T>({ item, rowId, rowIndex, appearance, selectionCell, children, onClick, ...props }: DataGridRowProps<T>): React.ReactElement {
  const context = useDataGridComposition<T>();
  const region = React.useContext(DataGridRegionContext);
  const row = rowIndex ?? (region === "header" ? 0 : context?.items.findIndex(candidate => context.getRowId(candidate) === rowId) ?? 1);
  const helpers: DataGridRowRenderHelpers<T> = {
    item, rowId, dataGridContextValue: context!,
    columns: context?.orderedColumns ?? context?.columns ?? [],
    renderCell: column => item === undefined ? null : <DataGridColumnIdContext.Provider value={column.columnId}>{column.renderCell(item)}</DataGridColumnIdContext.Provider>,
    renderHeaderCell: column => <DataGridColumnIdContext.Provider value={column.columnId}>{column.renderHeaderCell()}</DataGridColumnIdContext.Provider>,
  };
  let rendered: React.ReactNode;
  if (typeof children === "function" && context && children.length >= 2) {
    const renderCell = children as DataGridFluentCellRenderFunction<T>;
    rendered = (context.orderedColumns ?? context.columns).map(column => <DataGridColumnIdContext.Provider key={String(column.columnId)} value={column.columnId}>{renderCell(column, context)}</DataGridColumnIdContext.Provider>);
  } else rendered = typeof children === "function" ? (children as (helpers: DataGridRowRenderHelpers<T>) => React.ReactNode)(helpers) : children;
  const hasChildSelectionCell = containsDataGridSelectionCell(rendered);
  const defaultSelectionCell = selectionCell == null && !hasChildSelectionCell && context?.selectionMode !== "none"
    ? <DataGridSelectionCell label={region === "header" ? "Select all rows" : `Select ${context?.rowLabel ?? "row"} ${row}`} />
    : null;
  const rowContent = <>{selectionCell}{defaultSelectionCell}{rendered}</>;
  const annotated = context ? annotateDataGridChildren(rowContent, row, context as DataGridCompositionContextValue<unknown>) : rowContent;
  const effectiveRowId = rowId ?? (item === undefined ? undefined : context?.getRowId(item));
  const selected = context && item !== undefined && effectiveRowId !== undefined && context.isRowSelected(effectiveRowId, item);
  const selectedBackground = selected ? appearance === "neutral" || context?.selectionAppearance === "neutral" ? "color-mix(in srgb,var(--spui-ui-text,#323130) 8%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))" : appearance === "none" ? undefined : "color-mix(in srgb,var(--spui-ui-accent,#78716c) 14%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))" : undefined;
  const rowFocusMode = context?.focusMode === "row_unstable";
  return <DataGridRowItemContext.Provider value={item}><DataGridRowIdContext.Provider value={effectiveRowId}><div {...props} role="row" data-spui-composed-row="" data-grid-row-index={row} aria-rowindex={row + 1} aria-selected={selected === undefined ? undefined : selected} data-appearance={appearance} tabIndex={rowFocusMode ? context?.activeCell.row === row ? 0 : -1 : undefined} onClick={event => { if (region !== "header" && context && item !== undefined && effectiveRowId !== undefined && context.selectionMode !== "none") { if (context.dataSource) context.setSelectionModel(setDataGridRowSelected(context.selectionModel, String(effectiveRowId), !context.isRowSelected(effectiveRowId, item), context.dataSource.selectionScopeKey), event); else { const next = new Set(context.selectedItems); if (context.selectionMode === "single") next.clear(); next.has(item) ? next.delete(item) : next.add(item); context.setSelectedItems(next, event); } } onClick?.(event); }} onFocus={event => { if (rowFocusMode) context?.setActiveCell(row, 0); props.onFocus?.(event); }} onKeyDown={event => { if (rowFocusMode && (event.key === "ArrowDown" || event.key === "ArrowUp")) { const rows = [...(event.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[data-spui-composed-row][data-grid-row-index]") ?? [])].filter(candidate => Number(candidate.dataset.gridRowIndex) > 0); const index = rows.indexOf(event.currentTarget); const next = rows[Math.max(0, Math.min(rows.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))]; if (next && next !== event.currentTarget) { event.preventDefault(); next.focus(); } } if (region !== "header" && context?.selectionMode !== "none" && event.key === " " && !(event.target as HTMLElement).closest("button,input,select,textarea,a,[contenteditable=true]")) { event.preventDefault(); event.currentTarget.click(); } props.onKeyDown?.(event); }} style={{ display: "grid", gridTemplateColumns: "var(--spui-composed-grid-columns)", width: "max-content", minWidth: "100%", alignItems: "center", minHeight: context?.rowHeight ?? 40, borderBlockEnd: "1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#e1dfdd))", background: selectedBackground, ...props.style as React.CSSProperties }}>{annotated}</div></DataGridRowIdContext.Provider></DataGridRowItemContext.Provider>;
}

export type DataGridCellProps = Omit<ElementProps, "children"> & { children?: React.ReactNode; columnId?: TableColumnId; rowIndex?: number; columnIndex?: number; focusMode?: "group" | "none" | "cell"; editable?: boolean; value?: unknown; editType?: DataGridColumn["editType"]; editLabel?: string };
export function DataGridCell({ children, columnId, rowIndex = 1, columnIndex = 0, focusMode: requestedFocusMode, editable = false, value, editType = "text", editLabel, ...props }: DataGridCellProps): React.ReactElement {
  const context = useDataGridComposition<unknown>();
  const contextualColumnId = React.useContext(DataGridColumnIdContext);
  const item = React.useContext(DataGridRowItemContext);
  const focusMode = requestedFocusMode ?? (context?.focusMode === "none" || context?.focusMode === "row_unstable" ? "none" : context?.focusMode === "composite" ? "group" : "cell");
  const id = contextualColumnId ?? columnId;
  const orderedIndex = id === undefined ? -1 : context?.orderedColumns?.findIndex(column => String(column.columnId) === String(id)) ?? -1;
  const effectiveColumnIndex = orderedIndex >= 0 ? orderedIndex + (context?.selectionMode === "none" ? 0 : 1) : columnIndex;
  const cellKey = id == null || item == null || !context ? "" : JSON.stringify([String(context.getRowId(item)), String(id)]);
  return <ComposedDataGridCell {...props} item={item} context={context} cellKey={cellKey} rowIndex={rowIndex} columnIndex={effectiveColumnIndex} columnId={id} focusMode={focusMode} editable={editable} value={value} editType={editType} editLabel={editLabel}>{children}</ComposedDataGridCell>;
}

function ComposedDataGridCell({ children, item, context, cellKey, rowIndex = 1, columnIndex, columnId, focusMode, editable, value, editType, editLabel, ...props }: DataGridCellProps & { item: unknown; context?: DataGridCompositionContextValue<unknown>; cellKey: string; rowIndex: number; columnIndex: number; columnId?: TableColumnId; focusMode: "group" | "none" | "cell" }): React.ReactElement {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const savingRef = React.useRef(false);
  const cancelledRef = React.useRef(false);
  const input = React.useRef<HTMLInputElement>(null);
  const active = context?.activeCell.row === rowIndex && context?.activeCell.column === columnIndex;
  const previousValue = cellKey && context?.editedCells[cellKey] !== undefined ? context?.editedCells[cellKey] : value;
  const startEditing = (): void => {
    if (!editable || item == null || !context || !cellKey || savingRef.current) return;
    cancelledRef.current = false;
    setDraft(toDataGridInputValue(previousValue, editType)); setError(""); setEditing(true);
    requestAnimationFrame(() => input.current?.focus());
  };
  const cancelEditing = (): void => { if (!savingRef.current) { cancelledRef.current = true; cell.current?.focus(); setEditing(false); setError(""); } };
  const cell = React.useRef<HTMLDivElement>(null);
  const commit = async (): Promise<void> => {
    if (!editing || savingRef.current || cancelledRef.current || item == null || !context || columnId == null) return;
    const parsed = parseDataGridInputValue(draft, editType);
    const edit: DataGridCellEdit<unknown> = { item, rowId: String(context.getRowId(item)), columnId: String(columnId), previousValue, value: parsed };
    let validation: string | undefined;
    try { validation = context.validateCellEdit?.(edit); } catch (reason) { validation = reason instanceof Error ? reason.message : String(reason); }
    if (validation) { setError(validation); requestAnimationFrame(() => input.current?.focus()); return; }
    savingRef.current = true; setSaving(true); setError("");
    try {
      await context.onCellEdit?.(edit);
      context.setEditedCell(cellKey, parsed); cell.current?.focus(); setEditing(false);
      cell.current?.dispatchEvent(new CustomEvent("spui-cell-edit", { bubbles: true, detail: edit }));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason || "The value could not be saved.");
      setError(message);
      cell.current?.dispatchEvent(new CustomEvent("spui-cell-edit-error", { bubbles: true, detail: { ...edit, error: message } }));
      requestAnimationFrame(() => input.current?.focus());
    } finally { savingRef.current = false; setSaving(false); }
  };
  const columnLabel = context?.orderedColumns?.find(column => String(column.columnId) === String(columnId));
  const label = editLabel ?? (props["aria-label"] as string | undefined) ?? `${getVisibleText(columnLabel?.renderHeaderCell()) || String(columnId ?? "Cell")}, ${context?.rowLabel ?? "row"} ${rowIndex}`;
  const rendered = cellKey && context?.editedCells[cellKey] !== undefined ? String(context.editedCells[cellKey] ?? "") : children;
  return <div {...props} ref={cell} role="gridcell" data-spui-composed-cell="" data-grid-row-index={rowIndex} data-grid-column-index={columnIndex} aria-rowindex={rowIndex + 1} aria-colindex={columnIndex + 1} data-column-id={columnId == null ? undefined : String(columnId)} data-editable={editable ? "true" : undefined} aria-keyshortcuts={editable ? "Enter F2" : undefined} title={editable ? context?.editHint : props.title} tabIndex={focusMode === "none" ? -1 : active ? 0 : -1} onFocus={event => { context?.setActiveCell(rowIndex, columnIndex); props.onFocus?.(event); }} onDoubleClick={event => { props.onDoubleClick?.(event); startEditing(); }} onKeyDown={event => {
    if (editable && !editing && (event.key === "F2" || event.key === "Enter" && !event.currentTarget.querySelector("button,input,select,textarea,a,[tabindex]:not([tabindex='-1'])"))) { event.preventDefault(); startEditing(); }
    else if (focusMode === "group" && event.key === "Enter") { const first = event.currentTarget.querySelector<HTMLElement>("button,input,select,textarea,a,[tabindex]:not([tabindex='-1'])"); if (first) { event.preventDefault(); first.focus(); } }
    else if (focusMode === "group" && event.key === "Escape") { event.preventDefault(); event.currentTarget.focus(); }
    props.onKeyDown?.(event);
  }} style={{ boxSizing: "border-box", display: "flex", gridColumn: columnIndex + 1, alignItems: "center", minWidth: 0, minHeight: context?.rowHeight ?? 40, overflow: "hidden", paddingInline: 12, ...props.style as React.CSSProperties }}>{editing ? <><input ref={input} data-testid="spui-data-grid-editor" type={editType === "number" || editType === "date" ? editType : "text"} value={draft} aria-label={label} aria-invalid={error ? true : undefined} aria-busy={saving || undefined} aria-describedby={error ? `${cellKey}-error` : undefined} onChange={event => { setDraft(event.currentTarget.value); if (error) setError(""); }} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); cancelEditing(); } else if (event.key === "Enter") { event.preventDefault(); void commit(); } else if (event.key.startsWith("Arrow")) event.stopPropagation(); }} onBlur={() => { if (!savingRef.current && !cancelledRef.current) void commit(); }} style={{ width: "100%", minWidth: 0, boxSizing: "border-box", font: "inherit", color: "inherit", background: "var(--spui-base-surface,var(--spui-ui-surface,#fff))", border: "1px solid var(--spui-ui-accent,var(--spui-semantic-primary-button-background,#0078d4))", borderRadius: "var(--spui-control-radius,4px)", padding: "4px 6px", outline: "2px solid color-mix(in srgb,var(--spui-ui-accent,#0078d4) 22%,transparent)" }} />{error && <span id={`${cellKey}-error`} role="alert" className="spui-sr-only">{error}</span>}</> : rendered}</div>;
}

export type DataGridHeaderCellProps = Omit<ElementProps, "children"> & { children?: React.ReactNode; columnId?: TableColumnId; rowIndex?: number; columnIndex?: number; sortable?: boolean; sortDirection?: "ascending" | "descending"; focusMode?: "group" | "none" | "cell"; aside?: SpanSlotProps; sortIcon?: SpanSlotProps; button?: React.ReactElement<any> | Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> };
export function DataGridHeaderCell({ children, columnId, rowIndex = 0, columnIndex = 0, sortable = true, sortDirection: explicitSortDirection, focusMode = "cell", aside, sortIcon, button, ...props }: DataGridHeaderCellProps): React.ReactElement {
  const context = useDataGridComposition<unknown>();
  const contextualColumnId = React.useContext(DataGridColumnIdContext);
  const grid = useDataGridComposition<unknown>();
  const id = contextualColumnId ?? columnId;
  const headerLabel = getVisibleText(children) || String(id ?? "");
  const orderedIndex = id === undefined ? -1 : grid?.orderedColumns?.findIndex(column => String(column.columnId) === String(id)) ?? -1;
  const effectiveColumnIndex = orderedIndex >= 0 ? orderedIndex + (context?.selectionMode === "none" ? 0 : 1) : columnIndex;
  const effectiveFocusMode = context?.focusMode === "none" || context?.focusMode === "row_unstable" ? "none" : context?.focusMode === "composite" && focusMode === "cell" ? "group" : focusMode;
  const sortDirection = explicitSortDirection ?? (context && context.sortState.sortColumn === id ? context.sortState.sortDirection : undefined);
  const sort = (event: React.MouseEvent): void => { if (id === undefined || !sortable || !context) return; context.setSortState({ sortColumn: id, sortDirection: sortDirection === "ascending" ? "descending" : "ascending" }, event); };
  const cellProps = { "data-spui-composed-cell": "", "data-grid-row-index": rowIndex, "data-grid-column-index": effectiveColumnIndex, "aria-rowindex": rowIndex + 1, "aria-colindex": effectiveColumnIndex + 1, "data-column-id": id == null ? undefined : String(id), tabIndex: effectiveFocusMode === "none" ? -1 : context?.activeCell.row === rowIndex && context.activeCell.column === effectiveColumnIndex ? 0 : -1, onFocus: (event: React.FocusEvent<HTMLElement>) => { context?.setActiveCell(rowIndex, effectiveColumnIndex); props.onFocus?.(event as React.FocusEvent<HTMLDivElement>); } };
  const buttonElement = React.isValidElement(button) ? button as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>> : undefined;
  const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = buttonElement ? buttonElement.props : (button ?? {}) as React.ButtonHTMLAttributes<HTMLButtonElement>;
  const onSortClick: React.MouseEventHandler<HTMLButtonElement> = event => { buttonProps.onClick?.(event); if (!event.defaultPrevented) sort(event); };
  const indicator = sortIcon == null ? (sortDirection === "ascending" ? "↑" : "↓") : renderSpanSlot(sortIcon);
  const content = <>{children}{sortDirection && <span aria-hidden="true" data-testid="data-grid-sort-indicator" style={{ marginInlineStart: "auto", flex: "none" }}>{indicator}</span>}</>;
  const headerControl = buttonElement
    ? React.cloneElement(buttonElement, { ...cellProps, type: "button", onClick: onSortClick, children: content, ...(buttonElement.props.role == null ? { role: "button" } : {}), ...(buttonElement.props.tabIndex == null ? { tabIndex: 0 } : {}) })
    : sortable || button ? <button type="button" {...buttonProps} {...cellProps} onClick={onSortClick} style={{ boxSizing: "border-box", display: "flex", flex: "1 1 auto", alignItems: "center", minWidth: 0, width: "auto", minHeight: 40, paddingInline: 12, border: 0, background: "transparent", color: "inherit", font: "inherit", textAlign: "start", cursor: sortable ? "pointer" : undefined, ...buttonProps.style }}>{content}</button>
      : <span {...cellProps} style={{ display: "flex", flex: 1, alignItems: "center", minWidth: 0, minHeight: 40, paddingInline: 12 }}>{children}</span>;
  const width = id == null ? undefined : grid?.columnWidths[String(id)] ?? getDataGridColumnSizing({ id: String(id), label: String(id) }, grid?.columnSizingOptions).defaultWidth;
  const handleRef = React.useRef<HTMLDivElement>(null);
  const resizeStart = React.useRef<{ x: number; width: number } | null>(null);
  const resizeKey = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!id || !grid?.resizableColumns) return;
    const sizing = getDataGridColumnSizing({ id: String(id), label: String(id) }, grid.columnSizingOptions);
    const dir = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
    const delta = event.key === "ArrowRight" ? 8 * dir : event.key === "ArrowLeft" ? -8 * dir : 0;
    if (delta) { event.preventDefault(); grid.resizeColumn(String(id), (width ?? sizing.defaultWidth) + delta, event.nativeEvent); }
    else if (event.key === "Home") { event.preventDefault(); grid.resizeColumn(String(id), sizing.minWidth, event.nativeEvent); }
    else if (event.key === "End") { event.preventDefault(); grid.resizeColumn(String(id), 1600, event.nativeEvent); }
  };
  const fit = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!id || !grid?.autoFitColumns || !grid.resizableColumns) return;
    const root = handleRef.current?.closest<HTMLElement>("[data-spui-composed-grid]");
    const nodes = [...(root?.querySelectorAll<HTMLElement>(`[data-column-id="${CSS.escape(String(id))}"]`) ?? [])];
    const natural = Math.max(0, ...nodes.map(node => node.scrollWidth));
    grid.resizeColumn(String(id), Math.max(getDataGridColumnSizing({ id: String(id), label: String(id) }, grid.columnSizingOptions).idealWidth, natural + 24), event.nativeEvent);
  };
  const reorderKey = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (!id || !grid?.reorderColumn || !event.altKey || !event.shiftKey || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const ids = (grid.orderedColumns ?? grid.columns).map(column => String(column.columnId));
    const index = ids.indexOf(String(id));
    const delta = (event.key === "ArrowRight" ? 1 : -1) * (getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1);
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= ids.length) return;
    event.preventDefault(); event.stopPropagation();
    grid.reorderColumn(String(id), ids[nextIndex], nextIndex > index);
  };
  return <div {...props} role="columnheader" aria-sort={sortDirection} data-column-id={id == null ? undefined : String(id)} style={{ boxSizing: "border-box", position: "relative", display: "flex", gridColumn: effectiveColumnIndex + 1, width: "100%", minWidth: 0, borderBlockEnd: "1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1))", fontWeight: 600, ...props.style as React.CSSProperties }}>{grid?.reorderableColumns && id !== undefined && <button type="button" draggable aria-label={`${grid.reorderLabel ?? "Reorder column"} ${headerLabel}`} title={`${grid.reorderLabel ?? "Reorder column"} ${headerLabel}; use Alt+Shift+Arrow keys`} data-reorder-column={String(id)} data-testid={`data-grid-reorder-${String(id)}`} onKeyDown={reorderKey} onDragStart={event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(id)); }} style={{ flex: "none", width: 26, minHeight: 40, padding: 0, border: 0, background: "transparent", color: "var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161))", cursor: "grab" }}>⠿</button>}{headerControl}{renderSpanSlot(aside)}{grid?.resizableColumns && id !== undefined && <div ref={handleRef} role="separator" aria-orientation="vertical" aria-label={`${grid.resizeLabel} ${headerLabel}`} aria-valuemin={getDataGridColumnSizing({ id: String(id), label: String(id) }, grid.columnSizingOptions).minWidth} aria-valuemax={1600} aria-valuenow={width} tabIndex={0} data-testid={`data-grid-resize-${String(id)}`} onKeyDown={resizeKey} onDoubleClick={fit} onPointerDown={event => { if (event.button !== 0) return; resizeStart.current = { x: event.clientX, width: width ?? getDataGridColumnSizing({ id: String(id), label: String(id) }, grid.columnSizingOptions).defaultWidth }; event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); }} onPointerMove={event => { if (!resizeStart.current) return; const direction = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1; grid.resizeColumn(String(id), resizeStart.current.width + (event.clientX - resizeStart.current.x) * direction, event.nativeEvent); }} onPointerUp={event => { resizeStart.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} style={{ position: "absolute", zIndex: 1, insetBlock: 0, insetInlineEnd: 0, width: 10, cursor: "col-resize", touchAction: "none", outline: "none" }} />}</div>;
}

export type SelectionIndicatorSlot = React.ReactElement | React.HTMLAttributes<HTMLElement>;
function renderSelectionIndicator(indicator: SelectionIndicatorSlot | undefined, slot: "checkbox-indicator" | "radio-indicator", checked: boolean | "mixed" = false): React.ReactElement | null {
  if (!indicator) return null;
  const state = { "aria-hidden": true, "data-checked": checked === true ? "true" : "false", "data-indeterminate": checked === "mixed" || undefined };
  return React.isValidElement(indicator)
    ? React.cloneElement(indicator, { slot, ...state } as React.HTMLAttributes<HTMLElement>)
    : React.createElement("span", { ...(indicator as React.HTMLAttributes<HTMLElement>), slot, ...state }, (indicator as React.HTMLAttributes<HTMLElement>).children);
}

export type DataGridSelectionCellProps = Omit<ElementProps, "children"> & { item?: unknown; rowIndex?: number; columnIndex?: number; label?: string; type?: "checkbox" | "radio"; checked?: boolean | "mixed"; subtle?: boolean; hidden?: boolean; invisible?: boolean; checkboxIndicator?: SelectionIndicatorSlot; radioIndicator?: SelectionIndicatorSlot };
function ensureDataGridSelectionCellStyles(): void {
  if (document.getElementById("spui-data-grid-selection-cell-styles")) return;
  const style = document.createElement("style");
  style.id = "spui-data-grid-selection-cell-styles";
  style.textContent = `
    .spui-data-grid-selection-cell[data-subtle] input:not(:checked):not([aria-checked="mixed"]){opacity:0}
    .spui-data-grid-selection-cell[data-subtle] [data-selection-indicator-wrap][data-checked="false"]:not([data-indeterminate]){opacity:0;transition:opacity var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}
    .spui-grid-row:hover .spui-data-grid-selection-cell[data-subtle] input:not(:checked):not([aria-checked="mixed"]),.spui-grid-row:focus-within .spui-data-grid-selection-cell[data-subtle] input:not(:checked):not([aria-checked="mixed"]),[data-spui-composed-row]:is(:hover,:focus-within) .spui-data-grid-selection-cell[data-subtle] input:not(:checked):not([aria-checked="mixed"]),.spui-data-grid-selection-cell[data-subtle]:is(:hover,:focus-within) input:not(:checked):not([aria-checked="mixed"]){opacity:1}
    .spui-grid-row:hover .spui-data-grid-selection-cell[data-subtle] [data-selection-indicator-wrap][data-checked="false"]:not([data-indeterminate]),.spui-grid-row:focus-within .spui-data-grid-selection-cell[data-subtle] [data-selection-indicator-wrap][data-checked="false"]:not([data-indeterminate]),[data-spui-composed-row]:is(:hover,:focus-within) .spui-data-grid-selection-cell[data-subtle] [data-selection-indicator-wrap][data-checked="false"]:not([data-indeterminate]),.spui-data-grid-selection-cell[data-subtle]:is(:hover,:focus-within) [data-selection-indicator-wrap][data-checked="false"]:not([data-indeterminate]){opacity:1}
    .spui-data-grid-selection-cell[data-invisible] input,.spui-data-grid-selection-cell[data-invisible] [data-selection-indicator-wrap]{opacity:0}
    .spui-data-grid-selection-cell:has(input:focus-visible) [data-selection-indicator-wrap]{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px;border-radius:var(--spui-control-radius,4px)}
    @media(prefers-reduced-motion:reduce){.spui-data-grid-selection-cell [data-selection-indicator-wrap]{transition:none}}
    @media(forced-colors:active){.spui-data-grid-selection-cell:has(input:focus-visible) [data-selection-indicator-wrap]{outline-color:Highlight}}
  `;
  document.head.append(style);
}
export function DataGridSelectionCell({ item, rowIndex = 1, columnIndex = 0, label, type, checked: checkedProp, subtle: subtleProp, hidden = false, invisible = false, checkboxIndicator, radioIndicator, ...props }: DataGridSelectionCellProps): React.ReactElement {
  const strings = React.useContext(UIContext).strings;
  const resolvedLabel = label ?? strings.dataGridSelectRow ?? "Select row";
  const context = useDataGridComposition<unknown>();
  const region = React.useContext(DataGridRegionContext);
  const rowItem = React.useContext(DataGridRowItemContext);
  const sourceRowId = React.useContext(DataGridRowIdContext);
  const selectedItem = item === undefined ? rowItem : item;
  const sourceScopeMatches = context?.selectionModel.mode === "all" && (context.selectionModel.scopeKey === undefined || context.selectionModel.scopeKey === context.dataSource?.selectionScopeKey);
  const contextChecked = context?.dataSource
    ? selectedItem === undefined ? Boolean(sourceScopeMatches) : sourceRowId !== undefined && context.isRowSelected(sourceRowId, selectedItem)
    : selectedItem === undefined ? Boolean(context?.items.length && context.items.every(candidate => context.selectedItems.has(candidate))) : Boolean(context?.selectedItems.has(selectedItem));
  const checked = checkedProp ?? contextChecked;
  const subtle = subtleProp ?? context?.subtleSelection ?? false;
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useLayoutEffect(() => {
    ensureDataGridSelectionCellStyles();
    if (inputRef.current) inputRef.current.indeterminate = checked === "mixed";
  }, [checked]);
  const change = (event: React.MouseEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>, nextChecked: boolean): void => {
    if (!context) return;
    if (context.dataSource) {
      const next = region === "header"
        ? nextChecked ? { mode: "all" as const, excludedKeys: [], ...(context.dataSource.selectionScopeKey === undefined ? {} : { scopeKey: context.dataSource.selectionScopeKey }) } : { mode: "explicit" as const, keys: [] }
        : selectedItem !== undefined && sourceRowId !== undefined ? setDataGridRowSelected(context.selectionModel, String(sourceRowId), nextChecked, context.dataSource.selectionScopeKey) : context.selectionModel;
      context.setSelectionModel(next, event);
      return;
    }
    const next = new Set(context.selectedItems);
    if (region === "header") for (const candidate of context.items) nextChecked ? next.add(candidate) : next.delete(candidate);
    else if (selectedItem !== undefined) {
      if (context.selectionMode === "single") next.clear();
      nextChecked ? next.add(selectedItem) : next.delete(selectedItem);
    }
    context.setSelectedItems(next, event);
  };
  const onClick = (event: React.MouseEvent<HTMLInputElement>): void => {
    event.stopPropagation();
    change(event, event.currentTarget.checked);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== " ") return;
    event.stopPropagation();
    event.preventDefault();
    change(event, checked !== true);
  };
  const inputType = type ?? (context?.selectionMode === "single" ? "radio" : "checkbox");
  const indicator = inputType === "radio" ? radioIndicator : checkboxIndicator;
  const customIndicator = renderSelectionIndicator(indicator, inputType === "radio" ? "radio-indicator" : "checkbox-indicator", checked);
  return <div {...props} hidden={hidden || undefined} role={region === "header" ? "columnheader" : "gridcell"} data-spui-composed-cell="" data-grid-row-index={rowIndex} data-grid-column-index={columnIndex} aria-rowindex={rowIndex + 1} aria-colindex={columnIndex + 1} data-selection-cell="" data-subtle={subtle || undefined} data-invisible={invisible || undefined} className={`spui-data-grid-selection-cell${props.className ? ` ${props.className}` : ""}`} style={{ boxSizing: "border-box", display: "grid", gridColumn: 1, placeItems: "center", minHeight: context?.rowHeight ?? 40, borderBlockEnd: "1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#e1dfdd))", ...props.style as React.CSSProperties }}>{customIndicator && <span data-selection-indicator-wrap="" data-checked={checked === true ? "true" : "false"} data-indeterminate={checked === "mixed" || undefined} style={{ position: "relative", display: "inline-grid", placeItems: "center", minWidth: 20, minHeight: 20 }}>{React.isValidElement(indicator) ? React.cloneElement(indicator, { "aria-hidden": true, "data-checked": checked === true ? "true" : "false", "data-indeterminate": checked === "mixed" || undefined } as React.HTMLAttributes<HTMLElement>) : <span aria-hidden="true">{customIndicator}</span>}</span>}<input ref={inputRef} type={inputType} aria-label={resolvedLabel} aria-checked={checked === "mixed" ? "mixed" : undefined} checked={checked === true} disabled={!context || context.selectionMode === "none" || context.dataSource?.selectableCount === 0 || context.dataSource?.length === 0} onClick={onClick} onKeyDown={onKeyDown} onChange={() => {}} style={customIndicator ? { position: "absolute", inset: 0, width: 20, height: 20, margin: "auto", opacity: 0, cursor: "pointer" } : undefined} /></div>;
}

export type TreeItemLayoutProps = ElementProps & { children?: React.ReactNode; main?: React.ReactNode; iconBefore?: React.ReactNode; iconAfter?: React.ReactNode; expandIcon?: React.ReactNode; aside?: React.ReactNode; actions?: React.ReactNode; selector?: React.ReactNode };
export function TreeItemLayout({ children, main, iconBefore, iconAfter, expandIcon, aside, actions, selector, className, ...props }: TreeItemLayoutProps): React.ReactElement {
  return <div {...useHostProps({ ...props, className, "data-spui-tree-item-layout": "" })} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, width: "100%", ...props.style as React.CSSProperties }}>
    {iconBefore}<span data-tree-item-main="" style={{ flex: "1 1 auto", minWidth: 0 }}>{main ?? children}</span>{iconAfter}{aside}{actions}
  </div>;
}

export type TreeItemPersonaLayoutProps = ElementProps & { children?: React.ReactNode; media?: React.ReactNode; main?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; aside?: React.ReactNode; expandIcon?: React.ReactNode; selector?: React.ReactNode };
export function TreeItemPersonaLayout({ children, media, main, description, actions, aside, expandIcon, selector, className, ...props }: TreeItemPersonaLayoutProps): React.ReactElement {
  return <div {...useHostProps({ ...props, className, "data-spui-tree-persona-layout": "" })} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, width: "100%", ...props.style as React.CSSProperties }}>
    {media}<span data-tree-persona-main="" style={{ display: "grid", flex: "1 1 auto", minWidth: 0 }}>{main ?? children}{description == null ? null : <small>{description}</small>}</span>{aside}{actions}
  </div>;
}

export type TreeInteractionEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
export type TreeCheckedChangeEvent = React.ChangeEvent<HTMLElement>;
type TreeOpenChangeEventMap = { ExpandIconClick: React.MouseEvent<HTMLElement>; Click: React.MouseEvent<HTMLElement>; ArrowLeft: React.KeyboardEvent<HTMLElement>; ArrowRight: React.KeyboardEvent<HTMLElement>; Enter: React.KeyboardEvent<HTMLElement> };
type TreeNavigationEventMap = { Click: React.MouseEvent<HTMLElement>; TypeAhead: React.KeyboardEvent<HTMLElement>; ArrowRight: React.KeyboardEvent<HTMLElement>; ArrowLeft: React.KeyboardEvent<HTMLElement>; ArrowUp: React.KeyboardEvent<HTMLElement>; ArrowDown: React.KeyboardEvent<HTMLElement>; Home: React.KeyboardEvent<HTMLElement>; End: React.KeyboardEvent<HTMLElement> };
export type TreeOpenChangeData = { [Type in keyof TreeOpenChangeEventMap]: { event: TreeOpenChangeEventMap[Type]; open: boolean; openItems: Set<string>; value: string; target: HTMLElement; type: Type } }[keyof TreeOpenChangeEventMap];
export type TreeItemOpenChangeData = { [Type in keyof TreeOpenChangeEventMap]: { event: TreeOpenChangeEventMap[Type]; open: boolean; value: string | number; target: HTMLElement; type: Type } }[keyof TreeOpenChangeEventMap];
export type TreeNavigationData = { [Type in keyof TreeNavigationEventMap]: { event: TreeNavigationEventMap[Type]; target: HTMLElement; value: string; parentValue?: string; type: Type; isScrollPrevented: boolean; preventScroll: () => void } }[keyof TreeNavigationEventMap];
export type TreeItemProps = ElementProps & { itemType: "leaf" | "branch"; value?: string | number; open?: boolean; parentValue?: string | number; onOpenChange?: (event: TreeInteractionEvent, data: TreeItemOpenChangeData) => void; disabled?: boolean; children?: React.ReactNode };
export function TreeItem(_props: TreeItemProps): null { return null; }

export type FlatTreeItemProps = ElementProps & { itemType: "leaf" | "branch"; value: string | number; open?: boolean; parentValue?: string | number; onOpenChange?: TreeItemProps["onOpenChange"]; disabled?: boolean; children?: React.ReactNode; "aria-level": number; "aria-setsize": number; "aria-posinset": number };
export function FlatTreeItem(_props: FlatTreeItemProps): null { return null; }

function treeLayoutForItem(children: React.ReactNode): React.ReactElement<TreeItemLayoutProps | TreeItemPersonaLayoutProps> | undefined {
  return React.Children.toArray(children).find(child => React.isValidElement(child) && (child.type === TreeItemLayout || child.type === TreeItemPersonaLayout)) as React.ReactElement<TreeItemLayoutProps | TreeItemPersonaLayoutProps> | undefined;
}

function treeCompositionNodes(children: React.ReactNode, itemCallbacks: Map<string, TreeItemProps>): TreeNode<React.ReactNode>[] {
  const result: TreeNode<React.ReactNode>[] = [];
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return;
    if (child.type === Tree && child.props.children) { result.push(...treeCompositionNodes(child.props.children, itemCallbacks)); return; }
    if (child.type !== TreeItem) return;
    const props = child.props as TreeItemProps;
    const id = props.value ?? (typeof child.key === "string" ? child.key : `tree-item-${result.length}`);
    const layout = treeLayoutForItem(props.children);
    const nested = treeCompositionNodes(props.children, itemCallbacks);
    const text = layout ? getVisibleText(layout.props.main ?? layout.props.children) : getVisibleText(props.children);
    itemCallbacks.set(String(id), props);
    result.push({ id, label: text || String(id), disabled: props.disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true", open: props.open, value: layout ?? text, children: nested.length ? nested : undefined });
  });
  return result;
}

export type TreeProps<T = unknown> = ElementProps & { items?: readonly TreeNode<T>[]; children?: React.ReactNode; label?: string; selectionMode?: "none" | "single" | "multiple" | "multiselect"; selectedKeys?: readonly (string | number)[]; defaultSelectedKeys?: readonly (string | number)[]; checkedItems?: Iterable<string | number | readonly [string | number, boolean | "mixed"]>; defaultCheckedItems?: Iterable<string | number | readonly [string | number, boolean | "mixed"]>; openItems?: Iterable<string | number>; defaultOpenItems?: Iterable<string | number>; expandedKeys?: readonly (string | number)[]; defaultExpandedKeys?: readonly (string | number)[]; onSelectionChange?: (keys: string[], selectedItems: TreeNode<T>[]) => void; onCheckedChange?: (event: TreeCheckedChangeEvent, data: { value: string; checkedItems: Map<string, boolean | "mixed">; target: HTMLElement; event: TreeCheckedChangeEvent; type: "Change"; selectionMode: "single" | "multiselect"; checked: boolean | "mixed" }) => void; onExpandedChange?: (keys: string[]) => void; onOpenChange?: (event: TreeInteractionEvent, data: TreeOpenChangeData) => void; onNavigation?: (event: TreeInteractionEvent, data: TreeNavigationData) => void; navigationMode?: "tree" | "treegrid"; appearance?: "subtle" | "subtle-alpha" | "transparent"; size?: "small" | "medium"; renderItem?: (node: TreeNode<T>, level: number) => React.ReactNode; collapseMotion?: React.ComponentType<PresenceMotionSlotProps>; toggleLabel?: string; emptyMessage?: React.ReactNode };

export function Tree<T>({ items, children, label, selectionMode = "none", selectedKeys, defaultSelectedKeys = [], checkedItems, defaultCheckedItems, openItems, defaultOpenItems, expandedKeys, defaultExpandedKeys = [], onSelectionChange, onCheckedChange, onExpandedChange, onOpenChange, onNavigation, navigationMode = "tree", appearance = "subtle", size = "medium", renderItem, collapseMotion, toggleLabel, emptyMessage, ...props }: TreeProps<T>): React.ReactElement {
  const itemCallbacks = new Map<string, TreeItemProps>();
  const treeItems = items ?? treeCompositionNodes(children, itemCallbacks) as unknown as readonly TreeNode<T>[];
  const composedOpen = items === undefined ? flattenAllTree(treeItems).filter(entry => entry.node.open).map(entry => entry.key) : [];
  const context = React.useContext(UIContext);
  const resolvedTreeLabel = label ?? context.strings.treeLabel ?? defaultStrings.treeLabel!;
  const resolvedToggleLabel = toggleLabel ?? context.strings.treeToggleLabel ?? defaultStrings.treeToggleLabel!;
  const resolvedEmptyMessage = emptyMessage !== undefined ? emptyMessage : context.strings.treeEmptyMessage ?? defaultStrings.treeEmptyMessage!;
  const [initialCheckedItems] = React.useState(() => Array.from(defaultCheckedItems ?? defaultSelectedKeys));
  const [internalChecked, setInternalChecked] = React.useState<Map<string, boolean | "mixed">>(() => new Map(initialCheckedItems.map(item => Array.isArray(item) ? [String(item[0]), item[1]] : [String(item), true])));
  const [internalSelected, setInternalSelected] = React.useState<string[]>(initialCheckedItems.filter(item => !Array.isArray(item) || item[1] === true || item[1] === "mixed").map(item => String(Array.isArray(item) ? item[0] : item)));
  const defaultOpen = defaultOpenItems === undefined ? defaultExpandedKeys : Array.from(defaultOpenItems);
  const [internalExpanded, setInternalExpanded] = React.useState<string[]>([...defaultOpen, ...composedOpen].map(String));
  const [activeKey, setActiveKey] = React.useState("");
  const refs = React.useRef(new Map<string, HTMLDivElement>());
  const selectorRefs = React.useRef(new Map<string, HTMLInputElement>());
  const selectorName = React.useId();
  const typeAhead = React.useRef({ text: "", time: 0 });
  const effectiveSelectionMode = selectionMode === "multiselect" ? "multiple" : selectionMode;
  const checkedMap = React.useMemo(() => {
    const map = new Map<string, boolean | "mixed">();
    for (const item of checkedItems ?? []) Array.isArray(item) ? map.set(String(item[0]), item[1]) : map.set(String(item), true);
    return map;
  }, [checkedItems]);
  const activeSelected = checkedItems !== undefined ? [...checkedMap].filter(([, checked]) => checked === true || checked === "mixed").map(([key]) => key) : selectedKeys === undefined ? internalSelected : selectedKeys.map(String);
  const controlledOpen = React.useMemo(() => openItems === undefined ? expandedKeys : Array.from(openItems), [openItems, expandedKeys]);
  const activeExpanded = React.useMemo(() => {
    const next = new Set(controlledOpen === undefined ? internalExpanded : controlledOpen.map(String));
    for (const { node } of flattenAllTree(treeItems)) if (node.open !== undefined) node.open ? next.add(String(node.id)) : next.delete(String(node.id));
    return [...next];
  }, [controlledOpen, internalExpanded, treeItems]);
  const activeChecked = checkedItems !== undefined ? checkedMap : selectedKeys !== undefined ? new Map<string, boolean | "mixed">(selectedKeys.map(value => [String(value), true])) : internalChecked;
  const selectedSet = React.useMemo(() => new Set(activeSelected), [activeSelected]);
  const expandedSet = React.useMemo(() => new Set(activeExpanded), [activeExpanded]);
  const visible = React.useMemo(() => flattenTree(treeItems, expandedSet), [treeItems, expandedSet]);
  const allEntries = React.useMemo(() => flattenAllTree(treeItems), [treeItems]);
  const currentActiveKey = visible.some(entry => entry.key === activeKey) ? activeKey : visible[0]?.key ?? "";
  const lang = String(props.lang ?? context.lang ?? (typeof document === "undefined" ? "" : document.documentElement.lang)).toLowerCase();
  const languageIsRtl = /^(ar|fa|he|ur|ps|sd|ug|yi)(-|$)/.test(lang);
  const direction = props.dir ?? context.dir;
  const isRtl = direction === "rtl" || (direction === "auto" && languageIsRtl) || (direction === undefined && (languageIsRtl || (typeof document !== "undefined" && getComputedStyle(document.documentElement).direction === "rtl")));
  const updateSelected = (node: TreeNode<T>, event: React.ChangeEvent<HTMLInputElement>): void => {
    if (node.disabled || effectiveSelectionMode === "none") return;
    const key = String(node.id);
    const currentChecked = activeChecked.get(key) ?? false;
    const checked = currentChecked === "mixed" ? true : !currentChecked;
    const next = checked
      ? effectiveSelectionMode === "single" ? [key] : [...activeSelected.filter(value => value !== key), key]
      : activeSelected.filter(value => value !== key);
    const nextChecked = effectiveSelectionMode === "single" ? new Map<string, boolean | "mixed">() : new Map(activeChecked);
    nextChecked.set(key, checked);
    if (selectedKeys === undefined && checkedItems === undefined) { setInternalSelected(next); setInternalChecked(nextChecked); }
    onSelectionChange?.(next, flattenAllTree(treeItems).filter(entry => next.includes(entry.key)).map(entry => entry.node));
    onCheckedChange?.(event, { value: key, checkedItems: nextChecked, target: refs.current.get(key) ?? event.currentTarget, event, type: "Change", selectionMode: effectiveSelectionMode === "multiple" ? "multiselect" : "single", checked });
  };
  const updateExpanded = <Type extends keyof TreeOpenChangeEventMap,>(key: string, event: TreeOpenChangeEventMap[Type], type: Type): void => {
    const node = flattenAllTree(treeItems).find(entry => entry.key === key)?.node;
    if (node?.disabled) return;
    const next = expandedSet.has(key) ? activeExpanded.filter(value => value !== key) : [...activeExpanded, key];
    if (openItems === undefined && expandedKeys === undefined && node?.open === undefined) setInternalExpanded(next);
    onExpandedChange?.(next);
    onOpenChange?.(event, { event, open: next.includes(key), openItems: new Set(next), value: key, target: refs.current.get(key) ?? event.currentTarget, type } as Extract<TreeOpenChangeData, { type: Type }>);
    itemCallbacks.get(key)?.onOpenChange?.(event, { event, open: next.includes(key), value: node?.id ?? key, target: refs.current.get(key) ?? event.currentTarget, type } as Extract<TreeItemOpenChangeData, { type: Type }>);
  };
  function focusKey<Type extends keyof TreeNavigationEventMap>(key: string | undefined, event: TreeNavigationEventMap[Type], type: Type): void;
  function focusKey(key: string | undefined, event: TreeInteractionEvent, type: keyof TreeNavigationEventMap): void {
    if (!key) return;
    setActiveKey(key);
    const entry = visible.find(candidate => candidate.key === key);
    const target = refs.current.get(key);
    if (entry && target) {
      let scrollPrevented = false;
      const data = { event, target, value: key, parentValue: entry.parentKey, type,
        get isScrollPrevented() { return scrollPrevented; },
        preventScroll: () => { scrollPrevented = true; }
      } as unknown as TreeNavigationData;
      onNavigation?.(event, data);
      requestAnimationFrame(() => refs.current.get(key)?.focus({ preventScroll: data.isScrollPrevented }));
    } else requestAnimationFrame(() => refs.current.get(key)?.focus());
  }
  const onTreeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const row = (event.target as HTMLElement).closest<HTMLElement>("[data-tree-key]");
    if (!row) return;
    const key = row.dataset.treeKey!, index = visible.findIndex(entry => entry.key === key), entry = visible[index];
    if (!entry) return;
    if (navigationMode === "treegrid" && event.target !== row) {
      if (event.key === (isRtl ? "ArrowRight" : "ArrowLeft")) { event.preventDefault(); row.focus(); }
      return;
    }
    if (event.key === "ArrowDown") { event.preventDefault(); focusKey(visible[index + 1]?.key, event, event.key); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); focusKey(visible[index - 1]?.key, event, event.key); return; }
    if (event.key === "Home") { event.preventDefault(); focusKey(visible[0]?.key, event, event.key); return; }
    if (event.key === "End") { event.preventDefault(); focusKey(visible.at(-1)?.key, event, event.key); return; }
    if (navigationMode === "treegrid" && event.key === (isRtl ? "ArrowLeft" : "ArrowRight")) {
      const action = row.querySelector<HTMLElement>("button:not(.spui-tree-disclosure):not([disabled]),a[href],input:not([disabled]):not([data-tree-selector]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])");
      if (action) { event.preventDefault(); action.focus(); return; }
    }
    if (event.key === (isRtl ? "ArrowLeft" : "ArrowRight") && entry.node.children?.length) {
      event.preventDefault();
      if (!expandedSet.has(key)) updateExpanded(key, event, event.key as "ArrowLeft" | "ArrowRight");
      else if (visible[index + 1]?.parentKey === key) focusKey(visible[index + 1].key, event, event.key);
      return;
    }
    if (event.key === (isRtl ? "ArrowRight" : "ArrowLeft")) {
      event.preventDefault();
      if (expandedSet.has(key)) updateExpanded(key, event, event.key as "ArrowLeft" | "ArrowRight");
      else focusKey(entry.parentKey, event, event.key);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (entry.node.children?.length) updateExpanded(key, event, "Enter"); else selectorRefs.current.get(key)?.click();
      return;
    }
    if (event.key === " ") { event.preventDefault(); selectorRefs.current.get(key)?.click(); return; }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now(), repeated = now - typeAhead.current.time <= 700 && typeAhead.current.text === event.key;
      const nextText = now - typeAhead.current.time > 700 ? event.key : repeated ? event.key : typeAhead.current.text + event.key;
      typeAhead.current = { text: nextText, time: now };
      const locale = typeof document === "undefined" ? undefined : document.documentElement.lang || undefined;
      const lower = nextText.toLocaleLowerCase(locale);
      const found = [...visible.slice(index + 1), ...visible.slice(0, index + 1)].find(candidate => candidate.node.label.toLocaleLowerCase(locale).startsWith(lower));
      if (found) { event.preventDefault(); focusKey(found.key, event, "TypeAhead"); }
    }
  };
  const host = useHostProps(Object.fromEntries(Object.entries(props).filter(([name]) => !name.startsWith("aria-") && name !== "role")) as Record<string, unknown>);
  const ariaProps = Object.fromEntries(Object.entries(props).filter(([name]) => name.startsWith("aria-"))) as React.AriaAttributes;
  const effectiveRenderItem = renderItem ?? (items === undefined ? (node: TreeNode<T>) => node.value as React.ReactNode : undefined);
  const renderEntry = (entry: VisibleTreeNode<T>): React.ReactNode => {
    const selectorChecked = activeChecked.get(entry.key) ?? selectedSet.has(entry.key);
    const selector = effectiveSelectionMode !== "none" && <span className="spui-tree-selector" style={{ position: "relative", display: "grid", placeItems: "center", flex: "none", width: 16, height: 16 }}>
      <span className="spui-tree-check" data-checked={selectorChecked === true ? "true" : undefined} data-mixed={selectorChecked === "mixed" ? "true" : undefined} aria-hidden="true" style={effectiveSelectionMode === "single" ? { borderRadius: "50%", background: selectorChecked === true ? "var(--spui-ui-accent,#0078d4)" : undefined, boxShadow: selectorChecked === true ? "inset 0 0 0 4px var(--spui-ui-surface,#fff)" : undefined } : undefined}>{React.isValidElement(entry.node.value) ? (entry.node.value.props as TreeItemLayoutProps | TreeItemPersonaLayoutProps).selector : null}</span>
      <input ref={node => { if (node) selectorRefs.current.set(entry.key, node); else selectorRefs.current.delete(entry.key); }} data-tree-selector="" type="checkbox" name={`${selectorName}-tree-selection`} aria-label={entry.node.label} aria-checked={selectorChecked} aria-hidden="true" checked={selectorChecked === true} disabled={entry.node.disabled} tabIndex={-1} onClick={event => event.stopPropagation()} onChange={event => { event.stopPropagation(); setActiveKey(entry.key); updateSelected(entry.node, event); }} style={{ position: "absolute", inset: -3, width: 22, height: 22, margin: 0, opacity: 0, cursor: "pointer" }} />
    </span>;
    const hasChildren = Boolean(entry.node.children?.length);
    const row = <div key={entry.key} ref={node => { if (node) refs.current.set(entry.key, node); else refs.current.delete(entry.key); }} className="spui-tree-item" data-tree-key={entry.key} role="treeitem" aria-level={entry.level} aria-posinset={entry.position} aria-setsize={entry.setSize} aria-expanded={hasChildren ? expandedSet.has(entry.key) : undefined} aria-selected={effectiveSelectionMode === "none" || effectiveSelectionMode === "multiple" ? undefined : selectedSet.has(entry.key)} aria-checked={effectiveSelectionMode === "multiple" ? selectorChecked : undefined} aria-disabled={entry.node.disabled || undefined} tabIndex={entry.key === currentActiveKey && visible.some(item => item.key === entry.key) ? 0 : -1} style={{ "--spui-tree-level": entry.level - 1 } as React.CSSProperties} onFocus={() => setActiveKey(entry.key)} onClick={event => { if ((event.target as HTMLElement).closest("button,a,input,select,textarea") || entry.node.disabled) return; focusKey(entry.key, event, "Click"); event.currentTarget.focus(); selectorRefs.current.get(entry.key)?.click(); }}>
      {hasChildren ? <button type="button" className="spui-tree-disclosure" tabIndex={-1} aria-label={`${resolvedToggleLabel} ${entry.node.label}`} aria-expanded={expandedSet.has(entry.key)} disabled={entry.node.disabled} onClick={event => { event.stopPropagation(); setActiveKey(entry.key); updateExpanded(entry.key, event, "ExpandIconClick"); }}>{React.isValidElement(entry.node.value) ? (entry.node.value.props as TreeItemLayoutProps | TreeItemPersonaLayoutProps).expandIcon ?? <span className="spui-tree-chevron" aria-hidden="true" /> : <span className="spui-tree-chevron" aria-hidden="true" />}</button> : <span className="spui-tree-disclosure" aria-hidden="true" />}
      {selector}
      <span className="spui-tree-label">{effectiveRenderItem ? effectiveRenderItem(entry.node, entry.level) : entry.node.label}</span>
    </div>;
    if (!hasChildren || !collapseMotion) return row;
    const open = expandedSet.has(entry.key);
    const childEntries = allEntries.filter(candidate => candidate.parentKey === entry.key);
    const group = <div ref={node => { if (!node) return; if (open) node.removeAttribute("inert"); else node.setAttribute("inert", ""); }} role="group" aria-hidden={!open || undefined}>{childEntries.map(renderEntry)}</div>;
    const CollapseMotion = collapseMotion;
    return <React.Fragment key={entry.key}>{row}<CollapseMotion visible={open} unmountOnExit>{group}</CollapseMotion></React.Fragment>;
  };
  return <div {...host}>
    <style>{`.spui-tree{min-width:0;outline:none;color:var(--spui-ui-text,var(--spui-semantic-body-text,#323130));font-family:var(--spui-font-family,inherit)}.spui-tree:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px;border-radius:var(--spui-control-radius,4px)}.spui-tree-item{box-sizing:border-box;display:flex;align-items:center;gap:8px;min-height:36px;padding-block:4px;padding-inline-end:8px;padding-inline-start:calc(8px + var(--spui-tree-level,0) * 20px);border-radius:var(--spui-control-radius,4px);cursor:default;user-select:none}.spui-tree[data-size=small] .spui-tree-item{min-height:28px}.spui-tree-item:hover{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.spui-tree[data-appearance=transparent] .spui-tree-item:hover,.spui-tree[data-appearance=transparent] .spui-tree-item[aria-selected=true],.spui-tree[data-appearance=transparent] .spui-tree-item[aria-checked=true]{background:transparent}.spui-tree[data-appearance=subtle-alpha] .spui-tree-item:hover{background:color-mix(in srgb,var(--spui-ui-text,#323130) 5%,transparent)}.spui-tree-item[aria-selected=true],.spui-tree-item[aria-checked=true]{background:color-mix(in srgb,var(--spui-ui-accent,#0078d4) 12%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}.spui-tree-item:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}.spui-tree-item[aria-disabled=true]{opacity:.55;cursor:not-allowed}.spui-tree-disclosure{flex:none;display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:inherit;cursor:pointer}.spui-tree-disclosure:hover{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.spui-tree-disclosure:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4))}.spui-tree-chevron{width:0;height:0;border-block:4px solid transparent;border-inline-start:5px solid currentColor;transition:transform var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}.spui-tree-disclosure[aria-expanded=true] .spui-tree-chevron{transform:rotate(90deg)}.spui-tree-check{flex:none;width:14px;height:14px;border:1px solid currentColor;border-radius:3px}.spui-tree-item[aria-checked=true] .spui-tree-check{background:var(--spui-ui-accent,#0078d4);box-shadow:inset 0 0 0 3px var(--spui-ui-surface,#fff)}.spui-tree-item[aria-checked=mixed] .spui-tree-check{background:linear-gradient(var(--spui-ui-accent,#0078d4),var(--spui-ui-accent,#0078d4)) center/8px 2px no-repeat}.spui-tree-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.spui-tree-empty{padding:12px;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161))}@media(prefers-reduced-motion:reduce){.spui-tree-chevron{transition:none}}@media(forced-colors:active){.spui-tree-item[aria-selected=true],.spui-tree-item[aria-checked=true],.spui-tree-item[aria-checked=mixed]{outline:1px solid Highlight}.spui-tree-item:focus-visible,.spui-tree-disclosure:focus-visible{outline-color:Highlight}}`}</style>
    <div {...ariaProps} className="spui-tree" data-appearance={appearance} data-size={size} data-navigation-mode={navigationMode} role="tree" aria-label={String(ariaProps["aria-label"] ?? resolvedTreeLabel)} aria-multiselectable={effectiveSelectionMode === "multiple" ? true : undefined} tabIndex={visible.length ? -1 : 0} onKeyDown={onTreeKeyDown}>
      {visible.length ? collapseMotion ? allEntries.filter(entry => !entry.parentKey).map(renderEntry) : visible.map(renderEntry) : <div className="spui-tree-empty" role="none">{resolvedEmptyMessage}</div>}
    </div>
  </div>;
}

export type FlatTreeProps = ElementProps & { children?: React.ReactNode; label?: string; selectionMode?: "none" | "single" | "multiple" | "multiselect"; selectedKeys?: readonly (string | number)[]; defaultSelectedKeys?: readonly (string | number)[]; checkedItems?: Iterable<string | number | readonly [string | number, boolean | "mixed"]>; defaultCheckedItems?: Iterable<string | number | readonly [string | number, boolean | "mixed"]>; openItems?: Iterable<string | number>; defaultOpenItems?: Iterable<string | number>; expandedKeys?: readonly (string | number)[]; defaultExpandedKeys?: readonly (string | number)[]; onSelectionChange?: TreeProps["onSelectionChange"]; onCheckedChange?: TreeProps["onCheckedChange"]; onExpandedChange?: TreeProps["onExpandedChange"]; onOpenChange?: TreeProps["onOpenChange"]; onNavigation?: TreeProps["onNavigation"]; navigationMode?: "tree" | "treegrid"; appearance?: "subtle" | "subtle-alpha" | "transparent"; size?: "small" | "medium"; renderItem?: (node: TreeNode<React.ReactNode>, level: number) => React.ReactNode; collapseMotion?: React.ComponentType<PresenceMotionSlotProps>; toggleLabel?: string; emptyMessage?: React.ReactNode };
export function FlatTree({ children, ...props }: FlatTreeProps): React.ReactElement {
  const entries = React.Children.toArray(children).filter((child): child is React.ReactElement<FlatTreeItemProps> => React.isValidElement(child) && child.type === FlatTreeItem);
  const nodes = new Map<string, TreeNode<React.ReactNode>>();
  const parents = new Map<string, string | undefined>();
  entries.forEach((entry, index) => {
    const item = entry.props;
    const id = item.value ?? (typeof entry.key === "string" ? entry.key : `flat-tree-item-${index}`);
    const key = String(id);
    const layout = treeLayoutForItem(item.children);
    const label = layout ? getVisibleText(layout.props.main ?? layout.props.children) : getVisibleText(item.children);
    nodes.set(key, { id, label: label || key, disabled: item.disabled || item["aria-disabled"] === true || item["aria-disabled"] === "true", open: item.open, value: layout ?? label, children: [] });
    parents.set(key, item.parentValue === undefined ? undefined : String(item.parentValue));
  });
  const roots: TreeNode<React.ReactNode>[] = [];
  for (const [key, node] of nodes) {
    const parentKey = parents.get(key);
    const parent = parentKey === undefined ? undefined : nodes.get(parentKey);
    if (parent && parentKey !== key) (parent.children as TreeNode<React.ReactNode>[]).push(node);
    else roots.push(node);
  }
  return <Tree {...props} items={roots} renderItem={props.renderItem ?? (node => node.value as React.ReactNode)} />;
}

export type TextFieldProps = ElementProps & { label?: string; value?: string; onValueChange?: (value: string) => void; name?: string; required?: boolean; disabled?: boolean; readOnly?: boolean; placeholder?: string; type?: string };

export const TextField = React.forwardRef<HTMLElement, TextFieldProps>(function TextField(inputProps: TextFieldProps, forwardedRef): React.ReactElement {
  const { label, value, onValueChange, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true });
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineField);
  useSpuiEvent(ref, "spui-input", onValueChange ? detail => onValueChange(String(detail.value ?? "")) : undefined);
  return React.createElement("spui-field", useCustomElementProps({ ...props, ref, label, value }));
});

export type FieldProps = ElementProps & {
  children?: React.ReactNode | ((props: FieldControlProps) => React.ReactNode);
  label?: React.ReactNode;
  hint?: React.ReactNode;
  validationMessage?: React.ReactNode;
  validationMessageIcon?: React.ReactNode;
  validationState?: FieldValidationState;
  required?: boolean;
  disabled?: boolean;
  orientation?: FieldOrientation;
  size?: LabelSize;
};

/** Pair one form control with a theme-aware label, hint, and validation message. */
export function Field({ children, label, hint, validationMessage, validationMessageIcon, validationState, required, disabled, orientation = "vertical", size = "medium", className, style, ...props }: FieldProps): React.ReactElement {
  const generatedId = React.useId();
  const initialControl = React.isValidElement(children) && children.type !== React.Fragment ? children as React.ReactElement<Record<string, unknown>> : undefined;
  const initialControlProps = initialControl?.props ?? {};
  let controlId = String(initialControlProps.id ?? `${generatedId}-control`);
  const labelText = label == null ? "" : getVisibleText(label);
  const descriptionText = [getVisibleText(validationMessage), getVisibleText(hint)].filter(Boolean).join(" ");
  const labelId = label == null ? undefined : `${generatedId}-label`;
  const hintId = hint == null ? undefined : `${generatedId}-hint`;
  const hasValidationMessage = validationMessage !== undefined && validationMessage !== null && validationMessage !== false;
  const state = validationState ?? (hasValidationMessage ? "error" : "none");
  const messageId = hasValidationMessage ? `${generatedId}-validation` : undefined;
  let describedBy = String(initialControlProps["aria-describedby"] ?? "") || undefined;
  let labelledBy = initialControlProps["aria-labelledby"] as string | undefined;
  const fieldDescription = [initialControlProps["aria-description"], descriptionText].filter(Boolean).map(String);
  const fieldControlProps: FieldControlProps = {
    id: controlId,
    "aria-label": labelText || initialControlProps["aria-label"] as string | undefined,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-description": [...new Set(fieldDescription)].join(" ") || undefined,
    "aria-invalid": state === "error" ? true : state === "none" ? initialControlProps["aria-invalid"] as boolean | "true" | "false" | undefined : undefined,
    "aria-required": required || initialControlProps["aria-required"] ? true : undefined,
  };
  const renderedChildren = typeof children === "function" ? children(fieldControlProps) : children;
  const control = React.isValidElement(renderedChildren) && renderedChildren.type !== React.Fragment ? renderedChildren as React.ReactElement<Record<string, unknown>> : undefined;
  const controlProps = control?.props ?? initialControlProps;
  if (controlProps.id != null) controlId = String(controlProps.id);
  describedBy = mergeFieldIdRefs(describedBy ?? null, String(controlProps["aria-describedby"] ?? ""));
  labelledBy = mergeFieldIdRefs(labelledBy ?? "", String(controlProps["aria-labelledby"] ?? ""));
  const tokens = getFieldValidationTokens(state);
  const controlStyle = {
    ...(controlProps.style as React.CSSProperties | undefined),
    ...(tokens ? { "--spui-control-border": tokens.border, "--spui-input-border": tokens.border, "--spui-focus-ring": tokens.border } : {}),
  } as React.CSSProperties;
  const cloneControl = control && typeof control.type === "string" && (["input", "select", "textarea", "button"].includes(control.type.toLowerCase()) || control.type.includes("-"));
  const customControl = Boolean(cloneControl && typeof control?.type === "string" && control.type.includes("-"));
  const fieldDescriptionIds = new Set([hintId, messageId].filter((id): id is string => Boolean(id)));
  const customControlDescribedBy = describedBy?.split(/\s+/).filter(id => id && !fieldDescriptionIds.has(id)).join(" ") || undefined;
  const customControlLabelledBy = labelId && labelledBy ? labelledBy.split(/\s+/).filter(id => id !== labelId).join(" ") || undefined : labelledBy;
  const customDescription = [...new Set([controlProps["aria-description"], descriptionText].filter(Boolean).map(String))].join(" ") || undefined;
  const enhancedControl = cloneControl && control ? React.cloneElement(control, {
    id: controlId,
    "aria-label": labelText || controlProps["aria-label"],
    "aria-labelledby": customControl ? customControlLabelledBy : labelledBy,
    "aria-describedby": customControl ? customControlDescribedBy : describedBy,
    "aria-description": customControl ? customDescription : controlProps["aria-description"],
    "aria-invalid": state === "error" ? true : state === "none" ? controlProps["aria-invalid"] : undefined,
    "aria-required": required || controlProps["aria-required"] ? true : undefined,
    required: required || controlProps.required || undefined,
    disabled: disabled || controlProps.disabled || undefined,
    "data-spui-validation-state": state,
    ...(tokens ? { style: controlStyle } : {}),
  }) : renderedChildren;
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: orientation === "horizontal" ? "minmax(8rem, 1fr) minmax(0, 2fr)" : "minmax(0, 1fr)",
    columnGap: "var(--spui-field-column-gap,16px)",
    rowGap: "var(--spui-field-gap,4px)",
    alignItems: "start",
    color: "var(--spui-ui-text,var(--spui-semantic-body-text,#323130))",
    fontFamily: "var(--spui-font-family,inherit)",
    minWidth: 0,
    ...style,
  };
  const requiredValue = Boolean(required || controlProps.required);
  const fieldContextValue: FieldContextValue = {
    generatedControlId: controlId,
    labelText: labelText || undefined,
    descriptionText: descriptionText || undefined,
    orientation,
    required: requiredValue,
    size,
    validationState: state,
    labelFor: label == null ? undefined : controlId,
    labelId,
    validationMessageId: messageId,
    hintId,
    disabled: Boolean(disabled || controlProps.disabled),
  };
  return <div {...useHostProps({ ...props, className: ["spui-form-field", className].filter(Boolean).join(" "), style: gridStyle, "data-orientation": orientation, "data-size": size, "data-validation-state": state })}>
    {label == null ? null : <Label id={labelId} htmlFor={controlId} size={size} required={requiredValue} disabled={Boolean(disabled || controlProps.disabled)} style={{ gridArea: orientation === "horizontal" ? "1 / 1 / span 3 / 2" : undefined }}>{label}</Label>}
    <div style={{ gridArea: orientation === "horizontal" ? "1 / 2 / span 3 / 3" : undefined, minWidth: 0 }}><FieldContext.Provider value={fieldContextValue}>{enhancedControl}</FieldContext.Provider></div>
    {hint == null ? null : <div id={hintId} style={{ gridArea: orientation === "horizontal" ? "2 / 2" : undefined, color: "var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161))", fontSize: "var(--spui-field-hint-size,12px)" }}>{hint}</div>}
    {!hasValidationMessage ? null : <div id={messageId} data-field-validation={state} role={state === "error" || state === "warning" ? "alert" : undefined} style={{ gridArea: orientation === "horizontal" ? "3 / 2" : undefined, display: "flex", alignItems: "baseline", gap: 6, color: tokens?.foreground, fontSize: "var(--spui-field-message-size,12px)" }}>
      {state === "none" ? null : <span data-slot="validationMessageIcon" aria-hidden="true">{validationMessageIcon ?? (state === "success" ? "✓" : "!")}</span>}{validationMessage}
    </div>}
  </div>;
}

export type InputProps = Omit<ElementProps, "children" | "onChange" | "defaultValue" | "defaultChecked"> & { children?: never; type?: InputType; value?: string | number | readonly string[]; defaultValue?: string | number | readonly string[]; checked?: boolean; defaultChecked?: boolean; accept?: string; alt?: string; autoComplete?: string; capture?: boolean | string; form?: string; formAction?: string; formEncType?: string; formMethod?: string; formNoValidate?: boolean; formTarget?: string; height?: number | string; list?: string; max?: number | string; maxLength?: number; min?: number | string; minLength?: number; multiple?: boolean; pattern?: string; src?: string; step?: number | string; width?: number | string; input?: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> | React.InputHTMLAttributes<HTMLInputElement>; onValueChange?: (value: string) => void; onChange?: (event: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => void; contentBefore?: React.ReactNode; contentAfter?: React.ReactNode; size?: InputSize; appearance?: InputAppearance; disabled?: boolean; required?: boolean; readOnly?: boolean; placeholder?: string; name?: string };

/** Bare input primitive. Supply aria-label or aria-labelledby; use TextField when a shadow-safe visible label is needed. */
export const Input = React.forwardRef<HTMLElement, InputProps>(function Input(inputProps: InputProps, forwardedRef): React.ReactElement {
  const { type = "text", value, defaultValue, checked, defaultChecked, input: inputControl, onValueChange, onChange, contentBefore, contentAfter, size = "medium", appearance = "outline", disabled, required, readOnly, placeholder, capture, formNoValidate, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true, supportsSize: true });
  const ref = React.useRef<HTMLElement & { value: string; defaultValue: string; type: string; checked: boolean }>(null);
  React.useImperativeHandle(forwardedRef, () => ref.current!, []);
  ensureDefined(defineInput);
  useSpuiEvent(ref, "spui-input", (detail, event) => {
    const nextValue = String(detail.value ?? "");
    onValueChange?.(nextValue);
    const sourceEvent = detail.sourceEvent ?? event;
    onChange?.(createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current as HTMLElement) as HTMLInputElement) as React.ChangeEvent<HTMLInputElement>, { value: nextValue });
    if (value !== undefined && ref.current) ref.current.value = String(value);
    if (checked !== undefined && ref.current) ref.current.checked = checked;
  });
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (element.type !== "file" && defaultValue !== undefined) element.defaultValue = String(defaultValue);
    if (element.type !== "file" && value !== undefined) element.value = String(value);
    if (checked !== undefined) element.checked = checked;
  }, [type, defaultValue, value, checked]);
  const inputSlot = inputControl == null ? null : React.isValidElement(inputControl)
    ? React.cloneElement(inputControl as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, { slot: "input" } as React.InputHTMLAttributes<HTMLInputElement> & { slot: string })
    : React.createElement("input", { ...inputControl, slot: "input" });
  return React.createElement("spui-input", useCustomElementProps({ ...props, ref, type, value: undefined, defaultValue: undefined, size, appearance, disabled, required, placeholder, checked: checked || undefined, "default-checked": defaultChecked || undefined, capture: capture === true ? "" : capture || undefined, formnovalidate: formNoValidate || undefined, "read-only": readOnly || undefined }),
    inputSlot,
    contentBefore == null ? null : React.createElement("span", { slot: "before" }, contentBefore),
    contentAfter == null ? null : React.createElement("span", { slot: "after" }, contentAfter));
});

export type FileUploadProps = ElementProps & { label?: string; name?: string; form?: string; accept?: string; multiple?: boolean; disabled?: boolean; required?: boolean; maxFiles?: number; maxFileSize?: number; browseLabel?: string; dropLabel?: string; removeLabel?: string; selectedLabel?: string; onFilesChange?: (files: File[]) => void; onFilesError?: (errors: FileUploadError[]) => void };

export const FileUpload = React.forwardRef<HTMLElement, FileUploadProps>(function FileUpload(inputProps: FileUploadProps, forwardedRef): React.ReactElement {
  const { label, name, accept, multiple = false, disabled = false, required = false, maxFiles, maxFileSize, browseLabel, dropLabel, removeLabel, selectedLabel, onFilesChange, onFilesError, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true });
  const context = React.useContext(UIContext);
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineFileUpload);
  useSpuiEvent(ref, "spui-file-change", detail => onFilesChange?.(detail.files ?? []));
  useSpuiEvent(ref, "spui-file-error", detail => onFilesError?.(detail.errors ?? []));
  return React.createElement("spui-file-upload", useCustomElementProps({ ...props, ref, label, name, accept, multiple: multiple || undefined, disabled: disabled || undefined, required: required || undefined, "max-files": maxFiles, "max-file-size": maxFileSize, "browse-label": browseLabel ?? context.strings.fileUploadBrowse, "drop-label": dropLabel ?? context.strings.fileUploadDrop, "remove-label": removeLabel ?? context.strings.fileUploadRemove, "selected-label": selectedLabel ?? context.strings.fileUploadSelected, "required-message": context.strings.fileUploadRequired, "file-type-message": context.strings.fileUploadTypeError, "file-too-large-message": context.strings.fileUploadSizeError, "max-files-message": context.strings.fileUploadLimitError }));
});

export type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "alt" | "loading" | "decoding"> & {
  alt: string;
  fit?: ImageFit;
  shape?: ImageShape;
  block?: boolean;
  bordered?: boolean;
  shadow?: boolean;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
};

/** Theme-aware image styling on a native img; keeps srcset, dimensions, and browser loading native. */
export function Image({ alt, fit = "none", shape = "square", block, bordered, shadow, loading = "lazy", decoding = "async", style, ...props }: ImageProps): React.ReactElement {
  return React.createElement("img", useHostProps({ ...props, alt, loading, decoding, style: { ...getImageStyle({ fit, shape, block, bordered, shadow, width: props.width, height: props.height }), ...style } }));
}

export type SearchBoxChangeEvent = React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLSpanElement>;
export type SearchBoxProps = Omit<InputProps, "appearance" | "children" | "defaultValue" | "input" | "onChange" | "size" | "type" | "value"> & { label?: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; onSearch?: (value: string) => void; onChange?: (event: SearchBoxChangeEvent, data: { value: string }) => void; size?: SearchSize; appearance?: SearchAppearance; clearLabel?: string; contentBefore?: React.ReactNode; contentAfter?: React.ReactNode; dismiss?: React.ReactNode };

export const SearchBox = React.forwardRef<HTMLElement, SearchBoxProps>(function SearchBox(inputProps: SearchBoxProps, forwardedRef): React.ReactElement {
  const { label, value, defaultValue, onValueChange, onSearch, onChange, size = "medium", appearance = "outline", clearLabel, readOnly, contentBefore, contentAfter, dismiss, ...props } = useFieldControlProps_unstable(inputProps, { supportsSize: true });
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const context = React.useContext(UIContext);
  ensureDefined(defineSearchBox);
  useSpuiEvent(ref, "spui-input", onValueChange || onChange ? (detail, event) => {
    const nextValue = String(detail.value ?? "");
    onValueChange?.(nextValue);
    const sourceEvent = detail.sourceEvent ?? event;
    const target = sourceEventTarget(sourceEvent, ref.current as HTMLElement);
    const reactEvent = createReactEventBridge(sourceEvent, event, target);
    onChange?.(reactEvent as SearchBoxChangeEvent, { value: nextValue });
  } : undefined);
  useSpuiEvent(ref, "spui-search", onSearch ? detail => onSearch(String(detail.value ?? "")) : undefined);
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { value?: string; defaultValue?: string }) | null;
    if (!element) return;
    if (value !== undefined) element.value = value;
    else if (defaultValue !== undefined) element.defaultValue = defaultValue;
  }, [value, defaultValue]);
  return React.createElement("spui-search-box", useCustomElementProps({ ...props, ref, label, value: undefined, size, appearance, "clear-label": clearLabel ?? context.strings.clear, "read-only": readOnly || undefined }),
    contentBefore == null ? null : React.createElement("span", { slot: "content-before" }, contentBefore),
    contentAfter == null ? null : React.createElement("span", { slot: "content-after" }, contentAfter),
    dismiss == null ? null : React.createElement("span", { slot: "dismiss" }, dismiss));
});

type FluentEventData<TChangeEvent extends Event | React.SyntheticEvent> =
  | { color: ColorPickerHsvColor; event: SharePointUIEvent; type: undefined }
  | { color: ColorPickerHsvColor; event: TChangeEvent; type: "change" };
export type ColorPickerOnColorChangeData = FluentEventData<React.ChangeEvent<HTMLInputElement>>;
export type ColorPickerProps = Omit<ElementProps, "color"> & { label?: string; name?: string; form?: string; color?: ColorPickerHsvColor; defaultColor?: ColorPickerHsvColor; value?: string; defaultValue?: string; alpha?: number; defaultAlpha?: number; colors?: readonly string[]; format?: ColorPickerFormat; onColorChange?: (event: SharePointUIEvent, data: ColorPickerOnColorChangeData) => void; onValueChange?: (value: string, alpha: number) => void; onFormatChange?: (format: ColorPickerFormat) => void; size?: ColorPickerSize; shape?: ColorPickerShape; readOnly?: boolean; required?: boolean; children?: React.ReactNode };

export const ColorPicker = React.forwardRef<HTMLElement, ColorPickerProps>(function ColorPicker(inputProps: ColorPickerProps, forwardedRef): React.ReactElement {
  const { children, label, color, defaultColor, value, defaultValue, alpha, defaultAlpha, colors, format, onColorChange, onValueChange, onFormatChange, size = "medium", shape = "rounded", readOnly, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true, supportsSize: true });
  const ref = React.useRef<HTMLElement & { color?: ColorPickerHsvColor; defaultColor?: ColorPickerHsvColor; format?: ColorPickerFormat }>(null)
  useExposeHostRef(ref, forwardedRef);;
  const context = React.useContext(UIContext);
  ensureDefined(defineColorPicker);
  useSpuiEvent(ref, "spui-change", onValueChange || onColorChange ? (detail, event) => {
    onValueChange?.(String(detail.value ?? "#000000"), Number(detail.alpha ?? 1));
    if (detail.color) {
      const sourceEvent = detail.event ?? event;
      const input = sourceEvent.target instanceof HTMLInputElement ? sourceEvent.target : undefined;
      const changeEvent = input ? createReactChangeEventBridge(sourceEvent, event, input) : undefined;
      const callbackEvent = changeEvent ?? sourceEvent;
      const data: ColorPickerOnColorChangeData = changeEvent
        ? { color: detail.color, event: changeEvent, type: "change" }
        : { color: detail.color, event: callbackEvent, type: undefined };
      onColorChange?.(callbackEvent, data);
    }
  } : undefined);
  useSpuiEvent(ref, "spui-format-change", onFormatChange ? detail => onFormatChange(detail.format === "rgb" ? "rgb" : "hex") : undefined);
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { color?: ColorPickerHsvColor; defaultColor?: ColorPickerHsvColor; value?: string; defaultValue?: string; alpha?: number; defaultAlpha?: number; colors?: string[]; format?: ColorPickerFormat }) | null;
    if (!element) return;
    if (color !== undefined) element.color = color;
    else if (value !== undefined) element.value = value;
    if (defaultColor !== undefined) element.defaultColor = defaultColor;
    else if (defaultValue !== undefined) element.defaultValue = defaultValue;
    if (alpha !== undefined) element.alpha = alpha;
    else if (defaultAlpha !== undefined) element.defaultAlpha = defaultAlpha;
    if (colors) element.colors = [...colors];
    if (format !== undefined) element.format = format;
  }, [color, defaultColor, value, defaultValue, alpha, defaultAlpha, colors, format]);
  return React.createElement("spui-color-picker", useCustomElementProps({ ...props, ref, label, value: undefined, "default-value": undefined, "default-color": undefined, alpha: undefined, "default-alpha": undefined, colors: undefined, size, shape, "color-format": format, "read-only": readOnly || undefined, "color-input-label": context.strings.colorChoose, "hex-input-label": context.strings.colorHex, "hue-label": context.strings.colorHue, "area-label": context.strings.colorArea, "area-value-text": context.strings.colorAreaValue, "format-label": context.strings.colorFormat, "rgb-label": context.strings.colorRgb, "red-label": context.strings.colorRed, "green-label": context.strings.colorGreen, "blue-label": context.strings.colorBlue, "alpha-label": context.strings.colorOpacity, "swatches-label": context.strings.colorSwatches, "swatch-label": context.strings.colorSwatch, "invalid-message": context.strings.colorInvalid }), children);
});

export type ColorAreaChangeData =
  | { color: ColorPickerHsvColor; event: SharePointUIEvent; type: undefined }
  | { color: ColorPickerHsvColor; event: React.SyntheticEvent | PointerEvent; type: "change" };
export type ColorControlChangeData = FluentEventData<React.ChangeEvent<HTMLInputElement>>;
export type ColorControlChangeHandler = (event: SharePointUIEvent, data: ColorControlChangeData) => void;
export type ColorAreaProps = Omit<ElementProps, "color" | "onChange"> & { color?: ColorPickerHsvColor; defaultColor?: ColorPickerHsvColor; inputX?: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> | React.InputHTMLAttributes<HTMLInputElement>; inputY?: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> | React.InputHTMLAttributes<HTMLInputElement>; thumb?: React.ReactNode; shape?: ColorPickerShape; onChange?: (event: SharePointUIEvent, data: ColorAreaChangeData) => void; children?: React.ReactNode };
export type ColorSliderProps = Omit<ElementProps, "color" | "onChange"> & { color?: ColorPickerHsvColor; defaultColor?: ColorPickerHsvColor; input?: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> | React.InputHTMLAttributes<HTMLInputElement>; rail?: React.ReactNode; thumb?: React.ReactNode; channel?: ColorSliderChannel; vertical?: boolean; shape?: ColorPickerShape; onChange?: ColorControlChangeHandler };
export type AlphaSliderProps = Omit<ColorSliderProps, "channel"> & { transparency?: boolean };

export const ColorArea = React.forwardRef<HTMLElement, ColorAreaProps>(function ColorArea({ children, color, defaultColor, inputX, inputY, thumb, shape, onChange, ...props }: ColorAreaProps, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineColorArea);
  useSpuiEvent(ref, "spui-color-change", (rawDetail, event) => {
    const detail = rawDetail as SpuiEventDetail & { event?: Event };
    if (!detail.color) return;
    const sourceEvent = detail.event ?? event;
    const input = sourceEvent.target instanceof HTMLInputElement ? sourceEvent.target : undefined;
    const changeEvent = input ? createReactChangeEventBridge(sourceEvent, event, input) : undefined;
    const callbackEvent = changeEvent ?? sourceEvent;
    const data: ColorAreaChangeData = changeEvent
      ? { color: detail.color, event: changeEvent, type: "change" }
      : sourceEvent instanceof PointerEvent
        ? { color: detail.color, event: sourceEvent, type: "change" }
        : { color: detail.color, event: callbackEvent, type: undefined };
    onChange?.(callbackEvent, data);
  });
  React.useLayoutEffect(() => { const element = ref.current as (HTMLElement & { color?: ColorPickerHsvColor; defaultColor?: ColorPickerHsvColor }) | null; if (!element) return; if (color) element.color = color; if (defaultColor) element.defaultColor = defaultColor; }, [color, defaultColor]);
  const inputSlot = (input: ColorAreaProps["inputX"], slot: "inputX" | "inputY"): React.ReactNode => input == null ? null : React.isValidElement(input)
    ? React.cloneElement(input as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, { slot } as React.InputHTMLAttributes<HTMLInputElement> & { slot: string })
    : React.createElement("input", { ...input, slot });
  return React.createElement("spui-color-area", useCustomElementProps({ ...props, ref, color: undefined, defaultColor: undefined, shape, slot: "area" }), inputSlot(inputX, "inputX"), inputSlot(inputY, "inputY"), thumb == null ? null : React.createElement("span", { slot: "thumb", "aria-hidden": true }, thumb), children);
});

export const ColorSlider = React.forwardRef<HTMLElement, ColorSliderProps>(function ColorSlider({ channel = "hue", vertical, color, defaultColor, input, rail, thumb, shape, onChange, ...props }: ColorSliderProps, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineColorSlider);
  useSpuiEvent(ref, "spui-color-change", (rawDetail, event) => {
    const detail = rawDetail as SpuiEventDetail & { event?: Event };
    if (!detail.color) return;
    const sourceEvent = detail.event ?? event;
    const input = sourceEvent.target instanceof HTMLInputElement ? sourceEvent.target : undefined;
    if (!input) return;
    const changeEvent = createReactChangeEventBridge(sourceEvent, event, input);
    onChange?.(changeEvent, { color: detail.color, event: changeEvent, type: "change" });
  });
  React.useLayoutEffect(() => { const element = ref.current as (HTMLElement & { color?: ColorPickerHsvColor; defaultColor?: ColorPickerHsvColor }) | null; if (!element) return; if (color) element.color = color; if (defaultColor) element.defaultColor = defaultColor; }, [color, defaultColor]);
  const inputSlot = input == null ? null : React.isValidElement(input)
    ? React.cloneElement(input as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, { slot: "input" } as React.InputHTMLAttributes<HTMLInputElement> & { slot: string })
    : React.createElement("input", { ...input, slot: "input" });
  const railSlot = rail == null ? null : React.isValidElement(rail)
    ? React.cloneElement(rail as React.ReactElement<{ slot?: string }>, { slot: "rail" })
    : React.createElement("span", { slot: "rail" }, rail);
  const thumbSlot = thumb == null ? null : React.isValidElement(thumb)
    ? React.cloneElement(thumb as React.ReactElement<{ slot?: string }>, { slot: "thumb" })
    : React.createElement("span", { slot: "thumb", "aria-hidden": true }, thumb);
  return React.createElement("spui-color-slider", useCustomElementProps({ ...props, ref, color: undefined, defaultColor: undefined, channel, shape, vertical: vertical || undefined, slot: "sliders", "aria-label": props["aria-label"] || (channel === "hue" ? context.strings.colorHue : channel === "saturation" ? context.strings.colorSaturation : context.strings.colorValue) }), inputSlot, railSlot, thumbSlot);
});

export const AlphaSlider = React.forwardRef<HTMLElement, AlphaSliderProps>(function AlphaSlider({ transparency, vertical, color, defaultColor, shape, onChange, ...props }: AlphaSliderProps, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineAlphaSlider);
  useSpuiEvent(ref, "spui-color-change", (rawDetail, event) => {
    const detail = rawDetail as SpuiEventDetail & { event?: Event };
    if (!detail.color) return;
    const sourceEvent = detail.event ?? event;
    const input = sourceEvent.target instanceof HTMLInputElement ? sourceEvent.target : undefined;
    if (!input) return;
    const changeEvent = createReactChangeEventBridge(sourceEvent, event, input);
    onChange?.(changeEvent, { color: detail.color, event: changeEvent, type: "change" });
  });
  React.useLayoutEffect(() => { const element = ref.current as (HTMLElement & { color?: ColorPickerHsvColor; defaultColor?: ColorPickerHsvColor }) | null; if (!element) return; if (color) element.color = color; if (defaultColor) element.defaultColor = defaultColor; }, [color, defaultColor]);
  return React.createElement("spui-alpha-slider", useCustomElementProps({ ...props, ref, color: undefined, defaultColor: undefined, shape, transparency: transparency || undefined, vertical: vertical || undefined, slot: "alpha", "aria-label": props["aria-label"] || context.strings.colorOpacity }));
});

export type SwatchPickerSelection = { selectedValue: string; selectedColor: string; selectedValues: string[]; selectedColors: string[]; selectionMode: "single" | "multiple" };
export type SwatchPickerSelectionChangeEvent = SharePointUIEvent;
export type SwatchPickerOnSelectionChangeData =
  | (SwatchPickerSelection & { event: SharePointUIEvent; type: undefined; selectedSwatch: string })
  | (SwatchPickerSelection & { event: React.MouseEvent<HTMLButtonElement>; type: "click"; selectedSwatch: string });
export type SwatchPickerProps = ElementProps & { selectedValue?: string; defaultSelectedValue?: string; selectedValues?: string[]; defaultSelectedValues?: string[]; selectionMode?: "single" | "multiple"; layout?: "row" | "grid"; size?: "extra-small" | "small" | "medium" | "large"; shape?: "rounded" | "square" | "circular"; spacing?: "small" | "medium"; focusMode?: "arrow" | "tab"; columns?: number; onSelectionChange?: (event: SwatchPickerSelectionChangeEvent, data: SwatchPickerOnSelectionChangeData) => void; children?: React.ReactNode };

export const SwatchPicker = React.forwardRef<HTMLElement, SwatchPickerProps>(function SwatchPicker({ children, selectedValue, defaultSelectedValue, selectedValues, defaultSelectedValues, selectionMode = "single", layout = "grid", size = "medium", shape = "square", spacing = "medium", focusMode = "arrow", columns = 6, onSelectionChange, ...props }: SwatchPickerProps, forwardedRef): React.ReactElement {
  const strings = React.useContext(UIContext).strings;
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineNativeSwatchPicker);
  useSpuiEvent(ref, "spui-selection-change", (detail, event) => {
    const sourceEvent = detail.event ?? event;
    const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!) as HTMLButtonElement) as React.MouseEvent<HTMLButtonElement>;
    const data: SwatchPickerOnSelectionChangeData = { event: callbackEvent, type: "click", selectedValue: String(detail.selectedValue ?? ""), selectedSwatch: String(detail.selectedSwatch ?? detail.selectedColor ?? ""), selectedColor: String(detail.selectedColor ?? ""), selectedValues: Array.isArray(detail.selectedValues) ? detail.selectedValues.map(String) : [], selectedColors: Array.isArray(detail.selectedColors) ? detail.selectedColors.map(String) : [], selectionMode: detail.selectionMode === "multiple" ? "multiple" : "single" };
    onSelectionChange?.(callbackEvent, data);
  });
  return React.createElement("spui-swatch-picker", useCustomElementProps({ ...props, ref, selectedValue: undefined, defaultSelectedValue: undefined, selectedValues: undefined, defaultSelectedValues: undefined, "aria-label": props["aria-label"] ?? strings.colorSwatches, "selected-value": selectedValue, "default-selected-value": defaultSelectedValue, "selected-values": selectedValues === undefined ? undefined : JSON.stringify(selectedValues), "default-selected-values": defaultSelectedValues === undefined ? undefined : JSON.stringify(defaultSelectedValues), "selection-mode": selectionMode, layout, size, shape, spacing, "focus-mode": focusMode, columns }), children);
});

export const ColorSwatch = React.forwardRef<HTMLElement, ElementProps & { color: string; value: string; disabled?: boolean; borderColor?: string; size?: SwatchPickerProps["size"]; shape?: SwatchPickerProps["shape"]; icon?: React.ReactNode; disabledIcon?: React.ReactNode; children?: React.ReactNode }>(function ColorSwatch({ color, value, disabled, borderColor, size, shape, icon, disabledIcon, children, ...props }: ElementProps & { color: string; value: string; disabled?: boolean; borderColor?: string; size?: SwatchPickerProps["size"]; shape?: SwatchPickerProps["shape"]; icon?: React.ReactNode; disabledIcon?: React.ReactNode; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeSwatchPicker);
  return React.createElement("spui-color-swatch", useCustomElementProps({ ref: forwardedRef, ...props, color, value, disabled: disabled || undefined, size, shape, "border-color": borderColor }), children, icon == null ? null : React.createElement("span", { slot: "icon" }, icon), disabledIcon == null ? null : React.createElement("span", { slot: "disabled-icon" }, disabledIcon));
});

export const ImageSwatch = React.forwardRef<HTMLElement, ElementProps & { src: string; value: string; disabled?: boolean; size?: SwatchPickerProps["size"]; shape?: SwatchPickerProps["shape"]; children?: React.ReactNode }>(function ImageSwatch({ src, value, disabled, size, shape, children, ...props }: ElementProps & { src: string; value: string; disabled?: boolean; size?: SwatchPickerProps["size"]; shape?: SwatchPickerProps["shape"]; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeSwatchPicker);
  return React.createElement("spui-image-swatch", useCustomElementProps({ ref: forwardedRef, ...props, src, value, disabled: disabled || undefined, size, shape }), children);
});

export const EmptySwatch = React.forwardRef<HTMLElement, ElementProps & { onAdd?: () => void; disabled?: boolean; size?: SwatchPickerProps["size"]; shape?: SwatchPickerProps["shape"] }>(function EmptySwatch({ onAdd, disabled, size, shape, ...props }: ElementProps & { onAdd?: () => void; disabled?: boolean; size?: SwatchPickerProps["size"]; shape?: SwatchPickerProps["shape"] }, forwardedRef): React.ReactElement {
  const strings = React.useContext(UIContext).strings;
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineNativeSwatchPicker);
  useSpuiEvent(ref, "spui-empty-swatch-activate", () => onAdd?.());
  return React.createElement("spui-empty-swatch", useCustomElementProps({ ...props, ref, "aria-label": props["aria-label"] ?? strings.colorAdd ?? "Add color", disabled: disabled || undefined, size, shape }));
});

export const SwatchPickerRow = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function SwatchPickerRow({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeSwatchPicker);
  return React.createElement("spui-swatch-picker-row", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export type TableSize = "small" | "medium" | "large";
export type TableAppearance = "subtle" | "dividers" | "plain";
export type TableSortDirection = "ascending" | "descending";
export type TableColumnId = string | number;
export type TableRowId = string | number;
export type TableContextValue = { size: "extra-small" | "small" | "medium" | "large"; noNativeElements: boolean; sortable: boolean };
const TableContext = React.createContext<TableContextValue | undefined>(undefined);
const tableContextDefaultValue: TableContextValue = Object.freeze({ size: "medium", noNativeElements: false, sortable: false });
export const TableContextProvider = TableContext.Provider;
export function useTableContext(): TableContextValue { return React.useContext(TableContext) ?? tableContextDefaultValue; }

const TableRowIdContext = React.createContext<TableRowId | undefined>(undefined);
export const TableRowIdContextProvider = TableRowIdContext.Provider;
export function useTableRowIdContext(): TableRowId { return React.useContext(TableRowIdContext) ?? ""; }

export function useColumnIdContext(): TableColumnId { return React.useContext(DataGridColumnIdContext) ?? ""; }

const TableHeaderContext = React.createContext<string | undefined>(undefined);
export const TableHeaderContextProvider = TableHeaderContext.Provider;
export function useIsInTableHeader(): boolean { return React.useContext(TableHeaderContext) === ""; }

export type TableColumnDefinition<TItem> = { columnId: TableColumnId; compare: (a: TItem, b: TItem) => number; renderHeaderCell: (data?: unknown) => React.ReactNode; renderCell: (item: TItem) => React.ReactNode };
export type CreateTableColumnOptions<TItem> = { columnId: TableColumnId; compare?: (a: TItem, b: TItem) => number; renderHeaderCell?: (data?: unknown) => React.ReactNode; renderCell?: (item: TItem) => React.ReactNode };

export function createTableColumn<TItem>(options: CreateTableColumnOptions<TItem>): TableColumnDefinition<TItem> {
  return createNativeTableColumn(options) as TableColumnDefinition<TItem>;
}

export type TableRowData<TItem> = { item: TItem; rowId: TableRowId };
export type TableSelectionState = {
  selectionMode: "single" | "multiselect";
  selectedRows: Set<TableRowId>;
  allRowsSelected: boolean;
  someRowsSelected: boolean;
  isRowSelected: (rowId: TableRowId) => boolean;
  toggleRow: (event: React.SyntheticEvent, rowId: TableRowId) => void;
  selectRow: (event: React.SyntheticEvent, rowId: TableRowId) => void;
  deselectRow: (event: React.SyntheticEvent, rowId: TableRowId) => void;
  toggleAllRows: (event: React.SyntheticEvent) => void;
  clearRows: (event: React.SyntheticEvent) => void;
};
export type TableSortState<TItem> = {
  sortColumn: TableColumnId | undefined;
  sortDirection: TableSortDirection;
  getSortDirection: (columnId: TableColumnId) => TableSortDirection | undefined;
  setColumnSort: (event: React.SyntheticEvent, columnId: TableColumnId, direction: TableSortDirection) => void;
  toggleColumnSort: (event: React.SyntheticEvent, columnId: TableColumnId) => void;
  sort: <TRow extends TableRowData<TItem>>(rows: TRow[]) => TRow[];
};
export type ColumnWidthState = { columnId: TableColumnId; width: number; minWidth: number; idealWidth: number; padding: number };
export type TableColumnSizingOptions = Record<TableColumnId, Partial<Pick<ColumnWidthState, "minWidth" | "idealWidth" | "padding">> & { defaultWidth?: number; autoFitColumns?: boolean }>;
export type TableColumnSizingState = {
  getOnMouseDown: (columnId: TableColumnId) => (event: React.MouseEvent | React.TouchEvent) => void;
  setColumnWidth: (columnId: TableColumnId, width: number) => void;
  getColumnWidths: () => ColumnWidthState[];
  getTableProps: (props?: React.HTMLAttributes<HTMLDivElement>) => React.HTMLAttributes<HTMLDivElement>;
  getTableHeaderCellProps: (columnId: TableColumnId) => { style?: React.CSSProperties; aside?: React.ReactNode };
  getTableCellProps: (columnId: TableColumnId) => { style?: React.CSSProperties };
  enableKeyboardMode: (columnId: TableColumnId, onChange?: (columnId: TableColumnId, isKeyboardMode: boolean) => void) => (event: React.MouseEvent | React.TouchEvent) => void;
};
export type TableFeaturesState<TItem> = {
  items: TItem[];
  columns: TableColumnDefinition<TItem>[];
  getRowId?: (item: TItem) => TableRowId;
  getRows: <TRow extends TableRowData<TItem> = TableRowData<TItem>>(rowEnhancer?: (row: TableRowData<TItem>) => TRow) => TRow[];
  selection: TableSelectionState;
  sort: TableSortState<TItem>;
  tableRef: React.RefObject<HTMLDivElement | null>;
  columnSizing_unstable: TableColumnSizingState;
};
export type TableFeaturePlugin = <TItem>(state: TableFeaturesState<TItem>) => TableFeaturesState<TItem>;
export type UseTableFeaturesOptions<TItem> = { items: TItem[]; columns: TableColumnDefinition<TItem>[]; getRowId?: (item: TItem) => TableRowId };
export type UseTableSelectionOptions = {
  selectionMode: "single" | "multiselect";
  defaultSelectedItems?: Iterable<TableRowId>;
  selectedItems?: Iterable<TableRowId>;
  onSelectionChange?: (event: React.SyntheticEvent, data: { selectedItems: Set<TableRowId> }) => void;
};
export type UseTableSortOptions = {
  sortState?: { sortColumn: TableColumnId | undefined; sortDirection: TableSortDirection };
  defaultSortState?: { sortColumn: TableColumnId | undefined; sortDirection: TableSortDirection };
  onSortChange?: (event: React.SyntheticEvent, state: { sortColumn: TableColumnId | undefined; sortDirection: TableSortDirection }) => void;
};

const defaultTableSelection: TableSelectionState = {
  selectionMode: "multiselect", selectedRows: new Set(), allRowsSelected: false, someRowsSelected: false,
  isRowSelected: () => false, toggleRow: () => undefined, selectRow: () => undefined, deselectRow: () => undefined,
  toggleAllRows: () => undefined, clearRows: () => undefined,
};
const defaultTableSort = <TItem,>(): TableSortState<TItem> => ({
  sortColumn: undefined, sortDirection: "ascending", getSortDirection: () => undefined,
  setColumnSort: () => undefined, toggleColumnSort: () => undefined,
  sort: rows => rows.slice(),
});
const defaultTableColumnSizing: TableColumnSizingState = {
  getOnMouseDown: () => () => undefined,
  setColumnWidth: () => undefined,
  getColumnWidths: () => [],
  getTableProps: props => props ?? {},
  getTableHeaderCellProps: () => ({}),
  getTableCellProps: () => ({}),
  enableKeyboardMode: () => () => undefined,
};

/** Build reusable table row state, then enhance it with selection/sort feature plugins. Keep plugin order stable across renders. */
export function useTableFeatures<TItem>(options: UseTableFeaturesOptions<TItem>, plugins: readonly TableFeaturePlugin[] = []): TableFeaturesState<TItem> {
  const { items, columns, getRowId } = options;
  const getRows = React.useCallback(<TRow extends TableRowData<TItem> = TableRowData<TItem>>(rowEnhancer?: (row: TableRowData<TItem>) => TRow): TRow[] =>
    items.map((item, index) => (rowEnhancer ?? ((row: TableRowData<TItem>) => row as TRow))({ item, rowId: getRowId?.(item) ?? index })), [items, getRowId]);
  const baseState = React.useMemo<TableFeaturesState<TItem>>(() => ({ items, columns, getRowId, getRows, selection: defaultTableSelection, sort: defaultTableSort<TItem>(), columnSizing_unstable: defaultTableColumnSizing, tableRef: React.createRef<HTMLDivElement>() }), [items, columns, getRowId, getRows]);
  return plugins.reduce((state, plugin) => plugin(state), baseState);
}

/** Create a Fluent-compatible selection plugin for useTableFeatures. */
export function useTableSelection(options: UseTableSelectionOptions): TableFeaturePlugin {
  return <TItem,>(tableState: TableFeaturesState<TItem>) => {
    const selectableIds = React.useMemo(() => new Set(tableState.items.map((item, index) => tableState.getRowId?.(item) ?? index)), [tableState.items, tableState.getRowId]);
    const [internalSelected, setInternalSelected] = React.useState(() => new Set(options.defaultSelectedItems ?? []));
    const controlled = options.selectedItems !== undefined;
    const selected = React.useMemo(() => new Set(controlled ? options.selectedItems : internalSelected), [controlled, options.selectedItems, internalSelected]);
    const commit = React.useCallback((event: React.SyntheticEvent, next: Set<TableRowId>) => {
      if (!controlled) setInternalSelected(next);
      options.onSelectionChange?.(event, { selectedItems: next });
    }, [controlled, options.onSelectionChange]);
    const updateRow = React.useCallback((event: React.SyntheticEvent, rowId: TableRowId, mode: "toggle" | "select" | "deselect") => {
      const next = new Set(selected);
      if (options.selectionMode === "single") {
        if (mode === "deselect") next.clear();
        else { next.clear(); next.add(rowId); }
      } else if (mode === "toggle") next.has(rowId) ? next.delete(rowId) : next.add(rowId);
      else if (mode === "select") next.add(rowId); else next.delete(rowId);
      commit(event, next);
    }, [selected, options.selectionMode, commit]);
    const firstSelected = selected.values().next();
    const allRowsSelected = options.selectionMode === "single"
      ? !firstSelected.done && selectableIds.has(firstSelected.value)
      : selectableIds.size > 0 && [...selectableIds].every(id => selected.has(id));
    const someRowsSelected = [...selectableIds].some(id => selected.has(id));
    const selection: TableSelectionState = {
      selectionMode: options.selectionMode, selectedRows: selected, allRowsSelected, someRowsSelected,
      isRowSelected: id => selected.has(id),
      toggleRow: (event, id) => updateRow(event, id, "toggle"),
      selectRow: (event, id) => updateRow(event, id, "select"),
      deselectRow: (event, id) => updateRow(event, id, "deselect"),
      toggleAllRows: event => {
        if (options.selectionMode === "single") throw new Error("toggleAllRows is unavailable in single-selection mode.");
        if (allRowsSelected) commit(event, new Set());
        else {
          const next = new Set(selected);
          for (const id of selectableIds) next.add(id);
          commit(event, next);
        }
      },
      clearRows: event => commit(event, new Set()),
    };
    return { ...tableState, selection };
  };
}

/** Create a Fluent-compatible sort plugin; sorting returns a shallow-sorted copy of rows. */
export function useTableSort(options: UseTableSortOptions = {}): TableFeaturePlugin {
  return <TItem,>(tableState: TableFeaturesState<TItem>) => {
    const [internalSort, setInternalSort] = React.useState(options.defaultSortState ?? { sortColumn: undefined, sortDirection: "ascending" as const });
    const controlled = options.sortState !== undefined;
    const sortState = options.sortState ?? internalSort;
    const commit = React.useCallback((event: React.SyntheticEvent, next: { sortColumn: TableColumnId | undefined; sortDirection: TableSortDirection }) => {
      if (!controlled) setInternalSort(next);
      options.onSortChange?.(event, next);
    }, [controlled, options.onSortChange]);
    const setColumnSort = React.useCallback((event: React.SyntheticEvent, columnId: TableColumnId, direction: TableSortDirection) => commit(event, { sortColumn: columnId, sortDirection: direction }), [commit]);
    const toggleColumnSort = React.useCallback((event: React.SyntheticEvent, columnId: TableColumnId) => commit(event, { sortColumn: columnId, sortDirection: sortState.sortColumn === columnId && sortState.sortDirection === "ascending" ? "descending" : "ascending" }), [commit, sortState]);
    const sort = React.useCallback(<TRow extends TableRowData<TItem>>(rows: TRow[]): TRow[] => {
      const column = tableState.columns.find(item => item.columnId === sortState.sortColumn);
      if (!column) return rows.slice();
      const direction = sortState.sortDirection === "ascending" ? 1 : -1;
      return rows.slice().sort((a, b) => column.compare(a.item, b.item) * direction);
    }, [tableState.columns, sortState]);
    const state: TableSortState<TItem> = { ...sortState, setColumnSort, toggleColumnSort, getSortDirection: columnId => sortState.sortColumn === columnId ? sortState.sortDirection : undefined, sort };
    return { ...tableState, sort: state };
  };
}

export type UseTableColumnSizingParams = { columnSizingOptions?: TableColumnSizingOptions; onColumnResize?: (event: KeyboardEvent | TouchEvent | MouseEvent | undefined, data: { columnId: TableColumnId; width: number }) => void; containerWidthOffset?: number; autoFitColumns?: boolean };

/** Fluent-compatible composable sizing state for Table and custom table renderers. */
export function useTableColumnSizing_unstable(params: UseTableColumnSizingParams = {}): TableFeaturePlugin {
  return <TItem,>(tableState: TableFeaturesState<TItem>) => {
    const strings = React.useContext(UIContext).strings;
    const { columns } = tableState;
    const [widths, setWidths] = React.useState<ColumnWidthState[]>(() => columns.map(column => {
      const options = params.columnSizingOptions?.[column.columnId] ?? {};
      const minWidth = options.minWidth ?? 100;
      const width = Math.max(options.defaultWidth ?? options.idealWidth ?? 150, minWidth);
      return { columnId: column.columnId, width, idealWidth: Math.max(options.idealWidth ?? width, minWidth), minWidth, padding: options.padding ?? 16 };
    }));
    const [containerWidth, setContainerWidth] = React.useState(0);
    const [keyboardColumns, setKeyboardColumns] = React.useState<Set<TableColumnId>>(() => new Set());
    const measureRef = React.useRef<HTMLDivElement | null>(null);
    const appliedSizingOptions = React.useRef(new Map<TableColumnId, { minWidth?: number; idealWidth?: number; padding?: number }>());

    React.useEffect(() => {
      const previousSizingOptions = appliedSizingOptions.current;
      appliedSizingOptions.current = new Map(columns.map(column => {
        const options = params.columnSizingOptions?.[column.columnId] ?? {};
        return [column.columnId, { minWidth: options.minWidth, idealWidth: options.idealWidth, padding: options.padding }];
      }));
      setWidths(previous => {
        const byId = new Map(previous.map(column => [column.columnId, column]));
        const next = columns.map(column => {
          const options = params.columnSizingOptions?.[column.columnId] ?? {};
          const minWidth = options.minWidth ?? 100;
          const existing = byId.get(column.columnId);
          if (!existing) {
            const width = Math.max(options.defaultWidth ?? options.idealWidth ?? 150, minWidth);
            return { columnId: column.columnId, width, idealWidth: Math.max(options.idealWidth ?? width, minWidth), minWidth, padding: options.padding ?? 16 };
          }
          const idealWidth = Math.max(options.idealWidth ?? existing.idealWidth, minWidth);
          const padding = options.padding ?? existing.padding;
          const appliedOptions = previousSizingOptions.get(column.columnId);
          const configurationChanged = !appliedOptions || appliedOptions.minWidth !== options.minWidth || appliedOptions.idealWidth !== options.idealWidth || appliedOptions.padding !== options.padding;
          return { ...existing, minWidth, idealWidth, padding, width: configurationChanged ? idealWidth : Math.max(existing.width, minWidth) };
        });
        return next.length === previous.length && next.every((column, index) => {
          const old = previous[index];
          return old?.columnId === column.columnId && old.width === column.width && old.idealWidth === column.idealWidth && old.minWidth === column.minWidth && old.padding === column.padding;
        }) ? previous : next;
      });
    }, [columns, params.columnSizingOptions]);

    React.useLayoutEffect(() => {
      const element = measureRef.current;
      if (!element) return;
      const measure = (): void => setContainerWidth(element.clientWidth);
      measure();
      if (typeof ResizeObserver === "undefined") {
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
      }
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }, [columns]);

    const fitWidths = React.useMemo(() => {
      const next = widths.map(column => ({ ...column }));
      if (params.autoFitColumns === false) return next;
      let remaining = Math.max(0, containerWidth + (params.containerWidthOffset ?? 0) - next.reduce((sum, column) => sum + column.width + column.padding, 0));
      for (const column of next) {
        const extra = Math.min(Math.max(0, column.idealWidth - column.width), remaining);
        column.width += extra;
        remaining -= extra;
      }
      if (remaining > 0 && next.length) next[next.length - 1]!.width += remaining;
      else if (containerWidth > 0) {
        let overflow = next.reduce((sum, column) => sum + column.width + column.padding, 0) - (containerWidth + (params.containerWidthOffset ?? 0));
        for (let index = next.length - 1; index >= 0 && overflow > 0; index--) {
          const column = next[index]!;
          const shrink = Math.min(column.width - column.minWidth, overflow);
          column.width -= shrink;
          overflow -= shrink;
        }
      }
      return next;
    }, [widths, containerWidth, params.containerWidthOffset, params.autoFitColumns]);

    const commitWidth = React.useCallback((columnId: TableColumnId, width: number, event?: Event) => {
      const column = widths.find(item => item.columnId === columnId);
      if (!column) return;
      const nextWidth = Math.max(column.minWidth, width);
      if (nextWidth === column.width) return;
      setWidths(current => current.map(item => item.columnId === columnId ? { ...item, width: nextWidth, idealWidth: nextWidth } : item));
      const isResizeEvent = event && (typeof KeyboardEvent !== "undefined" && event instanceof KeyboardEvent || typeof TouchEvent !== "undefined" && event instanceof TouchEvent || typeof MouseEvent !== "undefined" && event instanceof MouseEvent);
      params.onColumnResize?.(isResizeEvent ? event as KeyboardEvent | TouchEvent | MouseEvent : undefined, { columnId, width: nextWidth });
    }, [widths, params.onColumnResize]);
    const getOnMouseDown = React.useCallback((columnId: TableColumnId) => (event: React.MouseEvent | React.TouchEvent): void => {
      const startX = "touches" in event ? event.touches[0]?.clientX : event.clientX;
      const initial = fitWidths.find(column => column.columnId === columnId)?.width;
      if (startX === undefined || initial === undefined) return;
      event.preventDefault();
      const touch = "touches" in event;
      const move = (nativeEvent: MouseEvent | TouchEvent): void => {
        const x = "touches" in nativeEvent ? nativeEvent.touches[0]?.clientX ?? nativeEvent.changedTouches[0]?.clientX : nativeEvent.clientX;
        const direction = getComputedStyle(measureRef.current ?? document.documentElement).direction === "rtl" ? -1 : 1;
        if (x !== undefined) commitWidth(columnId, initial + (x - startX) * direction, nativeEvent);
      };
      const finish = (): void => { document.removeEventListener(touch ? "touchmove" : "mousemove", move); document.removeEventListener(touch ? "touchend" : "mouseup", finish); document.removeEventListener("touchcancel", finish); };
      document.addEventListener(touch ? "touchmove" : "mousemove", move, { passive: false });
      document.addEventListener(touch ? "touchend" : "mouseup", finish, { once: true });
      if (touch) document.addEventListener("touchcancel", finish, { once: true });
    }, [fitWidths, commitWidth]);
    const setColumnWidth = React.useCallback((columnId: TableColumnId, width: number) => commitWidth(columnId, width), [commitWidth]);
    const getTableHeaderCellProps = React.useCallback((columnId: TableColumnId) => {
      const column = fitWidths.find(item => item.columnId === columnId);
      if (!column) return {};
      const isLast = columns[columns.length - 1]?.columnId === columnId;
      const resizeLabel = (strings.tableResizeColumn ?? defaultStrings.tableResizeColumn!).replace("{column}", String(columnId));
      const aside = isLast && params.autoFitColumns !== false ? null : <TableResizeHandle value={column.width} min={column.minWidth} step={8} label={resizeLabel} data-keyboard-mode={keyboardColumns.has(columnId) || undefined} onResize={(_delta, value, event) => commitWidth(columnId, value, event)} />;
      return { style: { width: column.width, minWidth: column.width, maxWidth: column.width }, aside };
    }, [fitWidths, columns, params.autoFitColumns, keyboardColumns, commitWidth, strings.tableResizeColumn]);
    const sizingState = React.useMemo<TableColumnSizingState>(() => ({
      getOnMouseDown,
      setColumnWidth,
      getColumnWidths: () => fitWidths,
      getTableProps: (props = {}) => ({ ...props, style: { minWidth: "fit-content", ...props.style } }),
      getTableHeaderCellProps,
      getTableCellProps: columnId => {
        const column = fitWidths.find(item => item.columnId === columnId);
        return column ? { style: { width: column.width, minWidth: column.width, maxWidth: column.width } } : {};
      },
      enableKeyboardMode: (columnId, onChange) => event => {
        event.preventDefault();
        event.stopPropagation();
        const next = new Set(keyboardColumns);
        const enabled = !next.has(columnId);
        if (enabled) next.add(columnId); else next.delete(columnId);
        setKeyboardColumns(next);
        onChange?.(columnId, enabled);
      },
    }), [getOnMouseDown, setColumnWidth, fitWidths, getTableHeaderCellProps, keyboardColumns]);
    return { ...tableState, tableRef: measureRef, columnSizing_unstable: sizingState };
  };
}

export type TableCompositeNavigationAttribute = { "data-tabster": string };
export type TableCompositeNavigation = {
  onTableKeyDown: React.KeyboardEventHandler<HTMLElement>;
  tableTabsterAttribute: TableCompositeNavigationAttribute;
  tableRowTabsterAttribute: TableCompositeNavigationAttribute;
};

const tableGridNavigationAttribute: TableCompositeNavigationAttribute = Object.freeze({
  "data-tabster": JSON.stringify({ mover: { cyclic: false, direction: 3, memorizeCurrent: true } }),
});
const tableRowNavigationAttribute: TableCompositeNavigationAttribute = Object.freeze({
  "data-tabster": JSON.stringify({
    mover: { cyclic: false, direction: 2, memorizeCurrent: true },
    groupper: { tabbability: 2 },
    focusable: {},
  }),
});

/** Fluent-compatible table/grid navigation attributes and focus handoff events without a Tabster runtime dependency. */
export function useTableCompositeNavigation(): TableCompositeNavigation {
  const onTableKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLElement>>(event => {
    const document = event.currentTarget.ownerDocument;
    let activeElement = document.activeElement;
    const eventTarget = event.target instanceof HTMLElement ? event.target : activeElement;
    // A Tabster mover may already have moved focus during the native key event.
    if (!activeElement || !eventTarget) return;
    if (activeElement !== eventTarget) return;
    if (!event.currentTarget.contains(activeElement)) return;

    const activeRole = activeElement.getAttribute("role");
    if (event.key === "ArrowRight" && activeRole === "row" && activeElement instanceof HTMLElement) {
      const firstFocusable = activeElement.querySelector<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus();
    }
    if (activeRole === "row") return;

    const isInCell = activeElement.closest('[role="cell"],[role="gridcell"]') !== null;
    const isRtl = document.defaultView?.getComputedStyle(event.currentTarget).direction === "rtl";
    const moveToCell = (direction: -1 | 1, vertical: boolean): void => {
      const cell = eventTarget.closest<HTMLElement>('[role="cell"],[role="gridcell"]');
      const row = cell?.closest<HTMLElement>('[role="row"]');
      if (!cell || !row) return;
      const root = event.currentTarget;
      const rows = [...root.querySelectorAll<HTMLElement>('[role="row"]')].filter(candidate => candidate.closest('[role="grid"],[role="table"]') === root);
      const rowIndex = rows.indexOf(row);
      const cells = [...row.querySelectorAll<HTMLElement>('[role="cell"],[role="gridcell"]')].filter(candidate => candidate.closest('[role="row"]') === row);
      const cellIndex = cells.indexOf(cell);
      const targetRow = vertical ? rows[rowIndex + direction] : row;
      const targetCells = targetRow ? [...targetRow.querySelectorAll<HTMLElement>('[role="cell"],[role="gridcell"]')].filter(candidate => candidate.closest('[role="row"]') === targetRow) : [];
      const targetCell = vertical ? targetCells[cellIndex] : targetCells[cellIndex + direction];
      if (!targetCell) return;
      const focusable = targetCell.querySelector<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
      else { targetCell.tabIndex = -1; targetCell.focus(); }
    };
    if (event.key === "ArrowLeft" && isInCell) {
      activeElement.dispatchEvent(new CustomEvent("tabster:groupper:movefocus", { detail: { action: 2 } }));
      if (document.activeElement === eventTarget) moveToCell(isRtl ? 1 : -1, false);
      return;
    }
    if (event.key === "ArrowRight" && isInCell) {
      moveToCell(isRtl ? -1 : 1, false);
      return;
    }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && isInCell) {
      activeElement.dispatchEvent(new CustomEvent("tabster:groupper:movefocus", { detail: { action: 2 } }));
      activeElement = document.activeElement;
      activeElement?.dispatchEvent(new CustomEvent("tabster:mover:movefocus", { detail: { key: event.key === "ArrowDown" ? 2 : 1 } }));
      if (document.activeElement === eventTarget) moveToCell(event.key === "ArrowDown" ? 1 : -1, true);
    }
  }, []);

  return React.useMemo(() => ({
    onTableKeyDown,
    tableTabsterAttribute: tableGridNavigationAttribute,
    tableRowTabsterAttribute: tableRowNavigationAttribute,
  }), [onTableKeyDown]);
}

export const Table = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; size?: TableSize; appearance?: TableAppearance; noNativeElements?: boolean; sortable?: boolean }>(function Table({ children, size = "medium", appearance = "dividers", noNativeElements = false, sortable = false, ...props }: ElementProps & { children?: React.ReactNode; size?: TableSize; appearance?: TableAppearance; noNativeElements?: boolean; sortable?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeTable);
  const tableContextValue = React.useMemo<TableContextValue>(() => ({ size, noNativeElements, sortable }), [size, noNativeElements, sortable]);
  return React.createElement(TableContext.Provider, { value: tableContextValue }, React.createElement("spui-table", useCustomElementProps({ ref: forwardedRef, ...props, size, appearance, "no-native-elements": noNativeElements || undefined }), children));
});

export const TableHeader = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function TableHeader({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeTable);
  return React.createElement(TableHeaderContext.Provider, { value: "" }, React.createElement("spui-table-header", useCustomElementProps({ ...props, ref: forwardedRef }), children));
});

export const TableBody = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function TableBody({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeTable);
  return React.createElement("spui-table-body", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const TableRow = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; selected?: boolean; appearance?: "brand" | "neutral" | "none" }>(function TableRow({ children, selected = false, appearance, ...props }: ElementProps & { children?: React.ReactNode; selected?: boolean; appearance?: "brand" | "neutral" | "none" }, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeTable);
  return React.createElement("spui-table-row", useCustomElementProps({ ref: forwardedRef, ...props, selected: selected || undefined, appearance }), children);
});

export type TableHeaderCellButtonSlot = React.ReactElement<any> | Omit<React.HTMLAttributes<HTMLElement>, "children">;

export const TableHeaderCell = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; aside?: React.ReactNode; sortIcon?: React.ReactNode; button?: TableHeaderCellButtonSlot; sortable?: boolean; sortDirection?: TableSortDirection; columnId?: string | number; onSort?: (direction: TableSortDirection, columnId?: string) => void }>(function TableHeaderCell({ children, aside, sortIcon, button, sortable = false, sortDirection, columnId, onSort, ...props }: ElementProps & { children?: React.ReactNode; aside?: React.ReactNode; sortIcon?: React.ReactNode; button?: TableHeaderCellButtonSlot; sortable?: boolean; sortDirection?: TableSortDirection; columnId?: string | number; onSort?: (direction: TableSortDirection, columnId?: string) => void }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineNativeTable);
  useSpuiEvent(ref, "spui-table-sort", detail => { const data = detail as SpuiEventDetail & { direction?: string; columnId?: string | number }; onSort?.(data.direction as TableSortDirection, data.columnId == null ? undefined : String(data.columnId)); });
  const sortIconNode = sortIcon == null ? null : React.createElement("span", { slot: "sort-icon" }, sortIcon);
  const buttonSortIconNode = sortIcon == null
    ? React.createElement("span", { "aria-hidden": true, style: { width: 6, height: 6, flex: "none", border: "solid currentColor", borderWidth: "0 1.5px 1.5px 0", transform: sortDirection === "ascending" ? "rotate(225deg) translate(-1px,-1px)" : "rotate(45deg) translate(-1px,-1px)" } })
    : React.createElement("span", { "aria-hidden": true, style: { display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" } }, sortIcon);
  const buttonNode = button == null ? null : (() => {
    if (React.isValidElement(button)) {
      const element = button as React.ReactElement<any>;
      return React.cloneElement(element, { slot: "button", ...(sortable && element.props.role == null ? { role: "button" } : {}), ...(sortable && element.props.tabIndex == null ? { tabIndex: 0 } : {}), children: React.createElement(React.Fragment, null, children, buttonSortIconNode) });
    }
    const buttonProps = button as Omit<React.HTMLAttributes<HTMLElement>, "children">;
    return React.createElement(sortable ? "button" : "div", { ...buttonProps, slot: "button", ...(sortable ? { type: "button", role: buttonProps.role ?? "button", tabIndex: buttonProps.tabIndex ?? 0 } : {}) }, children, buttonSortIconNode);
  })();
  return React.createElement("spui-table-header-cell", useCustomElementProps({ ...props, ref, sortable: sortable || undefined, "sort-direction": sortDirection, "column-id": columnId }), buttonNode, buttonNode ? null : children, buttonNode ? null : sortIconNode, aside);
});

export const TableCell = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function TableCell({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeTable);
  return React.createElement("spui-table-cell", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export type TableCellLayoutSlot = React.ReactNode | React.HTMLAttributes<HTMLSpanElement>;
export type TableCellLayoutProps = ElementProps & { children?: React.ReactNode; main?: TableCellLayoutSlot; media?: TableCellLayoutSlot; description?: TableCellLayoutSlot; appearance?: "primary"; truncate?: boolean };
export type SpanSlotProps = React.ReactNode | React.HTMLAttributes<HTMLSpanElement>;

function renderSpanSlot(value: SpanSlotProps | undefined, slot?: string): React.ReactNode {
  if (value == null || typeof value === "boolean") return null;
  const slotProps: { slot?: string } = slot === undefined ? {} : { slot };
  if (React.isValidElement(value)) return React.cloneElement(value as React.ReactElement<{ slot?: string }>, slotProps);
  if (Array.isArray(value)) return React.createElement("span", slotProps, value);
  if (typeof value === "object" && !("$$typeof" in value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
    const { children, ...attributes } = value as React.HTMLAttributes<HTMLSpanElement>;
    return React.createElement("span", { ...attributes, ...slotProps }, children);
  }
  return React.createElement("span", slotProps, value as React.ReactNode);
}

export const TableCellLayout = React.forwardRef<HTMLElement, TableCellLayoutProps>(function TableCellLayout({ children, main, media, description, appearance, truncate = false, ...props }: TableCellLayoutProps, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeTable);
  return React.createElement("spui-table-cell-layout", useCustomElementProps({ ref: forwardedRef, ...props, appearance, truncate: truncate || undefined }), renderSpanSlot(media, "media"), renderSpanSlot(main ?? children, "main"), renderSpanSlot(description, "description"));
});

export const TableCellActions = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; visible?: boolean }>(function TableCellActions({ children, visible = false, ...props }: ElementProps & { children?: React.ReactNode; visible?: boolean }, forwardedRef): React.ReactElement {
  ensureDefined(defineNativeTable);
  return React.createElement("spui-table-cell-actions", useCustomElementProps({ ref: forwardedRef, ...props, visible: visible || undefined }), children);
});

export const TableSelectionCell = React.forwardRef<HTMLElement, ElementProps & { type?: "checkbox" | "radio"; checked?: boolean | "mixed"; subtle?: boolean; invisible?: boolean; hidden?: boolean; checkboxIndicator?: SelectionIndicatorSlot; radioIndicator?: SelectionIndicatorSlot; onSelectionChange?: (checked: boolean, type: "checkbox" | "radio") => void }>(function TableSelectionCell({ type = "checkbox", checked = false, subtle = false, invisible = false, hidden = false, checkboxIndicator, radioIndicator, onSelectionChange, ...props }: ElementProps & { type?: "checkbox" | "radio"; checked?: boolean | "mixed"; subtle?: boolean; invisible?: boolean; hidden?: boolean; checkboxIndicator?: SelectionIndicatorSlot; radioIndicator?: SelectionIndicatorSlot; onSelectionChange?: (checked: boolean, type: "checkbox" | "radio") => void }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineNativeTable);
  useSpuiEvent(ref, "spui-table-selection-change", detail => { const data = detail as SpuiEventDetail & { checked?: boolean; type?: string }; onSelectionChange?.(Boolean(data.checked), data.type === "radio" ? "radio" : "checkbox"); });
  return React.createElement("spui-table-selection-cell", useCustomElementProps({ ...props, ref, type, checked: checked || undefined, subtle: subtle || undefined, invisible: invisible || undefined, hidden: hidden || undefined }), renderSelectionIndicator(checkboxIndicator, "checkbox-indicator", checked), renderSelectionIndicator(radioIndicator, "radio-indicator", checked));
});

export const TableResizeHandle = React.forwardRef<HTMLElement, ElementProps & { value?: number; min?: number; max?: number; step?: number; label?: string; onResize?: (delta: number, value: number, event?: Event) => void }>(function TableResizeHandle({ value, min, max, step = 8, label, onResize, ...props }: ElementProps & { value?: number; min?: number; max?: number; step?: number; label?: string; onResize?: (delta: number, value: number, event?: Event) => void }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineNativeTable);
  const strings = React.useContext(UIContext).strings;
  const resolvedLabel = label ?? strings.tableResizeHandle ?? "Resize column";
  useSpuiEvent(ref, "spui-table-resize", (detail, event) => { const data = detail as SpuiEventDetail & { delta?: number; value?: number; sourceEvent?: Event }; onResize?.(Number(data.delta) || 0, Number(data.value) || 0, data.sourceEvent ?? event); });
  return React.createElement("spui-table-resize-handle", useCustomElementProps({ ...props, ref, value, min, max, step, label: resolvedLabel, slot: "aside" }));
});

export type TextAreaAppearance = "outline" | "filled-darker" | "filled-lighter" | "filled-darker-shadow" | "filled-lighter-shadow";
export type TextAreaSize = "small" | "medium" | "large";
export type TextAreaResize = "none" | "horizontal" | "vertical" | "both";
export type TextAreaChangeData = { value: string };
export type TextAreaProps = Omit<ElementProps, "onChange" | "defaultValue"> & { label?: string; value?: string | number | readonly string[]; defaultValue?: string | number | readonly string[]; textarea?: React.ReactElement<React.TextareaHTMLAttributes<HTMLTextAreaElement>> | React.TextareaHTMLAttributes<HTMLTextAreaElement>; rows?: number; cols?: number; autoComplete?: string; dirName?: string; form?: string; maxLength?: number; minLength?: number; name?: string; wrap?: "hard" | "soft" | "off"; placeholder?: string; disabled?: boolean; required?: boolean; readOnly?: boolean; appearance?: TextAreaAppearance; size?: TextAreaSize; resize?: TextAreaResize; onValueChange?: (value: string) => void; onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>, data: TextAreaChangeData) => void };

export const TextArea = React.forwardRef<HTMLElement, TextAreaProps>(function TextArea(inputProps: TextAreaProps, forwardedRef): React.ReactElement {
  const { label, value, defaultValue, textarea, rows, placeholder, disabled, required, readOnly, appearance = "outline", size = "medium", resize = "none", onValueChange, onChange, ...props } = useFieldControlProps_unstable(inputProps, { supportsRequired: true, supportsSize: true });
  const ref = React.useRef<HTMLElement & { value: string; defaultValue: string }>(null);
  React.useImperativeHandle(forwardedRef, () => ref.current!, []);
  ensureDefined(defineTextArea);
  useSpuiEvent(ref, "spui-input", onValueChange || onChange ? (detail, event) => {
    const nextValue = String(detail.value ?? "");
    onValueChange?.(nextValue);
    const sourceEvent = detail.sourceEvent instanceof Event ? detail.sourceEvent : event;
    const currentTarget = sourceEventTarget(sourceEvent, ref.current!) as HTMLTextAreaElement;
    onChange?.(createReactEventBridge(sourceEvent, event, currentTarget) as React.ChangeEvent<HTMLTextAreaElement>, { value: nextValue });
    if (value !== undefined && ref.current) ref.current.value = String(value);
  } : undefined);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (defaultValue !== undefined) element.defaultValue = String(defaultValue);
    if (value !== undefined) element.value = String(value);
  }, [defaultValue, value]);
  const textareaSlot = textarea == null ? null : React.isValidElement(textarea)
    ? React.cloneElement(textarea as React.ReactElement<React.TextareaHTMLAttributes<HTMLTextAreaElement>>, { slot: "textarea" } as React.TextareaHTMLAttributes<HTMLTextAreaElement> & { slot: string })
    : React.createElement("textarea", { ...textarea, slot: "textarea" });
  return React.createElement("spui-textarea", useCustomElementProps({ ...props, ref, label, value: undefined, defaultValue: undefined, rows, placeholder, disabled, required, appearance, size, resize, "default-value": defaultValue, "read-only": readOnly || undefined }), textareaSlot);
});

export type CheckboxCheckedState = boolean | "mixed";
export type CheckboxProps = Omit<ElementProps, "onChange" | "children"> & { children?: never; checked?: CheckboxCheckedState; defaultChecked?: CheckboxCheckedState; disabled?: boolean; disabledFocusable?: boolean; required?: boolean; name?: string; form?: string; value?: string; label?: React.ReactNode; input?: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> | React.InputHTMLAttributes<HTMLInputElement>; indicator?: React.ReactNode; labelPosition?: "before" | "after"; shape?: "square" | "circular"; size?: "small" | "medium" | "large"; onCheckedChange?: (checked: boolean) => void; onChange?: (event: React.ChangeEvent<HTMLInputElement>, data: { checked: CheckboxCheckedState }) => void };
type ToggleHostProps = ElementProps & { disabled?: boolean; shape?: string; size?: string; "label-position"?: string; "disabled-focusable"?: boolean };
function useToggle(define: () => void, props: ToggleHostProps, checked?: CheckboxCheckedState, defaultChecked?: CheckboxCheckedState, onCheckedChange?: (checked: boolean) => void, onStateChange?: (event: React.ChangeEvent<HTMLInputElement>, data: { checked: CheckboxCheckedState }) => void, forwardedRef?: React.ForwardedRef<HTMLElement>): Record<string, unknown> {
  const ref = React.useRef<HTMLElement>(null);
  React.useImperativeHandle(forwardedRef, () => ref.current!, []);
  ensureDefined(define);
  useSpuiEvent(ref, "spui-change", onCheckedChange || onStateChange ? (detail, event) => {
    const nextChecked = detail.checked === "mixed" ? "mixed" : Boolean(detail.checked);
    const sourceEvent = detail.sourceEvent instanceof Event ? detail.sourceEvent : event;
    const currentTarget = sourceEventTarget(sourceEvent, ref.current!) as HTMLInputElement;
    onCheckedChange?.(Boolean(nextChecked));
    onStateChange?.(createReactEventBridge(sourceEvent, event, currentTarget) as React.ChangeEvent<HTMLInputElement>, { checked: nextChecked });
  } : undefined);
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { checked?: CheckboxCheckedState; defaultChecked?: CheckboxCheckedState }) | null;
    if (!element) return;
    if (checked !== undefined) element.checked = checked;
    else if (defaultChecked !== undefined) element.defaultChecked = defaultChecked;
  }, [checked, defaultChecked]);
  const elementProps: Record<string, unknown> = { ...useFieldControlProps_unstable(props, { supportsRequired: true, supportsSize: true }), ref };
  return useHostProps(elementProps);
}

export const Checkbox = React.forwardRef<HTMLElement, CheckboxProps>(function Checkbox({ checked, defaultChecked, disabledFocusable, onCheckedChange, onChange, label, input, indicator, labelPosition = "after", shape = "square", size, ...props }: CheckboxProps, forwardedRef): React.ReactElement {
  const elementProps = useToggle(defineCheckbox, { ...props, shape, size, "label-position": labelPosition, "disabled-focusable": disabledFocusable || undefined }, checked, defaultChecked, onCheckedChange, onChange, forwardedRef);
  const inputSlot = input == null ? null : React.isValidElement(input)
    ? React.cloneElement(input as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, { slot: "input" } as React.InputHTMLAttributes<HTMLInputElement> & { slot: string })
    : React.createElement("input", { ...input, slot: "input" });
  const indicatorSlot = indicator == null ? null : React.isValidElement(indicator)
    ? React.cloneElement(indicator as React.ReactElement<{ slot?: string; "aria-hidden"?: boolean }>, { slot: "indicator", "aria-hidden": true })
    : React.createElement("span", { slot: "indicator", "aria-hidden": true }, indicator);
  const labelSlot = label == null ? null : React.isValidElement(label)
    ? React.cloneElement(label as React.ReactElement<{ slot?: string }>, { slot: "label" })
    : React.createElement("span", { slot: "label" }, label);
  return React.createElement("spui-checkbox", customElementProps(elementProps), inputSlot, indicatorSlot, labelSlot);
});

export type SwitchProps = Omit<ElementProps, "onChange"> & { label?: React.ReactNode; input?: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> | React.InputHTMLAttributes<HTMLInputElement>; indicator?: React.ReactNode; checked?: boolean; defaultChecked?: boolean; disabled?: boolean; disabledFocusable?: boolean; required?: boolean; name?: string; form?: string; value?: string; size?: "small" | "medium"; labelPosition?: "before" | "after" | "above"; onCheckedChange?: (checked: boolean) => void; onChange?: (event: React.ChangeEvent<HTMLInputElement>, data: { checked: boolean }) => void };

export const Switch = React.forwardRef<HTMLElement, SwitchProps>(function Switch({ checked, defaultChecked, disabledFocusable, onCheckedChange, onChange, label, children, input, indicator, size, labelPosition = "after", ...props }: SwitchProps, forwardedRef): React.ReactElement {
  const elementProps = useToggle(defineSwitch, { ...props, size, "label-position": labelPosition, "disabled-focusable": disabledFocusable || undefined }, checked, defaultChecked,
    onCheckedChange ? value => onCheckedChange(Boolean(value)) : undefined,
    onChange ? (event, data) => onChange(event, { checked: Boolean(data.checked) }) : undefined, forwardedRef);
  const inputSlot = input == null ? null : React.isValidElement(input)
    ? React.cloneElement(input as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, { slot: "input" } as React.InputHTMLAttributes<HTMLInputElement> & { slot: string })
    : React.createElement("input", { ...input, slot: "input" });
  const indicatorSlot = indicator == null ? null : React.isValidElement(indicator)
    ? React.cloneElement(indicator as React.ReactElement<{ slot?: string; "aria-hidden"?: boolean }>, { slot: "indicator", "aria-hidden": true })
    : React.createElement("span", { slot: "indicator", "aria-hidden": true }, indicator);
  const switchLabel = label ?? children;
  const labelSlot = switchLabel == null ? null : React.isValidElement(switchLabel)
    ? React.cloneElement(switchLabel as React.ReactElement<{ slot?: string }>, { slot: "label" })
    : React.createElement("span", { slot: "label" }, switchLabel);
  return React.createElement("spui-switch", customElementProps(elementProps), inputSlot, indicatorSlot, labelSlot);
});

export type SpinnerContextValue = { size?: SpinnerSize };
const SpinnerContext = React.createContext<SpinnerContextValue | undefined>(undefined);
export const SpinnerContextProvider = SpinnerContext.Provider;
export function useSpinnerContext(): SpinnerContextValue { return React.useContext(SpinnerContext) ?? {}; }

export const Spinner = React.forwardRef<HTMLElement, ElementProps & { label?: React.ReactNode; spinner?: React.ReactNode; spinnerTail?: React.ReactNode; size?: SpinnerSize; appearance?: SpinnerAppearance; labelPosition?: SpinnerLabelPosition; delay?: number; children?: React.ReactNode }>(function Spinner({ label, spinner, spinnerTail, size, appearance = "primary", labelPosition = "after", delay = 0, children, ...props }: ElementProps & { label?: React.ReactNode; spinner?: React.ReactNode; spinnerTail?: React.ReactNode; size?: SpinnerSize; appearance?: SpinnerAppearance; labelPosition?: SpinnerLabelPosition; delay?: number; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const spinnerContext = useSpinnerContext();
  ensureDefined(defineSpinner);
  const resolvedSize = size ?? spinnerContext.size ?? "medium";
  const visibleLabel = label === undefined ? children === undefined ? context.strings.loading : getVisibleText(children) || context.strings.loading : typeof label === "string" ? label : getVisibleText(label) || context.strings.loading;
  const labelContent = label !== undefined && typeof label !== "string" ? label : children;
  const spinnerSlot = spinner == null ? null : React.isValidElement(spinner) ? React.cloneElement(spinner as React.ReactElement<{ slot?: string; "aria-hidden"?: boolean }>, { slot: "spinner", "aria-hidden": spinner.props["aria-hidden"] ?? true }) : React.createElement("span", { slot: "spinner", "aria-hidden": true }, spinner);
  const tailSlot = spinnerTail == null ? null : React.isValidElement(spinnerTail) ? React.cloneElement(spinnerTail as React.ReactElement<{ slot?: string; "aria-hidden"?: boolean }>, { slot: "spinner-tail", "aria-hidden": spinnerTail.props["aria-hidden"] ?? true }) : React.createElement("span", { slot: "spinner-tail", "aria-hidden": true }, spinnerTail);
  return React.createElement("spui-spinner", useCustomElementProps({ ...props, ref: forwardedRef, label: visibleLabel, size: resolvedSize, appearance, "label-position": labelPosition, delay: delay > 0 ? delay : undefined }), spinnerSlot, tailSlot, labelContent === undefined || labelContent === null ? null : React.createElement("span", { slot: "label" }, labelContent));
});

export const MessageBar = React.forwardRef<HTMLElement, ElementProps & { intent?: MessageBarIntent; politeness?: MessageBarPoliteness; shape?: MessageBarShape; layout?: MessageBarLayout; icon?: React.ReactNode; bottomReflowSpacer?: React.ReactNode; children?: React.ReactNode }>(function MessageBar({ intent = "info", politeness, shape = "rounded", layout = "auto", icon, bottomReflowSpacer, children, ...props }: ElementProps & { intent?: MessageBarIntent; politeness?: MessageBarPoliteness; shape?: MessageBarShape; layout?: MessageBarLayout; icon?: React.ReactNode; bottomReflowSpacer?: React.ReactNode; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineMessageBar);
  const iconSlot = icon == null ? null : React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<{ slot?: string; "aria-hidden"?: boolean }>, { slot: "icon", "aria-hidden": icon.props["aria-hidden"] ?? true })
    : React.createElement("span", { slot: "icon", "aria-hidden": true }, icon);
  const spacerSlot = bottomReflowSpacer == null ? null : React.isValidElement(bottomReflowSpacer)
    ? React.cloneElement(bottomReflowSpacer as React.ReactElement<{ slot?: string }>, { slot: "bottom-reflow-spacer" })
    : React.createElement("div", { slot: "bottom-reflow-spacer", "aria-hidden": true }, bottomReflowSpacer);
  return React.createElement("spui-message-bar", useCustomElementProps({ ...props, ref: forwardedRef, intent, politeness, shape, layout }), iconSlot, children, spacerSlot);
});

export const MessageBarActions = React.forwardRef<HTMLElement, ElementProps & { containerAction?: React.ReactNode; children?: React.ReactNode }>(function MessageBarActions({ containerAction, children, ...props }: ElementProps & { containerAction?: React.ReactNode; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineMessageBarActions);
  return React.createElement("spui-message-bar-actions", useCustomElementProps({ ...props, ref: forwardedRef }), children, containerAction == null ? null : React.createElement("span", { slot: "container-action" }, containerAction));
});

export const MessageBarBody = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function MessageBarBody({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineMessageBarBody);
  return React.createElement("spui-message-bar-body", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const MessageBarTitle = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function MessageBarTitle({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineMessageBarTitle);
  return React.createElement("spui-message-bar-title", useCustomElementProps({ ...props, ref: forwardedRef }), children);
});

export const MessageBarGroup = React.forwardRef<HTMLElement, ElementProps & { animate?: MessageBarGroupAnimation; children?: React.ReactNode }>(function MessageBarGroup({ animate = "exit-only", children, ...props }: ElementProps & { animate?: MessageBarGroupAnimation; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineMessageBarGroup);
  return React.createElement("spui-message-bar-group", useCustomElementProps({ ...props, ref: forwardedRef, animate }), children);
});

export const Alert = React.forwardRef<HTMLElement, ElementProps & { intent?: "info" | "success" | "warning" | "error"; appearance?: "primary" | "inverted"; assertive?: boolean; dismissible?: boolean; dismissLabel?: string; onDismiss?: () => void; icon?: React.ReactNode; avatar?: React.ReactNode; action?: React.ReactNode; actions?: React.ReactNode }>(function Alert({ intent = "info", appearance = "primary", assertive, dismissible = false, dismissLabel, onDismiss, icon, avatar, action, actions, children, ...props }: ElementProps & { intent?: "info" | "success" | "warning" | "error"; appearance?: "primary" | "inverted"; assertive?: boolean; dismissible?: boolean; dismissLabel?: string; onDismiss?: () => void; icon?: React.ReactNode; avatar?: React.ReactNode; action?: React.ReactNode; actions?: React.ReactNode }, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineAlert);
  useSpuiEvent(ref, "spui-dismiss", onDismiss ? () => onDismiss() : undefined);
  const assigned = (node: React.ReactNode, slot: "icon" | "avatar" | "action"): React.ReactNode => node == null ? null : React.isValidElement(node)
    ? React.cloneElement(node as React.ReactElement<{ slot?: string }>, { slot })
    : slot === "action" ? React.createElement("button", { slot, type: "button" }, node) : React.createElement("span", { slot, "aria-hidden": slot === "icon" || undefined }, node);
  return React.createElement("spui-alert", useCustomElementProps({ ...props, ref, intent, appearance, assertive: assertive === undefined ? undefined : assertive ? "true" : "false", dismissible: dismissible || undefined, "dismiss-label": dismissLabel ?? context.strings.dismiss }), assigned(icon, "icon"), assigned(avatar, "avatar"), children, assigned(action, "action"),
    actions ? React.createElement("div", { slot: "actions" }, actions) : null);
});

export type ToastProps = Omit<ElementProps, "title"> & Omit<ToastDispatchOptions, "appearance"> & { appearance?: "brand" | "inverted"; children?: React.ReactNode; onDismiss?: (id: string, reason: string) => void };
type ToastCompositionContextValue = { intent: ToastIntent; dismiss: (reason?: string) => void };
const ToastCompositionContext = React.createContext<ToastCompositionContextValue | undefined>(undefined);

export const ToastTitle = React.forwardRef<HTMLElement, ElementProps & { media?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode }>(function ToastTitle({ media, action, children, ...props }: ElementProps & { media?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  const context = React.useContext(ToastCompositionContext);
  ensureDefined(defineToastTitle);
  return React.createElement("spui-toast-title", useCustomElementProps({ ref: forwardedRef, ...props, intent: context?.intent ?? "info" }),
    media == null ? null : React.createElement("span", { slot: "media" }, media),
    children,
    action == null ? null : React.createElement("span", { slot: "action" }, action));
});

export const ToastBody = React.forwardRef<HTMLElement, ElementProps & { subtitle?: React.ReactNode; children?: React.ReactNode }>(function ToastBody({ subtitle, children, ...props }: ElementProps & { subtitle?: React.ReactNode; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineToastBody);
  return React.createElement("spui-toast-body", useCustomElementProps({ ...props, ref: forwardedRef }), children,
    subtitle == null ? null : React.createElement("span", { slot: "subtitle" }, subtitle));
});

export const ToastFooter = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode }>(function ToastFooter({ children, ...props }: ElementProps & { children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineToastFooter);
  return React.createElement("spui-toast-footer", useCustomElementProps({ ref: forwardedRef, ...props, slot: "action" }), children);
});

export function ToastTrigger({ children, disableButtonEnhancement = false }: { children: React.ReactElement; disableButtonEnhancement?: boolean }): React.ReactElement {
  const context = React.useContext(ToastCompositionContext);
  const child = React.Children.only(children) as React.ReactElement<Record<string, unknown>>;
  if (!React.isValidElement(child)) throw new TypeError("ToastTrigger requires one React element child.");
  const childProps = child.props;
  const disabled = childProps.disabled === true || childProps["aria-disabled"] === true || childProps["aria-disabled"] === "true";
  const originalClick = childProps.onClick as React.MouseEventHandler<HTMLElement> | undefined;
  const onClick: React.MouseEventHandler<HTMLElement> = event => {
    originalClick?.(event);
    if (!event.defaultPrevented && !disabled) context?.dismiss("trigger");
  };
  const originalKeyDown = childProps.onKeyDown as React.KeyboardEventHandler<HTMLElement> | undefined;
  const isNativeButton = child.type === "button";
  const isNativeLink = child.type === "a" && typeof childProps.href === "string";
  const enhanced = !disableButtonEnhancement && !isNativeButton && !isNativeLink && childProps.role !== "button";
  const onKeyDown: React.KeyboardEventHandler<HTMLElement> = event => {
    originalKeyDown?.(event);
    if (event.defaultPrevented || disabled || !enhanced || (event.key !== "Enter" && event.key !== " ")) return;
    if (event.key === " ") event.preventDefault();
    event.currentTarget.click();
  };
  return React.cloneElement(child, {
    ...(isNativeButton && childProps.type === undefined ? { type: "button" } : {}),
    ...(enhanced ? { role: "button", tabIndex: childProps.tabIndex ?? 0 } : {}),
    onClick,
    ...(enhanced ? { onKeyDown } : {}),
  });
}

export const Toast = React.forwardRef<HTMLElement, ToastProps>(function Toast({ id, title, action, onAction, onDismiss, priority = 0, intent = "info", appearance, politeness, timeout = 3000, dismissLabel, pauseOnHover = false, pauseOnWindowBlur = false, children, ...props }: ToastProps, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const generatedId = React.useId();
  const toastId = id ?? generatedId;
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineToast);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const handleDismiss = (event: Event): void => {
      const detail = (event as CustomEvent<{ id?: string; reason?: string }>).detail;
      onDismiss?.(detail?.id ?? toastId, detail?.reason ?? "dismiss");
    };
    element.addEventListener("spui-dismiss", handleDismiss);
    return () => element.removeEventListener("spui-dismiss", handleDismiss);
  }, [onDismiss, toastId]);
  const dismissAction = (event: React.MouseEvent<HTMLDivElement>): void => {
    onAction?.(toastId);
    (ref.current as (HTMLElement & { dismiss?: (reason?: string) => void }) | null)?.dismiss?.("action");
    event.stopPropagation();
  };
  const dismiss = React.useCallback((reason = "trigger"): void => {
    (ref.current as (HTMLElement & { dismiss?: (reason?: string) => void }) | null)?.dismiss?.(reason);
  }, []);
  const composition = React.useMemo<ToastCompositionContextValue>(() => ({ intent, dismiss }), [intent, dismiss]);
  return React.createElement("spui-toast", useCustomElementProps({ ...props, ref, slot: "toast", "toast-id": toastId, priority, intent, appearance, politeness, timeout, tabIndex: props.tabIndex ?? -1, "dismiss-label": dismissLabel ?? context.strings.dismiss, "pause-on-hover": pauseOnHover ? "" : "false", "pause-on-window-blur": pauseOnWindowBlur ? "" : "false" }),
    React.createElement(ToastCompositionContext.Provider, { value: composition },
      React.createElement(React.Fragment, null,
        title !== undefined ? React.createElement(ToastTitle, { slot: "title" }, title as React.ReactNode) : null,
        children)),
    action !== undefined ? React.createElement("div", { slot: "action", onClick: dismissAction }, action) : null);
});

type ToastRecord = { id: string; content: React.ReactNode; options: ToastDispatchOptions };
let generatedToastId = 0;
const newToastId = (): string => globalThis.crypto?.randomUUID?.() ?? `spui-toast-${Date.now()}-${++generatedToastId}`;
function createDocumentToastController(toasterId?: string): ToastControllerValue {
  const dispatch = (detail: Omit<ToastControllerEventDetail, "toasterId">): boolean => dispatchToastControllerEvent({ ...detail, toasterId });
  return {
    dispatchToast: (content, options) => { const id = options?.id ?? options?.toastId ?? newToastId(); dispatch({ action: "dispatch", id, content, options: { ...options, id } }); return id; },
    updateToast: ((...args: [string, { content?: React.ReactNode; options?: ToastDispatchOptions }] | [ToastControllerUpdateOptions]) => { if (args.length === 1) dispatch({ action: "update", update: args[0] }); else dispatch({ action: "update", id: args[0], legacyUpdate: args[1] }); }) as ToastControllerUpdate,
    dismissToast: id => { dispatch({ action: "dismiss", id }); },
    dismissAllToasts: () => { dispatch({ action: "dismissAll" }); },
    pauseToast: id => dispatch({ action: "pause", id }),
    playToast: id => dispatch({ action: "play", id }),
    focusNewest: () => dispatch({ action: "focusNewest" }),
  };
}
function createTargetedToastController(toasterId: string): ToastControllerValue {
  const documentController = createDocumentToastController(toasterId);
  const getController = (): ToastControllerValue => toastControllerRegistry.get(toasterId) ?? documentController;
  return {
    dispatchToast: (content, options) => getController().dispatchToast(content, options),
    updateToast: ((...args: [string, { content?: React.ReactNode; options?: ToastDispatchOptions }] | [ToastControllerUpdateOptions]) => (getController().updateToast as (...values: typeof args) => void)(...args)) as ToastControllerUpdate,
    dismissToast: id => getController().dismissToast(id),
    dismissAllToasts: () => getController().dismissAllToasts(),
    pauseToast: id => getController().pauseToast(id),
    playToast: id => getController().playToast(id),
    focusNewest: () => getController().focusNewest(),
  };
}

export const Toaster = React.forwardRef<HTMLElement, ElementProps & { position?: ToastPosition; limit?: number; inline?: boolean; toasterId?: string; announce?: ToastAnnounce; children?: React.ReactNode }>(function Toaster({ position = "top-end", limit, inline = false, toasterId, announce, "aria-label": ariaLabel, children, ...props }: ElementProps & { position?: ToastPosition; limit?: number; inline?: boolean; toasterId?: string; announce?: ToastAnnounce; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  const context = React.useContext(UIContext);
  const [records, setRecords] = React.useState<ToastRecord[]>([]);
  const ref = React.useRef<(HTMLElement & { announce?: ToastAnnounce }) | null>(null)
  useExposeHostRef(ref, forwardedRef);;
  ensureDefined(defineToaster);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (element) element.announce = announce;
    return () => { if (element) element.announce = undefined; };
  }, [announce]);
  const removeToast = React.useCallback((id: string): void => setRecords(current => current.filter(record => record.id !== id)), []);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const handleDismiss = (event: Event): void => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id) removeToast(detail.id);
    };
    element.addEventListener("spui-dismiss", handleDismiss);
    return () => element.removeEventListener("spui-dismiss", handleDismiss);
  }, [removeToast]);

  const dispatchToast = React.useCallback((content: React.ReactNode, options: ToastDispatchOptions = {}): string => {
    const { toastId, ...recordOptions } = options;
    const id = options.id ?? toastId ?? newToastId();
    (ref.current as (HTMLElement & { captureFocus?: () => void }) | null)?.captureFocus?.();
    setRecords(current => [...current.filter(record => record.id !== id), { id, content, options: { ...recordOptions, id } }]);
    return id;
  }, []);
  const updateToast = React.useCallback((idOrOptions: string | ToastControllerUpdateOptions, legacyUpdate?: { content?: React.ReactNode; options?: ToastDispatchOptions }): void => {
    const id = typeof idOrOptions === "string" ? idOrOptions : idOrOptions.toastId;
    const hasContent = typeof idOrOptions === "string" ? Boolean(legacyUpdate && Object.hasOwn(legacyUpdate, "content")) : Object.hasOwn(idOrOptions, "content");
    const content = typeof idOrOptions === "string" ? legacyUpdate?.content : idOrOptions.content;
    let nextOptions: ToastDispatchOptions | undefined;
    if (typeof idOrOptions === "string") nextOptions = legacyUpdate?.options;
    else {
      const { toastId: _toastId, content: _content, ...options } = idOrOptions;
      nextOptions = options;
    }
    setRecords(current => current.map(record => record.id !== id ? record : {
      ...record,
      ...(hasContent ? { content } : {}),
      options: { ...record.options, ...nextOptions, id }
    }));
  }, []);
  const dismissToast = React.useCallback((id: string): void => {
    const toaster = ref.current as (HTMLElement & { dismiss?: (id: string) => boolean }) | null;
    if (!toaster?.dismiss?.(id)) removeToast(id);
  }, [removeToast]);
  const dismissAllToasts = React.useCallback((): void => {
    const toaster = ref.current as (HTMLElement & { dismissAll?: () => number }) | null;
    if (!toaster?.dismissAll?.()) setRecords([]);
  }, []);
  const pauseToast = React.useCallback((id: string): boolean => Boolean((ref.current as (HTMLElement & { pause?: (id: string) => boolean }) | null)?.pause?.(id)), []);
  const playToast = React.useCallback((id: string): boolean => Boolean((ref.current as (HTMLElement & { play?: (id: string) => boolean }) | null)?.play?.(id)), []);
  const focusNewest = React.useCallback((): boolean => Boolean((ref.current as (HTMLElement & { focusNewest?: () => boolean }) | null)?.focusNewest?.()), []);
  const controller = React.useMemo<ToastControllerValue>(() => ({ dispatchToast, updateToast, dismissToast, dismissAllToasts, pauseToast, playToast, focusNewest }), [dispatchToast, updateToast, dismissToast, dismissAllToasts, pauseToast, playToast, focusNewest]);
  React.useLayoutEffect(() => {
    const targetDocument = ref.current?.ownerDocument;
    if (!targetDocument) return;
    const handleControllerEvent = (event: Event): void => {
      const detail = (event as CustomEvent<ToastControllerEventDetail>).detail;
      if (!detail || detail.toasterId !== toasterId) return;
      if (detail.action === "dispatch") detail.result = Boolean(dispatchToast(detail.content, detail.options));
      else if (detail.action === "update" && detail.update) updateToast(detail.update);
      else if (detail.action === "update" && detail.id && detail.legacyUpdate) updateToast(detail.id, detail.legacyUpdate);
      else if (detail.action === "dismiss" && detail.id) { dismissToast(detail.id); detail.result = true; }
      else if (detail.action === "dismissAll") { dismissAllToasts(); detail.result = true; }
      else if (detail.action === "pause" && detail.id) detail.result = pauseToast(detail.id);
      else if (detail.action === "play" && detail.id) detail.result = playToast(detail.id);
      else if (detail.action === "focusNewest") detail.result = focusNewest();
    };
    targetDocument.addEventListener(toastControllerEventName, handleControllerEvent);
    return () => targetDocument.removeEventListener(toastControllerEventName, handleControllerEvent);
  }, [dispatchToast, updateToast, dismissToast, dismissAllToasts, pauseToast, playToast, focusNewest, toasterId]);
  React.useLayoutEffect(() => {
    if (!toasterId) return;
    toastControllerRegistry.set(toasterId, controller);
    return () => { if (toastControllerRegistry.get(toasterId) === controller) toastControllerRegistry.delete(toasterId); };
  }, [controller, toasterId]);
  const toasterDescendants: React.ReactNode[] = [];
  const compoundToasts: React.ReactNode[] = [];
  const partitionChild = (child: React.ReactNode): void => {
    if (React.isValidElement(child) && child.type === Toast) compoundToasts.push(child);
    else if (React.isValidElement(child) && child.type === React.Fragment) React.Children.forEach((child.props as { children?: React.ReactNode }).children, partitionChild);
    else if (child !== null && child !== undefined && typeof child !== "boolean") toasterDescendants.push(child);
  };
  React.Children.forEach(children, partitionChild);

  return React.createElement(ToastControllerContext.Provider, { value: controller },
    React.createElement(React.Fragment, null,
      toasterDescendants,
      React.createElement("spui-toaster", useCustomElementProps({ ...props, ref, position, inline: inline || undefined, limit: Number.isFinite(limit) && limit! >= 0 ? Math.floor(limit!) : undefined, managed: "", "toaster-id": toasterId, "aria-label": ariaLabel ?? context.strings.notifications ?? "Notifications" }),
        compoundToasts,
        records.map(record => React.createElement(Toast, { key: record.id, id: record.id, ...record.options }, record.content)))));
});

export function useToastController(toasterId?: string): ToastControllerValue {
  const controller = React.useContext(ToastControllerContext);
  const targetedController = React.useMemo<ToastControllerValue | null>(() => toasterId ? createTargetedToastController(toasterId) : null, [toasterId]);
  const documentController = React.useMemo(() => createDocumentToastController(), []);
  if (toasterId) return targetedController!;
  if (!controller) return documentController;
  return controller;
}

export const Skeleton = React.forwardRef<HTMLElement, ElementProps & { shape?: SkeletonShape; width?: string; height?: string; animated?: boolean; animation?: SkeletonAnimation; appearance?: SkeletonAppearance; size?: SkeletonItemSize; children?: React.ReactNode }>(function Skeleton({ shape = "text", width, height, animated = true, animation, appearance = "opaque", size, children, ...props }: ElementProps & { shape?: SkeletonShape; width?: string; height?: string; animated?: boolean; animation?: SkeletonAnimation; appearance?: SkeletonAppearance; size?: SkeletonItemSize; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineSkeleton);
  return React.createElement("spui-skeleton", useCustomElementProps({ ...props, ref: forwardedRef, shape, width, height, animated, animation, appearance, size }), children);
});

export const SkeletonItem = React.forwardRef<HTMLElement, ElementProps & { animation?: SkeletonAnimation; appearance?: SkeletonAppearance; size?: SkeletonItemSize; shape?: "rectangle" | "square" | "circle" }>(function SkeletonItem({ animation, appearance, size = 16, shape = "rectangle", ...props }: ElementProps & { animation?: SkeletonAnimation; appearance?: SkeletonAppearance; size?: SkeletonItemSize; shape?: "rectangle" | "square" | "circle" }, forwardedRef): React.ReactElement {
  ensureDefined(defineSkeletonItem);
  return React.createElement("spui-skeleton-item", useCustomElementProps({ ...props, ref: forwardedRef, animation, appearance, size, shape }));
});

export type LinkProps = ElementProps & { href?: string; target?: string; rel?: string; download?: string | boolean; hrefLang?: string; hreflang?: string; media?: string; ping?: string; type?: string; referrerPolicy?: string; title?: string; appearance?: "default" | "subtle"; underline?: "always" | "hover" | "none"; disabled?: boolean; disabledFocusable?: boolean; inline?: boolean; as?: "a" | "button" | "span"; children?: React.ReactNode };
export const Link = React.forwardRef<HTMLElement, LinkProps>(function Link({ href, target, rel, download, hrefLang, hreflang, media, ping, type, referrerPolicy, title, appearance = "default", underline = "hover", disabled = false, disabledFocusable = false, inline = false, as, children, ...props }: LinkProps, forwardedRef): React.ReactElement {
  ensureDefined(defineLink);
  return React.createElement("spui-link", useCustomElementProps({ ...props, ref: forwardedRef, href, target, rel, download, hreflang: hrefLang ?? hreflang, media, ping, type, "referrerpolicy": referrerPolicy, title, appearance, underline, as, disabled: disabled || undefined, "disabled-focusable": disabledFocusable || undefined, inline: inline || undefined }), children);
});

export const Divider = React.forwardRef<HTMLElement, ElementProps & { orientation?: "horizontal" | "vertical"; vertical?: boolean; align?: "start" | "center" | "end"; alignContent?: "start" | "center" | "end"; appearance?: DividerAppearance; inset?: boolean; wrapper?: React.ReactNode; children?: React.ReactNode }>(function Divider({ orientation = "horizontal", vertical = false, align, alignContent, appearance = "default", inset = false, wrapper, children, ...props }: ElementProps & { orientation?: "horizontal" | "vertical"; vertical?: boolean; align?: "start" | "center" | "end"; alignContent?: "start" | "center" | "end"; appearance?: DividerAppearance; inset?: boolean; wrapper?: React.ReactNode; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineDivider);
  const wrapperId = React.useId();
  const resolvedAlign = alignContent ?? align ?? "center";
  const hasLabel = wrapper != null || children != null;
  return React.createElement("spui-divider", useCustomElementProps({ ...props, ref: forwardedRef, orientation: vertical ? "vertical" : orientation, vertical: vertical || undefined, align: resolvedAlign, "align-content": resolvedAlign, appearance, inset, "aria-labelledby": props["aria-labelledby"] ?? (hasLabel ? wrapperId : undefined) }), hasLabel ? React.createElement("div", { slot: "wrapper", id: wrapperId }, wrapper ?? children) : null);
});

export type AccordionProviderValue = { openItems: AccordionItemValue[]; requestToggle: (data: { event: Event; value: AccordionItemValue }) => void; collapsible: boolean; multiple: boolean; navigation: AccordionNavigation | undefined };
const AccordionContext = React.createContext<AccordionProviderValue | undefined>(undefined);
const AccordionItemOpenContext = React.createContext(false);
export function AccordionProvider({ value, children }: { value: AccordionProviderValue; children?: React.ReactNode }): React.ReactElement {
  return React.createElement(AccordionContext.Provider, { value }, children);
}

export type AccordionToggleEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
export const Accordion = React.forwardRef<HTMLElement, ElementProps & { mode?: "single" | "multiple"; multiple?: boolean; collapsible?: boolean; navigation?: AccordionNavigation; openItems?: AccordionItemValue | readonly AccordionItemValue[]; defaultOpenItems?: AccordionItemValue | readonly AccordionItemValue[]; onToggle?: <TValue extends AccordionItemValue>(event: AccordionToggleEvent, data: { value: TValue; openItems: TValue[] }) => void; children?: React.ReactNode }>(function Accordion<TValue extends AccordionItemValue = AccordionItemValue>({ mode, multiple, collapsible, navigation, openItems, defaultOpenItems, onToggle, children, ...props }: ElementProps & { mode?: "single" | "multiple"; multiple?: boolean; collapsible?: boolean; navigation?: AccordionNavigation; openItems?: TValue | readonly TValue[]; defaultOpenItems?: TValue | readonly TValue[]; onToggle?: (event: AccordionToggleEvent, data: { value: TValue; openItems: TValue[] }) => void; children?: React.ReactNode }, forwardedRef: React.ForwardedRef<HTMLElement>): React.ReactElement {
  const provider = React.useContext(AccordionContext);
  const ref = React.useRef<HTMLElement & { openItems?: readonly AccordionItemValue[] | AccordionItemValue; defaultOpenItems?: readonly AccordionItemValue[] | AccordionItemValue }>(null);
  useExposeHostRef(ref, forwardedRef);
  ensureDefined(defineAccordion);
  useSpuiEvent(ref, "spui-toggle", (detail, event) => {
    const sourceEvent = (detail.sourceEvent as Event | undefined) ?? event;
    const value = detail.value as TValue;
    provider?.requestToggle({ event: sourceEvent, value });
    const callbackEvent = createReactEventBridge(sourceEvent, event, sourceEventTarget(sourceEvent, ref.current!)) as unknown as AccordionToggleEvent;
    onToggle?.(callbackEvent, { value, openItems: (detail.openItems ?? []) as TValue[] });
  });
  const resolvedOpenItems = openItems ?? (provider?.openItems as readonly TValue[] | undefined);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (defaultOpenItems !== undefined) element.defaultOpenItems = defaultOpenItems;
    element.openItems = resolvedOpenItems;
  }, [defaultOpenItems, resolvedOpenItems]);
  const isMultiple = mode === undefined ? multiple ?? provider?.multiple : mode === "multiple";
  const resolvedCollapsible = collapsible ?? provider?.collapsible ?? false;
  return React.createElement("spui-accordion", useCustomElementProps({ ...props, ref, mode, multiple: isMultiple || undefined, collapsible: resolvedCollapsible || undefined, navigation: navigation ?? provider?.navigation }), children);
}) as <TValue extends AccordionItemValue = AccordionItemValue>(props: ElementProps & { mode?: "single" | "multiple"; multiple?: boolean; collapsible?: boolean; navigation?: AccordionNavigation; openItems?: TValue | readonly TValue[]; defaultOpenItems?: TValue | readonly TValue[]; onToggle?: (event: AccordionToggleEvent, data: { value: TValue; openItems: TValue[] }) => void; children?: React.ReactNode } & React.RefAttributes<HTMLElement>) => React.ReactElement;

export const AccordionItem = React.forwardRef<HTMLElement, ElementProps & { value: AccordionItemValue; heading?: string; open?: boolean; defaultOpen?: boolean; disabled?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }>(function AccordionItem({ value, heading, open, defaultOpen, disabled, onOpenChange, children, ...props }: ElementProps & { value: AccordionItemValue; heading?: string; open?: boolean; defaultOpen?: boolean; disabled?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  const ref = React.useRef<HTMLElement>(null)
  useExposeHostRef(ref, forwardedRef);;
  const [motionOpen, setMotionOpen] = React.useState(open ?? defaultOpen ?? false);
  ensureDefined(defineAccordion);
  useSpuiEvent(ref, "spui-item-toggle", detail => onOpenChange?.(Boolean(detail.open)));
  React.useLayoutEffect(() => {
    const element = ref.current as (HTMLElement & { open?: boolean }) | null;
    if (!element) return;
    if (open !== undefined) element.open = open;
    else if (defaultOpen !== undefined) element.open = defaultOpen;
  }, [open, defaultOpen]);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const sync = (): void => setMotionOpen(element.hasAttribute("open"));
    const observer = new MutationObserver(sync);
    observer.observe(element, { attributes: true, attributeFilter: ["open"] });
    sync();
    return () => observer.disconnect();
  }, []);
  return React.createElement(AccordionItemOpenContext.Provider, { value: motionOpen }, React.createElement("spui-accordion-item", useCustomElementProps({ ...props, ref, value: String(value), heading, disabled, open: open ?? (defaultOpen || undefined) }), children));
});

export const AccordionHeader = React.forwardRef<HTMLElement, ElementProps & { expandIconPosition?: "start" | "end"; inline?: boolean; size?: "small" | "medium" | "large" | "extra-large"; icon?: React.ReactNode; expandIcon?: React.ReactNode; button?: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>> | React.ButtonHTMLAttributes<HTMLButtonElement>; children?: React.ReactNode }>(function AccordionHeader({ expandIconPosition = "end", inline = false, size = "medium", icon, expandIcon, button, children, ...props }: ElementProps & { expandIconPosition?: "start" | "end"; inline?: boolean; size?: "small" | "medium" | "large" | "extra-large"; icon?: React.ReactNode; expandIcon?: React.ReactNode; button?: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>> | React.ButtonHTMLAttributes<HTMLButtonElement>; children?: React.ReactNode }, forwardedRef): React.ReactElement {
  ensureDefined(defineAccordion);
  const ref = React.useRef<HTMLElement & { button?: React.ButtonHTMLAttributes<HTMLButtonElement> }>(null)
  useExposeHostRef(ref, forwardedRef);;
  const buttonProps = React.isValidElement(button) ? button.props : button;
  React.useLayoutEffect(() => {
    const header = ref.current;
    if (!header) return;
    header.button = buttonProps;
    header.dispatchEvent(new CustomEvent("spui-header-slots-change", { bubbles: true, composed: true }));
  }, [buttonProps]);
  return React.createElement("spui-accordion-header", useCustomElementProps({ ...props, ref, slot: "heading", "expand-icon-position": expandIconPosition, inline: inline || undefined, size }),
    icon == null ? null : React.createElement("span", { slot: "icon" }, icon),
    children,
    expandIcon == null ? null : React.createElement("span", { slot: "expand-icon" }, expandIcon));
});

export const AccordionPanel = React.forwardRef<HTMLElement, ElementProps & { children?: React.ReactNode; collapseMotion?: React.ComponentType<PresenceMotionSlotProps> }>(function AccordionPanel({ children, collapseMotion, ...props }: ElementProps & { children?: React.ReactNode; collapseMotion?: React.ComponentType<PresenceMotionSlotProps> }, forwardedRef): React.ReactElement {
  ensureDefined(defineAccordion);
  const open = React.useContext(AccordionItemOpenContext);
  return React.createElement("spui-accordion-panel", useCustomElementProps({ ref: forwardedRef, ...props, slot: "panel", motion: collapseMotion ? true : undefined }), collapseMotion ? React.createElement(collapseMotion, { visible: open, appear: true, unmountOnExit: true }, children) : children);
});
