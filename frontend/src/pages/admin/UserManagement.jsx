import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import {
  ShieldCheck,
  Search,
  Key,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      let query = `/users?page=${page}&limit=8`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedRole) query += `&role=${selectedRole}`;

      const res = await api.get(query);
      if (res.data.success) {
        const userList = res.data.users || (Array.isArray(res.data.data) ? res.data.data : res.data.data?.users) || [];
        setUsers(userList);
        setCurrentPage(res.data.currentPage || res.data.page || page);
        setTotalPages(res.data.totalPages || res.data.pages || 1);
        setTotalItems(res.data.total !== undefined ? res.data.total : userList.length);
      }
    } catch (err) {
      showToast('Failed to load user accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedRole]);

  const handleToggleStatus = async (user) => {
    try {
      const res = await api.patch(`/users/${user._id}/status`);
      if (res.data.success) {
        showToast(res.data.message, 'success');
        fetchUsers(currentPage);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update user status';
      showToast(msg, 'error');
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      const res = await api.patch(`/users/${user._id}/role`, { role: newRole });
      if (res.data.success) {
        showToast(`Role updated to ${newRole}`, 'success');
        fetchUsers(currentPage);
      }
    } catch (err) {
      showToast('Failed to change user role', 'error');
    }
  };

  const handleOpenReset = (user) => {
    setActiveUser(user);
    setNewPassword('');
    setIsResetOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/users/${activeUser._id}/reset-password`, { newPassword });
      if (res.data.success) {
        showToast('Password reset successfully!', 'success');
        setIsResetOpen(false);
      }
    } catch (err) {
      showToast('Failed to reset password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary-600" />
            <span>User & Access Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System accounts, role-based authorization, security status, and administrative password resets.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching system accounts..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-6 text-right">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                        {u.name?.[0] || 'U'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{u.name}</span>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="parent">Parent</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-600 font-medium">{u.phone || 'No phone'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700'
                            : 'bg-rose-50 text-rose-700 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-500" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-500" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleOpenReset(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        <Key className="w-3 h-3 text-amber-500" />
                        <span>Reset Password</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={(p) => fetchUsers(p)}
            />
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {activeUser && isResetOpen && (
        <Modal
          isOpen={isResetOpen}
          onClose={() => setIsResetOpen(false)}
          title={`Reset Password for ${activeUser.name}`}
          subtitle={`Account Email: ${activeUser.email}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                New Temporary Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20"
              >
                {submitting ? 'Updating...' : 'Set Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
