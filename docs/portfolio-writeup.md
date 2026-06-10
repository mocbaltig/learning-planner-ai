# Portfolio Write-up — Learning Planner AI

> **Format**: Problem → Approach → Impact  
> **Konteks**: Capstone Project — Dicoding Bootcamp  
> **Stack**: Node.js · Express · PostgreSQL · React · Google Gemini 2.5 Flash  
> **Timeline**: Cycle 1 (fondasi & AI engine) + Cycle 2 (calendar, reschedule, progress tracking)

---

## Problem

### Siapa yang Mengalami Masalah?

**Persona**: Peserta bootcamp Dicoding yang sedang menjalani program intensif (web development, data science, atau cloud). Mereka memiliki tujuan belajar yang jelas — misalnya *"menguasai React dalam 4 minggu"* — tetapi secara konsisten gagal menyelesaikan rencana belajar mingguan yang mereka buat sendiri.

### Akar Masalah

Berdasarkan observasi selama pengembangan, ada **tiga penyebab struktural** yang saling memperburuk:

**1. Tujuan terlalu abstrak, tidak bisa langsung dieksekusi**  
Goal seperti *"pelajari React"* tidak memberikan sinyal konkret: belajar apa dulu? berapa lama per sesi? di slot waktu mana? Tanpa breakdown yang spesifik, peserta cenderung menunda karena tidak tahu harus memulai dari mana.

**2. Rencana tidak mempertimbangkan kapasitas nyata**  
Peserta membuat jadwal di awal minggu tanpa memperhitungkan kegiatan yang sudah ada — meeting, tugas lain, atau komitmen harian. Hasilnya: jadwal terlalu padat, tidak realistis untuk dijalankan, dan akhirnya ditinggalkan sebelum minggu selesai.

**3. Tidak ada mekanisme recovery saat jadwal meleset**  
Ketika satu sesi terlewat — dan ini pasti terjadi — tidak ada sistem yang membantu pengguna menyesuaikan. Peserta biasanya memilih menyerah pada rencana tersebut daripada mencari cara menjadwalkan ulang secara realistis.

### Akibatnya

Tingkat penyelesaian rencana belajar mingguan rendah — **bukan karena peserta tidak termotivasi**, tetapi karena sistem perencanaannya tidak cukup membantu mereka untuk memulai dan bangkit kembali ketika tertinggal.

---

## Approach

### Solusi Inti: AI-Powered Learning Planner dengan Human-in-the-Loop

Alih-alih meminta peserta merencanakan jadwal dari nol, sistem ini membalik alurnya: **AI yang menghasilkan rancangan awal, manusia yang memutuskan**.

#### Cara Kerja (Alur Utama)

```
1. User membuat Learning Goal
   └─ Judul goal + target jam per minggu + preferensi slot waktu

2. User meminta AI Suggestion
   └─ POST /api/ai/plan/suggest
      ├─ Server mengambil konteks dari DB: goal, profil, task existing
      ├─ Konteks dikirim ke Gemini 2.5 Flash (tanpa PII)
      ├─ Output divalidasi Zod schema → jika gagal, 1x retry
      └─ Saran dikembalikan dalam format JSON terstruktur

3. User memutuskan: Accept atau Reject
   └─ Jika Accept → tasks tersimpan, terjadwal di kalender mingguan
   └─ Jika Reject → tidak ada perubahan, user bisa minta saran baru

4. Jika ada task yang terlewat (overdue):
   └─ POST /api/ai/plan/reschedule
      ├─ User memilih task mana yang ingin dijadwalkan ulang
      ├─ AI diberi occupied_slots + conflict_warning eksplisit
      └─ AI menghasilkan jadwal baru yang menghindari konflik
```

#### Arsitektur Teknis

```
Client (React 18 + Vite)               Server (Node.js + Express)
┌─────────────────────┐               ┌────────────────────────────┐
│ Dashboard           │               │ /api/auth (JWT)            │
│ Goals + GoalDetail  │──── REST ────▶│ /api/goals, /api/tasks     │
│ Weekly Calendar     │               │ /api/ai (Gemini 2.5 Flash) │
│ Progress (trend)    │               │ /api/progress              │
│ AI Suggestion Panel │               └──────────┬─────────────────┘
│ AI Reschedule Panel │                          │
└─────────────────────┘                          ▼
                                       PostgreSQL 16 (Docker)
                                       ┌─────────────────────┐
                                       │ users, profiles      │
                                       │ goals, tasks         │
                                       │ ai_recommendations   │
                                       │ progress_snapshots   │
                                       └─────────────────────┘
```

---

### Keputusan Teknis & Trade-off

Setiap keputusan teknis berikut dibuat secara eksplisit, didokumentasikan dalam ADR, dan dipilih berdasarkan pertimbangan trade-off yang konkret.

#### 1. LLM Provider: Google Gemini 2.5 Flash

