import React, { useState, useEffect } from 'react';
import {
  QCTask,
  TeamMember,
  TaskStatus,
  TaskPriority,
  TaskCategory,
} from '../types';
import {
  Clock,
  Play,
  Pause,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Code2,
  Bug,
  Search,
  Filter,
  Layers,
  ChevronRight,
  User,
  CheckSquare,
  Square,
  MoreVertical,
  Trash2,
  Edit3,
  X,
  Sparkles,
} from 'lucide-react';

interface InProgressBoardProps {
  tasks: QCTask[];
  teamMembers: TeamMember[];
  onUpdateTask: (id: string, updates: Partial<QCTask>) => void;
  onCreateTask: (newTask: Partial<QCTask>) => void;
  onDeleteTask: (id: string) => void;
  onSendToRegexStudio: (url: string) => void;
}

export const InProgressBoard: React.FC<InProgressBoardProps> = ({
  tasks,
  teamMembers,
  onUpdateTask,
  onCreateTask,
  onDeleteTask,
  onSendToRegexStudio,
}) => {
  const [viewMode, setViewMode] = useState<'in_progress_only' | 'kanban' | 'list'>('in_progress_only');
  const [selectedTask, setSelectedTask] = useState<QCTask | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Live QC Session Timer state
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>('task-101');
  const [timerSeconds, setTimerSeconds] = useState(1440); // 24 minutes initial
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // New checklist item in modal
  const [newChecklistText, setNewChecklistText] = useState('');

  // New Task Form State
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    targetUrl: '',
    assignedTo: teamMembers.find((m) => m.status === 'active')?.id || '',
    priority: 'high' as TaskPriority,
    category: 'Regex QC' as TaskCategory,
    notes: '',
  });

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAssignee = (memberId: string) => {
    return teamMembers.find((m) => m.id === memberId);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (viewMode === 'in_progress_only' && task.status !== 'in_progress') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchUrl = task.targetUrl.toLowerCase().includes(q);
      const matchNotes = task.notes.toLowerCase().includes(q);
      if (!matchTitle && !matchUrl && !matchNotes) return false;
    }
    if (assigneeFilter !== 'all' && task.assignedTo !== assigneeFilter) {
      return false;
    }
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }
    if (categoryFilter !== 'all' && task.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const inProgressList = tasks.filter((t) => t.status === 'in_progress');
  const reviewList = tasks.filter((t) => t.status === 'review');
  const completedList = tasks.filter((t) => t.status === 'completed');
  const backlogList = tasks.filter((t) => t.status === 'backlog');

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">Critical</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">Low</span>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">In Progress</span>;
      case 'review':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">In Review</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Completed</span>;
      case 'blocked':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">Blocked</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">Backlog</span>;
    }
  };

  // Toggle checklist item
  const handleToggleChecklist = (task: QCTask, checkId: string) => {
    const updatedChecklist = task.checklist.map((item) =>
      item.id === checkId ? { ...item, completed: !item.completed } : item
    );
    const completedCount = updatedChecklist.filter((c) => c.completed).length;
    const progress = Math.round((completedCount / updatedChecklist.length) * 100);

    onUpdateTask(task.id, {
      checklist: updatedChecklist,
      progress,
    });

    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask({
        ...selectedTask,
        checklist: updatedChecklist,
        progress,
      });
    }
  };

  // Add checklist item to open modal task
  const handleAddChecklistItem = () => {
    if (!selectedTask || !newChecklistText.trim()) return;
    const newItem = {
      id: `c-${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    const updatedList = [...selectedTask.checklist, newItem];
    const completedCount = updatedList.filter((c) => c.completed).length;
    const progress = Math.round((completedCount / updatedList.length) * 100);

    onUpdateTask(selectedTask.id, {
      checklist: updatedList,
      progress,
    });

    setSelectedTask({
      ...selectedTask,
      checklist: updatedList,
      progress,
    });
    setNewChecklistText('');
  };

  // Submit new task
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;

    onCreateTask({
      title: newTaskForm.title.trim(),
      targetUrl: newTaskForm.targetUrl.trim() || 'https://example.com',
      assignedTo: newTaskForm.assignedTo || teamMembers[0]?.id || 'mem-1',
      priority: newTaskForm.priority,
      category: newTaskForm.category,
      status: 'in_progress', // Created directly into In Progress
      progress: 0,
      timeSpentMinutes: 0,
      checklist: [
        { id: 'c1', text: 'Validate URL syntax and protocol', completed: false },
        { id: 'c2', text: 'Synthesize & verify regex match groups', completed: false },
        { id: 'c3', text: 'Run 10 test case variations', completed: false },
        { id: 'c4', text: 'Confirm zero ReDoS backtracking vulnerability', completed: false },
      ],
      notes: newTaskForm.notes,
      bugsFound: 0,
    });

    setIsCreateModalOpen(false);
    setNewTaskForm({
      title: '',
      targetUrl: '',
      assignedTo: teamMembers.find((m) => m.status === 'active')?.id || '',
      priority: 'high',
      category: 'Regex QC',
      notes: '',
    });
  };

  const activeTimerTask = tasks.find((t) => t.id === activeTimerTaskId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & High-Density Metrics Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>In Progress Work</span>
            <span className="text-[11px] font-mono text-indigo-400">
              {inProgressList.length} Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Quality Control testing queue, checklist audits, and live session timers.
          </p>
        </div>

        {/* Live QC Session Timer Ribbon */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl shadow-xs">
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isTimerRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span>Session Timer</span>
            </div>
            <div className="text-sm font-mono font-bold text-white tabular-nums">
              {formatTimer(timerSeconds)}
            </div>
          </div>

          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`p-1.5 rounded-lg text-white font-medium transition cursor-pointer shadow-xs ${
              isTimerRunning
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
            title={isTimerRunning ? 'Pause Session' : 'Start Session'}
          >
            {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">In Progress Queue</div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-0.5">
            {inProgressList.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active testing tasks</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Under Peer Review</div>
          <div className="text-xl font-bold text-purple-300 font-mono tabular-nums mt-0.5">
            {reviewList.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Awaiting lead sign-off</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Completed Audits</div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
            {completedList.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified production links</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Flagged Mismatches</div>
          <div className="text-xl font-bold text-rose-400 font-mono tabular-nums mt-0.5">
            {tasks.reduce((acc, t) => acc + t.bugsFound, 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Edge case defects found</div>
        </div>
      </div>

      {/* Control Bar: View Switcher, Search, Filters, and New Task */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md">
        {/* View Segmented Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('in_progress_only')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'in_progress_only'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>In Progress ({inProgressList.length})</span>
          </button>

          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'kanban'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Table View</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl md:justify-end">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search link or task..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Assignees</option>
            {teamMembers
              .filter((m) => m.status === 'active')
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role.split(' ')[0]})
                </option>
              ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: In Progress Focused View (Primary requirement: second menu in progress) */}
      {viewMode === 'in_progress_only' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Active In-Progress Queue ({filteredTasks.length} tasks)
            </h2>
            <span className="text-xs text-slate-500">
              Assigned to active interns & QC editors
            </span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-semibold text-white">No In-Progress Tasks Matching Filter</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                All assigned tasks are reviewed, completed, or filters exclude current items.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create a QC Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => {
                const assignee = getAssignee(task.assignedTo);
                const completedChecks = task.checklist.filter((c) => c.completed).length;

                return (
                  <div
                    key={task.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col justify-between group relative"
                  >
                    <div className="space-y-3">
                      {/* Header tags */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                          {task.category}
                        </span>
                        {getPriorityBadge(task.priority)}
                      </div>

                      {/* Title & Target Link */}
                      <div>
                        <h3
                          onClick={() => setSelectedTask(task)}
                          className="text-sm font-bold text-white hover:text-indigo-400 transition cursor-pointer line-clamp-1"
                        >
                          {task.title}
                        </h3>

                        {/* Link with quick action */}
                        <div className="mt-1.5 flex items-center justify-between gap-1 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                          <span className="text-[11px] font-mono text-indigo-300 truncate select-all flex-1">
                            {task.targetUrl}
                          </span>
                          <button
                            onClick={() => onSendToRegexStudio(task.targetUrl)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-900 transition shrink-0"
                            title="Generate regex for this link in Regex Studio"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Assignee Card */}
                      {assignee && (
                        <div className="flex items-center gap-2 pt-1">
                          <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-tr ${assignee.avatarColor} text-[10px] font-bold text-white flex items-center justify-center shrink-0`}
                          >
                            {assignee.initials}
                          </div>
                          <div className="text-xs">
                            <span className="text-slate-300 font-medium">{assignee.name}</span>
                            <span className="text-[11px] text-slate-500 ml-1.5">({assignee.role})</span>
                          </div>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">QC Checklist</span>
                          <span className="text-indigo-300 font-semibold">
                            {completedChecks}/{task.checklist.length} ({task.progress}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Interactive quick check items */}
                      <div className="space-y-1.5 pt-1">
                        {task.checklist.slice(0, 3).map((check) => (
                          <div
                            key={check.id}
                            onClick={() => handleToggleChecklist(task, check.id)}
                            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                          >
                            {check.completed ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className={`truncate text-[11px] ${check.completed ? 'line-through text-slate-500' : ''}`}>
                              {check.text}
                            </span>
                          </div>
                        ))}
                        {task.checklist.length > 3 && (
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                          >
                            +{task.checklist.length - 3} more checklist items
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status advancement controls */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveTimerTaskId(task.id);
                            setIsTimerRunning(true);
                          }}
                          className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                            activeTimerTaskId === task.id && isTimerRunning
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                          }`}
                          title="Track testing time for this task"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onUpdateTask(task.id, { bugsFound: task.bugsFound + 1 })}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition cursor-pointer"
                          title="Flag an issue or ReDoS edge case in this link"
                        >
                          <Bug className="w-3 h-3 text-rose-400" />
                          <span>{task.bugsFound}</span>
                        </button>
                      </div>

                      {/* Advancement Action */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onUpdateTask(task.id, { status: 'review' })}
                          className="px-2.5 py-1 bg-purple-600/90 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition shadow-xs cursor-pointer"
                        >
                          Send to Review →
                        </button>

                        <button
                          onClick={() => onUpdateTask(task.id, { status: 'completed', progress: 100 })}
                          className="p-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                          title="Mark task completed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Full Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { id: 'backlog', title: 'Backlog', list: backlogList, color: 'text-slate-400', border: 'border-slate-800' },
            { id: 'in_progress', title: 'In Progress', list: inProgressList, color: 'text-indigo-400', border: 'border-indigo-500/30' },
            { id: 'review', title: 'Under Review', list: reviewList, color: 'text-purple-400', border: 'border-purple-500/30' },
            { id: 'completed', title: 'Completed', list: completedList, color: 'text-emerald-400', border: 'border-emerald-500/30' },
          ].map((col) => (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                  {col.title} ({col.list.length})
                </span>
              </div>

              <div className="space-y-3">
                {col.list.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer space-y-2.5 shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {task.category}
                      </span>
                      {getPriorityBadge(task.priority)}
                    </div>

                    <h4 className="text-xs font-semibold text-white line-clamp-2">
                      {task.title}
                    </h4>

                    <div className="text-[11px] font-mono text-indigo-300 truncate">
                      {task.targetUrl}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <span>{task.checklist.filter((c) => c.completed).length}/{task.checklist.length} checks</span>
                      <span>{task.progress}%</span>
                    </div>
                  </div>
                ))}

                {col.list.length === 0 && (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                    No tasks in {col.title}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: Table / High-Density List View */}
      {viewMode === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Task Title & Target Link</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.map((task) => {
                const assignee = getAssignee(task.assignedTo);
                return (
                  <tr key={task.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <div
                        onClick={() => setSelectedTask(task)}
                        className="font-semibold text-slate-200 hover:text-indigo-400 cursor-pointer"
                      >
                        {task.title}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                        {task.targetUrl}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(task.status)}</td>
                    <td className="px-4 py-3">
                      {assignee ? (
                        <span className="text-slate-300 font-medium">{assignee.name}</span>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getPriorityBadge(task.priority)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSendToRegexStudio(task.targetUrl)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 text-[11px] flex items-center gap-1"
                        >
                          <Code2 className="w-3 h-3" /> Regex
                        </button>
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Detail Modal / Inspector Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">QC Task Inspector</span>
                {getStatusBadge(selectedTask.status)}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white leading-snug">
                  {selectedTask.title}
                </h2>
                <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-indigo-300 break-all select-all">
                    {selectedTask.targetUrl}
                  </span>
                  <button
                    onClick={() => {
                      onSendToRegexStudio(selectedTask.targetUrl);
                      setSelectedTask(null);
                    }}
                    className="p-1.5 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition shrink-0"
                    title="Open in Link Regex Studio"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status and Priority selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as TaskStatus;
                      onUpdateTask(selectedTask.id, { status: newStatus });
                      setSelectedTask({ ...selectedTask, status: newStatus });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Under Review</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Assignee
                  </label>
                  <select
                    value={selectedTask.assignedTo}
                    onChange={(e) => {
                      onUpdateTask(selectedTask.id, { assignedTo: e.target.value });
                      setSelectedTask({ ...selectedTask, assignedTo: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.status === 'gone' ? 'Alumnus' : m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interactive QC Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Acceptance Criteria & QC Checks
                  </h3>
                  <span className="text-xs font-semibold text-indigo-300">
                    {selectedTask.checklist.filter((c) => c.completed).length}/{selectedTask.checklist.length} ({selectedTask.progress}%)
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedTask.checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(selectedTask, item.id)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-start gap-2.5 cursor-pointer select-none transition"
                    >
                      {item.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs text-slate-200 leading-relaxed ${item.completed ? 'line-through text-slate-500' : ''}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add new check */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                    placeholder="Add verification check (e.g. Verify UTF-8 slug encoding)..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Task Notes / Bug Logs */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  QC Audit Notes & Regex Findings
                </label>
                <textarea
                  rows={4}
                  value={selectedTask.notes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTask({ ...selectedTask, notes: val });
                    onUpdateTask(selectedTask.id, { notes: val });
                  }}
                  placeholder="Record edge case observations, ReDoS benchmarks, or parameter caveats..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Bug Counter */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5 text-rose-400" />
                    Flags & Mismatches Discovered
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Increments trigger live alerts to the QC Lead
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updated = Math.max(0, selectedTask.bugsFound - 1);
                      setSelectedTask({ ...selectedTask, bugsFound: updated });
                      onUpdateTask(selectedTask.id, { bugsFound: updated });
                    }}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm text-white px-2">
                    {selectedTask.bugsFound}
                  </span>
                  <button
                    onClick={() => {
                      const updated = selectedTask.bugsFound + 1;
                      setSelectedTask({ ...selectedTask, bugsFound: updated });
                      onUpdateTask(selectedTask.id, { bugsFound: updated });
                    }}
                    className="w-7 h-7 rounded-lg bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold hover:bg-rose-600 hover:text-white flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    onDeleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>

              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New QC Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Create New QC Task (Assigned to In Progress)
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="e.g. Audit Multi-locale Search Query Regex"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Target Link to Test *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskForm.targetUrl}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, targetUrl: e.target.value })}
                  placeholder="https://example.com/checkout/step-2?token=xyz"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Assignee (Intern or QC Editor)
                  </label>
                  <select
                    value={newTaskForm.assignedTo}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedTo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {teamMembers
                      .filter((m) => m.status === 'active')
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newTaskForm.category}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, category: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Regex QC">Regex QC</option>
                  <option value="Link Routing">Link Routing</option>
                  <option value="Deep Link Audit">Deep Link Audit</option>
                  <option value="Query Param Sanitization">Query Param Sanitization</option>
                  <option value="Localization QC">Localization QC</option>
                  <option value="Broken Link Patrol">Broken Link Patrol</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Testing Notes & Edge Cases
                </label>
                <textarea
                  rows={3}
                  value={newTaskForm.notes}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })}
                  placeholder="Notes for the tester or intern working on this task..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md"
                >
                  Create & Start Testing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
