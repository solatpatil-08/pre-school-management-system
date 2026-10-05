import React from 'react';

const LoadingSpinner = ({ text = 'Loading data...', size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[2.5px]',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="relative">
        <div
          className={`${sizes[size] || sizes.md} border-primary-100 rounded-full`}
        />
        <div
          className={`absolute inset-0 ${sizes[size] || sizes.md} border-transparent border-t-primary-600 rounded-full animate-spin`}
        />
      </div>
      {text && (
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-3 animate-pulse text-center">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
