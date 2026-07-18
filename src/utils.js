/**
 * Generates an array of the last 7 days (including today)
 * Returns an array of strings in 'YYYY-MM-DD' format.
 */
export function getLast7Days() {
  const days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(formatDateString(d));
  }
  return days; // [6 days ago, 5 days ago, ... today]
}

/**
 * Formats a Date object to 'YYYY-MM-DD'
 */
export function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a friendly name for a date string ('YYYY-MM-DD')
 * e.g., 'Today', 'Yesterday', or 'Monday'
 */
export function getFriendlyDayName(dateString) {
  const today = new Date();
  const targetDate = new Date(dateString + 'T12:00:00'); // set to noon to avoid timezone shift

  const todayStr = formatDateString(today);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = formatDateString(yesterday);

  if (dateString === todayStr) return 'Today';
  if (dateString === yesterdayStr) return 'Yesterday';

  // Return day of week
  return targetDate.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Formats the date to 'MMM D' (e.g. 'Jul 10')
 */
export function getShortDateName(dateString) {
  const targetDate = new Date(dateString + 'T12:00:00');
  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Computes score out of 10 for Plan of Life (Yes/No boolean values)
 */
export function computeAverage(scoresObj) {
  if (!scoresObj) return 0;
  const values = Object.values(scoresObj);
  if (values.length === 0) return 0;
  
  // Count how many are true (Yes)
  const sum = values.reduce((acc, curr) => acc + (curr ? 1 : 0), 0);
  return sum;
}
