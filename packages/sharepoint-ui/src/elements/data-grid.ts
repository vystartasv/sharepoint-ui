import { base } from "./shared.js";
import { VariableSizeIndex } from "./virtual-list.js";
import { clampDataGridColumnWidth, clampDataGridRowHeight, dataGridColumnVar, filterDataGridItems, fitDataGridColumnWidths, formatDataGridClipboard, getDataGridCellValue, getDataGridColumnSizing, getDataGridColumnWindow, groupDataGridItems, parseDataGridClipboard, parseDataGridClipboardValue, parseDataGridInputValue, sortDataGridItems, toDataGridInputValue, writeDataGridClipboardText, type DataGridCellEdit, type DataGridColumn, getDataGridDataSourceRow, type DataGridDataSource, type DataGridDataSourceRow, type DataGridColumnSizingOptions, type DataGridColumnWidths, type DataGridEditValue, type DataGridFocusMode, type DataGridGroup, type DataGridSelectionAppearance, type DataGridSelectionModel, type DataGridSort, type DataGridSortDirection } from "./data-grid-model.js";

export type DataGridCellRenderer<T = unknown> = (item: T, column: DataGridColumn<T>, rowIndex: number) => Node | string | number | null;
export type DataGridRowHeightGetter<T = unknown> = (item: T, rowIndex: number) => number;
export type DataGridCellsEditHandler = (edits: readonly DataGridCellEdit[]) => void | Promise<void>;
export type DataGridSourceSelectionHandler = (selection: DataGridSelectionModel, selectedItems: readonly unknown[]) => void;
export interface SharePointDataGridElement extends HTMLElement {
  items: unknown[];
  dataSource?: DataGridDataSource;
  columns: DataGridColumn[];
  focusMode: DataGridFocusMode;
  selectionAppearance: DataGridSelectionAppearance;
  subtleSelection: boolean;
  columnSizingOptions: DataGridColumnSizingOptions;
  autoFitColumns: boolean;
  containerWidthOffset: number;
  refreshDataSource(): void;
  onDataSourceGroupToggle?: (groupKey: string, expanded: boolean) => void;
  selectionModel: DataGridSelectionModel;
  onDataSourceSelectionChange?: DataGridSourceSelectionHandler;
  getRowHeight?: DataGridRowHeightGetter;
  onCellsEdit?: DataGridCellsEditHandler;
}
declare global { interface HTMLElementTagNameMap { "spui-data-grid": SharePointDataGridElement; } }
type GridRow = HTMLDivElement & { spuiItem?: unknown; spuiKey?: string; spuiType?: "item" | "group" | "loading" };
type DataGridDisplayRow = { kind: "group"; group: DataGridGroup; sourceGroup?: { expanded: boolean; count: number } } | { kind: "item"; item: unknown; itemIndex: number; rowKey?: string };
let nextGridId = 0;

