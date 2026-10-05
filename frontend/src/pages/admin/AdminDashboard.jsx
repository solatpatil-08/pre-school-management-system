import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import EnrollmentChart from '../../components/dashboard/EnrollmentChart';
import FeeChart from '../../components/dashboard/FeeChart';
import RecentActivities from '../../components/dashboard/RecentActivities';
import {
  GraduationCap,
  Users2,
  HeartHandshake,
  CalendarCheck,
  CreditCard,
  Calendar,
  Megaphone,
  PlusCircle,
  UserCheck,
  UserX,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Skeleton, SkeletonStats, SkeletonCard } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/admin');
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError('Failed to load dashboard metrics');
      }
    } catch (err) {
      console.error('Admin dashboard error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard metrics from server');
      showToast('Failed to load dashboard metrics', 'error');
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
        {/* Header Skeleton */}
        <div className="rounded-3xl p-6 sm:p-8 bg-slate-200/60 border border-slate-200/80 space-y-3">
          <Skeleton className="w-32 h-5 rounded-full" />
          <Skeleton className="w-80 h-8 rounded-lg" />
          <Skeleton className="w-full max-w-xl h-4 rounded-md" />
        </div>
        {/* KPI Skeleton Grids */}
        <div className="space-y-3">
          <Skeleton className="w-48 h-4 rounded-md" />
          <SkeletonStats count={4} />
        </div>
        <div className="space-y-3">
          <Skeleton className="w-48 h-4 rounded-md" />
          <SkeletonStats count={4} />
        </div>
        {/* Charts Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard className="h-64" />
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
          title="Admin Dashboard Unavailable"
          message={error || 'Could not fetch database analytics and KPIs.'}
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

  const {
    counts = {},
    attendanceToday = {},
    financials = {},
    charts = {},
    upcomingEvents = [],
    recentAnnouncements = [],
    recentStudents = [],
    recentActivities = [],
  } = data;

  const attendanceOverviewData = charts.attendanceOverview || [];
  const enrollmentData = charts.studentEnrollment || [];
  const feeChartData = charts.feeCollection || financials;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Top Banner / Welcome */}
      <div className="rounded-3xl bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700 p-6 sm:p-8 text-white shadow-xl shadow-primary-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase mb-2">
            Administrator Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sunshine Kids Executive Dashboard
          </h1>
          <p className="text-primary-100 text-sm mt-1 max-w-xl">
            Live overview of student admissions, educator assignments, daily attendance logs, and school fee collections.
          </p>
        </div>

        {/* Quick action shortcuts */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => navigate('/admin/students')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-primary-700 hover:bg-primary-50 text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Student</span>
          </button>
          <button
            onClick={() => navigate('/admin/attendance')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-500/40 hover:bg-primary-500/60 border border-white/20 text-white text-xs font-bold backdrop-blur-sm transition-all"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => navigate('/admin/fees')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Fee Ledger</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid: Core Entities */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
          School Population & Operations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Students"
            value={counts.students || 0}
            subtitle="Enrolled Active Preschoolers"
            icon={GraduationCap}
            color="indigo"
            onClick={() => navigate('/admin/students')}
          />
          <StatCard
            title="Total Teachers"
            value={counts.teachers || 0}
            subtitle="Qualified Early Educators"
            icon={Users2}
            color="purple"
            onClick={() => navigate('/admin/teachers')}
          />
          <StatCard
            title="Total Parents"
            value={counts.parents || 0}
            subtitle="Active Guardian Profiles"
            icon={HeartHandshake}
            color="emerald"
            onClick={() => navigate('/admin/parents')}
          />
          <StatCard
            title="Today's Attendance"
            value={`${attendanceToday.rate || 0}%`}
            subtitle={`${attendanceToday.present || 0} Present / ${attendanceToday.totalMarked || 0} Marked`}
            icon={CalendarCheck}
            color="blue"
            onClick={() => navigate('/admin/attendance')}
          />
        </div>
      </div>

      {/* Secondary KPI Grid: Today's Specific Attendance & Fee Balances */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
          Daily Attendance & Financial Balances
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Present Students */}
          <div
            onClick={() => navigate('/admin/attendance')}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Present Students</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-900">{attendanceToday.present || 0}</span>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {attendanceToday.late ? `+${attendanceToday.late} late arrivals` : 'Active in classrooms today'}
              </p>
            </div>
          </div>

          {/* Absent Students */}
          <div
            onClick={() => navigate('/admin/attendance')}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Absent Students</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-900">{attendanceToday.absent || 0}</span>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                {attendanceToday.leave ? `${attendanceToday.leave} excused leave(s)` : 'Requires guardian follow-up'}
              </p>
            </div>
          </div>

          {/* Pending Fees */}
          <div
            onClick={() => navigate('/admin/fees')}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Pending Fees</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-900">
                ${(financials.pendingFees !== undefined ? financials.pendingFees : (financials.totalPending || 0)).toLocaleString()}
              </span>
              <p className="text-[11px] text-amber-700 font-semibold mt-1">
                {financials.pendingCount || 0} invoice(s) awaiting payment
              </p>
            </div>
          </div>

          {/* Overdue Fees */}
          <div
            onClick={() => navigate('/admin/fees')}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Overdue Fees</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-rose-600">
                ${(financials.overdueFees !== undefined ? financials.overdueFees : (financials.totalOverdue || 0)).toLocaleString()}
              </span>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                {financials.overdueCount || 0} invoice(s) past due date
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: 3 Useful Charts */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
          Executive Analytical Charts
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Attendance Overview */}
          <AttendanceChart data={attendanceOverviewData} />

          {/* Chart 2: Student Enrollment Statistics */}
          <EnrollmentChart data={enrollmentData} />

          {/* Chart 3: Fee Collection Overview */}
          <FeeChart data={feeChartData} />
        </div>
      </div>

      {/* Middle Section: Recent Activities & Recently Enrolled Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities Feed (Real MongoDB Events) */}
        <RecentActivities activities={recentActivities} />

        {/* Recently Enrolled Students Table */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary-600" />
                <h3 className="text-base font-bold text-slate-900">Recently Enrolled Students</h3>
              </div>
              <button
                onClick={() => navigate('/admin/students')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Directory <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Class</th>
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                        No students enrolled yet.
                      </td>
                    </tr>
                  ) : (
                    recentStudents.map((st) => (
                      <tr key={st._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 flex items-center gap-2.5">
                          {st.profilePhoto ? (
                            <img
                              src={st.profilePhoto}
                              alt={st.firstName}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                              {st.firstName?.[0] || 'S'}
                            </div>
                          )}
                          <span className="font-semibold text-slate-800">
                            {st.firstName} {st.lastName}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{st.class?.name || 'Unassigned'}</td>
                        <td className="py-3 font-mono text-slate-500">{st.studentId}</td>
                        <td className="py-3">
                          <Badge variant={st.status || 'Active'} text={st.status || 'Active'} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400">Total active learners: {counts.students || 0}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Announcements & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Announcements */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Recent Announcements</h3>
              </div>
              <button
                onClick={() => navigate('/admin/announcements')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentAnnouncements.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No announcements broadcasted yet.</p>
            ) : (
              <div className="space-y-3">
                {recentAnnouncements.slice(0, 3).map((a) => (
                  <div key={a._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{a.title}</h4>
                        <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {a.targetRole}
                        </span>
                      </div>
                      <Badge variant={a.status || 'Published'} text={a.status || 'Published'} showDot={true} />
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events Preview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Upcoming Events</h3>
              </div>
              <button
                onClick={() => navigate('/admin/events')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Calendar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No upcoming events scheduled on the calendar.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map((ev) => {
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
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{ev.title}</h4>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            {ev.category || 'Event'}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {ev.startTime} - {ev.endTime} • {ev.location || 'Pre-School Campus'}
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

export default AdminDashboard;
