import { sampleFunction } from '@src/sample-function';
import { initializeContentCapture } from '@src/context-capture';
import { initializeFocusMode } from '@src/focus-blocking';

console.log('[CEB] All content script loaded');

void sampleFunction();
// Registers a message listener only — reads/sends nothing until a
// user-initiated WEFT flow asks it for the current tab's title + URL.
initializeContentCapture();
// Enforces the active focus session's site block on THIS tab's own URL only.
initializeFocusMode();
