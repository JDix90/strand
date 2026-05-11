import Link from 'next/link';
import { requireAdmin } from '@/lib/adminGuard';

export const metadata = { title: 'Admin — Languini' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="border-b border-border bg-surface px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-ink-secondary hover:text-ink">
            ← Languini
          </Link>
          <span className="text-border select-none">|</span>
          <span className="text-sm font-bold text-ink">Admin</span>
        </div>
        <p className="text-xs text-ink-secondary truncate max-w-xs" title={user.email}>
          {user.email}
        </p>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
