import React, { useEffect, useState } from 'react';
import { Check, X, Loader2, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Quiz, QuizSubmitResult, Workflow } from '../types';
import { Modal, Button, Pill, Meter } from '../screens/ui';

interface Props {
  open: boolean;
  workflowId: number;
  subject: string;
  onClose: () => void;
  onGenerate: (workflowId: number) => Promise<Quiz>;
  onSubmit: (workflowId: number, quizId: number, answers: number[]) => Promise<QuizSubmitResult>;
  onFinished: (workflow: Workflow) => void;
}

export default function QuizModal({ open, workflowId, subject, onClose, onGenerate, onSubmit, onFinished }: Props) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<QuizSubmitResult['result'] | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuiz(null);
    setAnswers([]);
    setResult(null);
    setError('');
    setLoading(true);
    onGenerate(workflowId)
      .then((q) => { setQuiz(q); setAnswers(new Array(q.questions.length).fill(-1)); })
      .catch((err) => setError(err.message || 'Could not build a quiz right now.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workflowId]);

  const choose = (qi: number, oi: number) => {
    if (result) return;
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
  };

  const submit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setError('');
    try {
      const r = await onSubmit(workflowId, quiz.id, answers);
      setResult(r.result);
      onFinished(r.workflow);
    } catch (err: any) {
      setError(err.message || 'Could not submit the quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = quiz ? answers.every((a) => a >= 0) : false;

  return (
    <Modal open={open} onClose={onClose} title={`${subject} quiz`} className="max-w-xl">
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-[10px] uppercase font-semibold tracking-wider text-ink-faint">Review</p>
            <h3 className="font-serif text-xl font-semibold tracking-tight mt-0.5">{subject} quiz</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-sm text-ink-faint hover:text-ink transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-10 text-ink-soft">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <p className="font-sans text-xs uppercase tracking-wider font-semibold">Building your quiz…</p>
          </div>
        )}

        {error && !loading && (
          <p className="font-sans text-[12px] font-semibold text-danger">{error}</p>
        )}

        {!loading && quiz && !result && (
          <>
            <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
              {quiz.questions.map((q, qi) => (
                <div key={qi} className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="font-sans text-[11px] font-semibold text-ink-faint mt-0.5">{qi + 1}.</span>
                    <div className="min-w-0">
                      <p className="font-sans text-sm leading-snug">{q.question}</p>
                      <Pill tone="neutral">{q.topic}</Pill>
                    </div>
                  </div>
                  <div className="grid gap-1.5 pl-5">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => choose(qi, oi)}
                        className={`text-left font-sans text-[13px] px-3 py-2 rounded-md border transition-colors ${
                          answers[qi] === oi
                            ? 'border-accent bg-accent-soft text-accent-strong font-medium'
                            : 'border-ink/14 hover:bg-accent/10 hover:border-transparent'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1 border-t border-ink/10">
              <Button variant="primary" onClick={submit} disabled={!allAnswered || submitting} loading={submitting}>
                {!submitting && <Sparkles className="w-3.5 h-3.5" />} Submit quiz
              </Button>
            </div>
          </>
        )}

        {result && quiz && (
          <div className="flex flex-col gap-5">
            <div className="text-center py-2">
              <p className="font-sans text-[10px] uppercase font-semibold tracking-wider text-ink-faint">Score</p>
              <p className="font-serif text-5xl font-semibold tracking-tight mt-1">
                {result.correct}<span className="text-ink-faint text-2xl"> / {result.total}</span>
              </p>
              <Meter value={result.score_pct} className="mt-3 max-w-[200px] mx-auto" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="font-sans text-[10px] uppercase font-semibold tracking-wider text-accent-strong flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Strong
                </p>
                <div className="flex flex-col gap-1.5">
                  {result.strong_topics.length === 0 && <p className="font-sans text-[12px] text-ink-faint">None yet</p>}
                  {result.strong_topics.map((t) => (
                    <div key={t} className="flex items-center gap-1.5 font-sans text-[12.5px]">
                      <Check className="w-3.5 h-3.5 text-accent-strong shrink-0" /> {t}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-sans text-[10px] uppercase font-semibold tracking-wider text-danger flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3.5 h-3.5" /> Needs review
                </p>
                <div className="flex flex-col gap-1.5">
                  {result.weak_topics.length === 0 && <p className="font-sans text-[12px] text-ink-faint">None — nice work</p>}
                  {result.weak_topics.map((t) => (
                    <div key={t} className="flex items-center gap-1.5 font-sans text-[12.5px]">
                      <span className="text-danger shrink-0">!</span> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {result.weak_topics.length > 0 && (
              <p className="font-sans text-[12px] text-ink-soft bg-background border border-ink/10 rounded-md px-3.5 py-2.5">
                Added a targeted revision task for {result.weak_topics.length === 1 ? 'this topic' : 'each of these topics'} to your plan.
              </p>
            )}

            <div className="flex justify-end">
              <Button variant="primary" onClick={onClose}>Continue</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
