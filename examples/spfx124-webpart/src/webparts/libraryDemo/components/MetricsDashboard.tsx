import * as React from "react";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Alert, AlphaSlider, Avatar, AvatarGroup, AvatarGroupItem, AvatarGroupPopover, Badge, Breadcrumb, BreadcrumbItem, Button, Card, CardFooter, CardHeader, CardPreview, Carousel, ColorArea, ColorPicker, ColorSlider, ColorSwatch, CompoundButton, Checkbox, ComboBox, ComboOption, DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, DataGridSelectionCell, createTableColumn, DatePicker, Dialog, Divider, Drawer, EmptySwatch, Field, FileUpload, Image, ImageSwatch, InfoButton, InfoLabel, Input, Link, Menu, MenuDivider, MenuGroup, MenuItem, MessageBar, Nav, NavCategory, NavCategoryItem, NavDivider, NavItem, NavSectionHeader, NavSubItem, NavSubItemGroup, Overflow, OverflowDivider, OverflowItem, Persona, Popover, ProgressBar, Radio, RadioGroup, Rating, RichTextEditor, Select, SharePointCard, SharePointUIProvider, Skeleton, Slider, Spinner, SpinButton, SplitButton, SwatchPicker, SwatchPickerRow, Switch, Table, TableBody, TableCell, TableCellActions, TableCellLayout, TableHeader, TableHeaderCell, TableRow, TableSelectionCell, Tab, TabList, TabPanel, Tabs, Tag, TagGroup, TagPicker, TagPickerOption, TeachingPopover, TeachingPopoverBody, TeachingPopoverCarousel, TeachingPopoverCarouselCard, TeachingPopoverCarouselFooter, TeachingPopoverCarouselFooterButton, TeachingPopoverCarouselNav, TeachingPopoverCarouselNavButton, TeachingPopoverCarouselPageCount, TeachingPopoverHeader, TeachingPopoverSurface, TeachingPopoverTitle, TeachingPopoverTrigger, TextArea, ToggleButton, Toolbar, Tooltip, Tree, useTableColumnSizing_unstable, useTableFeatures, useTableSelection, useTableSort, ViewCard, Virtualizer, type ColorPickerHsvColor, type DataGridCompositionSortState, type DataGridFluentCellRenderFunction, type VirtualizerScrollToHandle } from "@spfx-fast/sharepoint-ui/react";
import { SPHttpClient } from "@microsoft/sp-http";
import { defineDataGrid, getSharePointUIStyleTokens, type DataGridColumn, type SharePointTheme, type SharePointUIBaseAppearance, type TreeNode } from "@spfx-fast/sharepoint-ui";
import styles from "./MetricsDashboard.module.scss";

type Props = { startedAt: number; theme?: SharePointTheme; fluentTokens?: Record<string, string | number | undefined>; spHttpClient: SPHttpClient; webUrl: string; locale: string; rtl: boolean };
type Sample = { samples: number[]; longTasks: number; bundleBytes: number | null };
const records = [
  { kind: "document" as const, eyebrow: "DOCUMENT · SHARED DOCUMENTS", title: "Quarterly planning.docx", subtitle: "Modified 28 October · Vilius Petrauskas", description: "Roadmap, milestones, and decisions for the next planning cycle.", status: "Word", detail: "Checked in · 4.2 MB", leading: "DOC", ar: { eyebrow: "مستند · المستندات المشتركة", title: "خطة ربع السنة.docx", subtitle: "تم التحديث في ٢٨ أكتوبر · فيليوس بيتراوسكاس", description: "خارطة الطريق والمراحل والقرارات لدورة التخطيط القادمة.", status: "مستند Word", detail: "تم تسجيل الوصول · ٤٫٢ ميغابايت" } },
  { kind: "person" as const, eyebrow: "PERSON · PRODUCT & ENGINEERING", title: "Amara Okafor", subtitle: "Product owner · London", description: "Owns the SharePoint workspace and quarterly planning process.", status: "Available", detail: "amara.okafor@contoso.com", leading: "AO", ar: { eyebrow: "شخص · المنتج والهندسة", title: "أمارة أوكافور", subtitle: "مالكة المنتج · لندن", description: "تدير مساحة عمل SharePoint وعملية التخطيط ربع السنوية.", status: "متاحة", detail: "amara.okafor@contoso.com" } },
  { kind: "task" as const, eyebrow: "TASK · Q4 WORKSPACE", title: "Approve launch checklist", subtitle: "Assigned to you · Due 4 November", description: "Review accessibility, localization, and release readiness.", status: "Due soon", detail: "Project Atlas · High priority", leading: "✓", ar: { eyebrow: "مهمة · مساحة عمل الربع الرابع", title: "اعتماد قائمة التحقق للإطلاق", subtitle: "مسندة إليك · الموعد ٤ نوفمبر", description: "راجع إمكانية الوصول والتعريب والاستعداد للإصدار.", status: "قريب الاستحقاق", detail: "مشروع أطلس · أولوية عالية" } },
  { kind: "approval" as const, eyebrow: "APPROVAL · PROCUREMENT", title: "Design system renewal", subtitle: "Requested by Design Operations · 30 October", description: "Annual renewal for the shared design tooling subscription.", status: "Needs review", detail: "Cost center 4102 · £2,400 / year", leading: "£", ar: { eyebrow: "موافقة · المشتريات", title: "تجديد نظام التصميم", subtitle: "طلبته عمليات التصميم · ٣٠ أكتوبر", description: "تجديد سنوي لاشتراك أدوات التصميم المشتركة.", status: "تحتاج إلى مراجعة", detail: "مركز التكلفة ٤١٠٢ · ٢٬٤٠٠ جنيه إسترليني سنويًا" } },
];
const documentPreviewSource = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="620" height="350" viewBox="0 0 620 350"><rect width="620" height="350" fill="#eaf2f3"/><rect x="188" y="28" width="244" height="294" rx="12" fill="#fff" stroke="#c9d9da" stroke-width="2"/><rect x="218" y="61" width="70" height="9" rx="4" fill="#007780"/><rect x="218" y="91" width="174" height="15" rx="5" fill="#273b3d"/><rect x="218" y="121" width="184" height="7" rx="3" fill="#c2d0d0"/><rect x="218" y="140" width="184" height="7" rx="3" fill="#c2d0d0"/><rect x="218" y="159" width="153" height="7" rx="3" fill="#c2d0d0"/><rect x="218" y="202" width="184" height="70" rx="7" fill="#f1f5f5"/><path d="M234 250l30-24 24 15 27-25 36 36" fill="none" stroke="#007780" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>')}`;
type TaskRow = { id: string; title: string; owner: string; state: string };
const taskRows: TaskRow[] = Array.from({ length: 5000 }, (_, index) => ({ id: `SP-${index + 1}`, title: ["Review access request", "Update project status", "Approve release notes", "Check document metadata"][index % 4], owner: ["Amara Okafor", "Vilius Petrauskas", "Jordan Lee"][index % 3], state: ["In progress", "Needs review", "Complete"][index % 3] }));
const taskColumns: DataGridColumn<TaskRow>[] = [{ id: "id", label: "Task ID", width: "minmax(120px, .8fr)", minWidth: 120, maxWidth: 300 }, { id: "title", label: "Task", width: "minmax(220px, 2fr)", minWidth: 220, editable: true }, { id: "owner", label: "Owner", width: "minmax(180px, 1.2fr)", minWidth: 180 }, { id: "state", label: "Status", width: "minmax(140px, 1fr)", minWidth: 140, editable: true }];
const documentTree: TreeNode[] = [{ id: "documents", label: "Shared documents", children: [{ id: "atlas", label: "Project Atlas", children: [{ id: "planning", label: "Planning" }, { id: "release", label: "Release notes" }] }, { id: "archive", label: "Archive" }] }, { id: "assets", label: "Site assets", children: [{ id: "brand", label: "Brand resources" }, { id: "templates", label: "Templates" }] }];
const arabicDocumentTree: TreeNode[] = [{ id: "documents", label: "المستندات المشتركة", children: [{ id: "atlas", label: "مشروع أطلس", children: [{ id: "planning", label: "التخطيط" }, { id: "release", label: "ملاحظات الإصدار" }] }, { id: "archive", label: "الأرشيف" }] }, { id: "assets", label: "أصول الموقع", children: [{ id: "brand", label: "موارد العلامة التجارية" }, { id: "templates", label: "القوالب" }] }];

const percentile = (values: number[], p: number): string => values.length ? `${values.slice().sort((a,b) => a-b)[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)].toFixed(1)} ms` : "—";

function VirtualizedTaskList({ arabic }: { arabic: boolean }): React.ReactElement {
  const [range, setRange] = React.useState({ start: 0, end: 12, total: taskRows.length });
  const virtualizer = React.useRef<VirtualizerScrollToHandle | null>(null);
  return <SharePointCard aria-label="Virtualized SharePoint tasks">
    <h2>Large task list</h2><p className={styles.muted}>5,000 sample SharePoint records; {range.end - range.start} visible rows mounted.</p>
    <Button onClick={() => virtualizer.current?.scrollTo(taskRows.length - 1)}>{arabic ? "الانتقال إلى آخر مهمة" : "Jump to last task"}</Button>
    <Virtualizer className={styles.virtualList} aria-label={arabic ? "المهام" : "Tasks"} numItems={taskRows.length} itemSize={40} measureItems virtualizerLength={24} imperativeRef={virtualizer} onRenderedRange={setRange}>
      {index => { const task = taskRows[index]; return <><strong>{task.id}</strong><span>{task.title}{index % 7 === 0 && <small> · {arabic ? "يتضمن هذا السجل تفاصيل إضافية قابلة للالتفاف" : "Includes additional record details that wrap onto a second line"}</small>}</span><span className={styles.virtualMeta}>{task.owner} · {task.state}</span></>; }}
    </Virtualizer>
  </SharePointCard>;
}

