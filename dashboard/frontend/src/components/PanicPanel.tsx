import React from 'react';
import { motion } from 'motion/react';
import { AlertOctagon, Check } from 'lucide-react';
import { Task } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Props {
  task: Task;
  onMarkDone: (task: Task) => void;
}

const fmtDeadline = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// Panic Mode per spec: near-deadline + large backlog -> show exactly one
// task and suppress everything else. No board, no list, no choice to make.
export default function PanicPanel({ task, onMarkDone }: Props) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-danger text-inverse rounded-2xl p-8 shadow-popover flex flex-col items-center text-center gap-4"
    >
      <AlertOctagon className="w-8 h-8" />
      <span className="font-sans text-[10px] uppercase tracking-wider font-semibold opacity-80">
        Only this matters right now
      </span>
      <h2 className="font-serif text-3xl font-semibold italic tracking-tight leading-tight">{task.task_name}</h2>
      {task.deadline && (
        <p className="font-sans text-xs uppercase tracking-wider opacity-80">Due {fmtDeadline(task.deadline)}</p>
      )}
      <div className="bg-inverse/10 rounded-lg px-5 py-4 w-full max-w-md">
        <span className="font-sans text-[9px] font-semibold uppercase block mb-1 opacity-70">Do this now</span>
        <p className="font-sans text-sm leading-snug">{task.next_micro_step || 'Pick the smallest next action and start.'}</p>
      </div>
      <button
        onClick={() => onMarkDone(task)}
        className="font-sans text-[11px] font-semibold uppercase tracking-wider px-5 py-3 rounded-md bg-inverse text-danger hover:bg-surface-elevated hover:text-inverse transition-colors flex items-center gap-2"
      >
        <Check className="w-3.5 h-3.5" /> Mark Done
      </button>
    </motion.div>
  );
}
