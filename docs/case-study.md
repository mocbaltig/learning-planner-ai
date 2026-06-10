# Case Study — Learning Planner AI

**Capstone Project · Dicoding Bootcamp · 2026**

> AI-powered learning planner yang membantu peserta bootcamp mengubah tujuan belajar menjadi jadwal mingguan yang realistis — dan bangkit kembali ketika tertinggal.

---

## The Problem

Peserta bootcamp sering kali tahu **apa** yang ingin dipelajari, tapi tidak tahu **bagaimana** memulainya secara konkret.

- 📌 **Tujuan terlalu abstrak** — "Pelajari React" tidak memberi sinyal kapan, berapa lama, atau di slot apa
- 📅 **Jadwal tidak mempertimbangkan kapasitas nyata** — dibuat tanpa melihat slot yang sudah terisi di minggu yang sama
- 🔄 **Tidak ada recovery path** — ketika satu sesi terlewat, tidak ada alat untuk menjadwalkan ulang secara terstruktur

---

## Screenshot 1 — Goals & Learning Targets

![Goals page — daftar learning goal dengan progress dan task count](../.screenshot/mpv-shot0003.jpg)

*Halaman Goals: user mengelola 8 learning goal aktif. Setiap goal memiliki task count dan akses langsung ke AI suggestion.*

---

## Screenshot 2 — AI Suggestion Flow (Human-in-the-Loop)

![AI Suggestion — task card dengan deskripsi, durasi, slot, dan tombol Terima/Tolak](../.screenshot/mpv-shot0007.jpg)

*AI menghasilkan task mingguan yang dipersonalisasi: judul, deskripsi alasan, durasi (menit), slot waktu (Pagi/Siang/Malam), dan tanggal. User memutuskan satu per satu — Terima atau Tolak. Progress accept/reject ditampilkan real-time ("4 dari 5 saran sudah diproses").*

---

## Screenshot 3 — Progress Dashboard

![Dashboard — donut chart 50%, task list hari ini, goals aktif dengan progress bar](../.screenshot/mpv-shot0002.jpg)

*Dashboard real-time: completion rate donut chart (50%), statistik minggu (5/10 task, 9.5/20 jam, 3 goals aktif), task hari ini per slot waktu, dan progress bar per goal.*

---

## Technical Approach

Tiga keputusan teknis yang paling berdampak pada produk:

| # | Keputusan | Masalah yang Diselesaikan |
|---|---|---|
| **1** | **Zod schema validation + 1x retry** pada output Gemini | LLM tidak selalu menghasilkan JSON valid — validasi mencegah data corrupt masuk database |
| **2** | **LLM-native conflict avoidance** — kirim `occupied_slots` ke Gemini, bukan post-validation server-side | Eliminasi retry loop → endpoint reschedule selalu 1 API call, latency konsisten |
| **3** | **Eager progress recalculation** di setiap mutasi task | `remaining_capacity` harus selalu akurat saat AI diminta reschedule — data stale menyebabkan AI over-scheduling |

---

## Impact Metrics (Target)

| Metrik | Target | Alat Ukur |
|---|---|---|
| AI Acceptance Rate | ≥ 50% saran diterima | Tabel `ai_recommendations`, rasio `status = 'accepted'` |
| LLM Output Validity | ≥ 90% lolos Zod tanpa retry | Log `ai_suggest_retry` vs total request |
| Endpoint Latency | Median < 5 detik | `/metrics` endpoint (prom-client histogram) |
| Task Completion Rate | ≥ 60% task terjadwal diselesaikan | Rasio `status = 'done'` per minggu |

---

## Stack

`Node.js 20` · `Express.js` · `PostgreSQL 16` · `React 18` · `Vite` · `Tailwind CSS v4` · `Google Gemini 2.5 Flash` · `Zod` · `JWT` · `Docker`

---

📄 [Portfolio Write-up lengkap](portfolio-writeup.md) · 🏛️ [Architecture Decision Records](adr/INDEX.md)
