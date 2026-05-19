import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ControlCenterPage } from './pages/ControlCenterPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/control-center"
          element={
            <ProtectedRoute requireSaasAdmin>
              <ErrorBoundary>
                <ControlCenterPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/admin/control-center" replace />} />
        <Route path="*" element={<Navigate to="/admin/control-center" replace />} />
      </Routes>
    </AuthProvider>
  );
}
