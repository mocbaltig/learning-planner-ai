const META = {
  high:    { label: 'Tinggi', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  average: { label: 'Sedang', color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  dot: 'bg-yellow-400' },
  low:     { label: 'Rendah', color: 'text-red-400',     bg: 'bg-red-500/10',     dot: 'bg-red-400' },
};

export default function ConfidenceBadge({ level }) {
  if (!level) return null;
  const meta = META[level];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 mt-2 ${meta.bg} ${meta.color} rounded-full px-2.5 py-1 text-xs font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden='true' />
      Keyakinan: {meta.label}
    </span>
  );
}
