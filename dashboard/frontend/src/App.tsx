/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';

// Signed-out home page — the WEFT marketing landing. Lazy so its letterpress
// stylesheet and web fonts don't ship with the authenticated dashboard bundle.
const LandingPage = lazy(() => import('./LandingPage'));
import {
  Loader2, Copy, Check, Timer, CalendarPlus, Play, Pause, RotateCcw, RefreshCw, Download, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from './api';
import {
  AgenticAction, ChatMessage, DecompositionPlan, FocusPrefs, Goal, Habit, MemoryFact, Mode, Session, Status,
  SystemTrigger, Task, TaskRisk, Urgency, Workflow, WorkflowPlan,
} from './types';
import RemindersBell from './components/RemindersBell';
import GoalsPanel from './components/GoalsPanel';
import HabitsPanel from './components/HabitsPanel';
import PanicPanel from './components/PanicPanel';
import SearchBar from './components/SearchBar';
import GuidedTour from './components/GuidedTour';
import NotificationPrompt from './components/NotificationPrompt';
import ExtensionPrompt from './components/ExtensionPrompt';
import WorkflowsPanel from './components/WorkflowsPanel';
import DecomposePanel from './components/DecomposePanel';
import MemoryPanel from './components/MemoryPanel';
import Sidebar, { Section } from './components/Sidebar';
import TodayScreen from './screens/TodayScreen';
import MyWorkScreen from './screens/MyWorkScreen';
import ContextScreen from './screens/ContextScreen';
import DevicesScreen from './screens/DevicesScreen';
import ActivityScreen from './screens/ActivityScreen';
import SettingsScreen from './screens/SettingsScreen';
import { ConsentModal } from './ConsentModal';
import { useReducedMotion } from './hooks/useReducedMotion';
import { FADE_UP, FADE_UP_REDUCED, DURATION, EASE_STANDARD } from './lib/motion';

const MODE_META: Record<Mode, { label: string; color: string; blurb: string }> = {
  PLANNING_MODE: { label: 'Planning', color: '#2F7A64', blurb: 'Deadline is days out — be strategic.' },
  FOCUS_MODE: { label: 'Focus', color: '#23271F', blurb: 'One task. Heads down. Execute.' },
  PANIC_MODE: { label: 'Panic', color: '#C2632F', blurb: 'Hours left — urgent, direct action only.' },
  REVIEW_MODE: { label: 'Review', color: '#6E64C4', blurb: 'Reflecting on what is done.' },
};
const URGENCY_RANK: Record<Urgency, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const ACTION_LABEL: Record<string, string> = {
  DRAFT_EMAIL: 'Drafted Email', CREATE_OUTLINE: 'Generated Outline',
  MOCK_QUESTIONS: 'Practice Questions', RESOURCE_LINK: 'Resource',
};
const POMODORO_SECONDS = 25 * 60;
const SEED_MESSAGE: ChatMessage = {
  role: 'model',
  text: "What's weighing on you? Dump the deadline, the half-finished task, the thing you keep avoiding — I'll turn it into a plan and start the first step for you.",
};

const CHAT_SESSION_KEY = 'chatSessionId';
function loadOrCreateChatSessionId(): string {
  const existing = localStorage.getItem(CHAT_SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(CHAT_SESSION_KEY, id);
  return id;
}

const pad = (n: number) => n.toString().padStart(2, '0');
const fmtTimer = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const diff = (startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86400000;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtDeadline(iso: string): string {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
const gcalStamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d+/, '');
function gcalUrl(task: Task): string {
  const s = task.scheduled_start || task.deadline;
  const e = task.scheduled_end || task.deadline;
  const text = encodeURIComponent(task.task_name);
  const details = encodeURIComponent(task.next_micro_step || '');
  const dates = s && e ? `&dates=${gcalStamp(s)}/${gcalStamp(e)}` : '';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}${dates}&details=${details}`;
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  // First-use data-use notice. undefined = not checked yet, null = checked and
  // not accepted (show the modal), string = ISO timestamp of acceptance.
  const [consentAcceptedAt, setConsentAcceptedAt] = useState<string | null | undefined>(
    () => localStorage.getItem('weft_consent') || undefined,
  );
  // Focus Bridge preferences — local to this account (Today/Devices/Settings).
  const [focusPrefs, setFocusPrefs] = useState<FocusPrefs>({
    study_focus: false, hold_notifications: true, allow_list: ['Family', 'Emergency', 'Favorite contacts'],
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string>(loadOrCreateChatSessionId);
  const [chatLoading, setChatLoading] = useState(true); // hydrating from Firestore
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mode, setMode] = useState<Mode>('PLANNING_MODE');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [action, setAction] = useState<AgenticAction | null>(null);
  const [trigger, setTrigger] = useState<SystemTrigger>('NONE');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [atRisk, setAtRisk] = useState<Set<number>>(new Set());
  const [overdue, setOverdue] = useState<Set<number>>(new Set());
  // Deadline-risk prediction (risk.py), keyed by task id — refreshed by the
  // same 60s status poll, plus immediately after any edit that affects it.
  const [taskRisks, setTaskRisks] = useState<Record<number, TaskRisk>>({});

  const [pomoSeconds, setPomoSeconds] = useState(POMODORO_SECONDS);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoSessionId, setPomoSessionId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<'' | 'schedule' | 'reschedule'>('');

  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ task_name: '', deadline: '', estimated_minutes: 30, urgency: 'MEDIUM' as Urgency, goal_id: '' });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [memoryFacts, setMemoryFacts] = useState<MemoryFact[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab, setTab] = useState<Section>('today');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [showExtensionPrompt, setShowExtensionPrompt] = useState(false);

  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarBusy, setCalendarBusy] = useState(false);

  const guardRef = useRef(false); // prevents overlapping auto-reschedules

  // --- effects ---------------------------------------------------------------
  useEffect(() => {
    // The backend's OAuth callback (/api/auth/google/callback) redirects back
    // here with the verified ID token in a URL fragment, e.g. #credential=...
    // A fragment (not a query param) keeps it out of server logs and isn't
    // sent on any subsequent request.
    const hashMatch = window.location.hash.match(/credential=([^&]+)/);
    if (hashMatch) {
      const credential = decodeURIComponent(hashMatch[1]);
      try {
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const userData = JSON.parse(jsonPayload);
        const authData = {
          isAuthenticated: true,
          user: {
            id: userData.sub,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
          },
          accessToken: credential,
          refreshToken: credential,
          expiresAt: Date.now() + 3600 * 1000,
        };
        localStorage.setItem('auth', JSON.stringify(authData));
        window.history.replaceState(null, '', window.location.pathname + window.location.search);

        fetch('/api/me', {
          method: 'POST',
          headers: { Authorization: `Bearer ${credential}` },
        }).catch((err) => console.error('Failed to persist user to backend:', err));

        // The extension's dashboard-bridge content script listens for this and
        // relays isAuthenticated/user/accessToken/refreshToken to the
        // background script — that's the only path that carries the real
        // token to the extension (chrome.runtime isn't reachable from this
        // page directly without externally_connectable + an extension id).
        window.dispatchEvent(new CustomEvent('dashboardAuthChanged', { detail: authData }));

        setIsAuthenticated(true);
        setAuthUser(userData);
        setAuthLoading(false);
        return;
      } catch (err) {
        console.error('Failed to parse credential from redirect:', err);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const err = params.get('auth_error');
    if (err) {
      setAuthError(err);
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Check authentication from localStorage
    const authStr = localStorage.getItem('auth');
    if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        if (auth.isAuthenticated && auth.user) {
          setIsAuthenticated(true);
          setAuthUser(auth.user);

          // Re-broadcast on every page load (not just at login time) so the
          // extension's content script re-syncs after a reload/refresh —
          // otherwise a stale content script from before an extension reload
          // never hears about an auth state that already existed.
          window.dispatchEvent(new CustomEvent('dashboardAuthChanged', { detail: auth }));
        }
      } catch (err) {
        console.error('Failed to parse auth:', err);
      }
    }
    setAuthLoading(false);
  }, []);

  // Restore the conversation for this session id from Firestore (via the
  // backend) on startup/refresh — runs before render shows an empty chat.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setChatLoading(true);
    api.getChatSession(chatSessionId)
      .then((chat) => {
        if (cancelled) return;
        setMessages(
          chat.messages.length > 0
            ? chat.messages.map((m) => ({ role: m.role, text: m.content }))
            : [SEED_MESSAGE],
        );
      })
      .catch(() => { if (!cancelled) setMessages([SEED_MESSAGE]); })
      .finally(() => { if (!cancelled) setChatLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, chatSessionId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    api.listTasks().then(setTasks).catch(() => {});
    api.listGoals().then(setGoals).catch(() => {});
    api.listHabits().then(setHabits).catch(() => {});
    api.listWorkflows().then(setWorkflows).catch(() => {});
    api.getMemory().then(setMemoryFacts).catch(() => {});
    api.calendarStatus().then((s) => setCalendarConnected(s.connected)).catch(() => {});

    // First-use consent + Focus Bridge prefs: the profile is the source of truth.
    api.getProfile()
      .then((p) => {
        const c = p.consent_accepted_at ?? null;
        setConsentAcceptedAt(c);
        if (c) localStorage.setItem('weft_consent', c);
        else localStorage.removeItem('weft_consent');
        if (p.focus_prefs) setFocusPrefs(p.focus_prefs);
      })
      .catch(() => setConsentAcceptedAt((v) => (v ? v : null)));

    if (!localStorage.getItem('tutorialSeen')) setShowTutorial(true);

    // Ask for notification permission up front instead of leaving it buried
    // in the Reminders bell dropdown where most people would never find it.
    // Only if the browser hasn't already been asked (or denied) — re-asking
    // after a denial just gets auto-rejected and annoys people.
    if (typeof Notification !== 'undefined' && Notification.permission === 'default' && !localStorage.getItem('notifPromptSeen')) {
      setShowNotifPrompt(true);
    }
  }, [isAuthenticated]);

  // Sync the timer with whatever session is actually active on the backend —
  // without this, a session started from the extension popup (or this same
  // page before a reload) never shows up here: pomoSeconds/pomoRunning were
  // purely local state with nothing ever reading back from /api/sessions.
  useEffect(() => {
    if (!isAuthenticated) return;
    const sync = async () => {
      try {
        const sessions = await api.listSessions();
        setSessions(sessions);
        const active = sessions.filter((s) => !s.end_time).sort((a, b) => b.id - a.id)[0];
        if (!active) {
          setPomoSessionId(null);
          setPomoRunning(false);
          return;
        }
        const elapsedSeconds = Math.floor((Date.now() - new Date(active.start_time).getTime()) / 1000);
        const remaining = Math.max(0, active.duration_minutes * 60 - elapsedSeconds);
        setPomoSessionId(active.id);
        setPomoSeconds(remaining);
        setPomoRunning(!active.is_paused && remaining > 0);
      } catch { /* offline — try again next tick */ }
    };
    sync();
    const id = setInterval(sync, 5_000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  const acceptConsent = async () => {
    const r = await api.acceptConsent();
    localStorage.setItem('weft_consent', r.consent_accepted_at);
    setConsentAcceptedAt(r.consent_accepted_at);
  };

  // Focus Bridge — local account prefs (no phone client yet to push them to).
  // Optimistic: the toggle/chip list should feel instant.
  const updateFocusPrefs = (patch: Partial<FocusPrefs>) => {
    setFocusPrefs((prev) => ({ ...prev, ...patch }));
    api.updateFocusPrefs(patch).catch(() => {
      api.getProfile().then((p) => p.focus_prefs && setFocusPrefs(p.focus_prefs)).catch(() => {});
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    // Mirror the login path: the extension's dashboard-bridge content script
    // listens for this on the dashboard tab and relays it to the background
    // script, which clears the extension's own auth state too.
    window.dispatchEvent(new CustomEvent('dashboardAuthChanged', {
      detail: { isAuthenticated: false, user: null, accessToken: '', refreshToken: '' },
    }));
    setIsAuthenticated(false);
    setAuthUser(null);
  };

  const dismissTutorial = () => {
    localStorage.setItem('tutorialSeen', '1');
    setShowTutorial(false);
    if (!localStorage.getItem('extensionPromptSeen')) setShowExtensionPrompt(true);
  };

  const dismissExtensionPrompt = () => {
    localStorage.setItem('extensionPromptSeen', '1');
    setShowExtensionPrompt(false);
  };

  const enableNotifications = async () => {
    if (typeof Notification !== 'undefined') {
      try { await Notification.requestPermission(); } catch { /* unsupported */ }
    }
    localStorage.setItem('notifPromptSeen', '1');
    setShowNotifPrompt(false);
  };

  const dismissNotifPrompt = () => {
    localStorage.setItem('notifPromptSeen', '1');
    setShowNotifPrompt(false);
  };

  useEffect(() => {
    if (!pomoRunning) return;
    const id = setInterval(() => {
      setPomoSeconds((s) => { if (s <= 1) { setPomoRunning(false); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [pomoRunning]);

  // The countdown reaching zero ends the timer locally — also end the
  // backend session so the extension's popup (which polls /api/sessions)
  // stops showing it as active.
  useEffect(() => {
    if (pomoSeconds !== 0 || pomoSessionId == null) return;
    const id = pomoSessionId;
    setPomoSessionId(null);
    api.patchSession(id, { end_time: new Date().toISOString() })
      // The backend just credited this session's elapsed time to its linked
      // task (if any) — refetch so the progress bar reflects it.
      .then(() => api.listTasks().then(setTasks))
      .catch(() => {});
  }, [pomoSeconds, pomoSessionId]);

  // Autonomous rescheduling + deadline-risk refresh: poll status, auto-replan
  // when tasks have slipped. This same 60s tick is what makes risk "real
  // time" — every poll recomputes against the current clock, well inside
  // the "run hourly" requirement.
  useEffect(() => {
    // Unauthenticated (signed out, or a background poll outlived an expired
    // token) must not call an authenticated endpoint here: a 401 makes
    // api.ts's handle() clear the session and hard-reload the page — with no
    // guard this refetches 4s later, 401s again, and reloads again forever.
    if (!isAuthenticated) return;
    const check = async () => {
      if (guardRef.current || loading) return;
      try {
        const s = await api.status();
        setAtRisk(new Set(s.at_risk));
        setOverdue(new Set(s.overdue));
        setTaskRisks(Object.fromEntries(s.risks.map((r) => [r.task_id, r])));
        // Automatic task recovery's "incomplete after end time" trigger
        // fires server-side on this same poll (see recovery.py) — surface
        // it the moment it happens, same pattern as a workflow firing.
        if (s.recovery) {
          setTasks(s.recovery.tasks);
          pushSystem(s.recovery.message);
        }
        if (s.recommend_reschedule) {
          guardRef.current = true;
          const r = await api.reschedule();
          setTasks(r.tasks);
          setAtRisk(new Set(r.at_risk));
          setOverdue(new Set(r.overdue));
          guardRef.current = false;
        }
      } catch { /* offline / backend down — ignore */ }
    };
    const id = setInterval(check, 60_000);
    const t = setTimeout(check, 4_000); // first pass shortly after load

    // "Run after inactivity": a backgrounded/minimized tab pauses JS timers,
    // so the 60s interval can't be trusted to have fired — force an
    // immediate recheck the moment the tab becomes visible again.
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => { clearInterval(id); clearTimeout(t); document.removeEventListener('visibilitychange', onVisible); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated]);

  // Automatic task recovery — "inactivity detected" trigger: distinct from
  // the time-based "incomplete after end time" trigger above (which fires
  // on the clock regardless of whether anyone's there), this fires only
  // when the user has stopped interacting while a task is IN_PROGRESS and
  // already past its scheduled end — i.e. they walked away mid-task.
  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => {
    const IDLE_THRESHOLD_MS = 5 * 60_000;
    let lastActivity = Date.now();
    const handled = new Set<number>();
    const markActive = () => { lastActivity = Date.now(); };
    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    const id = setInterval(() => {
      if (Date.now() - lastActivity < IDLE_THRESHOLD_MS) return;
      const now = Date.now();
      const stale = tasksRef.current.find((t) =>
        t.status === 'IN_PROGRESS' && t.scheduled_end && new Date(t.scheduled_end).getTime() < now && !handled.has(t.id),
      );
      if (stale) {
        handled.add(stale.id);
        skipTask(stale);
      }
    }, 30_000);

    return () => { events.forEach((e) => window.removeEventListener(e, markActive)); clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-sync with Google Calendar: pulls in events the user added directly
  // on their calendar (as tasks) and pushes the current plan back out, on a
  // timer — no "Sync" button press required once Calendar is connected.
  const calendarSyncGuardRef = useRef(false);
  useEffect(() => {
    if (!calendarConnected) return;
    const syncNow = async () => {
      if (calendarSyncGuardRef.current) return;
      calendarSyncGuardRef.current = true;
      try {
        const r = await api.calendarSync();
        setTasks(r.tasks);
        if (r.imported > 0) {
          pushSystem(`Pulled ${r.imported} event${r.imported === 1 ? '' : 's'} from your Google Calendar.`);
        }
        refreshStatus();
      } catch { /* offline / token revoked — try again next tick */ }
      finally { calendarSyncGuardRef.current = false; }
    };
    const id = setInterval(syncNow, 90_000);
    const t = setTimeout(syncNow, 2_000);
    return () => { clearInterval(id); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarConnected]);

  // --- helpers ---------------------------------------------------------------
  const pushSystem = (text: string) =>
    setMessages((prev) => [...prev, { role: 'model', text, system: true }]);

  // Old sessions are left in Firestore untouched — only the localStorage
  // pointer moves, so switching back would still find them if we ever add
  // a session switcher.
  const startNewChat = () => {
    const id = crypto.randomUUID();
    localStorage.setItem(CHAT_SESSION_KEY, id);
    setChatSessionId(id);
    setMessages([SEED_MESSAGE]);
    setQuickReplies([]);
    setError('');
  };

  const refreshStatus = async () => {
    try {
      const s = await api.status();
      setAtRisk(new Set(s.at_risk));
      setOverdue(new Set(s.overdue));
      setTaskRisks(Object.fromEntries(s.risks.map((r) => [r.task_id, r])));
      if (s.recovery) {
        setTasks(s.recovery.tasks);
        pushSystem(s.recovery.message);
      }
    } catch { /* ignore */ }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const history = messages
      .filter((m) => m !== SEED_MESSAGE && !m.system)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    api.addChatMessage(chatSessionId, 'user', trimmed).catch(() => {});
    setInput('');
    setQuickReplies([]);
    setError('');
    setLoading(true);
    try {
      const data = await api.chat(trimmed, history);
      setMessages((prev) => [...prev, { role: 'model', text: data.chat_ui.agent_message }]);
      api.addChatMessage(chatSessionId, 'model', data.chat_ui.agent_message).catch(() => {});
      setQuickReplies(data.chat_ui.suggested_quick_replies || []);
      setMode(data.current_mode);
      setAction(data.agentic_action?.action_type !== 'NONE' ? data.agentic_action : null);
      setTasks(data.tasks);
      setTrigger(data.system_trigger);
      if (data.system_trigger === 'START_POMODORO') {
        setPomoSeconds(POMODORO_SECONDS);
        setPomoRunning(true);
        const forTask = data.tasks.find((t) => t.status === 'IN_PROGRESS') ?? null;
        api.startSession(forTask ? forTask.task_name : 'Pomodoro focus session', POMODORO_SECONDS / 60, forTask?.id)
          .then((s) => setPomoSessionId(s.id))
          .catch(() => {});
      }
      refreshStatus();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // --- Voice dictation (Web Speech API) --------------------------------------
  // Browser-native speech-to-text; no server round-trip. Chrome/Edge/Safari
  // expose it (some only under the webkit- prefix); Firefox doesn't, so the
  // button hides itself when the API is absent.
  const SpeechRecognitionImpl =
    typeof window !== 'undefined'
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      : undefined;
  const voiceSupported = !!SpeechRecognitionImpl;
  const recognitionRef = useRef<any>(null);
  const dictationBaseRef = useRef('');
  const [listening, setListening] = useState(false);

  useEffect(() => () => { try { recognitionRef.current?.abort(); } catch { /* noop */ } }, []);

  const toggleVoice = () => {
    if (!voiceSupported) return;
    if (listening) { recognitionRef.current?.stop(); return; }

    const rec = new SpeechRecognitionImpl();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    dictationBaseRef.current = input ? input.replace(/\s*$/, '') + ' ' : '';

    rec.onresult = (e: any) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setInput(dictationBaseRef.current + transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  };

  const togglePomo = () => {
    const next = !pomoRunning;
    setPomoRunning(next);
    if (pomoSessionId != null) api.patchSession(pomoSessionId, { is_paused: !next }).catch(() => {});
  };

  const resetPomo = () => {
    setPomoRunning(false);
    setPomoSeconds(POMODORO_SECONDS);
    if (pomoSessionId != null) {
      api.patchSession(pomoSessionId, { end_time: new Date().toISOString() })
        .then(() => api.listTasks().then(setTasks))
        .catch(() => {});
      setPomoSessionId(null);
    }
  };

  const cycleStatus = async (task: Task) => {
    const next: Status = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'TODO';
    const updated = await api.patchTask(task.id, { status: next });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    setTaskRisks((prev) => {
      if (updated.risk) return { ...prev, [task.id]: updated.risk };
      const { [task.id]: _drop, ...rest } = prev; // e.g. just marked COMPLETED — no risk anymore
      return rest;
    });
    refreshStatus();
    if (task.goal_id) api.listGoals().then(setGoals).catch(() => {}); // keep linked goal progress in sync
  };

  const removeTask = async (id: number) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // "Run on task update": logging hours immediately returns a freshly
  // computed risk (risk.py) on this one task — no need to wait for the
  // next 60s status poll to see the badge move.
  const logCompletedHours = async (task: Task, hours: number) => {
    const updated = await api.patchTask(task.id, { completed_minutes: Math.max(0, Math.round(hours * 60)) });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    if (updated.risk) setTaskRisks((prev) => ({ ...prev, [task.id]: updated.risk! }));
  };

  // Automatic task recovery — "user skips task" trigger. Inactivity
  // detection (below) calls this same handler for the same reason: both are
  // just different ways of deciding a task got missed.
  const skipTask = async (task: Task) => {
    try {
      const result = await api.skipTask(task.id);
      setTasks(result.tasks);
      pushSystem(result.message);
    } catch (err: any) {
      setError(err.message || 'Could not move this task.');
    }
  };

  const addTask = async () => {
    if (!newTask.task_name.trim()) return;
    const created = await api.createTask({
      task_name: newTask.task_name.trim(),
      urgency: newTask.urgency,
      estimated_minutes: Number(newTask.estimated_minutes) || 30,
      deadline: newTask.deadline ? newTask.deadline : null,
      goal_id: newTask.goal_id ? Number(newTask.goal_id) : null,
    });
    setTasks((prev) => [...prev, created]);
    setNewTask({ task_name: '', deadline: '', estimated_minutes: 30, urgency: 'MEDIUM', goal_id: '' });
    setShowAdd(false);
  };

  // --- goals & habits handlers ----------------------------------------------
  const addGoal = async (body: { title: string; metric: string; target_value: number; deadline: string | null }) => {
    const g = await api.createGoal(body);
    setGoals((prev) => [...prev, g]);
  };
  const incGoal = async (id: number, delta: number) => {
    const g = await api.incrementGoal(id, delta);
    setGoals((prev) => prev.map((x) => (x.id === id ? g : x)));
  };
  const deleteGoal = async (id: number) => {
    await api.deleteGoal(id);
    setGoals((prev) => prev.filter((x) => x.id !== id));
  };
  const addHabit = async (name: string, cadence: 'DAILY' | 'WEEKLY') => {
    const h = await api.createHabit(name, cadence);
    setHabits((prev) => [...prev, h]);
  };
  const checkHabit = async (id: number) => {
    const h = await api.checkHabit(id);
    setHabits((prev) => prev.map((x) => (x.id === id ? h : x)));
  };
  const deleteHabit = async (id: number) => {
    await api.deleteHabit(id);
    setHabits((prev) => prev.filter((x) => x.id !== id));
  };

  // --- workflows handlers (AI Workflow Builder) ------------------------------
  const generateWorkflowDraft = (sopText: string) => api.generateWorkflow(sopText);
  const saveWorkflow = async (plan: WorkflowPlan, sopText: string) => {
    const w = await api.createWorkflow({ ...plan, sop_text: sopText, active: true });
    setWorkflows((prev) => [...prev, w]);
  };
  const toggleWorkflowActive = async (id: number, active: boolean) => {
    const w = await api.patchWorkflow(id, { active });
    setWorkflows((prev) => prev.map((x) => (x.id === id ? w : x)));
  };
  const runWorkflow = async (id: number) => {
    const { created } = await api.runWorkflow(id);
    setTasks((prev) => [...prev, ...created]);
    api.listWorkflows().then(setWorkflows).catch(() => {});
    pushSystem(`Workflow ran — added ${created.length} task${created.length === 1 ? '' : 's'}.`);
  };
  const deleteWorkflowById = async (id: number) => {
    await api.deleteWorkflow(id);
    setWorkflows((prev) => prev.filter((x) => x.id !== id));
  };

  // --- task decomposition handlers (AI Task Decomposition) ------------------
  const decomposeGoalDraft = (goal: string) => api.decomposeGoal(goal);
  const commitDecomposition = async (plan: DecompositionPlan) => {
    const created = await api.commitDecomposition(plan.goal, plan.subtasks);
    setTasks((prev) => [...prev, ...created]);
    pushSystem(`Broke "${plan.goal}" into ${created.length} task${created.length === 1 ? '' : 's'}.`);
    return created;
  };

  // --- long-term behavioral memory -------------------------------------------
  const summarizeMemoryNow = async () => {
    const facts = await api.summarizeMemory();
    setMemoryFacts(facts);
  };

  // Search result selection: jump to the relevant tab. Tasks live on the
  // "plan" tab already, so there's nothing more specific to scroll to yet.
  const selectSearchTask = (_task: Task) => setTab('my-work');
  const selectSearchGoal = () => setTab('my-work');
  const selectSearchHabit = () => setTab('my-work');

  const connectCalendar = () => {
    // Calendar access is granted via the same full-page OAuth redirect as
    // sign-in (it's requested as part of that scope) — re-running it with
    // `prompt=consent` always returns a fresh refresh token, so this also
    // doubles as "reconnect" if access was revoked.
    window.location.href = '/api/auth/google/login';
  };

  const disconnectCalendar = async () => {
    setCalendarBusy(true);
    try {
      await api.disconnectCalendar();
      setCalendarConnected(false);
    } catch (err: any) {
      setError(err.message || 'Could not disconnect Google Calendar.');
    } finally { setCalendarBusy(false); }
  };

  const planDay = async () => {
    setBusy('schedule');
    try {
      const r = await api.schedule();
      setTasks(r.tasks);
      setAtRisk(new Set(r.at_risk));
      pushSystem(r.message);
      refreshStatus();
    } catch (err: any) {
      setError(err.message || 'Could not build a schedule.');
    } finally { setBusy(''); }
  };

  const rescheduleNow = async () => {
    setBusy('reschedule');
    guardRef.current = true;
    try {
      const r = await api.reschedule();
      setTasks(r.tasks);
      setAtRisk(new Set(r.at_risk));
      setOverdue(new Set(r.overdue));
      pushSystem(r.message);
    } catch (err: any) {
      setError(err.message || 'Could not reschedule.');
    } finally { setBusy(''); guardRef.current = false; }
  };

  const copyAction = async () => {
    if (!action) return;
    try {
      await navigator.clipboard.writeText(action.action_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  // --- derived ---------------------------------------------------------------
  const modeMeta = MODE_META[mode];
  const scheduled = useMemo(
    () => tasks.filter((t) => t.scheduled_start && t.status !== 'COMPLETED')
      .sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime()),
    [tasks],
  );
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of scheduled) {
      const label = dayLabel(t.scheduled_start!);
      (map.get(label) ?? map.set(label, []).get(label)!).push(t);
    }
    return Array.from(map, ([label, items]) => ({ label, items }));
  }, [scheduled]);
  const hasRisk = atRisk.size > 0 || overdue.size > 0;

  // The single most urgent open task — backs both the Execution panel
  // ("up next" when nothing is in progress) and Panic mode (the one task
  // shown when everything else is suppressed).
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'COMPLETED'), [tasks]);
  const priorityTask = useMemo(() => {
    if (openTasks.length === 0) return null;
    return [...openTasks].sort((a, b) => {
      const rank = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
      if (rank !== 0) return rank;
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return ad - bd;
    })[0];
  }, [openTasks]);
  const inProgressTask = useMemo(() => tasks.find((t) => t.status === 'IN_PROGRESS') ?? null, [tasks]);
  const executionTask = inProgressTask ?? priorityTask;
  const overdueTasks = useMemo(() => tasks.filter((t) => overdue.has(t.id)), [tasks, overdue]);
  const lastSession = useMemo(
    () =>
      sessions
        .filter((s) => s.end_time)
        .sort((a, b) => new Date(b.end_time!).getTime() - new Date(a.end_time!).getTime())[0] ?? null,
    [sessions],
  );
  const executionGoalTitle = useMemo(
    () => (executionTask?.goal_id != null ? goals.find((g) => g.id === executionTask.goal_id)?.title ?? null : null),
    [executionTask, goals],
  );
  const lastSessionTask = useMemo(
    () => (lastSession?.task_id != null ? tasks.find((t) => t.id === lastSession.task_id) ?? null : null),
    [lastSession, tasks],
  );

  const markTaskDone = async (task: Task) => {
    const updated = await api.patchTask(task.id, { status: 'COMPLETED' });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    refreshStatus();
    if (task.goal_id) api.listGoals().then(setGoals).catch(() => {});
  };

  const startFocusOnTask = async (task: Task) => {
    // Only one task is ever "the" active one — choosing a different task to
    // focus on demotes whatever was previously in progress back to To Do,
    // so the Execution Panel always shows exactly the task just picked.
    if (inProgressTask && inProgressTask.id !== task.id) {
      const reverted = await api.patchTask(inProgressTask.id, { status: 'TODO' });
      setTasks((prev) => prev.map((t) => (t.id === inProgressTask.id ? reverted : t)));
    }
    const updated = await api.patchTask(task.id, { status: 'IN_PROGRESS' });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    setTab('today');
    setPomoSeconds(POMODORO_SECONDS);
    setPomoRunning(true);
    // Starting a session auto-closes whatever was still running (server-side)
    // and credits its elapsed time to whichever task it was linked to —
    // refetch so that task's progress bar picks it up.
    api.startSession(task.task_name, POMODORO_SECONDS / 60, task.id)
      .then((s) => { setPomoSessionId(s.id); api.listTasks().then(setTasks).catch(() => {}); })
      .catch(() => {});
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-ink flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#F5F2ED]" />}>
        <LandingPage authError={authError} />
      </Suspense>
    );
  }

  return (
    <div className="h-screen bg-background text-ink font-serif flex overflow-hidden">
      {consentAcceptedAt === null && <ConsentModal onAccept={acceptConsent} />}
      {showTutorial && (
        <GuidedTour
          onDismiss={dismissTutorial}
          onStepChange={(selector) => {
            if (selector === '[data-tour="task-toolbar"]' || selector === '[data-tour="nav-my-work"]') setTab('my-work');
            else if (selector === '[data-tour="nav-today"]' || selector === '[data-tour="capture"]') setTab('today');
            else if (selector === '[data-tour="nav-workflows"]') setTab('workflows');
            else if (selector === '[data-tour="nav-context"]') setTab('context');
          }}
        />
      )}
      {showExtensionPrompt && <ExtensionPrompt onDismiss={dismissExtensionPrompt} />}
      <Sidebar active={tab} onSelect={setTab} badges={{ 'my-work': openTasks.length || undefined, workflows: workflows.length || undefined }} onLogout={handleLogout} />

      <div className="flex-grow flex flex-col min-w-0 h-full">
        <Sidebar horizontal active={tab} onSelect={setTab} badges={{ 'my-work': openTasks.length || undefined, workflows: workflows.length || undefined }} onLogout={handleLogout} />

        {/* Top bar */}
        <header className="relative z-50 flex flex-col md:flex-row justify-between md:items-center border-b border-ink/14 bg-surface px-4 md:px-6 py-3 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border border-ink/14 bg-surface">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: modeMeta.color }} />
              {modeMeta.label} mode
            </span>
          </div>
          <div className="flex items-center gap-3 md:justify-end flex-wrap">
            <div data-tour="search-bar">
              <SearchBar onSelectTask={selectSearchTask} onSelectGoal={selectSearchGoal} onSelectHabit={selectSearchHabit} />
            </div>
            <RemindersBell holdNotifications={focusPrefs.study_focus && focusPrefs.hold_notifications && pomoRunning} />
            <button
              onClick={() => setTab('settings')}
              title="Settings"
              className="w-8 h-8 rounded-full bg-accent text-inverse grid place-items-center font-sans text-[11px] font-bold hover:bg-accent-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {(authUser?.name || '?').split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase()}
            </button>
          </div>
        </header>

      {/* Row: main content + chat panel as real flex siblings, so opening
          chat shrinks the content column instead of covering it. */}
      <div className="flex-grow flex flex-row min-h-0 overflow-hidden">
      <div className="flex-grow flex flex-col justify-between min-w-0 min-h-0 overflow-y-auto">
      <main className="w-full flex flex-col gap-5 p-4 md:p-8">
          <div className="w-full max-w-5xl flex flex-col gap-5">
          {showNotifPrompt && (
            <NotificationPrompt onEnable={enableNotifications} onDismiss={dismissNotifPrompt} />
          )}

          {/* Signals — proactive engine surfaces, shown on the Today console */}
          {tab === 'today' && (
            <>
              <AnimatePresence>
                {hasRisk && (
                  <motion.div {...(reducedMotion ? FADE_UP_REDUCED : FADE_UP)} transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
                    className="bg-danger text-white p-4 rounded-[14px] flex items-center justify-between gap-4 shadow-[0_12px_32px_-12px_rgba(35,39,31,0.22)]">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div className="font-sans text-xs">
                        <span className="font-semibold uppercase tracking-wider">Plan drift detected</span>
                        <p className="opacity-90">{overdue.size} overdue · {atRisk.size} at risk of missing a deadline.</p>
                      </div>
                    </div>
                    <button onClick={rescheduleNow} disabled={busy !== ''}
                      className="font-sans text-[11px] font-semibold uppercase tracking-wider px-4 py-2 rounded-[10px] bg-white text-danger hover:bg-background transition-colors flex items-center gap-2 whitespace-nowrap">
                      {busy === 'reschedule' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Replan now
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {(trigger === 'START_POMODORO' || pomoSessionId != null) && executionTask?.status !== 'IN_PROGRESS' && (
                  <motion.div {...(reducedMotion ? FADE_UP_REDUCED : FADE_UP)} transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
                    className="bg-surface-elevated text-white p-5 rounded-[16px] flex items-center justify-between gap-4 shadow-[0_14px_36px_-14px_rgba(35,39,31,0.4)]">
                    <div className="flex items-center gap-4">
                      <Timer className="w-6 h-6 text-danger" />
                      <div>
                        <span className="font-sans text-[10px] uppercase tracking-wider font-semibold opacity-60">Focus Timer</span>
                        <p className="font-serif text-4xl font-semibold tabular-nums tracking-tight">{fmtTimer(pomoSeconds)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={togglePomo} className="p-3 rounded-[10px] border border-white/40 hover:bg-white hover:text-ink transition-colors" aria-label={pomoRunning ? 'Pause' : 'Play'}>
                        {pomoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button onClick={resetPomo} className="p-3 rounded-[10px] border border-white/40 hover:bg-white hover:text-ink transition-colors" aria-label="Reset">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
                {trigger === 'PROMPT_CALENDAR_SYNC' && tasks.length > 0 && (
                  <motion.div {...(reducedMotion ? FADE_UP_REDUCED : FADE_UP)} transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
                    className="bg-white border border-ink/12 p-5 rounded-[14px] flex items-center justify-between gap-4 shadow-[0_4px_16px_rgba(35,39,31,0.06)]">
                    <div className="flex items-center gap-4">
                      <CalendarPlus className="w-6 h-6 text-accent" />
                      <div>
                        <span className="font-sans text-[10px] uppercase tracking-wider font-semibold opacity-60">Lock in the deadlines</span>
                        <p className="font-sans text-sm">Export your plan so it lives in your real calendar.</p>
                      </div>
                    </div>
                    <a href={api.calendarIcsUrl()}
                      className="font-sans text-[11px] font-semibold uppercase tracking-wider px-4 py-3 rounded-[10px] bg-accent text-white hover:bg-accent-strong transition-colors whitespace-nowrap flex items-center gap-2">
                      <Download className="w-3 h-3" /> Export .ics
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {action && (
                  <motion.div {...(reducedMotion ? FADE_UP_REDUCED : FADE_UP)} transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
                    className="bg-white border border-ink/12 rounded-[14px] overflow-hidden shadow-[0_4px_16px_rgba(35,39,31,0.06)]">
                    <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[9px] font-semibold px-2 py-1 rounded-full bg-danger text-white uppercase tracking-wider">Started for you</span>
                        <span className="font-sans text-[11px] font-semibold uppercase tracking-wider opacity-70">{ACTION_LABEL[action.action_type] ?? action.action_type}</span>
                      </div>
                      <button onClick={copyAction} className="font-sans text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 hover:text-danger transition-colors">
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="font-sans text-[13px] leading-relaxed p-5 whitespace-pre-wrap bg-background max-h-72 overflow-y-auto">{action.action_content}</pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {tab === 'today' && (
            mode === 'PANIC_MODE' && priorityTask ? (
              <PanicPanel task={priorityTask} onMarkDone={markTaskDone} />
            ) : (
              <TodayScreen
                task={executionTask}
                isActive={executionTask?.status === 'IN_PROGRESS'}
                modeBlurb={modeMeta.blurb}
                pomoSeconds={pomoSeconds}
                pomoRunning={pomoRunning}
                lastSession={lastSession}
                lastSessionTask={lastSessionTask}
                scheduled={scheduled}
                atRisk={atRisk}
                goalTitle={executionGoalTitle}
                onToggleTimer={togglePomo}
                onResetTimer={resetPomo}
                onStartFocus={startFocusOnTask}
                onMarkDone={markTaskDone}
                onSkip={skipTask}
                onGoMyWork={() => setTab('my-work')}
                focusPrefs={focusPrefs}
                onToggleStudyFocus={() => updateFocusPrefs({ study_focus: !focusPrefs.study_focus })}
                habits={habits}
                onCheckHabit={checkHabit}
                messages={messages}
                hasConversation={messages.some((m) => m.role === 'user')}
                chatLoading={chatLoading}
                thinking={loading}
                input={input}
                setInput={setInput}
                onSend={send}
                onNewChat={startNewChat}
                quickReplies={quickReplies}
                chatError={error}
                listening={listening}
                voiceSupported={voiceSupported}
                onToggleVoice={toggleVoice}
              />
            )
          )}

          {tab === 'my-work' && (
            <MyWorkScreen
              tasks={tasks}
              goals={goals}
              taskRisks={taskRisks}
              atRisk={atRisk}
              overdue={overdue}
              showAdd={showAdd}
              setShowAdd={setShowAdd}
              newTask={newTask}
              setNewTask={setNewTask}
              busy={busy}
              onAddTask={addTask}
              onPlanDay={planDay}
              onCycleStatus={cycleStatus}
              onStartFocus={startFocusOnTask}
              onSkip={skipTask}
              onMarkDone={markTaskDone}
              onRemove={removeTask}
              onLogHours={logCompletedHours}
              onGcalUrl={gcalUrl}
              habits={habits}
              onAddGoal={addGoal}
              onIncrementGoal={incGoal}
              onDeleteGoal={deleteGoal}
              onAddHabit={addHabit}
              onCheckHabit={checkHabit}
              onDeleteHabit={deleteHabit}
              onDecompose={decomposeGoalDraft}
              onCommitDecomposition={commitDecomposition}
            />
          )}

          {tab === 'workflows' && (
            <WorkflowsPanel
              workflows={workflows}
              onGenerate={generateWorkflowDraft}
              onSave={saveWorkflow}
              onToggleActive={toggleWorkflowActive}
              onRun={runWorkflow}
              onDelete={deleteWorkflowById}
            />
          )}

          {tab === 'context' && (
            <ContextScreen
              task={executionTask}
              goals={goals}
              tasks={tasks}
              onGoMyWork={() => setTab('my-work')}
              memoryFacts={memoryFacts}
              onSummarizeMemory={summarizeMemoryNow}
            />
          )}

          {tab === 'devices' && (
            <DevicesScreen
              task={executionTask}
              isActive={executionTask?.status === 'IN_PROGRESS'}
              pomoRunning={pomoRunning}
              focusPrefs={focusPrefs}
              onUpdateFocusPrefs={updateFocusPrefs}
            />
          )}

          {tab === 'activity' && <ActivityScreen sessions={sessions} tasks={tasks} />}

          {tab === 'settings' && (
            <SettingsScreen
              authUser={authUser}
              consentAcceptedAt={consentAcceptedAt}
              calendarConnected={calendarConnected}
              calendarBusy={calendarBusy}
              onConnectCalendar={connectCalendar}
              onDisconnectCalendar={disconnectCalendar}
              onLogout={handleLogout}
              onReplayTour={() => { setTab('today'); setShowTutorial(true); }}
              focusPrefs={focusPrefs}
              onUpdateFocusPrefs={updateFocusPrefs}
              onGoDevices={() => setTab('devices')}
            />
          )}
          </div>
      </main>

      <footer className="px-4 md:px-8 py-3 border-t border-ink/14 bg-white">
        <div className="font-sans text-[10px] uppercase font-semibold opacity-60">Proactive Engine Online</div>
      </footer>
      </div>

      </div>
      </div>
    </div>
  );
}
