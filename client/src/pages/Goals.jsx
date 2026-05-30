import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
// import { getThisMonday, snapToMonday } from '../utils/dateUtils';
import GoalCard from '../components/GoalCard.jsx';
import {
  Target,
  Plus,
  TrendingUp,
  CalendarDays,
  ChevronDown,
  AlignLeft,
  Trash2,
} from 'lucide-react';

export default function Goals() {
  const [goals, setGoals]           = useState([]);
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline]     = useState('');
  const [showExtra, setShowExtra]   = useState(false);
  const [createError, setCreateError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/goals').then(setGoals).catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError(null);
    setSubmitting(true);
    try {
      const payload = { title: title.trim() };
      if (description.trim()) payload.description = description.trim();
      if (deadline) payload.deadline = deadline;

      const newGoal = await api.post('/goals', payload);
      setGoals(prev => [newGoal, ...prev]);
      setTitle('');
      setDescription('');
      setDeadline('');
      setShowExtra(false);
      navigate(`/goals/${newGoal.id}`);
    } catch (err) {
      setCreateError(err.message || 'Gagal membuat goal. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(goalId, e) {
    e.stopPropagation();
    if (!window.confirm('Hapus goal ini beserta semua tasknya?')) return;
    setDeletingId(goalId);
    try {
      await api.delete(`/goals/${goalId}`);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch {
      /* silent */
    } finally {
      setDeletingId(null);
    }
  }

  const totalDone  = goals.reduce((s, g) => s + (g.task_done_count ?? 0), 0);
  const totalTasks = goals.reduce((s, g) => s + (g.task_total ?? 0), 0);
  const progressPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : null;

  return (
    <div className='min-h-screen bg-[#020617] text-white p-6'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>Goals Belajar</h1>
        <p className='text-gray-400 mt-2'>Kelola target belajar dan pantau progres Anda.</p>
      </div>

      {/* ── Create Goal Form ── */}
      <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-6 mb-8'>
        <div className='flex items-center gap-2 mb-4'>
          <Target size={16} className='text-indigo-400' />
          <h2 className='text-sm font-semibold text-white'>Buat Goal Baru</h2>
        </div>

        <form onSubmit={handleCreate} className='flex flex-col gap-3'>
          {/* Title */}
          <input
            id='goal-title-input'
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder='Contoh: Menguasai React Hooks'
            required
            className='w-full bg-[#111c3b] border border-white/10 rounded-2xl px-4 py-3 text-white
                       placeholder-slate-500 outline-none focus:border-indigo-500/60 transition-colors'
          />

          {/* Toggle extra fields */}
          <button
            type='button'
            onClick={() => setShowExtra(p => !p)}
            className='self-start flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors'
          >
            <ChevronDown
              size={13}
              className={`transition-transform ${showExtra ? 'rotate-180' : ''}`}
            />
            {showExtra ? 'Sembunyikan detail' : 'Tambah deskripsi & deadline'}
          </button>

          {/* Extra fields */}
          {showExtra && (
            <div className='flex flex-col gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl'>
              {/* Description */}
              <div className='space-y-1.5'>
                <label className='flex items-center gap-1.5 text-xs font-medium text-slate-400'>
                  <AlignLeft size={12} />
                  Deskripsi (opsional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder='Apa yang ingin kamu capai dengan goal ini?'
                  rows={3}
                  className='w-full bg-[#111c3b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
                             placeholder-slate-500 outline-none focus:border-indigo-500/60 transition-colors resize-none'
                />
              </div>

              {/* Deadline */}
              <div className='space-y-1.5'>
                <label className='flex items-center gap-1.5 text-xs font-medium text-slate-400'>
                  <CalendarDays size={12} />
                  Deadline (opsional)
                </label>
                <input
                  type='date'
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className='w-full bg-[#111c3b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
                             outline-none focus:border-indigo-500/60 transition-colors [color-scheme:dark]'
                />
              </div>
            </div>
          )}

          {/* Error */}
          {createError && (
            <p className='text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2'>
              ⚠️ {createError}
            </p>
          )}

          {/* Submit */}
          <button
            id='create-goal-btn'
            type='submit'
            disabled={submitting || !title.trim()}
            className='self-end bg-indigo-500 hover:bg-indigo-400 active:scale-95 disabled:opacity-50
                       disabled:cursor-not-allowed transition-all rounded-2xl px-6 py-3 font-semibold
                       flex items-center gap-2 whitespace-nowrap'
          >
            <Plus size={18} />
            {submitting ? 'Menyimpan...' : 'Tambah Goal'}
          </button>
        </form>
      </div>

      {/* ── Stats ── */}
      <div className='grid grid-cols-2 gap-4 mb-8'>
        <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-5'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Total Goals</p>
              <h2 className='text-3xl font-bold mt-2'>{goals.length}</h2>
            </div>
            <div className='bg-indigo-500/20 p-3 rounded-2xl'>
              <Target className='text-indigo-400' />
            </div>
          </div>
        </div>

        <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-5'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Progress Belajar</p>
              <h2 className='text-3xl font-bold mt-2'>
                {progressPct !== null ? `${progressPct}%` : '–'}
              </h2>
            </div>
            <div className='bg-emerald-500/20 p-3 rounded-2xl'>
              <TrendingUp className='text-emerald-400' />
            </div>
          </div>
        </div>
      </div>

      {/* ── Goals List ── */}
      {!goals.length ? (
        <div className='bg-[#0f172a] border border-dashed border-white/10 rounded-3xl p-12 text-center'>
          <div className='inline-flex items-center justify-center w-14 h-14 bg-indigo-500/10 rounded-2xl mb-4'>
            <Target size={24} className='text-indigo-400' />
          </div>
          <h2 className='text-2xl font-semibold mb-3'>Belum Ada Goal</h2>
          <p className='text-gray-400'>Mulailah membuat target belajar pertama Anda.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {goals.map(g => (
            <div
              key={g.id}
              className='group bg-[#0f172a] border border-white/10 rounded-3xl p-5
                         hover:border-indigo-500/30 transition-all relative'
            >
              <GoalCard
                id={g.id}
                title={g.title}
                deadline={g.deadline}
                taskTotal={g.task_total}
              />
              {/* Delete button */}
              <button
                onClick={e => handleDelete(g.id, e)}
                disabled={deletingId === g.id}
                className='absolute top-4 right-4 p-1.5 rounded-lg text-slate-600
                           hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100
                           transition-all disabled:opacity-30'
                title='Hapus goal'
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
