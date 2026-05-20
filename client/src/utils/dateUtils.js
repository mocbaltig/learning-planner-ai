/**
 * Hitung Senin awal minggu ini (YYYY-MM-DD).
 */
export function getThisMonday() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon …
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/**
 * Snap tanggal mana pun ke Senin di minggu yang sama.
 * @param {string} dateStr - format YYYY-MM-DD
 * @returns {string} - Senin minggu tersebut, format YYYY-MM-DD
 */
export function snapToMonday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00'); // hindari timezone shift
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
