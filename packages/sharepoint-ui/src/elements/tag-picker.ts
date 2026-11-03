import { base, syncHostAccessibleName } from "./shared.js";
import { getFloatingPosition, type FloatingAlign, type FloatingPlacement } from "./floating-position.js";
import type { TooltipPositioning, TooltipPositioningOptions } from "./tooltip.js";

type PickerOption = { value: string; label: string; group: string; disabled: boolean; selected: boolean; element: Element };
export type TagPickerOpenChangeType = "click" | "keydown" | "input" | "focus" | "focusout" | "blur" | "pointerdown" | "programmatic";
export type TagPickerOnOpenChangeData = { open: boolean; reason: string } & (
  | { event: MouseEvent; type: "click" }
  | { event: KeyboardEvent; type: "keydown" }
  | { event: Event; type: Exclude<TagPickerOpenChangeType, "click" | "keydown" | "programmatic"> }
  | { event: Event; type: "programmatic" }
);
export type TagPickerOnOptionSelectData = { value: string; selectedOptions: string[] } & (
  | { event: MouseEvent; type: "click" }
  | { event: KeyboardEvent; type: "keydown" }
);

/** Searchable multi-select picker with native form association and light-DOM options. */
export function defineTagPicker(): void {
  if (customElements.get("spui-tag-picker")) return;
  class SpuiTagPicker extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["label", "placeholder", "selected-values", "selected-options", "default-selected-options", "input-value", "input-appearance", "input-disabled", "input-aria-label", "input-aria-describedby", "clearable", "selected-label", "required-message", "inline", "no-popover", "disabled", "required", "name", "no-results", "remove-label", "open", "default-open", "positioning", "disable-auto-focus", "aria-label", "aria-labelledby", "aria-description", "aria-describedby"];
    private internals?: ElementInternals;
    private observer?: MutationObserver;
    private resizeObserver?: ResizeObserver;
    private events?: AbortController;
    private readonly buttonDisabledDefaults = new WeakMap<HTMLElement, boolean>();
    private readonly instanceId = `tag-picker-${crypto.randomUUID()}`;
    private selected = new Set<string>();
    private query = "";
    private activeIndex = -1;
    private openState = false;
    private openControlled = false;
    private formDisabled = false;
    private initialValues: string[] = [];
    private positioningValue?: TooltipPositioning;

    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }

    constructor() {
      super();
      try { this.internals = this.attachInternals(); } catch { /* Keep selection usable where form-associated custom elements are unavailable. */ }
    }

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.events?.abort();
      this.events = new AbortController();
      const options = { signal: this.events.signal };
      window.addEventListener("resize", this.positionList, options);
      window.addEventListener("scroll", this.positionList, { ...options, capture: true });
      document.addEventListener("pointerdown", this.onOutsidePointerDown, { ...options, capture: true });
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(this.positionList);
      const control = this.shadowRoot?.querySelector<HTMLElement>(".control");
      const list = this.shadowRoot?.querySelector<HTMLElement>(".popup");
      if (control) this.resizeObserver.observe(control);
      if (list) this.resizeObserver.observe(list);
      this.addEventListener("click", this.onButtonClick);
      this.addEventListener("keydown", this.onButtonKeyDown);
      this.addEventListener("focusout", this.onPickerFocusOut);
      if (this.hasAttribute("open")) { this.openControlled = true; this.openState = this.getAttribute("open") !== "false"; }
      else this.openState = this.hasAttribute("default-open");
      this.initialValues = this.readSelectedValues();
      this.selected = new Set(this.initialValues);
      this.query = this.getAttribute("input-value") ?? "";
      this.observer = new MutationObserver(() => { this.renderOptions(); this.syncForm(); });
      this.observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "text", "label", "group", "disabled", "selected"] });
      this.syncButtonSlot();
      this.renderOptions();
      this.syncForm();
    }

    disconnectedCallback(): void { this.observer?.disconnect(); this.resizeObserver?.disconnect(); this.events?.abort(); this.hideList(); }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (!this.isConnected) return;
      if (name === "selected-values" || name === "selected-options" || name === "default-selected-options") {
        this.initialValues = this.readSelectedValues();
        this.selected = new Set(this.initialValues);
        this.renderOptions();
      } else if (name === "label") {
        const label = this.shadowRoot?.querySelector<HTMLLabelElement>("label");
        if (label) label.textContent = this.getAttribute("label") ?? "";
      } else if (name === "placeholder") {
        const input = this.input(); if (input) input.placeholder = this.getAttribute("placeholder") ?? "";
      } else if (name === "input-value") {
        this.query = value ?? ""; const input = this.input(); if (input) input.value = this.query; this.renderOptions();
      } else if (name === "input-disabled") {
        const input = this.input(); if (input) input.disabled = this.isDisabled() || this.hasAttribute("input-disabled");
      } else if (name === "input-aria-label" || name === "input-aria-describedby") {
        const input = this.input(); const target = name === "input-aria-label" ? "aria-label" : "aria-describedby";
        if (input) this.hasAttribute(name) ? input.setAttribute(target, this.getAttribute(name)!) : input.removeAttribute(target);
      } else if (name === "clearable") {
        const input = this.input(); if (input) input.type = this.hasAttribute("clearable") ? "search" : "text";
      } else if (name === "aria-label" || name === "aria-labelledby" || name === "aria-description" || name === "aria-describedby") {
        const input = this.input();
        if (input) syncHostAccessibleName(this, input);
      } else if (name === "positioning") {
        this.positionList();
      } else if (name === "open") {
        this.openControlled = this.hasAttribute("open");
        if (this.openControlled) this.openState = this.getAttribute("open") !== "false";
        this.syncAria();
      } else if (name === "default-open" && !this.openControlled) {
        this.openState = this.hasAttribute("default-open");
        this.syncAria();
      } else this.renderOptions();
      this.syncAria();
      this.syncForm();
    }

    get value(): string[] { return [...this.selected]; }
    set value(values: string[]) { this.setSelected(Array.isArray(values) ? values : []); }
    get inputValue(): string { return this.query; }
    set inputValue(value: string) { this.query = String(value ?? ""); const input = this.input(); if (input) input.value = this.query; this.renderOptions(); }
    get selectedValues(): string[] { return this.value; }
    set selectedValues(values: string[]) { this.value = values; }
    get selectedOptions(): string[] { return this.value; }
    set selectedOptions(values: string[]) { this.value = values; }
    get defaultSelectedOptions(): string[] { return this.readSelectedValues(); }
    set defaultSelectedOptions(values: string[]) { this.setAttribute("default-selected-options", JSON.stringify(values)); }
    get open(): boolean { return this.openState; }
    set open(value: boolean) { this.openControlled = true; this.openState = Boolean(value); this.syncAria(); }
    get defaultOpen(): boolean { return this.openState; }
    set defaultOpen(value: boolean) { if (!this.openControlled) { this.openState = Boolean(value); this.syncAria(); } }
    get positioning(): TooltipPositioning | undefined { return this.positioningValue; }
    set positioning(value: TooltipPositioning | undefined) { this.positioningValue = value; this.positionList(); }

    private isDisabled(): boolean { return this.formDisabled || this.hasAttribute("disabled"); }
    private setOpen(value: boolean, reason: string, event?: Event): void {
      if (value && this.isDisabled()) return;
      const changed = this.open !== value;
      if (!changed) return;
      if (!this.openControlled) this.openState = value;
      this.syncAria();
      const sourceEvent = event ?? new Event("programmatic");
      this.dispatchEvent(new CustomEvent<TagPickerOnOpenChangeData>("spui-open-change", { detail: { open: value, reason, event: sourceEvent, type: sourceEvent.type as TagPickerOpenChangeType } as TagPickerOnOpenChangeData, bubbles: true, composed: true }));
    }

    formDisabledCallback(disabled: boolean): void { this.formDisabled = disabled; const input = this.input(); if (input) input.disabled = this.isDisabled(); this.syncAria(); }
    formResetCallback(): void { this.selected = new Set(this.initialValues); this.query = ""; this.closeList(); this.renderOptions(); this.syncForm(); }
    formStateRestoreCallback(state: string | File | FormData | null): void {
      if (state instanceof FormData) this.setSelected(state.getAll(this.getAttribute("name") ?? "").map(String));
      else if (typeof state === "string") { try { this.setSelected(JSON.parse(state)); } catch { this.setSelected(state ? [state] : []); } }
    }

    private buttonTrigger(): HTMLElement | null {
      return this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="button"]')?.assignedElements({ flatten: true }).find((element): element is HTMLElement => element instanceof HTMLElement) ?? null;
    }
    private readonly onButtonClick = (event: Event): void => {
      const trigger = this.buttonTrigger();
      if (!trigger || !event.composedPath().includes(trigger)) return;
      if (this.isDisabled()) { event.preventDefault(); return; }
      if (this.open) this.closeList("pointer", event);
      else { this.setOpen(true, "pointer", event); this.activeIndex = this.hasAttribute("disable-auto-focus") ? -1 : this.filteredOptions().findIndex(option => !option.disabled); this.syncAria(); }
    };
    private readonly onButtonKeyDown = (event: KeyboardEvent): void => {
      const trigger = this.buttonTrigger();
      if (!trigger || !event.composedPath().includes(trigger)) return;
      if (event.key === "Escape" && this.open) { event.preventDefault(); this.closeList("escape", event); trigger.focus(); }
      else if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); this.moveActive(event.key === "ArrowDown" ? 1 : -1, event); }
      else if ((event.key === "Enter" || event.key === " ") && this.open && this.activeIndex >= 0) { event.preventDefault(); const option = this.filteredOptions()[this.activeIndex]; if (option) this.toggleOption(option.value, event.key === "Enter", "keyboard", event); }
    };
    private readonly onPickerFocusOut = (event: FocusEvent): void => { window.setTimeout(() => { if (!this.matches(":focus-within")) this.closeList("blur", event); }, 0); };
    private readonly onOutsidePointerDown = (event: PointerEvent): void => { if (!event.composedPath().includes(this)) this.closeList("outside", event); };
    private popup(): (HTMLElement & { showPopover?: () => void; hidePopover?: () => void }) | null {
      return this.shadowRoot?.querySelector<HTMLElement>(".popup") as (HTMLElement & { showPopover?: () => void; hidePopover?: () => void }) | null;
    }
    private hideList(): void {
      const popup = this.popup();
      if (!popup) return;
      try { popup.hidePopover?.(); } catch { /* It may not have been opened in a supporting browser. */ }
      popup.hidden = true;
    }
    private readonly positionList = (): void => {
      const popup = this.popup();
      const anchor = this.shadowRoot?.querySelector<HTMLElement>(".control");
      if ((!this.open && !this.hasAttribute("no-popover")) || !popup || !anchor) return;
      popup.hidden = false;
      if (this.hasAttribute("inline") || this.hasAttribute("no-popover")) {
        if (popup.matches(":popover-open")) { try { popup.hidePopover?.(); } catch { /* Keep the in-flow popup usable when the native API rejects a transition. */ } }
        // A closed native popover is hidden by the browser's UA stylesheet. Remove
        // the popover behavior when this surface is rendered in the regular layer.
        popup.removeAttribute("popover");
        popup.dataset.placement = "bottom";
        return;
      }
      if (!popup.hasAttribute("popover")) popup.setAttribute("popover", "manual");
      if (typeof popup.showPopover === "function" && !popup.matches(":popover-open")) {
        try { popup.showPopover(); } catch { /* Fixed positioning remains a fallback for browsers without Popover API support. */ }
      }
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(rect.width, window.innerWidth - 8);
      popup.style.width = `${width}px`;
      const direction = getComputedStyle(this).direction === "rtl" ? "rtl" : "ltr";
      const config = this.positioningValue;
      const raw = typeof config === "string" ? config : config?.position ?? "below";
      const [side = "below", suffix] = raw.split("-");
      const placementMap: Record<string, FloatingPlacement> = { above: "top", below: "bottom", before: "start", after: "end", top: "top", bottom: "bottom", left: "left", right: "right", start: "start", end: "end" };
      const placement = placementMap[side] ?? "bottom";
      const align = (typeof config === "object" && config ? config.align : undefined) ?? (suffix === "start" || suffix === "end" || suffix === "top" || suffix === "bottom" ? suffix as FloatingAlign : "start");
      const options = typeof config === "object" && config ? config as TooltipPositioningOptions : undefined;
      const offset = typeof options?.offset === "number" ? options.offset : typeof options?.offset === "object" ? options.offset.mainAxis : 4;
      const fallback = (options?.fallbackPositions ?? []).map(value => {
        const [fallbackSide, fallbackAlign] = value.split("-");
        return { placement: placementMap[fallbackSide] ?? "bottom", align: fallbackAlign as FloatingAlign | undefined };
      });
      const position = getFloatingPosition(rect, { width: popup.offsetWidth, height: popup.offsetHeight }, placement, direction, offset, undefined, align, fallback, options?.pinned, undefined, undefined, { coverTarget: options?.coverTarget });
      popup.dataset.placement = position.placement;
      popup.style.left = `${position.left}px`;
      popup.style.top = `${position.top}px`;
    };
    private syncButtonSlot(): void { this.toggleAttribute("data-button-trigger", this.buttonTrigger() !== null); this.syncAria(); }
    private input(): HTMLInputElement | null { return this.shadowRoot?.querySelector("input") ?? null; }
    private optionContent(element: Element, slot: string): Element | null { return element.querySelector(`:scope > [slot="${slot}"]`); }
    private optionLabel(element: Element): string {
      const label = element.getAttribute("label") ?? this.optionContent(element, "label")?.textContent;
      if (label !== null && label !== undefined) return label.trim();
      return [...element.childNodes].filter(node => !(node instanceof Element && ["media", "secondary-content"].includes(node.getAttribute("slot") ?? ""))).map(node => node.textContent ?? "").join("").trim();
    }
    private appendOptionContent(target: HTMLElement, option: PickerOption, slot: "media" | "secondary-content"): void {
      const source = this.optionContent(option.element, slot);
      if (!source) return;
      const content = document.createElement("span"); content.className = slot === "media" ? "option-media" : "option-secondary";
      if (slot === "media") content.setAttribute("aria-hidden", "true");
      for (const node of source.childNodes) content.append(node.cloneNode(true));
      target.append(content);
    }
    private options(): PickerOption[] {
      return [...this.querySelectorAll("spui-tag-picker-option,option")].map(element => ({
        element,
        value: element.getAttribute("value") ?? "",
        label: element.getAttribute("text")?.trim() || this.optionLabel(element),
        group: element.getAttribute("group")?.trim() || element.closest("spui-tag-picker-option-group")?.getAttribute("label")?.trim() || "",
        disabled: element.hasAttribute("disabled") || Boolean(element.closest("spui-tag-picker-option-group")?.hasAttribute("disabled")),
        selected: element.hasAttribute("selected")
      })).filter(option => option.value && option.label);
    }
    private readSelectedValues(): string[] {
      const serialized = this.getAttribute("selected-options") ?? this.getAttribute("selected-values") ?? this.getAttribute("default-selected-options");
      if (serialized !== null) { try { const values: unknown = JSON.parse(serialized); return Array.isArray(values) ? values.filter((value): value is string => typeof value === "string") : []; } catch { return []; } }
      return this.options().filter(option => option.selected).map(option => option.value);
    }
    private filteredOptions(): PickerOption[] {
      const query = this.query.trim().toLocaleLowerCase(this.lang || undefined);
      return this.options().filter(option => !query || option.label.toLocaleLowerCase(this.lang || undefined).includes(query));
    }
    private setSelected(values: string[]): void {
      const available = new Set(this.options().map(option => option.value));
      this.selected = new Set(values.filter(value => available.has(value)));
      this.renderOptions();
      this.syncForm();
    }
    private toggleOption(value: string, closeAfterSelection: boolean, reason: string, event: MouseEvent | KeyboardEvent): void {
      const option = this.options().find(item => item.value === value);
      if (!option || option.disabled || this.isDisabled()) return;
      if (this.selected.has(value)) this.selected.delete(value); else this.selected.add(value);
      this.query = "";
      const input = this.input(); if (input) input.value = "";
      this.setOpen(!closeAfterSelection, reason, event);
      this.renderOptions();
      this.activeIndex = closeAfterSelection ? -1 : this.filteredOptions().findIndex(item => !item.disabled && !this.selected.has(item.value));
      this.syncAria();
      this.syncForm();
      this.dispatchEvent(new CustomEvent("spui-change", { detail: { values: this.value, selectedValues: this.value }, bubbles: true, composed: true }));
      const detail: TagPickerOnOptionSelectData = event instanceof KeyboardEvent
        ? { value, selectedOptions: this.value, event, type: "keydown" }
        : { value, selectedOptions: this.value, event: event as MouseEvent, type: "click" };
      this.dispatchEvent(new CustomEvent<TagPickerOnOptionSelectData>("spui-option-select", { detail, bubbles: true, composed: true }));
    }
    private removeValue(value: string): void {
      if (!this.selected.has(value) || this.isDisabled()) return;
      this.selected.delete(value);
      this.renderOptions();
      this.syncForm();
      this.input()?.focus();
      this.dispatchEvent(new CustomEvent("spui-change", { detail: { values: this.value, selectedValues: this.value }, bubbles: true, composed: true }));
    }
    private syncForm(): void {
      const values = this.value;
      const input = this.input();
      input?.setAttribute("aria-required", String(this.hasAttribute("required")));
      if (input) input.disabled = this.isDisabled() || this.hasAttribute("input-disabled");
      const name = this.getAttribute("name") ?? "";
      const formData = new FormData();
      if (name) values.forEach(value => formData.append(name, value));
      this.internals?.setFormValue(values.length && name ? formData : null, JSON.stringify(values));
      const missing = this.hasAttribute("required") && values.length === 0;
      try { this.internals?.setValidity(missing ? { valueMissing: true } : {}, missing ? this.getAttribute("required-message") || "Choose at least one option." : "", (this.buttonTrigger() ?? input) ?? undefined); } catch { /* The input itself retains required semantics as a fallback. */ }
    }
    private syncAria(): void {
      const input = this.input();
      const list = this.shadowRoot?.querySelector<HTMLElement>("[role=listbox]");
      if (!input || !list) return;
      const expanded = this.open || this.hasAttribute("no-popover");
      input.setAttribute("aria-expanded", String(expanded));
      if (expanded) input.setAttribute("aria-controls", list.id); else input.removeAttribute("aria-controls");
      const trigger = this.buttonTrigger();
      if (trigger) {
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", String(this.open));
        trigger.setAttribute("aria-required", String(this.hasAttribute("required")));
        if (this.open) trigger.setAttribute("aria-controls", list.id); else trigger.removeAttribute("aria-controls");
        const originallyDisabled = this.buttonDisabledDefaults.get(trigger) ?? trigger.hasAttribute("disabled");
        this.buttonDisabledDefaults.set(trigger, originallyDisabled);
        const disabled = this.isDisabled() || originallyDisabled;
        if ("disabled" in trigger) (trigger as HTMLButtonElement).disabled = disabled;
        else if (disabled) trigger.setAttribute("disabled", "");
        else trigger.removeAttribute("disabled");
        if (this.isDisabled()) trigger.setAttribute("aria-disabled", "true"); else trigger.removeAttribute("aria-disabled");
      }
      const active = this.shadowRoot?.querySelector<HTMLElement>(`[data-option-index="${this.activeIndex}"]`);
      if (expanded && active) input.setAttribute("aria-activedescendant", active.id); else input.removeAttribute("aria-activedescendant");
      list.querySelectorAll<HTMLElement>("[role=option]").forEach(option => { option.dataset.active = String(expanded && Number(option.dataset.optionIndex) === this.activeIndex); });
      const empty = this.shadowRoot?.querySelector<HTMLElement>(".empty");
      if (empty) empty.hidden = !expanded || this.filteredOptions().length > 0;
      list.hidden = false;
      if (expanded) this.positionList(); else this.hideList();
    }
    private closeList(reason = "programmatic", event?: Event): void { this.setOpen(false, reason, event); this.activeIndex = -1; this.syncAria(); }
    private moveActive(delta: number, event: KeyboardEvent): void {
      const options = this.filteredOptions();
      if (!options.length) { this.activeIndex = -1; this.syncAria(); return; }
      let index = this.open ? this.activeIndex : delta > 0 ? -1 : 0;
      for (let count = 0; count < options.length; count++) {
        index = (index + delta + options.length) % options.length;
        if (!options[index].disabled) break;
      }
      this.setOpen(true, "keyboard", event);
      this.activeIndex = index;
      this.syncAria();
      this.shadowRoot?.querySelector<HTMLElement>(`[data-option-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
    }
    private onKeyDown(event: KeyboardEvent): void {
      if (event.key === "ArrowDown") { event.preventDefault(); this.moveActive(1, event); }
      else if (event.key === "ArrowUp") { event.preventDefault(); this.moveActive(-1, event); }
      else if ((event.key === "Enter" || event.key === " ") && this.open && this.activeIndex >= 0) { event.preventDefault(); const option = this.filteredOptions()[this.activeIndex]; if (option) this.toggleOption(option.value, event.key === "Enter", "keyboard", event); }
      else if (event.key === "Escape" && this.open) { event.preventDefault(); this.closeList("escape", event); }
      else if (event.key === "Backspace" && !this.query && this.selected.size) { event.preventDefault(); this.removeValue([...this.selected].at(-1)!); }
    }

    private renderOptions(): void {
      const list = this.shadowRoot?.querySelector<HTMLElement>("[role=listbox]");
      const selected = this.shadowRoot?.querySelector<HTMLElement>(".selected");
      if (!list || !selected) return;
      const selectedOptions = this.options().filter(option => this.selected.has(option.value));
      selected.replaceChildren();
      const selectedGroup = this.querySelector("spui-tag-picker-group[slot=selected-group]");
      const selectedSlot = document.createElement("slot"); selectedSlot.name = "selected-group"; selectedSlot.part.add("selected-group"); selectedSlot.hidden = !selectedGroup;
      selected.setAttribute("role", "group");
      selected.setAttribute("aria-label", this.getAttribute("selected-label") || "Selected options");
      selected.append(selectedSlot);
      for (const option of selectedGroup ? [] : selectedOptions) {
        const chip = document.createElement("span"); chip.className = "chip"; chip.part.add("chip");
        this.appendOptionContent(chip, option, "media");
        const text = document.createElement("span"); text.textContent = option.label;
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "remove"; remove.textContent = "×";
        remove.setAttribute("aria-label", `${this.getAttribute("remove-label") || "Remove"} ${option.label}`);
        remove.disabled = option.disabled || this.isDisabled();
        remove.addEventListener("click", () => this.removeValue(option.value));
        chip.append(text, remove); selected.append(chip);
      }
      const options = this.filteredOptions();
      list.replaceChildren();
      let previousGroup: string | undefined;
      let groupOptions: HTMLElement | null = null;
      options.forEach((option, index) => {
        if (option.group !== previousGroup) {
          groupOptions = null;
          if (option.group) {
            const group = document.createElement("li"); group.className = "option-group"; group.setAttribute("role", "group"); group.setAttribute("aria-label", option.group);
            const heading = document.createElement("div");
            heading.className = "group-heading"; heading.setAttribute("role", "presentation");
            heading.textContent = option.group;
            groupOptions = document.createElement("div"); groupOptions.className = "option-group-options"; groupOptions.setAttribute("role", "presentation");
            group.append(heading, groupOptions); list.append(group);
          }
        }
        const item = document.createElement(option.group ? "div" : "li");
        item.id = `${this.instanceId}-option-${index}`; item.dataset.optionIndex = String(index); item.dataset.active = String(this.open && index === this.activeIndex);
        item.setAttribute("role", "option"); item.setAttribute("aria-selected", String(this.selected.has(option.value)));
        if (option.disabled) item.setAttribute("aria-disabled", "true");
        this.appendOptionContent(item, option, "media");
        const label = document.createElement("span"); label.className = "option-label"; label.textContent = option.label; item.append(label);
        this.appendOptionContent(item, option, "secondary-content");
        item.addEventListener("pointerdown", event => event.preventDefault());
        item.addEventListener("click", event => this.toggleOption(option.value, true, "pointer", event as MouseEvent));
        (groupOptions ?? list).append(item);
        previousGroup = option.group;
      });
      const empty = this.shadowRoot?.querySelector<HTMLElement>(".empty");
      if (empty) { empty.textContent = this.getAttribute("no-results") || "No results"; empty.hidden = options.length > 0; }
      this.syncAria();
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const label = document.createElement("label"); label.htmlFor = `${this.instanceId}-input`; label.textContent = this.getAttribute("label") ?? ""; label.part.add("label");
      const control = document.createElement("div"); control.className = "control"; control.part.add("control");
      const selected = document.createElement("div"); selected.className = "selected"; selected.part.add("selected");
      const buttonSlot = document.createElement("slot"); buttonSlot.name = "button"; buttonSlot.addEventListener("slotchange", () => this.syncButtonSlot());
      const secondarySlot = document.createElement("slot"); secondarySlot.name = "secondary-action"; secondarySlot.part.add("secondary-action");
      const expandSlot = document.createElement("slot"); expandSlot.name = "expand-icon"; expandSlot.part.add("expand-icon");
      const input = document.createElement("input"); input.id = `${this.instanceId}-input`; input.type = this.hasAttribute("clearable") ? "search" : "text"; input.role = "combobox"; input.autocomplete = "off";
      input.setAttribute("aria-autocomplete", "list"); input.setAttribute("aria-haspopup", "listbox"); input.setAttribute("aria-expanded", "false");
      input.placeholder = this.getAttribute("placeholder") ?? ""; input.value = this.getAttribute("input-value") ?? ""; input.disabled = this.isDisabled() || this.hasAttribute("input-disabled"); input.part.add("input");
      for (const name of ["input-aria-label", "input-aria-describedby"]) { const value = this.getAttribute(name); if (value !== null) input.setAttribute(name.replace("input-", ""), value); }
      const popup = document.createElement("div"); popup.className = "popup"; popup.setAttribute("popover", "manual"); popup.hidden = true; popup.part.add("popup");
      const list = document.createElement("ul"); list.id = `${this.instanceId}-listbox`; list.setAttribute("role", "listbox"); list.setAttribute("aria-multiselectable", "true"); list.part.add("listbox");
      const empty = document.createElement("div"); empty.className = "empty"; empty.setAttribute("role", "status"); empty.hidden = true;
      input.addEventListener("input", event => { this.query = input.value; this.setOpen(true, "input", event); this.activeIndex = this.hasAttribute("disable-auto-focus") ? -1 : this.filteredOptions().findIndex(option => !option.disabled); this.renderOptions(); this.dispatchEvent(new CustomEvent("spui-input", { detail: { value: this.query }, bubbles: true, composed: true })); });
      input.addEventListener("focus", event => { this.setOpen(true, "focus", event); this.renderOptions(); });
      input.addEventListener("keydown", event => this.onKeyDown(event));
      input.addEventListener("blur", event => window.setTimeout(() => { if (!this.matches(":focus-within")) this.closeList("blur", event); }, 0));
      popup.append(list, empty);
      control.append(selected, buttonSlot, input, popup, secondarySlot, expandSlot);
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:grid;gap:var(--spui-control-gap,6px);min-width:0}label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}.control{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:4px;box-sizing:border-box;min-height:var(--spui-control-height,36px);padding:4px 8px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,#8a8886)));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,#fff)));color:var(--spui-ui-text,inherit)}.control:focus-within{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:1px}.selected{display:contents}.chip{display:inline-flex;align-items:center;gap:4px;max-width:100%;padding:2px 5px 2px 8px;border:1px solid var(--spui-base-stroke,var(--spui-ui-stroke,#d1d1d1));border-radius:999px;background:color-mix(in srgb,var(--spui-base-accent,var(--spui-ui-accent,#0078d4)) 12%,var(--spui-base-surface,var(--spui-ui-surface,#fff)));font-size:12px}.chip>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.remove{display:grid;place-items:center;flex:none;width:20px;height:20px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;font:inherit;font-size:16px;cursor:pointer}.remove:hover{background:color-mix(in srgb,currentColor 12%,transparent)}.remove:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4))}.remove:disabled{opacity:.5;cursor:not-allowed}input{flex:1 1 100px;min-width:72px;width:auto;min-height:28px;padding:2px 4px;border:0;outline:none;background:transparent;color:inherit;font:inherit}input::placeholder{color:var(--spui-ui-muted,#616161)}input:disabled{cursor:not-allowed}ul{position:absolute;z-index:var(--spui-layer-dropdown,20);top:calc(100% + 4px);inset-inline:0;box-sizing:border-box;max-height:240px;overflow:auto;margin:0;padding:4px;list-style:none;border:1px solid var(--spui-ui-stroke,#d1d1d1);border-radius:var(--spui-card-radius,8px);background:var(--spui-ui-surface,#fff);box-shadow:var(--spui-card-shadow,0 4px 14px #0002)}ul[hidden]{display:none}.group-heading{padding:7px 10px 3px;color:var(--spui-ui-muted,inherit);font-size:11px;font-weight:600}li[role=option]{padding:8px 10px;border-radius:var(--spui-control-radius,4px);color:var(--spui-ui-text,inherit);cursor:pointer}li[role=option][data-active=true],li[role=option][aria-selected=true]{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}li[role=option][aria-disabled=true]{opacity:.5;cursor:not-allowed}.empty{position:absolute;z-index:calc(var(--spui-layer-dropdown,20) + 1);top:calc(100% + 4px);inset-inline:0;box-sizing:border-box;padding:12px;border:1px solid var(--spui-ui-stroke,#d1d1d1);border-radius:var(--spui-card-radius,8px);background:var(--spui-ui-surface,#fff);box-shadow:var(--spui-card-shadow,0 4px 14px #0002);color:var(--spui-ui-muted,inherit)}.empty[hidden]{display:none}:host([disabled]) .control{opacity:.55}@media(forced-colors:active){.control,ul,.empty{border-color:CanvasText}.chip{border-color:CanvasText}li[role=option][data-active=true]{outline:1px solid Highlight}}`;
      style.textContent += `.option-group{list-style:none;margin:0;padding:0}.option-media{display:inline-flex;align-items:center;justify-content:center;flex:none}.option-media img,.option-media svg{width:24px;height:24px;object-fit:cover}.chip .option-media img,.chip .option-media svg{width:20px;height:20px;border-radius:50%}li[role=option],[role=group] [role=option]{display:flex;align-items:center;gap:8px}.option-group-options [role=option]{padding:8px 10px;border-radius:var(--spui-control-radius,4px);color:var(--spui-ui-text,inherit);cursor:pointer}.option-group-options [role=option][data-active=true],.option-group-options [role=option][aria-selected=true]{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.option-group-options [role=option][aria-disabled=true]{opacity:.5;cursor:not-allowed}.option-label{min-width:0;overflow:hidden;text-overflow:ellipsis}.option-secondary{margin-inline-start:auto;color:var(--spui-ui-muted,inherit);font-size:12px;white-space:nowrap}`;
      style.textContent += `:host([data-button-trigger]) input{display:none}::slotted(button[slot=button]){align-self:center;display:inline-flex;align-items:center;min-width:32px;min-height:28px;padding:4px 8px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#8a8886));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,inherit);font:inherit;cursor:pointer}::slotted(button[slot=button][data-appearance=filled-darker]){background:var(--spui-ui-surface-sunken,var(--spui-ui-canvas,#f5f5f5))}::slotted(button[slot=button][data-appearance=filled-lighter]){background:var(--spui-ui-surface,var(--spui-semantic-input-background,#fff))}::slotted(button[slot=button][data-appearance=underline]){border:0;border-bottom:1px solid currentColor;border-radius:0;background:transparent}::slotted(button[slot=button][data-size=small]){min-height:24px;padding:2px 6px;font-size:12px}::slotted(button[slot=button][data-size=large]){min-height:40px;padding:6px 12px;font-size:16px}::slotted(button[slot=button]:focus-visible){outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:1px}:host([disabled])::slotted(button[slot=button]){opacity:.55;cursor:not-allowed}`;
      style.textContent += `::slotted(spui-tag-picker-group){display:contents}:host([input-appearance=filled-darker]) .control{background:var(--spui-ui-surface-sunken,var(--spui-ui-canvas,#f5f5f5))}:host([input-appearance=filled-lighter]) .control{background:var(--spui-ui-surface,var(--spui-semantic-input-background,#fff))}:host([input-appearance=underline]) .control{border:0;border-bottom:1px solid var(--spui-control-border,var(--spui-ui-stroke,#8a8886));border-radius:0;background:transparent}`;
      style.textContent += `::slotted([slot=secondary-action]){display:inline-flex;align-items:center;flex:none}::slotted([slot=expand-icon]){display:inline-flex;align-items:center;justify-content:center;flex:none}:host([inline]) .popup,:host([no-popover]) .popup{position:absolute;inset-inline:0;top:calc(100% + 4px);left:auto;width:100%!important;max-height:min(240px,calc(100dvh - 8px));z-index:var(--spui-layer-dropdown,20)}`;
      style.textContent += `.popup{position:fixed;inset:auto;z-index:var(--spui-layer-popover,10000);box-sizing:border-box;max-width:calc(100vw - 8px);max-height:min(240px,calc(100dvh - 8px));overflow:auto;margin:0;padding:4px;border:1px solid var(--spui-ui-stroke,#d1d1d1);border-radius:var(--spui-card-radius,8px);background:var(--spui-ui-surface,#fff);color:var(--spui-ui-text,inherit);box-shadow:var(--spui-card-shadow,0 4px 14px #0002)}.popup[hidden]{display:none}.popup ul{position:static;inset:auto;z-index:auto;max-height:none;overflow:visible;margin:0;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none}.popup .empty{position:static;inset:auto;z-index:auto;margin:0;padding:12px;border:0;border-radius:0;background:transparent;box-shadow:none}`;
      const slot = document.createElement("slot"); slot.hidden = true;
      shadow.append(style, label, control, slot);
      syncHostAccessibleName(this, input);
      this.renderOptions();
    }
  }
  customElements.define("spui-tag-picker", SpuiTagPicker);
  const definePart = (tag: string): void => {
    if (customElements.get(tag)) return;
    class SpuiTagPickerPart extends HTMLElement {
      static observedAttributes = ["value", "placeholder", "disabled", "clearable", "appearance", "aria-label", "aria-describedby"];
      private readonly previous = new Map<string, string | null>();
      private picker?: HTMLElement;
      connectedCallback(): void { this.sync(); }
      attributeChangedCallback(): void { this.sync(); }
      private sync(): void {
        const picker = this.closest("spui-tag-picker") as (HTMLElement & { inputValue?: string }) | null;
        if (!picker) return;
        this.picker = picker;
        if (tag === "spui-tag-picker-control" || tag === "spui-tag-picker-list") {
          while (this.firstChild) picker.insertBefore(this.firstChild, this);
          this.remove();
          return;
        }
        if (tag === "spui-tag-picker-group") {
          this.slot = "selected-group";
          if (!this.hasAttribute("role")) this.setAttribute("role", "group");
          return;
        }
        if (tag === "spui-tag-picker-input") {
        const map: Record<string, string> = { value: "input-value", appearance: "input-appearance", disabled: "input-disabled", "aria-label": "input-aria-label", "aria-describedby": "input-aria-describedby" };
          for (const name of SpuiTagPickerPart.observedAttributes) {
            const attribute = map[name] ?? name;
            if (this.hasAttribute(name)) {
              if (!this.previous.has(attribute)) this.previous.set(attribute, picker.getAttribute(attribute));
              picker.setAttribute(attribute, this.getAttribute(name)!);
            } else if (this.previous.has(attribute)) {
              const original = this.previous.get(attribute);
              if (original === null) picker.removeAttribute(attribute); else picker.setAttribute(attribute, original!);
              this.previous.delete(attribute);
            }
          }
        }
      }
      disconnectedCallback(): void {
        if (tag !== "spui-tag-picker-input") return;
        for (const [attribute, original] of this.previous) {
          if (original === null) this.picker?.removeAttribute(attribute); else this.picker?.setAttribute(attribute, original);
        }
        this.previous.clear(); this.picker = undefined;
      }
    }
    customElements.define(tag, SpuiTagPickerPart);
  };
  for (const tag of ["spui-tag-picker-control", "spui-tag-picker-group", "spui-tag-picker-input", "spui-tag-picker-list", "spui-tag-picker-option-group"]) definePart(tag);
}
