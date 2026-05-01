import { useState } from 'react';
import { Link } from 'react-router-dom';

// ── Data Dummy ────────────────────────────────────────────────
const TASKS_TODAY = [
  {
    id: '1',
    title: 'Belajar React Hooks',
    duration_estimate: 45,
    planned_slot: 'morning',
    status: 'done',
  },
  {
    id: '2',
    title: 'Setup Express Routes',
    duration_estimate: 60,
    planned_slot: 'afternoon',
    status: 'done',
  },
  {
    id: '3',
    title: 'Belajar Prompt Engineering',
    duration_estimate: 30,
    planned_slot: 'evening',
    status: 'todo',
  },
];

const GOALS = [
  { id: '1', title: 'Kuasai React dalam 30 Hari', progress: 65, deadline: '31 Mei 2026' },
  { id: '2', title: 'Bangun REST API dengan Node.js', progress: 40, deadline: '15 Jun 2026' },
  { id: '3', title: 'Implementasi AI di Aplikasi', progress: 20, deadline: '30 Jun 2026' },
];

const STATS = [
  {
    label: 'Jam Belajar Minggu Ini',
    value: '9,5 jam',
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    ),
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    label: 'Streak Hari Berturut',
    value: '7 hari 🔥',
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' />
      </svg>
    ),
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    label: 'Task Selesai Hari Ini',
    value: '2 / 3',
    icon: (
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    ),
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
];

// ── Sub-components ────────────────────────────────────────────
const slotLabel = { morning: 'Pagi', afternoon: 'Siang', evening: 'Malam' };
const slotColor = {
  morning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  afternoon: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  evening: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

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

// ── Dashboard Page ────────────────────────────────────────────
export default function Dashboard() {
  const [tasks, setTasks] = useState(TASKS_TODAY);

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const weekPercent = 50;

  function markDone(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'done' } : t))
    );
  }

  return (
    <div className='p-4 lg:p-6 space-y-6 max-w-6xl mx-auto'>

      {/* Page title */}
      <div>
        <h1 className='text-xl font-bold text-white'>Dashboard</h1>
        <p className='text-sm text-slate-400 mt-0.5'>Selamat datang kembali, Hilman 👋</p>
      </div>

      {/* ── Statistik Cepat ── */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {STATS.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-4 flex items-center gap-4 ${s.bg}`}
          >
            <div className={`${s.color}`}>{s.icon}</div>
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
          <DonutChart percent={weekPercent} />
          <div className='flex-1 text-center sm:text-left'>
            <h2 className='text-lg font-bold text-white'>Progress Minggu Ini</h2>
            <p className='text-slate-400 text-sm mt-1'>1 – 7 Mei 2026</p>
            <div className='mt-4 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-slate-400'>Task selesai</span>
                <span className='text-white font-medium'>5 / 10</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-slate-400'>Jam belajar</span>
                <span className='text-white font-medium'>9,5 / 20 jam</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-slate-400'>Goals aktif</span>
                <span className='text-white font-medium'>3 goals</span>
              </div>
            </div>
            <p className='mt-4 text-indigo-400 text-sm font-medium italic'>
              "Konsistensi kecil setiap hari menciptakan hasil besar di masa depan. 💪"
            </p>
          </div>
        </div>
      </div>

      {/* ── 2-column grid: Tasks + Goals ── */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

        {/* Task Hari Ini */}
        <div className='rounded-2xl border border-slate-800 bg-slate-900 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-base font-bold text-white'>Task Hari Ini</h2>
            <span className='text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full'>
              {doneCount}/{tasks.length} selesai
            </span>
          </div>

          <div className='space-y-3'>
            {tasks.map((task) => (
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
                <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${slotColor[task.planned_slot]}`}>
                  {slotLabel[task.planned_slot]}
                </span>
              </div>
            ))}
          </div>
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

          <div className='space-y-4'>
            {GOALS.map((goal) => (
              <div
                key={goal.id}
                className='p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all duration-200 group'
              >
                <div className='flex items-start justify-between gap-2'>
                  <p className='text-sm font-medium text-white group-hover:text-indigo-300 transition-colors'>
                    {goal.title}
                  </p>
                  <span className='text-xs font-bold text-indigo-400 flex-shrink-0'>
                    {goal.progress}%
                  </span>
                </div>
                <p className='text-xs text-slate-500 mt-1'>Deadline: {goal.deadline}</p>
                <GoalProgressBar percent={goal.progress} />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

