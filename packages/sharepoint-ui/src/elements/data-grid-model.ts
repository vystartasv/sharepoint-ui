export type DataGridSortDirection = "ascending" | "descending";
/** Keyboard entry and movement strategy for the DataGrid. */
export type DataGridFocusMode = "none" | "cell" | "row_unstable" | "composite";
export type DataGridSelectionAppearance = "brand" | "neutral" | "none";
export type DataGridSort = { columnId: string; direction: DataGridSortDirection };
export type DataGridSortState = DataGridSort | readonly DataGridSort[];
export type DataGridColumn<T = unknown> = {
  id: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  editable?: boolean;
  editType?: "text" | "number" | "date";
  value?: (item: T) => string | number | Date | null | undefined;
};

export type DataGridColumnWidths = Readonly<Record<string, number>>;
export type DataGridDataSourceRow<T = unknown> =
  | { kind: "item"; item: T; rowId?: string | number; itemIndex?: number }
  | { kind: "group"; key: string; label: string; count: number; expanded: boolean };
/** Compact selection for indexed queries; all mode selects the source's current matching rows except excluded keys. */
export type DataGridSelectionModel =
  | { mode: "explicit"; keys: readonly string[] }
  | { mode: "all"; excludedKeys: readonly string[]; scopeKey?: string };
export type DataGridClipboardColumn = Pick<DataGridColumn, "id" | "label">;
export function isDataGridRowSelected(selection: DataGridSelectionModel, key: string, scopeKey?: string): boolean {
  return selection.mode === "all" ? (selection.scopeKey === undefined || selection.scopeKey === scopeKey) && !selection.excludedKeys.includes(key) : selection.keys.includes(key);
}
export function setDataGridRowSelected(selection: DataGridSelectionModel, key: string, selected: boolean, scopeKey?: string): DataGridSelectionModel {
  if (selection.mode === "all" && (selection.scopeKey === undefined || selection.scopeKey === scopeKey)) {
    const excludedKeys = new Set(selection.excludedKeys);
    if (selected) excludedKeys.delete(key); else excludedKeys.add(key);
      return { mode: "all", excludedKeys: [...excludedKeys], ...(selection.scopeKey === undefined ? {} : { scopeKey: selection.scopeKey }) };
  }
  const keys = new Set(selection.mode === "explicit" ? selection.keys : []);
  if (selected) keys.add(key); else keys.delete(key);
  return { mode: "explicit", keys: [...keys] };
}
/** Indexed provider for server-owned grid order, filtering, grouping, and sorting. Length counts displayed rows, including group headers. */
export type DataGridDataSource<T = unknown> = {
  readonly length: number;
  /** Optional exact number of selectable item rows, excluding group headers. */
  readonly selectableCount?: number;
  /** Stable identity of the current server query; binds all-matching selection to that query. */
  readonly selectionScopeKey?: string;
  loadRange(start: number, end: number, signal: AbortSignal): void | Promise<void>;
  /** Return TSV for the provider query and compact selection; implement for remote or all-matching copy. */
  copySelection?(selection: DataGridSelectionModel, columns: readonly DataGridClipboardColumn[], signal: AbortSignal): string | Promise<string>;
  subscribe?(listener: () => void): () => void;
} & (
  | { getItem(index: number): T | undefined; getRow?: (index: number) => DataGridDataSourceRow<T> | undefined }
  | { getRow(index: number): DataGridDataSourceRow<T> | undefined; getItem?: (index: number) => T | undefined }
);
/** Start an async clipboard write during the user gesture; ClipboardItem accepts a promised Blob. */
export function writeDataGridClipboardText(text: string | Promise<string>): Promise<void> {
  const clipboard = globalThis.navigator?.clipboard;
  if (!clipboard) return Promise.reject(new Error("Clipboard access is unavailable in this browser."));
  if (clipboard.write && typeof globalThis.ClipboardItem === "function") {
    const value = Promise.resolve(text).then(result => new Blob([result], { type: "text/plain" }));
    return clipboard.write([new ClipboardItem({ "text/plain": value })]);
  }
  return Promise.resolve(text).then(result => {
    if (!clipboard.writeText) throw new Error("Async clipboard writing is not supported in this browser.");
    return clipboard.writeText(result);
  });
}
export function getDataGridDataSourceRow<T>(source: DataGridDataSource<T>, index: number): DataGridDataSourceRow<T> | undefined {
  const row = source.getRow?.(index);
  if (row) return row;
  const item = source.getItem?.(index);
  return item === undefined ? undefined : { kind: "item", item };
}
/** Per-column sizing configuration compatible with Fluent DataGrid sizing options. */
export type DataGridColumnSizingOption = { defaultWidth?: number; idealWidth?: number; minWidth?: number; padding?: number; autoFitColumns?: boolean };
export type DataGridColumnSizingOptions = Readonly<Record<string, DataGridColumnSizingOption>>;

