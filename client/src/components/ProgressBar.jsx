export default function ProgressBar({ completed, total, label }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <span className="text-indigo-400 font-bold">{percent}%</span>
      </div>
      <div className="w-full bg-slate-900 rounded-full h-3">
        <div 
          className="bg-indigo-500 h-3 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]" 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
