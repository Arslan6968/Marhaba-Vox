import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types';

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: 'success' | 'error' | 'info', title: string, description?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, type, title, description };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const toast = {
    success: (title: string, description?: string) => addToast('success', title, description),
    error: (title: string, description?: string) => addToast('error', title, description),
    info: (title: string, description?: string) => addToast('info', title, description),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-white shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 ${
              t.type === 'success'
                ? 'border-emerald-200 text-emerald-950'
                : t.type === 'error'
                ? 'border-red-200 text-red-950'
                : 'border-purple-200 text-slate-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#16A36A]" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-[#E5484D]" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-[#6558D9]" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold leading-tight">{t.title}</h4>
              {t.description && (
                <p className="text-xs text-[#777D8C] mt-1 leading-normal break-words">{t.description}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-slate-100"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
