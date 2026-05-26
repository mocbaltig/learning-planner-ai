import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getThisMonday } from '../utils/dateUtils';

/**
 * Fetch semua data yang dibutuhkan Dashboard sekaligus:
 * - tasks minggu ini (GET /tasks?week_start=...)
 * - goals (GET /goals)
 * - profil user (GET /auth/me)
 *
 * Mengembalikan data mentah + derived stats yang sudah dikalkulasi.
 */
export function useDashboardData() {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const weekStart = getThisMonday();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/tasks?week_start=${weekStart}`),
      api.get('/goals'),
      api.get('/auth/me'),
    ])
      .then(([tasksData, goalsData, userData]) => {
        if (cancelled) return;
        // GET /tasks?week_start returns { week_start, tasks: { 'YYYY-MM-DD': [...] } }
        const rawTasks = tasksData?.tasks ?? tasksData ?? {};
        const flatTasks = Array.isArray(rawTasks)
          ? rawTasks
          : Object.values(rawTasks).flat();
        setTasks(flatTasks);
        setGoals(goalsData ?? []);
        setUser(userData);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // ── Derived stats ───────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  /** Tasks yang planned_date-nya hari ini */
  const todayTasks = tasks.filter((t) => t.planned_date?.startsWith(today));

  /** Task hari ini yang sudah done */
  const todayDone = todayTasks.filter((t) => t.status === 'done').length;

  /** Semua task minggu ini yang done */
  const weekDone = tasks.filter((t) => t.status === 'done').length;

  /** Total menit belajar minggu ini → jam */
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.duration_estimate ?? 0), 0);

  /** Persentase selesai minggu ini */
  const weekPercent = tasks.length
    ? Math.round((weekDone / tasks.length) * 100)
    : 0;

  return {
    tasks,
    setTasks,
    goals,
    user,
    loading,
    error,
    weekStart,
    todayTasks,
    stats: {
      totalHours: (totalMinutes / 60).toFixed(1),
      todayDone,
      todayTotal: todayTasks.length,
      weekDone,
      weekTotal: tasks.length,
      goalsCount: goals.length,
      weekPercent,
    },
  };
}
