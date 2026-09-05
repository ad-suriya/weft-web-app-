import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Tooltip } from '../screens/ui';
import { SPRING_SOFT } from '../lib/motion';

interface NavigationItemProps {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  badge?: number;
  dataTour?: string;
  /** 'pill' = filled background behind the whole row (vertical rail).
   *  'underline' = thin bottom border (horizontal mobile strip). */
  indicator: 'pill' | 'underline';
  /** Shared layoutId group so the indicator slides between siblings within
   *  the same rendered tree — vertical and horizontal strips use different
   *  groups since both can be mounted simultaneously (one hidden via CSS). */
  layoutGroup: string;
  /** Icon-only rail (lg–xl breakpoint) — hides the label, shows it as a tooltip. */
  collapsed?: boolean;
}

export default function NavigationItem({
  label,
  icon: Icon,
  active,
  onClick,
  badge,
  dataTour,
  indicator,
  layoutGroup,
  collapsed = false,
}: NavigationItemProps) {
  const isHorizontal = indicator === 'underline';

  const button = (
    <button
      onClick={onClick}
      data-tour={dataTour}
      aria-current={active ? 'page' : undefined}
      className={`relative flex items-center font-sans font-semibold tracking-wider uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        isHorizontal
          ? `gap-1.5 px-4 py-3 text-[10px] whitespace-nowrap shrink-0 ${active ? 'text-accent-strong' : 'text-ink-soft hover:text-ink'}`
          : collapsed
            ? `justify-center px-0 py-2.5 text-[11px] w-11 h-11 mx-auto rounded-md ${active ? 'text-accent-strong' : 'text-ink-soft hover:bg-background hover:text-ink'}`
            : `gap-3 px-3 py-2.5 text-[11px] rounded-md text-left ${active ? 'text-accent-strong' : 'text-ink-soft hover:bg-background hover:text-ink'}`
      }`}
    >
      {indicator === 'pill' && active && (
        <motion.span
          layoutId={layoutGroup}
          className="absolute inset-0 bg-accent-soft rounded-md -z-10"
          transition={SPRING_SOFT}
        />
      )}
      <motion.span whileHover={{ scale: 1.08 }} transition={{ duration: 0.15 }} className="shrink-0 flex">
        <Icon className={collapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'} />
      </motion.span>
      {!collapsed && <span className={isHorizontal ? '' : 'flex-grow'}>{label}</span>}
      {!!badge && (
        <span
          className={`shrink-0 px-1.5 rounded-full text-[9px] font-bold ${
            active ? 'bg-accent text-inverse' : 'bg-danger text-inverse'
          } ${collapsed ? 'absolute -top-0.5 -right-0.5' : ''}`}
        >
          {collapsed ? '' : badge}
        </span>
      )}
      {indicator === 'underline' && active && (
        <motion.span layoutId={layoutGroup} className="absolute left-3 right-3 -bottom-px h-0.5 bg-accent-strong" transition={SPRING_SOFT} />
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip label={label} side="right">
        {button}
      </Tooltip>
    );
  }
  return button;
}
