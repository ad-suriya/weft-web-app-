import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, Loader2 } from 'lucide-react';
import { api } from '../api';
import { SearchResults, Task } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATION } from '../lib/motion';

interface Props {
  onSelectTask: (task: Task) => void;
  onSelectGoal: () => void;
  onSelectHabit: () => void;
}

// AI Search Assistant: substring search is instant; when that finds
// nothing, the backend falls back to Gemini ranking so loose phrasing
// still finds the right item — this component just renders whatever
// /api/search returns, the "AI" part is entirely server-side.
export default function SearchBar({ onSelectTask, onSelectGoal, onSelectHabit }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await api.search(query.trim());
        setResults(r);
        setOpen(true);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const clear = () => {
    setQuery('');
    setResults(null);
    setOpen(false);
  };

  const total = results ? results.tasks.length + results.goals.length + results.habits.length + results.sessions.length : 0;

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-md border border-ink/14 px-3 py-1.5 bg-surface focus-within:ring-1 focus-within:ring-accent transition-colors">
        <Search className="w-3.5 h-3.5 text-ink-faint shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Search everything…"
          className="font-sans text-xs focus:outline-none w-36 md:w-44 bg-transparent"
        />
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin text-ink-faint shrink-0" />
        ) : query ? (
          <button onClick={clear} aria-label="Clear search">
            <X className="w-3 h-3 text-ink-faint" />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {open && results && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: DURATION.base }}
            className="absolute top-full mt-1 right-0 w-80 rounded-lg bg-surface border border-ink/14 shadow-popover max-h-96 overflow-y-auto z-50 origin-top-right"
          >
            {total === 0 ? (
              <div className="p-3 font-sans text-xs text-ink-faint italic">No matches.</div>
            ) : (
              <>
                {results.tasks.length > 0 && (
                  <div className="p-2">
                    <p className="font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint px-1 mb-1">Tasks</p>
                    {results.tasks.map((t) => (
                      <button key={t.id} onClick={() => { onSelectTask(t); clear(); }}
                        className="w-full text-left px-2 py-1.5 rounded-sm hover:bg-background font-sans text-sm truncate block transition-colors">
                        {t.task_name}
                      </button>
                    ))}
                  </div>
                )}
                {results.goals.length > 0 && (
                  <div className="p-2 border-t border-ink/10">
                    <p className="font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint px-1 mb-1">Goals</p>
                    {results.goals.map((g) => (
                      <button key={g.id} onClick={() => { onSelectGoal(); clear(); }}
                        className="w-full text-left px-2 py-1.5 rounded-sm hover:bg-background font-sans text-sm truncate block transition-colors">
                        {g.title}
                      </button>
                    ))}
                  </div>
                )}
                {results.habits.length > 0 && (
                  <div className="p-2 border-t border-ink/10">
                    <p className="font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint px-1 mb-1">Habits</p>
                    {results.habits.map((h) => (
                      <button key={h.id} onClick={() => { onSelectHabit(); clear(); }}
                        className="w-full text-left px-2 py-1.5 rounded-sm hover:bg-background font-sans text-sm truncate block transition-colors">
                        {h.name}
                      </button>
                    ))}
                  </div>
                )}
                {results.sessions.length > 0 && (
                  <div className="p-2 border-t border-ink/10">
                    <p className="font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint px-1 mb-1">Focus Sessions</p>
                    {results.sessions.map((s) => (
                      <div key={s.id} className="px-2 py-1.5 font-sans text-sm truncate text-ink-soft">
                        {s.description || 'Focus session'}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
