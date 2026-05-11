'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';

export function AppShell({ children, isAdmin }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page text-ink md:grid md:grid-cols-[240px_1fr]">
      <div className="hidden md:block">
        <Sidebar isAdmin={isAdmin} />
      </div>

      <div className="md:hidden border-b border-border bg-surface px-4 py-3 flex items-center justify-between">
        <p className="font-bold">Languini</p>
        <button
          type="button"
          onClick={() => setMobileOpen(v => !v)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold"
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-b border-border">
          <Sidebar isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
        </div>
      )}

      <main className="min-w-0">{children}</main>
    </div>
  );
}
