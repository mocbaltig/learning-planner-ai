export default function TaskItem({ task, onStatusChange }) {
  const statusColors = {
    todo: '#e2e8f0',
    in_progress: '#fef3c7',
    done: '#d1fae5',
    skipped: '#fee2e2',
  };

  const isDone = task.status === 'done';

  return (
    <div className="group bg-[#0f172a] border border-slate-800 hover:border-slate-700 p-5 rounded-2xl mb-4 transition-all flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-10 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-slate-700'}`} />
        <div>
          <h4 className={`font-semibold ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>
            {task.title}
          </h4>
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            {task.duration_estimate} menit • {task.planned_slot}
          </span>
        </div>
      </div>
      
      {task.status === 'todo' && (
        <button 
          onClick={() => onStatusChange(task.id, 'done')}
          className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          Selesai
        </button>
      )}
    </div>
  );
}
