import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-white rounded-b-3xl ${className}`}
    >
      <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
        Showing page <span className="font-bold text-slate-800">{currentPage}</span> of{' '}
        <span className="font-bold text-slate-800">{totalPages}</span>
        {totalItems > 0 && (
          <span className="hidden xs:inline"> ({totalItems} total items)</span>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Prev</span>
        </button>

        {/* Numbered Page Buttons - Hidden on very small screens, visible on sm: */}
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((page, index, arr) => (
              <React.Fragment key={page}>
                {index > 0 && arr[index - 1] !== page - 1 && (
                  <span className="px-1 text-slate-400 text-xs">...</span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}
        </div>

        {/* Mobile current indicator */}
        <div className="sm:hidden px-3 py-1 bg-slate-50 rounded-lg text-xs font-bold text-slate-700 border border-slate-200">
          {currentPage} / {totalPages}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
