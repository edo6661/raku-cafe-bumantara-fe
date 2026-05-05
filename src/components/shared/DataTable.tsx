import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, FileX2, ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  expandedRowRender?: (row: T) => React.ReactNode;
  serverSide?: boolean;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onNextPage?: () => void;
  onPrevPage?: () => void;
}

const DataTable = <T extends Record<string, unknown>>({
  title, columns, data, onAdd, onEdit, onDelete, expandedRowRender,
  serverSide = false, searchTerm = '', onSearchChange,
  page = 1, totalPages = 1, onPageChange,
  hasNextPage, hasPrevPage, onNextPage, onPrevPage
}: DataTableProps<T>) => {

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (serverSide && onSearchChange) {
      const timeoutId = setTimeout(() => {
        if (localSearchTerm !== searchTerm) {
          onSearchChange(localSearchTerm);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [localSearchTerm, serverSide, onSearchChange, searchTerm]);

  const toggleRow = (rowIndex: number) => {
    setExpandedRows((prev) => ({ ...prev, [rowIndex]: !prev[rowIndex] }));
  };

  const filteredData = useMemo(() => {
    if (serverSide) return data;
    if (!localSearchTerm) return data;

    const lowercasedTerm = localSearchTerm.toLowerCase();
    return data.filter((row) => {
      return columns.some((col) => {
        const value = row[col.accessor as keyof T];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowercasedTerm);
      });
    });
  }, [data, localSearchTerm, columns, serverSide]);

  const totalCols = columns.length + (expandedRowRender ? 1 : 0) + (onEdit || onDelete ? 1 : 0);

  const getPageNumbers = () => {
    const delta = 1;
    const range: Array<number | string> = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift("...");
    if (page + delta < totalPages - 1) range.push("...");
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/80 overflow-hidden flex flex-col transition-all duration-300">
      <div className="p-6 md:px-8 md:py-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
            {!serverSide && (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200/60">
                {filteredData.length} Data
              </span>
            )}
          </div>
          <p className="text-[13px] text-slate-500 font-medium">Kelola dan pantau informasi operasional secara real-time.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64 group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Cari data..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {onAdd && (
            <button
              onClick={onAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 hover:shadow-lg transition-all duration-300 font-bold text-[13px] active:scale-95 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              Tambah Data
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200/60">
              {expandedRowRender && <th className="px-4 py-4 w-10 text-center"></th>}
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-4 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-4 text-center whitespace-nowrap w-24">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => {
                const isExpanded = !!expandedRows[rowIndex];
                return (
                  <React.Fragment key={rowIndex}>
                    <tr
                      onClick={() => {
                        if (expandedRowRender) toggleRow(rowIndex);
                      }}
                      className={`transition-colors duration-200 group ${expandedRowRender ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50'} ${isExpanded ? 'bg-slate-50/80' : ''}`}
                    >
                      {expandedRowRender && (
                        <td className="px-4 py-4 text-center text-slate-400 group-hover:text-slate-600 transition-colors">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </td>
                      )}
                      {columns.map((col, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 text-slate-700 whitespace-nowrap font-medium">
                          {col.render ? col.render(row[col.accessor as keyof T], row) : String(row[col.accessor as keyof T] ?? '')}
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {onEdit && (
                              <button onClick={() => onEdit(row)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer">
                                <Edit2 size={16} />
                              </button>
                            )}
                            {onDelete && (
                              <button onClick={() => onDelete(row)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && expandedRowRender && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={totalCols} className="px-6 py-6 border-b border-slate-100">
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            {expandedRowRender(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={totalCols} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                      <FileX2 size={28} className="text-slate-400" />
                    </div>
                    <h3 className="text-slate-800 font-bold mb-1">Data tidak ditemukan</h3>
                    <p className="text-slate-500 text-[13px] font-medium leading-relaxed">
                      Coba sesuaikan filter atau kata kunci pencarian Anda untuk menemukan data.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {serverSide && (totalPages > 1 || hasNextPage !== undefined) && (
        <div className="p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
          <span className="text-[13px] font-medium text-slate-500">
            {hasNextPage !== undefined ? (
              "Navigasi Data Halaman"
            ) : (
              <>Halaman <strong className="text-slate-900">{page}</strong> dari <strong className="text-slate-900">{totalPages}</strong></>
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPrevPage ? onPrevPage() : onPageChange?.(page - 1)}
              disabled={onPrevPage ? !hasPrevPage : page === 1}
              className="px-3 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-200 flex items-center gap-1.5"
            >
              <ChevronLeft size={18} />
              {hasNextPage !== undefined && <span className="text-sm font-semibold">Prev</span>}
            </button>

            {hasNextPage === undefined && getPageNumbers().map((num, idx) => (
              num === "..." ? (
                <span key={idx} className="px-2 text-slate-400 font-bold tracking-widest">...</span>
              ) : (
                <button
                  key={idx}
                  onClick={() => onPageChange?.(num as number)}
                  className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all cursor-pointer border ${page === num
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                >
                  {num}
                </button>
              )
            ))}

            <button
              onClick={() => onNextPage ? onNextPage() : onPageChange?.(page + 1)}
              disabled={onNextPage ? !hasNextPage : page === totalPages}
              className="px-3 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-200 flex items-center gap-1.5"
            >
              {hasNextPage !== undefined && <span className="text-sm font-semibold">Next</span>}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;