function SharePointTaskGrid({ arabic }: { arabic: boolean }): React.ReactElement {
  const [range, setRange] = React.useState({ start: 0, end: 9, total: taskRows.length });
  const [gridItems, setGridItems] = React.useState(taskRows);
  const [lastCellEdit, setLastCellEdit] = React.useState("");
  const [selectedCount, setSelectedCount] = React.useState(0);
  const [lastResize, setLastResize] = React.useState("");
  const [columnOrder, setColumnOrder] = React.useState(["id", "title", "owner", "state"]);
  const [groupBy, setGroupBy] = React.useState("");
  const [collapsedGroupKeys, setCollapsedGroupKeys] = React.useState<string[]>([]);
  return <SharePointCard aria-label="SharePoint tasks data grid">
    <h2>Task data grid</h2><p className={styles.muted}>{arabic ? "يمكن نسخ الصفوف المحددة ولصق بيانات مفصولة بعلامات جدولة في الخلايا القابلة للتحرير." : "Sortable, selectable, resizable, reorderable, groupable and editable; copy selected rows or paste TSV into editable cells."} {range.end - range.start} of {range.total} display rows mounted · {collapsedGroupKeys.length} groups collapsed · {selectedCount} selected{lastResize ? ` · ${lastResize}` : ""}{lastCellEdit ? ` · ${lastCellEdit}` : ""}.</p>
    <label>Group tasks by <select aria-label="Group tasks by" value={groupBy} onChange={event => { setGroupBy(event.currentTarget.value); setCollapsedGroupKeys([]); }}><option value="">No grouping</option><option value="state">Status</option><option value="owner">Owner</option></select></label>
    <DataGrid className={styles.dataGrid} aria-label={arabic ? "شبكة المهام" : "SharePoint task grid"} sortPriorityLabel={arabic ? "ترتيب الفرز {priority}" : "Sort priority {priority}"} filterable filterLabel={arabic ? "البحث في المهام" : "Search tasks"} items={gridItems} columns={taskColumns} getRowId={task => task.id} rowLabel={arabic ? "الصف" : "row"} editHint={arabic ? "اضغط Enter أو F2 للتحرير" : "Press Enter or F2 to edit"} validateCellEdit={edit => edit.columnId === "title" && !String(edit.value ?? "").trim() ? (arabic ? "عنوان المهمة مطلوب." : "A task title is required.") : undefined} onCellEdit={edit => { setGridItems(current => current.map(task => task.id === edit.rowId ? { ...task, [edit.columnId]: edit.value == null ? "" : String(edit.value) } : task)); setLastCellEdit(`${edit.columnId}: ${String(edit.value ?? "")}`); }} onCellsEdit={edits => { const updates = new Map<string, Record<string, string>>(); edits.forEach(edit => { const row = updates.get(edit.rowId) ?? {}; row[edit.columnId] = edit.value == null ? "" : String(edit.value); updates.set(edit.rowId, row); }); setGridItems(current => current.map(task => updates.has(task.id) ? { ...task, ...updates.get(task.id) } : task)); setLastCellEdit(String(edits.length) + " cells pasted"); }} defaultSort={{ columnId: "id", direction: "ascending" }} selectionMode="multiple" resizableColumns resizeLabel={arabic ? "تغيير حجم العمود" : "Resize column"} onColumnResize={(_event, { columnId, width }) => setLastResize(`${columnId}: ${width}px`)} reorderableColumns reorderLabel={arabic ? "إعادة ترتيب العمود" : "Reorder column"} columnOrder={columnOrder} onColumnOrderChange={setColumnOrder} groupBy={groupBy || undefined} collapsedGroupKeys={collapsedGroupKeys} onCollapsedGroupKeysChange={setCollapsedGroupKeys} expandGroupLabel={arabic ? "توسيع المجموعة" : "Expand group"} collapseGroupLabel={arabic ? "طي المجموعة" : "Collapse group"} height={320} rowHeight={40} overscan={4} onRenderedRange={setRange} onSelectionChange={keys => setSelectedCount(keys.length)} />
  </SharePointCard>;
}

function ComposedTaskGrid({ arabic }: { arabic: boolean }): React.ReactElement {
  const [gridItems, setGridItems] = React.useState(() => taskRows.slice(0, 30));
  const [sortState, setSortState] = React.useState<DataGridCompositionSortState>({ sortColumn: "title", sortDirection: "ascending" });
  const [selectedItems, setSelectedItems] = React.useState<Set<TaskRow>>(() => new Set());
  const [widths, setWidths] = React.useState<Record<string, number>>({ title: 260, owner: 190, state: 150 });
  const [columnOrder, setColumnOrder] = React.useState(["title", "owner", "state"]);
  const columns = React.useMemo(() => [
    createTableColumn<TaskRow>({ columnId: "title", compare: (a, b) => a.title.localeCompare(b.title), renderHeaderCell: () => arabic ? "المهمة" : "Task", renderCell: item => item.title }),
    createTableColumn<TaskRow>({ columnId: "owner", compare: (a, b) => a.owner.localeCompare(b.owner), renderHeaderCell: () => arabic ? "المالك" : "Owner", renderCell: item => item.owner }),
    createTableColumn<TaskRow>({ columnId: "state", compare: (a, b) => a.state.localeCompare(b.state), renderHeaderCell: () => arabic ? "الحالة" : "Status", renderCell: item => item.state }),
  ], [arabic]);
  const items = React.useMemo(() => [...gridItems].sort((a, b) => {
    const column = columns.find(candidate => String(candidate.columnId) === String(sortState.sortColumn));
    return (column?.compare(a, b) ?? 0) * (sortState.sortDirection === "ascending" ? 1 : -1);
  }), [columns, gridItems, sortState]);
  return <SharePointCard aria-label={arabic ? "شبكة المهام المركبة" : "Composable task grid"}>
    <h2>{arabic ? "شبكة مهام قابلة للتركيب" : "Composable task grid"}</h2>
    <p className={styles.muted}>{arabic ? "تركيب صفوف وخلايا مخصص مع تحديد وفرز وتغيير حجم الأعمدة والتحرير." : "A Fluent-style composed surface with app-owned sorting, selection, resizing, reordering, and validated editing."} · {selectedItems.size} selected</p>
    <DataGrid<TaskRow> className={styles.dataGrid} aria-label={arabic ? "مهام مساحة العمل" : "Workspace tasks"} items={items} columns={columns} getRowId={item => item.id} rowLabel={arabic ? "الصف" : "row"} editHint={arabic ? "اضغط Enter أو F2 للتحرير" : "Press Enter or F2 to edit"} validateCellEdit={edit => edit.columnId === "title" && !String(edit.value ?? "").trim() ? (arabic ? "عنوان المهمة مطلوب." : "A task title is required.") : undefined} onCellEdit={edit => setGridItems(current => current.map(item => item.id === edit.rowId ? { ...item, [edit.columnId]: String(edit.value ?? "") } : item))} selectionMode="multiselect" selectedItems={selectedItems} onSelectionChange={(_event, data) => setSelectedItems(data.selectedItems)} sortState={sortState} onSortChange={(_event, next) => setSortState(next)} resizableColumns columnWidths={widths} onColumnResize={(_event, { columnId, width }) => setWidths(current => ({ ...current, [columnId]: width }))} columnSizingOptions={{ title: { defaultWidth: 260, minWidth: 160, idealWidth: 360 }, owner: { defaultWidth: 190, minWidth: 140 }, state: { defaultWidth: 150, minWidth: 110 } }} reorderableColumns columnOrder={columnOrder} onColumnOrderChange={setColumnOrder} reorderLabel={arabic ? "إعادة ترتيب العمود" : "Reorder column"} resizeLabel={arabic ? "تغيير حجم العمود" : "Resize column"} style={{ maxHeight: 340 }}>
      <DataGridHeader><DataGridRow<TaskRow>>{({ renderHeaderCell, columns: orderedColumns }) => <><DataGridSelectionCell label={arabic ? "تحديد كل المهام" : "Select all tasks"} />{orderedColumns.map(column => <DataGridHeaderCell key={String(column.columnId)}>{renderHeaderCell(column)}</DataGridHeaderCell>)}</>}</DataGridRow></DataGridHeader>
      <DataGridBody<TaskRow>>{({ item, rowId, index }) => { const renderCell: DataGridFluentCellRenderFunction<TaskRow> = (column, dataGridContextValue) => <DataGridCell key={String(column.columnId)} editable={column.columnId === "title"} value={column.columnId === "title" ? item.title : undefined} editLabel={`${arabic ? "المهمة" : "Task"}, ${arabic ? "الصف" : "row"} ${index + 1}`}>{column.renderCell(dataGridContextValue.items.find(candidate => dataGridContextValue.getRowId(candidate) === rowId) ?? item)}</DataGridCell>; return <DataGridRow<TaskRow> key={rowId} item={item} rowId={rowId} rowIndex={index + 1} selectionCell={<DataGridSelectionCell label={`${arabic ? "تحديد" : "Select"} ${item.title}`} />}>{renderCell}</DataGridRow>; }}</DataGridBody>
    </DataGrid>
  </SharePointCard>;
}

