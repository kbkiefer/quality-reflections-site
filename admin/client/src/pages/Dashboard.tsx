import { useState, useEffect } from 'react';
import { api } from '../api';

interface Stats {
  totalProjects: number;
  activeJobs: number;
  newApplications: number;
  lastPublish: string | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      api('/api/projects').catch(() => []),
      api('/api/jobs').catch(() => []),
      api('/api/applications?status=new').catch(() => []),
      api('/api/publish/status').catch(() => ({ lastPublish: null })),
    ]).then(([projects, jobs, apps, pub]) => {
      setStats({
        totalProjects: Array.isArray(projects) ? projects.length : 0,
        activeJobs: Array.isArray(jobs) ? jobs.filter((j: any) => j.isActive).length : 0,
        newApplications: Array.isArray(apps) ? apps.length : 0,
        lastPublish: pub?.lastPublish || null,
      });
    });
  }, []);

  const cards = [
    { label: 'Total Projects', value: stats?.totalProjects ?? '\u2014' },
    { label: 'Active Positions', value: stats?.activeJobs ?? '\u2014' },
    { label: 'New Applications', value: stats?.newApplications ?? '\u2014' },
    { label: 'Last Published', value: stats?.lastPublish ? new Date(stats.lastPublish).toLocaleDateString() : 'Never' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--steel)' }}>{card.label}</p>
          <p className="text-2xl font-mono" style={{ color: 'var(--glass-blue)' }}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
