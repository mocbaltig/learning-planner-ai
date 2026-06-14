# ADR-008: Admin Page & Observability Dashboard

## Status
Accepted

## Konteks

Aplikasi membutuhkan halaman admin untuk memonitor penggunaan sistem, khususnya:
- Metrik pemakaian AI (jumlah call, token usage, acceptance rate)
- Performa API (response time, request count)
- Data kesehatan sistem secara real-time

Halaman ini hanya boleh diakses oleh pengguna dengan peran admin.

## Keputusan

1. **Role admin via database flag** — Menambahkan kolom `is_admin` (boolean) pada tabel `users`, bukan sistem role terpisah atau RBAC penuh.
2. **ForbiddenError exception** — Exception class baru (`403 Forbidden`) untuk middleware authorization.
3. **Dual metrics endpoint** — Dua endpoint pada router yang sama:
   - `GET /metrics` → Prometheus raw format (publik, tanpa auth)
   - `GET /api/metrics/summary` → JSON terstruktur (wajib auth + admin)
4. **React page `/observability`** — Halaman admin yang menampilkan stat card, acceptance rate bar, dan metric detail collapsible.
5. **Admin middleware reusable** — `requireAdmin` middleware yang dapat dipasang di route admin mana pun di masa depan.

## Alasan

1. **Minimal complexity** — Proyek capstone hanya butuh satu level admin. RBAC penuh (`roles` + `permissions` table) adalah over-engineering.
2. **DB flag vs separate table** — `is_admin` boolean di tabel `users` lebih sederhana daripada tabel `admin_roles` terpisah. Query jadi single-row tanpa JOIN.
3. **ForbiddenError sebagai custom class** — Konsisten dengan pattern exception lain di proyek (`NotFoundError`, `ClientError`, dll), memudahkan error handler terpusat.
4. **Dual endpoint** — Prometheus endpoint publik untuk monitoring infrastruktur (scrape oleh Prometheus server), summary endpoint terproteksi untuk dashboard admin.
5. **Client-side routing** — `/observability` diletakkan di dalam `ProtectedRoute` (auth wrapper), bukan layout publik, konsisten dengan halaman lain.

## Konsekuensi

**Positif:**
- Admin dapat memonitor AI usage tanpa akses ke database langsung
- Pattern middleware reusable untuk endpoint admin masa depan (misal: user management, system config)
- Metrics endpoint Prometheus tetap accessible oleh monitoring infrastructure tanpa auth
- Observability dashboard terisolasi dari layout utama, bisa diakses via navigasi langsung

**Negatif / Risiko:**
- `is_admin` boolean tidak scalable untuk multi-role system di masa depan. Jika butuh role lain (moderator, viewer), perlu migrasi ke RBAC
- Tidak ada audit trail untuk akses admin (siapa mengakses `/observability` dan kapan)
- Halaman observability hanya menampilkan data point-in-time, tidak ada historical chart atau time-series visualization
