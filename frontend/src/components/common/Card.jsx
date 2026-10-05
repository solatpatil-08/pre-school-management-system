import React from 'react';

export const Card = ({
  title,
  subtitle,
  action,
  headerIcon: HeaderIcon,
  children,
  footer,
  className = '',
  bodyClassName = 'p-5 sm:p-6',
  headerClassName = 'px-5 sm:px-6 py-4 border-b border-slate-100',
  ...props
}) => {
  const hasHeader = title || subtitle || action || HeaderIcon;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className={`flex items-center justify-between gap-3 ${headerClassName}`}>
          <div className="flex items-center gap-3">
            {HeaderIcon && (
              <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                <HeaderIcon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && <h3 className="font-bold text-slate-800 text-sm sm:text-base">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
        </div>
      )}

      <div className={bodyClassName}>{children}</div>

      {footer && (
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
