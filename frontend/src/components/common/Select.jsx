import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      id,
      name,
      value,
      onChange,
      placeholder = 'Select an option',
      required = false,
      disabled = false,
      className = '',
      wrapperClassName = '',
      ...props
    },
    ref
  ) => {
    const selectId = id || name;

    return (
      <div className={`space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold text-slate-700">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={`w-full rounded-xl border text-sm transition-all duration-150 appearance-none bg-white pr-10 pl-3.5 py-2.5 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              error
                ? 'border-rose-300 text-rose-900 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 text-slate-900 hover:border-slate-300 focus:border-primary-500 focus:ring-primary-500/20'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt, idx) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lbl = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={opt.key || val || idx} value={val}>
                  {lbl}
                </option>
              );
            })}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
