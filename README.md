# Task Weave

**Remember. Connect. Execute.** — an AI-powered focus and task companion.

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
- **Dashboard frontend** — React + TypeScript + Vite
- **Dashboard backend** — Python FastAPI, Google Gemini, Firebase

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

Set `GEMINI_API_KEY` in `.env`. Google sign-in is handled in `auth.py`.

### Dashboard frontend

```bash
cd Dashboard/frontend
npm install
npm run dev
```

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
