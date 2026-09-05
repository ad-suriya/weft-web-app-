import React, { useState } from 'react';
import { Plus, Trash2, Flame, Check, Repeat } from 'lucide-react';
import { Habit } from '../types';
import { Card, Button, Input, EmptyState } from '../screens/ui';

interface Props {
  habits: Habit[];
  onAdd: (name: string, cadence: 'DAILY' | 'WEEKLY') => void;
  onCheck: (id: number) => void;
  onDelete: (id: number) => void;
}

const WEEKDAY = (iso: string) => new Date(iso).toLocaleDateString([], { weekday: 'narrow' });

export default function HabitsPanel({ habits, onAdd, onCheck, onDelete }: Props) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState<{ name: string; cadence: 'DAILY' | 'WEEKLY' }>({ name: '', cadence: 'DAILY' });

  const submit = () => {
    if (!draft.name.trim()) return;
    onAdd(draft.name.trim(), draft.cadence);
    setDraft({ name: '', cadence: 'DAILY' });
    setShow(false);
  };

  return (
    <div>
      {/* No section header — always inside a Collapsible that already shows
          "Habits · N". Only the add action belongs here. */}
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShow((s) => !s)}>
          <Plus className="w-3 h-3" /> Habit
        </Button>
      </div>

      {show && (
        <Card variant="secondary" className="p-4 mb-4 space-y-3">
          <Input placeholder="Habit (e.g. Read 20 pages)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <div className="flex items-center justify-between">
            <select
              className="p-2.5 rounded-md border border-ink/18 font-sans text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
              value={draft.cadence}
              onChange={(e) => setDraft({ ...draft, cadence: e.target.value as 'DAILY' | 'WEEKLY' })}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShow(false)}>Cancel</Button>
              <Button variant="primary" onClick={submit} disabled={!draft.name.trim()}>Add habit</Button>
            </div>
          </div>
        </Card>
      )}

      {habits.length === 0 ? (
        <EmptyState icon={Repeat} title="No habits yet" description="Build momentum with small daily wins." />
      ) : (
        <div className="space-y-3">
          {habits.map((h) => (
            <Card key={h.id} variant="secondary" className="p-4 flex items-center gap-4">
              <button
                onClick={() => onCheck(h.id)}
                className={`w-10 h-10 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${h.done_today ? 'bg-accent border-accent text-inverse' : 'border-ink/14 hover:bg-background'}`}
                aria-label={h.done_today ? 'Mark not done' : 'Mark done'}
              >
                {h.done_today && <Check className="w-5 h-5" />}
              </button>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-semibold tracking-tight">{h.name}</h3>
                  <span className="font-sans text-[9px] uppercase font-semibold text-ink-faint">{h.cadence}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {h.last7.map((d) => (
                    <div
                      key={d.date}
                      title={d.date}
                      className={`w-5 h-5 rounded-sm flex items-center justify-center font-sans text-[8px] font-bold ${d.done ? 'bg-accent text-inverse' : 'bg-background border border-ink/12 text-ink-faint'}`}
                    >
                      {WEEKDAY(d.date)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 font-sans font-semibold text-lg" title={`${h.streak} ${h.cadence === 'WEEKLY' ? 'week' : 'day'} streak`}>
                <Flame className={`w-5 h-5 ${h.streak > 0 ? 'text-danger' : 'text-ink-faint'}`} />
                {h.streak}
              </div>
              <button onClick={() => onDelete(h.id)} title="Delete" className="p-1 rounded-sm border border-ink/18 hover:border-danger hover:text-danger transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
