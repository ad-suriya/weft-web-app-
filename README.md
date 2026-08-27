# Task Weave

**Remember. Connect. Execute.** — an AI-powered focus and task companion.

**Live:** https://task-weave-dashboard.netlify.app/ &nbsp;·&nbsp; API: https://task-weave-backend.onrender.com

Task Weave isn't a task manager. It's a decision-to-execution system for
procrastination, deadline pressure, and distraction loops — built to shrink the gap
between "I should do this" and "I am doing this now."

**Core loop:** Capture → Plan → Execute → Protect → Recover → Repeat.

- **Capture** — grab a task (and its page context) from anywhere you're browsing.
- **Plan** — describe what's due in plain language; AI infers urgency and effort and
  builds a time-blocked schedule.
- **Execute** — a focus session shows one active task, a timer, and the next micro-step.
- **Protect** — distracting sites are blocked while a session is running.
- **Recover** — when a plan slips, remaining work is rescheduled into the next free slots.

## Surfaces

| Surface | Path | What it does |
| --- | --- | --- |
| Chrome extension | `chrome-extension/`, `pages/`, `packages/` | Instant capture, one-tap focus sessions, distraction + site-lock blocking |
| Web dashboard | `Dashboard/` | Natural-language planning, AI schedules, deadline-risk scoring, task decomposition, weekly flexible streaks, recovery |

## Tech stack

- **Extension** — Chrome Manifest V3, React + TypeScript + Vite, Tailwind CSS, Turborepo + pnpm workspaces
- **Dashboard frontend** — React + TypeScript + Vite, hosted on Netlify
- **Dashboard backend** — Python FastAPI · Gemini Developer API · Firebase Authentication + Firestore

## Getting started

**Prerequisites:** Node.js 18+, pnpm, Python 3.10+, and Chrome or Chromium.

### Extension

```bash
pnpm install
pnpm dev            # watch build with HMR  (pnpm build for production)
```

Load it in Chrome: open `chrome://extensions/`, enable **Developer mode**, click
**Load unpacked**, and select the `dist/` folder.

To share a build without the Web Store: `pnpm zip` writes
`dist-zip/extension-<timestamp>.zip`; the recipient unzips it and **Load unpacked**s
that folder.

### Dashboard backend

```bash
cd Dashboard/backend
pip install -r requirements.txt
python start.py            # http://127.0.0.1:8000
```

Set `GEMINI_API_KEY` in `Dashboard/.env`. Sign-in is Firebase Authentication —
the backend verifies Firebase ID tokens in `auth.py` using `firebase-admin`,
which locally falls back to your `gcloud auth application-default login`
credentials (set `FIREBASE_CREDENTIALS` to a service-account key for a deploy).

### Dashboard frontend

```bash
cd Dashboard/frontend
npm install
npm run dev
```

## Deployment & current state

The original stack ran on a paid Google Cloud project (Cloud Run for the
frontend and backend, Vertex AI for Gemini, Firestore). After the GCP project's
billing was disabled it was migrated to free tiers and is live end to end:
**Netlify** for the dashboard, **Render** for the backend, **Firebase
Authentication** for sign-in, **Firestore** for data, and the **Gemini
Developer API** for AI.

- Dashboard: https://task-weave-dashboard.netlify.app/
- Backend: https://task-weave-backend.onrender.com (`/api/health` for status)

### Features removed in the migration

- **Google Calendar two-way sync** — the schedule no longer reads or writes
  Google Calendar events. It was tied to the Google OAuth consent that the
  sign-in change replaced; the backend `/api/calendar/*` code remains but has
  no way to connect an account.
- **Vertex AI** — Gemini now runs on the Developer API key instead of the
  billed Vertex project.
- **Cloud Run** — both the dashboard (now Netlify) and the backend (now Render)
  left Cloud Run. The frontend `Dockerfile` + `nginx/` config under
  `Dashboard/frontend/` are kept but no longer used.

### Initial → current

| Area | Initial | Current |
| --- | --- | --- |
| Dashboard hosting | Google Cloud Run (Docker + nginx) | Netlify — `Dashboard/frontend/netlify.toml` builds the SPA and proxies `/api/*` to the backend |
| Backend hosting | Google Cloud Run | Render (`render.yaml`, Docker) |
| Sign-in | Google OAuth 2.0 redirect flow; backend verified Google ID tokens | Firebase Authentication (Google provider) via `signInWithPopup`; backend verifies Firebase ID tokens with `firebase-admin` |
| Database | Firestore on `project-56165b37-…` | Firestore on `the-last-minute-life-saver` (same project as Auth) |
| AI provider | Vertex AI (Gemini) | Gemini Developer API via `GEMINI_API_KEY` |
| Calendar sync | Two-way Google Calendar sync | Removed |

### Deploying

- **Frontend** — `cd Dashboard/frontend && netlify deploy --prod` (or connect the
  repo in Netlify with base directory `Dashboard/frontend`).
- **Backend** — Render Blueprint at `render.yaml` (Docker, free plan). After the
  first deploy, in the Render dashboard set `GEMINI_API_KEY` and add a Secret
  File `firebase-service-account.json` (a key for the `the-last-minute-life-saver`
  Firebase project). `GOOGLE_CLOUD_PROJECT` must stay unset. If Render assigns a
  subdomain other than `task-weave-backend.onrender.com`, update the `/api/*`
  target in `netlify.toml` and `API_BASE` in
  `packages/storage/lib/impl/backend-client.ts`, then redeploy both.
- **Firebase console** — enable the Google sign-in provider and add the Netlify
  domain under Authentication → Settings → Authorized domains.

The Render free instance sleeps after ~15 min idle, so the first request after a
lull takes ~30–60s while it wakes; subsequent requests are normal speed.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Watch build with HMR |
| `pnpm build` | Production build (`pnpm build:firefox` for Firefox) |
| `pnpm zip` | Build and package the extension into `dist-zip/` |
| `pnpm lint` | ESLint across the workspace |
| `pnpm type-check` | TypeScript checks across the workspace |
| `pnpm e2e` | End-to-end tests |

## Credits

Extension scaffolding based on
[chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite).

## License

MIT — see [LICENSE](LICENSE).
