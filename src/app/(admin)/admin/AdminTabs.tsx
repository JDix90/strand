'use client';

import { useState } from 'react';
import type { AdminUser, UsageStats, UserWithStats } from '@/lib/adminData';

type Tab = 'users' | 'usage' | 'user-stats';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-2 text-sm font-semibold rounded-lg transition-colors',
        active
          ? 'bg-brand text-white'
          : 'text-ink-secondary hover:text-ink hover:bg-surface-muted',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warn' }) {
  const cls = {
    default: 'bg-surface-muted text-ink-secondary',
    success: 'bg-green-100 text-green-800',
    warn: 'bg-amber-100 text-amber-800',
  }[variant];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 space-y-1">
      <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-ink-secondary">{sub}</p>}
    </div>
  );
}

function UsersTab({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.phoneNumber ?? '').includes(search),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-ink-secondary">{users.length} total users</p>
        <input
          type="search"
          placeholder="Search email, name, phone…"
          className="rounded-xl border border-border px-3 py-2 text-sm bg-surface w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-secondary">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Verified</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-secondary">
                  No users match.
                </td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-ink-secondary">{u.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-secondary">
                    {u.phoneNumber ?? <span className="text-border">—</span>}
                  </td>
                  <td className="px-4 py-3 space-x-1">
                    {u.emailVerified && <Badge variant="success">Email</Badge>}
                    {u.phoneNumberVerified && <Badge variant="success">Phone</Badge>}
                    {!u.emailVerified && !u.phoneNumberVerified && <Badge variant="warn">None</Badge>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-secondary text-xs">
                    {u.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsageStatsTab({ stats }: { stats: UsageStats }) {
  // Build last-30-days day labels and fill zeros for missing days
  const days: { day: string; count: number }[] = [];
  const today = new Date();
  const dayMap = new Map(stats.signupsByDay.map(d => [d.day, d.count]));
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key, count: dayMap.get(key) ?? 0 });
  }

  const maxCount = Math.max(...days.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="New (7d)" value={stats.newUsersLast7d} />
        <StatCard label="New (30d)" value={stats.newUsersLast30d} />
        <StatCard label="Total sessions" value={stats.totalSessions} />
        <StatCard label="Active sessions" value={stats.activeSessions} sub="not yet expired" />
        <StatCard label="New sessions (7d)" value={stats.newSessionsLast7d} />
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
        <p className="text-sm font-semibold text-ink">Signups — last 30 days</p>
        <div className="flex items-end gap-0.5 h-28">
          {days.map(d => {
            const pct = d.count / maxCount;
            return (
              <div
                key={d.day}
                className="relative flex-1 group"
                title={`${d.day}: ${d.count}`}
              >
                <div
                  className="w-full bg-brand rounded-t opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{ height: `${Math.max(pct * 100, d.count > 0 ? 8 : 2)}%` }}
                />
                {/* tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-ink text-surface text-xs rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                  {d.day.slice(5)}: {d.count}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-ink-secondary">
          <span>{days[0]?.day.slice(5)}</span>
          <span>{days[days.length - 1]?.day.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}

function UserStatsTab({ users }: { users: UserWithStats[] }) {
  const [sort, setSort] = useState<'sessions' | 'active' | 'joined'>('joined');
  const sorted = [...users].sort((a, b) => {
    if (sort === 'sessions') return b.totalSessions - a.totalSessions;
    if (sort === 'active') return b.activeSessions - a.activeSessions;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const sortBtnClass = (id: typeof sort) =>
    `text-xs px-2 py-1 rounded font-semibold transition-colors ${sort === id ? 'bg-brand text-white' : 'text-ink-secondary hover:text-ink'}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-ink-secondary font-semibold">Sort:</span>
        <button type="button" onClick={() => setSort('joined')} className={sortBtnClass('joined')}>Joined</button>
        <button type="button" onClick={() => setSort('sessions')} className={sortBtnClass('sessions')}>Total sessions</button>
        <button type="button" onClick={() => setSort('active')} className={sortBtnClass('active')}>Active sessions</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-secondary">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Provider</th>
              <th className="px-4 py-3 font-semibold text-right">Total sessions</th>
              <th className="px-4 py-3 font-semibold text-right">Active</th>
              <th className="px-4 py-3 font-semibold">Last active</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-elevated transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-ink-secondary">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge>{u.provider}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono">{u.totalSessions}</td>
                <td className="px-4 py-3 text-right">
                  {u.activeSessions > 0 ? (
                    <Badge variant="success">{u.activeSessions}</Badge>
                  ) : (
                    <span className="text-ink-secondary font-mono">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-ink-secondary whitespace-nowrap">
                  {u.lastActiveAt ? u.lastActiveAt.toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-ink-secondary whitespace-nowrap">
                  {u.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminTabs({
  users,
  usageStats,
  userStats,
}: {
  users: AdminUser[];
  usageStats: UsageStats;
  userStats: UserWithStats[];
}) {
  const [tab, setTab] = useState<Tab>('users');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
        <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
          Users
        </TabButton>
        <TabButton active={tab === 'usage'} onClick={() => setTab('usage')}>
          Usage Stats
        </TabButton>
        <TabButton active={tab === 'user-stats'} onClick={() => setTab('user-stats')}>
          User Stats
        </TabButton>
      </div>

      {tab === 'users' && <UsersTab users={users} />}
      {tab === 'usage' && <UsageStatsTab stats={usageStats} />}
      {tab === 'user-stats' && <UserStatsTab users={userStats} />}
    </div>
  );
}
