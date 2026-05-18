import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({
  children,
  requireSaasAdmin = false,
}: {
  children: React.ReactNode;
  requireSaasAdmin?: boolean;
}) {
  const { user, loading, isSaasAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSaasAdmin && !isSaasAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
