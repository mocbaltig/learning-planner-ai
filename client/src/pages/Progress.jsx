import {
  TrendingUp,
  Clock3,
  CheckCircle2,
  Target,
} from 'lucide-react';

export default function Progress() {
  const weeklyProgress = 75;

  const stats = [
    {
      title: 'Jam Belajar',
      value: '24 Jam',
      icon: Clock3,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/20',
    },
    {
      title: 'Task Selesai',
      value: '18',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
    },
    {
      title: 'Goals Aktif',
      value: '5',
      icon: Target,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
    },
  ];

  return (
    <div className='min-h-screen bg-[#020617] text-white p-6'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>
          Progress Belajar
        </h1>

        <p className='text-gray-400 mt-2'>
          Pantau perkembangan belajar Anda setiap minggu.
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {stats.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className='bg-[#0f172a] border border-white/10 rounded-3xl p-6'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>
                    {item.title}
                  </p>

                  <h2 className='text-3xl font-bold mt-2'>
                    {item.value}
                  </h2>
                </div>

                <div
                  className={`${item.bg} p-3 rounded-2xl`}
                >
                  <Icon className={item.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Progress */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        {/* Circular Progress */}
        <div className='bg-[#0f172a] border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center'>
          <div className='relative w-52 h-52'>
            <svg
              className='w-full h-full rotate-[-90deg]'
              viewBox='0 0 120 120'
            >
              {/* Background Circle */}
              <circle
                cx='60'
                cy='60'
                r='52'
                stroke='#1e293b'
                strokeWidth='10'
                fill='none'
              />

              {/* Progress Circle */}
              <circle
                cx='60'
                cy='60'
                r='52'
                stroke='url(#gradient)'
                strokeWidth='10'
                fill='none'
                strokeDasharray={327}
                strokeDashoffset={
                  327 - (327 * weeklyProgress) / 100
                }
                strokeLinecap='round'
              />

              <defs>
                <linearGradient
                  id='gradient'
                  x1='0%'
                  y1='0%'
                  x2='100%'
                  y2='100%'
                >
                  <stop
                    offset='0%'
                    stopColor='#8b5cf6'
                  />
                  <stop
                    offset='100%'
                    stopColor='#6366f1'
                  />
                </linearGradient>
              </defs>
            </svg>

            <div className='absolute inset-0 flex flex-col items-center justify-center'>
              <h2 className='text-5xl font-bold'>
                {weeklyProgress}%
              </h2>

              <p className='text-gray-400 mt-2'>
                Progress
              </p>
            </div>
          </div>

          <p className='text-gray-400 mt-6 text-center'>
            Konsistensi kecil setiap hari menghasilkan
            progress besar.
          </p>
        </div>

        {/* Progress Detail */}
        <div className='xl:col-span-2 bg-[#0f172a] border border-white/10 rounded-3xl p-8'>
          <div className='flex items-center gap-3 mb-8'>
            <div className='bg-indigo-500/20 p-3 rounded-2xl'>
              <TrendingUp className='text-indigo-400' />
            </div>

            <div>
              <h2 className='text-2xl font-bold'>
                Statistik Minggu Ini
              </h2>

              <p className='text-gray-400'>
                Ringkasan aktivitas belajar Anda
              </p>
            </div>
          </div>

          <div className='space-y-6'>
            {/* Item */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-gray-300'>
                  React Frontend
                </span>

                <span className='font-semibold'>
                  85%
                </span>
              </div>

              <div className='w-full h-3 bg-[#111827] rounded-full overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full'
                  style={{ width: '85%' }}
                />
              </div>
            </div>

            {/* Item */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-gray-300'>
                  Backend Express
                </span>

                <span className='font-semibold'>
                  70%
                </span>
              </div>

              <div className='w-full h-3 bg-[#111827] rounded-full overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full'
                  style={{ width: '70%' }}
                />
              </div>
            </div>

            {/* Item */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-gray-300'>
                  PostgreSQL Database
                </span>

                <span className='font-semibold'>
                  55%
                </span>
              </div>

              <div className='w-full h-3 bg-[#111827] rounded-full overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full'
                  style={{ width: '55%' }}
                />
              </div>
            </div>

            {/* Item */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-gray-300'>
                  Docker & Deployment
                </span>

                <span className='font-semibold'>
                  40%
                </span>
              </div>

              <div className='w-full h-3 bg-[#111827] rounded-full overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full'
                  style={{ width: '40%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}