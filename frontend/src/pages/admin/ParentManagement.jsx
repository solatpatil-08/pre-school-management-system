import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import {
  HeartHandshake,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Baby,
  Briefcase,
} from 'lucide-react';

const ParentManagement = () => {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeParent, setActiveParent] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: 'parent123',
    relationship: 'Mother',
    occupation: '',
    address: '',
    emergencyPhone: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const { showToast } = useToast();

  const fetchParents = async (page = 1) => {
    try {
      setLoading(true);
      let query = `/parents?page=${page}&limit=8`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(query);
      if (res.data.success) {
        const parentList = res.data.parents || (Array.isArray(res.data.data) ? res.data.data : res.data.data?.parents) || [];
        setParents(parentList);
        setCurrentPage(res.data.currentPage || res.data.page || page);
        setTotalPages(res.data.totalPages || res.data.pages || 1);
        setTotalItems(res.data.total !== undefined ? res.data.total : parentList.length);
      }
    } catch (err) {
      showToast('Failed to load parents directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParents(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setActiveParent(null);
    setFormData(initialForm);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (parent) => {
    setActiveParent(parent);
    setFormData({
      firstName: parent.firstName || '',
      lastName: parent.lastName || '',
      email: parent.email || '',
      phone: parent.phone || '',
      relationship: parent.relationship || 'Mother',
      occupation: parent.occupation || '',
      address: parent.address || '',
      emergencyPhone: parent.emergencyPhone || '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenView = async (parent) => {
    try {
      const res = await api.get(`/parents/${parent._id}`);
      if (res.data.success) {
        const pData = res.data.parent || res.data.data?.parent || res.data.data || parent;
        setActiveParent(pData);
        setIsViewOpen(true);
      }
    } catch (err) {
      showToast('Failed to load parent details', 'error');
    }
  };

  const handleOpenDelete = (parent) => {
    setActiveParent(parent);
    setIsDeleteOpen(true);
  };

  const handleSaveParent = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      showToast('Please fill all mandatory guardian fields', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      if (activeParent) {
        const res = await api.put(`/parents/${activeParent._id}`, formData);
        if (res.data.success) {
          showToast('Parent details updated successfully', 'success');
          setIsAddEditOpen(false);
          fetchParents(currentPage);
        }
      } else {
        const res = await api.post('/parents', formData);
        if (res.data.success) {
          showToast('Parent account registered successfully', 'success');
          setIsAddEditOpen(false);
          fetchParents(1);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save parent profile';
      showToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitting(true);
      const res = await api.delete(`/parents/${activeParent._id}`);
      if (res.data.success) {
        showToast('Parent profile removed', 'success');
        setIsDeleteOpen(false);
        fetchParents(currentPage);
      }
    } catch (err) {
      showToast('Failed to remove parent', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-7 h-7 text-emerald-600" />
            <span>Parent & Guardian Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain parent accounts, contact details, emergency reach, and enrolled children linkages.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Parent / Guardian</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by parent name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching parents directory..." />
        ) : parents.length === 0 ? (
          <EmptyState
            icon={HeartHandshake}
            title="No parent profiles found"
            description="Add parent accounts to link enrolled students and provide portal access."
            actionText="Add Parent"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Parent Name</th>
                  <th className="py-3.5 px-4">Relation</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Occupation</th>
                  <th className="py-3.5 px-4">Linked Child(ren)</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parents.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-xs">
                        {p.firstName?.[0] || 'P'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">
                          {p.firstName} {p.lastName}
                        </span>
                        <p className="text-[11px] text-slate-400">{p.address || 'Address on file'}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.relationship}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" /> {p.email}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {p.phone}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {p.occupation ? (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" /> {p.occupation}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.children && p.children.length > 0 ? (
                          p.children.map((ch) => (
                            <span
                              key={ch._id || ch}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100"
                            >
                              <Baby className="w-2.5 h-2.5" />
                              {ch.firstName ? `${ch.firstName} ${ch.lastName}` : 'Child'}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">None linked</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={(pg) => fetchParents(pg)}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Parent Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={activeParent ? 'Edit Parent Profile' : 'Add Parent / Guardian'}
        subtitle="Manage guardian contacts and student access credentials"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveParent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email (Login) *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Relationship</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Occupation</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Home Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20"
            >
              {formSubmitting ? 'Saving...' : activeParent ? 'Update Profile' : 'Register Parent'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Parent Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Parent / Guardian Profile"
        subtitle="Complete contact record and enrolled children associations"
        maxWidth="max-w-lg"
      >
        {activeParent && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                {activeParent.firstName?.[0] || 'P'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeParent.firstName} {activeParent.lastName}
                </h3>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {activeParent.relationship || 'Guardian'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email (Login)</span>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">{activeParent.email || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Phone</span>
                <p className="font-semibold text-slate-800 mt-0.5">{activeParent.phone || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Occupation</span>
                <p className="font-semibold text-slate-800 mt-0.5">{activeParent.occupation || 'Not specified'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emergency Contact</span>
                <p className="font-semibold text-slate-800 mt-0.5">{activeParent.emergencyPhone || activeParent.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Home Address</span>
              <p className="font-medium text-slate-700 mt-0.5">{activeParent.address || 'Address on file'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Children</span>
              {activeParent.children && activeParent.children.length > 0 ? (
                <div className="space-y-1.5">
                  {activeParent.children.map((ch) => (
                    <div key={ch._id || ch} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <Baby className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-slate-800">
                          {ch.firstName ? `${ch.firstName} ${ch.lastName}` : 'Enrolled Student'}
                        </span>
                      </div>
                      {ch.class && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Class {ch.class.name || ch.class}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No students linked to this guardian yet.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Parent Account"
        message={`Are you sure you want to remove ${activeParent?.firstName} ${activeParent?.lastName}? Linked children will no longer show this parent.`}
        confirmText="Remove"
        isLoading={formSubmitting}
      />
    </div>
  );
};

export default ParentManagement;
