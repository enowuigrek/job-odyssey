import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { CookieConsentBanner } from './components/layout/CookieConsentBanner';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { CVPrintPage } from './pages/CVPrintPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { ContactPage } from './pages/ContactPage';
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
  AdminPage,
} from './pages';

function AuthenticatedApp() {
  return (
    <UserSettingsProvider>
      <AppProvider>
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
            <Route path="profil" element={<Navigate to="/profil/kontakt" replace />} />
            <Route path="profil/:section" element={<ProfilePage />} />
            <Route path="questions" element={<QuestionsPage />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppProvider>
    </UserSettingsProvider>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-slate-400">Ładowanie...</div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        {/* Strony prawne — dostępne niezależnie od stanu logowania */}
        <Route path="regulamin" element={<TermsPage />} />
        <Route path="polityka-prywatnosci" element={<PrivacyPolicyPage />} />
        <Route path="polityka-cookies" element={<CookiePolicyPage />} />
        <Route path="kontakt" element={<ContactPage />} />

        <Route
          path="/*"
          element={
            user ? (
              <AuthenticatedApp />
            ) : showAuth ? (
              <LoginPage initialMode={authMode} onBack={() => setShowAuth(false)} />
            ) : (
              <LandingPage
                onLoginClick={() => { setAuthMode('login'); setShowAuth(true); }}
                onRegisterClick={() => { setAuthMode('register'); setShowAuth(true); }}
              />
            )
          }
        />
      </Routes>
      <CookieConsentBanner />
    </HashRouter>
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
