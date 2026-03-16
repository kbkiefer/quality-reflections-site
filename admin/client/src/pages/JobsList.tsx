import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

interface Job {
  id: number;
  title: string;
  department: string;
  type: string;
  isActive: number;
  applicationCount: number;
  displayOrder: number;
}

export default function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api<Job[]>('/api/jobs').then(setJobs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleToggle(id: number) {
    const result = await api<{ isActive: number }>(`/api/jobs/${id}/toggle`, { method: 'PATCH' });
    setJobs(prev => prev.map(j => j.id === id ? { ...j, isActive: result.isActive } : j));
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await api(`/api/jobs/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
  }

  const fieldJobs = jobs.filter(j => j.department === 'field');
  const officeJobs = jobs.filter(j => j.department === 'office');

  function renderGroup(label: string, items: Job[]) {
    return (
      <div className="mb-8">
        <h3 className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--glass-blue)' }}>{label} ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'var(--steel)' }}>No positions in this department.</p>
        ) : (
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Title', 'Type', 'Active', 'Applications', ''].map(h => (
                  <th key={h} className="text-left p-3 font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(job => (
                <tr key={job.id} className="cursor-pointer hover:opacity-80" style={{ borderBottom: '1px solid var(--border)' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                  <td className="p-3 font-mono text-sm" style={{ color: 'var(--silver)' }}>{job.title}</td>
                  <td className="p-3 text-sm" style={{ color: 'var(--steel)' }}>{job.type}</td>
                  <td className="p-3">
                    <button onClick={e => { e.stopPropagation(); handleToggle(job.id); }} className="font-mono text-xs px-3 py-1" style={{ border: `1px solid ${job.isActive ? '#22c55e' : '#6b7280'}`, color: job.isActive ? '#22c55e' : '#6b7280' }}>
                      {job.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3 font-mono text-sm" style={{ color: 'var(--glass-blue)' }}>{job.applicationCount}</td>
                  <td className="p-3 text-right">
                    <button onClick={e => { e.stopPropagation(); handleDelete(job.id, job.title); }} className="font-mono text-xs px-2 py-1" style={{ color: '#ef4444', border: '1px solid #ef4444' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (loading) return <p style={{ color: 'var(--steel)' }}>Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>Job Listings</h2>
        <Link to="/jobs/new" className="font-mono text-xs px-4 py-2 text-white uppercase tracking-wider" style={{ background: 'var(--glass-blue)' }}>+ Add Position</Link>
      </div>
      {renderGroup('Field Positions', fieldJobs)}
      {renderGroup('Office Positions', officeJobs)}
    </div>
  );
}
