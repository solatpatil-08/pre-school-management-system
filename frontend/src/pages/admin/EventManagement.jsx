import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Users,
  Search,
  CalendarDays,
  User,
  PartyPopper,
  Sparkles,
} from 'lucide-react';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('upcoming'); // 'all', 'upcoming', 'past'
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterAudience, setFilterAudience] = useState('ALL');

  // Modals & Action States
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialForm = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    location: 'Main School Courtyard',
    targetAudience: 'All',
    category: 'Cultural',
  };
  const [formData, setFormData] = useState(initialForm);

  const { showToast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      if (res.data.success) {
        const eventList = res.data.events || (Array.isArray(res.data.data) ? res.data.data : res.data.data?.events) || [];
        setEvents(eventList);
      }
    } catch (err) {
      showToast('Failed to load school events calendar', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenAdd = () => {
    setActiveEvent(null);
    setFormData(initialForm);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (ev) => {
    setActiveEvent(ev);
    const rawDate = ev.date || ev.eventDate;
    const formattedDate = rawDate ? new Date(rawDate).toISOString().split('T')[0] : '';

    setFormData({
      title: ev.title || '',
      description: ev.description || '',
      date: formattedDate,
      startTime: ev.startTime || '',
      endTime: ev.endTime || '',
      location: ev.location || '',
      targetAudience: ev.targetAudience || 'All',
      category: ev.category || 'Cultural',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenDelete = (ev) => {
    setActiveEvent(ev);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.date || !formData.startTime || !formData.endTime) {
      showToast('Please provide event title, date, and timing', 'warning');
      return;
    }

    const payload = {
      ...formData,
      eventDate: formData.date, // support both fields cleanly
    };

    try {
      setFormSubmitting(true);
      if (activeEvent) {
        const res = await api.put(`/events/${activeEvent._id}`, payload);
        if (res.data.success) {
          showToast('Event updated successfully', 'success');
          setIsAddEditOpen(false);
          fetchEvents();
        }
      } else {
        const res = await api.post('/events', payload);
        if (res.data.success) {
          showToast('New event scheduled on calendar', 'success');
          setIsAddEditOpen(false);
          fetchEvents();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save event', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeEvent) return;
    try {
      setFormSubmitting(true);
      const res = await api.delete(`/events/${activeEvent._id}`);
      if (res.data.success) {
        showToast('Event deleted from school calendar', 'success');
        setIsDeleteOpen(false);
        fetchEvents();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete event', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const categoryBadges = {
    Academic: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Sports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Cultural: 'bg-pink-50 text-pink-700 border-pink-200',
    Holiday: 'bg-amber-50 text-amber-700 border-amber-200',
    Meeting: 'bg-blue-50 text-blue-700 border-blue-200',
    Workshop: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // Filters logic
  const filteredEvents = events.filter((ev) => {
    const rawDate = ev.date || ev.eventDate;
    const evDate = rawDate ? new Date(rawDate) : new Date();

    const matchesSearch =
      ev.title?.toLowerCase().includes(search.toLowerCase()) ||
      ev.description?.toLowerCase().includes(search.toLowerCase()) ||
      ev.location?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      filterCategory === 'ALL' ? true : ev.category === filterCategory;

    const matchesAudience =
      filterAudience === 'ALL' ? true : ev.targetAudience === filterAudience;

    let matchesTime = true;
    if (timeFilter === 'upcoming') {
      matchesTime = evDate >= todayMidnight;
    } else if (timeFilter === 'past') {
      matchesTime = evDate < todayMidnight;
    }

    return matchesSearch && matchesCategory && matchesAudience && matchesTime;
  });

  // Summary Metrics
  const totalCount = events.length;
  const upcomingCount = events.filter((ev) => {
    const rawDate = ev.date || ev.eventDate;
    return rawDate && new Date(rawDate) >= todayMidnight;
  }).length;
  const parentEventsCount = events.filter((ev) =>
    ['All', 'Parent'].includes(ev.targetAudience)
  ).length;
  const holidaysCount = events.filter((ev) => ev.category === 'Holiday').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <span>Events & Extracurricular Calendar</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule exhibitions, sports days, celebrations, holidays, and parent-teacher collaborative meets.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Event</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setTimeFilter('all')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            timeFilter === 'all'
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-subtle'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-card'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Events</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <CalendarDays className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div
          onClick={() => setTimeFilter('upcoming')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            timeFilter === 'upcoming'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-subtle'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-card'
          }`}
        >
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Upcoming Events</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-700">{upcomingCount}</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div
          onClick={() => setFilterAudience(filterAudience === 'Parent' ? 'ALL' : 'Parent')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterAudience === 'Parent'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20 shadow-subtle'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-card'
          }`}
        >
          <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Parent & Family</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-purple-700">{parentEventsCount}</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
        </div>

        <div
          onClick={() => setFilterCategory(filterCategory === 'Holiday' ? 'ALL' : 'Holiday')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterCategory === 'Holiday'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-subtle'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-card'
          }`}
        >
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">School Holidays</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-700">{holidaysCount}</span>
            <PartyPopper className="w-4 h-4 text-amber-500" />
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
              placeholder="Search events by title, description, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Timing filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            >
              <option value="upcoming">Upcoming Events</option>
              <option value="all">All Dates</option>
              <option value="past">Past Events</option>
            </select>

            {/* Target Audience */}
            <select
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            >
              <option value="ALL">All Audiences</option>
              <option value="All">All School</option>
              <option value="Parent">Parents</option>
              <option value="Teacher">Educators</option>
              <option value="Student">Students Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Cultural">Cultural / Art</option>
              <option value="Sports">Sports Day</option>
              <option value="Academic">Academic</option>
              <option value="Meeting">Meeting (PTC)</option>
              <option value="Holiday">Holiday</option>
              <option value="Workshop">Workshop</option>
            </select>

            {(search || timeFilter !== 'upcoming' || filterCategory !== 'ALL' || filterAudience !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setTimeFilter('upcoming');
                  setFilterCategory('ALL');
                  setFilterAudience('ALL');
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <LoadingSpinner text="Loading events calendar..." />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events found"
          description={
            search || filterCategory !== 'ALL' || timeFilter !== 'upcoming'
              ? 'Try changing your search terms or filter selections.'
              : 'Schedule sports days, celebrations, or exhibitions to populate the calendar.'
          }
          actionText="Schedule Event"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => {
            const badgeStyle = categoryBadges[ev.category] || 'bg-slate-100 text-slate-700';
            const rawDate = ev.date || ev.eventDate;
            const dateObj = rawDate ? new Date(rawDate) : new Date();
            const isPast = dateObj < todayMidnight;

            return (
              <div
                key={ev._id}
                className={`bg-white rounded-2xl p-6 border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between relative overflow-hidden ${
                  isPast ? 'opacity-80 bg-slate-50/40 border-slate-200' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                        {ev.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Audience: {ev.targetAudience}
                      </span>
                      {isPast && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          Past
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        title="Edit event"
                        onClick={() => handleOpenEdit(ev)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete event"
                        onClick={() => handleOpenDelete(ev)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Date badge banner */}
                  <div className="flex items-center gap-3.5 mb-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100/90">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center flex-shrink-0 font-bold shadow-sm">
                      <span className="text-[10px] uppercase tracking-wider leading-none">
                        {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg leading-tight font-black">{dateObj.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                        {ev.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {ev.startTime} - {ev.endTime}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {ev.description || 'No additional details provided.'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5 font-medium truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Venue: <strong className="text-slate-800 font-semibold">{ev.location || 'Pre-School Campus'}</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>Created by: {ev.createdBy?.name || 'Pre-School Admin'}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={activeEvent ? 'Edit School Event' : 'Schedule New Event'}
        subtitle="Specify event timing, venue, category, and target audience"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              placeholder="e.g. Annual Preschool Art & Crafts Exhibition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="Cultural">Cultural / Arts</option>
                <option value="Sports">Sports Day</option>
                <option value="Academic">Academic</option>
                <option value="Meeting">Parent-Teacher Meet</option>
                <option value="Holiday">Holiday</option>
                <option value="Workshop">Staff Workshop</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Start Time *
              </label>
              <input
                type="text"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="e.g. 10:00 AM"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                End Time *
              </label>
              <input
                type="text"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="e.g. 01:00 PM"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Location / Venue *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="e.g. Main Courtyard & Garden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Target Audience *
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="All">All School (Teachers & Parents)</option>
                <option value="Parent">Parents / Guardians</option>
                <option value="Teacher">Educators & Staff</option>
                <option value="Student">Students Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Event Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none leading-relaxed"
              placeholder="Describe event schedule, activities, dress code, or parent instructions..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              {formSubmitting ? 'Saving...' : activeEvent ? 'Update Event' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Cancel Event"
        message={`Are you sure you want to cancel and delete "${activeEvent?.title}" from the school calendar?`}
        confirmText="Cancel Event"
        isLoading={formSubmitting}
      />
    </div>
  );
};

export default EventManagement;
