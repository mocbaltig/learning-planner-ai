export default function GoalCard({ title, deadline, taskTotal }) {
  return (
    <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/50 transition-all group shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">
          {taskTotal} Tasks
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
        {title}
      </h3>
      
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Deadline: {deadline || 'Tidak ada'}</span>
      </div>
    </div>
  );
}
