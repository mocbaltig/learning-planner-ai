export default function EmptyState({ type, onAction }) {
  const messages = {
    goals: {
      title: 'Belum ada goal',
      description: 'Mulai dengan menentukan apa yang ingin Anda pelajari.',
      action: 'Buat Goal Pertama',
    },
    tasks: {
      title: 'Belum ada tugas minggu ini',
      description: 'Minta AI menyusun rencana belajar, atau buat tugas secara manual.',
      action: 'Sarankan Rencana',
    },
    calendar: {
      title: 'Kalender kosong',
      description: 'Tugas yang sudah dijadwalkan akan muncul di sini.',
      action: null,
    },
    progress: {
      title: 'Belum ada data progres',
      description: 'Data progres akan muncul setelah Anda mulai menyelesaikan tugas.',
      action: null,
    },
  };
  const msg = messages[type];
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
      <h3 style={{ marginBottom: '0.5rem', color: '#334155' }}>{msg.title}</h3>
      <p style={{ marginBottom: '1rem' }}>{msg.description}</p>
      {msg.action && onAction && (
        <button onClick={onAction} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {msg.action}
        </button>
      )}
    </div>
  );
}