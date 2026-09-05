import React from 'react';
import { motion } from 'motion/react';
import { Laptop, Smartphone, ShieldCheck } from 'lucide-react';
import { FocusPrefs, Task } from '../types';
import { CARD_DARK, StatusIndicator, StatusTone, Toggle, PreviewTag } from './ui';
import { useReducedMotion } from '../hooks/useReducedMotion';

export type BridgeState = 'not-connected' | 'idle' | 'connected' | 'focusing' | 'blocked';

export function computeBridgeState(task: Task | null, isActive: boolean, pomoRunning: boolean, studyFocus: boolean): BridgeState {
  if (isActive && pomoRunning) {
    return studyFocus ? 'blocked' : 'focusing';
  }
  if (task || studyFocus) return 'connected';
  return 'idle';
}

const STATE_COPY: Record<BridgeState, { label: string; tone: StatusTone; connector: string }> = {
  'not-connected': { label: 'Not linked', tone: 'not-connected', connector: 'bg-ink-faint/40' },
  idle: { label: 'Idle', tone: 'idle', connector: 'bg-ink-faint/40' },
  connected: { label: 'Ready', tone: 'connected', connector: 'bg-accent/50' },
  focusing: { label: 'Focusing', tone: 'focusing', connector: 'bg-accent' },
  blocked: { label: 'Focusing · shielded', tone: 'blocked', connector: 'bg-accent' },
};

// The device-aware "one work state, every device in step" visualization.
// Shared by TodayScreen (compact, inline in the daily flow) and
// DevicesScreen (same component, just given more room) so the two never
// drift into two different renderings of the same status again.
export default function FocusBridge({
  task,
  isActive,
  pomoRunning,
  focusPrefs,
  onToggleStudyFocus,
}: {
  task: Task | null;
  isActive: boolean;
  pomoRunning: boolean;
  focusPrefs: FocusPrefs;
  onToggleStudyFocus: () => void;
}) {
  const reduced = useReducedMotion();
  const laptopState = computeBridgeState(task, isActive, pomoRunning, focusPrefs.study_focus);
  const copy = STATE_COPY[laptopState];
  const animated = (laptopState === 'focusing' || laptopState === 'blocked') && !reduced;

  return (
    <div className={`${CARD_DARK} p-5`}>
      <div className="flex items-center justify-between gap-4 mb-3.5">
        <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-inverse/70">
          Focus Bridge · task-aware device coordination
        </span>
        <div className="flex items-center gap-2.5">
          <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-inverse/60">Study Focus</span>
          <Toggle on={focusPrefs.study_focus} onChange={onToggleStudyFocus} label="Study Focus" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr_max-content] items-center gap-4">
        <div>
          <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-inverse/45">Laptop</div>
          <div className="font-sans text-[13px] font-semibold mt-0.5 flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5" /> {task ? task.task_name : 'No active task'}
          </div>
          <StatusIndicator tone={copy.tone} label={copy.label} className="mt-1" />
        </div>

        <div className="relative h-0.5 min-w-7 rounded-full bg-inverse/15 overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${copy.connector}`}
            initial={false}
            animate={animated ? { width: ['0%', '100%'], opacity: [1, 0] } : { width: laptopState === 'not-connected' || laptopState === 'idle' ? '0%' : '100%', opacity: 1 }}
            transition={animated ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        </div>

        <div>
          <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-inverse/45">This device</div>
          <div className={`font-sans text-[13px] font-semibold mt-0.5 flex items-center gap-1.5 ${focusPrefs.study_focus ? '' : 'text-inverse/60'}`}>
            <Smartphone className="w-3.5 h-3.5" /> {focusPrefs.study_focus ? 'Study Focus active' : 'Study Focus off'}
          </div>
          {laptopState === 'blocked' && (
            <span className="inline-flex items-center gap-1 mt-1 font-sans text-[9.5px] font-semibold uppercase tracking-wider text-accent-soft/90">
              <ShieldCheck className="w-3 h-3" /> Notifications held
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3.5 pt-3 border-t border-inverse/15 font-sans text-[11px]">
        <div>
          <span className="font-semibold uppercase tracking-[0.1em] text-inverse/45 mr-2">Always allowed</span>
          {focusPrefs.allow_list.map((c) => (
            <span key={c} className="inline-block px-2 py-0.5 mr-1.5 rounded-full border border-inverse/25 text-[10px]">
              {c}
            </span>
          ))}
        </div>
      </div>
      <p className="font-sans text-[11px] text-inverse/50 mt-3 leading-relaxed">
        {focusPrefs.study_focus
          ? 'Reminder notifications are held on this device while a focus session runs.'
          : 'Turn Study Focus on to hold non-essential notifications on this device during a session.'}{' '}
        Phone mirroring isn&apos;t connected yet — see Devices for a preview. <PreviewTag />
      </p>
    </div>
  );
}
