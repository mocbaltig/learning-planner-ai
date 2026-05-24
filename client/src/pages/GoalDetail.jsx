import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AISuggestionPanel from '../components/AISuggestionPanel.jsx';
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
  Lightbulb,
} from 'lucide-react';

const SLOT_META = {
  morning:   { label: 'Pagi',  Icon: Sun,    color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  afternoon: { label: 'Siang', Icon: Sunset, color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  evening:   { label: 'Malam', Icon: Moon,   color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
};

/**
 * Hitung Senin awal minggu ini (YYYY-MM-DD).
 */
function getThisMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [goal, setGoal]               = useState(null);
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [errorGoal, setErrorGoal]     = useState(null);
  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [hasInitialTasks, setHasInitialTasks] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});

  function toggleExpand(taskId) {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }

  useEffect(() => {
    setLoadingGoal(true);
    Promise.all([
      api.get(`/goals/${id}`),
      api.get(`/tasks?goal_id=${id}&week_start=${weekStart}`)
    ])
      .then(([goalData, tasksData]) => {
        setGoal(goalData);
        setAcceptedTasks(tasksData);
        setHasInitialTasks(tasksData.length > 0);
      })
      .catch((err) => setErrorGoal(err.message))
      .finally(() => setLoadingGoal(false));
  }, [id]);

  function handleTaskAccepted(task) {
    setAcceptedTasks((prev) => [...prev, task]);
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
          <button
            onClick={() => navigate('/goals')}
            className='text-sm text-slate-400 hover:text-white transition-colors underline'
          >
            Kembali ke daftar goal
          </button>
        </div>
      </div>
    );
  }

  const weekStart = getThisMonday();

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
              Deadline: {goal.deadline}
            </span>
          )}
          {acceptedTasks.length > 0 && (
            <span className='inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 text-xs text-emerald-400'>
              <ListChecks size={12} />
              {acceptedTasks.length} task dijadwalkan minggu ini
            </span>
          )}
        </div>
      </div>

      {/* AI Suggestion Section */}
      {!hasInitialTasks && (
        <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-6'>
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

      {/* Accepted Tasks Preview */}
      {acceptedTasks.length > 0 && (
        <div className='mt-6 bg-[#0f172a] border border-white/10 rounded-3xl p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <ListChecks className='text-emerald-400' size={18} />
            <h2 className='text-base font-semibold text-white'>
              Task yang Diterima ({acceptedTasks.length})
            </h2>
          </div>
          <ul className='space-y-2'>
            {acceptedTasks.map((task) => {
              const isExpanded = expandedTasks[task.id];
              const slot = SLOT_META[task.planned_slot] || SLOT_META.morning;
              const SlotIcon = slot.Icon;
              
              return (
                <li
                  key={task.id}
                  className='flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3 cursor-pointer hover:border-emerald-500/30 transition-colors'
                  onClick={() => toggleExpand(task.id)}
                >
                  <div className='w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5' />
                  <div className='flex-1 min-w-0'>
                    <div className='flex justify-between items-start gap-2'>
                      <p className='text-sm font-medium text-white'>{task.title}</p>
                      <div className='text-slate-500 flex-shrink-0'>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className='mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200'>
                        {task.description && (
                          <p className='text-sm text-slate-300 leading-relaxed'>
                            {task.description}
                          </p>
                        )}
                        
                        {task.rationale && (
                          <div className='flex gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2.5'>
                            <Lightbulb className='text-amber-400 flex-shrink-0 mt-0.5' size={14} />
                            <p className='text-amber-300/80 text-xs leading-relaxed'>{task.rationale}</p>
                          </div>
                        )}
                        
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
                      </div>
                    )}
                    
                    {!isExpanded && (
                      <p className='text-xs text-slate-400 mt-1.5'>
                        {task.planned_date} · {task.duration_estimate} menit
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
