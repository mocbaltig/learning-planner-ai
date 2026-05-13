/**
 * return the date of monday in around `date`
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust for sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * return date of the sunday in around `date`
 */
function getWeekend(date) {
  const start = new Date(getWeekStart(date));
  start.setDate(start.getDate() + 6);
  return start.toISOString().split('T')[0];
}

/**
 * return a string of week in ISO: `2026-W15`
 */
function getWeekString(date) {
  const d = new Date(date);
  const startOfTheYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - startOfTheYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfTheYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * return current week start
 */
const getCurrentWeekStart = () => getWeekStart(new Date());

/**
 * return current week string in ISO: `2026-W15`
 */
const getCurrentWeek = () => getWeekString(new Date());

module.exports = {
  getWeekStart,
  getWeekend,
  getWeekString,
  getCurrentWeekStart,
  getCurrentWeek,
};
