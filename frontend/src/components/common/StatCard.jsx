import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
  trendType = 'up',
  onClick,
  className = '',
}) => {
  const colorMaps = {
    indigo: {
      bg: 'bg-indigo-50/80 text-indigo-600 border border-indigo-100/80',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
      accent: 'hover:border-indigo-300',
    },
    emerald: {
      bg: 'bg-emerald-50/80 text-emerald-600 border border-emerald-100/80',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      accent: 'hover:border-emerald-300',
    },
    amber: {
      bg: 'bg-amber-50/80 text-amber-600 border border-amber-100/80',
      badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
      accent: 'hover:border-amber-300',
    },
    rose: {
      bg: 'bg-rose-50/80 text-rose-600 border border-rose-100/80',
      badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
      accent: 'hover:border-rose-300',
    },
    purple: {
      bg: 'bg-purple-50/80 text-purple-600 border border-purple-100/80',
      badge: 'bg-purple-50 text-purple-700 border-purple-200/60',
      accent: 'hover:border-purple-300',
    },
    sky: {
      bg: 'bg-sky-50/80 text-sky-600 border border-sky-100/80',
      badge: 'bg-sky-50 text-sky-700 border-sky-200/60',
      accent: 'hover:border-sky-300',
    },
    blue: {
      bg: 'bg-blue-50/80 text-blue-600 border border-blue-100/80',
      badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
      accent: 'hover:border-blue-300',
    },
  };

  const scheme = colorMaps[color] || colorMaps.indigo;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-card transition-all duration-200 ${
        onClick
          ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 ' + scheme.accent
          : 'hover:shadow-card-hover'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate mb-1.5">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl flex-shrink-0 shadow-subtle ${scheme.bg}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs gap-2">
          {subtitle && (
            <span className="text-slate-500 font-medium truncate">{subtitle}</span>
          )}
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] border flex-shrink-0 ${
                trendType === 'up'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : trendType === 'down'
                  ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                  : 'bg-slate-50 text-slate-600 border-slate-200/60'
              }`}
            >
              {trendType === 'up' ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              ) : trendType === 'down' ? (
                <ArrowDownRight className="w-3 h-3 text-rose-600" />
              ) : (
                <Minus className="w-3 h-3 text-slate-500" />
              )}
              <span>{trend}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