function SharePointRequestTable({ arabic }: { arabic: boolean }): React.ReactElement {
  const [lastResize, setLastResize] = React.useState("");
  const requests = React.useMemo(() => [
    { id: "SR-2048", title: arabic ? "مراجعة صلاحيات الربع" : "Quarterly access review", owner: arabic ? "ليلى حسن" : "Layla Hassan", status: arabic ? "قيد المراجعة" : "In review", modified: "2026-10-30" },
    { id: "SR-2047", title: arabic ? "مشاركة موقع الفريق" : "Share team site", owner: arabic ? "ماركوس لي" : "Marcus Lee", status: arabic ? "بانتظار الموافقة" : "Awaiting approval", modified: "2026-10-29" },
    { id: "SR-2046", title: arabic ? "تحديث وصف المستند" : "Update document description", owner: arabic ? "أوليفيا مارتين" : "Olivia Martin", status: arabic ? "مكتمل" : "Completed", modified: "2026-10-28" },
  ], [arabic]);
  const columns = React.useMemo(() => [
    createTableColumn<(typeof requests)[number]>({ columnId: "title", compare: (a, b) => a.title.localeCompare(b.title), renderCell: item => item.title }),
    createTableColumn<(typeof requests)[number]>({ columnId: "owner", compare: (a, b) => a.owner.localeCompare(b.owner), renderCell: item => item.owner }),
    createTableColumn<(typeof requests)[number]>({ columnId: "modified", compare: (a, b) => a.modified.localeCompare(b.modified), renderCell: item => item.modified }),
    createTableColumn<(typeof requests)[number]>({ columnId: "status", compare: (a, b) => a.status.localeCompare(b.status), renderCell: item => item.status }),
  ], [requests]);
  const onColumnResize = React.useCallback((_event: KeyboardEvent | TouchEvent | MouseEvent | undefined, data: { columnId: string | number; width: number }) => {
    setLastResize(`${arabic ? "عرض العمود" : "Column width"} ${Math.round(data.width)}px`);
  }, [arabic]);
  const plugins = React.useMemo(() => [
    useTableSelection({ selectionMode: "multiselect" }),
    useTableSort({ defaultSortState: { sortColumn: "modified", sortDirection: "descending" } }),
    useTableColumnSizing_unstable({ autoFitColumns: false, columnSizingOptions: { title: { minWidth: 160, idealWidth: 220, defaultWidth: 220 }, owner: { minWidth: 140, idealWidth: 180 }, modified: { minWidth: 140, idealWidth: 160 }, status: { minWidth: 140, idealWidth: 160 } }, onColumnResize }),
  ], [onColumnResize]);
  const table = useTableFeatures({ items: requests, columns, getRowId: request => request.id }, plugins);
  const rows = table.sort.sort(table.getRows());
  const selectedCount = table.selection.selectedRows.size;
  const titleHeader = table.columnSizing_unstable.getTableHeaderCellProps("title");
  const titleCell = table.columnSizing_unstable.getTableCellProps("title");
  const sortDirection = table.sort.getSortDirection("modified");
  return <SharePointCard aria-label={arabic ? "طلبات SharePoint" : "SharePoint requests table"}>
    <h2>{arabic ? "طلبات SharePoint" : "SharePoint requests"}</h2>
    <p className={styles.muted}>{arabic ? `${selectedCount} طلبات محددة · ${lastResize || "اسحب مقبض العنوان لتغيير عرضه"}` : `${selectedCount} selected · sort by modified date and resize the title column${lastResize ? ` · ${lastResize}` : ""}`}</p>
    <div ref={table.tableRef}>
    <Table aria-label={arabic ? "قائمة الطلبات" : "Requests"} size="small" appearance="dividers" style={{ "--spui-table-width": "100%" } as React.CSSProperties}>
      <TableHeader><TableRow>
        <TableSelectionCell aria-label={arabic ? "تحديد كل الطلبات" : "Select all requests"} checked={table.selection.allRowsSelected ? true : table.selection.someRowsSelected ? "mixed" : false} onClick={event => table.selection.toggleAllRows(event)} />
        <TableHeaderCell style={titleHeader.style} aside={titleHeader.aside}>{arabic ? "الطلب" : "Request"}</TableHeaderCell>
        <TableHeaderCell style={table.columnSizing_unstable.getTableHeaderCellProps("owner").style}>{arabic ? "المالك" : "Owner"}</TableHeaderCell>
        <TableHeaderCell style={table.columnSizing_unstable.getTableHeaderCellProps("modified").style}><Button size="small" appearance="subtle" aria-label={arabic ? "ترتيب حسب تاريخ التعديل" : "Sort by modified date"} onClick={event => table.sort.toggleColumnSort(event, "modified")}>{arabic ? "تاريخ التعديل" : "Modified"}{sortDirection === "ascending" ? " ↑" : " ↓"}</Button></TableHeaderCell>
        <TableHeaderCell style={table.columnSizing_unstable.getTableHeaderCellProps("status").style}>{arabic ? "الحالة" : "Status"}</TableHeaderCell>
      </TableRow></TableHeader>
      <TableBody>{rows.map(row => <TableRow key={row.rowId} selected={table.selection.isRowSelected(row.rowId)}>
        <TableSelectionCell aria-label={arabic ? `تحديد ${row.item.id}` : `Select ${row.item.id}`} checked={table.selection.isRowSelected(row.rowId)} onClick={event => table.selection.toggleRow(event, row.rowId)} />
        <TableCell style={titleCell.style}><TableCellLayout appearance="primary" truncate>{row.item.title}<TableCellActions><Button size="small" appearance="subtle">{arabic ? "فتح" : "Open"}</Button></TableCellActions></TableCellLayout></TableCell>
        <TableCell style={table.columnSizing_unstable.getTableCellProps("owner").style}>{row.item.owner}</TableCell>
        <TableCell style={table.columnSizing_unstable.getTableCellProps("modified").style}>{row.item.modified}</TableCell>
        <TableCell style={table.columnSizing_unstable.getTableCellProps("status").style}>{row.item.status}</TableCell>
      </TableRow>)}</TableBody>
    </Table>
    </div>
  </SharePointCard>;
}

function SharePointLocationTree({ arabic }: { arabic: boolean }): React.ReactElement {
  const [selected, setSelected] = React.useState("planning");
  return <SharePointCard aria-label="SharePoint document library tree">
    <h2>Document library tree</h2><p className={styles.muted}>Keyboard navigation · selected item: {selected}</p>
    <Tree aria-label={arabic ? "مكتبات المستندات" : "Document libraries"} items={arabic ? arabicDocumentTree : documentTree} defaultExpandedKeys={["documents", "atlas"]} defaultSelectedKeys={["planning"]} onSelectionChange={keys => setSelected(keys[0] ?? "none")} toggleLabel={arabic ? "توسيع أو طي" : "Expand or collapse"} />
  </SharePointCard>;
}

function SharePointWorkspaceNav({ arabic, webUrl }: { arabic: boolean; webUrl: string }): React.ReactElement {
  const [selected, setSelected] = React.useState("overview");
  const [open, setOpen] = React.useState<string[]>(["projects"]);
  return <SharePointCard aria-label={arabic ? "التنقل في مساحة العمل" : "Workspace navigation example"}>
    <h2>{arabic ? "التنقل في مساحة العمل" : "Workspace navigation"}</h2>
    <p className={styles.muted}>{arabic ? "روابط حقيقية مع أقسام قابلة للتوسيع." : "Native destination links and an independently expandable section."}</p>
    <Nav aria-label={arabic ? "أقسام مساحة العمل" : "Workspace sections"} selectedValue={selected} openCategories={open} onItemSelect={value => setSelected(value)} onCategoryToggle={(_value, _isOpen, values) => setOpen(values)}>
      <NavSectionHeader>{arabic ? "مساحة العمل" : "Workspace"}</NavSectionHeader>
      <NavItem value="overview" href={webUrl}>{arabic ? "نظرة عامة" : "Overview"}</NavItem>
      <NavItem value="documents" href={`${webUrl}/Shared%20Documents`}>{arabic ? "المستندات المشتركة" : "Shared documents"}</NavItem>
      <NavDivider />
      <NavCategory value="projects">
        <NavCategoryItem>{arabic ? "المشاريع" : "Projects"}</NavCategoryItem>
        <NavSubItemGroup>
          <NavSubItem value="atlas" href={`${webUrl}/SitePages/SharePointUIParityLab036.aspx`}>{arabic ? "مشروع أطلس" : "Project Atlas"}</NavSubItem>
          <NavSubItem value="planning" href={`${webUrl}/Shared%20Documents`}>{arabic ? "التخطيط" : "Planning"}</NavSubItem>
        </NavSubItemGroup>
      </NavCategory>
    </Nav>
  </SharePointCard>;
}

function SharePointTaskFilters({ arabic }: { arabic: boolean }): React.ReactElement {
  const [filters, setFilters] = React.useState(["urgent", "mine", "review"]);
  const [owners, setOwners] = React.useState(["amara"]);
  const [rating, setRating] = React.useState(3);
  const labels: Record<string, { text: string; color: "neutral" | "success" | "warning" }> = arabic
    ? { urgent: { text: "عاجل", color: "warning" }, mine: { text: "مهامي", color: "neutral" }, review: { text: "قيد المراجعة", color: "success" } }
    : { urgent: { text: "Urgent", color: "warning" }, mine: { text: "Assigned to me", color: "neutral" }, review: { text: "Needs review", color: "success" } };
  return <SharePointCard aria-label="SharePoint task filters">
    <h2>{arabic ? "عوامل تصفية المهام" : "Task filters"}</h2>
    <p className={styles.muted}>{arabic ? `${filters.length} عوامل تصفية نشطة` : `${filters.length} active filter${filters.length === 1 ? "" : "s"}`} · {arabic ? "اختر إزالة لتحديث مجموعة التصفية" : "Remove a tag to update the filter set"}</p>
    <TagGroup aria-label={arabic ? "عوامل التصفية النشطة" : "Active task filters"}>
      {filters.map(id => <Tag key={id} value={id} label={labels[id].text} color={labels[id].color} appearance={id === "mine" ? "brand" : "filled"} dismissible onDismiss={value => setFilters(current => current.filter(item => item !== value))}>{labels[id].text}</Tag>)}
      <Tag disabled>{arabic ? "تدار من المسؤول" : "Managed by admin"}</Tag>
    </TagGroup>
    <TagPicker aria-label="Filter task owners" label={arabic ? "مالكو المهام" : "Task owners"} selectedValues={owners} onChange={setOwners}>
      <TagPickerOption value="amara">{arabic ? "أمارة أوكافور" : "Amara Okafor"}</TagPickerOption>
      <TagPickerOption value="jordan">Jordan Lee</TagPickerOption>
      <TagPickerOption value="vilius">Vilius Petrauskas</TagPickerOption>
      <TagPickerOption value="external" disabled>{arabic ? "مستخدم خارجي" : "External user"}</TagPickerOption>
    </TagPicker>
    <Rating aria-label={arabic ? "تقييم الأولوية" : "Prioritization rating"} label={arabic ? "تقييم الأولوية" : "Prioritization rating"} value={rating} max={5} step={0.5} color="marigold" onChange={(_event, data) => setRating(data.value)} />
  </SharePointCard>;
}

