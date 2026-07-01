import { useState, useEffect, useRef } from 'react';
import { api, streamSSE } from '../services/api';
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
  CalendarClock,
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

function DoneSummary({ acceptedCount, totalCount }) {
  return (
    <div className='bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-2'>
      <PartyPopper className='text-emerald-400 mx-auto' size={32} />
      <p className='text-emerald-300 font-semibold text-lg'>Selesai!</p>
      <p className='text-slate-400 text-sm'>
        <span className='text-emerald-400 font-bold'>{acceptedCount}</span> dari{' '}
        <span className='font-bold text-white'>{totalCount}</span> task berhasil dijadwalkan ulang.
      </p>
    </div>
  );
}

export default function AIReschedulePanel({ tasks, onRescheduled }) {
  const [suggestions, setSuggestions]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [taskStates, setTaskStates]     = useState({});
  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [recommendationId, setRecommendationId] = useState(null);
  const [acceptError, setAcceptError] = useState(null);
  const [streamedTasks, setStreamedTasks] = useState({});
  const [streamedSummary, setStreamedSummary] = useState(null);
  const streamData = useRef({ tasks: {}, summary: null });

  async function fetchReschedule() {
    if (!tasks || tasks.length === 0) return;

    setLoading(true);
    setError(null);
    setSuggestions(null);
    setTaskStates({});
    setAcceptedTasks([]);
    setStreamedTasks({});
    setStreamedSummary(null);
    streamData.current = { tasks: {}, summary: null };

    streamSSE('/ai/plan/reschedule/stream', { task_ids: tasks.map(t => t.id) }, {
      onTask: ({ index, task }) => {
        streamData.current.tasks[index] = task;
        setStreamedTasks({ ...streamData.current.tasks });
      },
      onSummary: ({ summary }) => {
        streamData.current.summary = summary;
        setStreamedSummary(summary);
      },
      onDone: ({ recommendationId: recId, confidence }) => {
        const sorted = Object.keys(streamData.current.tasks)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => streamData.current.tasks[k]);
        setSuggestions({
          id: recId,
          tasks: sorted,
          summary: streamData.current.summary || '',
          confidence,
        });
        setRecommendationId(recId);
        setLoading(false);
      },
      onError: (err) => {
        setError(err.message || 'Gagal memuat saran reschedule');
        setLoading(false);
      },
    });
  }

  async function handleAccept(task, index) {
    setAcceptError(null);
    setTaskStates((prev) => ({ ...prev, [index]: 'loading' }));
    try {
      const updated = await api.patch(`/tasks/${task.id}`, {
        planned_date: task.planned_date,
        planned_slot: task.planned_slot,
        rationale: task.rationale,
        source: 'ai',
      });
      setTaskStates((prev) => ({ ...prev, [index]: 'accepted' }));
      setAcceptedTasks((prev) => [...prev, updated]);
      onRescheduled?.(updated);
    } catch (err) {
      setAcceptError(err.message || 'Gagal menyimpan task');
      setTaskStates((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  }

  function handleReject(index) {
    setTaskStates((prev) => ({ ...prev, [index]: 'rejected' }));
  }

  /* ── Card renderers ── */

  function renderSkeleton(i) {
    return (
      <div key={`skel-${i}`} className='bg-[#0f172a] border border-white/5 rounded-2xl p-5 space-y-3 animate-pulse'>
        <div className='h-4 bg-white/5 rounded-full w-3/4' />
        <div className='h-3 bg-white/5 rounded-full w-full' />
        <div className='h-3 bg-white/5 rounded-full w-4/5' />
        <div className='flex gap-2 mt-4'>
          <div className='h-8 w-24 bg-white/5 rounded-xl' />
          <div className='h-8 w-24 bg-white/5 rounded-xl' />
        </div>
      </div>
    );
  }

  function renderTaskCard(task, i) {
    const state = taskStates[i];
    const slot  = SLOT_META[task.planned_slot] ?? SLOT_META.morning;
    const SlotIcon = slot.Icon;

    if (state === 'accepted') {
      return (
        <div key={i} className='bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-3 opacity-70'>
          <CheckCircle2 className='text-emerald-400 flex-shrink-0' size={20} />
          <p className='text-emerald-300 text-sm font-medium'>
            &quot;{task.title}&quot; dijadwalkan ulang
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
        className='bg-[#0f172a] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all space-y-3'
      >
        <h4 className='text-white font-semibold text-base leading-snug'>{task.title}</h4>
        <RationaleBox rationale={task.rationale} />
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
        <div className='flex gap-2 pt-1'>
          <button
            onClick={() => handleAccept(task, i)}
            disabled={state === 'loading'}
            className='flex-1 flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-wait'
          >
            <CheckCircle2 size={15} />
            {state === 'loading' ? 'Menyimpan…' : 'Terima'}
          </button>
          <button
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
  }

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
        onClick={fetchReschedule}
        disabled={!tasks || tasks.length === 0}
        className='w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 active:scale-95 transition-all text-white font-semibold rounded-2xl px-6 py-4 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <CalendarClock size={18} />
        Reschedule dengan AI
      </button>
    );
  }

  /* ── Render: LOADING ── */
  if (loading) {
    const streamedKeys = Object.keys(streamedTasks);
    if (streamedKeys.length === 0) {
      return <LoadingState variant='card' count={3} message='Memuat saran reschedule' />;
    }

    const maxIndex = Math.max(...streamedKeys.map(Number));
    const cards = Array.from({ length: maxIndex + 1 }, (_, i) =>
      streamedTasks[i] !== undefined ? renderTaskCard(streamedTasks[i], i) : renderSkeleton(i)
    );

    return (
      <div className='space-y-4' aria-busy='true' role='region' aria-live='polite'>
        {streamedSummary && (
          <div className='bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 flex gap-3'>
            <Sparkles className='text-indigo-400 flex-shrink-0 mt-0.5' size={16} />
            <div className='flex-1'>
              <p className='text-slate-300 text-sm leading-relaxed'>{streamedSummary}</p>
            </div>
          </div>
        )}
        {cards}
      </div>
    );
  }

  /* ── Render: ERROR ── */
  if (error) return <ErrorState message={error} onRetry={fetchReschedule} />;

  /* ── Render: EMPTY ── */
  if (suggestions?.tasks?.length === 0) return (
    <EmptyState icon={CalendarCheck} title='Tidak ada task yang perlu dijadwalkan ulang' description='Semua task sudah terjadwal dengan baik.' />
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
    <div className='space-y-4' aria-live='polite' role='region'>
      {acceptError && (
        <div className='bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-3' role='alert'>
          <p className='text-sm text-red-400'>Gagal menyimpan task: {acceptError}</p>
        </div>
      )}
      {suggestions.summary && (
        <div className='bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 flex gap-3'>
          <Sparkles className='text-indigo-400 flex-shrink-0 mt-0.5' size={16} />
          <div className='flex-1'>
            <p className='text-slate-300 text-sm leading-relaxed'>{suggestions.summary}</p>
            <ConfidenceBadge level={suggestions.confidence} />
          </div>
        </div>
      )}

      {suggestions.tasks.map((task, i) => renderTaskCard(task, i))}

      {/* Progress counter */}
      <p className='text-center text-slate-500 text-xs' aria-live='polite'>
        {Object.keys(taskStates).length} dari {suggestions.tasks.length} saran sudah diproses
      </p>
    </div>
  );
}
