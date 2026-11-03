import React, { useState } from 'react';
import { QCNotification } from '../types';
import {
  Bell,
  CheckCheck,
  X,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: QCNotification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onSimulateActivity: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectTask?: (taskId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onSimulateActivity,
  soundEnabled,
  onToggleSound,
  onSelectTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifs = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const getIcon = (type: QCNotification['type'], severity: QCNotification['severity']) => {
    if (severity === 'urgent') {
      return <AlertCircle className="w-4 h-4 text-rose-400" />;
    }
    if (severity === 'warning') {
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
    if (severity === 'success') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    return <Info className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Live QC Updates
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Real-time SSE
                </span>
              </h2>
              <p className="text-xs text-slate-400">Streamed task and regex events</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-lg border text-xs transition ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                  : 'bg-slate-800/50 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Mute audio chime' : 'Enable audio chime'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Simulation Banner & Action */}
        <div className="p-3 bg-indigo-950/40 border-b border-indigo-900/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Test real-time stream:</span>
          </div>
          <button
            onClick={onSimulateActivity}
            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Radio className="w-3 h-3 text-indigo-200 animate-pulse" />
            Simulate Activity
          </button>
        </div>

        {/* Filter & Bulk Actions */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filter === 'unread'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications Scroll List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500 mb-3 border border-slate-700/50">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-medium text-slate-300">No notifications</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {filter === 'unread'
                  ? 'You are all caught up! No unread updates.'
                  : 'Real-time task and QC updates will stream here automatically.'}
              </p>
              <button
                onClick={onSimulateActivity}
                className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Simulate an intern update
              </button>
            </div>
          ) : (
            filteredNotifs.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.read) onMarkAsRead(item.id);
                  if (item.taskId && onSelectTask) {
                    onSelectTask(item.taskId);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer relative group ${
                  item.read
                    ? 'bg-slate-900/50 border-slate-800/70 hover:bg-slate-800/40 text-slate-400'
                    : 'bg-slate-800/70 border-indigo-500/30 hover:bg-slate-800 text-slate-200 shadow-md'
                }`}
              >
                {!item.read && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded-md bg-slate-800/80 border border-slate-700/60">
                    {getIcon(item.type, item.severity)}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                        {item.title}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.message}</p>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.timestamp)}
                      </span>

                      {item.taskId && (
                        <span className="text-indigo-400 group-hover:text-indigo-300 font-medium">
                          Inspect Task →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span>QC Notification Dispatcher</span>
          <span>SSE Channel #qc-events</span>
        </div>
      </div>
    </div>
  );
};
