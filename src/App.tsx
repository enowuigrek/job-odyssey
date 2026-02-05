import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import {
  DashboardPage,
  ApplicationsPage,
  InterviewsPage,
  CVPage,
  QuestionsPage,
  StoriesPage,
  SettingsPage,
} from './pages';

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="interviews" element={<InterviewsPage />} />
            <Route path="cv" element={<CVPage />} />
            <Route path="questions" element={<QuestionsPage />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
        </HashRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
