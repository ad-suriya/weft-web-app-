import React from 'react';

// Shared building blocks for the console screens (Today / My Work / Context /
// Devices / Activity / Settings). Soft-modern system: warm ground, hairline
// borders, soft shadows, rounded corners, Fraunces for display text and
// `font-sans` (Inter) for chrome.

export const CARD =
  'bg-white border border-[#23271F]/12 rounded-[14px] shadow-[0_4px_16px_rgba(35,39,31,0.06)]';
export const CARD_HERO =
  'bg-white border border-[#23271F]/12 rounded-[20px] shadow-[0_18px_45px_-14px_rgba(35,39,31,0.22)]';
export const CARD_DARK =
  'bg-[#2C312A] text-white rounded-[16px] shadow-[0_14px_36px_-14px_rgba(35,39,31,0.4)]';

export const BTN =
  'inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-wider font-semibold px-4 py-2 rounded-[10px] border border-[#23271F]/14 hover:bg-[#2F7A64]/10 hover:text-[#245E4E] hover:border-transparent transition-colors disabled:opacity-40';
export const BTN_GO =
  'inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-wider font-semibold px-4 py-2 rounded-[10px] bg-[#2F7A64] text-white hover:bg-[#245E4E] transition-colors disabled:opacity-40';
export const BTN_SM =
  'inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1.5 rounded-[8px] border border-[#23271F]/14 hover:bg-[#2F7A64]/10 hover:text-[#245E4E] hover:border-transparent transition-colors disabled:opacity-40';

export function ScreenHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header>
      <h2 className="font-serif text-3xl md:text-[2.15rem] font-semibold tracking-tight leading-[1.1]">
        {title}
      </h2>
      {children && (
        <p className="mt-2 font-sans text-[13px] text-[#64695D] max-w-[62ch] leading-relaxed">{children}</p>
      )}
    </header>
  );
}

export function Eyebrow({
  children,
  tone = 'dim',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'dim' | 'ink' | 'green';
  className?: string;
}) {
  const color = tone === 'ink' ? 'text-[#23271F]' : tone === 'green' ? 'text-[#245E4E]' : 'text-[#64695D]';
  return (
    <span className={`font-sans text-[10px] font-semibold uppercase tracking-[0.12em] ${color} ${className}`}>
      {children}
    </span>
  );
}

export function SectionRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Eyebrow tone="ink">{children}</Eyebrow>
      <div className="h-px flex-grow bg-[#23271F]/10" />
    </div>
  );
}

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'green' | 'amber' | 'orange' | 'ink';
}) {
  const map: Record<string, string> = {
    neutral: 'border-[#23271F]/18 text-[#64695D] bg-white',
    green: 'border-transparent text-white bg-[#2F7A64]',
    amber: 'border-transparent text-[#23271F] bg-[#E8DFBE]',
    orange: 'border-transparent text-white bg-[#C2632F]',
    ink: 'border-transparent text-white bg-[#2C312A]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans text-[9px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function Meter({ value, className = '' }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`h-2 rounded-full bg-[#E8EBE4] overflow-hidden ${className}`}>
      <div className="h-full rounded-full bg-[#2F7A64] transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

// A collapsible section for panels folded into a bigger screen (Goals/Habits/
// Breakdown into My Work, Memory into Context) — native <details> so it needs
// no state and stays keyboard/screen-reader accessible.
export function Collapsible({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={`${CARD} group`} open={defaultOpen}>
      <summary className="cursor-pointer list-none flex items-center gap-3 px-5 py-4 select-none">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-wider">{title}</span>
        <div className="h-px flex-grow bg-[#23271F]/10" />
        <span className="font-sans text-[10px] text-[#8C9184] group-open:hidden">Show</span>
        <span className="font-sans text-[10px] text-[#8C9184] hidden group-open:inline">Hide</span>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative w-10 h-6 rounded-full border-2 shrink-0 transition-colors ${
        on ? 'bg-[#2F7A64] border-[#2F7A64]' : 'bg-[#E8EBE4] border-[#23271F]/18'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// A small "preview / not wired up" tag for the stubbed device-sync surfaces.
export function PreviewTag() {
  return (
    <span className="font-sans text-[8.5px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full border border-[#C2632F]/40 text-[#C2632F]">
      Preview
    </span>
  );
}
