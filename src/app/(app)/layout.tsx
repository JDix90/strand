import { AppShell } from '@/components/layout/AppShell';
import { isAdminSession } from '@/lib/adminGuard';

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isAdminSession();
  return <AppShell isAdmin={isAdmin}>{children}</AppShell>;
}
