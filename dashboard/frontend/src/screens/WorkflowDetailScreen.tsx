import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Check, Circle, CircleDot, Crosshair, RefreshCw, Sparkles, AlertTriangle, Loader2, ClipboardCheck,
} from 'lucide-react';
import { Task, Workflow } from '../types';
import { CARD, CARD_HERO, Eyebrow, Pill, Meter, Button, Card } from './ui';
import { fmtDuration, fmtDeadline } from './format';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATION } from '../lib/motion';

interface Props {
  workflow: Workflow;
  tasks: Task[];
  justCreated: boolean;
  onIntroDone: () => void;
  onBack: () => void;
  onStartFocus: (t: Task) => void;
  onCycleStatus: (t: Task) => void;
  onReplan: () => void;
  replanBusy: boolean;
  onOpenQuiz: () => void;
}

const STATUS_META: Record<Workflow['status'] & string, { label: string; tone: 'neutral' | 'green' | 'amber' | 'orange' | 'ink' }> = {
  PLANNING: { label: 'Planning', tone: 'neutral' },
  READY: { label: 'Ready', tone: 'ink' },
  ACTIVE: { label: 'Active', tone: 'green' },
  PAUSED: { label: 'Paused', tone: 'amber' },
  COMPLETED: { label: 'Completed', tone: 'ink' },
  NEEDS_REVIEW: { label: 'Needs review', tone: 'orange' },
};

const INTRO_STEPS = [
  'Understanding your goal',
  'Identifying the subject',
  'Analyzing available time',
  'Organizing the syllabus',
  'Building the study plan',
  'Creating tasks',
];

