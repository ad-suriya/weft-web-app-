import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  onAccept: () => Promise<void> | void;
}

// One-time data-use notice + consent, shown on first launch of the dashboard.
// Acceptance is recorded on the user's profile (POST /api/me/consent) so this
// never shows again unless the notice version changes.
export const ConsentModal: React.FC<Props> = ({ onAccept }) => {
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try {
      await onAccept();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#2C312A]/70 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white border-2 border-[#23271F]/14 shadow-[0_20px_50px_-16px_rgba(35,39,31,0.28)]">
        <div className="border-b-2 border-[#23271F]/14 px-6 py-4">
          <p className="text-[10px] uppercase tracking-wider font-bold opacity-60">Before you start</p>
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
                <span className="text-[#2F7A64] font-bold">✓</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <p className="font-medium">
            WEFT never stores passwords, keystrokes, your full browsing history, or page content — unless you
            deliberately select text and save it.
          </p>
          <p className="text-xs opacity-70">
            Read the full{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" className="underline font-bold text-[#2F7A64]">
              Privacy Policy
            </a>
            . You can export or delete all your data any time from Privacy &amp; Data.
          </p>
        </div>

        <div className="border-t-2 border-[#23271F]/14 px-6 py-4 flex justify-end">
          <button
            onClick={accept}
            disabled={busy}
            className="font-sans text-[11px] uppercase tracking-wider font-bold px-5 py-2.5 bg-[#2F7A64] text-white hover:bg-[#245E4E] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Accept &amp; continue
          </button>
        </div>
      </div>
    </div>
  );
};
