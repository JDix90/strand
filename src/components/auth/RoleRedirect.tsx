import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StudentEntryRoute } from './StudentEntryRoute';

export function RoleRedirect() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (profile.role === 'teacher') {
    return <Navigate to="/teacher" replace />;
  }

  return <StudentEntryRoute />;
}
