import { base } from "./shared.js";

export type TableColumnId = string | number;
export interface TableColumnDefinition<TItem> {
  columnId: TableColumnId;
  compare: (a: TItem, b: TItem) => number;
  renderHeaderCell: (data?: unknown) => unknown;
  renderCell: (item: TItem) => unknown;
}
export type CreateTableColumnOptions<TItem> = Partial<Omit<TableColumnDefinition<TItem>, "columnId">> & { columnId: TableColumnId };

export function createTableColumn<TItem>(options: CreateTableColumnOptions<TItem>): TableColumnDefinition<TItem> {
  return { columnId: options.columnId, compare: options.compare ?? (() => 0), renderHeaderCell: options.renderHeaderCell ?? (() => null), renderCell: options.renderCell ?? (() => null) };
}

type ElementDefinition = { tag: string; role: string; display: string; css: string; attributes?: string[]; namedSlots?: string[]; sync?: (host: HTMLElement, root: ShadowRoot) => void };

function defineSlotted({ tag, role, display, css, attributes = [], namedSlots = [], sync }: ElementDefinition): void {
  if (customElements.get(tag)) return;
  class SpuiTablePart extends HTMLElement {
    static observedAttributes = attributes;
    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        const closesHostRule = css.includes("}");
        style.textContent = `${base}:host{box-sizing:border-box;display:${display};min-width:0;color:inherit;font:inherit;${css}${closesHostRule ? "" : "}"}`;
        const slot = document.createElement("slot");
        shadow.append(style, slot, ...namedSlots.map(name => { const named = document.createElement("slot"); named.name = name; return named; }));
        if (!this.hasAttribute("role")) this.setAttribute("role", role);
      }
      sync?.(this, this.shadowRoot!);
    }
    attributeChangedCallback(): void { if (this.isConnected) sync?.(this, this.shadowRoot!); }
  }
  customElements.define(tag, SpuiTablePart);
}

export function defineTableCellActions(): void {
  defineSlotted({ tag: "spui-table-cell-actions", role: "presentation", display: "inline-flex", attributes: ["visible"], css: `gap:var(--spui-table-action-gap,4px);align-items:center;margin-inline-start:auto;opacity:0;transition:opacity var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}:host([visible]),:host(:focus-within),:host(:hover){opacity:1}:host([hidden]){display:none}@media(prefers-reduced-motion:reduce){:host{transition:none}}@media(forced-colors:active){:host{opacity:1}}` });
}

export function defineTableCellLayout(): void {
  defineSlotted({ tag: "spui-table-cell-layout", role: "presentation", display: "flex", attributes: ["appearance", "truncate"], namedSlots: ["media", "main", "description"], css: `align-items:center;gap:var(--spui-table-cell-gap,8px);min-width:0;min-height:inherit}:host([appearance=primary]){font-weight:600}:host([truncate]){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}::slotted([slot=media]){display:inline-flex;flex:none;align-items:center}::slotted([slot=main]){flex:1;min-width:0}::slotted([slot=description]){color:var(--spui-ui-muted,var(--colorNeutralForeground2,#616161));font-size:.9em}` });
}

export function defineTableCell(): void {
  defineSlotted({ tag: "spui-table-cell", role: "cell", display: "table-cell", css: `padding:var(--spui-table-cell-padding,10px 12px);border-block-end:1px solid var(--spui-ui-stroke,var(--colorNeutralStroke2,#e1dfdd));vertical-align:middle;overflow-wrap:anywhere}:host-context(spui-table[no-native-elements]){display:flex;flex:1 1 0;min-width:0;align-items:center}` });
}

