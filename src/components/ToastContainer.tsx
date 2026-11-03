import React from 'react';
import { QCNotification } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: QCNotification[];
  onDismiss: (id: string) => void;
  onNavigateToTask?: (taskId: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onNavigateToTask,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.severity) {
            case 'success':
              return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
            case 'urgent':
              return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
            case 'warning':
              return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
            default:
              return <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />;
          }
        };

        const getBorderColor = () => {
          switch (toast.severity) {
            case 'success':
              return 'border-emerald-500/40 bg-emerald-950/80';
            case 'urgent':
              return 'border-rose-500/40 bg-rose-950/80';
            case 'warning':
              return 'border-amber-500/40 bg-amber-950/80';
            default:
              return 'border-blue-500/40 bg-slate-900/90';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-2 fade-in ${getBorderColor()}`}
          >
            {getIcon()}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {toast.title}
                </h4>
                <button
                  onClick={() => onDismiss(toast.id)}
                  className="text-slate-400 hover:text-slate-100 p-0.5 rounded transition"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-200 mt-1 line-clamp-2">{toast.message}</p>
              {toast.taskId && onNavigateToTask && (
                <button
                  onClick={() => {
                    onNavigateToTask(toast.taskId!);
                    onDismiss(toast.id);
                  }}
                  className="mt-2 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1"
                >
                  View QC Task →
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
