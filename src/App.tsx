import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { CVPrintPage } from './pages/CVPrintPage';
import {
  DashboardPage,
  ApplicationsPage,
  InterviewsPage,
  CVPage,
  QuestionsPage,
  StoriesPage,
  SettingsPage,
  LinksPage,
  CVGeneratorPage,
  CVEditorPage,
  ProfilePage,
} from './pages';

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-slate-400">Ładowanie...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/* Bare print page — no layout, no nav */}
          <Route path="cv-print" element={<CVPrintPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="interviews" element={<InterviewsPage />} />
            <Route path="cv-generator" element={<CVGeneratorPage />} />
            <Route path="cv-editor" element={<CVEditorPage />} />
            <Route path="cv" element={<CVPage />} />
            <Route path="links" element={<LinksPage />} />
            <Route path="profil" element={<ProfilePage />} />
            <Route path="questions" element={<QuestionsPage />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
