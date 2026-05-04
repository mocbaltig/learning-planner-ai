import TaskItem from '../components/TaskItem';
import ProgressBar from '../components/ProgressBar';

const sampleTasks = [
  {
    id: '1',
    title: 'Belajar react hooks',
    duration_estimate: 45,
    planned_slot: 'morning',
    status: 'done',
  },
  {
    id: '2',
    title: 'Setup express routes',
    duration_estimate: 60,
    planned_slot: 'afternoon',
    status: 'todo',
  },
];

export default function Dashboard() {
  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-slate-400">Hello World, test test 🚀</p>
      </div>

      <ProgressBar completed={1} total={2} label='Progress Minggu ini' />

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Daftar Tugas</h3>
        {sampleTasks.map((task) => (
          <TaskItem key={task.id} task={task} onStatusChange={() => {}} />
        ))}
      </div>
    </div>
  );
}
