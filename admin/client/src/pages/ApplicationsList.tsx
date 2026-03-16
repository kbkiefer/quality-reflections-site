import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

interface Application {
  id: number;
  name: string;
  email: string;
  jobTitle: string | null;
  status: string;
  createdAt: string;
}

export default function ApplicationsList() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = statusFilter ? `?status=${statusFilter}` : '';
    setLoading(true);
    api<Application[]>(`/api/applications${params}`).then(setApps).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <p style={{ color: 'var(--steel)' }}>Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>Applications ({apps.length})</h2>
        <div className="flex gap-2">
          {['', 'new', 'reviewed', 'contacted', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className="font-mono text-xs px-3 py-1 uppercase" style={{ border: `1px solid ${statusFilter === s ? 'var(--glass-blue)' : 'var(--border)'}`, color: statusFilter === s ? 'white' : 'var(--steel)', background: statusFilter === s ? 'var(--glass-blue)' : 'transparent' }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Name', 'Position', 'Date', 'Status'].map(h => (
              <th key={h} className="text-left p-3 font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {apps.map(app => (
            <tr key={app.id} className="cursor-pointer hover:opacity-80" style={{ borderBottom: '1px solid var(--border)' }} onClick={() => navigate(`/applications/${app.id}`)}>
              <td className="p-3">
                <div className="font-mono text-sm" style={{ color: 'var(--silver)' }}>{app.name}</div>
                <div className="text-xs" style={{ color: 'var(--steel)' }}>{app.email}</div>
              </td>
              <td className="p-3 text-sm" style={{ color: 'var(--steel)' }}>{app.jobTitle || 'General'}</td>
              <td className="p-3 font-mono text-xs" style={{ color: 'var(--steel)' }}>{new Date(app.createdAt).toLocaleDateString()}</td>
              <td className="p-3"><StatusBadge status={app.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {apps.length === 0 && <p className="text-center py-12" style={{ color: 'var(--steel)' }}>No applications {statusFilter ? `with status "${statusFilter}"` : 'yet'}.</p>}
    </div>
  );
}
