import React, { useState } from 'react';
import { X, Download, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { api } from './api';

interface Props {
  consentAcceptedAt?: string;
  onClose: () => void;
  onDeleted: () => void;
}

// Reached from the dashboard top bar ("Privacy & Data"). Lets the user read the
// policy, export everything WEFT holds as JSON, or delete all of their content.
export const DataPrivacyModal: React.FC<Props> = ({ consentAcceptedAt, onClose, onDeleted }) => {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const exportData = async () => {
    setError('');
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
      setError(e?.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const deleteData = async () => {
    if (confirm !== 'DELETE') return;
    setError('');
    setDeleting(true);
    try {
      await api.deleteMyData();
      onDeleted();
    } catch (e: any) {
      setError(e?.message || 'Delete failed.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#1A1A1A]/70 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_#1A1A1A]">
        <div className="border-b-2 border-[#1A1A1A] px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-black italic">Privacy &amp; Data</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 hover:opacity-60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 text-sm leading-relaxed">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-[#2A6B5E] shrink-0" />
            <p>
              WEFT stores your goal/task text, workflow progress, and titles/URLs of pages you explicitly save.{' '}
              <a href="/privacy" target="_blank" rel="noreferrer" className="underline font-bold text-[#2A6B5E]">
                Read the Privacy Policy
              </a>
              .
            </p>
          </div>
          <p className="text-xs opacity-60">
            {consentAcceptedAt
              ? `Data-use notice accepted ${new Date(consentAcceptedAt).toLocaleDateString()}.`
              : 'Data-use notice not yet recorded.'}
          </p>

          <div className="border-t border-[#1A1A1A]/15 pt-4">
            <p className="font-bold text-[13px] uppercase tracking-widest">Export my data</p>
            <p className="opacity-70 text-xs mt-1">Download everything WEFT holds for you as a JSON file.</p>
            <button
              onClick={exportData}
              disabled={exporting}
              className="mt-3 font-sans text-[11px] uppercase tracking-widest font-bold px-4 py-2 border-2 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export JSON
            </button>
          </div>

          <div className="border-t border-[#1A1A1A]/15 pt-4">
            <p className="font-bold text-[13px] uppercase tracking-widest text-[#D14D2A]">Delete my data</p>
            <p className="opacity-70 text-xs mt-1">
              Permanently deletes your workflows, steps, work state and references. Cannot be undone. Your account
              stays active.
            </p>
            <input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder='Type DELETE to confirm'
              className="mt-3 w-full px-3 py-2 border-2 border-[#1A1A1A]/30 focus:border-[#D14D2A] focus:outline-none text-sm"
            />
            <button
              onClick={deleteData}
              disabled={confirm !== 'DELETE' || deleting}
              className="mt-2 font-sans text-[11px] uppercase tracking-widest font-bold px-4 py-2 bg-[#D14D2A] text-white hover:bg-[#a83c20] transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete everything
            </button>
          </div>

          {error && <p className="text-[#D14D2A] text-xs font-bold">{error}</p>}
        </div>
      </div>
    </div>
  );
};
