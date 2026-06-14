import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useDashboardData } from '../hooks/useDashboardData';

// ── Helpers ────────────────────────────────────────────────────
const slotLabel = { morning: 'Pagi', afternoon: 'Siang', evening: 'Malam' };
const slotColor = {
  morning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  afternoon: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  evening: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

// ── Sub-components ─────────────────────────────────────────────
function DonutChart({ percent }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  return (
    <div className='relative w-40 h-40 flex-shrink-0'>
      <svg className='w-full h-full -rotate-90' viewBox='0 0 120 120'>
        {/* Track */}
        <circle cx='60' cy='60' r={r} fill='none' stroke='#1e293b' strokeWidth='12' />
        {/* Fill */}
        <circle
          cx='60' cy='60' r={r} fill='none'
          stroke='url(#donutGrad)'
          strokeWidth='12'
          strokeLinecap='round'
          strokeDasharray={`${dash} ${circ}`}
          className='transition-all duration-1000'
        />
        <defs>
          <linearGradient id='donutGrad' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='#6366f1' />
            <stop offset='100%' stopColor='#a855f7' />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        <span className='text-3xl font-bold text-white'>{percent}%</span>
        <span className='text-xs text-slate-400 mt-0.5'>selesai</span>
      </div>
    </div>
  );
}

function GoalProgressBar({ percent }) {
  return (
    <div className='w-full bg-slate-800 rounded-full h-1.5 mt-3'>
      <div
        className='h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700'
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className='p-4 lg:p-6 space-y-6 max-w-6xl mx-auto animate-pulse'>
      <div className='h-8 w-48 bg-slate-800 rounded-lg' />
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='h-20 bg-slate-800/60 rounded-xl' />
        ))}
      </div>
      <div className='h-48 bg-slate-800/60 rounded-2xl' />
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='h-64 bg-slate-800/60 rounded-2xl' />
        <div className='h-64 bg-slate-800/60 rounded-2xl' />
      </div>
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────
export default function Dashboard() {
  const {
    tasks,
    setTasks,
    goals,
    user,
    loading,
    error,
    weekStart,
    todayTasks,
    stats,
    refetch,
  } = useDashboardData();
  const [markDoneError, setMarkDoneError] = useState(null);

  async function markDone(id) {
    // Optimistic update — UI responsif tanpa nunggu API
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'done' } : t))
    );
    setMarkDoneError(null);
    try {
      await api.patch(`/tasks/${id}/status`, { status: 'done' });
    } catch (err) {
      // Rollback jika API gagal
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'todo' } : t))
      );
      setMarkDoneError(err.message || 'Gagal memperbarui task.');
    }
  }

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className='p-8 text-center text-slate-400'>
        <p className='text-red-400 font-medium mb-3'>Gagal memuat data</p>
        <p className='text-sm mb-4'>{error.message}</p>
        <button
          onClick={refetch}
          className='bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl px-4 py-2 text-sm font-medium transition-all'
        >
          Coba lagi
        </button>
      </div>
    );
  }

  // Derived display values
  const userName = user?.email?.split('@')[0] ?? 'Pengguna';

  /** Hitung progress goal dari task_total (tidak ada task_done di API goals,
   *  jadi kita pakai tasks minggu ini sebagai proxy per goal_id) */
  const doneByGoal = tasks.reduce((acc, t) => {
    if (t.status === 'done') acc[t.goal_id] = (acc[t.goal_id] ?? 0) + 1;
    return acc;
  }, {});
  const totalByGoal = tasks.reduce((acc, t) => {
    acc[t.goal_id] = (acc[t.goal_id] ?? 0) + 1;
    return acc;
  }, {});

  const previewGoals = goals.slice(0, 3).map((g) => ({
    ...g,
    progress: totalByGoal[g.id]
      ? Math.round(((doneByGoal[g.id] ?? 0) / totalByGoal[g.id]) * 100)
      : 0,
  }));

  // Stats cards
  const statCards = [
    {
      label: 'Jam Belajar Minggu Ini',
      value: `${stats.totalHours} jam`,
      icon: (
        <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
      ),
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Task Selesai Hari Ini',
      value: todayTasks.length > 0 ? `${stats.todayDone} / ${stats.todayTotal}` : '–',
      icon: (
        <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
      ),
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Goals Aktif',
      value: `${stats.goalsCount} goals`,
      icon: (
        <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' />
        </svg>
      ),
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
    },
  ];

  // Tampilkan task hari ini; kalau tidak ada, fallback ke semua task minggu ini
  const displayTasks = todayTasks.length > 0 ? todayTasks : tasks;
  const taskSectionTitle = todayTasks.length > 0 ? 'Task Hari Ini' : 'Task Minggu Ini';
  const doneDisplay = displayTasks.filter((t) => t.status === 'done').length;

  // Format tanggal minggu ini
  const weekLabel = new Date(weekStart + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className='p-4 lg:p-6 space-y-6 max-w-6xl mx-auto'>

      {/* Page title */}
      <div>
        <h1 className='text-xl font-bold text-white'>Dashboard</h1>
        <p className='text-sm text-slate-400 mt-0.5'>Selamat datang kembali, {userName} 👋</p>
      </div>

      {/* ── Statistik Cepat ── */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-4 flex items-center gap-4 ${s.bg}`}
          >
            <div className={s.color}>{s.icon}</div>
            <div>
              <p className='text-xs text-slate-400'>{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress Minggu Ini ── */}
      <div className='rounded-2xl border border-slate-800 bg-slate-900 p-6'>
        <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
          <DonutChart percent={stats.weekPercent} />
          <div className='flex-1 text-center sm:text-left'>
            <h2 className='text-lg font-bold text-white'>Progress Minggu Ini</h2>
            <p className='text-slate-400 text-sm mt-1'>Mulai {weekLabel}</p>
            <div className='mt-4 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-slate-400'>Task selesai</span>
                <span className='text-white font-medium'>
                  {stats.weekDone} / {stats.weekTotal}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-slate-400'>Jam belajar</span>
                <span className='text-white font-medium'>{stats.totalHours} jam</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-slate-400'>Goals aktif</span>
                <span className='text-white font-medium'>{stats.goalsCount} goals</span>
              </div>
            </div>
            <p className='mt-4 text-indigo-400 text-sm font-medium italic'>
              &quot;Konsistensi kecil setiap hari menciptakan hasil besar di masa depan. 💪&quot;
            </p>
          </div>
        </div>
      </div>

      {/* ── 2-column grid: Tasks + Goals ── */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

        {/* Task */}
        <div className='rounded-2xl border border-slate-800 bg-slate-900 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-base font-bold text-white'>{taskSectionTitle}</h2>
            <span className='text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full'>
              {doneDisplay}/{displayTasks.length} selesai
            </span>
          </div>

          {markDoneError && (
            <div className='mb-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-sm text-red-400' role='alert'>
              ⚠️ {markDoneError}
            </div>
          )}

          {displayTasks.length === 0 ? (
            <div className='text-center py-8 text-slate-500 text-sm'>
              <p>Belum ada task untuk minggu ini.</p>
              <Link to='/goals' className='text-indigo-400 hover:text-indigo-300 mt-2 inline-block'>
                Buat goal & generate task →
              </Link>
            </div>
          ) : (
            <div className='space-y-3'>
              {displayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200
                    ${task.status === 'done'
                      ? 'bg-emerald-500/5 border-emerald-500/15'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                    }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => task.status === 'todo' && markDone(task.id)}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                      ${task.status === 'done'
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-600 hover:border-indigo-400 cursor-pointer'
                      }`}
                  >
                    {task.status === 'done' && (
                      <svg className='w-3 h-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                      </svg>
                    )}
                  </button>

                  {/* Info */}
                  <div className='flex-1 min-w-0'>
                    <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-white'}`}>
                      {task.title}
                    </p>
                    <p className='text-xs text-slate-500 mt-0.5'>{task.duration_estimate} menit</p>
                  </div>

                  {/* Slot badge */}
                  {task.planned_slot && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${slotColor[task.planned_slot] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                      {slotLabel[task.planned_slot] ?? task.planned_slot}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals Aktif */}
        <div className='rounded-2xl border border-slate-800 bg-slate-900 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-base font-bold text-white'>Goals Aktif</h2>
            <Link
              to='/goals'
              className='text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors'
            >
              Lihat Semua →
            </Link>
          </div>

          {previewGoals.length === 0 ? (
            <div className='text-center py-8 text-slate-500 text-sm'>
              <p>Belum ada goal yang dibuat.</p>
              <Link to='/goals' className='text-indigo-400 hover:text-indigo-300 mt-2 inline-block'>
                Tambah goal pertama →
              </Link>
            </div>
          ) : (
            <div className='space-y-4'>
              {previewGoals.map((goal) => (
                <Link
                  to={`/goals/${goal.id}`}
                  key={goal.id}
                  className='block p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all duration-200 group'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <p className='text-sm font-medium text-white group-hover:text-indigo-300 transition-colors'>
                      {goal.title}
                    </p>
                    <span className='text-xs font-bold text-indigo-400 flex-shrink-0'>
                      {goal.progress}%
                    </span>
                  </div>
                  {goal.deadline && (
                    <p className='text-xs text-slate-500 mt-1'>
                      Deadline: {new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  <GoalProgressBar percent={goal.progress} />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
