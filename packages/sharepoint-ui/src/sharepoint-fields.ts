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
  LookupList?: string;
  lookupList?: string;
  LookupField?: string;
  lookupField?: string;
  LookupWebId?: string;
  lookupWebId?: string;
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
  lookupSource?: { listId: string; displayField: string; webId?: string };
  unsupportedReason?: string;
};

export type SharePointLookupId = number | string;
export type SharePointLookupValue = SharePointLookupId | readonly SharePointLookupId[] | null;
export type SharePointLookupUpdate = Record<string, number | null | { results: number[] }>;
export type SharePointChoiceValue = string | readonly string[] | null;
export type SharePointChoiceUpdate = Record<string, string | null | { results: string[] }>;
export type SharePointUrlValue = { url: string; description?: string };
export type SharePointFieldValue = string | number | boolean | Date | SharePointUrlValue | readonly string[] | readonly SharePointLookupId[] | null;
export type SharePointFieldUpdateValue = string | number | boolean | null | { results: Array<string | number> } | { __metadata: { type: "SP.FieldUrlValue" }; Url: string; Description: string };
export type SharePointFieldUpdate = Record<string, SharePointFieldUpdateValue>;

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
    const lookupList = field.LookupList ?? field.lookupList;
    const lookupField = field.LookupField ?? field.lookupField;
    const lookupSource = normalized.startsWith("lookup") && lookupList && lookupField
      ? { listId: lookupList, displayField: lookupField, webId: field.LookupWebId ?? field.lookupWebId }
      : undefined;
    return { ...finish("combobox"), multiple: normalized.endsWith("multi") || booleanValue(field.AllowMultipleValues ?? field.allowMultipleValues), lookupSource };
  }
  if (["counter", "computed", "calculated"].includes(normalized)) return { ...finish("read-only"), readOnly: true };

  return { ...adapter, unsupportedReason: "This SharePoint field type needs a specialized data source or renderer." };
}

