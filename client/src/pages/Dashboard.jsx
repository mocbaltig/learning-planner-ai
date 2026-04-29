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
    <div>
      <h1>Dashboard</h1>
      <ProgressBar completed={1} total={2} label='Progress Minggu ini' />
      {sampleTasks.map((task) => (
        <TaskItem key={task.id} task={task} onStatusChange={() => {}} />
      ))}
    </div>
  );
}
