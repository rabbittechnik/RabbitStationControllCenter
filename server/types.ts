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

export interface SystemLog {
  id: number;
  tenant_id: string | null;
  severity: string;
  category: string;
  action: string;
  message: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  status: string;
  plan: string;
  trial_end: string | null;
  employees: number;
  last_activity_minutes: number;
  locked: number;
}

export interface SubscriptionSummary {
  activeTenants: number;
  activeTenantsTrend: string;
  trials: number;
  trialsTrend: string;
  activeSubscriptions: number;
  activeSubscriptionsTrend: string;
  monthlyRevenue: number;
  monthlyRevenueCurrency: string;
  monthlyRevenueTrend: string;
}

export interface SecuritySummary {
  failedLogins24h: number;
  activeSupportSessions: number;
  roleChanges24h: number;
  blockedTenants?: number;
  suspiciousApiRequests?: number;
  lockedUsers?: number;
}

export interface BackupStatus {
  lastBackupAt: string;
  lastBackupStatus: string;
  nextBackupAt: string;
  sizeBytes: number;
  configured?: boolean;
  message?: string;
}

export interface SystemInfo {
  environment: string;
  region: string;
  version: string;
  build: string;
  serverTime: string;
  uptime: string;
  systemLoadPercent: number;
  nodeVersion: string;
  databaseVersion: string;
  lastDeploy: string;
  commitHash: string;
}

export interface ChartPoint {
  label: string;
  responseTimeMs: number;
  errorRate: number;
  requests: number;
}

export interface OverviewData {
  health: HealthResponse;
  logs: SystemLog[];
  tenants: Tenant[];
  subscriptions: SubscriptionSummary;
  security: SecuritySummary;
  backups: BackupStatus;
  systemInfo: SystemInfo;
  charts: ChartPoint[];
}

export type DataSourceKind = 'live' | 'demo';

export interface ControlCenterMeta {
  source: DataSourceKind;
  message?: string;
  apiConfigured: boolean;
  lastError?: string;
}
