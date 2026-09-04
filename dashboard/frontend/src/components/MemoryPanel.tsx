import React, { useState } from 'react';
import { Brain, Loader2, RefreshCw } from 'lucide-react';
import { MemoryFact } from '../types';

interface Props {
  facts: MemoryFact[];
  onSummarize: () => Promise<void>;
}

export default function MemoryPanel({ facts, onSummarize }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      await onSummarize();
    } catch (err: any) {
      setError(err.message || 'Not enough activity yet to learn from.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-[#23271F]/14 pb-2 mb-4">
        <Brain className="w-4 h-4" />
        <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">Memory</span>
        <div className="h-[1px] flex-grow bg-[#2C312A] opacity-20" />
        <button onClick={refresh} disabled={loading}
          className="font-sans text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 px-2 py-1 border border-[#23271F]/14 hover:bg-[#2C312A] hover:text-white transition-colors disabled:opacity-40">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Reflect now
        </button>
      </div>

      <p className="font-sans text-[11px] opacity-50 mb-4 italic">
        Compact patterns learned from how you actually work — never your raw chat history — fed back into the AI as context.
      </p>

      {error && <p className="font-sans text-[11px] font-bold uppercase text-[#C2632F] mb-3">{error}</p>}

      {facts.length === 0 ? (
        <div className="font-sans text-sm opacity-50 italic py-10 text-center border border-dashed border-[#23271F]/18">
          Nothing learned yet — work through a few tasks (start, finish, or skip some), then hit "Reflect now."
        </div>
      ) : (
        <div className="space-y-2">
          {facts.map((f) => (
            <div key={f.id} className="bg-white border border-[#23271F]/14 px-4 py-3 shadow-[0_4px_16px_rgba(35,39,31,0.06)]">
              <p className="font-sans text-sm">{f.fact}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
