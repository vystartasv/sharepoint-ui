import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type AttachmentItem = {
  id: string;
  name: string;
  status?: "ready" | "uploading" | "uploaded" | "error";
  progress?: number;
  message?: string;
};

export type AttachmentListProps = Omit<HTMLAttributes<HTMLUListElement>, "children" | "aria-label"> & {
  label: string;
  items: readonly AttachmentItem[];
  onRemove?: (id: string) => void;
  removeLabel?: (name: string) => string;
};

const statusLabels = { ready: "Ready", uploading: "Uploading", uploaded: "Uploaded", error: "Upload failed" };

export function AttachmentList({
  label, items, onRemove, removeLabel = name => `Remove ${name}`, className = "", ...props
}: AttachmentListProps): ReactElement {
  return createElement("ul", { ...props, "aria-label": label, className: `spui-attachment-list ${className}`.trim() },
    items.map(item => {
      const status = item.status ?? "ready";
      return createElement("li", { key: item.id, className: `spui-attachment spui-attachment-${status}` },
        createElement("span", null, item.name),
        status === "uploading" && createElement("progress", {
          max: 100, value: item.progress === undefined ? undefined : Math.max(0, Math.min(100, item.progress)),
          "aria-label": `${item.name} upload progress`,
        }),
        createElement("span", { role: status === "error" ? "alert" : "status", "aria-live": "polite" }, item.message ?? statusLabels[status]),
        onRemove && createElement("button", {
          type: "button", onClick: () => onRemove(item.id),
          "aria-label": removeLabel(item.name), disabled: status === "uploading",
        }, "Remove"),
      );
    }),
  );
}
