import { lazy } from 'react';

/** Route-level code splitting for game, teacher, student, and admin screens. */

export const HomeScreen = lazy(() =>
  import('./screens/home/HomeScreen').then(m => ({ default: m.HomeScreen }))
);
export const SettingsScreen = lazy(() =>
  import('./screens/home/SettingsScreen').then(m => ({ default: m.SettingsScreen }))
);
export const LearnScreen = lazy(() =>
  import('./screens/learn/LearnScreen').then(m => ({ default: m.LearnScreen }))
);
export const PracticeScreen = lazy(() =>
  import('./screens/practice/PracticeScreen').then(m => ({ default: m.PracticeScreen }))
);
export const SpeedScreen = lazy(() =>
  import('./screens/speed/SpeedScreen').then(m => ({ default: m.SpeedScreen }))
);
export const BossScreen = lazy(() =>
  import('./screens/boss/BossScreen').then(m => ({ default: m.BossScreen }))
);
export const MemoryScreen = lazy(() =>
  import('./screens/memory/MemoryScreen').then(m => ({ default: m.MemoryScreen }))
);
export const GridScreen = lazy(() =>
  import('./screens/grid/GridScreen').then(m => ({ default: m.GridScreen }))
);
export const ResultsScreen = lazy(() =>
  import('./screens/results/ResultsScreen').then(m => ({ default: m.ResultsScreen }))
);

export const TeacherDashboard = lazy(() =>
  import('./screens/teacher/TeacherDashboard').then(m => ({ default: m.TeacherDashboard }))
);
export const ClassListScreen = lazy(() =>
  import('./screens/teacher/ClassListScreen').then(m => ({ default: m.ClassListScreen }))
);
export const ClassDetailScreen = lazy(() =>
  import('./screens/teacher/ClassDetailScreen').then(m => ({ default: m.ClassDetailScreen }))
);
export const StudentDetailScreen = lazy(() =>
  import('./screens/teacher/StudentDetailScreen').then(m => ({ default: m.StudentDetailScreen }))
);
export const AssignmentFormScreen = lazy(() =>
  import('./screens/teacher/AssignmentFormScreen').then(m => ({ default: m.AssignmentFormScreen }))
);
export const AnalyticsScreen = lazy(() =>
  import('./screens/teacher/AnalyticsScreen').then(m => ({ default: m.AnalyticsScreen }))
);

export const JoinClassScreen = lazy(() =>
  import('./screens/student/JoinClassScreen').then(m => ({ default: m.JoinClassScreen }))
);
export const AssignmentsScreen = lazy(() =>
  import('./screens/student/AssignmentsScreen').then(m => ({ default: m.AssignmentsScreen }))
);
export const StudentClassHome = lazy(() =>
  import('./screens/student/StudentClassHome').then(m => ({ default: m.StudentClassHome }))
);
export const VocabularyHubScreen = lazy(() =>
  import('./screens/student/VocabularyHubScreen').then(m => ({ default: m.VocabularyHubScreen }))
);

export const StudentClassLayout = lazy(() =>
  import('./layouts/StudentClassLayout').then(m => ({ default: m.StudentClassLayout }))
);
export const StudentHomeLayout = lazy(() =>
  import('./layouts/StudentHomeLayout').then(m => ({ default: m.StudentHomeLayout }))
);
export const StudentCalendarScreen = lazy(() =>
  import('./screens/student/StudentCalendarScreen').then(m => ({ default: m.StudentCalendarScreen }))
);
export const TeacherCalendarScreen = lazy(() =>
  import('./screens/teacher/TeacherCalendarScreen').then(m => ({ default: m.TeacherCalendarScreen }))
);

export const AdminDashboard = lazy(() =>
  import('./screens/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);
export const AdminUsersScreen = lazy(() =>
  import('./screens/admin/AdminUsersScreen').then(m => ({ default: m.AdminUsersScreen }))
);
export const AdminClassesScreen = lazy(() =>
  import('./screens/admin/AdminClassesScreen').then(m => ({ default: m.AdminClassesScreen }))
);
export const AdminSiteSettingsScreen = lazy(() =>
  import('./screens/admin/AdminSiteSettingsScreen').then(m => ({ default: m.AdminSiteSettingsScreen }))
);

export const IntroHubScreen = lazy(() =>
  import('./screens/intro/IntroHubScreen').then(m => ({ default: m.IntroHubScreen }))
);
export const AlphabetScreen = lazy(() =>
  import('./screens/intro/AlphabetScreen').then(m => ({ default: m.AlphabetScreen }))
);
export const PhrasesScreen = lazy(() =>
  import('./screens/intro/PhrasesScreen').then(m => ({ default: m.PhrasesScreen }))
);
export const IntroPlayScreen = lazy(() =>
  import('./screens/intro/IntroPlayScreen').then(m => ({ default: m.IntroPlayScreen }))
);
