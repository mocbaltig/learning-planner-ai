export default function LoadingState({ variant = 'card', count = 1, message }) {
  if (variant === 'spinner') {
    return (
      <div className='flex flex-col items-center justify-center py-12 gap-3' role='status' aria-live='polite'>
        <div className='w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin' />
        {message && <p className='text-sm text-slate-400'>{message}</p>}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className='space-y-3 animate-pulse' aria-busy='true' aria-label={message || 'Memuat...'} aria-live='polite' role='region'>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className='flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3'>
            <div className='w-2 h-2 rounded-full bg-white/10 flex-shrink-0' />
            <div className='flex-1 space-y-2'>
              <div className='h-3 bg-white/10 rounded w-3/4' />
              <div className='h-2 bg-white/5 rounded w-1/2' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className='bg-[#0f172a] border border-white/10 rounded-3xl p-6 animate-pulse'>
            <div className='flex items-center justify-between'>
              <div className='space-y-2'>
                <div className='h-3 w-24 bg-slate-700 rounded' />
                <div className='h-8 w-16 bg-slate-700 rounded' />
              </div>
              <div className='w-12 h-12 bg-slate-700 rounded-2xl' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-4 animate-pulse' aria-busy='true' aria-label={message || 'Memuat...'} aria-live='polite' role='region'>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className='bg-[#0f172a] border border-white/5 rounded-2xl p-5 space-y-3'>
          <div className='h-4 bg-white/5 rounded-full w-3/4' />
          <div className='h-3 bg-white/5 rounded-full w-full' />
          <div className='h-3 bg-white/5 rounded-full w-4/5' />
          <div className='flex gap-2 mt-4'>
            <div className='h-8 w-24 bg-white/5 rounded-xl' />
            <div className='h-8 w-24 bg-white/5 rounded-xl' />
          </div>
        </div>
      ))}
    </div>
  );
}