export function defineTableHeaderCell(): void {
  defineSlotted({
    tag: "spui-table-header-cell", role: "columnheader", display: "table-cell", attributes: ["sortable", "sort-direction"], namedSlots: ["button", "aside"],
    css: `position:relative;padding:var(--spui-table-header-padding,10px 12px);border-block-end:1px solid var(--spui-ui-stroke,var(--colorNeutralStroke1,#d1d1d1));color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424));font-weight:600;text-align:start;vertical-align:middle}:host([sortable]){padding:0}:host([aria-sort=ascending]),:host([aria-sort=descending]){color:var(--spui-ui-accent,var(--colorBrandForeground1,#0f6cbd))}.sort-button,::slotted([slot=button]){box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:40px;padding:10px 12px;border:0;background:transparent;color:inherit;font:inherit;text-align:inherit}.sort-button[role=button],::slotted([slot=button][role=button]){cursor:pointer}.sort-button[role=button]:hover,::slotted([slot=button][role=button]:hover){background:var(--spui-ui-surface-hover,var(--colorNeutralBackground1Hover,#f5f5f5))}.sort-button[role=button]:focus-visible,::slotted([slot=button][role=button]:focus-visible){outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}.sort-icon{display:inline-flex;align-items:center;justify-content:center;width:8px;height:8px;flex:none;opacity:.55}.sort-icon::before{content:"";display:block;width:6px;height:6px;border:solid currentColor;border-width:0 1.5px 1.5px 0;transform:rotate(45deg) translate(-1px,-1px)}.sort-icon.custom::before{display:none}.sort-icon slot::slotted(*){display:inline-flex;align-items:center;justify-content:center}:host([sort-direction=ascending]) .sort-icon::before{transform:rotate(225deg) translate(-1px,-1px)}:host(:not([sortable])) .sort-icon{display:none}@media(forced-colors:active){.sort-button:focus-visible,::slotted([slot=button][role=button]:focus-visible){outline-color:Highlight}}:host-context(spui-table[no-native-elements]){display:flex;flex:1 1 0;min-width:0;align-items:center}`,
    sync: (host, root) => {
      const sortable = host.hasAttribute("sortable");
      host.toggleAttribute("data-sortable", sortable);
      const direction = host.getAttribute("sort-direction");
      if (direction === "ascending" || direction === "descending") host.setAttribute("aria-sort", direction);
      else host.removeAttribute("aria-sort");
      const buttonSlot = root.querySelector<HTMLSlotElement>('slot[name="button"]')!;
      let button = buttonSlot.querySelector<HTMLElement>(".sort-button");
      if (!button) {
        button = document.createElement("div"); button.className = "sort-button"; button.part.add("sort-button");
        const content = document.createElement("span"); content.part.add("content");
        const contentSlot = root.querySelector<HTMLSlotElement>("slot:not([name])")!;
        content.append(contentSlot);
        const icon = document.createElement("span"); icon.className = "sort-icon"; icon.setAttribute("aria-hidden", "true"); icon.part.add("sort-icon");
        const iconSlot = document.createElement("slot"); iconSlot.name = "sort-icon";
        iconSlot.addEventListener("slotchange", () => icon.classList.toggle("custom", iconSlot.assignedNodes({ flatten: true }).length > 0));
        icon.append(iconSlot);
        button.append(content, icon); buttonSlot.append(button);
      }
      if (sortable) button.setAttribute("role", "button"); else button.removeAttribute("role");
      button.tabIndex = sortable ? 0 : -1;
      const assignedButton = buttonSlot.assignedElements({ flatten: true }).find(element => element instanceof HTMLElement) as HTMLElement | undefined;
      if (assignedButton) {
        if (sortable) { if (!assignedButton.hasAttribute("role")) assignedButton.setAttribute("role", "button"); if (!assignedButton.hasAttribute("tabindex")) assignedButton.tabIndex = 0; }
      }
      if (!(host as HTMLElement & { __spuiHeaderSortListener?: boolean }).__spuiHeaderSortListener) {
        (host as HTMLElement & { __spuiHeaderSortListener?: boolean }).__spuiHeaderSortListener = true;
        const sort = (): void => {
          if (!host.hasAttribute("sortable")) return;
          const next = host.getAttribute("sort-direction") === "ascending" ? "descending" : "ascending";
          host.dispatchEvent(new CustomEvent("spui-table-sort", { bubbles: true, composed: true, detail: { direction: next, columnId: host.getAttribute("column-id") } }));
        };
        const isTrigger = (event: Event): boolean => event.composedPath().some(node => node === button || buttonSlot.assignedElements({ flatten: true }).includes(node as Element));
        host.addEventListener("click", event => { if (isTrigger(event)) sort(); });
        host.addEventListener("keydown", event => {
          if ((event.key === "Enter" || event.key === " ") && isTrigger(event)) {
            const path = event.composedPath();
            const target = buttonSlot.assignedElements({ flatten: true }).find(element => path.includes(element)) as HTMLElement | undefined ?? button;
            if (target.tagName === "BUTTON" || (event.key === "Enter" && target.tagName === "A")) return;
            event.preventDefault(); sort();
          }
        });
      }
    },
  });
}

