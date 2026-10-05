import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  UserX,
  Baby,
} from 'lucide-react';

const STATUS_CONFIG = {
  PRESENT: {
    label: 'Present',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  LATE: {
    label: 'Late',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  ABSENT: {
    label: 'Absent',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
  LEAVE: {
    label: 'Leave',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: UserX,
  },
};

const ParentAttendance = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { showToast } = useToast();

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance');
      const payload = res.data?.data || res.data || {};
      const list = payload.records || (Array.isArray(payload) ? payload : []);

      setAttendanceLogs(list);
    } catch {
      showToast('Failed to load child attendance logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Extract distinct children from the attendance logs
  const childrenList = useMemo(() => {
    const map = new Map();
    attendanceLogs.forEach((log) => {
      if (log.student?._id) {
        map.set(String(log.student._id), `${log.student.firstName} ${log.student.lastName}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [attendanceLogs]);

  // Filter logs by child and status
  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      const matchesChild =
        selectedChildId === 'ALL' ||
        String(log.student?._id || log.student) === selectedChildId;

      const st = (log.status || 'PRESENT').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || st === statusFilter;

      return matchesChild && matchesStatus;
    });
  }, [attendanceLogs, selectedChildId, statusFilter]);

  // Compute metrics for filtered selection
  const totalDays = filteredLogs.length;
  const presentDays = filteredLogs.filter((l) => (l.status || '').toUpperCase() === 'PRESENT').length;
  const lateDays = filteredLogs.filter((l) => (l.status || '').toUpperCase() === 'LATE').length;
  const absentDays = filteredLogs.filter((l) => (l.status || '').toUpperCase() === 'ABSENT').length;
  const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <span>Child Attendance Record</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Monitor your child's daily school presence, on-time arrivals, and excused leaves.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total School Days</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalDays}</p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 shadow-subtle text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Days Present</span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{presentDays}</p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/60 shadow-subtle text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Late Arrivals</span>
          <p className="text-2xl font-black text-amber-800 mt-1">{lateDays}</p>
        </div>

        <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/60 shadow-subtle text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Absences</span>
          <p className="text-2xl font-black text-rose-800 mt-1">{absentDays}</p>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 shadow-subtle text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Attendance Rate</span>
          <p className="text-2xl font-black text-indigo-800 mt-1">{attendanceRate}%</p>
        </div>
      </div>

      {/* Filter Bar: Select Child & Status Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        {childrenList.length > 1 ? (
          <div className="flex items-center gap-2.5">
            <Baby className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-600">Select Child:</span>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            >
              <option value="ALL">All Children</option>
              {childrenList.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
            <Baby className="w-4 h-4 text-indigo-600" />
            <span>Attendance Records</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PRESENT', 'LATE', 'ABSENT', 'LEAVE'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All' : STATUS_CONFIG[st]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching attendance records..." />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No attendance entries recorded"
            description="Attendance logs will appear here once marked by the class educator."
          />
        ) : (
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Child Name</th>
                  <th className="py-4 px-4">Class</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-6">Educator Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const st = (log.status || 'PRESENT').toUpperCase();
                  const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.PRESENT;
                  const Icon = cfg.icon;
                  const dateStr = log.dateString || (log.date ? new Date(log.date).toISOString().split('T')[0] : '—');

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-700">{dateStr}</td>

                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {log.student?.firstName} {log.student?.lastName}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {log.class?.className || log.class?.name || 'Class'} ({log.class?.section || 'A'})
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cfg.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-slate-600 italic">
                        {log.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentAttendance;
