import 'server-only';

import { auth } from '@/app/lib/auth/server';

export async function requireAdminUser() {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
