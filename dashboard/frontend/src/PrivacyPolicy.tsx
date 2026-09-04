import React from 'react';

// Rendered by main.tsx when the path is /privacy (no router in this app).
// Linked from the dashboard sidebar footer, the login page, and the browser
// extension's store description.
export const PrivacyPolicy: React.FC = () => {
  const Updated = '3 September 2026';
  return (
    <div className="min-h-screen bg-[#F1F3EF] text-[#23271F] font-serif">
      <div className="mx-auto max-w-2xl px-5 py-12 md:py-16">
        <a
          href="/"
          className="font-sans text-[10px] uppercase tracking-wider font-bold text-[#2F7A64] hover:text-[#23271F] transition-colors"
        >
          &larr; Back to WEFT
        </a>

        <h1 className="mt-6 text-4xl md:text-5xl font-semibold italic tracking-tight">Privacy Policy</h1>
        <p className="mt-2 font-sans text-xs uppercase tracking-wider opacity-60">Last updated {Updated}</p>

        <div className="mt-8 bg-white border-2 border-[#23271F]/14 shadow-[0_20px_50px_-16px_rgba(35,39,31,0.28)] p-6 md:p-8 space-y-8 font-sans text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-xl font-bold">The short version</h2>
            <p>
              WEFT stores only what it needs to turn your goals into a workflow and let you pick up where you left
              off. That means the text you type, your progress through a workflow, and the title and URL of pages you
              explicitly save as a reference. Nothing else.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold">What we collect</h2>
            <ul className="space-y-2 list-none">
              {[
                ['Goal & task text you enter', 'The wording of goals, tasks, workflow steps and notes you type into WEFT.'],
                ['Workflow progress', 'Which step you are on, what is done, timestamps for start/stop and resume.'],
                [
                  'References you explicitly save',
                  'When you click “Save Reference” (or capture a page as a task), we store that page’s title, URL and timestamp — plus a short text snippet only if you selected one yourself.',
                ],
                ['Account basics', 'Your Google account name, email and profile picture, used to sign you in and separate your data from other users.'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="text-[#2F7A64] font-bold">✓</span>
                  <span>
                    <b>{t}.</b> {d}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold">What we never collect</h2>
            <ul className="space-y-2 list-none">
              {[
                'Passwords or anything you type into other sites',
                'Keystrokes',
                'Your full browsing history or a list of your open tabs',
                'Page content or page HTML — unless you deliberately select text and save it as a reference',
                'Payment information or private messages',
              ].map(x => (
                <li key={x} className="flex gap-3">
                  <span className="text-[#C2632F] font-bold">✕</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <p className="pt-1">
              The backend actively rejects any request that tries to store raw page HTML or full page text in a task
              or reference — it will only keep a title, URL, timestamp and a short snippet.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl font-bold">The browser extension</h2>
            <p>
              The extension reads the <b>title and URL of the current tab only</b>, and only sends that to WEFT when
              you click “Save Reference” or capture the page as a task. It does not run in the background scanning your
              tabs or history, and it does not use notification or Do-Not-Disturb permissions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl font-bold">Focus features</h2>
            <p>
              Any “focus” or “study” toggle in WEFT is a local setting in the app. WEFT does not currently control your
              device’s system Do-Not-Disturb or read your notifications.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl font-bold">Your controls</h2>
            <p>
              In <b>Privacy &amp; Data</b> (top bar of the dashboard) you can <b>export</b> everything WEFT holds for you
              as a JSON file, or <b>delete</b> all of your workflows, steps, work state and references. Deletion is
              immediate and cannot be undone; your account record is kept so you stay signed in.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl font-bold">Storage &amp; third parties</h2>
            <p>
              Data is stored in Google Firestore. We use Google for sign-in and, if you connect it, Google Calendar.
              We do not sell your data or share it with advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl font-bold">Contact</h2>
            <p>Questions or a deletion request you can’t complete in-app: reach the WEFT team through the dashboard.</p>
          </section>
        </div>

        <p className="mt-8 text-center font-sans text-[11px] uppercase tracking-wider opacity-50">
          WEFT — one goal, every device, one continuous workflow
        </p>
      </div>
    </div>
  );
};
