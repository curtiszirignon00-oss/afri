// backend/src/services/real-portfolio/dates.ts
// Utilitaires de dates 'YYYY-MM-DD' (UTC), sans dépendance.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(s: string): boolean {
  const m = ISO_RE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function fromIso(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export function addDays(s: string, n: number): string {
  const d = fromIso(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}

export function isWeekend(s: string): boolean {
  const day = fromIso(s).getUTCDay();
  return day === 0 || day === 6;
}

/** Vendredi précédent si la date tombe un week-end. */
export function previousWeekday(s: string): string {
  let d = s;
  while (isWeekend(d)) d = addDays(d, -1);
  return d;
}

/** Itère chaque jour de from à to inclus. */
export function* eachDay(from: string, to: string): Generator<string> {
  for (let d = from; d <= to; d = addDays(d, 1)) yield d;
}
