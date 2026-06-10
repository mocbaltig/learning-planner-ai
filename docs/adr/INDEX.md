# Architecture Decision Records — Index

> Dokumen ini merangkum semua keputusan arsitektur (ADR) yang dibuat selama pengembangan **Learning Planner AI**.  
> Setiap keputusan disertai tautan ke dokumen lengkap yang memuat konteks, alasan, trade-off, dan konsekuensi.

---

## Cara Membaca ADR

Setiap ADR mengikuti format berikut:

| Bagian | Isi |
|---|---|
| **Status** | `Accepted` / `Superseded` / `Deprecated` |
| **Konteks** | Situasi dan fakta yang memicu keputusan |
| **Keputusan** | Apa yang dipilih |
| **Alasan** | Mengapa pilihan ini yang terbaik |
| **Konsekuensi** | Trade-off positif dan negatif |

---

## Cycle 1 — Foundation (Infrastruktur & Stack)

> Keputusan yang dibuat saat menetapkan fondasi teknis proyek di awal Cycle 1.

| ADR | Keputusan | Kategori | Status | Dampak Utama |
|---|---|---|---|---|
| [ADR-001](001-llm-gemini.md) | Google Gemini 2.5 Flash sebagai LLM Provider | AI / LLM | ✅ Accepted | Zero-cost API, 1M token context window, mock mode untuk testing |
| [ADR-002](002-database-postgresql.md) | PostgreSQL 16 sebagai database utama | Data | ✅ Accepted | JSONB native, full FK integrity, UUID primary key, node-pg-migrate |
| [ADR-003](003-backend-framework-express.md) | Express.js v4 sebagai backend framework | Backend | ✅ Accepted | Minimalis, ekosistem luas, layered architecture (routes/models/services) |
| [ADR-004](004-css-framework-tailwind.md) | Tailwind CSS v4 sebagai CSS framework | Frontend | ✅ Accepted | Utility-first, design tokens konsisten, zero config via @tailwindcss/vite |

---

## Cycle 2 — Feature Expansion (Fitur & Strategi)

> Keputusan yang dibuat selama pengembangan fitur utama di Cycle 2:  
> Weekly Calendar, Progress Tracking, dan AI Reschedule.

| ADR | Keputusan | Kategori | Status | Dampak Utama |
|---|---|---|---|---|
| [ADR-005](005-state-management.md) | Local State + Custom Hooks (tanpa library eksternal) | State Management | ✅ Accepted | Zero dependency tambahan, data selalu fresh per navigasi, mudah ditest isolasi |
| [ADR-006](006-progress-recalculation.md) | Eager recalculation progress per setiap mutasi task | Data / Performance | ✅ Accepted | Akurasi real-time untuk `remaining_capacity` di AI context, tanpa job scheduler |
| [ADR-007](007-conflict-handling-llm.md) | LLM-native conflict avoidance pada fitur reschedule | AI Strategy | ✅ Accepted | 1 API call per reschedule (tanpa retry loop), kode controller linear |

---

## Ringkasan Trade-off Kunci

### State Management (ADR-005)

```
Dipilih : Local State + Custom Hooks
Ditolak : React Context, Zustand/Redux
Alasan  : Semua halaman berada di rute berbeda — tidak pernah aktif bersamaan.
          Context hanya menambah stale state dan re-render tanpa manfaat nyata.
```

### Reschedule Conflict Strategy (ADR-007)

```
Dipilih : LLM-native avoidance — kirim occupied_slots + conflict_warning ke Gemini
Ditolak : Server-side post-validation + retry loop (maks. 2x)
Alasan  : Gemini 2.5 Flash mampu mengikuti instruksi eksplisit.
          Setiap retry = +2-5 detik latency. Eliminasi retry = respons konsisten.
```

### Progress Recalculation (ADR-006)

```
Dipilih : Eager recalculation — dipanggil sinkron di setiap createTask/editTask/editStatus/reschedule
Ditolak : Lazy recalculation via cron job harian
Alasan  : remaining_capacity harus akurat saat AI diminta reschedule.
          Data stale +24 jam bisa menyebabkan AI over-scheduling.
```

---

## Dependensi antar Keputusan

```
ADR-001 (Gemini)
  └──▶ ADR-007 (Reschedule Conflict)
         Strategi LLM-native hanya masuk akal karena Gemini 2.5 Flash
         memiliki instruction-following capability yang kuat.

ADR-002 (PostgreSQL)
  └──▶ ADR-006 (Eager Recalculation)
         INSERT ... ON CONFLICT DO UPDATE pada progress_snapshots
         hanya tersedia di PostgreSQL (UPSERT semantics).

ADR-003 (Express)
  └──▶ ADR-005 (State Management)
         REST API stateless mendorong pendekatan fetch-per-route,
         konsisten dengan Local State + Custom Hooks.
```

---

## Syarat Re-evaluasi

| ADR | Pertimbangkan revisi jika... |
|---|---|
| ADR-001 | Gemini API down berkepanjangan atau kuota gratis tidak cukup untuk user aktif |
| ADR-002 | Perlu horizontal scaling — pertimbangkan read replica atau managed DB |
| ADR-003 | Kebutuhan performa tinggi (>1000 req/s) — evaluasi migrasi ke Fastify |
| ADR-004 | Komponen komplex meningkat — evaluasi shadcn/ui atau DaisyUI di atas Tailwind |
| ADR-005 | Ada ≥2 komponen dalam satu halaman yang perlu membaca state yang sama secara bersamaan |
| ADR-006 | User scale >500 concurrent atau muncul kebutuhan bulk update tasks |
| ADR-007 | Tingkat konflik slot tinggi — tambahkan unique constraint DB atau aktifkan post-validation |

---

*Terakhir diperbarui: 2026-06-05*  
*Lihat juga: [Portfolio Write-up](../portfolio-writeup.md) untuk narasi teknis lengkap.*
