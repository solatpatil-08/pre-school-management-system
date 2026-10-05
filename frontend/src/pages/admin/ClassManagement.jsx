import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  School,
  Plus,
  Edit2,
  Trash2,
  Users2,
  GraduationCap,
  MapPin,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');

  // Modals & Active state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [activeClass, setActiveClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialForm = {
    className: '',
    section: 'A',
    room: '',
    capacity: 20,
    classTeacher: '',
    academicYear: '2026-2027',
    status: 'Active',
    description: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, teacherRes] = await Promise.all([
        api.get('/classes'),
        api.get('/teachers?limit=100'),
      ]);

      const classList =
        classRes.data?.data?.classes ||
        classRes.data?.classes ||
        (Array.isArray(classRes.data?.data) ? classRes.data.data : []);
      setClasses(classList);

      const teacherList =
        teacherRes.data?.data?.teachers ||
        teacherRes.data?.teachers ||
        (Array.isArray(teacherRes.data?.data) ? teacherRes.data.data : []);
      setTeachers(teacherList);
    } catch (err) {
      showToast('Failed to load classrooms and educators', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setActiveClass(null);
    setFormData(initialForm);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (cls) => {
    setActiveClass(cls);
    setFormData({
      className: cls.className || cls.name || '',
      section: cls.section || 'A',
      room: cls.room || cls.roomNumber || '',
      capacity: cls.capacity || 20,
      classTeacher: cls.classTeacher?._id || cls.teacher?._id || cls.classTeacher || cls.teacher || '',
      academicYear: cls.academicYear || '2026-2027',
      status: cls.status || 'Active',
      description: cls.description || '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenDelete = (cls) => {
    setActiveClass(cls);
    setIsDeleteOpen(true);
  };

  const handleViewStudents = async (cls) => {
    try {
      setActiveClass(cls);
      setLoadingStudents(true);
      setIsStudentsOpen(true);
      const res = await api.get(`/classes/${cls._id}`);
      const retrieved = res.data?.data?.class || res.data?.class || res.data?.data;
      setClassStudents(retrieved?.students || []);
    } catch (err) {
      showToast('Failed to fetch class student roster', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!formData.className.trim() || !formData.room.trim()) {
      showToast('Please provide classroom name and room identifier', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        className: formData.className.trim(),
        name: formData.className.trim(),
        section: formData.section.trim(),
        room: formData.room.trim(),
        roomNumber: formData.room.trim(),
        capacity: Number(formData.capacity) || 20,
        classTeacher: formData.classTeacher || null,
        teacher: formData.classTeacher || null,
        academicYear: formData.academicYear.trim() || '2026-2027',
        status: formData.status || 'Active',
        description: formData.description.trim(),
      };

      if (activeClass) {
        const res = await api.put(`/classes/${activeClass._id}`, payload);
        if (res.data?.success) {
          showToast('Classroom updated successfully', 'success');
          setIsAddEditOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/classes', payload);
        if (res.data?.success) {
          showToast('New classroom created successfully', 'success');
          setIsAddEditOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save classroom';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitting(true);
      const res = await api.delete(`/classes/${activeClass._id}`);
      if (res.data?.success) {
        showToast('Classroom removed successfully', 'success');
        setIsDeleteOpen(false);
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete class';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const name = (cls.className || cls.name || '').toLowerCase();
      const room = (cls.room || cls.roomNumber || '').toLowerCase();
      const section = (cls.section || '').toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = !q || name.includes(q) || room.includes(q) || section.includes(q);
      const matchesStatus = statusFilter === 'All' || cls.status === statusFilter;
      const matchesSection = sectionFilter === 'All' || cls.section === sectionFilter;

      return matchesSearch && matchesStatus && matchesSection;
    });
  }, [classes, searchQuery, statusFilter, sectionFilter]);

  // Compute stats
  const totalCapacity = useMemo(() => classes.reduce((sum, c) => sum + (c.capacity || 0), 0), [classes]);
  const totalEnrolled = useMemo(() => classes.reduce((sum, c) => sum + (c.studentCount || 0), 0), [classes]);
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center shadow-sm">
              <School className="w-5 h-5" />
            </div>
            <span>Classroom & Section Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure preschool classrooms, room allocations, educator assignments, and student rosters.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Classroom</span>
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <School className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Classes</p>
            <p className="text-lg font-black text-slate-800">{classes.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Enrolled Students</p>
            <p className="text-lg font-black text-slate-800">{totalEnrolled}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Capacity</p>
            <p className="text-lg font-black text-slate-800">{totalCapacity}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Occupancy</p>
            <p className="text-lg font-black text-slate-800">{avgOccupancy}%</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search class name, room, or section..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Archived">Archived</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 ml-2">
            <span>Section:</span>
          </div>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
          >
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>
      </div>

      {/* Grid of Class Cards */}
      {loading ? (
        <LoadingSpinner text="Loading classroom directory..." />
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          icon={School}
          title="No classrooms match your query"
          description={
            searchQuery || statusFilter !== 'All'
              ? 'Try adjusting your search criteria or resetting filters.'
              : 'Create your first classroom to begin scheduling routines and enrolling children.'
          }
          actionText={searchQuery ? 'Clear Search' : 'Add Classroom'}
          onAction={searchQuery ? () => setSearchQuery('') : handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const assignedTeacher = cls.classTeacher || cls.teacher;
            const occupancy = cls.capacity > 0 ? Math.round(((cls.studentCount || 0) / cls.capacity) * 100) : 0;
            const isFull = occupancy >= 100;

            return (
              <div
                key={cls._id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                          Section {cls.section || 'A'}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            cls.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : cls.status === 'Archived'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {cls.status || 'Active'}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                        {cls.className || cls.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cls)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit Classroom Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(cls)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Classroom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                    {cls.description || 'Core early childhood learning and play program.'}
                  </p>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Room Location:</span>
                      </span>
                      <strong className="text-slate-800">{cls.room || cls.roomNumber}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Users2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Class Teacher:</span>
                      </span>
                      {assignedTeacher ? (
                        <strong className="text-slate-800">
                          {assignedTeacher.firstName} {assignedTeacher.lastName}
                        </strong>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Academic Year:</span>
                      </span>
                      <span className="font-semibold text-slate-700">{cls.academicYear || '2026-2027'}</span>
                    </div>
                  </div>
                </div>

                {/* Occupancy and View Students */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Roster Capacity</span>
                      </span>
                      <span className={isFull ? 'text-rose-600' : 'text-slate-700'}>
                        {cls.studentCount || 0} / {cls.capacity} students ({occupancy}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          occupancy >= 100
                            ? 'bg-rose-500'
                            : occupancy >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewStudents(cls)}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-subtle hover:border-slate-300"
                  >
                    <Users2 className="w-4 h-4 text-indigo-600" />
                    <span>View Student Roster ({cls.studentCount || 0})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Classroom Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={activeClass ? 'Edit Classroom Details' : 'Create New Classroom'}
        subtitle="Specify classroom capacity, room location, assigned teacher, and academic year"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Classroom Name (className) *
            </label>
            <input
              type="text"
              required
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              placeholder="e.g. Toddler Sunshine Group or Nursery Blossoms"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section</label>
              <input
                type="text"
                required
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="e.g. A"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Room Identifier *</label>
              <input
                type="text"
                required
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="e.g. Room 101 or North Wing Lab"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                max="60"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Academic Year</label>
              <input
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="2026-2027"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Class Teacher / Head Educator</label>
            <select
              value={formData.classTeacher}
              onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            >
              <option value="">-- No Class Teacher Assigned --</option>
              {teachers.map((tch) => (
                <option key={tch._id} value={tch._id}>
                  {tch.firstName} {tch.lastName} ({tch.employeeId || tch.teacherId || 'Educator'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Focus</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              placeholder="e.g. Focus on fine motor development, social collaboration, and foundational literacy"
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
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 transition-all"
            >
              {formSubmitting ? 'Saving...' : activeClass ? 'Update Classroom' : 'Create Classroom'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enrolled Students Modal */}
      {activeClass && (
        <Modal
          isOpen={isStudentsOpen}
          onClose={() => setIsStudentsOpen(false)}
          title={`Enrolled Students: ${activeClass.className || activeClass.name} (Section ${activeClass.section})`}
          subtitle={`Room: ${activeClass.room || activeClass.roomNumber} • Enrolled: ${classStudents.length} / ${activeClass.capacity}`}
          maxWidth="max-w-xl"
        >
          {loadingStudents ? (
            <LoadingSpinner text="Retrieving student list..." />
          ) : classStudents.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-10 font-medium">
              No students are currently enrolled in this classroom.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
              {classStudents.map((st) => (
                <div key={st._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs shadow-sm">
                      {st.profilePhoto ? (
                        <img src={st.profilePhoto} alt="" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        st.firstName?.[0] || 'S'
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {st.firstName} {st.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        ID: {st.studentId} • Gender: {st.gender}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {st.status || 'Active'}
                    </span>
                    {st.parent && (
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        Parent: {st.parent.firstName} {st.parent.lastName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Classroom"
        message={`Are you sure you want to delete ${activeClass?.className || activeClass?.name}? All schedule slots for this class will also be cleaned up. Classes with enrolled students cannot be deleted.`}
        confirmText="Confirm Delete"
        isLoading={formSubmitting}
      />
    </div>
  );
};

export default ClassManagement;
