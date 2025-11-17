import { useEffect, useMemo, useState } from "react";
import { t } from "i18next";

interface ColumnFilter {
  field: string;
  values: Set<any>;
  searchText?: string;
  id?: null | string | number;
}

const excludedColumns = [
  "id",
  "contactId",
  "createdAt",
  "updatedAt",
  "deletedAt",
  // "contactNumber",
  // Branch related
  "branchId",
  // Academic related IDs
  "academicYearId",
  "educationTypeId",
  // Guardian related
  "guardianId",
  // System fields
  "isActive",
  // Financial calculation fields
  "remainingAmount",
  "remainingPercentage",
  "paidPercentage",
  // Status fields
  "isWaiting",
  // Additional fields that shouldn't be filtered
  "rowId",
  "index",
  "studentId",
  "nameEn", // We only want to filter by nameAr
  "combinedEducationInfo",
  "actions",
  "Actions",
];

export default function useFilter(
  filteredData: any[],
  data: any[],
  filterColumns: string[],
  columnCaptions: Record<string, string>,
  onFilter: (filteredData: any[]) => void,
  customExcludedColumns: string[] = [],
  columnsState: {
    visible?: boolean | undefined;
    fixed?: boolean;
    dataField?: string | undefined;
    caption?: string;
    position?: string | undefined;
  }[]
) {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set()
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);

  // Combine default excluded columns with custom excluded columns
  const allExcludedColumns = [...excludedColumns, ...customExcludedColumns];

  const columns = useMemo(() => {
    if (data === undefined || data.length === 0) return [];

    const allColumns = Object.keys(data[0]).filter(
      (column) => !allExcludedColumns.includes(column)
    );

    // If filterColumns is provided and has items, return only columns that exist in filterColumns
    if (filterColumns && filterColumns.length > 0) {
      return allColumns.filter((column) => filterColumns.includes(column));
    }

    // Otherwise return all columns excluding excluded ones
    return allColumns;
  }, [data, filterColumns, allExcludedColumns]);

  const columnsFromGrid = useMemo(() => {
    //To Get only columns that are sent to data Grid , to avoid showing all columns
    return columnsState.filter(
      (column) =>
        column?.dataField &&
        !allExcludedColumns.includes(column?.dataField || "")
    );
  }, [columnsState, allExcludedColumns]);

  const getDistinctValues = (column: string) => {
    const values = new Set(
      filteredData && filteredData.length > 0
        ? filteredData.map((item: any) => item[column])
        : data && data.length > 0
        ? data.map((item: any) => item[column])
        : []
    );
    const valuesAsArray = Array.from(values).filter((i) => i !== null);
    // return Array.from(values);
    return valuesAsArray;
  };

  const getLocalizedColumnName = (column: string) => {
    return columnCaptions[column] || t(column);
  };

  //
  //

  //
  const [filtersValue, setFiltersValue] = useState<Record<string, string[]>>(
    {}
  );

  //
  //
  const handleColumnSelect = (column: string, checked: boolean) => {
    const newSelectedColumns = new Set(selectedColumns);
    if (checked) {
      newSelectedColumns.add(column);
    } else {
      newSelectedColumns.delete(column);
      setColumnFilters((prev) => prev.filter((f) => f.field !== column));
      const newFiltersValue = { ...filtersValue };
      delete newFiltersValue[column];
      setFiltersValue(newFiltersValue);
    }
    setSelectedColumns(newSelectedColumns);
    // applyFilters();
  };
  //
  //

  const onSelectFilterValue = (key: string, value: string) => {
    const currentValues: string[] = filtersValue[key] || [];

    if (currentValues && currentValues?.length > 0) {
      const newVal = currentValues.includes(value)
        ? currentValues.filter((i: string) => i !== value)
        : [...currentValues, value];

      setFiltersValue({
        ...filtersValue,
        [key]: newVal,
      });
    } else {
      setFiltersValue({
        ...filtersValue,
        [key]: [value],
      });
    }
  };

  const onTagBoxFilterSelect = (key: string, value: string[]) => {
    const currentValues: string[] | null = filtersValue[key];

    if (currentValues) {
      setFiltersValue({
        ...filtersValue,
        [key]: value,
      });
    } else {
      setFiltersValue({
        ...filtersValue,
        [key]: value,
      });
    }
  };

  useEffect(() => {
    let dataBeforeFilter: any[] = data;

    Object.keys(filtersValue).forEach((key) => {
      if (filtersValue[key].length > 0) {
        dataBeforeFilter = dataBeforeFilter.filter((item) =>
          filtersValue[key].includes(item[key])
        );
      }
    });

    onFilter(dataBeforeFilter);
  }, [filtersValue, data, onFilter]);

  const handleResetFilters = () => {
    setFiltersValue({});
    setSelectedColumns(new Set());
  };

  return {
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
  };
}