export function defineTableRow(): void {
  defineSlotted({ tag: "spui-table-row", role: "row", display: "table-row", attributes: ["appearance", "selected"], css: `color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424))}:host(:hover){background:var(--spui-table-row-hover,var(--spui-ui-surface-hover,#f5f5f5))}:host([selected]){background:color-mix(in srgb,var(--spui-ui-accent,#0f6cbd) 10%,var(--spui-ui-surface,#fff))}:host([appearance=brand]){background:color-mix(in srgb,var(--spui-ui-accent,#0f6cbd) 10%,var(--spui-ui-surface,#fff))}:host([appearance=neutral]){background:var(--spui-ui-surface-hover,#f5f5f5)}:host([appearance=none]){background:transparent}:host([selected]) spui-table-cell,:host([selected]) spui-table-header-cell{font-weight:600}@media(forced-colors:active){:host([selected]){outline:1px solid Highlight}}:host-context(spui-table[no-native-elements]){display:flex;align-items:stretch;width:100%;min-width:100%}`, sync: host => { if (host.hasAttribute("selected")) host.setAttribute("aria-selected", "true"); else host.removeAttribute("aria-selected"); } });
}

export function defineTableHeader(): void {
  defineSlotted({ tag: "spui-table-header", role: "rowgroup", display: "table-header-group", css: `background:var(--spui-table-header-background,var(--spui-ui-surface-subtle,var(--colorNeutralBackground2,#faf9f8)))}:host-context(spui-table[no-native-elements]){display:flex;flex-direction:column}` });
}

export function defineTableBody(): void {
  defineSlotted({ tag: "spui-table-body", role: "rowgroup", display: "table-row-group", css: `:host-context(spui-table[no-native-elements]){display:flex;flex-direction:column}` });
}

