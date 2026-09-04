import React from 'react';
import {
  Plus, CalendarDays, Loader2, Crosshair, Check, SkipForward, Trash2, Download, CalendarPlus,
} from 'lucide-react';
import { DecompositionPlan, Goal, Habit, Task, TaskRisk, Urgency } from '../types';
import { api } from '../api';
import GoalsPanel from '../components/GoalsPanel';
import HabitsPanel from '../components/HabitsPanel';
import DecomposePanel from '../components/DecomposePanel';
import { CARD, BTN, BTN_GO, BTN_SM, ScreenHead, SectionRule, Pill, Meter, Collapsible } from './ui';
import { fmtDeadline, fmtDuration, relTime } from './format';

interface NewTaskDraft {
  task_name: string;
  deadline: string;
  estimated_minutes: number;
  urgency: Urgency;
  goal_id: string;
}

interface Props {
  tasks: Task[];
  goals: Goal[];
  taskRisks: Record<number, TaskRisk>;
  atRisk: Set<number>;
  overdue: Set<number>;
  showAdd: boolean;
  setShowAdd: (v: boolean | ((s: boolean) => boolean)) => void;
  newTask: NewTaskDraft;
  setNewTask: (v: NewTaskDraft) => void;
  busy: '' | 'schedule' | 'reschedule';
  onAddTask: () => void;
  onPlanDay: () => void;
  onCycleStatus: (t: Task) => void;
  onStartFocus: (t: Task) => void;
  onSkip: (t: Task) => void;
  onMarkDone: (t: Task) => void;
  onRemove: (id: number) => void;
  onLogHours: (t: Task, hours: number) => void;
  onGcalUrl: (t: Task) => string;
  // Re-homed here from the dropped Goals/Habits/Breakdown nav tabs.
  habits: Habit[];
  onAddGoal: (body: { title: string; metric: string; target_value: number; deadline: string | null }) => void;
  onIncrementGoal: (id: number, delta: number) => void;
  onDeleteGoal: (id: number) => void;
  onAddHabit: (name: string, cadence: 'DAILY' | 'WEEKLY') => void;
  onCheckHabit: (id: number) => void;
  onDeleteHabit: (id: number) => void;
  onDecompose: (goal: string) => Promise<DecompositionPlan>;
  onCommitDecomposition: (plan: DecompositionPlan) => Promise<Task[]>;
}

const RISK_COLOR: Record<TaskRisk['risk_level'], 'green' | 'amber' | 'orange'> = {
  safe: 'green',
  medium: 'amber',
  high: 'orange',
};

function statePill(t: Task) {
  if (t.status === 'IN_PROGRESS') return <Pill tone="green">Active</Pill>;
  if (t.status === 'COMPLETED') return <Pill tone="ink">Done</Pill>;
  return <Pill tone="neutral">Queued</Pill>;
}

