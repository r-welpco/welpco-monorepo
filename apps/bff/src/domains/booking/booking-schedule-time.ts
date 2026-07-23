export function scheduledTimeToUtcMs(
  dateStr: string,
  timeStr: string,
  offsetMinutes: number | null,
  timeZone?: string | null,
): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.slice(0, 5).split(':').map(Number);
  if (timeZone) {
    const target = Date.UTC(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0);
    let candidate = target;
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    for (let i = 0; i < 3; i++) {
      const parts = Object.fromEntries(
        formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]),
      );
      const represented = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
      );
      candidate += target - represented;
    }
    return candidate;
  }
  if (offsetMinutes != null) {
    return Date.UTC(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0) - offsetMinutes * 60 * 1000;
  }
  return new Date(year!, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0).getTime();
}

export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}
