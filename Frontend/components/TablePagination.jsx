"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function TablePagination({ page, pageSize = 10, total, onPageChange }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : page * pageSize + 1;
  const lastRow = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm">
      <span className="text-slate-500">Showing {firstRow}–{lastRow} of {total}</span>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronLeft size={16} />
          </button>
          <span className="min-w-20 text-center text-xs text-slate-600">Page {page + 1} of {pageCount}</span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page + 1 >= pageCount}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}