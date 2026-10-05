import React from 'react';

/**
 * Basic Shimmering Box Primitive
 */
export const Skeleton = ({ className = 'w-full h-4 rounded-lg', ...props }) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      {...props}
    />
  );
};

/**
 * Text Lines Skeleton Placeholder
 */
export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 rounded-md ${
            i === lines - 1 ? 'w-3/5' : i % 2 === 0 ? 'w-full' : 'w-5/6'
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Single Stat / KPI Card Skeleton
 */
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="w-24 h-3 rounded-md" />
          <Skeleton className="w-16 h-7 rounded-lg" />
        </div>
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="w-28 h-3 rounded-md" />
        <Skeleton className="w-12 h-4 rounded-full" />
      </div>
    </div>
  );
};

/**
 * Grid of Stat Cards Skeleton
 */
export const SkeletonStats = ({ count = 4, className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6' }) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};

/**
 * Data Table Skeleton
 */
export const SkeletonTable = ({ rows = 5, cols = 5, className = '' }) => {
  return (
    <div className={`table-container ${className}`}>
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
        <Skeleton className="w-48 h-5 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-8 rounded-xl" />
          <Skeleton className="w-20 h-8 rounded-xl" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* Table header skeleton */}
        <div className="grid gap-4 py-2 border-b border-slate-100" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 rounded-md w-3/4" />
          ))}
        </div>
        {/* Table rows skeleton */}
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-4 py-3.5 border-b border-slate-100/60 items-center"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-3 rounded-md ${
                  c === 0 ? 'w-5/6 h-4' : c === cols - 1 ? 'w-16 ml-auto' : 'w-2/3'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * List items skeleton
 */
export const SkeletonList = ({ items = 4, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-white"
        >
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="w-1/3 h-3.5 rounded-md" />
            <Skeleton className="w-2/3 h-2.5 rounded-md" />
          </div>
          <Skeleton className="w-14 h-4 rounded-full" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
