import 'webextension-polyfill';
import { exampleThemeStorage, authStorage, focusSessionStorage, blockingStorage } from '@extension/storage';
import { scoreRelevance } from '@extension/shared';

exampleThemeStorage.get().then(theme => {
  console.log('[Background] theme:', theme);
});

// Ambient capture: a context-menu entry and keyboard shortcut both open the
// task-capture popup pre-filled with the page (and any selected text), so
// "add this for tomorrow" doesn't require deliberately opening the extension
// popup first.
const CAPTURE_MENU_ID = 'task-weave-capture';

chrome.runtime.onInstalled.addListener(details => {
  chrome.contextMenus.create({
    id: CAPTURE_MENU_ID,
    title: 'Add to Task Weave',
    contexts: ['page', 'selection', 'link'],
  });

  // First install only — not on every update/reload during dev, and not
  // every time someone reloads the unpacked extension. The options page
  // explains capture, focus sessions, and site-locking; reachable again
  // anytime via the popup's "How it works" link or right-click → Options.
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});

function openCapture(tab?: chrome.tabs.Tab, selectedText?: string): void {
  const params = new URLSearchParams();
  if (tab?.title) params.set('title', tab.title);
  if (tab?.url) params.set('url', tab.url);
  if (selectedText) params.set('selectedText', selectedText);

  chrome.windows.create({
    url: chrome.runtime.getURL(`task-capture/index.html?${params.toString()}`),
    type: 'popup',
    width: 480,
    height: 640,
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CAPTURE_MENU_ID) {
    openCapture(tab, info.selectionText);
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'capture-task') {
    openCapture(tab);
  }
});

// --- Context-switch detection ------------------------------------------------
// Session-scoped, disclosed in the consent notice (ConsentNotice.tsx) and the
// manifest's permission comments: this ONLY runs between FOCUS_STARTED (with
// task context) and FOCUS_ENDED/PAUSED, reads only the active tab's
// title/URL (never page content — no `scripting` permission), and nothing
// here is ever sent to the backend. State lives in chrome.storage.session
// (not a module variable) because MV3 kills this service worker between
// alarm firings — an in-memory variable wouldn't survive that.
const CONTEXT_CHECK_ALARM = 'weft-context-check';
const CONTEXT_CHECK_PERIOD_MINUTES = 1;
const CONTEXT_SWITCH_THRESHOLD_MS = 10 * 60 * 1000; // 10 min of continuous low relevance

interface FocusContext {
  taskName: string;
  stepText?: string;
  lowRelevanceSince: number | null;
  notified: boolean;
}

async function getFocusContext(): Promise<FocusContext | null> {
  const { weftFocusContext } = await chrome.storage.session.get('weftFocusContext');
  return weftFocusContext ?? null;
}

async function setFocusContext(ctx: FocusContext | null): Promise<void> {
  if (ctx) await chrome.storage.session.set({ weftFocusContext: ctx });
  else await chrome.storage.session.remove('weftFocusContext');
}

async function checkContextSwitch(): Promise<void> {
  const ctx = await getFocusContext();
  if (!ctx) {
    chrome.alarms.clear(CONTEXT_CHECK_ALARM);
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;

  const relevance = scoreRelevance(
    { name: ctx.taskName, stepText: ctx.stepText },
    { title: tab.title || '', url: tab.url || '' },
  );

  if (relevance.verdict !== 'switch') {
    if (ctx.lowRelevanceSince !== null || ctx.notified) {
      await setFocusContext({ ...ctx, lowRelevanceSince: null, notified: false });
    }
    return;
  }

  const since = ctx.lowRelevanceSince ?? Date.now();
  const elapsed = Date.now() - since;

  if (ctx.lowRelevanceSince === null) {
    await setFocusContext({ ...ctx, lowRelevanceSince: since });
    return;
  }

  if (elapsed >= CONTEXT_SWITCH_THRESHOLD_MS && !ctx.notified) {
    chrome.notifications.create('weft-context-switch', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon-128.png'),
      title: 'WEFT',
      message: `You've drifted from "${ctx.taskName}" for a while. Still working on it?`,
      buttons: [{ title: 'Return to work' }, { title: "I'm taking a break" }],
      requireInteraction: true,
    });
    await setFocusContext({ ...ctx, notified: true });
  }
}

