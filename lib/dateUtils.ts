/**
 * Format a date string to a readable format
 * Example: "2025-12-21" -> "Sun, Dec 21"
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format a time string from 24-hour to 12-hour format
 * Example: "14:30" -> "2:30 PM"
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Format a full date with time
 * Example: "2025-12-21T14:30:00" -> "Sun, Dec 21 at 2:30 PM"
 */
export const formatDateTime = (dateString: string, timeString?: string): string => {
  const formattedDate = formatDate(dateString);
  if (timeString) {
    return `${formattedDate} at ${formatTime(timeString)}`;
  }
  return formattedDate;
};

/**
 * Get ISO date string (YYYY-MM-DD)
 */
export const formatISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

/**
 * Check if a date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return formatISODate(date) === formatISODate(today);
};

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.floor(Math.abs(diffMs) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';

  if (diffSec < 60) {
    return `${prefix}just now`;
  } else if (diffMin < 60) {
    return `${prefix}${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'}${suffix}`;
  } else if (diffHour < 24) {
    return `${prefix}${diffHour} ${diffHour === 1 ? 'hour' : 'hours'}${suffix}`;
  } else {
    return `${prefix}${diffDay} ${diffDay === 1 ? 'day' : 'days'}${suffix}`;
  }
};
