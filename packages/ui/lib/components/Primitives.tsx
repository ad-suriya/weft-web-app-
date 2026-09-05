import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../utils';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Popup-side counterparts to dashboard/frontend/src/screens/ui.tsx's
// Card/Badge/EmptyState/Skeleton — same visual spec (soft-modern, rounded,
// softly shadowed), but a parallel implementation since the popup and
// dashboard don't share a build graph. These stay theme-NEUTRAL (no baked-in
// background/border color) because every popup surface toggles between the
// light ("paper") and dark ("ink") palette via the caller's own `isLight`
// check — same pattern as the rest of pages/popup/src — so callers pass
// their own light/dark border+background classes through `className`.

type CardVariant = 'static' | 'interactive';

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: CardVariant;
}

export function Card({ variant = 'static', className, children, ...rest }: CardProps) {
  const reduced = useReducedMotion();
  if (variant === 'interactive') {
    return (
      <motion.div
        className={cn('rounded-lg shadow-card cursor-pointer', className)}
        whileHover={reduced ? undefined : { y: -1 }}
        whileTap={reduced ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15 }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <div className={cn('rounded-lg shadow-card', className)} {...rest}>
      {children}
    </div>
  );
}

export type BadgeTone = 'neutral' | 'success' | 'danger';

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'border-current/25 text-current/70 bg-transparent',
  success: 'border-transparent text-white bg-planning',
  danger: 'border-transparent text-white bg-panic',
};

export function Badge({ children, tone = 'neutral', className }: { children: React.ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
        BADGE_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center text-center px-4 py-6 gap-1.5 rounded-lg border border-dashed border-current/20', className)}>
      {Icon && (
        <div className="w-8 h-8 rounded-full bg-planning/10 flex items-center justify-center mb-1">
          <Icon className="w-4 h-4 text-planning" />
        </div>
      )}
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="text-xs opacity-60 max-w-[32ch] leading-relaxed">{description}</p>}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={cn('bg-current/10 rounded-md', className)} />;
  }
  return (
    <motion.div
      className={cn('bg-current/10 rounded-md', className)}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
