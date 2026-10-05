import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { GraduationCap, Search, Eye, Phone, AlertCircle } from 'lucide-react';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const { showToast } = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let query = '/students?limit=100';
      if (search) query += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(query);
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load assigned students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenView = async (st) => {
    try {
      const res = await api.get(`/students/${st._id}`);
      if (res.data.success) {
        setSelectedStudent(res.data.data);
        setIsViewOpen(true);
      }
    } catch (err) {
      showToast('Failed to load student details', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-primary-600" />
          <span>My Assigned Students</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your preschooler profiles, health warnings, allergies, and emergency phone numbers.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Roster Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching assigned students..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students found"
          description="There are currently no students matching your query in your assigned classrooms."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((st) => (
            <div
              key={st._id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {st.profilePhoto ? (
                      <img
                        src={st.profilePhoto}
                        alt={st.firstName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-500/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {st.firstName?.[0] || 'S'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {st.firstName} {st.lastName}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{st.studentId}</p>
                    </div>
                  </div>
                  <Badge variant={st.status} text={st.status} showDot={false} />
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Class:</span>
                    <span className="font-semibold text-slate-800">
                      {st.class?.name} ({st.class?.section})
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Blood Group:</span>
                    <span className="font-semibold text-slate-800">{st.bloodGroup}</span>
                  </p>
                  {st.allergies && st.allergies !== 'None' ? (
                    <p className="flex items-center justify-between text-rose-600 font-bold">
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Allergy:
                      </span>
                      <span>{st.allergies}</span>
                    </p>
                  ) : null}
                </div>

                {st.emergencyContact?.phone && (
                  <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                    <span>Emergency: {st.emergencyContact.name}</span>
                    <span className="font-mono font-semibold text-slate-700">{st.emergencyContact.phone}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleOpenView(st)}
                className="w-full mt-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-primary-600" />
                <span>View Full Medical & Parent File</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && isViewOpen && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
          subtitle={`Student File - ID: ${selectedStudent.studentId}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold uppercase block mb-1">Medical Care Instructions</span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {selectedStudent.medicalNotes || 'No special medical instructions on file.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
              <span className="text-rose-700 font-bold uppercase block mb-1">Known Allergies</span>
              <p className="text-rose-900 font-bold">
                {selectedStudent.allergies || 'None identified'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-indigo-900 font-bold uppercase block mb-1">Parent / Guardian Contact</span>
              {selectedStudent.parent ? (
                <div className="space-y-1 text-slate-700">
                  <p className="font-bold text-slate-900">
                    {selectedStudent.parent.firstName} {selectedStudent.parent.lastName} ({selectedStudent.parent.relationship})
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" /> Phone: {selectedStudent.parent.phone}
                  </p>
                  <p>Email: {selectedStudent.parent.email}</p>
                </div>
              ) : (
                <p className="text-slate-400 italic">No parent profile linked</p>
              )}
            </div>

            {selectedStudent.emergencyContact && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-bold uppercase block mb-1">Emergency Reach</span>
                <p className="font-bold text-slate-800">{selectedStudent.emergencyContact.name}</p>
                <p className="text-slate-600 font-mono mt-0.5">{selectedStudent.emergencyContact.phone}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeacherStudents;
