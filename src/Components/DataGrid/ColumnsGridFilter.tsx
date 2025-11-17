import React from 'react';
import { Button, CheckBox, Popover, TagBox, TextBox } from "devextreme-react";
import { t } from "i18next";
import { FilterIcon } from "lucide-react";
import { useState } from "react";

const ColumnsGridFilter = ({
  columns,
  columnsFromGrid,
  getDistinctValues,
  getLocalizedColumnName,
  selectedColumns,
  handleColumnSelect,
  onSelectFilterValue,
  columnFilters,
  filtersValue,
  id = null,
  handleResetFilters,
  onTagBoxFilterSelect,
  showColumnSelector,
  setShowColumnSelector,
  activeColumn,
  setActiveColumn,
}: any) => {
  const columnSelectorContent = () => (
    <div className="p-3">
      {columnsFromGrid.map((column) => {
        if (getDistinctValues(column).length === 0) return;
        return (
          <div key={column.dataField} className="mb-2">
            <CheckBox
              text={getLocalizedColumnName(column.caption)}
              value={selectedColumns.has(column.dataField)}
              onValueChanged={(e) => handleColumnSelect(column.dataField, e.value)}
            />
          </div>
        );
      })}
      {/* {columns.map((column) => {
        if (getDistinctValues(column).length === 0) return;
        return (
          <div key={column} className="mb-2">
            <CheckBox
              text={getLocalizedColumnName(column)}
              value={selectedColumns.has(column)}
              onValueChanged={(e) => handleColumnSelect(column, e.value)}
            />
          </div>
        );
      })} */}
    </div>
  );
  // const [activeColumn, setActiveColumn] = useState<string | null>(null);
  // const [showColumnSelector, setShowColumnSelector] = useState(false);
  // const data

  const [textFilter, setTextFilter] = useState<string>("");

  return (
    <div className="custom-grid-filter-container gap-2">
      <Popover
        showEvent="click"
        target={`#column-selector-button-${id}`}
        position="bottom"
        visible={showColumnSelector}
        onHiding={() => setShowColumnSelector(false)}
      >
        {columnSelectorContent()}
      </Popover>
      <Button
        id={`column-selector-button-${id}`}
        className="custom-selector-button"
        onClick={() => setShowColumnSelector(!showColumnSelector)}
      >
        <span className="selected-columns-length">{selectedColumns.size}</span>
        <span className="seperator"></span>
        <span className="filter-icon">
          {" "}
          <FilterIcon className="size-5" />{" "}
        </span>
      </Button>

      {Array.from(selectedColumns).map((column) => {
        const values = getDistinctValues(column);
        // const valuesKeys = values.map((i: string) => ({ id: i, name: i }));
        // const currentFilter = columnFilters.find((f) => f.field === column);
        const filteredValues = values.filter((i) => {
          // Ensure i is not null or undefined
          if (i === null || i === undefined) return false;
          const strValue = String(i).toLowerCase().trim();
          if (textFilter) {
            return strValue.includes(textFilter.toLowerCase().trim());
          }
          return true;
        });
        const currentValues: string[] =
          (filtersValue as Record<string, string[]>)[column] || [];
        
        const filterName = columnsFromGrid.find((c) => c.dataField === column)?.caption;
        return (
          <div key={column} className="custom-filter-button cursor-pointer">
            {/* <Button
              id={`value-selector-button-${column}`}
              text={getLocalizedColumnName(column)}
              onClick={() =>
                setActiveColumn(column === activeColumn ? null : column)
              }
            /> */}
            <button
              onClick={() =>
                setActiveColumn(column === activeColumn ? null : column)
              }
              id={`value-selector-button-${column}`}
              className=" dark:text-white cursor-pointer mx-auto w-full "
            >
              {getLocalizedColumnName(filterName)}
            </button>
            {/* <TagBox
              value={currentValues}
              label={getLocalizedColumnName(column)}
              labelMode="floating"
              dataSource={valuesKeys}
              showSelectionControls={true}
              maxDisplayedTags={1}
              width={150}
              searchEnabled={true}
              multiline={true}
              applyValueMode="useButtons"
              dropDownOptions={{ width: "auto" }}
              valueExpr="id"
              displayExpr="name"
              onValueChanged={(e) => {
                onTagBoxFilterSelect(column, e.value);
              }}
            /> */}

            {activeColumn === column && (
              <Popover
                showEvent="click"
                target={`#value-selector-button-${column}`}
                position="bottom"
                className="custom-selector-popover"
                visible={activeColumn === column}
                onHiding={() => setActiveColumn(null)}
              >
                <div className="p-3">
                  <span className="text-sm font-bold mb-3 dark:text-white">
                    {/* {t(column as string)} */}
                    {getLocalizedColumnName(filterName)}
                  </span>
                  <div className="mb-3">
                    <input
                      value={textFilter || ""}
                      onChange={(e) => setTextFilter(e.target.value ?? "")}
                      className="w-fill p-2 outline-none rounded-[12px] border border-gray-300 dark:border-gray-600 dark:bg-[#1e293b] dark:text-white"
                      placeholder={t("search")}
                    />
                  </div>
                  {filteredValues.map((value) => (
                    <div key={value} className="mb-2">
                      <CheckBox
                        text={String(value)}
                        // value={currentFilter?.values.has(value) || false}
                        value={currentValues.includes(value) || false}
                        onValueChanged={(e) => {
                          // handleValueSelect(column, value, e.value);
                          // applyFilters();
                          onSelectFilterValue(column, value);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </Popover>
            )}
          </div>
        );
      })}
      <Button
        icon="revert"
        className="revert-filters-button"
        hint={t("resetFilters")}
        onClick={handleResetFilters}
        stylingMode="text"
      />
    </div>
  );
};

export default ColumnsGridFilter;