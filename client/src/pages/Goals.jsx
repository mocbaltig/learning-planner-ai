import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getThisMonday, snapToMonday } from '../utils/dateUtils';
import GoalCard from '../components/GoalCard.jsx';
import {
  Target,
  Plus,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [weekStart, setWeekStart] = useState(getThisMonday);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/goals').then(setGoals);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();

    const newGoal = await api.post('/goals', { title });

    setGoals([newGoal, ...goals]);
    setTitle('');
    // Langsung navigasi ke halaman detail dengan week_start → trigger AI suggestion flow
    navigate(`/goals/${newGoal.id}?week_start=${weekStart}`);
  }

  function handleWeekStartChange(e) {
    // Snap ke Senin otomatis jika user memilih bukan Senin
    setWeekStart(snapToMonday(e.target.value));
  }


  return (
    <div className='min-h-screen bg-[#020617] text-white p-6'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>
          Goals Belajar
        </h1>

        <p className='text-gray-400 mt-2'>
          Kelola target belajar dan pantau progres Anda.
        </p>
      </div>

      {/* Create Goal */}
      <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-6 mb-8'>
        <form
          onSubmit={handleCreate}
          className='flex flex-col gap-4'
        >
          {/* Row 1: judul goal */}
          <input
            id='goal-title-input'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Contoh: Menguasai React Hooks'
            required
            className='flex-1 bg-[#111c3b] border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors'
          />

          {/* Row 2: week_start picker + tombol */}
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1 flex flex-col gap-1.5'>
              <label
                htmlFor='goal-week-start'
                className='text-xs text-slate-400 flex items-center gap-1.5'
              >
                <CalendarDays size={12} />
                Mulai minggu
              </label>
              <input
                id='goal-week-start'
                type='date'
                value={weekStart}
                onChange={handleWeekStartChange}
                required
                className='w-full bg-[#111c3b] border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors text-sm
                  [color-scheme:dark]'
              />
              {weekStart && (
                <p className='text-[11px] text-slate-500'>
                  Minggu dimulai: <span className='text-indigo-400'>{weekStart}</span>
                </p>
              )}
            </div>

            <button
              id='create-goal-btn'
              type='submit'
              className='sm:self-end bg-indigo-500 hover:bg-indigo-400 active:scale-95 transition-all rounded-2xl px-6 py-3 font-semibold flex items-center justify-center gap-2 whitespace-nowrap'
            >
              <Plus size={18} />
              Tambah Goal
            </button>
          </div>
        </form>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>
                Total Goals
              </p>

              <h2 className='text-3xl font-bold mt-2'>
                {goals.length}
              </h2>
            </div>

            <div className='bg-indigo-500/20 p-3 rounded-2xl'>
              <Target className='text-indigo-400' />
            </div>
          </div>
        </div>

        <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>
                Progress Belajar
              </p>

              <h2 className='text-3xl font-bold mt-2'>
                Konsisten
              </h2>
            </div>

            <div className='bg-emerald-500/20 p-3 rounded-2xl'>
              <TrendingUp className='text-emerald-400' />
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!goals.length ? (
        <div className='bg-[#0f172a] border border-dashed border-white/10 rounded-3xl p-12 text-center'>
          <h2 className='text-2xl font-semibold mb-3'>
            Belum Ada Goal
          </h2>

          <p className='text-gray-400'>
            Mulailah membuat target belajar pertama Anda.
          </p>
        </div>
      ) : (
        /* Goals List */
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {goals.map((g) => (
            <div
              key={g.id}
              className='bg-[#0f172a] border border-white/10 rounded-3xl p-5 hover:border-indigo-500/30 transition-all'
            >
              <GoalCard
                id={g.id}
                title={g.title}
                deadline={g.deadline}
                taskTotal={g.task_total}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}