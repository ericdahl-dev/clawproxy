import 'server-only';

import { auth } from '@/app/lib/auth/server';
import { UnauthorizedError } from '@/app/lib/auth/unauthorized-error';

export async function requireAdminUser() {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}
