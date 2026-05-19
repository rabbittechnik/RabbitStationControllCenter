export type HealthStatus = 'ok' | 'warning' | 'error' | 'unknown';

export interface HealthResponse {
  overallStatus: HealthStatus;
  checkedAt: string;
  /** Freitext von der Haupt-App, wenn uptime kein Prozent-Objekt ist */
  uptimeLabel?: string;
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
  slug?: string;
  operator?: string;
  status: string;
  plan: string;
  trial_end: string | null;
  trial_days_left: number | null;
  employees: number;
  station_count: number;
  last_activity_minutes: number;
  locked: number;
  current_period_start?: string | null;
  current_period_end?: string | null;
  blocked_reason?: string | null;
}

export type SubscriptionPlanId = 'starter' | 'pro' | 'multi_station';

export type SubscriptionStatusId =
  | 'trial'
  | 'active'
  | 'expired'
  | 'past_due'
  | 'cancelled'
  | 'blocked';

export interface TenantSubscriptionPatch {
  plan?: SubscriptionPlanId | string;
  subscription_status?: SubscriptionStatusId | string;
  trial_end?: string;
  current_period_start?: string;
  current_period_end?: string;
  blocked_reason?: string | null;
  note?: string;
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

export interface SubscriptionSummary {
  activeTenants: number;
  activeTenantsTrend: string;
  activeTrials: number;
  trialsExpiringToday: number;
  expiredTrials: number;
  trials: number;
  trialsTrend: string;
  activeSubscriptions: number;
  activeSubscriptionsTrend: string;
  starterCustomers: number;
  proCustomers: number;
  multiStationCustomers: number;
  openPayments: number;
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

export type DataSourceKind = 'live' | 'error';

export interface ControlCenterMeta {
  source: DataSourceKind;
  message?: string;
  apiConfigured: boolean;
  apiUrlSet?: boolean;
  tokenSet?: boolean;
  lastError?: string;
}

export interface ControlCenterOverviewResponse extends OverviewData {
  meta: ControlCenterMeta;
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

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
