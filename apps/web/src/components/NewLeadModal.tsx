import { useState } from 'react';
import type { Lead } from '@dealpilot/shared';
import { api } from '../lib/api';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}

export default function NewLeadModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({ contactName: '', companyUrl: '', company: '', industry: '', initialUseCase: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactName.trim()) { setError('Contact name is required.'); return; }
    setError(null);
    setSaving(true);
    try {
      const lead = await api.createLead(form);
      onCreated(lead);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create lead.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-slate-900">New Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {[
            { k: 'contactName' as const, label: 'Contact Name *', placeholder: 'Jane Doe' },
            { k: 'companyUrl' as const, label: 'Company URL', placeholder: 'https://acme.com (auto-fills company + AI context)' },
            { k: 'company' as const, label: 'Company', placeholder: 'Acme Inc' },
            { k: 'industry' as const, label: 'Industry', placeholder: 'SaaS' },
          ].map(({ k, label, placeholder }) => (
            <div key={k}>
              <label className="mb-1 block text-[12px] font-medium text-slate-500">{label}</label>
              <input
                value={form[k]}
                onChange={set(k)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-indigo-400"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-500">Initial Use Case</label>
            <textarea
              value={form.initialUseCase}
              onChange={set('initialUseCase')}
              rows={2}
              placeholder="What are they looking to solve?"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-indigo-400"
            />
          </div>
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
