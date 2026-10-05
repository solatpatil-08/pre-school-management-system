import React from 'react';
const EmptyState = ({
  icon: Icon,
  title = 'No records found',
  description = 'Try adjusting your search criteria or add a new entry to get started.',
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-card ${className}`}
    >
      <div className="relative mb-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-primary-600 shadow-subtle">
          {Icon ? (
            <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-200" />
          )}
        </div>
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            {actionText}
          </button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition-all"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
