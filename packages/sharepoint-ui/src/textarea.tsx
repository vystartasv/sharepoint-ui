import { createElement, type ReactElement, type TextareaHTMLAttributes } from "react";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className = "", ...props }: TextAreaProps): ReactElement {
  return createElement("textarea", { ...props, className: `spui-textarea ${className}`.trim() });
}
