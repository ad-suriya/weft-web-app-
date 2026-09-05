import React from 'react';
import {
  Target,
  ListChecks,
  GitBranch,
  Layers,
  MonitorSmartphone,
  Activity,
  Settings2,
  LogOut,
  LucideIcon,
} from 'lucide-react';

// Console IA, ported from the WEFT redesign artifact.
export type Section = 'today' | 'my-work' | 'workflows' | 'context' | 'devices' | 'activity' | 'settings';

interface NavItem {
  id: Section;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'today', label: 'Today', icon: Target },
  { id: 'my-work', label: 'My Work', icon: ListChecks },
  { id: 'workflows', label: 'Workflows', icon: GitBranch },
  { id: 'context', label: 'Context', icon: Layers },
  { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

interface Props {
  active: Section;
  onSelect: (s: Section) => void;
  badges?: Partial<Record<Section, number>>;
  // Rendered as a horizontal strip on small screens instead of a sidebar —
  // every section stays one tap away regardless of viewport.
  horizontal?: boolean;
  // Optional so existing callers that don't pass it don't break — but both
  // App.tsx render sites now do, so this always shows in practice.
  onLogout?: () => void;
}

export default function Sidebar({ active, onSelect, badges = {}, horizontal = false, onLogout }: Props) {
  if (horizontal) {
    return (
      <nav className="relative z-50 flex lg:hidden border-b border-[#23271F]/14 bg-white overflow-x-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            data-tour={`nav-${id}`}
            className={`flex items-center gap-1.5 px-4 py-3 font-sans text-[10px] uppercase font-semibold tracking-wider whitespace-nowrap shrink-0 rounded-none ${
              active === id ? 'bg-[#E6F0EB] text-[#245E4E]' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {!!badges[id] && (
              <span className="ml-1 px-1.5 bg-[#C2632F] text-white rounded-full text-[9px]">{badges[id]}</span>
            )}
          </button>
        ))}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="flex items-center gap-1.5 px-4 py-3 font-sans text-[10px] uppercase font-semibold tracking-wider whitespace-nowrap shrink-0 opacity-70 hover:opacity-100 hover:text-[#C2632F] ml-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </nav>
    );
  }

  return (
    <nav className="hidden lg:flex flex-col w-56 shrink-0 border-r border-[#23271F]/14 bg-white h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-[#23271F]/12">
        <div className="flex items-center gap-2 mb-1.5">
          <img src="/logo-mark.png" alt="" className="h-5 w-5" />
          <span className="font-sans text-[9px] uppercase tracking-wider font-semibold opacity-60">WEFT</span>
        </div>
        <h1 className="text-2xl font-semibold italic tracking-tight leading-none font-serif">
          Remember.
          <br />
          Connect. Execute.
        </h1>
      </div>

      <div className="flex flex-col gap-1 p-3 flex-grow">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            data-tour={`nav-${id}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] font-sans text-[11px] uppercase font-semibold tracking-wider transition-colors text-left ${
              active === id ? 'bg-[#E6F0EB] text-[#245E4E]' : 'text-[#454A3E] hover:bg-[#F1F3EF]'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-grow">{label}</span>
            {!!badges[id] && (
              <span
                className={`px-1.5 rounded-full text-[9px] font-bold ${
                  active === id ? 'bg-[#2F7A64] text-white' : 'bg-[#C2632F] text-white'
                }`}
              >
                {badges[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-[#23271F]/10 space-y-1">
        <p className="font-sans text-[9px] uppercase font-semibold tracking-wider opacity-40">One work state.</p>
        <p className="font-sans text-[9px] uppercase font-semibold tracking-wider opacity-40">Every device in step.</p>
        <a
          href="/privacy"
          className="block font-sans text-[9px] uppercase font-semibold tracking-wider opacity-40 hover:opacity-80 hover:text-[#2F7A64] transition-opacity"
        >
          Privacy Policy
        </a>
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 font-sans text-[9px] uppercase font-semibold tracking-wider opacity-40 hover:opacity-80 hover:text-[#C2632F] transition-opacity pt-1"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}
