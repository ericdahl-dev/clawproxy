export type AdminJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

function parseAdminBody(text: string, status: number): { ok: true; body: unknown } | { error: string } {
  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    if (text.trimStart().startsWith('<')) {
      return {
        error: `Got an HTML page instead of JSON (${status}). Try refreshing; if this persists, the request may have been redirected (e.g. session or proxy).`,
      };
    }
    return { error: `Invalid response from server (${status}).` };
  }

  if (typeof raw !== 'object' || raw === null) {
    return { error: 'Invalid response from server.' };
  }

  return { ok: true, body: raw };
}

export async function adminJson<T extends Record<string, unknown>>(
  path: string,
  init?: RequestInit,
): Promise<AdminJsonResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, credentials: 'same-origin' });
  } catch {
    return { ok: false, status: 0, error: 'Failed to fetch' };
  }

  const text = await res.text();
  const parsed = parseAdminBody(text, res.status);
  if ('error' in parsed) {
    return { ok: false, status: res.status, error: parsed.error };
  }

  const body = parsed.body as { ok?: boolean; error?: string };

  if (!res.ok) {
    const err =
      typeof body.error === 'string' ? body.error : `Request failed (${res.status}).`;
    return { ok: false, status: res.status, error: err };
  }

  if (body.ok !== true) {
    const err = typeof body.error === 'string' ? body.error : 'Request failed.';
    return { ok: false, status: res.status, error: err };
  }

  return { ok: true, data: parsed.body as T };
}
