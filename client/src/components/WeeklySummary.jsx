export default function WeeklySummary({
  hourPlanned = 0,
  hourDone = 0,
  completionRate = 0,
}) {
  return (
    <section className='weekly-summary-container' aria-label='Ringkasan mingguan' aria-live='polite'>
      <div className='weekly-summary-hourPlanned' aria-label={`Jam direncanakan: ${hourPlanned}`}>{hourPlanned}</div>
      <div className='weekly-summary-hourDone' aria-label={`Jam terselesaikan: ${hourDone}`}>{hourDone}</div>
      <div className='weekly-summary-completionRate' aria-label={`Tingkat penyelesaian: ${completionRate}`}>{completionRate}</div>
    </section>
  );
}
