import { base, syncHostAccessibleName } from "./shared.js";

const isoDate = (date: Date): string => `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
const fromIso = (value: string): Date | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : undefined;
};
const addDays = (date: Date, amount: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
const addMonths = (date: Date, amount: number): Date => new Date(date.getFullYear(), date.getMonth() + amount, Math.min(date.getDate(), new Date(date.getFullYear(), date.getMonth() + amount + 1, 0).getDate()));

export function defineDatePicker(): void {
  if (customElements.get("spui-date-picker")) return;
  class SpuiDatePicker extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["label", "value", "min", "max", "disabled", "required", "read-only", "name", "placeholder", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "previous-month-label", "next-month-label", "calendar-label", "invalid-date-message", "required-message"];
    private internals: ElementInternals | undefined;
    private currentValue: string | undefined;
    private formDisabled = false;
    private textInvalid = false;
    private customError = "";
    private viewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    private activeDate = new Date();
    private onDocumentPointer = (event: PointerEvent): void => { if (!this.contains(event.target as Node) && !this.shadowRoot?.contains(event.target as Node)) this.closeCalendar(false); };
    private onDocumentKey = (event: KeyboardEvent): void => { if (event.key === "Escape" && !this.shadowRoot?.querySelector<HTMLElement>(".calendar")?.hidden) { event.preventDefault(); this.closeCalendar(true); } };

    constructor() {
      super();
      try { this.internals = this.attachInternals(); } catch { /* Keep the date control usable when ElementInternals is unavailable. */ }
    }

    connectedCallback(): void { this.render(); }
    disconnectedCallback(): void { document.removeEventListener("pointerdown", this.onDocumentPointer, true); document.removeEventListener("keydown", this.onDocumentKey, true); }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (!this.isConnected) return;
      if (name === "value") { this.currentValue = value ?? ""; this.textInvalid = false; this.syncInput(); }
      else if (name === "label") { const label = this.shadowRoot?.querySelector("label"); if (label) label.textContent = value ?? ""; }
      else if (name === "disabled" || name === "read-only") this.syncDisabled();
      else if (name === "required") { const input = this.shadowRoot?.querySelector<HTMLInputElement>(".control input"); if (input) { input.required = this.hasAttribute("required"); if (input.required) input.setAttribute("aria-required", "true"); else input.removeAttribute("aria-required"); } }
      else if (name === "placeholder") this.syncPlaceholder();
      else if (name === "aria-label" || name === "aria-labelledby" || name === "aria-description" || name === "aria-describedby" || name === "aria-invalid") this.syncInputAttributes();
      else if (name === "calendar-label") this.shadowRoot?.querySelector(".calendar-button")?.setAttribute("aria-label", this.labelText("calendar"));
      else this.renderCalendar();
      this.syncFormState();
    }

    get value(): string { return this.currentValue ?? this.getAttribute("value") ?? ""; }
    set value(value: string) { this.currentValue = value ?? ""; this.textInvalid = false; this.syncInput(); this.syncFormState(); }
    get defaultValue(): string { return this.getAttribute("value") ?? ""; }
    set defaultValue(value: string) { this.setAttribute("value", value); }
    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
    get validity(): ValidityState { return this.internals?.validity ?? this.shadowRoot?.querySelector<HTMLInputElement>("input")?.validity as ValidityState; }
    get validationMessage(): string { return this.internals?.validationMessage ?? this.shadowRoot?.querySelector<HTMLInputElement>("input")?.validationMessage ?? ""; }
    get willValidate(): boolean { return this.internals?.willValidate ?? !this.hasAttribute("disabled"); }
    checkValidity(): boolean { return this.internals?.checkValidity() ?? this.validity?.valid ?? true; }
    reportValidity(): boolean { return this.internals?.reportValidity() ?? this.checkValidity(); }
    setCustomValidity(message: string): void { this.customError = message; this.syncFormState(); }
    focus(options?: FocusOptions): void { this.shadowRoot?.querySelector<HTMLInputElement>("input")?.focus(options); }
    blur(): void { this.shadowRoot?.querySelector<HTMLInputElement>("input")?.blur(); }

    formDisabledCallback(disabled: boolean): void { this.formDisabled = disabled; this.syncDisabled(); }
    formResetCallback(): void { this.value = this.defaultValue; this.closeCalendar(false); }
    formStateRestoreCallback(state: string | File | FormData | null): void { if (typeof state === "string") this.value = state; }

    private locale(): string { return this.closest("[lang]")?.getAttribute("lang") || document.documentElement.lang || navigator.language || "en-US"; }
    private direction(): "ltr" | "rtl" { return getComputedStyle(this).direction === "rtl" ? "rtl" : "ltr"; }
    private labelText(key: "previous" | "next" | "calendar" | "invalid" | "required"): string {
      const attribute = { previous: "previous-month-label", next: "next-month-label", calendar: "calendar-label", invalid: "invalid-date-message", required: "required-message" }[key];
      const override = this.getAttribute(attribute); if (override) return override;
      const locale = this.locale();
      const language = locale.split("-")[0].toLowerCase();
      const values: Record<string, Record<typeof key, string>> = {
        ar: { previous: "الشهر السابق", next: "الشهر التالي", calendar: "التقويم", invalid: "أدخل تاريخًا صالحًا.", required: "اختر تاريخًا." },
        de: { previous: "Vorheriger Monat", next: "Nächster Monat", calendar: "Kalender öffnen", invalid: "Geben Sie ein gültiges Datum ein.", required: "Wählen Sie ein Datum aus." },
        es: { previous: "Mes anterior", next: "Mes siguiente", calendar: "Abrir calendario", invalid: "Introduzca una fecha válida.", required: "Seleccione una fecha." },
        fr: { previous: "Mois précédent", next: "Mois suivant", calendar: "Ouvrir le calendrier", invalid: "Saisissez une date valide.", required: "Choisissez une date." },
        ja: { previous: "前の月", next: "次の月", calendar: "カレンダーを開く", invalid: "有効な日付を入力してください。", required: "日付を選択してください。" },
        pt: { previous: "Mês anterior", next: "Próximo mês", calendar: "Abrir calendário", invalid: "Insira uma data válida.", required: "Escolha uma data." },
      };
      const fallback: Record<typeof key, string> = { previous: "Previous month", next: "Next month", calendar: "Open calendar", invalid: "Enter a valid date.", required: "Choose a date." };
      return values[language]?.[key] ?? fallback[key];
    }

    private formatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat { return new Intl.DateTimeFormat(this.locale(), options); }
    private formatDate(date: Date): string { return this.formatter({ year: "numeric", month: "numeric", day: "numeric" }).format(date); }
    private placeholder(): string {
      const date = new Date(2006, 10, 22);
      return this.formatter({ year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(part => part.type === "year" ? "YYYY" : part.type === "month" ? "MM" : part.type === "day" ? "DD" : part.value).join("");
    }
    private parseText(value: string): Date | undefined {
      const sample = this.formatter({ year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(2006, 10, 22));
      const order = sample.filter(part => ["year", "month", "day"].includes(part.type)).map(part => part.type);
      const digitMap = new Map<string, string>();
      for (let digit = 0; digit <= 9; digit++) digitMap.set(new Intl.NumberFormat(this.locale(), { useGrouping: false }).format(digit), String(digit));
      const normalized = [...value].map(char => digitMap.get(char) ?? char).join("");
      const numbers = normalized.match(/\p{Decimal_Number}+/gu)?.map(Number) ?? [];
      if (numbers.length !== 3) return undefined;
      const parts: Record<string, number> = {};
      order.forEach((part, index) => { parts[part] = numbers[index]; });
      const date = new Date(parts.year, parts.month - 1, parts.day);
      return date.getFullYear() === parts.year && date.getMonth() === parts.month - 1 && date.getDate() === parts.day ? date : undefined;
    }

    private firstDayOfWeek(): number {
      try {
        const locale = new Intl.Locale(this.locale()) as Intl.Locale & { weekInfo?: { firstDay: number }; getWeekInfo?: () => { firstDay: number } };
        const weekInfo = locale.weekInfo ?? locale.getWeekInfo?.();
        if (weekInfo) return weekInfo.firstDay % 7;
      } catch { /* Older browsers use the Sunday-first fallback. */ }
      return 0;
    }
    private clampDate(date: Date): Date {
      const min = fromIso(this.getAttribute("min") ?? ""); const max = fromIso(this.getAttribute("max") ?? "");
      if (min && date < min) return min;
      if (max && date > max) return max;
      return date;
    }
    private isDisabled(date: Date): boolean {
      const value = isoDate(date);
      return this.hasAttribute("disabled") || this.formDisabled || Boolean(this.getAttribute("min") && value < this.getAttribute("min"!)!) || Boolean(this.getAttribute("max") && value > this.getAttribute("max"!)!);
    }
    private isOutOfRange(date: Date): boolean { const value = isoDate(date); return Boolean((this.getAttribute("min") && value < this.getAttribute("min"!)!) || (this.getAttribute("max") && value > this.getAttribute("max"!)!)); }

    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const id = `date-${crypto.randomUUID()}`;
      const label = document.createElement("label"); label.htmlFor = `${id}-input`; label.textContent = this.getAttribute("label") ?? ""; label.part.add("label");
      const control = document.createElement("div"); control.className = "control";
      const input = document.createElement("input"); input.id = `${id}-input`; input.type = "text"; input.autocomplete = "off"; input.setAttribute("role", "combobox"); input.setAttribute("aria-haspopup", "dialog"); input.setAttribute("aria-expanded", "false"); input.setAttribute("aria-controls", `${id}-calendar`); input.part.add("control");
      const calendarButton = document.createElement("button"); calendarButton.type = "button"; calendarButton.className = "calendar-button"; calendarButton.setAttribute("aria-label", this.labelText("calendar")); calendarButton.setAttribute("aria-haspopup", "dialog"); calendarButton.setAttribute("aria-expanded", "false"); calendarButton.setAttribute("aria-controls", `${id}-calendar`); calendarButton.part.add("calendar-button");
      calendarButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none"><path d="M6 2.75v2.5m8-2.5v2.5M3.75 7.25h12.5m-11-3h9.5c.83 0 1.5.67 1.5 1.5v10c0 .83-.67 1.5-1.5 1.5h-9.5c-.83 0-1.5-.67-1.5-1.5v-10c0-.83.67-1.5 1.5-1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
      const calendar = document.createElement("div"); calendar.id = `${id}-calendar`; calendar.className = "calendar"; calendar.setAttribute("role", "dialog"); calendar.setAttribute("aria-modal", "false"); calendar.hidden = true; calendar.part.add("calendar");
      control.append(input, calendarButton); shadow.replaceChildren(document.createElement("style"), label, control, calendar);
      const style = shadow.querySelector("style")!;
      style.textContent = `${base}:host{position:relative;display:grid;gap:var(--spui-control-gap,6px);min-width:0;color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font:inherit}.control{display:flex;position:relative;min-width:0}.control input{box-sizing:border-box;width:100%;min-width:0;min-height:var(--spui-control-height,36px);padding-inline:var(--spui-control-padding-inline,12px) 42px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,var(--colorNeutralStroke1,#8a8886))));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,var(--colorNeutralBackground1,#fff))));box-shadow:var(--spui-control-shadow,none);color:inherit;font:inherit}.control input:focus-visible{border-width:2px;border-color:var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline:0;box-shadow:none}.calendar-button:focus-visible,.calendar button:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:1px}.control input[aria-invalid]:not([aria-invalid=false]){border-color:var(--spui-input-invalid-border,var(--spui-ui-danger,var(--spui-semantic-danger,var(--colorPaletteRedBorderActive,#d13438))))}.control input[aria-invalid]:not([aria-invalid=false]):focus-visible{border-color:var(--spui-input-invalid-border,var(--spui-ui-danger,var(--spui-semantic-danger,var(--colorPaletteRedBorderActive,#d13438))))}.calendar-button{position:absolute;inset-block:2px;inset-inline-end:2px;display:grid;place-items:center;width:36px;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:var(--spui-ui-muted,var(--colorNeutralForeground2,#616161));cursor:pointer}.calendar-button:hover{background:var(--spui-ui-surface-hover,var(--colorNeutralBackground1Hover,#f5f5f5));color:var(--spui-ui-text,inherit)}label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}.calendar{position:absolute;inset-block-start:calc(100% + 4px);inset-inline-start:0;z-index:var(--spui-layer-dropdown,20);width:min(320px,calc(100vw - 24px));padding:12px;border:1px solid var(--spui-ui-stroke,var(--colorNeutralStroke1,#d1d1d1));border-radius:var(--spui-card-radius,8px);background:var(--spui-ui-surface,var(--colorNeutralBackground1,#fff));box-shadow:var(--spui-card-shadow,0 4px 16px #0002);color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424));direction:inherit}.calendar[hidden]{display:none}.calendar-header{display:grid;grid-template-columns:36px 1fr 36px;align-items:center;gap:4px;margin-block-end:8px}.month-label{text-align:center;font-weight:600}.calendar button{font:inherit}.month-nav{display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:inherit;cursor:pointer}.month-nav:hover{background:var(--spui-ui-surface-hover,#f5f5f5)}.weekdays{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px}.days{display:grid;gap:2px}.days>[role=row]{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px}.weekday{display:grid;place-items:center;height:32px;color:var(--spui-ui-muted,var(--colorNeutralForeground2,#616161));font-size:12px;font-weight:600}.day{display:grid;place-items:center;min-width:0;aspect-ratio:1;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer}.day:hover:not(:disabled){background:var(--spui-ui-surface-hover,var(--colorNeutralBackground1Hover,#f5f5f5))}.day[aria-selected=true]{background:var(--spui-ui-accent,var(--colorBrandBackground,#0f6cbd));color:var(--spui-ui-accent-text,var(--colorNeutralForegroundOnBrand,#fff))}.day[aria-current=date]{outline:1px solid var(--spui-ui-accent,var(--colorBrandForeground1,#0f6cbd));outline-offset:-2px}.day.outside-month{color:var(--spui-ui-muted,var(--colorNeutralForeground3,#a19f9d))}.day:disabled{opacity:.42;cursor:default}.calendar[dir=rtl]{direction:rtl}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}@media(forced-colors:active){.calendar,.control input{border-color:FieldText}.control input:focus-visible{border-color:Highlight;outline:0}.control input[aria-invalid]:not([aria-invalid=false]):focus-visible{border-color:Highlight}.day[aria-selected=true]{outline:2px solid Highlight}.calendar-button,.month-nav,.day{forced-color-adjust:auto}}`;
      style.textContent += `.control input:disabled,.calendar-button:disabled,.month-nav:disabled{cursor:not-allowed;opacity:.5}.calendar-button:disabled:hover,.month-nav:disabled:hover{background:transparent}.day[aria-disabled=true]{opacity:.42;cursor:default}`;
      this.syncInput(); this.syncInputAttributes(); this.syncDisabled(); this.syncPlaceholder();
      input.required = this.hasAttribute("required"); if (input.required) input.setAttribute("aria-required", "true");
      input.addEventListener("input", () => { this.currentValue = ""; const text = input.value.trim(); const candidate = fromIso(text) ?? this.parseText(text); this.textInvalid = Boolean(text && (!candidate || (candidate && this.isOutOfRange(candidate)))); this.syncFormState(); });
      input.addEventListener("change", () => this.commitText());
      input.addEventListener("blur", () => { if (!calendar.contains(document.activeElement)) this.commitText(); });
      input.addEventListener("click", () => this.openCalendar());
      input.addEventListener("keydown", event => {
        if (event.key === "ArrowDown") { event.preventDefault(); this.openCalendar(); this.focusActiveDate(); }
        else if (event.key === "Enter") { event.preventDefault(); if (!calendar.hidden) this.selectDate(this.activeDate); else this.commitText(); }
      });
      calendarButton.addEventListener("click", () => calendar.hidden ? this.openCalendar() : this.closeCalendar(true));
      calendar.addEventListener("click", event => {
        const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-date],button[data-month]");
        if (!target || target.disabled) return;
        if (target.dataset.month) { this.viewDate = addMonths(this.viewDate, Number(target.dataset.month)); this.activeDate = this.clampDate(new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1)); this.renderCalendar(); this.focusActiveDate(); }
        else { const date = fromIso(target.dataset.date ?? ""); if (date) this.selectDate(date); }
      });
      calendar.addEventListener("keydown", event => this.onCalendarKey(event));
      document.addEventListener("pointerdown", this.onDocumentPointer, true); document.addEventListener("keydown", this.onDocumentKey, true);
      this.syncFormState(); this.renderCalendar();
    }

    private syncInput(): void {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>(".control input");
      if (!input) return;
      const date = fromIso(this.value);
      input.value = date ? this.formatDate(date) : this.value;
      if (date) { this.activeDate = date; this.viewDate = new Date(date.getFullYear(), date.getMonth(), 1); this.renderCalendar(); }
    }
    private syncInputAttributes(): void {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>(".control input");
      if (!input) return;
      syncHostAccessibleName(this, input);
      const invalid = this.getAttribute("aria-invalid");
      if (invalid === null) input.removeAttribute("aria-invalid"); else input.setAttribute("aria-invalid", invalid);
    }
    private syncPlaceholder(): void { const input = this.shadowRoot?.querySelector<HTMLInputElement>(".control input"); if (input) input.placeholder = this.getAttribute("placeholder") ?? this.placeholder(); }
    private syncDisabled(): void {
      const disabled = this.formDisabled || this.hasAttribute("disabled"); const input = this.shadowRoot?.querySelector<HTMLInputElement>(".control input"); const button = this.shadowRoot?.querySelector<HTMLButtonElement>(".calendar-button");
      if (input) input.disabled = disabled;
      if (button) button.disabled = disabled || this.hasAttribute("read-only");
      if (input) input.readOnly = this.hasAttribute("read-only");
      if (disabled || this.hasAttribute("read-only")) this.closeCalendar(false);
    }
    private syncFormState(): void {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>(".control input");
      const parsed = fromIso(this.value); const empty = this.value.trim() === ""; const textDate = parsed ?? this.parseText(input?.value ?? "");
      const validText = empty || Boolean(textDate);
      const required = this.hasAttribute("required"); const underflow = Boolean(parsed && this.getAttribute("min") && this.value < this.getAttribute("min")!); const overflow = Boolean(parsed && this.getAttribute("max") && this.value > this.getAttribute("max")!);
      const invalid = this.getAttribute("aria-invalid") === "true" || !validText || this.textInvalid || (required && empty) || underflow || overflow || Boolean(this.customError);
      if (input) { if (invalid) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid"); }
      this.internals?.setFormValue(parsed && !underflow && !overflow ? this.value : null);
      const validity: ValidityStateFlags = { valueMissing: required && empty, badInput: !validText || this.textInvalid, rangeUnderflow: underflow, rangeOverflow: overflow, customError: Boolean(this.customError) };
      try { this.internals?.setValidity(invalid ? validity : {}, invalid ? this.customError || (required && empty ? this.labelText("required") : this.labelText("invalid")) : "", input ?? undefined); } catch { /* The control still exposes its inline invalid state without ElementInternals. */ }
    }
    private commitText(): void {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>(".control input"); if (!input || this.hasAttribute("read-only")) return;
      const text = input.value.trim();
      if (!text) { this.currentValue = ""; this.textInvalid = false; this.syncFormState(); this.dispatchChange(); return; }
      const date = fromIso(text) ?? this.parseText(text);
      if (!date || this.isOutOfRange(date) || this.isDisabled(date)) { this.textInvalid = true; input.setAttribute("aria-invalid", "true"); this.syncFormState(); return; }
      this.textInvalid = false;
      this.selectDate(date, false);
    }
    private dispatchChange(): void { this.dispatchEvent(new CustomEvent("spui-change", { detail: { value: this.value }, bubbles: true, composed: true })); }
    private selectDate(date: Date, close = true): void {
      if (this.isDisabled(date) || this.hasAttribute("read-only")) return;
      this.currentValue = isoDate(date); this.textInvalid = false; const input = this.shadowRoot?.querySelector<HTMLInputElement>(".control input"); if (input) input.value = this.formatDate(date);
      this.syncFormState(); this.dispatchChange(); if (close) this.closeCalendar(true);
    }
    private openCalendar(): void {
      if (this.hasAttribute("disabled") || this.hasAttribute("read-only") || this.formDisabled) return;
      const calendar = this.shadowRoot?.querySelector<HTMLElement>(".calendar"); const input = this.shadowRoot?.querySelector<HTMLInputElement>(".control input"); if (!calendar) return;
      const current = fromIso(this.value) ?? this.parseText(input?.value ?? "") ?? this.clampDate(new Date());
      this.activeDate = current; this.viewDate = new Date(current.getFullYear(), current.getMonth(), 1); calendar.hidden = false;
      input?.setAttribute("aria-expanded", "true"); this.shadowRoot?.querySelector(".calendar-button")?.setAttribute("aria-expanded", "true"); this.renderCalendar();
    }
    private closeCalendar(restoreFocus: boolean): void {
      const calendar = this.shadowRoot?.querySelector<HTMLElement>(".calendar"); if (!calendar || calendar.hidden) return;
      calendar.hidden = true; this.shadowRoot?.querySelector(".control input")?.setAttribute("aria-expanded", "false"); this.shadowRoot?.querySelector(".calendar-button")?.setAttribute("aria-expanded", "false");
      if (restoreFocus) this.shadowRoot?.querySelector<HTMLElement>(".control input")?.focus();
    }
    private focusActiveDate(): void { this.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-date="${isoDate(this.activeDate)}"]`)?.focus(); }
    private onCalendarKey(event: KeyboardEvent): void {
      const current = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-date]"); if (!current) return;
      let next: Date | undefined;
      const horizontal = this.direction() === "rtl" ? -1 : 1;
      if (event.key === "ArrowRight") next = addDays(this.activeDate, horizontal);
      else if (event.key === "ArrowLeft") next = addDays(this.activeDate, -horizontal);
      else if (event.key === "ArrowDown") next = addDays(this.activeDate, 7);
      else if (event.key === "ArrowUp") next = addDays(this.activeDate, -7);
      else if (event.key === "Home" || event.key === "End") { const offset = (this.activeDate.getDay() - this.firstDayOfWeek() + 7) % 7; next = addDays(this.activeDate, event.key === "Home" ? -offset : 6 - offset); }
      else if (event.key === "PageUp") next = addMonths(this.activeDate, event.shiftKey ? -12 : -1);
      else if (event.key === "PageDown") next = addMonths(this.activeDate, event.shiftKey ? 12 : 1);
      else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.selectDate(this.activeDate); return; }
      else return;
      event.preventDefault(); this.activeDate = next; this.viewDate = new Date(this.activeDate.getFullYear(), this.activeDate.getMonth(), 1); this.renderCalendar(); this.focusActiveDate();
    }
    private renderCalendar(): void {
      const calendar = this.shadowRoot?.querySelector<HTMLElement>(".calendar"); if (!calendar) return;
      calendar.setAttribute("aria-label", this.formatter({ month: "long", year: "numeric" }).format(this.viewDate));
      calendar.dir = this.direction();
      const header = document.createElement("div"); header.className = "calendar-header";
      const monthKey = `${this.viewDate.getFullYear().toString().padStart(4, "0")}-${(this.viewDate.getMonth() + 1).toString().padStart(2, "0")}`;
      const previous = document.createElement("button"); previous.type = "button"; previous.className = "month-nav"; previous.dataset.month = "-1"; previous.setAttribute("aria-label", this.labelText("previous")); previous.innerHTML = this.direction() === "rtl" ? "&#8250;" : "&#8249;"; previous.disabled = Boolean(this.getAttribute("min") && monthKey <= this.getAttribute("min")!.slice(0, 7));
      const title = document.createElement("div"); title.className = "month-label"; title.textContent = this.formatter({ month: "long", year: "numeric" }).format(this.viewDate); title.setAttribute("aria-live", "polite");
      const next = document.createElement("button"); next.type = "button"; next.className = "month-nav"; next.dataset.month = "1"; next.setAttribute("aria-label", this.labelText("next")); next.innerHTML = this.direction() === "rtl" ? "&#8249;" : "&#8250;"; next.disabled = Boolean(this.getAttribute("max") && monthKey >= this.getAttribute("max")!.slice(0, 7));
      header.append(previous, title, next);
      const weekdays = document.createElement("div"); weekdays.className = "weekdays"; weekdays.setAttribute("role", "row");
      const weekStart = this.firstDayOfWeek(); const weekBase = new Date(2024, 0, 7 + weekStart);
      for (let index = 0; index < 7; index++) { const day = addDays(weekBase, index); const cell = document.createElement("span"); cell.className = "weekday"; cell.setAttribute("role", "columnheader"); cell.setAttribute("aria-label", this.formatter({ weekday: "long" }).format(day)); cell.textContent = this.formatter({ weekday: "short" }).format(day); weekdays.append(cell); }
      const grid = document.createElement("div"); grid.className = "days"; grid.setAttribute("role", "grid"); grid.setAttribute("aria-label", title.textContent);
      grid.append(weekdays);
      const monthStart = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1); const offset = (monthStart.getDay() - weekStart + 7) % 7; const count = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 0).getDate(); const rows = Math.ceil((offset + count) / 7);
      const selected = this.value;
      for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
        const row = document.createElement("div"); row.setAttribute("role", "row");
        for (let columnIndex = 0; columnIndex < 7; columnIndex++) {
          const date = addDays(monthStart, rowIndex * 7 + columnIndex - offset); const value = isoDate(date); const button = document.createElement("button"); button.type = "button"; button.className = "day"; button.dataset.date = value; button.textContent = this.formatter({ day: "numeric" }).format(date); button.setAttribute("role", "gridcell"); button.setAttribute("aria-label", this.formatter({ dateStyle: "full" }).format(date));
          if (value === selected) button.setAttribute("aria-selected", "true"); if (value === isoDate(new Date())) button.setAttribute("aria-current", "date"); if (date.getMonth() !== this.viewDate.getMonth()) button.classList.add("outside-month"); if (this.isOutOfRange(date)) button.setAttribute("aria-disabled", "true"); button.disabled = this.hasAttribute("disabled") || this.formDisabled; button.tabIndex = value === isoDate(this.activeDate) && !button.disabled ? 0 : -1; row.append(button);
        }
        grid.append(row);
      }
      calendar.replaceChildren(header, grid);
    }
  }
  customElements.define("spui-date-picker", SpuiDatePicker);
}
