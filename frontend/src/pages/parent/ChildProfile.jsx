import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { Baby, Heart, Phone } from 'lucide-react';

const ChildProfile = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const res = await api.get('/students');
        if (res.data.success) {
          setChildren(res.data.data);
        }
      } catch (err) {
        showToast('Failed to load child profiles', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading children files..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Baby className="w-7 h-7 text-emerald-600" />
          <span>Child Profile & Healthcare File</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed preschool registration records, designated educator, dietary cautions, and emergency contacts.
        </p>
      </div>

      <div className="space-y-6">
        {children.map((child) => (
          <div key={child._id} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {child.profilePhoto ? (
                  <img
                    src={child.profilePhoto}
                    alt={child.firstName}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-extrabold flex items-center justify-center text-2xl shadow-sm">
                    {child.firstName?.[0] || 'C'}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {child.firstName} {child.lastName}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {child.studentId}</p>
                </div>
              </div>
              <Badge variant={child.status} text={child.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block mb-0.5">Date of Birth</span>
                <p className="font-bold text-slate-800 text-sm">
                  {new Date(child.dateOfBirth).toLocaleDateString()}
                </p>
                <span className="text-[11px] text-slate-400 capitalize">Gender: {child.gender}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block mb-0.5">Classroom</span>
                <p className="font-bold text-slate-800 text-sm">
                  {child.class?.name || 'Class'} ({child.class?.section || 'A'})
                </p>
                <span className="text-[11px] text-slate-400">Room: {child.class?.roomNumber || '101'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block mb-0.5">Blood Group</span>
                <p className="font-bold text-slate-800 text-sm">{child.bloodGroup || 'Unknown'}</p>
                <span className="text-[11px] text-slate-400">Medical Record</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block mb-0.5">Admission Date</span>
                <p className="font-bold text-slate-800 text-sm">
                  {new Date(child.admissionDate || Date.now()).toLocaleDateString()}
                </p>
                <span className="text-[11px] text-slate-400">Active Enrollment</span>
              </div>
            </div>

            {/* Medical Instructions */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Health & Safety Precautions</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="text-slate-400 block font-medium">Allergies on Record:</span>
                  <span className={`font-bold ${child.allergies !== 'None' ? 'text-rose-600' : 'text-slate-700'}`}>
                    {child.allergies || 'None identified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Daily Care / Medication:</span>
                  <span className="font-medium text-slate-700">{child.medicalNotes || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {child.emergencyContact && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs flex items-center justify-between">
                <div>
                  <span className="text-indigo-900 font-bold block mb-0.5">Designated Emergency Reach:</span>
                  <p className="text-slate-700 font-semibold">
                    {child.emergencyContact.name} ({child.emergencyContact.relationship})
                  </p>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-primary-700 bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{child.emergencyContact.phone}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChildProfile;