| | |
|---|---|
| **Dipilih** | Gemini 2.5 Flash via `@google/generative-ai` SDK |
| **Alternatif ditolak** | GPT-4o-mini (berbayar ~$0.15/1M token), Claude Haiku (tidak ada free tier), Groq/Llama (rate limit sangat ketat) |
| **Alasan** | Zero cost via Google AI Studio (1.500 req/hari gratis), context window 1 juta token, instruction-following capability yang kuat untuk output JSON terstruktur |
| **Trade-off diterima** | Vendor lock-in ke `@google/generative-ai`. Migrasi ke provider lain memerlukan refactor `llm.js`. Tidak ada fallback provider jika Gemini API down. |

#### 2. Output Validation: Zod Schema + Retry-Once

| | |
|---|---|
| **Dipilih** | Validasi ketat dengan Zod schema (`aiSuggestionPayloadSchema`), maksimal 1x retry jika output tidak valid |
| **Alternatif ditolak** | Accept-all tanpa validasi; retry tidak terbatas |
| **Alasan** | LLM tidak selalu menghasilkan JSON yang valid. Validasi di server mencegah data corrupt masuk ke database. Satu retry cukup untuk mengatasi fluktuasi tanpa menambah latency berlebih. |
| **Trade-off diterima** | Jika LLM gagal 2x berturut-turut, request dikembalikan sebagai error 422. User harus coba lagi. Ini jarang terjadi tapi mungkin. |

#### 3. State Management: Local State + Custom Hooks

| | |
|---|---|
| **Dipilih** | Local state + custom hook (`useDashboardData`) — tanpa library eksternal |
| **Alternatif ditolak** | React Context, Zustand, Redux |
| **Alasan** | Semua halaman berada di rute yang berbeda dan tidak pernah aktif bersamaan dalam satu DOM. Tidak ada state yang perlu dibaca oleh dua komponen sibling secara bersamaan. Menambahkan Zustand/Context hanya menambah dependency dan kompleksitas tanpa nilai tambah nyata. |
| **Trade-off diterima** | Tidak ada cache antar navigasi — setiap kali user kembali ke Dashboard, data di-fetch ulang dari server. Ini disengaja: data task selalu fresh, tidak pernah stale. |

#### 4. Reschedule Conflict Strategy: LLM-native Avoidance

| | |
|---|---|
| **Dipilih** | Kirim `occupied_slots` + `conflict_warning` eksplisit ke Gemini dalam satu prompt — LLM bertanggung jawab menghindari konflik sejak percobaan pertama |
| **Alternatif ditolak** | Server-side post-validation: validasi konflik di controller setelah AI return, lalu retry dengan instruksi tambahan (maks. 2x) |
| **Alasan** | Gemini 2.5 Flash terbukti mampu mengikuti instruksi eksplisit. Setiap retry menambah 2-5 detik latency. Dengan LLM-native avoidance, endpoint reschedule selalu 1 API call, respons konsisten. |
| **Trade-off diterima** | Konflik slot masih mungkin terjadi jika AI mengabaikan instruksi. User harus memperbaiki manual via `PATCH /api/tasks/:id`. Tidak ada audit trail konflik di server. |

#### 5. Progress Recalculation: Eager per Mutasi Task

| | |
|---|---|
| **Dipilih** | `recalculateProgress()` dipanggil sinkron di setiap titik mutasi task (create, edit, status change, reschedule) |
| **Alternatif ditolak** | Lazy recalculation — dihitung saat request `GET /progress` atau via cron job harian |
| **Alasan** | `remaining_capacity` (kapasitas sisa minggu ini) digunakan sebagai input konteks AI saat reschedule. Data stale bisa menyebabkan AI over-scheduling atau under-scheduling. Eager recalculation memastikan angka ini selalu akurat. Tidak perlu infrastruktur job scheduler (Redis Queue, Bull). |
| **Trade-off diterima** | Setiap mutasi task mendapat overhead ~5-15ms (2 SELECT + 1 UPSERT). Untuk MVP dengan <50 concurrent users, overhead ini tidak terasa. |

#### 6. Privacy by Default

| | |
|---|---|
| **Dipilih** | Context yang dikirim ke Gemini tidak mengandung email, nama, atau user ID — hanya data belajar (goal title, task list, jam preferensi) |
| **Alternatif ditolak** | Kirim profil lengkap termasuk PII untuk personalisasi lebih dalam |
| **Alasan** | Kepatuhan terhadap prinsip data minimization. Gemini tidak memerlukan identitas user untuk menghasilkan jadwal yang relevan. Diterapkan sebagai default, bukan opsi. |

---

### Fitur yang Dibangun

