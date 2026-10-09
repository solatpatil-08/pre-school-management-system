import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  Printer,
} from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'fees', 'enrollment'
  const [attendanceData, setAttendanceData] = useState(null);
  const [feesData, setFeesData] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [attRes, feesRes, enrRes] = await Promise.all([
        api.get('/reports/attendance'),
        api.get('/reports/fees'),
        api.get('/reports/enrollment'),
      ]);

      if (attRes.data.success) setAttendanceData(attRes.data.data);
      if (feesRes.data.success) setFeesData(feesRes.data.data);
      if (enrRes.data.success) setEnrollmentData(enrRes.data.data);
    } catch (err) {
      showToast('Failed to load analytical reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Executive insights into student attendance performance, revenue receipts, and classroom capacity.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export Summary</span>
        </button>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap rounded-2xl bg-white p-1.5 border border-slate-200/80 shadow-card gap-1 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-1 sm:flex-none ${
            activeTab === 'attendance'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Attendance Analytics</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fees')}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-1 sm:flex-none ${
            activeTab === 'fees'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Financial Collections</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('enrollment')}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-1 sm:flex-none ${
            activeTab === 'enrollment'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Enrollment</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16">
          <LoadingSpinner text="Computing school analytics..." />
        </div>
      ) : (
        <div>
          {/* 1. ATTENDANCE REPORT */}
          {activeTab === 'attendance' && attendanceData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Rate</p>
                  <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
                    {attendanceData.overallRate}%
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Present + Late Attendance</span>
                </div>
                <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 shadow-card text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Present Count</p>
                  <h3 className="text-3xl font-extrabold text-emerald-800 mt-1">
                    {attendanceData.statusBreakdown?.Present || 0}
                  </h3>
                </div>
                <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-100 shadow-card text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Late Count</p>
                  <h3 className="text-3xl font-extrabold text-amber-800 mt-1">
                    {attendanceData.statusBreakdown?.Late || 0}
                  </h3>
                </div>
                <div className="bg-rose-50/60 rounded-2xl p-5 border border-rose-100 shadow-card text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Absent Count</p>
                  <h3 className="text-3xl font-extrabold text-rose-800 mt-1">
                    {attendanceData.statusBreakdown?.Absent || 0}
                  </h3>
                </div>
              </div>

              {/* Class by Class Attendance Performance */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
                <h3 className="text-base font-bold text-slate-900 mb-4">Classroom Attendance Performance</h3>
                <div className="space-y-4">
                  {attendanceData.classStats?.map((c, i) => (
                    <div key={i} className="text-xs sm:text-sm">
                      <div className="flex justify-between font-semibold text-slate-700 mb-1.5">
                        <span className="font-bold text-slate-900">{c.className}</span>
                        <span className="text-slate-500 font-medium">
                          <strong className="text-slate-800">{c.rate}%</strong> Presence ({c.Present} Present, {c.Absent} Absent, {c.Late} Late)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${c.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. FEES & FINANCIALS REPORT */}
          {activeTab === 'fees' && feesData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Billed</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                    ₹{(feesData.summary?.totalBilled || 0).toLocaleString()}
                  </h3>
                </div>
                <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 shadow-card">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Collected</p>
                  <h3 className="text-3xl font-extrabold text-emerald-800 mt-1">
                    ₹{(feesData.summary?.totalCollected || 0).toLocaleString()}
                  </h3>
                </div>
                <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-100 shadow-card">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Outstanding</p>
                  <h3 className="text-3xl font-extrabold text-amber-800 mt-1">
                    ₹{(feesData.summary?.pendingBalance || 0).toLocaleString()}
                  </h3>
                </div>
                <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 shadow-card">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Collection Rate</p>
                  <h3 className="text-3xl font-extrabold text-indigo-800 mt-1">
                    {feesData.summary?.collectionRate || 0}%
                  </h3>
                </div>
              </div>

              {/* By Category Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
                <h3 className="text-base font-bold text-slate-900 mb-4">Collections by Fee Category</h3>
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                        <th className="pb-3 font-semibold">Fee Type</th>
                        <th className="pb-3 font-semibold">Invoices Issued</th>
                        <th className="pb-3 font-semibold">Billed (₹)</th>
                        <th className="pb-3 font-semibold">Collected (₹)</th>
                        <th className="pb-3 font-semibold">Pending (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {feesData.feeTypeBreakdown?.map((item) => (
                        <tr key={item.type} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 font-bold text-slate-800">{item.type}</td>
                          <td className="py-3.5 text-slate-600 font-medium">{item.count}</td>
                          <td className="py-3.5 font-semibold text-slate-900">₹{item.billed.toLocaleString()}</td>
                          <td className="py-3.5 font-bold text-emerald-600">₹{item.collected.toLocaleString()}</td>
                          <td className="py-3.5 font-bold text-amber-600">₹{item.pending.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. ENROLLMENT REPORT */}
          {activeTab === 'enrollment' && enrollmentData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrolled</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{enrollmentData.total}</h3>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    {enrollmentData.active} Active Students
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Gender Ratio</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Boys</span>
                      <p className="text-xl font-bold text-indigo-600">{enrollmentData.genderBreakdown?.Male}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Girls</span>
                      <p className="text-xl font-bold text-pink-600">{enrollmentData.genderBreakdown?.Female}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Alumni / Graduated</p>
                  <h3 className="text-3xl font-extrabold text-slate-700 mt-1">
                    {enrollmentData.graduated || 0}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Kindergarten Ready</span>
                </div>
              </div>

              {/* Classroom Occupancy Roster */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
                <h3 className="text-base font-bold text-slate-900 mb-4">Classroom Capacities & Occupancy</h3>
                <div className="space-y-4">
                  {enrollmentData.classEnrollments?.map((c) => (
                    <div key={c.id} className="text-xs sm:text-sm">
                      <div className="flex justify-between font-semibold text-slate-700 mb-1.5">
                        <span className="font-bold text-slate-900">
                          {c.name} ({c.room})
                        </span>
                        <span className="text-slate-500 font-medium">
                          <strong className="text-slate-800">{c.enrolled}</strong> / {c.capacity} Enrolled ({c.occupancyRate}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            c.occupancyRate >= 90 ? 'bg-rose-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(c.occupancyRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
