import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  CalendarCheck,
  Calendar,
  School,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  UserX,
  Search,
  Filter,
  History,
  Edit2,
} from 'lucide-react';

const STATUS_CONFIG = {
  PRESENT: {
    label: 'Present',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    btnActive: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20',
    icon: CheckCircle2,
  },
  LATE: {
    label: 'Late',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    btnActive: 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20',
    icon: Clock,
  },
  ABSENT: {
    label: 'Absent',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    btnActive: 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/20',
    icon: XCircle,
  },
  LEAVE: {
    label: 'Leave',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    btnActive: 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20',
    icon: UserX,
  },
};

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AttendanceManagement = () => {
  // Navigation tabs: 'daily' (Take Attendance) or 'history' (Attendance History)
  const [activeTab, setActiveTab] = useState('daily');

  // Shared state
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [isExistingAttendance, setIsExistingAttendance] = useState(false);

  // Daily Marking State
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // History State
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyStats, setHistoryStats] = useState({ total: 0, present: 0, late: 0, absent: 0, leave: 0, attendanceRate: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyClass, setHistoryClass] = useState('');
  const [historyStatus, setHistoryStatus] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');

  // Single Student History Modal
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [studentModalHistory, setStudentModalHistory] = useState(null);
  const [studentModalLoading, setStudentModalLoading] = useState(false);

  // Edit Single Record Modal
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('PRESENT');
  const [editRemarks, setEditRemarks] = useState('');
  const [editingSubmitting, setEditingSubmitting] = useState(false);

  const { showToast } = useToast();

  // Load classrooms on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        const classList =
          res.data?.data?.classes ||
          res.data?.classes ||
          (Array.isArray(res.data?.data) ? res.data.data : []);
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClass(classList[0]._id);
        }
      } catch (err) {
        showToast('Failed to load classes', 'error');
      }
    };
    fetchClasses();
  }, []);

  // Extract distinct class names and sections
  const classNames = useMemo(() => {
    const list = [];
    classes.forEach((c) => {
      const name = c.className || c.name?.replace(/\s+[A-Z]$/, '') || c.name;
      if (name && !list.includes(name)) list.push(name);
    });
    return list;
  }, [classes]);

  const currentClass = useMemo(() => {
    return classes.find((c) => c._id === selectedClass) || classes[0] || null;
  }, [classes, selectedClass]);

  const currentClassName = currentClass
    ? (currentClass.className || currentClass.name?.replace(/\s+[A-Z]$/, '') || currentClass.name)
    : '';
  const currentSection = currentClass?.section || 'A';

  const availableSections = useMemo(() => {
    if (!currentClassName) return ['A'];
    const matches = classes.filter(
      (c) => (c.className || c.name?.replace(/\s+[A-Z]$/, '') || c.name) === currentClassName
    );
    const sects = matches.map((c) => c.section || 'A');
    return Array.from(new Set(sects));
  }, [classes, currentClassName]);

  const handleSelectClassName = (name) => {
    let match = classes.find(
      (c) =>
        (c.className || c.name?.replace(/\s+[A-Z]$/, '') || c.name) === name &&
        (c.section || 'A') === currentSection
    );
    if (!match) {
      match = classes.find(
        (c) => (c.className || c.name?.replace(/\s+[A-Z]$/, '') || c.name) === name
      );
    }
    if (match) setSelectedClass(match._id);
  };

  const handleSelectSection = (sec) => {
    const match = classes.find(
      (c) =>
        (c.className || c.name?.replace(/\s+[A-Z]$/, '') || c.name) === currentClassName &&
        (c.section || 'A') === sec
    );
    if (match) setSelectedClass(match._id);
  };

  // Fetch class students and existing daily attendance
  const loadDailyAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    try {
      setLoadingDaily(true);
      const [studentsRes, attendanceRes] = await Promise.all([
        api.get(`/students?classId=${selectedClass}&status=Active&limit=100`),
        api.get(`/attendance?classId=${selectedClass}&dateString=${selectedDate}`),
      ]);

      const fetchedStudents =
        studentsRes.data?.data?.students ||
        studentsRes.data?.students ||
        (Array.isArray(studentsRes.data?.data) ? studentsRes.data.data : []);
      setStudents(fetchedStudents);

      const existingLogs =
        attendanceRes.data?.data?.records ||
        attendanceRes.data?.records ||
        (Array.isArray(attendanceRes.data?.data) ? attendanceRes.data.data : []);

      setIsExistingAttendance(existingLogs.length > 0);

      const newMap = {};
      const newRemarks = {};

      fetchedStudents.forEach((st) => {
        const log = existingLogs.find(
          (l) => String(l.student?._id || l.student) === String(st._id)
        );
        if (log) {
          newMap[st._id] = (log.status || 'PRESENT').toUpperCase();
          newRemarks[st._id] = log.remarks || '';
        } else {
          // Default to PRESENT for unmarked students
          newMap[st._id] = 'PRESENT';
          newRemarks[st._id] = '';
        }
      });

      setAttendanceMap(newMap);
      setRemarksMap(newRemarks);
    } catch (err) {
      showToast('Failed to fetch class attendance', 'error');
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      loadDailyAttendance();
    }
  }, [selectedClass, selectedDate, activeTab]);

  // Load Attendance History
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams();
      if (historyClass) params.append('classId', historyClass);
      if (historyStartDate) params.append('startDate', historyStartDate);
      if (historyEndDate) params.append('endDate', historyEndDate);
      if (historyStatus && historyStatus !== 'ALL') params.append('status', historyStatus);
      if (historySearch) params.append('search', historySearch.trim());

      const res = await api.get(`/attendance?${params.toString()}`);
      const payload = res.data?.data || res.data || {};
      const records = payload.records || (Array.isArray(payload) ? payload : []);
      const stats = payload.stats || {
        total: records.length,
        present: records.filter((r) => ['PRESENT', 'Present'].includes(r.status)).length,
        late: records.filter((r) => ['LATE', 'Late'].includes(r.status)).length,
        absent: records.filter((r) => ['ABSENT', 'Absent'].includes(r.status)).length,
        leave: records.filter((r) => ['LEAVE', 'Leave'].includes(r.status)).length,
        attendanceRate: records.length > 0 ? Math.round((records.filter((r) => ['PRESENT', 'LATE'].includes((r.status||'').toUpperCase())).length / records.length) * 100) : 0,
      };

      setHistoryRecords(records);
      setHistoryStats(stats);
    } catch (err) {
      showToast('Failed to load attendance history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, historyClass, historyStartDate, historyEndDate, historyStatus]);

  // Filter students in daily roster
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const fullName = `${st.firstName} ${st.lastName}`.toLowerCase();
      const stId = (st.studentId || '').toLowerCase();
      const matchesSearch =
        !studentSearch.trim() ||
        fullName.includes(studentSearch.toLowerCase().trim()) ||
        stId.includes(studentSearch.toLowerCase().trim());

      const currentStatus = attendanceMap[st._id] || 'PRESENT';
      const matchesStatus =
        statusFilter === 'ALL' || currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, studentSearch, statusFilter, attendanceMap]);

  // Change individual status
  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  // Change individual remark
  const handleRemarkChange = (studentId, remark) => {
    setRemarksMap((prev) => ({ ...prev, [studentId]: remark }));
  };

  // Bulk set status for all students in class
  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((st) => {
      updated[st._id] = status;
    });
    setAttendanceMap(updated);
    showToast(`Marked all ${students.length} students as ${STATUS_CONFIG[status]?.label}`, 'info');
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    try {
      setSaving(true);
      const attendanceData = students.map((st) => ({
        studentId: st._id,
        status: attendanceMap[st._id] || 'PRESENT',
        remarks: remarksMap[st._id] || '',
      }));

      const res = await api.post('/attendance/bulk', {
        classId: selectedClass,
        date: selectedDate,
        attendanceData,
        records: attendanceData,
      });

      if (res.data?.success) {
        showToast('Attendance saved successfully.', 'success');
        loadDailyAttendance();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save attendance';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Open Student History Modal
  const handleOpenStudentModal = async (student) => {
    setSelectedStudentForModal(student);
    setStudentModalLoading(true);
    try {
      const res = await api.get(`/attendance/student/${student._id}`);
      setStudentModalHistory(res.data?.data || null);
    } catch (err) {
      showToast(`Failed to load history for ${student.firstName}`, 'error');
    } finally {
      setStudentModalLoading(false);
    }
  };

  // Open Edit Record Modal
  const handleOpenEditRecord = (record) => {
    setEditingRecord(record);
    setEditStatus((record.status || 'PRESENT').toUpperCase());
    setEditRemarks(record.remarks || '');
  };

  // Submit Edit Record
  const handleSaveEditedRecord = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      setEditingSubmitting(true);
      const res = await api.put(`/attendance/${editingRecord._id}`, {
        status: editStatus,
        remarks: editRemarks,
      });

      if (res.data?.success) {
        showToast('Attendance record updated successfully', 'success');
        setEditingRecord(null);
        loadHistory();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update record', 'error');
    } finally {
      setEditingSubmitting(false);
    }
  };

  // Daily Statistics
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'LATE').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;
  const leaveCount = Object.values(attendanceMap).filter((s) => s === 'LEAVE').length;
  const totalEnrolled = students.length;
  const dailyRate = totalEnrolled > 0 ? Math.round(((presentCount + lateCount) / totalEnrolled) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span>Attendance Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Record classroom attendance, track tardiness & absences, inspect historical logs, and review attendance percentages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'daily' && (
            <button
              onClick={handleSaveAttendance}
              disabled={saving || students.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save & Publish Attendance'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Toggle: Take Attendance vs History & Logs */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-2 border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Daily Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Attendance History & Audit</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: DAILY MARKING ================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Controls: Select Class, Select Division, Select Date, Quick Mark */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Select Class */}
              <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <School className="w-4 h-4 text-indigo-600" />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Class
                  </label>
                  <select
                    value={currentClassName}
                    onChange={(e) => handleSelectClassName(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {classNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Division / Section */}
              <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <School className="w-4 h-4 text-purple-600" />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Division / Section
                  </label>
                  <select
                    value={currentSection}
                    onChange={(e) => handleSelectSection(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {availableSections.map((sec) => (
                      <option key={sec} value={sec}>
                        Division {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Date */}
              <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Quick Bulk Marking Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden xl:inline">
                Bulk Actions:
              </span>
              <button
                type="button"
                onClick={() => handleMarkAll('PRESENT')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('LATE')}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors"
              >
                All Late
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('ABSENT')}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
              >
                All Absent
              </button>
            </div>
          </div>

          {/* Existing Attendance Notice Banner */}
          {isExistingAttendance && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold animate-fade-in shadow-subtle">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Attendance for this class and date already exists. You can update it.</span>
              </div>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                Existing Record
              </span>
            </div>
          )}

          {/* Live Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</span>
              <p className="text-xl font-black text-slate-800 mt-0.5">{totalEnrolled}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 shadow-subtle text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Present</span>
              <p className="text-xl font-black text-emerald-800 mt-0.5">{presentCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 shadow-subtle text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Late</span>
              <p className="text-xl font-black text-amber-800 mt-0.5">{lateCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/60 shadow-subtle text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Absent</span>
              <p className="text-xl font-black text-rose-800 mt-0.5">{absentCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 shadow-subtle text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Leave</span>
              <p className="text-xl font-black text-blue-800 mt-0.5">{leaveCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 shadow-subtle text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Attendance %</span>
              <p className="text-xl font-black text-indigo-800 mt-0.5">{dailyRate}%</p>
            </div>
          </div>

          {/* Student Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student by name or ID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto">
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
                  {st === 'ALL' ? 'All Students' : STATUS_CONFIG[st]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Roster Marking Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            {loadingDaily ? (
              <LoadingSpinner text="Fetching student attendance list..." />
            ) : filteredStudents.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No students match criteria"
                description={
                  studentSearch || statusFilter !== 'ALL'
                    ? 'Try adjusting your search query or filter tab.'
                    : 'There are currently no active students assigned to this classroom.'
                }
              />
            ) : (
              <div className="overflow-x-auto min-w-0">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-6">Student</th>
                      <th className="py-4 px-4">Student ID</th>
                      <th className="py-4 px-4 text-center">Status (PRESENT / LATE / ABSENT / LEAVE)</th>
                      <th className="py-4 px-6">Teacher Remarks</th>
                      <th className="py-4 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((st) => {
                      const currentStatus = attendanceMap[st._id] || 'PRESENT';
                      return (
                        <tr key={st._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              {st.profilePhoto ? (
                                <img
                                  src={st.profilePhoto}
                                  alt={st.firstName}
                                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-primary-500/10"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                                  {st.firstName?.[0] || 'S'}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-slate-900 text-sm">
                                  {st.firstName} {st.lastName}
                                </span>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  {st.gender || 'Preschooler'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{st.studentId}</td>

                          {/* 4 Status Toggle Buttons */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100/70 rounded-2xl border border-slate-200/60 w-fit mx-auto">
                              {/* PRESENT */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st._id, 'PRESENT')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  currentStatus === 'PRESENT'
                                    ? STATUS_CONFIG.PRESENT.btnActive
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </button>

                              {/* LATE */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st._id, 'LATE')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  currentStatus === 'LATE'
                                    ? STATUS_CONFIG.LATE.btnActive
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Late</span>
                              </button>

                              {/* ABSENT */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st._id, 'ABSENT')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  currentStatus === 'ABSENT'
                                    ? STATUS_CONFIG.ABSENT.btnActive
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </button>

                              {/* LEAVE */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st._id, 'LEAVE')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  currentStatus === 'LEAVE'
                                    ? STATUS_CONFIG.LEAVE.btnActive
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Leave</span>
                              </button>
                            </div>
                          </td>

                          {/* Remarks */}
                          <td className="py-3.5 px-6">
                            <input
                              type="text"
                              placeholder="Add reason or note (e.g., Fever, Dentist)..."
                              value={remarksMap[st._id] || ''}
                              onChange={(e) => handleRemarkChange(st._id, e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                          </td>

                          {/* Actions: View Student History */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenStudentModal(st)}
                              className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                              title="View Student Attendance Log"
                            >
                              <History className="w-4 h-4" />
                            </button>
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
      )}

      {/* ================= TAB 2: ATTENDANCE HISTORY & AUDIT ================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* History Filter Panel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Classroom */}
              <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <School className="w-4 h-4 text-indigo-600" />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Filter Class
                  </label>
                  <select
                    value={historyClass}
                    onChange={(e) => setHistoryClass(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="">All Classrooms</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.className || c.name} ({c.section})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <Filter className="w-4 h-4 text-slate-400" />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={historyStatus}
                    onChange={(e) => setHistoryStatus(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LEAVE">Leave</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search Input & Reset Button */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadHistory()}
                  placeholder="Search student or note..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={loadHistory}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* History Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Entries</span>
              <p className="text-xl font-black text-slate-800 mt-0.5">{historyStats.total}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 shadow-subtle text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Present</span>
              <p className="text-xl font-black text-emerald-800 mt-0.5">{historyStats.present}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 shadow-subtle text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Late</span>
              <p className="text-xl font-black text-amber-800 mt-0.5">{historyStats.late}</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/60 shadow-subtle text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Absent</span>
              <p className="text-xl font-black text-rose-800 mt-0.5">{historyStats.absent}</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 shadow-subtle text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Leave</span>
              <p className="text-xl font-black text-blue-800 mt-0.5">{historyStats.leave}</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 shadow-subtle text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Average %</span>
              <p className="text-xl font-black text-indigo-800 mt-0.5">{historyStats.attendanceRate}%</p>
            </div>
          </div>

          {/* Historical Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            {historyLoading ? (
              <LoadingSpinner text="Fetching attendance history..." />
            ) : historyRecords.length === 0 ? (
              <EmptyState
                icon={History}
                title="No attendance records found"
                description="No logs match your selected date range or classroom filters."
              />
            ) : (
              <div className="overflow-x-auto min-w-0">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Student</th>
                      <th className="py-4 px-4">Class</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4">Marked By</th>
                      <th className="py-4 px-6">Remarks</th>
                      <th className="py-4 px-4 text-center">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyRecords.map((r) => {
                      const st = (r.status || 'PRESENT').toUpperCase();
                      const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.PRESENT;
                      const Icon = cfg.icon;
                      const formattedDate = r.dateString || (r.date ? new Date(r.date).toISOString().split('T')[0] : 'N/A');

                      return (
                        <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-6 font-mono font-bold text-slate-700">{formattedDate}</td>

                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              {r.student?.profilePhoto ? (
                                <img
                                  src={r.student.profilePhoto}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
                                  {r.student?.firstName?.[0] || 'S'}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-slate-800">
                                  {r.student?.firstName} {r.student?.lastName}
                                </span>
                                <p className="text-[10px] text-slate-400 font-mono">{r.student?.studentId}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {r.class?.className || r.class?.name || 'Classroom'} ({r.class?.section || 'A'})
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.badge}`}>
                              <Icon className="w-3.5 h-3.5" />
                              <span>{cfg.label}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {r.markedBy?.name || 'Staff Member'}
                          </td>

                          <td className="py-3.5 px-6 text-slate-600 italic">
                            {r.remarks || '—'}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRecord(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                              title="Edit Record Status"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
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
      )}

      {/* ================= MODAL 1: SINGLE STUDENT ATTENDANCE HISTORY ================= */}
      {selectedStudentForModal && (
        <Modal
          isOpen={Boolean(selectedStudentForModal)}
          onClose={() => {
            setSelectedStudentForModal(null);
            setStudentModalHistory(null);
          }}
          title={`Attendance History: ${selectedStudentForModal.firstName} ${selectedStudentForModal.lastName}`}
          size="lg"
        >
          <div className="space-y-5">
            {studentModalLoading ? (
              <LoadingSpinner text="Loading student history..." />
            ) : !studentModalHistory ? (
              <EmptyState
                icon={CalendarCheck}
                title="No logs found"
                description="This student has no attendance history records."
              />
            ) : (
              <>
                {/* Student Stats Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Days</span>
                    <p className="text-lg font-bold text-slate-800">{studentModalHistory.stats?.totalDays || 0}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 text-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-700">Present</span>
                    <p className="text-lg font-bold text-emerald-800">{studentModalHistory.stats?.presentDays || 0}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 text-center">
                    <span className="text-[10px] font-bold uppercase text-amber-700">Late</span>
                    <p className="text-lg font-bold text-amber-800">{studentModalHistory.stats?.lateDays || 0}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-50 text-center">
                    <span className="text-[10px] font-bold uppercase text-rose-700">Absent</span>
                    <p className="text-lg font-bold text-rose-800">{studentModalHistory.stats?.absentDays || 0}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-indigo-50 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase text-indigo-700">Rate</span>
                    <p className="text-lg font-bold text-indigo-800">{studentModalHistory.stats?.attendanceRate || 0}%</p>
                  </div>
                </div>

                {/* History List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-100">
                  {(studentModalHistory.records || []).map((r) => {
                    const st = (r.status || 'PRESENT').toUpperCase();
                    const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.PRESENT;
                    const Icon = cfg.icon;
                    const dateFormatted = r.dateString || (r.date ? new Date(r.date).toISOString().split('T')[0] : '');

                    return (
                      <div key={r._id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{dateFormatted}</p>
                          {r.remarks && <p className="text-[11px] text-slate-500 italic mt-0.5">"{r.remarks}"</p>}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.badge}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cfg.label}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* ================= MODAL 2: EDIT ATTENDANCE RECORD ================= */}
      {editingRecord && (
        <Modal
          isOpen={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          title="Update Attendance Record"
          size="md"
        >
          <form onSubmit={handleSaveEditedRecord} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student</label>
              <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {editingRecord.student?.firstName} {editingRecord.student?.lastName} ({editingRecord.student?.studentId})
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Attendance Status</label>
              <div className="grid grid-cols-2 gap-2">
                {['PRESENT', 'LATE', 'ABSENT', 'LEAVE'].map((st) => {
                  const cfg = STATUS_CONFIG[st];
                  const Icon = cfg.icon;
                  const isSelected = editStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        isSelected ? cfg.btnActive : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Note</label>
              <input
                type="text"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="Reason or explanation..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editingSubmitting}
                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 disabled:opacity-50"
              >
                {editingSubmitting ? 'Updating...' : 'Update Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AttendanceManagement;
