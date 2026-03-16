import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';

export default function TopBar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string>('idle');

  async function handlePublish() {
    if (!confirm('Publish all changes to the live site?')) return;
    setPublishing(true);
    setPublishStatus('building');
    try {
      await api('/api/publish', { method: 'POST' });
      setPublishStatus('live');
      setTimeout(() => setPublishStatus('idle'), 3000);
    } catch {
      setPublishStatus('error');
      setTimeout(() => setPublishStatus('idle'), 3000);
    } finally {
      setPublishing(false);
    }
  }

  function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    if (current === 'light') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', 'light');
    }
  }

  return (
    <header className="h-14 flex items-center justify-between px-6" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <h1 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>{title}</h1>
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="font-mono text-xs px-2 py-1" style={{ color: 'var(--steel)', border: '1px solid var(--border)' }}>Theme</button>
        <button onClick={handlePublish} disabled={publishing} className="font-mono text-xs px-4 py-1 text-white uppercase tracking-wider" style={{ background: publishStatus === 'live' ? '#22c55e' : publishStatus === 'error' ? '#ef4444' : 'var(--glass-blue)' }}>
          {publishStatus === 'building' ? 'Building...' : publishStatus === 'live' ? 'Published!' : publishStatus === 'error' ? 'Failed' : 'Publish'}
        </button>
        <span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>{user?.displayName}</span>
        <button onClick={logout} className="font-mono text-xs" style={{ color: 'var(--steel)' }}>Logout</button>
      </div>
    </header>
  );
}
