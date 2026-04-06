import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LandingScreen } from '../../screens/landing/LandingScreen';
import { StudentEntryRoute } from './StudentEntryRoute';

/**
 * `/` — public marketing landing for guests; same role redirects as before when signed in.
 */
export function RootRoute() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-ink-secondary text-lg">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return <LandingScreen />;
  }

  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (profile.role === 'teacher') {
    return <Navigate to="/teacher" replace />;
  }

  return <StudentEntryRoute />;
}
