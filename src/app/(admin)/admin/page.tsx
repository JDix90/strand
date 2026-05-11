import { requireAdmin } from '@/lib/adminGuard';
import { fetchAllUsers, fetchUsageStats, fetchUserStats } from '@/lib/adminData';
import { AdminTabs } from './AdminTabs';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireAdmin();

  const [users, usageStats, userStats] = await Promise.all([
    fetchAllUsers(),
    fetchUsageStats(),
    fetchUserStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-secondary mt-1">
          {usageStats.totalUsers} registered user{usageStats.totalUsers !== 1 ? 's' : ''} ·{' '}
          {usageStats.activeSessions} active session{usageStats.activeSessions !== 1 ? 's' : ''}
        </p>
      </div>

      <AdminTabs users={users} usageStats={usageStats} userStats={userStats} />
    </div>
  );
}
