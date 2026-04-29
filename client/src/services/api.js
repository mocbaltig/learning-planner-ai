// TODO: Implementasikan API helper.
// Lihat modul Scaffolding — sub modul "Authentication & CRUD".

const BASE_URL = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer $token` }),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  if (!res.ok) throw new Error((await res.json()).error || 'Request gagal');
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: async (path) => request(path),
  post: async (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: async (path, body) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: async (path) => request(path, { method: 'DELETE' }),
};
