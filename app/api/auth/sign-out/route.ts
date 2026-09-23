import { SESSION_COOKIE_NAME } from '@/app/lib/auth/constants';
import { signOutSession } from '@/app/lib/auth/server';
import { clearSessionResponse } from '../_shared';

export async function POST(request: Request) {
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);

  await signOutSession(token);
  return clearSessionResponse();
}
