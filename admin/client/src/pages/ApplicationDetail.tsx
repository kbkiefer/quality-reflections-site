import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

interface ApplicationData {
  id: number;
  name: string;
  email: string;
  phone: string;
  jobTitle: string | null;
  resumePath: string;
  formData: string;
  status: string;
  notes: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['new', 'reviewed', 'contacted', 'rejected'];

export default function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState<ApplicationData | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    api<ApplicationData>(`/api/applications/${id}`).then(data => { setApp(data); setNotes(data.notes || ''); });
  }, [id]);

  async function updateStatus(status: string) {
    await api(`/api/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    setApp(prev => prev ? { ...prev, status } : prev);
  }

  async function saveNotes() {
    setSavingNotes(true);
    await api(`/api/applications/${id}/notes`, { method: 'PATCH', body: JSON.stringify({ notes }) });
    setSavingNotes(false);
  }

  if (!app) return <p style={{ color: 'var(--steel)' }}>Loading...</p>;

  let formFields: Record<string, any> = {};
  try { formFields = JSON.parse(app.formData); } catch {}

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/applications" className="font-mono text-xs uppercase" style={{ color: 'var(--glass-blue)' }}>&larr; Back to Applications</Link>
          <h2 className="font-mono text-lg mt-2" style={{ color: 'var(--silver)' }}>{app.name}</h2>
        </div>
        <StatusBadge status={app.status} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-mono text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--glass-blue)' }}>Contact Info</h3>
          <div className="space-y-3">
            <p><span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>Email: </span><span style={{ color: 'var(--silver)' }}>{app.email}</span></p>
            <p><span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>Phone: </span><span style={{ color: 'var(--silver)' }}>{app.phone || '---'}</span></p>
            <p><span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>Position: </span><span style={{ color: 'var(--silver)' }}>{app.jobTitle || 'General'}</span></p>
            <p><span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>Applied: </span><span style={{ color: 'var(--silver)' }}>{new Date(app.createdAt).toLocaleString()}</span></p>
          </div>
          {app.resumePath && (
            <a href={`/api/applications/${id}/resume`} className="inline-block mt-4 font-mono text-xs px-4 py-2 uppercase tracking-wider" style={{ border: '1px solid var(--glass-blue)', color: 'var(--glass-blue)' }}>Download Resume</a>
          )}
        </div>
        <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-mono text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--glass-blue)' }}>Status</h3>
          <div className="flex gap-2 mb-6">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => updateStatus(s)} className="font-mono text-xs px-3 py-1 uppercase" style={{ border: `1px solid ${app.status === s ? 'var(--glass-blue)' : 'var(--border)'}`, color: app.status === s ? 'white' : 'var(--steel)', background: app.status === s ? 'var(--glass-blue)' : 'transparent' }}>{s}</button>
            ))}
          </div>
          <h3 className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--glass-blue)' }}>Internal Notes</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} className="block w-full px-3 py-2 text-sm mb-2" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)', resize: 'vertical' }} />
          <button onClick={saveNotes} disabled={savingNotes} className="font-mono text-xs px-4 py-1 text-white" style={{ background: 'var(--glass-blue)' }}>{savingNotes ? 'Saving...' : 'Save Notes'}</button>
        </div>
      </div>
      {Object.keys(formFields).length > 0 && (
        <div className="mt-6 p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-mono text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--glass-blue)' }}>Form Responses</h3>
          <div className="space-y-2">
            {Object.entries(formFields).map(([key, val]) => (
              <div key={key}><span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>{key}: </span><span className="text-sm" style={{ color: 'var(--silver)' }}>{String(val)}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
