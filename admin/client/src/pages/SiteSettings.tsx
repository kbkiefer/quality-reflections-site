import { useState, useEffect, FormEvent } from 'react';
import { api } from '../api';

interface Settings {
  companyName: string;
  companyNameShort: string;
  companyNameLine2: string;
  phone: string;
  phoneLink: string;
  email: string;
  address: string;
  copyrightYear: string;
}

const EMPTY: Settings = {
  companyName: '', companyNameShort: '', companyNameLine2: '',
  phone: '', phoneLink: '', email: '', address: '', copyrightYear: '',
};

const LABELS: Record<keyof Settings, string> = {
  companyName: 'Company Name (Full)',
  companyNameShort: 'Company Name (Short)',
  companyNameLine2: 'Company Name Line 2',
  phone: 'Phone (Display)',
  phoneLink: 'Phone (Link)',
  email: 'Email',
  address: 'Address',
  copyrightYear: 'Copyright Year',
};

export default function SiteSettings() {
  const [data, setData] = useState<Settings>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/api/content/settings').then(d => setData({ ...EMPTY, ...d }));
  }, []);

  function update(field: keyof Settings, value: string) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/content/settings', { method: 'PUT', body: JSON.stringify(data) });
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  const inputStyle = { background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' };
  const labelStyle = { color: 'var(--steel)' };

  return (
    <form onSubmit={handleSave}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>Site Settings</h2>
        <button type="submit" disabled={saving} className="font-mono text-xs px-4 py-2 text-white uppercase" style={{ background: 'var(--glass-blue)' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <span className="font-mono text-xs uppercase tracking-wider block mb-4" style={labelStyle}>Company Identity</span>
          {(['companyName', 'companyNameShort', 'companyNameLine2'] as const).map(field => (
            <label key={field} className="block mb-4">
              <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>{LABELS[field]}</span>
              <input type="text" value={data[field]} onChange={e => update(field, e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle} />
            </label>
          ))}
        </div>
        <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <span className="font-mono text-xs uppercase tracking-wider block mb-4" style={labelStyle}>Contact Information</span>
          {(['phone', 'phoneLink', 'email', 'address', 'copyrightYear'] as const).map(field => (
            <label key={field} className="block mb-4">
              <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>{LABELS[field]}</span>
              <input type="text" value={data[field]} onChange={e => update(field, e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle} />
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}
