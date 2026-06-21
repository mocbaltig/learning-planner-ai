import { useNavigate } from 'react-router-dom';
import { Target, CalendarDays, ListChecks, ArrowRight } from 'lucide-react';
import { getThisMonday } from '../utils/dateUtils';

export default function GoalCard({ id, title, deadline, taskTotal }) {
  const navigate = useNavigate();
  const weekStart = getThisMonday();

  return (
    <div className='flex flex-col gap-3'>
      {/* Title */}
      <div className='flex items-start gap-3'>
        <div className='bg-indigo-500/15 p-2 rounded-xl flex-shrink-0'>
          <Target className='text-indigo-400' size={16} />
        </div>
        <h3 className='text-white font-semibold text-sm leading-snug mt-0.5'>{title}</h3>
      </div>

      {/* Meta */}
      <div className='flex flex-wrap gap-2 text-xs'>
        {deadline && (
          <span className='inline-flex items-center gap-1 text-slate-400 bg-white/5 rounded-full px-2.5 py-1'>
            <CalendarDays size={10} />
            {new Date(deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        )}
        {taskTotal !== undefined && (
          <span className='inline-flex items-center gap-1 text-slate-400 bg-white/5 rounded-full px-2.5 py-1'>
            <ListChecks size={10} />
            {taskTotal} task
          </span>
        )}
      </div>

      {/* CTA */}
      <button
        id={`goal-detail-${id}`}
        onClick={() => navigate(`/goals/${id}?week_start=${weekStart}`)}
        className='mt-1 flex items-center justify-center gap-1.5 w-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-xl px-3 py-2 text-xs font-medium transition-all'
      >
        {taskTotal > 0 ? 'Lihat Detail' : 'Lihat Detail & Saran AI'}
        <ArrowRight size={12} />
      </button>
    </div>
  );
}


