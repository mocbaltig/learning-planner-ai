# ADR-001: Pemilihan Google Gemini sebagai LLM Provider

## Status
Accepted

## Konteks

AI Learning Plan adalah aplikasi yang tugasnya membantu peserta bootcamp merencanakan jadwal belajar secara otomatis dan personal. Fitur inti aplikasi ini bergantung pada kemampuan Large Language Model (LLM) untuk:

- Memahami konteks goal belajar pengguna (judul, deskripsi, deadline)
- Mempertimbangkan profil pengguna (jam belajar preferensi, target jam per minggu)
- Menghasilkan rencana tugas mingguan dalam format JSON terstruktur yang dapat langsung dikonsumsi oleh frontend

Tim perlu memilih satu LLM provider yang akan diintegrasikan ke backend Express. Kandidat yang dievaluasi:

| Provider | Model Unggulan | Biaya (estimasi) | Batasan Free Tier |
|---|---|---|---|
| **Google Gemini** | gemini-2.5-flash | Gratis (API Key via AI Studio) | 15 req/menit, 1.500 req/hari |
| OpenAI | gpt-4o-mini | ~$0.15 / 1M token input | Tidak ada free tier |
| Anthropic Claude | claude-3-haiku | ~$0.25 / 1M token input | Tidak ada free tier |
| Groq (Llama 3) | llama-3.1-70b | Gratis (terbatas) | Rate limit sangat ketat |

Konteks tambahan yang mempengaruhi keputusan:
- Proyek ini adalah capstone bootcamp Dicoding, bukan produk komersial
- Tim tidak memiliki anggaran untuk API berbayar
- README secara eksplisit mengarahkan pengguna ke https://aistudio.google.com/apikey
- Kode menggunakan SDK resmi `@google/generative-ai` (versi ^0.24.0)

## Keputusan

Menggunakan **Google Gemini 2.5 Flash** sebagai LLM provider via Google AI Studio API.

Implementasi dilakukan di `server/src/services/llm.js` dengan dua mode yang dapat dikonfigurasi via environment variable `LLM_PROVIDER`:
- `mock` — mengembalikan data statis tanpa memanggil API eksternal (untuk development dan testing)
- `real` (default) — memanggil Gemini API menggunakan `@google/generative-ai` SDK

## Alasan

1. **Tanpa biaya untuk pengembangan**: Gemini API Key tersedia gratis via Google AI Studio dengan kuota yang cukup untuk bootcamp (1.500 request/hari).

2. **Kualitas output JSON yang baik**: Model `gemini-2.5-flash` mampu menghasilkan JSON terstruktur secara konsisten, yang kritis karena output LLM langsung di-parse menggunakan Zod (`SuggestionSchema`) dan divalidasi sebelum disimpan ke database.

3. **SDK resmi dan terdokumentasi**: Paket `@google/generative-ai` memberikan type-safety dan kemudahan integrasi. Tidak perlu implementasi HTTP client manual.

4. **Kemampuan context window yang besar**: Gemini 2.5 Flash memiliki context window 1 juta token, lebih dari cukup untuk prompt sistem + konteks user yang kompleks.

5. **Mock mode untuk isolasi testing**: Desain dua-mode (`mock`/`real`) memastikan unit test dan development lokal tidak bergantung pada koneksi internet atau kuota API, sesuai praktik software engineering yang baik.

6. **Kesesuaian dengan ekosistem bootcamp**: Dicoding sebagai platform pendidikan yang berkolaborasi dengan ekosistem Google Cloud memudahkan akses dan dokumentasi bagi seluruh anggota tim.

## Konsekuensi

**Positif:**
- Tidak ada pengeluaran API selama pengembangan dan presentasi capstone
- Mock mode memungkinkan pengujian fitur AI tanpa dependency eksternal
- Retry logic 1x sudah diimplementasikan di `routes/ai.js` untuk menangani output LLM yang tidak valid

**Negatif / Risiko:**
- **Vendor lock-in**: Kode saat ini tightly coupled ke `@google/generative-ai`. Migrasi ke provider lain memerlukan refactor `llm.js`
- **Rate limiting**: Free tier Gemini memiliki batas 15 request/menit. Jika banyak pengguna concurrent, fitur AI dapat gagal sementara
- **Tidak ada fallback provider**: Jika Gemini API down, seluruh fitur saran jadwal tidak berfungsi

**Mitigasi yang sudah ada:**
- Retry logic 1x di `POST /api/ai/plan/suggest`
- Error ditangani dengan `UnprocessableEntityError` dan pesan yang informatif ke user
- Mock mode dapat diaktifkan sewaktu-waktu via `LLM_PROVIDER=mock` di `.env`
