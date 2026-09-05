import React from 'react';
import { Puzzle } from 'lucide-react';
import { Modal, Button } from '../screens/ui';

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
    <Modal open onClose={onDismiss} title="Get the full experience" className="max-w-sm">
      <div className="p-6 space-y-4 font-sans">
        <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center">
          <Puzzle className="w-5 h-5 text-accent-strong" />
        </div>
        <h3 className="text-lg font-semibold italic font-serif">Get the full experience</h3>
        <p className="text-sm leading-relaxed text-ink-soft">
          Our Chrome extension captures tasks and blocks distractions right from your browser — no need to keep this tab open. It's on its way to the Chrome Web Store.
        </p>
        <div className="flex justify-end items-center gap-3 pt-1">
          <Button variant="primary" onClick={onDismiss}>Got it</Button>
        </div>
      </div>
    </Modal>
  );
}
