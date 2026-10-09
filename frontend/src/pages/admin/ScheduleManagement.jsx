import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  School,
  User,
  AlertTriangle,
  LayoutGrid,
  ListOrdered,
  MapPin,
} from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ACTIVITY_BADGES = {
  Academic: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Play: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Meal: 'bg-amber-50 text-amber-700 border-amber-200',
  'Arts & Craft': 'bg-pink-50 text-pink-700 border-pink-200',
  'Music & Movement': 'bg-purple-50 text-purple-700 border-purple-200',
  'Nap/Rest': 'bg-blue-50 text-blue-700 border-blue-200',
  Outdoor: 'bg-teal-50 text-teal-700 border-teal-200',
};

const ScheduleManagement = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'timetable' (Mon-Fri Grid) or 'daily' (Single Day timeline)
  const [viewMode, setViewMode] = useState('timetable');
  const [activeDailyDay, setActiveDailyDay] = useState('Monday');

  // Modals & form state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [conflictError, setConflictError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialForm = {
    class: '',
    day: 'Monday',
    activity: '',
    activityType: 'Academic',
    startTime: '09:00',
    endTime: '09:45',
    teacher: '',
    room: '',
    academicYear: '2026-2027',
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const { showToast } = useToast();

  // Load classrooms and educators
  const fetchDependencies = async () => {
    try {
      const [classRes, teacherRes] = await Promise.all([
        api.get('/classes'),
        api.get('/teachers?limit=100'),
      ]);

      const classList =
        classRes.data?.data?.classes ||
        classRes.data?.classes ||
        (Array.isArray(classRes.data?.data) ? classRes.data.data : []);
      setClasses(classList);

      if (classList.length > 0 && !selectedClass) {
        setSelectedClass(classList[0]._id);
      }

      const teacherList =
        teacherRes.data?.data?.teachers ||
        teacherRes.data?.teachers ||
        (Array.isArray(teacherRes.data?.data) ? teacherRes.data.data : []);
      setTeachers(teacherList);
    } catch (err) {
      showToast('Failed to load classes or teachers', 'error');
    }
  };

  // Load schedules for selected class
  const fetchSchedules = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const res = await api.get(`/schedules?classId=${selectedClass}`);
      const list =
        res.data?.data?.schedules ||
        res.data?.schedules ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setSchedules(list);
    } catch (err) {
      showToast('Failed to retrieve class schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSchedules();
    }
  }, [selectedClass]);

  const currentClassObj = useMemo(() => {
    return classes.find((c) => String(c._id) === String(selectedClass)) || null;
  }, [classes, selectedClass]);

  // Group schedules by day of week (Monday to Saturday)
  const groupedSchedules = useMemo(() => {
    const map = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };

    schedules.forEach((slot) => {
      const day = slot.day || slot.dayOfWeek;
      if (map[day]) {
        map[day].push(slot);
      }
    });

    // Sort each day by startTime
    Object.keys(map).forEach((day) => {
      map[day].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });

    return map;
  }, [schedules]);

  const timeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.trim().split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };

  const intervalsOverlap = (startA, endA, startB, endB) => {
    return startA < endB && endA > startB;
  };

  const handleOpenAdd = (dayPreset = 'Monday') => {
    setConflictError('');
    setActiveSlot(null);
    setFormData({
      ...initialForm,
      class: selectedClass,
      day: dayPreset,
      room: currentClassObj?.room || currentClassObj?.roomNumber || '',
      academicYear: currentClassObj?.academicYear || '2026-2027',
      teacher: currentClassObj?.classTeacher?._id || currentClassObj?.teacher?._id || '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (slot) => {
    setConflictError('');
    setActiveSlot(slot);
    setFormData({
      class: slot.class?._id || slot.class || selectedClass,
      day: slot.day || slot.dayOfWeek || 'Monday',
      activity: slot.activity || slot.activityName || '',
      activityType: slot.activityType || 'Academic',
      startTime: slot.startTime || '09:00',
      endTime: slot.endTime || '09:45',
      teacher: slot.teacher?._id || slot.teacher || '',
      room: slot.room || currentClassObj?.room || '',
      academicYear: slot.academicYear || currentClassObj?.academicYear || '2026-2027',
      notes: slot.notes || '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenDelete = (slot) => {
    setActiveSlot(slot);
    setIsDeleteOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setConflictError('');

    if (!formData.activity.trim() || !formData.startTime || !formData.endTime) {
      showToast('Please provide activity name, start time, and end time', 'warning');
      return;
    }

    const startM = timeToMinutes(formData.startTime);
    const endM = timeToMinutes(formData.endTime);

    if (startM >= endM) {
      const err = 'Start time must be before end time.';
      setConflictError(err);
      showToast(err, 'error');
      return;
    }

    // Client-side timetable conflict detection for this class
    const targetDay = formData.day;
    const currentSlotId = activeSlot?._id ? String(activeSlot._id) : null;
    const targetTeacherId = formData.teacher ? String(formData.teacher) : null;
    const targetRoom = formData.room ? formData.room.trim().toLowerCase() : '';

    for (const slot of schedules) {
      if (currentSlotId && String(slot._id) === currentSlotId) continue;
      const slotDay = slot.day || slot.dayOfWeek;
      if (slotDay !== targetDay) continue;

      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);

      if (intervalsOverlap(startM, endM, slotStart, slotEnd)) {
        const slotActivity = slot.activity || slot.activityName || 'Subject';
        const err = `Schedule conflict: Class already has "${slotActivity}" scheduled from ${slot.startTime} to ${slot.endTime}.`;
        setConflictError(err);
        showToast(err, 'error');
        return;
      }
    }

    const payload = {
      class: formData.class || selectedClass,
      teacher: formData.teacher || null,
      activity: formData.activity.trim(),
      activityName: formData.activity.trim(),
      day: formData.day,
      dayOfWeek: formData.day,
      startTime: formData.startTime.trim(),
      endTime: formData.endTime.trim(),
      room: formData.room.trim(),
      academicYear: formData.academicYear.trim() || '2026-2027',
      activityType: formData.activityType,
      notes: formData.notes.trim(),
    };

    try {
      setFormSubmitting(true);
      if (activeSlot) {
        const res = await api.put(`/schedules/${activeSlot._id}`, payload);
        if (res.data?.success) {
          showToast('Timetable slot updated successfully', 'success');
          setIsAddEditOpen(false);
          fetchSchedules();
        }
      } else {
        const res = await api.post('/schedules', payload);
        if (res.data?.success) {
          showToast('New activity slot scheduled', 'success');
          setIsAddEditOpen(false);
          fetchSchedules();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save timetable slot';
      if (err.response?.status === 409) {
        setConflictError(msg);
        showToast(msg, 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitting(true);
      const res = await api.delete(`/schedules/${activeSlot._id}`);
      if (res.data?.success) {
        showToast('Schedule slot removed', 'success');
        setIsDeleteOpen(false);
        fetchSchedules();
      }
    } catch (err) {
      showToast('Failed to delete schedule slot', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <span>Class Timetable & Daily Schedule</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage Monday-to-Friday schedules, teaching activities, and room allocations with automated conflict prevention.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd(activeDailyDay)}
          disabled={!selectedClass}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Timetable Slot</span>
        </button>
      </div>

      {/* Control Bar: Class Selector & View Toggles */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Class Selector & Class Teacher Display */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <School className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Selected Classroom
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="mt-0.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.className || cls.name} (Section {cls.section}) • {cls.room || cls.roomNumber}
                </option>
              ))}
            </select>
          </div>

          {currentClassObj && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-500 font-medium">Class Teacher:</span>
              <span className="font-bold text-indigo-900">
                {currentClassObj.classTeacher?.firstName
                  ? `${currentClassObj.classTeacher.firstName} ${currentClassObj.classTeacher.lastName || ''}`.trim()
                  : (currentClassObj.teacher?.firstName
                      ? `${currentClassObj.teacher.firstName} ${currentClassObj.teacher.lastName || ''}`.trim()
                      : 'Not Assigned')}
              </span>
            </div>
          )}
        </div>

        {/* View Switcher: Weekly Timetable (Mon-Sat) vs Daily Schedule */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl self-stretch md:self-auto border border-slate-200/50">
          <button
            type="button"
            onClick={() => setViewMode('timetable')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'timetable'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Timetable View (Mon - Sat)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'daily'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Daily Schedule View</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading timetable schedule..." />
      ) : !selectedClass ? (
        <EmptyState
          icon={School}
          title="No classroom selected"
          description="Create or select a classroom to view and manage its timetable."
        />
      ) : (
        <>
          {/* VIEW 1: WEEKLY TIMETABLE (Monday to Saturday) */}
          {viewMode === 'timetable' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
                <span>
                  Showing weekly schedule for{' '}
                  <strong className="text-slate-800 font-bold">
                    {currentClassObj?.className || currentClassObj?.name}
                  </strong>{' '}
                  ({schedules.length} total activity slots)
                </span>
                <span className="hidden sm:inline">Conflict prevention active across classes, teachers, and rooms</span>
              </div>

              {/* 6-Column Responsive Timetable Grid (Monday - Saturday) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
                {WEEKDAYS.map((day) => {
                  const daySlots = groupedSchedules[day] || [];
                  return (
                    <div
                      key={day}
                      className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200/80 shadow-subtle flex flex-col min-h-[380px]"
                    >
                      {/* Day Column Header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                        <div>
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{day}</h3>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {daySlots.length} {daySlots.length === 1 ? 'activity' : 'activities'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenAdd(day)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center border border-slate-200 shadow-2xs transition-colors"
                          title={`Add activity on ${day}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Day Cards List */}
                      <div className="space-y-3 flex-1">
                        {daySlots.length === 0 ? (
                          <div className="h-40 flex flex-col items-center justify-center text-center p-3">
                            <Clock className="w-5 h-5 text-slate-300 mb-1.5" />
                            <p className="text-[11px] text-slate-400 font-medium">No slots scheduled</p>
                            <button
                              onClick={() => handleOpenAdd(day)}
                              className="mt-2 text-[10px] font-bold text-indigo-600 hover:underline"
                            >
                              + Add Slot
                            </button>
                          </div>
                        ) : (
                          daySlots.map((slot) => {
                            const badgeStyle =
                              ACTIVITY_BADGES[slot.activityType] || 'bg-slate-100 text-slate-700 border-slate-200';
                            return (
                              <div
                                key={slot._id}
                                className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-subtle hover:shadow-card hover:border-slate-300 transition-all flex flex-col justify-between group"
                              >
                                <div>
                                  {/* Slot Header: Type & Action buttons */}
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${badgeStyle}`}
                                    >
                                      {slot.activityType || 'Academic'}
                                    </span>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleOpenEdit(slot)}
                                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                                        title="Edit Slot"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleOpenDelete(slot)}
                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-50"
                                        title="Delete Slot"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Activity Title */}
                                  <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-snug mb-2">
                                    {slot.activity || slot.activityName}
                                  </h4>

                                  {/* Time */}
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary-700 mb-1.5">
                                    <Clock className="w-3 h-3 text-primary-500" />
                                    <span>
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </div>

                                  {/* Teacher & Room */}
                                  <div className="space-y-1 text-[10px] text-slate-500 font-medium">
                                    <div className="flex items-center gap-1 truncate">
                                      <User className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                                      <span className="truncate">
                                        {slot.teacher
                                          ? `${slot.teacher.firstName} ${slot.teacher.lastName}`
                                          : 'No Teacher'}
                                      </span>
                                    </div>
                                    {slot.room && (
                                      <div className="flex items-center gap-1 truncate">
                                        <MapPin className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                                        <span className="truncate">{slot.room}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {slot.notes && (
                                  <p className="mt-2 pt-1.5 border-t border-slate-50 text-[10px] text-slate-400 italic truncate">
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
            </div>
          )}

          {/* VIEW 2: DAILY SCHEDULE VIEW (Single day focus with timeline) */}
          {viewMode === 'daily' && (
            <div className="space-y-5">
              {/* Day selection tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {WEEKDAYS.map((day) => {
                  const isActive = activeDailyDay === day;
                  const count = groupedSchedules[day]?.length || 0;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setActiveDailyDay(day)}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <span>{day}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isActive ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Day Schedule Content */}
              {groupedSchedules[activeDailyDay]?.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={`No activities scheduled for ${activeDailyDay}`}
                  description="Add subject lessons, circle times, snack routines, or outdoor play for this day."
                  actionText={`Add Activity for ${activeDailyDay}`}
                  onAction={() => handleOpenAdd(activeDailyDay)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groupedSchedules[activeDailyDay].map((slot) => {
                    const badgeStyle =
                      ACTIVITY_BADGES[slot.activityType] || 'bg-slate-100 text-slate-700 border-slate-200';
                    return (
                      <div
                        key={slot._id}
                        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}
                            >
                              {slot.activityType || 'Academic'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(slot)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                title="Edit Slot"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(slot)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-base font-black text-slate-900 tracking-tight mb-2">
                            {slot.activity || slot.activityName}
                          </h3>

                          <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                            <div className="flex items-center justify-between font-bold text-indigo-700">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Slot Time:</span>
                              </span>
                              <span>
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-500">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>Educator:</span>
                              </span>
                              <strong className="text-slate-800">
                                {slot.teacher
                                  ? `${slot.teacher.firstName} ${slot.teacher.lastName}`
                                  : 'Unassigned'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>Location:</span>
                              </span>
                              <span className="font-semibold text-slate-700">
                                {slot.room || currentClassObj?.room || 'General Classroom'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {slot.notes && (
                          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 italic">
                            "{slot.notes}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Timetable Slot Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={activeSlot ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
        subtitle={`Scheduling for ${currentClassObj?.className || currentClassObj?.name || 'Class'}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          {/* Conflict Warning Banner */}
          {conflictError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Conflict Prevented</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{conflictError}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Activity / Subject Name (activity) *
            </label>
            <input
              type="text"
              required
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              placeholder="e.g. Early Phonics, Finger Painting, or Outdoor Free Play"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Day of Week (day) *</label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Activity Category</label>
              <select
                value={formData.activityType}
                onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="Academic">Academic</option>
                <option value="Play">Play & Free Choice</option>
                <option value="Meal">Meal / Snack</option>
                <option value="Arts & Craft">Arts & Craft</option>
                <option value="Music & Movement">Music & Movement</option>
                <option value="Nap/Rest">Nap / Rest</option>
                <option value="Outdoor">Outdoor Sensory</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Time (24h or HH:MM) *</label>
              <input
                type="text"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="09:00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Time (24h or HH:MM) *</label>
              <input
                type="text"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="09:45"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Teacher (teacher)</label>
              <select
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="">-- No Teacher Assigned --</option>
                {teachers.map((tch) => (
                  <option key={tch._id} value={tch._id}>
                    {tch.firstName} {tch.lastName} ({tch.employeeId || tch.teacherId || 'Educator'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Room / Venue (room)</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="e.g. Room 101 or Playground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Curriculum Notes / Instructions</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              placeholder="e.g. Bring art smock, sunscreen, or sensory supplies"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 transition-all"
            >
              {formSubmitting ? 'Validating...' : activeSlot ? 'Update Slot' : 'Add Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Slot Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Timetable Slot"
        message={`Are you sure you want to remove "${activeSlot?.activity || activeSlot?.activityName}" (${activeSlot?.startTime} - ${activeSlot?.endTime}) from the timetable?`}
        confirmText="Confirm Delete"
        isLoading={formSubmitting}
      />
    </div>
  );
};

export default ScheduleManagement;
