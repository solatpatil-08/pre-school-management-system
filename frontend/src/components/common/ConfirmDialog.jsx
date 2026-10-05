import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center py-2">
        <div
          className={`w-14 h-14 rounded-3xl flex items-center justify-center mb-4 shadow-sm ${
            isDanger ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
          }`}
        >
          <AlertTriangle className="w-7 h-7" />
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 max-w-sm">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
