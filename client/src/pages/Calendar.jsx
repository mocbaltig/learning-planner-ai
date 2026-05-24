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

  // Fungsi untuk menentukan tingkat kepadatan dan class Tailwind-nya secara dinamis
  const getDensityMetrics = (taskCount) => {
    if (taskCount === 0) {
      return { width: 'w-0', gradient: 'from-gray-500 to-gray-400', label: 'Tidak Ada Task', textColor: 'text-gray-400' };
    } else if (taskCount === 1) {
      return { width: 'w-[35%]', gradient: 'from-green-500 to-emerald-400', label: 'Low', textColor: 'text-green-400' };
    } else if (taskCount === 2) {
      return { width: 'w-[65%]', gradient: 'from-yellow-500 to-amber-400', label: 'Medium', textColor: 'text-yellow-400' };
    } else {
      return { width: 'w-full', gradient: 'from-amber-500 to-orange-500', label: 'High', textColor: 'text-orange-400' };
    }
  };

  const density = getDensityMetrics(todayTasks.length);
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

          {/* Progress Bar Kepadatan Task */}
            <div className='mb-6 bg-[#111c3b]/50 border border-white/5 rounded-2xl p-4'>
              <div className='flex justify-between items-center text-xs mb-2'>
                <span className='text-gray-400 font-medium'>Kepadatan Jadwal</span>
                <span className={`font-bold ${density.textColor}`}>
                  {density.label} ({todayTasks.length} Task)
                </span>
              </div>
              
              {/* Track Bar */}
              <div className='w-full h-2.5 bg-[#1e293b] rounded-full overflow-hidden'>
                {/* Active Progress Bar dengan Gradasi Dinamis */}
                <div className={`h-full bg-gradient-to-r ${density.gradient} ${density.width} transition-all duration-500 ease-out`} />
              </div>
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
