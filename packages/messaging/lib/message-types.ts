import type {
  Task,
  FocusSession,
  SyncQueueItem,
  UserSettings,
  StreakData,
} from '@extension/types';

export type MessageType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'FOCUS_STARTED'
  | 'FOCUS_ENDED'
  | 'FOCUS_PAUSED'
  | 'FOCUS_RESUMED'
  | 'BREAK_STARTED'
  | 'BREAK_ENDED'
  | 'BLOCKING_ENABLED'
  | 'BLOCKING_DISABLED'
  | 'SYNC_REQUESTED'
  | 'SYNC_COMPLETED'
  | 'SETTINGS_UPDATED'
  | 'CONTENT_CAPTURED'
  | 'QUERY_CONTEXT'
  | 'CONTEXT_RESPONSE'
  | 'SAVE_REFERENCE'
  | 'AUTH_CHANGED'
  | 'QUERY_DASHBOARD_AUTH'
  | 'DASHBOARD_FOCUS_CHANGED';

export interface BaseMessage {
  type: MessageType;
  timestamp: number;
  source?: string;
  requestId?: string;
}

export interface TaskMessage extends BaseMessage {
  type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED';
  payload: Task;
}

export interface FocusMessage extends BaseMessage {
  type:
    | 'FOCUS_STARTED'
    | 'FOCUS_ENDED'
    | 'FOCUS_PAUSED'
    | 'FOCUS_RESUMED'
    | 'BREAK_STARTED'
    | 'BREAK_ENDED';
  payload: FocusSession;
}

export interface BlockingMessage extends BaseMessage {
  type: 'BLOCKING_ENABLED' | 'BLOCKING_DISABLED';
  payload: {
    sites: string[];
    isActive: boolean;
  };
}

export interface SyncMessage extends BaseMessage {
  type: 'SYNC_REQUESTED' | 'SYNC_COMPLETED';
  payload: {
    queue: SyncQueueItem[];
    status: 'pending' | 'completed';
  };
}

export interface SettingsMessage extends BaseMessage {
  type: 'SETTINGS_UPDATED';
  payload: UserSettings;
}

export interface ContentCaptureMessage extends BaseMessage {
  type: 'CONTENT_CAPTURED';
  payload: {
    title: string;
    url: string;
    selectedText?: string;
    favicon?: string;
  };
}

export interface QueryContextMessage extends BaseMessage {
  type: 'QUERY_CONTEXT';
  payload: {
    query: 'context' | 'focus-active' | 'blocking-active';
  };
}

export interface ContextResponseMessage extends BaseMessage {
  type: 'CONTEXT_RESPONSE';
  payload: {
    focusSession: FocusSession | null;
    blockingActive: boolean;
    blockedSites: string[];
  };
}

// Sent to the content script (see pages/content/src/context-capture.ts) to
// request the current tab's title+URL for an explicit "Save Reference"
// action. The content script answers directly via sendResponse (metadata
// only, never selection/page content) — there is no separate response type.
export interface SaveReferenceMessage extends BaseMessage {
  type: 'SAVE_REFERENCE';
  payload?: Record<string, never>;
}

// The dashboard tab (see dashboard/frontend/src/App.tsx) -> its own
// dashboard-bridge content script -> the background script, whenever the
// dashboard's own auth state changes (login, logout) or on every dashboard
// page mount (a re-broadcast so a content script that attached after the
// user already had a session still hears about it once this tab reloads).
export interface AuthChangedMessage extends BaseMessage {
  type: 'AUTH_CHANGED';
  payload: {
    isAuthenticated: boolean;
    user: { id: string; email: string; name: string; picture?: string } | null;
    accessToken: string;
    refreshToken: string;
  };
}

// Sent directly to a dashboard tab (pages/content/src/dashboard-bridge.ts) to
// ask "what does this tab's own auth state say right now" and get a
// synchronous answer back via sendResponse — the active counterpart to the
// passive AUTH_CHANGED broadcast, used by the popup's "Already Logged In?"
// check instead of waiting for a broadcast that may never come.
export interface QueryDashboardAuthMessage extends BaseMessage {
  type: 'QUERY_DASHBOARD_AUTH';
  payload?: Record<string, never>;
}

// The dashboard tab (dashboard/frontend/src/App.tsx) -> its dashboard-bridge
// content script -> the background script, whenever a real focus session
// starts, stops, pauses, or resumes. The background reconciles the
// extension's distraction-site blocking to match. `active` is a hint only —
// the background re-reads /sessions before acting.
export interface DashboardFocusChangedMessage extends BaseMessage {
  type: 'DASHBOARD_FOCUS_CHANGED';
  payload: {
    active: boolean;
  };
}

export type ExtensionMessage =
  | TaskMessage
  | FocusMessage
  | BlockingMessage
  | SyncMessage
  | SettingsMessage
  | ContentCaptureMessage
  | QueryContextMessage
  | ContextResponseMessage
  | SaveReferenceMessage
  | AuthChangedMessage
  | QueryDashboardAuthMessage
  | DashboardFocusChangedMessage;

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
