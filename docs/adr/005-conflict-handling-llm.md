# ADR-005: Penanganan Konflik Slot oleh LLM pada Reschedule

## Status
Accepted

## Konteks

Fitur `reschedule` di `POST /api/ai/plan/reschedule` bertugas menjadwalkan ulang task-task yang overdue ke minggu berjalan. Inputnya adalah daftar `task_ids` dan output dari LLM adalah susunan jadwal baru yang mencakup `planned_date` dan `planned_slot`.

Masalah utama: LLM dapat mengusulkan slot yang sudah terisi oleh task lain di minggu yang sama. Dua pendekatan dievaluasi:

| Pendekatan | Server-side post-validation | Prompt guidance |
|---|---|---|
| **Post-AI validation + retry** | Validasi konflik di controller setelah AI return. Jika ada konflik, retry dengan `occupied_slots` sebagai instruksi tambahan. Maksimal 2 retry. | LLM diberi context `current_week_tasks` |
| **LLM-native conflict avoidance** | Tidak ada post-validation. LLM langsung diberi daftar `occupied_slots` + instruksi eksplisit untuk menghindarinya. | LLM diberi `occupied_slots` + `conflict_warning` |

Faktor yang mempengaruhi keputusan:
- Model Gemini 2.5 Flash memiliki instruction-following capability yang kuat
- Retry loop menambah latency (setiap retry = 1 panggilan API tambahan)
- Server-side validation hanya detektif, bukan preventif — tetap bergantung ke AI di retry
- Output AI tetap harus melewati validasi Zod (`aiSuggestionPayloadSchema`) sebelum dikembalikan ke klien

## Keputusan

LLM bertanggung jawab penuh menghindari konflik slot sejak percobaan pertama. Server hanya memberikan informasi yang cukup:

- **`current_week_tasks`** — daftar task existing di minggu ini (termasuk slot dan durasi)
- **`occupied_slots`** — daftar slot `"YYYY-MM-DD morning|afternoon|evening"` yang sudah terisi
- **`conflict_warning`** — instruksi eksplisit dalam Bahasa Indonesia untuk menghindari slot tersebut

Server **tidak** melakukan post-validation konflik slot. Jika AI menghasilkan output dengan konflik, output tersebut tetap dikembalikan ke klien. Klien dapat menggunakan `PATCH /api/tasks/:id` untuk menyesuaikan jadwal secara manual.

## Alasan

1. **LLM capable mengikuti instruksi**: Gemini 2.5 Flash terbukti mampu mengikuti instruksi eksplisit. Dengan `occupied_slots` + `conflict_warning`, kasus konflik dapat diminimalkan tanpa overhead retry.

2. **Eliminasi latency retry**: Setiap retry menambah waktu respons sebesar 1× panggilan API (rata-rata 2-5 detik). Dengan menghilangkan post-validation, endpoint `reschedule` konsisten 1 panggilan API saja.

3. **Server-side validation tidak menambah jaminan**: Post-validation hanya bisa mendeteksi konflik lalu meminta AI memperbaiki — tetap bergantung pada kemampuan AI di panggilan berikutnya. Tidak ada enforcement di level database (tidak ada unique constraint `(planned_date, planned_slot)`), sehingga server tidak bisa memaksa.

4. **User tetap punya kontrol manual**: Endpoint `PATCH /api/tasks/:id` sudah tersedia untuk user memperbaiki jadwal jika AI tetap menghasilkan konflik.

5. **Kesederhanaan kode**: Tanpa post-validation, logika `reschedule` tetap linear: build context → call LLM → validate → save → respond. Tidak perlu loop retry atau deteksi konflik di controller.

## Konsekuensi

**Positif:**
- Respons endpoint lebih cepat dan konsisten (1 panggilan API, tanpa retry)
- Kode controller lebih sederhana dan mudah dipahami
- Tidak ada false positive — server tidak pernah menolak output AI hanya karena konflik slot

**Negatif / Risiko:**
- **Konflik slot masih mungkin terjadi**: Meskipun kecil, AI tetap bisa mengabaikan instruksi. User harus memperbaiki manual via `PATCH /api/tasks/:id`
- **Tidak ada audit trail konflik**: Server tidak mencatat ketika AI menghasilkan konflik, sehingga sulit mengukur kualitas prompt
- **Beban ke UX**: Frontend perlu menangani kemungkinan conflicting tasks, misalnya dengan menampilkan warning atau deteksi konflik di sisi klien

**Keputusan terkait:**
- Jika tingkat konflik tinggi di masa depan, alternatifnya adalah menambahkan unique constraint `(planned_date, planned_slot)` di level database, atau mengaktifkan kembali post-validation dengan circuit breaker pattern
