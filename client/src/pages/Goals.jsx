import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import GoalCard from '../components/GoalCard.jsx';
import {
  Target,
  Plus,
  TrendingUp,
} from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/goals').then(setGoals);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();

    const newGoal = await api.post('/goals', { title });

    setGoals([newGoal, ...goals]);
    setTitle('');
    // Langsung navigasi ke halaman detail → trigger AI suggestion flow
    navigate(`/goals/${newGoal.id}`);
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
          className='flex flex-col md:flex-row gap-4'
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Contoh: Menguasai React Hooks'
            required
            className='flex-1 bg-[#111c3b] border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500'
          />

          <button
            type='submit'
            className='bg-indigo-500 hover:bg-indigo-400 transition-all rounded-2xl px-6 py-3 font-semibold flex items-center justify-center gap-2'
          >
            <Plus size={18} />
            Tambah Goal
          </button>
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
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}