import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Settings as SettingsIcon, Save, School, Globe } from 'lucide-react';

const Settings = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolEmail: '',
    schoolPhone: '',
    schoolAddress: '',
    academicYear: '',
    currentTerm: '',
    currency: 'USD ($)',
    admissionPrefix: 'SKA-',
    systemNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        if (res.data.success) {
          const cfg = res.data.settings || res.data.data?.settings || res.data.data;
          if (cfg) {
            setFormData((prev) => ({
              ...prev,
              ...cfg,
            }));
          }
        }
      } catch (err) {
        showToast('Failed to load school settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/settings', formData);
      if (res.data.success) {
        showToast('School settings saved successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading configuration..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <span>School Settings & Configuration</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure institutional profile, academic term cycles, and automated notifications.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <School className="w-4 h-4 text-indigo-600" />
            <span>Institutional Information</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pre-School Name</label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Official Email</label>
              <input
                type="email"
                required
                value={formData.schoolEmail}
                onChange={(e) => setFormData({ ...formData, schoolEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Main Phone Number</label>
              <input
                type="text"
                required
                value={formData.schoolPhone}
                onChange={(e) => setFormData({ ...formData, schoolPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Campus Address</label>
              <input
                type="text"
                required
                value={formData.schoolAddress}
                onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Academic & Billing Defaults</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current Academic Year</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current Term</label>
              <input
                type="text"
                value={formData.currentTerm}
                onChange={(e) => setFormData({ ...formData, currentTerm: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Billing Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.systemNotifications}
              onChange={(e) => setFormData({ ...formData, systemNotifications: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">Enable Automated System Notifications</span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
