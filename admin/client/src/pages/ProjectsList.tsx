import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

interface Project {
  id: number;
  title: string;
  category: string;
  status: string;
  coverImage: string;
  displayOrder: number;
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api<Project[]>('/api/projects').then(setProjects).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  if (loading) return <p style={{ color: 'var(--steel)' }}>Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>{projects.length} Projects</h2>
        <Link to="/projects/new" className="font-mono text-xs px-4 py-2 text-white uppercase tracking-wider" style={{ background: 'var(--glass-blue)' }}>+ Add Project</Link>
      </div>
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['', 'Title', 'Category', 'Status', 'Order', ''].map(h => (
              <th key={h} className="text-left p-3 font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr key={project.id} className="cursor-pointer hover:opacity-80" style={{ borderBottom: '1px solid var(--border)' }} onClick={() => navigate(`/projects/${project.id}`)}>
              <td className="p-3 w-16">
                {project.coverImage ? <img src={project.coverImage} alt="" className="w-12 h-9 object-cover" /> : <div className="w-12 h-9" style={{ background: 'var(--border)' }} />}
              </td>
              <td className="p-3 font-mono text-sm" style={{ color: 'var(--silver)' }}>{project.title}</td>
              <td className="p-3 text-sm" style={{ color: 'var(--steel)' }}>{project.category}</td>
              <td className="p-3"><StatusBadge status={project.status} /></td>
              <td className="p-3 font-mono text-xs" style={{ color: 'var(--steel)' }}>{project.displayOrder}</td>
              <td className="p-3 text-right">
                <button onClick={e => { e.stopPropagation(); handleDelete(project.id, project.title); }} className="font-mono text-xs px-2 py-1" style={{ color: '#ef4444', border: '1px solid #ef4444' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {projects.length === 0 && <p className="text-center py-12" style={{ color: 'var(--steel)' }}>No projects yet. Click "Add Project" to create one.</p>}
    </div>
  );
}
