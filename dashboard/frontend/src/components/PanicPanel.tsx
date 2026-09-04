import React from 'react';
import { AlertOctagon, Check } from 'lucide-react';
import { Task } from '../types';

interface Props {
  task: Task;
  onMarkDone: (task: Task) => void;
}

const fmtDeadline = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// Panic Mode per spec: near-deadline + large backlog -> show exactly one
// task and suppress everything else. No board, no list, no choice to make.
export default function PanicPanel({ task, onMarkDone }: Props) {
  return (
    <div className="bg-[#C2632F] text-white p-8 shadow-[0_16px_40px_-14px_rgba(35,39,31,0.24)] flex flex-col items-center text-center gap-4">
      <AlertOctagon className="w-8 h-8" />
      <span className="font-sans text-[10px] uppercase tracking-wider font-semibold opacity-80">
        Only this matters right now
      </span>
      <h2 className="text-3xl font-semibold italic tracking-tight leading-tight">{task.task_name}</h2>
      {task.deadline && (
        <p className="font-sans text-xs uppercase tracking-wider opacity-80">Due {fmtDeadline(task.deadline)}</p>
      )}
      <div className="bg-white/10 px-5 py-4 w-full max-w-md">
        <span className="font-sans text-[9px] font-bold uppercase block mb-1 opacity-70">Do this now</span>
        <p className="font-sans text-sm leading-snug">{task.next_micro_step || 'Pick the smallest next action and start.'}</p>
      </div>
      <button onClick={() => onMarkDone(task)}
        className="font-sans text-[11px] font-bold uppercase tracking-wider px-5 py-3 bg-white text-[#C2632F] hover:bg-[#2C312A] hover:text-white transition-colors flex items-center gap-2">
        <Check className="w-3.5 h-3.5" /> Mark Done
      </button>
    </div>
  );
}
