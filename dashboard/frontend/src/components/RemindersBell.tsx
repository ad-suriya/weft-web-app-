import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, X, Clock } from 'lucide-react';
import { api } from '../api';
import { Reminder } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATION } from '../lib/motion';

const NOTIFIED_KEY = 'lmls_notified_reminders';

function loadNotified(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveNotified(set: Set<number>) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
}

const fmt = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Props {
  // Focus Bridge: while true, due reminders still land in this dropdown but
  // don't pop a browser notification — they fire once the hold lifts (we
  // deliberately don't mark them "notified" while held). Read through a ref
  // below so the 30s poll (subscribed once, on mount) always sees the
  // current value instead of whatever it was when that poll started.
  holdNotifications?: boolean;
}

export default function RemindersBell({ holdNotifications = false }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );
  const notifiedRef = useRef<Set<number>>(loadNotified());
  const holdRef = useRef(holdNotifications);
  const reduced = useReducedMotion();
  useEffect(() => { holdRef.current = holdNotifications; }, [holdNotifications]);

  const fireNotifications = (items: Reminder[]) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (holdRef.current) return;
    for (const r of items) {
      if (r.due && !r.acknowledged && !notifiedRef.current.has(r.id)) {
        new Notification('WEFT', { body: r.message });
        notifiedRef.current.add(r.id);
      }
    }
    saveNotified(notifiedRef.current);
  };

  const refresh = async () => {
    try {
      const items = await api.listReminders();
      setReminders(items);
      fireNotifications(items);
    } catch { /* backend offline */ }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enable = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === 'granted') fireNotifications(reminders);
  };

  const dismiss = async (id: number) => {
    await api.ackReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const dueCount = reminders.filter((r) => r.due).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-md border border-ink/14 hover:bg-accent/10 hover:text-accent-strong transition-colors" aria-label="Reminders">
        <Bell className="w-4 h-4" />
        {dueCount > 0 && (
          <motion.span
            key={dueCount}
            initial={reduced ? { scale: 1 } : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="absolute -top-2 -right-2 bg-danger text-inverse font-sans text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
          >
            {dueCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: DURATION.base }}
            className="absolute right-0 mt-2 w-80 rounded-lg bg-surface border border-ink/14 shadow-popover z-50 origin-top-right overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-ink/14 px-4 py-2">
              <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">Reminders</span>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="w-4 h-4" /></button>
            </div>

            {holdNotifications && dueCount > 0 && (
              <p className="font-sans text-[10.5px] text-ink-faint px-4 py-2 border-b border-ink/10 leading-relaxed">
                {dueCount} held by Study Focus until this session ends.
              </p>
            )}

            {permission !== 'granted' && (
              <button onClick={enable} className="w-full font-sans text-[11px] font-semibold uppercase tracking-wider px-4 py-2 bg-accent text-inverse hover:bg-accent-strong transition-colors">
                Enable browser notifications
              </button>
            )}

            <div className="max-h-80 overflow-y-auto">
              {reminders.length === 0 ? (
                <p className="font-sans text-xs text-ink-faint italic p-4 text-center">No reminders yet. Plan your day to generate them.</p>
              ) : (
                reminders.map((r) => (
                  <div key={r.id} className={`flex items-start gap-2 px-4 py-3 border-b border-ink/10 ${r.due ? 'bg-danger/5' : ''}`}>
                    <Clock className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${r.due ? 'text-danger' : 'text-ink-faint'}`} />
                    <div className="flex-grow min-w-0">
                      <p className="font-sans text-xs leading-snug">{r.message}</p>
                      <p className="font-sans text-[10px] text-ink-faint mt-0.5">{fmt(r.remind_at)}{r.due && ' · due'}</p>
                    </div>
                    <button onClick={() => dismiss(r.id)} className="font-sans text-[9px] uppercase font-semibold text-ink-faint hover:text-danger transition-colors">Dismiss</button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
