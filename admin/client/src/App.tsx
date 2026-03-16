import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AdminLayout from './components/AdminLayout';
import LoginPage from './components/LoginPage';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectEditor from './pages/ProjectEditor';
import JobsList from './pages/JobsList';
import JobEditor from './pages/JobEditor';
import ApplicationsList from './pages/ApplicationsList';
import ApplicationDetail from './pages/ApplicationDetail';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--steel)' }}>Loading...</div>;
  if (!user) return <LoginPage />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/new" element={<ProjectEditor />} />
            <Route path="projects/:id" element={<ProjectEditor />} />
            <Route path="jobs" element={<JobsList />} />
            <Route path="jobs/new" element={<JobEditor />} />
            <Route path="jobs/:id" element={<JobEditor />} />
            <Route path="applications" element={<ApplicationsList />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
