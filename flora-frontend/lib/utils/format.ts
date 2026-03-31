import { format, formatDistanceToNow } from "date-fns";

/**
 * Formats a currency amount to the standard TMT format (e.g., "150.00 TMT")
 */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} TMT`;
}

/**
 * Formats an ISO date string into a human-readable date (e.g., "March 22, 2026")
 */
export function formatDate(dateString: string | Date): string {
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    return String(dateString);
  }
}

/**
 * Formats an ISO date string into a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | Date): string {
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return String(dateString);
  }
}

/**
 * Formats seller working hours into a human-readable string
 * Example: "Mon–Fri 09:00–18:00"
 */
export function formatWorkingHours(hours: any[]): string {
  if (!hours || hours.length === 0) return "Working hours not specified";

  // Group by time range to find contiguous days
  // Simplified for MVP: handle standard ranges
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Find first open day
  const openDays = hours.filter(h => !h.is_closed).sort((a, b) => a.day_of_week - b.day_of_week);
  
  if (openDays.length === 0) return "Closed";
  
  const startDay = days[openDays[0].day_of_week];
  const endDay = days[openDays[openDays.length - 1].day_of_week];
  const openTime = openDays[0].open_time?.substring(0, 5) || "00:00";
  const closeTime = openDays[0].close_time?.substring(0, 5) || "00:00";

  if (openDays.length === 7) return `Daily ${openTime}–${closeTime}`;
  if (startDay === endDay) return `${startDay} ${openTime}–${closeTime}`;
  
  return `${startDay}–${endDay} ${openTime}–${closeTime}`;
}
