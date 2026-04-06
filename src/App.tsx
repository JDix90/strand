import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurriculumProvider } from './contexts/CurriculumContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { RootRoute } from './components/auth/RootRoute';
import { AdminRoleBar } from './components/admin/AdminRoleBar';
import { useGameStore } from './store/gameStore';
import { SyncToastHost } from './components/ui/SyncToastHost';
import { UnitScopedOutlet } from './components/student/UnitScopedOutlet';
import { CurriculumV2FlatRedirect } from './components/curriculum/CurriculumV2FlatRedirect';

import { LoginScreen } from './screens/auth/LoginScreen';
import { SignUpScreen } from './screens/auth/SignUpScreen';
import {
  HomeScreen,
  SettingsScreen,
  LearnScreen,
  PracticeScreen,
  SpeedScreen,
  BossScreen,
  MemoryScreen,
  GridScreen,
  ResultsScreen,
  TeacherDashboard,
  ClassListScreen,
  ClassDetailScreen,
  StudentDetailScreen,
  AssignmentFormScreen,
  AnalyticsScreen,
  JoinClassScreen,
  AssignmentsScreen,
  StudentClassHome,
  StudentClassLayout,
  StudentHomeLayout,
  AdminDashboard,
  AdminUsersScreen,
  AdminClassesScreen,
  AdminSiteSettingsScreen,
  IntroHubScreen,
  AlphabetScreen,
  PhrasesScreen,
  IntroPlayScreen,
} from './lazyScreens';

function RouteFallback() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="text-ink-secondary text-lg">Loading...</div>
    </div>
  );
}

function AppInit() {
  const { init, initForUser } = useGameStore();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      initForUser(profile.id);
    } else {
      init();
    }
  }, [profile, init, initForUser]);

  return null;
}

function AppRoutes() {
  const { profile } = useAuth();
  return (
    <>
      <AdminRoleBar />
      <div className={profile?.role === 'admin' ? 'pt-24' : undefined}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />

          {/* Landing for guests; role-based redirect when signed in */}
          <Route path="/" element={<RootRoute />} />

          {/* Student / shared game routes */}
          <Route path="/home" element={<RequireAuth><StudentHomeLayout /></RequireAuth>}>
            <Route index element={<HomeScreen />} />
          </Route>
          <Route path="/settings" element={<RequireAuth><SettingsScreen /></RequireAuth>} />
          <Route path="/intro" element={<RequireAuth><IntroHubScreen /></RequireAuth>} />
          <Route path="/intro/alphabet" element={<RequireAuth><AlphabetScreen /></RequireAuth>} />
          <Route path="/intro/phrases" element={<RequireAuth><PhrasesScreen /></RequireAuth>} />
          <Route path="/intro/play" element={<RequireAuth><IntroPlayScreen /></RequireAuth>} />
          <Route
            path="/learn"
            element={
              <RequireAuth>
                <CurriculumV2FlatRedirect>
                  <LearnScreen />
                </CurriculumV2FlatRedirect>
              </RequireAuth>
            }
          />
          <Route
            path="/practice"
            element={
              <RequireAuth>
                <CurriculumV2FlatRedirect>
                  <PracticeScreen />
                </CurriculumV2FlatRedirect>
              </RequireAuth>
            }
          />
          <Route
            path="/speed"
            element={
              <RequireAuth>
                <CurriculumV2FlatRedirect>
                  <SpeedScreen />
                </CurriculumV2FlatRedirect>
              </RequireAuth>
            }
          />
          <Route
            path="/boss"
            element={
              <RequireAuth>
                <CurriculumV2FlatRedirect>
                  <BossScreen />
                </CurriculumV2FlatRedirect>
              </RequireAuth>
            }
          />
          <Route
            path="/memory"
            element={
              <RequireAuth>
                <CurriculumV2FlatRedirect>
                  <MemoryScreen />
                </CurriculumV2FlatRedirect>
              </RequireAuth>
            }
          />
          <Route
            path="/grid"
            element={
              <RequireAuth>
                <CurriculumV2FlatRedirect>
                  <GridScreen />
                </CurriculumV2FlatRedirect>
              </RequireAuth>
            }
          />
          <Route path="/results" element={<RequireAuth><ResultsScreen /></RequireAuth>} />
          <Route path="/join-class" element={<RequireAuth requiredRole="student"><JoinClassScreen /></RequireAuth>} />
          <Route path="/assignments" element={<RequireAuth requiredRole="student"><AssignmentsScreen /></RequireAuth>} />

          <Route
            path="/class/:classId"
            element={
              <RequireAuth requiredRole="student">
                <StudentClassLayout />
              </RequireAuth>
            }
          >
            <Route index element={<StudentClassHome />} />
            <Route path="unit/:unitId" element={<UnitScopedOutlet />}>
              <Route index element={<Navigate to="practice" replace />} />
              <Route path="learn" element={<LearnScreen />} />
              <Route path="practice" element={<PracticeScreen />} />
              <Route path="speed" element={<SpeedScreen />} />
              <Route path="boss" element={<BossScreen />} />
              <Route path="memory" element={<MemoryScreen />} />
              <Route path="grid" element={<GridScreen />} />
              <Route path="results" element={<ResultsScreen />} />
            </Route>
          </Route>

          {/* Teacher routes */}
          <Route path="/teacher" element={<RequireAuth requiredRole="teacher"><TeacherDashboard /></RequireAuth>} />
          <Route path="/teacher/classes" element={<RequireAuth requiredRole="teacher"><ClassListScreen /></RequireAuth>} />
          <Route path="/teacher/class/:classId" element={<RequireAuth requiredRole="teacher"><ClassDetailScreen /></RequireAuth>} />
          <Route path="/teacher/student/:studentId" element={<RequireAuth requiredRole="teacher"><StudentDetailScreen /></RequireAuth>} />
          <Route path="/teacher/assign/:classId" element={<RequireAuth requiredRole="teacher"><AssignmentFormScreen /></RequireAuth>} />
          <Route path="/teacher/analytics/:classId" element={<RequireAuth requiredRole="teacher"><AnalyticsScreen /></RequireAuth>} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAuth requiredRole="admin"><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth requiredRole="admin"><AdminUsersScreen /></RequireAuth>} />
          <Route path="/admin/classes" element={<RequireAuth requiredRole="admin"><AdminClassesScreen /></RequireAuth>} />
          <Route path="/admin/site" element={<RequireAuth requiredRole="admin"><AdminSiteSettingsScreen /></RequireAuth>} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurriculumProvider>
          <AppInit />
          <SyncToastHost />
          <Suspense fallback={<RouteFallback />}>
            <AppRoutes />
          </Suspense>
        </CurriculumProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
