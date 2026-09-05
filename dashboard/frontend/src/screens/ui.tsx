import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATION, SPRING_SNAPPY } from '../lib/motion';

// Shared building blocks for the console screens (Today / My Work / Context /
// Devices / Activity / Settings). Soft-modern system: warm ground, hairline
// borders, soft shadows, rounded corners, Fraunces for display text and
// `font-sans` (Inter) for chrome. Colors/radii/shadows below reference the
// token layer defined in src/index.css's @theme — see that file before
// reaching for a one-off hex.

export const CARD = 'bg-surface border border-ink/12 rounded-lg shadow-card';
export const CARD_HERO = 'bg-surface border border-ink/12 rounded-2xl shadow-hero';
export const CARD_DARK = 'bg-surface-elevated text-inverse rounded-xl shadow-dark';

export const BTN =
  'inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-wider font-semibold px-4 py-2 rounded-md border border-ink/14 hover:bg-accent/10 hover:text-accent-strong hover:border-transparent transition-colors disabled:opacity-40';
export const BTN_GO =
  'inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-wider font-semibold px-4 py-2 rounded-md bg-accent text-inverse hover:bg-accent-strong transition-colors disabled:opacity-40';
export const BTN_SM =
  'inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1.5 rounded-sm border border-ink/14 hover:bg-accent/10 hover:text-accent-strong hover:border-transparent transition-colors disabled:opacity-40';

export function ScreenHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header>
      <h2 className="font-serif text-page-heading font-semibold tracking-tight leading-[1.1]">{title}</h2>
      {children && <p className="mt-2 font-sans text-body text-ink-soft max-w-[62ch] leading-relaxed">{children}</p>}
    </header>
  );
}

export function Eyebrow({
  children,
  tone = 'dim',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'dim' | 'ink' | 'green';
  className?: string;
}) {
  const color = tone === 'ink' ? 'text-ink' : tone === 'green' ? 'text-accent-strong' : 'text-ink-soft';
  return (
    <span className={`font-sans text-metadata font-semibold uppercase tracking-[0.12em] ${color} ${className}`}>
      {children}
    </span>
  );
}

export function SectionRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Eyebrow tone="ink">{children}</Eyebrow>
      <div className="h-px flex-grow bg-ink/10" />
    </div>
  );
}

// Pill's tone union grew success/warning/danger (the brief's semantic names)
// alongside the original green/amber/orange/neutral/ink names — kept as
// aliases so no existing call site needed to change.
export type PillTone = 'neutral' | 'green' | 'amber' | 'orange' | 'ink' | 'success' | 'warning' | 'danger';

