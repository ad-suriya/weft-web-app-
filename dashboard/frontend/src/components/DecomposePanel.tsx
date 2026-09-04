import React, { useMemo, useState } from 'react';
import { GitBranch, Loader2, Sparkles, Check, X } from 'lucide-react';
import { DecompositionPlan, Task, Urgency } from '../types';

interface Props {
  onGenerate: (goal: string) => Promise<DecompositionPlan>;
  onCommit: (plan: DecompositionPlan) => Promise<Task[]>;
}

const PRIORITY_COLOR: Record<Urgency, string> = { HIGH: '#C2632F', MEDIUM: '#23271F', LOW: '#6B7280' };
const PX_PER_HOUR = 28;

// A block on the timeline: a stable key (the AI's draft id pre-commit, or
// the real task id once persisted), how long it runs, and which other keys
// in this same batch must finish first.
interface TimelineBlock {
  key: string;
  title: string;
  hours: number;
  priority: Urgency;
  dependsOn: string[];
}

// Schedules each block to start right after the latest of its dependencies
// finishes (0 if it has none) — turns the dependency list into an actual
// execution-graph timeline instead of just an ordered checklist.
function schedule(blocks: TimelineBlock[]): Map<string, { start: number; end: number }> {
  const byKey = new Map(blocks.map((b) => [b.key, b]));
  const result = new Map<string, { start: number; end: number }>();
  const resolving = new Set<string>();

  function endOf(key: string): number {
    const cached = result.get(key);
    if (cached) return cached.end;
    const block = byKey.get(key);
    if (!block || resolving.has(key)) return 0; // missing or cyclic — don't hang
    resolving.add(key);
    const depEnds = block.dependsOn.filter((d) => d !== key && byKey.has(d)).map(endOf);
    const start = depEnds.length ? Math.max(...depEnds) : 0;
    const end = start + block.hours;
    result.set(key, { start, end });
    resolving.delete(key);
    return end;
  }

  blocks.forEach((b) => endOf(b.key));
  return result;
}

