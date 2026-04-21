import powerbi from "powerbi-visuals-api";
import "../style/visual.less";

import IVisual = powerbi.extensibility.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewObjects = powerbi.DataViewObjects;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import FormattingModel = powerbi.visuals.FormattingModel;
import FormattingCard = powerbi.visuals.FormattingCard;
import FormattingGroup = powerbi.visuals.FormattingGroup;
import FormattingSlice = powerbi.visuals.FormattingSlice;
import ValidatorType = powerbi.visuals.ValidatorType;
import FormattingComponent = powerbi.visuals.FormattingComponent;

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private inputShell: HTMLElement;
    private searchIcon: HTMLElement;
    private input: HTMLInputElement;
    private clearButton: HTMLButtonElement;
    private dropdown: HTMLElement;
    private list: HTMLElement;
    private selectionManager: ISelectionManager;
    private fontSizePx: number = 12;
    private allowMultiSelect: boolean = false;
    private showSearchIcon: boolean = true;
    private searchPlaceholder: string = "Buscar valor";
    private searchFontFamily: string = "Segoe UI";
    private dropdownFontFamily: string = "Segoe UI";
    private focusBorderColor: string = "#7aa7ff";
    private hoverColor: string = "#eef3fb";
    private hoverOpacityPct: number = 100;
    private searchLabelColor: string = "#1f2937";
    private inputHeightPx: number = 36;
    private inputBorderWidthPx: number = 1;
    private inputBorderRadiusPx: number = 8;

    private categoryCol: DataViewCategoryColumn | null = null;
    private categoryText: string[] = [];
    private selectedIndex: number | null = null;
    private selectedExactText: string = "";
    private selectedValues: unknown[] = [];
    private inputText: string = "";
    private visibleItemIndices: number[] = [];
    private highlightedVisibleIndex: number = -1;
    private keyboardNavigationActive: boolean = false;
    private hoveredVisibleIndex: number = -1;
    private isSyncingFromHost: boolean = false;

    private readonly maxMatchesToSelect = 200;
    private readonly debounceMs = 200;
    private debounceHandle: number | null = null;
    private lastQueryApplied: string = "";
    private readonly onDocumentOutsideClick: (ev: Event) => void;
    private readonly onWindowBlur: () => void;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();

        this.root = document.createElement("div");
        this.root.className = "slicer-root";

        this.inputShell = document.createElement("div");
        this.inputShell.className = "slicer-input-shell";

        this.searchIcon = document.createElement("span");
        this.searchIcon.className = "slicer-search-icon";
        this.searchIcon.setAttribute("aria-hidden", "true");

        this.input = document.createElement("input");
        this.input.className = "slicer-input";
        this.input.type = "text";
        this.input.placeholder = this.searchPlaceholder;
        this.input.autocomplete = "off";

        this.clearButton = document.createElement("button");
        this.clearButton.className = "slicer-clear-button";
        this.clearButton.type = "button";
        this.clearButton.textContent = "x";
        this.clearButton.title = "Limpar busca";

        this.inputShell.appendChild(this.searchIcon);
        this.inputShell.appendChild(this.input);
        this.inputShell.appendChild(this.clearButton);

        this.dropdown = document.createElement("div");
        this.dropdown.className = "slicer-dropdown hidden";

        this.list = document.createElement("div");
        this.list.className = "slicer-list";

        this.dropdown.appendChild(this.list);

        this.list.addEventListener("mousemove", (ev: MouseEvent) => {
            const target = ev.target as HTMLElement | null;
            const item = target?.closest(".slicer-item") as HTMLElement | null;

            if (!item) {
                return;
            }

            const visibleIndexRaw = item.getAttribute("data-visible-index");
            const visibleIndex = visibleIndexRaw !== null ? parseInt(visibleIndexRaw, 10) : -1;

            if (!isNaN(visibleIndex) && visibleIndex >= 0) {
                this.setHoveredVisibleIndex(visibleIndex);
            }
        });

        this.list.addEventListener("mouseleave", () => {
            if (this.hoveredVisibleIndex !== -1) {
                this.hoveredVisibleIndex = -1;
                this.renderList(this.input.value);
            }
        });

        this.root.appendChild(this.inputShell);
        this.root.appendChild(this.dropdown);
        options.element.appendChild(this.root);

        this.setInputText("");

        this.clearButton.addEventListener("click", () => {
            this.clearSelectionAndSearch();
            this.input.focus();
        });

        this.selectionManager.registerOnSelectCallback((ids) => {
            if (ids && ids.length > 0) {
                return;
            }

            this.resetLocalState();
            this.renderList("");
        });

        this.input.addEventListener("focus", () => {
            this.openDropdown();
            this.renderList(this.input.value);
        });
        this.input.addEventListener("click", () => {
            this.openDropdown();
            this.renderList(this.input.value);
        });
        this.input.addEventListener("input", () => this.onSearchInput());
        this.input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                this.closeDropdown();
                this.input.blur();
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                this.moveHighlightedItem(1);
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                this.moveHighlightedItem(-1);
                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();
                if (this.selectHighlightedItem()) {
                    return;
                }

                const rawInput = this.input.value;
                const query = rawInput.trim();
                if (query.length > 0) {
                    // Enter deve aplicar imediatamente a mesma busca "contains" da digitação.
                    const shouldCloseDropdown = this.applyEnterQuery(rawInput);
                    if (shouldCloseDropdown) {
                        this.closeDropdown();
                    }
                } else {
                    this.clearSelectionAndSearch();
                    this.closeDropdown();
                }
            }
        });

        this.onDocumentOutsideClick = (ev: Event) => {
            const target = ev.target as Node | null;

            const eventWithPath = ev as Event & { composedPath?: () => EventTarget[] };
            const path = typeof eventWithPath.composedPath === "function"
                ? eventWithPath.composedPath()
                : [];

            const clickedInsideByPath = path.indexOf(this.root) !== -1;
            const clickedInsideByTarget = target ? this.root.contains(target) : false;

            if (!clickedInsideByPath && !clickedInsideByTarget) {
                this.closeDropdown();
            }
        };
        // Capture phase aumenta a chance de detectar clique fora mesmo com stopPropagation.
        document.addEventListener("mousedown", this.onDocumentOutsideClick, true);
        document.addEventListener("touchstart", this.onDocumentOutsideClick, true);

        // Quando o iframe/visual perde foco (clique fora do visual), recolhe o dropdown.
        this.onWindowBlur = () => {
            this.closeDropdown();
        };
        window.addEventListener("blur", this.onWindowBlur);
    }

    private static getObjectValue<T>(
        objects: DataViewObjects | undefined,
        objectName: string,
        propertyName: string,
        defaultValue: T
    ): T {
        const object = objects && (objects as any)[objectName];
        const value = object && object[propertyName];
        return (value !== undefined ? (value as T) : defaultValue);
    }

    private static getColorValue(
        objects: DataViewObjects | undefined,
        objectName: string,
        propertyName: string,
        defaultValue: string
    ): string {
        const object = objects && (objects as any)[objectName];
        const raw = object && object[propertyName];

        if (!raw) return defaultValue;
        if (typeof raw === "string") return raw;
        if (typeof raw.value === "string") return raw.value;
        if (raw.solid && typeof raw.solid.color === "string") return raw.solid.color;
        if (raw.solid && raw.solid.color && typeof raw.solid.color.value === "string") {
            return raw.solid.color.value;
        }
        if (typeof raw.color === "string") return raw.color;

        return defaultValue;
    }

    private toRgba(color: string, alpha: number): string {
        const hex3 = /^#([0-9a-f]{3})$/i;
        const hex6 = /^#([0-9a-f]{6})$/i;
        const rgb = /^rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i;

        const c = color.trim();
        const match3 = c.match(hex3);
        if (match3) {
            const h = match3[1];
            const r = parseInt(h[0] + h[0], 16);
            const g = parseInt(h[1] + h[1], 16);
            const b = parseInt(h[2] + h[2], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        const match6 = c.match(hex6);
        if (match6) {
            const h = match6[1];
            const r = parseInt(h.substring(0, 2), 16);
            const g = parseInt(h.substring(2, 4), 16);
            const b = parseInt(h.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        const matchRgb = c.match(rgb);
        if (matchRgb) {
            const r = parseInt(matchRgb[1], 10);
            const g = parseInt(matchRgb[2], 10);
            const b = parseInt(matchRgb[3], 10);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        return "rgba(122, 167, 255, 0.25)";
    }

    private onSelect(category: DataViewCategoryColumn, index: number): void {
        this.selectedValues = [];
        this.selectedIndex = index;
        this.selectedExactText = this.categoryText[index] || "";
        this.lastQueryApplied = this.categoryText[index] || "";

        this.applyCategoryFilter([category.values[index]]);
    }

    private syncSelectedValues(values: unknown[]): void {
        const uniqueValues: unknown[] = [];

        for (let i = 0; i < values.length; i++) {
            let alreadyIncluded = false;
            for (let j = 0; j < uniqueValues.length; j++) {
                if (uniqueValues[j] === values[i]) {
                    alreadyIncluded = true;
                    break;
                }
            }

            if (!alreadyIncluded) {
                uniqueValues.push(values[i]);
            }
        }

        this.selectedValues = uniqueValues;
    }

    private hasSelectedValue(value: unknown): boolean {
        for (let i = 0; i < this.selectedValues.length; i++) {
            if (this.selectedValues[i] === value) {
                return true;
            }
        }

        return false;
    }

    private toggleMultiSelectedValue(index: number): void {
        if (!this.categoryCol) {
            return;
        }

        const categoryValue = this.categoryCol.values[index];
        const nextSelectedValues = this.selectedValues.slice();
        let existingIndex = -1;

        for (let i = 0; i < nextSelectedValues.length; i++) {
            if (nextSelectedValues[i] === categoryValue) {
                existingIndex = i;
                break;
            }
        }

        if (existingIndex >= 0) {
            nextSelectedValues.splice(existingIndex, 1);
        } else {
            nextSelectedValues.push(categoryValue);
        }

        this.syncSelectedValues(nextSelectedValues);
        this.selectedIndex = null;
        this.selectedExactText = "";
        this.lastQueryApplied = this.inputText.trim();

        if (this.selectedValues.length === 0) {
            this.clearCategoryFilter();
        } else {
            this.applyCategoryFilter(this.selectedValues);
        }

        this.renderList(this.input.value);
    }

    private getCategoryFilterTarget(): { table: string, column: string } | null {
        const queryName = this.categoryCol?.source?.queryName;
        if (!queryName) {
            return null;
        }

        const separatorIndex = queryName.lastIndexOf(".");
        if (separatorIndex <= 0 || separatorIndex >= queryName.length - 1) {
            return null;
        }

        return {
            table: queryName.substring(0, separatorIndex),
            column: queryName.substring(separatorIndex + 1)
        };
    }

    private applyJsonFilterToHost(filter: any | null, action: powerbi.FilterAction): void {
        try {
            this.host.applyJsonFilter(filter, "general", "filter", action);
        } catch (error) {
            console.error("[CustomSlicer] Error applying filter:", error);
        }
    }

    private applyCategoryFilter(values: unknown[]): void {
        try {
            const target = this.getCategoryFilterTarget();
            if (!target) {
                return;
            }

            const uniqueValues: unknown[] = [];
            for (let i = 0; i < values.length; i++) {
                let alreadyIncluded = false;
                for (let j = 0; j < uniqueValues.length; j++) {
                    if (uniqueValues[j] === values[i]) {
                        alreadyIncluded = true;
                        break;
                    }
                }

                if (!alreadyIncluded) {
                    uniqueValues.push(values[i]);
                }
            }

            if (uniqueValues.length === 0) {
                this.clearCategoryFilter();
                return;
            }

            const filter = {
                $schema: "https://powerbi.com/product/schema#basic",
                target,
                operator: "In",
                values: uniqueValues,
                filterType: 1
            };

            this.applyJsonFilterToHost(filter, powerbi.FilterAction.merge);
        } catch (error) {
            console.error("[CustomSlicer] Error applying category filter:", error);
        }
    }

    private clearCategoryFilter(): void {
        try {
            this.applyJsonFilterToHost(null, powerbi.FilterAction.remove);
        } catch (error) {
            console.error("[CustomSlicer] Error clearing category filter:", error);
        }
    }

    private getOwnCategoryFilter(options: VisualUpdateOptions): any | null {
        const target = this.getCategoryFilterTarget();
        if (!target) {
            return null;
        }

        const jsonFilters = (options as VisualUpdateOptions & { jsonFilters?: any[] }).jsonFilters || [];
        for (let i = 0; i < jsonFilters.length; i++) {
            const filter = jsonFilters[i];
            const filterAny = filter as any;
            const filterTarget = filterAny?.target;
            if (filterTarget?.table !== target.table || filterTarget?.column !== target.column) {
                continue;
            }

            if (filterAny?.operator === "All") {
                continue;
            }

            if (Array.isArray(filterAny?.values) && filterAny.values.length === 0) {
                continue;
            }

            return filterAny;
        }

        return null;
    }

    private syncVisualStateWithHost(options: VisualUpdateOptions): void {
        if (this.isSyncingFromHost) {
            return;
        }

        const ownFilter = this.getOwnCategoryFilter(options);
        if (!ownFilter) {
            if (!this.isFilterActive()) {
                return;
            }

            this.isSyncingFromHost = true;
            try {
                this.resetLocalState();
                void this.selectionManager.clear();
            } finally {
                this.isSyncingFromHost = false;
            }
            return;
        }

        const filterValues = Array.isArray((ownFilter as any).values)
            ? ((ownFilter as any).values as unknown[])
            : [];
        const persistedSearch = this.inputText;

        this.isSyncingFromHost = true;
        try {
            this.highlightedVisibleIndex = -1;
            this.hoveredVisibleIndex = -1;
            this.setKeyboardNavigationActive(false);

             if (this.allowMultiSelect) {
                this.syncSelectedValues(filterValues);
                this.selectedIndex = null;
                this.selectedExactText = "";
                this.lastQueryApplied = persistedSearch.trim();
                this.setInputText(persistedSearch);
                return;
            }

            this.selectedValues = [];

            if (filterValues.length === 1 && this.categoryCol) {
                const filterValue = filterValues[0];
                let matchedIndex = -1;

                for (let i = 0; i < this.categoryCol.values.length; i++) {
                    if (this.categoryCol.values[i] === filterValue) {
                        matchedIndex = i;
                        break;
                    }
                }

                this.selectedIndex = matchedIndex >= 0 ? matchedIndex : null;
                this.selectedExactText = matchedIndex >= 0 ? (this.categoryText[matchedIndex] || "") : "";
                this.lastQueryApplied = this.selectedExactText;
                this.setInputText(persistedSearch || String(filterValue ?? ""));
            } else {
                this.selectedIndex = null;
                this.selectedExactText = "";
                this.lastQueryApplied = persistedSearch.trim();
                this.setInputText(persistedSearch);
            }
        } finally {
            this.isSyncingFromHost = false;
        }
    }

    private openDropdown(): void {
        this.dropdown.classList.remove("hidden");
    }

    private closeDropdown(): void {
        this.dropdown.classList.add("hidden");
        this.highlightedVisibleIndex = -1;
        this.hoveredVisibleIndex = -1;
        this.setKeyboardNavigationActive(false);
    }

    private normalize(s: unknown): string {
        return String(s ?? "").toLocaleLowerCase();
    }

    private setInputText(value: string): void {
        this.inputText = value;
        this.input.value = value;
        this.updateSearchUi();
    }

    private resetLocalState(): void {
        this.selectedIndex = null;
        this.selectedExactText = "";
        this.selectedValues = [];
        this.lastQueryApplied = "";
        this.highlightedVisibleIndex = -1;
        this.hoveredVisibleIndex = -1;
        this.setKeyboardNavigationActive(false);
        this.setInputText("");
    }

    private isFilterActive(): boolean {
        return this.inputText.trim().length > 0 || this.selectedExactText.length > 0 || this.selectedValues.length > 0 || this.lastQueryApplied.length > 0;
    }

    private updateSearchUi(): void {
        const hasInput = this.inputText.trim().length > 0;
        const hasFilter = this.isFilterActive();
        const shouldShowClearButton = this.allowMultiSelect || hasInput;

        this.clearButton.classList.toggle("visible", shouldShowClearButton);
        this.clearButton.title = this.allowMultiSelect ? "Limpar busca e selecoes" : "Limpar busca";
        this.clearButton.setAttribute("aria-label", this.clearButton.title);
        this.root.classList.toggle("has-value", hasFilter);
    }

    private clearSelectionAndSearch(): void {
        if (this.debounceHandle !== null) {
            window.clearTimeout(this.debounceHandle);
            this.debounceHandle = null;
        }

        this.resetLocalState();
        this.clearCategoryFilter();
        this.renderList("");
    }

    private onSearchInput(): void {
        try {
            const query = this.input.value;
            this.setInputText(query);
            this.highlightedVisibleIndex = -1;
            this.hoveredVisibleIndex = -1;
            this.setKeyboardNavigationActive(false);
            this.openDropdown();
            this.renderList(query);
            if (!this.allowMultiSelect) {
                this.scheduleApplyQuery(query);
            }
        } catch (error) {
            console.error("[CustomSlicer] Error in search input:", error);
        }
    }

    private setKeyboardNavigationActive(active: boolean): void {
        this.keyboardNavigationActive = active;
        this.root.classList.toggle("keyboard-nav-active", active);
        if (active) {
            this.hoveredVisibleIndex = -1;
        }
    }

    private setHoveredVisibleIndex(index: number): void {
        if (this.keyboardNavigationActive) {
            this.setKeyboardNavigationActive(false);
        }

        if (this.hoveredVisibleIndex === index) {
            return;
        }

        this.hoveredVisibleIndex = index;
        this.renderList(this.input.value);
    }

    private moveHighlightedItem(direction: number): void {
        if (this.dropdown.classList.contains("hidden")) {
            this.openDropdown();
            this.renderList(this.input.value);
        }

        if (this.visibleItemIndices.length === 0) {
            return;
        }

        const lastVisibleIndex = this.visibleItemIndices.length - 1;

        if (this.highlightedVisibleIndex < 0 || this.highlightedVisibleIndex > lastVisibleIndex) {
            let selectedVisibleIndex = this.selectedIndex !== null
                ? this.visibleItemIndices.indexOf(this.selectedIndex)
                : -1;

            if (selectedVisibleIndex < 0 && this.allowMultiSelect && this.categoryCol) {
                for (let i = 0; i < this.visibleItemIndices.length; i++) {
                    if (this.hasSelectedValue(this.categoryCol.values[this.visibleItemIndices[i]])) {
                        selectedVisibleIndex = i;
                        break;
                    }
                }
            }

            this.highlightedVisibleIndex = selectedVisibleIndex >= 0
                ? selectedVisibleIndex
                : (direction > 0 ? 0 : lastVisibleIndex);
        } else {
            let nextVisibleIndex = this.highlightedVisibleIndex + direction;

            if (nextVisibleIndex < 0) {
                nextVisibleIndex = lastVisibleIndex;
            } else if (nextVisibleIndex > lastVisibleIndex) {
                nextVisibleIndex = 0;
            }

            this.highlightedVisibleIndex = nextVisibleIndex;
        }

        this.setKeyboardNavigationActive(true);
        this.renderList(this.input.value);
        this.scrollHighlightedItemIntoView();
    }

    private scrollHighlightedItemIntoView(): void {
        const highlightedItem = this.list.querySelector(".slicer-item.keyboard-active") as HTMLElement | null;

        if (highlightedItem) {
            highlightedItem.scrollIntoView({ block: "nearest" });
        }
    }

    private selectHighlightedItem(): boolean {
        if (!this.categoryCol) {
            return false;
        }

        if (!this.keyboardNavigationActive) {
            return false;
        }

        if (this.highlightedVisibleIndex < 0 || this.highlightedVisibleIndex >= this.visibleItemIndices.length) {
            return false;
        }

        const categoryIndex = this.visibleItemIndices[this.highlightedVisibleIndex];
        const values = this.categoryCol.values || [];
        const text = String(values[categoryIndex]);
        const normalized = this.categoryText[categoryIndex] ?? this.normalize(text);

        if (this.allowMultiSelect) {
            this.toggleMultiSelectedValue(categoryIndex);
            return true;
        }

        if (this.selectedExactText === normalized) {
            this.selectedIndex = categoryIndex;
            this.setInputText(text);
            this.lastQueryApplied = normalized;
            this.closeDropdown();
            return true;
        }

        this.setInputText(text);
        this.onSelect(this.categoryCol, categoryIndex);
        this.closeDropdown();
        return true;
    }

    private scheduleApplyQuery(queryRaw: string): void {
        try {
            const query = queryRaw.trim();
            if (this.debounceHandle !== null) {
                window.clearTimeout(this.debounceHandle);
            }
            this.debounceHandle = window.setTimeout(() => {
                this.debounceHandle = null;
                this.applyQuery(query);
            }, this.debounceMs);
        } catch (error) {
            console.error("[CustomSlicer] Error scheduling query:", error);
        }
    }

    private applyQuery(query: string): void {
        try {
            if (!this.categoryCol) return;
            if (query === this.lastQueryApplied) return;
            this.lastQueryApplied = query;

            if (query.length === 0) {
                if (this.allowMultiSelect && this.selectedValues.length > 0) {
                    return;
                }

                this.selectedIndex = null;
                this.selectedExactText = "";
                this.selectedValues = [];
                this.clearCategoryFilter();
                this.setInputText("");
                return;
            }

            const q = query.toLocaleLowerCase();
            const matchingCategoryValues: unknown[] = [];

            for (let i = 0; i < this.categoryText.length; i++) {
                if (this.categoryText[i].indexOf(q) !== -1) {
                    matchingCategoryValues.push(this.categoryCol.values[i]);
                    if (matchingCategoryValues.length >= this.maxMatchesToSelect) break;
                }
            }

            if (matchingCategoryValues.length === 0) {
                // Sem matches: mantém o estado atual do relatório.
                return;
            }

            // Filtro real no host para responder a slicers/botoes nativos do Power BI.
            this.selectedIndex = null;
            this.selectedExactText = "";
            this.selectedValues = [];
            this.applyCategoryFilter(matchingCategoryValues);
        } catch (error) {
            console.error("[CustomSlicer] Error applying query:", error);
        }
    }

    private applyEnterQuery(queryRaw: string): boolean {
        try {
            if (!this.categoryCol) return true;

            if (this.debounceHandle !== null) {
                window.clearTimeout(this.debounceHandle);
                this.debounceHandle = null;
            }

            const query = queryRaw.trim();
            if (query.length === 0) {
                this.selectedIndex = null;
                this.selectedExactText = "";
                this.selectedValues = [];
                this.clearCategoryFilter();
                this.lastQueryApplied = "";
                this.setInputText("");
                return true;
            }

            if (this.allowMultiSelect) {
                for (let i = 0; i < this.categoryText.length; i++) {
                    if (this.categoryText[i].indexOf(query.toLocaleLowerCase()) !== -1) {
                        this.toggleMultiSelectedValue(i);
                        return false;
                    }
                }

                return false;
            }

            this.setInputText(queryRaw);
            this.applyQuery(query);
            return true;
        } catch (error) {
            console.error("[CustomSlicer] Error applying Enter query:", error);
            return true;
        }
    }

    private renderList(queryRaw: string): void {
        const query = queryRaw.trim().toLocaleLowerCase();
        const values = this.categoryCol?.values || [];

        this.list.replaceChildren();
        this.visibleItemIndices = [];

        if (!this.categoryCol || values.length === 0) {
            this.highlightedVisibleIndex = -1;
            this.hoveredVisibleIndex = -1;

            const empty = document.createElement("div");
            empty.className = "slicer-empty";

            const emptyTitle = document.createElement("div");
            emptyTitle.className = "slicer-empty-title";
            emptyTitle.textContent = "Nenhum valor disponivel";

            const emptyHint = document.createElement("div");
            emptyHint.className = "slicer-empty-hint";
            emptyHint.textContent = "Adicione uma categoria para preencher este filtro.";

            empty.appendChild(emptyTitle);
            empty.appendChild(emptyHint);
            this.list.appendChild(empty);
            return;
        }

        let rendered = 0;
        const maxRender = 500;

        for (let i = 0; i < values.length; i++) {
            const text = String(values[i]);
            const normalized = this.categoryText[i] ?? this.normalize(text);
            const isSelected = this.allowMultiSelect
                ? this.hasSelectedValue(values[i])
                : this.selectedExactText === normalized;

            if (query.length > 0 && normalized.indexOf(query) === -1) continue;

            const visiblePosition = this.visibleItemIndices.length;
            this.visibleItemIndices.push(i);

            const item = document.createElement("div");
            item.className = "slicer-item";
            item.setAttribute("data-visible-index", String(visiblePosition));
            const selectedOnly = isSelected
                && !this.keyboardNavigationActive
                && this.hoveredVisibleIndex === -1;
            if (selectedOnly) {
                item.classList.add("active");
            }
            if (this.highlightedVisibleIndex === visiblePosition) {
                if (this.keyboardNavigationActive) {
                    item.classList.add("keyboard-active");
                }
            }
            if (this.hoveredVisibleIndex === visiblePosition) {
                item.classList.add("mouse-active");
            }

            const content = document.createElement("span");
            content.className = "slicer-item-content";

            if (this.allowMultiSelect) {
                const checkbox = document.createElement("span");
                checkbox.className = "slicer-item-checkbox";
                checkbox.setAttribute("aria-hidden", "true");
                if (isSelected) {
                    checkbox.classList.add("checked");
                }
                content.appendChild(checkbox);
            }

            const label = document.createElement("span");
            label.className = "slicer-item-label";
            label.textContent = text;

            content.appendChild(label);
            item.appendChild(content);
            item.onclick = () => {
                if (this.allowMultiSelect) {
                    this.toggleMultiSelectedValue(i);
                    return;
                }

                if (this.selectedExactText === normalized) {
                    // Repetir clique no item já selecionado não deve alternar/limpar o campo.
                    this.selectedIndex = i;
                    this.setInputText(text);
                    this.lastQueryApplied = normalized;
                    this.closeDropdown();
                    return;
                }

                // Clique aplica filtro pelo valor exato clicado.
                this.setInputText(text);
                if (this.categoryCol) {
                    this.onSelect(this.categoryCol, i);
                }
                this.closeDropdown();
            };
            this.list.appendChild(item);
            rendered++;
            if (rendered >= maxRender) break;
        }

        if (rendered === 0) {
            this.highlightedVisibleIndex = -1;
            const empty = document.createElement("div");
            empty.className = "slicer-empty";

            const emptyTitle = document.createElement("div");
            emptyTitle.className = "slicer-empty-title";
            emptyTitle.textContent = "Nenhum resultado";

            const emptyHint = document.createElement("div");
            emptyHint.className = "slicer-empty-hint";
            emptyHint.textContent = "Tente outro termo de busca ou limpe o filtro atual.";

            empty.appendChild(emptyTitle);
            empty.appendChild(emptyHint);
            this.list.appendChild(empty);
        }
    }

    public update(options: VisualUpdateOptions) {
        const dataView = options.dataViews[0];
        if (!dataView) return;

        this.fontSizePx = Visual.getObjectValue<number>(
            dataView.metadata?.objects,
            "general",
            "fontSize",
            12
        );

        this.inputHeightPx = Visual.getObjectValue<number>(
            dataView.metadata?.objects,
            "general",
            "inputHeight",
            36
        );

        this.inputBorderWidthPx = Visual.getObjectValue<number>(
            dataView.metadata?.objects,
            "general",
            "inputBorderWidth",
            1
        );

        this.inputBorderRadiusPx = Visual.getObjectValue<number>(
            dataView.metadata?.objects,
            "general",
            "inputBorderRadius",
            8
        );

        this.allowMultiSelect = Visual.getObjectValue<boolean>(
            dataView.metadata?.objects,
            "general",
            "allowMultiSelect",
            false
        );

        this.showSearchIcon = Visual.getObjectValue<boolean>(
            dataView.metadata?.objects,
            "general",
            "showSearchIcon",
            true
        );

        this.searchPlaceholder = Visual.getObjectValue<string>(
            dataView.metadata?.objects,
            "general",
            "searchPlaceholder",
            "Buscar valor"
        );

        this.searchFontFamily = Visual.getObjectValue<string>(
            dataView.metadata?.objects,
            "general",
            "searchFontFamily",
            "Segoe UI"
        );

        this.dropdownFontFamily = Visual.getObjectValue<string>(
            dataView.metadata?.objects,
            "general",
            "dropdownFontFamily",
            "Segoe UI"
        );

        this.focusBorderColor = Visual.getColorValue(
            dataView.metadata?.objects,
            "general",
            "focusBorderColor",
            "#7aa7ff"
        );

        this.hoverColor = Visual.getColorValue(
            dataView.metadata?.objects,
            "general",
            "hoverColor",
            "#eef3fb"
        );

        this.hoverOpacityPct = Visual.getObjectValue<number>(
            dataView.metadata?.objects,
            "general",
            "hoverOpacity",
            100
        );

        this.searchLabelColor = Visual.getColorValue(
            dataView.metadata?.objects,
            "general",
            "searchLabelColor",
            "#1f2937"
        );

        const hoverAlpha = Math.max(0, Math.min(100, this.hoverOpacityPct)) / 100;
        const inputHeight = Math.max(25, this.inputHeightPx);
        const inputBorderWidth = Math.max(0, this.inputBorderWidthPx);
        const inputBorderRadius = Math.max(0, this.inputBorderRadiusPx);

        this.root.style.fontSize = `${this.fontSizePx}px`;
        this.root.style.setProperty("--search-font-family", this.searchFontFamily || "Segoe UI");
        this.root.style.setProperty("--dropdown-font-family", this.dropdownFontFamily || "Segoe UI");
        this.root.style.setProperty("--focus-border-color", this.focusBorderColor);
        this.root.style.setProperty("--focus-ring-color", this.toRgba(this.focusBorderColor, 0.25));
        this.root.style.setProperty("--hover-bg-color", this.toRgba(this.hoverColor, hoverAlpha));
        this.root.style.setProperty("--search-label-color", this.searchLabelColor);
        this.root.style.setProperty("--input-height", `${inputHeight}px`);
        this.root.style.setProperty("--input-border-width", `${inputBorderWidth}px`);
        this.root.style.setProperty("--input-border-radius", `${inputBorderRadius}px`);

        this.root.classList.toggle("no-search-icon", !this.showSearchIcon);
        this.input.placeholder = this.searchPlaceholder || "Buscar valor";

        this.categoryCol = dataView.categorical?.categories?.[0] ?? null;
        const values = this.categoryCol?.values || [];
        this.categoryText = values.map(v => this.normalize(v));
        this.syncVisualStateWithHost(options);
        this.input.value = this.inputText;
        this.updateSearchUi();

        // Re-render lista com o texto atual (mantém UX ao atualizar).
        this.renderList(this.inputText);
    }

    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions
    ): VisualObjectInstance[] {
        if (options.objectName === "general") {
            return [
                {
                    objectName: "general",
                    properties: {
                        fontSize: this.fontSizePx,
                        inputHeight: Math.max(25, this.inputHeightPx),
                        inputBorderWidth: Math.max(0, this.inputBorderWidthPx),
                        inputBorderRadius: Math.max(0, this.inputBorderRadiusPx),
                        allowMultiSelect: this.allowMultiSelect,
                        showSearchIcon: this.showSearchIcon,
                        searchPlaceholder: this.searchPlaceholder,
                        searchFontFamily: this.searchFontFamily,
                        dropdownFontFamily: this.dropdownFontFamily,
                        focusBorderColor: {
                            solid: {
                                color: this.focusBorderColor
                            }
                        },
                        hoverColor: {
                            solid: {
                                color: this.hoverColor
                            }
                        },
                        searchLabelColor: {
                            solid: {
                                color: this.searchLabelColor
                            }
                        },
                        hoverOpacity: this.hoverOpacityPct
                    },
                    selector: null
                }
            ];
        }

        return [];
    }

    public getFormattingModel(): FormattingModel {
        const fontSizeSlice: FormattingSlice = {
            uid: "general_fontSize",
            displayName: "Tamanho da fonte",
            control: {
                type: FormattingComponent.NumUpDown,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "fontSize"
                    },
                    value: this.fontSizePx,
                    options: {
                        minValue: { type: ValidatorType.Min, value: 8 },
                        maxValue: { type: ValidatorType.Max, value: 30 }
                    }
                }
            }
        };

        const searchFontFamilySlice: FormattingSlice = {
            uid: "general_searchFontFamily",
            displayName: "Fonte da busca",
            control: {
                type: FormattingComponent.FontPicker,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "searchFontFamily"
                    },
                    value: this.searchFontFamily
                }
            }
        };

        const allowMultiSelectSlice: FormattingSlice = {
            uid: "general_allowMultiSelect",
            displayName: "Permitir multisseleção",
            control: {
                type: FormattingComponent.ToggleSwitch,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "allowMultiSelect"
                    },
                    value: this.allowMultiSelect
                }
            }
        };

        const showSearchIconSlice: FormattingSlice = {
            uid: "general_showSearchIcon",
            displayName: "Mostrar lupa",
            control: {
                type: FormattingComponent.ToggleSwitch,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "showSearchIcon"
                    },
                    value: this.showSearchIcon
                }
            }
        };

        const searchPlaceholderSlice: FormattingSlice = {
            uid: "general_searchPlaceholder",
            displayName: "Texto da busca",
            control: {
                type: FormattingComponent.TextInput,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "searchPlaceholder"
                    },
                    placeholder: "Ex.: Buscar loja",
                    value: this.searchPlaceholder
                }
            }
        };

        const dropdownFontFamilySlice: FormattingSlice = {
            uid: "general_dropdownFontFamily",
            displayName: "Fonte do dropdown",
            control: {
                type: FormattingComponent.FontPicker,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "dropdownFontFamily"
                    },
                    value: this.dropdownFontFamily
                }
            }
        };

        const inputHeightSlice: FormattingSlice = {
            uid: "general_inputHeight",
            displayName: "Altura do campo",
            control: {
                type: FormattingComponent.Slider,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "inputHeight"
                    },
                    value: Math.max(25, this.inputHeightPx),
                    options: {
                        minValue: { type: ValidatorType.Min, value: 25 },
                        maxValue: { type: ValidatorType.Max, value: 120 }
                    }
                }
            }
        };

        const inputBorderWidthSlice: FormattingSlice = {
            uid: "general_inputBorderWidth",
            displayName: "Espessura da borda",
            control: {
                type: FormattingComponent.Slider,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "inputBorderWidth"
                    },
                    value: Math.max(0, this.inputBorderWidthPx),
                    options: {
                        minValue: { type: ValidatorType.Min, value: 0 },
                        maxValue: { type: ValidatorType.Max, value: 10 }
                    }
                }
            }
        };

        const inputBorderRadiusSlice: FormattingSlice = {
            uid: "general_inputBorderRadius",
            displayName: "Raio dos cantos",
            control: {
                type: FormattingComponent.Slider,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "inputBorderRadius"
                    },
                    value: Math.max(0, this.inputBorderRadiusPx),
                    options: {
                        minValue: { type: ValidatorType.Min, value: 0 },
                        maxValue: { type: ValidatorType.Max, value: 40 }
                    }
                }
            }
        };

        const focusBorderColorSlice: FormattingSlice = {
            uid: "general_focusBorderColor",
            displayName: "Cor do contorno (foco)",
            control: {
                type: FormattingComponent.ColorPicker,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "focusBorderColor"
                    },
                    value: {
                        value: this.focusBorderColor
                    }
                }
            }
        };

        const hoverColorSlice: FormattingSlice = {
            uid: "general_hoverColor",
            displayName: "Cor do hover",
            control: {
                type: FormattingComponent.ColorPicker,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "hoverColor"
                    },
                    value: {
                        value: this.hoverColor
                    }
                }
            }
        };

        const searchLabelColorSlice: FormattingSlice = {
            uid: "general_searchLabelColor",
            displayName: "Cor da label de busca",
            control: {
                type: FormattingComponent.ColorPicker,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "searchLabelColor"
                    },
                    value: {
                        value: this.searchLabelColor
                    }
                }
            }
        };

        const hoverOpacitySlice: FormattingSlice = {
            uid: "general_hoverOpacity",
            displayName: "Opacidade do hover",
            control: {
                type: FormattingComponent.NumUpDown,
                properties: {
                    descriptor: {
                        objectName: "general",
                        propertyName: "hoverOpacity"
                    },
                    value: this.hoverOpacityPct,
                    options: {
                        minValue: { type: ValidatorType.Min, value: 0 },
                        maxValue: { type: ValidatorType.Max, value: 100 }
                    }
                }
            }
        };

        const generalGroup: FormattingGroup = {
            uid: "general_group",
            displayName: "Geral",
            slices: [
                fontSizeSlice,
                inputHeightSlice,
                inputBorderWidthSlice,
                inputBorderRadiusSlice,
                allowMultiSelectSlice,
                showSearchIconSlice,
                searchPlaceholderSlice,
                searchFontFamilySlice,
                dropdownFontFamilySlice,
                focusBorderColorSlice,
                hoverColorSlice,
                searchLabelColorSlice,
                hoverOpacitySlice
            ]
        };

        const generalCard: FormattingCard = {
            uid: "general_card",
            displayName: "Geral",
            groups: [generalGroup]
        };

        return {
            cards: [generalCard]
        };
    }

    public destroy(): void {
        document.removeEventListener("mousedown", this.onDocumentOutsideClick, true);
        document.removeEventListener("touchstart", this.onDocumentOutsideClick, true);
        window.removeEventListener("blur", this.onWindowBlur);
        if (this.debounceHandle !== null) {
            window.clearTimeout(this.debounceHandle);
            this.debounceHandle = null;
        }
    }
}
