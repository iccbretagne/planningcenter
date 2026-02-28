"use client";

import { ReactNode } from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  actions,
  emptyMessage = "Aucune donnée.",
  selectable = false,
  selectedIds,
  onSelectionChange,
}: DataTableProps<T>) {
  const allSelected = selectable && data.length > 0 && data.every((row) => selectedIds?.has(row.id));
  const someSelected = selectable && data.some((row) => selectedIds?.has(row.id)) && !allSelected;

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((row) => row.id)));
    }
  }

  function toggleRow(id: string) {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-icc-violet focus:ring-icc-violet"
                />
              </th>
            )}
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
            {actions && (
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row) => (
            <tr key={row.id} className={`hover:bg-gray-50 ${selectedIds?.has(row.id) ? "bg-icc-violet-light" : ""}`}>
              {selectable && (
                <td className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(row.id) || false}
                    onChange={() => toggleRow(row.id)}
                    className="h-4 w-4 rounded border-gray-300 text-icc-violet focus:ring-icc-violet"
                  />
                </td>
              )}
              {columns.map((col, i) => (
                <td
                  key={i}
                  className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                >
                  {typeof col.accessor === "function"
                    ? col.accessor(row)
                    : (row[col.accessor] as ReactNode)}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
