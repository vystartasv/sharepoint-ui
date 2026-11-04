import { createElement, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactElement } from "react";

export type CopyButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  value: string;
  copiedLabel?: string;
  failedLabel?: string;
};

export function CopyButton({
  value, copiedLabel = "Copied", failedLabel = "Copy failed", className = "", type = "button", onClick, children = "Copy", ...props
}: CopyButtonProps): ReactElement {
  const [message, setMessage] = useState("");
  return createElement("span", { className: "spui-copy" },
    createElement("button", {
      ...props,
      type,
      className: `spui-button ${className}`.trim(),
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (typeof navigator === "undefined" || !navigator.clipboard) {
          setMessage(failedLabel);
          return;
        }
        void navigator.clipboard.writeText(value).then(() => setMessage(copiedLabel), () => setMessage(failedLabel));
      },
    }, children),
    createElement("span", { className: "spui-visually-hidden", role: "status", "aria-live": "polite" }, message),
  );
}
