# AI Learning Plan

> Aplikasi web yang membantu peserta bootcamp merencanakan dan menjalani belajar secara konsisten, dengan bantuan AI sebagai learning coach.

---

## Tech Stack

| Layer      | Teknologi                                         |
| ---------- | ------------------------------------------------- |
| Frontend   | React 19, Vite 6, Tailwind CSS 4, React Router v7 |
| Backend    | Express.js 4, node-pg-migrate                     |
| Database   | PostgreSQL 16                                     |
| Cache      | Redis 7                                           |
| AI         | Google Gemini API                                 |
| Monitoring | Prometheus metrics (`prom-client`), Pino logging  |
| Auth       | JWT (access + refresh token)                      |

---

## Quick Start

### Prasyarat

- **Node.js 20+** — <https://nodejs.org>
- **Docker Desktop** — pastikan sudah terinstall dan berjalan
- **Gemini API Key** — daftar di <https://aistudio.google.com/apikey>
  - Jika belum punya API key, bisa pakai mode `mock` (lihat bagian Konfigurasi)

### Setup

```bash
# 1. Clone repositori
git clone <repository-url>
cd ai-learning-plan

# 2. Setup environment variable
cp server/.env.example server/.env
# Edit server/.env — isi GEMINI_API_KEY dan ubah JWT_SECRET / JWT_REFRESH_SECRET

# 3. Jalankan database (PostgreSQL)
docker compose up db -d

# 4. Install dependencies backend
cd server && npm install

# 5. Jalankan migrasi database
npm run migrate:up

# 6. (Opsional) Isi data contoh
npm run seed

# 7. Jalankan server
npm run dev
```

Di terminal lain:

```bash
# 8. Install dependencies frontend
cd client && npm install

# 9. Jalankan frontend
npm run dev
```

### Akses

| Layanan            | URL                             |
| ------------------ | ------------------------------- |
| Frontend           | <http://localhost:5173>         |
| Backend API        | <http://localhost:3000>         |
| Health Check       | <http://localhost:3000/health>  |
| Prometheus Metrics | <http://localhost:3000/metrics> |

---

## Data Seed

Seed script membuat data contoh untuk memudahkan pengembangan dan pengujian.

```bash
# Dari direktori server/
npm run seed
```

### Data yang dibuat

| Data                   | Detail                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **User biasa**         | Email: `user_seed@mail.com` — Password: `seed1234`                                               |
| **Admin**              | Email: `admin_seed@mail.com` — Password: `admin1234`                                             |
| **Goals**              | 2 goal: "Belajar React Dasar" & "Menyelesaikan Proyek Capstone"                                  |
| **Tasks**              | ~16 task tersebar di minggu lalu, minggu ini, dan minggu depan (berbagai status: `todo`, `done`) |
| **AI Recommendations** | 4 record: suggest minggu lalu/ini/depan + reschedule                                             |
| **Progress Snapshots** | 2 minggu terakhir                                                                                |
| **Audit Logs**         | 3 entri log aktifitas                                                                            |

> Seed script aman dijalankan berulang — data lama akan dihapus sebelum membuat ulang.

---

## Konfigurasi

Semua konfigurasi backend via environment variable di `server/.env`.

| Variable             | Wajib | Default       | Deskripsi                                                                      |
| -------------------- | ----- | ------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`       | Ya    | —             | URL koneksi PostgreSQL (contoh: `postgres://user:pass@localhost:5432/planner`) |
| `JWT_SECRET`         | Ya    | —             | Secret key untuk token akses JWT (min 32 karakter)                             |
| `JWT_REFRESH_SECRET` | Ya    | —             | Secret key untuk refresh token (harus **berbeda** dari `JWT_SECRET`)           |
| `GEMINI_API_KEY`     | Lihat | —             | API key Google Gemini — wajib jika `LLM_PROVIDER=gemini`                       |
| `LLM_PROVIDER`       | Tidak | `gemini`      | Set `mock` untuk menggunakan respons AI palsu (tanpa API key)                  |
| `PORT`               | Tidak | `3000`        | Port server backend                                                            |
| `NODE_ENV`           | Tidak | `development` | Set `test` untuk menonaktifkan rate limiter                                    |

