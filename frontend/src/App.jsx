import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx';
import VacancyPage from './pages/VacancyPage.jsx';
import ApplicationsPage from './pages/ApplicationsPage.jsx';
import InterviewsPage from './pages/InterviewsPage.jsx';
import { useAuth } from './hooks/useAuth.jsx';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? '/projects' : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/projects"
          element={(
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/projects/:id"
          element={(
            <ProtectedRoute>
              <ProjectDetailsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/vacancies/:id"
          element={(
            <ProtectedRoute>
              <VacancyPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/applications"
          element={(
            <ProtectedRoute roles={['candidate']}>
              <ApplicationsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/interviews"
          element={(
            <ProtectedRoute roles={['interviewer']}>
              <InterviewsPage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
