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
  `next_micro_step`, `url` — the only task fields that carry page-derived
  data (this app has no separate `Reference` / `WorkState` table yet).
- **Any future `references` / `work_state` model MUST route create/update
  through `privacy.enforce_metadata_only`.**

## 4. Browser extension: explicit-only capture — done
- Audit result: it already never enumerated tabs or history and never
  auto-sent anything.
- `pages/content/src/context-capture.ts` rewritten: `capturePageMetadata()`
  returns title + URL only; `SAVE_REFERENCE` message returns metadata only;
  selection is only read for an explicit task-capture gesture. Policy stated
  at the top of the file.
- `chrome-extension/manifest.ts`: dropped unused `scripting` + `notifications`
  permissions; per-permission justification comment added.

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
