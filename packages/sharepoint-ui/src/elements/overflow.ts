import { base } from "./shared.js";

export type OverflowState = { hasOverflow: boolean; itemVisibility: Record<string, boolean>; groupVisibility: Record<string, "visible" | "hidden" | "overflow"> };
export type OverflowAxis = "horizontal" | "vertical";
type OverflowEventDetail = OverflowState & { visibleIds: string[]; overflowIds: string[] };

export function defineOverflowItem(): void {
  if (customElements.get("spui-overflow-item")) return;
  class SpuiOverflowItem extends HTMLElement {
    static observedAttributes = ["priority", "pinned", "group-id", "id"];
    connectedCallback(): void { if (!this.shadowRoot) { const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style"); style.textContent = `${base}:host{display:inline-flex;flex:none;min-width:0;max-width:100%}:host([hidden]){display:none!important}slot{display:contents}::slotted(*){flex:none}@media(forced-colors:active){:host{forced-color-adjust:auto}}`; shadow.append(style, document.createElement("slot")); } }
  }
  customElements.define("spui-overflow-item", SpuiOverflowItem);
}

export function defineOverflowDivider(): void {
  if (customElements.get("spui-overflow-divider")) return;
  class SpuiOverflowDivider extends HTMLElement {
    connectedCallback(): void { if (!this.shadowRoot) { const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style"); style.textContent = `${base}:host{display:block;align-self:stretch;flex:none;inline-size:1px;min-block-size:24px;background:var(--spui-ui-stroke,var(--colorNeutralStroke2,#e1dfdd))}:host([has-child]){inline-size:auto;min-block-size:0;background:transparent}:host([hidden]){display:none!important}slot{display:contents}`; const slot = document.createElement("slot"); slot.addEventListener("slotchange", () => this.toggleAttribute("has-child", slot.assignedNodes({ flatten: true }).length > 0)); shadow.append(style, slot); } }
  }
  customElements.define("spui-overflow-divider", SpuiOverflowDivider);
}

export function defineOverflow(): void {
  if (customElements.get("spui-overflow")) return;
  defineOverflowItem(); defineOverflowDivider();
  class SpuiOverflow extends HTMLElement {
    static observedAttributes = ["aria-label", "minimum-visible", "overflow-direction", "overflow-axis", "has-hidden-items", "padding"];
    private itemSlot!: HTMLSlotElement;
    private triggerSlot!: HTMLSlotElement;
    private row!: HTMLDivElement;
    private resizeObserver?: ResizeObserver;
    private mutationObserver?: MutationObserver;
    private events?: AbortController;
    private state?: OverflowState;
    private frame = 0;
    private transaction = false;
    refresh(): void { this.schedule(); }
    forceRefresh(): void { if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; this.recompute(); }

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.events?.abort(); this.events = new AbortController();
      this.itemSlot.addEventListener("slotchange", this.schedule, { signal: this.events.signal });
      this.triggerSlot.addEventListener("slotchange", this.schedule, { signal: this.events.signal });
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(this.schedule);
      this.resizeObserver.observe(this);
      this.mutationObserver?.disconnect();
      this.mutationObserver = new MutationObserver(this.schedule);
      this.mutationObserver.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["id", "priority", "pinned", "group-id", "data-overflow-id", "data-overflow-item", "data-overflow-divider", "style", "class"] });
      window.addEventListener("resize", this.schedule, { signal: this.events.signal, passive: true });
      document.fonts?.addEventListener("loadingdone", this.schedule, { signal: this.events.signal });
      this.syncLabel(); this.schedule();
    }

    disconnectedCallback(): void {
      this.events?.abort(); this.events = undefined;
      this.resizeObserver?.disconnect(); this.resizeObserver = undefined;
      this.mutationObserver?.disconnect(); this.mutationObserver = undefined;
      if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0;
      this.transaction = false;
    }

    attributeChangedCallback(): void { if (this.isConnected) { this.syncLabel(); this.schedule(); } }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0;max-width:100%}.row{display:flex;align-items:center;flex-wrap:nowrap;gap:var(--spui-overflow-gap,var(--spui-toolbar-gap,6px));min-width:0;max-width:100%;overflow:hidden}.row:dir(rtl){direction:rtl}:host([overflow-axis=vertical]) .row{height:100%;flex-direction:column;align-items:stretch}:host([overflow-axis=vertical]) ::slotted([slot=overflow-trigger]){margin-inline-start:0;margin-block-start:auto;align-self:flex-end}::slotted([slot=overflow-trigger]){display:inline-flex;flex:none;margin-inline-start:auto}::slotted([slot=overflow-trigger][hidden]){display:none!important}::slotted(spui-overflow-divider[hidden]){display:none!important}@media(forced-colors:active){.row{forced-color-adjust:auto}}`;
      this.row = document.createElement("div"); this.row.className = "row"; this.row.setAttribute("part", "control");
      this.itemSlot = document.createElement("slot");
      this.triggerSlot = document.createElement("slot"); this.triggerSlot.name = "overflow-trigger";
      this.row.append(this.itemSlot, this.triggerSlot); shadow.append(style, this.row);
      this.syncLabel();
    }

    private syncLabel(): void {
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Overflow actions");
    }

    private schedule = (): void => {
      if (!this.isConnected || this.frame) return;
      this.frame = requestAnimationFrame(() => { this.frame = 0; this.recompute(); });
    };

    private recompute(): void {
      if (this.transaction || !this.row) return;
      const assigned = this.itemSlot.assignedElements({ flatten: true }).filter((item): item is HTMLElement => item instanceof HTMLElement);
      const items = assigned.flatMap(root => [root, ...root.querySelectorAll<HTMLElement>("[data-overflow-item], [data-overflow-divider]")]).filter(item => item.localName === "spui-overflow-item" || item.localName === "spui-overflow-divider" || item.hasAttribute("data-overflow-item") || item.hasAttribute("data-overflow-divider"));
      const overflowItems = items.filter(item => item.localName === "spui-overflow-item" || item.hasAttribute("data-overflow-item"));
      const dividers = items.filter(item => item.localName === "spui-overflow-divider" || item.hasAttribute("data-overflow-divider"));
      const trigger = this.triggerSlot.assignedElements({ flatten: true }).find((item): item is HTMLElement => item instanceof HTMLElement);
      const vertical = this.getAttribute("overflow-axis") === "vertical";
      const available = vertical ? this.row.clientHeight : this.row.clientWidth;
      if (!overflowItems.length || available <= 0) return;

      this.transaction = true;
      try {
        for (const item of [...overflowItems, ...dividers, ...(trigger ? [trigger] : [])]) item.hidden = false;
        const sizes = new Map([...overflowItems, ...dividers].map(item => [item, vertical ? item.getBoundingClientRect().height : item.getBoundingClientRect().width]));
        const triggerSize = trigger ? (vertical ? trigger.getBoundingClientRect().height : trigger.getBoundingClientRect().width) : 0;
        const gap = parseFloat(getComputedStyle(this.row)[vertical ? "rowGap" : "columnGap"]) || 0;
        const minVisible = Math.max(0, Math.min(overflowItems.length, Number(this.getAttribute("minimum-visible")) || 0));
        const direction = this.getAttribute("overflow-direction") === "start" ? "start" : "end";
        const candidates = overflowItems.filter(item => !item.hasAttribute("pinned")).sort((a, b) => {
          const priority = (Number(a.getAttribute("priority")) || 0) - (Number(b.getAttribute("priority")) || 0);
          return priority || (direction === "end" ? overflowItems.indexOf(b) - overflowItems.indexOf(a) : overflowItems.indexOf(a) - overflowItems.indexOf(b));
        });
        const hidden = new Set<HTMLElement>();
        let visible = overflowItems.slice();
        const visibleDividers = (): HTMLElement[] => dividers.filter(divider => visible.some(item => item.getAttribute("group-id") === divider.getAttribute("group-id")));
        const rowWidth = (): number => {
          const shown = items.filter(item => overflowItems.includes(item) ? !hidden.has(item) : visibleDividers().includes(item));
          const parent = shown[0]?.parentElement;
          const itemGap = parent === this ? gap : parent ? (parseFloat(getComputedStyle(parent)[vertical ? "rowGap" : "columnGap"]) || 0) : gap;
          return shown.reduce((sum, item) => sum + (sizes.get(item) ?? 0), 0) + itemGap * Math.max(0, shown.length - 1);
        };
        const reserveMenu = hidden.size > 0 || this.hasAttribute("has-hidden-items");
        const needsSpace = (): boolean => rowWidth() + (reserveMenu ? gap + triggerSize + Math.max(0, Number(this.getAttribute("padding")) || 0) : 0) > available;
        for (const candidate of candidates) {
          if (!needsSpace() || visible.length <= minVisible) break;
          hidden.add(candidate); visible = visible.filter(item => item !== candidate);
        }
        for (const item of overflowItems) { item.hidden = hidden.has(item); if (hidden.has(item)) item.setAttribute("aria-hidden", "true"); else item.removeAttribute("aria-hidden"); item.dataset.overflowed = String(hidden.has(item)); }
        const visibleGroups = new Set(visible.map(item => item.getAttribute("group-id")).filter((id): id is string => Boolean(id)));
        const hiddenGroups = new Set([...hidden].map(item => item.getAttribute("group-id")).filter((id): id is string => Boolean(id)));
        for (const divider of dividers) { const group = divider.getAttribute("group-id"); divider.hidden = !group || !visibleGroups.has(group); }
        if (trigger) trigger.hidden = !reserveMenu;
        const groupVisibility: OverflowState["groupVisibility"] = {};
        for (const group of new Set([...visibleGroups, ...hiddenGroups])) {
          const groupItems = overflowItems.filter(item => item.getAttribute("group-id") === group);
          const visibleCount = groupItems.filter(item => !hidden.has(item)).length;
          groupVisibility[group] = visibleCount === 0 ? "hidden" : visibleCount === groupItems.length ? "visible" : "overflow";
        }
        const itemId = (item: HTMLElement): string => item.getAttribute("data-overflow-id") || item.id || "";
        const itemVisibility = Object.fromEntries(overflowItems.map(item => [itemId(item), !hidden.has(item)]).filter(([id]) => Boolean(id))) as Record<string, boolean>;
        const state: OverflowEventDetail = {
          visibleIds: visible.map(itemId).filter(Boolean),
          overflowIds: [...hidden].map(itemId).filter(Boolean),
          hasOverflow: hidden.size > 0 || this.hasAttribute("has-hidden-items"),
          itemVisibility,
          groupVisibility
        };
        const changed = !this.state || JSON.stringify(this.state) !== JSON.stringify(state);
        this.state = state;
        this.dataset.visibleCount = String(state.visibleIds.length); this.dataset.overflowCount = String(state.overflowIds.length); this.dataset.overflowIds = state.overflowIds.join(",");
        if (changed) {
          let active = this.ownerDocument.activeElement;
          while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
          if (trigger && active instanceof HTMLElement && [...hidden].some(item => item === active || item.contains(active))) this.focusTrigger(trigger);
          this.dispatchEvent(new CustomEvent<OverflowEventDetail>("spui-overflow-change", { bubbles: true, composed: true, detail: state }));
        }
      } finally { this.transaction = false; }
    }

    private focusTrigger(trigger: HTMLElement): void {
      const visit = (node: Node): HTMLElement | undefined => {
        if (node instanceof HTMLSlotElement) return node.assignedNodes({ flatten: true }).map(visit).find(Boolean);
        if (node instanceof HTMLElement) {
          if (node.matches("button:not(:disabled),a[href],[tabindex]:not([tabindex='-1'])")) return node;
          const root = node.shadowRoot;
          const target = root ? [...root.childNodes].map(visit).find(Boolean) : undefined;
          if (target) return target;
        }
        return [...node.childNodes].map(visit).find(Boolean);
      };
      visit(trigger)?.focus();
    }
  }
  customElements.define("spui-overflow", SpuiOverflow);
}
