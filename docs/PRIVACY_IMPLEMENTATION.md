# Privacy & consent implementation

Maps the six privacy tasks onto this repo (dashboard + FastAPI backend +
Chrome extension). There is **no Android app in this repo yet**, so its parts
are recorded here as placeholders.

## 1. Privacy policy page — done
- `dashboard/frontend/src/PrivacyPolicy.tsx`, served at `/privacy`
  (`main.tsx` path check; nginx already falls back to `index.html`).
- Footer link: `components/Sidebar.tsx`. Also linked from `LoginPage.tsx`.
- Extension: `packages/i18n/locales/{en,ko}/messages.json`
  `extensionDescription` now states title/URL-only, explicit-save capture.

## 2. Consent on first use — done (dashboard + extension)
- Backend: `POST /api/me/consent` → `db.set_user_consent` stores
  `consent_accepted_at` / `consent_version` on the user profile.
  `CONSENT_VERSION` in `main.py` — bump to re-prompt everyone.
- Dashboard: `ConsentModal.tsx`, gated in `App.tsx` off `GET /api/me`.
- Extension: `packages/storage/.../consent-storage.ts` +
  `pages/popup/src/ConsentNotice.tsx`, gated in `Popup.tsx`.
- **Android: placeholder** — reuse the same notice copy + a
  `POST /api/me/consent` call before the first screen.

## 3. Data-minimization guardrails (backend) — done
- `dashboard/backend/privacy.py`: `enforce_metadata_only()` rejects raw page
  HTML / full page text / over-long blobs; `clean_url()` validates URLs.
- Wired into `TaskCreate` / `TaskPatch` validators for `selected_text`,
  `next_micro_step`, `url`, **and now `ReferenceCreate`'s `title`/`url`/
  `snippet`** — a real `references` model exists (`dashboard/backend/main.py`
  `/api/references`, `db.py` `create_reference`) and previously skipped this
  chokepoint; closed as part of wiring the extension's Save Reference button.
- **Any future page-derived-data model MUST route create/update through
  `privacy.enforce_metadata_only`.**

## 4. Browser extension: explicit-only capture, mostly — updated
- `pages/content/src/context-capture.ts`: `capturePageMetadata()` returns
  title + URL only; `SAVE_REFERENCE` message returns metadata only;
  selection is only read for an explicit task-capture gesture.
- **New, disclosed exception**: while a focus session with a linked task is
  running, `chrome-extension/src/background/index.ts` polls the active tab's
  title/URL (via `chrome.alarms`, never `chrome.scripting`/page content)
  every minute to detect drift from the current task, and fires one
  `chrome.notifications` nudge after 10 continuous minutes of low relevance.
  This is session-scoped — starts on `FOCUS_STARTED` (only if the session
  carries task context), stops on `FOCUS_ENDED`/`FOCUS_PAUSED` — and nothing
  it reads is ever sent to the backend; relevance scoring
  (`packages/shared/lib/utils/relevance.ts`) runs entirely on-device.
  Disclosed in `pages/popup/src/ConsentNotice.tsx`, which gated re-prompting
  everyone via a `CONSENT_VERSION` bump (`main.py` + `consent-storage.ts`,
  both now `2026-09-05`).
- `chrome-extension/manifest.ts`: added `notifications` (the drift nudge) and
  `alarms` (MV3 service workers don't survive `setTimeout` between events) —
  both justified in the permissions comment block. `scripting` remains
  deliberately unrequested — no page-content access anywhere.

## 5. Android permissions: keep minimal — placeholder
- No Android code in this repo. Recorded intent:
  - "Study Focus" must be **local UI state only** — no
    `BIND_NOTIFICATION_LISTENER_SERVICE`, no `ACCESS_NOTIFICATION_POLICY` /
    DND control until a real integration is designed.
  - Real system-DND integration = separate feature: declared permission +
    Play Store justification + privacy-policy update.
- Marker comment left in `packages/storage/lib/impl/focus-session-storage.ts`
  (the local session/blocking state that a future toggle should build on).
- Extension already requests no notification/DND permissions (task 4).

## 6. Delete / export controls — done
- Backend: `GET /api/me/data/export` (`db.export_user_data`) and
  `DELETE /api/me/data` (`db.delete_user_data` — wipes tasks, workflows,
  sessions, goals, habits, reminders, projects, task_events, chats, memory,
  linked calendar token; keeps the `users` identity + consent row).
- Dashboard: `DataPrivacyModal.tsx`, opened from the top-bar **Privacy**
  button — "Export JSON" downloads `weft-data-<date>.json`; "Delete
  everything" requires typing `DELETE`.