export function getDataGridColumnSizing<T>(column: DataGridColumn<T>, options?: DataGridColumnSizingOptions): Required<Pick<DataGridColumnSizingOption, "defaultWidth" | "idealWidth" | "minWidth" | "padding" | "autoFitColumns">> {
  const configured = options?.[column.id];
  const minWidth = Number.isFinite(configured?.minWidth) && configured!.minWidth! > 0 ? configured!.minWidth! : Number.isFinite(column.minWidth) && column.minWidth! > 0 ? column.minWidth! : configured ? 100 : 48;
  const maxWidth = Number.isFinite(column.maxWidth) && column.maxWidth! >= minWidth ? column.maxWidth! : 1600;
  const cssWidth = typeof column.width === "string" && /^\d+(?:\.\d+)?px$/.test(column.width) ? Number.parseFloat(column.width) : undefined;
  const idealWidth = Math.round(Math.max(minWidth, Math.min(maxWidth, Number.isFinite(configured?.idealWidth) && configured!.idealWidth! > 0 ? configured!.idealWidth! : Number.isFinite(configured?.defaultWidth) && configured!.defaultWidth! > 0 ? configured!.defaultWidth! : 150)));
  const defaultWidth = Math.round(Math.max(minWidth, Math.min(maxWidth, Number.isFinite(configured?.defaultWidth) && configured!.defaultWidth! > 0 ? configured!.defaultWidth! : cssWidth ?? idealWidth)));
  return { defaultWidth, idealWidth, minWidth, padding: Number.isFinite(configured?.padding) && configured!.padding! >= 0 ? configured!.padding! : 16, autoFitColumns: configured?.autoFitColumns !== false };
}

/** Apply Fluent's grow-to-ideal / shrink-from-end auto-fit policy to configured tracks. */
export function fitDataGridColumnWidths<T>(columns: readonly DataGridColumn<T>[], viewportWidth: number, options?: DataGridColumnSizingOptions, currentWidths: DataGridColumnWidths = {}, reservedWidth = 0): DataGridColumnWidths {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0 || !columns.length) return {};
  const state = columns.map(column => {
    const sizing = getDataGridColumnSizing(column, options);
    const minWidth = sizing.minWidth;
    const maxWidth = Number.isFinite(column.maxWidth) && column.maxWidth! >= minWidth ? column.maxWidth! : 1600;
    const current = currentWidths[column.id];
    const width = Math.max(minWidth, Math.min(maxWidth, Number.isFinite(current) && current > 0 ? current : sizing.defaultWidth));
    const idealWidth = Number.isFinite(current) && current > 0 ? width : Math.max(width, Math.min(maxWidth, sizing.idealWidth));
    return { column, width, idealWidth, minWidth, maxWidth, padding: sizing.padding };
  });
  const available = Math.max(0, viewportWidth - Math.max(0, reservedWidth) + state.reduce((sum, entry) => sum + entry.padding, 0));
  let total = state.reduce((sum, entry) => sum + entry.width + entry.padding, 0);
  if (total < available) {
    let remaining = available - total;
    for (const entry of state) {
      const grow = Math.min(Math.max(0, entry.idealWidth - entry.width), remaining);
      entry.width += grow;
      remaining -= grow;
      if (remaining <= 0) break;
    }
    if (remaining > 0) {
      const last = state[state.length - 1];
      const grow = Math.min(remaining, Math.max(0, last.maxWidth - last.width));
      last.width += grow;
    }
  } else if (total > available) {
    let remaining = total - available;
    for (let index = state.length - 1; index >= 0 && remaining > 0; index--) {
      const entry = state[index];
      const shrink = Math.min(Math.max(0, entry.width - entry.minWidth), remaining);
      entry.width -= shrink;
      remaining -= shrink;
    }
  }
  return Object.fromEntries(state.map(entry => [entry.column.id, Math.round(entry.width)]));
}
export type DataGridGroup<T = unknown> = { key: string; label: string; value: string | number | Date | null | undefined; items: T[]; indices: number[] };
export type DataGridEditValue = string | number | null;
export type DataGridCellEdit<T = unknown> = { item: T; rowId: string; columnId: string; previousValue: unknown; value: DataGridEditValue };
export type DataGridCellEditError<T = unknown> = DataGridCellEdit<T> & { error: string };

