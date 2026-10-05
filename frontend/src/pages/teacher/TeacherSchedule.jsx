import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Clock,
  LayoutGrid,
  ListOrdered,
  MapPin,
} from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const ACTIVITY_BADGES = {
  Academic: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Play: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Meal: 'bg-amber-50 text-amber-700 border-amber-200',
  'Arts & Craft': 'bg-pink-50 text-pink-700 border-pink-200',
  'Music & Movement': 'bg-purple-50 text-purple-700 border-purple-200',
  'Nap/Rest': 'bg-blue-50 text-blue-700 border-blue-200',
  Outdoor: 'bg-teal-50 text-teal-700 border-teal-200',
};

const TeacherSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('timetable'); // 'timetable' or 'daily'
  const [selectedDay, setSelectedDay] = useState('Monday');

  const { showToast } = useToast();

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await api.get('/schedules');
      const list =
        res.data?.data?.schedules ||
        res.data?.schedules ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setSchedules(list);
    } catch (err) {
      showToast('Failed to load your educator teaching schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Group schedules by day of week (Monday to Friday)
  const groupedSchedules = useMemo(() => {
    const map = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    };

    schedules.forEach((slot) => {
      const day = slot.day || slot.dayOfWeek;
      if (map[day]) {
        map[day].push(slot);
      }
    });

    Object.keys(map).forEach((day) => {
      map[day].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });

    return map;
  }, [schedules]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shadow-subtle border border-indigo-100/50">
              <Clock className="w-5 h-5" />
            </div>
            <span>My Teaching Timetable</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Assigned classroom periods, circle times, sensory play, and lesson allocations.
          </p>
        </div>

        {/* View Switcher: Weekly Timetable vs Daily Schedule */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto border border-slate-200/50">
          <button
            type="button"
            onClick={() => setViewMode('timetable')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'timetable'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Weekly Timetable (Mon-Fri)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'daily'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Daily Schedule</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading assigned timetable..." />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No teaching periods assigned"
          description="You currently have no scheduled teaching slots in the timetable. Please check with your school administrator."
        />
      ) : (
        <>
          {/* VIEW 1: WEEKLY TIMETABLE (Monday to Friday) */}
          {viewMode === 'timetable' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
              {WEEKDAYS.map((day) => {
                const daySlots = groupedSchedules[day] || [];
                return (
                  <div
                    key={day}
                    className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200/80 shadow-subtle flex flex-col min-h-[360px]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{day}</h3>
                      <span className="text-[10px] font-bold text-slate-400">
                        {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-3 flex-1">
                      {daySlots.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-center p-3">
                          <p className="text-[11px] text-slate-400 italic">No assigned sessions</p>
                        </div>
                      ) : (
                        daySlots.map((slot) => {
                          const badgeStyle =
                            ACTIVITY_BADGES[slot.activityType] || 'bg-slate-100 text-slate-700 border-slate-200';
                          return (
                            <div
                              key={slot._id}
                              className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-subtle hover:shadow-card hover:border-slate-300 transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${badgeStyle}`}
                                  >
                                    {slot.activityType || 'Academic'}
                                  </span>
                                  <span className="text-[10px] font-bold text-indigo-700 truncate">
                                    {slot.class?.className || slot.class?.name}
                                  </span>
                                </div>

                                <h4 className="text-xs font-bold text-slate-900 tracking-tight mb-2">
                                  {slot.activity || slot.activityName}
                                </h4>

                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 mb-1">
                                  <Clock className="w-3 h-3 text-indigo-500" />
                                  <span>
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                </div>

                                {slot.room && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span>{slot.room}</span>
                                  </div>
                                )}
                              </div>

                              {slot.notes && (
                                <p className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 italic truncate">
                                  "{slot.notes}"
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: DAILY SCHEDULE VIEW */}
          {viewMode === 'daily' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-card flex items-center gap-2 overflow-x-auto">
                {WEEKDAYS.map((day) => {
                  const isActive = selectedDay === day;
                  const count = groupedSchedules[day]?.length || 0;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{day}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {groupedSchedules[selectedDay]?.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={`No teaching periods for ${selectedDay}`}
                  description="You have no assigned classes scheduled on this day."
                />
              ) : (
                <div className="space-y-3">
                  {groupedSchedules[selectedDay].map((slot) => (
                    <div
                      key={slot._id}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center font-bold text-xs border border-indigo-100/60 flex-shrink-0">
                          <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {slot.activityType || 'Academic'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">•</span>
                            <span className="text-xs font-bold text-indigo-700">
                              {slot.class?.className || slot.class?.name} (Section {slot.class?.section || 'A'})
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900">
                            {slot.activity || slot.activityName}
                          </h3>
                          {slot.notes && (
                            <p className="text-xs text-slate-400 mt-1 italic">"{slot.notes}"</p>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-sm font-extrabold text-slate-800">
                          {slot.startTime} - {slot.endTime}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">Room: {slot.room || 'General'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherSchedule;
