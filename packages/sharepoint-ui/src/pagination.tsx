import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type PaginationProps = Omit<HTMLAttributes<HTMLElement>, "children" | "aria-label"> & {
  label?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  pageLabel?: (page: number, total: number) => string;
};

export function Pagination({
  label = "Pagination", currentPage, totalPages, onPageChange,
  previousLabel = "Previous page", nextLabel = "Next page",
  pageLabel = (page, total) => total > 0 ? `Page ${page} of ${total}` : "No pages",
  className = "", ...props
}: PaginationProps): ReactElement {
  const page = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  return createElement("nav", { ...props, "aria-label": label, className: `spui-pagination ${className}`.trim() },
    createElement("button", { type: "button", disabled: page <= 1, onClick: () => onPageChange(page - 1) }, previousLabel),
    createElement("span", { "aria-live": "polite" }, pageLabel(page, totalPages)),
    createElement("button", { type: "button", disabled: page >= totalPages, onClick: () => onPageChange(page + 1) }, nextLabel),
  );
}
