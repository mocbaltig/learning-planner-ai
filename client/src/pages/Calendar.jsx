import { useState } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Calendar() {
  const [date, setDate] = useState(new Date());

  const tasks = [
    {
      title: 'Belajar React Hooks',
      date: '2026-05-08',
      type: 'Frontend',
    },
    {
      title: 'Setup Express Routes',
      date: '2026-05-10',
      type: 'Backend',
    },
    {
      title: 'Belajar PostgreSQL',
      date: '2026-05-12',
      type: 'Database',
    },
  ];

  const selectedDate = date.toISOString().split('T')[0];

  const todayTasks = tasks.filter(
    (task) => task.date === selectedDate
  );

  return (
    <div className='min-h-screen bg-[#020617] text-white p-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>Kalender Belajar</h1>
        <p className='text-gray-400 mt-2'>
          Kelola jadwal belajar dan task harian Anda.
        </p>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        <div className='xl:col-span-2 bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-lg'>
          <ReactCalendar
            onChange={setDate}
            value={date}
            className='w-full border-none rounded-2xl overflow-hidden'
          />
        </div>

        <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-lg'>
          <h2 className='text-xl font-semibold mb-4'>
            Task Hari Ini
          </h2>

          <div className='mb-5'>
            <p className='text-sm text-gray-400'>
              Tanggal dipilih
            </p>

            <p className='text-lg font-semibold mt-1'>
              {date.toDateString()}
            </p>
          </div>

          <div className='space-y-4'>
            {todayTasks.length > 0 ? (
              todayTasks.map((task, index) => (
                <div
                  key={index}
                  className='bg-[#111c3b] border border-indigo-500/20 rounded-2xl p-4'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='font-semibold'>
                      {task.title}
                    </h3>

                    <span className='text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300'>
                      {task.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className='bg-[#111c3b] border border-dashed border-white/10 rounded-2xl p-6 text-center text-gray-400'>
                Tidak ada task pada tanggal ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
