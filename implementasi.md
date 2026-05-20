# Rencana Implementasi Peningkatan Coverage dan Test Cases

Dokumen ini menjelaskan rencana tindakan untuk meningkatkan test coverage backend dan memenuhi feedback dari reviewer.

---

## 1. Analisis Status Saat Ini & Gap Coverage

| Berkas | Status Saat Ini | Masalah / Gap | Target Solusi |
| :--- | :--- | :--- | :--- |
| **`rateLimiter.js`** | 0% (sebelumnya) / 100% (saat ini) | Rate limiter aktif di development tetapi di-bypass secara otomatis di environment `test`. Jika dijalankan dengan `NODE_ENV=test`, test case rate limiter di `ai.test.js` berjalan dan coverage naik ke 100%. | Memastikan seluruh pipeline pengujian dijalankan dengan `NODE_ENV=test`. |
| **`progress.js`** | 0% | Berkas routing (`src/routes/progress.js`) belum aktif di `app.js` (Cycle 2) dan belum dipanggil oleh tes apa pun, sehingga tidak memiliki coverage. | Membuat berkas pengujian `tests/progress.test.js` untuk memuat router ini secara mandiri, sehingga coverage naik ke 100%. |
| **`invariant-error.js`** | 50% | Kelas error kustom ini belum pernah diinstansiasi dalam test suite apa pun. | Membuat unit test khusus `tests/exceptions.test.js` yang menguji semua kelas exceptions di `src/exceptions/`. |
| **`ai.js` (Controller)** | 87.23% | Terdapat beberapa branch penanganan error (error handling paths) yang belum teruji (misalnya: profil tidak ditemukan, error database, kegagalan total LLM, dll.). | Menambahkan test cases baru di `tests/ai.test.js` untuk mencakup skenario-skenario error tersebut. |

---

## 2. Rencana Penambahan Test Cases Baru

### A. Skenario Kegagalan & Timeout AI
Menguji ketahanan sistem saat terjadi timeout atau gangguan koneksi pada API Gemini (LLM).
* **Metode**: Melakukan mocking pada `callLLM` agar menghasilkan penolakan promise (`mockRejectedValue`) berupa error timeout.
* **Assert**: Request ke `POST /api/ai/plan/suggest` harus mengembalikan status **500 (Internal Server Error)** dan pesan error `"Terjadi kesalahan internal"`.

### B. Validasi & Penanganan Database Constraint Violations (Invalid Recommendation IDs)
Menguji respons endpoint saat menerima format ID rekomendasi yang salah, yang memicu error casting pada level PostgreSQL database.
* **Metode**: Melakukan request `PATCH /api/ai/recommendations/:id` menggunakan format ID non-UUID (misalnya: `/api/ai/recommendations/bukan-uuid-valid`).
* **Assert**: Query database akan gagal melakukan casting string ke UUID dan menghasilkan database error. Endpoint harus mengembalikan status **500 (Internal Server Error)** dan error `"Terjadi kesalahan internal"`.

### C. Menutup Gap Skenario pada AI Controller (`src/controller/ai.js`)
1. **User Profile Tidak Ditemukan (Line 19)**:
   * **Skenario**: Melakukan request pembuatan saran AI untuk user yang tidak memiliki profil data terdaftar di tabel `profiles`.
   * **Assert**: Mengembalikan status **404 (Not Found)** dengan pesan `"Profile tidak ditemukan"`.
2. **User Belum Memiliki Rekomendasi Terakhir (Line 74)**:
   * **Skenario**: Melakukan request `PATCH /api/ai/recommendations/latest` untuk user baru yang belum pernah men-generate saran AI apa pun sebelumnya.
   * **Assert**: Mengembalikan status **404 (Not Found)** dengan pesan `"AI recommendations tidak ditemukan"`.

---

## 3. Rencana Pengujian Kelas Exception (`src/exceptions/`)
Untuk memastikan 100% coverage pada seluruh kelas exceptions, dibuat `tests/exceptions.test.js` yang akan menginstansiasi dan menguji properti masing-masing error:
* `ClientError`
* `InvariantError` (menaikkan dari 50% ke 100%)
* `NotFoundError`
* `UnauthorizedError`
* `ConflictError`
* `UnprocessableEntityError` (menaikkan dari 50% ke 100%)

---

## 4. Alur Eksekusi Pengujian
Seluruh pengujian harus dijalankan di dalam container Docker server dengan memastikan variable `NODE_ENV=test` terpasang secara eksplisit agar konfigurasi berjalan dengan benar:

```bash
docker compose exec -T -e NODE_ENV=test server npm run test:coverage
```

---

## 5. Implementasi `week_start` Picker pada Halaman Goal

### Latar Belakang

Saat ini `GoalDetail.jsx` memanggil endpoint tasks dengan hanya menyertakan `goal_id`:

