import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { getThisMonday } from '../utils/dateUtils';
import AISuggestionPanel from '../components/AISuggestionPanel.jsx';
import AIReschedulePanel from '../components/AIReschedulePanel.jsx';
import {
  ArrowLeft,
  Target,
  CalendarDays,
  ListChecks,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Sun,
  Sunset,
  Moon,
  Plus,
  X,
  PenLine,
  Trash2,
  CalendarClock,
} from 'lucide-react';
import RationaleBox from '../components/RationaleBox';

const SLOT_META = {
  morning:   { label: 'Pagi',  Icon: Sun,    color: 'text-amber-400',   bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  activeBg: 'bg-amber-500/20'  },
  afternoon: { label: 'Siang', Icon: Sunset, color: 'text-orange-400',  bg: 'bg-orange-500/10', border: 'border-orange-500/30', activeBg: 'bg-orange-500/20' },
  evening:   { label: 'Malam', Icon: Moon,   color: 'text-indigo-400',  bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', activeBg: 'bg-indigo-500/20' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const plain = String(dateStr).split('T')[0];
  const [y, m, d] = plain.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function todayISO() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

/* ── Manual Task Form ── */
function ManualTaskForm({ goalId, weekStart, onCreated, onCancel }) {
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [plannedDate, setPlannedDate]   = useState(weekStart || todayISO());
  const [plannedSlot, setPlannedSlot]   = useState('morning');
  const [duration, setDuration]         = useState(30);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const task = await api.post('/tasks', {
        goal_id: goalId,
        title: title.trim(),
        description: description.trim() || undefined,
        duration_estimate: Number(duration),
        planned_date: plannedDate,
        planned_slot: plannedSlot,
        source: 'manual',
      });
      onCreated(task);
      // Reset form
      setTitle('');
      setDescription('');
      setDuration(30);
    } catch (err) {
      setError(err.message || 'Gagal membuat task. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}
      className='bg-[#0c1528] border border-indigo-500/20 rounded-2xl p-5 space-y-4'
    >
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <PenLine size={15} className='text-indigo-400' />
          <span className='text-sm font-semibold text-white'>Task Baru</span>
        </div>
        <button
          type='button'
          onClick={onCancel}
          className='p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-all'
        >
          <X size={14} />
        </button>
      </div>

      {/* Title */}
      <div className='space-y-1.5'>
        <label className='text-xs font-medium text-slate-400'>
          Judul Task <span className='text-red-400'>*</span>
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder='Contoh: Membaca bab 3 tentang React Hooks'
          required
          className='w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                     placeholder-slate-500 focus:outline-none focus:border-indigo-500/60
                     focus:ring-1 focus:ring-indigo-500/30 transition-all'
        />
      </div>

      {/* Description */}
      <div className='space-y-1.5'>
        <label className='text-xs font-medium text-slate-400'>Deskripsi (opsional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder='Catatan tambahan tentang task ini…'
          rows={2}
          className='w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                     placeholder-slate-500 focus:outline-none focus:border-indigo-500/60
                     focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none'
        />
      </div>

      {/* Date + Duration row */}
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1.5'>
          <label className='text-xs font-medium text-slate-400'>Tanggal</label>
          <input
            type='date'
            value={plannedDate}
            onChange={e => setPlannedDate(e.target.value)}
            required
            className='w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                       focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30
                       [color-scheme:dark] transition-all'
          />
        </div>
        <div className='space-y-1.5'>
          <label className='text-xs font-medium text-slate-400'>
            Durasi (menit)
          </label>
          <input
            type='number'
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min={25}
            max={90}
            required
            className='w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                       focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all'
          />
          <p className='text-[10px] text-slate-500'>25 – 90 menit</p>
        </div>
      </div>

      {/* Slot selector */}
      <div className='space-y-1.5'>
        <label className='text-xs font-medium text-slate-400'>Sesi Belajar</label>
        <div className='grid grid-cols-3 gap-2'>
          {Object.entries(SLOT_META).map(([key, meta]) => {
            const SlotIcon = meta.Icon;
            const active = plannedSlot === key;
            return (
              <button
                key={key}
                type='button'
                onClick={() => setPlannedSlot(key)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all
                  ${active
                    ? `${meta.activeBg} ${meta.border} ${meta.color}`
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
              >
                <SlotIcon size={16} />
                <span className='text-[11px] font-medium'>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className='text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2'>
          ⚠️ {error}
        </p>
      )}

      {/* Actions */}
      <div className='flex gap-2 pt-1'>
        <button
          type='button'
          onClick={onCancel}
          className='px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-sm transition-all'
        >
          Batal
        </button>
        <button
          type='submit'
          disabled={saving || !title.trim()}
          className='flex-1 flex items-center justify-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30
                     border border-indigo-500/40 text-indigo-300 rounded-xl py-2.5 text-sm font-medium
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {saving ? (
            <span className='flex items-center gap-2'>
              <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24' fill='none'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z' />
              </svg>
              Menyimpan…
            </span>
          ) : (
            <>
              <Plus size={15} />
              Tambah Task
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ── Reschedule Form ── */
function RescheduleForm({ task, onRescheduled, onCancel }) {
  const [date, setDate]     = useState(String(task.planned_date).split('T')[0]);
  const [slot, setSlot]     = useState(task.planned_slot);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch(`/tasks/${task.id}`, {
        planned_date: date,
        planned_slot: slot,
      });
      onRescheduled(updated);
    } catch (err) {
      setError(err.message || 'Gagal reschedule. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}
      className='mt-3 bg-[#0c1528] border border-indigo-500/20 rounded-xl p-4 space-y-3'
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-1.5'>
          <CalendarClock size={13} className='text-indigo-400' />
          <span className='text-xs font-semibold text-white'>Jadwal Baru</span>
        </div>
        <button
          type='button'
          onClick={onCancel}
          className='p-1 rounded-md hover:bg-white/10 text-slate-400 transition-all'
        >
          <X size={12} />
        </button>
      </div>

      {/* Date + Slot row */}
      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-1'>
          <label className='text-[10px] font-medium text-slate-400'>Tanggal</label>
          <input
            type='date'
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className='w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white
                       focus:outline-none focus:border-indigo-500/60 [color-scheme:dark] transition-all'
          />
        </div>
        <div className='space-y-1'>
          <label className='text-[10px] font-medium text-slate-400'>Sesi</label>
          <div className='grid grid-cols-3 gap-1'>
            {Object.entries(SLOT_META).map(([key, meta]) => {
              const SlotIcon = meta.Icon;
              const active = slot === key;
              return (
                <button
                  key={key}
                  type='button'
                  onClick={() => setSlot(key)}
                  title={meta.label}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 transition-all
                    ${active
                      ? `${meta.activeBg} ${meta.border} ${meta.color}`
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  <SlotIcon size={12} />
                  <span className='text-[9px]'>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <p className='text-red-400 text-[10px] bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5'>
          ⚠️ {error}
        </p>
      )}

      <div className='flex gap-2'>
        <button
          type='button'
          onClick={onCancel}
          className='px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-xs transition-all'
        >
          Batal
        </button>
        <button
          type='submit'
          disabled={saving || !date}
          className='flex-1 flex items-center justify-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30
                     border border-indigo-500/40 text-indigo-300 rounded-lg py-1.5 text-xs font-medium
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {saving ? (
            <svg className='animate-spin h-3 w-3' viewBox='0 0 24 24' fill='none'>
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
              <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z' />
            </svg>
          ) : (
            <CalendarClock size={12} />
          )}
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}

/* ── Main Page ── */
export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const weekStart = searchParams.get('week_start') ?? getThisMonday();

  const [goal, setGoal]                     = useState(null);
  const [loadingGoal, setLoadingGoal]       = useState(true);
  const [errorGoal, setErrorGoal]           = useState(null);
  const [acceptedTasks, setAcceptedTasks]   = useState([]);
  const [hasInitialTasks, setHasInitialTasks] = useState(false);
  const [expandedTasks, setExpandedTasks]   = useState({});
  const [showAIPanel, setShowAIPanel]           = useState(false);
  const [showAIReschedulePanel, setShowAIReschedulePanel] = useState(false);
  const [showManualForm, setShowManualForm]     = useState(false);
  const [deletingId, setDeletingId]         = useState(null);
  const [reschedulingId, setReschedulingId] = useState(null); // taskId yang sedang di-reschedule
  const [deleteError, setDeleteError] = useState(null);
  const [focusedTaskIndex, setFocusedTaskIndex] = useState(-1);
  const taskRefs = useRef([]);

  useEffect(() => {
    taskRefs.current = taskRefs.current.slice(0, acceptedTasks.length);
  }, [acceptedTasks.length]);

  function handleTaskKeyDown(e, index) {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          setFocusedTaskIndex(index - 1);
          taskRefs.current[index - 1]?.focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (index < acceptedTasks.length - 1) {
          setFocusedTaskIndex(index + 1);
          taskRefs.current[index + 1]?.focus();
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleExpand(acceptedTasks[index].id);
        break;
    }
  }

  function handleTaskListKeyDown(e) {
    if (acceptedTasks.length === 0) return;
    if (e.key === 'ArrowDown' && focusedTaskIndex < 0) {
      e.preventDefault();
      setFocusedTaskIndex(0);
      taskRefs.current[0]?.focus();
    }
  }

  function toggleExpand(taskId) {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  }

  function fetchGoal() {
    setLoadingGoal(true);
    setErrorGoal(null);
    api.get(`/goals/${id}`)
      .then(goalData => {
        const tasks = goalData.tasks ?? [];
        setGoal(goalData);
        setAcceptedTasks(tasks);
        setHasInitialTasks(tasks.length > 0);
      })
      .catch(err => setErrorGoal(err.message))
      .finally(() => setLoadingGoal(false));
  }

  useEffect(() => {
    fetchGoal();
  }, [id]);

  function handleTaskAccepted(task) {
    setAcceptedTasks(prev => [...prev, task]);
    setHasInitialTasks(true);
    setShowAIPanel(true);
    setShowManualForm(false);
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm('Hapus task ini?')) return;
    setDeletingId(taskId);
    setDeleteError(null);
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: 'skipped' });
      setAcceptedTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus task.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleRescheduled(updatedTask) {
    setAcceptedTasks(prev =>
      prev.map(t => t.id === updatedTask.id ? updatedTask : t)
    );
    setReschedulingId(null);
  }

  /* ── Loading ── */
  if (loadingGoal) {
    return (
      <div className='min-h-screen bg-[#020617] flex items-center justify-center'>
        <div className='flex flex-col items-center gap-3 text-slate-400'>
          <div className='w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin' />
          <p className='text-sm'>Memuat goal…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (errorGoal) {
    return (
      <div className='min-h-screen bg-[#020617] flex items-center justify-center p-6'>
        <div className='bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-sm'>
          <p className='text-red-400 font-medium mb-4'>⚠️ {errorGoal}</p>
          <div className='flex gap-3 justify-center'>
            <button
              onClick={fetchGoal}
              className='bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl px-4 py-2 text-sm font-medium transition-all'
            >
              Coba lagi
            </button>
            <button
              onClick={() => navigate('/goals')}
              className='text-sm text-slate-400 hover:text-white transition-colors underline'
            >
              Kembali ke daftar goal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#020617] text-white p-6 max-w-2xl mx-auto'>

      {/* Back */}
      <button
        id='back-to-goals'
        onClick={() => navigate('/goals')}
        className='flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors'
      >
        <ArrowLeft size={16} />
        Kembali ke Goals
      </button>

      {/* Goal Header Card */}
      <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-6 mb-6'>
        <div className='flex items-start gap-4'>
          <div className='bg-indigo-500/20 p-3 rounded-2xl flex-shrink-0'>
            <Target className='text-indigo-400' size={22} />
          </div>
          <div className='flex-1 min-w-0'>
            <h1 className='text-xl font-bold text-white leading-snug'>{goal.title}</h1>
            {goal.description && (
              <p className='text-slate-400 text-sm mt-1'>{goal.description}</p>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className='flex flex-wrap gap-3 mt-5'>
          {goal.deadline && (
            <span className='inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5 text-xs text-slate-300'>
              <CalendarDays size={12} />
              Deadline: {formatDate(goal.deadline)}
            </span>
          )}
          {acceptedTasks.length > 0 && (
            <span className='inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 text-xs text-emerald-400'>
              <ListChecks size={12} />
              {acceptedTasks.length} task dijadwalkan
            </span>
          )}
        </div>
      </div>

      {/* AI Suggestion Section */}
      {(!hasInitialTasks || showAIPanel) && (
        <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-6 mb-6'>
          <div className='flex items-center gap-2 mb-5'>
            <Sparkles className='text-indigo-400' size={18} />
            <h2 className='text-base font-semibold text-white'>Saran Rencana Belajar AI</h2>
            <span className='ml-auto text-xs text-slate-500 bg-white/5 rounded-full px-2.5 py-1'>
              Minggu {weekStart}
            </span>
          </div>

          <AISuggestionPanel
            goalId={id}
            weekStart={weekStart}
            onAccept={handleTaskAccepted}
          />
        </div>
      )}

      {/* Task List + Manual Form */}
      <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-6'>
        {/* Section header */}
        <div className='flex items-center gap-2 mb-4'>
          <ListChecks className='text-emerald-400' size={18} />
          <h2 className='text-base font-semibold text-white'>
            Task{acceptedTasks.length > 0 ? ` (${acceptedTasks.length})` : ''}
          </h2>
          <div className='ml-auto flex items-center gap-2'>
            {/* Tombol AI */}
            {hasInitialTasks && (
              <button
                onClick={() => setShowAIPanel(prev => !prev)}
                className='flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-full px-3 py-1.5 transition-all'
              >
                <Sparkles size={12} />
                {showAIPanel ? 'Tutup AI' : 'Saran AI'}
              </button>
            )}
            {/* Tombol Reschedule AI */}
            {acceptedTasks.length > 0 && (
              <button
                onClick={() => setShowAIReschedulePanel(prev => !prev)}
                className='flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-full px-3 py-1.5 transition-all'
              >
                <CalendarClock size={12} />
                {showAIReschedulePanel ? 'Tutup' : 'Reschedule AI'}
              </button>
            )}
            {/* Tombol Manual */}
            <button
              onClick={() => { setShowManualForm(prev => !prev); setShowAIPanel(false); setShowAIReschedulePanel(false); }}
              className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border transition-all
                ${showManualForm
                  ? 'bg-white/10 border-white/20 text-slate-300'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                }`}
            >
              {showManualForm ? <X size={12} /> : <Plus size={12} />}
              {showManualForm ? 'Batal' : 'Tambah Manual'}
            </button>
          </div>
        </div>

        {/* AI Reschedule panel */}
        {showAIReschedulePanel && (
          <div className='mb-4'>
            <AIReschedulePanel
              tasks={acceptedTasks}
              onRescheduled={handleRescheduled}
            />
          </div>
        )}

        {/* Manual form */}
        {showManualForm && (
          <div className='mb-4'>
            <ManualTaskForm
              goalId={id}
              weekStart={weekStart}
              onCreated={handleTaskAccepted}
              onCancel={() => setShowManualForm(false)}
            />
          </div>
        )}

        {/* Delete error */}
        {deleteError && (
          <div className='mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-sm text-red-400' role='alert'>
            ⚠️ {deleteError}
          </div>
        )}

        {/* Task list */}
        {acceptedTasks.length === 0 && !showManualForm ? (
          <div className='text-center py-8'>
            <div className='inline-flex items-center justify-center w-12 h-12 bg-white/5 rounded-2xl mb-3'>
              <ListChecks size={20} className='text-slate-500' />
            </div>
            <p className='text-slate-400 text-sm'>Belum ada task.</p>
            <p className='text-slate-500 text-xs mt-1'>Tambah manual atau gunakan Saran AI di atas.</p>
          </div>
        ) : (
          <ul className='space-y-2' onKeyDown={handleTaskListKeyDown}>
            {acceptedTasks.map((task, index) => {
              const isExpanded = expandedTasks[task.id];
              const slot = SLOT_META[task.planned_slot] || SLOT_META.morning;
              const SlotIcon = slot.Icon;
              const isManual = task.source === 'manual';

              return (
                <li
                  key={task.id}
                  tabIndex={0}
                  ref={el => { taskRefs.current[index] = el; }}
                  role='button'
                  aria-expanded={isExpanded}
                  onKeyDown={e => handleTaskKeyDown(e, index)}
                  className='flex items-start gap-3 bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]'
                >
                  {/* Dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${isManual ? 'bg-emerald-400' : 'bg-indigo-400'}`} />

                  <div
                    role="button"
                    className='flex-1 min-w-0 cursor-pointer'
                    tabIndex={0}
                    onClick={() => { setFocusedTaskIndex(index); toggleExpand(task.id); }}
                  >
                    <div className='flex justify-between items-start gap-2'>
                      <p className='text-sm font-medium text-white'>{task.title}</p>
                      <div className='text-slate-500 flex-shrink-0'>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Collapsed preview */}
                    {!isExpanded && (
                      <div className='flex items-center gap-2 mt-1'>
                        <p className='text-xs text-slate-400'>
                          {formatDate(task.planned_date)} · {task.duration_estimate} menit
                        </p>
                        {isManual && (
                          <span className='text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-1.5 py-0.5'>
                            manual
                          </span>
                        )}
                      </div>
                    )}

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className='mt-3 space-y-3'>
                        {task.description && (
                          <p className='text-sm text-slate-300 leading-relaxed'>{task.description}</p>
                        )}
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
                              📅 {formatDate(task.planned_date)}
                            </span>
                          )}
                          {isManual && (
                            <span className='inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-emerald-400'>
                              ✏️ Manual
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  {/* Reschedule form inline */}
                  {reschedulingId === task.id && (
                    <RescheduleForm
                      task={task}
                      onRescheduled={handleRescheduled}
                      onCancel={() => setReschedulingId(null)}
                    />
                  )}
                  </div>

                  {/* Action buttons */}
                  {task.status === 'todo' && reschedulingId !== task.id && (
                    <div className='flex-shrink-0 flex items-center gap-1'>
                      {/* Reschedule button */}
                      <button
                        onClick={e => { e.stopPropagation(); setReschedulingId(task.id); setExpandedTasks(prev => ({ ...prev, [task.id]: true })); }}
                        className='p-1.5 rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all'
                        title='Reschedule task'
                      >
                        <CalendarClock size={13} />
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}
                        disabled={deletingId === task.id}
                        className='p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50'
                        title='Hapus task'
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
