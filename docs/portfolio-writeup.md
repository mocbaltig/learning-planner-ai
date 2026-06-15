# Learning Planner AI — Portfolio Write-up

## Problem

Peserta bootcamp sering mengalami kesulitan dalam menjaga konsistensi belajar karena belum memiliki sistem yang dapat membantu mereka merencanakan aktivitas belajar secara terstruktur. Penjadwalan belajar umumnya dilakukan secara manual, sehingga ketika terjadi perubahan jadwal atau terdapat tugas yang tertunda, pengguna harus mengatur ulang seluruh rencana belajar secara mandiri.

Selain itu, peserta juga membutuhkan gambaran progres belajar yang jelas agar dapat mengevaluasi pencapaian target yang telah ditetapkan.

## Approach

Untuk menyelesaikan permasalahan tersebut, dikembangkan **Learning Planner AI**, sebuah aplikasi web yang membantu pengguna dalam membuat, mengelola, dan menyesuaikan rencana belajar dengan bantuan AI.

### Solusi yang diimplementasikan

* **Weekly Calendar** untuk menampilkan jadwal belajar dalam tampilan mingguan.
* **Manual Task Creation** agar pengguna dapat menambahkan tugas belajar secara mandiri.
* **AI Learning Coach** yang menghasilkan rekomendasi tugas belajar berdasarkan tujuan (goal) yang dimiliki pengguna.
* **AI Rescheduling** untuk membantu menjadwalkan ulang tugas yang overdue.
* **Progress Tracking** untuk memantau perkembangan belajar pengguna setiap minggu.
* **Admin Dashboard** untuk memonitor metrik penggunaan AI, seperti jumlah permintaan AI, acceptance rate, dan response time.

### Pendekatan Teknis

#### Frontend

* React
* Vite
* Tailwind CSS

#### Backend

* Node.js
* Express.js

#### Database & Infrastructure

* PostgreSQL
* Redis
* Docker

#### AI Integration

* Gemini API
* Mock LLM Provider untuk proses development dan testing

### Trade-offs

#### State Management

Aplikasi menggunakan **Local State dan Custom Hooks** dibandingkan menggunakan Redux atau Zustand.

Keuntungan:

* Implementasi lebih sederhana.
* Tidak menambah dependency tambahan.
* Cocok untuk kebutuhan MVP.

Keterbatasan:

* Tidak memiliki shared global state yang kompleks.
* Membutuhkan refetch data saat navigasi halaman.

#### AI Validation Strategy

Output AI divalidasi menggunakan **Zod Schema Validation** sebelum digunakan oleh sistem.

Keuntungan:

* Menjamin konsistensi format data.
* Mengurangi risiko error akibat respons AI yang tidak sesuai.

Keterbatasan:

* Membutuhkan retry ketika output AI gagal divalidasi.
* Menambah kompleksitas pada alur integrasi AI.

## Impact

Learning Planner AI membantu pengguna dalam:

* Menyusun rencana belajar secara lebih terstruktur.
* Mengurangi waktu yang dibutuhkan untuk membuat jadwal belajar.
* Menyesuaikan kembali jadwal belajar ketika terdapat tugas yang tertunda.
* Memantau perkembangan belajar melalui progress tracking mingguan.

Dari sisi teknis, proyek ini juga menunjukkan kemampuan dalam:

* Merancang aplikasi full-stack berbasis React dan Express.
* Mengintegrasikan Large Language Model (LLM) ke dalam workflow aplikasi.
* Mendesain validasi output AI menggunakan schema validation.
* Menerapkan Docker untuk mempermudah deployment dan pengembangan lokal.
