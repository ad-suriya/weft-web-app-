import React, { useState } from 'react';
import { Workflow as WorkflowIcon, Play, Trash2, Sparkles, Check, X, GraduationCap, ArrowRight } from 'lucide-react';
import { Workflow, WorkflowPlan } from '../types';
import { Card, Button, Textarea, EmptyState, ScreenHead, Eyebrow, Pill, Meter } from '../screens/ui';
import { fmtDeadline } from '../screens/format';

interface Props {
  workflows: Workflow[];
  onGenerate: (sopText: string) => Promise<WorkflowPlan>;
  onSave: (plan: WorkflowPlan, sopText: string) => Promise<void>;
  onToggleActive: (id: number, active: boolean) => void;
  onRun: (id: number) => void;
  onDelete: (id: number) => void;
  onOpenWorkflow: (id: number) => void;
}

const STUDY_STATUS_TONE: Record<string, 'neutral' | 'green' | 'amber' | 'orange' | 'ink'> = {
  PLANNING: 'neutral', READY: 'ink', ACTIVE: 'green', PAUSED: 'amber', COMPLETED: 'ink', NEEDS_REVIEW: 'orange',
};

function StudyPlanCard({ w, onOpen }: { w: Workflow; onOpen: () => void }) {
  const subject = w.canonical_subject || w.subject || w.name;
  const p = w.progress;
  return (
    <Card variant="interactive" onClick={onOpen} className="p-5 border-l-[4px] border-l-accent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow tone="green">Study plan</Eyebrow>
          <h3 className="font-serif text-xl font-semibold tracking-tight leading-tight mt-0.5 truncate">{subject}</h3>
          <p className="font-sans text-[11px] text-ink-soft mt-1">
            {w.exam_date ? `Exam ${fmtDeadline(w.exam_date)}` : 'No exam date set'}
            {p ? ` · ${p.completed}/${p.total} tasks` : ''}
          </p>
        </div>
        <Pill tone={STUDY_STATUS_TONE[w.status || 'PLANNING']}>{(w.status || 'PLANNING').replace('_', ' ')}</Pill>
      </div>
      {p && <Meter value={p.overall_pct} className="mt-3" />}
      <div className="flex items-center justify-end mt-3">
        <span className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider font-semibold text-accent-strong">
          Open plan <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Card>
  );
}

const TRIGGER_LABEL: Record<string, string> = {
  DAILY: 'Every day', WEEKLY: 'Every week', ON_TASK_COMPLETE: 'When a task completes', MANUAL: 'Manual only',
};