export function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: PillTone }) {
  const map: Record<PillTone, string> = {
    neutral: 'border-ink/18 text-ink-soft bg-surface',
    green: 'border-transparent text-inverse bg-accent',
    success: 'border-transparent text-inverse bg-success',
    amber: 'border-transparent text-ink bg-warning',
    warning: 'border-transparent text-warning-text bg-warning',
    orange: 'border-transparent text-inverse bg-danger',
    danger: 'border-transparent text-inverse bg-danger',
    ink: 'border-transparent text-inverse bg-surface-elevated',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans text-[9px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border ${map[tone]}`}
    >
      {children}
    </span>
  );
}

// Badge is Pill under a name that matches the brief's primitive list —
// same component, so every screen can reach for either name.
export const Badge = Pill;

export function Meter({ value, className = '' }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`h-2 rounded-full bg-[#E8EBE4] overflow-hidden ${className}`}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

// A collapsible section for panels folded into a bigger screen (Goals/Habits/
// Breakdown into My Work, Memory into Context) — native <details> so it needs
// no state and stays keyboard/screen-reader accessible.
export function Collapsible({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={`${CARD} group`} open={defaultOpen}>
      <summary className="cursor-pointer list-none flex items-center gap-3 px-5 py-4 select-none">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-wider">{title}</span>
        <div className="h-px flex-grow bg-ink/10" />
        <span className="font-sans text-[10px] text-ink-faint group-open:hidden">Show</span>
        <span className="font-sans text-[10px] text-ink-faint hidden group-open:inline">Hide</span>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative w-10 h-6 rounded-full border-2 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        on ? 'bg-accent border-accent' : 'bg-[#E8EBE4] border-ink/18'
      }`}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-surface shadow-sm"
        animate={{ x: on ? 16 : 0 }}
        transition={SPRING_SNAPPY}
      />
    </button>
  );
}

// A small "preview / not wired up" tag for the stubbed device-sync surfaces.
export function PreviewTag() {
  return (
    <span className="font-sans text-[8.5px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full border border-danger/40 text-danger">
      Preview
    </span>
  );
}

// ------------------------------------------------------------------------
// New primitives
// ------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-inverse hover:bg-accent-strong border border-transparent',
  secondary: 'border border-ink/14 hover:bg-accent/10 hover:text-accent-strong hover:border-transparent',
  ghost: 'border border-transparent text-ink-soft hover:text-accent-strong hover:bg-accent/10',
  danger: 'bg-danger text-inverse hover:bg-danger-strong border border-transparent',
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'text-[10px] px-2.5 py-1.5 rounded-sm gap-1.5',
  md: 'text-[11px] px-4 py-2 rounded-md gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-sans font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${BUTTON_VARIANT[variant]} ${BUTTON_SIZE[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

type CardVariant = 'primary' | 'secondary' | 'elevated' | 'interactive' | 'informational' | 'empty';

const CARD_VARIANT: Record<CardVariant, string> = {
  primary: CARD_HERO,
  secondary: CARD,
  elevated: CARD_DARK,
  interactive: `${CARD} cursor-pointer`,
  informational: 'bg-accent-soft border border-accent/20 rounded-lg',
  empty: 'bg-transparent border border-dashed border-ink/18 rounded-lg',
};

// Omits the handful of HTML event props (drag/animation callbacks) whose
// signatures collide with motion.div's own — the interactive variant below
// renders a motion.div, so CardProps can't carry the plain-DOM versions.
export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: CardVariant;
}

export function Card({ variant = 'secondary', className = '', children, onClick, onKeyDown, ...rest }: CardProps) {
  const reduced = useReducedMotion();
  if (variant === 'interactive') {
    // A clickable div is otherwise invisible to keyboard/screen-reader users
    // — give it button semantics when it actually has a click handler.
    const interactiveProps = onClick
      ? {
          role: 'button' as const,
          tabIndex: 0,
          onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
            onKeyDown?.(e);
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              (onClick as React.MouseEventHandler<HTMLDivElement>)(e as unknown as React.MouseEvent<HTMLDivElement>);
            }
          },
        }
      : { onKeyDown };
    return (
      <motion.div
        className={`${CARD_VARIANT[variant]} ${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
        whileHover={reduced ? undefined : { y: -2 }}
        whileTap={reduced ? undefined : { scale: 0.98 }}
        transition={{ duration: DURATION.fast }}
        onClick={onClick}
        {...interactiveProps}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <div className={`${CARD_VARIANT[variant]} ${className}`} onClick={onClick} onKeyDown={onKeyDown} {...rest}>
      {children}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ error, className = '', ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <input
        className={`bg-surface font-sans text-body px-3 py-2.5 rounded-md border transition-colors focus:outline-none focus:ring-1 placeholder:text-ink-faint disabled:opacity-40 disabled:cursor-not-allowed ${
          error ? 'border-danger focus:ring-danger' : 'border-ink/18 focus:ring-accent'
        } ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error && <p className="font-sans text-[11px] text-danger">{error}</p>}
    </div>
  );
}

export function Textarea({
  error,
  className = '',
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <textarea
        className={`bg-surface font-sans text-body px-3 py-2.5 rounded-md border transition-colors focus:outline-none focus:ring-1 placeholder:text-ink-faint disabled:opacity-40 disabled:cursor-not-allowed resize-none ${
          error ? 'border-danger focus:ring-danger' : 'border-ink/18 focus:ring-accent'
        } ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error && <p className="font-sans text-[11px] text-danger">{error}</p>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : DURATION.base }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className={`bg-surface rounded-2xl shadow-hero max-w-lg w-full max-h-[85vh] overflow-y-auto focus:outline-none ${className}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: reduced ? 0 : DURATION.slow, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Tooltip({
  label,
  children,
  side = 'right',
}: {
  label: string;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();
  const posClass: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            role="tooltip"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: DURATION.fast }}
            className={`absolute z-50 whitespace-nowrap px-2.5 py-1.5 rounded-md bg-surface-elevated text-inverse text-[11px] font-sans font-medium shadow-popover pointer-events-none ${posClass[side]}`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export type StatusTone = 'connected' | 'not-connected' | 'active' | 'idle' | 'focusing' | 'blocked' | 'error';

const STATUS_TONE: Record<StatusTone, { dot: string; text: string; pulse: boolean }> = {
  connected: { dot: 'bg-accent', text: 'text-accent-strong', pulse: false },
  active: { dot: 'bg-accent', text: 'text-accent-strong', pulse: true },
  focusing: { dot: 'bg-accent', text: 'text-accent-strong', pulse: true },
  blocked: { dot: 'bg-accent', text: 'text-accent-strong', pulse: true },
  idle: { dot: 'bg-ink-faint', text: 'text-ink-soft', pulse: false },
  'not-connected': { dot: 'bg-ink-faint', text: 'text-ink-faint', pulse: false },
  error: { dot: 'bg-danger', text: 'text-danger', pulse: false },
};

export function StatusIndicator({
  tone,
  label,
  className = '',
}: {
  tone: StatusTone;
  label: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const cfg = STATUS_TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider ${cfg.text} ${className}`}>
      <span className="relative flex w-1.5 h-1.5">
        {cfg.pulse && !reduced && (
          <motion.span
            className={`absolute inline-flex w-full h-full rounded-full ${cfg.dot}`}
            animate={{ opacity: [0.6, 0, 0.6], scale: [1, 2.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      </span>
      {label}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="empty" className={`flex flex-col items-center text-center px-6 py-10 gap-2 ${className}`}>
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center mb-1">
          <Icon className="w-5 h-5 text-accent-strong" />
        </div>
      )}
      <p className="font-serif text-lg font-semibold tracking-tight text-ink">{title}</p>
      {description && <p className="font-sans text-[13px] text-ink-soft max-w-[38ch] leading-relaxed">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={`bg-ink/8 rounded-md ${className}`} />;
  }
  return (
    <motion.div
      className={`bg-ink/8 rounded-md ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
