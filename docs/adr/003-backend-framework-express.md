# ADR-003: Pemilihan Express.js sebagai Backend Framework

## Status
Accepted

## Konteks

Backend AI Learning Plan berfungsi sebagai REST API server yang melayani:
- Autentikasi pengguna (register, login, JWT refresh)
- CRUD untuk goals dan tasks
- Integrasi dengan Gemini LLM (`/api/ai/plan/suggest`)
- Health check dan metrics endpoint (Prometheus-compatible)

Tim perlu memilih backend framework Node.js yang sesuai dengan kebutuhan proyek capstone ini. Kandidat yang dievaluasi:

| Framework | Paradigma | Boilerplate | Fleksibilitas | Learning Curve |
|---|---|---|---|---|
| **Express.js** | Minimalis, unopinionated | Rendah | Sangat tinggi | Rendah |
| Fastify | Minimalis, high-performance | Rendah | Tinggi | Sedang |
| NestJS | Opinionated, modular | Tinggi | Sedang | Tinggi |
| Hapi.js | Opinionated, enterprise | Sedang | Sedang | Sedang |
| Koa.js | Minimalis, modern | Rendah | Tinggi | Sedang |

Faktor-faktor yang relevan untuk proyek ini:
- Proyek adalah capstone bootcamp dengan timeline terbatas
- Tim adalah developer JavaScript/Node.js yang sudah familiar dengan konsep dasar web server
- Kebutuhan API relatif straightforward (REST, JWT, LLM integration)
- Tidak ada kebutuhan GraphQL, WebSocket, atau microservices yang kompleks
- Observability dasar (logging dengan Pino, metrics dengan prom-client) diperlukan

## Keputusan

Menggunakan **Express.js v4** sebagai backend framework.

Struktur aplikasi mengikuti pola layered architecture:
- `routes/` — definisi endpoint dan validasi input (Zod)
- `models/` — akses database (query builder manual dengan `pg`)
- `services/` — business logic eksternal (LLM integration)
- `middleware/` — cross-cutting concerns (auth, logging, error handling)
- `utils/` — helper dan konfigurasi

## Alasan

1. **Ekosistem dan dokumentasi terluas**: Express adalah framework Node.js paling populer dengan dokumentasi lengkap, ribuan contoh, dan komunitas besar. Debugging dan pencarian solusi jauh lebih mudah bagi tim yang baru mengenal backend development.

2. **Minimalis dan tidak opinionated**: Express tidak memaksakan struktur folder atau pola tertentu. Ini memberikan kebebasan tim untuk membangun arsitektur yang sesuai kebutuhan, bukan mengikuti konvensi framework yang mungkin overkill untuk proyek ini.

3. **Middleware ecosystem yang kaya**:
   - `cors` — untuk menangani cross-origin requests dari React frontend
   - `express-rate-limit` — proteksi endpoint AI dari abuse
   - Custom middleware (`authenticate`, `requestLogger`, `errorHandler`) mudah dibuat dan dikomposisi

4. **Validasi input dengan Zod**: Express tidak memiliki validasi bawaan, sehingga tim bebas memilih library validasi terbaik. Zod dipilih karena TypeScript-first, schema inference yang kuat, dan integrasi bersih dengan pola async/await Express.

5. **Kompatibilitas dengan seluruh ekosistem npm**: Semua library yang digunakan (`bcryptjs`, `jsonwebtoken`, `pino`, `prom-client`, `pg`) adalah library framework-agnostic yang bekerja sempurna dengan Express tanpa adapter khusus.

6. **Kemudahan onboarding**: Hampir semua materi backend Node.js di Dicoding menggunakan Express. Tim dapat langsung produktif tanpa perlu mempelajari abstraksi framework baru.

7. **Cukup untuk kebutuhan capstone**: Fitur yang dibutuhkan (REST API + JWT + LLM integration) tidak memerlukan fitur advanced seperti dependency injection (NestJS) atau schema-based validation bawaan (Fastify). Express sudah lebih dari cukup.

## Konsekuensi

**Positif:**
- Setup cepat — `app.js` yang lengkap dengan semua middleware dan routing hanya ~34 baris
- Error handling terpusat via `errorHandler` middleware menjaga kode route tetap bersih
- Rate limiting pada endpoint AI (`express-rate-limit`) melindungi kuota Gemini API dari penyalahgunaan
- Hot reload via `nodemon` sudah terkonfigurasi untuk development workflow yang cepat

**Negatif / Risiko:**
- **Tidak ada validasi request bawaan**: Tim harus konsisten menerapkan Zod di setiap route secara manual. Risiko: ada route yang lupa divalidasi
- **Performa lebih rendah dari Fastify**: Untuk throughput sangat tinggi, Express lebih lambat. Namun, untuk skala capstone (puluhan user concurrent), ini tidak relevan
- **Error handling async yang verbose**: Setiap async route handler harus menggunakan `try/catch` atau wrapper untuk meneruskan error ke `next()`. Risiko error yang tidak tertangkap jika developer lupa

**Pola yang ditetapkan untuk konsistensi:**
- Semua route handler menggunakan pola `async (req, res, next) => { try {...} catch(e) { next(e) } }`
- Validasi input Zod wajib di semua endpoint yang menerima request body
- Error custom (`NotFoundError`, `UnprocessableEntityError`) didefinisikan di `src/exceptions/` dan ditangani oleh `errorHandler` middleware
