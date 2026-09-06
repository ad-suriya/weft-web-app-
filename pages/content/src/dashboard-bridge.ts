// Content script that runs on localhost:5173 dashboard
// Bridges authentication between dashboard and extension

interface DashboardAuthData {
  isAuthenticated: boolean;
  user: { id: string; email: string; name: string; picture?: string } | null;
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

const NOT_AUTHENTICATED: DashboardAuthData = {
  isAuthenticated: false,
  user: null,
  accessToken: '',
  refreshToken: '',
};

// Single source of truth for "what does this dashboard tab's own localStorage
// say about auth right now" — used both by the passive push path below (the
// dashboard dispatches dashboardAuthChanged at login/logout/mount) and by the
// active pull path (QUERY_DASHBOARD_AUTH), so the two can never disagree.
// This never reads a cookie — the dashboard has none for auth; the real
// (server-verifiable) Google ID token lives in this page's own localStorage,
// same-origin, which is the only reason a content script may read it at all.
function readDashboardAuth(): DashboardAuthData {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return NOT_AUTHENTICATED;
    const parsed = JSON.parse(raw);
    if (!parsed?.isAuthenticated || !parsed?.user || !parsed?.accessToken) return NOT_AUTHENTICATED;
    // A locally-stale-but-present token still gets treated as "not
    // authenticated" here — the caller (Login.tsx) additionally verifies
    // server-side via GET /api/me before ever trusting this, but there's no
    // reason to hand back a token we already know has expired.
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) return NOT_AUTHENTICATED;
    return {
      isAuthenticated: true,
      user: parsed.user,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken || parsed.accessToken,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return NOT_AUTHENTICATED;
  }
}

function relayToBackground(authData: DashboardAuthData) {
  chrome.runtime.sendMessage(
    {
      type: 'AUTH_CHANGED',
      payload: {
        isAuthenticated: authData.isAuthenticated,
        user: authData.user,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      },
    },
    response => {
      if (chrome.runtime.lastError) {
        console.log('[Dashboard Bridge] Message sent with note:', chrome.runtime.lastError.message);
      } else {
        console.log('[Dashboard Bridge] Message sent successfully:', response);
      }
    },
  );
}

function relayFocusSessionChange(detail: { active: boolean; taskName?: string; stepText?: string }) {
  chrome.runtime.sendMessage(
    {
      type: detail.active ? 'FOCUS_STARTED' : 'FOCUS_ENDED',
      payload: detail.active ? { taskName: detail.taskName, stepText: detail.stepText } : {},
    },
    response => {
      if (chrome.runtime.lastError) {
        console.log('[Dashboard Bridge] Focus session message sent with note:', chrome.runtime.lastError.message);
      } else {
        console.log('[Dashboard Bridge] Focus session message sent:', response);
      }
    },
  );
}

export function initializeDashboardBridge(): void {
  console.log('[Dashboard Bridge] Content script loaded');

  // Passive push: fires at login, logout, and once on every dashboard page
  // mount (see App.tsx) so a content script that attached *after* the user
  // already had a session still hears about it eventually — but only once
  // this exact tab reloads, which is what made "Already Logged In?" unreliable.
  window.addEventListener('dashboardAuthChanged', (event: any) => {
    console.log('[Dashboard Bridge] Auth changed event received:', event.detail);
    relayToBackground(event.detail);
  });

  // Same idea for focus sessions: the dashboard's own Start Focus / timer
  // end has no direct access to chrome.storage (blockingStorage lives in
  // extension-only storage), so it dispatches this DOM event and the
  // background service worker is the one that actually enables/disables
  // distraction blocking (see chrome-extension/src/background/index.ts).
  window.addEventListener('weftFocusSessionChanged', (event: any) => {
    console.log('[Dashboard Bridge] Focus session changed event received:', event.detail);
    relayFocusSessionChange(event.detail);
  });

  // Active pull: the popup's "Already Logged In? Click Here" sends this
  // directly to a dashboard tab and awaits a definitive answer right now,
  // instead of hoping a broadcast eventually lands. Answers synchronously
  // from this tab's own localStorage — no network call, nothing sent anywhere else.
  chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
    if (message?.type === 'QUERY_DASHBOARD_AUTH') {
      const authData = readDashboardAuth();
      console.log('[Dashboard Bridge] QUERY_DASHBOARD_AUTH ->', authData.isAuthenticated);
      sendResponse(authData);
    }
  });

  console.log('[Dashboard Bridge] Listening for auth events');
}
