import { useState } from 'react';
import WeeklyCalendar from '../components/WeeklyCalendar';
import { X, Clock, Sun, Sunset, Moon, CheckCircle2, SkipForward } from 'lucide-react';
import { api } from '../services/api';

const SLOT_META = {
  morning:   { label: 'Pagi',  Icon: Sun,    color: 'text-amber-400',   bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  activeBg: 'bg-amber-500/20'  },
  afternoon: { label: 'Siang', Icon: Sunset, color: 'text-orange-400',  bg: 'bg-orange-500/10', border: 'border-orange-500/30', activeBg: 'bg-orange-500/20' },
  evening:   { label: 'Malam', Icon: Moon,   color: 'text-indigo-400',  bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', activeBg: 'bg-indigo-500/20' },
};

const STATUS_LABEL = { todo: 'Belum', done: 'Selesai', skipped: 'Dilewati', in_progress: 'Sedang' };
const STATUS_COLOR  = { todo: 'text-slate-400', done: 'text-emerald-400', skipped: 'text-slate-500', in_progress: 'text-blue-400' };

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ── Task Detail Drawer ── */
function TaskDrawer({ task, onClose, onStatusChange }) {
  const [updating, setUpdating]       = useState(false);
  const slot = SLOT_META[task.planned_slot] ?? SLOT_META.morning;
  const SlotIcon = slot.Icon;

  async function updateStatus(status) {
    setUpdating(true);
    try {
      await api.patch(`/tasks/${task.id}/status`, { status });
      onStatusChange?.(task.id, status);
      onClose();
    } catch {
      /* silent — biarkan user coba lagi */
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-end sm:items-center justify-center'
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' />

      {/* Panel */}
      <div
        className='relative z-10 w-full sm:max-w-md bg-[#0f172a] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl'
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className='space-y-4'>
          {/* Close */}
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 text-slate-400 transition-all'
          >
            <X size={16} />
          </button>

          {/* Slot badge */}
          <div className={`inline-flex items-center gap-1.5 ${slot.bg} rounded-full px-3 py-1 text-xs font-medium ${slot.color}`}>
            <SlotIcon size={11} />
            {slot.label}
          </div>

          {/* Title */}
          <h3 className='text-lg font-bold text-white pr-6 leading-snug'>{task.title}</h3>

          {/* Description */}
          {task.description && (
            <p className='text-slate-400 text-sm leading-relaxed'>{task.description}</p>
          )}

          {/* Rationale */}
          {task.rationale && (
            <div className='bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3'>
              <p className='text-amber-300/80 text-xs leading-relaxed'>💡 {task.rationale}</p>
            </div>
          )}

          {/* Meta row */}
          <div className='flex flex-wrap gap-2 text-xs'>
            <span className='inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 text-slate-300'>
              <Clock size={11} /> {task.duration_estimate} menit
            </span>
            <span className='inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 text-slate-400'>
              📅 {formatDate(task.planned_date)}
            </span>
            <span className={`inline-flex items-center gap-1 bg-white/5 rounded-full px-3 py-1 ${STATUS_COLOR[task.status]}`}>
              {STATUS_LABEL[task.status] ?? task.status}
            </span>
          </div>

          {/* Actions — hanya untuk todo */}
          {task.status === 'todo' && (
            <div className='flex gap-2 pt-1'>
              <button
                disabled={updating}
                onClick={() => updateStatus('done')}
                className='flex-1 flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50'
              >
                <CheckCircle2 size={15} />
                Tandai Selesai
              </button>
              <button
                disabled={updating}
                onClick={() => updateStatus('skipped')}
                className='flex items-center justify-center gap-2 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 text-slate-400 rounded-xl px-4 py-2.5 text-sm transition-all disabled:opacity-50'
              >
                <SkipForward size={15} />
                Lewati
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function Calendar() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [refreshKey, setRefreshKey]     = useState(0);

  function handleStatusChange() {
    setSelectedTask(null);
    setRefreshKey(k => k + 1);
  }

  return (
    <div className='min-h-screen bg-[#020617] text-white p-6'>
      {/* Page header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Kalender Mingguan</h1>
        <p className='text-slate-400 text-sm mt-1'>
          Lihat dan kelola jadwal belajar per minggu
        </p>
      </div>

      {/* Legend */}
      <div className='flex items-center gap-4 mb-5 text-xs text-slate-500'>
        <span className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-sm border border-white/10 bg-white/5' /> Belum
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-sm border border-emerald-500/40 bg-emerald-500/10' /> Selesai
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-sm border border-white/5 bg-white/3 opacity-40' /> Dilewati
        </span>
        <span className='flex items-center gap-1.5 ml-auto'>
          <span className='w-2.5 h-2.5 rounded-sm border border-indigo-500/40 bg-indigo-500/5' /> Hari ini
        </span>
      </div>

      {/* Weekly calendar */}
      <WeeklyCalendar key={refreshKey} onTaskClick={setSelectedTask} />

      {/* Task detail drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
