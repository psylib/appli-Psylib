const PARIS_TZ = 'Europe/Paris';

/** Paris UTC offset (ms) in effect at the given instant. Positive = ahead of UTC. */
function parisOffsetMs(instant: number): number {
  const parisWall = new Date(new Date(instant).toLocaleString('en-US', { timeZone: PARIS_TZ })).getTime();
  const utcWall = new Date(new Date(instant).toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  return parisWall - utcWall;
}

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
  return new Date(asUtc - parisOffsetMs(asUtc)).toISOString();
}

/**
 * Convert a `<input type="datetime-local">` value (`YYYY-MM-DDTHH:MM`), interpreted
 * as a **Paris** wall-clock time, to a UTC ISO string. Browser/server-TZ-independent.
 * Returns '' for an empty/invalid value.
 */
export function parisDateTimeLocalToUtcIso(value: string): string {
  if (!value) return '';
  const [dateStr, timeStr] = value.split('T');
  if (!dateStr || !timeStr) return '';
  return parisToUtcIso(dateStr, timeStr.slice(0, 5));
}

/**
 * Convert a UTC ISO string to a `<input type="datetime-local">` value
 * (`YYYY-MM-DDTHH:MM`) expressed in **Paris** wall-clock time, so the input shows
 * the practitioner's local time regardless of the browser timezone.
 */
export function utcIsoToParisDateTimeLocal(iso: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  // en-CA gives ISO-like date parts; guard the 24:00 hour edge from some engines.
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

/** Current instant as a Paris `<input type="datetime-local">` value (`YYYY-MM-DDTHH:MM`). */
export function parisNowDateTimeLocal(): string {
  return utcIsoToParisDateTimeLocal(new Date().toISOString());
}
