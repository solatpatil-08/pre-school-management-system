import React from 'react';
import { Activity, CreditCard, GraduationCap, Megaphone, Clock } from 'lucide-react';

const activityIcons = {
  payment: {
    icon: CreditCard,
    bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  admission: {
    icon: GraduationCap,
    bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  },
  announcement: {
    icon: Megaphone,
    bg: 'bg-purple-50 text-purple-600 border-purple-100',
  },
};

const RecentActivities = ({ activities = [] }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center py-12 text-slate-400">
        <Activity className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs">No recent recorded activities yet.</p>
      </div>
    );
  }

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    const date = new Date(ts);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Recent Activities</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
            Live MongoDB Log
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {activities.map((act) => {
            const iconConfig = activityIcons[act.type] || activityIcons.admission;
            const Icon = iconConfig.icon;

            return (
              <div key={act.id} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-xs ${iconConfig.bg}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{act.title}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimestamp(act.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">{act.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <span className="text-[11px] text-slate-400">
          Tracking payments, admissions, and broadcast activities in real-time
        </span>
      </div>
    </div>
  );
};

export default RecentActivities;
