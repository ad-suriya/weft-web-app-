import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Button } from './screens/ui';
import { useReducedMotion } from './hooks/useReducedMotion';

interface Props {
  onAccept: () => Promise<void> | void;
}

// One-time data-use notice + consent, shown on first launch of the dashboard.
// Acceptance is recorded on the user's profile (POST /api/me/consent) so this
// never shows again unless the notice version changes. Deliberately NOT
// dismissible via Escape/backdrop (unlike the shared Modal primitive) —
// consent has to be an explicit accept, not an accidental close.
export const ConsentModal: React.FC<Props> = ({ onAccept }) => {
  const [busy, setBusy] = useState(false);
  const reduced = useReducedMotion();

  const accept = async () => {
    setBusy(true);
    try {
      await onAccept();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink/50 flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label="What WEFT stores"
        className="w-full max-w-lg bg-surface rounded-2xl shadow-hero overflow-hidden"
      >
        <div className="border-b border-ink/12 px-6 py-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-faint">Before you start</p>
          <h2 className="font-serif text-2xl font-semibold italic mt-1">What WEFT stores</h2>
        </div>

        <div className="px-6 py-5 space-y-4 text-sm leading-relaxed">
          <p>To turn your goals into a workflow and let you resume exactly where you left off, WEFT stores:</p>
          <ul className="space-y-1.5">
            {[
              'the goal, task and step text you type',
              'your progress through each workflow',
              'the title and URL of pages you explicitly save as a reference',
            ].map(x => (
              <li key={x} className="flex gap-2.5">
                <Check className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <p className="font-medium">
            WEFT never stores passwords, keystrokes, your full browsing history, or page content — unless you
            deliberately select text and save it.
          </p>
          <p className="text-xs text-ink-soft">
            Read the full{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" className="underline font-semibold text-accent-strong">
              Privacy Policy
            </a>
            . You can export or delete all your data any time from Privacy &amp; Data.
          </p>
        </div>

        <div className="border-t border-ink/12 px-6 py-4 flex justify-end">
          <Button variant="primary" onClick={accept} disabled={busy} loading={busy}>
            Accept &amp; continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