| Fitur | Endpoint / Komponen | Deskripsi |
|---|---|---|
| Goal Management | `POST/GET/PATCH/DELETE /api/goals` | CRUD learning goal dengan target jam/minggu |
| AI Plan Suggestion | `POST /api/ai/plan/suggest` + `AISuggestionPanel.jsx` | Gemini menghasilkan 3-5 task mingguan berbasis konteks nyata |
| Weekly Calendar | `GET /api/tasks?week_start=` + `WeeklyCalendar.jsx` | Grid 7 hari × 3 slot, navigasi antar minggu |
| Manual Reschedule | `PATCH /api/tasks/:id` + `RescheduleForm` (GoalDetail) | User mengubah tanggal/slot task secara manual |
| AI Reschedule | `POST /api/ai/plan/reschedule` + `AIReschedulePanel.jsx` | AI menjadwalkan ulang task overdue yang dipilih user |
| Progress Tracking | `GET /api/progress/weekly` + `GET /api/progress/trend` | Completion rate, jam selesai, tren historis |
| Token Usage Audit | `GET /api/ai/token-usage` | Monitoring konsumsi token per 100 rekomendasi terakhir |
| Human-in-the-Loop | `PATCH /api/ai/recommendations/:id` | User accept/reject saran AI sebelum task dibuat |

---

## Impact

### Metrik Target (Pre-Launch MVP)

Karena aplikasi belum diluncurkan ke pengguna nyata, metrik berikut adalah **target kuantitatif** yang dapat diukur segera setelah go-live menggunakan data dari tabel `ai_recommendations` dan request log.

| Metrik | Target | Cara Mengukur |
|---|---|---|
| **AI Acceptance Rate** | ≥ 50% saran diterima user | Rasio `status = 'accepted'` vs total di tabel `ai_recommendations` |
| **LLM Output Validity Rate** | ≥ 90% response lolos validasi Zod tanpa retry | Log `ai_suggest_retry` vs total request ke `POST /api/ai/plan/suggest` |
| **Endpoint Latency (AI Suggest)** | Median < 5 detik | Request log di Pino + endpoint `/metrics` (prom-client histogram) |
| **Reschedule Conflict Rate** | < 10% jadwal hasil reschedule menghasilkan konflik | Deteksi overlap di frontend `WeeklyCalendar.jsx` |
| **Task Completion Rate** | ≥ 60% task yang dijadwalkan AI diselesaikan | Rasio `status = 'done'` vs `status = 'planned'` per minggu |

### Dampak Teknis yang Sudah Terukur (Development)

| Aspek | Hasil |
|---|---|
| **API coverage** | 22 endpoint aktif, 100% terproteksi JWT atau publik sesuai kebutuhan |
| **LLM output validation** | Zod schema menolak malformed JSON sebelum menyentuh database |
| **Mock mode** | `LLM_PROVIDER=mock` memungkinkan development dan testing penuh tanpa API key |
| **Audit trail** | Setiap output LLM tersimpan di `ai_recommendations` terlepas dari keputusan user |
| **Monitoring** | Endpoint `/metrics` compatible dengan Prometheus, `/health` untuk uptime check |

### Nilai yang Diberikan ke Pengguna

**Sebelum aplikasi ini ada:**
- Peserta membuat jadwal manual di spreadsheet atau notes — tidak adaptif, tidak ada konteks kapasitas
- Ketika satu sesi terlewat, tidak ada alat untuk recovery yang mudah
- Tidak ada visibilitas tren progres dari minggu ke minggu

**Setelah aplikasi ini:**
- AI memberikan **titik awal konkret** — tidak perlu mulai dari blank slate
- Rencana yang dihasilkan sudah mempertimbangkan **kapasitas nyata** minggu tersebut (slot yang sudah terisi tidak akan di-schedule ulang)
- `AIReschedulePanel` memberikan **jalur recovery** yang terstruktur: user tinggal memilih task mana yang ingin dijadwalkan ulang, AI mengurus sisanya
- Progress dashboard memberikan **visibilitas historis** — peserta bisa melihat tren completion rate mereka dari minggu ke minggu

### Pelajaran & Keputusan yang Akan Diubah

| Hal yang Berjalan Baik | Hal yang Akan Diubah Jika Ada Waktu |
|---|---|
| Zod validation mencegah beberapa kali data corrupt LLM masuk DB | Tambahkan unique constraint `(planned_date, planned_slot)` di DB untuk enforcement di level database |
| Eager recalculation menjaga `remaining_capacity` selalu akurat | Jika user scale bertambah, migrasi ke async recalculation (fire-and-forget) |
| LLM-native conflict avoidance mengurangi latency reschedule | Tambahkan client-side conflict detection di `WeeklyCalendar.jsx` sebagai safety net |
| Human-in-the-loop memberikan kepercayaan user ke saran AI | Tambahkan fitur "edit saran sebelum accept" — saat ini hanya accept/reject binary |

---

## Referensi Teknis

- [Architecture Decision Records](adr/INDEX.md) — Semua keputusan arsitektur dengan alasan lengkap
- [Problem Framing (Cycle 1)](problem-framing.md) — Dokumen fondasi yang menjadi dasar portfolio ini
- [Case Study One-pager](case-study.md) — Ringkasan visual satu halaman

---

*Ditulis sebagai bagian dari Dicoding Bootcamp Capstone — Cycle 2*
