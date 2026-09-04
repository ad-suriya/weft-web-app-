import React, { useEffect, useRef, useState } from 'react';
import { Bell, X, Clock } from 'lucide-react';
import { api } from '../api';
import { Reminder } from '../types';

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
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 border border-[#23271F]/14 hover:bg-[#2C312A] hover:text-white transition-colors" aria-label="Reminders">
        <Bell className="w-4 h-4" />
        {dueCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#C2632F] text-white font-sans text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {dueCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-[#23271F]/14 shadow-[0_16px_40px_-14px_rgba(35,39,31,0.24)] z-50">
          <div className="flex items-center justify-between border-b border-[#23271F]/14 px-4 py-2">
            <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">Reminders</span>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
          </div>

          {holdNotifications && dueCount > 0 && (
            <p className="font-sans text-[10.5px] text-[#8C9184] px-4 py-2 border-b border-[#23271F]/10 leading-relaxed">
              {dueCount} held by Study Focus until this session ends.
            </p>
          )}

          {permission !== 'granted' && (
            <button onClick={enable} className="w-full font-sans text-[11px] font-bold uppercase tracking-wider px-4 py-2 bg-[#2F7A64] text-white hover:opacity-90">
              Enable browser notifications
            </button>
          )}

          <div className="max-h-80 overflow-y-auto">
            {reminders.length === 0 ? (
              <p className="font-sans text-xs opacity-50 italic p-4 text-center">No reminders yet. Plan your day to generate them.</p>
            ) : (
              reminders.map((r) => (
                <div key={r.id} className={`flex items-start gap-2 px-4 py-3 border-b border-[#23271F]/10 ${r.due ? 'bg-[#C2632F]/5' : ''}`}>
                  <Clock className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${r.due ? 'text-[#C2632F]' : 'opacity-40'}`} />
                  <div className="flex-grow min-w-0">
                    <p className="font-sans text-xs leading-snug">{r.message}</p>
                    <p className="font-sans text-[10px] opacity-50 mt-0.5">{fmt(r.remind_at)}{r.due && ' · due'}</p>
                  </div>
                  <button onClick={() => dismiss(r.id)} className="font-sans text-[9px] uppercase font-bold opacity-50 hover:opacity-100 hover:text-[#C2632F]">Dismiss</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
