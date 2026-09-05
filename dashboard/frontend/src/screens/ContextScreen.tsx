import React, { useEffect, useState } from 'react';
import { Layers, Link2, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import { Goal, MemoryFact, Reference, Task } from '../types';
import MemoryPanel from '../components/MemoryPanel';
import { CARD, BTN_SM, ScreenHead, SectionRule, Eyebrow, Collapsible, Button, Input, EmptyState, Skeleton } from './ui';
import { fmtDeadline, fmtDuration, relTime } from './format';

interface Props {
  task: Task | null;
  goals: Goal[];
  tasks: Task[];
  onGoMyWork: () => void;
  memoryFacts: MemoryFact[];
  onSummarizeMemory: () => Promise<void>;
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3.5 py-3 border-b border-ink/8 last:border-b-0 text-[12.5px]">
      <Eyebrow className="pt-0.5">{k}</Eyebrow>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ReferencesCard({ task }: { task: Task }) {
  const [refs, setRefs] = useState<Reference[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', url: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRefs(null);
    api.listReferences(task.id).then((r) => { if (!cancelled) setRefs(r); }).catch(() => { if (!cancelled) setRefs([]); });
    return () => { cancelled = true; };
  }, [task.id]);

  const submit = async () => {
    if (!draft.title.trim()) return;
    setBusy(true);
    try {
      const created = await api.createReference({ title: draft.title.trim(), url: draft.url.trim(), task_id: task.id });
      setRefs((prev) => [created, ...(prev ?? [])]);
      setDraft({ title: '', url: '' });
      setAdding(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setRefs((prev) => (prev ?? []).filter((r) => r.id !== id));
    api.deleteReference(id).catch(() => {});
  };

  return (
    <section className={`${CARD} p-5`}>
      <div className="flex items-center gap-3 mb-4">
        <Eyebrow tone="ink">References &amp; links</Eyebrow>
        <div className="h-px flex-grow bg-ink/10" />
        <button onClick={() => setAdding((s) => !s)} className={BTN_SM}>
          <Plus className="w-3 h-3" /> Save reference
        </button>
      </div>

      {adding && (
        <div className="flex flex-col gap-2 mb-4 p-3 rounded-md border border-ink/12 bg-background">
          <Input
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="What is this? (e.g. Chomsky normal form — Wikipedia)"
          />
          <Input
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            placeholder="URL (optional)"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" variant="primary" onClick={submit} disabled={!draft.title.trim() || busy} loading={busy}>
              {!busy && <Plus className="w-3 h-3" />} Save
            </Button>
          </div>
        </div>
      )}

      {refs === null ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : refs.length === 0 ? (
        <>
          <p className="font-sans text-[12.5px] text-ink-soft leading-relaxed">
            Nothing captured for this step yet. Save a link above, or the browser extension will save one here when
            you hit <b className="text-ink">Save Reference</b> on a page.
          </p>
          <p className="font-sans text-[10.5px] text-ink-faint mt-3 leading-relaxed max-w-[52ch]">
            This is not browsing history. Only what you (or the extension, on your action) explicitly save shows up
            here, scoped to this one work item.
          </p>
        </>
      ) : (
        <ul className="flex flex-col gap-2">
          {refs.map((r) => (
            <li key={r.id} className="flex items-start gap-2.5 py-2 border-t border-ink/8 first:border-t-0">
              <Link2 className="w-3.5 h-3.5 text-ink-faint mt-0.5 shrink-0" />
              <div className="min-w-0 flex-grow">
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" className="font-sans text-[13px] font-semibold text-accent-strong hover:underline break-words">
                    {r.title}
                  </a>
                ) : (
                  <span className="font-sans text-[13px] font-semibold break-words">{r.title}</span>
                )}
                <div className="font-sans text-[10.5px] text-ink-faint mt-0.5">Saved {relTime(r.created_at)}</div>
              </div>
              <button onClick={() => remove(r.id)} title="Remove" className="p-1 text-ink-faint hover:text-danger transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ContextScreen({ task, goals, tasks, onGoMyWork, memoryFacts, onSummarizeMemory }: Props) {
  if (!task) {
    return (
      <div className="flex flex-col gap-5">
        <ScreenHead title="Context">
          The exact working set for the step you&apos;re on — the task, its next move, and what it depends on — kept
          together so a resume drops you back into place.
        </ScreenHead>
        <EmptyState
          icon={Layers}
          title="Nothing in focus"
          description="Pick up a task in My Work to see its context."
          action={<Button variant="primary" onClick={onGoMyWork}>Go to My Work</Button>}
        />
        <Collapsible title={`What WEFT has learned${memoryFacts.length ? ` · ${memoryFacts.length}` : ''}`}>
          <MemoryPanel facts={memoryFacts} onSummarize={onSummarizeMemory} />
        </Collapsible>
      </div>
    );
  }

  const goal = task.goal_id != null ? goals.find((g) => g.id === task.goal_id) : undefined;
  const deps = (task.dependencies ?? [])
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is Task => Boolean(t));

  return (
    <div className="flex flex-col gap-5">
      <ScreenHead title="Context">
        The exact working set for the step you&apos;re on — kept together so a resume drops you back into place.
        Captured for the active work item only.
      </ScreenHead>

      <section className={`${CARD} p-5`}>
        <SectionRule>
          {task.task_name} → {task.next_micro_step || 'first step'}
        </SectionRule>

        <div className="flex flex-col">
          <Row k="Next step">
            <span className="font-mono text-[11.5px]">{task.next_micro_step || '—'}</span>
          </Row>
          <Row k="Status">{task.status.replace('_', ' ').toLowerCase()}</Row>
          <Row k="Urgency">{task.urgency.toLowerCase()}</Row>
          <Row k="Effort">
            ~{fmtDuration(task.estimated_minutes)} planned · {fmtDuration(task.completed_minutes ?? 0)} logged
          </Row>
          {task.deadline && <Row k="Deadline">{fmtDeadline(task.deadline)}</Row>}
          {goal && (
            <Row k="Goal">
              <span className="font-semibold">{goal.title}</span>{' '}
              <span className="text-ink-soft">
                — {goal.current_value}/{goal.target_value} {goal.metric}
              </span>
            </Row>
          )}
          {deps.length > 0 && (
            <Row k="Depends on">
              <ul className="flex flex-col gap-1.5">
                {deps.map((d) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'COMPLETED' ? 'bg-accent' : 'bg-ink-faint'}`} />
                    <span className={d.status === 'COMPLETED' ? 'line-through text-ink-faint' : ''}>{d.task_name}</span>
                  </li>
                ))}
              </ul>
            </Row>
          )}
        </div>
      </section>

      <ReferencesCard task={task} />

      <Collapsible title={`What WEFT has learned${memoryFacts.length ? ` · ${memoryFacts.length}` : ''}`}>
        <MemoryPanel facts={memoryFacts} onSummarize={onSummarizeMemory} />
      </Collapsible>
    </div>
  );
}
