type SharePointBoolean = boolean | string;

export type SharePointMultiLineField = {
  richText?: SharePointBoolean;
  restrictedMode?: SharePointBoolean;
  richTextMode?: string;
  allowHyperlink?: SharePointBoolean;
  RichText?: SharePointBoolean;
  RestrictedMode?: SharePointBoolean;
  RichTextMode?: string;
  AllowHyperlink?: SharePointBoolean;
};

export function getRichTextEditorFieldOptions(field: SharePointMultiLineField): { contentMode: "plain" | "restricted" | "rich" | "html"; allowHyperlink: boolean } {
  const asBoolean = (value: SharePointBoolean | undefined): boolean | undefined => value === undefined ? undefined : value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");
  const richText = asBoolean(field.RichText ?? field.richText);
  const restricted = asBoolean(field.RestrictedMode ?? field.restrictedMode) ?? false;
  const mode = (field.RichTextMode ?? field.richTextMode)?.trim().toLowerCase();
  const contentMode = richText === false ? "plain" : restricted ? "restricted" : mode === "fullhtml" ? "html" : mode === "compatible" || richText === true ? "rich" : "html";
  const fieldAllowsHyperlinks = asBoolean(field.AllowHyperlink ?? field.allowHyperlink);
  // Missing field metadata leaves safe, sanitized links enabled; an explicit SharePoint prohibition always wins.
  return {
    contentMode,
    allowHyperlink: contentMode !== "plain" && contentMode !== "restricted" && fieldAllowsHyperlinks !== false
  };
}

export type SharePointFieldMetadata = SharePointMultiLineField & {
  Title?: string;
  title?: string;
  DisplayName?: string;
  displayName?: string;
  InternalName?: string;
  internalName?: string;
  TypeAsString?: string;
  typeAsString?: string;
  FieldTypeKind?: number;
  fieldTypeKind?: number;
  Description?: string;
  description?: string;
  Required?: SharePointBoolean;
  required?: SharePointBoolean;
  ReadOnlyField?: SharePointBoolean;
  readOnlyField?: SharePointBoolean;
  Hidden?: SharePointBoolean;
  hidden?: SharePointBoolean;
  Choices?: readonly string[];
  choices?: readonly string[];
  FillInChoice?: SharePointBoolean;
  fillInChoice?: SharePointBoolean;
  EditFormat?: string | number;
  editFormat?: string | number;
  AllowMultipleValues?: SharePointBoolean;
  allowMultipleValues?: SharePointBoolean;
  DisplayFormat?: string | number;
  displayFormat?: string | number;
  Decimals?: string | number;
  decimals?: string | number;
};

export type SharePointFieldControl = "input" | "textarea" | "rich-text-editor" | "select" | "radio-group" | "checkbox" | "multi-choice" | "date-picker" | "combobox" | "read-only" | "unsupported";

export type SharePointFieldAdapter = {
  control: SharePointFieldControl;
  fieldType: string;
  name: string;
  label: string;
  description?: string;
  required: boolean;
  readOnly: boolean;
  hidden: boolean;
  multiple?: boolean;
  inputType?: "text" | "number" | "url";
  step?: number | "any";
  dateMode?: "date" | "date-time";
  choices?: readonly string[];
  allowFillIn?: boolean;
  richText?: ReturnType<typeof getRichTextEditorFieldOptions>;
  unsupportedReason?: string;
};

const booleanValue = (value: SharePointBoolean | undefined): boolean => value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");

const fieldTypeNames: Record<number, string> = {
  1: "Integer", 2: "Text", 3: "Note", 4: "DateTime", 5: "Counter", 6: "Choice", 7: "Lookup", 8: "Boolean",
  9: "Number", 10: "Currency", 11: "URL", 12: "Computed", 15: "MultiChoice", 17: "Calculated", 20: "User", 32: "OutcomeChoice"
};

/** Map SharePoint REST/CSOM field metadata to a control recipe without importing any UI component code. */
export function getSharePointFieldAdapter(field: SharePointFieldMetadata): SharePointFieldAdapter {
  const fieldTypeKind = field.FieldTypeKind ?? field.fieldTypeKind;
  const kind = field.TypeAsString ?? field.typeAsString ?? (fieldTypeKind == null ? "Unknown" : fieldTypeNames[fieldTypeKind] ?? `FieldTypeKind:${fieldTypeKind}`);
  const normalized = kind.replace(/^SP\.Field/, "").toLowerCase();
  const name = field.InternalName ?? field.internalName ?? "";
  const adapter: SharePointFieldAdapter = {
    control: "unsupported",
    fieldType: kind,
    name,
    label: field.DisplayName ?? field.displayName ?? field.Title ?? field.title ?? name,
    description: field.Description ?? field.description,
    required: booleanValue(field.Required ?? field.required),
    readOnly: booleanValue(field.ReadOnlyField ?? field.readOnlyField),
    hidden: booleanValue(field.Hidden ?? field.hidden)
  };
  const finish = (control: SharePointFieldControl): SharePointFieldAdapter => ({ ...adapter, control });

  if (["text", "integer", "number", "currency", "url"].includes(normalized)) {
    const control = finish("input");
    control.inputType = normalized === "url" ? "url" : ["integer", "number", "currency"].includes(normalized) ? "number" : "text";
    if (control.inputType === "number") {
      const decimals = field.Decimals ?? field.decimals;
      const decimalPlaces = typeof decimals === "number" ? decimals : typeof decimals === "string" && /^\d+$/.test(decimals) ? Number(decimals) : undefined;
      control.step = normalized === "integer" || decimalPlaces === 0 ? 1 : decimalPlaces == null ? "any" : 10 ** -decimalPlaces;
    }
    return control;
  }
  if (normalized === "note") {
    const richText = getRichTextEditorFieldOptions(field);
    return richText.contentMode === "plain" ? finish("textarea") : { ...finish("rich-text-editor"), richText };
  }
  if (normalized === "choice" || normalized === "outcomechoice") {
    const format = field.EditFormat ?? field.editFormat;
    return {
      ...finish(format === 1 || String(format).toLowerCase() === "radiobuttons" ? "radio-group" : "select"),
      choices: field.Choices ?? field.choices ?? [],
      allowFillIn: booleanValue(field.FillInChoice ?? field.fillInChoice)
    };
  }
  if (normalized === "multichoice") {
    return { ...finish("multi-choice"), choices: field.Choices ?? field.choices ?? [], allowFillIn: booleanValue(field.FillInChoice ?? field.fillInChoice), multiple: true };
  }
  if (normalized === "boolean") return finish("checkbox");
  if (normalized === "datetime") {
    const displayFormat = field.DisplayFormat ?? field.displayFormat;
    return { ...finish("date-picker"), dateMode: displayFormat === 1 || String(displayFormat).toLowerCase() === "1" || String(displayFormat).toLowerCase() === "datetime" ? "date-time" : "date" };
  }
  if (["lookup", "lookupmulti", "user", "usermulti"].includes(normalized)) {
    return { ...finish("combobox"), multiple: normalized.endsWith("multi") || booleanValue(field.AllowMultipleValues ?? field.allowMultipleValues) };
  }
  if (["counter", "computed", "calculated"].includes(normalized)) return { ...finish("read-only"), readOnly: true };

  return { ...adapter, unsupportedReason: "This SharePoint field type needs a specialized data source or renderer." };
}
