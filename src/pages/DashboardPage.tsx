import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 p-4 text-center">
      <h1 className="text-xl text-white">Standard-Dashboard</h1>
      <p className="mt-2 text-slate-400">
        Angemeldet als {user?.name} ({user?.role})
      </p>
      <p className="mt-4 max-w-md text-sm text-slate-500">
        Kein Zugriff auf das Control Center. Nur saas_owner und saas_superadmin sind berechtigt.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          to="/login"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300"
        >
          Andere Rolle
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-300"
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}