export function defineTableSelectionCell(): void {
  defineSlotted({
    tag: "spui-table-selection-cell", role: "cell", display: "table-cell", attributes: ["type", "checked", "subtle", "invisible", "hidden"], namedSlots: ["checkbox-indicator", "radio-indicator"],
    css: `position:relative;width:44px;min-width:44px;padding:4px 8px;text-align:center;vertical-align:middle}:host([hidden]){display:none}:host([invisible]){visibility:hidden}.select{box-sizing:border-box;display:inline-grid;place-items:center;width:20px;height:20px;margin:0;accent-color:var(--spui-ui-accent,#0f6cbd);cursor:pointer;transition:opacity var(--spui-motion-duration-fast,100ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}:host([data-custom-indicator]) .select{position:absolute;inset:0;margin:auto;opacity:0}:host([subtle]) .select{opacity:0}:host([subtle][checked]) .select,:host([subtle]:focus-within) .select,:host-context(spui-table-row:hover) .select{opacity:1}:host([data-custom-indicator]) .select{opacity:0}::slotted([slot=checkbox-indicator]),::slotted([slot=radio-indicator]){display:inline-flex;align-items:center;justify-content:center;pointer-events:none}::slotted([data-indeterminate=true]){forced-color-adjust:auto}.select:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}:host([data-custom-indicator]:focus-within) ::slotted([data-checked]),:host([data-custom-indicator]:focus-within) ::slotted([slot=checkbox-indicator]),:host([data-custom-indicator]:focus-within) ::slotted([slot=radio-indicator]){outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px;border-radius:var(--spui-control-radius,4px)}@media(prefers-reduced-motion:reduce){.select{transition:none}}@media(forced-colors:active){.select{accent-color:Highlight}:host([subtle]) .select{opacity:1}}:host-context(spui-table[no-native-elements]){display:flex;flex:0 0 44px;align-items:center;justify-content:center}`,
    sync: (host, root) => {
      let input = root.querySelector<HTMLInputElement>("input");
      if (!input) {
        input = document.createElement("input"); input.className = "select"; input.part.add("input"); root.append(input);
        input.addEventListener("change", () => {
          host.toggleAttribute("checked", input!.checked);
          host.dispatchEvent(new CustomEvent("spui-table-selection-change", { bubbles: true, composed: true, detail: { checked: input!.checked, type: input!.type } }));
        });
      }
      input.type = host.getAttribute("type") === "radio" ? "radio" : "checkbox";
      input.checked = host.hasAttribute("checked");
      input.indeterminate = host.getAttribute("checked") === "mixed";
      const slotName = input.type === "radio" ? "radio-indicator" : "checkbox-indicator";
      const indicatorSlot = root.querySelector<HTMLSlotElement>(`slot[name="${slotName}"]`)!;
      const indicators = indicatorSlot.assignedElements({ flatten: true });
      host.toggleAttribute("data-custom-indicator", indicators.length > 0);
      for (const indicator of indicators) {
        indicator.setAttribute("data-checked", String(input.checked));
        indicator.toggleAttribute("data-indeterminate", input.indeterminate);
      }
      input.setAttribute("aria-label", host.getAttribute("aria-label") || (input.type === "radio" ? "Select row" : "Select row"));
      input.disabled = host.hasAttribute("disabled");
    },
  });
}

