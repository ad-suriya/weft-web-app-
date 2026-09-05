import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn, useReducedMotion } from '@extension/ui';
import { FRONTEND_URL } from '@extension/storage';

interface Props {
  isLight: boolean;
  onAccept: () => void;
}

// One-time data-use notice, shown once before the popup UI is usable.
export const ConsentNotice = ({ isLight, onAccept }: Props) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.22 }}
      className={cn('flex w-full flex-col gap-3 p-4 font-sans text-sm', isLight ? 'bg-paper text-ink' : 'bg-ink text-paper')}
      style={{ width: '380px' }}>
      <div className="flex items-center gap-2">
        <img src={chrome.runtime.getURL('icon-128.png')} alt="" className="h-5 w-5" />
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">What WEFT stores</span>
      </div>

      <p className="leading-relaxed">
        This extension reads the <strong>title and URL of your current tab only</strong>, and sends it to WEFT only when
        you save a reference or capture a task.
      </p>
      <p className="leading-relaxed">
        <strong>While a focus session is running on a task,</strong> it also checks your active tab's title/URL against
        that task to notice when you've drifted — this check happens on your device only, is never sent anywhere, and
        stops the moment your session ends or pauses.
      </p>
      <ul className="space-y-1">
        {[
          'No background scanning outside an active focus session',
          'No browsing history',
          'No page content unless you select and save it',
        ].map(x => (
          <li key={x} className="flex gap-2">
            <Check className="w-3.5 h-3.5 text-planning shrink-0 mt-0.5" />
            <span>{x}</span>
          </li>
        ))}
      </ul>
      <a
        href={`${FRONTEND_URL}/privacy`}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-bold underline text-planning">
        Read the Privacy Policy
      </a>

      <motion.button
        onClick={onAccept}
        whileTap={reduced ? undefined : { scale: 0.98 }}
        className={cn(
          'mt-1 w-full rounded-md py-2 text-xs font-bold uppercase tracking-widest shadow-card transition-colors',
          isLight ? 'bg-ink text-paper hover:bg-[#333]' : 'bg-paper text-ink hover:bg-gray-200',
        )}>
        Accept &amp; continue
      </motion.button>
    </motion.div>
  );
};
