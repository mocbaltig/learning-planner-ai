export default function WeeklySummary({
  hourPlanned,
  hourDone,
  completionRate,
}) {
  return (
    <div className='weekly-summary-container'>
      <div className='weekly-summary-hourPlanned'>{hourPlanned}</div>
      <div className='weekly-summary-hourDone'>{hourDone}</div>
      <div className='weekly-summary-completionRate'>{completionRate}</div>
    </div>
  );
}
