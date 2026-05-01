import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registrasi Gagal');
      }
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='flex min-h-full flex-col justify-center px-6 py-12 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
        <img
          alt='AI Learning Plan'
          src='https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500'
          className='mx-auto h-10 w-auto'
        />
        <h2 className='mt-10 text-center text-2xl/9 font-bold tracking-tight text-white'>
          Buat akun baru
        </h2>
      </div>

      <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
        <form onSubmit={handleSubmit} className='space-y-6'>

          {error && (
            <div className='rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3'>
              <p className='text-sm text-red-400'>{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor='email'
              className='block text-sm/6 font-medium text-gray-100'
            >
              Alamat Email
            </label>
            <div className='mt-2'>
              <input
                id='email'
                name='email'
                type='email'
                required
                autoComplete='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='nama@email.com'
                className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
              />
            </div>
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm/6 font-medium text-gray-100'
            >
              Password
            </label>
            <div className='mt-2'>
              <input
                id='password'
                name='password'
                type='password'
                required
                autoComplete='new-password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Minimal 8 karakter'
                className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
              />
            </div>
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm/6 font-medium text-gray-100'
            >
              Konfirmasi Password
            </label>
            <div className='mt-2'>
              <input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                required
                autoComplete='new-password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Ulangi password Anda'
                className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
              />
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={loading}
              className='flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {loading ? 'Mendaftar...' : 'Daftar'}
            </button>
          </div>
        </form>

        <p className='mt-10 text-center text-sm/6 text-gray-400'>
          Sudah punya akun?{' '}
          <Link
            to='/login'
            className='font-semibold text-indigo-400 hover:text-indigo-300'
          >
            Masuk sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}