// --- Blocking/session reconciliation -----------------------------------------
// blockingStorage (chrome.storage.local — enable/lockToSite/disable) and the
// focus session it's meant to last exactly as long as (focusSessionStorage,
// backed by the SAME backend /sessions the dashboard's own Start/Complete
// buttons write to) are two separate stores. `disable()` was previously only
// ever called from the popup's own Stop button — so ending the session any
// other way (finishing/completing the task from the DASHBOARD, the popup
// simply not being open when it ended, a duration running out) left
// blockedSites/allowedSite active with no session left to ever turn it off,
// silently blocking youtube.com/instagram.com/etc. forever. This alarm is the
// backstop that catches that regardless of whether the popup is open: it runs
// independent of any popup UI and is the source of truth reconciliation.
const BLOCKING_RECONCILE_ALARM = 'weft-blocking-reconcile';
const BLOCKING_RECONCILE_PERIOD_MINUTES = 1;

async function reconcileBlocking(): Promise<void> {
  const blocking = await blockingStorage.get();
  if (!blocking.isActive) return;
  try {
    const current = await focusSessionStorage.getCurrent();
    if (!current) await blockingStorage.disable();
  } catch (err) {
    // Network/auth hiccup — fail safe by leaving blocking exactly as it was
    // rather than risk unblocking distracting sites mid-session on a false
    // "no session" read. The next minute's check tries again.
    console.error('[Background] Blocking reconcile check failed:', err);
  }
}

// Runs every time the service worker wakes (install, browser start, or after
// MV3 idles it out) — chrome.alarms.create with the same name just resets the
// existing schedule, so this is safe to call unconditionally here.
chrome.alarms.create(BLOCKING_RECONCILE_ALARM, { periodInMinutes: BLOCKING_RECONCILE_PERIOD_MINUTES });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === CONTEXT_CHECK_ALARM) checkContextSwitch();
  if (alarm.name === BLOCKING_RECONCILE_ALARM) reconcileBlocking();
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId !== 'weft-context-switch') return;
  chrome.notifications.clear(notificationId);
  if (buttonIndex === 1) {
    // "I'm taking a break" — pause the session so drift stops nagging and
    // the dashboard/popup reflect the real state.
    await focusSessionStorage.pause();
    await setFocusContext(null);
    chrome.alarms.clear(CONTEXT_CHECK_ALARM);
  }
  // "Return to work" (buttonIndex 0) — just dismiss; the next periodic check
  // re-evaluates relevance against whatever tab is now active.
});

// Message handler for focus and blocking lifecycle
chrome.runtime.onMessage.addListener(async (message: any, sender, sendResponse) => {
  try {
    if (message.type === 'FOCUS_STARTED') {
      console.log('[Background] Focus started:', message.payload);
      const { taskName, stepText } = message.payload || {};
      // Distraction blocking (blockingStorage) is extension-only storage — a
      // plain page (the dashboard) can't touch it directly, so every session
      // start funnels through here regardless of which surface started it
      // (extension popup or dashboard-bridge). The popup already calls
      // blockingStorage.enable() itself with its own custom site list before
      // sending this message, so this only actually enables (with the
      // product-default list) when blocking wasn't already on — otherwise a
      // dashboard-originated message would blow away a popup-set custom list.
      const blocking = await blockingStorage.get();
      if (!blocking.isActive) await blockingStorage.enable();
      if (taskName) {
        await setFocusContext({ taskName, stepText, lowRelevanceSince: null, notified: false });
        chrome.alarms.create(CONTEXT_CHECK_ALARM, { periodInMinutes: CONTEXT_CHECK_PERIOD_MINUTES });
      }
      sendResponse({ success: true });
    } else if (message.type === 'FOCUS_ENDED') {
      console.log('[Background]', message.type);
      await blockingStorage.disable();
      await setFocusContext(null);
      chrome.alarms.clear(CONTEXT_CHECK_ALARM);
      sendResponse({ success: true });
    } else if (message.type === 'FOCUS_PAUSED') {
      console.log('[Background]', message.type);
      // A pause keeps the session alive (see reconcileBlocking above) —
      // blocking intentionally stays on, only the drift-detection context
      // clears so a paused session doesn't nag about being "off-task".
      await setFocusContext(null);
      chrome.alarms.clear(CONTEXT_CHECK_ALARM);
      sendResponse({ success: true });
    } else if (message.type === 'FOCUS_RESUMED') {
      console.log('[Background] Focus resumed');
      sendResponse({ success: true });
    } else if (message.type === 'TASK_CREATED') {
      console.log('[Background] Task created:', message.payload);
      sendResponse({ success: true });
    } else if (message.type === 'AUTH_CHANGED') {
      console.log('[Background] Auth changed:', message.payload);
      if (message.payload.isAuthenticated && message.payload.user) {
        await authStorage.setAuth(
          message.payload.user,
          message.payload.accessToken || 'token',
          message.payload.refreshToken || 'refresh',
          3600
        );
      } else {
        await authStorage.logout();
      }
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('[Background] Error handling message:', error);
    sendResponse({ success: false, error: String(error) });
  }
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
