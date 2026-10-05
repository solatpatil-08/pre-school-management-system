import React from 'react';

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      id,
      name,
      value,
      onChange,
      placeholder = '',
      required = false,
      disabled = false,
      className = '',
      wrapperClassName = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className={`space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            required={required}
            className={`w-full rounded-xl border text-sm transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              Icon ? 'pl-10' : 'pl-3.5'
            } pr-3.5 py-2.5 ${
              error
                ? 'border-rose-300 text-rose-900 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 text-slate-900 bg-white hover:border-slate-300 focus:border-primary-500 focus:ring-primary-500/20'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-rose-600 animate-in fade-in">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
