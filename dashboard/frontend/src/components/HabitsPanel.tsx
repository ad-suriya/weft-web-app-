import React, { useState } from 'react';
import { Plus, Trash2, Flame, Check, Repeat } from 'lucide-react';
import { Habit } from '../types';

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
      <div className="flex items-center gap-3 border-b border-[#23271F]/14 pb-2 mb-4">
        <Repeat className="w-4 h-4" />
        <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">Habits</span>
        <div className="h-[1px] flex-grow bg-[#2C312A] opacity-20" />
        <button onClick={() => setShow((s) => !s)} className="font-sans text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 px-2 py-1 border border-[#23271F]/14 hover:bg-[#2C312A] hover:text-white transition-colors">
          <Plus className="w-3 h-3" /> Habit
        </button>
      </div>

      {show && (
        <div className="bg-white border border-[#23271F]/14 p-4 mb-4 space-y-3 shadow-[0_4px_16px_rgba(35,39,31,0.06)]">
          <input className="w-full p-2 border border-[#23271F]/18 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-[#2F7A64]"
            placeholder="Habit (e.g. Read 20 pages)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <div className="flex items-center justify-between">
            <select className="p-2 border border-[#23271F]/18 font-sans text-xs" value={draft.cadence} onChange={(e) => setDraft({ ...draft, cadence: e.target.value as 'DAILY' | 'WEEKLY' })}>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShow(false)} className="font-sans text-[10px] uppercase font-bold tracking-wider px-3 py-2">Cancel</button>
              <button onClick={submit} disabled={!draft.name.trim()} className="font-sans text-[10px] uppercase font-bold tracking-wider px-3 py-2 bg-[#2C312A] text-white disabled:opacity-40">Add habit</button>
            </div>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="font-sans text-sm opacity-50 italic py-10 text-center border border-dashed border-[#23271F]/18">
          No habits yet. Build momentum with small daily wins.
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((h) => (
            <div key={h.id} className="bg-white border border-[#23271F]/14 p-4 flex items-center gap-4 shadow-[0_4px_16px_rgba(35,39,31,0.06)]">
              <button
                onClick={() => onCheck(h.id)}
                className={`w-10 h-10 shrink-0 border-2 flex items-center justify-center transition-colors ${h.done_today ? 'bg-[#2F7A64] border-[#2F7A64] text-white' : 'border-[#23271F]/14 hover:bg-[#F1F3EF]'}`}
                aria-label={h.done_today ? 'Mark not done' : 'Mark done'}
              >
                {h.done_today && <Check className="w-5 h-5" />}
              </button>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-lg font-bold tracking-tight ${h.done_today ? '' : ''}`}>{h.name}</h3>
                  <span className="font-sans text-[9px] uppercase font-bold opacity-40">{h.cadence}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {h.last7.map((d) => (
                    <div key={d.date} title={d.date} className={`w-5 h-5 flex items-center justify-center font-sans text-[8px] font-bold ${d.done ? 'bg-[#2F7A64] text-white' : 'bg-[#F1F3EF] border border-[#23271F]/12 opacity-60'}`}>
                      {WEEKDAY(d.date)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 font-sans font-semibold text-lg" title={`${h.streak} ${h.cadence === 'WEEKLY' ? 'week' : 'day'} streak`}>
                <Flame className={`w-5 h-5 ${h.streak > 0 ? 'text-[#C2632F]' : 'opacity-30'}`} />
                {h.streak}
              </div>
              <button onClick={() => onDelete(h.id)} title="Delete" className="p-1 border border-[#23271F]/18 hover:border-[#C2632F] hover:text-[#C2632F] transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