### Mode Mock (tanpa Gemini API Key)

Untuk development offline atau jika belum punya API key:

```env
LLM_PROVIDER=mock
```

Dengan mode ini, endpoint AI akan mengembalikan data palsu tanpa memanggil Gemini API.

---

## Skrip Tersedia

### Server (`server/package.json`)

| Perintah                 | Deskripsi                                    |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | Jalankan server dengan auto-reload (nodemon) |
| `npm start`              | Jalankan server untuk production             |
| `npm test`               | Jalankan semua tes (Jest)                    |
| `npm run test:coverage`  | Tes dengan laporan coverage                  |
| `npm run migrate:up`     | Jalankan migrasi database                    |
| `npm run migrate:down`   | Rollback migrasi terakhir                    |
| `npm run migrate:create` | Buat file migrasi baru                       |
| `npm run seed`           | Isi database dengan data contoh              |
| `npm run lint`           | Periksa kode dengan ESLint                   |
| `npm run lint:fix`       | Perbaiki otomatis masalah lint               |

### Client (`client/package.json`)

| Perintah          | Deskripsi                  |
| ----------------- | -------------------------- |
| `npm run dev`     | Jalankan Vite dev server   |
| `npm run build`   | Build untuk production     |
| `npm run preview` | Preview hasil build        |
| `npm run lint`    | Periksa kode dengan ESLint |

---

## API Endpoints

### Sistem

| Method | Endpoint               | Akses      | Deskripsi                      |
| ------ | ---------------------- | ---------- | ------------------------------ |
| `GET` | `/health` | Publik | Health check server |
| `GET` | `/metrics` | Publik | Metrik Prometheus (raw format) |
| `GET` | `/api/metrics/summary` | Admin | Ringkasan metrik JSON |

### Autentikasi

| Method  | Endpoint             | Akses     | Deskripsi                           |
| ------- | -------------------- | --------- | ----------------------------------- |
| `POST` | `/api/auth/register` | Publik | Daftar akun baru (rate: 5/menit) |
| `POST` | `/api/auth/login` | Publik | Login (rate: 5/menit) |
| `POST` | `/api/auth/refresh` | Publik | Perbarui token dengan refresh token |
| `GET` | `/api/auth/me` | Login | Lihat profil dan data pengguna |
| `PATCH` | `/api/auth/me` | Login | Ubah profil pengguna |

### Goals

| Method   | Endpoint         | Akses    | Deskripsi         |
| -------- | ---------------- | -------- | ----------------- |
| `POST` | `/api/goals` | Login | Buat goal baru |
| `GET` | `/api/goals` | Login | Lihat semua goal |
| `GET` | `/api/goals/:id` | Login | Lihat detail goal |
| `PATCH` | `/api/goals/:id` | Login | Ubah goal |
| `DELETE` | `/api/goals/:id` | Login | Hapus goal |

### Tasks

| Method  | Endpoint                | Akses    | Deskripsi                                   |
| ------- | ----------------------- | -------- | ------------------------------------------- |
| `POST` | `/api/tasks` | Login | Buat task baru |
| `GET` | `/api/tasks` | Login | Lihat task (query: `?week_start=&goal_id=`) |
| `PATCH` | `/api/tasks/:id/status` | Login | Ubah status task (`todo` / `done`) |
| `PATCH` | `/api/tasks/:id` | Login | Ubah detail task |

### AI Learning Coach

> Semua endpoint AI di bawah rate limiter terpisah: **20 request/menit**

| Method  | Endpoint                      | Akses    | Deskripsi                                            |
| ------- | ----------------------------- | -------- | ---------------------------------------------------- |
| `POST` | `/api/ai/plan/suggest` | Login | AI menyarankan rencana belajar mingguan |
| `POST` | `/api/ai/plan/reschedule` | Login | AI menjadwalkan ulang task yang terlewat |
| `PATCH` | `/api/ai/recommendations/:id` | Login | Ubah status rekomendasi AI (`accepted` / `rejected`) |
| `GET` | `/api/ai/token-usage` | Login | Lihat pemakaian token AI per batch |

