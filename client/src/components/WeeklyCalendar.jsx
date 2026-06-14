import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getThisMonday } from '../utils/dateUtils';
import { Sun, Sunset, Moon, Clock, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

const DAYS = [
  { label: 'Sen', full: 'Senin' },
  { label: 'Sel', full: 'Selasa' },
  { label: 'Rab', full: 'Rabu' },
  { label: 'Kam', full: 'Kamis' },
  { label: 'Jum', full: 'Jumat' },
  { label: 'Sab', full: 'Sabtu' },
  { label: 'Min', full: 'Minggu' },
];

const SLOTS = [
  { key: 'morning',   label: 'Pagi',  Icon: Sun,    color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  { key: 'afternoon', label: 'Siang', Icon: Sunset, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { key: 'evening',   label: 'Malam', Icon: Moon,   color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
];

const STATUS_STYLE = {
  done: 'border-emerald-500/40 bg-emerald-500/10 opacity-70',
  skip: 'border-white/5  bg-white/3  opacity-40 line-through',
  todo: 'border-white/10 bg-white/5  hover:border-indigo-500/40 hover:bg-indigo-500/5',
};

/** Normalisasi flat array → { 'YYYY-MM-DD': [task, ...] } */
function groupByDay(tasks) {
  if (!Array.isArray(tasks)) return {};
  return tasks.reduce((acc, task) => {
    const day = String(task.planned_date).split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(task);
    return acc;
  }, {});
}

/** Menghasilkan 'YYYY-MM-DD' untuk hari ke-n dari weekStart (lokal) */
function dateForIndex(weekStart, index) {
  const [y, m, d] = weekStart.split('-').map(Number);
  const date = new Date(y, m - 1, d + index);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Format YYYY-MM-DD ke 'D MMM' tanpa timezone shift */
function fmtShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/** Senin minggu berjalan (lokal) */
function todayKey() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

export default function WeeklyCalendar({ onTaskClick }) {
  const [weekStart, setWeekStart]   = useState(getThisMonday);
  const [tasksByDay, setTasksByDay] = useState({});
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const today = todayKey();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get(`/tasks?week_start=${weekStart}`)
      .then(data => {
        if (cancelled) return;
        // Tangani dua format: flat array ATAU { week_start, tasks: {} }
        if (Array.isArray(data)) {
          setTasksByDay(groupByDay(data));
        } else if (data?.tasks && typeof data.tasks === 'object') {
          setTasksByDay(data.tasks);   // sudah di-group dari server
        } else {
          setTasksByDay({});
        }
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [weekStart, retryCount]);

  function shiftWeek(offset) {
    const [y, m, d] = weekStart.split('-').map(Number);
    const next = new Date(y, m - 1, d + offset * 7);
    setWeekStart([
      next.getFullYear(),
      String(next.getMonth() + 1).padStart(2, '0'),
      String(next.getDate()).padStart(2, '0'),
    ].join('-'));
  }

  function goToday() { setWeekStart(getThisMonday()); }

  /* ── Header label minggu ── */
  const lastDay = dateForIndex(weekStart, 6);
  const [y1, m1] = weekStart.split('-').map(Number);
  const [y2, m2] = lastDay.split('-').map(Number);
  const weekLabel = m1 === m2
    ? new Date(y1, m1 - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : `${new Date(y1, m1 - 1, 1).toLocaleDateString('id-ID', { month: 'short' })} – ${new Date(y2, m2 - 1, 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;

  /* ── Render ── */
  return (
    <div className='flex flex-col gap-4'>

      {/* Navigation bar */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => shiftWeek(-1)}
            className='p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all'
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => shiftWeek(1)}
            className='p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all'
          >
            <ChevronRight size={16} />
          </button>
          <h2 className='text-base font-semibold text-white ml-1 capitalize'>{weekLabel}</h2>
        </div>

        <button
          onClick={goToday}
          className='text-xs px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 transition-all'
        >
          Minggu ini
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className='grid grid-cols-7 gap-2'>
          {DAYS.map(({ label }) => (
            <div key={label} className='bg-white/5 rounded-2xl h-64 animate-pulse' />
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState message={error} onRetry={() => setRetryCount(c => c + 1)} />
      )}

      {/* Calendar grid */}
      {!loading && !error && (
        (() => {
          const allWeekEmpty = Object.values(tasksByDay).every(d => d.length === 0) ||
            Object.keys(tasksByDay).length === 0;
          // if (allWeekEmpty) {
          //   return (
          //     <EmptyState
          //       type='calendar'
          //       onAction={null}
          //     />
          //   );
          // }
          return (
            <div className='grid grid-cols-7 gap-2 min-h-[480px]'>
          {DAYS.map(({ label }, dayIndex) => {
            const dateKey  = dateForIndex(weekStart, dayIndex);
            const dayTasks = tasksByDay[dateKey] || [];
            const isToday  = dateKey === today;
            const isWeekend = dayIndex >= 5;

            return (
              <div
                key={dateKey}
                className={`flex flex-col rounded-2xl border transition-all overflow-hidden
                  ${isToday
                    ? 'border-indigo-500/40 bg-indigo-500/5 shadow-md shadow-indigo-500/10'
                    : isWeekend
                      ? 'border-white/5 bg-white/[0.02]'
                      : 'border-white/10 bg-[#0f172a]'
                  }`}
              >
                {/* Day header */}
                <div className={`px-2 py-2 text-center border-b ${isToday ? 'border-indigo-500/30' : 'border-white/5'}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${isWeekend ? 'text-slate-500' : 'text-slate-400'}`}>
                    {label}
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-indigo-400' : 'text-white'}`}>
                    {fmtShort(dateKey).split(' ')[0]}
                  </p>
                  {isToday && (
                    <span className='mt-1 inline-block w-1.5 h-1.5 rounded-full bg-indigo-400' />
                  )}
                </div>

                {/* Slots */}
                <div className='flex flex-col gap-1.5 p-1.5 flex-1'>
                  {SLOTS.map(({ key: slot, label: slotLabel, Icon, color, bg, border }) => {
                    const slotTasks = dayTasks.filter(t => t.planned_slot === slot);
                    if (slotTasks.length === 0) return null;

                    return (
                      <div key={slot} className={`rounded-xl p-1.5 ${bg} border ${border}`}>
                        <div className={`flex items-center gap-1 mb-1 ${color}`}>
                          <Icon size={9} />
                          <span className='text-[9px] font-semibold uppercase tracking-wide'>{slotLabel}</span>
                        </div>
                        <div className='space-y-1'>
                          {slotTasks.map(task => (
                            <button
                              key={task.id}
                              onClick={() => onTaskClick?.(task)}
                              className={`w-full text-left rounded-lg border px-2 py-1.5 text-[10px] leading-tight transition-all ${STATUS_STYLE[task.status] ?? STATUS_STYLE.todo}`}
                            >
                              <p className='font-medium text-white line-clamp-2'>{task.title}</p>
                              <p className='text-slate-500 mt-0.5 flex items-center gap-1'>
                                <Clock size={8} />
                                {task.duration_estimate}m
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty day */}
                  {dayTasks.length === 0 && (
                    <div className='flex-1 flex items-center justify-center'>
                      <CalendarDays size={14} className='text-white/10' />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
          );
        })()
      )}
    </div>
  );
}
