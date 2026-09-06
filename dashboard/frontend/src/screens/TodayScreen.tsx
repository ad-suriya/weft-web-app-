import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Play, Pause, RotateCcw, Check, Crosshair, ArrowRight, Clock, SkipForward, Send, Mic, Loader2, RefreshCw,
  ListPlus, Target, NotebookPen, GraduationCap,
} from 'lucide-react';
import { ChatMessage, FocusPrefs, Habit, Session, Task, Workflow } from '../types';
import { CARD, CARD_HERO, BTN_SM, Eyebrow, Pill, Button, Card, Meter } from './ui';
import FocusBridge from './FocusBridge';
import { fmtTimer, fmtDeadline, fmtClock, dayLabel, relTime, fmtDuration } from './format';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Props {
  task: Task | null;
  isActive: boolean;
  modeBlurb: string;
  pomoSeconds: number;
  pomoRunning: boolean;
  lastSession: Session | null;
  lastSessionTask?: Task | null;
  scheduled: Task[];
  atRisk: Set<number>;
  goalTitle?: string | null;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onStartFocus: (t: Task) => void;
  onMarkDone: (t: Task) => void;
  onSkip: (t: Task) => void;
  onGoMyWork: () => void;
  // Study Planner — the user's currently active study plan, if any.
  studyWorkflow?: Workflow | null;
  onOpenWorkflow?: (id: number) => void;
  focusPrefs: FocusPrefs;
  onToggleStudyFocus: () => void;
  habits: Habit[];
  onCheckHabit: (id: number) => void;
  // Conversation — woven into this screen rather than a separate chat panel.
  messages: ChatMessage[];
  hasConversation: boolean;
  chatLoading: boolean;
  thinking: boolean;
  input: string;
  setInput: (s: string) => void;
  onSend: (text: string) => void;
  onNewChat: () => void;
  quickReplies: string[];
  chatError: string;
  listening: boolean;
  voiceSupported: boolean;
  onToggleVoice: () => void;
}

const SEGMENTS = 6;

