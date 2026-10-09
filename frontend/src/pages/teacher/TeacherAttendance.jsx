import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
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
} from 'lucide-react';

const STATUS_CONFIG = {
  PRESENT: {
    label: 'Present',
    btnActive: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20',
    icon: CheckCircle2,
  },
  LATE: {
    label: 'Late',
    btnActive: 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20',
    icon: Clock,
  },
  ABSENT: {
    label: 'Absent',
    btnActive: 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/20',
    icon: XCircle,
  },
  LEAVE: {
    label: 'Leave',
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

const TeacherAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [isExistingAttendance, setIsExistingAttendance] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { showToast } = useToast();

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
        showToast('Failed to load your assigned classrooms', 'error');
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

  const loadAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    try {
      setLoading(true);
      const [stRes, attRes] = await Promise.all([
        api.get(`/students?classId=${selectedClass}&status=Active&limit=100`),
        api.get(`/attendance?classId=${selectedClass}&dateString=${selectedDate}`),
      ]);

      const studentList =
        stRes.data?.data?.students ||
        stRes.data?.students ||
        (Array.isArray(stRes.data?.data) ? stRes.data.data : []);
      setStudents(studentList);

      const existingLogs =
        attRes.data?.data?.records ||
        attRes.data?.records ||
        (Array.isArray(attRes.data?.data) ? attRes.data.data : []);

      setIsExistingAttendance(existingLogs.length > 0);

      const newMap = {};
      const newRemarks = {};

      studentList.forEach((st) => {
        const log = existingLogs.find(
          (l) => String(l.student?._id || l.student) === String(st._id)
        );
        if (log) {
          newMap[st._id] = (log.status || 'PRESENT').toUpperCase();
          newRemarks[st._id] = log.remarks || '';
        } else {
          newMap[st._id] = 'PRESENT';
          newRemarks[st._id] = '';
        }
      });

      setAttendanceMap(newMap);
      setRemarksMap(newRemarks);
    } catch (err) {
      showToast('Failed to load attendance logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedClass, selectedDate]);

  const handleStatusChange = (stId, status) => {
    setAttendanceMap((prev) => ({ ...prev, [stId]: status }));
  };

  const handleRemarkChange = (stId, remark) => {
    setRemarksMap((prev) => ({ ...prev, [stId]: remark }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((st) => {
      updated[st._id] = status;
    });
    setAttendanceMap(updated);
    showToast(`Marked all ${students.length} students as ${STATUS_CONFIG[status]?.label}`, 'info');
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    try {
      setSaving(true);
      const records = students.map((st) => ({
        studentId: st._id,
        status: attendanceMap[st._id] || 'PRESENT',
        remarks: remarksMap[st._id] || '',
      }));

      const res = await api.post('/attendance/bulk', {
        classId: selectedClass,
        date: selectedDate,
        attendanceData: records,
        records,
      });

      if (res.data?.success) {
        showToast('Attendance saved successfully.', 'success');
        loadAttendance();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit class attendance';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const fullName = `${st.firstName} ${st.lastName}`.toLowerCase();
      const stId = (st.studentId || '').toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        fullName.includes(searchQuery.toLowerCase().trim()) ||
        stId.includes(searchQuery.toLowerCase().trim());

      const currentStatus = attendanceMap[st._id] || 'PRESENT';
      const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter, attendanceMap]);

  // Statistics
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'LATE').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;
  const leaveCount = Object.values(attendanceMap).filter((s) => s === 'LEAVE').length;
  const totalStudents = students.length;
  const rate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span>Daily Class Attendance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Take morning attendance for your assigned preschoolers and record attendance remarks.
          </p>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Submitting...' : 'Save & Submit Roster'}</span>
        </button>
      </div>

      {/* Control Bar: Class, Division, Date, Quick Mark */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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

        {/* Quick Bulk Marking */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
            Quick Mark:
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

      {/* Metrics Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-card text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</span>
          <p className="text-xl font-black text-slate-800 mt-0.5">{totalStudents}</p>
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
          <p className="text-xl font-black text-indigo-800 mt-0.5">{rate}%</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student by name or ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
          />
        </div>

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
              {st === 'ALL' ? 'All' : STATUS_CONFIG[st]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching classroom roster..." />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No students enrolled or matching"
            description="Adjust your search criteria or confirm students are actively enrolled in this class."
          />
        ) : (
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Student</th>
                  <th className="py-4 px-4">Student ID</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-6">Teacher Observation / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => {
                  const currentStatus = attendanceMap[st._id] || 'PRESENT';
                  return (
                    <tr key={st._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 flex items-center gap-3">
                        {st.profilePhoto ? (
                          <img
                            src={st.profilePhoto}
                            alt=""
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-primary-500/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                            {st.firstName?.[0] || 'S'}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 text-sm">
                            {st.firstName} {st.lastName}
                          </span>
                          <p className="text-[11px] text-slate-400 font-medium">Preschooler</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{st.studentId}</td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100/70 rounded-2xl border border-slate-200/60 w-fit mx-auto">
                          {['PRESENT', 'LATE', 'ABSENT', 'LEAVE'].map((statusKey) => {
                            const cfg = STATUS_CONFIG[statusKey];
                            const Icon = cfg.icon;
                            const isActive = currentStatus === statusKey;
                            return (
                              <button
                                key={statusKey}
                                type="button"
                                onClick={() => handleStatusChange(st._id, statusKey)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isActive ? cfg.btnActive : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{cfg.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-6">
                        <input
                          type="text"
                          placeholder="Observation or remark..."
                          value={remarksMap[st._id] || ''}
                          onChange={(e) => handleRemarkChange(st._id, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
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

export default TeacherAttendance;
