import React from 'react';
import { motion } from 'motion/react';
import { Bell } from 'lucide-react';
import { Button } from '../screens/ui';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { FADE_UP, FADE_UP_REDUCED, DURATION, EASE_STANDARD } from '../lib/motion';

interface Props {
  onEnable: () => void;
  onDismiss: () => void;
}

// Asked once, right after first login, instead of being buried inside the
// Reminders bell dropdown where most people would never find it.
export default function NotificationPrompt({ onEnable, onDismiss }: Props) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      {...(reduced ? FADE_UP_REDUCED : FADE_UP)}
      transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
      className="bg-surface rounded-lg border border-ink/14 p-4 flex items-center justify-between gap-4 shadow-card flex-wrap"
    >
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-accent shrink-0" />
        <div>
          <span className="font-sans text-[10px] uppercase tracking-wider font-semibold text-ink-faint block">Stay on top of deadlines</span>
          <p className="font-sans text-sm">Turn on browser notifications so reminders reach you even when this tab isn't active.</p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="ghost" onClick={onDismiss}>Not now</Button>
        <Button variant="primary" onClick={onEnable}>Enable</Button>
      </div>
    </motion.div>
  );
}
