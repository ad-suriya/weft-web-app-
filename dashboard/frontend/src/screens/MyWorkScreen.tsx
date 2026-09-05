import React from 'react';
import {
  Plus, CalendarDays, Crosshair, Check, SkipForward, Trash2, Download, CalendarPlus, ListChecks,
} from 'lucide-react';
import { DecompositionPlan, Goal, Habit, Task, TaskRisk, Urgency } from '../types';
import { api } from '../api';
import GoalsPanel from '../components/GoalsPanel';
import HabitsPanel from '../components/HabitsPanel';
import DecomposePanel from '../components/DecomposePanel';
import { CARD, BTN_SM, ScreenHead, SectionRule, Pill, Meter, Collapsible, Button, Card, Input, EmptyState } from './ui';
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
        <Button onClick={() => setShowAdd((s) => !s)}>
          <Plus className="w-3.5 h-3.5" /> Add task
        </Button>
        <Button variant="primary" onClick={onPlanDay} disabled={busy !== '' || tasks.length === 0} loading={busy === 'schedule'}>
          {busy !== 'schedule' && <CalendarDays className="w-3.5 h-3.5" />}
          Plan my day
        </Button>
      </div>

      {showAdd && (
        <Card variant="secondary" className="p-4 space-y-3">
          <Input
            placeholder="Task name"
            value={newTask.task_name}
            onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="font-sans text-[10px] uppercase font-semibold tracking-wider flex flex-col gap-1">
              Deadline
              <Input
                type="datetime-local"
                className="normal-case"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              />
            </label>
            <label className="font-sans text-[10px] uppercase font-semibold tracking-wider flex flex-col gap-1">
              Est. minutes
              <Input
                type="number"
                min={5}
                step={5}
                value={newTask.estimated_minutes}
                onChange={(e) => setNewTask({ ...newTask, estimated_minutes: Number(e.target.value) })}
              />
            </label>
            <label className="font-sans text-[10px] uppercase font-semibold tracking-wider flex flex-col gap-1">
              Urgency
              <select
                className="p-2.5 rounded-md border border-ink/18 bg-surface font-sans text-xs focus:outline-none focus:ring-1 focus:ring-accent"
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
                className="p-2.5 rounded-md border border-ink/18 bg-surface font-sans text-xs normal-case focus:outline-none focus:ring-1 focus:ring-accent"
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
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" onClick={onAddTask} disabled={!newTask.task_name.trim()}>Add task</Button>
          </div>
        </Card>
      )}

      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nothing on your plate yet" description="Your work shows up here once you tell chat what's on your plate — or add one above." />
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
            <Card key={t.id} variant="secondary" className={`p-4 ${isDone ? 'opacity-60' : ''}`}>
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
                  <p className="font-sans text-[11px] text-ink-soft mt-1">
                    {t.next_micro_step ? `Next: ${t.next_micro_step}` : `~${fmtDuration(est)} of work`}
                    {' · '}updated {relTime(t.updated_at)}
                    {t.deadline ? ` · due ${fmtDeadline(t.deadline)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">{statePill(t)}</div>
              </div>

              <Meter value={pct} className="mt-3" />
              <div className="flex items-center justify-between mt-1.5">
                <span className="font-sans text-[10px] text-ink-faint">
                  {fmtDuration(logged)} / {fmtDuration(est)}
                </span>
                {!isDone && (
                  <label className="font-sans text-[9px] uppercase tracking-wide text-ink-faint flex items-center gap-1">
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
                      className="w-14 p-1 rounded-sm border border-ink/18 bg-surface font-sans text-[11px] normal-case focus:outline-none focus:ring-1 focus:ring-accent"
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
                    className="inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1.5 rounded-sm border border-danger text-danger hover:bg-danger hover:text-inverse transition-colors disabled:opacity-40"
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
                  className="ml-auto inline-flex items-center px-2 py-1.5 rounded-sm border border-ink/18 text-ink-faint hover:border-danger hover:text-danger transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
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
