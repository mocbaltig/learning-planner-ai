import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getThisMonday } from '../utils/dateUtils';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Sun,
  Sunset,
  Moon,
  PartyPopper,
  CalendarCheck,
} from 'lucide-react';
import RationaleBox from './RationaleBox';
import ConfidenceBadge from './ConfidenceBadge';
import LoadingState from './ui/LoadingState';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';

const SLOT_META = {
  morning:   { label: 'Pagi',  Icon: Sun,    color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  afternoon: { label: 'Siang', Icon: Sunset, color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  evening:   { label: 'Malam', Icon: Moon,   color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
 };

/* ─── Sub-components ──────────────────────────────────────────────────── */

function DoneSummary({ acceptedCount, totalCount }) {
  return (
    <div className='bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-2'>
      <PartyPopper className='text-emerald-400 mx-auto' size={32} />
      <p className='text-emerald-300 font-semibold text-lg'>Selesai!</p>
      <p className='text-slate-400 text-sm'>
        <span className='text-emerald-400 font-bold'>{acceptedCount}</span> dari{' '}
        <span className='font-bold text-white'>{totalCount}</span> saran diterima dan ditambahkan ke jadwal.
      </p>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */

export default function AISuggestionPanel({ goalId, weekStart, onAccept }) {
  const resolvedWeekStart = weekStart ?? getThisMonday();

  const [suggestions, setSuggestions]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  /** Map: taskIndex → 'accepted' | 'rejected' | 'loading' */
  const [taskStates, setTaskStates]     = useState({});
  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [recommendationId, setRecommendationId] = useState(null);
  const [acceptError, setAcceptError] = useState(null);

  /* Fetch saran AI */
  async function fetchSuggestions() {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    setTaskStates({});
    setAcceptedTasks([]);
    try {
      const data = await api.post('/ai/plan/suggest', {
        goal_id: goalId,
        week_start: resolvedWeekStart,
      });
      setSuggestions(data);
      setRecommendationId(data.id);
    } catch (err) {
      setError(err.message || 'Gagal memuat saran AI');
    } finally {
      setLoading(false);
    }
  }

  /* Terima satu task → POST /tasks */
  async function handleAccept(task, index) {
    setAcceptError(null);
    setTaskStates((prev) => ({ ...prev, [index]: 'loading' }));
    try {
      const created = await api.post('/tasks', {
        goal_id: goalId,
        title: task.title,
        description: task.description,
        duration_estimate: task.duration_estimate,
        planned_date: task.planned_date,
        planned_slot: task.planned_slot,
        rationale: task.rationale,
        source: 'ai',
      });
      setTaskStates((prev) => ({ ...prev, [index]: 'accepted' }));
      setAcceptedTasks((prev) => [...prev, created]);
      onAccept?.(created);
    } catch (err) {
      setAcceptError(err.message || 'Gagal menyimpan task');
      setTaskStates((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  }

  /* Tolak satu task → hanya update UI */
  function handleReject(index) {
    setTaskStates((prev) => ({ ...prev, [index]: 'rejected' }));
  }

  /* Cek apakah semua task sudah diproses */
  const allProcessed =
    suggestions?.tasks?.length > 0 &&
    suggestions.tasks.every((_, i) => taskStates[i] === 'accepted' || taskStates[i] === 'rejected');

  /* Update recommendation status when all tasks processed */
  useEffect(() => {
    if (allProcessed && recommendationId) {
      const status = acceptedTasks.length > 0 ? 'accepted' : 'rejected';
      api.patch(`/ai/recommendations/${recommendationId}`, { status }).catch(() => {});
    }
  }, [allProcessed, recommendationId]);

  /* ── Render: IDLE ── */
  if (!suggestions && !loading && !error) {
    return (
      <button
        id='ai-suggest-btn'
        onClick={fetchSuggestions}
        className='w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 active:scale-95 transition-all text-white font-semibold rounded-2xl px-6 py-4 shadow-lg shadow-indigo-500/20'
      >
        <Sparkles size={18} />
        Sarankan Rencana Belajar Minggu Ini
      </button>
    );
  }

  /* ── Render: LOADING ── */
  if (loading) return <LoadingState variant='card' count={3} message='Memuat saran AI' />;

  /* ── Render: ERROR ── */
  if (error) return <ErrorState message={error} onRetry={fetchSuggestions} buttonId='ai-retry-btn' />;

  /* ── Render: EMPTY ── */
  if (suggestions?.tasks?.length === 0) return (
    <EmptyState icon={CalendarCheck} title='Jadwal minggu ini sudah penuh' description='AI tidak menemukan slot kosong. Coba lagi minggu depan.' />
  );

  /* ── Render: DONE ── */
  if (allProcessed) {
    return (
      <DoneSummary
        acceptedCount={acceptedTasks.length}
        totalCount={suggestions.tasks.length}
      />
    );
  }

  /* ── Render: SUGGESTIONS ── */
  return (
    <div className='space-y-4' id='ai-suggestion-panel' aria-live='polite' role='region'>
      {/* Accept error */}
      {acceptError && (
        <div className='bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-3' role='alert'>
          <p className='text-sm text-red-400'>Gagal menyimpan task: {acceptError}</p>
        </div>
      )}
      {/* Summary dari AI */}
      {suggestions.summary && (
        <div className='bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 flex gap-3'>
          <Sparkles className='text-indigo-400 flex-shrink-0 mt-0.5' size={16} />
          <div className='flex-1'>
            <p className='text-slate-300 text-sm leading-relaxed'>{suggestions.summary}</p>
            <ConfidenceBadge level={suggestions.confidence} />
          </div>
        </div>
      )}

      {/* Kartu per task */}
      {suggestions.tasks.map((task, i) => {
        const state = taskStates[i];
        const slot  = SLOT_META[task.planned_slot] ?? SLOT_META.morning;
        const SlotIcon = slot.Icon;

        if (state === 'accepted') {
          return (
            <div key={i} className='bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-3 opacity-70'>
              <CheckCircle2 className='text-emerald-400 flex-shrink-0' size={20} />
              <p className='text-emerald-300 text-sm font-medium'>
                &quot;{task.title}&quot; ditambahkan ke jadwal
              </p>
            </div>
          );
        }

        if (state === 'rejected') {
          return (
            <div key={i} className='bg-white/3 border border-white/5 rounded-2xl p-5 flex items-center gap-3 opacity-40 line-through'>
              <XCircle className='text-slate-500 flex-shrink-0' size={20} />
              <p className='text-slate-500 text-sm'>{task.title}</p>
            </div>
          );
        }

        return (
          <div
            key={i}
            id={`suggestion-card-${i}`}
            className='bg-[#0f172a] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all space-y-3'
          >
            {/* Title */}
            <h4 className='text-white font-semibold text-base leading-snug'>{task.title}</h4>

            {/* Description */}
            {task.description && (
              <p className='text-slate-400 text-sm leading-relaxed'>{task.description}</p>
            )}

            <RationaleBox rationale={task.rationale} />

            {/* Meta */}
            <div className='flex flex-wrap gap-2 text-xs'>
              <span className='inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 text-slate-300'>
                <Clock size={11} />
                {task.duration_estimate} menit
              </span>
              <span className={`inline-flex items-center gap-1.5 ${slot.bg} rounded-full px-3 py-1 ${slot.color}`}>
                <SlotIcon size={11} />
                {slot.label}
              </span>
              {task.planned_date && (
                <span className='inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 text-slate-400'>
                  📅 {task.planned_date}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className='flex gap-2 pt-1'>
              <button
                id={`accept-task-${i}`}
                onClick={() => handleAccept(task, i)}
                disabled={state === 'loading'}
                className='flex-1 flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-wait'
              >
                <CheckCircle2 size={15} />
                {state === 'loading' ? 'Menyimpan…' : 'Terima'}
              </button>
              <button
                id={`reject-task-${i}`}
                onClick={() => handleReject(i)}
                disabled={state === 'loading'}
                className='flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50'
              >
                <XCircle size={15} />
                Tolak
              </button>
            </div>
          </div>
        );
      })}

      {/* Progress counter */}
      <p className='text-center text-slate-500 text-xs' aria-live='polite'>
        {Object.keys(taskStates).length} dari {suggestions.tasks.length} saran sudah diproses
      </p>
    </div>
  );
}
