import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '\u229E' },
  { to: '/projects', label: 'Projects', icon: '\u25A6' },
  { to: '/jobs', label: 'Jobs', icon: '\u229F' },
  { to: '/applications', label: 'Applications', icon: '\u25E7' },
  { to: '/settings', label: 'Settings', icon: '\u2699' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen flex flex-col blueprint-grid" style={{ background: 'var(--navy-dark)', borderRight: '1px solid var(--border)' }}>
      <div className="p-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="font-mono text-sm tracking-widest" style={{ color: 'var(--glass-blue)' }}>QR ADMIN</span>
      </div>
      <nav className="flex-1 px-2">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 mb-1 font-mono text-xs uppercase tracking-wider transition-colors ${isActive ? 'text-white' : ''}`} style={({ isActive }) => ({ color: isActive ? 'white' : 'var(--steel)', background: isActive ? 'var(--glass-blue)' : 'transparent' })}>
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
