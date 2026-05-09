# ADR-004: Pemilihan Tailwind CSS sebagai CSS Framework

## Status
Accepted

## Konteks

Frontend AI Learning Plan dibangun menggunakan React 19 + Vite. Tim perlu memilih pendekatan styling yang efisien, konsisten, dan dapat dipelajari dengan cepat oleh seluruh anggota tim.

Kebutuhan styling yang diidentifikasi:
- Komponen UI yang konsisten (form, button, card, navigation, badge)
- Layout yang responsif (sidebar + main content untuk dashboard)
- Dark mode atau tema yang modern untuk kesan profesional
- Waktu pengembangan yang cepat (timeline capstone terbatas)
- Integrasi mulus dengan build tool Vite

Kandidat yang dievaluasi:

| Pendekatan | Produktivitas | Konsistensi | Bundle Size | Learning Curve |
|---|---|---|---|---|
| **Tailwind CSS** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Kecil (purge) | Sedang |
| Bootstrap | ⭐⭐⭐⭐ | ⭐⭐⭐ | Besar | Rendah |
| Vanilla CSS + CSS Modules | ⭐⭐⭐ | ⭐⭐ | Tergantung tim | Rendah |
| Chakra UI / MUI | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Sedang-Besar | Sedang |
| Styled-components | ⭐⭐⭐ | ⭐⭐⭐ | Sedang | Sedang |

Konteks tambahan:
- Tim menggunakan Vite sebagai build tool, yang memiliki plugin resmi `@tailwindcss/vite`
- Proyek capstone membutuhkan tampilan yang modern dan profesional
- Tailwind v4 (yang digunakan) terintegrasi langsung ke Vite tanpa konfigurasi `tailwind.config.js` terpisah
- Paket yang terpasang: `tailwindcss@^4.2.4` dan `@tailwindcss/vite@^4.2.4`

## Keputusan

Menggunakan **Tailwind CSS v4** sebagai CSS framework, diintegrasikan via plugin `@tailwindcss/vite`.

Tailwind digunakan langsung di JSX component dengan utility classes, tanpa wrapper library komponen tambahan (seperti shadcn/ui atau DaisyUI) untuk menjaga kontrol penuh atas styling.

## Alasan

1. **Produktivitas tinggi dengan utility-first approach**: Developer dapat melihat tampilan komponen langsung dari kode JSX tanpa berpindah ke file CSS terpisah. Ini mempercepat iterasi UI yang sangat dibutuhkan dalam timeline capstone.

2. **Konsistensi desain by default**: Tailwind menyediakan design tokens yang sudah terstandarisasi (spacing, colors, typography, shadows). Tanpa Tailwind, anggota tim yang berbeda cenderung menggunakan nilai arbitrary yang berbeda (misal: `padding: 12px` vs `padding: 14px`), menghasilkan UI yang tidak konsisten.

3. **Bundle CSS yang sangat kecil**: Tailwind v4 secara otomatis menghapus class yang tidak digunakan saat build. Hanya CSS yang benar-benar dipakai yang masuk ke bundle produksi, tidak seperti Bootstrap yang memasukkan seluruh library.

4. **Integrasi Vite yang mulus**: Plugin `@tailwindcss/vite` menghilangkan kebutuhan konfigurasi PostCSS manual. Cukup tambahkan plugin ke `vite.config.js` dan import di CSS entry point.

5. **Tailwind v4 — Zero config**: Tidak memerlukan file `tailwind.config.js`. Konfigurasi tema dapat dilakukan langsung di CSS menggunakan `@theme` directive, mengurangi overhead setup.

6. **Responsif by default**: Breakpoint prefix (`sm:`, `md:`, `lg:`) memudahkan pembuatan layout responsif seperti sidebar + main content dashboard tanpa menulis media queries manual.

7. **Ekosistem dan adopsi industri yang tinggi**: Tailwind adalah CSS framework paling populer di industri saat ini. Mempelajari Tailwind dalam konteks capstone memberikan nilai tambah bagi portfolio anggota tim.

## Konsekuensi

**Positif:**
- Tidak ada context switch antara file `.jsx` dan file `.css` saat mengerjakan komponen
- Perubahan styling bisa dilakukan langsung di JSX, membuat code review lebih mudah (perubahan visual terlihat dalam satu file)
- Design system yang konsisten sejak hari pertama tanpa effort tambahan
- Tidak ada naming collision CSS (tidak ada class `.card` yang override satu sama lain)

**Negatif / Risiko:**
- **Class yang verbose**: Komponen kompleks dapat memiliki className yang sangat panjang (20+ utility classes). Mitigasi: ekstrak ke komponen React yang reusable atau gunakan variabel template string
- **Learning curve awal**: Developer yang terbiasa dengan vanilla CSS atau Bootstrap perlu waktu untuk familiar dengan naming convention Tailwind (`mt-4` = `margin-top: 1rem`)
- **Tailwind v4 masih relatif baru**: Beberapa tutorial dan plugin ekosistem masih menggunakan v3. Tim perlu memastikan menggunakan dokumentasi yang sesuai versi
- **Tidak ada komponen siap pakai**: Berbeda dengan Bootstrap atau MUI, Tailwind hanya menyediakan utilities. Seluruh komponen (modal, dropdown, dll) harus dibangun dari scratch atau menggunakan library tambahan seperti Headless UI

**Keputusan terkait yang ditunda:**
- Pertimbangan menggunakan component library berbasis Tailwind (shadcn/ui, DaisyUI) jika kebutuhan komponen komplex meningkat di cycle berikutnya
- Penggunaan `@apply` directive untuk mengekstrak class yang sering berulang ke file CSS terpisah, jika className di JSX mulai terlalu panjang
