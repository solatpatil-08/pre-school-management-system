import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, User as UserIcon, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Badge from './Badge';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getProfileLink = () => {
    if (user?.role === 'admin') return '/admin/profile';
    if (user?.role === 'teacher') return '/teacher/profile';
    return '/parent/profile';
  };

  // Derive current page title from path
  const getPageTitle = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length > 1) {
      const page = parts[1];
      return page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ');
    }
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Left: Mobile hamburger & Context Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                {user?.role || 'Portal'}
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>{getPageTitle()}</span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right: Actions, Notifications, Role badge & User dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-600 ring-2 ring-white" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-dropdown border border-slate-200/80 py-3 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <div className="px-4 py-3 text-xs text-slate-500">
                  <p className="font-semibold text-slate-800">Preschool system operational</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All database services & modules active.</p>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 sm:p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
              aria-expanded={dropdownOpen}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-primary-500/20 shadow-subtle">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              )}
              <span className="hidden md:block text-xs font-bold text-slate-700 max-w-[130px] truncate">
                {user?.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-dropdown border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-extrabold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-2">
                    <Badge variant={user?.role} text={user?.role?.toUpperCase()} size="xs" />
                  </div>
                </div>

                <div className="py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate(getProfileLink());
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/admin/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>School Settings</span>
                    </button>
                  )}
                </div>

                <div className="pt-1.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