/** Bound row sizes to keep a consumer callback from creating pathological virtual scroll extents. */
export function clampDataGridRowHeight(height: number | undefined, estimate: number): number {
  return Number.isFinite(height) && height! > 0 ? Math.max(1, Math.min(10_000, height!)) : estimate;
}

export function getDataGridCellValue<T>(item: T, column: DataGridColumn<T>): unknown {
  return column.value ? column.value(item) : (item as Record<string, unknown> | null)?.[column.id];
}

export function toDataGridInputValue(value: unknown, type: DataGridColumn["editType"] = "text"): string {
  if (value == null) return "";
  if (type === "date" && value instanceof Date) return Number.isFinite(value.valueOf()) ? value.toISOString().slice(0, 10) : "";
  return String(value);
}

export function parseDataGridInputValue(value: string, type: DataGridColumn["editType"] = "text"): DataGridEditValue {
  if (value === "") return null;
  if (type === "number") {
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }
  return value;
}

/** Parse tab-separated clipboard text, including quoted tabs, newlines, and doubled quotes. */
export function parseDataGridClipboard(text: string): string[][] {
  if (text.length > 1_000_000) throw new Error("Clipboard data is limited to 1,000,000 characters.");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { cell += '"'; index++; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"' && cell.length === 0) quoted = true;
    else if (character === "\t") { row.push(cell); cell = ""; }
    else if (character === "\r" || character === "\n") {
      row.push(cell); rows.push(row); row = []; cell = "";
      if (character === "\r" && text[index + 1] === "\n") index++;
    } else cell += character;
  }
  if (quoted) throw new Error("Clipboard data contains an unfinished quoted cell.");
  if (cell.length || row.length || !rows.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function formatDataGridClipboard(rows: readonly (readonly unknown[])[]): string {
  return rows.map(row => row.map(raw => {
    const value = raw instanceof Date ? Number.isFinite(raw.valueOf()) ? raw.toISOString() : "" : raw == null ? "" : String(raw);
    return /[\t\r\n"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join("\t")).join("\r\n");
}

export function parseDataGridClipboardValue(value: string, type: DataGridColumn["editType"] = "text"): DataGridEditValue {
  if (type === "number") {
    const normalized = value.trim();
    if (!normalized) return null;
    const number = Number(normalized);
    if (!Number.isFinite(number)) throw new Error(`“${value}” is not a valid number.`);
    return number;
  }
  if (type === "date") {
    const normalized = value.trim();
    if (!normalized) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || new Date(`${normalized}T00:00:00Z`).toISOString().slice(0, 10) !== normalized) throw new Error(`“${value}” is not a valid date.`);
    return normalized;
  }
  return value;
}

/** Locale-aware contains filter across searchable columns, preserving source order. */
export function filterDataGridItems<T>(items: readonly T[], columns: readonly DataGridColumn<T>[], query: string, locale?: string): T[] {
  const normalized = query.trim();
  if (!normalized) return [...items];
  let searchLocale: string | undefined;
  try { searchLocale = locale?.trim() || undefined; normalized.toLocaleLowerCase(searchLocale); } catch { searchLocale = undefined; }
  const needle = normalized.toLocaleLowerCase(searchLocale);
  const searchableColumns = columns.filter(column => column.searchable !== false);
  if (!searchableColumns.length) return [...items];
  return items.filter(item => searchableColumns.some(column => {
    const value = column.value ? column.value(item) : (item as Record<string, unknown> | null)?.[column.id];
    if (value == null) return false;
    const text = value instanceof Date ? Number.isFinite(value.valueOf()) ? `${value.toISOString()} ${value.toLocaleDateString(searchLocale)}` : "" : Array.isArray(value) ? value.join(" ") : typeof value === "object" ? "" : String(value);
    return text.toLocaleLowerCase(searchLocale).includes(needle);
  }));
}

export function getDataGridGroupKey(columnId: string, value: string | number | Date | null | undefined): string {
  const type = value instanceof Date ? "date" : value === null || value === undefined ? "empty" : typeof value;
  const normalized = value instanceof Date ? Number.isFinite(value.valueOf()) ? value.toISOString() : "invalid" : value === null || value === undefined ? "" : String(value);
  return JSON.stringify([columnId, type, normalized]);
}

export function groupDataGridItems<T>(items: readonly T[], columns: readonly DataGridColumn<T>[], groupBy: string | undefined, locale?: string, emptyLabel = "No value"): DataGridGroup<T>[] | undefined {
  const column = groupBy ? columns.find(candidate => candidate.id === groupBy) : undefined;
  if (!column) return undefined;
  const groups = new Map<string, DataGridGroup<T>>();
  items.forEach((item, index) => {
    const value = column.value ? column.value(item) : (item as Record<string, unknown> | null)?.[column.id] as string | number | Date | null | undefined;
    const key = getDataGridGroupKey(column.id, value);
    let group = groups.get(key);
    if (!group) {
      const label = value === null || value === undefined ? emptyLabel : value instanceof Date ? Number.isFinite(value.valueOf()) ? value.toLocaleDateString(locale || undefined) : emptyLabel : String(value);
      group = { key, label, value, items: [], indices: [] };
      groups.set(key, group);
    }
    group.items.push(item);
    group.indices.push(index);
  });
  return [...groups.values()];
}

export function dataGridColumnVar(columnId: string): string {
  const suffix = Array.from(columnId, char => `_${char.codePointAt(0)!.toString(16)}_`).join("");
  return `--spui-data-grid-column-${suffix}`;
}

/** Find the visible column interval from laid-out header cells, including RTL order. */
export function getDataGridColumnWindow(cells: readonly HTMLElement[], viewport: HTMLElement, overscan = 2): { start: number; end: number } {
  if (!cells.length) return { start: 0, end: 0 };
  const bounds = viewport.getBoundingClientRect();
  const left = bounds.left + viewport.clientLeft;
  const right = left + viewport.clientWidth;
  const rtl = getComputedStyle(viewport).direction === "rtl";
  const firstVisible = (cell: HTMLElement): boolean => rtl ? cell.getBoundingClientRect().left < right : cell.getBoundingClientRect().right > left;
  const lastVisible = (cell: HTMLElement): boolean => rtl ? cell.getBoundingClientRect().right > left : cell.getBoundingClientRect().left < right;
  const lowerBound = (predicate: (cell: HTMLElement) => boolean): number => {
    let low = 0, high = cells.length;
    while (low < high) { const middle = (low + high) >>> 1; if (predicate(cells[middle])) high = middle; else low = middle + 1; }
    return low;
  };
  let start = lowerBound(firstVisible);
  let afterLast = lowerBound(cell => !lastVisible(cell));
  if (start >= cells.length || afterLast <= start) return { start: 0, end: cells.length };
  const buffer = Number.isFinite(overscan) ? Math.max(0, Math.min(20, Math.floor(overscan))) : 2;
  start = Math.max(0, start - buffer);
  return { start, end: Math.min(cells.length, afterLast + buffer) };
}

export function clampDataGridColumnWidth<T>(column: DataGridColumn<T>, width: number, sizing?: DataGridColumnSizingOption): number {
  const min = Number.isFinite(sizing?.minWidth) && sizing!.minWidth! > 0 ? sizing!.minWidth! : Number.isFinite(column.minWidth) && column.minWidth! > 0 ? column.minWidth! : 48;
  const max = Number.isFinite(column.maxWidth) && column.maxWidth! >= min ? column.maxWidth! : 1600;
  return Math.round(Math.max(min, Math.min(max, width)));
}

/** Stable, locale-aware sort shared by the React adapter and custom element. */
export function sortDataGridItems<T>(items: readonly T[], columns: readonly DataGridColumn<T>[], sort?: DataGridSortState, locale?: string): T[] {
  const sorts = (Array.isArray(sort) ? sort : sort ? [sort] : []).filter((entry, index, all) =>
    all.findIndex(candidate => candidate.columnId === entry.columnId) === index && columns.some(column => column.id === entry.columnId && column.sortable !== false));
  if (!sorts.length) return [...items];
  const sortColumns = sorts.flatMap(entry => {
    const column = columns.find(candidate => candidate.id === entry.columnId);
    return column ? [{ sort: entry, column }] : [];
  });
  const collator = new Intl.Collator(locale?.trim() || undefined, { numeric: true, sensitivity: "base" });
  return items.map((item, index) => ({ item, index, values: sortColumns.map(({ column }) => column.value ? column.value(item) : (item as Record<string, unknown> | null)?.[column.id] as string | number | Date | null | undefined) })).sort((a, b) => {
    for (let index = 0; index < sortColumns.length; index++) {
      const { sort: direction } = sortColumns[index];
      const rawLeft = a.values[index], rawRight = b.values[index];
      const left = rawLeft instanceof Date ? rawLeft.valueOf() : rawLeft;
      const right = rawRight instanceof Date ? rawRight.valueOf() : rawRight;
      const result = left == null ? right == null ? 0 : -1 : right == null ? 1
        : typeof left === "number" && typeof right === "number" ? left - right : collator.compare(String(left), String(right));
      if (result) return direction.direction === "ascending" ? result : -result;
    }
    return a.index - b.index;
  }).map(entry => entry.item);
}
