import {
  getSharePointFieldAdapter,
  type SharePointFieldMetadata,
  type SharePointTaxonomyTermValue,
  type SharePointFieldValue,
} from "../sharepoint-fields.js";
import { createFormField } from "./field-composition.js";
import { defineSharePointFieldBasicControls } from "./sharepoint-field-basic-controls.js";

export type SharePointFieldOption = { value: string | number; label: string; disabled?: boolean; wssId?: number };
export type SharePointFieldValueChangeDetail = { field: SharePointFieldMetadata; value: SharePointFieldValue };
export type SharePointFieldElement = HTMLElement & {
  field: SharePointFieldMetadata | undefined;
  value: SharePointFieldValue | undefined;
  defaultValue: SharePointFieldValue | undefined;
  options: readonly SharePointFieldOption[];
  disabled: boolean;
  onValueChange?: (value: SharePointFieldValue, field: SharePointFieldMetadata) => void;
  renderUnsupported?: (field: SharePointFieldMetadata, reason: string) => Node | null;
};

declare global {
  interface HTMLElementTagNameMap { "spui-sharepoint-field": SharePointFieldElement; }
  interface HTMLElementEventMap { "spui-field-value-change": CustomEvent<SharePointFieldValueChangeDetail>; }
}

type FieldControl = HTMLElement & { value?: string | string[]; checked?: boolean | "mixed"; defaultChecked?: boolean | "mixed"; selectedValue?: string; selectedOptions?: string[] };
type FieldChange = Event & { detail?: { value?: string; checked?: boolean | "mixed"; selectedValue?: string; selectedOptions?: string[]; values?: string[] } };

