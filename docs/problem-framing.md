# Problem Framing — AI Learning Planner

> Dokumen ini ditulis sebagai bagian dari Cycle 1 capstone Dicoding Bootcamp.
> Digunakan sebagai fondasi untuk portfolio write-up (Cycle 2) dan presentasi showcase akhir program.

---

## Problem

Peserta bootcamp Dicoding sering kali memiliki **tujuan belajar yang jelas** — misalnya menguasai React dalam 4 minggu — tetapi **gagal menerjemahkannya menjadi jadwal mingguan yang realistis**. Tiga penyebab utama:

1. **Tugas terlalu besar dan tidak terpecah.** Goal seperti "pelajari React" tidak memberi sinyal kapan harus belajar apa, berapa lama, dan di slot waktu mana.
2. **Jadwal tidak mempertimbangkan kapasitas nyata.** Rencana dibuat tanpa memperhitungkan waktu yang sudah terpakai di minggu yang sama, sehingga terlalu padat dan cepat ditinggalkan.
3. **Tidak ada mekanisme adaptif.** Ketika satu sesi terlewat, tidak ada sistem yang membantu penyesuaian — peserta biasanya menyerah alih-alih menjadwal ulang.

Akibatnya, **tingkat penyelesaian rencana belajar mingguan rendah**, bukan karena peserta tidak termotivasi, tetapi karena sistem perencanaannya tidak cukup membantu mereka untuk memulai.

---

## Approach

Solusi yang dibangun adalah **AI suggestion engine** yang menghasilkan rencana belajar mingguan yang dipersonalisasi, berdasarkan konteks nyata dari database, bukan template statis.

### Cara Kerja

1. **User menentukan goal dan minggu target** via `POST /api/ai/plan/suggest`.
2. **Server mengambil konteks dari database**: goal yang dipilih, preferensi waktu belajar, target jam per minggu, dan task yang sudah ada di minggu tersebut.
3. **Konteks dikirim ke Gemini 2.5 Flash** dengan system prompt yang memerintahkan output berformat JSON terstruktur.
4. **Output divalidasi dengan Zod schema** sebelum disimpan atau dikembalikan ke client. Jika tidak valid, sistem melakukan satu kali retry.
5. **User memutuskan**: menerima atau menolak saran. AI tidak memaksakan apapun.

### Keputusan Arsitektur Kunci

| Keputusan | Alasan |
|-----------|--------|
| **Schema-first output validation (Zod)** | LLM tidak selalu menghasilkan JSON yang valid. Validasi ketat di server mencegah data rusak masuk ke database. |
| **Retry-once pattern** | Satu retry cukup untuk mengatasi fluktuasi LLM tanpa menambah latency berlebih. Kegagalan tetap dicatat di log untuk monitoring. |
| **Privacy-first context** | Context yang dikirim ke Gemini tidak mengandung email, nama, atau user ID — hanya data belajar. Diterapkan sebagai default, bukan opsi. |
| **Human-in-the-loop (HITL)** | AI hanya memberikan saran. User selalu punya kendali penuh untuk menerima atau menolak sebelum rencana diterapkan. |
| **Audit trail by default** | Setiap output LLM disimpan ke tabel `ai_recommendations` terlepas dari keputusan user, untuk analisis pola di Cycle 2. |
| **Mock mode untuk development** | `LLM_PROVIDER=mock` mengembalikan data statis tanpa memanggil Gemini API, mempercepat iterasi saat pengembangan. |

### Stack Teknis

- **Backend**: Node.js + Express
- **LLM**: Google Gemini 2.5 Flash via `@google/generative-ai`
- **Validasi**: Zod
- **Database**: PostgreSQL
- **Auth**: JWT

---

## Impact

### Target Terukur — Akhir Cycle 1

| Metrik | Target | Cara Ukur |
|--------|--------|-----------|
| **Acceptance rate saran AI** | ≥ 50% saran diterima user | Rasio `status = 'accepted'` di tabel `ai_recommendations` |
| **Valid output rate** | ≥ 90% response LLM lolos validasi Zod tanpa perlu retry | Log `ai_suggest_failed` vs total request |
| **Latency endpoint** | Median response < 5 detik | Request log di Pino / metrics di prom-client |

### Dampak yang Ingin Dicapai

- Peserta tidak perlu lagi merancang jadwal dari nol — AI menyediakan **titik awal yang konkret** untuk disetujui atau dimodifikasi.
- Rencana yang dihasilkan **mempertimbangkan kapasitas nyata** minggu tersebut (existing tasks), bukan asumsi kosong.
- Pola penerimaan/penolakan yang terekam di `ai_recommendations` menjadi **data untuk iterasi prompt** di Cycle 2 — menghasilkan saran yang semakin relevan seiring waktu.
