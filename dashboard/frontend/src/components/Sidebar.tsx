import React from 'react';
import {
  Target,
  ListChecks,
  GitBranch,
  MonitorSmartphone,
  Activity,
  Settings2,
  LogOut,
  LucideIcon,
} from 'lucide-react';
import NavigationItem from './NavigationItem';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Console IA, ported from the WEFT redesign artifact.
export type Section = 'today' | 'my-work' | 'workflows' | 'devices' | 'activity' | 'settings';

interface NavItem {
  id: Section;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'today', label: 'Today', icon: Target },
  { id: 'my-work', label: 'My Work', icon: ListChecks },
  { id: 'workflows', label: 'Workflows', icon: GitBranch },
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
  // Between lg (1024px) and xl (1280px) the rail collapses to icon-only —
  // labels move into a hover tooltip instead of being cut off or forcing
  // horizontal scroll. Full labeled rail returns at xl+.
  const isCollapsedRail = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');

  if (horizontal) {
    return (
      <nav className="relative z-50 flex lg:hidden border-b border-ink/14 bg-surface overflow-x-auto">
        {NAV_ITEMS.map(({ id, label, icon }) => (
          <NavigationItem
            key={id}
            label={label}
            icon={icon}
            active={active === id}
            onClick={() => onSelect(id)}
            badge={badges[id]}
            dataTour={`nav-${id}`}
            indicator="underline"
            layoutGroup="sidebar-active-horizontal"
          />
        ))}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="flex items-center gap-1.5 px-4 py-3 font-sans text-[10px] uppercase font-semibold tracking-wider whitespace-nowrap shrink-0 text-ink-soft hover:text-danger transition-colors ml-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </nav>
    );
  }

  return (
    <nav
      className={`hidden lg:flex flex-col shrink-0 border-r border-ink/14 bg-surface h-screen sticky top-0 transition-[width] duration-200 ${
        isCollapsedRail ? 'w-16' : 'w-56'
      }`}
    >
      <div className={`border-b border-ink/12 ${isCollapsedRail ? 'px-2 py-6 flex justify-center' : 'px-5 py-6'}`}>
        {isCollapsedRail ? (
          <img src="/logo-mark.png" alt="WEFT" className="h-6 w-6" />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1.5">
              <img src="/logo-mark.png" alt="" className="h-5 w-5" />
              <span className="font-sans text-[9px] uppercase tracking-wider font-semibold text-ink-faint">WEFT</span>
            </div>
            <h1 className="text-2xl font-semibold italic tracking-tight leading-none font-serif">
              Remember.
              <br />
              Connect. Execute.
            </h1>
          </>
        )}
      </div>

      <div className={`flex flex-col gap-1 flex-grow ${isCollapsedRail ? 'p-2 items-center' : 'p-3'}`}>
        {NAV_ITEMS.map(({ id, label, icon }) => (
          <NavigationItem
            key={id}
            label={label}
            icon={icon}
            active={active === id}
            onClick={() => onSelect(id)}
            badge={badges[id]}
            dataTour={`nav-${id}`}
            indicator="pill"
            layoutGroup="sidebar-active-vertical"
            collapsed={isCollapsedRail}
          />
        ))}
      </div>

      <div className={`border-t border-ink/10 space-y-1 ${isCollapsedRail ? 'p-2 flex flex-col items-center' : 'p-4'}`}>
        {!isCollapsedRail && (
          <>
            <p className="font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint/60">One work state.</p>
            <p className="font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint/60">Every device in step.</p>
            <a
              href="/privacy"
              className="block font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint/60 hover:text-accent-strong transition-colors"
            >
              Privacy Policy
            </a>
          </>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign out"
            className={`flex items-center gap-1.5 font-sans text-[9px] uppercase font-semibold tracking-wider text-ink-faint/60 hover:text-danger transition-colors ${
              isCollapsedRail ? 'justify-center w-11 h-9' : 'pt-1'
            }`}
          >
            <LogOut className="w-3 h-3" />
            {!isCollapsedRail && 'Sign out'}
          </button>
        )}
      </div>
    </nav>
  );
}
