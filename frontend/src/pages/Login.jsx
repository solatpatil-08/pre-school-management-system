import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Baby, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, Heart } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@preschool.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('admin');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const demoAccounts = {
    admin: { email: 'admin@preschool.com', password: 'Admin@123', label: 'Admin (Principal)', icon: ShieldCheck, color: 'purple' },
    teacher: { email: 'teacher@preschool.com', password: 'Teacher@123', label: 'Teacher (Educator)', icon: UserCheck, color: 'blue' },
    parent: { email: 'parent@preschool.com', password: 'Parent@123', label: 'Parent (Guardian)', icon: Heart, color: 'emerald' },
  };

  const handleSelectDemo = (roleKey) => {
    setActiveTab(roleKey);
    setEmail(demoAccounts[roleKey].email);
    setPassword(demoAccounts[roleKey].password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');

      // Redirect based on previous location or role
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'teacher') {
        navigate('/teacher/dashboard', { replace: true });
      } else if (user.role === 'parent') {
        navigate('/parent/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* App Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-xl shadow-primary-500/25 mb-4">
            <Baby className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sunshine Kids Academy
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Pre-School & Early Childhood Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200/80">
          {/* Quick Demo Switcher Tabs */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Demo Role to Quick-Fill:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-200/60">
              {Object.keys(demoAccounts).map((key) => {
                const item = demoAccounts[key];
                const Icon = item.icon;
                const isSelected = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectDemo(key)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-primary-600' : 'text-slate-400'}`} />
                    <span className="capitalize">{key}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary-600/25 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Sign In as ${activeTab.toUpperCase()}`
              )}
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="mt-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 font-medium">
              Demo Credentials: <span className="font-mono text-slate-700 font-semibold">{demoAccounts[activeTab].email}</span> / <span className="font-mono text-slate-700 font-semibold">password</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          &copy; 2026 Sunshine Kids Academy. Production-grade Architecture.
        </p>
      </div>
    </div>
  );
};

export default Login;
