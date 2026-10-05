import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  Users2,
  HeartHandshake,
  School,
  CalendarCheck,
  Clock,
  CreditCard,
  Megaphone,
  Calendar,
  BarChart3,
  ShieldCheck,
  Settings,
  User,
  LogOut,
  X,
  Baby,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNavGroups = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Academic & Care',
      items: [
        { name: 'Students', path: '/admin/students', icon: GraduationCap },
        { name: 'Teachers / Staff', path: '/admin/teachers', icon: Users2 },
        { name: 'Parents', path: '/admin/parents', icon: HeartHandshake },
        { name: 'Classes', path: '/admin/classes', icon: School },
        { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
        { name: 'Timetable & Schedule', path: '/admin/schedules', icon: Clock },
      ],
    },
    {
      group: 'Finance & Community',
      items: [
        { name: 'Fees & Invoicing', path: '/admin/fees', icon: CreditCard },
        { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
        { name: 'Events Calendar', path: '/admin/events', icon: Calendar },
        { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
      ],
    },
    {
      group: 'System & Account',
      items: [
        { name: 'User Management', path: '/admin/users', icon: ShieldCheck },
        { name: 'School Settings', path: '/admin/settings', icon: Settings },
        { name: 'My Profile', path: '/admin/profile', icon: User },
      ],
    },
  ];

  const teacherNavGroups = [
    {
      group: 'Teaching Portal',
      items: [
        { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { name: 'Assigned Students', path: '/teacher/students', icon: GraduationCap },
        { name: 'Class Attendance', path: '/teacher/attendance', icon: CalendarCheck },
        { name: 'Daily Schedule', path: '/teacher/schedule', icon: Clock },
      ],
    },
    {
      group: 'Communication',
      items: [
        { name: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
        { name: 'School Events', path: '/teacher/events', icon: Calendar },
        { name: 'My Profile', path: '/teacher/profile', icon: User },
      ],
    },
  ];

  const parentNavGroups = [
    {
      group: 'Child & Learning',
      items: [
        { name: 'Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
        { name: 'Child Profile', path: '/parent/child', icon: Baby },
        { name: 'Attendance Log', path: '/parent/attendance', icon: CalendarCheck },
        { name: 'Daily Routine', path: '/parent/schedule', icon: Clock },
      ],
    },
    {
      group: 'School Updates',
      items: [
        { name: 'Fees & Receipts', path: '/parent/fees', icon: CreditCard },
        { name: 'Announcements', path: '/parent/announcements', icon: Megaphone },
        { name: 'School Events', path: '/parent/events', icon: Calendar },
        { name: 'My Profile', path: '/parent/profile', icon: User },
      ],
    },
  ];

  const getNavGroups = () => {
    if (user?.role === 'admin') return adminNavGroups;
    if (user?.role === 'teacher') return teacherNavGroups;
    if (user?.role === 'parent') return parentNavGroups;
    return [];
  };

  const navGroups = getNavGroups();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                <span>Sunshine Kids</span>
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-primary-600">
                Education SaaS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3.5 py-3 space-y-4">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-0.5">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-bold shadow-subtle'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary-600 rounded-r-full" />
                        )}
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            isActive
                              ? 'text-primary-600'
                              : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer with User info & logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-subtle">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] font-semibold text-primary-600 capitalize">
                  {user?.role} Portal
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-rose-100 bg-white shadow-subtle transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
