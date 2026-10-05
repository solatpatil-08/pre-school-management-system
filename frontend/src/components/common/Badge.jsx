import React from 'react';

const badgeStyles = {
  // Attendance
  Present: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  Absent: 'bg-rose-50 text-rose-700 border-rose-200/80',
  Late: 'bg-amber-50 text-amber-700 border-amber-200/80',
  Leave: 'bg-sky-50 text-sky-700 border-sky-200/80',

  // Fees
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  Partial: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  PARTIAL: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200/80',
  Overdue: 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold',

  // Status
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200/80',
  Graduated: 'bg-purple-50 text-purple-700 border-purple-200/80',
  Suspended: 'bg-rose-50 text-rose-700 border-rose-200/80',
  Published: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  Draft: 'bg-amber-50 text-amber-700 border-amber-200/80',
  Archived: 'bg-slate-100 text-slate-600 border-slate-200/80',

  // Priorities
  Urgent: 'bg-rose-100/80 text-rose-800 border-rose-300 font-bold',
  High: 'bg-orange-50 text-orange-700 border-orange-200/80',
  Normal: 'bg-sky-50 text-sky-700 border-sky-200/80',
  Low: 'bg-slate-100 text-slate-600 border-slate-200/80',

  // Roles
  admin: 'bg-purple-50 text-purple-700 border-purple-200/80 font-semibold',
  teacher: 'bg-sky-50 text-sky-700 border-sky-200/80 font-semibold',
  parent: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold',
};

const dotColors = {
  Present: 'bg-emerald-500',
  Absent: 'bg-rose-500',
  Late: 'bg-amber-500',
  Leave: 'bg-sky-500',
  Paid: 'bg-emerald-500',
  PAID: 'bg-emerald-500',
  Partial: 'bg-indigo-500',
  PARTIAL: 'bg-indigo-500',
  Pending: 'bg-amber-500',
  PENDING: 'bg-amber-500',
  Overdue: 'bg-rose-500',
  OVERDUE: 'bg-rose-500',
  Active: 'bg-emerald-500',
  Inactive: 'bg-slate-400',
  Published: 'bg-emerald-500',
  Draft: 'bg-amber-500',
  Archived: 'bg-slate-400',
  Urgent: 'bg-rose-500 animate-pulse',
};

const Badge = ({
  variant = 'Active',
  text,
  showDot = true,
  size = 'sm',
  className = '',
}) => {
  const label = text || variant;
  const style = badgeStyles[variant] || 'bg-slate-100 text-slate-700 border-slate-200/80';
  const dot = dotColors[variant];

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${sizeClasses[size] || sizeClasses.sm} ${style} ${className}`}
    >
      {showDot && dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />}
      <span className="truncate">{label}</span>
    </span>
  );
};

export default Badge;
