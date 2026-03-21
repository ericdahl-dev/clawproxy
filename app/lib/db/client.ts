import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';

import { sql } from '@/app/lib/db';

export const db = drizzle(sql);
