export type PeriodRecord = { start_date: string; end_date?: string | null };

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return timestamp;
}

export function averageCycleLength(records: PeriodRecord[], chosenCycleDays: number | null) {
  const dates = [...new Set(records.map((record) => record.start_date))]
    .map((value) => ({ value, timestamp: utcDay(value) }))
    .filter((entry): entry is { value: string; timestamp: number } => entry.timestamp !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (dates.length < 2) return chosenCycleDays;
  const recent = dates.slice(-7);
  const intervals = recent.slice(1).map((entry, index) => {
    const previous = recent[index];
    return previous ? Math.round((entry.timestamp - previous.timestamp) / DAY_MS) : 0;
  });
  if (intervals.length === 0 || intervals.some((days) => days <= 0)) return chosenCycleDays;
  return Math.round(intervals.reduce((sum, days) => sum + days, 0) / intervals.length);
}

export function predictNextPeriod(records: PeriodRecord[], chosenCycleDays: number | null) {
  const dates = [...new Set(records.map((record) => record.start_date))]
    .map((value) => ({ value, timestamp: utcDay(value) }))
    .filter((entry): entry is { value: string; timestamp: number } => entry.timestamp !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
  const cycleDays = averageCycleLength(records, chosenCycleDays);
  const last = dates.at(-1);
  if (!last || !cycleDays || cycleDays <= 0) return null;
  const next = new Date(last.timestamp + cycleDays * DAY_MS);
  return { date: next.toISOString().slice(0, 10), cycleDays, lastStart: last.value };
}

export function estimatePeriodDates(start: string | null, durationDays: number | null) {
  if (!start) return [];
  const timestamp = utcDay(start);
  if (timestamp === null) return [];
  const count = durationDays && durationDays > 0 ? durationDays : 1;
  return Array.from({ length: count }, (_, index) => new Date(timestamp + index * DAY_MS).toISOString().slice(0, 10));
}