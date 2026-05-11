import 'server-only';

import { count, desc, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user, session, account } from '@/db/schema';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithStats = AdminUser & {
  totalSessions: number;
  activeSessions: number;
  lastActiveAt: Date | null;
  provider: string;
};

export type UsageStats = {
  totalUsers: number;
  totalSessions: number;
  activeSessions: number;
  newUsersLast7d: number;
  newUsersLast30d: number;
  newSessionsLast7d: number;
  signupsByDay: { day: string; count: number }[];
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function fetchAllUsers(): Promise<AdminUser[]> {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: user.phoneNumberVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
}

export async function fetchUsageStats(): Promise<UsageStats> {
  const now = new Date();
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  const [[userCount], [sessionCount], [activeCount], [new7d], [new30d], [newSessions7d]] =
    await Promise.all([
      db.select({ value: count() }).from(user),
      db.select({ value: count() }).from(session),
      db.select({ value: count() }).from(session).where(gte(session.expiresAt, now)),
      db.select({ value: count() }).from(user).where(gte(user.createdAt, sevenDaysAgo)),
      db.select({ value: count() }).from(user).where(gte(user.createdAt, thirtyDaysAgo)),
      db.select({ value: count() }).from(session).where(gte(session.createdAt, sevenDaysAgo)),
    ]);

  // Signups per day for the last 30 days
  const byDay = await db
    .select({
      day: sql<string>`to_char(${user.createdAt}, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(user)
    .where(gte(user.createdAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${user.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${user.createdAt}, 'YYYY-MM-DD')`);

  return {
    totalUsers: userCount?.value ?? 0,
    totalSessions: sessionCount?.value ?? 0,
    activeSessions: activeCount?.value ?? 0,
    newUsersLast7d: new7d?.value ?? 0,
    newUsersLast30d: new30d?.value ?? 0,
    newSessionsLast7d: newSessions7d?.value ?? 0,
    signupsByDay: byDay.map(r => ({ day: r.day, count: Number(r.count) })),
  };
}

export async function fetchUserStats(): Promise<UserWithStats[]> {
  const now = new Date();

  // All users with their account provider
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: user.phoneNumberVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  // Per-user session aggregates in one query
  const sessionAggs = await db
    .select({
      userId: session.userId,
      total: count(),
      active: count(
        sql`CASE WHEN ${session.expiresAt} >= ${now.toISOString()} THEN 1 END`,
      ),
      lastActive: sql<Date | null>`max(${session.updatedAt})`,
    })
    .from(session)
    .groupBy(session.userId);

  // Per-user provider (first account row)
  const providers = await db
    .select({ userId: account.userId, providerId: account.providerId })
    .from(account);

  const sessionMap = new Map(sessionAggs.map(s => [s.userId, s]));
  const providerMap = new Map<string, string>();
  for (const p of providers) {
    if (!providerMap.has(p.userId)) providerMap.set(p.userId, p.providerId);
  }

  return users.map(u => {
    const agg = sessionMap.get(u.id);
    return {
      ...u,
      totalSessions: Number(agg?.total ?? 0),
      activeSessions: Number(agg?.active ?? 0),
      lastActiveAt: agg?.lastActive ?? null,
      provider: providerMap.get(u.id) ?? 'credential',
    };
  });
}
