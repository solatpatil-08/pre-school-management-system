import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import {
  Users2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  School,
  MapPin,
  RefreshCw,
  X,
  AlertTriangle,
  User,
  ShieldAlert,
  Briefcase,
} from 'lucide-react';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Initial Form state
  const initialForm = {
    teacherId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Female',
    qualification: 'Early Childhood Education Diploma',
    designation: 'Lead Teacher',
    specialization: 'Montessori Method & Sensory Development',
    joiningDate: new Date().toISOString().split('T')[0],
    assignedClasses: [],
    address: '',
    profilePhoto: '',
    emergencyContact: { name: '', phone: '', relationship: 'Spouse' },
    status: 'Active',
  };
  const [formData, setFormData] = useState(initialForm);

  const { showToast } = useToast();

  // Helper to fetch all available classes for multi-assignment
  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      const classList = res.data.classes || res.data.data || [];
      setClasses(classList);
    } catch (err) {
      console.error('Error fetching classes for teacher assignment:', err);
    }
  };

  // Fetch teachers with search, filters, sorting, and pagination
  const fetchTeachers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      let query = `/teachers?page=${page}&limit=10`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;
      if (selectedStatus) query += `&status=${selectedStatus}`;
      if (selectedGender) query += `&gender=${selectedGender}`;
      if (selectedClass) query += `&classId=${selectedClass}`;
      if (sortBy) query += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;

      const res = await api.get(query);
      const teacherList = res.data.teachers || res.data.data || [];

      setTeachers(teacherList);
      setCurrentPage(res.data.currentPage || res.data.page || page);
      setTotalPages(res.data.totalPages || res.data.pages || 1);
      setTotalItems(res.data.total !== undefined ? res.data.total : teacherList.length);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load teacher directory';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Debounced search and reactive filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedStatus, selectedGender, selectedClass, sortBy, sortOrder]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setSelectedGender('');
    setSelectedClass('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    Boolean(search) || Boolean(selectedStatus) || Boolean(selectedGender) || Boolean(selectedClass);

  // Modal open handlers
  const handleOpenAdd = () => {
    setActiveTeacher(null);
    setFormData(initialForm);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    setActiveTeacher(teacher);
    setFormData({
      teacherId: teacher.teacherId || teacher.employeeId || '',
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : '',
      gender: teacher.gender || 'Female',
      qualification: teacher.qualification || 'Early Childhood Education Diploma',
      designation: teacher.designation || 'Lead Teacher',
      specialization: teacher.specialization || 'General Pre-School Curriculum',
      joiningDate: teacher.joiningDate
        ? teacher.joiningDate.split('T')[0]
        : new Date().toISOString().split('T')[0],
      assignedClasses: (teacher.assignedClasses || []).map((c) => c._id || c),
      address: teacher.address || '',
      profilePhoto: teacher.profilePhoto || '',
      emergencyContact: {
        name: teacher.emergencyContact?.name || '',
        phone: teacher.emergencyContact?.phone || '',
        relationship: teacher.emergencyContact?.relationship || 'Spouse',
      },
      status: teacher.status || 'Active',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenView = async (teacher) => {
    try {
      const res = await api.get(`/teachers/${teacher._id}`);
      const teacherData = res.data.teacher || res.data.data;
      if (teacherData) {
        setActiveTeacher(teacherData);
        setIsViewOpen(true);
      }
    } catch (err) {
      showToast('Failed to load teacher profile details', 'error');
    }
  };

  const handleOpenDelete = (teacher) => {
    setActiveTeacher(teacher);
    setIsDeleteOpen(true);
  };

  // Checkbox toggle for multi-class assignment
  const handleClassCheckbox = (classId) => {
    setFormData((prev) => {
      const exists = prev.assignedClasses.includes(classId);
      if (exists) {
        return {
          ...prev,
          assignedClasses: prev.assignedClasses.filter((id) => id !== classId),
        };
      } else {
        return {
          ...prev,
          assignedClasses: [...prev.assignedClasses, classId],
        };
      }
    });
  };

  // Submit Handler (Create or Update)
  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      showToast('Please fill all mandatory educator fields (*)', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
      };

      if (activeTeacher) {
        await api.put(`/teachers/${activeTeacher._id}`, payload);
        showToast('Teacher profile updated successfully', 'success');
        setIsAddEditOpen(false);
        fetchTeachers(currentPage);
      } else {
        await api.post('/teachers', payload);
        showToast('Educator registered successfully', 'success');
        setIsAddEditOpen(false);
        fetchTeachers(1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save teacher details';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Confirm Handler
  const handleDeleteConfirm = async () => {
    if (!activeTeacher) return;
    try {
      setFormSubmitting(true);
      await api.delete(`/teachers/${activeTeacher._id}`);
      showToast('Teacher record removed successfully', 'success');
      setIsDeleteOpen(false);
      setActiveTeacher(null);
      fetchTeachers(currentPage);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete teacher record';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
              <Users2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Teacher & Staff Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage preschool educators, classroom assignments, designations, and contact profiles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTeachers(currentPage)}
            title="Refresh educators list"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Teacher / Staff</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by educator name, ID, email, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Resigned">Resigned</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Gender Filter */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {/* Assigned Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="">All Assigned Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} ({cls.section})
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(':');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="firstName:asc">Name (A-Z)</option>
              <option value="firstName:desc">Name (Z-A)</option>
              <option value="teacherId:asc">Teacher ID</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Active filters applied • Found <strong className="text-slate-800">{totalItems}</strong> educator(s)
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset all</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && !loading && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800 animate-shake">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Error loading teachers</p>
              <p className="text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchTeachers(currentPage)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table / Content Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving educators directory from server..." />
        ) : teachers.length === 0 ? (
          <EmptyState
            icon={Users2}
            title={hasActiveFilters ? 'No matching educators found' : 'No teachers registered yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search query or filters to discover matching staff records.'
                : 'Get started by adding your first preschool educator or early childhood teacher.'
            }
            actionText={hasActiveFilters ? 'Clear Filters' : 'Add First Teacher'}
            onAction={hasActiveFilters ? handleResetFilters : handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Educator</th>
                  <th className="py-3.5 px-4">Teacher ID</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Assigned Classroom(s)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((tch) => {
                  const displayId = tch.teacherId || tch.employeeId || 'TCH-1000';
                  return (
                    <tr key={tch._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Educator Info */}
                      <td className="py-3.5 px-6 flex items-center gap-3">
                        {tch.profilePhoto ? (
                          <img
                            src={tch.profilePhoto}
                            alt={tch.firstName}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                            {tch.firstName?.[0] || 'T'}
                            {tch.lastName?.[0] || ''}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {tch.firstName} {tch.lastName}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {tch.qualification || 'Certified Educator'}
                          </span>
                        </div>
                      </td>

                      {/* Teacher ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                          {displayId}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-700 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{tch.email}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{tch.phone}</span>
                        </p>
                      </td>

                      {/* Designation */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {tch.designation || 'Lead Teacher'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {tch.specialization || 'General Curriculum'}
                        </span>
                      </td>

                      {/* Assigned Classes */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {tch.assignedClasses && tch.assignedClasses.length > 0 ? (
                            tch.assignedClasses.map((c) => (
                              <span
                                key={c._id || c}
                                className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100 flex items-center gap-1"
                              >
                                <School className="w-2.5 h-2.5" />
                                <span>{c.name || 'Class'} ({c.section || 'A'})</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">None assigned</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={tch.status} text={tch.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenView(tch)}
                            title="View Educator Profile"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(tch)}
                            title="Edit Educator"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(tch)}
                            title="Remove Educator"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={(p) => fetchTeachers(p)}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={activeTeacher ? 'Edit Educator Profile' : 'Register New Teacher / Staff'}
        subtitle="Provide complete personal, academic, designation, and classroom details"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveTeacher} className="space-y-5">
          {/* Section: Personal Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary-500" />
              <span>Personal & Contact Info</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. Sarah"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. Jenkins"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="sarah.jenkins@preschool.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="+1 (555) 234-5678"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={formData.profilePhoto}
                  onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
          </div>

          {/* Section: Professional Designation & Qualifications */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span>Professional & Employment Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Teacher ID <span className="font-normal text-slate-400 lowercase">(auto if blank)</span>
                </label>
                <input
                  type="text"
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. TCH-1004"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. Lead Teacher, Early STEM"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Qualification
                </label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. B.Ed, Montessori Diploma"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. Early Literacy & Phonics"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Joining Date
                </label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Assigned Classrooms Multi-Select */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assigned Classrooms</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Select one or multiple classrooms this educator will oversee for attendance and activities.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto">
              {classes.map((cls) => {
                const isChecked = formData.assignedClasses.includes(cls._id);
                return (
                  <label
                    key={cls._id}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleClassCheckbox(cls._id)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="block">{cls.name} ({cls.section})</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {cls.roomNumber || 'Room 101'} • Cap: {cls.capacity}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section: Address & Emergency Contact */}
          <div className="pt-2 border-t border-slate-100">
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="Residential street address, city, state, zip"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Emergency Contact Person</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Emergency Contact Name"
                  value={formData.emergencyContact.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none bg-white"
                />
                <input
                  type="tel"
                  placeholder="Emergency Contact Phone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none bg-white"
                />
                <input
                  type="text"
                  placeholder="Relationship (e.g. Spouse)"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: {
                        ...formData.emergencyContact,
                        relationship: e.target.value,
                      },
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{formSubmitting ? 'Saving...' : activeTeacher ? 'Save Changes' : 'Register Educator'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* View Teacher Profile Modal */}
      {activeTeacher && isViewOpen && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`${activeTeacher.firstName} ${activeTeacher.lastName}`}
          subtitle={`Teacher ID: ${activeTeacher.teacherId || activeTeacher.employeeId}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Header Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-100">
              {activeTeacher.profilePhoto ? (
                <img
                  src={activeTeacher.profilePhoto}
                  alt={activeTeacher.firstName}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white font-extrabold flex items-center justify-center text-xl shadow-sm">
                  {activeTeacher.firstName?.[0] || 'T'}
                  {activeTeacher.lastName?.[0] || ''}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">
                    {activeTeacher.firstName} {activeTeacher.lastName}
                  </h3>
                  <Badge variant={activeTeacher.status} text={activeTeacher.status} />
                </div>
                <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                  {activeTeacher.designation || 'Lead Teacher'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  ID: {activeTeacher.teacherId || activeTeacher.employeeId} • Joined:{' '}
                  {activeTeacher.joiningDate
                    ? new Date(activeTeacher.joiningDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Gender</span>
                <p className="font-bold text-slate-800 mt-0.5">{activeTeacher.gender || 'Female'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Date of Birth</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {activeTeacher.dateOfBirth
                    ? new Date(activeTeacher.dateOfBirth).toLocaleDateString()
                    : 'Not specified'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Qualification</span>
                <p className="font-bold text-slate-800 mt-0.5 truncate" title={activeTeacher.qualification}>
                  {activeTeacher.qualification || 'Diploma'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Specialization</span>
                <p className="font-bold text-slate-800 mt-0.5 truncate" title={activeTeacher.specialization}>
                  {activeTeacher.specialization || 'General'}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary-600" />
                <span>Contact & Communication Details</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 text-[11px] block">Email Address</span>
                  <p className="font-semibold text-slate-900 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {activeTeacher.email}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Phone Number</span>
                  <p className="font-semibold text-slate-900 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-primary-500" />
                    {activeTeacher.phone}
                  </p>
                </div>
                {activeTeacher.address && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 text-[11px] block">Residential Address</span>
                    <p className="text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      {activeTeacher.address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Classrooms Card */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs">
              <span className="font-bold text-indigo-900 block mb-2 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-indigo-600" />
                <span>Assigned Classroom(s) & Students</span>
              </span>
              {activeTeacher.assignedClasses && activeTeacher.assignedClasses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeTeacher.assignedClasses.map((cls) => (
                    <div
                      key={cls._id || cls}
                      className="p-3 rounded-xl bg-white border border-indigo-100 shadow-xs"
                    >
                      <p className="font-bold text-slate-900">
                        {cls.name} ({cls.section || 'A'})
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cls.roomNumber ? `${cls.roomNumber} • ` : ''}Capacity: {cls.capacity || 20} students
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No classroom assigned to this educator yet.</p>
              )}
            </div>

            {/* Emergency Contact */}
            {activeTeacher.emergencyContact && activeTeacher.emergencyContact.name && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Emergency Contact:</span>
                </span>
                <p className="font-semibold text-slate-800">
                  {activeTeacher.emergencyContact.name} ({activeTeacher.emergencyContact.relationship || 'Spouse'})
                </p>
                <p className="text-slate-500 font-mono mt-0.5">{activeTeacher.emergencyContact.phone}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsViewOpen(false);
                  handleOpenEdit(activeTeacher);
                }}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Educator Profile"
        message={`Are you sure you want to remove ${activeTeacher?.firstName} ${activeTeacher?.lastName} (${activeTeacher?.teacherId || activeTeacher?.employeeId})? Any active classroom assignments will be unlinked.`}
        confirmText="Yes, Remove Educator"
        isLoading={formSubmitting}
      />
    </div>
  );
};

export default TeacherManagement;