const textValue = (value: SharePointFieldValue | undefined): string => {
  if (value == null) return "";
  if (value instanceof Date) {
    const pad = (part: number): string => String(part).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}${value.getHours() || value.getMinutes() ? `T${pad(value.getHours())}:${pad(value.getMinutes())}` : ""}`;
  }
  if (Array.isArray(value)) return value.map(item => typeof item === "object" && item !== null && "termGuid" in item ? String(item.label ?? item.termGuid) : String(item)).join(", ");
  if (typeof value === "object" && "termGuid" in value) return value.label;
  if (typeof value === "object" && "url" in value) return value.url;
  return String(value);
};

function taxonomyTerms(value: SharePointFieldValue | undefined): SharePointTaxonomyTermValue[] {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.filter((item): item is SharePointTaxonomyTermValue => typeof item === "object" && item !== null && "termGuid" in item && "label" in item);
}

function taxonomyValuesFromIds(ids: readonly string[], currentValue: SharePointFieldValue | undefined, options: readonly SharePointFieldOption[], multiple: boolean): SharePointFieldValue {
  const current = taxonomyTerms(currentValue);
  const values = ids.map(id => current.find(term => term.termGuid.toLowerCase() === id.toLowerCase()) ?? (() => {
    const option = options.find(item => String(item.value).toLowerCase() === id.toLowerCase());
    return { termGuid: id, label: option?.label ?? id, ...(option?.wssId === undefined ? {} : { wssId: option.wssId }) };
  })());
  return multiple ? values : values[0] ?? null;
}

function makeOption(tag: string, option: SharePointFieldOption): HTMLElement {
  const element = document.createElement(tag);
  element.setAttribute("value", String(option.value));
  element.setAttribute(tag === "option" ? "value" : "label", tag === "option" ? String(option.value) : option.label);
  if (tag === "option") element.textContent = option.label;
  else element.textContent = option.label;
  if (option.disabled) element.setAttribute("disabled", "");
  return element;
}

async function loadFieldControl(adapter: ReturnType<typeof getSharePointFieldAdapter>): Promise<void> {
  switch (adapter.control) {
    case "input":
    case "read-only":
    case "textarea":
    case "radio-group":
    case "checkbox":
    case "multi-choice":
    case "select":
      if (adapter.control === "select" && adapter.allowFillIn && !customElements.get("spui-combobox")) {
        await import(/* webpackChunkName: "spui-sharepoint-field-freeform-choice" */ "./combobox.js").then(module => module.defineCombobox());
      }
      return;
    case "rich-text-editor":
      if (!customElements.get("spui-rich-text-editor")) (await import(/* webpackChunkName: "spui-sharepoint-field-rich-text" */ "./rich-text-editor.js")).defineRichTextEditor();
      break;
    case "date-picker":
      if (!customElements.get("spui-date-picker")) (await import(/* webpackChunkName: "spui-sharepoint-field-date" */ "./date-picker.js")).defineDatePicker();
      break;
    case "combobox":
      if (!customElements.get("spui-combobox")) (await import(/* webpackChunkName: "spui-sharepoint-field-lookup" */ "./combobox.js")).defineCombobox();
      break;
    case "taxonomy":
      if (adapter.multiple) {
        if (!customElements.get("spui-tag-picker")) (await import(/* webpackChunkName: "spui-sharepoint-field-taxonomy" */ "./tag-picker.js")).defineTagPicker();
      } else if (!customElements.get("spui-combobox")) (await import(/* webpackChunkName: "spui-sharepoint-field-taxonomy" */ "./combobox.js")).defineCombobox();
      break;
  }
}

/** Render SharePoint field metadata as a framework-free, theme-aware form control. */
export function defineSharePointField(): void {
  if (customElements.get("spui-sharepoint-field")) return;
  defineSharePointFieldBasicControls();

  class SpuiSharePointField extends HTMLElement {
    static observedAttributes = ["field", "value", "disabled", "hint", "validation-message", "empty-option-label", "add-choice-label"];
    private fieldValue?: SharePointFieldMetadata;
    private currentValue?: SharePointFieldValue;
    private initialValue?: SharePointFieldValue;
    private currentOptions: readonly SharePointFieldOption[] = [];
    private hasProvidedOptions = false;
    private controlled = false;
    private renderVersion = 0;
    private valueChangeCallback?: SharePointFieldElement["onValueChange"];
    private unsupportedRenderer?: SharePointFieldElement["renderUnsupported"];

    get field(): SharePointFieldMetadata | undefined { return this.fieldValue; }
    set field(value: SharePointFieldMetadata | undefined) { this.fieldValue = value; if (this.isConnected) this.render(); }
    get value(): SharePointFieldValue | undefined { return this.currentValue; }
    set value(value: SharePointFieldValue | undefined) {
      this.controlled = true;
      this.currentValue = value;
      this.syncControlValue();
    }
    get defaultValue(): SharePointFieldValue | undefined { return this.initialValue; }
    set defaultValue(value: SharePointFieldValue | undefined) {
      this.initialValue = value;
      if (!this.controlled) this.currentValue = value;
      if (this.isConnected) this.render();
    }
    get options(): readonly SharePointFieldOption[] { return this.currentOptions; }
    set options(value: readonly SharePointFieldOption[]) { this.currentOptions = [...(value ?? [])]; this.hasProvidedOptions = true; if (this.isConnected) this.render(); }
    get disabled(): boolean { return this.hasAttribute("disabled"); }
    set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
    get onValueChange(): SharePointFieldElement["onValueChange"] { return this.valueChangeCallback; }
    set onValueChange(value: SharePointFieldElement["onValueChange"]) { this.valueChangeCallback = value; }
    get renderUnsupported(): SharePointFieldElement["renderUnsupported"] { return this.unsupportedRenderer; }
    set renderUnsupported(value: SharePointFieldElement["renderUnsupported"]) { this.unsupportedRenderer = value; }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (!this.isConnected) return;
      if (name === "field") {
        try { this.fieldValue = value ? JSON.parse(value) as SharePointFieldMetadata : undefined; } catch { this.fieldValue = undefined; }
        this.render();
      } else if (name === "value") {
        if (!this.controlled) { this.currentValue = value; this.initialValue = value; }
        this.syncControlValue();
      } else this.render();
    }

    connectedCallback(): void {
      if (!this.fieldValue) {
        const encoded = this.getAttribute("field");
        if (encoded) { try { this.fieldValue = JSON.parse(encoded) as SharePointFieldMetadata; } catch { /* Keep a useful fallback below. */ } }
      }
      if (this.currentValue === undefined && this.hasAttribute("value")) this.currentValue = this.getAttribute("value");
      if (this.initialValue === undefined && this.hasAttribute("value")) this.initialValue = this.getAttribute("value");
      this.render();
    }

    private async render(): Promise<void> {
      const renderVersion = ++this.renderVersion;
      const field = this.fieldValue;
      if (!field) { this.hidden = false; this.removeAttribute("aria-busy"); this.replaceChildren(); return; }
      const adapter = getSharePointFieldAdapter(field);
      this.setAttribute("aria-busy", "true");
      try {
        await loadFieldControl(adapter);
        if (!this.isConnected || renderVersion !== this.renderVersion) return;
        this.removeAttribute("aria-busy");
        const options = this.hasProvidedOptions ? this.currentOptions : (adapter.choices ?? []).map(value => ({ value, label: value }));
        const label = adapter.label || adapter.name || adapter.fieldType;
        const value = this.currentValue;
        const terms = taxonomyTerms(value);
        const fieldOptions = [...options];
        if (adapter.control === "taxonomy") for (const term of terms) if (!fieldOptions.some(option => String(option.value).toLowerCase() === term.termGuid.toLowerCase())) fieldOptions.push({ value: term.termGuid, label: term.label, wssId: term.wssId });
        const valueText = textValue(value);
        const defaultValueText = textValue(this.initialValue);
        const name = adapter.name || undefined;
        const disabled = this.hasAttribute("disabled");
        const controlDisabled = disabled || (adapter.readOnly && !["input", "textarea", "rich-text-editor"].includes(adapter.control));
        let control: FieldControl;
        const setBasics = (element: FieldControl): FieldControl => {
          if (name) element.setAttribute("name", name);
          if (adapter.required) element.setAttribute("required", "");
          if (controlDisabled) element.setAttribute("disabled", "");
          return element;
        };
        const selectOptions = (element: HTMLElement, tag: string): void => {
          if (tag === "option") {
            const empty = document.createElement("option"); empty.value = ""; empty.textContent = this.getAttribute("empty-option-label") ?? "Select an option"; empty.disabled = adapter.required;
            element.append(empty, ...options.map(option => makeOption(tag, option)));
          } else element.append(...fieldOptions.map(option => makeOption(tag, option)));
        };

        switch (adapter.control) {
          case "input": {
            const input = setBasics(document.createElement("spui-input") as FieldControl);
            input.setAttribute("type", adapter.inputType ?? "text");
            if (this.initialValue !== undefined) input.setAttribute("value", defaultValueText);
            if (adapter.min !== undefined) input.setAttribute("min", String(adapter.min));
            if (adapter.max !== undefined) input.setAttribute("max", String(adapter.max));
            if (adapter.step !== undefined) input.setAttribute("step", String(adapter.step));
            if (adapter.maxLength !== undefined) input.setAttribute("maxlength", String(adapter.maxLength));
            if (adapter.readOnly) input.setAttribute("read-only", "");
            input.value = valueText;
            control = input;
            break;
          }
          case "textarea": {
            const textarea = setBasics(document.createElement("spui-textarea") as FieldControl);
            if (this.initialValue !== undefined) textarea.setAttribute("value", defaultValueText);
            if (adapter.maxLength !== undefined) textarea.setAttribute("maxlength", String(adapter.maxLength));
            if (adapter.readOnly) textarea.setAttribute("read-only", "");
            textarea.value = valueText;
            control = textarea;
            break;
          }
          case "rich-text-editor": {
            const editor = setBasics(document.createElement("spui-rich-text-editor") as FieldControl);
            if (this.initialValue !== undefined) editor.setAttribute("value", defaultValueText);
            editor.setAttribute("content-mode", adapter.richText?.contentMode ?? "rich");
            if (adapter.richText?.allowHyperlink === false) editor.setAttribute("allow-hyperlink", "false");
            if (adapter.readOnly) editor.setAttribute("read-only", "");
            editor.value = valueText;
            control = editor;
            break;
          }
          case "select": {
            if (adapter.allowFillIn) {
              const combo = setBasics(document.createElement("spui-combobox") as FieldControl);
              combo.setAttribute("allow-freeform", "");
              combo.setAttribute("placeholder", this.getAttribute("empty-option-label") ?? "Select an option");
              selectOptions(combo, "spui-combobox-option");
              combo.value = valueText;
              control = combo;
            } else {
              const select = setBasics(document.createElement("spui-select") as FieldControl);
              selectOptions(select, "option");
              if (this.initialValue !== undefined) select.setAttribute("default-value", defaultValueText);
              select.value = valueText;
              control = select;
            }
            break;
          }
          case "radio-group": {
            const radio = setBasics(document.createElement("spui-radio-group") as FieldControl);
            selectOptions(radio, "spui-radio-option");
            if (this.initialValue !== undefined) radio.setAttribute("default-value", defaultValueText);
            radio.value = valueText;
            control = radio;
            break;
          }
          case "checkbox": {
            const checkbox = setBasics(document.createElement("spui-checkbox") as FieldControl);
            checkbox.setAttribute("label", label);
            if (this.initialValue !== undefined) checkbox.defaultChecked = this.initialValue === true || this.initialValue === "true";
            checkbox.checked = value === true || value === "true";
            control = checkbox;
            break;
          }
          case "multi-choice": {
            const group = document.createElement("fieldset") as FieldControl;
            group.style.minWidth = "0"; group.style.margin = "0"; group.style.padding = "0"; group.style.border = "0"; group.style.display = "grid"; group.style.gap = "var(--spui-control-gap,6px)";
            const legend = document.createElement("legend"); legend.textContent = label; group.append(legend);
            const selected = Array.isArray(value) ? value.map(String) : [];
            const visibleOptions: SharePointFieldOption[] = [...options];
            const initialSelected = Array.isArray(this.initialValue) ? this.initialValue.map(String) : [];
            for (const selectedValue of [...selected, ...initialSelected]) if (!visibleOptions.some(option => String(option.value) === selectedValue)) visibleOptions.push({ value: selectedValue, label: selectedValue });
            for (const option of visibleOptions) {
              const checkbox = document.createElement("spui-checkbox") as FieldControl;
              checkbox.setAttribute("label", option.label);
              checkbox.setAttribute("value", String(option.value));
              if (option.disabled || controlDisabled) checkbox.setAttribute("disabled", "");
              if (Array.isArray(this.initialValue) && this.initialValue.map(String).includes(String(option.value))) checkbox.setAttribute("default-checked", "");
              checkbox.checked = selected.includes(String(option.value));
              group.append(checkbox);
            }
            if (adapter.allowFillIn) {
              const fillIn = document.createElement("spui-input"); fillIn.setAttribute("type", "text"); fillIn.setAttribute("aria-label", this.getAttribute("add-choice-label") ?? "Add another choice");
              const add = document.createElement("spui-button"); add.setAttribute("appearance", "secondary"); add.textContent = this.getAttribute("add-choice-label") ?? "Add another choice"; if (controlDisabled) add.setAttribute("disabled", "");
              const addFillIn = (): void => {
                const rawChoice = (fillIn as FieldControl).value;
                const choice = typeof rawChoice === "string" ? rawChoice.trim() : "";
                if (!choice || selected.includes(choice)) return;
                this.acceptValue([...selected, choice]);
                (fillIn as FieldControl).value = "";
              };
              fillIn.addEventListener("keydown", event => { if (event instanceof KeyboardEvent && event.key === "Enter") { event.preventDefault(); addFillIn(); } });
              add.addEventListener("click", addFillIn);
              const fillInRow = document.createElement("div"); fillInRow.append(fillIn, add); group.append(fillInRow);
              fillInRow.style.display = "flex"; fillInRow.style.alignItems = "end"; fillInRow.style.gap = "var(--spui-control-gap,8px)";
            }
            control = group;
            break;
          }
          case "date-picker": {
            const datePicker = setBasics(document.createElement("spui-date-picker") as FieldControl);
            if (this.initialValue !== undefined) datePicker.setAttribute("value", textValue(this.initialValue));
            datePicker.value = valueText;
            control = datePicker;
            break;
          }
          case "combobox": {
            const combo = setBasics(document.createElement("spui-combobox") as FieldControl);
            if (adapter.multiple) combo.setAttribute("multiselect", "");
            combo.setAttribute("placeholder", this.getAttribute("empty-option-label") ?? "Select an option");
            selectOptions(combo, "spui-combobox-option");
            if (adapter.multiple) {
              if (Array.isArray(this.initialValue)) combo.setAttribute("default-selected-options", JSON.stringify(this.initialValue.map(String)));
              combo.selectedOptions = Array.isArray(value) ? value.map(String) : [];
            } else {
              if (this.initialValue !== undefined) { combo.setAttribute("selected-value", defaultValueText); combo.setAttribute("value", options.find(option => String(option.value) === defaultValueText)?.label ?? defaultValueText); }
              combo.selectedValue = valueText; combo.value = options.find(option => String(option.value) === valueText)?.label ?? valueText;
            }
            control = combo;
            break;
          }
          case "taxonomy": {
            if (adapter.multiple) {
              const picker = setBasics(document.createElement("spui-tag-picker") as FieldControl);
              picker.setAttribute("label", label);
              picker.setAttribute("placeholder", this.getAttribute("empty-option-label") ?? "Select terms");
              picker.setAttribute("input-aria-label", label);
              selectOptions(picker, "spui-tag-picker-option");
              const initialTerms = taxonomyTerms(this.initialValue);
              if (initialTerms.length) picker.setAttribute("default-selected-options", JSON.stringify(initialTerms.map(term => term.termGuid)));
              picker.selectedOptions = terms.map(term => term.termGuid);
              control = picker;
            } else {
              const combo = setBasics(document.createElement("spui-combobox") as FieldControl);
              combo.setAttribute("placeholder", this.getAttribute("empty-option-label") ?? "Select a term");
              selectOptions(combo, "spui-combobox-option");
              const term = terms[0];
              if (term) { combo.setAttribute("selected-value", term.termGuid); combo.setAttribute("value", term.label); }
              combo.selectedValue = term?.termGuid ?? "";
              combo.value = term?.label ?? "";
              control = combo;
            }
            break;
          }
          case "read-only": {
            const readonly = setBasics(document.createElement("spui-input") as FieldControl);
            readonly.setAttribute("type", "text"); readonly.setAttribute("read-only", ""); readonly.value = valueText;
            control = readonly;
            break;
          }
          case "unsupported": {
            const custom = this.renderUnsupported?.(field, adapter.unsupportedReason ?? "No renderer is registered for this SharePoint field type.");
            const fallback = custom ?? Object.assign(document.createElement("div"), { textContent: `This SharePoint field type needs a custom renderer (${adapter.fieldType}).` });
            if (!custom && fallback instanceof HTMLElement) fallback.setAttribute("role", "note");
            control = fallback as FieldControl;
            break;
          }
        }

        const wrapper = createFormField(control, {
          id: this.id ? `${this.id}-field` : undefined,
          className: this.getAttribute("class") ?? undefined,
          label: adapter.control === "multi-choice" || (adapter.control === "taxonomy" && adapter.multiple) ? undefined : label,
          hint: this.getAttribute("hint") ?? adapter.description,
          validationMessage: this.getAttribute("validation-message") ?? undefined,
          required: adapter.required,
          disabled,
        });
        wrapper.dataset.sharePointField = adapter.name || adapter.fieldType;
        this.hidden = adapter.hidden;
        this.replaceChildren(wrapper);
      } catch {
        if (!this.isConnected || renderVersion !== this.renderVersion) return;
        this.removeAttribute("aria-busy");
        const error = document.createElement("div");
        error.setAttribute("role", "alert");
        error.textContent = "The field control could not be loaded.";
        this.replaceChildren(error);
      }
    }

    private syncControlValue(): void {
      const wrapper = this.querySelector<HTMLElement>(".spui-form-field");
      const first = wrapper?.firstElementChild;
      const control = (first?.localName === "fieldset" ? first : first?.nextElementSibling) as FieldControl | null | undefined;
      if (!control) return;
      if (control.localName === "fieldset") {
        const selected = new Set(Array.isArray(this.currentValue) ? this.currentValue.map(String) : []);
        control.querySelectorAll<FieldControl>("spui-checkbox").forEach(checkbox => { checkbox.checked = selected.has(checkbox.getAttribute("value") ?? ""); });
      } else if (control.localName === "spui-checkbox") control.checked = this.currentValue === true || this.currentValue === "true";
      else if (control.localName === "spui-combobox" && control.hasAttribute("multiselect")) control.selectedOptions = Array.isArray(this.currentValue) ? this.currentValue.map(String) : [];
      else if (control.localName === "spui-tag-picker") control.selectedOptions = taxonomyTerms(this.currentValue).map(term => term.termGuid);
      else if ("value" in control) control.value = textValue(this.currentValue);
    }

    private acceptValue(value: SharePointFieldValue): void {
      this.currentValue = value;
      const field = this.fieldValue;
      if (!field) return;
      this.onValueChange?.(value, field);
      this.dispatchEvent(new CustomEvent<SharePointFieldValueChangeDetail>("spui-field-value-change", { detail: { value, field }, bubbles: true, composed: true }));
    }

    constructor() {
      super();
      for (const key of ["field", "value", "defaultValue", "options", "disabled", "onValueChange", "renderUnsupported"] as const) {
        if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
        const pending = (this as unknown as Record<string, unknown>)[key];
        delete (this as unknown as Record<string, unknown>)[key];
        (this as unknown as Record<string, unknown>)[key] = pending;
      }
      this.addEventListener("spui-input", event => {
        const target = event.target as HTMLElement | null;
        if (target?.localName === "spui-tag-picker") return;
        if ((target?.localName === "spui-combobox" && !target.hasAttribute("allow-freeform")) || (target?.localName === "spui-input" && target.closest("fieldset"))) return;
        const value = (event as FieldChange).detail?.value;
        if (value !== undefined) this.acceptValue(value);
      });
      this.addEventListener("spui-change", event => {
        const detail = (event as FieldChange).detail;
        if (!detail) return;
        if (detail.checked !== undefined) {
          if (this.fieldValue && getSharePointFieldAdapter(this.fieldValue).control === "multi-choice") {
            const checkbox = event.target as HTMLElement;
            const choice = checkbox.getAttribute("value") ?? "";
            const selected = new Set(Array.isArray(this.currentValue) ? this.currentValue.map(String) : []);
            if (detail.checked === true) selected.add(choice); else selected.delete(choice);
            this.acceptValue([...selected]);
          } else this.acceptValue(detail.checked === true);
        } else if (detail.selectedOptions || detail.values) {
          const selected = detail.selectedOptions ?? detail.values!;
          const field = this.fieldValue;
          const adapter = field ? getSharePointFieldAdapter(field) : undefined;
          this.acceptValue(adapter?.control === "taxonomy" ? taxonomyValuesFromIds(selected, this.currentValue, this.currentOptions, adapter.multiple === true) : selected);
        } else if (detail.selectedValue !== undefined) {
          const field = this.fieldValue;
          const adapter = field ? getSharePointFieldAdapter(field) : undefined;
          this.acceptValue(adapter?.control === "taxonomy"
            ? taxonomyValuesFromIds(detail.selectedValue ? [detail.selectedValue] : [], this.currentValue, this.currentOptions, false)
            : detail.selectedValue || null);
        }
        else if (detail.value !== undefined) this.acceptValue(detail.value || null);
      });
    }
  }

  customElements.define("spui-sharepoint-field", SpuiSharePointField);
}
