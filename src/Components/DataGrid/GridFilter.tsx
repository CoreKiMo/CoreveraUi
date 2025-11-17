import React, { useState, useMemo } from "react";
import { Popover, CheckBox, Button, TextBox } from "devextreme-react";
import { t } from "i18next";
import { FilterIcon } from "../../assets/icons/FilterIcon";

interface GridFilterProps<T> {
  data: T[];
  onFilter: (filteredData: T[]) => void;
  columnCaptions?: Record<string, string>;
  id?: null | string | number;
}

interface ColumnFilter {
  field: string;
  values: Set<any>;
  searchText?: string;
  id?: null | string | number;
}

// List of columns to exclude from the filter
const excludedColumns = [
  "id",
  "contactId",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "contactNumber",
];

const GridFilter = <T extends Record<string, any>>({
  data,
  onFilter,
  columnCaptions = {},
  id = null,
}: GridFilterProps<T>) => {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set()
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnSearchTexts, setColumnSearchTexts] = useState<
    Record<string, string>
  >({});

  const columns = useMemo(() => {
    if (data === undefined || data.length === 0) return [];
    return Object.keys(data[0]).filter(
      (column) => !excludedColumns.includes(column)
    );
  }, [data]);

  const getDistinctValues = (column: string) => {
    const values = new Set(data.map((item) => item[column]));
    const valuesAsArray = Array.from(values).filter((i) => i !== null);
    // return Array.from(values);
    return valuesAsArray;
  };

  const getLocalizedColumnName = (column: string) => {
    return columnCaptions[column] || t(column);
  };

  const handleColumnSelect = (column: string, checked: boolean) => {
    const newSelectedColumns = new Set(selectedColumns);
    if (checked) {
      newSelectedColumns.add(column);
    } else {
      newSelectedColumns.delete(column);
      setColumnFilters((prev) => prev.filter((f) => f.field !== column));
    }
    setSelectedColumns(newSelectedColumns);
    applyFilters();
  };

  const handleValueSelect = (column: string, value: any, checked: boolean) => {
    setColumnFilters((prev) => {
      const existingFilter = prev.find((f) => f.field === column);
      if (existingFilter) {
        if (checked) {
          existingFilter.values.add(value);
        } else {
          existingFilter.values.delete(value);
          if (existingFilter.values.size === 0) {
            return prev.filter((f) => f.field !== column);
          }
        }
        return [...prev];
      } else {
        return [...prev, { field: column, values: new Set([value]) }];
      }
    });
  };

  const handleSearchTextChange = (column: string, value: string) => {
    setColumnFilters((prev) => {
      const existingFilter = prev.find((f) => f.field === column);
      if (existingFilter) {
        existingFilter.searchText = value;
        return [...prev];
      } else {
        return [
          ...prev,
          { field: column, values: new Set(), searchText: value },
        ];
      }
    });
    applyFilters();
  };

  const applyFilters = () => {
    if (columnFilters.length === 0) {
      onFilter(data);
      return;
    }

    // Check if all filters are empty (both values and search text)
    const allFiltersEmpty = columnFilters.every(
      (filter) => filter.values.size === 0 && !filter.searchText
    );
    if (allFiltersEmpty) {
      onFilter(data);
      return;
    }

    const filteredData = data.filter((item) =>
      columnFilters.every((filter) => {
        // Check if the item matches any of the selected values
        const matchesSelectedValues = Array.from(filter.values).some(
          (value) => item[filter.field] === value
        );

        // Check if the item matches the search text
        const searchText = filter.searchText?.toLowerCase() || "";
        const matchesSearchText =
          !searchText ||
          String(item[filter.field]).toLowerCase().includes(searchText);

        // If there are selected values, use them; otherwise, use the search text
        return filter.values.size > 0
          ? matchesSelectedValues
          : matchesSearchText;
      })
    );
    setTimeout(() => {
      onFilter(filteredData);
    }, 0);
  };

  const handleResetFilters = () => {
    // Clear only the filter values but keep selected columns
    setColumnFilters([]);

    // Force a re-render by using setTimeout
    setTimeout(() => {
      onFilter(data);
    }, 0);
  };

  const columnSelectorContent = () => (
    <div className="p-3">
      {columns.map((column) => {
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
      })}
    </div>
  );

  return (
    <div className="custom-grid-filter-container gap-2">
      <Popover
        showEvent="click"
        target={`#column-selector-button-${id}`}
        position="bottom"
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
        const currentFilter = columnFilters.find((f) => f.field === column);
        // const currentValues: string[] =
        //   (filtersValue as Record<string, string[]>)[column] || [];
        return (
          <div key={column} className="custom-filter-button">
            <Button
              id={`value-selector-button-${column}`}
              text={getLocalizedColumnName(column)}
              onClick={() =>
                setActiveColumn(column === activeColumn ? null : column)
              }
            />

            {activeColumn === column && (
              <Popover
                showEvent="click"
                target={`#value-selector-button-${column}`}
                position="bottom"
                className="custom-selector-popover"
              >
                <div className="p-3">
                  <span className="text-sm font-bold mb-3">{t(column)}</span>
                  <div className="mb-3">
                    <TextBox
                      label={t("search")}
                      labelMode="floating"
                      value={currentFilter?.searchText || ""}
                      onInput={(e: any) =>
                        handleSearchTextChange(
                          column,
                          e.event?.target?.value || ""
                        )
                      }
                      height={40}
                    />
                  </div>
                  {values.map((value) => (
                    <div key={value} className="mb-2">
                      <CheckBox
                        text={String(value)}
                        value={currentFilter?.values.has(value) || false}
                        onValueChanged={(e) => {
                          handleValueSelect(column, value, e.value);
                          applyFilters();
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

export default GridFilter;