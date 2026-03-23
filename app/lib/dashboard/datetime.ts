export function formatRelativeTime(
  date: Date | string | null,
  options?: { absentLabel?: string },
): string {
  const absent = options?.absentLabel ?? '—';
  if (!date) return absent;

  const ms = Date.now() - new Date(date).getTime();
  if (ms < 0) {
    const absSec = Math.floor(-ms / 1000);
    if (absSec < 60) return 'In <1m';
    const absMin = Math.floor(absSec / 60);
    if (absMin < 60) return `In ${absMin}m`;
    const absHr = Math.floor(absMin / 60);
    if (absHr < 24) return `In ${absHr}h`;
    return `In ${Math.floor(absHr / 24)}d`;
  }
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTimestamp(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString();
}
