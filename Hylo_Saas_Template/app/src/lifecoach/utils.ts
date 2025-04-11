/**
 * Gets the date range for the current week (Sunday to Saturday)
 */
export function getDateRangeForWeek(date = new Date()): { startDate: Date; endDate: Date } {
  const currentDay = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days to subtract to get to the start of the week (Sunday)
  const daysToSunday = currentDay;
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - daysToSunday);
  startDate.setHours(0, 0, 0, 0);
  
  // Calculate days to add to get to the end of the week (Saturday)
  const daysToSaturday = 6 - currentDay;
  const endDate = new Date(date);
  endDate.setDate(date.getDate() + daysToSaturday);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Format a date in a human-readable format
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Calculate the percentage of completed check-ins
 */
export function calculateCompletionPercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
} 