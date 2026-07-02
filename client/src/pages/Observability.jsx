import { useState, useEffect } from 'react';
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

function BarChart({ data, labelKey, valueKey, color, maxValue, valueSuffix }) {
  const max = maxValue ?? Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className='space-y-1.5'>
      {data.map((item, i) => {
        const val = item[valueKey];
        const pct = (val / max) * 100;
        return (
          <div key={item[labelKey] || i} className='flex items-center gap-3'>
            <span className='text-xs text-slate-400 w-28 truncate shrink-0'>{item[labelKey]}</span>
            <div className='flex-1 bg-slate-800 rounded-full h-5 overflow-hidden'>
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className='text-xs text-white w-16 text-right shrink-0'>
              {typeof val === 'number' ? val.toLocaleString() : val}{valueSuffix ?? ''}
            </span>
          </div>
        );
      })}
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

function VerticalHistogram({ buckets, percentiles }) {
  if (!buckets || buckets.length === 0) return null;
  const maxVal = Math.max(...buckets.map((b) => b.value), 1);

  return (
    <div>
      <div className='flex items-end gap-1.5 h-48'>
        {buckets.map((bucket, i) => (
          <div key={i} className='flex-1 flex flex-col items-center justify-end h-full'>
            <span className='text-[10px] text-slate-500 mb-0.5'>{bucket.value}</span>
            <div
              className='w-full rounded-t bg-gradient-to-t from-purple-600 to-purple-400 min-h-[2px]'
              style={{ height: `${(bucket.value / maxVal) * 100}%` }}
            />
          </div>
        ))}
      </div>

      <div className='flex gap-1.5 mt-2'>
        {buckets.map((bucket, i) => (
          <div key={i} className='flex-1 text-center text-[10px] text-slate-500 truncate'>
            {bucket.label}
          </div>
        ))}
      </div>

      <div className='mt-5 space-y-1.5'>
        {percentiles.map((p) => (
          <div key={p.label} className='flex items-center gap-2'>
            <span className='text-xs text-slate-400 w-8 shrink-0'>{p.label}</span>
            <div className='flex-1 bg-slate-800 rounded-full h-2 overflow-hidden'>
              <div
                className='h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400'
                style={{ width: `${(p.value / percentiles[percentiles.length - 1].value) * 100}%` }}
              />
            </div>
            <span className='text-xs text-white w-12 text-right shrink-0'>{p.value}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getMetricValues(metrics, name) {
  const metric = metrics?.[name];
  if (!metric) return [];
  return metric.values || [];
}

function aggregateByLabel(values, label) {
  const map = {};
  for (const v of values) {
    const key = v.labels?.[label] || 'unknown';
    map[key] = (map[key] || 0) + (typeof v.value === 'number' ? v.value : 0);
  }
  return Object.entries(map)
    .map(([k, v]) => ({ label: k, value: v }))
    .sort((a, b) => b.value - a.value);
}

function calculatePercentiles(metrics) {
  const values = getMetricValues(metrics, 'http_request_duration_ms');
  const buckets = values
    .filter((v) => v.metricName?.endsWith('_bucket'))
    .filter((v) => v.labels?.le != null);

  const cumulative = {};
  for (const v of buckets) {
    const le = v.labels.le;
    cumulative[le] = (cumulative[le] || 0) + (typeof v.value === 'number' ? v.value : 0);
  }

  const sorted = Object.entries(cumulative)
    .map(([le, count]) => ({ le: le === '+Inf' ? Infinity : parseFloat(le), count }))
    .sort((a, b) => a.le - b.le);

  if (sorted.length === 0) return [];

  const total = sorted[sorted.length - 1].count;
  if (total === 0) return [];

  const percentiles = [50, 90, 95, 99];
  const labels = { 50: 'P50', 90: 'P90', 95: 'P95', 99: 'P99' };

  return percentiles.map((p) => {
    const rank = (p / 100) * total;
    let prevCum = 0;
    let prevLe = 0;

    for (const bucket of sorted) {
      if (bucket.count >= rank) {
        const frac = (rank - prevCum) / (bucket.count - prevCum);
        const value = Math.round(prevLe + (bucket.le - prevLe) * frac);
        return { label: labels[p], value };
      }
      prevCum = bucket.count;
      prevLe = bucket.le;
    }

    return { label: labels[p], value: Math.round(prevLe) };
  });
}

function getLatencyBuckets(metrics) {
  const values = getMetricValues(metrics, 'http_request_duration_ms');
  const buckets = values.filter((v) => v.metricName?.endsWith('_bucket'));
  const cumulative = {};
  for (const v of buckets) {
    const le = v.labels?.le || '+Inf';
    cumulative[le] = (cumulative[le] || 0) + (typeof v.value === 'number' ? v.value : 0);
  }

  const sorted = Object.entries(cumulative).sort((a, b) => {
    if (a[0] === '+Inf') return 1;
    if (b[0] === '+Inf') return -1;
    return parseFloat(a[0]) - parseFloat(b[0]);
  });

  const result = [];
  let prev = 0;
  for (const [le, cum] of sorted) {
    const individual = cum - prev;
    if (individual > 0) {
      const prevLe = sorted[sorted.findIndex(([k]) => k === le) - 1]?.[0];
      const rangeLabel = prevLe ? `${prevLe}–${le}ms` : `≤${le}ms`;
      result.push({ label: rangeLabel, value: individual });
    }
    prev = cum;
  }
  return result;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hasUuidSegment(path) {
  return path?.split('/').some((seg) => UUID_RE.test(seg));
}

function timeAgo(date) {
  if (!date) return '';
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}

export default function Observability() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get('/metrics/summary')
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [retryKey]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRetryKey((k) => k + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const metrics = data?.metrics;
  const httpByRoute = metrics
    ? aggregateByLabel(
        getMetricValues(metrics, 'http_requests_total').filter(
          (v) => !hasUuidSegment(v.labels?.route)
        ),
        'route'
      )
    : [];
  const aiByType = metrics
    ? aggregateByLabel(getMetricValues(metrics, 'ai_requests_total'), 'type')
    : [];
  const percentiles = metrics ? calculatePercentiles(metrics) : [];
  const latencyBuckets = metrics ? getLatencyBuckets(metrics) : [];

  return (
    <div className='min-h-screen bg-[#0f172a] p-4 lg:p-8'>
      <div className='max-w-6xl mx-auto space-y-6'>

        <div className='flex items-start justify-between flex-wrap gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20'>
              <svg className='w-5 h-5 text-indigo-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
              </svg>
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold text-white'>Observability</h1>
                <span className='text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20'>
                  Admin
                </span>
              </div>
              <p className='text-sm text-slate-400 mt-1'>
                Dashboard monitoring & metrik sistem
              </p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            {lastUpdated && !loading && (
              <p className='text-xs text-slate-500'>Updated {timeAgo(lastUpdated)}</p>
            )}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                autoRefresh
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
              </svg>
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div role='alert' className='rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-4'>
            <div className='flex items-center justify-between'>
              <p className='text-sm text-red-400'>{error}</p>
              <button
                onClick={() => setRetryKey((k) => k + 1)}
                className='text-sm font-medium text-red-400 hover:text-red-300 underline ml-4 shrink-0'
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
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='rounded-xl bg-white/[0.03] border border-white/10 p-5'>
              <div className='flex items-center gap-2 mb-4'>
                <div className='w-2 h-2 rounded-full bg-emerald-400' />
                <p className='text-sm font-medium text-white'>HTTP Requests by Route</p>
              </div>
              {httpByRoute.length > 0 ? (
                <BarChart
                  data={httpByRoute}
                  labelKey='label'
                  valueKey='value'
                  color='bg-gradient-to-r from-emerald-500 to-emerald-400'
                />
              ) : (
                <p className='text-xs text-slate-500'>No data available</p>
              )}
            </div>

            <div className='rounded-xl bg-white/[0.03] border border-white/10 p-5'>
              <div className='flex items-center gap-2 mb-4'>
                <div className='w-2 h-2 rounded-full bg-indigo-400' />
                <p className='text-sm font-medium text-white'>AI Requests by Type</p>
              </div>
              {aiByType.length > 0 ? (
                <BarChart
                  data={aiByType}
                  labelKey='label'
                  valueKey='value'
                  color='bg-gradient-to-r from-indigo-500 to-indigo-400'
                />
              ) : (
                <p className='text-xs text-slate-500'>No data available</p>
              )}
            </div>
          </div>
        )}

        {data && latencyBuckets.length > 0 && percentiles.length > 0 && (
          <div className='rounded-xl bg-white/[0.03] border border-white/10 p-5'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-2 h-2 rounded-full bg-purple-400' />
              <p className='text-sm font-medium text-white'>Response Time Distribution</p>
            </div>
            <VerticalHistogram buckets={latencyBuckets} percentiles={percentiles} />
          </div>
        )}

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
