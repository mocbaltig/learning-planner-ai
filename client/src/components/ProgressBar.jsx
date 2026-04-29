export default function ProgressBar({ completed, total, label }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className='progress-container'>
      {label && <span className='progress-label'>{label}</span>}
      <div className='progress-track'>
        <div className='progres-fill' style={{ width: `${percent}%` }}></div>
      </div>
      <span className='progress-text'>{percent}%</span>
    </div>
  );
}
