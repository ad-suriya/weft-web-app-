# WEFT — Workflow Execution & Focus Thread

**One Goal. Every Device. One Continuous Workflow.**

Cross-device work execution that remembers where you stopped. WEFT turns an
intention into a workflow that can be paused on one device and resumed — at the
exact step, with its context — on another.

> **Built on** [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite) by Seo Jong Hak

## The problem

- Constant interruptions break the flow of work.
- Lost context forces you to reconstruct what you were doing.
- Re-seating takes time — finding the task, files, tabs, and next step again.

Planners don't block. Blockers don't plan. WEFT does both, and it resumes your
exact work state.

## The idea: WEFT Work State

```
Goal → Workflow → Work → Context → State → Resume ↺
```

You describe a goal in one line. WEFT produces an ordered, trackable workflow,
runs a focused work session against it, captures the context you touch (pages,
references, notes), and persists all of it as **work state** so any surface can
pick up exactly where the last one left off.

## Surfaces

WEFT is one workflow across three connected surfaces, all syncing through the
shared work state:

| Surface | Role | Where |
| --- | --- | --- |
| **Android app** | Capture · Control · Resume — quick capture, app blocking, one-tap Do Not Disturb, resume | separate repo |
| **Laptop dashboard** | Execute · Work — command center for planning, focus sessions, and progress | `dashboard/` (this repo) |
| **Browser extension** | Context · Evidence — capture tasks/references from webpages, stay focused, sync state | `chrome-extension/` + `pages/` (this repo) |

**This repository contains the web dashboard and the browser extension.** The
Android app ships from its own repo.

## Feature summary

- **AI-generated workflow** — a one-line goal becomes an ordered set of concrete,
  trackable steps.
- **Deterministic scheduling** — time-blocked plans with autonomous rescheduling.
- **Distraction / app blocking** — during a focus session, distracting sites are
  blocked and interrupt attempts are caught.
- **Cross-device sync** — tasks, sessions, context, and progress live in one
  shared work state.
- **Resume exact work state** — continue at the step you left, with its context.

## Tech Stack

- **Extension**: Chrome Extension Manifest V3, React 19 + TypeScript + Vite, Turbo
  monorepo, Tailwind CSS, pnpm
- **Dashboard frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Dashboard backend**: Python FastAPI (internally "Task Weave Engine"), Gemini
  (via Vertex AI) for the workflow / scheduling engine, Firestore for storage
  (falls back to an in-memory mock)
- **Auth**: Google OAuth sign-in, plus one-click HMAC-signed guest sessions

## Project Structure

```
├── chrome-extension/       # Extension core, manifest, background script
├── pages/                  # Individual extension UI surfaces
│   ├── popup/              # Extension popup
│   ├── side-panel/         # Side panel UI
│   ├── focus-lock/         # Focus blocking / interrupt page
│   ├── task-capture/       # Context-aware capture UI
│   ├── new-tab/ options/ content*/ devtools*/
├── packages/               # Shared workspace packages
│   ├── types/ storage/ messaging/ ui/ i18n/ shared/ …
├── dashboard/
│   ├── frontend/           # React dashboard UI
│   └── backend/            # FastAPI backend (internally "Task Weave Engine")
├── scripts/                # Build / env helper scripts
└── docs/                   # JUDGES.html, privacy notes
```

## Getting Started

### Prerequisites

- Node.js **22.15.1+** and pnpm 10
- Python 3.10+
- Chrome or Chromium

### Browser extension

```bash
git clone https://github.com/ad-suriya/weft-web-app-.git
cd weft-web-app-
pnpm install          # also creates the root .env (build flags, no secrets)
pnpm build            # production build → dist/
```

Load it in Chrome:

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist` folder

For development with HMR, run `pnpm dev` instead of `pnpm build`, then load `dist`.

### Dashboard backend

```bash
cp dashboard/backend/.env.example dashboard/backend/.env
# fill in the two lines marked >>> FILL IN <<< and set up credentials
# (see the comments in .env.example)

cd dashboard/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # http://localhost:8000
```

Without Firestore credentials the backend automatically uses an in-memory mock
(`db_mock.py`), so it still runs for local development.

### Dashboard frontend

```bash
cd dashboard/frontend
npm install
npm run dev           # http://localhost:5173
```

## Try it without any setup

The dashboard landing page has a **"Try it instantly — no sign-up"** button that
mints an isolated guest session and drops you into a pre-seeded workspace (a goal,
a workflow, sample tasks, one finished session). No Google account and no
extension required. See [docs/JUDGES.html](docs/JUDGES.html).

## Sharing the extension without the Chrome Web Store

1. Build and zip: `pnpm zip` → `dist-zip/extension-<timestamp>.zip`
2. Share the zip (Drive, GitHub release, etc.)
3. Recipient unzips it, opens `chrome://extensions/`, enables **Developer mode**,
   clicks **Load unpacked**, and selects the unzipped folder

## Available Scripts

- `pnpm dev` — development build with HMR
- `pnpm build` — production build
- `pnpm zip` — build and package the extension into `dist-zip/`
- `pnpm lint` / `pnpm lint:fix` — ESLint
- `pnpm type-check` — TypeScript type checking
- `pnpm e2e` — build, zip, and run end-to-end tests

## Configuration

### Chrome Extension

- Manifest: [chrome-extension/manifest.ts](chrome-extension/manifest.ts)
- Background script: [chrome-extension/src/background/](chrome-extension/src/background/)
- Content scripts: [pages/content/](pages/content/)

### Environment Variables

See [dashboard/backend/.env.example](dashboard/backend/.env.example) for every
backend variable and what it does. Key ones:

- `GEMINI_API_KEY`, `GOOGLE_CLOUD_PROJECT`, `GEMINI_MODEL` — the AI workflow engine
- `FIREBASE_PROJECT_ID`, `USE_FIRESTORE`, `GOOGLE_APPLICATION_CREDENTIALS` — storage
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` — Google sign-in

**Google Calendar sync** *(planned)* — two-way sync between the generated
time-blocked schedule and the user's Google Calendar: read existing events to
avoid conflicts when scheduling focus blocks, and write planned blocks and
deadlines back as calendar events. Handled by
[dashboard/backend/calendar_sync.py](dashboard/backend/calendar_sync.py); needs a
Web application OAuth client with the
`https://www.googleapis.com/auth/calendar.events` scope.

## Team

**Midnight Syntax** — Suriya A D · Pratyush R · Shravanth

- Demo video: https://youtu.be/U-YKDOsGbo0
- Demo web app: https://task-weave-57923630274.asia-south1.run.app
- Android APK: shipped from the Android repo's releases

## Acknowledgments

Built on the excellent
[chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite)
starter by [Seo Jong Hak](https://github.com/Jonghakseo).

## License

MIT

## Contributing

Contributions are welcome — please feel free to open a Pull Request.
