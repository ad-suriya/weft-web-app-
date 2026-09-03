import { cn } from '@extension/ui';
import { FRONTEND_URL } from '@extension/storage';

interface Props {
  isLight: boolean;
  onAccept: () => void;
}

// One-time data-use notice, shown once before the popup UI is usable.
export const ConsentNotice = ({ isLight, onAccept }: Props) => (
  <div
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
    <ul className="space-y-1">
      {['No background scanning of your tabs', 'No browsing history', 'No page content unless you select and save it'].map(
        x => (
          <li key={x} className="flex gap-2">
            <span className="font-bold text-planning">✓</span>
            <span>{x}</span>
          </li>
        ),
      )}
    </ul>
    <a
      href={`${FRONTEND_URL}/privacy`}
      target="_blank"
      rel="noreferrer"
      className={cn('text-xs font-bold underline', isLight ? 'text-planning' : 'text-planning')}>
      Read the Privacy Policy
    </a>

    <button
      onClick={onAccept}
      className={cn(
        'mt-1 w-full border py-2 text-xs font-bold uppercase tracking-widest transition-all',
        isLight ? 'border-ink bg-ink text-paper hover:bg-[#333]' : 'border-paper bg-paper text-ink hover:bg-gray-200',
      )}>
      Accept &amp; continue
    </button>
  </div>
);
