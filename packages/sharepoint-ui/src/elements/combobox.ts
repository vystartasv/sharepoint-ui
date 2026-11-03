import { base, rememberNativeFormControlDefaults, type NativeFormControlDefaults } from "./shared.js";

export function defineCombobox(): void {
  if (customElements.get("spui-combobox")) return;
  class SpuiCombobox extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["label", "value", "selected-value", "selected-options", "default-selected-options", "multiselect", "disabled", "required", "name", "placeholder", "allow-freeform", "read-only", "button-trigger", "open", "default-open", "clearable", "clear-label", "disable-auto-focus", "appearance", "size", "positioning", "inline-popup", "no-results", "remove-selected-label", "selected-label", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"];
    private internals: ElementInternals | undefined;
    private observer: MutationObserver | undefined;
    private readonly instanceId = crypto.randomUUID();
    private currentValue = "";
    private selectedValueState = "";
    private selectedOptionsState: string[] = [];
    private buttonTriggerSlot?: HTMLSlotElement;
    private fallbackButtonTrigger?: HTMLButtonElement;
    private dirty = false;
    private selectionsDirty = false;
    private typing = false;
    private activeIndex = -1;
    private open = false;
    private inputSlot?: HTMLSlotElement;
    private fallbackInput?: HTMLInputElement;
    private boundInput?: HTMLInputElement;
    private formDisabled = false;
    private slotInputDefaults?: NativeFormControlDefaults;
    private readonly handleInput = (event: Event): void => {
      const input = this.getInput();
      if (!input) return;
      const changed = !this.open;
      this.currentValue = input.value;
      this.dirty = true;
      const previousOption = this.activeOptionValue();
      const query = input.value.trim().toLocaleLowerCase(this.lang || undefined);
      const matchingOption = query ? this.optionElements().find(option =>
        !this.isOptionDisabled(option) && (option.getAttribute("label") ?? option.textContent ?? "").trim().toLocaleLowerCase(this.lang || undefined).startsWith(query)
      ) : undefined;
      const options = this.filteredOptions();
      this.activeIndex = matchingOption ? options.indexOf(matchingOption) : -1;
      this.announceActiveOption(previousOption, event);
      if (!this.hasAttribute("multiselect") && (this.selectedValueState || this.selectedOptionsState.length === 1) && (!query || !matchingOption)) {
        this.selectedValueState = "";
        this.selectedOptionsState = [];
        this.selectionsDirty = true;
        this.dispatchEvent(new CustomEvent("spui-change", {
          detail: { event, value: input.value, selectedValue: undefined, optionText: undefined, selectedOptions: [] },
          bubbles: true,
          composed: true
        }));
      }
      this.open = true;
      this.updateOptions();
      this.syncFormState();
      this.notifyOpenChange(true, event, changed);
      this.dispatchEvent(new CustomEvent("spui-input", { detail: { value: input.value }, bubbles: true, composed: true }));
    };
    private readonly handleInputClick = (event: Event): void => { if (!this.open) this.openList(0, event); };
    private readonly handleInputKeyDown = (event: KeyboardEvent): void => this.onKeyDown(event);
    private readonly handleInputBlur = (event: FocusEvent): void => { window.setTimeout(() => { if (!this.matches(":focus-within")) this.closeList(event); }, 0); };
    private readonly onSlottedControlClick = (event: Event): void => {
      const slotted = event.composedPath().find(node => node instanceof HTMLElement && node.parentElement === this) as HTMLElement | undefined;
      if (slotted?.slot === "clear-button") this.clearSelection(event);
      else if (this.hasAttribute("button-trigger") && slotted?.slot === "button") this.toggleOpen(event);
    };
    private readonly onSlottedTriggerKeyDown = (event: KeyboardEvent): void => {
      if (this.hasAttribute("button-trigger") && event.composedPath().some(node => node instanceof HTMLElement && node.parentElement === this && node.slot === "button")) this.onKeyDown(event);
    };

    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }

    constructor() {
      super();
      try { this.internals = this.attachInternals(); } catch { /* Keep listbox interaction available without custom form association. */ }
    }

    connectedCallback(): void {
      this.currentValue = this.getAttribute("value") ?? this.querySelector<HTMLInputElement>('input[slot="input"]')?.value ?? "";
      this.selectedValueState = this.getAttribute("selected-value") ?? "";
      this.selectedOptionsState = this.readSelectedOptions(this.getAttribute("selected-options") ?? this.getAttribute("default-selected-options"));
      this.render();
      this.syncClearButton();
      this.addEventListener("click", this.onSlottedControlClick);
      this.addEventListener("keydown", this.onSlottedTriggerKeyDown);
      if (this.hasAttribute("open") || this.hasAttribute("default-open")) this.openList();
      this.observer = new MutationObserver(records => {
        const listbox = this.getListbox();
        if (records.some(record => !listbox?.contains(record.target))) this.updateOptions();
      });
      this.observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "label", "disabled"] });
      this.syncFormState();
    }

    disconnectedCallback(): void { this.observer?.disconnect(); this.removeEventListener("click", this.onSlottedControlClick); this.removeEventListener("keydown", this.onSlottedTriggerKeyDown); this.boundInput?.removeEventListener("input", this.handleInput); this.boundInput?.removeEventListener("click", this.handleInputClick); this.boundInput?.removeEventListener("keydown", this.handleInputKeyDown); this.boundInput?.removeEventListener("blur", this.handleInputBlur); }

    private getInput(): HTMLInputElement | null {
      const assigned = this.inputSlot?.assignedElements({ flatten: true }).find((element): element is HTMLInputElement => element instanceof HTMLInputElement);
      return assigned ?? this.fallbackInput ?? null;
    }

    private bindInput(): void {
      const input = this.getInput();
      if (!input) return;
      if (input !== this.fallbackInput) this.slotInputDefaults = rememberNativeFormControlDefaults(this.slotInputDefaults, input);
      const defaults = input === this.fallbackInput ? undefined : this.slotInputDefaults;
      if (this.boundInput !== input) {
        this.boundInput?.removeEventListener("input", this.handleInput); this.boundInput?.removeEventListener("click", this.handleInputClick); this.boundInput?.removeEventListener("keydown", this.handleInputKeyDown); this.boundInput?.removeEventListener("blur", this.handleInputBlur);
        input.addEventListener("input", this.handleInput); input.addEventListener("click", this.handleInputClick); input.addEventListener("keydown", this.handleInputKeyDown); input.addEventListener("blur", this.handleInputBlur); this.boundInput = input;
      }
      if (this.fallbackInput) this.fallbackInput.hidden = input !== this.fallbackInput;
      if (!input.id) input.id = `combo-${this.instanceId}-input`;
      if (!input.type) input.type = "text";
      input.role = "combobox"; input.autocomplete ||= "off"; input.setAttribute("aria-autocomplete", "list"); input.setAttribute("aria-haspopup", "listbox");
      input.value = this.currentValue; input.placeholder = this.getAttribute("placeholder") ?? ""; input.readOnly = this.hasAttribute("read-only") || Boolean(defaults?.readOnly); input.disabled = this.formDisabled || this.hasAttribute("disabled") || Boolean(defaults?.disabled); input.required = this.hasAttribute("required") || Boolean(defaults?.required); input.hidden = this.hasAttribute("button-trigger"); input.part.add("control");
      for (const name of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) { const value = this.getAttribute(name); if (value === null) input.removeAttribute(name); else input.setAttribute(name, value); }
    }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (!this.isConnected) return;
      const input = this.getInput();
      if (!input) return;
      if (name === "label") {
        const label = this.shadowRoot?.querySelector("label");
        if (label) label.textContent = value ?? "";
      } else if (name === "value") {
        this.currentValue = value ?? "";
        input.value = this.currentValue;
        this.activeIndex = -1;
        this.updateOptions();
      } else if (name === "selected-value") {
        this.selectedValueState = value ?? "";
        this.dirty = false;
        this.updateOptions();
      } else if (name === "selected-options") {
        this.selectedOptionsState = this.readSelectedOptions(value);
        this.selectionsDirty = false;
        this.updateOptions();
      } else if (name === "default-selected-options" && !this.selectionsDirty && !this.hasAttribute("selected-options")) {
        this.selectedOptionsState = this.readSelectedOptions(value);
        this.updateOptions();
      } else if (name === "disabled") input.disabled = this.formDisabled || this.hasAttribute("disabled") || Boolean(this.slotInputDefaults?.disabled);
      else if (name === "read-only") { input.readOnly = this.hasAttribute("read-only") || Boolean(this.slotInputDefaults?.readOnly); this.syncExpandIcon(); }
      else if (name === "button-trigger") {
        const active = this.hasAttribute("button-trigger"); input.hidden = active;
        if (this.buttonTriggerSlot) {
          this.buttonTriggerSlot.hidden = !active;
          if (active && this.fallbackButtonTrigger?.parentElement !== this.buttonTriggerSlot) this.buttonTriggerSlot.append(this.fallbackButtonTrigger!);
          else if (!active) this.fallbackButtonTrigger?.remove();
        }
        const label = this.shadowRoot?.querySelector<HTMLLabelElement>("label"); if (label) label.htmlFor = active ? "combo-" + this.instanceId : "combo-" + this.instanceId + "-input";
      }
      else if (name === "clearable" || name === "clear-label") this.syncClearButton();
      else if (name === "appearance" || name === "size" || name === "positioning") { /* Host selectors update the shadow theme without rebuilding focused controls. */ }
      else if (name === "disable-auto-focus") this.updateOptions();
      else if (name === "expand-icon") this.syncExpandIcon();
      else if (name === "selected-label") this.shadowRoot?.querySelector<HTMLElement>(".selected")?.setAttribute("aria-label", value ?? "Selected options");
      else if (name === "open" || name === "default-open") {
        if (this.hasAttribute("open") || this.hasAttribute("default-open")) this.openList();
        else this.closeList();
      }
      else if (name === "required") input.required = this.hasAttribute("required") || Boolean(this.slotInputDefaults?.required);
      else if (name === "placeholder") input.placeholder = value ?? "";
      else if (name === "aria-label" || name === "aria-labelledby" || name === "aria-description" || name === "aria-describedby" || name === "aria-invalid") value === null ? input.removeAttribute(name) : input.setAttribute(name, value);
      else if (name === "allow-freeform" || name === "no-results" || name === "remove-selected-label" || name === "multiselect") this.updateOptions();
      this.syncAria();
      this.syncFormState();
    }

    get value(): string { return this.currentValue; }
    set value(value: string) {
      this.currentValue = value;
      const input = this.getInput();
      if (input) { input.value = value; this.activeIndex = -1; this.updateOptions(); this.syncAria(); this.syncFormState(); }
    }
    get selectedValue(): string { return this.selectedValueState; }
    set selectedValue(value: string) {
      this.selectedValueState = value;
      this.dirty = false;
      this.updateOptions();
      this.syncFormState();
    }
    get selectedOptions(): string[] { return [...this.selectedOptionsState]; }
    set selectedOptions(values: readonly string[]) {
      this.selectedOptionsState = [...new Set(values.map(String))];
      this.selectionsDirty = false;
      this.updateOptions();
      this.syncFormState();
    }

    setOpen(open: boolean): void { if (open) this.openList(); else this.closeList(); }

    private readSelectedOptions(value: string | null): string[] {
      if (!value) return [];
      try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? [...new Set(parsed.map(String))] : []; }
      catch { return []; }
    }

    formDisabledCallback(disabled: boolean): void { this.formDisabled = disabled; this.bindInput(); this.syncFormState(); }
    formResetCallback(): void {
      this.selectedOptionsState = this.readSelectedOptions(this.getAttribute("default-selected-options"));
      this.selectionsDirty = false;
      this.selectedValueState = this.getAttribute("selected-value") ?? "";
      this.value = this.getAttribute("value") ?? this.slotInputDefaults?.defaultValue ?? "";
      this.closeList();
    }
    formStateRestoreCallback(state: string | File | FormData | null): void {
      if (typeof state !== "string") return;
      if (this.hasAttribute("multiselect")) this.selectedOptions = this.readSelectedOptions(state);
      else this.selectOption(state);
    }

    private optionElements(): Element[] { return [...this.querySelectorAll(":scope > spui-combobox-option, :scope > spui-combobox-option-group > spui-combobox-option")]; }
    private filteredOptions(): Element[] {
      const query = this.hasAttribute("read-only") ? "" : this.currentValue.trim().toLocaleLowerCase(this.lang || undefined);
      return this.optionElements().filter(option => !query || (option.getAttribute("label") ?? option.textContent ?? "").trim().toLocaleLowerCase(this.lang || undefined).includes(query));
    }

    private syncFormState(): void {
      const formValue = this.hasAttribute("multiselect")
        ? this.selectedOptionsState.length ? this.selectedOptionsFormData() : null
        : this.dirty ? (this.hasAttribute("allow-freeform") ? this.currentValue : "") : (this.selectedValue || (this.hasAttribute("allow-freeform") ? this.currentValue : ""));
      this.internals?.setFormValue(formValue || null, this.hasAttribute("multiselect") ? JSON.stringify(this.selectedOptionsState) : typeof formValue === "string" ? formValue : null);
      const missing = this.hasAttribute("required") && (this.hasAttribute("multiselect") ? this.selectedOptionsState.length === 0 : !formValue);
      try { this.internals?.setValidity(missing ? { valueMissing: true } : {}, missing ? "Choose an option." : "", this.hasAttribute("button-trigger") ? undefined : this.getInput() ?? undefined); } catch { /* Keep native input semantics if an engine rejects the validity anchor. */ }
    }

    private selectedOptionsFormData(): FormData {
      const data = new FormData();
      const name = this.getAttribute("name") ?? "";
      if (name) for (const value of this.selectedOptionsState) data.append(name, value);
      return data;
    }

    private syncClearButton(): void {
      const label = this.getAttribute("clear-label") ?? "Clear selection";
      const visible = this.hasAttribute("clearable");
      const fallback = this.shadowRoot?.querySelector<HTMLButtonElement>(".clear");
      if (fallback) { fallback.hidden = !visible; fallback.setAttribute("aria-label", label); }
      for (const element of this.querySelectorAll<HTMLElement>(":scope > [slot=clear-button]")) {
        element.hidden = !visible;
        if (!element.hasAttribute("aria-label")) element.setAttribute("aria-label", label);
        if (element instanceof HTMLButtonElement) element.type = "button";
      }
    }

    private syncExpandIcon(): void {
      const expand = this.shadowRoot?.querySelector<HTMLElement>(".expand");
      const custom = (this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="expand-icon"]')?.assignedElements({ flatten: true }).length ?? 0) > 0;
      if (expand) expand.hidden = !(this.hasAttribute("read-only") || this.hasAttribute("button-trigger") || custom);
    }

    private clearSelection(event: Event): void {
      this.currentValue = ""; this.selectedValueState = ""; this.selectedOptionsState = [];
      this.dirty = false; this.selectionsDirty = true;
      const input = this.getInput();
      if (input) input.value = "";
      this.closeList(event); this.updateOptions(); this.syncFormState();
      this.dispatchEvent(new CustomEvent("spui-change", { detail: { event, value: "", selectedValue: undefined, optionText: undefined, selectedOptions: [] }, bubbles: true, composed: true }));
      (this.hasAttribute("button-trigger") ? this.getTrigger() : input)?.focus();
    }

    private getTrigger(): HTMLElement | null {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="button"]');
      return slot?.assignedElements({ flatten: true })[0] as HTMLElement | undefined ?? slot?.querySelector<HTMLElement>("button") ?? null;
    }

    private getListbox(): HTMLElement | null {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="listbox"]');
      const assigned = slot?.assignedElements({ flatten: true }).find(element => element instanceof HTMLElement) as HTMLElement | undefined;
      return assigned ?? slot?.querySelector<HTMLElement>("[role=listbox]") ?? null;
    }

    private toggleOpen(event: Event): void { if (this.open) this.closeList(event); else this.openList(0, event); this.getTrigger()?.focus(); }

    private syncAria(): void {
      const input = this.getInput();
      const list = this.getListbox();
      if (!input || !list) return;
      const trigger = this.hasAttribute("button-trigger") ? this.getTrigger() : input;
      const triggerValue = this.shadowRoot?.querySelector<HTMLElement>(".trigger-value");
      if (triggerValue) triggerValue.textContent = this.currentValue || this.getAttribute("placeholder") || "";
      if (trigger) {
        trigger.setAttribute("role", "combobox");
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", String(this.open));
        const label = this.shadowRoot?.querySelector<HTMLLabelElement>("label");
        if (!trigger.id) trigger.id = "combo-" + this.instanceId;
        if (label) label.htmlFor = trigger.id;
        const explicitLabel = this.getAttribute("aria-label");
        const explicitLabelledBy = this.getAttribute("aria-labelledby");
        if (explicitLabel !== null) { trigger.setAttribute("aria-label", explicitLabel); trigger.removeAttribute("aria-labelledby"); }
        else if (explicitLabelledBy !== null) { trigger.removeAttribute("aria-label"); trigger.setAttribute("aria-labelledby", explicitLabelledBy); }
        else if (label && trigger.getRootNode() !== this.shadowRoot) { trigger.removeAttribute("aria-labelledby"); trigger.setAttribute("aria-label", label.textContent?.trim() ?? ""); }
        else { trigger.removeAttribute("aria-label"); if (label) trigger.setAttribute("aria-labelledby", label.id); else trigger.removeAttribute("aria-labelledby"); }
        for (const name of ["aria-description", "aria-describedby", "aria-invalid"]) {
          const value = this.getAttribute(name);
          if (value === null) trigger.removeAttribute(name); else trigger.setAttribute(name, value);
        }
        if (trigger.getRootNode() === list.getRootNode()) trigger.setAttribute("aria-controls", list.id);
        else trigger.removeAttribute("aria-controls");
        if (this.hasAttribute("disabled")) { trigger.setAttribute("aria-disabled", "true"); if (trigger instanceof HTMLButtonElement) trigger.disabled = true; }
        else { trigger.removeAttribute("aria-disabled"); if (trigger instanceof HTMLButtonElement) trigger.disabled = false; }
      }
      if (!list.id) list.id = `listbox-${this.instanceId}`;
      list.setAttribute("role", "listbox");
      if (list.slot === "listbox") {
        const defaults: Record<string, string> = {
          position: "absolute", "z-index": "var(--spui-layer-dropdown,20)", top: "calc(100% + 4px)", "inset-inline": "0",
          "box-sizing": "border-box", "max-height": "240px", overflow: "auto", margin: "0", padding: "4px",
          "list-style": "none", border: "1px solid var(--spui-ui-stroke,#d1d1d1)",
          "border-radius": "var(--spui-card-radius,8px)", background: "var(--spui-ui-surface,#fff)",
          "box-shadow": "var(--spui-card-shadow,0 4px 14px #0002)"
        };
        for (const [property, value] of Object.entries(defaults)) if (!list.style.getPropertyValue(property)) list.style.setProperty(property, value);
        if (this.getAttribute("positioning")?.startsWith("above")) { list.style.setProperty("top", "auto"); list.style.setProperty("bottom", "calc(100% + 4px)"); }
        else list.style.removeProperty("bottom");
      }
      if (!this.hasAttribute("button-trigger")) {
        input.setAttribute("aria-expanded", String(this.open));
        if (input.getRootNode() === list.getRootNode()) input.setAttribute("aria-controls", list.id);
        else input.removeAttribute("aria-controls");
      }
      if (this.hasAttribute("multiselect")) list.setAttribute("aria-multiselectable", "true"); else list.removeAttribute("aria-multiselectable");
      const active = this.shadowRoot?.querySelector<HTMLElement>(`[data-option-index="${this.activeIndex}"]`);
      if (this.open && active) trigger?.setAttribute("aria-activedescendant", active.id); else trigger?.removeAttribute("aria-activedescendant");
      for (const option of list.querySelectorAll<HTMLElement>("[role=option]")) {
        const activeOption = this.open && Number(option.dataset.optionIndex) === this.activeIndex;
        option.dataset.active = String(activeOption);
        if (list.slot === "listbox") option.style.background = activeOption || option.getAttribute("aria-selected") === "true" ? "var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))" : "";
      }
      list.hidden = !this.open;
    }

    private updateOptions(): void {
      const list = this.getListbox();
      if (!list) return;
      const options = this.filteredOptions();
      list.replaceChildren();
      let currentGroup: Element | null = null;
      let groupContainer: HTMLDivElement | null = null;
      options.forEach((option, index) => {
        const group = option.parentElement?.matches("spui-combobox-option-group") ? option.parentElement : null;
        if (group && group !== currentGroup) {
          currentGroup = group;
          groupContainer = document.createElement("div");
          groupContainer.setAttribute("role", "group");
          groupContainer.className = "option-group";
          if (list.slot === "listbox") { groupContainer.style.display = "grid"; groupContainer.style.gap = "2px"; groupContainer.style.paddingBlock = "2px"; }
          const label = group.getAttribute("label") ?? group.getAttribute("aria-label") ?? "";
          if (label) groupContainer.setAttribute("aria-label", label);
          const heading = document.createElement("span");
          heading.className = "group-label";
          heading.textContent = group.getAttribute("label") ?? group.getAttribute("aria-label") ?? "";
          if (list.slot === "listbox") { heading.style.padding = "6px 10px"; heading.style.color = "var(--spui-ui-muted,inherit)"; heading.style.fontSize = "12px"; heading.style.fontWeight = "600"; }
          groupContainer.append(heading);
          list.append(groupContainer);
        } else if (!group) { currentGroup = null; groupContainer = null; }
        const item = document.createElement("div");
        item.id = `option-${this.instanceId}-${index}`;
        item.dataset.optionIndex = String(index);
        item.setAttribute("role", "option");
        const value = option.getAttribute("value") ?? "";
        const selected = this.hasAttribute("multiselect") ? this.selectedOptionsState.includes(value) : value === this.selectedValue;
        item.setAttribute("aria-selected", String(selected));
        const disabled = option.hasAttribute("disabled") || Boolean(group?.hasAttribute("disabled"));
        if (disabled) item.setAttribute("aria-disabled", "true");
        if (this.hasAttribute("multiselect")) {
          const check = document.createElement("span"); check.className = "check"; check.setAttribute("aria-hidden", "true"); check.textContent = selected ? "✓" : "";
          if (list.slot === "listbox") { check.style.cssText = "display:inline-grid;place-items:center;width:16px;height:16px;flex:none;border:1px solid var(--spui-ui-stroke,#8a8886);border-radius:3px;color:var(--spui-ui-accent,#0f6cbd);font-size:12px"; if (selected) check.style.background = "var(--spui-ui-canvas,#f5f5f5)"; }
          item.append(check);
        }
        if (list.slot === "listbox") {
          item.style.cssText = "display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--spui-control-radius,4px);color:var(--spui-ui-text,inherit);cursor:pointer";
          if (selected) item.style.background = "var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))";
          if (disabled) item.style.opacity = ".5";
        }
        const text = document.createElement("span"); text.textContent = (option.getAttribute("label") ?? option.textContent ?? "").trim(); item.append(text);
        item.addEventListener("pointerdown", event => event.preventDefault());
        item.addEventListener("pointerenter", () => { if (list.slot === "listbox" && !disabled) item.style.background = "var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))"; });
        item.addEventListener("pointerleave", () => { if (list.slot === "listbox" && item.dataset.active !== "true" && item.getAttribute("aria-selected") !== "true") item.style.background = ""; });
        item.addEventListener("click", event => { if (!disabled) this.selectOption(option.getAttribute("value") ?? "", event); });
        (groupContainer ?? list).append(item);
      });
      const empty = this.shadowRoot?.querySelector<HTMLElement>(".empty");
      if (empty) {
        empty.textContent = this.getAttribute("no-results") ?? "No results";
        empty.hidden = options.length !== 0;
      }
      this.syncSelectedTags();
      this.syncAria();
    }

    private syncSelectedTags(): void {
      const container = this.shadowRoot?.querySelector<HTMLElement>(".selected");
      if (!container) return;
      container.replaceChildren();
      if (!this.hasAttribute("multiselect")) { container.hidden = true; return; }
      const options = this.optionElements();
      for (const value of this.selectedOptionsState) {
        const option = options.find(item => item.getAttribute("value") === value);
        const label = (option?.getAttribute("label") ?? option?.textContent ?? value).trim();
        const chip = document.createElement("span"); chip.className = "tag";
        const text = document.createElement("span"); text.textContent = label;
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "remove"; remove.textContent = "×"; remove.setAttribute("aria-label", `${this.getAttribute("remove-selected-label") ?? "Remove"} ${label}`);
        remove.addEventListener("click", event => { this.setOptionSelected(value, false, event); this.getInput()?.focus(); });
        chip.append(text, remove); container.append(chip);
      }
      container.hidden = this.selectedOptionsState.length === 0;
    }

    private openList(index = 0, sourceEvent?: Event): void {
      const changed = !this.open;
      const previousOption = this.activeOptionValue();
      const options = this.filteredOptions();
      this.open = true;
      let activeIndex = options.length ? Math.max(0, Math.min(index, options.length - 1)) : -1;
      while (activeIndex >= 0 && activeIndex < options.length && this.isOptionDisabled(options[activeIndex])) activeIndex++;
      this.activeIndex = !this.hasAttribute("disable-auto-focus") && activeIndex < options.length ? activeIndex : -1;
      this.announceActiveOption(previousOption, sourceEvent);
      this.syncAria();
      this.scrollActiveIntoView();
      this.notifyOpenChange(true, sourceEvent, changed);
    }

    private closeList(sourceEvent?: Event): void {
      const changed = this.open;
      const previousOption = this.activeOptionValue();
      this.open = false;
      this.activeIndex = -1;
      this.announceActiveOption(previousOption, sourceEvent);
      this.syncAria();
      this.notifyOpenChange(false, sourceEvent, changed);
    }

    private notifyOpenChange(open: boolean, sourceEvent?: Event, changed = true): void {
      if (changed) this.dispatchEvent(new CustomEvent("spui-open-change", { detail: { event: sourceEvent, open }, bubbles: true, composed: true }));
    }

    private moveActive(delta: number, sourceEvent?: Event, steps = 1): void {
      const previousOption = this.activeOptionValue();
      const options = this.filteredOptions();
      const changed = !this.open;
      if (!options.length) { this.open = true; this.activeIndex = -1; this.announceActiveOption(previousOption, sourceEvent); this.syncAria(); this.notifyOpenChange(true, sourceEvent, changed); return; }
      const navigable = options.map((option, index) => this.isOptionDisabled(option) ? -1 : index).filter(index => index >= 0);
      const current = navigable.indexOf(this.open ? this.activeIndex : -1);
      const next = Math.max(0, Math.min(navigable.length - 1, (current < 0 ? 0 : current) + delta * steps));
      const index = navigable[next] ?? -1;
      this.open = true;
      this.activeIndex = index;
      this.announceActiveOption(previousOption, sourceEvent);
      this.syncAria();
      this.scrollActiveIntoView();
      this.notifyOpenChange(true, sourceEvent, changed);
    }

    private moveActiveToEdge(edge: "first" | "last", sourceEvent?: Event): void {
      const changed = !this.open;
      const previousOption = this.activeOptionValue();
      const options = this.filteredOptions();
      const direction = edge === "first" ? 1 : -1;
      let index = edge === "first" ? 0 : options.length - 1;
      while (index >= 0 && index < options.length && this.isOptionDisabled(options[index])) index += direction;
      this.activeIndex = index >= 0 && index < options.length ? index : -1;
      this.open = true;
      this.typing = false;
      this.announceActiveOption(previousOption, sourceEvent);
      this.syncAria();
      this.scrollActiveIntoView();
      this.notifyOpenChange(true, sourceEvent, changed);
    }

    private isOptionDisabled(option: Element): boolean {
      return option.hasAttribute("disabled") || Boolean(option.parentElement?.matches("spui-combobox-option-group[disabled]"));
    }

    private activeOptionValue(): string | null {
      const option = this.filteredOptions()[this.activeIndex];
      return option?.getAttribute("value") ?? null;
    }

    private announceActiveOption(previousOption: string | null, sourceEvent?: Event): void {
      const nextOption = this.activeOptionValue();
      if (previousOption !== nextOption) this.dispatchEvent(new CustomEvent("spui-active-option-change", { detail: { event: sourceEvent, type: sourceEvent ? "change" : undefined, previousOption, nextOption, id: nextOption ?? "", previousId: previousOption }, bubbles: true, composed: true }));
    }

    private scrollActiveIntoView(): void { this.shadowRoot?.querySelector<HTMLElement>(`[data-option-index="${this.activeIndex}"]`)?.scrollIntoView({ block: "nearest" }); }

    private selectOption(value: string, sourceEvent?: Event): void {
      const option = this.optionElements().find(item => item.getAttribute("value") === value);
      if (!option || option.hasAttribute("disabled")) return;
      if (this.hasAttribute("multiselect")) {
        this.setOptionSelected(value, !this.selectedOptionsState.includes(value), sourceEvent);
        return;
      }
      const label = (option.getAttribute("label") ?? option.textContent ?? "").trim();
      this.selectedValueState = value;
      this.dirty = false;
      this.currentValue = label;
      const input = this.getInput();
      if (input) input.value = label;
      this.closeList(sourceEvent);
      this.updateOptions();
      this.syncFormState();
      this.dispatchEvent(new CustomEvent("spui-change", { detail: { event: sourceEvent, value: label, selectedValue: value, selectedOptions: [value] }, bubbles: true, composed: true }));
    }

    private setOptionSelected(value: string, selected: boolean, sourceEvent?: Event): void {
      const wasOpen = this.open;
      this.selectedOptionsState = selected
        ? [...new Set([...this.selectedOptionsState, value])]
        : this.selectedOptionsState.filter(item => item !== value);
      this.selectionsDirty = true;
      this.dirty = false;
      this.currentValue = "";
      const input = this.getInput();
      if (input) input.value = "";
      this.open = wasOpen;
      this.activeIndex = wasOpen ? 0 : -1;
      this.updateOptions();
      this.syncFormState();
      const option = this.optionElements().find(item => item.getAttribute("value") === value);
      const label = option ? (option.getAttribute("label") ?? option.textContent ?? "").trim() : undefined;
      this.dispatchEvent(new CustomEvent("spui-change", { detail: { event: sourceEvent, value: "", selectedValue: value, optionText: label, selectedOptions: [...this.selectedOptionsState] }, bubbles: true, composed: true }));
    }

    private onKeyDown(event: KeyboardEvent): void {
      if (this.hasAttribute("button-trigger") && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        this.typing = false;
        if (this.open && this.activeIndex >= 0) { const option = this.filteredOptions()[this.activeIndex]; this.selectOption(option.getAttribute("value") ?? "", event); }
        else this.toggleOpen(event);
        return;
      }
      if (event.key.length === 1 && event.key !== " " && !event.altKey && !event.ctrlKey && !event.metaKey) { this.typing = true; if (!this.open) this.openList(0, event); }
      else if (["ArrowDown", "ArrowUp", "Home", "End", "PageDown", "PageUp"].includes(event.key)) this.typing = false;
      if (event.key === "ArrowDown") { event.preventDefault(); this.moveActive(1, event); }
      else if (event.key === "ArrowUp" && event.altKey && this.open) {
        event.preventDefault();
        if (this.activeIndex >= 0) { const option = this.filteredOptions()[this.activeIndex]; this.selectOption(option.getAttribute("value") ?? "", event); }
        else this.closeList(event);
      }
      else if (event.key === "ArrowUp") { event.preventDefault(); this.moveActive(-1, event); }
      else if (event.key === "Home" && this.open) { event.preventDefault(); this.moveActiveToEdge("first", event); }
      else if (event.key === "End" && this.open) { event.preventDefault(); this.moveActiveToEdge("last", event); }
      else if (event.key === "PageUp" && this.open) { event.preventDefault(); this.moveActive(-1, event, 10); }
      else if (event.key === "PageDown" && this.open) { event.preventDefault(); this.moveActive(1, event, 10); }
      else if (event.key === "Enter" && !this.open) { event.preventDefault(); this.openList(0, event); }
      else if (event.key === "Enter" && this.open && this.activeIndex >= 0) { event.preventDefault(); const option = this.filteredOptions()[this.activeIndex]; this.selectOption(option.getAttribute("value") ?? "", event); }
      else if (event.key === " " && this.open && (!this.typing || this.hasAttribute("button-trigger")) && this.activeIndex >= 0) { event.preventDefault(); const option = this.filteredOptions()[this.activeIndex]; this.selectOption(option.getAttribute("value") ?? "", event); }
      else if (event.key === "Tab" && this.open && !this.hasAttribute("multiselect") && this.activeIndex >= 0) { const option = this.filteredOptions()[this.activeIndex]; this.selectOption(option.getAttribute("value") ?? "", event); }
      else if (event.key === "Backspace" && this.hasAttribute("multiselect") && !this.currentValue && this.selectedOptionsState.length) { event.preventDefault(); this.setOptionSelected(this.selectedOptionsState.at(-1)!, false, event); }
      else if (event.key === "Escape" && this.open) {
        event.preventDefault();
        event.stopPropagation();
        this.typing = false;
        const selected = this.optionElements().find(option => option.getAttribute("value") === this.selectedValue);
        if (selected) { this.currentValue = (selected.getAttribute("label") ?? selected.textContent ?? "").trim(); const input = this.getInput(); if (input) input.value = this.currentValue; }
        else if (!this.hasAttribute("allow-freeform")) { this.currentValue = ""; const input = this.getInput(); if (input) input.value = ""; }
        this.dirty = false;
        this.closeList(event);
        this.syncFormState();
      }
    }

    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const id = `combo-${this.instanceId}`;
      const label = document.createElement("label");
      label.htmlFor = this.hasAttribute("button-trigger") ? id : id + "-input";
      label.id = id + "-label";
      label.textContent = this.getAttribute("label") ?? "";
      label.part.add("label");
      const wrapper = document.createElement("div");
      wrapper.className = "control";
      const selected = document.createElement("div"); selected.className = "selected"; selected.hidden = true; selected.setAttribute("aria-label", this.getAttribute("selected-label") ?? "Selected options");
      const input = document.createElement("input");
      input.id = id + "-input";
      input.type = "text";
      input.role = "combobox";
      input.autocomplete = "off";
      input.setAttribute("aria-autocomplete", "list");
      input.setAttribute("aria-haspopup", "listbox");
      input.value = this.currentValue;
      input.placeholder = this.getAttribute("placeholder") ?? "";
      input.readOnly = this.hasAttribute("read-only");
      input.disabled = this.hasAttribute("disabled");
      input.required = this.hasAttribute("required");
      for (const name of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) { const value = this.getAttribute(name); if (value !== null) input.setAttribute(name, value); }
      input.part.add("control");
      this.fallbackInput = input;
      const inputSlot = document.createElement("slot"); inputSlot.name = "input"; inputSlot.append(input); this.inputSlot = inputSlot;
      inputSlot.addEventListener("slotchange", () => { this.bindInput(); this.syncAria(); this.syncFormState(); });
      const triggerSlot = document.createElement("slot"); triggerSlot.name = "button"; triggerSlot.hidden = !this.hasAttribute("button-trigger"); this.buttonTriggerSlot = triggerSlot;
      const trigger = document.createElement("button"); trigger.type = "button"; trigger.id = id; trigger.className = "trigger"; trigger.setAttribute("role", "combobox"); trigger.setAttribute("aria-haspopup", "listbox");
      this.fallbackButtonTrigger = trigger;
      const triggerValue = document.createElement("span"); triggerValue.className = "trigger-value"; trigger.append(triggerValue);
      trigger.addEventListener("click", event => this.toggleOpen(event));
      trigger.addEventListener("keydown", event => this.onKeyDown(event));
      if (this.hasAttribute("button-trigger")) triggerSlot.append(trigger);
      triggerSlot.addEventListener("slotchange", () => {
        if (triggerSlot.assignedElements({ flatten: true }).length) trigger.remove();
        else if (this.hasAttribute("button-trigger") && trigger.parentElement !== triggerSlot) triggerSlot.append(trigger);
        this.syncAria();
      });
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "clear";
      const clearIcon = document.createElement("slot"); clearIcon.name = "clear-icon";
      const fallbackClearIcon = document.createElement("span"); fallbackClearIcon.textContent = "×"; fallbackClearIcon.setAttribute("aria-hidden", "true"); clearIcon.append(fallbackClearIcon); clear.append(clearIcon);
      clear.setAttribute("aria-label", this.getAttribute("clear-label") ?? "Clear selection");
      clear.hidden = !this.hasAttribute("clearable");
      clear.addEventListener("pointerdown", event => event.preventDefault());
      clear.addEventListener("click", event => this.clearSelection(event));
      const clearSlot = document.createElement("slot"); clearSlot.name = "clear-button"; clearSlot.append(clear); clearSlot.addEventListener("slotchange", () => this.syncClearButton());
      const expand = document.createElement("span"); expand.className = "expand"; expand.setAttribute("aria-hidden", "true");
      const expandSlot = document.createElement("slot"); expandSlot.name = "expand-icon"; expandSlot.addEventListener("slotchange", () => this.syncExpandIcon());
      const fallbackExpand = document.createElement("span"); fallbackExpand.textContent = "⌄"; expandSlot.append(fallbackExpand); expand.append(expandSlot);
      const list = document.createElement("ul");
      list.setAttribute("role", "listbox");
      list.id = `listbox-${this.instanceId}`;
      const listboxSlot = document.createElement("slot"); listboxSlot.name = "listbox"; listboxSlot.append(list);
      listboxSlot.addEventListener("slotchange", () => this.updateOptions());
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.setAttribute("role", "status");
      empty.hidden = true;
      wrapper.append(selected, triggerSlot, inputSlot, expand, clearSlot, listboxSlot, empty);
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:grid;gap:var(--spui-control-gap,6px)}label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}.control{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:4px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,var(--colorNeutralStroke1,#8a8886))));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,var(--colorNeutralBackground1,#fff))));box-shadow:var(--spui-control-shadow,none)}.selected{display:flex;flex-wrap:wrap;gap:4px;min-width:0}.selected[hidden]{display:none}.tag{display:inline-flex;align-items:center;gap:4px;padding:2px 4px 2px 8px;border:1px solid var(--spui-tag-border,var(--spui-ui-stroke,#d1d1d1));border-radius:var(--spui-tag-radius,4px);background:var(--spui-tag-background,var(--spui-ui-surface-hover,#f5f5f5));color:var(--spui-ui-text,inherit);font-size:.9em}.remove,.clear{width:24px;height:24px;border:0;border-radius:3px;background:transparent;color:inherit;cursor:pointer}.remove:hover,.clear:hover{background:var(--spui-ui-surface-hover,#f5f5f5)}input{box-sizing:border-box;flex:1 1 120px;min-width:80px;min-height:calc(var(--spui-control-height,36px) - 10px);padding:4px 8px;border:0;outline:0;background:transparent;color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font:inherit}input:focus-visible{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:1px}input:disabled{opacity:.55}ul{position:absolute;z-index:var(--spui-layer-dropdown,20);top:calc(100% + 4px);inset-inline:0;box-sizing:border-box;max-height:240px;overflow:auto;margin:0;padding:4px;list-style:none;border:1px solid var(--spui-ui-stroke,#d1d1d1);border-radius:var(--spui-card-radius,8px);background:var(--spui-ui-surface,#fff);box-shadow:var(--spui-card-shadow,0 4px 14px #0002)}:host([positioning^=above]) ul{top:auto;bottom:calc(100% + 4px)}ul[hidden]{display:none}.option-group{display:grid;gap:2px;padding-block:2px}.group-label{padding:6px 10px;color:var(--spui-ui-muted,inherit);font-size:12px;font-weight:600}[role=option],li.empty{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--spui-control-radius,4px);color:var(--spui-ui-text,inherit);cursor:pointer}[role=option][data-active=true],[role=option][aria-selected=true]{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.check{display:inline-grid;place-items:center;width:16px;height:16px;flex:none;border:1px solid var(--spui-ui-stroke,#8a8886);border-radius:3px;color:var(--spui-ui-accent,#0f6cbd);font-size:12px}[role=option][aria-selected=true] .check{border-color:var(--spui-ui-accent,#0f6cbd);background:var(--spui-ui-canvas,#f5f5f5)}[role=option][aria-disabled=true]{opacity:.5;cursor:not-allowed}li.empty{color:var(--spui-ui-muted,inherit);cursor:default}:host([size=small]) input{min-height:30px}:host([size=large]) input{min-height:44px}:host([appearance=filled-darker]) input{background:var(--spui-ui-surface-sunken,#f0f0f0)}:host([appearance=filled-lighter]) input{background:var(--spui-ui-surface,#fff)}:host([appearance=underline]) input{border-radius:0;border-width:0 0 1px}@media(forced-colors:active){.control,ul{border-color:CanvasText;box-shadow:none}.tag{border-color:CanvasText}.check{border-color:CanvasText}li[role=option][data-active=true]{outline:1px solid Highlight}}:host(:not([multiselect])) .control{display:block;gap:0;padding:0;border:0;background:transparent;box-shadow:none}:host(:not([multiselect])) input{box-sizing:border-box;width:100%;min-height:var(--spui-control-height,36px);padding:8px 12px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,#8a8886)));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,#fff)));box-shadow:var(--spui-control-shadow,none);color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font:inherit}:host(:not([multiselect])) input:focus-visible{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px}:host([multiselect]) .control:focus-within{border-color:var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));box-shadow:0 0 0 1px var(--spui-focus-ring,var(--spui-ui-accent,#0078d4))}@media(forced-colors:active){:host(:not([multiselect])) input{border-color:FieldText;background:Field;color:FieldText}}`;
      style.textContent += ".expand{display:inline-flex;align-items:center;justify-content:center;flex:none;color:inherit}.expand[hidden]{display:none}::slotted([slot=clear-button]){cursor:pointer}:host([read-only]) .expand,:host([button-trigger]) .expand{position:absolute;inset-inline-end:6px;top:6px}:host([read-only]) .clear,:host([read-only]) ::slotted([slot=clear-button]),:host([button-trigger]) .clear,:host([button-trigger]) ::slotted([slot=clear-button]){position:absolute;inset-inline-end:32px;top:6px}:host([read-only]) input{width:calc(100% - 56px)}:host([read-only]:not([clearable])) input{width:calc(100% - 28px)}.trigger,::slotted([slot=button]){box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:var(--spui-control-height,36px);padding:8px 12px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,#8a8886)));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,#fff)));box-shadow:var(--spui-control-shadow,none);color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font:inherit;text-align:start;cursor:pointer}.trigger:focus-visible,::slotted([slot=button]:focus-visible){outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,#005a9e));outline-offset:2px}.trigger:disabled,::slotted([slot=button][disabled]){opacity:.55;cursor:not-allowed}:host([button-trigger][size=small]) .trigger,:host([button-trigger][size=small]) ::slotted([slot=button]){min-height:30px}:host([button-trigger][size=large]) .trigger,:host([button-trigger][size=large]) ::slotted([slot=button]){min-height:44px}:host([button-trigger]) .trigger-value{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media(forced-colors:active){.trigger,:host([button-trigger]) ::slotted([slot=button]){border-color:ButtonText;background:ButtonFace;color:ButtonText}.trigger:focus-visible,:host([button-trigger]) ::slotted([slot=button]:focus-visible){outline-color:Highlight}}";
      style.textContent = style.textContent?.replaceAll("li.empty", ".empty") ?? "";
      style.textContent += `::slotted([slot=input]){box-sizing:border-box;flex:1 1 120px;min-width:80px;min-height:calc(var(--spui-control-height,36px) - 10px);padding:4px 8px;border:0;outline:0;background:transparent;color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font:inherit}::slotted([slot=input]:focus-visible){outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:1px}:host(:not([multiselect])) ::slotted([slot=input]){box-sizing:border-box;width:100%;min-height:var(--spui-control-height,36px);padding:8px 12px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,#8a8886)));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,#fff)));color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font:inherit}`;
      shadow.replaceChildren(style, label, wrapper);
      this.bindInput(); this.syncExpandIcon();
      this.updateOptions();
    }
  }
  customElements.define("spui-combobox", SpuiCombobox);
}
