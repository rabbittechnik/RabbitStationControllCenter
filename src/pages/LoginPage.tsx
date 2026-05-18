import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Rabbit } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/admin/control-center';

  const handleLogin = async (role?: string) => {
    setLoading(true);
    setError('');
    try {
      await login(role);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-4">
      <div className="glass-card w-full max-w-md p-8 shadow-glow">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-neon-cyan/10 text-neon-cyan">
            <Rabbit className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-semibold text-white">RabbitStation Control Center</h1>
          <p className="mt-1 text-sm text-slate-500">Nur für Plattform-Inhaber & Superadmins</p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-neon-red/10 px-3 py-2 text-sm text-neon-red">{error}</p>
        )}

        <div className="space-y-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleLogin('saas_owner')}
            className="w-full rounded-lg bg-neon-cyan/20 py-3 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-50"
          >
            Als Plattform-Owner anmelden (Demo)
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleLogin('saas_superadmin')}
            className="w-full rounded-lg border border-white/10 py-3 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
          >
            Als Superadmin anmelden (Demo)
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleLogin('tenant_owner')}
            className="w-full rounded-lg border border-neon-orange/20 py-2 text-xs text-neon-orange hover:bg-neon-orange/10 disabled:opacity-50"
          >
            Test: Tenant-Owner (Zugriff verweigert)
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-600">
          v2.3.0 · Build 5621 · EU-Central · Demo-Umgebung
        </p>
      </div>
    </div>
  );
}
