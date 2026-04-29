export default function GoalCard({ title, deadline, taskTotal }) {
  return (
    <div className='goal-card-container'>
      <div className='goal-card-title'>{title}</div>
      <div className='goal-card-deadline'>{deadline}</div>
      <div className='goal-card-taskTotal'>{taskTotal}</div>
    </div>
  );
}
