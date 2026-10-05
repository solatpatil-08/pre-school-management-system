import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { CardSkeleton, TableSkeleton } from './Skeleton';

export const Loader = ({
  variant = 'spinner',
  text = 'Loading...',
  fullScreen = false,
  count = 3,
  className = '',
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" text={text} />
      </div>
    );
  }

  if (variant === 'table') {
    return <TableSkeleton rows={count} className={className} />;
  }

  if (variant === 'card') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <LoadingSpinner text={text} />
    </div>
  );
};

export default Loader;
