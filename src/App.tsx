import { useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { ProfileBasicsProvider } from './contexts/ProfileBasicsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { CookieConsentBanner } from './components/layout/CookieConsentBanner';
import { PasswordRecoveryModal, PageLoading } from './components/ui';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { ContactPage } from './pages/ContactPage';

// Strony zalogowanej appki ładowane leniwie — trzymają @react-pdf/renderer, docx
// i pdfjs-dist, które inaczej trafiały do głównego chunka i pęczniały go (>2MB)
// niezależnie od tego, czy user w ogóle odwiedził stronę z generowaniem CV.
const CVPrintPage = lazy(() => import('./pages/CVPrintPage').then(m => ({ default: m.CVPrintPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage').then(m => ({ default: m.ApplicationsPage })));
const InterviewsPage = lazy(() => import('./pages/InterviewsPage').then(m => ({ default: m.InterviewsPage })));
const CVPage = lazy(() => import('./pages/CVPage').then(m => ({ default: m.CVPage })));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage').then(m => ({ default: m.QuestionsPage })));
const StoriesPage = lazy(() => import('./pages/StoriesPage').then(m => ({ default: m.StoriesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LinksPage = lazy(() => import('./pages/LinksPage').then(m => ({ default: m.LinksPage })));
const CVGeneratorPage = lazy(() => import('./pages/CVGeneratorPage').then(m => ({ default: m.CVGeneratorPage })));
const CVEditorPage = lazy(() => import('./pages/CVEditorPage').then(m => ({ default: m.CVEditorPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ImportCvPage = lazy(() => import('./pages/ImportCvPage').then(m => ({ default: m.ImportCvPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));

function AuthenticatedApp() {
  return (
    <UserSettingsProvider>
      <ProfileBasicsProvider>
        <AppProvider>
          <Routes>
            {/* Bare print page — no layout, no nav */}
            <Route path="cv-print" element={<Suspense fallback={<PageLoading />}><CVPrintPage /></Suspense>} />
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="interviews" element={<InterviewsPage />} />
              <Route path="cv-generator" element={<CVGeneratorPage />} />
              <Route path="cv-editor" element={<CVEditorPage />} />
              <Route path="cv" element={<CVPage />} />
              <Route path="links" element={<LinksPage />} />
              <Route path="profil" element={<Navigate to="/profil/kontakt" replace />} />
              <Route path="profil/importuj-cv" element={<ImportCvPage />} />
              <Route path="profil/:section" element={<ProfilePage />} />
              <Route path="questions" element={<QuestionsPage />} />
              <Route path="stories" element={<StoriesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AppProvider>
      </ProfileBasicsProvider>
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
      {/* Formularz nowego hasła po wejściu z linku resetującego (event PASSWORD_RECOVERY) */}
      <PasswordRecoveryModal />
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
