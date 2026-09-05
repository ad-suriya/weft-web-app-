import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, ShieldCheck, Database, XOctagon, Puzzle, Focus, SlidersHorizontal, Server, Mail, Check, X,
} from 'lucide-react';
import { Card, Eyebrow } from './screens/ui';
import { useReducedMotion } from './hooks/useReducedMotion';

// Rendered by main.tsx when the path is /privacy (no router in this app).
// Linked from the dashboard sidebar footer, the login page, and the browser
// extension's store description.

interface SectionDef {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: SectionDef[] = [
  { id: 'short-version', title: 'The short version', icon: ShieldCheck },
  { id: 'what-we-collect', title: 'What we collect', icon: Database },
  { id: 'what-we-never-collect', title: 'What we never collect', icon: XOctagon },
  { id: 'extension', title: 'The browser extension', icon: Puzzle },
  { id: 'focus-features', title: 'Focus features', icon: Focus },
  { id: 'your-controls', title: 'Your controls', icon: SlidersHorizontal },
  { id: 'storage', title: 'Storage & third parties', icon: Server },
  { id: 'contact', title: 'Contact', icon: Mail },
];

const COLLECT_ITEMS: [string, string][] = [
  ['Goal & task text you enter', 'The wording of goals, tasks, workflow steps and notes you type into WEFT.'],
  ['Workflow progress', 'Which step you are on, what is done, timestamps for start/stop and resume.'],
  [
    'References you explicitly save',
    'When you click "Save Reference" (or capture a page as a task), we store that page’s title, URL and timestamp — plus a short text snippet only if you selected one yourself.',
  ],
  ['Account basics', 'Your Google account name, email and profile picture, used to sign you in and separate your data from other users.'],
];

const NEVER_COLLECT_ITEMS = [
  'Passwords or anything you type into other sites',
  'Keystrokes',
  'Your full browsing history or a list of your open tabs',
  'Page content or page HTML — unless you deliberately select text and save it as a reference',
  'Payment information or private messages',
];

function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (!els.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

function SectionCard({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card variant="secondary" className="p-6 md:p-7">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-accent-strong" />
          </div>
          <h2 className="font-serif text-xl font-semibold tracking-tight">{title}</h2>
        </div>
        <div className="space-y-3 font-sans text-sm leading-relaxed text-ink">{children}</div>
      </Card>
    </section>
  );
}

export const PrivacyPolicy: React.FC = () => {
  const Updated = '3 September 2026';
  const ids = useRef(SECTIONS.map((s) => s.id)).current;
  const active = useActiveSection(ids);
  const reduced = useReducedMotion();

  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="border-b border-ink/12 bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-5 flex items-center justify-between gap-4">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wider font-semibold text-accent-strong hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to WEFT
          </a>
          <span className="font-sans text-[10px] uppercase tracking-wider text-ink-faint">Last updated {Updated}</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
          className="mb-10 md:mb-14 max-w-2xl"
        >
          <Eyebrow tone="green">Privacy Policy</Eyebrow>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl font-semibold italic tracking-tight leading-[1.05]">
            What WEFT stores — and what it never does.
          </h1>
          <p className="mt-4 font-sans text-sm text-ink-soft leading-relaxed max-w-[58ch]">
            WEFT stores only what it needs to turn your goals into a workflow and let you pick up exactly where you
            left off. Everything on this page is the full, unabridged list — there is no fine print elsewhere.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-12 items-start">
          {/* Section nav — sticky on desktop, a horizontal scroller on mobile */}
          <nav className="lg:sticky lg:top-24 order-2 lg:order-1">
            <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0">
              {SECTIONS.map(({ id, title, icon: Icon }) => (
                <li key={id} className="shrink-0">
                  <a
                    href={`#${id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md font-sans text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors ${
                      active === id ? 'bg-accent-soft text-accent-strong' : 'text-ink-soft hover:bg-surface hover:text-ink'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-6 order-1 lg:order-2 min-w-0">
            <SectionCard id="short-version" title="The short version" icon={ShieldCheck}>
              <p>
                WEFT stores only what it needs to turn your goals into a workflow and let you pick up where you left
                off. That means the text you type, your progress through a workflow, and the title and URL of pages
                you explicitly save as a reference. Nothing else.
              </p>
            </SectionCard>

            <SectionCard id="what-we-collect" title="What we collect" icon={Database}>
              <ul className="space-y-3">
                {COLLECT_ITEMS.map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <Check className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" />
                    <span>
                      <b className="font-semibold">{t}.</b> {d}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard id="what-we-never-collect" title="What we never collect" icon={XOctagon}>
              <ul className="space-y-3">
                {NEVER_COLLECT_ITEMS.map((x) => (
                  <li key={x} className="flex gap-3">
                    <X className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-2 text-ink-soft">
                The backend actively rejects any request that tries to store raw page HTML or full page text in a
                task or reference — it will only keep a title, URL, timestamp and a short snippet.
              </p>
            </SectionCard>

            <SectionCard id="extension" title="The browser extension" icon={Puzzle}>
              <p>
                The extension reads the <b className="font-semibold">title and URL of the current tab only</b>, and
                only sends that to WEFT when you click "Save Reference" or capture the page as a task. It does not
                run in the background scanning your tabs or history, and it does not use notification or
                Do-Not-Disturb permissions.
              </p>
            </SectionCard>

            <SectionCard id="focus-features" title="Focus features" icon={Focus}>
              <p>
                Any "focus" or "study" toggle in WEFT is a local setting in the app. WEFT does not currently control
                your device's system Do-Not-Disturb or read your notifications.
              </p>
            </SectionCard>

            <SectionCard id="your-controls" title="Your controls" icon={SlidersHorizontal}>
              <p>
                In <b className="font-semibold">Privacy &amp; Data</b> (Settings, in the dashboard) you can{' '}
                <b className="font-semibold">export</b> everything WEFT holds for you as a JSON file, or{' '}
                <b className="font-semibold">delete</b> all of your workflows, steps, work state and references.
                Deletion is immediate and cannot be undone; your account record is kept so you stay signed in.
              </p>
            </SectionCard>

            <SectionCard id="storage" title="Storage & third parties" icon={Server}>
              <p>
                Data is stored in Google Firestore. We use Google for sign-in and, if you connect it, Google
                Calendar. We do not sell your data or share it with advertisers.
              </p>
            </SectionCard>

            <SectionCard id="contact" title="Contact" icon={Mail}>
              <p>Questions or a deletion request you can't complete in-app: reach the WEFT team through the dashboard.</p>
            </SectionCard>
          </div>
        </div>

        <p className="mt-12 text-center font-sans text-[11px] uppercase tracking-wider text-ink-faint">
          WEFT — one goal, every device, one continuous workflow
        </p>
      </div>
    </div>
  );
};
