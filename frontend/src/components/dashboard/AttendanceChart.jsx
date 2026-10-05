import React, { useState } from 'react';
import { CalendarCheck } from 'lucide-react';

const AttendanceChart = ({ data = [] }) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col items-center justify-center py-12 text-slate-400">
        <CalendarCheck className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs">No attendance trend data available yet.</p>
      </div>
    );
  }

  // Calculate weekly averages from real data
  const totalPresent = data.reduce((sum, d) => sum + (d.present || 0), 0);
  const totalAbsent = data.reduce((sum, d) => sum + (d.absent || 0), 0);
  const totalLate = data.reduce((sum, d) => sum + (d.late || 0), 0);
  const totalRecorded = totalPresent + totalAbsent + totalLate;
  const avgRate =
    totalRecorded > 0 ? Math.round(((totalPresent + totalLate) / totalRecorded) * 100) : 0;

  // Max total for relative heights
  const maxDaily = Math.max(...data.map((d) => d.total || 0), 10);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Attendance Overview</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Last 7 days attendance trend & compliance</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">7-Day Avg:</span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              {avgRate}%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 mb-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Absent</span>
          </div>
        </div>

        {/* Bars Container */}
        <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100">
          {data.map((item, index) => {
            const hasData = item.total > 0;
            const barHeightPct = hasData
              ? Math.max(18, Math.round((item.total / maxDaily) * 100))
              : 8;

            const presentPct = hasData ? (item.present / item.total) * 100 : 0;
            const latePct = hasData ? (item.late / item.total) * 100 : 0;
            const absentPct = hasData ? (item.absent / item.total) * 100 : 0;

            const isHovered = hoveredDay === index;

            return (
              <div
                key={item.date || index}
                onMouseEnter={() => setHoveredDay(index)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-16 z-20 bg-slate-900 text-white rounded-xl py-1.5 px-2.5 text-[10px] shadow-xl whitespace-nowrap pointer-events-none animate-fade-in">
                    <p className="font-bold border-b border-slate-700 pb-0.5 mb-1">{item.label}</p>
                    <p className="text-emerald-300">Present: {item.present}</p>
                    <p className="text-amber-300">Late: {item.late}</p>
                    <p className="text-rose-300">Absent: {item.absent}</p>
                    <p className="text-slate-300 font-bold mt-0.5">Rate: {item.rate}%</p>
                  </div>
                )}

                {/* Percentage Tag */}
                <span className="text-[10px] font-bold text-slate-500 mb-1.5">
                  {hasData ? `${item.rate}%` : '-'}
                </span>

                {/* Segmented Bar */}
                <div
                  className={`w-full max-w-[28px] rounded-t-xl overflow-hidden flex flex-col-reverse transition-all duration-300 shadow-sm ${
                    hasData ? 'bg-slate-100' : 'bg-slate-100/60'
                  } ${isHovered ? 'ring-2 ring-indigo-500/30 transform scale-105' : ''}`}
                  style={{ height: `${barHeightPct}%` }}
                >
                  {hasData ? (
                    <>
                      <div className="bg-emerald-500 transition-all" style={{ height: `${presentPct}%` }} />
                      <div className="bg-amber-400 transition-all" style={{ height: `${latePct}%` }} />
                      <div className="bg-rose-500 transition-all" style={{ height: `${absentPct}%` }} />
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-200/50" />
                  )}
                </div>

                {/* Day Label */}
                <span
                  className={`text-[11px] font-bold mt-2 transition-colors ${
                    isHovered ? 'text-indigo-600' : 'text-slate-500'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-4 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-50">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">Recorded</span>
          <span className="font-extrabold text-slate-800">{totalRecorded}</span>
        </div>
        <div className="p-2 rounded-xl bg-emerald-50/50">
          <span className="text-[10px] text-emerald-600 font-bold block uppercase">Present/Late</span>
          <span className="font-extrabold text-emerald-700">{totalPresent + totalLate}</span>
        </div>
        <div className="p-2 rounded-xl bg-rose-50/50">
          <span className="text-[10px] text-rose-600 font-bold block uppercase">Absent</span>
          <span className="font-extrabold text-rose-700">{totalAbsent}</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;
