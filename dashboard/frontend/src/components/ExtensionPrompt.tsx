import React from 'react';

interface Props {
  onDismiss: () => void;
}

// Shown once, right after the guided tour finishes — the dashboard only
// shows what's already on screen; the browser extension is what actually
// captures tasks and blocks distractions in the moment, so it's worth a
// dedicated nudge instead of being buried in the login page link.
//
// No external link here on purpose: this used to point at /judges.html,
// which is hackathon-submission installation notes (mentions "our
// production Firestore", a Google Drive zip, "not isolated per-judge") —
// fine for a reviewer who was told to go there, very wrong for a regular
// user to land on. There's no general-audience install destination yet
// (no Chrome Web Store listing), so this stays informational until one exists.
export default function ExtensionPrompt({ onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(26,26,26,0.55)] p-4">
      <div className="bg-white border-2 border-[#23271F]/14 shadow-[0_16px_40px_-14px_rgba(35,39,31,0.24)] p-6 max-w-sm w-full space-y-4 font-sans">
        <div className="text-3xl">🧩</div>
        <h3 className="text-lg font-semibold italic font-serif">Get the full experience</h3>
        <p className="text-sm leading-relaxed opacity-80">
          Our Chrome extension captures tasks and blocks distractions right from your browser — no need to keep this tab open. It's on its way to the Chrome Web Store.
        </p>
        <div className="flex justify-end items-center gap-3 pt-1">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 bg-[#2C312A] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#3A3F37] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
