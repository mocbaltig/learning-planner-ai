import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center' onClick={onCancel}>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' />
      <div
        className='relative z-10 w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4'
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-start gap-3'>
          <div className='p-2 rounded-xl bg-red-500/15 flex-shrink-0'>
            <AlertTriangle size={18} className='text-red-400' />
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='text-sm font-bold text-white'>{title}</h3>
            {message && <p className='text-sm text-slate-400 mt-1'>{message}</p>}
          </div>
          <button
            ref={cancelRef}
            onClick={onCancel}
            className='p-1 rounded-lg hover:bg-white/10 text-slate-400 transition-all'
          >
            <X size={14} />
          </button>
        </div>
        <div className='flex gap-2 pt-1'>
          <button
            onClick={onCancel}
            className='flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-sm transition-all'
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className='flex-1 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-sm font-medium transition-all'
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