/** Accessible, virtualized grid engine for non-React and React consumers. */
export function defineDataGrid(): void {
  if (customElements.get("spui-data-grid")) return;
  class SpuiDataGrid extends HTMLElement implements SharePointDataGridElement {
    static observedAttributes = ["aria-label", "label", "focus-mode", "selection-mode", "selection-appearance", "subtle-selection", "auto-fit-columns", "container-width-offset", "row-height", "overscan", "virtualize-columns", "select-label", "select-all-label", "empty-label", "no-results-label", "loading-label", "load-error-label", "edit-error-label", "filterable", "filter-label", "sort-priority-label", "resizable-columns", "resize-label", "reorderable-columns", "reorder-label", "group-by", "empty-group-label", "expand-group-label", "collapse-group-label", "row-label", "edit-hint", "selection-copied-label", "copy-failed-label", "paste-one-label", "paste-many-label", "paste-failed-label"];
    private data: unknown[] = [];
    private source?: DataGridDataSource;
    private sourceUnsubscribe?: () => void;
    private sourceRequest?: { key: string; controller: AbortController };
    private clipboardController?: AbortController;
    private completedSourceRange = "";
    private sortedData: unknown[] = [];
    private definitions: DataGridColumn[] = [];
    private renderer?: DataGridCellRenderer;
    private keyOf?: (item: unknown, index: number) => string | number;
    private rowHeightGetter?: DataGridRowHeightGetter;
    private heightRows?: ReturnType<SpuiDataGrid["displayRows"]>;
    private heightEstimate = 0;
    private heightGetterAtIndex?: DataGridRowHeightGetter;
    private readonly rowSizes = new VariableSizeIndex();
    private selected = new Set<string>();
    private sourceAllSelected = false;
    private sourceAllSelectedScope?: string;
    private sourceExcludedKeys = new Set<string>();
    private currentSort?: DataGridSort;
    private currentSorts: DataGridSort[] = [];
    private currentFilterValue = "";
    private currentColumnWidths: Record<string, number> = {};
    private fittedColumnWidths: DataGridColumnWidths = {};
    private sizingOptions: DataGridColumnSizingOptions = {};
    private currentColumnOrder: string[] = [];
    private draggedColumnId?: string;
    private resizing?: { column: DataGridColumn; handle: HTMLElement; startX: number; startWidth: number; direction: number; pointerId: number };
    private readonly rows = new Map<number, GridRow>();
    private readonly pool: GridRow[] = [];
    private viewport?: HTMLDivElement;
    private filterBar?: HTMLDivElement;
    private filterInput?: HTMLInputElement;
    private header?: HTMLDivElement;
    private body?: HTMLDivElement;
    private reorderStatus?: HTMLDivElement;
    private frame = 0;
    private resizeObserver?: ResizeObserver;
    private columnWindowChanged = false;
    private activeCell = { row: 0, column: 0 };
    private pendingBoundaryFocus?: { row: number; column: number; attempts: number; scheduled: boolean };
    get focusMode(): DataGridFocusMode { const value = this.getAttribute("focus-mode"); return value === "none" || value === "row_unstable" || value === "composite" ? value : "cell"; }
    set focusMode(value: DataGridFocusMode) { if (value === "cell") this.removeAttribute("focus-mode"); else this.setAttribute("focus-mode", value); }
    get selectionAppearance(): DataGridSelectionAppearance { const value = this.getAttribute("selection-appearance"); return value === "neutral" || value === "none" ? value : "brand"; }
    set selectionAppearance(value: DataGridSelectionAppearance) { if (value === "brand") this.removeAttribute("selection-appearance"); else this.setAttribute("selection-appearance", value); }
    get subtleSelection(): boolean { return this.hasAttribute("subtle-selection"); }
    set subtleSelection(value: boolean) { this.toggleAttribute("subtle-selection", value); }
    get columnSizingOptions(): DataGridColumnSizingOptions { return this.sizingOptions; }
    set columnSizingOptions(value: DataGridColumnSizingOptions) { this.sizingOptions = value && typeof value === "object" ? value : {}; this.initializeColumnWidths(); this.applyColumnWidthVariables(); this.renderHeader(); this.paint(true); }
    get autoFitColumns(): boolean { return this.getAttribute("auto-fit-columns") !== "false"; }
    set autoFitColumns(value: boolean) { if (value) this.removeAttribute("auto-fit-columns"); else this.setAttribute("auto-fit-columns", "false"); }
    get containerWidthOffset(): number { const value = Number(this.getAttribute("container-width-offset")); return Number.isFinite(value) ? value : 0; }
    set containerWidthOffset(value: number) { if (Number.isFinite(value) && value !== 0) this.setAttribute("container-width-offset", String(value)); else this.removeAttribute("container-width-offset"); }
    private columnWindow = { start: 0, end: 16 };
    private collapsedGroups = new Set<string>();
    private cachedDisplayRows?: (DataGridDisplayRow | undefined)[];
    private cachedSortedData?: unknown[];
    private failedSourceRange = "";
    private cachedGroupBy = "";
    private cachedColumnIds = "";
    private cachedCollapsedGroups?: Set<string>;
    private readonly selectionName = `spui-grid-selection-${++nextGridId}`;
    private readonly editedValues = new Map<string, DataGridEditValue>();
    private editingCell?: { rowId: string; columnId: string; draft: string; error?: string; saving?: boolean };
    private editCallback?: (edit: DataGridCellEdit) => void | Promise<void>;
    private cellsEditCallback?: DataGridCellsEditHandler;
    private dataSourceGroupToggleCallback?: (groupKey: string, expanded: boolean) => void;
    private dataSourceSelectionCallback?: DataGridSourceSelectionHandler;
    private editValidator?: (edit: DataGridCellEdit) => string | undefined;
    private suppressEditorBlurCommit = false;

    private get sourceSelectableCount(): number {
      const count = this.source?.selectableCount ?? this.source?.length ?? 0;
      return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    }

    get items(): unknown[] { return this.data; }
    set items(value: unknown[]) { this.clipboardController?.abort(); this.clipboardController = undefined; this.data = Array.isArray(value) ? value : []; this.source = undefined; this.sourceAllSelected = false; this.sourceAllSelectedScope = undefined; this.sourceExcludedKeys.clear(); this.sourceUnsubscribe?.(); this.sourceUnsubscribe = undefined; this.sourceRequest?.controller.abort(); this.sourceRequest = undefined; this.completedSourceRange = ""; this.failedSourceRange = ""; this.editedValues.clear(); this.editingCell = undefined; this.recomputeSort(); this.cachedDisplayRows = undefined; this.paint(true); }
    get dataSource(): DataGridDataSource | undefined { return this.source; }
    set dataSource(value: DataGridDataSource | undefined) {
      if (value === this.source) { this.refreshDataSource(); return; }
      this.clipboardController?.abort(); this.clipboardController = undefined;
      this.sourceRequest?.controller.abort(); this.sourceRequest = undefined;
      this.sourceUnsubscribe?.(); this.sourceUnsubscribe = undefined;
      this.source = value;
      this.completedSourceRange = "";
      this.failedSourceRange = "";
      this.cachedDisplayRows = undefined;
      this.recomputeSort();
      this.observeDataSource();
      if (this.reorderStatus) this.reorderStatus.textContent = "";
      this.paint(true);
    }
    get columns(): DataGridColumn[] { return this.definitions; }
    set columns(value: DataGridColumn[]) { this.definitions = Array.isArray(value) ? value.filter(column => column?.id && column.label) : []; this.currentColumnOrder = this.normalizeColumnOrder(this.currentColumnOrder); this.recomputeSort(); this.renderHeader(); this.initializeColumnWidths(); this.paint(true); }
    get renderCell(): DataGridCellRenderer | undefined { return this.renderer; }
    set renderCell(value: DataGridCellRenderer | undefined) { this.renderer = value; this.paint(true); }
    get itemKey(): ((item: unknown, index: number) => string | number) | undefined { return this.keyOf; }
    set itemKey(value: ((item: unknown, index: number) => string | number) | undefined) { this.keyOf = value; this.paint(true); }
    get getRowHeight(): DataGridRowHeightGetter | undefined { return this.rowHeightGetter; }
    set getRowHeight(value: DataGridRowHeightGetter | undefined) { this.rowHeightGetter = value; this.heightRows = undefined; this.paint(true); }
    get selectedKeys(): string[] { return this.sourceAllSelected ? [] : [...this.selected]; }
    set selectedKeys(value: readonly (string | number)[]) { this.sourceAllSelected = false; this.sourceAllSelectedScope = undefined; this.sourceExcludedKeys.clear(); this.selected = new Set((value ?? []).map(String)); this.paint(true); }
    get selectionModel(): DataGridSelectionModel { return this.sourceAllSelected ? { mode: "all", excludedKeys: [...this.sourceExcludedKeys], ...(this.sourceAllSelectedScope === undefined ? {} : { scopeKey: this.sourceAllSelectedScope }) } : { mode: "explicit", keys: [...this.selected] }; }
    set selectionModel(value: DataGridSelectionModel) {
      if (value?.mode === "all") {
        this.sourceAllSelected = true;
        this.sourceAllSelectedScope = value.scopeKey;
        this.sourceExcludedKeys = new Set(value.excludedKeys.map(String));
        this.selected.clear();
      } else {
        this.sourceAllSelected = false;
        this.sourceAllSelectedScope = undefined;
        this.sourceExcludedKeys.clear();
        this.selected = new Set((value?.mode === "explicit" ? value.keys : []).map(String));
      }
      this.paint(true);
    }
    get sort(): DataGridSort | undefined { return this.currentSort; }
    set sort(value: DataGridSort | undefined) { this.currentSort = value; this.currentSorts = value ? [value] : []; this.recomputeSort(); this.renderHeader(); this.paint(true); }
    get sorts(): DataGridSort[] { return this.currentSorts.map(entry => ({ ...entry })); }
    set sorts(value: readonly DataGridSort[]) { this.currentSorts = this.normalizeSorts(value); this.currentSort = this.currentSorts[0]; this.recomputeSort(); this.renderHeader(); this.paint(true); }
    get filterValue(): string { return this.currentFilterValue; }
    set filterValue(value: string) {
      const next = String(value ?? "");
      if (next === this.currentFilterValue) return;
      this.currentFilterValue = next;
      if (this.filterInput && this.filterInput.value !== next) this.filterInput.value = next;
      this.recomputeSort(); this.paint(true);
      this.dispatchEvent(new CustomEvent("spui-filter-change", { detail: { filterValue: next }, bubbles: true, composed: true }));
    }
    get filterable(): boolean { return this.hasAttribute("filterable"); }
    set filterable(value: boolean) { this.toggleAttribute("filterable", Boolean(value)); }
    get columnOrder(): string[] { return [...this.orderedDefinitions.map(column => column.id)]; }
    set columnOrder(value: readonly string[]) { this.currentColumnOrder = this.normalizeColumnOrder(value); this.renderHeader(); this.paint(true); }
    get resizableColumns(): boolean { return this.hasAttribute("resizable-columns"); }
    set resizableColumns(value: boolean) { this.toggleAttribute("resizable-columns", Boolean(value)); }
    get reorderableColumns(): boolean { return this.hasAttribute("reorderable-columns"); }
    set reorderableColumns(value: boolean) { this.toggleAttribute("reorderable-columns", Boolean(value)); }
    get virtualizeColumns(): boolean { const value = this.getAttribute("virtualize-columns"); return value === null ? this.orderedDefinitions.length > 16 : value !== "false"; }
    set virtualizeColumns(value: boolean) { this.setAttribute("virtualize-columns", String(Boolean(value))); }
    get columnWidths(): DataGridColumnWidths { return this.currentColumnWidths; }
    set columnWidths(value: DataGridColumnWidths) {
      this.currentColumnWidths = Object.fromEntries(Object.entries(value ?? {}).filter(([, width]) => Number.isFinite(width) && width > 0).map(([id, width]) => { const column = this.definitions.find(candidate => candidate.id === id); return [id, column ? clampDataGridColumnWidth(column, width, this.sizingOptions[id]) : Math.round(width)]; }));
      this.initializeColumnWidths(); this.applyColumnWidthVariables(); this.renderHeader(); this.paint(true);
    }
    get groupBy(): string { return this.getAttribute("group-by") || ""; }
    set groupBy(value: string) { if (value) this.setAttribute("group-by", value); else this.removeAttribute("group-by"); }
    get collapsedGroupKeys(): string[] { return [...this.collapsedGroups]; }
    set collapsedGroupKeys(value: readonly string[]) { this.collapsedGroups = new Set(value ?? []); this.paint(true); }
    get onCellEdit(): ((edit: DataGridCellEdit) => void | Promise<void>) | undefined { return this.editCallback; }
    set onCellEdit(value: ((edit: DataGridCellEdit) => void | Promise<void>) | undefined) { this.editCallback = value; }
    get validateCellEdit(): ((edit: DataGridCellEdit) => string | undefined) | undefined { return this.editValidator; }
    set validateCellEdit(value: ((edit: DataGridCellEdit) => string | undefined) | undefined) { this.editValidator = value; }
    get onCellsEdit(): DataGridCellsEditHandler | undefined { return this.cellsEditCallback; }
    set onCellsEdit(value: DataGridCellsEditHandler | undefined) { this.cellsEditCallback = value; }
    get onDataSourceGroupToggle(): ((groupKey: string, expanded: boolean) => void) | undefined { return this.dataSourceGroupToggleCallback; }
    set onDataSourceGroupToggle(value: ((groupKey: string, expanded: boolean) => void) | undefined) { this.dataSourceGroupToggleCallback = value; }
    get onDataSourceSelectionChange(): DataGridSourceSelectionHandler | undefined { return this.dataSourceSelectionCallback; }
    set onDataSourceSelectionChange(value: DataGridSourceSelectionHandler | undefined) { this.dataSourceSelectionCallback = value; }
    refreshDataSource(): void { this.completedSourceRange = ""; this.failedSourceRange = ""; this.sourceRequest?.controller.abort(); this.sourceRequest = undefined; this.cachedDisplayRows = undefined; this.paint(true); }

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.recomputeSort();
      this.resizeObserver ??= new ResizeObserver(() => { this.initializeColumnWidths(); this.paint(this.updateColumnWindow()); });
      if (this.viewport) this.resizeObserver.observe(this.viewport);
      this.observeDataSource();
      this.renderHeader();
      this.initializeColumnWidths();
      this.paint(true);
    }

    disconnectedCallback(): void { cancelAnimationFrame(this.frame); this.frame = 0; this.resizeObserver?.disconnect(); this.sourceRequest?.controller.abort(); this.sourceRequest = undefined; this.clipboardController?.abort(); this.clipboardController = undefined; this.sourceUnsubscribe?.(); this.sourceUnsubscribe = undefined; }
    attributeChangedCallback(): void { this.renderFilter(); this.renderHeader(); this.initializeColumnWidths(); this.paint(true); }
    private localizedMessage(attribute: string, fallback: string, values: Record<string, string> = {}): string {
      return Object.entries(values).reduce((message, [key, value]) => message.replaceAll(`{${key}}`, value), this.getAttribute(attribute) ?? fallback);
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0}.viewport{box-sizing:border-box;position:relative;overflow:auto;height:var(--spui-data-grid-height,400px);overscroll-behavior:contain;border:1px solid var(--spui-data-grid-border,var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1)));border-radius:var(--spui-data-grid-radius,var(--spui-control-radius,6px));background:var(--spui-data-grid-background,var(--spui-base-surface,var(--spui-ui-surface,#fff)));outline:none}.viewport:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}.header{position:sticky;top:0;z-index:2;background:var(--spui-data-grid-header-background,var(--spui-base-canvas,var(--spui-ui-canvas,#f5f5f5)));color:var(--spui-ui-text,var(--spui-semantic-body-text,#323130));box-shadow:0 1px 0 var(--spui-ui-stroke,#d1d1d1)}.row{box-sizing:border-box;display:grid;align-items:center;min-width:100%;border-block-end:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#edebe9));background:var(--spui-data-grid-row-background,var(--spui-base-surface,var(--spui-ui-surface,#fff)));color:var(--spui-ui-text,var(--spui-semantic-body-text,#323130))}.data-row{position:absolute;inset-inline:0;top:0}.row:hover{background:var(--spui-data-grid-row-hover,var(--spui-ui-surface-hover,#f5f5f5))}.cell{box-sizing:border-box;display:flex;align-items:center;min-width:0;height:100%;padding-inline:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.header-cell{position:relative;font-weight:600}.resize-handle{position:absolute;z-index:1;inset-block:0;inset-inline-end:0;width:10px;display:flex;align-items:center;justify-content:center;touch-action:none;cursor:col-resize;outline:none}.resize-handle::after{content:"";width:1px;height:60%;background:transparent}.resize-handle:hover::after,.resize-handle:focus-visible::after{background:var(--spui-focus-ring,var(--spui-ui-accent,#0078d4))}.resize-handle:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}.header-cell button{display:flex;align-items:center;gap:6px;width:100%;height:100%;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:start;cursor:pointer}.header-cell button:focus-visible,.cell:focus-visible,input:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}.selection-cell{justify-content:center;padding-inline:8px}.sort-indicator{color:var(--spui-ui-accent,var(--colorBrandForeground1,#0078d4))}.empty{padding:24px;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));text-align:center}@media(forced-colors:active){.viewport{border-color:CanvasText}.header{background:Canvas;color:CanvasText}.row{background:Canvas;color:CanvasText;border-color:CanvasText}.sort-indicator{color:LinkText}.resize-handle:focus-visible{outline-color:Highlight}.resize-handle::after{background:CanvasText}}`;
      style.textContent += ".body{position:relative;display:block}.reorder-handle{flex:none;width:24px;height:28px;margin-inline-end:4px;padding:0;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));font:inherit;cursor:grab}.header-cell .reorder-handle{width:24px;height:28px}.header-cell .reorder-handle+button{flex:1;min-width:0;width:auto}.reorder-handle:hover{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5));color:var(--spui-ui-text,inherit)}.reorder-handle:active{cursor:grabbing}.reorder-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}";
      style.textContent += ".group-row{background:var(--spui-data-grid-header-background,var(--spui-base-canvas,var(--spui-ui-canvas,#f5f5f5)));font-weight:600}.group-cell{grid-column:1/-1!important;padding-inline:8px}.group-cell button{display:flex;align-items:center;gap:8px;width:100%;height:100%;padding-inline:4px;border:0;background:transparent;color:inherit;font:inherit;text-align:start;cursor:pointer}.group-cell button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}.group-cell button span{margin-inline-start:auto;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));font-variant-numeric:tabular-nums}";
      style.textContent += ".filter-bar{margin-block-end:8px}.filter-bar[hidden]{display:none}.filter-bar input{box-sizing:border-box;width:min(100%,360px);min-height:36px;padding:6px 10px;border:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1));border-radius:var(--spui-control-radius,4px);background:var(--spui-base-surface,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font:inherit}.filter-bar input:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}.cell-editor{box-sizing:border-box;width:100%;min-width:0;min-height:30px;padding:3px 6px;border:1px solid var(--spui-ui-accent,#78716c);border-radius:var(--spui-control-radius,4px);background:var(--spui-base-surface,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font:inherit}.cell-editor:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:1px}.cell-editor[aria-invalid=true]{border-color:var(--spui-semantic-danger,#d13438)}.edit-error{position:absolute;z-index:3;margin-block-start:32px;padding:4px 8px;border:1px solid var(--spui-semantic-danger,#d13438);border-radius:4px;background:var(--spui-base-surface,#fff);color:var(--spui-semantic-danger,#d13438);font-size:12px}";
      style.textContent += ".viewport[data-selection-appearance=brand] .data-row[aria-selected=true]{background:color-mix(in srgb,var(--spui-ui-accent,#0078d4) 14%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}.viewport[data-selection-appearance=neutral] .data-row[aria-selected=true]{background:color-mix(in srgb,var(--spui-ui-text,#323130) 6%,var(--spui-base-surface,var(--spui-ui-surface,#fff)))}.viewport[data-subtle-selection=true] .data-row .selection-cell input{opacity:0;transition:opacity var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}.viewport[data-subtle-selection=true] .data-row:hover .selection-cell input,.viewport[data-subtle-selection=true] .data-row:focus-within .selection-cell input{opacity:1}@media(prefers-reduced-motion:reduce){.selection-cell input{transition:none}}@media(forced-colors:active){.viewport .data-row[aria-selected=true]{outline:1px solid Highlight}.viewport[data-selection-appearance=brand] .data-row[aria-selected=true],.viewport[data-selection-appearance=neutral] .data-row[aria-selected=true]{background:Canvas;color:CanvasText}}";
      style.textContent += ".data-row[aria-selected]{cursor:pointer}";
      this.filterBar = document.createElement("div");
      this.filterBar.className = "filter-bar";
      this.filterBar.setAttribute("role", "search");
      this.filterBar.part.add("filter");
      this.filterInput = document.createElement("input");
      this.filterInput.type = "search";
      this.filterInput.dataset.testid = "spui-data-grid-filter";
      this.filterInput.addEventListener("input", () => { this.filterValue = this.filterInput!.value; });
      this.filterBar.append(this.filterInput);
      this.viewport = document.createElement("div");
      this.viewport.className = "viewport";
      this.viewport.part.add("viewport");
      this.viewport.setAttribute("role", "grid");
      this.viewport.tabIndex = 0;
      this.viewport.addEventListener("scroll", () => {
        this.columnWindowChanged ||= this.updateColumnWindow();
        if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; const force = this.columnWindowChanged; this.columnWindowChanged = false; this.paint(force); });
      }, { passive: true });
      this.viewport.addEventListener("click", event => this.onGridClick(event));
      this.viewport.addEventListener("dblclick", event => this.onResizeDoubleClick(event));
      this.viewport.addEventListener("pointerdown", event => this.onResizeStart(event));
      this.viewport.addEventListener("pointermove", event => this.onResizeMove(event));
      this.viewport.addEventListener("pointerup", event => this.onResizeEnd(event));
      this.viewport.addEventListener("pointercancel", event => this.onResizeEnd(event, true));
      this.viewport.addEventListener("dragstart", event => this.onColumnDragStart(event));
      this.viewport.addEventListener("dragover", event => this.onColumnDragOver(event));
      this.viewport.addEventListener("drop", event => this.onColumnDrop(event));
      this.viewport.addEventListener("dragend", () => { this.draggedColumnId = undefined; });
      this.viewport.addEventListener("keydown", event => this.onGridKeyDown(event));
      this.viewport.addEventListener("copy", event => this.onGridCopy(event as ClipboardEvent));
      this.viewport.addEventListener("paste", event => { void this.onGridPaste(event as ClipboardEvent); });
      this.header = document.createElement("div");
      this.header.className = "header";
      this.header.setAttribute("role", "rowgroup");
      this.header.part.add("header");
      this.body = document.createElement("div");
      this.body.className = "body";
      this.body.setAttribute("role", "rowgroup");
      this.body.part.add("body");
      this.reorderStatus = document.createElement("div");
      this.reorderStatus.className = "reorder-status";
      this.reorderStatus.setAttribute("role", "status");
      this.reorderStatus.setAttribute("aria-live", "polite");
      this.reorderStatus.part.add("reorder-status");
      this.viewport.append(this.header, this.body, this.reorderStatus);
      shadow.append(style, this.filterBar, this.viewport);
      this.renderFilter();
    }

    private renderFilter(): void {
      if (!this.filterBar || !this.filterInput) return;
      this.filterBar.hidden = !this.filterable;
      this.filterInput.setAttribute("aria-label", this.getAttribute("filter-label") || "Search rows");
      if (this.filterInput.value !== this.currentFilterValue) this.filterInput.value = this.currentFilterValue;
    }

    private recomputeSort(): void {
      if (this.source) { this.sortedData = []; this.cachedDisplayRows = undefined; this.cachedSortedData = this.sortedData; return; }
      const locale = this.lang || document.documentElement.lang;
      const filtered = filterDataGridItems(this.data, this.definitions, this.currentFilterValue, locale);
      this.sortedData = sortDataGridItems(filtered, this.definitions, this.currentSorts, locale);
    }
    private normalizeSorts(value: readonly DataGridSort[] | undefined): DataGridSort[] {
      const seen = new Set<string>();
      return (value ?? []).filter(entry => {
        if (!entry?.columnId || seen.has(entry.columnId) || !this.definitions.some(column => column.id === entry.columnId && column.sortable !== false)) return false;
        seen.add(entry.columnId);
        return entry.direction === "ascending" || entry.direction === "descending";
      }).map(entry => ({ ...entry }));
    }
    private visibleItems(): unknown[] { return this.sortedData; }
    private sourceSelectionActive(): boolean { return this.sourceAllSelected && (this.sourceAllSelectedScope === undefined || this.sourceAllSelectedScope === this.source?.selectionScopeKey); }
    private isRowSelected(key: string): boolean { return this.source && this.sourceSelectionActive() ? !this.sourceExcludedKeys.has(key) : this.selected.has(key); }
    private selectedLoadedItems(): unknown[] {
      if (this.source) return [...this.rows.values()].flatMap(row => row.spuiItem !== undefined && this.isRowSelected(row.spuiKey || "") ? [row.spuiItem] : []);
      return this.sortedData.filter((item, index) => this.selected.has(this.rowKey(item, index)));
    }
    private emitSelectionChange(): void {
      const detail = { selectedKeys: this.selectedKeys, selectionModel: this.selectionModel, selectedItems: this.selectedLoadedItems() };
      this.dataSourceSelectionCallback?.(detail.selectionModel, detail.selectedItems);
      this.dispatchEvent(new CustomEvent("spui-selection-change", { detail, bubbles: true, composed: true }));
    }
    private displayRows(): (DataGridDisplayRow | undefined)[] {
      if (this.source) {
        const length = Number.isFinite(this.source.length) ? Math.max(0, Math.floor(this.source.length)) : 0;
        if (!this.cachedDisplayRows || this.cachedDisplayRows.length !== length) this.cachedDisplayRows = new Array(length);
        return this.cachedDisplayRows;
      }
      const columnIds = this.orderedDefinitions.map(column => column.id).join("\u001f");
      const locale = this.lang || document.documentElement.lang;
      const groupSignature = `${this.groupBy}\u001f${this.getAttribute("empty-group-label") || "No value"}\u001f${locale}`;
      if (this.cachedDisplayRows && this.cachedSortedData === this.sortedData && this.cachedGroupBy === groupSignature && this.cachedColumnIds === columnIds && this.cachedCollapsedGroups === this.collapsedGroups) return this.cachedDisplayRows;
      const groups = groupDataGridItems(this.sortedData, this.orderedDefinitions, this.groupBy, locale, this.getAttribute("empty-group-label") || "No value");
      this.cachedDisplayRows = groups ? groups.flatMap(group => [{ kind: "group" as const, group }, ...(this.collapsedGroups.has(group.key) ? [] : group.items.map((item, offset) => ({ kind: "item" as const, item, itemIndex: group.indices[offset] })))]) : this.sortedData.map((item, itemIndex) => ({ kind: "item" as const, item, itemIndex }));
      this.cachedSortedData = this.sortedData; this.cachedGroupBy = groupSignature; this.cachedColumnIds = columnIds; this.cachedCollapsedGroups = this.collapsedGroups;
      return this.cachedDisplayRows;
    }
    private observeDataSource(): void {
      if (!this.source || this.sourceUnsubscribe) return;
      this.sourceUnsubscribe = this.source.subscribe?.(() => {
        this.completedSourceRange = ""; this.failedSourceRange = ""; this.cachedDisplayRows = undefined; this.paint(true);
      });
    }
    private requestDataRange(start: number, end: number): void {
      const source = this.source;
      if (!source || start >= end) return;
      let missingRange = false;
      for (let index = start; index < end; index++) if (getDataGridDataSourceRow(source, index) === undefined) { missingRange = true; break; }
      if (!missingRange) return;
      const key = `${start}:${end}`;
      if (this.failedSourceRange === key || this.completedSourceRange === key || this.sourceRequest?.key === key) return;
      this.sourceRequest?.controller.abort();
      const request = { key, controller: new AbortController() };
      this.sourceRequest = request;
      this.viewport?.setAttribute("aria-busy", "true");
      Promise.resolve().then(() => source.loadRange(start, end, request.controller.signal)).then(() => {
        if (this.sourceRequest !== request || request.controller.signal.aborted) return;
        let missing = false;
        for (let index = start; index < end; index++) if (getDataGridDataSourceRow(source, index) === undefined) { missing = true; break; }
        this.sourceRequest = undefined;
        if (missing) {
          this.failedSourceRange = key;
          const error = new Error("loadRange resolved before every requested row was available");
          if (this.reorderStatus) this.reorderStatus.textContent = this.localizedMessage("load-error-label", "Data could not be loaded: {message}", { message: error.message });
          this.viewport?.setAttribute("aria-busy", "false");
          this.dispatchEvent(new CustomEvent("spui-data-load-error", { detail: { error, start, end }, bubbles: true, composed: true }));
          return;
        }
        this.completedSourceRange = key; this.failedSourceRange = "";
        if (this.reorderStatus) this.reorderStatus.textContent = "";
        this.cachedDisplayRows = undefined; this.paint(true);
      }, error => {
        if (this.sourceRequest !== request || request.controller.signal.aborted) return;
        this.sourceRequest = undefined; this.failedSourceRange = key;
        if (this.reorderStatus) this.reorderStatus.textContent = this.localizedMessage("load-error-label", "Data could not be loaded: {message}", { message: error instanceof Error ? error.message : String(error) });
        this.viewport?.setAttribute("aria-busy", "false");
        this.dispatchEvent(new CustomEvent("spui-data-load-error", { detail: { error, start, end }, bubbles: true, composed: true }));
      });
    }
    private indexRowSizes(rows: ReturnType<SpuiDataGrid["displayRows"]>, estimate: number): VariableSizeIndex {
      if (this.heightRows !== rows || this.heightEstimate !== estimate || this.heightGetterAtIndex !== this.rowHeightGetter) {
        if (this.source) this.rowSizes.reset(rows.length, estimate);
        else {
          const sizes = rows.map(row => row?.kind === "item" ? clampDataGridRowHeight(this.rowHeightGetter?.(row.item, row.itemIndex), estimate) : estimate);
          this.rowSizes.reset(rows.length, estimate, sizes);
        }
        this.heightRows = rows; this.heightEstimate = estimate; this.heightGetterAtIndex = this.rowHeightGetter;
      }
      return this.rowSizes;
    }
    private rowKey(item: unknown, index: number): string { return String(this.keyOf?.(item, index) ?? (item as Record<string, unknown> | null)?.id ?? (item as Record<string, unknown> | null)?.Id ?? index); }
    private selectionMode(): "none" | "single" | "multiple" { const value = this.getAttribute("selection-mode"); return value === "single" ? "single" : value === "multiple" || value === "multiselect" ? "multiple" : "none"; }
    private get orderedDefinitions(): DataGridColumn[] {
      if (!this.currentColumnOrder.length) return this.definitions;
      const byId = new Map(this.definitions.map(column => [column.id, column]));
      const orderedIds = new Set(this.currentColumnOrder);
      return [...this.currentColumnOrder.flatMap(id => { const column = byId.get(id); return column ? [column] : []; }), ...this.definitions.filter(column => !orderedIds.has(column.id))];
    }
    private updateColumnWindow(): boolean {
      const next = this.virtualizeColumns && this.viewport && this.header
        ? getDataGridColumnWindow([...this.header.querySelectorAll<HTMLElement>("[data-column-index]")], this.viewport)
        : { start: 0, end: this.orderedDefinitions.length };
      if (next.start === this.columnWindow.start && next.end === this.columnWindow.end) return false;
      this.columnWindow = next;
      return true;
    }
    private normalizeColumnOrder(value: readonly string[]): string[] {
      const known = new Set(this.definitions.map(column => column.id));
      return [...new Set(value ?? [])].filter(id => known.has(id)).concat(this.definitions.filter(column => !value?.includes(column.id)).map(column => column.id));
    }

    private templateColumns(): string {
      return [...(this.selectionMode() === "none" ? [] : ["44px"]), ...this.orderedDefinitions.map((column, index) => {
        const sizing = getDataGridColumnSizing(column, this.sizingOptions);
        const configured = this.sizingOptions[column.id];
        const hasInitialWidth = configured?.defaultWidth !== undefined || configured?.idealWidth !== undefined;
        const isAutoFitLast = this.resizableColumns && this.autoFitColumns && index === this.orderedDefinitions.length - 1 && this.currentColumnWidths[column.id] === undefined;
        const fallback = isAutoFitLast ? `minmax(${sizing.minWidth}px, 1fr)` : hasInitialWidth ? `${sizing.defaultWidth}px` : column.width || "minmax(120px, 1fr)";
        return `var(${dataGridColumnVar(column.id)}, ${fallback})`;
      })].join(" ") || "minmax(0, 1fr)";
    }

    private renderHeader(): void {
      if (!this.header || !this.viewport) return;
      this.header.replaceChildren();
      const row = document.createElement("div");
      row.className = "row header-row";
      row.setAttribute("role", "row");
      row.setAttribute("aria-rowindex", "1");
      row.style.gridTemplateColumns = this.templateColumns();
      if (this.selectionMode() !== "none") {
        const cell = document.createElement("div");
        cell.className = "cell header-cell selection-cell";
        cell.setAttribute("role", "columnheader");
        if (this.selectionMode() === "multiple") {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.dataset.selectAll = "";
          checkbox.setAttribute("aria-label", this.getAttribute("select-all-label") || "Select all rows");
          cell.append(checkbox);
        }
        row.append(cell);
      }
      this.orderedDefinitions.forEach((column, index) => {
        const cell = document.createElement("div");
        cell.className = "cell header-cell";
        cell.setAttribute("role", "columnheader");
        cell.dataset.columnId = column.id;
        cell.dataset.columnIndex = String(index);
        cell.setAttribute("aria-colindex", String(index + (this.selectionMode() === "none" ? 1 : 2)));
        if (this.reorderableColumns) {
          const grip = document.createElement("button");
          grip.type = "button";
          grip.className = "reorder-handle";
          grip.dataset.reorderColumn = column.id;
          grip.draggable = true;
          grip.setAttribute("aria-label", `${this.getAttribute("reorder-label") || "Reorder column"} ${column.label}`);
          grip.title = `${this.getAttribute("reorder-label") || "Reorder column"} ${column.label}; use Alt+Shift+Arrow keys`;
          grip.textContent = "⠿";
          cell.append(grip);
        }
        if (column.sortable !== false) {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.sortColumn = column.id;
          button.append(document.createTextNode(column.label));
          const sortIndex = this.currentSorts.findIndex(entry => entry.columnId === column.id);
          if (sortIndex === 0) {
            cell.setAttribute("aria-sort", this.currentSorts[0].direction);
            const indicator = document.createElement("span");
            indicator.className = "sort-indicator";
            indicator.setAttribute("aria-hidden", "true");
            indicator.textContent = `${sortIndex + 1}${this.currentSorts[0].direction === "ascending" ? "▲" : "▼"}`;
            button.append(indicator);
          } else {
            cell.setAttribute("aria-sort", "none");
            if (sortIndex > 0) {
              const indicator = document.createElement("span");
              indicator.className = "sort-indicator";
              indicator.setAttribute("aria-hidden", "true");
              indicator.textContent = `${sortIndex + 1}${this.currentSorts[sortIndex].direction === "ascending" ? "▲" : "▼"}`;
              button.append(indicator);
            }
          }
          if (sortIndex >= 0) button.setAttribute("aria-label", `${column.label}, ${(this.getAttribute("sort-priority-label") || "Sort priority {priority}").replace("{priority}", String(sortIndex + 1))}`);
          cell.append(button);
        } else {
          const label = document.createElement("span");
          label.textContent = column.label;
          cell.append(label);
        }
        if (this.resizableColumns && column.resizable !== false) {
          cell.style.position = "relative";
          const separator = document.createElement("div");
          separator.className = "resize-handle";
          separator.dataset.resizeColumn = column.id;
          separator.setAttribute("role", "separator");
          separator.setAttribute("aria-orientation", "vertical");
          separator.tabIndex = 0;
          separator.setAttribute("aria-label", `${this.getAttribute("resize-label") || "Resize column"} ${column.label}`);
          separator.setAttribute("aria-valuemin", String(getDataGridColumnSizing(column, this.sizingOptions).minWidth));
          separator.setAttribute("aria-valuemax", String(column.maxWidth ?? 1600));
          separator.setAttribute("aria-valuenow", String(this.currentColumnWidths[column.id] ?? Math.round(cell.getBoundingClientRect().width)));
          cell.append(separator);
        }
        row.append(cell);
      });
      this.header.append(row);
      this.updateColumnWindow();
      this.header.querySelectorAll<HTMLElement>("[data-resize-column]").forEach(handle => {
        const id = handle.dataset.resizeColumn!;
        if (this.currentColumnWidths[id] === undefined) handle.setAttribute("aria-valuenow", String(Math.round(handle.parentElement!.getBoundingClientRect().width)));
      });
      this.viewport.setAttribute("aria-label", this.getAttribute("label") || this.getAttribute("aria-label") || "Data grid");
      this.viewport.setAttribute("aria-colcount", String(this.orderedDefinitions.length + (this.selectionMode() === "none" ? 0 : 1)));
    }

    private paint(force = false): void {
      if (!this.isConnected || !this.viewport || !this.body) return;
      const activeEditor = this.shadowRoot?.activeElement instanceof HTMLInputElement && (this.shadowRoot.activeElement as HTMLInputElement).classList.contains("cell-editor") ? this.shadowRoot.activeElement as HTMLInputElement : undefined;
      const selection = activeEditor ? [activeEditor.selectionStart, activeEditor.selectionEnd] as const : undefined;
      this.suppressEditorBlurCommit = Boolean(activeEditor);
      const items = this.visibleItems();
      const displayRows = this.displayRows();
      const rowHeight = this.positiveNumber(this.getAttribute("row-height"), 40);
      const rowSizes = this.indexRowSizes(displayRows, rowHeight);
      const overscanValue = Number(this.getAttribute("overscan"));
      const overscan = Number.isFinite(overscanValue) ? Math.max(0, Math.min(50, Math.floor(overscanValue))) : 4;
      const headerHeight = this.header?.offsetHeight || rowHeight;
      const scrollTop = Math.max(0, this.viewport.scrollTop - headerHeight);
      const viewportEnd = scrollTop + Math.max(0, this.viewport.clientHeight - headerHeight);
      const first = Math.max(0, rowSizes.indexAt(scrollTop) - overscan);
      const last = Math.min(displayRows.length, rowSizes.indexAt(viewportEnd) + overscan + 1);
      const itemCount = this.source ? Math.max(0, Math.floor(this.source.length)) : items.length;
      if (this.source) this.requestDataRange(first, last);
      this.viewport.setAttribute("aria-rowcount", String(displayRows.length + 1));
      this.viewport.setAttribute("data-item-count", String(itemCount));
      this.viewport.setAttribute("aria-busy", String(Boolean(this.sourceRequest)));
      this.viewport.tabIndex = itemCount ? -1 : 0;
      this.viewport.dataset.selectionAppearance = this.selectionAppearance;
      this.viewport.dataset.subtleSelection = String(this.subtleSelection);
      const orderedColumns = this.orderedDefinitions;
      const visibleColumns = this.virtualizeColumns ? orderedColumns.slice(this.columnWindow.start, this.columnWindow.end) : orderedColumns;
      const columnTemplate = this.templateColumns();
      for (const [index, row] of this.rows) if (index < first || index >= last) {
        row.remove(); this.rows.delete(index); this.pool.push(row);
      }
      const fragment = document.createDocumentFragment();
      if (!itemCount) {
        const empty = document.createElement("div"); empty.className = "empty"; empty.setAttribute("role", "row"); empty.textContent = this.currentFilterValue.trim() ? this.getAttribute("no-results-label") || "No results" : this.getAttribute("empty-label") || "No items"; fragment.append(empty);
      } else {
        const spacer = document.createElement("div"); spacer.setAttribute("role", "presentation"); spacer.setAttribute("aria-hidden", "true"); spacer.style.height = "0px"; fragment.append(spacer);
        for (let index = first; index < last; index++) {
          let display = displayRows[index];
          if (this.source) {
            const sourceRow = getDataGridDataSourceRow(this.source, index);
            display = sourceRow?.kind === "group"
              ? { kind: "group", group: { key: sourceRow.key, label: sourceRow.label, value: undefined, items: [], indices: [] }, sourceGroup: { count: sourceRow.count, expanded: sourceRow.expanded } }
              : sourceRow?.kind === "item" ? { kind: "item", item: sourceRow.item, itemIndex: sourceRow.itemIndex ?? index, rowKey: sourceRow.rowId === undefined ? undefined : String(sourceRow.rowId) } : undefined;
            displayRows[index] = display;
          }
          const item = display?.kind === "item" ? display.item : undefined;
          const itemIndex = display?.kind === "item" ? display.itemIndex : -1;
          const key = display?.kind === "item" ? display.rowKey ?? this.rowKey(item, itemIndex) : display?.kind === "group" ? display.group.key : `loading-${index}`;
          let row = this.rows.get(index);
          if (!row) { row = (this.pool.pop() ?? Object.assign(document.createElement("div"), { className: "row data-row" })) as GridRow; row.setAttribute("role", "row"); this.rows.set(index, row); }
          const typeChanged = row.spuiType !== (display?.kind ?? "loading");
          row.dataset.rowIndex = String(index); row.dataset.rowKey = key; row.spuiType = display?.kind ?? "loading"; row.setAttribute("aria-rowindex", String(index + 2));
          row.tabIndex = display?.kind === "item" && (this.focusMode === "row_unstable" || this.focusMode === "composite") && index === this.activeCell.row ? 0 : -1;
          const selected = display?.kind === "item" && this.isRowSelected(key);
          if (this.selectionMode() !== "none") row.setAttribute("aria-selected", String(selected)); else row.removeAttribute("aria-selected");
          row.style.height = `${rowSizes.size(index)}px`; row.style.gridTemplateColumns = columnTemplate; row.style.transform = `translateY(${rowSizes.offset(index)}px)`;
          if (display?.kind === "group") {
            row.dataset.groupKey = key;
            const collapsed = display.sourceGroup ? !display.sourceGroup.expanded : this.collapsedGroups.has(key);
            if (force || typeChanged || row.spuiKey !== key) {
              row.replaceChildren(); row.removeAttribute("aria-selected"); row.classList.add("group-row");
              const cell = document.createElement("div"); cell.className = "cell group-cell"; cell.setAttribute("role", "rowheader"); cell.setAttribute("aria-colspan", String(orderedColumns.length + (this.selectionMode() === "none" ? 0 : 1))); cell.style.gridColumn = "1 / -1";
              const groupCount = display.sourceGroup?.count ?? display.group.items.length;
              const button = document.createElement("button"); button.type = "button"; button.dataset.groupToggle = key; button.setAttribute("aria-expanded", String(!collapsed)); button.setAttribute("aria-label", `${collapsed ? this.getAttribute("expand-group-label") || "Expand group" : this.getAttribute("collapse-group-label") || "Collapse group"} ${display.group.label}, ${groupCount}`);
              button.append(document.createTextNode(`${collapsed ? "›" : "⌄"} ${display.group.label} `)); const count = document.createElement("span"); count.textContent = String(groupCount); button.append(count); cell.append(button); row.append(cell);
              row.spuiItem = undefined; row.spuiKey = key;
            }
            fragment.append(row); continue;
          }
          if (!display) {
            row.removeAttribute("aria-selected"); row.setAttribute("aria-busy", "true"); row.setAttribute("aria-label", `${this.getAttribute("loading-label") || "Loading row"} ${index + 1}`); row.classList.add("loading-row");
            if (force || typeChanged || row.spuiKey !== key) {
              row.replaceChildren();
              const loadingCell = document.createElement("div"); loadingCell.className = "cell"; loadingCell.setAttribute("role", "gridcell"); loadingCell.setAttribute("aria-colspan", String(orderedColumns.length + (this.selectionMode() === "none" ? 0 : 1))); loadingCell.style.gridColumn = "1 / -1";
              const loadingText = document.createElement("span"); loadingText.textContent = this.getAttribute("loading-label") || "Loading…"; loadingCell.append(loadingText); row.append(loadingCell); row.spuiItem = undefined; row.spuiKey = key;
            }
            fragment.append(row); continue;
          }
          row.removeAttribute("aria-busy"); row.removeAttribute("aria-label"); row.classList.remove("loading-row");
          delete row.dataset.groupKey;
          row.classList.remove("group-row");
          if (force || typeChanged || row.spuiItem !== item || row.spuiKey !== key) {
            row.replaceChildren();
            if (this.selectionMode() !== "none") {
              const cell = document.createElement("div"); cell.className = "cell selection-cell"; cell.setAttribute("role", "gridcell"); cell.setAttribute("aria-colindex", "1"); cell.dataset.colIndex = "-1";
              const checkbox = document.createElement("input"); checkbox.type = this.selectionMode() === "single" ? "radio" : "checkbox"; if (checkbox.type === "radio") checkbox.name = this.selectionName; checkbox.checked = selected; checkbox.dataset.rowSelect = key;
              checkbox.setAttribute("aria-label", `${this.getAttribute("select-label") || "Select row"} ${itemIndex + 1}`); cell.append(checkbox); row.append(cell);
            }
            visibleColumns.forEach((column, visibleIndex) => {
              const columnIndex = this.virtualizeColumns ? this.columnWindow.start + visibleIndex : visibleIndex;
              const cell = document.createElement("div"); cell.className = "cell"; cell.setAttribute("role", "gridcell");
              cell.setAttribute("aria-colindex", String(columnIndex + (this.selectionMode() === "none" ? 1 : 2)));
              cell.dataset.colIndex = String(columnIndex); cell.dataset.colId = column.id; cell.tabIndex = (this.focusMode === "cell" || this.focusMode === "composite") && this.activeCell.row === index && this.activeCell.column === columnIndex ? 0 : -1;
              cell.style.gridColumn = String(columnIndex + (this.selectionMode() === "none" ? 1 : 2));
              cell.dataset.rowId = key;
              const isEditing = this.editingCell?.rowId === key && this.editingCell.columnId === column.id && column.editable === true;
              if (isEditing) {
                const input = document.createElement("input"); input.type = column.editType || "text"; input.className = "cell-editor"; input.dataset.testid = "spui-data-grid-editor"; input.value = this.editingCell!.draft; input.disabled = Boolean(this.editingCell!.saving); input.setAttribute("aria-label", `${column.label}, ${this.getAttribute("row-label") || "row"} ${itemIndex + 1}`);
                input.setAttribute("aria-invalid", String(Boolean(this.editingCell!.error)));
                if (this.editingCell!.error) { const errorId = `spui-grid-edit-error-${CSS.escape(key)}-${CSS.escape(column.id)}`; input.setAttribute("aria-describedby", errorId); const error = document.createElement("span"); error.id = errorId; error.className = "edit-error"; error.setAttribute("role", "alert"); error.textContent = this.editingCell!.error; cell.append(error); }
                input.addEventListener("input", () => { if (this.editingCell) this.editingCell.draft = input.value; });
                input.addEventListener("keydown", event => { event.stopPropagation(); if (event.key === "Escape") { event.preventDefault(); this.cancelCellEdit(key, column.id); } else if (event.key === "Enter") { event.preventDefault(); void this.commitCellEdit(key, column, item, input.value); } });
                input.addEventListener("blur", () => { if (!this.suppressEditorBlurCommit && this.editingCell?.rowId === key && this.editingCell.columnId === column.id && !this.editingCell.saving) void this.commitCellEdit(key, column, item, input.value); });
                cell.append(input);
              } else {
                const editKey = this.editKey(key, column.id);
                const result = this.editedValues.has(editKey) ? this.editedValues.get(editKey) : this.renderer?.(item, column, itemIndex) ?? getDataGridCellValue(item, column) as Node | string | number | null ?? "";
                if (result instanceof Node) cell.append(result); else cell.textContent = String(result ?? "");
                if (column.editable) { cell.title = this.getAttribute("edit-hint") || "Press Enter or F2 to edit"; cell.setAttribute("aria-keyshortcuts", "Enter F2"); }
              }
              row.append(cell);
            });
            row.spuiItem = item; row.spuiKey = key; row.spuiType = "item";
          } else if (this.selectionMode() !== "none") {
            const checkbox = row.querySelector<HTMLInputElement>("[data-row-select]"); if (checkbox) checkbox.checked = selected;
          }
          row.querySelectorAll<HTMLElement>("[data-col-index]").forEach(cell => { cell.tabIndex = (this.focusMode === "cell" || this.focusMode === "composite") && this.activeCell.row === index && this.activeCell.column === Number(cell.dataset.colIndex) ? 0 : -1; });
          fragment.append(row);
        }
      }
      const bottom = document.createElement("div"); bottom.setAttribute("role", "presentation"); bottom.setAttribute("aria-hidden", "true"); bottom.style.height = `${rowSizes.totalSize}px`; fragment.append(bottom);
      this.body.replaceChildren(fragment);
      this.suppressEditorBlurCommit = false;
      const pendingBoundary = this.pendingBoundaryFocus;
      if (pendingBoundary) {
        const row = this.rows.get(pendingBoundary.row);
        if (row && row.getAttribute("aria-busy") !== "true") {
          const cell = row.querySelector<HTMLElement>(`[role="gridcell"][data-col-index="${pendingBoundary.column}"]`);
          if (cell && !pendingBoundary.scheduled) {
            pendingBoundary.scheduled = true;
            requestAnimationFrame(() => requestAnimationFrame(() => {
              if (this.pendingBoundaryFocus !== pendingBoundary) return;
              const currentRow = this.rows.get(pendingBoundary.row);
              const currentCell = currentRow?.querySelector<HTMLElement>(`[role="gridcell"][data-col-index="${pendingBoundary.column}"]`);
              if (!currentRow || !currentCell || currentRow.getAttribute("aria-busy") === "true") { pendingBoundary.scheduled = false; return; }
              const target = this.focusMode === "row_unstable" ? currentRow : currentCell.querySelector<HTMLElement>("button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]") ?? currentCell;
              target.focus();
              pendingBoundary.attempts++;
              const active = this.shadowRoot?.activeElement;
              if (active && currentRow.contains(active)) this.pendingBoundaryFocus = undefined;
              else if (pendingBoundary.attempts >= 3) this.pendingBoundaryFocus = undefined;
              else { pendingBoundary.scheduled = false; this.paint(); }
            }));
          }
        }
      }
      if (activeEditor) {
        const currentEditor = activeEditor.isConnected ? activeEditor : this.rows.get(this.activeCell.row)?.querySelector<HTMLInputElement>(".cell-editor");
        if (currentEditor) { currentEditor.focus(); if (selection && selection[0] !== null && selection[1] !== null) currentEditor.setSelectionRange(selection[0] ?? currentEditor.value.length, selection[1] ?? currentEditor.value.length); }
      }
      const selectAll = this.header?.querySelector<HTMLInputElement>("[data-select-all]");
      if (selectAll && force) {
        if (this.source) {
          const hasRows = this.sourceSelectableCount > 0;
          selectAll.disabled = !hasRows;
          const activeAll = this.sourceSelectionActive();
          const partial = activeAll ? this.sourceExcludedKeys.size > 0 : !this.sourceAllSelected && this.selected.size > 0;
          selectAll.checked = hasRows && activeAll && !partial;
          selectAll.indeterminate = hasRows && partial;
        } else {
          selectAll.disabled = items.length === 0;
          const selectedCount = items.reduce<number>((count, item, index) => count + Number(this.selected.has(this.rowKey(item, index))), 0);
          selectAll.checked = items.length > 0 && selectedCount === items.length;
          selectAll.indeterminate = selectedCount > 0 && selectedCount < items.length;
        }
      }
    }

    private onGridClick(event: Event): void {
      const target = event.target as HTMLElement;
      const groupToggle = target.closest<HTMLButtonElement>("button[data-group-toggle]");
      if (groupToggle) {
        const key = groupToggle.dataset.groupToggle!;
        const rowIndex = Number(groupToggle.closest<HTMLElement>("[data-row-index]")?.dataset.rowIndex);
        const display = this.displayRows()[rowIndex];
        if (this.source && display?.kind === "group" && display.sourceGroup) {
          const expanded = !display.sourceGroup.expanded;
          this.dataSourceGroupToggleCallback?.(key, expanded);
          this.dispatchEvent(new CustomEvent("spui-data-source-group-toggle", { detail: { groupKey: key, expanded }, bubbles: true, composed: true }));
          requestAnimationFrame(() => this.viewport?.querySelector<HTMLButtonElement>(`[data-group-toggle="${CSS.escape(key)}"]`)?.focus());
          return;
        }
        const next = new Set(this.collapsedGroups);
        if (next.has(key)) next.delete(key); else next.add(key);
        this.collapsedGroups = next;
        this.paint(true);
        this.dispatchEvent(new CustomEvent("spui-group-state-change", { detail: { collapsedGroupKeys: this.collapsedGroupKeys }, bubbles: true, composed: true }));
        requestAnimationFrame(() => this.viewport?.querySelector<HTMLButtonElement>(`[data-group-toggle="${CSS.escape(key)}"]`)?.focus());
        return;
      }
      const sortButton = target.closest<HTMLButtonElement>("button[data-sort-column]");
      if (sortButton) {
        const columnId = sortButton.dataset.sortColumn!;
        const next = [...this.currentSorts];
        const index = next.findIndex(entry => entry.columnId === columnId);
        const additive = (event as MouseEvent).shiftKey;
        if (!additive) {
          const direction: DataGridSortDirection = index === 0 && next[0].direction === "ascending" ? "descending" : "ascending";
          this.currentSorts = index === 0 && next[0].direction === "descending" ? [] : [{ columnId, direction }];
        } else if (index < 0) next.push({ columnId, direction: "ascending" });
        else if (next[index].direction === "ascending") next[index] = { columnId, direction: "descending" };
        else next.splice(index, 1);
        if (additive) this.currentSorts = next;
        this.currentSort = this.currentSorts[0];
        this.recomputeSort();
        this.renderHeader(); this.paint(true);
        this.header?.querySelector<HTMLButtonElement>(`[data-sort-column="${CSS.escape(columnId)}"]`)?.focus();
        this.dispatchEvent(new CustomEvent("spui-sort-change", { detail: { sort: this.currentSort, sorts: this.sorts }, bubbles: true, composed: true }));
        return;
      }
      const row = target.closest<HTMLElement>(".data-row[data-row-index]");
      if (row && this.selectionMode() !== "none") { this.toggleRowSelection(row.dataset.rowKey || ""); return; }
      const checkbox = target.closest<HTMLInputElement>("input[data-select-all],input[data-row-select]");
      if (!checkbox) return;
      const items = this.visibleItems();
      if (checkbox.hasAttribute("data-select-all")) {
        if (this.source) {
          this.sourceAllSelected = checkbox.checked && this.sourceSelectableCount > 0;
          this.sourceAllSelectedScope = this.sourceAllSelected ? this.source?.selectionScopeKey : undefined;
          this.sourceExcludedKeys.clear();
          this.selected.clear();
        } else {
          const allKeys = items.map((item, index) => this.rowKey(item, index));
          this.selected = checkbox.checked ? new Set(allKeys) : new Set();
        }
      } else {
        const key = checkbox.dataset.rowSelect; if (!key) return;
        if (this.source && this.sourceSelectionActive()) {
          if (checkbox.checked) this.sourceExcludedKeys.delete(key); else this.sourceExcludedKeys.add(key);
        } else {
          if (this.source && this.sourceAllSelected) { this.sourceAllSelected = false; this.sourceAllSelectedScope = undefined; this.sourceExcludedKeys.clear(); }
          if (this.selectionMode() === "single") this.selected.clear();
          if (checkbox.checked) this.selected.add(key); else this.selected.delete(key);
        }
      }
      this.paint(true);
      this.emitSelectionChange();
    }

    private toggleRowSelection(key: string): void {
      if (!key || this.selectionMode() === "none") return;
      const selected = this.isRowSelected(key);
      if (this.source && this.sourceSelectionActive()) {
        if (selected) this.sourceExcludedKeys.add(key); else this.sourceExcludedKeys.delete(key);
      } else if (this.source && this.sourceAllSelected) { this.sourceAllSelected = false; this.sourceAllSelectedScope = undefined; this.sourceExcludedKeys.clear(); this.selected.add(key); }
      else if (this.selectionMode() === "single") { if (selected) this.selected.delete(key); else { this.selected.clear(); this.selected.add(key); } }
      else if (selected) this.selected.delete(key); else this.selected.add(key);
      this.paint(true);
      this.emitSelectionChange();
    }

    private editKey(rowId: string, columnId: string): string { return JSON.stringify([rowId, columnId]); }

    private beginCellEdit(cell: HTMLElement | null): void {
      if (!cell || !this.viewport) return;
      const rowIndex = Number(cell.closest<HTMLElement>("[data-row-index]")?.dataset.rowIndex);
      const columnIndex = Number(cell.dataset.colIndex);
      const display = this.displayRows()[rowIndex];
      const column = this.orderedDefinitions[columnIndex];
      if (!display || display.kind !== "item" || !column?.editable) return;
      const rowId = display.rowKey ?? this.rowKey(display.item, display.itemIndex);
      const key = this.editKey(rowId, column.id);
      const current = this.editedValues.has(key) ? this.editedValues.get(key) : getDataGridCellValue(display.item, column);
      this.activeCell = { row: rowIndex, column: columnIndex };
      this.editingCell = { rowId, columnId: column.id, draft: toDataGridInputValue(current, column.editType) };
      this.paint(true);
      requestAnimationFrame(() => this.rows.get(rowIndex)?.querySelector<HTMLInputElement>(".cell-editor")?.focus());
    }

    private cancelCellEdit(rowId: string, columnId: string): void {
      const editing = this.editingCell;
      if (!editing || editing.rowId !== rowId || editing.columnId !== columnId || editing.saving) return;
      this.editingCell = undefined;
      this.paint(true);
      requestAnimationFrame(() => this.viewport?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(rowId)}"][data-col-index="${this.orderedDefinitions.findIndex(column => column.id === columnId)}"]`)?.focus());
    }

    private async commitCellEdit(rowId: string, column: DataGridColumn, item: unknown, draft: string): Promise<void> {
      const editing = this.editingCell;
      if (!editing || editing.rowId !== rowId || editing.columnId !== column.id || editing.saving) return;
      const value = parseDataGridInputValue(draft, column.editType);
      const edit: DataGridCellEdit = { item, rowId, columnId: column.id, previousValue: getDataGridCellValue(item, column), value };
      let error: string | undefined;
      try { error = this.editValidator?.(edit); } catch (reason) { error = reason instanceof Error ? reason.message : String(reason); }
      if (error) { editing.draft = draft; editing.error = error; this.showEditError(editing); return; }
      editing.saving = true;
      const input = this.rows.get(this.activeCell.row)?.querySelector<HTMLInputElement>(".cell-editor");
      if (input) { input.disabled = true; input.setAttribute("aria-busy", "true"); }
      try {
        await this.editCallback?.(edit);
        this.editedValues.set(this.editKey(rowId, column.id), value);
        this.editingCell = undefined;
        this.dispatchEvent(new CustomEvent<DataGridCellEdit>("spui-cell-edit", { detail: edit, bubbles: true, composed: true }));
        const columnIndex = this.orderedDefinitions.findIndex(candidate => candidate.id === column.id);
        this.paint(true);
        requestAnimationFrame(() => this.viewport?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(rowId)}"][data-col-index="${columnIndex}"]`)?.focus());
      } catch (reason) {
        editing.saving = false;
        editing.error = reason instanceof Error ? reason.message : String(reason || this.getAttribute("edit-error-label") || "The value could not be saved.");
        if (input) { input.disabled = false; input.removeAttribute("aria-busy"); }
        this.showEditError(editing);
      }
    }

    private showEditError(editing: NonNullable<typeof this.editingCell>): void {
      const cell = this.viewport?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(editing.rowId)}"][data-col-index="${this.orderedDefinitions.findIndex(column => column.id === editing.columnId)}"]`);
      const input = cell?.querySelector<HTMLInputElement>(".cell-editor");
      if (!cell || !input) return;
      cell.style.position = "relative";
      const errorId = `spui-grid-edit-error-${CSS.escape(editing.rowId)}-${CSS.escape(editing.columnId)}`;
      input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", errorId);
      let error = cell.querySelector<HTMLElement>(".edit-error");
      if (!error) { error = document.createElement("span"); error.id = errorId; error.className = "edit-error"; error.setAttribute("role", "alert"); cell.append(error); }
      error.textContent = editing.error || this.getAttribute("edit-error-label") || "The value could not be saved.";
      requestAnimationFrame(() => input.focus());
    }

    private currentEditValue(item: unknown, rowId: string, column: DataGridColumn): unknown {
      const key = this.editKey(rowId, column.id);
      return this.editedValues.has(key) ? this.editedValues.get(key) : getDataGridCellValue(item, column);
    }
    private onGridCopy(event: ClipboardEvent): void {
      if (!event.clipboardData || (event.target as HTMLElement).closest(".cell-editor")) return;
      const selectedItems = (this.source ? [...this.rows.entries()].flatMap(([index, row]) => row.spuiItem === undefined ? [] : [{ item: row.spuiItem, index, key: row.spuiKey || this.rowKey(row.spuiItem, index) }]) : this.sortedData.map((item, index) => ({ item, index, key: this.rowKey(item, index) }))).filter(({ key }) => this.isRowSelected(key));
      const cell = (event.target as HTMLElement).closest<HTMLElement>("[role=gridcell][data-col-index]");
      let values: unknown[][];
      if (selectedItems.length) {
        values = selectedItems.map(({ item, key }) => {
          const rowId = key;
          return this.orderedDefinitions.map(column => this.currentEditValue(item, rowId, column));
        });
      } else if (cell) {
        const rowIndex = Number(cell.closest<HTMLElement>("[data-row-index]")?.dataset.rowIndex);
        const sourceRow = this.source ? getDataGridDataSourceRow(this.source, rowIndex) : undefined;
        const display = this.source ? sourceRow?.kind === "item" ? { kind: "item" as const, item: sourceRow.item, itemIndex: sourceRow.itemIndex ?? rowIndex, rowKey: sourceRow.rowId === undefined ? undefined : String(sourceRow.rowId) } : undefined : this.displayRows()[rowIndex];
        const column = this.orderedDefinitions[Number(cell.dataset.colIndex)];
        if (!display || display.kind !== "item" || !column) return;
        values = [[this.currentEditValue(display.item, display.rowKey ?? this.rowKey(display.item, display.itemIndex), column)]];
      } else return;
      event.preventDefault();
      event.clipboardData.setData("text/plain", formatDataGridClipboard(values));
    }
    private copySourceSelection(): void {
      const source = this.source;
      if (!source?.copySelection) return;
      const selectionScopeKey = source.selectionScopeKey;
      const controller = new AbortController();
      this.clipboardController?.abort(); this.clipboardController = controller;
      const text = Promise.resolve().then(() => source.copySelection!(this.selectionModel, this.orderedDefinitions.map(({ id, label }) => ({ id, label })), controller.signal)).then(value => {
        if (controller.signal.aborted || this.source !== source) throw new DOMException("Clipboard operation cancelled", "AbortError");
        if (source.selectionScopeKey !== selectionScopeKey) throw new Error("The data query changed before copying completed.");
        if (value.length > 1_000_000) throw new Error("Copy is limited to 1,000,000 characters.");
        return value;
      });
      void writeDataGridClipboardText(text).then(() => {
        if (this.clipboardController === controller && this.reorderStatus) this.reorderStatus.textContent = this.localizedMessage("selection-copied-label", "Selection copied.");
      }, reason => {
        if (controller.signal.aborted) return;
        const message = reason instanceof Error ? reason.message : String(reason);
        if (this.reorderStatus) this.reorderStatus.textContent = this.localizedMessage("copy-failed-label", "Copy failed. {message}", { message });
        this.dispatchEvent(new CustomEvent("spui-clipboard-error", { detail: { operation: "copy", message }, bubbles: true, composed: true }));
      });
    }
    private async onGridPaste(event: ClipboardEvent): Promise<void> {
      if ((event.target as HTMLElement).closest(".cell-editor")) return;
      const cell = (event.target as HTMLElement).closest<HTMLElement>("[role=gridcell][data-col-index]");
      const text = event.clipboardData?.getData("text/plain");
      if (!cell || text === undefined || !this.viewport) return;
      event.preventDefault();
      const edits: DataGridCellEdit[] = [];
      try {
        const matrix = parseDataGridClipboard(text);
        const cellCount = matrix.reduce((total, row) => total + row.length, 0);
        if (cellCount > 1000) throw new Error("Paste is limited to 1,000 cells at a time.");
        const startRow = Number(cell.closest<HTMLElement>("[data-row-index]")?.dataset.rowIndex);
        const startColumn = Number(cell.dataset.colIndex);
        if (startColumn < 0) throw new Error("Paste into a data cell, not the row selection control.");
        const source = this.source;
        const selectionScopeKey = source?.selectionScopeKey;
        const controller = new AbortController();
        this.clipboardController?.abort(); this.clipboardController = controller;
        if (source) {
          const endRow = startRow + matrix.length;
          if (startRow < 0 || endRow > source.length) throw new Error("The pasted data extends past the last row.");
          let missing = false;
          for (let index = startRow; index < endRow; index++) if (getDataGridDataSourceRow(source, index) === undefined) { missing = true; break; }
          if (missing) await source.loadRange(startRow, endRow, controller.signal);
          if (controller.signal.aborted) return;
          if (this.source !== source || source.selectionScopeKey !== selectionScopeKey) throw new Error("The data query changed before paste completed.");
          for (let index = startRow; index < endRow; index++) if (getDataGridDataSourceRow(source, index) === undefined) throw new Error("The data source did not provide every destination row.");
          this.completedSourceRange = ""; this.cachedDisplayRows = undefined; this.paint(true);
        }
        const rows = this.source
          ? Array.from({ length: matrix.length }, (_, offset) => { const sourceRow = getDataGridDataSourceRow(this.source!, startRow + offset); return sourceRow?.kind === "item" ? { kind: "item" as const, item: sourceRow.item, itemIndex: sourceRow.itemIndex ?? startRow + offset, rowKey: sourceRow.rowId === undefined ? undefined : String(sourceRow.rowId) } : undefined; })
          : this.displayRows().slice(startRow).filter((row): row is Extract<DataGridDisplayRow, { kind: "item" }> => row?.kind === "item");
        for (let rowOffset = 0; rowOffset < matrix.length; rowOffset++) {
          const target = rows[rowOffset];
          if (!target || target.kind !== "item") throw new Error(this.source ? "Load the destination rows before pasting." : "The pasted data extends past the last row.");
          const rowId = target.rowKey ?? this.rowKey(target.item, target.itemIndex);
          for (let columnOffset = 0; columnOffset < matrix[rowOffset].length; columnOffset++) {
            const column = this.orderedDefinitions[startColumn + columnOffset];
            if (!column) throw new Error("The pasted data extends past the last column.");
            if (!column.editable) throw new Error(`${column.label} cannot be edited.`);
            const value = parseDataGridClipboardValue(matrix[rowOffset][columnOffset], column.editType);
            const edit: DataGridCellEdit = { item: target.item, rowId, columnId: column.id, previousValue: this.currentEditValue(target.item, rowId, column), value };
            const validation = this.editValidator?.(edit);
            if (validation) throw new Error(validation);
            edits.push(edit);
          }
        }
        if (edits.length > 1) {
          if (!this.cellsEditCallback) throw new Error("Provide onCellsEdit to persist a multi-cell paste atomically.");
          await this.cellsEditCallback(edits);
          for (const edit of edits) this.editedValues.set(this.editKey(edit.rowId, edit.columnId), edit.value);
          this.dispatchEvent(new CustomEvent("spui-cells-edit", { detail: { edits }, bubbles: true, composed: true }));
        } else if (edits.length === 1) {
          const edit = edits[0];
          await this.editCallback?.(edit);
          this.editedValues.set(this.editKey(edit.rowId, edit.columnId), edit.value);
          this.dispatchEvent(new CustomEvent<DataGridCellEdit>("spui-cell-edit", { detail: edit, bubbles: true, composed: true }));
        }
        if (this.reorderStatus) this.reorderStatus.textContent = this.localizedMessage(edits.length === 1 ? "paste-one-label" : "paste-many-label", edits.length === 1 ? "Pasted {count} cell." : "Pasted {count} cells.", { count: String(edits.length) });
        this.paint(true);
      } catch (reason) {
        if (this.clipboardController?.signal.aborted) return;
        const message = reason instanceof Error ? reason.message : String(reason);
        if (this.reorderStatus) this.reorderStatus.textContent = this.localizedMessage("paste-failed-label", "Paste failed. {message}", { message });
        this.dispatchEvent(new CustomEvent("spui-cells-edit-error", { detail: { message, edits }, bubbles: true, composed: true }));
      }
    }
    private onGridKeyDown(event: KeyboardEvent): void {
      if (event.ctrlKey && (event.key === "Home" || event.key === "End")) {
        event.preventDefault();
        if (event.key === "Home") {
          const first = this.header?.querySelector<HTMLElement>(".header-row input:not([disabled]),.header-row button:not([disabled]),.header-row [tabindex='0']");
          first?.focus();
          return;
        }
        const rows = this.displayRows();
        if (!rows.length || !this.orderedDefinitions.length || !this.viewport) return;
        let rowIndex = rows.length - 1;
        if (!this.source) while (rowIndex >= 0 && rows[rowIndex]?.kind !== "item") rowIndex--;
        if (rowIndex < 0) return;
        const columnIndex = this.orderedDefinitions.length - 1;
        this.activeCell = { row: rowIndex, column: columnIndex };
        this.pendingBoundaryFocus = { row: rowIndex, column: columnIndex, attempts: 0, scheduled: false };
        if (this.virtualizeColumns && columnIndex >= this.columnWindow.end) {
          this.columnWindow = { start: Math.max(0, columnIndex - 8), end: columnIndex + 1 };
          this.viewport.scrollLeft = this.viewport.scrollWidth;
          this.columnWindowChanged = true;
        }
        const sizes = this.indexRowSizes(rows, this.positiveNumber(this.getAttribute("row-height"), 40));
        this.viewport.scrollTop = (this.header?.offsetHeight || 40) + sizes.offset(rowIndex);
        this.paint(true);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && !((event.target as HTMLElement).closest(".cell-editor"))) {
        const selection = this.selectionModel;
        if (this.source?.copySelection && (this.sourceSelectionActive() || selection.mode === "explicit" && selection.keys.length > 0)) { event.preventDefault(); this.copySourceSelection(); return; }
      }
      const reorderHandle = (event.target as HTMLElement).closest<HTMLElement>("[data-reorder-column]");
      if (reorderHandle && this.reorderableColumns && event.altKey && event.shiftKey && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
        const columns = this.orderedDefinitions;
        const currentIndex = columns.findIndex(column => column.id === reorderHandle.dataset.reorderColumn);
        const rtl = getComputedStyle(this).direction === "rtl";
        const nextIndex = currentIndex + (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
        if (currentIndex >= 0 && nextIndex >= 0 && nextIndex < columns.length) {
          event.preventDefault();
          this.moveColumn(columns[currentIndex].id, columns[nextIndex].id, nextIndex > currentIndex);
          requestAnimationFrame(() => this.header?.querySelector<HTMLElement>(`[data-reorder-column="${CSS.escape(columns[currentIndex].id)}"]`)?.focus());
        }
        return;
      }
      const handle = (event.target as HTMLElement).closest<HTMLElement>("[data-resize-column]");
      if (handle) {
        this.onResizeKeyDown(event, handle);
        return;
      }
      const selectionRow = (event.target as HTMLElement).closest<HTMLElement>(".data-row[data-row-index]");
      if (event.key === " " && selectionRow && this.selectionMode() !== "none" && !(event.target as HTMLElement).closest("button,input,select,textarea,a,[contenteditable=true]")) { event.preventDefault(); this.toggleRowSelection(selectionRow.dataset.rowKey || ""); return; }
      const focusMode = this.focusMode;
      if (focusMode === "none") return;
      const rowElement = (event.target as HTMLElement).closest<HTMLElement>("[role=row][data-row-index]");
      if (rowElement && (focusMode === "row_unstable" || focusMode === "composite") && event.target === rowElement) {
        if (focusMode === "composite" && event.key === "ArrowRight") {
          const firstFocusable = rowElement.querySelector<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"][role="gridcell"]');
          if (firstFocusable) { event.preventDefault(); firstFocusable.focus(); }
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const rows = this.displayRows(); let next = Number(rowElement.dataset.rowIndex) + (event.key === "ArrowDown" ? 1 : -1);
          while (!this.source && next >= 0 && next < rows.length && rows[next]?.kind !== "item") next += event.key === "ArrowDown" ? 1 : -1;
          if (next >= 0 && next < rows.length) { event.preventDefault(); this.activeCell = { ...this.activeCell, row: next }; this.viewport?.scrollTo({ top: this.indexRowSizes(rows, this.positiveNumber(this.getAttribute("row-height"), 40)).offset(next), behavior: "auto" }); this.paint(); requestAnimationFrame(() => this.rows.get(next)?.focus()); }
          return;
        }
      }
      const cell = (event.target as HTMLElement).closest<HTMLElement>("[role=gridcell][data-col-index]");
      if (!cell || !this.viewport) return;
      if (focusMode === "composite") {
        if (event.key === "ArrowLeft") { const row = cell.closest<HTMLElement>("[role=row][data-row-index]"); if (row) { event.preventDefault(); row.focus(); } }
        else if (event.key === "ArrowDown" || event.key === "ArrowUp") { const row = Number(cell.closest<HTMLElement>("[data-row-index]")?.dataset.rowIndex); const rows = this.displayRows(); let next = row + (event.key === "ArrowDown" ? 1 : -1); while (!this.source && next >= 0 && next < rows.length && rows[next]?.kind !== "item") next += event.key === "ArrowDown" ? 1 : -1; if (next >= 0 && next < rows.length) { event.preventDefault(); this.activeCell = { ...this.activeCell, row: next }; this.viewport.scrollTo({ top: this.indexRowSizes(rows, this.positiveNumber(this.getAttribute("row-height"), 40)).offset(next), behavior: "auto" }); this.paint(); requestAnimationFrame(() => this.rows.get(next)?.focus()); } }
        return;
      }
      if ((event.key === "Enter" || event.key === "F2") && cell.dataset.colIndex !== "-1") { event.preventDefault(); this.beginCellEdit(cell); return; }
      const row = Number(cell.closest<HTMLElement>("[data-row-index]")?.dataset.rowIndex);
      const column = Number(cell.dataset.colIndex);
      let nextRow = row, nextColumn = column;
      const displayRows = this.displayRows();
      if (event.key === "ArrowDown") { let next = nextRow + 1; while (!this.source && next < displayRows.length && displayRows[next]?.kind !== "item") next++; if (next < displayRows.length) nextRow = next; }
      else if (event.key === "ArrowUp") { let next = nextRow - 1; while (!this.source && next >= 0 && displayRows[next]?.kind !== "item") next--; if (next >= 0) nextRow = next; }
      else if (event.key === "ArrowRight") nextColumn++;
      else if (event.key === "ArrowLeft") nextColumn--;
      else if (event.key === "Home") nextColumn = 0;
      else if (event.key === "End") nextColumn = this.definitions.length - 1;
      else return;
      event.preventDefault();
      nextRow = Math.max(0, Math.min(displayRows.length - 1, nextRow)); nextColumn = Math.max(0, Math.min(this.definitions.length - 1, nextColumn));
      this.activeCell = { row: nextRow, column: nextColumn };
      const rowHeight = this.positiveNumber(this.getAttribute("row-height"), 40);
      const rowSizes = this.indexRowSizes(displayRows, rowHeight);
      const headerHeight = this.header?.offsetHeight || rowHeight;
      const rowTop = headerHeight + rowSizes.offset(nextRow); const rowBottom = rowTop + rowSizes.size(nextRow);
      if (rowTop < this.viewport.scrollTop + headerHeight) this.viewport.scrollTop = rowSizes.offset(nextRow);
      else if (rowBottom > this.viewport.scrollTop + this.viewport.clientHeight) this.viewport.scrollTop = rowSizes.offset(nextRow) + rowSizes.size(nextRow) - Math.max(0, this.viewport.clientHeight - headerHeight);
      this.header?.querySelector<HTMLElement>(`[data-column-index="${nextColumn}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
      this.paint(this.updateColumnWindow());
      requestAnimationFrame(() => requestAnimationFrame(() => this.viewport?.querySelector<HTMLElement>(`.data-row[data-row-index="${nextRow}"] [data-col-index="${nextColumn}"]`)?.focus()));
    }

    private onColumnDragStart(event: DragEvent): void {
      const handle = (event.target as HTMLElement).closest<HTMLElement>("[data-reorder-column]");
      if (!this.reorderableColumns || !handle) return;
      this.draggedColumnId = handle.dataset.reorderColumn;
      if (event.dataTransfer) { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", this.draggedColumnId ?? ""); }
    }

    private onColumnDragOver(event: DragEvent): void {
      if (this.reorderableColumns && this.draggedColumnId && (event.target as HTMLElement).closest("[data-column-id]")) event.preventDefault();
    }

    private onColumnDrop(event: DragEvent): void {
      if (!this.reorderableColumns || !this.draggedColumnId) return;
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-column-id]");
      if (!target) return;
      event.preventDefault();
      const bounds = target.getBoundingClientRect();
      const after = getComputedStyle(this).direction === "rtl" ? event.clientX < bounds.left + bounds.width / 2 : event.clientX > bounds.left + bounds.width / 2;
      this.moveColumn(this.draggedColumnId, target.dataset.columnId ?? "", after);
      this.draggedColumnId = undefined;
    }

    private moveColumn(fromId: string, toId: string, after = false): void {
      const next = this.orderedDefinitions.map(column => column.id);
      if (fromId === toId || !next.includes(fromId) || !next.includes(toId)) return;
      next.splice(next.indexOf(fromId), 1);
      const targetIndex = next.indexOf(toId);
      next.splice(targetIndex + Number(after), 0, fromId);
      if (next.every((id, index) => id === this.orderedDefinitions[index].id)) return;
      this.currentColumnOrder = next;
      this.renderHeader(); this.paint(true);
      const moved = this.definitions.find(column => column.id === fromId)!;
      if (this.reorderStatus) this.reorderStatus.textContent = `${moved.label}, ${next.indexOf(fromId) + 1} of ${next.length}`;
      this.dispatchEvent(new CustomEvent("spui-column-order-change", { detail: { columnIds: next }, bubbles: true, composed: true }));
    }

    private onResizeStart(event: PointerEvent): void {
      const handle = (event.target as HTMLElement).closest<HTMLElement>("[data-resize-column]");
      const column = this.definitions.find(candidate => candidate.id === handle?.dataset.resizeColumn);
      if (!handle || !column || event.button !== 0) return;
      event.preventDefault();
      const width = this.currentColumnWidths[column.id] ?? handle.parentElement!.getBoundingClientRect().width;
      this.resizing = { column, handle, startX: event.clientX, startWidth: width, direction: getComputedStyle(this).direction === "rtl" ? -1 : 1, pointerId: event.pointerId };
      this.setAttribute("data-resizing", "");
      handle.setPointerCapture(event.pointerId);
    }

    private onResizeDoubleClick(event: MouseEvent): void {
      const handle = (event.target as HTMLElement).closest<HTMLElement>("[data-resize-column]");
      const column = this.definitions.find(candidate => candidate.id === handle?.dataset.resizeColumn);
      if (!handle) { this.beginCellEdit((event.target as HTMLElement).closest<HTMLElement>("[role=gridcell][data-col-index]")); return; }
      if (!column || column.resizable === false) return;
      event.preventDefault();

      const header = this.header?.querySelector<HTMLElement>(`[data-column-id="${CSS.escape(column.id)}"] button`);
      const cells = [...(this.body?.querySelectorAll<HTMLElement>(`[data-col-index="${this.orderedDefinitions.indexOf(column)}"]`) ?? [])];
      const padding = getDataGridColumnSizing(column, this.sizingOptions).padding;
      const measure = (element: HTMLElement, extra: number): number => { const range = document.createRange(); range.selectNodeContents(element); return range.getBoundingClientRect().width + padding + extra; };
      const headerWidth = header ? measure(header, 18) : 0;
      const contentWidth = Math.max(headerWidth, ...cells.map(cell => measure(cell, 10)));
      const width = clampDataGridColumnWidth(column, contentWidth, this.sizingOptions[column.id]);
      this.currentColumnWidths = { ...this.currentColumnWidths, [column.id]: width };
      this.initializeColumnWidths(); this.applyColumnWidthVariables(); this.renderHeader(); this.paint(true);
      this.header?.querySelector<HTMLElement>(`[data-resize-column="${CSS.escape(column.id)}"]`)?.focus();
      this.dispatchEvent(new CustomEvent("spui-column-resize", { detail: { columnId: column.id, width, autoFit: true }, bubbles: true, composed: true }));
    }

    private onResizeMove(event: PointerEvent): void {
      const resize = this.resizing;
      if (!resize || event.pointerId !== resize.pointerId) return;
      const width = clampDataGridColumnWidth(resize.column, resize.startWidth + (event.clientX - resize.startX) * resize.direction, this.sizingOptions[resize.column.id]);
      this.style.setProperty(dataGridColumnVar(resize.column.id), `${width}px`);
      resize.handle.setAttribute("aria-valuenow", String(width));
    }

    private onResizeEnd(event: PointerEvent, cancelled = false): void {
      const resize = this.resizing;
      if (!resize || event.pointerId !== resize.pointerId) return;
      const width = cancelled ? resize.startWidth : Number(resize.handle.getAttribute("aria-valuenow")) || resize.startWidth;
      if (cancelled) this.style.setProperty(dataGridColumnVar(resize.column.id), `${resize.startWidth}px`);
      this.resizing = undefined;
      this.removeAttribute("data-resizing");
      this.currentColumnWidths = { ...this.currentColumnWidths, [resize.column.id]: width };
      this.initializeColumnWidths(); this.applyColumnWidthVariables();
      resize.handle.setAttribute("aria-valuenow", String(width));
      if (!cancelled) this.dispatchEvent(new CustomEvent("spui-column-resize", { detail: { columnId: resize.column.id, width }, bubbles: true, composed: true }));
    }

    private onResizeKeyDown(event: KeyboardEvent, handle: HTMLElement): void {
      const column = this.definitions.find(candidate => candidate.id === handle.dataset.resizeColumn);
      if (!column) return;
      const current = this.currentColumnWidths[column.id] ?? Math.round(handle.parentElement!.getBoundingClientRect().width);
      const direction = getComputedStyle(this).direction === "rtl" ? -1 : 1;
      const step = event.shiftKey ? 32 : 10;
      let width: number;
      if (event.key === "ArrowRight") width = current + step * direction;
      else if (event.key === "ArrowLeft") width = current - step * direction;
      else if (event.key === "Home") width = column.minWidth ?? 48;
      else if (event.key === "End") width = column.maxWidth ?? 1600;
      else return;
      event.preventDefault();
      const nextWidth = clampDataGridColumnWidth(column, width, this.sizingOptions[column.id]);
      this.currentColumnWidths = { ...this.currentColumnWidths, [column.id]: nextWidth };
      this.initializeColumnWidths(); this.applyColumnWidthVariables(); handle.setAttribute("aria-valuenow", String(nextWidth));
      handle.focus();
      this.dispatchEvent(new CustomEvent("spui-column-resize", { detail: { columnId: column.id, width: this.currentColumnWidths[column.id] }, bubbles: true, composed: true }));
    }

    private applyColumnWidthVariables(): void {
      const widths = { ...this.fittedColumnWidths, ...this.currentColumnWidths };
      for (const column of this.definitions) {
        const width = widths[column.id];
        if (Number.isFinite(width)) this.style.setProperty(dataGridColumnVar(column.id), `${width}px`);
        else this.style.removeProperty(dataGridColumnVar(column.id));
      }
      this.header?.querySelectorAll<HTMLElement>("[data-resize-column]").forEach(handle => {
        const id = handle.dataset.resizeColumn!;
        if (this.currentColumnWidths[id] === undefined && widths[id] !== undefined) handle.setAttribute("aria-valuenow", String(widths[id]));
      });
    }

    private initializeColumnWidths(): void {
      if (!this.header) return;
      if (this.resizableColumns && this.autoFitColumns && this.viewport) {
        this.fittedColumnWidths = fitDataGridColumnWidths(this.orderedDefinitions, this.viewport.clientWidth - this.containerWidthOffset, this.sizingOptions, this.currentColumnWidths, this.selectionMode() === "none" ? 0 : 44);
        this.applyColumnWidthVariables();
        return;
      }
      this.fittedColumnWidths = {};
      if (!this.resizableColumns) { this.applyColumnWidthVariables(); return; }
      let changed = false;
      for (const column of this.definitions) {
        if (this.currentColumnWidths[column.id] !== undefined) continue;
        const configured = this.sizingOptions[column.id];
        const hasInitialWidth = configured?.defaultWidth !== undefined || configured?.idealWidth !== undefined;
        const isAutoFitLast = this.resizableColumns && this.autoFitColumns && this.orderedDefinitions.at(-1)?.id === column.id;
        if (isAutoFitLast) continue;
        if (!hasInitialWidth && column.minWidth === undefined && column.maxWidth === undefined && configured?.minWidth === undefined) continue;
        if (hasInitialWidth) {
          this.currentColumnWidths = { ...this.currentColumnWidths, [column.id]: getDataGridColumnSizing(column, this.sizingOptions).defaultWidth };
          changed = true;
          continue;
        }
        const cell = this.header.querySelector<HTMLElement>(`[data-column-id="${CSS.escape(column.id)}"]`);
        if (!cell || cell.getBoundingClientRect().width <= 0) continue;
        const width = clampDataGridColumnWidth(column, cell.getBoundingClientRect().width, configured);
        if (Math.abs(width - cell.getBoundingClientRect().width) >= 1) {
          this.currentColumnWidths = { ...this.currentColumnWidths, [column.id]: width };
          changed = true;
        }
      }
      if (changed) { this.applyColumnWidthVariables(); this.renderHeader(); }
    }

    private positiveNumber(value: string | null, fallback: number): number { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : fallback; }
  }
  customElements.define("spui-data-grid", SpuiDataGrid);
}
