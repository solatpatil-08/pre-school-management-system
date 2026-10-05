import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this content. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-5 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-100 text-rose-600 flex-shrink-0 mt-0.5 sm:mt-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-900">{title}</h4>
          <p className="text-xs text-rose-700 mt-0.5 max-w-xl leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs shadow-sm hover:shadow transition-all flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
