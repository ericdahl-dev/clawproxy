import 'server-only';

export function headersToObject(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}
