import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { desc } from 'drizzle-orm';
import { devOtpLog } from '@/db/schema';
import { db } from '@/lib/db';

export default async function DevOtpPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const rows = await db.select().from(devOtpLog).orderBy(desc(devOtpLog.id)).limit(50);

  return (
    <div className="min-h-screen bg-page text-ink p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">Dev OTP log</h1>
          <Link href="/" className="text-link text-sm font-semibold">
            Home
          </Link>
        </div>
        <p className="text-sm text-ink-secondary">
          Stubbed codes are stored here and printed to the server console. Disable in production.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-secondary">
                <th className="p-2">Time</th>
                <th className="p-2">Channel</th>
                <th className="p-2">To</th>
                <th className="p-2">OTP</th>
                <th className="p-2">Meta</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-ink-secondary text-center">
                    No rows yet. Trigger register / verify to generate codes.
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="p-2 whitespace-nowrap">{r.createdAt.toISOString()}</td>
                    <td className="p-2">{r.channel}</td>
                    <td className="p-2 font-mono text-xs">{r.destination}</td>
                    <td className="p-2 font-mono font-bold">{r.otp}</td>
                    <td className="p-2 text-ink-secondary">{r.meta ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
