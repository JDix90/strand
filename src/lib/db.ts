import 'server-only';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/db/schema';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:15432/languini';

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });
