import { base } from "./shared.js";
import { flattenAllTree, flattenTree, type TreeNode, type VisibleTreeNode } from "./tree-model.js";

export type TreeItemRenderer<T = unknown> = (node: TreeNode<T>, level: number) => Node | string | number | null;
export type TreeCheckedItem = string | number | readonly [string | number, boolean | "mixed"];

/** Accessible framework-neutral tree with nested data and roving focus. */
export function defineTree(): void {
  if (customElements.get("spui-tree")) return;
  class SpuiTree extends HTMLElement {
    static observedAttributes = ["aria-label", "label", "selection-mode", "toggle-label", "empty-label", "appearance", "size", "navigation-mode"];
    private data: TreeNode[] = [];
    private renderer?: TreeItemRenderer;
    private selected = new Set<string>();
    private checked = new Map<string, boolean | "mixed">();
    private expanded = new Set<string>();
    private activeKey = "";
    private root?: HTMLDivElement;
    private typeAhead = { text: "", time: 0 };

    get items(): TreeNode[] { return this.data; }
    set items(value: TreeNode[]) { this.data = Array.isArray(value) ? value : []; this.paint(); }
    get renderItem(): TreeItemRenderer | undefined { return this.renderer; }
    set renderItem(value: TreeItemRenderer | undefined) { this.renderer = value; this.paint(); }
    get selectedKeys(): string[] { return [...this.selected]; }
    set selectedKeys(value: readonly (string | number)[]) { this.selected = new Set((value ?? []).map(String)); this.checked = new Map([...this.selected].map(key => [key, true])); this.paint(); }
    get checkedItems(): string[] { return this.selectedKeys; }
    set checkedItems(value: Iterable<TreeCheckedItem>) {
      this.checked = new Map(Array.from(value ?? [], item => Array.isArray(item) ? [String(item[0]), item[1] as boolean | "mixed"] : [String(item), true]));
      this.selected = new Set([...this.checked].filter(([, checked]) => checked === true || checked === "mixed").map(([key]) => key));
      this.paint();
    }
    get expandedKeys(): string[] { return [...this.expanded]; }
    set expandedKeys(value: readonly (string | number)[]) { this.expanded = new Set((value ?? []).map(String)); this.paint(); }
    get openItems(): string[] { return this.expandedKeys; }
    set openItems(value: readonly (string | number)[]) { this.expandedKeys = value; }
    get defaultOpenItems(): string[] { return this.expandedKeys; }
    set defaultOpenItems(value: readonly (string | number)[]) { if (!this.isConnected) this.expandedKeys = value; }

    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.paint(); }
    attributeChangedCallback(): void { this.paint(); }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0}.tree{box-sizing:border-box;min-width:0;outline:none;color:var(--spui-ui-text,var(--spui-semantic-body-text,#323130));font-family:var(--spui-font-family,inherit)}.tree:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px;border-radius:var(--spui-control-radius,4px)}.item{box-sizing:border-box;position:relative;display:flex;align-items:center;gap:8px;min-height:36px;padding-block:4px;padding-inline-end:8px;padding-inline-start:calc(8px + var(--spui-tree-level,0) * 20px);border-radius:var(--spui-control-radius,4px);cursor:default;user-select:none}.item:hover{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.item[aria-selected=true],.item[aria-checked=true]{background:color-mix(in srgb,var(--spui-ui-accent,#0078d4) 12%,var(--spui-base-surface,var(--spui-ui-surface,#fff)));color:var(--spui-ui-text,var(--spui-semantic-body-text,#323130))}.item:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:-2px}.item[aria-disabled=true]{opacity:.55;cursor:not-allowed}.disclosure{flex:none;display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:inherit;cursor:pointer}.disclosure:hover{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.disclosure:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4))}.chevron{width:0;height:0;border-block:4px solid transparent;border-inline-start:5px solid currentColor;transition:transform var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}.disclosure[aria-expanded=true] .chevron{transform:rotate(90deg)}.check{flex:none;width:14px;height:14px;border:1px solid currentColor;border-radius:3px}.item[aria-checked=true] .check{background:var(--spui-ui-accent,#0078d4);box-shadow:inset 0 0 0 3px var(--spui-ui-surface,#fff)}.item[aria-checked=mixed] .check{background:linear-gradient(var(--spui-ui-accent,#0078d4),var(--spui-ui-accent,#0078d4)) center/8px 2px no-repeat}.item-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.empty{padding:12px;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161))}@media(prefers-reduced-motion:reduce){.chevron{transition:none}}@media(forced-colors:active){.item[aria-selected=true],.item[aria-checked=true],.item[aria-checked=mixed]{outline:1px solid Highlight}.item:focus-visible,.disclosure:focus-visible{outline-color:Highlight}}`;
      style.textContent += `:host([size=small]) .item{min-height:28px}:host([appearance=transparent]) .item:hover,:host([appearance=transparent]) .item[aria-selected=true],:host([appearance=transparent]) .item[aria-checked=true]{background:transparent}:host([appearance=subtle-alpha]) .item:hover{background:color-mix(in srgb,var(--spui-ui-text,#323130) 5%,transparent)}`;
      this.root = document.createElement("div");
      this.root.className = "tree";
      this.root.setAttribute("role", "tree");
      this.root.addEventListener("click", event => this.onClick(event));
      this.root.addEventListener("keydown", event => this.onKeyDown(event));
      shadow.append(style, this.root);
    }

    private visible(): VisibleTreeNode[] { return flattenTree(this.data, this.expanded); }
    private allNodes(): VisibleTreeNode[] { return flattenAllTree(this.data); }
    private isRtl(): boolean { return getComputedStyle(this).direction === "rtl"; }
    private mode(): "none" | "single" | "multiple" { const mode = this.getAttribute("selection-mode"); return mode === "none" || mode === "single" ? mode : mode === "multiple" || mode === "multiselect" ? "multiple" : "none"; }

    private paint(focusKey?: string): void {
      if (!this.isConnected || !this.root) return;
      const treeRoot = this.root.getRootNode();
      const active = focusKey ?? (treeRoot instanceof ShadowRoot ? treeRoot.activeElement?.closest<HTMLElement>("[data-tree-key]")?.dataset.treeKey : undefined);
      const rows = this.visible();
      if (!rows.some(row => row.key === this.activeKey)) this.activeKey = rows[0]?.key ?? "";
      this.root.replaceChildren();
      this.root.setAttribute("aria-label", this.getAttribute("label") || this.getAttribute("aria-label") || "Tree");
      if (this.mode() === "multiple") this.root.setAttribute("aria-multiselectable", "true"); else this.root.removeAttribute("aria-multiselectable");
      if (!rows.length) {
        const empty = document.createElement("div"); empty.className = "empty"; empty.textContent = this.getAttribute("empty-label") || "No items"; this.root.append(empty); return;
      }
      const fragment = document.createDocumentFragment();
      rows.forEach(entry => {
        const row = document.createElement("div"); row.className = "item"; row.dataset.treeKey = entry.key; row.style.setProperty("--spui-tree-level", String(entry.level - 1));
        row.setAttribute("role", "treeitem"); row.setAttribute("aria-level", String(entry.level)); row.setAttribute("aria-posinset", String(entry.position)); row.setAttribute("aria-setsize", String(entry.setSize));
        row.tabIndex = entry.key === this.activeKey ? 0 : -1;
        if (entry.node.children?.length) row.setAttribute("aria-expanded", String(this.expanded.has(entry.key)));
        if (this.mode() === "multiple") row.setAttribute("aria-checked", String(this.checked.get(entry.key) ?? this.selected.has(entry.key)));
        else if (this.mode() !== "none") row.setAttribute("aria-selected", String(this.selected.has(entry.key)));
        if (entry.node.disabled) row.setAttribute("aria-disabled", "true");
        if (entry.node.children?.length) {
          const disclosure = document.createElement("button"); disclosure.type = "button"; disclosure.className = "disclosure"; disclosure.dataset.toggleTreeKey = entry.key; disclosure.tabIndex = -1; disclosure.disabled = Boolean(entry.node.disabled);
          disclosure.setAttribute("aria-label", `${this.getAttribute("toggle-label") || "Expand or collapse"} ${entry.node.label}`); disclosure.setAttribute("aria-expanded", String(this.expanded.has(entry.key)));
          const chevron = document.createElement("span"); chevron.className = "chevron"; chevron.setAttribute("aria-hidden", "true"); disclosure.append(chevron); row.append(disclosure);
        } else {
          const spacer = document.createElement("span"); spacer.className = "disclosure"; spacer.setAttribute("aria-hidden", "true"); row.append(spacer);
        }
        if (this.mode() === "multiple") { const check = document.createElement("span"); check.className = "check"; check.setAttribute("aria-hidden", "true"); row.append(check); }
        const content = this.renderer?.(entry.node, entry.level) ?? entry.node.label;
        const label = document.createElement("span"); label.className = "item-label";
        if (content instanceof Node) label.append(content); else label.textContent = String(content);
        row.append(label); fragment.append(row);
      });
      this.root.append(fragment);
      if (active) this.root.querySelector<HTMLElement>(`[data-tree-key="${CSS.escape(active)}"]`)?.focus();
    }

    private onClick(event: Event): void {
      const target = event.target as HTMLElement;
      const toggle = target.closest<HTMLElement>("[data-toggle-tree-key]");
      if (toggle) { this.toggleExpanded(toggle.dataset.toggleTreeKey!); return; }
      const row = target.closest<HTMLElement>("[data-tree-key]");
      if (!row || target.closest("a,button,input,select,textarea")) return;
      const key = row.dataset.treeKey!; this.activeKey = key;
      const node = this.visible().find(entry => entry.key === key)?.node;
      if (node && !node.disabled && this.mode() !== "none") this.toggleSelection(key);
      else this.paint(key);
    }

    private onKeyDown(event: KeyboardEvent): void {
      const row = (event.target as HTMLElement).closest<HTMLElement>("[data-tree-key]");
      if (!row) return;
      const key = row.dataset.treeKey!; const rows = this.visible(); const index = rows.findIndex(entry => entry.key === key); const entry = rows[index];
      if (!entry) return;
      const treegrid = this.getAttribute("navigation-mode") === "treegrid";
      if (treegrid && event.target !== row) {
        if (event.key === (this.isRtl() ? "ArrowRight" : "ArrowLeft")) { event.preventDefault(); row.focus(); }
        return;
      }
      if (treegrid && event.key === (this.isRtl() ? "ArrowLeft" : "ArrowRight")) {
        const action = row.querySelector<HTMLElement>("button:not(.disclosure):not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])");
        if (action) { event.preventDefault(); action.focus(); return; }
      }
      let focusKey: string | undefined;
      if (event.key === "ArrowDown") focusKey = rows[index + 1]?.key;
      else if (event.key === "ArrowUp") focusKey = rows[index - 1]?.key;
      else if (event.key === "Home") focusKey = rows[0]?.key;
      else if (event.key === "End") focusKey = rows.at(-1)?.key;
      else if ((event.key === (this.isRtl() ? "ArrowLeft" : "ArrowRight")) && entry.node.children?.length) {
        event.preventDefault();
        if (!this.expanded.has(key)) this.toggleExpanded(key);
        else if (rows[index + 1]?.parentKey === key) { this.activeKey = rows[index + 1].key; this.paint(this.activeKey); }
        return;
      } else if (event.key === (this.isRtl() ? "ArrowRight" : "ArrowLeft")) {
        event.preventDefault();
        if (this.expanded.has(key)) this.toggleExpanded(key);
        else if (entry.parentKey) { this.activeKey = entry.parentKey; this.paint(this.activeKey); }
        return;
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (entry.node.children?.length) this.toggleExpanded(key);
        else if (!entry.node.disabled) this.toggleSelection(key);
        return;
      } else if (event.key === " ") {
        event.preventDefault(); if (!entry.node.disabled) this.toggleSelection(key); return;
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const now = Date.now(), repeated = now - this.typeAhead.time <= 700 && this.typeAhead.text === event.key;
        const text = now - this.typeAhead.time > 700 ? event.key : repeated ? event.key : this.typeAhead.text + event.key;
        this.typeAhead = { text, time: now };
        const prefix = text.toLocaleLowerCase(this.lang || undefined);
        const found = [...rows.slice(index + 1), ...rows.slice(0, index + 1)].find(candidate => candidate.node.label.toLocaleLowerCase(this.lang || undefined).startsWith(prefix));
        if (found) { event.preventDefault(); focusKey = found.key; } else return;
      } else return;
      event.preventDefault();
      if (focusKey) { this.activeKey = focusKey; this.paint(focusKey); }
      else this.paint(key);
    }

    private toggleExpanded(key: string): void {
      if (this.allNodes().find(entry => entry.key === key)?.node.disabled) return;
      if (this.expanded.has(key)) this.expanded.delete(key); else this.expanded.add(key);
      this.activeKey = key; this.paint(key);
      this.dispatchEvent(new CustomEvent("spui-tree-expanded-change", { detail: { expandedKeys: [...this.expanded] }, bubbles: true, composed: true }));
    }

    private toggleSelection(key: string): void {
      if (this.mode() === "none") return;
      const current = this.checked.get(key) ?? this.selected.has(key);
      const checked = current === "mixed" ? true : !current;
      if (this.mode() === "single") this.checked = new Map();
      this.checked.set(key, checked);
      this.selected = new Set([...this.checked].filter(([, value]) => value === true || value === "mixed").map(([selectedKey]) => selectedKey));
      this.activeKey = key; this.paint(key);
      const selectedItems = this.allNodes().filter(entry => this.selected.has(entry.key)).map(entry => entry.node);
      this.dispatchEvent(new CustomEvent("spui-tree-selection-change", { detail: { selectedKeys: [...this.selected], selectedItems, checkedItems: new Map(this.checked), checked, selectionMode: this.mode() === "multiple" ? "multiselect" : "single" }, bubbles: true, composed: true }));
    }
  }
  customElements.define("spui-tree", SpuiTree);
}
