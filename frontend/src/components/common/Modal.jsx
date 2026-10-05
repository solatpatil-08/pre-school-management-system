import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog Container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 md:p-6 text-center">
        <div
          className={`relative transform overflow-hidden rounded-3xl bg-white text-left shadow-modal transition-all my-4 sm:my-8 w-full ${maxWidth} border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/60">
            <div className="pr-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto custom-scrollbar">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