function SharePointWorkspaceTabs({ arabic, webUrl }: { arabic: boolean; webUrl: string }): React.ReactElement {
  const [view, setView] = React.useState("overview");
  const [showArchived, setShowArchived] = React.useState(false);
  const [lastMenuAction, setLastMenuAction] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  return <SharePointCard aria-label="SharePoint workspace views">
    <h2>{arabic ? "عروض مساحة العمل" : "Workspace views"}</h2>
    <Tooltip content={arabic ? "يجمع عرض مساحة العمل المهام والمستندات والموافقات ذات الصلة." : "Workspace views bring related tasks, documents, and approvals together."} placement="bottom">
      <Button aria-label={arabic ? "دليل مساحة العمل" : "Workspace guide"}>{arabic ? "دليل مساحة العمل" : "Workspace guide"}</Button>
    </Tooltip>
    <Popover label={arabic ? "خيارات مساحة العمل" : "Workspace actions"} placement="bottom" trigger={<Button>{arabic ? "المزيد من الإجراءات" : "More actions"}</Button>}>
      <p>{arabic ? "إدارة إعدادات المشاركة لهذا العرض." : "Manage sharing settings for this workspace view."}</p>
      <Button data-spui-popover-close>{arabic ? "إغلاق" : "Close"}</Button>
    </Popover>
    <Menu label={arabic ? "قائمة إجراءات مساحة العمل" : "Workspace actions menu"} placement="bottom" trigger={<Button>{arabic ? "الإجراءات" : "Actions"}</Button>} onSelect={value => setLastMenuAction(value)}>
      <MenuGroup label={arabic ? "مساحة العمل" : "Workspace"}>
        <MenuItem value="open">{arabic ? "فتح مساحة العمل" : "Open workspace"}</MenuItem>
        <MenuItem kind="checkbox" value="show-archived" checked={showArchived} onCheckedChange={setShowArchived}>{arabic ? "إظهار العناصر المؤرشفة" : "Show archived items"}</MenuItem>
        <MenuItem value="copy-link">{arabic ? "نسخ الارتباط" : "Copy link"}</MenuItem>
        <MenuDivider />
        <MenuItem value="restricted" disabled>{arabic ? "إجراء مقيّد" : "Restricted action"}</MenuItem>
      </MenuGroup>
    </Menu>
    <Button aria-controls="workspace-details-drawer" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>{arabic ? "تفاصيل مساحة العمل" : "Workspace details"}</Button>
    <Drawer id="workspace-details-drawer" open={drawerOpen} title={arabic ? "تفاصيل مساحة العمل" : "Workspace details"} closeLabel={arabic ? "إغلاق" : undefined} position="end" size="small" onOpenChange={setDrawerOpen} actions={<Button onClick={() => setDrawerOpen(false)}>{arabic ? "تم" : "Done"}</Button>}>
      <p>{arabic ? "راجع تفاصيل المكتبة وحالة المشاركة قبل المتابعة." : "Review the library details and sharing state before continuing."}</p>
      <dl><dt>{arabic ? "المالك" : "Owner"}</dt><dd>{arabic ? "أمارة أوكافور" : "Amara Okafor"}</dd><dt>{arabic ? "الموقع" : "Location"}</dt><dd>{arabic ? "المستندات المشتركة" : "Shared documents"}</dd></dl>
    </Drawer>
    {lastMenuAction ? <p role="status">{arabic ? `تم اختيار ${lastMenuAction}` : `Selected action: ${lastMenuAction}`}</p> : null}
    <Tabs selectedValue={view} onTabSelect={setView}>
      <TabList aria-label={arabic ? "عروض مساحة العمل" : "Workspace views"} appearance="subtle">
        <Tab value="overview">{arabic ? "نظرة عامة" : "Overview"}</Tab>
        <Tab value="documents">{arabic ? "المستندات" : "Documents"}</Tab>
        <Tab value="activity">{arabic ? "النشاط" : "Activity"}</Tab>
        <Tab value="restricted" disabled>{arabic ? "مقيّد" : "Restricted"}</Tab>
      </TabList>
      <TabPanel value="overview"><p>{arabic ? "مساحة عمل التخطيط الربع سنوي تشمل المهام والمستندات وسجل الموافقات." : "The quarterly planning workspace brings tasks, shared documents, and approvals together."}</p></TabPanel>
      <TabPanel value="documents"><p>{arabic ? "٤ مستندات مشتركة · آخر تحديث أمس" : "4 shared documents · last updated yesterday"}</p><Link href={`${webUrl}/Shared%20Documents`}>{arabic ? "فتح المستندات المشتركة" : "Open shared documents"}</Link></TabPanel>
      <TabPanel value="activity"><p>{arabic ? "آخر نشاط: أمارة حدّثت قائمة إطلاق المشروع." : "Recent activity: Amara updated the project launch checklist."}</p></TabPanel>
    </Tabs>
  </SharePointCard>;
}

function SharePointGuidedTour({ arabic }: { arabic: boolean }): React.ReactElement {
  const [announcement, setAnnouncement] = React.useState("");
  return <SharePointCard aria-label={arabic ? "جولة إرشادية" : "Guided workspace tour"}>
    <h2>{arabic ? "جولة إرشادية" : "Guided workspace tour"}</h2>
    <p className={styles.muted}>{arabic ? "خطوات قصيرة قابلة للتنقل بلوحة المفاتيح." : "A short, keyboard-operable, two-step product tour."}</p>
    <TeachingPopover label={arabic ? "جولة مساحة العمل" : "Workspace tour"} placement="bottom" onOpenChange={open => { if (!open) setAnnouncement(""); }}>
      <TeachingPopoverTrigger><Button data-testid="teaching-popover-trigger">{arabic ? "ابدأ الجولة" : "Start tour"}</Button></TeachingPopoverTrigger>
      <TeachingPopoverSurface data-testid="teaching-popover-surface">
        <TeachingPopoverHeader dismissLabel={arabic ? "إغلاق الجولة" : "Close tour"}>
          <TeachingPopoverTitle>{arabic ? "التعرّف على مساحة العمل" : "Explore your workspace"}</TeachingPopoverTitle>
        </TeachingPopoverHeader>
        <TeachingPopoverBody>{arabic ? "تجد هنا المستندات والمهام والموافقات المرتبطة بهذا المشروع." : "Your project documents, tasks, and approvals are collected in one SharePoint workspace."}</TeachingPopoverBody>
        <TeachingPopoverCarousel aria-label={arabic ? "خطوات الجولة" : "Workspace tour steps"} defaultValue="views" onAnnouncement={setAnnouncement}>
          <TeachingPopoverCarouselCard value="views">
            <TeachingPopoverBody mediaLength="short">{arabic ? "ابدأ بعرض المهام والوثائق حسب حاجتك." : "Choose a view to focus on tasks, documents, or recent activity."}</TeachingPopoverBody>
          </TeachingPopoverCarouselCard>
          <TeachingPopoverCarouselCard value="save">
            <TeachingPopoverBody mediaLength="short">{arabic ? "احفظ العناصر المهمة للعودة إليها بسرعة." : "Save frequently used views so you can return to them quickly."}</TeachingPopoverBody>
          </TeachingPopoverCarouselCard>
          <TeachingPopoverCarouselFooter>
            <TeachingPopoverCarouselNav aria-label={arabic ? "الانتقال إلى خطوة" : "Jump to a tour step"}>
              <TeachingPopoverCarouselNavButton value="views" aria-label={arabic ? "الخطوة الأولى" : "Step 1"}>1</TeachingPopoverCarouselNavButton>
              <TeachingPopoverCarouselNavButton value="save" aria-label={arabic ? "الخطوة الثانية" : "Step 2"}>2</TeachingPopoverCarouselNavButton>
            </TeachingPopoverCarouselNav>
            <TeachingPopoverCarouselPageCount />
            <TeachingPopoverCarouselFooterButton navType="previous" altText={arabic ? "الخطوة السابقة" : "Previous step"}>{arabic ? "السابق" : "Back"}</TeachingPopoverCarouselFooterButton>
            <TeachingPopoverCarouselFooterButton navType="next" altText={arabic ? "الخطوة التالية" : "Next step"}>{arabic ? "التالي" : "Next"}</TeachingPopoverCarouselFooterButton>
            <TeachingPopoverCarouselFooterButton navType="dismiss" altText={arabic ? "إنهاء الجولة" : "Finish tour"}>{arabic ? "إنهاء" : "Finish"}</TeachingPopoverCarouselFooterButton>
          </TeachingPopoverCarouselFooter>
        </TeachingPopoverCarousel>
      </TeachingPopoverSurface>
    </TeachingPopover>
    <span className={styles.srOnly} role="status">{announcement}</span>
  </SharePointCard>;
}

