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
  MaxLength?: string | number;
  maxLength?: string | number;
  MinimumValue?: string | number;
  minimumValue?: string | number;
  MaximumValue?: string | number;
  maximumValue?: string | number;
  Min?: string | number;
  min?: string | number;
  Max?: string | number;
  max?: string | number;
  LookupList?: string;
  lookupList?: string;
  LookupField?: string;
  lookupField?: string;
  LookupWebId?: string;
  lookupWebId?: string;
  TermSetId?: string;
  termSetId?: string;
};

export type SharePointFieldControl = "input" | "textarea" | "rich-text-editor" | "select" | "radio-group" | "checkbox" | "multi-choice" | "date-picker" | "combobox" | "taxonomy" | "read-only" | "unsupported";

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
  inputType?: "text" | "number" | "url" | "datetime-local";
  urlFormat?: "hyperlink" | "picture";
  step?: number | "any";
  min?: number;
  max?: number;
  maxLength?: number;
  dateMode?: "date" | "date-time";
  choices?: readonly string[];
  allowFillIn?: boolean;
  richText?: ReturnType<typeof getRichTextEditorFieldOptions>;
  lookupSource?: { listId: string; displayField: string; webId?: string };
  termSetId?: string;
  unsupportedReason?: string;
};

export type SharePointLookupId = number | string;
export type SharePointLookupValue = SharePointLookupId | readonly SharePointLookupId[] | null;
export type SharePointLookupUpdate = Record<string, number | null | { results: number[] }>;
export type SharePointChoiceValue = string | readonly string[] | null;
export type SharePointChoiceUpdate = Record<string, string | null | { results: string[] }>;
export type SharePointUrlValue = { url: string; description?: string };
export type SharePointTaxonomyTermValue = { label: string; termGuid: string; wssId?: number };
export type SharePointTaxonomyValue = SharePointTaxonomyTermValue | readonly SharePointTaxonomyTermValue[] | null;
export type SharePointFieldValue = string | number | boolean | Date | SharePointUrlValue | SharePointTaxonomyTermValue | readonly string[] | readonly SharePointLookupId[] | readonly SharePointTaxonomyTermValue[] | null;
export type SharePointFieldValues = Readonly<Record<string, SharePointFieldValue | undefined>>;
export type SharePointTaxonomyFieldFormValue = { FieldName: string; FieldValue: string };
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
    if (normalized === "url") {
      const displayFormat = String(field.DisplayFormat ?? field.displayFormat ?? "0").trim().toLowerCase();
      control.urlFormat = displayFormat === "1" || displayFormat === "image" || displayFormat === "picture" ? "picture" : "hyperlink";
    }
    control.maxLength = getConfiguredMaxLength(field);
    if (control.inputType === "number") {
      const decimalPlaces = getConfiguredDecimalPlaces(field);
      control.step = normalized === "integer" || decimalPlaces === 0 ? 1 : decimalPlaces == null ? "any" : 10 ** -decimalPlaces;
      control.min = getConfiguredNumber(field.MinimumValue ?? field.minimumValue ?? field.Min ?? field.min);
      control.max = getConfiguredNumber(field.MaximumValue ?? field.maximumValue ?? field.Max ?? field.max);
    }
    return control;
  }
  if (normalized === "taxonomyfieldtype" || normalized === "taxonomyfieldtypemulti") {
    return { ...finish("taxonomy"), multiple: normalized.endsWith("multi") || booleanValue(field.AllowMultipleValues ?? field.allowMultipleValues), termSetId: field.TermSetId ?? field.termSetId };
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
    const dateMode = displayFormat === 1 || String(displayFormat).toLowerCase() === "1" || String(displayFormat).toLowerCase() === "datetime" ? "date-time" : "date";
    return dateMode === "date-time"
      ? { ...finish("input"), inputType: "datetime-local", dateMode }
      : { ...finish("date-picker"), dateMode };
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

/** Build a bounded REST request for a list's field definitions and their type-specific metadata. */
export function getSharePointFieldMetadataUrl(listWebUrl: string, listId: string, pageSize = 100): string {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 500) throw new RangeError("pageSize must be an integer from 1 to 500.");
  const normalizedListId = normalizeSharePointListId(listId, "listId must be a SharePoint list GUID.");
  const url = parseSharePointWebUrl(listWebUrl, "listWebUrl");
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/_api/web/lists(guid'${normalizedListId}')/fields`;
  url.search = new URLSearchParams({ "$select": "*", "$top": String(pageSize) }).toString();
  url.hash = "";
  return url.toString();
}

/** Build the REST endpoint for a single item in a SharePoint list. */
export function getSharePointListItemUrl(webUrl: string, listId: string, itemId: number): string {
  if (!Number.isSafeInteger(itemId) || itemId < 1) throw new RangeError("itemId must be a positive safe integer.");
  const normalizedListId = normalizeSharePointListId(listId, "listId must be a SharePoint list GUID.");
  const url = parseSharePointWebUrl(webUrl, "webUrl");
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/_api/web/lists(guid'${normalizedListId}')/items(${itemId})`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

/** Build the item endpoint used by SharePoint's ValidateUpdateListItem form-value API. */
export function getSharePointValidateUpdateListItemUrl(webUrl: string, listId: string, itemId: number): string {
  return `${getSharePointListItemUrl(webUrl, listId, itemId)}/ValidateUpdateListItem()`;
}

/** Build a paged REST URL for options in a lookup field's source list. Pass that list's web URL. */
export function getSharePointLookupOptionsUrl(field: SharePointFieldMetadata, lookupWebUrl: string, pageSize = 100): string {
  const adapter = getSharePointFieldAdapter(field);
  const source = adapter.lookupSource;
  if (adapter.control !== "combobox" || !source) throw new TypeError("This field does not include SharePoint lookup-list metadata.");
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 500) throw new RangeError("pageSize must be an integer from 1 to 500.");

  const listId = normalizeSharePointListId(source.listId, "LookupList must contain a SharePoint list GUID.");
  if (!/^[A-Za-z_][A-Za-z\d_]*$/.test(source.displayField)) throw new TypeError("LookupField must be a SharePoint internal field name.");

  const url = parseSharePointWebUrl(lookupWebUrl, "lookupWebUrl");
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/_api/web/lists(guid'${listId}')/items`;
  url.search = new URLSearchParams({
    "$select": `Id,${source.displayField}`,
    "$orderby": `${source.displayField} asc`,
    "$top": String(pageSize)
  }).toString();
  url.hash = "";
  return url.toString();
}

/** Resolve a SharePoint OData next link and reject links that would send host credentials to another origin. */
export function getSharePointNextPageUrl(webUrl: string, nextLink?: string | null): string | null {
  if (nextLink == null) return null;
  if (typeof nextLink !== "string") throw new TypeError("nextLink must be a URL string or null.");
  if (nextLink.trim() === "") return null;
  const base = new URL(webUrl);
  if (!/^https?:$/.test(base.protocol) || base.username || base.password) throw new TypeError("webUrl must be an HTTP(S) SharePoint web URL.");
  const next = new URL(nextLink, base);
  if (!/^https?:$/.test(next.protocol) || next.origin !== base.origin || next.username || next.password) {
    throw new TypeError("SharePoint next links must resolve to the same HTTP(S) origin as webUrl.");
  }
  next.hash = "";
  return next.toString();
}

/** Serialize selected SharePoint lookup/person IDs for an item create or update body. */
export function serializeSharePointLookupValue(field: SharePointFieldMetadata, value: SharePointLookupValue): SharePointLookupUpdate {
  const adapter = getSharePointFieldAdapter(field);
  const type = adapter.fieldType.replace(/^SP\.Field/, "").toLowerCase();
  if (adapter.control !== "combobox" || !["lookup", "lookupmulti", "user", "usermulti"].includes(type)) {
    throw new TypeError("Only SharePoint Lookup and User fields can be serialized as ID selections.");
  }
  if (!adapter.name) throw new TypeError("The SharePoint field must include InternalName.");
  assertSharePointFieldValueWritable(adapter, value);
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
  assertSharePointFieldValueWritable(adapter, value);
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

  if (type === "taxonomyfieldtype" || type === "taxonomyfieldtypemulti") {
    throw new TypeError(`${adapter.label} is a managed-metadata field; use serializeSharePointTaxonomyFieldFormValue() with ValidateUpdateListItem.`);
  }

  if (["lookup", "lookupmulti", "user", "usermulti"].includes(type)) {
    return serializeSharePointLookupValue(field, value as SharePointLookupValue);
  }
  if (["choice", "outcomechoice", "multichoice"].includes(type)) {
    return serializeSharePointChoiceValue(field, value as SharePointChoiceValue);
  }
  assertSharePointFieldValueWritable(adapter, value);
  if (["text", "note"].includes(type)) {
    if (value != null && typeof value !== "string") throw new TypeError(`${adapter.label} requires a string value or null.`);
    const maxLength = getConfiguredMaxLength(field);
    if (typeof value === "string" && maxLength != null && value.length > maxLength) throw new RangeError(`${adapter.label} allows at most ${maxLength} characters.`);
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
    const allowedDecimals = type === "integer" ? 0 : getConfiguredDecimalPlaces(field);
    const precisionSource = typeof value === "string" || typeof value === "number" ? value : numeric;
    if (allowedDecimals != null && getNumericDecimalPlaces(precisionSource) > allowedDecimals) {
      throw new RangeError(`${adapter.label} allows at most ${allowedDecimals} decimal places.`);
    }
    const minimum = getConfiguredNumber(field.MinimumValue ?? field.minimumValue ?? field.Min ?? field.min);
    const maximum = getConfiguredNumber(field.MaximumValue ?? field.maximumValue ?? field.Max ?? field.max);
    if (minimum != null && numeric < minimum) throw new RangeError(`${adapter.label} must be at least ${minimum}.`);
    if (maximum != null && numeric > maximum) throw new RangeError(`${adapter.label} must be at most ${maximum}.`);
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
    const maxLength = Math.min(255, getConfiguredMaxLength(field) ?? 255);
    if (url.length > maxLength) throw new RangeError(`${adapter.label} URL cannot exceed ${maxLength} characters.`);
    if (url && !isSharePointFieldUrl(url)) throw new TypeError(`${adapter.label} must be an HTTP(S) or server-relative URL.`);
    const description = link.description ?? url;
    if (typeof description !== "string") throw new TypeError(`${adapter.label} URL description must be a string.`);
    if (description.length > 255) throw new RangeError(`${adapter.label} URL description cannot exceed 255 characters.`);
    return { [adapter.name]: { __metadata: { type: "SP.FieldUrlValue" }, Url: url, Description: description } };
  }

  throw new TypeError(adapter.unsupportedReason ?? `${adapter.fieldType} fields cannot be serialized by this helper.`);
}

/** Serialize a managed-metadata field for the ValidateUpdateListItem formValues array. */
export function serializeSharePointTaxonomyFieldFormValue(field: SharePointFieldMetadata, value: SharePointTaxonomyValue): SharePointTaxonomyFieldFormValue {
  const adapter = getSharePointFieldAdapter(field);
  const type = adapter.fieldType.replace(/^SP\.Field/, "").toLowerCase();
  if (adapter.control !== "taxonomy" || (type !== "taxonomyfieldtype" && type !== "taxonomyfieldtypemulti")) {
    throw new TypeError(`${adapter.label} is not a SharePoint managed-metadata field.`);
  }
  if (!adapter.name) throw new TypeError("The SharePoint field must include InternalName.");
  assertSharePointFieldValueWritable(adapter, value);

  const terms = adapter.multiple
    ? value == null ? [] : Array.isArray(value) ? value : (() => { throw new TypeError(`${adapter.label} requires an array of selected terms.`); })()
    : value == null ? [] : Array.isArray(value) ? (() => { throw new TypeError(`${adapter.label} accepts one selected term or null.`); })() : [value as SharePointTaxonomyTermValue];
  const serialized = terms.map(term => {
    if (!term || typeof term.label !== "string" || !term.label.trim()) throw new TypeError(`${adapter.label} terms require a non-empty label.`);
    const termGuid = normalizeSharePointListId(term.termGuid, `${adapter.label} terms require a valid term GUID.`);
    if (term.label.includes(";#") || term.label.includes("|")) throw new TypeError(`${adapter.label} term labels cannot contain “;#” or “|”.`);
    const wssId = term.wssId ?? -1;
    if (!Number.isSafeInteger(wssId) || wssId < -1) throw new RangeError(`${adapter.label} term WssId must be -1 or a non-negative safe integer.`);
    return `${wssId};#${term.label.trim()}|${termGuid}`;
  });
  if (!adapter.multiple && serialized.length > 1) throw new TypeError(`${adapter.label} accepts one selected term.`);
  return { FieldName: adapter.name, FieldValue: serialized.join(";#") };
}

