import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import Auth from './components/Auth';
import {
  ApplicationsPage,
  AuditPage,
  DashboardPage,
  DrivesPage,
  NotificationsPage,
  PlacementTeamPage,
  RecruitersPage,
  ReportsPage,
  SettingsPage,
  StudentsPage,
} from './pages';
import './App.css';

function sessionFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('rportal_session'));
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (!theme || theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

function Protected({ session, children }) {
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [session, setSession] = useState(sessionFromStorage);

  const theme = session?.user?.preferences?.theme || localStorage.getItem('rportal_theme') || 'system';
  const tableDensity = session?.user?.preferences?.table_density || localStorage.getItem('rportal_density') || 'comfortable';

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('rportal_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-density', tableDensity);
    localStorage.setItem('rportal_density', tableDensity);
  }, [tableDensity]);

  const onAuthenticated = (next) => {
    localStorage.setItem('rportal_token', next.access_token);
    localStorage.setItem('rportal_session', JSON.stringify(next));
    setSession(next);
    const userTheme = next?.user?.preferences?.theme || 'system';
    applyTheme(userTheme);
  };

  const onUserUpdated = (updatedUser) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        user: { ...prev.user, ...updatedUser },
      };
      localStorage.setItem('rportal_session', JSON.stringify(updated));
      return updated;
    });
    if (updatedUser?.preferences?.theme) {
      applyTheme(updatedUser.preferences.theme);
    }
  };

  const signOut = () => {
    localStorage.removeItem('rportal_token');
    localStorage.removeItem('rportal_session');
    setSession(null);
  };

  const defaultPage = session?.user?.preferences?.default_page || '/dashboard';

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to={defaultPage} replace /> : <Auth onAuthenticated={onAuthenticated} />}
      />
      <Route
        path="/register"
        element={session ? <Navigate to={defaultPage} replace /> : <Auth onAuthenticated={onAuthenticated} />}
      />
      <Route
        element={
          <Protected session={session}>
            <AppShell user={session?.user} onSignOut={signOut} onUserUpdated={onUserUpdated} />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/placement-team" element={<PlacementTeamPage />} />
        <Route path="/recruiters" element={<RecruitersPage />} />
        <Route path="/drives" element={<DrivesPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={session ? defaultPage : '/login'} replace />} />
    </Routes>
  );
}
