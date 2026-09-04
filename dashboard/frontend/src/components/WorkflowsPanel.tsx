import React, { useState } from 'react';
import { Workflow as WorkflowIcon, Loader2, Play, Trash2, Sparkles, Check, X } from 'lucide-react';
import { Workflow, WorkflowPlan } from '../types';

interface Props {
  workflows: Workflow[];
  onGenerate: (sopText: string) => Promise<WorkflowPlan>;
  onSave: (plan: WorkflowPlan, sopText: string) => Promise<void>;
  onToggleActive: (id: number, active: boolean) => void;
  onRun: (id: number) => void;
  onDelete: (id: number) => void;
}

const TRIGGER_LABEL: Record<string, string> = {
  DAILY: 'Every day', WEEKLY: 'Every week', ON_TASK_COMPLETE: 'When a task completes', MANUAL: 'Manual only',
};

const fmtLastRun = (iso: string | null) => (iso ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never run');

export default function WorkflowsPanel({ workflows, onGenerate, onSave, onToggleActive, onRun, onDelete }: Props) {
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
    <div>
      <div className="flex items-center gap-3 border-b border-[#23271F]/14 pb-2 mb-4">
        <WorkflowIcon className="w-4 h-4" />
        <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">Workflows</span>
        <div className="h-[1px] flex-grow bg-[#2C312A] opacity-20" />
      </div>

      {/* SOP -> workflow generator */}
      <div className="bg-white border border-[#23271F]/14 p-4 mb-4 space-y-3 shadow-[0_4px_16px_rgba(35,39,31,0.06)]">
        <label className="font-sans text-[10px] uppercase font-bold tracking-wider block opacity-70">
          Describe a procedure (SOP) — AI turns it into an automated workflow
        </label>
        <textarea
          className="w-full p-2 border border-[#23271F]/18 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-[#2F7A64] resize-none"
          rows={3}
          placeholder="e.g. Every Monday, create tasks to review last week's goals and plan this week's top 3 priorities."
          value={sopText}
          onChange={(e) => setSopText(e.target.value)}
          disabled={generating}
        />
        <div className="flex justify-end">
          <button onClick={generate} disabled={generating || !sopText.trim()}
            className="font-sans text-[11px] font-bold uppercase tracking-wider px-4 py-2 bg-[#2C312A] text-white hover:bg-[#3A3F37] disabled:opacity-40 flex items-center gap-2">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate Workflow
          </button>
        </div>
        {error && <p className="font-sans text-[11px] font-bold uppercase text-[#C2632F]">{error}</p>}
      </div>

      {/* Draft review */}
      {draft && (
        <div className="bg-[#F1F3EF] border border-[#23271F]/14 p-4 mb-4 space-y-3 shadow-[0_8px_22px_-8px_rgba(194,99,47,0.40)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">{draft.name}</h3>
            <span className="font-sans text-[9px] font-bold px-2 py-1 bg-[#2C312A] text-white uppercase tracking-wider">
              {TRIGGER_LABEL[draft.trigger_type] || draft.trigger_type}
            </span>
          </div>
          {draft.trigger_type === 'ON_TASK_COMPLETE' && (
            <p className="font-sans text-xs opacity-70">Watches for tasks matching: <strong>{draft.trigger_match}</strong></p>
          )}
          <div className="space-y-1.5">
            {draft.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-[#23271F]/12 px-3 py-2">
                <span className="font-sans text-[10px] font-bold opacity-40">{i + 1}</span>
                <span className="font-sans text-sm flex-grow truncate">{s.task_name}</span>
                <span className="font-sans text-[9px] font-bold uppercase opacity-50">{s.urgency} · {s.estimated_minutes}m</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDraft(null)} className="font-sans text-[10px] uppercase font-bold tracking-wider px-3 py-2 flex items-center gap-1">
              <X className="w-3 h-3" /> Discard
            </button>
            <button onClick={save} disabled={saving} className="font-sans text-[10px] uppercase font-bold tracking-wider px-3 py-2 bg-[#2F7A64] text-white disabled:opacity-40 flex items-center gap-1">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save Workflow
            </button>
          </div>
        </div>
      )}

      {/* Saved workflows */}
      {workflows.length === 0 ? (
        <div className="font-sans text-sm opacity-50 italic py-10 text-center border border-dashed border-[#23271F]/18">
          No workflows yet. Describe a procedure above and AI will build one.
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => (
            <div key={w.id} className={`bg-white border border-[#23271F]/14 p-4 shadow-[0_4px_16px_rgba(35,39,31,0.06)] ${w.active ? '' : 'opacity-50'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-bold tracking-tight leading-tight">{w.name}</h3>
                  <span className="font-sans text-[9px] uppercase font-bold opacity-50">{TRIGGER_LABEL[w.trigger_type] || w.trigger_type}</span>
                </div>
                <label className="flex items-center gap-1.5 font-sans text-[9px] uppercase font-bold tracking-wider cursor-pointer shrink-0">
                  <input type="checkbox" checked={w.active} onChange={(e) => onToggleActive(w.id, e.target.checked)} />
                  Active
                </label>
              </div>
              <div className="space-y-1 mb-3">
                {w.steps.map((s, i) => (
                  <p key={i} className="font-sans text-xs opacity-70 truncate">• {s.task_name}</p>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[10px] uppercase tracking-wide opacity-50">{fmtLastRun(w.last_run)}</span>
                <div className="flex gap-1">
                  <button onClick={() => onRun(w.id)} title="Run now" className="p-1.5 border border-[#23271F]/14 hover:bg-[#2C312A] hover:text-white transition-colors"><Play className="w-3 h-3" /></button>
                  <button onClick={() => onDelete(w.id)} title="Delete" className="p-1.5 border border-[#23271F]/18 hover:border-[#C2632F] hover:text-[#C2632F] transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
