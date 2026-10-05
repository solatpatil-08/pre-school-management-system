import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow active:bg-primary-800 focus:ring-primary-500/20',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-800 active:bg-slate-300 focus:ring-slate-400/20',
  outline:
    'border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 active:bg-slate-100 focus:ring-slate-400/20',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:bg-rose-800 focus:ring-rose-500/20',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:bg-emerald-800 focus:ring-emerald-500/20',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:bg-slate-200 focus:ring-slate-400/20',
};

const SIZES = {
  xs: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
  sm: 'px-3.5 py-1.5 text-xs font-semibold gap-2 rounded-xl',
  md: 'px-4 py-2 text-sm font-semibold gap-2 rounded-xl',
  lg: 'px-5 py-2.5 text-base font-semibold gap-2.5 rounded-2xl',
};

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      type = 'button',
      isLoading = false,
      disabled = false,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyle =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';
    const variantStyle = VARIANTS[variant] || VARIANTS.primary;
    const sizeStyle = SIZES[size] || SIZES.md;
    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={`${baseStyle} ${variantStyle} ${sizeStyle} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
        {children}
        {!isLoading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