const fmtLastRun = (iso: string | null) => (iso ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never run');

export default function WorkflowsPanel({ workflows, onGenerate, onSave, onToggleActive, onRun, onDelete, onOpenWorkflow }: Props) {
  const studyPlans = workflows.filter((w) => w.kind === 'STUDY_PLAN');
  const automations = workflows.filter((w) => w.kind !== 'STUDY_PLAN');
  const [sopText, setSopText] = useState('');
  const [draft, setDraft] = useState<WorkflowPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!sopText.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const plan = await onGenerate(sopText.trim());
      setDraft(plan);
    } catch (err: any) {
      setError(err.message || 'Could not generate a workflow.');
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await onSave(draft, sopText.trim());
      setDraft(null);
      setSopText('');
    } catch (err: any) {
      setError(err.message || 'Could not save the workflow.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <ScreenHead title="Workflows">
        Study plans built from a goal in chat, and recurring procedures you describe once for AI to automate — both
        live here.
      </ScreenHead>

      {studyPlans.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Eyebrow tone="ink">
              <span className="inline-flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Study plans</span>
            </Eyebrow>
            <div className="h-px flex-grow bg-ink/10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            {studyPlans.map((w) => (
              <StudyPlanCard key={w.id} w={w} onOpen={() => onOpenWorkflow(w.id)} />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Eyebrow tone="ink">Automations</Eyebrow>
        <div className="h-px flex-grow bg-ink/10" />
      </div>

      {/* SOP -> workflow generator */}
      <Card variant="secondary" className="p-4 mb-4 space-y-3">
        <label className="font-sans text-[10px] uppercase font-semibold tracking-wider block text-ink-soft">
          Describe a procedure (SOP) — AI turns it into an automated workflow
        </label>
        <Textarea
          rows={3}
          placeholder="e.g. Every Monday, create tasks to review last week's goals and plan this week's top 3 priorities."
          value={sopText}
          onChange={(e) => setSopText(e.target.value)}
          disabled={generating}
        />
        <div className="flex justify-end">
          <Button variant="primary" onClick={generate} disabled={generating || !sopText.trim()} loading={generating}>
            {!generating && <Sparkles className="w-3.5 h-3.5" />}
            Generate Workflow
          </Button>
        </div>
        {error && <p className="font-sans text-[11px] font-semibold uppercase text-danger">{error}</p>}
      </Card>

      {/* Draft review */}
      {draft && (
        <Card variant="informational" className="p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold tracking-tight">{draft.name}</h3>
            <span className="font-sans text-[9px] font-semibold px-2 py-1 rounded-full bg-surface-elevated text-inverse uppercase tracking-wider">
              {TRIGGER_LABEL[draft.trigger_type] || draft.trigger_type}
            </span>
          </div>
          {draft.trigger_type === 'ON_TASK_COMPLETE' && (
            <p className="font-sans text-xs text-ink-soft">Watches for tasks matching: <strong>{draft.trigger_match}</strong></p>
          )}
          <div className="space-y-1.5">
            {draft.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-surface border border-ink/12 rounded-md px-3 py-2">
                <span className="font-sans text-[10px] font-semibold text-ink-faint">{i + 1}</span>
                <span className="font-sans text-sm flex-grow truncate">{s.task_name}</span>
                <span className="font-sans text-[9px] font-semibold uppercase text-ink-faint">{s.urgency} · {s.estimated_minutes}m</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)}>
              <X className="w-3 h-3" /> Discard
            </Button>
            <Button variant="primary" onClick={save} disabled={saving} loading={saving}>
              {!saving && <Check className="w-3 h-3" />} Save Workflow
            </Button>
          </div>
        </Card>
      )}

      {/* Saved workflows */}
      {automations.length === 0 ? (
        <EmptyState icon={WorkflowIcon} title="No automations yet" description="Describe a procedure above and AI will build one." />
      ) : (
        <div className="space-y-3">
          {automations.map((w) => (
            <Card key={w.id} variant="secondary" className={`p-4 ${w.active ? '' : 'opacity-50'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-serif text-lg font-semibold tracking-tight leading-tight">{w.name}</h3>
                  <span className="font-sans text-[9px] uppercase font-semibold text-ink-faint">{TRIGGER_LABEL[w.trigger_type] || w.trigger_type}</span>
                </div>
                <label className="flex items-center gap-1.5 font-sans text-[9px] uppercase font-semibold tracking-wider cursor-pointer shrink-0">
                  <input type="checkbox" checked={w.active} onChange={(e) => onToggleActive(w.id, e.target.checked)} />
                  Active
                </label>
              </div>
              <div className="space-y-1 mb-3">
                {w.steps.map((s, i) => (
                  <p key={i} className="font-sans text-xs text-ink-soft truncate">• {s.task_name}</p>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[10px] uppercase tracking-wide text-ink-faint">{fmtLastRun(w.last_run)}</span>
                <div className="flex gap-1">
                  <button onClick={() => onRun(w.id)} title="Run now" className="p-1.5 rounded-sm border border-ink/14 hover:bg-accent/10 hover:text-accent-strong transition-colors">
                    <Play className="w-3 h-3" />
                  </button>
                  <button onClick={() => onDelete(w.id)} title="Delete" className="p-1.5 rounded-sm border border-ink/18 hover:border-danger hover:text-danger transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
