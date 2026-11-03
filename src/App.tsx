import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ActiveTab } from './components/Header';
import { RegexStudio } from './components/RegexStudio';
import { InProgressBoard } from './components/InProgressBoard';
import { TeamDirectory } from './components/TeamDirectory';
import { DetectionStudio } from './components/DetectionStudio';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ToastContainer } from './components/ToastContainer';
import { CommandPalette } from './components/CommandPalette';
import { QCTask, TeamMember, QCNotification } from './types';
import { playChime } from './utils/audio';
import { X, Code2, ListTodo, Users2, ScanSearch } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('regex');

  // Application Data States
  const [tasks, setTasks] = useState<QCTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [notifications, setNotifications] = useState<QCNotification[]>([]);
  const [toasts, setToasts] = useState<QCNotification[]>([]);

  // UI States
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [regexInitialUrl, setRegexInitialUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Global Session Timer State (Shared across Sidebar & Workbench)
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>('task-101');
  const [timerSeconds, setTimerSeconds] = useState(1440); // 24 min initial
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Handle Theme Switch
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Default to dark theme for developer workbench aesthetic
    document.documentElement.classList.add('dark');
  }, []);

  // Fetch initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [tasksRes, teamRes, notifsRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/team'),
          fetch('/api/notifications'),
        ]);

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData);
        }
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamMembers(teamData);
        }
        if (notifsRes.ok) {
          const notifsData = await notifsRes.json();
          setNotifications(notifsData);
        }
      } catch (err) {
        console.error('Error fetching initial app data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Real-time Server-Sent Events (SSE) listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connectSSE() {
      eventSource = new EventSource('/api/notifications/stream');

      eventSource.addEventListener('notification', (e) => {
        try {
          const newNotif: QCNotification = JSON.parse(e.data);
          setNotifications((prev) => [newNotif, ...prev]);
          setToasts((prev) => [newNotif, ...prev.slice(0, 3)]);

          if (soundEnabled) {
            playChime(newNotif.severity === 'urgent' ? 'alert' : 'notification');
          }

          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newNotif.id));
          }, 6000);
        } catch (err) {
          console.error('Error parsing notification SSE:', err);
        }
      });

      eventSource.addEventListener('task_created', (e) => {
        try {
          const task: QCTask = JSON.parse(e.data);
          setTasks((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
        } catch (err) {
          console.error('Error parsing task_created SSE:', err);
        }
      });

      eventSource.addEventListener('task_updated', (e) => {
        try {
          const task: QCTask = JSON.parse(e.data);
          setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        } catch (err) {
          console.error('Error parsing task_updated SSE:', err);
        }
      });

      eventSource.addEventListener('task_deleted', (e) => {
        try {
          const { id } = JSON.parse(e.data);
          setTasks((prev) => prev.filter((t) => t.id !== id));
        } catch (err) {
          console.error('Error parsing task_deleted SSE:', err);
        }
      });

      eventSource.addEventListener('team_updated', (e) => {
        try {
          const members: TeamMember[] = JSON.parse(e.data);
          setTeamMembers(members);
        } catch (err) {
          console.error('Error parsing team_updated SSE:', err);
        }
      });

      eventSource.addEventListener('notifications_cleared', () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      });

      eventSource.onerror = () => {
        eventSource?.close();
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    }

    connectSSE();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [soundEnabled]);

  // Task Handlers
  const handleCreateTask = async (taskData: Partial<QCTask>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<QCTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Team Handlers
  const handleAddMember = async (memberData: Partial<TeamMember>) => {
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      if (res.ok) {
        const newMember = await res.json();
        setTeamMembers((prev) => [newMember, ...prev]);
      }
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  const handleUpdateMember = async (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    try {
      await fetch(`/api/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed to update member:', err);
    }
  };

  // Notification Handlers
  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleSimulateActivity = async () => {
    try {
      await fetch('/api/simulate-activity', { method: 'POST' });
    } catch (err) {
      console.error('Failed to simulate activity:', err);
    }
  };

  // Cross-Navigation Handlers
  const handleSendToRegexStudio = (url: string) => {
    setRegexInitialUrl(url);
    setActiveTab('regex');
  };

  const handleAddTaskFromRegex = (taskData: Partial<QCTask>) => {
    handleCreateTask(taskData);
    setActiveTab('inprogress');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'in_progress').length;
  const activeTimerTask = tasks.find((t) => t.id === activeTimerTaskId);

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Floating Real-time Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        onNavigateToTask={() => {
          setActiveTab('inprogress');
        }}
      />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setActiveTab}
        onSelectTask={() => setActiveTab('inprogress')}
        onSelectMember={() => setActiveTab('team')}
        tasks={tasks}
        teamMembers={teamMembers}
        onOpenRegexWithUrl={handleSendToRegexStudio}
      />

      {/* Modern Dashboard Sidebar (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        inProgressCount={inProgressTasksCount}
        totalTeamCount={teamMembers.length}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        activeTimerTask={activeTimerTask}
        timerSeconds={timerSeconds}
        isTimerRunning={isTimerRunning}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex lg:hidden">
          <div className="w-64 bg-slate-900 h-full p-4 flex flex-col justify-between border-r border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-white text-sm">QC Tester Studio</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('regex');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                    activeTab === 'regex' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>Link Regex Studio</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('inprogress');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                    activeTab === 'inprogress' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    <span>In Progress</span>
                  </div>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded-full">
                    {inProgressTasksCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('team');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                    activeTab === 'team' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users2 className="w-4 h-4" />
                    <span>Team Directory</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{teamMembers.length}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('detection');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                    activeTab === 'detection' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ScanSearch className="w-4 h-4" />
                    <span>Checkout Detection</span>
                  </div>
                  <span className="text-[10px] text-indigo-400">DOM</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Modern Top Application Bar */}
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadCount={unreadNotifsCount}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          onSimulateActivity={handleSimulateActivity}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          inProgressCount={inProgressTasksCount}
        />

        {/* Slide-out Notification Drawer */}
        <NotificationDrawer
          isOpen={isNotificationDrawerOpen}
          onClose={() => setIsNotificationDrawerOpen(false)}
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onMarkAsRead={handleMarkNotificationAsRead}
          onSimulateActivity={handleSimulateActivity}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onSelectTask={() => {
            setActiveTab('inprogress');
          }}
        />

        {/* Dynamic Workspace Content */}
        <main className="flex-1 overflow-x-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading QC Workspace...</p>
            </div>
          ) : (
            <>
              {activeTab === 'regex' && (
                <RegexStudio
                  onAddTaskFromRegex={handleAddTaskFromRegex}
                  teamMembers={teamMembers}
                  initialUrl={regexInitialUrl}
                />
              )}

              {activeTab === 'inprogress' && (
                <InProgressBoard
                  tasks={tasks}
                  teamMembers={teamMembers}
                  onUpdateTask={handleUpdateTask}
                  onCreateTask={handleCreateTask}
                  onDeleteTask={handleDeleteTask}
                  onSendToRegexStudio={handleSendToRegexStudio}
                />
              )}

              {activeTab === 'team' && (
                <TeamDirectory
                  teamMembers={teamMembers}
                  onAddMember={handleAddMember}
                  onUpdateMember={handleUpdateMember}
                  onSelectMemberForTasks={() => {
                    setActiveTab('inprogress');
                  }}
                />
              )}

              {activeTab === 'detection' && (
                <DetectionStudio
                  onAddTask={handleCreateTask}
                  onSendToRegexStudio={handleSendToRegexStudio}
                  teamMembers={teamMembers}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
