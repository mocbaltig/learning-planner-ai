const BASE_URL = '/api';

/* ── Simple in-memory cache for GET requests ── */
const cache = new Map();
const MAX_CACHE = 5;

export async function getCached(path, ttlMs = 30000) {
  const cached = cache.get(path);
  if (cached && Date.now() - cached.time < ttlMs) {
    return cached.data;
  }
  const data = await request(path);
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(path, { data, time: Date.now() });
  return data;
}

export function invalidateCache(path) {
  cache.delete(path);
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (res.status === 401 && !options._retry) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          return request(path, { ...options, _retry: true });
        }
      } catch {
        // refresh failed — fall through to redirect
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }

  if (!res.ok) {
    let message;
    try {
      const body = await res.json();
      message = body.error;
    } catch {
      message = res.statusText;
    }
    throw new Error(message || 'Request gagal');
  }
  if (res.status === 204) return null;
  return res.json();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── SSE streaming helper ── */

export function streamSSE(path, body, callbacks) {
  const { onTask, onSummary, onDone, onError } = callbacks;
  const token = localStorage.getItem('token');
  let aborted = false;
  let reader = null;

  (async () => {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg;
        try { const b = await res.json(); msg = b.error; } catch { msg = res.statusText; }
        onError?.({ code: 'HTTP_ERROR', message: msg || 'Request gagal' });
        return;
      }

      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = null;
      let currentData = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (aborted) { reader.cancel(); return; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);
          } else if (line === '' && currentEvent && currentData) {
            const payload = JSON.parse(currentData);
            if (currentEvent === 'task') onTask?.(payload);
            else if (currentEvent === 'summary') onSummary?.(payload);
            else if (currentEvent === 'done') onDone?.(payload);
            else if (currentEvent === 'error') onError?.(payload);
            currentEvent = null;
            currentData = '';
          }
        }
      }
    } catch (err) {
      if (!aborted) onError?.({ code: 'STREAM_ERROR', message: err.message });
    }
  })();

  return () => { aborted = true; if (reader) reader.cancel(); };
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  download: async (path, filename) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
      throw new Error('Download gagal');
    }
    downloadBlob(await res.blob(), filename);
  },
};
