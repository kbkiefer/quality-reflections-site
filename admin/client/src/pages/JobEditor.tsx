import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

interface JobData {
  title: string;
  department: string;
  type: string;
  description: string;
  requirements: string;
  payRange: string;
  isActive: boolean;
}

const EMPTY: JobData = { title: '', department: 'field', type: 'full-time', description: '', requirements: '', payRange: '', isActive: true };

export default function JobEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [data, setData] = useState<JobData>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api(`/api/jobs/${id}`).then((job: any) => {
        setData({ title: job.title, department: job.department, type: job.type, description: job.description, requirements: job.requirements, payRange: job.payRange, isActive: !!job.isActive });
      });
    }
  }, [id, isNew]);

  function update(field: keyof JobData, value: any) { setData(prev => ({ ...prev, [field]: value })); }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) { await api('/api/jobs', { method: 'POST', body: JSON.stringify(data) }); }
      else { await api(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
      navigate('/jobs');
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${data.title}"?`)) return;
    await api(`/api/jobs/${id}`, { method: 'DELETE' });
    navigate('/jobs');
  }

  return (
    <form onSubmit={handleSave}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>{isNew ? 'New Position' : `Edit: ${data.title}`}</h2>
        <div className="flex gap-2">
          {!isNew && <button type="button" onClick={handleDelete} className="font-mono text-xs px-4 py-2" style={{ color: '#ef4444', border: '1px solid #ef4444' }}>Delete</button>}
          <button type="submit" disabled={saving} className="font-mono text-xs px-4 py-2 text-white uppercase" style={{ background: 'var(--glass-blue)' }}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
      <div className="max-w-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Title</span>
          <input type="text" value={data.title} onChange={e => update('title', e.target.value)} required className="block w-full mt-1 px-3 py-2 text-sm" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }} />
        </label>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Department</span>
            <select value={data.department} onChange={e => update('department', e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }}>
              <option value="field">Field</option>
              <option value="office">Office</option>
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Type</span>
            <select value={data.type} onChange={e => update('type', e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }}>
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="contract">Contract</option>
            </select>
          </label>
        </div>
        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Pay Range</span>
          <input type="text" value={data.payRange} onChange={e => update('payRange', e.target.value)} placeholder="e.g., $18-25/hr" className="block w-full mt-1 px-3 py-2 text-sm" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }} />
        </label>
        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Description</span>
          <textarea value={data.description} onChange={e => update('description', e.target.value)} rows={6} className="block w-full mt-1 px-3 py-2 text-sm" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)', resize: 'vertical' }} />
        </label>
        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Requirements</span>
          <textarea value={data.requirements} onChange={e => update('requirements', e.target.value)} rows={4} className="block w-full mt-1 px-3 py-2 text-sm" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)', resize: 'vertical' }} />
        </label>
        <label className="flex items-center gap-3 mb-2">
          <input type="checkbox" checked={data.isActive} onChange={e => update('isActive', e.target.checked)} className="w-4 h-4" />
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Active (visible on website)</span>
        </label>
      </div>
    </form>
  );
}
