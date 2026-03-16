const SERVICES = [
  { key: 'curtain-wall', label: 'Curtain Wall' },
  { key: 'storefront', label: 'Storefront' },
  { key: 'window', label: 'Windows' },
  { key: 'entrance', label: 'Entrances' },
  { key: 'railing', label: 'Railings' },
  { key: 'skylight', label: 'Skylights' },
];

interface Props {
  selected: string[];
  onChange: (services: string[]) => void;
  readOnly?: boolean;
}

export default function ServiceBadges({ selected, onChange, readOnly }: Props) {
  function toggle(key: string) {
    if (readOnly) return;
    onChange(selected.includes(key) ? selected.filter(s => s !== key) : [...selected, key]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SERVICES.map(s => {
        const active = selected.includes(s.key);
        return (
          <button key={s.key} type="button" onClick={() => toggle(s.key)} disabled={readOnly} className="px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors" style={{ border: `1px solid ${active ? 'var(--glass-blue)' : 'var(--border)'}`, background: active ? 'var(--glass-blue)' : 'transparent', color: active ? 'white' : 'var(--steel)' }}>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
