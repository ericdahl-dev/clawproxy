import { requestPasswordReset } from '@/app/lib/auth/server';
import { readJson, stringField } from '../_shared';

export async function POST(request: Request) {
  const body = await readJson(request);
  await requestPasswordReset(stringField(body, 'email'));
  return Response.json({ ok: true });
}
