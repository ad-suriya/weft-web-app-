import React from 'react';
import { Timer, CheckCircle2 } from 'lucide-react';
import { Session, Task } from '../types';
import { CARD, ScreenHead, Eyebrow } from './ui';
import { fmtClock, dayLabel, fmtDuration } from './format';

interface Props {
  sessions: Session[];
  tasks: Task[];
}

type Entry =
  | { kind: 'session'; at: number; session: Session }
  | { kind: 'done'; at: number; task: Task };

export default function ActivityScreen({ sessions, tasks }: Props) {
  const entries: Entry[] = React.useMemo(() => {
    const out: Entry[] = [];
    for (const s of sessions) {
      out.push({ kind: 'session', at: new Date(s.start_time).getTime(), session: s });
    }
    for (const t of tasks) {
      if (t.status === 'COMPLETED') out.push({ kind: 'done', at: new Date(t.updated_at).getTime(), task: t });
    }
    return out.sort((a, b) => b.at - a.at);
  }, [sessions, tasks]);

  const groups = React.useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const label = dayLabel(new Date(e.at).toISOString());
      const arr = map.get(label) ?? [];
      arr.push(e);
      map.set(label, arr);
    }
    return Array.from(map, ([label, items]) => ({ label, items }));
  }, [entries]);

  return (
    <div className="flex flex-col gap-5">
      <ScreenHead title="Activity">
        Work sessions and what you moved through — what you did, not how long a screen was lit.
      </ScreenHead>

      {entries.length === 0 ? (
        <div className={`${CARD} shadow-none border-dashed py-12 text-center font-sans text-sm text-[#8C9184] italic`}>
          No sessions yet. Start a focus session from Today and it&apos;ll show up here.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(({ label, items }) => (
            <section key={label} className={`${CARD} p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <Eyebrow tone="ink">{label}</Eyebrow>
                <div className="h-px flex-grow bg-[#23271F]/10" />
              </div>
              <div className="flex flex-col">
                {items.map((e, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[92px_1fr] gap-4 py-3.5 border-t border-[#23271F]/8 first:border-t-0"
                  >
                    <span className="font-mono text-[11.5px] text-[#64695D] pt-0.5">
                      {e.kind === 'session'
                        ? `${fmtClock(e.session.start_time)}${e.session.end_time ? ` → ${fmtClock(e.session.end_time)}` : ' → now'}`
                        : fmtClock(e.task.updated_at)}
                    </span>
                    {e.kind === 'session' ? (
                      <div>
                        <span className="font-sans text-[12px] font-semibold uppercase tracking-wider flex items-center gap-2">
                          <Timer className="w-3.5 h-3.5 text-[#2F7A64]" />
                          {e.session.description || 'Focus session'}
                        </span>
                        <p className="font-sans text-[11.5px] text-[#64695D] mt-1">
                          {fmtDuration(e.session.duration_minutes)}
                          {e.session.is_paused && !e.session.end_time ? ' · paused' : ''}
                          {e.session.total_break_minutes > 0 ? ` · ${fmtDuration(e.session.total_break_minutes)} on break` : ''}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="font-sans text-[12px] font-semibold uppercase tracking-wider flex items-center gap-2 text-[#245E4E]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </span>
                        <p className="font-sans text-[12.5px] mt-1">{e.task.task_name}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
