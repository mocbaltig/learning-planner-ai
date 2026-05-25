# ADR-006: Rekalkulasi Progres Secara Eager (on setiap mutasi task)

## Status
Accepted

## Konteks

Fitur progress tracking menyimpan snapshot mingguan (`progress_snapshots`) yang mencakup `planned_hours`, `completed_hours`, dan `completion_rate`. Snapshot ini digunakan oleh:
- `GET /api/progress/weekly` — menampilkan progres satu minggu
- `GET /api/progress/trend` — grafik tren historis
- `POST /api/ai/plan/reschedule` — menghitung `remaining_capacity` untuk konteks AI

Setiap kali data task berubah (dibuat, diedit, status diubah, atau dijadwalkan ulang), snapshot progres harus diperbarui. Dua pendekatan dievaluasi:

| Pendekatan | Waktu eksekusi | Beban DB | Akurasi data |
|---|---|---|---|
| **Eager recalculation** | Setiap mutasi task (createTask, editTask, editStatus, reschedule) | Tinggi (1 query INSERT ... ON CONFLICT per mutasi) | Real-time |
| **Lazy/scheduled recalculation** | Cron job harian (end-of-day) atau dihitung saat request GET /progress | Rendah (1 query batch per hari) | Stale (bisa beda sampai +24 jam) |

Faktor yang mempengaruhi keputusan:
- Proyek ini adalah MVP capstone, bukan produk enterprise
- Jumlah user diperkirakan kecil (< 50 user concurrent)
- Biaya query `recalculateProgress` adalah 2 query SELECT + 1 query INSERT ... ON CONFLICT, dengan full-scan tasks per user per minggu via index `(goal_id, planned_date, status)`
- Akurasi data progres penting untuk konteks AI reschedule (`remaining_capacity`)
- Tidak ada infrastruktur job scheduler (Redis Queue, Bull, cron) yang terpasang

## Keputusan

Menggunakan **eager recalculation**: `recalculateProgress` dipanggil secara sinkronus di setiap titik mutasi data task.

Titik rekalkulasi:

| Mutasi | File | Trigger |
|---|---|---|
| Task dibuat | `src/controllers/tasks.js — createTask` | `task.planned_date` |
| Task diupdate | `src/controllers/tasks.js — editTask` | `task.planned_date` (lama) + `req.body.planned_date` (baru jika berbeda) |
| Status task berubah | `src/controllers/tasks.js — editStatus` | `task.planned_date` |
| Reschedule oleh AI | `src/controllers/ai.js — reschedule` | `weekStart` (current week, sebelum hitung `remaining_capacity`) |

## Alasan

1. **Akurasi data real-time**: `remaining_capacity` di endpoint reschedule harus akurat karena直接影响 keputusan AI. Data stale bisa menyebabkan AI over-scheduling atau under-scheduling.

2. **Tidak ada infrastruktur job scheduler**: Menambahkan Redis Queue atau cron container hanya untuk rekalkulasi progres adalah over-engineering untuk MVP. Eager recalculation tidak memerlukan dependency tambahan.

3. **Beban database masih rendah untuk skala MVP**: Satu panggilan `recalculateProgress` = 2 SELECT + 1 INSERT … ON CONFLICT dengan full-scan terbatas (tasks per user per minggu, via index). Untuk < 50 user concurrent, overhead ini tidak signifikan.

4. **Kesederhanaan kode**: Logika rekalkulasi berada di controller yang sama dengan mutasi data. Tidak perlu event bus, pub/sub, atau webhook. Developer dapat membaca alur data secara linear.

5. **Eager recalculation sudah menjadi pola yang ada**: `editStatus` sudah memanggil `recalculateProgress` sejak awal. Menambahkan di `createTask`, `editTask`, dan `reschedule` konsisten dengan pola yang sudah ada.

## Konsekuensi

**Positif:**
- Data progres selalu real-time tanpa perlu menunggu batch/job
- `remaining_capacity` di reschedule selalu fresh, mengurangi risiko konflik jadwal
- Tidak perlu infrastruktur tambahan (cron, job queue)
- Pola konsisten di semua titik mutasi task

**Negatif / Risiko:**
- **Latency tambahan per request**: Setiap mutasi task mendapat overhead ~5-15ms (2 SELECT + 1 INSERT). Untuk skala kecil tidak terasa, tapi perlu diukur jika user tumbuh.
- **Query tidak di-batch**: Jika user mengubah 10 task sekaligus (misal via bulk update), akan terjadi 10× rekalkulasi terpisah. Saat ini belum ada bulk update endpoint.
- **No isolation untuk week berbeda**: Jika task dipindahkan antar minggu, controller memanggil `recalculateProgress` dua kali (minggu lama + minggu baru). Ini correct tapi 2× lipat query.

**Keputusan yang ditunda:**
- Jika user scale bertambah, migrasi ke lazy recalculation via cron atau queue dapat dilakukan tanpa mengubah API response — cukup dengan mengganti implementasi `recalculateProgress` menjadi async (fire-and-forget) atau dijadwalkan.
- Bulk update tasks belum memiliki endpoint terpisah. Jika ditambahkan di masa depan, perlu pertimbangan batch recalculation.
