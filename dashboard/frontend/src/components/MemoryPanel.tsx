import React, { useState } from 'react';
import { Brain, RefreshCw } from 'lucide-react';
import { MemoryFact } from '../types';
import { Card, Button, EmptyState } from '../screens/ui';

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
      {/* No section header — always inside a Collapsible titled "What WEFT
          has learned" already. Only the refresh action belongs here. */}
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={refresh} disabled={loading} loading={loading}>
          {!loading && <RefreshCw className="w-3 h-3" />} Reflect now
        </Button>
      </div>

      <p className="font-sans text-[11px] text-ink-faint mb-4 italic">
        Compact patterns learned from how you actually work — never your raw chat history — fed back into the AI as context.
      </p>

      {error && <p className="font-sans text-[11px] font-semibold uppercase text-danger mb-3">{error}</p>}

      {facts.length === 0 ? (
        <EmptyState icon={Brain} title="Nothing learned yet" description={'Work through a few tasks (start, finish, or skip some), then hit "Reflect now."'} />
      ) : (
        <div className="space-y-2">
          {facts.map((f) => (
            <Card key={f.id} variant="secondary" className="px-4 py-3">
              <p className="font-sans text-sm">{f.fact}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
