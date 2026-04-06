import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessRoute } from '../../lib/authRoles';
import type { UserRole } from '../../types';

interface Props {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function RequireAuth({ children, requiredRole }: Props) {
  const { profile, loading, effectiveRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-ink-secondary text-lg">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !canAccessRoute(profile, requiredRole, effectiveRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