export function MetricsDashboard({ startedAt, theme, fluentTokens, spHttpClient, webUrl, locale, rtl: hostRtl }: Props): React.ReactElement {
  React.useEffect(() => { defineDataGrid(); }, []);
  const [title, setTitle] = React.useState("Quarterly planning");
  const [taskPinned, setTaskPinned] = React.useState(false);
  const [documentCardSelected, setDocumentCardSelected] = React.useState(false);
  const [buttonMessage, setButtonMessage] = React.useState("");
  const [workItemId, setWorkItemId] = React.useState("SP-204");
  const [recordType, setRecordType] = React.useState("document");
  const [priority, setPriority] = React.useState("normal");
  const [daysRemaining, setDaysRemaining] = React.useState(4);
  const [completion, setCompletion] = React.useState(60);
  const [reviewDate, setReviewDate] = React.useState("2026-11-01");
  const [assignee, setAssignee] = React.useState("Amara Okafor");
  const [assigneeId, setAssigneeId] = React.useState("amara");
  const [rtl, setRtl] = React.useState(hostRtl);
  const [baseAppearance, setBaseAppearance] = React.useState<SharePointUIBaseAppearance>("ios");
  const [glass, setGlass] = React.useState(true);
  const [fontFamily, setFontFamily] = React.useState('"Segoe UI", sans-serif');
  const [baseCardPadding, setBaseCardPadding] = React.useState("20px");
  const [summary, setSummary] = React.useState("Review the roadmap and confirm next quarter's priorities.");
  const [overflowedActions, setOverflowedActions] = React.useState<string[]>([]);
  const [lastOverflowAction, setLastOverflowAction] = React.useState("");
  const [swatchSelection, setSwatchSelection] = React.useState({ selectedValue: "teal", selectedColor: "#007780" });
  const [selectedPalette, setSelectedPalette] = React.useState(["teal", "blue"]);
  const [brandColor, setBrandColor] = React.useState<ColorPickerHsvColor>({ h: 210, s: 2 / 3, v: 0.6 });
  const [brandColorHex, setBrandColorHex] = React.useState("#336699");
  const [swatchAddStatus, setSwatchAddStatus] = React.useState("");
  const [richHtml, setRichHtml] = React.useState("<p>Review the <strong>roadmap</strong> and confirm next quarter's priorities.</p>");
  const [richStatus, setRichStatus] = React.useState("Loading saved SharePoint content…");
  const [richItemId, setRichItemId] = React.useState<number | null>(null);
  const [richSaveMs, setRichSaveMs] = React.useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [fileUploadStatus, setFileUploadStatus] = React.useState("");
  const [includeSummary, setIncludeSummary] = React.useState(true);
  const [compact, setCompact] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [alertVisible, setAlertVisible] = React.useState(true);
  const [showSkeletons, setShowSkeletons] = React.useState(false);
  const [saveLatency, setSaveLatency] = React.useState<number[]>([]);
  const [dialogLatency, setDialogLatency] = React.useState<number[]>([]);
  const [inputLatency, setInputLatency] = React.useState<number[]>([]);
  const [longTasks, setLongTasks] = React.useState(0);
  const [bundleBytes, setBundleBytes] = React.useState<number | null>(null);
  const [mountMs] = React.useState(() => performance.now() - startedAt);
  React.useEffect(() => {
    const bytes = performance.getEntriesByType("resource").filter(entry => /library-demo-web-part/i.test(entry.name)).reduce((sum, entry) => sum + ((entry as PerformanceResourceTiming).transferSize || 0), 0);
    setBundleBytes(bytes || null);
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver(entries => setLongTasks(count => count + entries.getEntries().length));
        observer.observe({ type: "longtask", buffered: true });
        return () => observer.disconnect();
      } catch { /* Long task reporting is not available in every host. */ }
    }
  }, []);
  React.useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const url = `${webUrl}/_api/web/lists/getbytitle('SharePoint UI Rich Text Tests')/items?$select=Id,Title,BodyHtml,Body&$orderby=Modified desc&$top=1`;
        let response = await spHttpClient.get(url, SPHttpClient.configurations.v1, { headers: { Accept: "application/json;odata=nometadata" } });
        if (response.status === 404) { setRichStatus("No saved SharePoint draft yet."); return; }
        if (!response.ok) throw new Error(`Load failed (${response.status})`);
        const data = await response.json() as { value?: Array<{ Id: number; BodyHtml?: string; Body?: string }> };
        if (!cancelled && data.value?.length) { setRichItemId(data.value[0].Id); setRichHtml(data.value[0].BodyHtml ?? data.value[0].Body ?? ""); setRichStatus(`Loaded saved SharePoint item #${data.value[0].Id}.`); }
        else if (!cancelled) setRichStatus("No saved SharePoint draft yet.");
      } catch { if (!cancelled) setRichStatus("SharePoint list is ready after the first save."); }
    };
    void load(); return () => { cancelled = true; };
  }, [spHttpClient, webUrl]);
  const saveRichText = async (): Promise<void> => {
    const started = performance.now();
    setRichStatus("Saving to SharePoint…");
    try {
      const listUrl = `${webUrl}/_api/web/lists/getbytitle('SharePoint UI Rich Text Tests')`;
      let listResponse = await spHttpClient.get(listUrl, SPHttpClient.configurations.v1, { headers: { Accept: "application/json;odata=nometadata" } });
      if (listResponse.status === 404) {
        listResponse = await spHttpClient.post(`${webUrl}/_api/web/lists`, SPHttpClient.configurations.v1, { headers: { Accept: "application/json;odata=nometadata", "Content-Type": "application/json;odata=nometadata" }, body: JSON.stringify({ Title: "SharePoint UI Rich Text Tests", BaseTemplate: 100, Description: "Demo content created by the SharePoint UI library lab." }) });
        if (!listResponse.ok) throw new Error(`List creation failed (${listResponse.status})`);
      } else if (!listResponse.ok) throw new Error(`List lookup failed (${listResponse.status})`);
      const fieldUrl = `${webUrl}/_api/web/lists/getbytitle('SharePoint UI Rich Text Tests')/fields`;
      const fieldCheck = await spHttpClient.get(`${fieldUrl}/getbyinternalnameortitle('BodyHtml')`, SPHttpClient.configurations.v1, { headers: { Accept: "application/json;odata=nometadata" } });
      if (!fieldCheck.ok) {
        if (fieldCheck.status !== 404) throw new Error(`Rich HTML field lookup failed (${fieldCheck.status})`);
        const schemaXml = '<Field Type="Note" DisplayName="BodyHtml" Name="BodyHtml" StaticName="BodyHtml" RichText="TRUE" RichTextMode="FullHtml" RestrictedMode="FALSE" AllowHyperlink="TRUE" NumLines="15" />';
        const fieldResponse = await spHttpClient.post(`${fieldUrl}/createfieldasxml`, SPHttpClient.configurations.v1, { headers: { Accept: "application/json;odata=nometadata", "Content-Type": "application/json;odata=nometadata" }, body: JSON.stringify({ parameters: { SchemaXml: schemaXml, Options: 8 } }) });
        if (!fieldResponse.ok) throw new Error(`Rich HTML field creation failed (${fieldResponse.status}): ${(await fieldResponse.text()).slice(0, 300)}`);
      }
      const field = await fieldCheck.json().catch(() => null) as { SchemaXml?: string; RestrictedMode?: boolean } | null;
      if (field && (field.RestrictedMode || !field.SchemaXml?.includes('RichTextMode="FullHtml"'))) throw new Error("BodyHtml must be a full HTML SharePoint Note field; recreate it with FullHtml rich text mode.");
      const safeHtml = (document.querySelector("spui-rich-text-editor") as HTMLElement & { value?: string })?.value ?? richHtml;
      const itemsUrl = `${listUrl}/items`;
      const request = { headers: { Accept: "application/json;odata=nometadata", "Content-Type": "application/json;odata=nometadata" }, body: JSON.stringify({ Title: `Editor demo ${new Date().toISOString()}`, BodyHtml: safeHtml }) };
      const response = richItemId
        ? await spHttpClient.post(`${itemsUrl}(${richItemId})`, SPHttpClient.configurations.v1, { ...request, headers: { ...request.headers, "X-HTTP-Method": "MERGE", "IF-MATCH": "*" } })
        : await spHttpClient.post(itemsUrl, SPHttpClient.configurations.v1, request);
      if (!response.ok) throw new Error(`Save failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
      let savedId = richItemId;
      if (!savedId) { const verify = await spHttpClient.get(`${itemsUrl}?$select=Id&$orderby=Id desc&$top=1`, SPHttpClient.configurations.v1, { headers: { Accept: "application/json;odata=nometadata" } }); const saved = await verify.json() as { value?: Array<{ Id: number }> }; savedId = saved.value?.[0]?.Id ?? null; }
      if (!savedId) throw new Error("SharePoint returned no item ID after saving.");
      const check = await spHttpClient.get(`${itemsUrl}(${savedId})?$select=Id,BodyHtml`, SPHttpClient.configurations.v1, { headers: { Accept: "application/json;odata=nometadata" } });
      if (!check.ok) throw new Error(`Readback failed (${check.status})`);
      const savedData = await check.json() as { Id: number; BodyHtml?: string };
      const canonicalHtml = (html: string): string => new DOMParser().parseFromString(html, "text/html").body.innerHTML;
      if (canonicalHtml(savedData.BodyHtml ?? "") !== canonicalHtml(safeHtml)) {
        const received = savedData.BodyHtml ?? "";
        let difference = 0;
        while (difference < safeHtml.length && difference < received.length && safeHtml[difference] === received[difference]) difference++;
        throw new Error(`Saved content did not match readback (expected ${safeHtml.length} chars, received ${received.length}; first difference at ${difference}: ${JSON.stringify(safeHtml.slice(Math.max(0, difference - 24), difference + 48))} → ${JSON.stringify(received.slice(Math.max(0, difference - 24), difference + 48))}).`);
      }
      setRichItemId(savedData.Id); setRichHtml(savedData.BodyHtml ?? ""); setRichSaveMs(performance.now() - started); setRichStatus(`Saved and read back SharePoint item #${savedData.Id}.`);
    } catch (error) { setRichStatus(`SharePoint save error: ${error instanceof Error ? error.message : "unknown error"}`); }
  };
  const measure = (record: React.Dispatch<React.SetStateAction<number[]>>, action: () => void) => {
    const before = performance.now(); action();
    requestAnimationFrame(() => record(samples => [...samples, performance.now() - before].slice(-50)));
  };
  const themeKeys = Object.keys(theme?.semanticColors ?? {}).length + Object.keys(theme?.palette ?? {}).length;
  const fluentTokenCount = Object.keys(fluentTokens ?? {}).length;
  const elementCount = document.querySelectorAll("spui-button,spui-field,spui-card,spui-card-header,spui-card-preview,spui-card-footer,spui-badge,spui-checkbox,spui-switch,spui-textarea,spui-spinner,spui-message-bar,spui-dialog,spui-progress-bar,spui-select,spui-radio-group,spui-radio-option,spui-spin-button,spui-slider,spui-date-picker,spui-combobox,spui-combobox-option,spui-rich-text-editor,spui-alert,spui-skeleton,spui-tag,spui-tag-group,spui-breadcrumb,spui-breadcrumb-item,spui-tabs,spui-tab-list,spui-tab,spui-tab-panel,spui-persona,spui-nav,spui-nav-item,spui-nav-category,spui-nav-category-item,spui-nav-sub-item-group,spui-nav-sub-item,spui-nav-divider,spui-nav-section-header").length;
  const tenantAccent = theme?.semanticColors?.primaryButtonBackground ?? theme?.palette?.themePrimary ?? "var(--spui-base-accent)";
  const appearanceTokens = { "--spui-font-family": fontFamily, ...(glass ? { "--spui-base-card-padding": baseCardPadding } : { "--spui-card-padding": baseCardPadding }) } as const;
  const demoLocale = rtl === hostRtl ? locale : rtl ? "ar" : "en-GB";
  const arabic = /^ar(?:-|$)/i.test(demoLocale);
  const richTextTableStrings = arabic ? { richTextInsertRowAbove: "إدراج صف قبل", richTextInsertRowBelow: "إدراج صف بعد", richTextInsertColumnBefore: "إدراج عمود قبل", richTextInsertColumnAfter: "إدراج عمود بعد", richTextDeleteRow: "حذف الصف", richTextDeleteColumn: "حذف العمود", richTextDeleteTable: "حذف الجدول" } : {};
  return <SharePointUIProvider lang={demoLocale} dir={rtl ? "rtl" : "ltr"} appearance={glass ? "glass" : baseAppearance} baseAppearance={baseAppearance} tokens={appearanceTokens} strings={{ ...richTextTableStrings, loading: arabic ? "جارٍ التحميل" : "Loading list items", dismiss: arabic ? "إغلاق التنبيه" : "Dismiss", remove: arabic ? "إزالة" : "Remove", fileUploadBrowse: arabic ? "استعراض الملفات" : "Browse files", fileUploadDrop: arabic ? "اسحب الملفات هنا أو استعرض لاختيارها" : "Drag files here or browse to select", fileUploadRemove: arabic ? "إزالة" : "Remove", fileUploadRequired: arabic ? "اختر ملفًا واحدًا على الأقل." : "Select at least one file.", fileUploadTypeError: arabic ? "نوع الملف المحدد غير مقبول." : "The selected file type is not accepted.", fileUploadSizeError: arabic ? "حجم الملف المحدد أكبر من المسموح." : "The selected file exceeds the allowed size.", fileUploadLimitError: arabic ? "تم الوصول إلى الحد الأقصى لعدد الملفات." : "The maximum number of files has been reached.", tableResizeColumn: arabic ? "تغيير حجم عمود {column}" : "Resize {column} column", ratingValue: arabic ? "التقييم {value} من {max}" : "{value} of {max}", richTextBold: arabic ? "عريض" : "Bold", richTextItalic: arabic ? "مائل" : "Italic", richTextUnderline: arabic ? "تحته خط" : "Underline", richTextBulletList: arabic ? "قائمة نقطية" : "Bulleted list", richTextNumberList: arabic ? "قائمة مرقمة" : "Numbered list", richTextLink: arabic ? "رابط" : "Link", richTextToolbar: arabic ? "تنسيق النص" : "Rich text formatting", richTextLinkPrompt: arabic ? "عنوان الرابط" : "Link URL", richTextUndo: arabic ? "تراجع" : "Undo", richTextRedo: arabic ? "إعادة" : "Redo", richTextInsertTable: arabic ? "إدراج جدول" : "Insert table", teachingPopoverPageCount: arabic ? "{current} من {total}" : "{current} of {total}", teachingPopoverPageLabel: arabic ? "الخطوة {current} من {total}" : "Step {current} of {total}" }}>
    <div dir={rtl ? "rtl" : "ltr"} lang={demoLocale} data-spui-appearance={glass ? "glass" : baseAppearance} style={getSharePointUIStyleTokens(glass ? "glass" : baseAppearance, appearanceTokens, baseAppearance) as React.CSSProperties} className={compact ? `${styles.root} ${styles.compact}` : styles.root}>
    <header className={styles.header}><div><h1>SharePoint UI Lab</h1><p>Host theme mapped at the web part boundary, native HTML behavior underneath, framework adapters on top.</p></div><div className={styles.headerActions}><Badge>Tenant aware</Badge><Button aria-label={rtl ? "Switch to LTR layout" : "Switch to RTL layout"} onClick={() => setRtl(value => !value)}>{rtl ? "LTR" : "RTL"}</Button></div></header>
    <Breadcrumb className={styles.breadcrumb} label={arabic ? "مسار الصفحة" : "Page location"} focusMode="arrow">
      <BreadcrumbItem><Link href={webUrl}>{arabic ? "مساحة العمل" : "Workspace"}</Link></BreadcrumbItem>
      <BreadcrumbItem><Link href={`${webUrl}/Shared%20Documents`}>{arabic ? "المستندات المشتركة" : "Shared documents"}</Link></BreadcrumbItem>
      <BreadcrumbItem current>{arabic ? "التخطيط ربع السنوي" : "Quarterly planning"}</BreadcrumbItem>
    </Breadcrumb>
    <div className={styles.themeControls}>
      <label>Base appearance<select aria-label="Base appearance" value={baseAppearance} onChange={event => setBaseAppearance(event.currentTarget.value as SharePointUIBaseAppearance)}><option value="fluent">Fluent</option><option value="ios">iOS</option><option value="windows">Windows</option><option value="linux">Linux</option></select></label>
      <Checkbox label="Glass finish" checked={glass} onCheckedChange={setGlass} />
      <label>Font<select aria-label="Component font" value={fontFamily} onChange={event => setFontFamily(event.currentTarget.value)}><option value={'"Segoe UI", sans-serif'}>Segoe UI</option><option value={'"Georgia", serif'}>Georgia</option><option value={'system-ui, sans-serif'}>System UI</option></select></label>
      <label>Base card spacing<select aria-label="Base card spacing" value={baseCardPadding} onChange={event => setBaseCardPadding(event.currentTarget.value)}><option value="16px">Compact · 16 px</option><option value="20px">Comfortable · 20 px</option><option value="24px">Relaxed · 24 px</option></select></label>
      <span className={styles.themeAccent}><span aria-hidden="true" style={{ backgroundColor: tenantAccent }} />SharePoint accent <code>{tenantAccent}</code></span>
    </div>
    <div className={styles.grid}>
      <SharePointCard className={styles.sample} aria-label="Component preview">
        <h2>Component preview <InfoButton label={arabic ? "معلومات حول المختبر" : "About this lab"} placement="bottom">{arabic ? "تجمع هذه الصفحة عناصر SharePoint UI مع بيانات تجريبية." : <>This page combines SharePoint UI elements with synthetic data. <Link href="https://learn.microsoft.com/sharepoint/dev/spfx/sharepoint-framework-overview">SPFx overview</Link></>}</InfoButton></h2><p className={styles.muted}>Elements from the new library</p>
        <Persona name={assignee || "Amara Okafor"} secondaryText={arabic ? "مالكة المنتج" : "Product owner"} presence="available" presenceLabel={arabic ? "متاحة" : "Available"} color="colorful" />
        <AvatarGroup label={arabic ? "المتعاونون في المشروع" : "Project collaborators"} maxVisible={3} showMoreLabel={arabic ? "عرض المزيد من الأشخاص ({count})" : "Show more people ({count})"} showLessLabel={arabic ? "عرض عدد أقل من الأشخاص" : "Show fewer people"}>
          <Avatar name="Amara Okafor" color="colorful" size={32} />
          <Avatar name="Vilius Petrauskas" color="colorful" size={32} />
          <Avatar name="Jordan Lee" color="colorful" size={32} />
          <Avatar name="Sofia Chen" color="colorful" size={32} />
        </AvatarGroup>
        <div className={styles.infoField}>
          <span>{arabic ? "المساهمون" : "Contributors · inspect overflow"}</span>
          <AvatarGroup label={arabic ? "المساهمون في مساحة العمل" : "Workspace contributors"} size={32} layout="stack">
            <AvatarGroupItem name="Amara Okafor" color="colorful" />
            <AvatarGroupItem name="Vilius Petrauskas" color="colorful" />
            <AvatarGroupPopover data-testid="avatar-overflow" count={2} label={arabic ? "مساهمون إضافيون" : "Additional contributors"} triggerLabel={arabic ? "عرض مساهمين إضافيين ({count})" : "View {count} more contributors"}>
              <AvatarGroupItem name="Jordan Lee" color="colorful" />
              <AvatarGroupItem name="Sofia Chen" color="colorful" />
            </AvatarGroupPopover>
          </AvatarGroup>
        </div>
        {alertVisible && <Alert intent="warning" assertive dismissible onDismiss={() => setAlertVisible(false)}>This lab uses synthetic data in a dedicated SharePoint test list.</Alert>}
        <Select label="Record type" name="recordType" value={recordType} onValueChange={setRecordType}><option value="document">Document</option><option value="person">Person</option><option value="task">Task</option><option value="approval">Approval</option></Select>
        <RadioGroup label="Priority" name="priority" value={priority} onValueChange={setPriority}><Radio value="low">Low</Radio><Radio value="normal">Normal</Radio><Radio value="urgent">Urgent</Radio></RadioGroup>
        <SpinButton label="Days remaining" name="daysRemaining" value={daysRemaining} min={0} max={30} step={1} onValueChange={next => setDaysRemaining(next ?? 0)} />
        <Slider label="Completion" name="completion" value={completion} min={0} max={100} step={5} valueText={`${completion}%`} onValueChange={setCompletion} />
        <DatePicker label="Review date" name="reviewDate" value={reviewDate} min="2026-01-01" max="2027-12-31" onValueChange={setReviewDate} />
        <ComboBox label="Assignee" name="assignee" value={assignee} selectedValue={assigneeId} required onValueChange={setAssignee} onOptionSelect={(_event, data) => setAssigneeId(data.optionValue ?? "")}><ComboOption value="amara">Amara Okafor</ComboOption><ComboOption value="lionel">Lionel Mensah</ComboOption><ComboOption value="sofia">Sofia Chen</ComboOption></ComboBox>
        <Field data-testid="work-item-field" label={arabic ? "عنصر العمل" : "Work item"} hint={arabic ? "أدخل عنوانًا قصيرًا يسهل تمييزه" : "Use a short, recognizable title"} required validationMessage={title.trim() ? undefined : (arabic ? "عنوان عنصر العمل مطلوب" : "A work item title is required")}>
          <Input data-testid="work-item-title" name="title" value={title} onValueChange={value => measure(setInputLatency, () => setTitle(value))} />
        </Field>
        <div className={styles.infoField}><span aria-hidden="true">{arabic ? "معرّف عنصر العمل" : "Work item ID"}</span><Input id="work-item-id" data-testid="work-item-id" aria-label={arabic ? "معرّف عنصر العمل" : "Work item ID"} name="workItemId" value={workItemId} onValueChange={setWorkItemId} placeholder="SP-204" size="medium" /></div>
        <div className={styles.actions} aria-label="Button family examples">
          <CompoundButton data-testid="compound-button" icon={<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m3 8 3.2 3.2L13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>} secondaryContent="Accessible title and description">Review task</CompoundButton>
          <ToggleButton data-testid="toggle-button" pressed={taskPinned} onPressedChange={setTaskPinned} aria-label="Pin task">Pin task</ToggleButton>
          <SplitButton data-testid="split-button" menuLabel="More publish options" onClick={() => setButtonMessage("Published")}
            menuItems={<><MenuItem value="draft" onSelect={() => setButtonMessage("Draft saved")}>Save draft</MenuItem><MenuItem value="schedule" onSelect={() => setButtonMessage("Scheduled")}>Schedule</MenuItem></>}>Publish</SplitButton>
          <span role="status">{buttonMessage}</span>
        </div>
        <div className={styles.newControls}>
          <Checkbox label="Include summary" checked={includeSummary} onCheckedChange={setIncludeSummary} />
          <Switch checked={compact} onCheckedChange={setCompact}>Compact layout</Switch>
        </div>
        <TextArea label="Summary" value={summary} onValueChange={setSummary} rows={3} />
        <Divider>Rich text persistence</Divider>
        <RichTextEditor label="Rich text notes" name="richTextNotes" value={richHtml} onValueChange={setRichHtml} placeholder="Write notes with formatting…" />
        <div className={styles.actions}><Button variant="primary" onClick={() => void saveRichText()}>Save rich text to SharePoint</Button><span role="status">{richStatus}</span></div>
        <Divider>{arabic ? "مرفقات" : "File selection"}</Divider>
        <FileUpload data-testid="file-upload" label={arabic ? "المرفقات" : "Attachments"} name="attachments" accept=".txt,.pdf,image/*" multiple required maxFiles={3} maxFileSize={2 * 1024 * 1024} onFilesChange={files => { setSelectedFiles(files); setFileUploadStatus(arabic ? `تم تحديد ${files.length} ملفات` : `${files.length} file${files.length === 1 ? "" : "s"} selected`); }} onFilesError={errors => setFileUploadStatus(errors[0]?.code ?? "File selection error")} />
        <ul data-testid="file-upload-selection">{selectedFiles.map(file => <li key={`${file.name}-${file.size}-${file.lastModified}`}>{file.name} · {file.size} bytes</li>)}</ul>
        <div data-testid="file-upload-status" role="status">{fileUploadStatus}</div>
        <Toolbar label={rtl ? "إجراءات النموذج" : "Form actions"}>
          <Button variant="primary" onClick={() => measure(setSaveLatency, () => setTitle(`${title.replace(/ ✓$/, "")} ✓`))}>Save changes</Button>
          <Button onClick={() => measure(setDialogLatency, () => setOpen(true))}>Open dialog</Button>
        </Toolbar>
        <p className={styles.status} role="status">Current value: {title}</p>
        <div className={styles.infoField}>
          <InfoLabel htmlFor="workspace-reference" required infoButtonLabel={arabic ? "معلومات حول مرجع مساحة العمل" : "Workspace reference information"} info={arabic ? "المرجع موجود في إعدادات مساحة العمل." : "Find this reference in the workspace settings."}>{arabic ? "مرجع مساحة العمل" : "Workspace reference"}</InfoLabel>
          <input id="workspace-reference" required defaultValue="Q4-PLAN" aria-label={arabic ? "مرجع مساحة العمل" : "Workspace reference"} />
        </div>
        <MessageBar intent="info">The form controls inherit the current SharePoint theme.</MessageBar>
        <div className={styles.spinner}><Spinner size="small" /></div>
        <div className={styles.spinner}><ProgressBar value={64} label={arabic ? "جارٍ فحص بيانات القائمة" : "Reviewing list data"} /></div>
      </SharePointCard>
      <SharePointCard className={styles.metrics} aria-label="Performance metrics">
        <h2>Live metrics</h2><p className={styles.muted}>Measured in this browser session</p>
        <dl><div><dt>Library mount</dt><dd>{mountMs.toFixed(1)} ms</dd></div><div><dt>Save click p50 / p95</dt><dd>{percentile(saveLatency,.5)} / {percentile(saveLatency,.95)}</dd></div><div><dt>Dialog open p50 / p95</dt><dd>{percentile(dialogLatency,.5)} / {percentile(dialogLatency,.95)}</dd></div><div><dt>Input update p50 / p95</dt><dd>{percentile(inputLatency,.5)} / {percentile(inputLatency,.95)}</dd></div><div><dt>SharePoint editor save + readback</dt><dd>{richSaveMs === null ? "Not measured yet" : `${richSaveMs.toFixed(1)} ms`}</dd></div><div><dt>Saved HTML payload</dt><dd>{new TextEncoder().encode(richHtml).byteLength} bytes</dd></div><div><dt>Web part transfer</dt><dd>{bundleBytes === null ? "Not exposed by host" : `${(bundleBytes/1024).toFixed(1)} KiB`}</dd></div><div><dt>SP theme entries</dt><dd>{themeKeys}</dd></div><div><dt>Fluent v9 tokens</dt><dd>{fluentTokenCount}</dd></div><div><dt>Library elements on page</dt><dd>{elementCount}</dd></div><div><dt>Page long tasks</dt><dd>{longTasks}</dd></div><div><dt>JS heap</dt><dd>{(performance as Performance & { memory?: { usedJSHeapSize: number } }).memory ? `${((performance as Performance & { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize/1048576).toFixed(1)} MiB` : "Unavailable in this host"}</dd></div></dl>
        <p className={styles.note}>Interaction latency includes React state scheduling and one animation frame. Long tasks include the SharePoint host page; resource timing may hide bundle transfer bytes across origins.</p>
      </SharePointCard>
    </div>
    <Card className={styles.documentCard} aria-label="Quarterly planning document card" data-testid="card-composition">
      <CardHeader data-testid="card-composition-header" image={<span className={styles.recordMark} aria-label="Word document">W</span>} header="Quarterly planning.docx" description="Modified 28 October · Shared Documents" action={<Badge>Shared</Badge>} />
      <CardPreview data-testid="card-composition-preview" logo={<Badge>DOCX</Badge>}>
        <Image data-testid="card-composition-image" src={documentPreviewSource} alt="Preview of the quarterly planning document" width={620} height={350} fit="cover" shape="square" block bordered shadow style={{ width: "100%", height: 180 }} />
      </CardPreview>
      <CardFooter data-testid="card-composition-footer" action={<Badge>Version 12</Badge>}><Link href={`${webUrl}/Shared%20Documents`}>Open library</Link></CardFooter>
    </Card>
    <Card className={styles.documentCard} aria-label={arabic ? "بطاقة اختيار خطة ربع السنة" : "Quarterly plan selection card"} defaultSelected={false} selectionLabel={arabic ? "تحديد خطة ربع السنة" : "Select quarterly plan"} onSelectionChange={(_event, data) => setDocumentCardSelected(data.selected)} data-testid="card-selection-demo">
      <CardHeader header={arabic ? "خطة ربع السنة.docx" : "Quarterly plan.docx"} description={arabic ? "حدد البطاقة للعمل عليها" : "Select this card to work with it"} />
      <CardFooter><span data-testid="card-selection-status" role="status">{documentCardSelected ? (arabic ? "تم تحديد البطاقة" : "Card selected") : (arabic ? "لم يتم تحديد البطاقة" : "Card not selected")}</span></CardFooter>
    </Card>
    <SharePointCard aria-label={arabic ? "عرض دوّار لسجلات SharePoint" : "SharePoint record carousel"}>
      <h2>{arabic ? "عناصر قابلة لإعادة الاستخدام" : "Reusable carousel slides"}</h2>
      <p className={styles.muted}>{arabic ? "بطاقات السجلات الحالية مع عناصر التحكم المحلية والدعم الكامل للاتجاه من اليمين إلى اليسار." : "Existing record cards with native touch scrolling, localized controls, and right-to-left reading order."}</p>
      <Carousel data-testid="record-carousel" label={arabic ? "السجلات" : "SharePoint records"} roleDescription={arabic ? "عرض دوّار" : "carousel"} slideGroupLabel={arabic ? "شرائح السجلات" : "SharePoint record slides"} navigationLabel={arabic ? "التنقل بين الشرائح" : "Slide navigation"} previousLabel={arabic ? "السجل السابق" : "Previous record"} nextLabel={arabic ? "السجل التالي" : "Next record"} slideLabel={arabic ? "الشريحة {index} من {count}" : "Slide {index} of {count}"} wrap>
        {records.slice(0, 3).map(record => { const item = arabic ? record.ar : record; return <ViewCard key={record.kind} data-testid={`carousel-slide-${record.kind}`} aria-label={record.kind === "document" ? (arabic ? "مستند خطة ربع السنة" : "Quarterly planning document") : undefined} kind={record.kind} title={item.title} subtitle={item.subtitle} description={item.description}><span slot="leading" className={styles.recordMark} aria-hidden="true">{record.leading}</span><Badge slot="status">{item.status}</Badge><span slot="detail">{item.detail}</span></ViewCard>; })}
      </Carousel>
    </SharePointCard>
    <SharePointCard aria-label={arabic ? "إجراءات مساحة العمل" : "Responsive workspace actions"}>
      <h2>{arabic ? "إجراءات متجاوبة" : "Responsive actions"}</h2>
      <p className={styles.muted}>{arabic ? `${overflowedActions.length} إجراءات في القائمة` : `${overflowedActions.length} actions in the menu`}{lastOverflowAction ? ` · ${arabic ? "آخر إجراء" : "Last action"}: ${lastOverflowAction}` : ""}</p>
      <Overflow data-testid="responsive-overflow" label={arabic ? "إجراءات مساحة العمل" : "Workspace actions"} minimumVisible={2} padding={8} style={{ width: "320px", maxWidth: "100%" }} onOverflowChange={(_, data) => setOverflowedActions(Object.keys(data.itemVisibility).filter(id => !data.itemVisibility[id]))} onOverflowItemSelect={id => setLastOverflowAction(id)}>
        <OverflowItem id="save" pinned groupId="primary" overflowLabel={arabic ? "حفظ" : "Save"} overflowContent={<MenuItem value="save">{arabic ? "حفظ" : "Save"}</MenuItem>}><Button appearance="primary">{arabic ? "حفظ" : "Save"}</Button></OverflowItem>
        <OverflowItem id="edit" priority={30} groupId="primary" overflowLabel={arabic ? "تعديل" : "Edit"} overflowContent={<MenuItem value="edit">{arabic ? "تعديل" : "Edit"}</MenuItem>}><Button appearance="subtle">{arabic ? "تعديل" : "Edit"}</Button></OverflowItem>
        <OverflowDivider groupId="secondary" />
        <OverflowItem id="copy-link" priority={15} groupId="secondary" overflowLabel={arabic ? "نسخ الرابط" : "Copy link"} overflowContent={<MenuItem value="copy-link">{arabic ? "نسخ الرابط" : "Copy link"}</MenuItem>}><Button appearance="subtle">{arabic ? "نسخ الرابط" : "Copy link"}</Button></OverflowItem>
        <OverflowItem id="export" priority={25} groupId="secondary" overflowLabel={arabic ? "تصدير" : "Export"} overflowContent={<MenuItem value="export">{arabic ? "تصدير" : "Export"}</MenuItem>}><Button appearance="subtle">{arabic ? "تصدير" : "Export"}</Button></OverflowItem>
        <OverflowItem id="archive" priority={5} groupId="secondary" overflowLabel={arabic ? "أرشفة" : "Archive"} overflowContent={<MenuItem value="archive">{arabic ? "أرشفة" : "Archive"}</MenuItem>}><Button appearance="subtle">{arabic ? "أرشفة" : "Archive"}</Button></OverflowItem>
      </Overflow>
    </SharePointCard>
    <SharePointCard aria-label={arabic ? "لوحة ألوان مساحة العمل" : "Workspace color palette"}>
      <h2>{arabic ? "ألوان مساحة العمل" : "Workspace colors"}</h2>
      <p className={styles.muted}>{arabic ? "اختر لونًا أو عيّن صورة لعنصر." : "Choose a color or assign an image to an item."} · {swatchSelection.selectedColor || swatchSelection.selectedValue}{swatchAddStatus ? ` · ${swatchAddStatus}` : ""}</p>
      <SwatchPicker data-testid="swatch-picker-demo" aria-label={arabic ? "ألوان مساحة العمل" : "Workspace colors"} selectedValue={swatchSelection.selectedValue} layout="grid" columns={4} onSelectionChange={(_event, data) => setSwatchSelection(data)}>
        <SwatchPickerRow>
          <ColorSwatch value="teal" color="#007780" aria-label={arabic ? "أزرق مخضر" : "Teal"} />
          <ColorSwatch value="blue" color="#005A9E" aria-label={arabic ? "أزرق" : "Blue"} />
          <ColorSwatch value="green" color="#107C10" aria-label={arabic ? "أخضر" : "Green"} />
          <ColorSwatch value="amber" color="#8A5A00" aria-label={arabic ? "كهرماني" : "Amber"} />
        </SwatchPickerRow>
        <ColorSwatch value="pink" color="#C239B3" aria-label={arabic ? "وردي" : "Pink"} />
        <ColorSwatch value="disabled" color="#666666" aria-label={arabic ? "غير متاح" : "Unavailable"} disabled />
        <ImageSwatch value="document" src={documentPreviewSource} aria-label={arabic ? "نمط معاينة المستند" : "Document preview pattern"} />
        <EmptySwatch aria-label={arabic ? "إضافة لون" : "Add a color"} onAdd={() => setSwatchAddStatus(arabic ? "تم فتح منتقي الألوان" : "Color picker requested")} />
      </SwatchPicker>
      <p className={styles.muted}>{arabic ? `لوحة الألوان المحددة: ${selectedPalette.join("، ")}` : `Saved palette: ${selectedPalette.join(", ")}`}</p>
      <SwatchPicker data-testid="swatch-picker-multiple-demo" aria-label={arabic ? "لوحة ألوان متعددة" : "Saved palette colors"} selectionMode="multiple" selectedValues={selectedPalette} layout="row" size="small" shape="circular" spacing="small" onSelectionChange={(_event, selection) => setSelectedPalette(selection.selectedValues)}>
        <ColorSwatch value="teal" color="#007780" aria-label={arabic ? "أزرق مخضر" : "Teal"} />
        <ColorSwatch value="blue" color="#005A9E" aria-label={arabic ? "أزرق" : "Blue"} />
        <ColorSwatch value="green" color="#107C10" aria-label={arabic ? "أخضر" : "Green"} />
        <ColorSwatch value="amber" color="#8A5A00" aria-label={arabic ? "كهرماني" : "Amber"} />
      </SwatchPicker>
    </SharePointCard>
    <SharePointCard aria-label={arabic ? "اختيار لون العلامة عبر HSV" : "Brand color HSV picker"}>
      <h2>{arabic ? "لون العلامة" : "Brand color"}</h2>
      <p className={styles.muted}>{arabic ? "لون HSV مضبوط من حالة React مع معاينة HEX." : "A React-controlled HSV color with a HEX preview."}</p>
      <ColorPicker data-testid="hsv-color-picker-demo" label={arabic ? "لون العلامة" : "Brand color"} color={brandColor} onColorChange={(_event, data) => setBrandColor(data.color)} onValueChange={setBrandColorHex}>
        <ColorArea aria-label={arabic ? "التشبع والسطوع" : "Saturation and brightness"} />
        <ColorSlider channel="hue" aria-label={arabic ? "درجة اللون" : "Hue"} />
        <AlphaSlider aria-label={arabic ? "الشفافية" : "Opacity"} />
      </ColorPicker>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}><span aria-hidden="true" style={{ width: 28, height: 28, border: "1px solid var(--spui-ui-stroke)", borderRadius: 6, backgroundColor: brandColorHex }} /><code>{brandColorHex}</code><span className={styles.muted}>HSV {Math.round(brandColor.h)}° · {Math.round(brandColor.s * 100)}% · {Math.round(brandColor.v * 100)}%</span></div>
    </SharePointCard>
    <SharePointCard aria-label="Expandable guidance">
      <h2>Reusable disclosure</h2>
      <Accordion mode="single" collapsible defaultOpenItems="component-details">
        <AccordionItem value="component-details">
          <AccordionHeader expandIconPosition="start">{arabic ? "تفاصيل المكوّن" : "Component details"}</AccordionHeader>
          <AccordionPanel><p>{arabic ? "يستخدم هذا العنصر سمات SharePoint ويتبع اتجاه القراءة." : "This view uses SharePoint theme tokens and follows the page reading direction."}</p></AccordionPanel>
        </AccordionItem>
        <AccordionItem value="customization">
          <AccordionHeader>{arabic ? "التخصيص" : "Customization"}</AccordionHeader>
          <AccordionPanel><p>{arabic ? "يمكنك تغيير الخط والمسافات والألوان باستخدام المتغيرات." : "Change its font, spacing, and colors through CSS custom properties."}</p></AccordionPanel>
        </AccordionItem>
      </Accordion>
    </SharePointCard>
    <SharePointCard className={styles.viewGallery} aria-label="Reusable SharePoint view cards">
      <div className={styles.galleryHeading}><div><h2>SharePoint view cards</h2><p className={styles.muted}>A repeated data-driven list. Supply fields, slots, and actions per tenant.</p><Link href={`${webUrl}/Lists/SharePoint%20UI%20Rich%20Text%20Tests`} target="_blank">Open saved SharePoint content</Link></div><div className={styles.galleryActions}><Button onClick={() => setShowSkeletons(value => !value)}>{showSkeletons ? "Show loaded records" : "Show loading state"}</Button><Badge>4 record types</Badge></div></div>
      {showSkeletons ? <div className={styles.skeletonGrid} role="status" aria-label={arabic ? "جارٍ تحميل السجلات" : "Loading records"}><span className={styles.srOnly}>{arabic ? "جارٍ تحميل السجلات" : "Loading records"}</span>{records.map(record => <div className={styles.skeletonCard} key={record.kind}><Skeleton shape="circle" width="42px" height="42px" /><div className={styles.skeletonLines}><Skeleton width="72%" height="14px" /><Skeleton width="48%" height="12px" /><Skeleton width="88%" height="12px" /></div></div>)}</div> : <div className={styles.viewGrid}>{records.map(record => { const localized = arabic ? record.ar : record; return <ViewCard key={record.kind} kind={record.kind} title={localized.title} subtitle={localized.subtitle} description={localized.description}>
        {record.kind === "person" ? <Avatar slot="leading" name={localized.title} size={42} color="colorful" active="active" /> : <span slot="leading" aria-hidden="true" className={styles.recordMark}>{record.leading}</span>}
        <span slot="eyebrow">{localized.eyebrow}</span>
        <span slot="status">{localized.status}</span>
        <span className={styles.recordDetail}>{localized.detail}</span>
      </ViewCard>; })}</div>}
    </SharePointCard>
    <VirtualizedTaskList arabic={arabic} />
    <SharePointRequestTable arabic={arabic} />
    <SharePointTaskGrid arabic={arabic} />
    <ComposedTaskGrid arabic={arabic} />
    <SharePointGuidedTour arabic={arabic} />
    <SharePointTaskFilters arabic={arabic} />
    <SharePointWorkspaceTabs arabic={arabic} webUrl={webUrl} />
    <SharePointWorkspaceNav arabic={arabic} webUrl={webUrl} />
    <SharePointLocationTree arabic={arabic} />
    <SharePointCard className={styles.tokens}><h2>Theme contract</h2><p>All enumerable SharePoint palette and semantic color values are copied to CSS custom properties on the web part root. Detected {themeKeys} classic SPFx theme entries and {fluentTokenCount} Fluent v9 tokens in this context.</p></SharePointCard>
    <Dialog open={open} title="Confirm changes" onOpenChange={(_event, data) => setOpen(data.open)} actions={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => measure(setDialogLatency, () => setOpen(false))}>Confirm</Button></>}><p>Native dialog behavior packaged as a reusable library element.</p></Dialog>
    </div>
  </SharePointUIProvider>;
}