/** Build one SharePoint item patch from values keyed by field InternalName; omitted values stay untouched. */
export function serializeSharePointFieldValues(fields: readonly SharePointFieldMetadata[], values: SharePointFieldValues): SharePointFieldUpdate {
  const update: SharePointFieldUpdate = {};
  const fieldsByName = new Map<string, { field: SharePointFieldMetadata; adapter: SharePointFieldAdapter }>();
  for (const field of fields) {
    const adapter = getSharePointFieldAdapter(field);
    if (!adapter.name) throw new TypeError("Every SharePoint field must include InternalName.");
    if (fieldsByName.has(adapter.name)) throw new TypeError(`Duplicate SharePoint field InternalName: ${adapter.name}.`);
    fieldsByName.set(adapter.name, { field, adapter });
  }
  for (const [name, value] of Object.entries(values)) {
    const entry = fieldsByName.get(name);
    if (!entry) throw new TypeError(`No SharePoint field metadata was supplied for ${name}.`);
    const { field, adapter } = entry;
    if (value === undefined) {
      if (adapter.required) throw new TypeError(`${adapter.label} is required.`);
      continue;
    }
    for (const [name, serializedValue] of Object.entries(serializeSharePointFieldValue(field, value))) {
      if (Object.prototype.hasOwnProperty.call(update, name)) throw new TypeError(`Multiple SharePoint fields map to update property ${name}.`);
      Object.defineProperty(update, name, { configurable: true, enumerable: true, value: serializedValue, writable: true });
    }
  }
  return update;
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

function normalizeSharePointListId(value: string, errorMessage: string): string {
  const normalized = value.trim().replace(/[{}]/g, "");
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(normalized)) throw new TypeError(errorMessage);
  return normalized;
}

