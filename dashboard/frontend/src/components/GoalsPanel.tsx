import React, { useState } from 'react';
import { Plus, Minus, Trash2, Target } from 'lucide-react';
import { Goal } from '../types';
import { Card, Button, Input, EmptyState, Meter } from '../screens/ui';

interface Props {
  goals: Goal[];
  onAdd: (body: { title: string; metric: string; target_value: number; deadline: string | null }) => void;
  onIncrement: (id: number, delta: number) => void;
  onDelete: (id: number) => void;
}

export default function GoalsPanel({ goals, onAdd, onIncrement, onDelete }: Props) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState({ title: '', metric: 'steps', target_value: 5, deadline: '' });

  const submit = () => {
    if (!draft.title.trim()) return;
    onAdd({
      title: draft.title.trim(),
      metric: draft.metric.trim() || 'steps',
      target_value: Number(draft.target_value) || 1,
      deadline: draft.deadline || null,
    });
    setDraft({ title: '', metric: 'steps', target_value: 5, deadline: '' });
    setShow(false);
  };

  return (
    <div>
      {/* No section header here — this always renders inside a Collapsible
          that already shows the "Goals · N" title, so a second one would
          just repeat itself. Only the add action belongs at this level. */}
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShow((s) => !s)}>
          <Plus className="w-3 h-3" /> Goal
        </Button>
      </div>

      {show && (
        <Card variant="secondary" className="p-4 mb-4 space-y-3">
          <Input
            placeholder="Goal title (e.g. Finish thesis chapter)"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="font-sans text-[10px] uppercase font-semibold tracking-wider flex flex-col gap-1">
              Target
              <Input type="number" min={1} value={draft.target_value} onChange={(e) => setDraft({ ...draft, target_value: Number(e.target.value) })} />
            </label>
            <label className="font-sans text-[10px] uppercase font-semibold tracking-wider flex flex-col gap-1">
              Unit
              <Input className="normal-case" value={draft.metric} onChange={(e) => setDraft({ ...draft, metric: e.target.value })} />
            </label>
            <label className="font-sans text-[10px] uppercase font-semibold tracking-wider flex flex-col gap-1">
              Due
              <Input type="date" className="normal-case" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShow(false)}>Cancel</Button>
            <Button variant="primary" onClick={submit} disabled={!draft.title.trim()}>Add goal</Button>
          </div>
        </Card>
      )}

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set one to track the bigger picture behind your tasks." />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const pct = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;
            return (
              <Card key={g.id} variant="secondary" className="p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-serif text-lg font-semibold tracking-tight leading-tight">{g.title}</h3>
                  <button onClick={() => onDelete(g.id)} title="Delete" className="p-1 rounded-sm border border-ink/18 hover:border-danger hover:text-danger transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Meter value={pct} className="flex-grow" />
                  <span className="font-sans text-xs font-semibold tabular-nums whitespace-nowrap">
                    {g.current_value}/{g.target_value} {g.metric}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-sans text-[10px] uppercase tracking-wide text-ink-faint">
                    {g.linked_total > 0 ? `${g.linked_done}/${g.linked_total} linked tasks done` : 'No linked tasks'}
                    {g.deadline && ` · by ${new Date(g.deadline).toLocaleDateString()}`}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onIncrement(g.id, -1)} className="p-1.5 rounded-sm border border-ink/14 hover:bg-accent/10 hover:text-accent-strong transition-colors" aria-label="Decrement">
                      <Minus className="w-3 h-3" />
                    </button>
                    <button onClick={() => onIncrement(g.id, 1)} className="p-1.5 rounded-sm border border-ink/14 hover:bg-accent/10 hover:text-accent-strong transition-colors" aria-label="Increment">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
