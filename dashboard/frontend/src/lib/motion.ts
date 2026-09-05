// Shared motion vocabulary — durations in seconds (motion/react's unit),
// two spring presets for the two weight classes of interactive element.
// Every screen/primitive that animates should pull from here rather than
// inventing its own timing, so the whole app moves with one hand.

export const DURATION = {
  fast: 0.15,
  base: 0.22,
  slow: 0.3,
} as const;

export const EASE_STANDARD = [0.4, 0, 0.2, 1] as const;

// Small elements: toggle thumb, sidebar active indicator, badges.
export const SPRING_SNAPPY = { type: 'spring', stiffness: 420, damping: 32 } as const;

// Larger surfaces: card hover-lift, modal/toast entrance, Focus Bridge.
export const SPRING_SOFT = { type: 'spring', stiffness: 260, damping: 28 } as const;

export const FADE_UP = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
} as const;

export const FADE_UP_REDUCED = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;
