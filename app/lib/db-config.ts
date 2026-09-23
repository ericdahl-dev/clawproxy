export function postgresSslOption(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  const sslMode = parsed.searchParams.get('sslmode');
  if (sslMode === 'require') return 'require';
  if (parsed.hostname.includes('neon.tech')) return 'require';
  return false;
}
