import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import Pagination from '../../components/common/Pagination';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Heart,
  Baby,
  RefreshCw,
  X,
  User,
  ShieldAlert,
} from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form initial state
  const initialForm = {
    studentId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Female',
    admissionDate: new Date().toISOString().split('T')[0],
    class: '',
    parent: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: { name: '', phone: '', relationship: 'Parent' },
    medicalNotes: 'None',
    allergies: 'None',
    bloodGroup: 'Unknown',
    profilePhoto: '',
    status: 'Active',
  };
  const [formData, setFormData] = useState(initialForm);

  const { showToast } = useToast();

  // Calculate age helper
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    const years = Math.abs(ageDt.getUTCFullYear() - 1970);
    const months = Math.floor((diffMs % 31557600000) / 2629800000);
    if (years === 0) return `${months} mos`;
    return months > 0 ? `${years}y ${months}m` : `${years} yrs`;
  };

  // Fetch dropdown dependencies (classes & parents)
  const fetchDependencies = async () => {
    try {
      const [classRes, parentRes] = await Promise.all([
        api.get('/classes'),
        api.get('/parents?limit=100'),
      ]);
      const classList = classRes.data.classes || classRes.data.data || [];
      const parentList = parentRes.data.parents || parentRes.data.data || [];
      setClasses(classList);
      setParents(parentList);
    } catch (err) {
      console.error('Error fetching student dependencies:', err);
    }
  };

  // Fetch students from backend with all parameters
  const fetchStudents = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      let query = `/students?page=${page}&limit=10`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;
      if (selectedClass) query += `&classId=${selectedClass}`;
      if (selectedGender) query += `&gender=${selectedGender}`;
      if (selectedStatus) query += `&status=${selectedStatus}`;
      if (sortBy) query += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;

      const res = await api.get(query);
      const studentList = res.data.students || res.data.data || [];

      setStudents(studentList);
      setCurrentPage(res.data.currentPage || res.data.page || page);
      setTotalPages(res.data.totalPages || res.data.pages || 1);
      setTotalItems(res.data.total !== undefined ? res.data.total : studentList.length);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load students registry';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load classes and parents once
  useEffect(() => {
    fetchDependencies();
  }, []);

  // Debounced search and reactive filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedClass, selectedGender, selectedStatus, sortBy, sortOrder]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedClass('');
    setSelectedGender('');
    setSelectedStatus('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    Boolean(search) || Boolean(selectedClass) || Boolean(selectedGender) || Boolean(selectedStatus);

  // Modal open handlers
  const handleOpenAdd = () => {
    setActiveStudent(null);
    setFormData({
      ...initialForm,
      class: classes[0]?._id || '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (student) => {
    setActiveStudent(student);
    setFormData({
      studentId: student.studentId || '',
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      gender: student.gender || 'Female',
      admissionDate: student.admissionDate
        ? student.admissionDate.split('T')[0]
        : new Date().toISOString().split('T')[0],
      class: student.class?._id || student.class || '',
      parent: student.parent?._id || student.parent || '',
      phone: student.phone || student.contactNumber || '',
      email: student.email || '',
      address: student.address || '',
      emergencyContact: {
        name: student.emergencyContact?.name || '',
        phone: student.emergencyContact?.phone || '',
        relationship: student.emergencyContact?.relationship || 'Parent',
      },
      medicalNotes: student.medicalNotes || 'None',
      allergies: student.allergies || 'None',
      bloodGroup: student.bloodGroup || 'Unknown',
      profilePhoto: student.profilePhoto || '',
      status: student.status || 'Active',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenView = async (student) => {
    try {
      const res = await api.get(`/students/${student._id}`);
      const studentData = res.data.student || res.data.data;
      if (studentData) {
        setActiveStudent(studentData);
        setIsViewOpen(true);
      }
    } catch (err) {
      showToast('Failed to load student details', 'error');
    }
  };

  const handleOpenDelete = (student) => {
    setActiveStudent(student);
    setIsDeleteOpen(true);
  };

  // Save student (Create or Update)
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.dateOfBirth || !formData.class) {
      showToast('Please fill in all mandatory fields (*)', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        parent: formData.parent || null,
      };

      if (activeStudent) {
        // Edit existing student
        await api.put(`/students/${activeStudent._id}`, payload);
        showToast('Student profile updated successfully', 'success');
        setIsAddEditOpen(false);
        fetchStudents(currentPage);
      } else {
        // Enroll new student
        await api.post('/students', payload);
        showToast('Student enrolled successfully', 'success');
        setIsAddEditOpen(false);
        fetchStudents(1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save student record';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete student
  const handleDeleteConfirm = async () => {
    if (!activeStudent) return;
    try {
      setFormSubmitting(true);
      await api.delete(`/students/${activeStudent._id}`);
      showToast('Student deleted successfully', 'success');
      setIsDeleteOpen(false);
      setActiveStudent(null);
      fetchStudents(currentPage);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete student';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary-50 text-primary-600 border border-primary-100 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Student Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage preschool admissions, class assignments, parent linkages, and health notes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStudents(currentPage)}
            title="Refresh student list"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-600' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Live Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID, or parent name..."
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
            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} ({cls.section})
                </option>
              ))}
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

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Graduated">Graduated</option>
              <option value="Suspended">Suspended</option>
            </select>

            {/* Sort Filter */}
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
              <option value="studentId:asc">Student ID</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Active filters applied • Found <strong className="text-slate-800">{totalItems}</strong> student(s)
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

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="Error loading students"
          message={error}
          onRetry={() => fetchStudents(currentPage)}
        />
      )}

      {/* Main Content: Table / Loading / Empty State */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSpinner text="Retrieving student registry from server..." />
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={hasActiveFilters ? 'No matching students found' : 'No students registered'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search terms or filters to find what you are looking for.'
                : 'Get started by enrolling the first preschooler into your academy registry.'
            }
            actionText={hasActiveFilters ? 'Clear Filters' : 'Add First Student'}
            onAction={hasActiveFilters ? handleResetFilters : handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Parent / Guardian</th>
                  <th className="py-3.5 px-4">Gender</th>
                  <th className="py-3.5 px-4">Health & Allergies</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const ageText = calculateAge(st.dateOfBirth);
                  return (
                    <tr key={st._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Student Info */}
                      <td className="py-3.5 px-6 flex items-center gap-3">
                        {st.profilePhoto ? (
                          <img
                            src={st.profilePhoto}
                            alt={st.firstName}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-500/20 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                            {st.firstName?.[0] || 'S'}
                            {st.lastName?.[0] || ''}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {st.firstName} {st.lastName}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {ageText ? `Age: ${ageText}` : 'DOB: N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                          {st.studentId}
                        </span>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4">
                        {st.class ? (
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {st.class.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Sec {st.class.section} • {st.class.roomNumber || 'Room 101'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Parent / Guardian */}
                      <td className="py-3.5 px-4">
                        {st.parent ? (
                          <div>
                            <p className="font-semibold text-slate-800">
                              {st.parent.firstName} {st.parent.lastName}
                            </p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-primary-500" />
                              <span>{st.parent.phone || st.phone || 'N/A'}</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Linked</span>
                        )}
                      </td>

                      {/* Gender */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">{st.gender}</span>
                      </td>

                      {/* Allergies / Medical */}
                      <td className="py-3.5 px-4">
                        {st.allergies && st.allergies.toLowerCase() !== 'none' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>{st.allergies}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">None reported</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={st.status} text={st.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenView(st)}
                            title="View Student Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(st)}
                            title="Edit Student Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(st)}
                            title="Delete Student"
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
              onPageChange={(p) => fetchStudents(p)}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={activeStudent ? 'Edit Student Details' : 'Enroll New Student'}
        subtitle="Complete the student registration with accurate personal, contact, and healthcare info"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveStudent} className="space-y-5">
          {/* Section: Personal Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary-500" />
              <span>Personal Information</span>
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
                  placeholder="e.g. Leo"
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
                  placeholder="e.g. Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Academic & Enrollment */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary-500" />
              <span>Enrollment & Class</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Student ID <span className="font-normal text-slate-400 lowercase">(auto if blank)</span>
                </label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. SKA-2026-001"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Assign Class *
                </label>
                <select
                  required
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="">Select a Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.section})
                    </option>
                  ))}
                </select>
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
                  <option value="Inactive">Inactive</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Admission Date
                </label>
                <input
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
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

          {/* Section: Guardian & Contact Details */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Baby className="w-3.5 h-3.5 text-primary-500" />
              <span>Guardian & Contact Information</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Assign Parent Profile
                </label>
                <select
                  value={formData.parent}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="">None / Walk-in</option>
                  {parents.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.firstName} {p.lastName} ({p.relationship || 'Parent'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Student/Family Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Student/Family Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="family@example.com"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Home Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="Street address, City, State, Zip"
              />
            </div>
          </div>

          {/* Section: Medical & Healthcare */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Medical & Health Requirements</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Known Allergies
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. Peanuts, Dairy, Strawberries (or None)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Medical & Care Notes
                </label>
                <input
                  type="text"
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. Mild asthma, carries pediatric inhaler"
                />
              </div>
            </div>
          </div>

          {/* Section: Emergency Contact */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Emergency Contact Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Full Contact Name"
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
                placeholder="Phone Number"
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
                placeholder="Relationship (e.g. Aunt, Grandparent)"
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
              <span>{formSubmitting ? 'Saving...' : activeStudent ? 'Save Changes' : 'Enroll Student'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* View Student Details Modal */}
      {activeStudent && isViewOpen && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`${activeStudent.firstName} ${activeStudent.lastName}`}
          subtitle={`Student ID: ${activeStudent.studentId}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Student Profile Banner */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-primary-50/40 border border-slate-100">
              {activeStudent.profilePhoto ? (
                <img
                  src={activeStudent.profilePhoto}
                  alt={activeStudent.firstName}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary-500/20 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-xl shadow-sm">
                  {activeStudent.firstName?.[0] || 'S'}
                  {activeStudent.lastName?.[0] || ''}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">
                    {activeStudent.firstName} {activeStudent.lastName}
                  </h3>
                  <Badge variant={activeStudent.status} text={activeStudent.status} />
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Class: {activeStudent.class?.name || 'Unassigned'} ({activeStudent.class?.section || 'A'})
                  {activeStudent.class?.roomNumber ? ` • ${activeStudent.class.roomNumber}` : ''}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  ID: {activeStudent.studentId} • Enrolled:{' '}
                  {activeStudent.admissionDate
                    ? new Date(activeStudent.admissionDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Date of Birth</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {new Date(activeStudent.dateOfBirth).toLocaleDateString()}
                </p>
                <span className="text-[10px] text-primary-600 font-medium">
                  {calculateAge(activeStudent.dateOfBirth)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Gender</span>
                <p className="font-bold text-slate-800 mt-0.5">{activeStudent.gender}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Blood Group</span>
                <p className="font-bold text-slate-800 mt-0.5">{activeStudent.bloodGroup}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Allergies</span>
                <p
                  className={`font-bold mt-0.5 ${
                    activeStudent.allergies && activeStudent.allergies.toLowerCase() !== 'none'
                      ? 'text-rose-600'
                      : 'text-slate-700'
                  }`}
                >
                  {activeStudent.allergies || 'None'}
                </p>
              </div>
            </div>

            {/* Health & Medical Notes */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs">
              <span className="font-bold text-amber-900 block mb-1 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-amber-600" />
                <span>Medical & Healthcare Notes:</span>
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {activeStudent.medicalNotes || 'No specific medical conditions or care instructions noted.'}
              </p>
            </div>

            {/* Parent / Guardian Information */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                <Baby className="w-3.5 h-3.5 text-primary-600" />
                <span>Parent / Guardian Profile</span>
              </span>
              {activeStudent.parent ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Name & Relation</span>
                    <p className="font-semibold text-slate-900">
                      {activeStudent.parent.firstName} {activeStudent.parent.lastName} (
                      {activeStudent.parent.relationship || 'Parent'})
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Primary Phone</span>
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-primary-500" />
                      {activeStudent.parent.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Email Address</span>
                    <p className="font-medium text-slate-700 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {activeStudent.parent.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Occupation</span>
                    <p className="text-slate-700">{activeStudent.parent.occupation || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic">No parent profile linked to this record.</p>
              )}
            </div>

            {/* Contact & Address */}
            {(activeStudent.phone || activeStudent.email || activeStudent.address) && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary-600" />
                  <span>Student Contact & Residence</span>
                </span>
                {activeStudent.address && (
                  <p className="text-slate-700">
                    <strong className="font-semibold text-slate-800">Address:</strong>{' '}
                    {activeStudent.address}
                  </p>
                )}
                {activeStudent.phone && (
                  <p className="text-slate-700">
                    <strong className="font-semibold text-slate-800">Phone:</strong>{' '}
                    {activeStudent.phone}
                  </p>
                )}
                {activeStudent.email && (
                  <p className="text-slate-700">
                    <strong className="font-semibold text-slate-800">Email:</strong>{' '}
                    {activeStudent.email}
                  </p>
                )}
              </div>
            )}

            {/* Emergency Contact */}
            {activeStudent.emergencyContact && activeStudent.emergencyContact.name && (
              <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs">
                <span className="font-bold text-rose-900 block mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Emergency Contact</span>
                </span>
                <p className="font-semibold text-slate-900">
                  {activeStudent.emergencyContact.name} ({activeStudent.emergencyContact.relationship})
                </p>
                <p className="text-rose-700 font-mono mt-0.5 font-bold">
                  {activeStudent.emergencyContact.phone}
                </p>
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
                  handleOpenEdit(activeStudent);
                }}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Student</span>
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
        title="Delete Student Record"
        message={`Are you sure you want to permanently delete ${activeStudent?.firstName} ${activeStudent?.lastName} (ID: ${activeStudent?.studentId})? All linked parent connections, attendance records, and fee logs will be removed.`}
        confirmText="Yes, Delete Student"
        isLoading={formSubmitting}
      />
    </div>
  );
};

export default StudentManagement;
