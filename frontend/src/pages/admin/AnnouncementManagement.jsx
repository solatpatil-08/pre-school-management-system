import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Pin,
  User,
  Send,
  Search,
  CheckCircle2,
  FileEdit,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals & Action States
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [publishingId, setPublishingId] = useState(null);

  const initialForm = {
    title: '',
    message: '',
    targetRole: 'All',
    priority: 'Normal',
    status: 'Published',
    isPinned: false,
  };
  const [formData, setFormData] = useState(initialForm);

  const { showToast } = useToast();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      if (res.data.success) {
        // res.data.data or res.data.announcements
        setAnnouncements(res.data.data || res.data.announcements || []);
      }
    } catch (err) {
      showToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenAdd = (defaultStatus = 'Published') => {
    setActiveItem(null);
    setFormData({
      ...initialForm,
      status: defaultStatus,
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (item) => {
    setActiveItem(item);
    setFormData({
      title: item.title || '',
      message: item.message || '',
      targetRole: item.targetRole || 'All',
      priority: item.priority || 'Normal',
      status: item.status || 'Published',
      isPinned: !!item.isPinned,
    });
    setIsAddEditOpen(true);
  };

  const handleOpenDelete = (item) => {
    setActiveItem(item);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e, forcedStatus = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.title?.trim() || !formData.message?.trim()) {
      showToast('Please provide both headline title and announcement message', 'warning');
      return;
    }

    const payload = {
      ...formData,
      status: forcedStatus || formData.status,
    };

    try {
      setFormSubmitting(true);
      if (activeItem) {
        const res = await api.put(`/announcements/${activeItem._id}`, payload);
        if (res.data.success) {
          showToast('Announcement updated successfully', 'success');
          setIsAddEditOpen(false);
          fetchAnnouncements();
        }
      } else {
        const res = await api.post('/announcements', payload);
        if (res.data.success) {
          showToast(
            payload.status === 'Draft'
              ? 'Announcement saved as Draft'
              : 'Announcement published successfully',
            'success'
          );
          setIsAddEditOpen(false);
          fetchAnnouncements();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save announcement', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePublish = async (announcement) => {
    try {
      setPublishingId(announcement._id);
      const res = await api.patch(`/announcements/${announcement._id}/publish`);
      if (res.data.success) {
        showToast(`"${announcement.title}" is now published and visible to recipients!`, 'success');
        fetchAnnouncements();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to publish announcement', 'error');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeItem) return;
    try {
      setFormSubmitting(true);
      const res = await api.delete(`/announcements/${activeItem._id}`);
      if (res.data.success) {
        showToast('Announcement deleted', 'success');
        setIsDeleteOpen(false);
        fetchAnnouncements();
      }
    } catch (err) {
      showToast('Failed to delete announcement', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter calculations
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.message?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ? true : a.status === statusFilter;
    const matchesRole =
      roleFilter === 'ALL' ? true : a.targetRole === roleFilter;
    const matchesPriority =
      priorityFilter === 'ALL' ? true : a.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesRole && matchesPriority;
  });

  // Metrics
  const totalCount = announcements.length;
  const publishedCount = announcements.filter((a) => a.status === 'Published').length;
  const draftCount = announcements.filter((a) => a.status === 'Draft').length;
  const urgentCount = announcements.filter((a) => ['Urgent', 'High'].includes(a.priority)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Megaphone className="w-5 h-5" />
            </div>
            <span>Announcements & Circulars</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Broadcast emergency alerts, school notices, and curriculum bulletins to parents and teachers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAdd('Draft')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-subtle hover:border-slate-300"
          >
            <FileEdit className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleOpenAdd('Published')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'ALL'
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-subtle'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-card'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Notices</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Published')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'Published'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-subtle'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-card'
          }`}
        >
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Published Live</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-700">{publishedCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Draft')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'Draft'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-subtle'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-card'
          }`}
        >
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Drafts</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-700">{draftCount}</span>
            <FileEdit className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div
          onClick={() => setPriorityFilter(priorityFilter === 'Urgent' ? 'ALL' : 'Urgent')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            priorityFilter === 'Urgent'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20 shadow-subtle'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-card'
          }`}
        >
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Urgent Alerts</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-700">{urgentCount}</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Drafts</option>
              <option value="Archived">Archived</option>
            </select>

            {/* Target Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="ALL">All Roles</option>
              <option value="All">All School</option>
              <option value="Teacher">Educators Only</option>
              <option value="Parent">Parents Only</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>

            {(search || statusFilter !== 'ALL' || roleFilter !== 'ALL' || priorityFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setRoleFilter('ALL');
                  setPriorityFilter('ALL');
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Announcement Cards */}
      {loading ? (
        <LoadingSpinner text="Loading notices..." />
      ) : filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements found"
          description={
            search || statusFilter !== 'ALL'
              ? 'Try changing your search terms or filter selections.'
              : 'Create notifications and publish notices to staff or families.'
          }
          actionText="Create Announcement"
          onAction={() => handleOpenAdd('Published')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAnnouncements.map((a) => {
            const isDraft = a.status === 'Draft';
            const isPublishing = publishingId === a._id;

            return (
              <div
                key={a._id}
                className={`bg-white rounded-2xl p-6 border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between relative overflow-hidden ${
                  a.isPinned
                    ? 'border-indigo-300 ring-1 ring-indigo-500/20'
                    : isDraft
                    ? 'border-amber-200/80 bg-gradient-to-b from-white to-amber-50/20'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Accent top stripe for Draft or Pinned */}
                {isDraft && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
                )}
                {a.isPinned && !isDraft && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Status Badge */}
                      <Badge variant={a.status || 'Published'} text={a.status || 'Published'} showDot={true} />

                      {/* Priority Badge */}
                      <Badge variant={a.priority || 'Normal'} text={a.priority || 'Normal'} showDot={false} />

                      {/* Audience Badge */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Audience: {a.targetRole === 'All' ? 'All School' : a.targetRole}
                      </span>

                      {/* Pinned Tag */}
                      {a.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          <Pin className="w-3 h-3 fill-indigo-600" /> Pinned
                        </span>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        title="Edit announcement"
                        onClick={() => handleOpenEdit(a)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete announcement"
                        onClick={() => handleOpenDelete(a)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Message */}
                  <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2">
                    {a.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {a.message}
                  </p>
                </div>

                {/* Bottom Footer & Action */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        By: <span className="font-semibold text-slate-600">{a.createdBy?.name || 'Administrator'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {a.publishedAt
                          ? `Published ${new Date(a.publishedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}`
                          : `Created ${new Date(a.createdAt).toLocaleDateString()}`}
                      </span>
                    </div>

                    {/* Quick Publish Action if Draft */}
                    {isDraft && (
                      <button
                        onClick={() => handlePublish(a)}
                        disabled={isPublishing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isPublishing ? 'Publishing...' : 'Publish Now'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Announcement Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={activeItem ? 'Edit Announcement' : 'Create School Announcement'}
        subtitle="Configure title, target audience, priority, and publishing state"
        maxWidth="max-w-xl"
      >
        <form onSubmit={(e) => handleSave(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Headline Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              placeholder="e.g. Annual Sports Day Registration & Schedule"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Target Role *
              </label>
              <select
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="All">All School (Teachers & Parents)</option>
                <option value="Teacher">Educators & Staff</option>
                <option value="Parent">Parents / Guardians</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent Alert</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none font-semibold text-slate-800"
              >
                <option value="Published">Published (Live)</option>
                <option value="Draft">Draft (Private)</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="isPinned"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isPinned" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
              Pin to top of dashboards & announcement listings
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Announcement Message *
            </label>
            <textarea
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none leading-relaxed"
              placeholder="Write the detailed bulletin message..."
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              {!activeItem && (
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={(e) => handleSave(e, 'Draft')}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Save as Draft
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
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
                {formSubmitting
                  ? 'Saving...'
                  : activeItem
                  ? 'Update Notice'
                  : formData.status === 'Draft'
                  ? 'Save Draft'
                  : 'Publish Announcement'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Announcement"
        message={`Are you sure you want to permanently delete "${activeItem?.title}"? It will be removed from all staff and parent dashboards immediately.`}
        confirmText="Delete Notice"
        isLoading={formSubmitting}
      />
    </div>
  );
};

export default AnnouncementManagement;
