# ADR-002: Pemilihan PostgreSQL sebagai Database

## Status
Accepted

## Konteks

Aplikasi AI Learning Plan membutuhkan database relasional untuk menyimpan:
- Data pengguna (`users`, `profiles`)
- Goal dan task belajar (`goals`, `tasks`)
- Riwayat rekomendasi AI (`ai_recommendations`)
- Snapshot progres mingguan (`progress_snapshots`)
- Audit log aksi pengguna (`audit_logs`)

Karakteristik data yang mempengaruhi pilihan database:

- **Relasi antar entitas kuat**: users → profiles → goals → tasks → ai_recommendations, semua terhubung dengan foreign key dan CASCADE delete
- **Data semi-terstruktur**: Kolom `input_context`, `output` (di `ai_recommendations`), `availability` (di `profiles`), dan `metadata` (di `audit_logs`) menyimpan data JSON yang strukturnya dapat bervariasi
- **Konsistensi transaksi penting**: Ketika AI menyarankan task, data harus disimpan atomik (rekomendasi + tasks)
- **Query analitik per minggu**: `progress_snapshots` di-query berdasarkan kombinasi `user_id` + `week`

Kandidat yang dievaluasi:

| Database | Tipe | JSONB Support | Relasi | Hosted Free |
|---|---|---|---|---|
| **PostgreSQL** | Relasional | ✅ Native JSONB | ✅ Full FK | ✅ Via Docker |
| MySQL | Relasional | ⚠️ JSON (terbatas) | ✅ Full FK | ✅ Via Docker |
| MongoDB | Dokumen | ✅ Native | ❌ No FK | ✅ Atlas Free |
| SQLite | Relasional | ⚠️ Terbatas | ⚠️ Parsial | ✅ File-based |

Konteks tambahan:
- Tim menggunakan Docker Compose untuk setup lokal (`docker-compose.yml` menggunakan `postgres:16`)
- Migrasi dikelola dengan `node-pg-migrate`, yang secara spesifik dirancang untuk PostgreSQL
- Tool ORM yang digunakan adalah `pg` (driver PostgreSQL native untuk Node.js)

## Keputusan

Menggunakan **PostgreSQL 16** sebagai database utama, dijalankan via Docker container.

Migrasi skema dikelola menggunakan **node-pg-migrate**, dengan script npm `migrate:up`, `migrate:down`, dan `migrate:create` yang sudah terkonfigurasi di `package.json`.

## Alasan

1. **JSONB tipe data native**: PostgreSQL mendukung kolom JSONB (binary JSON) yang memungkinkan penyimpanan output AI (`output`, `input_context`) yang strukturnya semi-dinamis, sekaligus tetap bisa di-query dengan efisien dan di-index. Ini menghindari keharusan membuat tabel terpisah untuk setiap variasi output AI.

2. **Integritas referensial penuh**: Seluruh relasi data (user → goal → task, user → ai_recommendation, dll) dijaga dengan `FOREIGN KEY` dan `ON DELETE CASCADE`. Ini memastikan tidak ada data orphan jika user dihapus, tanpa logika tambahan di aplikasi.

3. **UUID sebagai primary key**: PostgreSQL mendukung `gen_random_uuid()` secara native (tersedia sejak PG 13). Penggunaan UUID menghindari sequential ID yang mudah ditebak dan memudahkan sharding di masa depan.

4. **Constraint tingkat database yang kaya**: Constraint seperti `CHECK (duration_estimate BETWEEN 25 AND 90)` dan `UNIQUE (user_id, week)` pada `progress_snapshots` diterapkan langsung di database, bukan hanya di aplikasi, sehingga integritas data terjaga dari semua jalur akses.

5. **node-pg-migrate**: Tool migrasi yang matang dan spesifik untuk PostgreSQL, mendukung up/down migration, dan terintegrasi baik dengan ekosistem Node.js. Migrasi as-code memastikan skema database dapat di-version control dan direproduksi.

6. **Ekosistem Node.js yang matang**: Driver `pg` adalah driver PostgreSQL paling mature dan battle-tested untuk Node.js, dengan dukungan connection pooling bawaan.

7. **Performa query analitik**: Index pada `(user_id, week)`, `goal_id`, `planned_date`, dan `status` sudah dibuat sejak awal di migration, mempersiapkan query performa tinggi untuk fitur progress tracking.

## Konsekuensi

**Positif:**
- Satu database untuk semua kebutuhan (relasional + JSON semi-terstruktur)
- Constraint di level database menjamin data integrity bahkan jika ada bug di aplikasi
- Migrasi terversi memudahkan onboarding anggota tim baru dengan satu perintah `npm run migrate:up`
- Healthcheck Docker sudah dikonfigurasi (`pg_isready`) untuk memastikan server tidak start sebelum database siap

**Negatif / Risiko:**
- **Dependency pada Docker**: Developer wajib menjalankan Docker Desktop untuk setup lokal. Ini sudah didokumentasikan di README beserta troubleshooting-nya
- **Port conflict**: Port default 5432 bisa konflik dengan instalasi PostgreSQL lokal. Solusi (mengubah port ke 5433) sudah didokumentasikan di README
- **Belum ada connection pooling eksplisit**: Saat ini menggunakan `pg.Pool` secara default. Untuk skala lebih besar, perlu pertimbangkan PgBouncer atau konfigurasi pool size

**Keputusan yang ditunda:**
- Redis sudah ada di `docker-compose.yml` tapi belum digunakan di kode aplikasi. Penggunaan Redis untuk caching atau session management akan diputuskan di ADR terpisah sesuai kebutuhan cycle berikutnya.
