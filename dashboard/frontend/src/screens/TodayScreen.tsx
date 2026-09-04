import React, { useEffect, useRef } from 'react';
import {
  Play, Pause, RotateCcw, Check, Crosshair, ArrowRight, Clock, SkipForward, Smartphone, Laptop,
  Send, Mic, Loader2, RefreshCw,
} from 'lucide-react';
import { ChatMessage, FocusPrefs, Habit, Session, Task } from '../types';
import { CARD, CARD_HERO, CARD_DARK, BTN, BTN_GO, BTN_SM, Eyebrow, Pill, Meter, PreviewTag, Toggle } from './ui';
import { fmtTimer, fmtDeadline, fmtClock, dayLabel, relTime, fmtDuration } from './format';

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

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function TodayScreen({
  task, isActive, modeBlurb, pomoSeconds, pomoRunning, lastSession, lastSessionTask, scheduled, atRisk, goalTitle,
  onToggleTimer, onResetTimer, onStartFocus, onMarkDone, onSkip, onGoMyWork,
  focusPrefs, onToggleStudyFocus, habits, onCheckHabit,
  messages, hasConversation, chatLoading, thinking, input, setInput, onSend, onNewChat,
  quickReplies, chatError, listening, voiceSupported, onToggleVoice,
}: Props) {
  const dailyHabits = habits.filter((h) => h.cadence === 'DAILY');
  const threadEndRef = useRef<HTMLDivElement>(null);
  const showThread = hasConversation || thinking || chatLoading;
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

  return (
    <div className="flex flex-col gap-6">
      {/* ---- capture / conversation (no separate chat panel) ---- */}
      <section className={`${CARD} p-5`} data-tour="capture">
        <Eyebrow>{greeting()}</Eyebrow>
        <h2 className="font-serif text-[1.4rem] font-semibold tracking-tight mt-1">What are you working on?</h2>
        <p className="font-sans text-xs text-[#64695D] mt-1">{modeBlurb}</p>

        <div className="mt-4 flex gap-2 items-end">
          <div className="flex-grow flex items-start gap-2 rounded-[12px] border border-[#23271F]/18 bg-white px-3 py-2.5 focus-within:ring-1 focus-within:ring-[#2F7A64]">
            <span className="font-sans text-[#8C9184] text-sm leading-6 select-none">+</span>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={thinking || chatLoading}
              placeholder={listening ? 'Listening…' : 'Add a task or goal, or dump what’s on your plate…'}
              className="flex-grow bg-transparent font-sans text-sm leading-6 resize-none focus:outline-none placeholder:text-[#8C9184] max-h-40"
            />
          </div>
          {voiceSupported && (
            <button
              onClick={onToggleVoice}
              disabled={thinking || chatLoading}
              aria-label={listening ? 'Stop dictation' : 'Dictate with voice'}
              aria-pressed={listening}
              className={`h-[42px] w-[42px] grid place-items-center rounded-[10px] border transition-colors disabled:opacity-40 ${
                listening ? 'bg-[#C2632F] text-white border-transparent animate-pulse' : 'border-[#23271F]/14 hover:bg-[#2F7A64]/10 hover:text-[#245E4E]'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={submit}
            disabled={thinking || chatLoading || !input.trim()}
            aria-label="Send"
            className="h-[42px] w-[42px] grid place-items-center rounded-[10px] bg-[#2F7A64] text-white hover:bg-[#245E4E] transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {chatError && <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#C2632F] mt-2">{chatError}</p>}

        {showThread && (
          <div className="mt-4 pt-4 border-t border-[#23271F]/10 flex flex-col gap-3 max-h-[360px] overflow-y-auto">
            {chatLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#C2632F]" />
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] font-sans text-sm leading-relaxed px-3.5 py-2.5 rounded-[12px] ${
                      m.role === 'user'
                        ? 'bg-[#2C312A] text-white'
                        : m.system
                          ? 'bg-[#2F7A64]/10 border border-[#2F7A64]/40 text-[#23271F] italic'
                          : 'bg-[#F1F3EF] border border-[#23271F]/12'
                    }`}
                  >
                    {m.system && (
                      <span className="block text-[9px] uppercase tracking-wider font-semibold text-[#2F7A64] mb-1 not-italic">System</span>
                    )}
                    {m.text}
                  </div>
                </div>
              ))
            )}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-[#F1F3EF] border border-[#23271F]/12 rounded-[12px] px-3.5 py-2.5 flex items-center gap-2 font-sans text-xs uppercase tracking-wider">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C2632F]" /> Thinking
                </div>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>
        )}

        {quickReplies.length > 0 && !thinking && (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickReplies.map((q, i) => (
              <button
                key={i}
                onClick={() => onSend(q)}
                className="font-sans text-[11px] font-semibold px-3 py-1.5 rounded-[10px] border border-[#23271F]/14 hover:bg-[#2F7A64]/10 hover:text-[#245E4E] hover:border-transparent transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {hasConversation && (
          <button
            onClick={onNewChat}
            className="mt-3 inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-wider font-semibold text-[#8C9184] hover:text-[#245E4E] transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> New conversation
          </button>
        )}
      </section>

      {task && <Eyebrow tone="ink">Current work</Eyebrow>}

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5">
        {/* ---- current work ---- */}
        <article className={`${CARD_HERO} p-6`}>
          {task ? (
            <>
              <div className="flex items-start justify-between gap-4">
                {isActive ? (
                  <Pill tone={pomoRunning ? 'green' : 'amber'}>
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

              <h1 className="font-serif text-[clamp(1.7rem,3.2vw,2.3rem)] font-semibold tracking-tight leading-[1.08] mt-4 mb-1.5 text-balance">
                {task.task_name}
              </h1>
              <p className="font-sans text-[12.5px] text-[#64695D]">
                {goalTitle && <>toward <b className="text-[#23271F] font-semibold">{goalTitle}</b> &nbsp;·&nbsp; </>}
                {task.deadline ? <>deadline <b className="text-[#23271F] font-semibold">{fmtDeadline(task.deadline)}</b></> : 'no deadline'}
                &nbsp;·&nbsp; ~{fmtDuration(est)} of work
              </p>

              <div className="mt-4 rounded-r-[10px] border-l-[3px] border-[#2F7A64] bg-[#F1F3EF] px-4 py-3">
                <Eyebrow tone="green">Current step</Eyebrow>
                <p className="font-mono text-[13.5px] mt-1 leading-snug">{task.next_micro_step || 'Just start — momentum will tell you the rest.'}</p>
              </div>

              <div className="grid gap-[5px] my-4" style={{ gridTemplateColumns: `repeat(${SEGMENTS}, 1fr)` }}>
                {Array.from({ length: SEGMENTS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-8 rounded-[8px] border ${
                      i < filledSegments ? 'bg-[#E6F0EB] border-transparent' : 'bg-white border-[#23271F]/14'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between font-sans text-[11px] text-[#64695D]">
                <span><b className="text-[#23271F]">{fmtDuration(done)}</b> logged</span>
                <span>~{fmtDuration(remaining)} left</span>
              </div>

              <p className="mt-4 pt-3.5 border-t border-[#23271F]/10 font-sans text-[12px] text-[#64695D]">
                Last activity <b className="text-[#23271F]">{relTime(task.updated_at)}</b>
              </p>

              <div className="flex gap-2.5 mt-4 flex-wrap">
                {isActive ? (
                  <>
                    <button onClick={onToggleTimer} className={BTN}>
                      {pomoRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {pomoRunning ? 'Pause' : 'Resume session'}
                    </button>
                    <button onClick={onResetTimer} className={BTN} aria-label="Reset timer">
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                    <button onClick={() => onMarkDone(task)} className={`${BTN_GO} ml-auto`}>
                      <Check className="w-3.5 h-3.5" /> Complete
                    </button>
                  </>
                ) : (
                  <button onClick={() => onStartFocus(task)} className={BTN_GO}>
                    <Crosshair className="w-3.5 h-3.5" /> Start focus
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <h1 className="font-serif text-2xl font-semibold tracking-tight">Nothing in progress</h1>
              <p className="font-sans text-sm text-[#64695D] mt-2">Pick something up and it becomes your one active task.</p>
              <button onClick={onGoMyWork} className={`${BTN_GO} mt-4`}>Go to My Work</button>
            </div>
          )}
        </article>

        {/* ---- resume state / last session ---- */}
        <aside className={`${CARD} p-5 self-start`}>
          <Eyebrow tone="ink">Resume state · last session</Eyebrow>
          {lastSession ? (
            <>
              <p className="font-mono text-[12px] text-[#64695D] mt-2">
                Stopped <b className="text-[#23271F]">{lastSession.end_time ? relTime(lastSession.end_time) : 'recently'}</b>
                {' · '}{fmtDuration(lastSession.duration_minutes)}
              </p>
              <p className="font-serif text-[1.1rem] font-semibold leading-snug mt-3 text-balance">
                {lastSession.description || 'Focus session'}
              </p>
            </>
          ) : (
            <p className="font-sans text-[13px] text-[#64695D] mt-3 leading-relaxed">
              No earlier session on this device yet. Your first focus session shows up here.
            </p>
          )}
          <button
            onClick={() => {
              const t = lastSessionTask ?? task;
              if (t) onStartFocus(t);
            }}
            disabled={!lastSessionTask && !task}
            className={`${BTN_GO} w-full justify-center mt-4`}
          >
            <Play className="w-3.5 h-3.5" /> Resume work
          </button>
        </aside>
      </div>

      {/* ---- next action ---- */}
      {task && (
        <div className={`${CARD} border-l-[5px] border-l-[#2F7A64] p-5 flex items-center justify-between gap-6 flex-wrap`}>
          <div>
            <Eyebrow tone="green">Next action · what to do right now</Eyebrow>
            <p className="font-serif text-[clamp(1.1rem,2vw,1.4rem)] font-semibold leading-snug mt-1.5 text-balance">
              {task.next_micro_step || task.task_name}
            </p>
            <p className="font-mono text-[11.5px] text-[#64695D] mt-1">
              ~{fmtDuration(remaining || est)} · {isActive ? 'session running' : 'not started'}
            </p>
          </div>
          <button onClick={() => onStartFocus(task)} className={BTN_GO}>
            {isActive ? 'Back to it' : 'Start'}
          </button>
        </div>
      )}

      {/* ---- focus bridge ---- */}
      <div className={`${CARD_DARK} p-5`}>
        <div className="flex items-center justify-between gap-4 mb-3.5">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
            Focus Bridge · task-aware device coordination
          </span>
          <div className="flex items-center gap-2.5">
            <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60">Study Focus</span>
            <Toggle on={focusPrefs.study_focus} onChange={onToggleStudyFocus} label="Study Focus" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr_max-content] items-center gap-4">
          <div>
            <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">Laptop</div>
            <div className="font-sans text-[13px] font-semibold mt-0.5 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" /> {task ? task.task_name : 'No active task'}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#7FD1BE] min-w-0">
            <span className="flex-1 min-w-7 h-0.5 bg-[repeating-linear-gradient(90deg,#7FD1BE_0_6px,transparent_6px_11px)]" />
            <span className="font-sans text-[8.5px] font-bold uppercase tracking-[0.18em] whitespace-nowrap">Phone not linked</span>
            <span className="flex-1 min-w-7 h-0.5 bg-[repeating-linear-gradient(90deg,#7FD1BE_0_6px,transparent_6px_11px)]" />
          </div>
          <div>
            <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">This device</div>
            <div className={`font-sans text-[13px] font-semibold mt-0.5 flex items-center gap-1.5 ${focusPrefs.study_focus ? '' : 'text-white/60'}`}>
              <Smartphone className="w-3.5 h-3.5" /> {focusPrefs.study_focus ? 'Study Focus active' : 'Study Focus off'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3.5 pt-3 border-t border-white/15 font-sans text-[11px]">
          <div>
            <span className="font-semibold uppercase tracking-[0.1em] text-white/45 mr-2">Always allowed</span>
            {focusPrefs.allow_list.map((c) => (
              <span key={c} className="inline-block px-2 py-0.5 mr-1.5 rounded-full border border-white/25 text-[10px]">{c}</span>
            ))}
          </div>
        </div>
        <p className="font-sans text-[11px] text-white/50 mt-3 leading-relaxed">
          {focusPrefs.study_focus
            ? 'Reminder notifications are held on this device while a focus session runs.'
            : 'Turn Study Focus on to hold non-essential notifications on this device during a session.'}
          {' '}Phone mirroring isn&apos;t connected yet — see Devices for a preview. <PreviewTag />
        </p>
      </div>

      {dailyHabits.length > 0 && (
        <div className={`${CARD} p-5`}>
          <div className="flex items-center gap-3 mb-3">
            <Eyebrow tone="ink">Today&apos;s habits</Eyebrow>
            <div className="h-px flex-grow bg-[#23271F]/10" />
          </div>
          <div className="flex flex-wrap gap-2">
            {dailyHabits.map((h) => (
              <button
                key={h.id}
                onClick={() => onCheckHabit(h.id)}
                disabled={h.done_today}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border font-sans text-[12px] transition-colors ${
                  h.done_today
                    ? 'bg-[#E6F0EB] border-transparent text-[#245E4E]'
                    : 'border-[#23271F]/14 hover:bg-[#2F7A64]/10 hover:text-[#245E4E] hover:border-transparent'
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
      {groups.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <Eyebrow tone="ink">Scheduled</Eyebrow>
            <div className="h-px flex-grow bg-[#23271F]/10" />
          </div>
          <div className="flex flex-col gap-4">
            {groups.map(({ label, items }) => (
              <div key={label}>
                <p className="font-sans text-[10px] uppercase font-semibold tracking-wider text-[#8C9184] mb-2">{label}</p>
                <div className="flex flex-col gap-2">
                  {items.map((t) => {
                    const risk = atRisk.has(t.id);
                    return (
                      <div
                        key={t.id}
                        className={`${CARD} shadow-none flex items-center gap-3 px-3.5 py-2.5 border-l-[3px] ${
                          risk ? 'border-l-[#C2632F]' : 'border-l-[#2F7A64]'
                        }`}
                      >
                        <Clock className="w-4 h-4 text-[#8C9184] shrink-0" />
                        <span className="font-mono text-[11px] font-medium tabular-nums whitespace-nowrap">
                          {fmtClock(t.scheduled_start!)}
                          <ArrowRight className="w-3 h-3 inline mx-1 opacity-40" />
                          {fmtClock(t.scheduled_end!)}
                        </span>
                        <span className="font-sans text-[13px] truncate flex-grow">{t.task_name}</span>
                        {risk && <Pill tone="orange">At risk</Pill>}
                        <button onClick={() => onSkip(t)} title="Move this task" className={BTN_SM}>
                          <SkipForward className="w-3 h-3" />
                        </button>
                      </div>
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