```
GET /tasks?goal_id=${id}
```

Endpoint tersebut perlu diubah agar juga menyertakan `week_start` (format `YYYY-MM-DD`) supaya tasks yang ditampilkan hanya milik minggu yang dipilih user, bukan seluruh tasks dari goal tersebut:

```
GET /tasks?goal_id=${id}&week_start=${weekStart}
```

### Perubahan yang Diperlukan

#### A. `Goals.jsx` — Tambah Input `week_start` pada Form Buat Goal

Saat ini form hanya memiliki satu field `title`. Perlu ditambahkan field pemilih **minggu mulai** (`week_start`) dengan ketentuan:

| Aspek | Detail |
|---|---|
| **Tipe input** | `<input type="date">` (bukan `<input type="week">` agar format output `YYYY-MM-DD` konsisten) |
| **Default value** | Senin minggu ini (`getThisMonday()`) — sudah ada helper di `GoalDetail.jsx`, perlu dipindah / di-share |
| **Validasi** | Tanggal yang dipilih harus merupakan hari **Senin** (bisa divalidasi client-side: `new Date(value).getDay() === 1`). Jika bukan Senin, otomatis snap ke Senin terdekat. |
| **Dikirim ke backend** | Field `week_start` dikirim bersama `title` saat `POST /goals` **atau** disimpan di state lokal dan diteruskan ke `GoalDetail` via navigation state / query param |
| **Label** | "Mulai minggu" dengan hint format contoh `2026-05-19` |

**Catatan desain**: `week_start` bukan milik entitas `goal`, melainkan konteks *tampilan* untuk minggu mana tasks dimuat dan AI diminta bersaran. Oleh karena itu pendekatan terbaik adalah meneruskannya sebagai **query param** saat navigasi ke `GoalDetail`:

```js
navigate(`/goals/${newGoal.id}?week_start=${weekStart}`);
```

#### B. `GoalDetail.jsx` — Baca `week_start` dari URL & Ubah Query GET /tasks

1. **Baca `week_start` dari URL search params** menggunakan hook `useSearchParams` (React Router v6):

   ```js
   const [searchParams] = useSearchParams();
   const weekStart = searchParams.get('week_start') ?? getThisMonday();
   ```

2. **Ubah query GET /tasks** dari:

   ```js
   api.get(`/tasks?goal_id=${id}`)
   ```

   Menjadi:

   ```js
   api.get(`/tasks?goal_id=${id}&week_start=${weekStart}`)
   ```

3. **Teruskan `weekStart` ke `AISuggestionPanel`** — sudah dilakukan saat ini, hanya nilai `weekStart`-nya yang berubah dari hasil `getThisMonday()` hardcoded menjadi dari URL param.

4. **Tampilkan `weekStart` yang aktif** di header Goal (sudah ada badge "Minggu …", tinggal nilai nya yang disesuaikan).

#### C. Helper `getThisMonday()` — Refactor ke File Terpisah

Fungsi `getThisMonday()` saat ini diduplikasi di `GoalDetail.jsx` dan `AISuggestionPanel.jsx`. Setelah `Goals.jsx` juga membutuhkannya, refactor ke:

```
client/src/utils/dateUtils.js
```

```js
// src/utils/dateUtils.js
export function getThisMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/**
 * Snap tanggal mana pun ke Senin di minggu yang sama.
 * @param {string} dateStr - format YYYY-MM-DD
 * @returns {string} - Senin minggu tersebut, format YYYY-MM-DD
 */
export function snapToMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
```

### Alur Data Lengkap Setelah Implementasi

```
Goals.jsx
  ├─ User memilih tanggal (input type="date")
  ├─ snapToMonday() → weekStart string "YYYY-MM-DD"
  └─ navigate(`/goals/${id}?week_start=${weekStart}`)
          │
          ▼
GoalDetail.jsx
  ├─ useSearchParams() → weekStart
  ├─ GET /tasks?goal_id=${id}&week_start=${weekStart}  ← PERUBAHAN UTAMA
  └─ <AISuggestionPanel weekStart={weekStart} … />
          │
          ▼
AISuggestionPanel.jsx
  └─ POST /ai/plan/suggest { goal_id, week_start }     ← sudah ada
```

### File yang Diubah

| File | Jenis Perubahan |
|---|---|
| `client/src/utils/dateUtils.js` | **Baru** — ekstrak `getThisMonday` dan tambah `snapToMonday` |
| `client/src/pages/Goals.jsx` | **Ubah** — tambah input `week_start` + validasi snap to Monday |
| `client/src/pages/GoalDetail.jsx` | **Ubah** — baca `week_start` dari `useSearchParams`, ubah query GET /tasks |
| `client/src/components/AISuggestionPanel.jsx` | **Ubah minor** — hapus duplikasi `getThisMonday`, import dari `dateUtils` |
