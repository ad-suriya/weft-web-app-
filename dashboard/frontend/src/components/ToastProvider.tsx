import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATION } from '../lib/motion';

type ToastTone = 'success' | 'warning' | 'danger' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  pushToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Nothing in the app has a real notification primitive today — one-off
// success/error states are implied by UI change alone (e.g. a saved
// reference just silently updates a boolean). This gives every screen one
// consistent, animated way to confirm "that worked" / "that failed".
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const TONE_STYLE: Record<ToastTone, { icon: React.ComponentType<{ className?: string }>; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'bg-surface-elevated text-inverse' },
  warning: { icon: AlertTriangle, classes: 'bg-warning text-warning-text' },
  danger: { icon: XCircle, classes: 'bg-danger text-inverse' },
  info: { icon: Info, classes: 'bg-surface border border-ink/12 text-ink' },
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const reduced = useReducedMotion();
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId++;
      setToasts((cur) => [...cur, { id, tone, message }]);
      const timer = setTimeout(() => dismiss(id), 4000);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const { icon: Icon, classes } = TONE_STYLE[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: reduced ? 0 : DURATION.base }}
                onMouseEnter={() => {
                  const timer = timers.current.get(t.id);
                  if (timer) clearTimeout(timer);
                }}
                onMouseLeave={() => {
                  const timer = setTimeout(() => dismiss(t.id), 1500);
                  timers.current.set(t.id, timer);
                }}
                className={`pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-2.5 py-2.5 rounded-lg shadow-popover max-w-xs font-sans text-[13px] font-medium ${classes}`}
                role="status"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-grow leading-snug">{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
