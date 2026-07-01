const PARIS_TZ = 'Europe/Paris';

/**
 * Convert a Paris wall-clock date + time to a UTC ISO string.
 *
 * Browser-timezone-INDEPENDENT (mirrors the backend's
 * AvailabilityService.parisToUtc). Handles DST: 10:40 in summer (CEST, +2) →
 * 08:40Z, in winter (CET, +1) → 09:40Z.
 *
 * @param dateStr Paris day, `YYYY-MM-DD`
 * @param timeStr Paris time, `HH:MM`
 */
export function parisToUtcIso(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');
  // Interpret the selected wall-clock time as if it were UTC…
  const asUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), 0, 0);
  // …then shift by the Paris UTC offset in effect at that instant (handles DST).
  const parisWall = new Date(new Date(asUtc).toLocaleString('en-US', { timeZone: PARIS_TZ })).getTime();
  const utcWall = new Date(new Date(asUtc).toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const offsetMs = parisWall - utcWall;
  return new Date(asUtc - offsetMs).toISOString();
}
