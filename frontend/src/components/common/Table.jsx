import React from 'react';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

export const Table = ({
  columns = [],
  data = [],
  keyField = '_id',
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records to display at this moment.',
  onRowClick,
  className = '',
  wrapperClassName = '',
}) => {
  if (isLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <LoadingSpinner text="Loading records..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${wrapperClassName}`}>
      <div className="inline-block min-w-full align-middle">
        <table className={`min-w-full divide-y divide-slate-100 ${className}`}>
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100">
              {columns.map((col, idx) => (
                <th
                  key={col.key || col.accessor || idx}
                  scope="col"
                  className={`py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left ${
                    col.headerClassName || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row, rowIdx) => {
              const rowKey = row[keyField] || row.id || rowIdx;
              const isClickable = typeof onRowClick === 'function';

              return (
                <tr
                  key={rowKey}
                  onClick={() => isClickable && onRowClick(row)}
                  className={`transition-colors duration-150 ${
                    isClickable ? 'cursor-pointer hover:bg-slate-50/80 active:bg-slate-100' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {columns.map((col, colIdx) => {
                    const value = col.accessor ? row[col.accessor] : undefined;
                    return (
                      <td
                        key={col.key || col.accessor || colIdx}
                        className={`py-3.5 px-4 text-sm text-slate-700 whitespace-nowrap ${
                          col.cellClassName || ''
                        }`}
                      >
                        {col.render ? col.render(value, row, rowIdx) : (value ?? '-')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
