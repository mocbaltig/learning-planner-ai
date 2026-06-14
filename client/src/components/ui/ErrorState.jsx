export default function ErrorState({ message, onRetry, buttonId }) {
  return (
    <div className='bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-3' role='alert'>
      <p className='text-red-400 font-medium'>{message}</p>
      {onRetry && (
        <button
          id={buttonId}
          onClick={onRetry}
          className='inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl px-4 py-2 text-sm font-medium transition-all'
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}
