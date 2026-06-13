/**
 * Hitung Senin awal minggu ini (YYYY-MM-DD).
 */
export function getThisMonday() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon …
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Snap tanggal mana pun ke Senin di minggu yang sama.
 * @param {string} dateStr - format YYYY-MM-DD
 * @returns {string} - Senin minggu tersebut, format YYYY-MM-DD
 */
export function snapToMonday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? 1 : 1 - day;
  date.setDate(date.getDate() + diff);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Konversi YYYY-MM-DD ke ISO week string (YYYY-Wxx).
 * @param {string} dateStr - format YYYY-MM-DD
 * @returns {string} - contoh: "2026-W21"
 */
export function toISOWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const startOfYear = new Date(y, 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${y}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Konversi ISO week string ke rentang tanggal.
 * @param {string} isoWeek - contoh: "2026-W21"
 * @returns {{ start: string, end: string } | null} - { start: "2026-05-18", end: "2026-05-24" }
 */
export function isoWeekToRange(isoWeek) {
  const match = isoWeek.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // Senin minggu pertama ISO (berisi 4 Jan)
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - day + 1);

  // Tambah (week - 1) minggu
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (dt) => {
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  return { start: fmt(monday), end: fmt(sunday) };
}
