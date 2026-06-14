import { useEffect, useState } from 'react';
import { TrendingUp, Clock3, CheckCircle2, Target } from 'lucide-react';
import { api } from '../services/api';
import { getThisMonday, toISOWeek, isoWeekToRange } from '../utils/dateUtils';
import LoadingState from '../components/ui/LoadingState';

function CircularProgress({ percent }) {
  const CIRCUMFERENCE = 327;
  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * percent) / 100;

  return (
    <div className='relative w-52 h-52'>
      <svg aria-hidden className='w-full h-full rotate-[-90deg]' viewBox='0 0 120 120'>
        <circle cx='60' cy='60' r='52' stroke='#1e293b' strokeWidth='10' fill='none' />
        <circle
          cx='60' cy='60' r='52'
          stroke='url(#progressGrad)'
          strokeWidth='10'
          fill='none'
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap='round'
          className='transition-all duration-1000'
        />
        <defs>
          <linearGradient id='progressGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#8b5cf6' />
            <stop offset='100%' stopColor='#6366f1' />
          </linearGradient>
        </defs>
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        <h2 className='text-5xl font-bold'>{percent}%</h2>
        <p className='text-gray-400 mt-2'>Progress</p>
      </div>
    </div>
  );
}

export default function Progress() {
  const [snapshot, setSnapshot] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  function fetchProgress() {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const week = toISOWeek(getThisMonday());

    Promise.all([
      api.get(`/progress/weekly?week=${week}`),
      api.get('/progress/trend'),
    ])
      .then(([snap, trendData]) => {
        if (cancelled) return;
        setSnapshot(snap);
        setTrend(trendData ?? []);
      })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }

  useEffect(() => { fetchProgress(); }, [retryKey]);

  const rate = snapshot ? Math.round(snapshot.completion_rate * 100) : 0;
  const planned = snapshot ? parseFloat(snapshot.planned_hours) : 0;
  const completed = snapshot ? parseFloat(snapshot.completed_hours) : 0;

  let weekLabel = '';
  if (snapshot?.week) {
    const range = isoWeekToRange(snapshot.week);
    if (range) {
      const start = new Date(range.start + 'T00:00:00');
      const end = new Date(range.end + 'T00:00:00');
      const fmt = (d) => d.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      weekLabel = `${snapshot.week} — ${fmt(start)} - ${fmt(end)}`;
    }
  }

  const avgRate = trend.length > 0
    ? Math.round(trend.reduce((s, t) => s + t.rate, 0) / trend.length * 100)
    : 0;
  const bestWeek = trend.length > 0
    ? trend.reduce((best, t) => t.rate > best.rate ? t : best, trend[0])
    : null;
  const totalPlanned = trend.reduce((s, t) => s + t.planned, 0);
  const totalCompleted = trend.reduce((s, t) => s + t.completed, 0);

  const statCards = [
    {
      title: 'Terencana',
      value: loading ? '–' : `${planned.toFixed(1)} Jam`,
      icon: Clock3,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/20',
    },
    {
      title: 'Terselesaikan',
      value: loading ? '–' : `${completed.toFixed(1)} Jam`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
    },
    {
      title: 'Tingkat Penyelesaian',
      value: loading ? '–' : `${rate}%`,
      icon: Target,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
    },
  ];

  return (
    <div className='min-h-screen bg-[#020617] text-white p-6'>

      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>Progress Belajar</h1>
        <p className='text-gray-400 mt-2'>
          Pantau perkembangan belajar Anda.
          {weekLabel && <span> — {weekLabel}</span>}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className='mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center' role='alert'>
          <p className='text-red-400 font-medium mb-3'>Gagal memuat data: {error.message}</p>
          <button
            onClick={() => setRetryKey(k => k + 1)}
            className='bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl px-4 py-2 text-sm font-medium transition-all'
          >
            Coba lagi
          </button>
        </div>
      )}

      {!error && (<>
      {/* Stats */}
      {loading ? (
        <LoadingState variant='stat' count={3} />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className='bg-[#0f172a] border border-white/10 rounded-3xl p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-gray-400 text-sm'>{item.title}</p>
                      <h2 className='text-3xl font-bold mt-2'>{item.value}</h2>
                    </div>
                    <div className={`${item.bg} p-3 rounded-2xl`}>
                      <Icon className={item.color} />
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
      )}

      {/* Main grid */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8'>

        {/* Circular Progress */}
        <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center'>
          {loading ? (
            <div className='w-52 h-52 rounded-full bg-slate-800 animate-pulse' />
          ) : (
            <CircularProgress percent={rate} />
          )}
          <p className='text-gray-400 mt-6 text-center text-sm'>
            Konsistensi kecil setiap hari menghasilkan progress besar.
          </p>
        </div>

        {/* Weekly breakdown */}
        <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-8'>
          <div className='flex items-center gap-3 mb-8'>
            <div className='bg-indigo-500/20 p-3 rounded-2xl'>
              <TrendingUp className='text-indigo-400' />
            </div>
            <div>
              <h2 className='text-2xl font-bold'>Progress Minggu Ini</h2>
              <p className='text-gray-400 text-sm'>Perbandingan jam belajar terencana dan terselesaikan</p>
            </div>
          </div>

          {loading ? (
            <div className='space-y-6 animate-pulse'>
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className='flex justify-between mb-2'>
                    <div className='h-4 w-24 bg-slate-700 rounded' />
                    <div className='h-4 w-16 bg-slate-700 rounded' />
                  </div>
                  <div className='w-full h-4 bg-slate-800 rounded-full' />
                </div>
              ))}
            </div>
          ) : (
            <div className='space-y-6'>
              <div>
                <div className='flex justify-between mb-2'>
                  <span className='text-gray-300 text-sm font-medium'>Terencana</span>
                  <span className='font-semibold text-sm text-indigo-400'>{planned.toFixed(1)} Jam</span>
                </div>
                <div className='w-full h-4 bg-[#111827] rounded-full overflow-hidden'>
                  <div className='h-full bg-slate-600 rounded-full' style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className='flex justify-between mb-2'>
                  <span className='text-gray-300 text-sm font-medium'>Terselesaikan</span>
                  <span className='font-semibold text-sm text-emerald-400'>{completed.toFixed(1)} Jam</span>
                </div>
                <div className='w-full h-4 bg-[#111827] rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700'
                    style={{ width: `${Math.min((completed / (planned || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className='bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between'>
                <span className='text-gray-300 text-sm'>Tingkat Penyelesaian</span>
                <span className='text-2xl font-bold text-indigo-400'>{rate}%</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Trend Section */}
      <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-8'>
        <div className='flex items-center gap-3 mb-8'>
          <div className='bg-emerald-500/20 p-3 rounded-2xl'>
            <TrendingUp className='text-emerald-400' />
          </div>
          <div>
            <h2 className='text-2xl font-bold'>Tren Progress</h2>
            <p className='text-gray-400 text-sm'>Riwayat tingkat penyelesaian per minggu</p>
          </div>
        </div>

        {loading ? (
          <div className='h-48 bg-slate-800 rounded-2xl animate-pulse' />
        ) : trend.length === 0 ? (
          <div className='text-center py-12 text-slate-500'>
            <p className='text-lg font-medium mb-1'>Belum ada data tren</p>
            <p className='text-sm'>Data progress akan muncul setelah Anda mulai mengerjakan task.</p>
          </div>
        ) : (
          <>
            {/* Bar chart */}
            <div className='flex items-end justify-between gap-3 h-44 mb-8'>
              {trend.slice(-6).map((t) => {
                const pct = Math.round(t.rate * 100);
                const barH = Math.max(t.rate, 0.04);
                return (
                  <div key={t.week} className='flex flex-col items-center gap-1 flex-1 h-full'>
                    <span className='text-xs text-gray-400'>{pct}%</span>
                    <div className='flex-1 w-full flex items-end justify-center'>
                      <div
                        className='w-4/5 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-md transition-all duration-700'
                        style={{ height: `${barH * 100}%` }}
                      />
                    </div>
                    <span className='text-xs text-gray-400'>{t.week.replace(/^\d{4}-W/, 'W')}</span>
                  </div>
                );
              })}
            </div>

            {/* Trend summary stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='bg-[#111827] border border-white/5 rounded-2xl p-4'>
                <p className='text-gray-400 text-xs mb-1'>Rata-rata</p>
                <p className='text-xl font-bold text-indigo-400'>{avgRate}%</p>
              </div>
              <div className='bg-[#111827] border border-white/5 rounded-2xl p-4'>
                <p className='text-gray-400 text-xs mb-1'>Minggu Terbaik</p>
                <p className='text-xl font-bold text-emerald-400'>
                  {bestWeek
                    ? `${bestWeek.week.replace(/^\d{4}-W/, 'W')}: ${Math.round(bestWeek.rate * 100)}%`
                    : '–'}
                </p>
              </div>
              <div className='bg-[#111827] border border-white/5 rounded-2xl p-4'>
                <p className='text-gray-400 text-xs mb-1'>Total Jam</p>
                <p className='text-xl font-bold text-orange-400'>
                  {totalCompleted.toFixed(1)} / {totalPlanned.toFixed(1)}
                </p>
            </div>
          </div>
          </>
        )}
      </div>
    </>)}
    </div>
  );
}
