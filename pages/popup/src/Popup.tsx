import '@src/Popup.css';
import { useEffect, useState } from 'react';
import { useStorage, withErrorBoundary, withSuspense, scoreRelevance, type RelevanceResult } from '@extension/shared';
import {
  exampleThemeStorage,
  authStorage,
  focusSessionStorage,
  tasksStorage,
  blockingStorage,
  blockedSitesStorage,
  consentStorage,
  referenceStorage,
  workflowsStorage,
  CONSENT_VERSION,
  FRONTEND_URL,
  API_BASE,
} from '@extension/storage';
import { cn, LoadingSpinner, TimeTracker } from '@extension/ui';
import { Login } from './Login';
import { ConsentNotice } from './ConsentNotice';
import type { FocusSession, Task, WorkflowSummary } from '@extension/types';

interface ActiveTabContext {
  title: string;
  url: string;
  selectedText?: string;
}

function Popup() {
  const { isLight } = useStorage(exampleThemeStorage);
  const { isAuthenticated } = useStorage(authStorage);
  const consent = useStorage(consentStorage);
  const blockedSites = useStorage(blockedSitesStorage);
  const blockingState = useStorage(blockingStorage);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [description, setDescription] = useState('');
  const [todayTotal, setTodayTotal] = useState(0);
  const [weekTotal, setWeekTotal] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskError, setTaskError] = useState<string | null>(null);
  const [newSite, setNewSite] = useState('');
  const [showBlocklist, setShowBlocklist] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTabContext | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowSummary | undefined>(undefined);
  const [savingReference, setSavingReference] = useState(false);
  const [referenceSaved, setReferenceSaved] = useState(false);

  // authStorage is updated live by the background script when the dashboard
  // bridge relays a login. Once that lands, enrich the user with backend data.
  useEffect(() => {
    if (!isAuthenticated) return;

    authStorage.get().then(auth => {
      if (!auth.accessToken) return;
      fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      })
        .then(response => {
          if (response.status === 401) authStorage.logout();
          return response.ok ? response.json() : null;
        })
        .then(userData => {
          if (userData?.id) {
            // Preserve the real token — only refresh the user profile fields.
            authStorage.setAuth(
              {
                id: userData.id,
                email: userData.email || '',
                name: userData.name || 'User',
                picture: userData.picture,
              },
              auth.accessToken!,
              auth.refreshToken || '',
              3600,
            );
          }
        })
        .catch(() => console.log('Backend auth check failed, using local storage'));
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    let interval: NodeJS.Timeout | null = null;

    const loadState = async () => {
      try {
        const activeSession = await focusSessionStorage.getCurrent();
        setSession(activeSession);

        const now = Date.now();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(now);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const sessionsToday = await focusSessionStorage.getSessionsSince(startOfDay.getTime());
        const sessionsWeek = await focusSessionStorage.getSessionsSince(startOfWeek.getTime());

        const calcTotal = (sessions: FocusSession[]) =>
          sessions.reduce((sum, s) => sum + ((s.endTime || now) - s.startTime), 0);

        setTodayTotal(calcTotal(sessionsToday));
        setWeekTotal(calcTotal(sessionsWeek));

        if (activeSession) {
          setDescription(activeSession.description || '');
        }
      } catch (err) {
        console.error('Failed to load tracking state:', err);
      }
    };

    loadState();
    interval = setInterval(loadState, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated]);

  const refreshTasks = async () => {
    try {
      const openTasks = await tasksStorage.query({ status: ['inbox', 'todo', 'in-progress'], limit: 10 });
      setTasks(openTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    refreshTasks();
    const interval = setInterval(refreshTasks, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // "This Page" — the active tab's title/URL (+selection), via the same
  // explicit QUERY_CONTEXT message task-capture already uses. Polled while
  // the popup is open only; nothing here runs while the popup is closed.
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const queryActiveTab = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
          if (!cancelled) setActiveTab(null);
          return;
        }
        const response = await chrome.tabs
          .sendMessage(tab.id, { type: 'QUERY_CONTEXT', payload: { query: 'context' } })
          .catch(() => null);
        if (cancelled) return;
        setActiveTab({
          title: response?.title || tab.title || '',
          url: response?.url || tab.url || '',
          selectedText: response?.selectedText,
        });
      } catch {
        if (!cancelled) setActiveTab(null);
      }
    };

    queryActiveTab();
    const interval = setInterval(queryActiveTab, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Resolve "Current Work": the active session's linked task, and — if that
  // task came from a workflow — the workflow's step text for that task's
  // step_id (falls back to the task's free-text next_micro_step/title).
  useEffect(() => {
    if (!isAuthenticated || !session?.associatedTaskId) {
      setCurrentTask(null);
      setCurrentWorkflow(undefined);
      return;
    }
    let cancelled = false;
    tasksStorage
      .getTasks()
      .then(all => {
        if (cancelled) return;
        const task = all.find(t => t.id === session.associatedTaskId) || null;
        setCurrentTask(task);
        if (task?.workflowId) {
          workflowsStorage
            .getWorkflow(task.workflowId)
            .then(wf => !cancelled && setCurrentWorkflow(wf))
            .catch(() => !cancelled && setCurrentWorkflow(undefined));
        } else {
          setCurrentWorkflow(undefined);
        }
      })
      .catch(() => !cancelled && setCurrentTask(null));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, session?.associatedTaskId]);

  const currentStepId = session?.currentStepId || currentTask?.stepId;
  const currentStepText =
    currentWorkflow?.steps.find(s => s.id === currentStepId)?.taskName || currentTask?.description || undefined;

  const relevance: RelevanceResult | null =
    currentTask && activeTab
      ? scoreRelevance({ name: currentTask.title, stepText: currentStepText }, activeTab)
      : null;

  const handleSaveReference = async () => {
    setSavingReference(true);
    setReferenceSaved(false);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'SAVE_REFERENCE' });
      if (!response?.success) return;
      await referenceStorage.addReference({
        title: response.title || tab.title || 'Untitled',
        url: response.url || tab.url,
        taskId: currentTask?.id,
      });
      setReferenceSaved(true);
    } catch (err) {
      console.error('Failed to save reference:', err);
    } finally {
      setSavingReference(false);
    }
  };

  const handleAddTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    setTaskError(null);
    try {
      await tasksStorage.addTask({
        title,
        priority: 'medium',
        tags: [],
        status: 'todo',
        syncedToMobile: false,
      });
      setNewTaskTitle('');
      await refreshTasks();
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : 'Failed to add task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await tasksStorage.update(taskId, { status: 'done', completedAt: Date.now() });
      await refreshTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  // Picking a task to focus on, instead of always typing a free-text
  // description: starts the same timer + site-blocking flow as the
  // description box's Start button, but pinned to that exact task — and
  // marks it in-progress so the dashboard's Execution Panel picks it up too.
  const handleFocusTask = async (task: Task) => {
    try {
      const newSession = await focusSessionStorage.startTracking({
        description: task.title,
        associatedTaskId: task.id,
        currentStepId: task.stepId,
      });
      setSession(newSession);
      setDescription(task.title);
      await blockingStorage.enable(blockedSites);
      await tasksStorage.update(task.id, { status: 'in-progress' });
      await refreshTasks();
      // Session-scoped context-switch watch — see chrome-extension/src/background:
      // only runs while a session with task context is active, stops on
      // FOCUS_ENDED/PAUSED. Sent here (not derived in the background) because
      // only the popup has the task's resolved step text.
      chrome.runtime
        .sendMessage({
          type: 'FOCUS_STARTED',
          payload: { ...newSession, taskName: task.title, stepText: task.description },
        })
        .catch(() => {});
    } catch (err) {
      console.error('Failed to start focus on task:', err);
    }
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: FRONTEND_URL });
  };

  const handleLogout = async () => {
    await authStorage.logout();
  };

  const handleStart = async () => {
    try {
      const newSession = await focusSessionStorage.startTracking({ description });
      setSession(newSession);
      await blockingStorage.enable(blockedSites);
    } catch (err) {
      console.error('Failed to start tracking:', err);
    }
  };

  const handleAddSite = async () => {
    const site = newSite.trim();
    if (!site) return;
    const next = await blockedSitesStorage.add(site);
    setNewSite('');
    await blockingStorage.updateSites(next);
  };

  const handleRemoveSite = async (site: string) => {
    const next = await blockedSitesStorage.remove(site);
    await blockingStorage.updateSites(next);
  };

  const handleStop = async () => {
    try {
      await focusSessionStorage.stopTracking();
      await blockingStorage.disable();
      chrome.runtime.sendMessage({ type: 'FOCUS_ENDED', payload: {} }).catch(() => {});
      setSession(null);
      setDescription('');
      setCurrentTask(null);
      setCurrentWorkflow(undefined);

      const now = Date.now();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const sessionsToday = await focusSessionStorage.getSessionsSince(startOfDay.getTime());
      const sessionsWeek = await focusSessionStorage.getSessionsSince(startOfWeek.getTime());

      const calcTotal = (sessions: FocusSession[]) =>
        sessions.reduce((sum, s) => sum + ((s.endTime || now) - s.startTime), 0);

      setTodayTotal(calcTotal(sessionsToday));
      setWeekTotal(calcTotal(sessionsWeek));
    } catch (err) {
      console.error('Failed to stop tracking:', err);
    }
  };

  const formatMs = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (!isAuthenticated) {
    return <Login isLight={isLight} onLoginSuccess={() => {}} />;
  }

  // First-use data-use notice — shown once, before the popup is usable.
  if (consent.acceptedVersion !== CONSENT_VERSION) {
    return <ConsentNotice isLight={isLight} onAccept={() => void consentStorage.accept()} />;
  }

  return (
    <div
      className={cn('w-full flex flex-col p-4 gap-4 font-sans', isLight ? 'bg-paper text-ink' : 'bg-ink text-paper')}
      style={{ width: '380px' }}
    >
      {/* Branding */}
      <div className="flex items-center gap-2">
        <img src={chrome.runtime.getURL('icon-128.png')} alt="" className="h-5 w-5" />
        <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">Task Weave</span>
      </div>

      {/* Time Totals */}
      <div className="flex gap-3 text-center">
        <div className={cn('flex-1 border py-2', isLight ? 'border-ink/15' : 'border-paper/20')}>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Today</p>
          <p className="font-serif font-black text-2xl">{formatMs(todayTotal)}</p>
        </div>
        <div className={cn('flex-1 border py-2', isLight ? 'border-ink/15' : 'border-paper/20')}>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">This Week</p>
          <p className="font-serif font-black text-2xl">{formatMs(weekTotal)}</p>
        </div>
      </div>

      {/* Current Work — the active session's linked task + resolved workflow
          step text (falls back to next_micro_step for tasks with no
          workflow). Nothing shown if no session is running or it isn't
          pinned to a task. */}
      {currentTask && (
        <div className={cn('border p-3 flex flex-col gap-1', isLight ? 'border-ink/15 bg-[#F5F2ED]' : 'border-paper/20 bg-[#1a1a1a]')}>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Current Work</p>
          <p className="text-sm font-semibold truncate">{currentTask.title}</p>
          {currentStepText && <p className="text-xs opacity-70 truncate">Step: {currentStepText}</p>}
          {currentWorkflow && currentStepId && (
            <p className="text-[10px] opacity-50">
              {currentWorkflow.steps.findIndex(s => s.id === currentStepId) + 1} / {currentWorkflow.steps.length} steps
            </p>
          )}
        </div>
      )}

      {/* This Page — the active tab's title + a relevance badge against
          Current Work, and an explicit Save Reference action. Page context
          here is read only while the popup is open (chrome.tabs.query on a
          poll), never scanned in the background. */}
      {activeTab && (
        <div className={cn('border p-3 flex flex-col gap-2', isLight ? 'border-ink/15' : 'border-paper/20')}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">This Page</p>
            {relevance && relevance.verdict !== 'unknown' && (
              <span
                className={cn(
                  'text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 border',
                  relevance.verdict === 'relevant'
                    ? 'border-planning text-planning'
                    : 'border-panic text-panic',
                )}
              >
                {relevance.verdict === 'relevant' ? '● Relevant' : '⚠ Context switch'}
              </span>
            )}
          </div>
          <p className="text-sm truncate" title={activeTab.title}>{activeTab.title || activeTab.url}</p>
          <button
            onClick={handleSaveReference}
            disabled={savingReference}
            className={cn(
              'self-start px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border transition-colors disabled:opacity-50',
              isLight ? 'border-ink hover:bg-ink hover:text-paper' : 'border-paper hover:bg-paper hover:text-ink',
            )}
          >
            {savingReference ? 'Saving…' : referenceSaved ? 'Saved ✓' : 'Save Reference'}
          </button>
        </div>
      )}

      {/* Task-capture site lock — distinct from the blocklist below: instead
          of blocking a few distracting sites, ONLY this one is reachable. */}
      {blockingState.isActive && blockingState.mode === 'allowlist' && blockingState.allowedSite && (
        <div className={cn('flex items-center justify-between gap-2 border p-3', isLight ? 'border-ink bg-[#F5F2ED]' : 'border-paper bg-[#222]')}>
          <p className="text-xs" title="Every other site is blocked until you finish this task or hit Unlock — set from the capture popup's lock checkbox.">
            🔒 Locked to <strong>{blockingState.allowedSite}</strong>
          </p>
          <button
            onClick={handleStop}
            className={cn(
              'px-2 py-1 text-[10px] uppercase tracking-widest font-bold border shrink-0',
              isLight ? 'border-ink hover:bg-ink hover:text-paper' : 'border-paper hover:bg-paper hover:text-ink',
            )}
          >
            Unlock
          </button>
        </div>
      )}

      {/* Time Tracker */}
      <TimeTracker session={session} description={description} onDescriptionChange={setDescription} onStart={handleStart} onStop={handleStop} />

      {/* Tasks */}
      <div className={cn('border-t pt-3 flex flex-col gap-2', isLight ? 'border-ink/15' : 'border-paper/20')}>
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Tasks</p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a task..."
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddTask();
            }}
            className={cn(
              'flex-1 px-3 py-2 border text-sm focus:outline-none',
              isLight
                ? 'bg-white border-ink/30 text-ink focus:border-ink'
                : 'bg-ink border-paper/30 text-paper focus:border-paper',
            )}
          />
          <button
            onClick={handleAddTask}
            className={cn(
              'px-3 py-2 text-[10px] uppercase tracking-widest font-bold border',
              isLight ? 'bg-ink text-paper border-ink hover:bg-[#333]' : 'bg-paper text-ink border-paper hover:bg-gray-200',
            )}
          >
            Add
          </button>
        </div>

        {taskError && <p className="text-xs text-panic">{taskError}</p>}

        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="text-xs opacity-50 py-2 text-center">No open tasks</p>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                className={cn('flex items-start justify-between gap-2 border p-2', isLight ? 'border-ink/15' : 'border-paper/20')}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.priority !== 'medium' && (
                      <p className={cn('text-[10px] uppercase tracking-widest font-bold', task.priority === 'high' ? 'text-panic' : 'text-planning')}>
                        {task.priority}
                      </p>
                    )}
                    {task.status === 'in-progress' && (
                      <p className="text-[10px] uppercase tracking-widest font-bold text-panic">focusing</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleFocusTask(task)}
                    disabled={!!session?.isActive}
                    title={session?.isActive ? 'Stop the current session first' : 'Focus on this task'}
                    className="text-sm hover:opacity-70 disabled:opacity-30 disabled:hover:opacity-30"
                  >
                    🎯
                  </button>
                  <button onClick={() => handleCompleteTask(task.id)} className="text-sm hover:opacity-70" title="Mark done">
                    ✓
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Blocked Sites */}
      <div className={cn('border-t pt-3 flex flex-col gap-2', isLight ? 'border-ink/15' : 'border-paper/20')}>
        <button
          onClick={() => setShowBlocklist(s => !s)}
          title="Any focus session you start blocks these sites — edit the list anytime, even mid-session."
          className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold opacity-60"
        >
          <span>Blocked Sites During Focus ({blockedSites.length})</span>
          <span>{showBlocklist ? '▲' : '▼'}</span>
        </button>

        {showBlocklist && (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. tiktok.com"
                value={newSite}
                onChange={e => setNewSite(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddSite();
                }}
                className={cn(
                  'flex-1 px-3 py-2 border text-sm focus:outline-none',
                  isLight
                    ? 'bg-white border-ink/30 text-ink focus:border-ink'
                    : 'bg-ink border-paper/30 text-paper focus:border-paper',
                )}
              />
              <button
                onClick={handleAddSite}
                className={cn(
                  'px-3 py-2 text-[10px] uppercase tracking-widest font-bold border',
                  isLight ? 'bg-ink text-paper border-ink hover:bg-[#333]' : 'bg-paper text-ink border-paper hover:bg-gray-200',
                )}
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {blockedSites.length === 0 ? (
                <p className="text-xs opacity-50 py-2">No sites blocked — focus sessions won't restrict anything.</p>
              ) : (
                blockedSites.map(site => (
                  <span
                    key={site}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 text-xs border',
                      isLight ? 'border-ink/20' : 'border-paper/20',
                    )}
                  >
                    {site}
                    <button onClick={() => handleRemoveSite(site)} className="hover:text-panic" aria-label={`Remove ${site}`}>
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>
            {session && (
              <p className="text-[10px] opacity-50 italic">Changes apply immediately to this session.</p>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className={cn('flex gap-2 pt-3 border-t', isLight ? 'border-ink/15' : 'border-paper/20')}>
        <button
          onClick={openDashboard}
          className={cn(
            'flex-1 py-2 px-3 text-[10px] uppercase tracking-widest font-bold border transition-colors',
            isLight ? 'border-ink hover:bg-ink hover:text-paper' : 'border-paper hover:bg-paper hover:text-ink',
          )}
        >
          Dashboard
        </button>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          title="How this extension works"
          aria-label="How this extension works"
          className={cn(
            'w-8 py-2 text-xs font-bold border transition-colors shrink-0',
            isLight ? 'border-ink hover:bg-ink hover:text-paper' : 'border-paper hover:bg-paper hover:text-ink',
          )}
        >
          ?
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            'flex-1 py-2 px-3 text-[10px] uppercase tracking-widest font-bold border transition-colors',
            isLight ? 'border-ink hover:bg-ink hover:text-paper' : 'border-paper hover:bg-paper hover:text-ink',
          )}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default withSuspense(Popup, <LoadingSpinner />);