function Timeline({ blocks }: { blocks: TimelineBlock[] }) {
  const times = useMemo(() => schedule(blocks), [blocks]);
  const totalHours = Math.max(1, ...blocks.map((b) => times.get(b.key)?.end ?? b.hours));
  const rows = [...blocks].sort((a, b) => (times.get(a.key)?.start ?? 0) - (times.get(b.key)?.start ?? 0));
  const titleByKey = new Map(blocks.map((b) => [b.key, b.title]));

  return (
    <div className="overflow-x-auto">
      <div style={{ width: Math.max(480, (totalHours + 1) * PX_PER_HOUR) }}>
        <div className="relative h-5 border-b border-[#23271F]/14 mb-2">
          {Array.from({ length: Math.ceil(totalHours) + 1 }, (_, h) => (
            <span key={h} className="absolute top-0 font-sans text-[9px] opacity-40"
              style={{ left: h * PX_PER_HOUR }}>{h}h</span>
          ))}
        </div>
        <div className="space-y-1.5">
          {rows.map((b) => {
            const t = times.get(b.key) ?? { start: 0, end: b.hours };
            const deps = b.dependsOn.filter((d) => titleByKey.has(d) && d !== b.key);
            return (
              <div key={b.key} className="relative h-9">
                <div
                  className="absolute h-9 text-white px-2.5 flex items-center text-[11px] font-sans font-bold truncate shadow-[0_3px_12px_rgba(35,39,31,0.10)]"
                  style={{
                    left: t.start * PX_PER_HOUR,
                    width: Math.max(b.hours * PX_PER_HOUR, 60),
                    backgroundColor: PRIORITY_COLOR[b.priority],
                  }}
                  title={deps.length ? `After: ${deps.map((d) => titleByKey.get(d)).join(', ')}` : undefined}
                >
                  {b.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DecomposePanel({ onGenerate, onCommit }: Props) {
  const [goal, setGoal] = useState('');
  const [draft, setDraft] = useState<DecompositionPlan | null>(null);
  const [created, setCreated] = useState<Task[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!goal.trim()) return;
    setGenerating(true);
    setError('');
    setCreated(null);
    try {
      setDraft(await onGenerate(goal.trim()));
    } catch (err: any) {
      setError(err.message || 'Could not break this goal down.');
    } finally {
      setGenerating(false);
    }
  };

  const commit = async () => {
    if (!draft) return;
    setCommitting(true);
    setError('');
    try {
      setCreated(await onCommit(draft));
    } catch (err: any) {
      setError(err.message || 'Could not create the tasks.');
    } finally {
      setCommitting(false);
    }
  };

  const draftBlocks: TimelineBlock[] = (draft?.subtasks ?? []).map((s) => ({
    key: s.id, title: s.title, hours: s.estimated_hours, priority: s.priority, dependsOn: s.depends_on,
  }));

  // After commit, draft.subtasks (local ids) and created (real tasks, same
  // order) line up 1:1 — pair them so the timeline can show real task ids.
  const createdBlocks: TimelineBlock[] = created && draft
    ? created.map((task, i) => ({
        key: String(task.id),
        title: draft.subtasks[i]?.title ?? task.task_name,
        hours: task.estimated_minutes / 60,
        priority: task.urgency,
        dependsOn: (task.dependencies ?? []).map(String),
      }))
    : [];

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-[#23271F]/14 pb-2 mb-4">
        <GitBranch className="w-4 h-4" />
        <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">Task Breakdown</span>
        <div className="h-[1px] flex-grow bg-[#2C312A] opacity-20" />
      </div>

      <div className="bg-white border border-[#23271F]/14 p-4 mb-4 space-y-3 shadow-[0_4px_16px_rgba(35,39,31,0.06)]">
        <label className="font-sans text-[10px] uppercase font-bold tracking-wider block opacity-70">
          Describe a big, vague goal — AI breaks it into concrete subtasks with dependencies
        </label>
        <textarea
          className="w-full p-2 border border-[#23271F]/18 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-[#2F7A64] resize-none"
          rows={2}
          placeholder="e.g. Build hackathon app in 3 days"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={generating}
        />
        <div className="flex justify-end">
          <button onClick={generate} disabled={generating || !goal.trim()}
            className="font-sans text-[11px] font-bold uppercase tracking-wider px-4 py-2 bg-[#2C312A] text-white hover:bg-[#3A3F37] disabled:opacity-40 flex items-center gap-2">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Break It Down
          </button>
        </div>
        {error && <p className="font-sans text-[11px] font-bold uppercase text-[#C2632F]">{error}</p>}
      </div>

      {draft && !created && (
        <div className="bg-[#F1F3EF] border border-[#23271F]/14 p-4 mb-4 space-y-4 shadow-[0_8px_22px_-8px_rgba(194,99,47,0.40)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight truncate">{draft.goal}</h3>
            <span className="font-sans text-[9px] font-bold px-2 py-1 bg-[#2C312A] text-white uppercase tracking-wider shrink-0">
              {draft.subtasks.length} subtasks
            </span>
          </div>

          <Timeline blocks={draftBlocks} />

          <div className="space-y-1.5">
            {draft.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2 bg-white border border-[#23271F]/12 px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLOR[s.priority] }} />
                <span className="font-sans text-sm flex-grow truncate">{s.title}</span>
                <span className="font-sans text-[9px] font-bold uppercase opacity-50 shrink-0">{s.priority} · {s.estimated_hours}h</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setDraft(null)} className="font-sans text-[10px] uppercase font-bold tracking-wider px-3 py-2 flex items-center gap-1">
              <X className="w-3 h-3" /> Discard
            </button>
            <button onClick={commit} disabled={committing} className="font-sans text-[10px] uppercase font-bold tracking-wider px-3 py-2 bg-[#2F7A64] text-white disabled:opacity-40 flex items-center gap-1">
              {committing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Create Tasks
            </button>
          </div>
        </div>
      )}

      {created && (
        <div className="bg-white border border-[#2F7A64] p-4 space-y-3 shadow-[0_8px_22px_-8px_rgba(47,122,100,0.35)]">
          <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#2F7A64]">
            Created {created.length} task{created.length === 1 ? '' : 's'} — execution graph below
          </p>
          <Timeline blocks={createdBlocks} />
        </div>
      )}

      {!draft && !created && (
        <div className="font-sans text-sm opacity-50 italic py-10 text-center border border-dashed border-[#23271F]/18">
          Describe a goal above and AI will turn it into a concrete, dependency-ordered timeline.
        </div>
      )}
    </div>
  );
}
