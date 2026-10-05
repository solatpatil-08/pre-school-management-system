import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';
import { User, Lock, Save, Key, CheckCircle } from 'lucide-react';
import Badge from '../../components/common/Badge';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.put('/auth/profile', { name, phone });
      if (res.data.success) {
        updateUser(res.data.user);
        showToast('Profile information updated successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        showToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Password update failed';
      showToast(msg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <span>My Profile & Security</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details, contact number, and login credentials.
        </p>
      </div>

      {/* User Info Overview Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex items-center gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-sm">
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <Badge variant={user?.role} text={user?.role?.toUpperCase()} showDot={false} />
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              Account Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Personal Information</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs sm:text-sm cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Email address cannot be modified directly.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : 'Update Details'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Security & Password</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>{savingPassword ? 'Changing...' : 'Change Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
