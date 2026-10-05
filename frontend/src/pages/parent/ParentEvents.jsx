import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, MapPin, Search } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const ParentEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { showToast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      if (res.data.success) {
        setEvents(res.data.events || res.data.data || []);
      }
    } catch (err) {
      showToast('Failed to load events calendar', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const filtered = events.filter((e) => {
    const rawDate = e.date || e.eventDate;
    const evDate = rawDate ? new Date(rawDate) : new Date();

    const matchesSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' ? true : e.category === categoryFilter;

    let matchesTime = true;
    if (timeFilter === 'upcoming') {
      matchesTime = evDate >= todayMidnight;
    } else if (timeFilter === 'past') {
      matchesTime = evDate < todayMidnight;
    }

    return matchesSearch && matchesCategory && matchesTime;
  });

  const categoryBadges = {
    Academic: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Sports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Cultural: 'bg-pink-50 text-pink-700 border-pink-200',
    Holiday: 'bg-amber-50 text-amber-700 border-amber-200',
    Meeting: 'bg-blue-50 text-blue-700 border-blue-200',
    Workshop: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <span>School Calendar & Activities</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Check upcoming school festivities, field trips, holidays, and parent-teacher meetings.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search events, holidays, celebrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          >
            <option value="upcoming">Upcoming Events</option>
            <option value="all">All Dates</option>
            <option value="past">Past Events</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          >
            <option value="ALL">All Categories</option>
            <option value="Cultural">Cultural / Art</option>
            <option value="Sports">Sports Day</option>
            <option value="Academic">Academic</option>
            <option value="Meeting">Parent-Teacher Meet</option>
            <option value="Holiday">School Holiday</option>
            <option value="Workshop">Workshop</option>
          </select>
        </div>
      </div>

      {/* List of Event Cards */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner text="Loading events calendar..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Scheduled Events"
          message="There are no activities or school events matching your search."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const rawDate = item.date || item.eventDate;
            const eventDate = rawDate ? new Date(rawDate) : new Date();
            const badgeStyle = categoryBadges[item.category] || 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={item._id}
                onClick={() => setSelectedEvent(item)}
                className="cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeStyle}`}
                    >
                      {item.category || 'Event'}
                    </span>
                    <div className="text-right">
                      <span className="block text-xs font-bold text-slate-900">
                        {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium">
                        {eventDate.getFullYear()}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {item.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.startTime} - {item.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{item.location || 'Pre-School Campus'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Event Overview"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  categoryBadges[selectedEvent.category] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {selectedEvent.category || 'Event'}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                Audience: {selectedEvent.targetAudience}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {selectedEvent.title}
            </h3>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>
                  {new Date(selectedEvent.date || selectedEvent.eventDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2 text-slate-700 font-medium">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>{selectedEvent.location || 'Pre-School Campus'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Details & Schedule
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedEvent.description || 'No detailed instructions provided.'}
              </p>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
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

export default ParentEvents;
