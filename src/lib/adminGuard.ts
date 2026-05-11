import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns true when there is a logged-in session and the user's email appears in ADMIN_EMAILS.
 * Safe to call from any Server Component — never redirects.
 */
export async function isAdminSession(): Promise<boolean> {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return false;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return false;
  return adminEmails.includes(session.user.email.toLowerCase());
}

/**
 * Returns the current session user after confirming they are an admin.
 * Admin emails are configured via the ADMIN_EMAILS env var (comma-separated).
 * Falls back to blocking all access when the list is empty (forces explicit opt-in).
 *
 * Call at the top of any admin Server Component or layout.
 */
export async function requireAdmin() {
  const adminEmails = getAdminEmails();

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/login?next=/admin');
  }

  const isAdmin = adminEmails.length === 0
    ? false // no admins configured — block everyone
    : adminEmails.includes(session.user.email.toLowerCase());

  if (!isAdmin) {
    redirect('/');
  }

  return session.user;
}