export default function MyWorkScreen({
  tasks, goals, taskRisks, atRisk, overdue, showAdd, setShowAdd, newTask, setNewTask, busy,
  onAddTask, onPlanDay, onCycleStatus, onStartFocus, onSkip, onMarkDone, onRemove, onLogHours, onGcalUrl,
  habits, onAddGoal, onIncrementGoal, onDeleteGoal, onAddHabit, onCheckHabit, onDeleteHabit,
  onDecompose, onCommitDecomposition,
}: Props) {
  const active = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const queued = tasks.filter((t) => t.status === 'TODO').length;
  const doneCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  const ordered = [...tasks].sort((a, b) => {
    const rank = (s: Task['status']) => (s === 'IN_PROGRESS' ? 0 : s === 'TODO' ? 1 : 2);
    return rank(a.status) - rank(b.status);
  });

  return (
    <div className="flex flex-col gap-5">
      <ScreenHead title="My Work">
        Every work item carries its own next step, its own progress, and its own resume point.{' '}
        {active} active · {queued} queued · {doneCount} done.
      </ScreenHead>

      <div className="flex items-center gap-3 flex-wrap" data-tour="task-toolbar">
        <button onClick={() => setShowAdd((s) => !s)} className={BTN}>
          <Plus className="w-3.5 h-3.5" /> Add task
        </button>
        <button onClick={onPlanDay} disabled={busy !== '' || tasks.length === 0} className={BTN_GO}>
          {busy === 'schedule' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-3.5 h-3.5" />}
          Plan my day
        </button>
      </div>

      {showAdd && (
        <div className={`${CARD} p-4 space-y-3`}>
          <input
            className="w-full p-2.5 rounded-[8px] border border-[#23271F]/18 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-[#2F7A64]"
            placeholder="Task name"
            value={newTask.task_name}
            onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="font-sans text-[10px] uppercase font-semibold tracking-wider flex flex-col gap-1">
              Deadline
              <input
                type="datetime-local"
                className="p-2 rounded-[8px] border border-[#23271F]/18 font-sans text-xs normal-case"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              />
            </label>
            <label className="font-sans text-[10px] uppercase font-semibold tracking-wider flex flex-col gap-1">
              Est. minutes
              <input
                type="number"
                min={5}
                step={5}
                className="p-2 rounded-[8px] border border-[#23271F]/18 font-sans text-xs"
                value={newTask.estimated_minutes}
                onChange={(e) => setNewTask({ ...newTask, estimated_minutes: Number(e.target.value) })}
              />
            </label>
            <label className="font-sans text-[10px] uppercase font-semibold tracking-wider flex flex-col gap-1">
              Urgency
              <select
                className="p-2 rounded-[8px] border border-[#23271F]/18 font-sans text-xs"
                value={newTask.urgency}
                onChange={(e) => setNewTask({ ...newTask, urgency: e.target.value as Urgency })}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </label>
          </div>
          {goals.length > 0 && (
            <label className="font-sans text-[10px] uppercase font-semibold tracking-wider flex flex-col gap-1">
              Link to goal (optional)
              <select
                className="p-2 rounded-[8px] border border-[#23271F]/18 font-sans text-xs normal-case"
                value={newTask.goal_id}
                onChange={(e) => setNewTask({ ...newTask, goal_id: e.target.value })}
              >
                <option value="">— none —</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className={BTN}>Cancel</button>
            <button onClick={onAddTask} disabled={!newTask.task_name.trim()} className={BTN_GO}>Add task</button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className={`${CARD} shadow-none border-dashed py-12 text-center font-sans text-sm text-[#8C9184] italic`}>
          Your work shows up here once you tell chat what&apos;s on your plate — or add one above.
        </div>
      ) : (
        <SectionRule>{tasks.length} item{tasks.length === 1 ? '' : 's'}</SectionRule>
      )}

      <div className="flex flex-col gap-2.5">
        {ordered.map((t) => {
          const risk = taskRisks[t.id] ?? t.risk ?? null;
          const est = t.estimated_minutes || 0;
          const logged = t.completed_minutes ?? 0;
          const pct = est > 0 ? (logged / est) * 100 : t.status === 'COMPLETED' ? 100 : 0;
          const isDone = t.status === 'COMPLETED';
          return (
            <div key={t.id} className={`${CARD} p-4 ${isDone ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4 flex-wrap">
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-serif text-[1.05rem] font-semibold leading-tight ${isDone ? 'line-through' : ''}`}>
                      {t.task_name}
                    </h3>
                    {overdue.has(t.id) && <Pill tone="orange">Overdue</Pill>}
                    {risk && !isDone && (
                      <Pill tone={RISK_COLOR[risk.risk_level]}>
                        {risk.risk_level} risk · {risk.risk_percent}%
                      </Pill>
                    )}
                  </div>
                  <p className="font-sans text-[11px] text-[#64695D] mt-1">
                    {t.next_micro_step ? `Next: ${t.next_micro_step}` : `~${fmtDuration(est)} of work`}
                    {' · '}updated {relTime(t.updated_at)}
                    {t.deadline ? ` · due ${fmtDeadline(t.deadline)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">{statePill(t)}</div>
              </div>

              <Meter value={pct} className="mt-3" />
              <div className="flex items-center justify-between mt-1.5">
                <span className="font-sans text-[10px] text-[#8C9184]">
                  {fmtDuration(logged)} / {fmtDuration(est)}
                </span>
                {!isDone && (
                  <label className="font-sans text-[9px] uppercase tracking-wide text-[#8C9184] flex items-center gap-1">
                    Logged
                    <input
                      key={`${t.id}-${t.completed_minutes ?? 0}`}
                      type="number"
                      min={0}
                      step={0.5}
                      defaultValue={((t.completed_minutes ?? 0) / 60).toFixed(1)}
                      onBlur={(e) => {
                        const h = Number(e.target.value);
                        if (!Number.isNaN(h)) onLogHours(t, h);
                      }}
                      className="w-14 p-1 rounded-[6px] border border-[#23271F]/18 font-sans text-[11px] normal-case"
                    />
                    h
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-3">
                <button onClick={() => onCycleStatus(t)} className={BTN_SM}>
                  {t.status === 'TODO' ? 'Start' : t.status === 'IN_PROGRESS' ? 'Complete' : 'Reopen'}
                </button>
                {!isDone && (
                  <button
                    onClick={() => onStartFocus(t)}
                    disabled={t.status === 'IN_PROGRESS'}
                    className="inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1.5 rounded-[8px] border border-[#C2632F] text-[#C2632F] hover:bg-[#C2632F] hover:text-white transition-colors disabled:opacity-40"
                  >
                    <Crosshair className="w-3 h-3" /> Focus
                  </button>
                )}
                {!isDone && t.scheduled_start && (
                  <button onClick={() => onSkip(t)} title="Move this task" className={BTN_SM}>
                    <SkipForward className="w-3 h-3" /> Skip
                  </button>
                )}
                {t.status === 'TODO' && (
                  <button onClick={() => onMarkDone(t)} className={BTN_SM} title="Mark done without starting">
                    <Check className="w-3 h-3" /> Done
                  </button>
                )}
                <a href={api.taskIcsUrl(t.id)} title="Download .ics" className={`${BTN_SM} px-2`}>
                  <Download className="w-3.5 h-3.5" />
                </a>
                <a href={onGcalUrl(t)} target="_blank" rel="noreferrer" title="Add to Google Calendar" className={`${BTN_SM} px-2`}>
                  <CalendarPlus className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => onRemove(t.id)}
                  title="Delete"
                  className="ml-auto inline-flex items-center px-2 py-1.5 rounded-[8px] border border-[#23271F]/18 text-[#8C9184] hover:border-[#C2632F] hover:text-[#C2632F] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <SectionRule>More</SectionRule>
        <Collapsible title={`Goals${goals.length ? ` · ${goals.length}` : ''}`}>
          <GoalsPanel goals={goals} onAdd={onAddGoal} onIncrement={onIncrementGoal} onDelete={onDeleteGoal} />
        </Collapsible>
        <Collapsible title={`Habits${habits.length ? ` · ${habits.length}` : ''}`}>
          <HabitsPanel habits={habits} onAdd={onAddHabit} onCheck={onCheckHabit} onDelete={onDeleteHabit} />
        </Collapsible>
        <Collapsible title="Break down a goal">
          <DecomposePanel onGenerate={onDecompose} onCommit={onCommitDecomposition} />
        </Collapsible>
      </div>
    </div>
  );
}
