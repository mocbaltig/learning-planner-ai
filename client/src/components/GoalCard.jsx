export default function GoalCard({ title, deadline, taskTotal }) {
  return (
    <div className='goal-card-container'>
      <div className='goal-card-title'>title: {title}</div>
      <div className='goal-card-deadline'>Deadline: {deadline}</div>
      <div className='goal-card-taskTotal'>task total = {taskTotal}</div>
    </div>
  );
}
