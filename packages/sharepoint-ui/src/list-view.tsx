import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { DataGrid, type DataGridColumn, type DataGridSort } from "./data-grid.js";
import { EmptyState } from "./empty-state.js";
import { Pagination } from "./pagination.js";
import { Spinner } from "./spinner.js";

export type ListViewPage = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export type ListViewProps<Row extends Record<string, unknown>> = Omit<HTMLAttributes<HTMLElement>, "children" | "aria-label"> & {
  label: string;
  rows: readonly Row[];
  columns: readonly DataGridColumn<Row>[];
  getRowId: (row: Row) => string;
  rowLabel?: (row: Row) => string;
  selectable?: boolean;
  selectedIds?: readonly string[];
  onSelectionChange?: (ids: string[]) => void;
  initialSort?: DataGridSort<Row>;
  onSortChange?: (sort: DataGridSort<Row>) => void;
  caption?: ReactNode;
  toolbar?: ReactNode;
  filters?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  page?: ListViewPage;
};

export function ListView<Row extends Record<string, unknown>>({
  label, rows, columns, getRowId, rowLabel, selectable, selectedIds, onSelectionChange, initialSort, onSortChange,
  caption, toolbar, filters, loading = false, loadingLabel = `Loading ${label}`,
  emptyTitle = "No items found", emptyDescription = "Try changing or clearing the filters.", emptyAction, page,
  className = "", ...props
}: ListViewProps<Row>): ReactElement {
  return createElement("section", { ...props, "aria-label": label, className: `spui-list-view ${className}`.trim() },
    (toolbar || filters) && createElement("div", { className: "spui-list-view-tools" }, toolbar, filters),
    loading ? createElement(Spinner, { label: loadingLabel })
      : rows.length ? createElement(DataGrid<Row>, {
        label: `${label} results`, caption, rows, columns, getRowId, rowLabel, selectable,
        selectedIds, onSelectionChange, initialSort, onSortChange,
      }) : createElement(EmptyState, { title: emptyTitle, description: emptyDescription, children: emptyAction }),
    !loading && page && createElement(Pagination, {
      label: `${label} pages`, ...page,
    }),
  );
}
