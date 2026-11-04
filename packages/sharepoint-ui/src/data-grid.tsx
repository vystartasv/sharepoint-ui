import { createElement, useState, type ReactElement, type ReactNode, type TableHTMLAttributes } from "react";

export type DataGridColumn<Row> = {
  key: keyof Row & string;
  label: string;
  render?: (row: Row) => ReactNode;
  sortable?: boolean;
};
export type DataGridSort<Row> = { key: keyof Row & string; direction: "ascending" | "descending" };
export type DataGridProps<Row extends Record<string, unknown>> = Omit<TableHTMLAttributes<HTMLTableElement>, "children"> & {
  label: string;
  caption?: ReactNode;
  rows: readonly Row[];
  columns: readonly DataGridColumn<Row>[];
  getRowId: (row: Row) => string;
  rowLabel?: (row: Row) => string;
  selectable?: boolean;
  selectedIds?: readonly string[];
  onSelectionChange?: (ids: string[]) => void;
  initialSort?: DataGridSort<Row>;
  onSortChange?: (sort: DataGridSort<Row>) => void;
};

export function DataGrid<Row extends Record<string, unknown>>({
  label, caption, rows, columns, getRowId, rowLabel, selectable = false, selectedIds, onSelectionChange, initialSort, onSortChange, className = "", ...props
}: DataGridProps<Row>): ReactElement {
  const [sort, setSort] = useState<DataGridSort<Row> | undefined>(initialSort);
  const [internalSelected, setInternalSelected] = useState<Set<string>>(() => new Set(selectedIds));
  const selected = selectedIds === undefined ? internalSelected : new Set(selectedIds);
  const orderedRows = sort ? [...rows].sort((a, b) => {
    const left = a[sort.key], right = b[sort.key];
    const comparison = typeof left === "number" && typeof right === "number"
      ? left - right : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true });
    return sort.direction === "ascending" ? comparison : -comparison;
  }) : rows;
  const changeSort = (key: keyof Row & string) => {
    const next: DataGridSort<Row> = { key, direction: sort?.key === key && sort.direction === "ascending" ? "descending" : "ascending" };
    setSort(next);
    onSortChange?.(next);
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    if (selectedIds === undefined) setInternalSelected(next);
    onSelectionChange?.([...next]);
  };
  return createElement("table", { ...props, "aria-label": label, className: `spui-table spui-data-grid ${className}`.trim() },
    caption && createElement("caption", null, caption),
    createElement("thead", null, createElement("tr", null,
      selectable && createElement("th", { scope: "col" }, "Select"),
      columns.map(column => createElement("th", {
        key: column.key, scope: "col",
        "aria-sort": sort?.key === column.key ? sort.direction : undefined,
      }, column.sortable === false ? column.label : createElement("button", {
        type: "button", onClick: () => changeSort(column.key),
        "aria-label": `Sort by ${column.label}`,
      }, column.label))),
    )),
    createElement("tbody", null, orderedRows.map(row => {
      const id = getRowId(row);
      const name = rowLabel?.(row) ?? id;
      return createElement("tr", { key: id, "aria-selected": selectable ? selected.has(id) : undefined },
        selectable && createElement("td", null, createElement("input", {
          type: "checkbox", className: "spui-checkbox", checked: selected.has(id),
          "aria-label": `Select ${name}`, onChange: () => toggle(id),
        })),
        columns.map(column => createElement("td", { key: column.key }, column.render
          ? column.render(row) : String(row[column.key] ?? ""))),
      );
    })),
  );
}
