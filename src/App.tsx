import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ControlCenterLayout } from './layouts/ControlCenterLayout';
import { OverviewPage } from './pages/control-center/OverviewPage';
import { SystemStatusPage } from './pages/control-center/SystemStatusPage';
import { TenantsPage } from './pages/control-center/TenantsPage';
import { AbosPage } from './pages/control-center/AbosPage';
import { LogsPage } from './pages/control-center/LogsPage';
import { BackupsPage } from './pages/control-center/BackupsPage';
import { SecurityPage } from './pages/control-center/SecurityPage';
import { SupportPage } from './pages/control-center/SupportPage';
import { SettingsPage } from './pages/control-center/SettingsPage';
import { CC_BASE } from './control-center/routes';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path={CC_BASE}
          element={
            <ProtectedRoute requireSaasAdmin>
              <ErrorBoundary>
                <ControlCenterLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="systemstatus" element={<SystemStatusPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="abos" element={<AbosPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="backups" element={<BackupsPage />} />
          <Route path="sicherheit" element={<SecurityPage />} />
          <Route path="support-zugriffe" element={<SupportPage />} />
          <Route path="einstellungen" element={<SettingsPage />} />
        </Route>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={CC_BASE} replace />} />
        <Route path="*" element={<Navigate to={CC_BASE} replace />} />
      </Routes>
    </AuthProvider>
  );
}
