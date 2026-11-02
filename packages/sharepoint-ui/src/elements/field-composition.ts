import { createLabel, getLabelStyle, type LabelSize } from "./label.js";

export type FieldValidationState = "error" | "warning" | "success" | "none";
export type FieldOrientation = "vertical" | "horizontal";
export type FormFieldOptions = {
  id?: string;
  className?: string;
  label?: string | Node;
  hint?: string | Node;
  validationMessage?: string | Node;
  validationState?: FieldValidationState;
  required?: boolean;
  disabled?: boolean;
  orientation?: FieldOrientation;
  size?: LabelSize;
};

let generatedFieldId = 0;

const validationTokens: Record<Exclude<FieldValidationState, "none">, { foreground: string; border: string }> = {
  error: {
    foreground: "var(--spui-danger-text,var(--spui-semantic-error-text,var(--colorPaletteRedForeground1,#a4262c)))",
    border: "var(--spui-semantic-error-text,var(--colorPaletteRedForeground1,#a4262c))",
  },
  warning: {
    foreground: "var(--spui-warning-text,var(--spui-semantic-warning-text,var(--colorPaletteMarigoldForeground1,#835b00)))",
    border: "var(--spui-semantic-warning-text,var(--colorPaletteMarigoldForeground1,#835b00))",
  },
  success: {
    foreground: "var(--spui-success-text,var(--spui-semantic-success-text,var(--colorPaletteGreenForeground1,#107c10)))",
    border: "var(--spui-semantic-success-text,var(--colorPaletteGreenForeground1,#107c10))",
  },
};

export function mergeFieldIdRefs(existing: string | null, id?: string): string | undefined {
  const values = new Set((existing ?? "").split(/\s+/).filter(Boolean));
  if (id) values.add(id);
  return values.size ? [...values].join(" ") : undefined;
}

export function getFieldValidationTokens(state: FieldValidationState): { foreground: string; border: string } | undefined {
  return state === "none" ? undefined : validationTokens[state];
}

function appendContent(target: HTMLElement, value?: string | Node): void {
  if (typeof value === "string") target.textContent = value;
  else if (value) target.append(value);
}

/**
 * Compose a visible label, hint, and validation message around any native or
 * custom form control. The returned wrapper owns its control's generated ID.
 */
export function createFormField(control: HTMLElement, options: FormFieldOptions = {}): HTMLDivElement {
  const id = options.id ?? `spui-form-field-${++generatedFieldId}`;
  const controlId = control.id || `${id}-control`;
  control.id = controlId;
  const labelId = options.label == null ? undefined : `${id}-label`;
  const hintId = options.hint == null ? undefined : `${id}-hint`;
  const messageId = options.validationMessage == null ? undefined : `${id}-validation`;
  const state = options.validationState ?? (options.validationMessage == null ? "none" : "error");
  const shadowControl = Boolean(control.shadowRoot) || control.localName.includes("-");
  const details = mergeFieldIdRefs(messageId ?? null, hintId);
  const describedBy = shadowControl ? control.getAttribute("aria-describedby") ?? undefined : mergeFieldIdRefs(details ?? null, control.getAttribute("aria-describedby") ?? undefined);
  const contentText = (value?: string | Node): string => typeof value === "string" ? value : value?.textContent?.trim() ?? "";
  const accessibleDescription = [control.getAttribute("aria-description"), shadowControl ? contentText(options.validationMessage) : "", shadowControl ? contentText(options.hint) : ""].filter(Boolean).join(" ");
  if (labelId && !shadowControl) control.setAttribute("aria-labelledby", mergeFieldIdRefs(control.getAttribute("aria-labelledby"), labelId)!);
  if (describedBy) control.setAttribute("aria-describedby", describedBy); else if (shadowControl) control.removeAttribute("aria-describedby");
  if (shadowControl && accessibleDescription) control.setAttribute("aria-description", accessibleDescription);
  if (options.required) {
    control.setAttribute("required", "");
    control.setAttribute("aria-required", "true");
  }
  if (options.disabled) control.setAttribute("disabled", "");
  if (options.validationState !== undefined || options.validationMessage !== undefined) {
    if (state === "error") control.setAttribute("aria-invalid", "true");
    else control.removeAttribute("aria-invalid");
  }
  const tokens = getFieldValidationTokens(state);
  if (tokens) {
    control.style.setProperty("--spui-control-border", tokens.border);
    control.style.setProperty("--spui-input-border", tokens.border);
    control.style.setProperty("--spui-focus-ring", tokens.border);
  }

  const wrapper = document.createElement("div");
  wrapper.id = id;
  wrapper.className = ["spui-form-field", options.className].filter(Boolean).join(" ");
  wrapper.dataset.orientation = options.orientation ?? "vertical";
  wrapper.dataset.validationState = state;
  wrapper.dataset.size = options.size ?? "medium";
  wrapper.style.display = "grid";
  wrapper.style.gridTemplateColumns = options.orientation === "horizontal" ? "minmax(8rem, 1fr) minmax(0, 2fr)" : "minmax(0, 1fr)";
  wrapper.style.columnGap = "var(--spui-field-column-gap,16px)";
  wrapper.style.rowGap = "var(--spui-field-gap,4px)";
  wrapper.style.alignItems = "start";
  wrapper.style.color = "var(--spui-ui-text,var(--spui-semantic-body-text,#323130))";
  wrapper.style.fontFamily = "var(--spui-font-family,inherit)";

  if (options.label != null) {
    const label = createLabel(options.label, { htmlFor: controlId, id: labelId, size: options.size, required: options.required, disabled: Boolean(options.disabled || control.matches(":disabled") || control.hasAttribute("disabled")) });
    label.style.gridArea = options.orientation === "horizontal" ? "1 / 1 / span 3 / 2" : "auto";
    const accessibleLabel = label.textContent?.replace("*", "").trim();
    if (accessibleLabel) control.setAttribute("aria-label", accessibleLabel);
    wrapper.append(label);
  }
  control.style.gridArea = options.orientation === "horizontal" ? "1 / 2 / span 3 / 3" : "auto";
  wrapper.append(control);
  if (options.hint != null) {
    const hint = document.createElement("div");
    hint.id = hintId!;
    hint.dataset.fieldHint = "";
    hint.style.gridArea = options.orientation === "horizontal" ? "2 / 2" : "auto";
    hint.style.color = "var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161))";
    hint.style.fontSize = "var(--spui-field-hint-size,12px)";
    appendContent(hint, options.hint);
    wrapper.append(hint);
  }
  if (options.validationMessage != null) {
    const message = document.createElement("div");
    message.id = messageId!;
    message.dataset.fieldValidation = state;
    if (state === "error" || state === "warning") message.setAttribute("role", "alert");
    message.style.gridArea = options.orientation === "horizontal" ? "3 / 2" : "auto";
    message.style.display = "flex";
    message.style.alignItems = "baseline";
    message.style.gap = "6px";
    message.style.fontSize = "var(--spui-field-message-size,12px)";
    if (state !== "none") message.style.color = getFieldValidationTokens(state)!.foreground;
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = state === "success" ? "✓" : state === "warning" ? "!" : state === "error" ? "!" : "";
    if (icon.textContent) message.append(icon);
    const content = document.createElement("span");
    appendContent(content, options.validationMessage);
    message.append(content);
    wrapper.append(message);
  }
  return wrapper;
}

export { getLabelStyle };
