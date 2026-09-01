import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastIcons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />,
    info: <Info className="h-4 w-4 text-sky-500 flex-shrink-0" />,
  };

  const toastStyles = {
    success: 'border-emerald-100 bg-white/95 text-slate-800 shadow-emerald-500/5',
    error: 'border-rose-100 bg-white/95 text-slate-800 shadow-rose-500/5',
    warning: 'border-amber-100 bg-white/95 text-slate-800 shadow-amber-500/5',
    info: 'border-sky-100 bg-white/95 text-slate-800 shadow-sky-500/5',
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border shadow-xl backdrop-blur-md animate-slide-up transition-all ${
              toastStyles[t.type] || toastStyles.success
            }`}
          >
            <div className="flex items-center space-x-3 text-xs font-medium pr-2">
              {toastIcons[t.type] || toastIcons.success}
              <span className="leading-snug">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
            >
              <X className="h-3.5 w-3.5" />
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
