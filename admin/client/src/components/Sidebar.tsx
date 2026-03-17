import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '\u229E' },
];

const CONTENT_ITEMS = [
  { to: '/settings', label: 'Site Settings', icon: '\u2699' },
  { to: '/content/hero', label: 'Hero', icon: '\u25B3' },
  { to: '/content/testimonials', label: 'Testimonials', icon: '\u275D' },
  { to: '/content/careers', label: 'Careers', icon: '\u2605' },
  { to: '/content/contact', label: 'Contact', icon: '\u2709' },
];

const DATA_ITEMS = [
  { to: '/projects', label: 'Projects', icon: '\u25A6' },
  { to: '/jobs', label: 'Jobs', icon: '\u229F' },
  { to: '/applications', label: 'Applications', icon: '\u25E7' },
];

function NavItem({ to, label, icon, end }: { to: string; label: string; icon: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 mb-1 font-mono text-xs uppercase tracking-wider transition-colors ${isActive ? 'text-white' : ''}`} style={({ isActive }) => ({ color: isActive ? 'white' : 'var(--steel)', background: isActive ? 'var(--glass-blue)' : 'transparent' })}>
      <span className="text-base">{icon}</span>
      {label}
    </NavLink>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-2">
      <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--glass-blue)', opacity: 0.6 }}>{label}</span>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen flex flex-col blueprint-grid" style={{ background: 'var(--navy-dark)', borderRight: '1px solid var(--border)' }}>
      <div className="p-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="font-mono text-sm tracking-widest" style={{ color: 'var(--glass-blue)' }}>QR ADMIN</span>
      </div>
      <nav className="flex-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} end={item.to === '/'} />
        ))}
        <SectionLabel label="Content" />
        {CONTENT_ITEMS.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
        <SectionLabel label="Data" />
        {DATA_ITEMS.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  );
}
