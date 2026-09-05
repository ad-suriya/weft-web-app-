import { readFileSync } from 'node:fs';
import type { ManifestType } from '@extension/shared';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * @prop default_locale
 * if you want to support multiple languages, you can use the following reference
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
 *
 * @prop browser_specific_settings
 * Must be unique to your extension to upload to addons.mozilla.org
 * (you can delete if you only want a chrome extension)
 *
 * @prop permissions
 * Firefox doesn't support sidePanel (It will be deleted in manifest parser)
 *
 * @prop content_scripts
 * css: ['content.css'], // public folder
 */
const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extensionName__',
  browser_specific_settings: {
    gecko: {
      id: 'example@example.com',
      strict_min_version: '109.0',
    },
  },
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  // Needed so the focus-session site block can run on any page the user
  // navigates to during a session, and so the dashboard-bridge can relay a
  // login from the deployed dashboard origin. No page content is read or sent.
  host_permissions: ['<all_urls>'],
  // Kept minimal (Chrome Web Store disclosure):
  //   storage       — the user's tasks, focus sessions, blocklist, auth + consent, all local
  //   tabs          — read the ACTIVE tab's title + URL for explicit "Save Reference" / task
  //                   capture, and — ONLY while a focus session with a linked task is running —
  //                   the same title+URL (never content) for the context-switch check below
  //   contextMenus  — the "Add to WEFT" right-click entry
  //   notifications — the single "you've drifted" nudge fired by the context-switch check;
  //                   disclosed in the first-use consent notice, session-scoped (see background)
  //   alarms        — MV3 service workers get killed between events, so the context-switch
  //                   check's multi-minute threshold timer needs chrome.alarms, not setTimeout
  // Deliberately NOT requested: `scripting` (unused) — no page-content access anywhere, and
  // no notification-listener / Do-Not-Disturb access anywhere.
  permissions: ['storage', 'tabs', 'contextMenus', 'notifications', 'alarms'],
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  action: {
    default_popup: 'popup/index.html',
    default_icon: 'icon-34.png',
  },
  options_page: 'options/index.html',
  commands: {
    'capture-task': {
      suggested_key: { default: 'Ctrl+Shift+Y', mac: 'Command+Shift+Y' },
      description: 'Capture the current page (or selection) as a task',
    },
  },
  icons: {
    '16': 'icon-16.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
  },
  content_scripts: [
    {
      // Local dev origins plus the deployed Cloud Run frontend — without the
      // latter, logging in on the deployed dashboard never reaches the
      // extension since this bridge script wouldn't be injected there.
      matches: [
        'http://localhost:5173/*',
        'http://localhost:3000/*',
        'https://task-weave-57923630274.asia-south1.run.app/*',
      ],
      js: ['content/dashboard-bridge.iife.js'],
    },
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      css: ['content.css'],
      js: ['content/all.iife.js'],
    },
  ],
  web_accessible_resources: [
    {
      // *.html was missing here — focus-blocking.ts's content-script redirect
      // to focus-lock/index.html got silently blocked by Chrome (not loadable
      // from a web page without being listed), surfacing as a generic
      // chrome-error://chromewebdata page instead of the lock screen. Caught
      // by actually driving a loaded extension in a browser, not by review.
      resources: ['*.js', '*.css', '*.svg', '*.html', 'icon-128.png', 'icon-34.png'],
      matches: ['*://*/*'],
    },
  ],
} satisfies ManifestType;

export default manifest;
