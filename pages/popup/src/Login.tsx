import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn, useReducedMotion } from '@extension/ui';
import { FRONTEND_URL, API_BASE } from '@extension/storage';

interface LoginProps {
  isLight: boolean;
  onLoginSuccess: (user: any) => void;
  isLoading?: boolean;
}

interface DashboardAuthData {
  isAuthenticated: boolean;
  user: { id: string; email: string; name: string; picture?: string } | null;
  accessToken: string;
  refreshToken: string;
}

type Status = 'idle' | 'checking' | 'success' | 'not-authenticated' | 'error';

// Root cause of the old bug: "Already Logged In?" only ever read this
// extension's OWN cached auth-storage — it never actually asked the
// dashboard tab anything, so if that cache was never populated (e.g. the
// extension was loaded/reloaded after the user had already signed in on the
// dashboard) the button silently did nothing. This now actively queries a
// dashboard tab's real-time auth state (QUERY_DASHBOARD_AUTH ->
// dashboard-bridge.ts, same-origin localStorage read only — never an
// HTTP-only cookie, there isn't one in this app's auth model), then verifies
// the returned token server-side via GET /api/me before ever trusting it.

async function findOrOpenDashboardTab(): Promise<chrome.tabs.Tab> {
  const existing = await chrome.tabs.query({ url: `${FRONTEND_URL}/*` });
  if (existing.length > 0 && existing[0].id) return existing[0];

  const created = await chrome.tabs.create({ url: FRONTEND_URL, active: false });
  await new Promise<void>(resolve => {
    const timeout = setTimeout(resolve, 8000);
    const listener = (tabId: number, info: chrome.tabs.TabChangeInfo) => {
      if (tabId === created.id && info.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
  return created;
}

async function queryDashboardAuth(tab: chrome.tabs.Tab): Promise<DashboardAuthData> {
  if (!tab.id) throw new Error('Dashboard tab has no id');
  const response = await chrome.tabs.sendMessage(tab.id, { type: 'QUERY_DASHBOARD_AUTH' });
  if (!response) throw new Error('Dashboard tab did not respond');
  return response as DashboardAuthData;
}

export const Login: React.FC<LoginProps> = ({ isLight, onLoginSuccess: _onLoginSuccess, isLoading = false }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [waitingForDashboardLogin, setWaitingForDashboardLogin] = useState(false);
  const reduced = useReducedMotion();

  const checkDashboardSession = async () => {
    setStatus('checking');
    try {
      const tab = await findOrOpenDashboardTab();
      const authData = await queryDashboardAuth(tab);

      if (!authData.isAuthenticated || !authData.accessToken || !authData.user) {
        setStatus('not-authenticated');
        return;
      }

      // Never trust the token/user the content script handed back without
      // the backend actually verifying it (an expired-but-still-cached
      // token, or any other staleness, must not be treated as a valid
      // session) — this is the one call that decides "authenticated or not".
      const meResponse = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${authData.accessToken}` },
      });
      if (!meResponse.ok) {
        setStatus('not-authenticated');
        return;
      }
      const me = await meResponse.json();

      // Route through the same AUTH_CHANGED path the passive dashboard
      // broadcast uses, so there is exactly one place (background/index.ts)
      // that ever writes auth-storage — the popup's own useStorage(authStorage)
      // subscription (see Popup.tsx) then swaps this screen out on its own.
      await new Promise<void>(resolve => {
        chrome.runtime.sendMessage(
          {
            type: 'AUTH_CHANGED',
            payload: {
              isAuthenticated: true,
              user: { id: me.id, email: me.email, name: me.name || authData.user?.name || '', picture: me.picture },
              accessToken: authData.accessToken,
              refreshToken: authData.refreshToken || authData.accessToken,
            },
          },
          () => resolve(),
        );
      });

      setVerifiedEmail(me.email);
      setStatus('success');
      setWaitingForDashboardLogin(false);
    } catch (err) {
      console.error('[Login] Dashboard session check failed:', err);
      setStatus('error');
    }
  };

  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: FRONTEND_URL });
    setWaitingForDashboardLogin(true);
    setStatus('idle');
  };

  const isChecking = status === 'checking';
  const revealTransition = { duration: reduced ? 0 : 0.22 };

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center p-4 font-sans',
        isLight ? 'bg-paper text-ink' : 'bg-ink text-paper',
      )}
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-serif italic font-black text-3xl">Task Weave</h1>
          <p className="mt-2 text-xs uppercase tracking-widest opacity-60">Stay focused. Get more done.</p>
        </div>

        <div className="space-y-3">
          <motion.button
            onClick={handleOpenDashboard}
            disabled={isChecking}
            whileTap={reduced || isChecking ? undefined : { scale: 0.98 }}
            className={cn(
              'w-full py-3 px-4 rounded-md font-semibold transition-colors shadow-card disabled:opacity-50',
              isLight ? 'bg-ink text-paper hover:bg-[#333]' : 'bg-paper text-ink hover:bg-gray-200',
            )}
          >
            Login with Google
          </motion.button>

          <motion.button
            onClick={checkDashboardSession}
            disabled={isChecking}
            whileTap={reduced || isChecking ? undefined : { scale: 0.98 }}
            className={cn(
              'w-full py-3 px-4 rounded-md font-semibold text-sm border transition-colors disabled:opacity-50 flex items-center justify-center gap-2',
              isLight ? 'border-ink hover:bg-ink hover:text-paper' : 'border-paper hover:bg-paper hover:text-ink',
            )}
          >
            {isChecking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isChecking ? 'Checking your session…' : waitingForDashboardLogin ? "I've signed in — Check Again" : 'Already Logged In? Click Here'}
          </motion.button>

          {isLoading && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <Loader2 className="w-5 h-5 animate-spin opacity-60" />
            </div>
          )}

          <AnimatePresence mode="wait">
            {status === 'success' && verifiedEmail && (
              <motion.div
                key="success"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={revealTransition}
                className="text-center flex items-center justify-center gap-1.5"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 24 }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-planning" />
                </motion.span>
                <p className="text-xs font-semibold text-planning">You're signed in as {verifiedEmail}</p>
              </motion.div>
            )}

            {status === 'not-authenticated' && (
              <motion.div
                key="not-authenticated"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={revealTransition}
                className="text-center space-y-2 border-t pt-3 border-current/10"
              >
                <p className="text-xs">You're not signed into Task Weave yet.</p>
                <button onClick={handleOpenDashboard} className="text-xs font-bold uppercase tracking-widest underline text-planning">
                  Open Task Weave Dashboard
                </button>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, x: [0, -4, 4, -4, 0] }}
                exit={{ opacity: 0 }}
                transition={{ ...revealTransition, x: { duration: 0.3 } }}
                className="text-center space-y-2 border-t pt-3 border-current/10"
              >
                <p className="text-xs text-panic flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Couldn't verify your session.
                </p>
                <button onClick={checkDashboardSession} className="text-xs font-bold uppercase tracking-widest underline text-planning">
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center text-xs opacity-60 space-y-1">
          <p>Sign in with your Google account on the dashboard</p>
          <p>After logging in on dashboard, click the button above</p>
        </div>
      </div>
    </div>
  );
};
