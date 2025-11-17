import {
  FC,
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver";
import { exportDataGrid } from "devextreme/excel_exporter";
import { Button } from "devextreme-react/button";
import { jsPDF } from "jspdf";
import DataGrid, {
  ColumnFixing,
  IDataGridOptions,
  Pager,
  Paging,
  SearchPanel,
  Sorting,
  Texts,
  Export,
  MasterDetail,
  Toolbar,
  Item,
  ColumnChooser,
  Position,
  ColumnChooserSelection,
  Summary,
  TotalItem,
  GroupItem,
  Scrolling,
  FilterRow, // Restored Import
  HeaderFilter, // Restored Import
} from "devextreme-react/data-grid";
import { t } from "i18next";
import { exportDataGrid as exportDataGridToPdf } from "devextreme/pdf_exporter";
import { GetCurrentLanguageFromLocalStorage } from "../../Services/GetDataFromLocalStorage";
import { NOTO_FONT_BASE64 } from "../../assets/fonts/fonts";
import { SearchIcon } from "../../assets/icons/SearchIcon";
import StickyBar from "../stickyBar/StickyBar";
import ColumnsGridFilter from "./ColumnsGridFilter";
import useFilter from "./useFilter";
import "./style.css";
import CustomColumnChooser from "./CustomColumnChooser";
import React from "react";
import ServerPagin from "./ServerPagin";

interface specialBtn {
  shouldShow: boolean;
  btn: React.ReactNode;
}
interface IProps {
  isSubAndHideOptions?: boolean;
  disableDefaultOptions?: boolean;
  fileTitle?: string;
  addBtnOnClick?: any;
  editBtnOnClick?: any;
  deleteBtnOnClick?: any;
  hideActions?: boolean;
  masterDetail?: any;
  enableGridFilter?: boolean;
  columnCaptions?: Record<string, string>;
  excludedColumnsForFilter?: string[]; // New prop for custom excluded columns
  hideGridAddEditDelete?: any;
  shouldShowPaging?: boolean;
  servePaging?: boolean;
  showSearchOnly?: boolean;
  customToolbarItems?: React.ReactNode[];
  id?: null | string | number;
  showSummary?: boolean;
  summaryColumns?: Array<{
    column: string;
    summaryType: string;
    valueFormat?: string;
    displayFormat?: string;
  }>;
  groupSummaryColumns?: Array<{
    column: string;
    summaryType: string;
    valueFormat?: string;
    displayFormat?: string;
  }>;
  shouldShowStickyBar?: boolean; //for sticky bar
  shouldShowLength?: boolean; //for sticky bar
  selectedRowKeys?: (number | string)[] | null; //for sticky bar
  specialRequiredForOpen?: boolean | null; //for sticky bar
  actionBtns?: React.ReactNode[]; //for sticky bar
  specialBtns?: specialBtn[]; //for sticky bar
  showAddButton?: boolean; // تحكم في ظهور زر الإضافة
  maxHeightEnabled?: boolean; // to show max grid = 80vh
  hideAllActions?: boolean; // to Hide All Actions
  subRef?: null | React.Ref<DataGridComponentRef>;
  subRefTitle?: null | string;
  enableVirtualization?: boolean;
  showBorders?: boolean;
  allowedPageSizes?: (number | string)[];
}

export interface DataGridComponentRef {
  element: () => HTMLElement | null;
  instance: () => any;
  getInstance: () => any;
}

const DataGridComponent = forwardRef<
  DataGridComponentRef,
  IDataGridOptions & IProps & any
>(
  (
    {
      children,
      isSubAndHideOptions = false,
      disableDefaultOptions: disableAllOptions,
      fileTitle: fileTitle,
      addBtnOnClick,
      editBtnOnClick,
      deleteBtnOnClick,
      saveBtnOnClick,
      hideActions = false,
      showSearchOnly = false,
      hideGridAddEditDelete = false,
      masterDetail,
      enableGridFilter = true,
      columnCaptions = {},
      filterColumns = [],
      dataSource,
      shouldShowPaging = true,
      servePaging = false,
      customToolbarItems = [],
      id = null,
      showSummary = true,
      summaryColumns = [],
      groupSummaryColumns = [],
      shouldShowStickyBar = false, // Controls visibility of sticky action bar
      selectedRowKeys = null, // Array of selected row keys for sticky action bar
      specialRequiredForOpen = null, // Special condition for opening actions
      shouldShowLength = true, // Controls visibility of selected items count
      actionBtns = [], // Array of action buttons to display in sticky bar
      specialBtns = [], // Array of special buttons with conditional visibility
      excludedColumnsForFilter = [],
      showAddButton = true, // تحكم في ظهور زر الإضافة
      maxHeightEnabled = false, // to show max grid = 80vh
      hideAllActions = false,
      subRef = null,
      subRefTitle = null,
      allowedPageSizes = [10, 20, 30, 40, 50],
      defaultPageSize = 50,
      enableVirtualization = false,
      showBorders = false,
      totalPages = 0,
      handelServerPagginChange,
      ...rest
    },
    ref
  ) => {
    const lang = GetCurrentLanguageFromLocalStorage();
    const [filteredData, setFilteredData] = useState(dataSource);
    const [showSearch, setShowSearch] = useState(false);
    const exportFormats = ["xlsx", "pdf"];
    const dataGridRef = useRef<any>(null);
    // KEYBOARD LISTENER FOR HORIZONTAL SCROLLING
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // ✅ Bail early if grid not mounted
        if (!dataGridRef.current?.instance()) return;

        // ✅ Skip if user typing inside input/textarea/select
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.tagName === "SELECT");

        if (isInputFocused) return;

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const dataGridInstance = dataGridRef.current.instance();
          const scrollable = dataGridInstance.getScrollable();

          if (scrollable) {
            e.preventDefault();
            const scrollAmount = 100; // pixels per keypress
            const currentScrollLeft = scrollable.scrollLeft();
            const newScrollLeft =
              e.key === "ArrowRight"
                ? currentScrollLeft + scrollAmount
                : currentScrollLeft - scrollAmount;

            scrollable.scrollTo({ left: newScrollLeft });
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      element: () => {
        return dataGridRef.current?.instance().element() || null;
      },
      instance: () => {
        return dataGridRef.current?.instance() || null;
      },
      getInstance: () => {
        return dataGridRef.current;
      },
    }));

    // Sync filteredData with dataSource whenever dataSource changes
    useEffect(() => {
      setFilteredData(dataSource);
    }, [dataSource]);

    // HANDLES KEYBOARD HORIZONTAL SCROLLING
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.tagName === "SELECT");

        if (isInputFocused) {
          return;
        }

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const dataGridInstance = dataGridRef.current?.instance();
          if (dataGridInstance) {
            const scrollable = dataGridInstance.getScrollable();
            if (scrollable) {
              e.preventDefault();
              const scrollAmount = 100;
              const currentScrollLeft = scrollable.scrollLeft();
              const newScrollLeft =
                e.key === "ArrowRight"
                  ? currentScrollLeft + scrollAmount
                  : currentScrollLeft - scrollAmount;

              scrollable.scrollTo({ left: newScrollLeft });
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, []);
    const onExporting = useCallback(async (e: any) => {
      try {
        if (e.format === "xlsx") {
          const workbook = new Workbook();
          const worksheet = workbook.addWorksheet("Main sheet");
          const isActionsCell = (gridCell: any) => {
            return (
              gridCell?.column?.name === "actions" ||
              (gridCell?.column?.caption === t("actions") &&
                gridCell?.rowType === "header")
            );
          };
          // Export Main Grid
          await exportDataGrid({
            component: e.component,
            worksheet,
            autoFilterEnabled: true,
            customizeCell: (options: any) => {
              const { gridCell, excelCell } = options;
              if (gridCell && gridCell.column && isActionsCell(gridCell)) {
                excelCell.value = undefined;
                excelCell.style = {
                  fill: { type: "pattern", pattern: "none" },
                };
                excelCell.hidden = true;
              }
            },
          });
          // Export sub grid if it has value
          if (subRef?.current?.instance()) {
            const mainRowCount = e.component.getVisibleRows().length;
            const mainColumnsCount = e.component.getVisibleColumns().length;

            // Add Title
            const titleRow = mainRowCount + 4;
            worksheet.mergeCells(titleRow, 1, titleRow, mainColumnsCount);
            const cell = worksheet.getCell(titleRow, 1);
            cell.value = subRefTitle || t("infoSummary");
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.font = { bold: true, size: 12 };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFDDEBF7" },
            };

            // start Exporting Sub grid
            await exportDataGrid({
              component: subRef?.current?.instance(),
              worksheet,
              topLeftCell: { row: titleRow + 1, column: 2 },
              autoFilterEnabled: true,
              customizeCell: (options: any) => {
                const { gridCell, excelCell } = options;
                if (gridCell && gridCell.column && isActionsCell(gridCell)) {
                  excelCell.value = undefined;
                  excelCell.style = {
                    fill: { type: "pattern", pattern: "none" },
                  };
                  excelCell.hidden = true;
                }
              },
            });
          }

          // Save the file
          const buffer = await workbook.xlsx.writeBuffer();
          saveAs(
            new Blob([buffer], { type: "application/octet-stream" }),
            fileTitle ? `${fileTitle}.xlsx` : "CorGate.xlsx"
          );
        } else if (e.format === "pdf") {
          const doc = new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: "a4",
            putOnlyUsedFonts: true,
            floatPrecision: 16,
          });

          const dataGrid = e.component;
          doc.addFileToVFS("Noto.ttf", NOTO_FONT_BASE64);
          doc.addFont("Noto.ttf", "Noto", "normal");
          doc.setFont("Noto");
          doc.setLanguage("ar");

          // Configure PDF export options for better column widths
          dataGrid.option("export.pdf", {
            landscape: true,
            printingEnabled: true,
            pageSize: "A4",
            autoTableOptions: {
              theme: "grid",
              styles: {
                overflow: "linebreak",
                fontSize: 8,
                cellPadding: 2,
              },
              columnStyles: {
                overflow: "linebreak",
              },
              margin: { top: 15, right: 15, bottom: 15, left: 15 },
            },
          });

          // Before exporting, temporarily hide the actions column
          const actionsColumn = dataGrid.columnOption("actions");
          let actionsColumnVisible = false;

          if (actionsColumn) {
            actionsColumnVisible = actionsColumn.visible;
            dataGrid.columnOption("actions", "visible", false);
          }

          // Save current column widths
          const columnWidths: Record<string, number> = {};
          const visibleColumns = dataGrid.getVisibleColumns();
          visibleColumns.forEach((column: any) => {
            if (column.name !== "actions" && column.dataField) {
              columnWidths[column.dataField] =
                column.width || column.visibleWidth || 100;
            }
          });

          await exportDataGridToPdf({
            jsPDFDocument: doc,
            component: dataGrid,
            indent: 2,
            margin: {
              top: 15,
              left: 15,
              right: 15,
              bottom: 15,
            },
            customDrawCell({ gridCell, pdfCell }) {
              if (pdfCell) {
                doc.setFont("Noto");
                pdfCell.padding = { top: 2, left: 2, right: 2, bottom: 2 };
              }
              return { drawOnlyText: true };
            },
            customizeCell(options: any) {
              const { pdfCell, gridCell } = options;
              if (pdfCell) {
                pdfCell.font = { size: 8 };

                // Set proper width for each column
                if (
                  gridCell &&
                  gridCell.column &&
                  gridCell.column.dataField &&
                  columnWidths[gridCell.column.dataField]
                ) {
                  const width = columnWidths[gridCell.column.dataField];
                  pdfCell.width = width;
                }

                // Handle text overflow
                if (pdfCell.text && pdfCell.text.length > 0) {
                  pdfCell.wordWrapEnabled = true;
                }
              }
            },
          });

          // Restore the actions column visibility
          if (actionsColumn) {
            dataGrid.columnOption("actions", "visible", actionsColumnVisible);
          }

          if (subRef?.current?.instance()) {
            doc.addPage();

            await exportDataGridToPdf({
              jsPDFDocument: doc,
              component: subRef.current.instance(),
              topLeft: { x: 15, y: 15 },
              margin: { left: 15, right: 15, bottom: 15 },
              customDrawCell({ pdfCell }) {
                if (pdfCell) {
                  doc.setFont("Noto");
                  pdfCell.padding = { top: 2, left: 2, right: 2, bottom: 2 };
                }
                return { drawOnlyText: true };
              },
              customizeCell({ pdfCell }) {
                if (pdfCell) {
                  pdfCell.font = { size: 8 };
                  pdfCell.wordWrapEnabled = true;
                }
              },
            });
          }

          doc.save(fileTitle ? `${fileTitle}.pdf` : "CorGate.pdf");
        }
      } catch (error) {
        console.error(error);
      }
    }, [fileTitle, subRef, subRefTitle]);

    const onRowRemoving = useCallback(async (e: any) => { }, []);
    const onEditingStart = useCallback(async (e: any) => { }, []);

    const [columnsState, setColumnsState] = useState<
      {
        visible?: boolean | undefined;
        fixed?: boolean;
        dataField?: string | undefined;
        caption?: string;
        position?: string | undefined;
      }[]
      >([]);
    const {
      columns,
      columnsFromGrid,
      getDistinctValues,
      getLocalizedColumnName,
      selectedColumns,
      handleColumnSelect,
      onSelectFilterValue,
      columnFilters,
      filtersValue,
      handleResetFilters,
      onTagBoxFilterSelect,
    } = useFilter(
      filteredData,
      dataSource,
      filterColumns,
      columnCaptions,
      setFilteredData,
      excludedColumnsForFilter,
      columnsState
    );

    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [activeColumn, setActiveColumn] = useState<string | null>(null);
    const memoizedFilterSelector = useMemo(
      () => (
        <ColumnsGridFilter
          setShowColumnSelector={setShowColumnSelector}
          showColumnSelector={showColumnSelector}
          activeColumn={activeColumn}
          setActiveColumn={setActiveColumn}
          //
          onTagBoxFilterSelect={onTagBoxFilterSelect}
          handleResetFilters={handleResetFilters}
          columnFilters={columnFilters}
          filtersValue={filtersValue}
          columnsFromGrid={columnsFromGrid}
          columns={columns}
          onSelectFilterValue={onSelectFilterValue}
          getDistinctValues={getDistinctValues}
          getLocalizedColumnName={getLocalizedColumnName}
          selectedColumns={selectedColumns}
          handleColumnSelect={handleColumnSelect}
          id={id}
        />
      ),
      [
        activeColumn,
        columnFilters,
        columns,
        filtersValue,
        getDistinctValues,
        getLocalizedColumnName,
        handleColumnSelect,
        handleResetFilters,
        id,
        onSelectFilterValue,
        onTagBoxFilterSelect,
        selectedColumns,
        showColumnSelector,
      ]
    );

    const [showCustomChooser, setShowCustomChooser] = useState(false);
    

    const getGridColumns = useCallback(() => {
      if (!dataGridRef.current) return [];

      const grid = dataGridRef.current?.instance();

      // console.log(grid.option("columns"));
      return grid.option("columns");
    }, []);

    useEffect(() => {
      queueMicrotask(() => {
        const cols = getGridColumns();
        if (cols?.length) {
          setColumnsState(cols);
        }
      });
    }, [getGridColumns]);

    const openCustomChooser = () => {
      // const columns = getGridColumns();
      // setColumnsState(columns);
      setShowCustomChooser(!showCustomChooser);
    };

    const updateColumnOption = (
      dataField: string | undefined,
      optionName: string,
      value: any
    ) => {
      if (!dataGridRef.current || !dataGridRef.current.instance) return;

      const grid = dataGridRef.current.instance();
      grid.columnOption(dataField, optionName, value);
    };

    const toggleVisibility = (
      dataField: string | undefined,
      visible: boolean
    ) => {
      updateColumnOption(dataField, "visible", visible);
      setColumnsState((prev) =>
        prev.map((col) =>
          col.dataField === dataField ? { ...col, visible } : col
        )
      );
    };

    const toggleFixed = (
      dataField: string | undefined,
      position: string | undefined | null
    ) => {
      const column = columnsState.find((col) => col.dataField === dataField);
      if (!column) return;

      const newFixed = !column.fixed;
      updateColumnOption(dataField, "fixed", newFixed);
      updateColumnOption(
        dataField,
        "fixedPosition",
        newFixed ? (position as string | undefined) : undefined
      );

      setColumnsState((prev) =>
        prev.map((col) =>
          col.dataField === dataField ? { ...col, fixed: newFixed } : col
        )
      );
    };

    const memoizedCustomColumnChooser = useMemo(
      () => (
        <CustomColumnChooser
          id={id}
          showCustomChooser={showCustomChooser}
          toggleFixed={toggleFixed}
          columnsState={columnsState}
          openCustomChooser={openCustomChooser}
          toggleVisibility={toggleVisibility}
        />
      ),
      [columnsState, showCustomChooser]
    );

    // console.log(getGridColumns())

    return (
      <div className="container-fluid mb-5">
        <div className="row h-full">
          <div
            className={`${hideActions ? "col-md-12" : "col-md-11"
              } p-0 relative`}
          >
            {/* {enableGridFilter && (
            <div className="mb-3 absolute top-0 right-0 z-50 mt-4">
              <GridFilter
                data={dataSource}
                onFilter={setFilteredData}
                columnCaptions={columnCaptions}
              />
            </div>
          )} */}

            <DataGrid
              ref={dataGridRef}
              selectedRowKeys={selectedRowKeys}
              allowColumnReordering={true}
              showBorders={showBorders}
              showRowLines={true}
              showColumnLines={true}
              columnAutoWidth={true}
              repaintChangesOnly={true}
              noDataText={t("noData")}
              rtlEnabled={lang === "ar"}
              onExporting={onExporting}
              onRowRemoving={onRowRemoving}
              onEditingStart={onEditingStart}
              width="100%"
              height="fit"
              className="sticky-header-grid"
              style={{ maxHeight: maxHeightEnabled ? "80vh" : "100%" }}
              // scrolling={{                                       // RESTORED
              //   mode: "standard",                                 // RESTORED
              //   showScrollbar: "onHover",                         // RESTORED
              //   useNative: false,                                 // RESTORED
              //   scrollByContent: true,                            // RESTORED
              //   scrollByThumb: true,                              // RESTORED
              // }}                                                  // RESTORED
              dataSource={enableGridFilter ? filteredData : dataSource}
              {...rest}
            >
              {enableVirtualization && (
                <Scrolling mode="virtual" rowRenderingMode="virtual" />
              )}
              <Sorting mode="multiple" />
              {/* <FilterRow visible={!disableAllOptions} applyFilter={"auto"} /> */}{" "}
              {/* RESTORED */}
              {/* <HeaderFilter visible={!disableAllOptions} /> */}{" "}
              {/* RESTORED */}
              <ColumnFixing enabled={true} />
              {!disableAllOptions && shouldShowPaging && !enableVirtualization && (
                <Paging enabled={true} defaultPageSize={defaultPageSize} />
              )}
              {masterDetail && <MasterDetail {...masterDetail} />}
              {!disableAllOptions && shouldShowPaging && (
                <Pager
                  showPageSizeSelector={true}
                  allowedPageSizes={allowedPageSizes}
                  showNavigationButtons={true}
                  showInfo={true}
                  visible={true}
                  infoText={
                    lang === "ar"
                      ? "الصفحة {0} من {1} ({2} عنصر)"
                      : "Page {0} of {1} ({2} item)"
                  }
                />
              )}
              <Texts
                confirmDeleteMessage={t("confirmDeleteMessage")}
                confirmDeleteTitle={t("delete")}
                cancel={t("cancel")}
                ok={"ok"}
              />
              {!hideAllActions && (
                <>
                  {!isSubAndHideOptions && (
                    <ColumnChooser
                      height="350px"
                      enabled={true}
                      title={t("hideAndShowColumns")}
                      mode="select"
                    >
                      <Position
                        my={{ x: "center", y: "top" }}
                        at={{ x: "center", y: "bottom" }}
                        of=".dx-datagrid-column-chooser-button"
                      />

                      <ColumnChooserSelection
                        // allowSelectAll={true}                      // RESTORED
                        selectByClick={true}
                        recursive={true}
                      />
                    </ColumnChooser>
                  )}
                  {!isSubAndHideOptions && (
                    <SearchPanel
                      visible={!disableAllOptions}
                      width={240}
                      placeholder={t("search")}
                    />
                  )}
                  {!isSubAndHideOptions && (
                    <Export
                      enabled={!disableAllOptions}
                      formats={exportFormats}
                      allowExportSelectedData={true}
                    />
                  )}
                </>
              )}
              {!hideAllActions && (
                <>
                  {!isSubAndHideOptions && !showSearchOnly && (
                    <Toolbar>
                      <Item
                        options={{
                          elementAttr: {
                            "data-permission": "Export",
                          },
                        }}
                        location="after"
                        name="exportButton"
                        cssClass="export-button-item"
                      ></Item>

                      <Item
                        location="after"
                        name="columnChooserButton"
                        cssClass="column-chooser-button-item"
                      >
                        {memoizedCustomColumnChooser}
                      </Item>

                      <Item
                        location="after"
                        name="searchIconButton"
                        cssClass="search-icon-button"
                      >
                        <span
                          onClick={() => {
                            setShowSearch(!showSearch);
                          }}
                          className="cursor-pointer transition-colors rounded-full p-1 hover:bg-[#dbeafe]/50 dark:hover:bg-[#1e293b]/10 dark:text-white text-[#21293b]"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <SearchIcon />
                        </span>
                      </Item>

                      <Item
                        location="after"
                        name="searchPanel"
                        cssClass={`search-panel-item ${showSearch ? "active" : ""
                          }`}
                      />

                      <Item
                        name="applyFilterButton"
                        location="after"
                        cssClass="custom-grid-filter-item "
                      >
                        {enableGridFilter && memoizedFilterSelector}
                      </Item>
                      {/* Add custom toolbar items */}
                      {customToolbarItems.map(
                        (item: React.ReactNode, index: number) => (
                          <Item
                            key={`custom-toolbar-item-${index}`}
                            location="after"
                            cssClass="custom-toolbar-item"
                          >
                            {item}
                          </Item>
                        )
                      )}
                      {!hideActions && !hideGridAddEditDelete && (
                        <Item
                          name="gridAddEditDelete"
                          location="after"
                          cssClass="grid-add-edit-delete"
                        >
                          <div className="page-header-container grid-add-edit-delete flex">
                            {addBtnOnClick &&
                              (typeof showAddButton === "undefined" ||
                                showAddButton) && (
                                <div data-permission="Add">
                                  <Button
                                    icon="search"
                                    onClick={addBtnOnClick}
                                    className="button-with-text"
                                  >
                                    <i className="fa-solid fa-plus mx-1 text-sm" />
                                    <span className="text-[#21293b] dark:text-white">
                                      {t("add")}
                                    </span>
                                  </Button>
                                </div>
                              )}
                            {saveBtnOnClick && (
                              <Button
                                icon="search"
                                onClick={saveBtnOnClick}
                                className="button-with-text"
                              >
                                <i className="fa-solid fa-floppy-disk mx-1"></i>
                                {/* <i className="dx-icon dx-icon-save icon-black" /> */}
                                <span>{t("save")}</span>
                              </Button>
                            )}
                            {/* {editBtnOnClick && (                                             // RESTORED
                      <Button icon="search" onClick={editBtnOnClick} className="button-with-text">
                        <i className="dx-icon dx-icon-edit" />
                        <span>{t("edit")}</span>
                      </Button>
                    )} */}
                            {/* {deleteBtnOnClick && (                                            // RESTORED
                      <Button icon="search" onClick={deleteBtnOnClick} className="button-with-text">
                        <i className="dx-icon dx-icon-trash" />
                        <span>{t("delete")}</span>
                      </Button>
                    )} */}
                          </div>
                        </Item>
                      )}
                    </Toolbar>
                  )}
                  {showSearchOnly && (
                    <Toolbar>
                      <Item
                        location="after"
                        name="searchIconButton"
                        cssClass="search-icon-button"
                      >
                        <span
                          onClick={() => {
                            setShowSearch(!showSearch);
                          }}
                          className="cursor-pointer transition-colors rounded-full p-1 hover:bg-[#dbeafe]/50 dark:hover:bg-[#1e293b]/10 dark:text-white text-[#21293b]"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <SearchIcon />
                        </span>
                      </Item>

                      <Item
                        location="after"
                        name="searchPanel"
                        cssClass={`search-panel-item active`}
                      />
                    </Toolbar>
                  )}
                </>
              )}
              {/* إجماليات الأعمدة الرقمية */}
              {showSummary && (
                <Summary>
                  {/* Group Summaries */}
                  {groupSummaryColumns.length > 0 &&
                    groupSummaryColumns.map(
                      (groupSummaryColumn: any, index: number) => (
                        <GroupItem
                          key={`group-summary-${index}`}
                          column={groupSummaryColumn.column}
                          summaryType={groupSummaryColumn.summaryType}
                          valueFormat={groupSummaryColumn.valueFormat}
                          displayFormat={groupSummaryColumn.displayFormat}
                          showInGroupFooter={true}
                        />
                      )
                    )}

                  {/* Total Summaries */}
                  {summaryColumns.length > 0 ? (
                    summaryColumns.map((summaryColumn: any, index: number) => (
                      <TotalItem
                        key={`summary-${index}`}
                        column={summaryColumn.column}
                        summaryType={summaryColumn.summaryType}
                        valueFormat={summaryColumn.valueFormat}
                        displayFormat={summaryColumn.displayFormat}
                      />
                    ))
                  ) : (
                    <>
                      {/* مجموع الأعمدة الرقمية الشائعة */}
                      <TotalItem
                        column="debit"
                        summaryType="sum"
                        displayFormat={`${t("totals")}: {0}`}
                        valueFormat="fixedPoint"
                      />
                      <TotalItem
                        column="credit"
                        summaryType="sum"
                        displayFormat={`${t("totals")}: {0}`}
                        valueFormat="fixedPoint"
                      />
                      <TotalItem
                        column="balance"
                        summaryType="sum"
                        displayFormat={`${t("totals")}: {0}`}
                        valueFormat="fixedPoint"
                      />
                    </>
                  )}
                </Summary>
              )}
              {children}
            </DataGrid>
          </div>
          {(selectedRowKeys?.length > 0 || specialRequiredForOpen) &&
            shouldShowStickyBar && (
              <StickyBar
                selectedRowKeys={selectedRowKeys}
                actionBtns={actionBtns}
                specialBtns={specialBtns}
                shouldShowLength={shouldShowLength}
              />
            )}
          {servePaging && (
             <ServerPagin handelServerPagginChange={handelServerPagginChange} allowedPageSizes={allowedPageSizes} pageSize={defaultPageSize || 10} totalPages={totalPages}/>
            )}
        </div>
      </div>
    );
  }
);

export default React.memo(DataGridComponent);