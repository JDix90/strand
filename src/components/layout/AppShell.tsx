import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page text-ink md:grid md:grid-cols-[240px_1fr]">
      <div className="hidden md:block">
        <Sidebar />
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
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      )}

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
