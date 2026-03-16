const STATUS_COLORS: Record<string, string> = {
  draft: '#f59e0b',
  published: '#22c55e',
  active: '#22c55e',
  inactive: '#6b7280',
  new: '#3b82f6',
  reviewed: '#8b5cf6',
  contacted: '#22c55e',
  rejected: '#ef4444',
};

export default function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'var(--steel)';
  return (
    <span className="inline-block px-2 py-0.5 font-mono text-xs uppercase tracking-wider" style={{ border: `1px solid ${color}`, color }}>
      {status}
    </span>
  );
}
