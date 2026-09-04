import React, { useEffect, useState } from 'react';

interface Step {
  selector: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="capture"]',
    title: 'Start here',
    body: "Dump a deadline or half-finished task into this box — AI turns it into a plan and starts the first step for you. The conversation stays right on this screen.",
  },
  {
    selector: '[data-tour="nav-today"]',
    title: 'Today',
    body: 'The console home: your one active task with a session clock and next step, a resume point, and the rest of the day.',
  },
  {
    selector: '[data-tour="nav-my-work"]',
    title: 'My Work',
    body: 'Every work item with its own progress and resume point. Start, focus, skip, or complete from here.',
  },
  {
    selector: '[data-tour="task-toolbar"]',
    title: 'Add work',
    body: "Add a task manually here, or hit \"Plan my day\" to auto time-block everything you've got.",
  },
  {
    selector: '[data-tour="nav-context"]',
    title: 'Context',
    body: 'The working set for the step you\'re on — next move, dependencies, and saved references, kept together for a clean resume.',
  },
  {
    selector: '[data-tour="nav-workflows"]',
    title: 'Workflows',
    body: 'Describe a recurring procedure in plain English and AI builds an automated workflow that creates those tasks for you.',
  },
  {
    selector: '[data-tour="search-bar"]',
    title: 'Search',
    body: 'Find any task, goal, habit, or focus session instantly from here.',
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findVisible(selector: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return els.find((e) => e.getClientRects().length > 0) ?? els[0] ?? null;
}

interface Props {
  onDismiss: () => void;
  // Lets the parent switch to whatever page a step's target actually lives
  // on (e.g. the Task Board moved to its own "Tasks" page) before this
  // component goes looking for it in the DOM.
  onStepChange?: (selector: string) => void;
}

export default function GuidedTour({ onDismiss, onStepChange }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    onStepChange?.(STEPS[step].selector);

    const measure = () => {
      const el = findVisible(STEPS[step].selector);
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      // Let the scroll settle before measuring final position.
      window.setTimeout(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }, 250);
    };
    // Give the parent's page switch (above) a tick to re-render first,
    // otherwise this measures the DOM before the target page even mounts.
    const id = window.setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => { window.clearTimeout(id); window.removeEventListener('resize', measure); };
  }, [step, onStepChange]);

  // No anchor found (e.g. element not rendered in this view) — skip ahead
  // rather than leaving the tour stuck pointing at nothing.
  useEffect(() => {
    if (rect === null && findVisible(STEPS[step].selector) === null) {
      const id = window.setTimeout(() => {
        if (step < STEPS.length - 1) setStep((s) => s + 1);
        else onDismiss();
      }, 600);
      return () => window.clearTimeout(id);
    }
  }, [rect, step, onDismiss]);

  const pad = 8;
  const spotlight = rect && {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  // Tooltip placement: prefer below the target, flip above if it would run
  // off the bottom of the viewport; clamp horizontally so it never clips.
  const TOOLTIP_W = 320;
  let tooltipStyle: React.CSSProperties = { visibility: 'hidden' };
  if (spotlight) {
    const spaceBelow = window.innerHeight - (spotlight.top + spotlight.height);
    const placeBelow = spaceBelow > 180;
    const top = placeBelow ? spotlight.top + spotlight.height + 12 : undefined;
    const bottom = !placeBelow ? window.innerHeight - spotlight.top + 12 : undefined;
    let left = spotlight.left;
    left = Math.max(12, Math.min(left, window.innerWidth - TOOLTIP_W - 12));
    tooltipStyle = { top, bottom, left, width: TOOLTIP_W, visibility: 'visible' };
  }

  return (
    <>
      {spotlight && (
        <div
          className="fixed z-[60] rounded-md pointer-events-none transition-all duration-200"
          style={{
            top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(26,26,26,0.55)',
          }}
        />
      )}
      <div className="fixed z-[61] bg-white border-2 border-[#23271F]/14 shadow-[0_16px_40px_-14px_rgba(35,39,31,0.24)] p-5 space-y-3 font-sans"
        style={tooltipStyle}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold italic font-serif">{STEPS[step].title}</h3>
          <span className="text-[10px] uppercase font-bold opacity-40">{step + 1}/{STEPS.length}</span>
        </div>
        <p className="text-xs leading-relaxed opacity-80">{STEPS[step].body}</p>
        <div className="flex justify-between items-center gap-3 pt-1">
          <button onClick={onDismiss} className="text-[10px] uppercase font-bold tracking-wider opacity-50 hover:opacity-100 transition-opacity">
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)}
                className="px-3 py-1.5 border border-[#23271F]/14 text-[10px] font-bold uppercase tracking-wider hover:bg-[#2C312A] hover:text-white transition-colors">
                Back
              </button>
            )}
            <button onClick={() => (isLast ? onDismiss() : setStep((s) => s + 1))}
              className="px-3 py-1.5 bg-[#2C312A] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#3A3F37] transition-colors">
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
