"use client";

import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { DashButton } from "./DashButton";

/* ─── Column Definition ─── */
export interface DashColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

/* ─── Table Props ─── */
interface DashTableProps<T> {
  columns: DashColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: React.ReactNode;
  emptyState?: React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DashTable<T>({
  columns,
  data,
  keyExtractor,
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  filters,
  emptyState,
  pagination,
}: DashTableProps<T>) {
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1;

  return (
    <div className="dash-card overflow-hidden">
      {/* Search + Filters Bar */}
      {(onSearchChange || filters) && (
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          {onSearchChange && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="dash-input pl-9"
              />
            </div>
          )}
          {filters}
        </div>
      )}

      {/* Table or Empty */}
      {data.length === 0 ? (
        emptyState || (
          <div className="p-16 text-center">
            <p className="text-slate-400">No hay datos</p>
          </div>
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-5 py-4", col.className)}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-slate-500">
          <span>
            Mostrando {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{" "}
            {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <DashButton
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Ant.
            </DashButton>
            <span className="px-3 py-1 text-xs font-semibold text-slate-700">
              {pagination.page} / {totalPages}
            </span>
            <DashButton
              variant="ghost"
              size="sm"
              icon={ChevronRight}
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Sig.
            </DashButton>
          </div>
        </div>
      )}
    </div>
  );
}
