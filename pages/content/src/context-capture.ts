// Explicit-only capture.
//
// This content script is injected on every page, but it does NOTHING on its
// own: it only registers a message listener and answers when a user-initiated
// WEFT flow (the task-capture window, the popup's "Save Reference") asks it a
// question. It never:
//   - enumerates or scans other tabs
//   - touches history
//   - sends anything to the backend
//   - reads page content in the background
//
// The only page data it can return is the current tab's title + URL, plus —
// for the "capture this as a task" flow — the text the user has *selected*
// themselves at that moment.

export interface PageMetadata {
  title: string;
  url: string;
}

export interface PageContext extends PageMetadata {
  selectedText?: string;
}

/** Title + URL of the current page. Nothing else. */
export const capturePageMetadata = (): PageMetadata => ({
  title: document.title,
  url: window.location.href,
});

/** The user's current selection, if any. Only meaningful right after a
 *  deliberate "capture selection" gesture. */
export const captureSelection = (): string | undefined =>
  window.getSelection()?.toString().trim() || undefined;

export const setupContextMessaging = (): void => {
  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const msg = message as { type?: string };

    // "Save Reference" — metadata only, never selection or page content.
    if (msg.type === 'SAVE_REFERENCE') {
      sendResponse({ success: true, ...capturePageMetadata() });
      return;
    }

    // Task capture — metadata plus whatever the user has selected right now.
    if (msg.type === 'QUERY_CONTEXT') {
      const meta = capturePageMetadata();
      sendResponse({ success: true, ...meta, selectedText: captureSelection() });
      return;
    }

    sendResponse(undefined);
  });
};

export const initializeContentCapture = (): void => {
  setupContextMessaging();
  console.log('[CEB] Context capture ready (explicit-only, metadata by default)');
};
