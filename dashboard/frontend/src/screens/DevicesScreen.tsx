import React, { useState } from 'react';
import { Laptop, Smartphone, Puzzle, Plus, X } from 'lucide-react';
import { FocusPrefs, Task } from '../types';
import { CARD, BTN, ScreenHead, SectionRule, Eyebrow, Pill, Toggle } from './ui';
import FocusBridge from './FocusBridge';

interface Props {
  task: Task | null;
  isActive: boolean;
  pomoRunning: boolean;
  focusPrefs: FocusPrefs;
  onUpdateFocusPrefs: (patch: Partial<FocusPrefs>) => void;
}

function thisDevice(): string {
  if (typeof navigator === 'undefined') return 'This device';
  const ua = navigator.userAgent;
  const os = /Mac/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Desktop';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  return `${browser} · ${os}`;
}

export default function DevicesScreen({ task, isActive, pomoRunning, focusPrefs, onUpdateFocusPrefs }: Props) {
  const [newAllow, setNewAllow] = useState('');

  const addAllowed = () => {
    const v = newAllow.trim();
    if (!v || focusPrefs.allow_list.includes(v)) return;
    onUpdateFocusPrefs({ allow_list: [...focusPrefs.allow_list, v] });
    setNewAllow('');
  };
  const removeAllowed = (v: string) => onUpdateFocusPrefs({ allow_list: focusPrefs.allow_list.filter((x) => x !== v) });

  return (
    <div className="flex flex-col gap-5">
      <ScreenHead title="Devices">
        Your laptop leads the work; your phone follows it. When a session starts, the current task and its focus
        rules are meant to push across the link automatically.
      </ScreenHead>

      <FocusBridge
        task={task}
        isActive={isActive}
        pomoRunning={pomoRunning}
        focusPrefs={focusPrefs}
        onToggleStudyFocus={() => onUpdateFocusPrefs({ study_focus: !focusPrefs.study_focus })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className={`${CARD} p-5`}>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2">
              <Laptop className="w-4 h-4" /> Laptop
            </span>
            <Pill tone="green">This device</Pill>
          </div>
          <p className="font-sans text-[11.5px] text-ink-soft mt-2 leading-relaxed">
            {thisDevice()}
            <br />
            Driving the session · {task ? `working on “${task.task_name}”` : 'idle'}
          </p>
        </section>

        <section className={`${CARD} p-5`}>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Phone
            </span>
            <Pill tone="neutral">Not connected</Pill>
          </div>
          <p className="font-sans text-[11.5px] text-ink-soft mt-2 leading-relaxed">
            Install the WEFT extension and mobile app to link a phone. Once linked, Study Focus mirrors your laptop&apos;s
            current task and holds non-essential notifications during a session.
          </p>
        </section>
      </div>

      <section className={`${CARD} p-5`}>
        <SectionRule>Focus Bridge</SectionRule>

        <div className="flex items-center justify-between gap-6 py-3 border-t border-ink/8 first:border-t-0">
          <div>
            <div className="font-sans text-[13px] font-semibold">Study Focus</div>
            <div className="font-sans text-[11.5px] text-ink-soft mt-0.5">
              While on, reminder notifications are held on this device during a running focus session.
            </div>
          </div>
          <Toggle on={focusPrefs.study_focus} onChange={() => onUpdateFocusPrefs({ study_focus: !focusPrefs.study_focus })} label="Study Focus" />
        </div>

        <div className="flex items-center justify-between gap-6 py-3 border-t border-ink/8">
          <div>
            <div className="font-sans text-[13px] font-semibold">Hold notifications during a session</div>
            <div className="font-sans text-[11.5px] text-ink-soft mt-0.5">
              Held notifications still show once you end the session — nothing is lost, just delayed.
            </div>
          </div>
          <Toggle
            on={focusPrefs.hold_notifications}
            onChange={() => onUpdateFocusPrefs({ hold_notifications: !focusPrefs.hold_notifications })}
            label="Hold notifications during a session"
          />
        </div>

        <div className="py-3 border-t border-ink/8">
          <div className="font-sans text-[13px] font-semibold mb-1">Always allowed</div>
          <div className="font-sans text-[11.5px] text-ink-soft mb-3">These break through, session or not.</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {focusPrefs.allow_list.map((v) => (
              <span key={v} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full border border-ink/14 bg-surface font-sans text-[11px]">
                {v}
                <button onClick={() => removeAllowed(v)} aria-label={`Remove ${v}`} className="p-0.5 text-ink-faint hover:text-danger">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newAllow}
              onChange={(e) => setNewAllow(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllowed(); } }}
              placeholder="Add a name or category…"
              className="flex-grow px-3 py-1.5 rounded-sm border border-ink/18 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button onClick={addAllowed} disabled={!newAllow.trim()} className={BTN}>
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      </section>

      <SectionRule>Add a device</SectionRule>
      <div className="flex gap-2 flex-wrap">
        <a href="/welcome" className={BTN}>
          <Puzzle className="w-3.5 h-3.5" /> Get the extension
        </a>
      </div>
      <p className="font-sans text-[10.5px] text-ink-faint leading-relaxed max-w-[54ch]">
        <Eyebrow>Preview</Eyebrow> — phone pairing isn&apos;t wired up in this build; the panel above shows the shape
        of that feature. The Focus Bridge settings above are real and saved to your account.
      </p>
    </div>
  );
}
