import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Auth Pages
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';

// App Feature Pages
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CoursesPage } from '../features/courses/pages/CoursesPage';
import { CoursePlayerPage } from '../features/courses/pages/CoursePlayerPage';
import { TimerPage } from '../features/timer/pages/TimerPage';
import { GroupsPage } from '../features/groups/pages/GroupsPage';
import { LeaderboardPage } from '../features/leaderboard/pages/LeaderboardPage';
import { InsightsPage } from '../features/insights/pages/InsightsPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Protected Application Routes inside App Shell Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CoursePlayerPage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
