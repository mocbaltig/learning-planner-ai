import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function StatCard({ title, value, subtitle, loading }) {
  return (
    <div className='rounded-xl bg-white/[0.03] border border-white/10 p-5'>
      <p className='text-sm font-medium text-slate-400'>{title}</p>
      {loading ? (
        <div className='mt-2 h-8 w-24 rounded bg-white/5 animate-pulse' />
      ) : (
        <p className='mt-1 text-2xl font-bold text-white'>{value}</p>
      )}
      {subtitle && (
        <p className='mt-1 text-xs text-slate-500'>{subtitle}</p>
      )}
    </div>
  );
}

function MetricTable({ metrics }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(metrics);

  if (entries.length === 0) return null;

  return (
    <div className='rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden'>
      <button
        onClick={() => setOpen(!open)}
        className='flex items-center justify-between w-full px-5 py-4 text-sm font-medium text-slate-300 hover:text-white transition-colors'
      >
        <span>Metrics Detail</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
        </svg>
      </button>
      {open && (
        <div className='border-t border-white/10 px-5 py-4 space-y-4'>
          {entries.map(([name, metric]) => (
            <div key={name}>
              <p className='text-xs font-mono text-indigo-400 mb-1'>{name}</p>
              <p className='text-xs text-slate-500 mb-2'>{metric.help}</p>
              {metric.values.map((v, i) => (
                <div
                  key={i}
                  className='flex items-center justify-between py-1 text-xs font-mono text-slate-400'
                >
                  <span>
                    {v.labels && Object.entries(v.labels).map(([k, l]) => `${k}=${l}`).join(' ') + ' '}
                    {v.metricName && v.metricName.replace(`${name}_`, '')}
                  </span>
                  <span className='text-white'>{typeof v.value === 'number' ? v.value.toLocaleString() : v.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Observability() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get('/metrics/summary')
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [retryKey]);

  return (
    <div className='min-h-screen bg-[#0f172a] p-4 lg:p-8'>
      <div className='max-w-5xl mx-auto space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-white'>Observability</h1>
            <p className='text-sm text-slate-400 mt-1'>
              Monitoring dan metrik sistem
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className='text-sm text-slate-400 hover:text-white transition-colors'
          >
            &larr; Kembali
          </button>
        </div>

        {error && (
          <div role='alert' className='rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-4'>
            <div className='flex items-center justify-between'>
              <p className='text-sm text-red-400'>{error}</p>
              <button
                onClick={() => setRetryKey((k) => k + 1)}
                className='text-sm font-medium text-red-400 hover:text-red-300 underline ml-4 flex-shrink-0'
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            title='Total AI Calls'
            value={data ? (data.total_ai_calls ?? 0).toLocaleString() : null}
            subtitle='Permintaan ke AI'
            loading={loading}
          />
          <StatCard
            title='Token Usage'
            value={data ? (data.token_usage ?? 0).toLocaleString() : null}
            subtitle='Token terpakai'
            loading={loading}
          />
          <StatCard
            title='Acceptance Rate'
            value={data ? `${(data.acceptance_rate * 100).toFixed(1)}%` : null}
            subtitle='Saran AI yang diterima'
            loading={loading}
          />
          <StatCard
            title='Avg Response Time'
            value={data ? `${(data.avg_response_time ?? 0).toFixed(0)}ms` : null}
            subtitle='Waktu respons rata-rata'
            loading={loading}
          />
        </div>

        {data && (
          <div className='rounded-xl bg-white/[0.03] border border-white/10 p-5'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='text-2xl'>📊</div>
              <div>
                <p className='text-sm font-medium text-white'>Acceptance Rate</p>
                <p className='text-xs text-slate-400'>Persentase saran AI yang diterima</p>
              </div>
            </div>
            <div className='w-full bg-slate-800 rounded-full h-3 overflow-hidden'>
              <div
                className='h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500'
                style={{ width: `${Math.min((data.acceptance_rate * 100), 100)}%` }}
              />
            </div>
            <p className='mt-2 text-xs text-slate-500'>
              {data.acceptance_rate > 0
                ? `${(data.acceptance_rate * 100).toFixed(1)}% dari total AI calls`
                : 'Belum ada data acceptance rate'}
            </p>
          </div>
        )}

        {data && <MetricTable metrics={data.metrics} />}
      </div>
    </div>
  );
}
