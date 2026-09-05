import { RingLoader } from 'react-spinners';

// Hex mirrors dashboard/frontend/src/index.css's --color-accent — the two
// apps share one visual identity now, kept in sync by hand across the two
// build systems (see that file's header comment).
const ACCENT = '#2F7A64';

interface ILoadingSpinnerProps {
  size?: number;
  /** Full-page centered spinner (Suspense fallbacks for whole-document
   *  pages like new-tab/options/side-panel). Set false for a spinner
   *  embedded inline in existing layout — e.g. the fixed-width popup,
   *  where min-h-screen would blow out the intended dimensions. */
  fullscreen?: boolean;
}

export const LoadingSpinner = ({ size, fullscreen = true }: ILoadingSpinnerProps) => (
  <div className={fullscreen ? 'flex min-h-screen items-center justify-center' : 'flex items-center justify-center py-6'}>
    <RingLoader size={size ?? (fullscreen ? 100 : 32)} color={ACCENT} />
  </div>
);