function BreakdownIntro({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? INTRO_STEPS.length : 0);

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(onDone, 350);
      return () => clearTimeout(t);
    }
    if (shown >= INTRO_STEPS.length) {
      const t = setTimeout(onDone, 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((s) => s + 1), 130);
    return () => clearTimeout(t);
  }, [shown, reduced, onDone]);

  return (
    <motion.div
      className={`${CARD_HERO} p-8 flex flex-col items-center text-center gap-1`}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: DURATION.slow }}
    >
      <Sparkles className="w-6 h-6 text-accent mb-2" />
      <h2 className="font-serif text-xl font-semibold tracking-tight mb-4">Building your plan</h2>
      <div className="flex flex-col gap-2.5 items-start">
        {INTRO_STEPS.map((step, i) => {
          const done = i < shown;
          const active = i === shown;
          return (
            <div key={step} className="flex items-center gap-2.5 font-sans text-[13px]">
              {done ? (
                <span className="w-4 h-4 rounded-full bg-accent text-inverse grid place-items-center shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </span>
              ) : active ? (
                <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-ink-faint/40 shrink-0" />
              )}
              <span className={done || active ? 'text-ink' : 'text-ink-faint'}>{step}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function WorkflowDetailScreen({
  workflow, tasks, justCreated, onIntroDone, onBack, onStartFocus, onCycleStatus, onReplan, replanBusy, onOpenQuiz,
}: Props) {
  const [showIntro, setShowIntro] = useState(justCreated);
  const reduced = useReducedMotion();
  const p = workflow.progress;
  const subject = workflow.canonical_subject || workflow.subject || workflow.name;
  const wfTasks = tasks.filter((t) => t.workflow_id === workflow.id);
  const stages = [...(workflow.stages || [])].sort((a, b) => a.order - b.order);
  const totalMinutes = wfTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  const statusMeta = STATUS_META[workflow.status || 'PLANNING'];

  const handleIntroDone = () => { setShowIntro(false); onIntroDone(); };

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wider font-semibold text-ink-soft hover:text-accent-strong transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Workflows
      </button>

      <AnimatePresence mode="wait">
        {showIntro ? (
          <BreakdownIntro key="intro" onDone={handleIntroDone} />
        ) : (
          <motion.div
            key="content"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.base }}
            className="flex flex-col gap-5"
          >
            {/* ---- header ---- */}
            <header className={`${CARD_HERO} p-6`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <Eyebrow tone="green">{workflow.target ? `Target · ${workflow.target}` : 'Study plan'}</Eyebrow>
                  <h1 className="font-serif text-[clamp(1.8rem,3.4vw,var(--text-display))] font-semibold tracking-tight leading-[1.05] mt-1">
                    {subject}
                  </h1>
                  {workflow.plan_summary && (
                    <p className="font-sans text-[13px] text-ink-soft mt-2 max-w-[58ch] leading-relaxed">{workflow.plan_summary}</p>
                  )}
                </div>
                <Pill tone={statusMeta.tone}>{statusMeta.label}</Pill>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-ink/10">
                <div>
                  <p className="font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint">Exam</p>
                  <p className="font-serif text-lg font-semibold tracking-tight mt-0.5">
                    {p?.days_remaining != null ? `${p.days_remaining}d left` : workflow.exam_date ? fmtDeadline(workflow.exam_date) : 'No date set'}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint">Planned</p>
                  <p className="font-serif text-lg font-semibold tracking-tight mt-0.5">{fmtDuration(totalMinutes)}</p>
                </div>
                <div>
                  <p className="font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint">Progress</p>
                  <p className="font-serif text-lg font-semibold tracking-tight mt-0.5">{p ? `${p.completed} / ${p.total}` : '—'}</p>
                </div>
                <div className="flex flex-col justify-center">
                  <Meter value={p?.overall_pct ?? 0} />
                  <p className="font-sans text-[10px] text-ink-faint mt-1">{p?.overall_pct ?? 0}% complete</p>
                </div>
              </div>
            </header>

            {/* ---- adaptive plan banner ---- */}
            <AnimatePresence>
              {workflow.status === 'NEEDS_REVIEW' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-danger text-white p-4 rounded-[14px] flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div className="font-sans text-xs">
                      <span className="font-semibold uppercase tracking-wider">You're behind schedule</span>
                      <p className="opacity-90">Some tasks slipped past their planned day — let's rebalance what's left.</p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={onReplan} disabled={replanBusy} loading={replanBusy}
                    className="!bg-white !text-danger !border-transparent hover:!bg-background">
                    {!replanBusy && <RefreshCw className="w-3.5 h-3.5" />} Recalculate plan
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- next up ---- */}
            {p?.next_task ? (
              <div className={`${CARD} border-l-[5px] border-l-accent p-5 flex items-center justify-between gap-6 flex-wrap`}>
                <div>
                  <Eyebrow tone="green">Next up</Eyebrow>
                  <p className="font-serif text-[clamp(1.1rem,2vw,1.4rem)] font-semibold leading-snug mt-1.5 text-balance">
                    {p.next_task.task_name}
                  </p>
                  <p className="font-mono text-[11.5px] text-ink-soft mt-1">
                    ~{fmtDuration(p.next_task.estimated_minutes)}
                    {p.next_task.topic ? ` · ${p.next_task.topic}` : ''}
                  </p>
                </div>
                <Button variant="focus" onClick={() => onStartFocus(p.next_task!)}>
                  <Crosshair className="w-3.5 h-3.5" /> Start focus
                </Button>
              </div>
            ) : p && p.total > 0 && p.completed === p.total ? (
              <div className={`${CARD} p-5 text-center`}>
                <p className="font-serif text-lg font-semibold">Plan complete — nice work.</p>
              </div>
            ) : null}

            {/* ---- quiz prompt ---- */}
            <AnimatePresence>
              {p?.quiz_available && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-accent-soft border border-accent/25 rounded-[14px] p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-5 h-5 text-accent-strong shrink-0" />
                    <p className="font-sans text-sm text-ink">{p.quiz_reason}</p>
                  </div>
                  <Button variant="primary" onClick={onOpenQuiz}>Take quiz</Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- weak topics ---- */}
            {(workflow.weak_topics?.length ?? 0) > 0 && (
              <div className={`${CARD} p-5`}>
                <Eyebrow tone="ink">Weak topics</Eyebrow>
                <div className="flex flex-col gap-2.5 mt-3">
                  {workflow.weak_topics!.map((w) => (
                    <div key={w.topic} className="flex items-center gap-3">
                      <span className="font-sans text-[13px] w-40 shrink-0 truncate">{w.topic}</span>
                      <Meter value={w.score_pct} className="flex-grow" />
                      <span className="font-mono text-[11px] text-ink-soft w-10 text-right">{w.score_pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- roadmap ---- */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Eyebrow tone="ink">Roadmap</Eyebrow>
                <div className="h-px flex-grow bg-ink/10" />
              </div>
              {stages.map((stage) => {
                const stageTasks = wfTasks.filter((t) => t.step_id === stage.id);
                const done = stageTasks.filter((t) => t.status === 'COMPLETED').length;
                return (
                  <Card key={stage.id} variant="secondary" className="p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h3 className="font-serif text-lg font-semibold tracking-tight">{stage.name}</h3>
                      <span className="font-mono text-[11px] text-ink-soft">{done} / {stageTasks.length}</span>
                    </div>
                    <Meter value={stageTasks.length ? (done / stageTasks.length) * 100 : 0} className="mb-3" />
                    <div className="flex flex-col gap-1.5">
                      {stageTasks.map((t) => {
                        const isDone = t.status === 'COMPLETED';
                        const isActive = t.status === 'IN_PROGRESS';
                        return (
                          <button
                            key={t.id}
                            onClick={() => onCycleStatus(t)}
                            className="flex items-center gap-2.5 text-left px-2.5 py-2 rounded-md hover:bg-background transition-colors group"
                          >
                            {isDone ? (
                              <span className="w-4 h-4 rounded-full bg-accent text-inverse grid place-items-center shrink-0">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            ) : isActive ? (
                              <CircleDot className="w-4 h-4 text-accent shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-ink-faint/50 shrink-0 group-hover:text-accent" />
                            )}
                            <span className={`font-sans text-[13px] flex-grow truncate ${isDone ? 'line-through text-ink-faint' : ''}`}>
                              {t.task_name}
                            </span>
                            {t.tags?.includes('review') && <Pill tone="orange">Review</Pill>}
                            <span className="font-mono text-[10px] text-ink-faint shrink-0">{fmtDuration(t.estimated_minutes)}</span>
                            {!isDone && (
                              <span
                                role="button"
                                tabIndex={-1}
                                onClick={(e) => { e.stopPropagation(); onStartFocus(t); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity font-sans text-[9px] font-semibold uppercase tracking-wider text-accent-strong shrink-0"
                              >
                                Focus
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {stageTasks.length === 0 && (
                        <p className="font-sans text-[12px] text-ink-faint px-2.5 py-1">No tasks in this stage yet.</p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