export function defineTableResizeHandle(): void {
  defineSlotted({
    tag: "spui-table-resize-handle", role: "presentation", display: "inline-flex", attributes: ["value", "min", "max", "step", "label"],
    css: `position:absolute;inset-block:0;inset-inline-end:-4px;z-index:1;display:flex;align-items:center;justify-content:center;width:12px;min-height:40px;touch-action:none;cursor:col-resize}.handle{width:2px;height:60%;min-height:20px;border-radius:2px;background:var(--spui-ui-stroke,var(--colorNeutralStroke1,#d1d1d1));opacity:.55}.handle:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}:host(:hover) .handle,:host(:focus-visible) .handle{background:var(--spui-ui-accent,#0f6cbd);opacity:1}`,
    sync: (host, root) => {
      let handle = root.querySelector<HTMLDivElement>(".handle");
      if (!handle) { handle = document.createElement("div"); handle.className = "handle"; handle.tabIndex = 0; handle.setAttribute("role", "separator"); handle.setAttribute("aria-orientation", "vertical"); handle.part.add("handle"); root.append(handle); }
      const value = Number(host.getAttribute("value"));
      if (Number.isFinite(value)) handle.setAttribute("aria-valuenow", String(value)); else handle.removeAttribute("aria-valuenow");
      for (const name of ["min", "max"]) { const item = host.getAttribute(name); if (item) handle.setAttribute(`aria-value${name}`, item); else handle.removeAttribute(`aria-value${name}`); }
      handle.setAttribute("aria-label", host.getAttribute("label") || "Resize column");
      const resizeTo = (requested: number, sourceEvent?: Event): void => {
        const current = Number(host.getAttribute("value")) || 0;
        const minAttribute = host.getAttribute("min"); const maxAttribute = host.getAttribute("max");
        const minimum = minAttribute === null ? -Infinity : Number(minAttribute); const maximum = maxAttribute === null ? Infinity : Number(maxAttribute);
        const next = Math.max(Number.isFinite(minimum) ? minimum : -Infinity, Math.min(Number.isFinite(maximum) ? maximum : Infinity, requested));
        if (next === current) return;
        host.setAttribute("value", String(next));
        host.dispatchEvent(new CustomEvent("spui-table-resize", { bubbles: true, composed: true, detail: { delta: next - current, value: next, sourceEvent } }));
      };
      handle.onkeydown = event => {
        if (!(event instanceof KeyboardEvent) || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const step = Math.max(1, Number(host.getAttribute("step")) || 8);
        const rtl = getComputedStyle(host).direction === "rtl";
        const delta = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1) * step;
        const current = Number(host.getAttribute("value")) || 0;
        resizeTo(current + delta, event);
      };
      handle.onpointerdown = event => {
        if (!(event instanceof PointerEvent) || event.button !== 0) return;
        event.preventDefault();
        const startX = event.clientX; const startWidth = Number(host.getAttribute("value")) || 0; const rtl = getComputedStyle(host).direction === "rtl";
        const move = (moveEvent: PointerEvent): void => { if (moveEvent.pointerId === event.pointerId) resizeTo(startWidth + (moveEvent.clientX - startX) * (rtl ? -1 : 1), moveEvent); };
        const finish = (finishEvent: PointerEvent): void => {
          if (finishEvent.pointerId !== event.pointerId) return;
          document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", finish); document.removeEventListener("pointercancel", finish);
        };
        document.addEventListener("pointermove", move); document.addEventListener("pointerup", finish); document.addEventListener("pointercancel", finish);
      };
    },
  });
}

export function defineTable(): void {
  defineTableHeader(); defineTableBody(); defineTableRow(); defineTableHeaderCell(); defineTableCell(); defineTableCellLayout(); defineTableCellActions(); defineTableResizeHandle(); defineTableSelectionCell();
  if (customElements.get("spui-table")) return;
  class SpuiTable extends HTMLElement {
    static observedAttributes = ["size", "appearance", "no-native-elements"];
    connectedCallback(): void {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
      style.textContent = `${base}:host{box-sizing:border-box;display:block;width:var(--spui-table-width,100%);max-width:100%;min-width:0;background:var(--spui-table-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424));font-family:var(--spui-font-family,inherit);font-size:var(--spui-table-font-size,14px);line-height:1.4}.viewport{max-width:100%;overflow-x:auto}.table{display:table;width:100%;min-width:100%;border-collapse:collapse;border-spacing:0}:host([no-native-elements]) .table{display:flex;flex-direction:column}slot{display:contents}:host([size=small]){--spui-table-font-size:12px;--spui-table-cell-padding:6px 8px;--spui-table-header-padding:6px 8px}:host([size=large]){--spui-table-font-size:16px;--spui-table-cell-padding:14px 16px;--spui-table-header-padding:14px 16px}:host([appearance=dividers]){--spui-table-row-hover:transparent}:host([appearance=subtle]){--spui-table-header-background:transparent}@media(forced-colors:active){.table{border-color:CanvasText;color:CanvasText}}`;
      const viewport = document.createElement("div"); viewport.className = "viewport"; viewport.part.add("viewport");
      const table = document.createElement("div"); table.className = "table"; table.part.add("table"); table.setAttribute("role", "presentation"); table.append(document.createElement("slot")); viewport.append(table); shadow.append(style, viewport);
      if (!this.hasAttribute("role")) this.setAttribute("role", "table");
    }
  }
  customElements.define("spui-table", SpuiTable);
}
