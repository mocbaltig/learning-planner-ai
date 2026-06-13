import { Lightbulb } from 'lucide-react';

export default function RationaleBox({ rationale }) {
  if (!rationale) return null;
  return (
    <div className='flex gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2.5'>
      <Lightbulb className='text-amber-400 flex-shrink-0 mt-0.5' size={14} />
      {Array.isArray(rationale) ? (
        <ul className='text-amber-300/80 text-xs leading-relaxed list-disc list-inside space-y-0.5'>
          {rationale.map((f, j) => <li key={j}>{f}</li>)}
        </ul>
      ) : (
        <p className='text-amber-300/80 text-xs leading-relaxed'>{rationale}</p>
      )}
    </div>
  );
}
