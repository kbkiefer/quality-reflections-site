import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center blueprint-grid" style={{ background: 'var(--navy-black)' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h1 className="font-mono text-lg mb-6 tracking-wider" style={{ color: 'var(--glass-blue)' }}>
          QR ADMIN
        </h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Username</span>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }} required />
        </label>
        <label className="block mb-6">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Password</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }} required />
        </label>
        <button type="submit" disabled={submitting} className="w-full py-2 font-mono text-sm uppercase tracking-wider text-white" style={{ background: 'var(--glass-blue)' }}>
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
