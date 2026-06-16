export function scheduledTimeToUtcMs(
  dateStr: string,
  timeStr: string,
  offsetMinutes: number | null,
): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.slice(0, 5).split(':').map(Number);
  if (offsetMinutes != null) {
    return Date.UTC(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0) - offsetMinutes * 60 * 1000;
  }
  return new Date(year!, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0).getTime();
}
