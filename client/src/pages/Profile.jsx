import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Save,
  CheckCircle2,
  Clock,
  Sun,
  Sunset,
  Moon,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const DAY_LABELS = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

const SLOTS = [
  { key: 'morning', label: 'Pagi', Icon: Sun },
  { key: 'afternoon', label: 'Siang', Icon: Sunset },
  { key: 'evening', label: 'Malam', Icon: Moon },
];

const TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Australia/Sydney',
  'Pacific/Auckland',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'UTC',
];

function availabilityToMap(avail) {
  const map = {};
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      map[`${day}-${slot.key}`] = (avail?.[day] || []).includes(slot.key);
    }
  }
  return map;
}

function mapToAvailability(map) {
  const avail = {};
  for (const day of DAYS) {
    const slots = SLOTS.filter((s) => map[`${day}-${s.key}`]).map((s) => s.key);
    if (slots.length) avail[day] = slots;
  }
  return avail;
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [preferredTime, setPreferredTime] = useState('morning');
  const [weeklyTargetHours, setWeeklyTargetHours] = useState(5);
  const [availabilityMap, setAvailabilityMap] = useState({});

  function fetchProfile() {
    setLoading(true);
    setLoadError(null);
    api
      .get('/auth/me')
      .then((data) => {
        setTimezone(data.timezone || 'Asia/Jakarta');
        setPreferredTime(data.preferred_time || 'morning');
        setWeeklyTargetHours(Number(data.weekly_target_hours) || 5);
        setAvailabilityMap(availabilityToMap(data.availability || {}));
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(fetchProfile, []);

  function toggleAvailability(day, slot) {
    setAvailabilityMap((prev) => ({
      ...prev,
      [`${day}-${slot}`]: !prev[`${day}-${slot}`],
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setSuccess(false);
    try {
      const body = {
        timezone,
        preferred_time: preferredTime,
        weekly_target_hours: weeklyTargetHours,
        availability: mapToAvailability(availabilityMap),
      };
      await api.patch('/auth/me', body);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-[#020617] text-white p-6'>
        <LoadingState count={2} message='Memuat profil...' />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className='min-h-screen bg-[#020617] text-white p-6'>
        <ErrorState message={loadError} onRetry={fetchProfile} />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#020617] text-white p-6'>
      <div className='max-w-2xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-2xl font-bold'>Profil</h1>
          <p className='text-slate-400 text-sm mt-1'>
            Atur preferensi jadwal belajar kamu
          </p>
        </div>

        {formError && (
          <div
            className='mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm'
            role='alert'
          >
            {formError}
          </div>
        )}

        {success && (
          <div className='mb-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm'>
            <CheckCircle2 size={16} />
            Profil berhasil diperbarui
          </div>
        )}

        <form onSubmit={handleSave} className='space-y-8'>
          <section className='bg-[#0f172a] border border-white/10 rounded-2xl p-6 space-y-6'>
            <h2 className='text-lg font-semibold flex items-center gap-2'>
              <Clock size={18} className='text-indigo-400' />
              Jadwal Umum
            </h2>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-slate-300 mb-1.5'>
                  Zona Waktu
                </label>
                <div className='relative'>
                  <MapPin
                    size={14}
                    className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-500'
                  />
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className='w-full bg-[#1e293b] border border-white/10 rounded-xl px-9 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 appearance-none'
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-slate-300 mb-1.5'>
                  Waktu Belajar Favorit
                </label>
                <div className='relative'>
                  {preferredTime === 'morning' && (
                    <Sun
                      size={14}
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-amber-400'
                    />
                  )}
                  {preferredTime === 'afternoon' && (
                    <Sunset
                      size={14}
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-orange-400'
                    />
                  )}
                  {preferredTime === 'evening' && (
                    <Moon
                      size={14}
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400'
                    />
                  )}
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className='w-full bg-[#1e293b] border border-white/10 rounded-xl px-9 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 appearance-none'
                  >
                    <option value='morning'>Pagi (06:00 - 12:00)</option>
                    <option value='afternoon'>Siang (12:00 - 18:00)</option>
                    <option value='evening'>Malam (18:00 - 22:00)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-300 mb-1.5'>
                Target Jam Belajar Mingguan
              </label>
              <input
                type='number'
                min={1}
                max={168}
                step={0.5}
                value={weeklyTargetHours}
                onChange={(e) => setWeeklyTargetHours(Number(e.target.value))}
                className='w-full sm:w-48 bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60'
              />
              <p className='text-xs text-slate-500 mt-1.5'>
                Antara 1 - 168 jam per minggu
              </p>
            </div>
          </section>

          <section className='bg-[#0f172a] border border-white/10 rounded-2xl p-6 space-y-4'>
            <h2 className='text-lg font-semibold flex items-center gap-2'>
              <CalendarDays size={18} className='text-indigo-400' />
              Ketersediaan Mingguan
            </h2>
            <p className='text-sm text-slate-400'>
              Tandai slot waktu yang tersedia untuk belajar. Digunakan AI untuk
              menyusun jadwal.
            </p>

            {/* Header */}
            <div className='grid grid-cols-[100px_repeat(3,1fr)] gap-1.5'>
              <div />
              {SLOTS.map((slot) => (
                <div
                  key={slot.key}
                  className='text-center text-xs font-medium text-slate-400 py-2'
                >
                  <slot.Icon size={14} className='inline mr-1' />
                  {slot.label}
                </div>
              ))}

              {/* Rows */}
              {DAYS.map((day, i) => (
                <div key={day} className='contents'>
                  <div className='text-sm text-slate-300 py-2.5 px-2 font-medium'>
                    {DAY_LABELS[i]}
                  </div>
                  {SLOTS.map((slot) => {
                    const key = `${day}-${slot.key}`;
                    const active = availabilityMap[key];
                    return (
                      <button
                        key={key}
                        type='button'
                        onClick={() => toggleAvailability(day, slot.key)}
                        className={`rounded-xl border py-3 text-xs font-medium transition-all ${
                          active
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                            : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                        }`}
                      >
                        {active ? 'Tersedia' : '—'}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={saving}
              className='flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-50'
            >
              <Save size={16} />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
