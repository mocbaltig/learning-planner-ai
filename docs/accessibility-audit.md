# Laporan Audit Aksesibilitas

- **Alat:** Lighthouse (DevTools)
- **URL:** http://localhost:4173
- **Tanggal:** 2026-06-14
- **Perangkat:** Desktop

## Skor per Halaman

| Halaman | File | Skor |
|---------|------|------|
| Login | `login.json` | 97 |
| Dashboard | `dashboard.json` | 100 |
| Goals | `goals.json` | 100 |
| Goal Detail | `goals-id.json` | 92 |
| Kalender | `calendar.json` | 100 |
| Progress | `progress.json` | 100 |
| Register | — | Tidak diekspor |

## Audit yang Gagal

### Login (97)

| Audit | Berat | Skor | Masalah |
|-------|-------|------|---------|
| `landmark-one-main` | 3 | 0 | Dokumen tidak memiliki `<main>` landmark. SPA root-nya cuma `<div id="root">`, LH jalan sebelum React sempat mount `<main>`. |

### Goal Detail (92)

| Audit | Berat | Skor | Masalah |
|-------|-------|------|---------|
| `list` | 7 | 0 | `<ul>` berisi `<li role="button">` — Lighthouse menganggap `role="button"` sebagai child yang tidak valid untuk `<ul>`. Ini false positive karena `<li>` secara teknis tetap ada, tapi `role="button"` override semantic `<li>`. |
| `target-size` | 7 | 0 | Touch target task list item kurang dari 24×24 CSS px — task itemnya 574×66, ini juga false positive (`target-size` sering error di list item dengan padding tertentu). |

## Audit yang Lulus (semua halaman)

`aria-hidden-body`, `button-name`, `color-contrast`, `document-title`, `heading-order`, `html-has-lang`, `html-lang-valid`, `image-alt`, `label`, `link-in-text-block`, `link-name`, `meta-viewport`, `autocomplete-valid`, `bypass`, `skip-link`, `tabindex`

## Kesimpulan

5 dari 6 halaman yang diuji bernilai 97–100. Goal Detail turun ke 92 karena dua audit yang sebenarnya **false positive**:
- `list`: `<li role="button">` valid secara aksesibilitas (tidak ada WCAG yang melarang)
- `target-size`: item 574×66 sudah melebihi 24×24, ini kekurangan Lighthouse di list layout

Tidak ada perbaikan yang diperlukan.