### Progress

| Method | Endpoint               | Akses    | Deskripsi                                   |
| ------ | ---------------------- | -------- | ------------------------------------------- |
| `GET` | `/api/progress/weekly` | Login | Progress mingguan (query: `?week=YYYY-Www`) |
| `GET` | `/api/progress/trend` | Login | Tren progress |

---

## Arsitektur

### Pola Lapisan (Layered Pattern)

```
Routes → Middleware → Controller → Model / Service → Database
```

1. **Routes** — definisi endpoint, validasi input (Zod schema), pasang middleware
2. **Middleware** — cross-cutting concerns: auth JWT, admin check, rate limiter, request logging, error handler
3. **Controller** — logika bisnis tiap endpoint (validasi, panggil model/service, kirim response)
4. **Model** — akses database (query builder manual dengan `pg`)
5. **Service** — logika eksternal (LLM integration di `src/services/llm.js`)

### Middleware Stack

Urutan eksekusi middleware di `server/src/app.js`:

```
cors() → express.json() → requestLogger → Router → errorHandler
```

### Rate Limiter

| Limiter       | Scope                                   | Batas            |
| ------------- | --------------------------------------- | ---------------- |
| `authLimiter` | `/api/auth/register`, `/api/auth/login` | 5 request/menit  |
| `aiLimiter`   | Semua `/api/ai/*`                       | 20 request/menit |

### Error Handling

Error khusus ditangani oleh `errorHandler` middleware:

| Class                      | Status | Penggunaan                     |
| -------------------------- | ------ | ------------------------------ |
| `ClientError`              | 400    | Base class untuk client errors |
| `InvariantError`           | 400    | Validasi bisnis gagal          |
| `UnauthorizedError`        | 401    | Token tidak valid / kadaluarsa |
| `ForbiddenError`           | 403    | Akses ditolak (bukan admin)    |
| `NotFoundError`            | 404    | Resource tidak ditemukan       |
| `ConflictError`            | 409    | Duplikat / konflik data        |
| `UnprocessableEntityError` | 422    | Output AI tidak valid          |

### Autentikasi

- Login mengembalikan **access token** (kedaluwarsa 15 menit) + **refresh token** (kedaluwarsa 7 hari)
- Gunakan `POST /api/auth/refresh` untuk mendapatkan token pair baru
- Semua endpoint terproteksi membaca token dari header `Authorization: Bearer <token>`

---

## Troubleshooting

| Masalah                           | Solusi                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| "Cannot connect to Docker daemon" | Buka Docker Desktop, tunggu sampai statusnya running                                  |
| "role user does not exist"        | PostgreSQL lokal konflik port. Ubah port di `docker-compose.yml` dan `.env` ke `5433` |
| "address already in use"          | `kill $(lsof -ti :3000)` atau `docker compose down`                                   |
| Migrasi gagal                     | `npm run migrate:down` lalu `npm run migrate:up` ulang                                |
| Seed gagal                        | Pastikan migrasi sudah jalan dan database bisa diakses                                |

---

## Dokumentasi

- [Problem Framing](docs/problem-framing.md)
- [Architecture Decision Records](docs/adr/)

---

## Screenshots

|                                     |
| ----------------------------------- |
| ![](./.screenshot/mpv-shot0001.jpg) |
| ![](./.screenshot/mpv-shot0002.jpg) |
| ![](./.screenshot/mpv-shot0003.jpg) |
| ![](./.screenshot/mpv-shot0004.jpg) |
| ![](./.screenshot/mpv-shot0005.jpg) |
| ![](./.screenshot/mpv-shot0006.jpg) |
| ![](./.screenshot/mpv-shot0007.jpg) |
| ![](./.screenshot/mpv-shot0008.jpg) |
| ![](./.screenshot/mpv-shot0009.jpg) |

## Accessibility Audit

Tool: Lighthouse

| Metric | Score |
|---------|---------|
| Accessibility | 100 |
| Best Practices | 96 |
| SEO | 100 |

Perbaikan:
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Color contrast compliance