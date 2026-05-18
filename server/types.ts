export type SaasRole = 'saas_owner' | 'saas_superadmin';

export type UserRole =
  | SaasRole
  | 'tenant_owner'
  | 'station_admin'
  | 'stationsleiter'
  | 'teamleiter'
  | 'mitarbeiter'
  | 'tablet'
  | 'steuerberater';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type HealthStatus = 'ok' | 'warning' | 'error';

export interface HealthResponse {
  overallStatus: HealthStatus;
  checkedAt: string;
  app: { status: HealthStatus; message: string };
  api: { status: HealthStatus; responseTimeMs: number };
  database: { status: HealthStatus; connections: number };
  mail: { status: HealthStatus; deliveryRate: number };
  payments: { status: HealthStatus; openCases: number };
  backups: {
    status: HealthStatus;
    lastBackupAt: string;
    nextBackupAt: string;
  };
  storage: {
    status: HealthStatus;
    usedPercent: number;
    usedGb: number;
    totalGb: number;
  };
  uptime: { status: HealthStatus; percent30Days: number };
  warnings: string[];
  errors: string[];
}