function parseSharePointWebUrl(value: string, label: string): URL {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new TypeError(`${label} must be an HTTP(S) SharePoint web URL.`);
  return url;
}

function isSharePointUrlValue(value: SharePointFieldValue): value is SharePointUrlValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date) && typeof (value as SharePointUrlValue).url === "string";
}

function isEmptySharePointFieldValue(value: SharePointFieldValue): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return isSharePointUrlValue(value) && value.url.trim() === "";
}

function assertSharePointFieldValueWritable(adapter: SharePointFieldAdapter, value: SharePointFieldValue): void {
  if (adapter.readOnly) throw new TypeError(`${adapter.label} is read-only and cannot be serialized for an item update.`);
  if (adapter.required && isEmptySharePointFieldValue(value)) throw new TypeError(`${adapter.label} is required.`);
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

function getConfiguredDecimalPlaces(field: SharePointFieldMetadata): number | undefined {
  const decimals = field.Decimals ?? field.decimals;
  const value = typeof decimals === "number" ? decimals : typeof decimals === "string" && /^\d+$/.test(decimals.trim()) ? Number(decimals) : undefined;
  return value != null && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function getConfiguredMaxLength(field: SharePointFieldMetadata): number | undefined {
  const value = field.MaxLength ?? field.maxLength;
  const parsed = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value) : undefined;
  return parsed != null && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function getConfiguredNumber(value: string | number | undefined): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" && /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(value.trim()) ? Number(value.trim()) : undefined;
  return parsed != null && Number.isFinite(parsed) ? parsed : undefined;
}

function getNumericDecimalPlaces(value: string | number): number {
  const [coefficient, exponentText] = String(value).trim().toLowerCase().split("e");
  const [integer = "", fraction = ""] = coefficient.split(".");
  const exponent = Number(exponentText ?? 0);
  const significantFractionLength = fraction.replace(/0+$/, "").length;
  const removableIntegerZeros = exponent < 0 ? integer.match(/0+$/)?.[0].length ?? 0 : 0;
  return Math.max(0, significantFractionLength - exponent - removableIntegerZeros);
}

function parseLookupId(value: SharePointLookupId): number {
  const id = typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value.trim()) : value;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1) throw new RangeError("SharePoint lookup IDs must be positive safe integers.");
  return id;
}
