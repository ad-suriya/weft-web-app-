// Small date/number formatters shared by the console screens. Kept separate
// from App.tsx so screen components don't have to import from it.

const pad = (n: number) => n.toString().padStart(2, '0');

export const fmtTimer = (s: number) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;

export const fmtClock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function fmtDeadline(iso: string): string {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const diff = (startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86_400_000;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function relTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// "1h 40m" from a minute count.
export function fmtDuration(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h > 0 ? `${h}h ${pad(r)}m` : `${r}m`;
}
