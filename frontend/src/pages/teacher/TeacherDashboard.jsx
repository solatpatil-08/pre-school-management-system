import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  GraduationCap,
  CalendarCheck,
  Clock,
  Megaphone,
  ArrowRight,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Skeleton, SkeletonStats, SkeletonCard } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';

const TeacherDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/teacher');
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError('Failed to load educator dashboard');
      }
    } catch (err) {
      console.error('Teacher dashboard error:', err);
      setError(err.response?.data?.message || 'Failed to load educator workspace from server');
      showToast('Failed to load educator dashboard', 'error');
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
        <SkeletonStats count={3} className="grid grid-cols-1 sm:grid-cols-3 gap-5" />
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
          title="Educator Workspace Unavailable"
          message={error || 'Could not fetch your assigned classroom data.'}
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

  const {
    teacherInfo = {},
    assignedClasses = [],
    totalAssignedStudents = 0,
    todayAttendance = {},
    todaySchedule = [],
    currentDay = '',
    announcements = [],
    students = [],
    events = [],
    upcomingEvents = [],
  } = data;

  const displayEvents = upcomingEvents.length > 0 ? upcomingEvents : events;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase mb-2">
            Educator Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, Teacher {teacherInfo.firstName || 'Educator'}!
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Here is your daily classroom routine, today's attendance summary, and announcements for {currentDay}.
          </p>
        </div>

        <button
          onClick={() => navigate('/teacher/attendance')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-sm transition-all"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Mark Class Attendance</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Assigned Students"
          value={totalAssignedStudents}
          subtitle={`Across ${assignedClasses.length} classroom(s)`}
          icon={GraduationCap}
          color="indigo"
          onClick={() => navigate('/teacher/students')}
        />
        <StatCard
          title="Today's Attendance"
          value={`${todayAttendance.rate !== undefined ? todayAttendance.rate : 0}%`}
          subtitle={`${todayAttendance.present || 0} Present / ${todayAttendance.totalStudents || 0} Enrolled`}
          icon={CalendarCheck}
          color="emerald"
          onClick={() => navigate('/teacher/attendance')}
        />
        <StatCard
          title="Today's Schedule Slots"
          value={todaySchedule.length}
          subtitle={`Curriculum & play periods`}
          icon={Clock}
          color="blue"
          onClick={() => navigate('/teacher/schedule')}
        />
      </div>

      {/* Two Column Layout: Today's Schedule & Assigned Classroom Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <h3 className="text-base font-bold text-slate-900">Today's Class Schedule ({currentDay})</h3>
              </div>
              <button
                onClick={() => navigate('/teacher/schedule')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Full Week <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todaySchedule.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-10">
                No activity slots scheduled for your classes today ({currentDay}).
              </p>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((slot) => (
                  <div
                    key={slot._id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{slot.activityName || slot.activity}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {slot.class?.name} • Room: {slot.room || 'Classroom'} • {slot.activityType || 'Activity'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-primary-50 text-primary-700 font-bold text-xs border border-primary-100">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Classroom routine synchronized with curriculum</span>
            <span className="font-semibold text-slate-600">{todaySchedule.length} periods active</span>
          </div>
        </div>

        {/* Assigned Students Quick List */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">My Assigned Students</h3>
              </div>
              <button
                onClick={() => navigate('/teacher/students')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View Roster <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {students.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-10">
                No active students assigned to your classroom roster.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {students.slice(0, 5).map((st) => (
                  <div key={st._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      {st.profilePhoto ? (
                        <img
                          src={st.profilePhoto}
                          alt={st.firstName}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {st.firstName?.[0] || 'S'}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-800">
                          {st.firstName} {st.lastName}
                        </span>
                        <p className="text-[10px] text-slate-400">{st.class?.name || 'Class'}</p>
                      </div>
                    </div>
                    {st.allergies && st.allergies !== 'None' ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                        Allergy: {st.allergies}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No allergies</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400">Total assigned: {totalAssignedStudents} learners</span>
          </div>
        </div>
      </div>

      {/* Announcements & Upcoming Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Bulletins */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Staff Announcements & Bulletins</h3>
              </div>
              <button
                onClick={() => navigate('/teacher/announcements')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                All Notices <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active staff notices right now.</p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((a) => (
                  <div key={a._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate pr-2">{a.title}</h4>
                      <Badge variant={a.priority || 'Normal'} text={a.priority || 'Normal'} showDot={false} />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming School Events */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Upcoming School Events</h3>
              </div>
              <button
                onClick={() => navigate('/teacher/events')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Full Calendar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {displayEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No upcoming events scheduled.</p>
            ) : (
              <div className="space-y-3">
                {displayEvents.slice(0, 3).map((ev) => {
                  const evDate = ev.date || ev.eventDate;
                  const dateObj = evDate ? new Date(evDate) : new Date();

                  return (
                    <div
                      key={ev._id}
                      className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex items-start gap-3"
                    >
                      <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center flex-shrink-0 font-bold shadow-sm">
                        <span className="text-[9px] uppercase tracking-wider leading-none">
                          {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-base leading-tight font-black">{dateObj.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{ev.title}</h4>
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          {ev.startTime} - {ev.endTime}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
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
      </div>
    </div>
  );
};

export default TeacherDashboard;
