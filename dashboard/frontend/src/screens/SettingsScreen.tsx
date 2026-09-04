import React, { useState } from 'react';
import {
  Link2, Unlink, Loader2, Download, Trash2, ShieldCheck, HelpCircle, LogOut, Bell,
} from 'lucide-react';
import { api } from '../api';
import { FocusPrefs } from '../types';
import { CARD, BTN, ScreenHead, SectionRule, Eyebrow, Toggle } from './ui';

interface Props {
  authUser: { name?: string; email?: string } | null;
  consentAcceptedAt: string | null | undefined;
  calendarConnected: boolean;
  calendarBusy: boolean;
  onConnectCalendar: () => void;
  onDisconnectCalendar: () => void;
  onLogout: () => void;
  onReplayTour: () => void;
  focusPrefs: FocusPrefs;
  onUpdateFocusPrefs: (patch: Partial<FocusPrefs>) => void;
  onGoDevices: () => void;
}

function Setting({
  label,
  desc,
  children,
}: {
  label: string;
  desc: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-t border-[#23271F]/8 first:border-t-0">
      <div>
        <div className="font-sans text-[13px] font-semibold">{label}</div>
        <div className="font-sans text-[11.5px] text-[#64695D] mt-0.5 max-w-[54ch] leading-relaxed">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsScreen({
  authUser, consentAcceptedAt, calendarConnected, calendarBusy,
  onConnectCalendar, onDisconnectCalendar, onLogout, onReplayTour,
  focusPrefs, onUpdateFocusPrefs, onGoDevices,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [notifState, setNotifState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );

  const exportData = async () => {
    setErr('');
    setExporting(true);
    try {
      const data = await api.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weft-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const deleteData = async () => {
    if (confirm !== 'DELETE') return;
    setErr('');
    setDeleting(true);
    try {
      await api.deleteMyData();
      window.location.reload();
    } catch (e: any) {
      setErr(e?.message || 'Delete failed.');
      setDeleting(false);
    }
  };

  const askNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const r = await Notification.requestPermission();
      setNotifState(r);
    } catch {
      /* unsupported */
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <ScreenHead title="Settings">How WEFT coordinates your work and your data.</ScreenHead>

      {/* Google Calendar */}
      <section className={`${CARD} p-5`}>
        <SectionRule>Google Calendar</SectionRule>
        <Setting
          label="Two-way calendar sync"
          desc="Pull events you add on your calendar in as tasks, and push your planned blocks back out. Connecting also grants the calendar scope."
        >
          <button
            onClick={calendarConnected ? onDisconnectCalendar : onConnectCalendar}
            disabled={calendarBusy}
            className={BTN}
          >
            {calendarBusy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : calendarConnected ? (
              <Unlink className="w-3.5 h-3.5" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
            {calendarConnected ? 'Disconnect' : 'Connect'}
          </button>
        </Setting>
      </section>

      {/* Notifications */}
      <section className={`${CARD} p-5`}>
        <SectionRule>Notifications</SectionRule>
        <Setting
          label="Browser notifications"
          desc={
            notifState === 'granted'
              ? 'On — reminders can pop even when this tab is in the background.'
              : notifState === 'denied'
                ? 'Blocked in your browser settings for this site. Re-enable it there to turn reminders back on.'
                : notifState === 'unsupported'
                  ? 'This browser has no notification support.'
                  : 'Off — deadline and focus reminders only show inside the app.'
          }
        >
          <button
            onClick={askNotifications}
            disabled={notifState === 'granted' || notifState === 'denied' || notifState === 'unsupported'}
            className={BTN}
          >
            <Bell className="w-3.5 h-3.5" />
            {notifState === 'granted' ? 'Enabled' : 'Enable'}
          </button>
        </Setting>
      </section>

      {/* Focus Bridge */}
      <section className={`${CARD} p-5`}>
        <SectionRule>Focus Bridge</SectionRule>
        <Setting label="Study Focus" desc="Holds reminder notifications on this device while a focus session is running.">
          <Toggle on={focusPrefs.study_focus} onChange={() => onUpdateFocusPrefs({ study_focus: !focusPrefs.study_focus })} label="Study Focus" />
        </Setting>
        <Setting label="Hold notifications during a session" desc="Held notifications still show once the session ends — nothing is lost.">
          <Toggle
            on={focusPrefs.hold_notifications}
            onChange={() => onUpdateFocusPrefs({ hold_notifications: !focusPrefs.hold_notifications })}
            label="Hold notifications during a session"
          />
        </Setting>
        <Setting label="Always allowed" desc={`${focusPrefs.allow_list.length} always break through, session or not. Edit the list from Devices.`}>
          <button onClick={onGoDevices} className={BTN}>Manage</button>
        </Setting>
      </section>

      {/* Privacy & data */}
      <section className={`${CARD} p-5`}>
        <SectionRule>Privacy &amp; data</SectionRule>

        <div className="flex items-start gap-2.5 py-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 text-[#2F7A64] shrink-0" />
          <p className="font-sans text-[12.5px] leading-relaxed">
            WEFT stores your goal/task text, workflow progress, and titles/URLs of pages you explicitly save.{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" className="underline font-semibold text-[#2F7A64]">
              Read the Privacy Policy
            </a>
            .
          </p>
        </div>
        <p className="font-sans text-[11px] text-[#8C9184] mb-1">
          {consentAcceptedAt
            ? `Data-use notice accepted ${new Date(consentAcceptedAt).toLocaleDateString()}.`
            : 'Data-use notice not yet recorded on this device.'}
        </p>

        <Setting
          label="Export my data"
          desc="Download everything WEFT holds for you as a JSON file — workflows, steps, work state and references."
        >
          <button onClick={exportData} disabled={exporting} className={BTN}>
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export JSON
          </button>
        </Setting>

        <div className="py-4 border-t border-[#23271F]/8">
          <div className="font-sans text-[13px] font-semibold text-[#C2632F]">Delete my data</div>
          <div className="font-sans text-[11.5px] text-[#64695D] mt-0.5 max-w-[54ch] leading-relaxed">
            Permanently deletes your workflows, steps, work state and references. Cannot be undone. Your account stays
            active.
          </div>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            aria-label="Type DELETE to confirm"
            className="mt-3 w-full max-w-[280px] px-3 py-2 rounded-[8px] border border-[#23271F]/18 focus:border-[#C2632F] focus:outline-none text-sm"
          />
          <div>
            <button
              onClick={deleteData}
              disabled={confirm !== 'DELETE' || deleting}
              className="mt-2 inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-wider font-semibold px-4 py-2 rounded-[10px] bg-[#C2632F] text-white hover:bg-[#A6532A] transition-colors disabled:opacity-40"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete everything
            </button>
          </div>
        </div>

        {err && <p className="text-[#C2632F] text-xs font-semibold mt-2">{err}</p>}
      </section>

      {/* Account */}
      <section className={`${CARD} p-5`}>
        <SectionRule>Account</SectionRule>
        <Setting
          label={authUser?.name ? `Signed in as ${authUser.name}` : 'Signed in'}
          desc={authUser?.email ? `${authUser.email} · Google` : 'Google account'}
        >
          <button onClick={onLogout} className={BTN}>
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </Setting>
        <Setting label="Guided tour" desc="Replay the walkthrough of the console.">
          <button onClick={onReplayTour} className={BTN}>
            <HelpCircle className="w-3.5 h-3.5" /> Replay
          </button>
        </Setting>
      </section>

      <p className="font-sans text-[10px] uppercase tracking-wider text-[#8C9184]">
        <Eyebrow>Prototype</Eyebrow> — example data. One work state, every device in step.
      </p>
    </div>
  );
}
