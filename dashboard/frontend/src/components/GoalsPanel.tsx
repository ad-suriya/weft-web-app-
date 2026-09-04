import React, { useState } from 'react';
import { Plus, Minus, Trash2, Target } from 'lucide-react';
import { Goal } from '../types';

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
      <div className="flex items-center gap-3 border-b border-[#23271F]/14 pb-2 mb-4">
        <Target className="w-4 h-4" />
        <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">Goals</span>
        <div className="h-[1px] flex-grow bg-[#2C312A] opacity-20" />
        <button onClick={() => setShow((s) => !s)} className="font-sans text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 px-2 py-1 border border-[#23271F]/14 hover:bg-[#2C312A] hover:text-white transition-colors">
          <Plus className="w-3 h-3" /> Goal
        </button>
      </div>

      {show && (
        <div className="bg-white border border-[#23271F]/14 p-4 mb-4 space-y-3 shadow-[0_4px_16px_rgba(35,39,31,0.06)]">
          <input className="w-full p-2 border border-[#23271F]/18 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-[#2F7A64]"
            placeholder="Goal title (e.g. Finish thesis chapter)" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <label className="font-sans text-[10px] uppercase font-bold tracking-wider flex flex-col gap-1">Target
              <input type="number" min={1} className="p-2 border border-[#23271F]/18 font-sans text-xs" value={draft.target_value} onChange={(e) => setDraft({ ...draft, target_value: Number(e.target.value) })} />
            </label>
            <label className="font-sans text-[10px] uppercase font-bold tracking-wider flex flex-col gap-1">Unit
              <input className="p-2 border border-[#23271F]/18 font-sans text-xs normal-case" value={draft.metric} onChange={(e) => setDraft({ ...draft, metric: e.target.value })} />
            </label>
            <label className="font-sans text-[10px] uppercase font-bold tracking-wider flex flex-col gap-1">Due
              <input type="date" className="p-2 border border-[#23271F]/18 font-sans text-xs normal-case" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShow(false)} className="font-sans text-[10px] uppercase font-bold tracking-wider px-3 py-2">Cancel</button>
            <button onClick={submit} disabled={!draft.title.trim()} className="font-sans text-[10px] uppercase font-bold tracking-wider px-3 py-2 bg-[#2C312A] text-white disabled:opacity-40">Add goal</button>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="font-sans text-sm opacity-50 italic py-10 text-center border border-dashed border-[#23271F]/18">
          No goals yet. Set one to track the bigger picture behind your tasks.
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => {
            const pct = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;
            const complete = g.current_value >= g.target_value;
            return (
              <div key={g.id} className="bg-white border border-[#23271F]/14 p-4 shadow-[0_4px_16px_rgba(35,39,31,0.06)]">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-lg font-bold tracking-tight leading-tight">{g.title}</h3>
                  <button onClick={() => onDelete(g.id)} title="Delete" className="p-1 border border-[#23271F]/18 hover:border-[#C2632F] hover:text-[#C2632F] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-grow h-3 bg-[#F1F3EF] border border-[#23271F]/14 overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: complete ? '#2F7A64' : '#C2632F' }} />
                  </div>
                  <span className="font-sans text-xs font-bold tabular-nums whitespace-nowrap">{g.current_value}/{g.target_value} {g.metric}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-sans text-[10px] uppercase tracking-wide opacity-60">
                    {g.linked_total > 0 ? `${g.linked_done}/${g.linked_total} linked tasks done` : 'No linked tasks'}
                    {g.deadline && ` · by ${new Date(g.deadline).toLocaleDateString()}`}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onIncrement(g.id, -1)} className="p-1.5 border border-[#23271F]/14 hover:bg-[#2C312A] hover:text-white transition-colors" aria-label="Decrement"><Minus className="w-3 h-3" /></button>
                    <button onClick={() => onIncrement(g.id, 1)} className="p-1.5 border border-[#23271F]/14 hover:bg-[#2C312A] hover:text-white transition-colors" aria-label="Increment"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
