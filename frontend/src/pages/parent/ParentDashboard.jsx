import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import {
  Baby,
  CreditCard,
  Clock,
  Megaphone,
  Calendar,
  AlertCircle,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Skeleton, SkeletonStats, SkeletonCard } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';

const ParentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/parent');
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError('Failed to load parent dashboard');
      }
    } catch (err) {
      console.error('Parent dashboard error:', err);
      setError(err.response?.data?.message || 'Failed to load family portal from server');
      showToast('Failed to load parent portal', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div className="rounded-3xl p-6 sm:p-8 bg-slate-200/60 border border-slate-200/80 space-y-3">
          <Skeleton className="w-32 h-5 rounded-full" />
          <Skeleton className="w-72 h-8 rounded-lg" />
          <Skeleton className="w-full max-w-lg h-4 rounded-md" />
        </div>
        <SkeletonStats count={2} className="grid grid-cols-1 sm:grid-cols-2 gap-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="my-8">
        <ErrorState
          title="Family Portal Unavailable"
          message={error || 'Could not fetch your child records.'}
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

  const {
    parent = {},
    children = [],
    schedule = [],
    currentDay = '',
    pendingTotal = 0,
    announcements = [],
    upcomingEvents = [],
  } = data;

  const displayEvents =
    upcomingEvents && upcomingEvents.length > 0 ? upcomingEvents : (data?.events || []);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase mb-2">
            Parent & Family Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {parent.firstName} {parent.lastName}!
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Stay closely connected with your child's daily learning, attendance, meal routines, and fees.
          </p>
        </div>

        {pendingTotal > 0 && (
          <button
            onClick={() => navigate('/parent/fees')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-extrabold shadow-md transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay Due Fees (${pendingTotal.toLocaleString()})</span>
          </button>
        )}
      </div>

      {/* Children Overview Cards */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Baby className="w-5 h-5 text-emerald-600" />
          <span>My Enrolled Preschooler(s)</span>
        </h2>

        {children.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-slate-400 text-xs">
            No children profiles linked to this parent account.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <div
                key={child._id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      {child.profilePhoto ? (
                        <img
                          src={child.profilePhoto}
                          alt={child.firstName}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-extrabold flex items-center justify-center text-xl shadow-sm">
                          {child.firstName?.[0] || 'C'}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                          {child.firstName} {child.lastName}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {child.studentId}</p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        child.todayAttendance === 'Present'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : child.todayAttendance === 'Late'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : child.todayAttendance === 'Absent'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      Today: {child.todayAttendance || 'Unmarked'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs mb-4">
                    <div>
                      <span className="text-slate-400 block font-medium">Class & Room</span>
                      <span className="font-bold text-slate-800">
                        {child.class?.name || 'Class'} ({child.class?.roomNumber || 'Room'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Lead Teacher</span>
                      <span className="font-bold text-slate-800">
                        {child.class?.teacher
                          ? `${child.class.teacher.firstName || ''} ${child.class.teacher.lastName || ''}`.trim() || 'Educator'
                          : 'Educator'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Attendance Percentage</span>
                      <span className="font-bold text-emerald-600 text-sm">
                        {child.attendanceRate !== undefined ? child.attendanceRate : 100}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Pending Fees</span>
                      <span
                        className={`font-bold text-sm ${
                          child.pendingFee > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        ${child.pendingFee || 0}
                      </span>
                    </div>
                  </div>

                  {child.allergies && child.allergies !== 'None' && (
                    <p className="text-xs text-rose-600 font-bold flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Allergy Alert on File: {child.allergies}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => navigate('/parent/child')}
                    className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => navigate('/parent/attendance')}
                    className="flex-1 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Attendance Log
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routine & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Child's Daily Routine */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <h3 className="text-base font-bold text-slate-900">Today's Routine & Timetable ({currentDay})</h3>
              </div>
              <button
                onClick={() => navigate('/parent/schedule')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Weekly <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {schedule.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">
                No active class periods scheduled for today ({currentDay}).
              </p>
            ) : (
              <div className="space-y-3">
                {schedule.map((slot) => (
                  <div
                    key={slot._id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800">{slot.activityName || slot.activity}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {slot.activityType || 'Activity'} • {slot.room || 'Classroom'}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Daily learning & playtime periods</span>
            <span className="font-semibold text-slate-600">{schedule.length} slots active</span>
          </div>
        </div>

        {/* School Notices for Parents */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">School Notices & Bulletins</h3>
              </div>
              <button
                onClick={() => navigate('/parent/announcements')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                All Notices <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {announcements.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">
                No active announcements for families at this time.
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((a) => (
                  <div key={a._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate pr-2">{a.title}</h4>
                      <Badge variant={a.priority || 'Normal'} text={a.priority || 'Normal'} showDot={false} />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400">Published official circulars</span>
          </div>
        </div>
      </div>

      {/* Upcoming Events Section for Parents */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Upcoming Family & School Events</h3>
          </div>
          <button
            onClick={() => navigate('/parent/events')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Full Calendar <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayEvents.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">
            No upcoming events scheduled right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayEvents.slice(0, 3).map((ev) => {
              const evDate = ev.date || ev.eventDate;
              const dateObj = evDate ? new Date(evDate) : new Date();

              return (
                <div
                  key={ev._id}
                  onClick={() => navigate('/parent/events')}
                  className="cursor-pointer p-4 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/30 border border-slate-100 hover:border-emerald-200 transition-all flex items-start gap-3.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center flex-shrink-0 font-bold shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider leading-none">
                      {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg leading-tight font-black">{dateObj.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 inline-block mb-1">
                      {ev.category || 'School Event'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{ev.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {ev.startTime} - {ev.endTime}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {ev.location || 'Pre-School Campus'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
