// utils/parseTimestamp.ts

/**
 * Robustly converts any Firestore timestamp shape to a JS Date.
 *
 * Handles 3 cases the backend may produce:
 *   1. Firestore Timestamp object  — { seconds: number, nanoseconds: number }
 *   2. Plain unix millis number    — 1718000000000
 *   3. ISO string                  — "2024-06-10T08:30:00Z"
 *
 * Returns null if the value is missing or unparseable.
 */
export function parseTimestamp(ts: any): Date | null {
  if (!ts) return null;

  // Case 1: Firestore Timestamp object (has .toDate() via SDK, or raw seconds)
  if (typeof ts === 'object') {
    if (typeof ts.toDate === 'function') return ts.toDate();          // SDK Timestamp
    if (typeof ts.seconds === 'number')  return new Date(ts.seconds * 1000); // raw object
  }

  // Case 2: Unix millis number
  if (typeof ts === 'number') return new Date(ts);

  // Case 3: ISO string
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Format for history list: "6/10 14:05"
 */
export function formatShort(ts: any): string {
  const d = parseTimestamp(ts);
  if (!d) return '—';
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Format for home screen recent list: "Jun 10, 2024"
 */
export function formatDate(ts: any): string {
  const d = parseTimestamp(ts);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}