/** Build a paged REST URL for options in a lookup field's source list. Pass that list's web URL. */
export function getSharePointLookupOptionsUrl(field: SharePointFieldMetadata, lookupWebUrl: string, pageSize = 100): string {
  const adapter = getSharePointFieldAdapter(field);
  const source = adapter.lookupSource;
  if (adapter.control !== "combobox" || !source) throw new TypeError("This field does not include SharePoint lookup-list metadata.");
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 500) throw new RangeError("pageSize must be an integer from 1 to 500.");

  const listId = source.listId.replace(/[{}]/g, "");
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(listId)) throw new TypeError("LookupList must contain a SharePoint list GUID.");
  if (!/^[A-Za-z_][A-Za-z\d_]*$/.test(source.displayField)) throw new TypeError("LookupField must be a SharePoint internal field name.");

  const url = new URL(lookupWebUrl);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new TypeError("lookupWebUrl must be an HTTP(S) SharePoint web URL.");
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/_api/web/lists(guid'${listId}')/items`;
  url.search = new URLSearchParams({
    "$select": `Id,${source.displayField}`,
    "$orderby": `${source.displayField} asc`,
    "$top": String(pageSize)
  }).toString();
  url.hash = "";
  return url.toString();
}

/** Serialize selected SharePoint lookup/person IDs for an item create or update body. */
export function serializeSharePointLookupValue(field: SharePointFieldMetadata, value: SharePointLookupValue): SharePointLookupUpdate {
  const adapter = getSharePointFieldAdapter(field);
  const type = adapter.fieldType.replace(/^SP\.Field/, "").toLowerCase();
  if (adapter.control !== "combobox" || !["lookup", "lookupmulti", "user", "usermulti"].includes(type)) {
    throw new TypeError("Only SharePoint Lookup and User fields can be serialized as ID selections.");
  }
  if (!adapter.name) throw new TypeError("The SharePoint field must include InternalName.");
  const key = `${adapter.name}Id`;

  if (adapter.multiple) {
    if (value == null) return { [key]: { results: [] } };
    if (!isLookupIdArray(value)) throw new TypeError("A multi-value field requires an array of selected IDs.");
    return { [key]: { results: [...new Set(value.map(parseLookupId))] } };
  }
  if (isLookupIdArray(value)) throw new TypeError("A single-value field accepts one selected ID or null.");
  return { [key]: value == null || value === "" ? null : parseLookupId(value) };
}

/** Serialize SharePoint Choice and MultiChoice values for an item create or update body. */
export function serializeSharePointChoiceValue(field: SharePointFieldMetadata, value: SharePointChoiceValue): SharePointChoiceUpdate {
  const adapter = getSharePointFieldAdapter(field);
  const type = adapter.fieldType.replace(/^SP\.Field/, "").toLowerCase();
  const multiple = type === "multichoice";
  if (!["choice", "outcomechoice", "multichoice"].includes(type)) {
    throw new TypeError("Only SharePoint Choice and MultiChoice fields can be serialized as choice values.");
  }
  if (!adapter.name) throw new TypeError("The SharePoint field must include InternalName.");
  const choices = field.Choices ?? field.choices ?? [];
  const allowFillIn = booleanValue(field.FillInChoice ?? field.fillInChoice);
  const validateChoice = (choice: string): string => {
    if (choices.length && !choices.includes(choice) && !allowFillIn) throw new RangeError(`“${choice}” is not an allowed value for ${adapter.label}.`);
    return choice;
  };

  if (multiple) {
    if (value == null) return { [adapter.name]: { results: [] } };
    if (!isChoiceValueArray(value)) throw new TypeError("A MultiChoice field requires an array of selected values.");
    return { [adapter.name]: { results: [...new Set(value.map(validateChoice))] } };
  }
  if (isChoiceValueArray(value)) throw new TypeError("A Choice field accepts one value or null.");
  return { [adapter.name]: value == null || value === "" ? null : validateChoice(value) };
}

/** Serialize a common SharePoint list-field value into a REST item create/update body. */
export function serializeSharePointFieldValue(field: SharePointFieldMetadata, value: SharePointFieldValue): SharePointFieldUpdate {
  const adapter = getSharePointFieldAdapter(field);
  const type = adapter.fieldType.replace(/^SP\.Field/, "").toLowerCase();
  if (!adapter.name) throw new TypeError("The SharePoint field must include InternalName.");
  if (adapter.readOnly) throw new TypeError(`${adapter.label} is read-only and cannot be serialized for an item update.`);

  if (["lookup", "lookupmulti", "user", "usermulti"].includes(type)) {
    return serializeSharePointLookupValue(field, value as SharePointLookupValue);
  }
  if (["choice", "outcomechoice", "multichoice"].includes(type)) {
    return serializeSharePointChoiceValue(field, value as SharePointChoiceValue);
  }
  if (["text", "note"].includes(type)) {
    if (value != null && typeof value !== "string") throw new TypeError(`${adapter.label} requires a string value or null.`);
    return { [adapter.name]: value as string | null };
  }
  if (type === "boolean") {
    if (value != null && typeof value !== "boolean") throw new TypeError(`${adapter.label} requires a boolean value or null.`);
    return { [adapter.name]: value as boolean | null };
  }
  if (["integer", "number", "currency"].includes(type)) {
    if (value == null || value === "") return { [adapter.name]: null };
    const numeric = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" && /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(value.trim()) ? Number(value) : NaN;
    if (!Number.isFinite(numeric) || (type === "integer" && !Number.isSafeInteger(numeric))) {
      throw new TypeError(`${adapter.label} requires a ${type === "integer" ? "safe integer" : "finite number"}, numeric string, or null.`);
    }
    return { [adapter.name]: numeric };
  }
  if (type === "datetime") {
    if (value == null || value === "") return { [adapter.name]: null };
    if (value instanceof Date) {
      if (!Number.isFinite(value.getTime())) throw new TypeError(`${adapter.label} requires a valid date, ISO date string, or null.`);
      return { [adapter.name]: value.toISOString() };
    }
    if (typeof value !== "string") throw new TypeError(`${adapter.label} requires a valid date, ISO date string, or null.`);
    const iso = serializeSharePointDateValue(value);
    if (!iso) throw new TypeError(`${adapter.label} requires a valid ISO date or date-time string.`);
    return { [adapter.name]: iso };
  }
  if (type === "url") {
    if (value == null || value === "") return { [adapter.name]: null };
    const link = typeof value === "string" ? { url: value, description: value.trim() } : isSharePointUrlValue(value) ? value : undefined;
    if (!link) throw new TypeError(`${adapter.label} requires a URL string, URL value, or null.`);
    const url = link.url.trim();
    if (url.length > 255) throw new RangeError(`${adapter.label} URL cannot exceed 255 characters.`);
    if (url && !isSharePointFieldUrl(url)) throw new TypeError(`${adapter.label} must be an HTTP(S) or server-relative URL.`);
    const description = link.description ?? url;
    if (typeof description !== "string") throw new TypeError(`${adapter.label} URL description must be a string.`);
    if (description.length > 255) throw new RangeError(`${adapter.label} URL description cannot exceed 255 characters.`);
    return { [adapter.name]: { __metadata: { type: "SP.FieldUrlValue" }, Url: url, Description: description } };
  }

  throw new TypeError(adapter.unsupportedReason ?? `${adapter.fieldType} fields cannot be serialized by this helper.`);
}

function isLookupIdArray(value: SharePointLookupValue): value is readonly SharePointLookupId[] {
  return Array.isArray(value);
}

function isChoiceValueArray(value: SharePointChoiceValue): value is readonly string[] {
  return Array.isArray(value);
}

function isSharePointFieldUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isSharePointUrlValue(value: SharePointFieldValue): value is SharePointUrlValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date) && typeof (value as SharePointUrlValue).url === "string";
}

function serializeSharePointDateValue(value: string): string | undefined {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const dateTime = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  const match = dateOnly ?? dateTime;
  if (!match) return undefined;
  const day = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== `${match[1]}-${match[2]}-${match[3]}`) return undefined;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  if (dateOnly || dateTime?.[4]) return value;
  return parsed.toISOString();
}

function parseLookupId(value: SharePointLookupId): number {
  const id = typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value.trim()) : value;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1) throw new RangeError("SharePoint lookup IDs must be positive safe integers.");
  return id;
}
