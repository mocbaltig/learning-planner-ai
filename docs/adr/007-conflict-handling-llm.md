# ADR-007: Penanganan Konflik Slot oleh LLM pada Reschedule

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

Menggunakan kombinasi **LLM guidance** dan **server-side post-validation dengan retry** untuk menangani konflik slot pada proses reschedule.

Proses yang dilakukan:

1. Server mengirimkan `current_week_tasks` kepada LLM sebagai konteks awal.
2. LLM menghasilkan rekomendasi jadwal baru untuk task yang overdue.
3. Server melakukan validasi konflik slot menggunakan fungsi `findConflicts`.
4. Jika ditemukan konflik, server melakukan retry dengan menambahkan:

   * `occupied_slots`
   * `conflict_warning`
5. Retry dilakukan maksimal **2 kali**.
6. Jika seluruh percobaan gagal menghasilkan jadwal yang valid, endpoint mengembalikan respons **422 Unprocessable Entity**.
7. Output AI tetap divalidasi menggunakan Zod schema (`aiRescheduleOutputSchema`) sebelum dikembalikan ke klien.

## Alasan

1. **LLM capable mengikuti instruksi**: Gemini 2.5 Flash terbukti mampu mengikuti instruksi eksplisit. Dengan `occupied_slots` + `conflict_warning`, kasus konflik dapat diminimalkan tanpa overhead retry.

2. **Meningkatkan keandalan hasil reschedule**

LLM dapat menghasilkan slot yang bertabrakan dengan task lain. Validasi di sisi server membantu mendeteksi konflik sebelum rekomendasi dikembalikan ke pengguna.

3. **Retry meningkatkan peluang mendapatkan jadwal yang valid**

Dengan memberikan `occupied_slots` dan `conflict_warning`, LLM memperoleh informasi tambahan untuk menghindari konflik pada percobaan berikutnya.

4. **Schema validation menjaga konsistensi output AI**

Seluruh respons AI harus memenuhi `aiRescheduleOutputSchema` untuk memastikan data yang dikembalikan sesuai dengan kebutuhan aplikasi.

5. **Pengguna tetap memiliki kontrol manual**

Jika seluruh percobaan gagal, pengguna tetap dapat menjadwalkan ulang task secara manual melalui fitur edit task.


## Konsekuensi

**Positif:**
- Mengurangi kemungkinan konflik slot pada hasil reschedule.
- Meningkatkan reliabilitas output AI melalui validasi dan retry.
- Menjaga konsistensi format data dengan schema validation.

**Negatif / Risiko:**
- Waktu respons endpoint dapat meningkat akibat mekanisme retry.
- Menambah kompleksitas logika pada controller.
- Tetap bergantung pada kualitas respons AI untuk menghasilkan rekomendasi yang valid.
- **Konflik slot masih mungkin terjadi**: Meskipun kecil, AI tetap bisa mengabaikan instruksi. User harus memperbaiki manual via `PATCH /api/tasks/:id`
- **Tidak ada audit trail konflik**: Server tidak mencatat ketika AI menghasilkan konflik, sehingga sulit mengukur kualitas prompt
- **Beban ke UX**: Frontend perlu menangani kemungkinan conflicting tasks, misalnya dengan menampilkan warning atau deteksi konflik di sisi klien

**Keputusan terkait:**
- Jika tingkat konflik tinggi di masa depan, alternatifnya adalah menambahkan unique constraint `(planned_date, planned_slot)` di level database, atau mengaktifkan kembali post-validation dengan circuit breaker pattern
