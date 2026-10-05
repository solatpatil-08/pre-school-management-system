import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: (
      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-4 h-4" />
      </div>
    ),
    error: (
      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-4 h-4" />
      </div>
    ),
    warning: (
      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4 h-4" />
      </div>
    ),
    info: (
      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center flex-shrink-0">
        <Info className="w-4 h-4" />
      </div>
    ),
  };

  const borders = {
    success: 'border-emerald-200/80',
    error: 'border-rose-200/80',
    warning: 'border-amber-200/80',
    info: 'border-indigo-200/80',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border ${
              borders[toast.type] || borders.info
            } shadow-dropdown transition-all duration-200 animate-in slide-in-from-bottom-5`}
          >
            {icons[toast.type] || icons.info}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
