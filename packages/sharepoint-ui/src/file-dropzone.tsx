import { createElement, type DragEvent, type HTMLAttributes, type InputHTMLAttributes, type ReactElement } from "react";

export type FileDropzoneProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "aria-label" | "aria-labelledby" | "onDrop" | "onDragOver"> & {
  id: string;
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  files?: readonly File[];
  onFiles: (files: File[]) => void;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id" | "name" | "accept" | "multiple" | "disabled" | "required" | "onChange">;
};

export function FileDropzone({
  id, label, hint, accept, multiple = true, disabled = false, required = false, name, files = [], onFiles,
  inputProps, className = "", ...props
}: FileDropzoneProps): ReactElement {
  const notifyFiles = (incoming?: FileList | null) => {
    if (!disabled) onFiles(Array.from(incoming ?? []).slice(0, multiple ? undefined : 1));
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    notifyFiles(event.dataTransfer.files);
  };
  return createElement("div", {
    ...props, role: "group", "aria-labelledby": `${id}-label`, className: `spui-file-dropzone ${className}`.trim(),
    onDragOver: (event: DragEvent<HTMLDivElement>) => event.preventDefault(),
    onDrop: handleDrop,
  },
  createElement("label", { id: `${id}-label`, htmlFor: id }, label),
  hint && createElement("p", { id: `${id}-hint`, className: "spui-hint" }, hint),
  createElement("input", {
    ...inputProps, id, name, type: "file", accept, multiple, disabled, required,
    "aria-describedby": [inputProps?.["aria-describedby"], hint && `${id}-hint`].filter(Boolean).join(" ") || undefined,
    onChange: (event: { currentTarget: HTMLInputElement }) => notifyFiles(event.currentTarget.files),
    className: `spui-file-input ${inputProps?.className ?? ""}`.trim(),
  }),
  createElement("span", { className: "spui-file-drop-hint", "aria-hidden": true }, "Drop files here or choose files"),
  createElement("span", { className: "spui-sr-only", role: "status", "aria-live": "polite" },
    files.length ? `${files.length} file${files.length === 1 ? "" : "s"} selected` : "No files selected",
  ),
  );
}
