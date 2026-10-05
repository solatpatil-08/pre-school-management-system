import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Megaphone, Search, Pin, Calendar, User } from 'lucide-react';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const TeacherAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const { showToast } = useToast();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      if (res.data.success) {
        setAnnouncements(res.data.announcements || res.data.data || []);
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

  const filtered = announcements.filter((a) => {
    const matchesSearch =
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.message?.toLowerCase().includes(search.toLowerCase());
    const matchesPriority =
      priorityFilter === 'ALL' ? true : a.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Megaphone className="w-5 h-5" />
            </div>
            <span>Staff Announcements & Bulletins</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated with school administration circulars, academic notices, and staff alerts.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search announcements by keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
        >
          <option value="ALL">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Normal">Normal</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner text="Loading notices..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Announcements Found"
          message="No current staff announcements match your search query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedAnnouncement(item)}
              className={`cursor-pointer bg-white rounded-2xl p-6 border shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between ${
                item.isPinned
                  ? 'border-indigo-300 bg-gradient-to-br from-white to-indigo-50/20 ring-1 ring-indigo-500/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={item.priority || 'Normal'}
                      text={item.priority || 'Normal'}
                      showDot={true}
                    />
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Audience: {item.targetRole}
                    </span>
                    {item.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        <Pin className="w-3 h-3 fill-indigo-600" />
                        Pinned
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                    {new Date(item.publishedAt || item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 mt-3 line-clamp-1">
                  {item.title}
                </h2>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                  {item.message}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.createdBy?.name || 'School Administration'}</span>
                </div>
                <span className="text-primary-600 font-bold hover:underline">
                  View Full Notice &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAnnouncement && (
        <Modal
          isOpen={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          title="Announcement Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={selectedAnnouncement.priority || 'Normal'}
                text={selectedAnnouncement.priority || 'Normal'}
                showDot={true}
              />
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                Audience: {selectedAnnouncement.targetRole}
              </span>
              {selectedAnnouncement.isPinned && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                  <Pin className="w-3 h-3 fill-indigo-600" />
                  Pinned
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {selectedAnnouncement.title}
            </h3>

            <div className="flex items-center gap-4 text-xs text-slate-500 pb-3 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {selectedAnnouncement.createdBy?.name || 'Administration'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedAnnouncement.message}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeacherAnnouncements;
