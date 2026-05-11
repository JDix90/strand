'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

const linkBase =
  'block w-full rounded-xl px-3 py-2 text-sm font-semibold text-left transition-[color,background-color,border-color,box-shadow]';

const linkState = (pathname: string, href: string) =>
  pathname === href
    ? `${linkBase} bg-brand text-white border border-brand shadow-[var(--shadow-card)]`
    : `${linkBase} text-ink-secondary bg-surface-elevated border border-border shadow-[var(--shadow-card)] hover:text-ink hover:bg-surface hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]`;

export function Sidebar({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const goHome = () => {
    onNavigate?.();
    if (pathname === '/') {
      router.refresh();
      return;
    }
    router.push('/');
  };

  return (
    <aside className="h-full bg-surface border-r border-border p-4">
      <button
        type="button"
        onClick={goHome}
        className="w-full text-left rounded-xl px-3 py-3 bg-surface-elevated border border-border hover:border-border-strong"
      >
        <p className="text-lg font-bold text-ink">Languini</p>
        <p className="text-xs text-ink-secondary">Phase 1</p>
      </button>

      <div className="mt-6 space-y-2">
        <button
          type="button"
          onClick={goHome}
          className={`${linkBase} text-ink-secondary bg-surface-elevated border border-border shadow-[var(--shadow-card)] hover:text-ink hover:bg-surface hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]`}
        >
          Home
        </button>

        {!isPending &&
          (session?.user ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={async () => {
                  onNavigate?.();
                  await authClient.signOut();
                  router.push('/');
                  router.refresh();
                }}
                className={`${linkBase} text-ink-secondary bg-surface-elevated border border-border shadow-[var(--shadow-card)] hover:text-ink hover:bg-surface hover:border-border-strong hover:shadow-[var(--shadow-card-hover)] w-full`}
              >
                Sign out
              </button>
              <p className="px-3 text-xs text-ink-secondary truncate" title={session.user.email}>
                {session.user.email}
              </p>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`${linkBase} text-xs text-ink-secondary bg-surface-elevated border border-border hover:text-ink hover:bg-surface hover:border-border-strong`}
                  onClick={onNavigate}
                >
                  Admin
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`${linkBase} text-ink-secondary bg-surface-elevated border border-border shadow-[var(--shadow-card)] hover:text-ink hover:bg-surface hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]`}
              onClick={onNavigate}
            >
              Sign In / Register
            </Link>
          ))}

        <nav aria-labelledby="sidebar-lessons-heading" className="mt-5 space-y-2 border-t border-border pt-4">
          <h2
            id="sidebar-lessons-heading"
            className="px-3 mb-1 text-xs font-semibold tracking-wide text-ink-secondary cursor-default select-none"
          >
            Lessons
          </h2>
          <Link href="/case-practice" className={linkState(pathname, '/case-practice')} onClick={onNavigate}>
            Case Practice
          </Link>
          <Link href="/vocabulary" className={linkState(pathname, '/vocabulary')} onClick={onNavigate}>
            Vocabulary
          </Link>
        </nav>
      </div>
    </aside>
  );
}
