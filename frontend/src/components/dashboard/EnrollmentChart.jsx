import React from 'react';
import { School, CheckCircle } from 'lucide-react';

const EnrollmentChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col items-center justify-center py-12 text-slate-400">
        <School className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs">No classroom enrollment records found.</p>
      </div>
    );
  }

  const totalCapacity = data.reduce((sum, c) => sum + (c.capacity || 0), 0);
  const totalEnrolled = data.reduce((sum, c) => sum + (c.count || c.enrolled || 0), 0);
  const totalOccupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-primary-600" />
              <h3 className="text-base font-bold text-slate-900">Student Enrollment Statistics</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Classroom capacity & occupancy allocation</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Total Enrolled:</span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-primary-50 text-primary-700 border border-primary-100">
              {totalEnrolled} / {totalCapacity} ({totalOccupancy}%)
            </span>
          </div>
        </div>

        {/* Classes List */}
        <div className="space-y-4 my-2">
          {data.map((c) => {
            const count = c.count || c.enrolled || 0;
            const cap = c.capacity || 20;
            const pct = Math.min(100, Math.round((count / cap) * 100));

            const isHigh = pct >= 90;
            const isMedium = pct >= 65 && pct < 90;

            const barColor = isHigh
              ? 'bg-rose-500'
              : isMedium
              ? 'bg-primary-600'
              : 'bg-emerald-500';

            const badgeBg = isHigh
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : isMedium
              ? 'bg-primary-50 text-primary-700 border-primary-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div key={c.id || c.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{c.name}</span>
                    {c.section && (
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-md">
                        Sec {c.section}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">
                      {count} / {cap} seats
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          Optimal seat balance across active groups
        </span>
        <span className="font-semibold text-slate-600">{data.length} Classrooms Active</span>
      </div>
    </div>
  );
};

export default EnrollmentChart;
