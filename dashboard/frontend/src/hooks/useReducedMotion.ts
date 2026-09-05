import { useEffect, useState } from 'react';

// Every `motion.*` usage in the app should branch through this instead of
// hardcoding a transition, so `prefers-reduced-motion` is honored uniformly
// (CSS-driven transitions already collapse globally via index.css; this
// covers the JS-driven `motion`/framer springs that CSS can't reach).
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