// Starter prompts shown before any conversation exists, so the capture
// input reads as a launch point rather than a bare textbox from the first
// paint — once a real conversation starts, onSend's own quickReplies take
// over this same chip row.
const STARTER_PROMPTS = [
  { icon: ListPlus, label: 'Add a task' },
  { icon: Target, label: 'What should I work on?' },
  { icon: NotebookPen, label: 'Dump what’s on my plate' },
];

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function TodayScreen({
  task, isActive, modeBlurb, pomoSeconds, pomoRunning, lastSession, lastSessionTask, scheduled, atRisk, goalTitle,
  onToggleTimer, onResetTimer, onStartFocus, onMarkDone, onSkip, onGoMyWork, studyWorkflow, onOpenWorkflow,
  focusPrefs, onToggleStudyFocus, habits, onCheckHabit,
  messages, hasConversation, chatLoading, thinking, input, setInput, onSend, onNewChat,
  quickReplies, chatError, listening, voiceSupported, onToggleVoice,
}: Props) {
  const dailyHabits = habits.filter((h) => h.cadence === 'DAILY');
  const threadEndRef = useRef<HTMLDivElement>(null);
  const showThread = hasConversation || thinking || chatLoading;
  const [captureFocused, setCaptureFocused] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (showThread) threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, thinking, showThread]);

  const submit = () => {
    if (input.trim()) onSend(input);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };
  const handleMarkDone = (t: Task) => {
    if (reduced) {
      onMarkDone(t);
      return;
    }
    setJustCompleted(true);
    setTimeout(() => {
      setJustCompleted(false);
      onMarkDone(t);
    }, 260);
  };

  const est = task?.estimated_minutes ?? 0;
  const done = task?.completed_minutes ?? 0;
  const pct = est > 0 ? Math.min(100, (done / est) * 100) : 0;
  const filledSegments = Math.round((pct / 100) * SEGMENTS);
  const remaining = Math.max(0, est - done);

  const groups = React.useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of scheduled) {
      const label = dayLabel(t.scheduled_start!);
      const arr = map.get(label) ?? [];
      arr.push(t);
      map.set(label, arr);
    }
    return Array.from(map, ([label, items]) => ({ label, items }));
  }, [scheduled]);

  const expanded = captureFocused || input.length > 0;
  // Focus Mode: while a session is actually running, the screen becomes
  // concentrated and minimal — capture, resume-state, habits and the
  // scheduled list recede so only the active task, the next action, and
  // Focus Bridge's status remain. Planning Mode (the default) stays spacious.
  const concentrated = isActive && pomoRunning;
  const collapse = { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 } };

  return (
    <div className="flex flex-col gap-6">
      {/* ---- capture / conversation (no separate chat panel) ---- */}
      <AnimatePresence initial={false}>
        {!concentrated && (
          <motion.section
            {...(reduced ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : collapse)}
            transition={{ duration: 0.25 }}
            className="bg-transparent overflow-hidden"
            data-tour="capture"
          >
        <Eyebrow>{greeting()}</Eyebrow>
        <h2 className="font-serif text-section-heading font-semibold tracking-tight mt-1">What are you working on?</h2>
        <p className="font-sans text-xs text-ink-soft mt-1">{modeBlurb}</p>

        <motion.div
          layout
          transition={{ duration: 0.2 }}
          className={`mt-4 rounded-lg border bg-surface transition-colors ${expanded ? 'border-accent/40 shadow-card' : 'border-ink/14'}`}
        >
          <div className="flex gap-2 items-end p-2.5">
            <div className="flex-grow flex items-start gap-2 px-2 py-1.5">
              <span className="font-sans text-ink-faint text-sm leading-6 select-none">+</span>
              <textarea
                rows={expanded ? 2 : 1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setCaptureFocused(true)}
                onBlur={() => setCaptureFocused(false)}
                disabled={thinking || chatLoading}
                placeholder={listening ? 'Listening…' : 'Add a task or goal, or dump what’s on your plate…'}
                className="flex-grow bg-transparent font-sans text-sm leading-6 resize-none focus:outline-none placeholder:text-ink-faint max-h-40"
              />
            </div>
            <AnimatePresence>
              {(expanded || voiceSupported) && (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  className="flex gap-2 shrink-0"
                >
                  {voiceSupported && (
                    <button
                      onClick={onToggleVoice}
                      disabled={thinking || chatLoading}
                      aria-label={listening ? 'Stop dictation' : 'Dictate with voice'}
                      aria-pressed={listening}
                      className={`h-[42px] w-[42px] grid place-items-center rounded-md border transition-colors disabled:opacity-40 ${
                        listening ? 'bg-danger text-inverse border-transparent animate-pulse' : 'border-ink/14 hover:bg-accent/10 hover:text-accent-strong'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={submit}
                    disabled={thinking || chatLoading || !input.trim()}
                    aria-label="Send"
                    className="h-[42px] w-[42px] grid place-items-center rounded-md bg-accent text-inverse hover:bg-accent-strong transition-colors disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {!hasConversation && !thinking && expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 px-3.5 pb-3">
                  {STARTER_PROMPTS.map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSend(label)}
                      className="inline-flex items-center gap-1.5 font-sans text-[11px] font-medium px-3 py-1.5 rounded-full border border-ink/14 hover:bg-accent/10 hover:text-accent-strong hover:border-transparent transition-colors"
                    >
                      <Icon className="w-3 h-3" /> {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {chatError && <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-danger mt-2">{chatError}</p>}

        {showThread && (
          <div className={`${CARD} mt-4 p-4`}>
            <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto">
              {chatLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-danger" />
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] font-sans text-sm leading-relaxed px-3.5 py-2.5 rounded-lg ${
                        m.role === 'user'
                          ? 'bg-surface-elevated text-inverse'
                          : m.system
                            ? 'bg-accent/10 border border-accent/40 text-ink italic'
                            : 'bg-background border border-ink/12'
                      }`}
                    >
                      {m.system && (
                        <span className="block text-[9px] uppercase tracking-wider font-semibold text-accent-strong mb-1 not-italic">System</span>
                      )}
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {thinking && (
                <div className="flex justify-start">
                  <div className="bg-background border border-ink/12 rounded-lg px-3.5 py-2.5 flex items-center gap-2 font-sans text-xs uppercase tracking-wider">
                    <Loader2 className="w-4 h-4 animate-spin text-danger" /> Thinking
                  </div>
                </div>
              )}
              <div ref={threadEndRef} />
            </div>
          </div>
        )}

        {quickReplies.length > 0 && !thinking && (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickReplies.map((q, i) => (
              <button
                key={i}
                onClick={() => onSend(q)}
                className="font-sans text-[11px] font-semibold px-3 py-1.5 rounded-md border border-ink/14 hover:bg-accent/10 hover:text-accent-strong hover:border-transparent transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {hasConversation && (
          <button
            onClick={onNewChat}
            className="mt-3 inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-wider font-semibold text-ink-faint hover:text-accent-strong transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> New conversation
          </button>
        )}
          </motion.section>
        )}
      </AnimatePresence>

      {!concentrated && studyWorkflow && studyWorkflow.status !== 'PLANNING' && studyWorkflow.status !== 'COMPLETED' && (
        <Card
          variant="interactive"
          onClick={() => onOpenWorkflow?.(studyWorkflow.id)}
          className="p-5 border-l-[4px] border-l-accent flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="min-w-0">
            <Eyebrow tone="green">
              <span className="inline-flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Active study plan</span>
            </Eyebrow>
            <h3 className="font-serif text-lg font-semibold tracking-tight mt-0.5 truncate">
              {studyWorkflow.canonical_subject || studyWorkflow.subject || studyWorkflow.name}
            </h3>
            <p className="font-sans text-[11.5px] text-ink-soft mt-1">
              {studyWorkflow.progress?.days_remaining != null ? `Exam in ${studyWorkflow.progress.days_remaining}d · ` : ''}
              {studyWorkflow.progress ? `${studyWorkflow.progress.completed}/${studyWorkflow.progress.total} complete` : ''}
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Meter value={studyWorkflow.progress?.overall_pct ?? 0} className="w-28" />
            <ArrowRight className="w-4 h-4 text-accent-strong" />
          </div>
        </Card>
      )}

      {task && <Eyebrow tone="ink">Current work</Eyebrow>}

      <div className={`grid grid-cols-1 gap-5 ${concentrated ? '' : 'lg:grid-cols-[1.7fr_1fr]'}`}>
        {/* ---- current work — the dominant focal point on this screen ---- */}
        <article className={`${CARD_HERO} p-6 relative overflow-hidden`}>
          <AnimatePresence>
            {justCompleted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-surface/90 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.3 }}
                  className="w-16 h-16 rounded-full bg-accent text-inverse flex items-center justify-center"
                >
                  <Check className="w-8 h-8" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {task ? (
            <>
              <div className="flex items-start justify-between gap-4">
                {isActive ? (
                  <Pill tone={pomoRunning ? 'success' : 'amber'}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {pomoRunning ? 'Working' : 'Paused'}
                  </Pill>
                ) : (
                  <Pill tone="neutral">Up next</Pill>
                )}
                <div className="text-right">
                  <Eyebrow>Session</Eyebrow>
                  <div className="font-mono text-[15px] tabular-nums mt-0.5">
                    {isActive ? fmtTimer(pomoSeconds) : '--:--'}
                  </div>
                </div>
              </div>

              <h1 className="font-serif text-[clamp(1.8rem,3.6vw,var(--text-display))] font-semibold tracking-tight leading-[1.05] mt-4 mb-1.5 text-balance">
                {task.task_name}
              </h1>
              <p className="font-sans text-[12.5px] text-ink-soft">
                {goalTitle && <>toward <b className="text-ink font-semibold">{goalTitle}</b> &nbsp;·&nbsp; </>}
                {task.deadline ? <>deadline <b className="text-ink font-semibold">{fmtDeadline(task.deadline)}</b></> : 'no deadline'}
                &nbsp;·&nbsp; ~{fmtDuration(est)} of work
              </p>

              <div className="mt-4 rounded-r-md border-l-[3px] border-accent bg-background px-4 py-3">
                <Eyebrow tone="green">Current step</Eyebrow>
                <p className="font-mono text-[13.5px] mt-1 leading-snug">{task.next_micro_step || 'Just start — momentum will tell you the rest.'}</p>
              </div>

              <div className="grid gap-[5px] my-4" style={{ gridTemplateColumns: `repeat(${SEGMENTS}, 1fr)` }}>
                {Array.from({ length: SEGMENTS }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`h-8 rounded-sm border ${i < filledSegments ? 'bg-accent-soft border-transparent' : 'bg-surface border-ink/14'}`}
                    initial={false}
                    animate={{ scale: i < filledSegments ? 1 : 1 }}
                    layout
                  />
                ))}
              </div>
              <div className="flex justify-between font-sans text-[11px] text-ink-soft">
                <span><b className="text-ink">{fmtDuration(done)}</b> logged</span>
                <span>~{fmtDuration(remaining)} left</span>
              </div>

              <p className="mt-4 pt-3.5 border-t border-ink/10 font-sans text-[12px] text-ink-soft">
                Last activity <b className="text-ink">{relTime(task.updated_at)}</b>
              </p>

              <div className="flex gap-2.5 mt-4 flex-wrap">
                {isActive ? (
                  <>
                    <Button variant="secondary" onClick={onToggleTimer}>
                      {pomoRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {pomoRunning ? 'Pause' : 'Resume session'}
                    </Button>
                    <Button variant="secondary" onClick={onResetTimer} aria-label="Reset timer">
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </Button>
                    <Button variant="primary" onClick={() => handleMarkDone(task)} className="ml-auto">
                      <Check className="w-3.5 h-3.5" /> Complete
                    </Button>
                  </>
                ) : (
                  <Button variant="focus" onClick={() => onStartFocus(task)}>
                    <Crosshair className="w-3.5 h-3.5" /> Start focus
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <h1 className="font-serif text-2xl font-semibold tracking-tight">Nothing in progress</h1>
              <p className="font-sans text-sm text-ink-soft mt-2">Pick something up and it becomes your one active task.</p>
              <Button variant="primary" onClick={onGoMyWork} className="mt-4">Go to My Work</Button>
            </div>
          )}
        </article>

        {/* ---- resume state / last session — deliberately quieter than the hero beside it, and hidden entirely once Focus Mode narrows the screen down to just the active task ---- */}
        {!concentrated && (
        <aside className={`${CARD} p-5 flex flex-col`}>
          <div className="flex-grow">
            <Eyebrow tone="ink">Resume state · last session</Eyebrow>
            {lastSession ? (
              <>
                <p className="font-mono text-[12px] text-ink-soft mt-2">
                  Stopped <b className="text-ink">{lastSession.end_time ? relTime(lastSession.end_time) : 'recently'}</b>
                  {' · '}{fmtDuration(lastSession.duration_minutes)}
                </p>
                <p className="font-serif text-[1.1rem] font-semibold leading-snug mt-3 text-balance">
                  {lastSession.description || 'Focus session'}
                </p>
              </>
            ) : (
              <p className="font-sans text-[13px] text-ink-soft mt-3 leading-relaxed">
                No earlier session on this device yet. Your first focus session shows up here.
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              const t = lastSessionTask ?? task;
              if (t) onStartFocus(t);
            }}
            disabled={!lastSessionTask && !task}
            className="w-full justify-center mt-4"
          >
            <Play className="w-3.5 h-3.5" /> Resume work
          </Button>
        </aside>
        )}
      </div>

      {/* ---- next action ---- */}
      {task && (
        <div className={`${CARD} border-l-[5px] border-l-accent p-5 flex items-center justify-between gap-6 flex-wrap`}>
          <div>
            <Eyebrow tone="green">Next action · what to do right now</Eyebrow>
            <p className="font-serif text-[clamp(1.1rem,2vw,1.4rem)] font-semibold leading-snug mt-1.5 text-balance">
              {task.next_micro_step || task.task_name}
            </p>
            <p className="font-mono text-[11.5px] text-ink-soft mt-1">
              ~{fmtDuration(remaining || est)} · {isActive ? 'session running' : 'not started'}
            </p>
          </div>
          <Button variant="focus" onClick={() => onStartFocus(task)}>
            {isActive ? 'Back to it' : 'Start'}
          </Button>
        </div>
      )}

      {/* ---- focus bridge ---- */}
      <FocusBridge task={task} isActive={isActive} pomoRunning={pomoRunning} focusPrefs={focusPrefs} onToggleStudyFocus={onToggleStudyFocus} />

      {!concentrated && dailyHabits.length > 0 && (
        <div className={`${CARD} p-5`}>
          <div className="flex items-center gap-3 mb-3">
            <Eyebrow tone="ink">Today&apos;s habits</Eyebrow>
            <div className="h-px flex-grow bg-ink/10" />
          </div>
          <div className="flex flex-wrap gap-2">
            {dailyHabits.map((h) => (
              <button
                key={h.id}
                onClick={() => onCheckHabit(h.id)}
                disabled={h.done_today}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border font-sans text-[12px] transition-colors ${
                  h.done_today
                    ? 'bg-accent-soft border-transparent text-accent-strong'
                    : 'border-ink/14 hover:bg-accent/10 hover:text-accent-strong hover:border-transparent'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${h.done_today ? '' : 'opacity-30'}`} />
                {h.name}
                {h.streak > 0 && <span className="font-mono text-[10.5px] opacity-60">{h.streak}d</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- rest of the plan ---- */}
      {!concentrated && groups.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <Eyebrow tone="ink">Scheduled</Eyebrow>
            <div className="h-px flex-grow bg-ink/10" />
          </div>
          <div className="flex flex-col gap-4">
            {groups.map(({ label, items }) => (
              <div key={label}>
                <p className="font-sans text-[10px] uppercase font-semibold tracking-wider text-ink-faint mb-2">{label}</p>
                <div className="flex flex-col gap-2">
                  {items.map((t) => {
                    const risk = atRisk.has(t.id);
                    return (
                      <Card
                        key={t.id}
                        variant="interactive"
                        onClick={() => onStartFocus(t)}
                        className={`shadow-none flex items-center gap-3 px-3.5 py-2.5 border-l-[3px] ${risk ? 'border-l-danger' : 'border-l-accent'}`}
                      >
                        <Clock className="w-4 h-4 text-ink-faint shrink-0" />
                        <span className="font-mono text-[11px] font-medium tabular-nums whitespace-nowrap">
                          {fmtClock(t.scheduled_start!)}
                          <ArrowRight className="w-3 h-3 inline mx-1 opacity-40" />
                          {fmtClock(t.scheduled_end!)}
                        </span>
                        <span className="font-sans text-[13px] truncate flex-grow">{t.task_name}</span>
                        {risk && <Pill tone="danger">At risk</Pill>}
                        <button
                          onClick={(e) => { e.stopPropagation(); onSkip(t); }}
                          title="Move this task"
                          className={BTN_SM}
                        >
                          <SkipForward className="w-3 h-3" />
                        </button>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
